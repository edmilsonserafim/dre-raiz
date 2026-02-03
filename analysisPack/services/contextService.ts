import type { AnalysisContext, Transaction, SchoolKPIs, CurrencyCode } from "../../types";
import { getMockContext } from "../mock/mockContext";
import { getAllTransactions } from "../../services/supabaseService";
import { buildDatasets, buildKPIs } from "./dataBuilder";

export interface FetchContextParams {
  periodId?: string;
  scopeId?: string;
  marca?: string;
  filial?: string;
  scenario?: string;
  startDate?: string;
  endDate?: string;
  currency?: CurrencyCode;
  org_name?: string;
}

/**
 * Busca o contexto de análise real do Supabase
 * ou retorna mock se configurado
 */
export async function fetchAnalysisContext(
  params?: FetchContextParams
): Promise<AnalysisContext> {
  // Se modo mock ativado, retornar mock
  if (process.env.AI_REPORT_USE_MOCK === "1" || import.meta.env.VITE_AI_REPORT_USE_MOCK === "1") {
    console.log("📦 Usando contexto MOCK (AI_REPORT_USE_MOCK=1)");
    return getMockContext();
  }

  try {
    console.log("🔄 Buscando transações do Supabase...");

    // 1. Buscar todas as transações do Supabase
    const allTransactions = await getAllTransactions();

    if (!allTransactions || allTransactions.length === 0) {
      console.warn("⚠️ Nenhuma transação encontrada, usando mock como fallback");
      return getMockContext();
    }

    console.log(`✅ ${allTransactions.length} transações carregadas`);

    // 2. Aplicar filtros se fornecidos
    let filteredTransactions = allTransactions;

    if (params?.marca) {
      filteredTransactions = filteredTransactions.filter(t => t.marca === params.marca);
      console.log(`🔍 Filtro [marca=${params.marca}]: ${filteredTransactions.length} transações`);
    }

    if (params?.filial) {
      filteredTransactions = filteredTransactions.filter(t => t.filial === params.filial);
      console.log(`🔍 Filtro [filial=${params.filial}]: ${filteredTransactions.length} transações`);
    }

    if (params?.scenario) {
      filteredTransactions = filteredTransactions.filter(t => t.scenario === params.scenario);
      console.log(`🔍 Filtro [scenario=${params.scenario}]: ${filteredTransactions.length} transações`);
    }

    if (params?.startDate) {
      filteredTransactions = filteredTransactions.filter(t => t.date >= params.startDate!);
      console.log(`🔍 Filtro [startDate=${params.startDate}]: ${filteredTransactions.length} transações`);
    }

    if (params?.endDate) {
      filteredTransactions = filteredTransactions.filter(t => t.date <= params.endDate!);
      console.log(`🔍 Filtro [endDate=${params.endDate}]: ${filteredTransactions.length} transações`);
    }

    // 3. Calcular KPIs a partir das transações
    console.log("📊 Calculando KPIs...");
    const schoolKPIs = calculateSchoolKPIs(filteredTransactions);

    // 4. Construir datasets (R12, waterfall, pareto, heatmap, table)
    console.log("📈 Construindo datasets...");
    const datasets = buildDatasets(filteredTransactions);

    // 5. Construir lista de KPIs formatados
    const kpis = buildKPIs(schoolKPIs, filteredTransactions);

    // 6. Determinar labels de período e escopo
    const period_label = params?.periodId || detectPeriodLabel(filteredTransactions);
    const scope_label = params?.scopeId || detectScopeLabel(params);

    // 7. Construir contexto
    const context: AnalysisContext = {
      org_name: params?.org_name || "RAIZ EDUCAÇÃO",
      currency: params?.currency || "BRL",
      period_label,
      scope_label,
      kpis,
      datasets,
      analysis_rules: {
        prefer_pareto: true,
        highlight_threshold_currency: 100000,
        highlight_threshold_percent: 0.03,
      },
    };

    console.log("✅ Contexto de análise construído com sucesso");
    return context;

  } catch (error) {
    console.error("❌ Erro ao buscar contexto de análise:", error);
    console.warn("⚠️ Fallback para contexto MOCK");
    return getMockContext();
  }
}

/**
 * Calcula SchoolKPIs a partir das transações
 */
function calculateSchoolKPIs(transactions: Transaction[]): SchoolKPIs {
  const totalRevenue = transactions
    .filter(t => t.type === 'REVENUE')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalFixedCosts = transactions
    .filter(t => t.type === 'FIXED_COST')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalVariableCosts = transactions
    .filter(t => t.type === 'VARIABLE_COST')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const sgaCosts = transactions
    .filter(t => t.type === 'SGA')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const rateioCosts = transactions
    .filter(t => t.type === 'RATEIO')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalCosts = totalFixedCosts + totalVariableCosts + sgaCosts + rateioCosts;
  const ebitda = totalRevenue - totalCosts;
  const netMargin = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;

  // Estimativa de alunos ativos (você pode ajustar essa lógica)
  const activeStudents = 11450; // TODO: buscar de outra fonte ou calcular

  const costPerStudent = activeStudents > 0 ? totalCosts / activeStudents : 0;
  const revenuePerStudent = activeStudents > 0 ? totalRevenue / activeStudents : 0;

  // KPIs calculados
  const targetEbitda = totalRevenue * 0.20; // 20% de margem target
  const breakEvenPoint = totalFixedCosts / (netMargin / 100 || 0.01);
  const marginOfSafety = totalRevenue > breakEvenPoint ? ((totalRevenue - breakEvenPoint) / totalRevenue) * 100 : 0;
  const costReductionNeeded = ebitda < targetEbitda ? targetEbitda - ebitda : 0;

  return {
    totalRevenue,
    totalFixedCosts,
    totalVariableCosts,
    sgaCosts,
    ebitda,
    netMargin,
    costPerStudent,
    revenuePerStudent,
    activeStudents,
    breakEvenPoint,
    defaultRate: 4.2, // TODO: calcular ou buscar
    targetEbitda,
    costReductionNeeded,
    marginOfSafety,
    churnRate: 3.5, // TODO: calcular ou buscar
    waterPerStudent: 0, // TODO: calcular ou buscar
    energyPerClassroom: 0, // TODO: calcular ou buscar
    consumptionMaterialPerStudent: 0, // TODO: calcular ou buscar
    eventsPerStudent: 0, // TODO: calcular ou buscar
  };
}

/**
 * Detecta o label de período baseado nas transações
 */
function detectPeriodLabel(transactions: Transaction[]): string {
  if (!transactions.length) return "Período não especificado";

  const dates = transactions.map(t => new Date(t.date));
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  if (minDate.getFullYear() === maxDate.getFullYear()) {
    if (minDate.getMonth() === maxDate.getMonth()) {
      // Mesmo mês
      return `${monthNames[minDate.getMonth()]}/${minDate.getFullYear()}`;
    } else {
      // Múltiplos meses do mesmo ano
      return `YTD ${monthNames[maxDate.getMonth()]}/${maxDate.getFullYear()}`;
    }
  } else {
    // Múltiplos anos
    return `${monthNames[minDate.getMonth()]}/${minDate.getFullYear()} - ${monthNames[maxDate.getMonth()]}/${maxDate.getFullYear()}`;
  }
}

/**
 * Detecta o label de escopo baseado nos filtros
 */
function detectScopeLabel(params?: FetchContextParams): string {
  if (!params) return "Consolidado";

  const parts: string[] = [];

  if (params.marca) parts.push(`Marca: ${params.marca}`);
  if (params.filial) parts.push(`Filial: ${params.filial}`);
  if (params.scenario) parts.push(`Cenário: ${params.scenario}`);

  return parts.length > 0 ? parts.join(" | ") : "Consolidado";
}
