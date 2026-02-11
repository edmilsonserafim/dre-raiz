import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ComposedChart, Line, Legend, ReferenceLine } from 'recharts';
import { Target, Users, ArrowUpRight, ArrowDownRight, ArrowRight, GraduationCap, CalendarDays, Droplets, Zap, Box, PartyPopper, Scissors, ShieldCheck, AlertCircle, PieChart, TrendingDown, X, TrendingUp, Flag, Building2, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { SchoolKPIs, Transaction } from '../types';
import { BRANCHES, CATEGORIES } from '../constants';
import { getReceitaLiquidaDRE, getDRESummary } from '../services/supabaseService';

interface DashboardProps {
  kpis: SchoolKPIs;
  transactions: Transaction[];
  selectedMarca: string[];
  selectedFilial: string[];
  uniqueBrands: string[];
  availableBranches: string[];
  onMarcaChange: (brands: string[]) => void;
  onFilialChange: (branches: string[]) => void;
}

export interface MonthRange {
  start: number;
  end: number;
}

// Tags01 que compõem a Receita Líquida conforme DRE
const RECEITA_LIQUIDA_TAGS = [
  'Tributos',
  'Devoluções & Cancelamentos',
  'Integral',
  'Material Didático',
  'Receita De Mensalidade',
  'Receitas Não Operacionais',
  'Receitas Extras'
];

const Dashboard: React.FC<DashboardProps> = ({
  kpis,
  transactions,
  selectedMarca,
  selectedFilial,
  uniqueBrands,
  availableBranches,
  onMarcaChange,
  onFilialChange
}) => {
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'ebitda' | 'margin'>('ebitda');
  const [selectedMonthStart, setSelectedMonthStart] = useState<number>(0);
  const [selectedMonthEnd, setSelectedMonthEnd] = useState<number>(11);
  const [comparisonMode, setComparisonMode] = useState<'budget' | 'prevYear'>('budget');
  const [sortBranchesAZ, setSortBranchesAZ] = useState(false);
  const [showVariationDetail, setShowVariationDetail] = useState(false);
  const [showAlertsDetail, setShowAlertsDetail] = useState(false);
  const [showRevenueBreakdown, setShowRevenueBreakdown] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false); // Lazy render do Heatmap

  // Receita Líquida calculada usando a mesma lógica da DRE (tag0 "01.")
  const [receitaLiquidaReal, setReceitaLiquidaReal] = useState<number>(0);
  const [receitaLiquidaComparison, setReceitaLiquidaComparison] = useState<number>(0);
  const [isLoadingReceita, setIsLoadingReceita] = useState(false);

  // Breakdown detalhado por tag01 para o modal (vem da DRE)
  const [receitaBreakdown, setReceitaBreakdown] = useState<Array<{
    tag01: string;
    real: number;
    orcado: number;
    a1: number;
    txCount: number;
    tag02s: Array<{
      tag02: string;
      real: number;
      orcado: number;
      a1: number;
      txCount: number;
    }>;
  }>>([]);

  // Estado para controlar quais tag01s estão expandidas
  const [expandedTag01s, setExpandedTag01s] = useState<Set<string>>(new Set());

  // Estado para ordenação
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Estado para dados da DRE (para Heatmap)
  const [dreSummaryData, setDreSummaryData] = useState<Array<{
    scenario: string;
    conta_contabil: string;
    year_month: string;
    tag0: string;
    tag01: string;
    tipo: string;
    total_amount: number;
    tx_count: number;
  }>>([]);
  const [isLoadingDRE, setIsLoadingDRE] = useState(false);

  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  // Expor o range de meses e modo de comparação via eventos para o DashboardEnhanced
  useEffect(() => {
    const dashboardEl = document.getElementById('dashboard-wrapper');
    if (dashboardEl) {
      dashboardEl.setAttribute('data-month-start', selectedMonthStart.toString());
      dashboardEl.setAttribute('data-month-end', selectedMonthEnd.toString());
      // Disparar evento customizado
      const event = new CustomEvent('monthRangeChange', {
        detail: { start: selectedMonthStart, end: selectedMonthEnd }
      });
      window.dispatchEvent(event);
    }
  }, [selectedMonthStart, selectedMonthEnd]);

  // Expor o modo de comparação
  useEffect(() => {
    const event = new CustomEvent('comparisonModeChange', {
      detail: { mode: comparisonMode }
    });
    window.dispatchEvent(event);
  }, [comparisonMode]);

  // Buscar dados da DRE para o Heatmap
  useEffect(() => {
    const fetchDREData = async () => {
      setIsLoadingDRE(true);
      try {
        const year = new Date().getFullYear();
        const monthFrom = `${year}-01`;
        const monthTo = `${year}-12`;

        const summary = await getDRESummary({
          monthFrom,
          monthTo,
          marcas: selectedMarca.length > 0 ? selectedMarca : undefined,
          nomeFiliais: selectedFilial.length > 0 ? selectedFilial : undefined,
        });

        setDreSummaryData(summary);
        console.log(`✅ Dashboard Heatmap: ${summary.length} linhas DRE carregadas`);

        // Debug: Mostrar tag0s e tipos únicos
        const uniqueTag0s = Array.from(new Set(summary.map(row => row.tag0))).sort();
        const uniqueTipos = Array.from(new Set(summary.map(row => row.tipo))).sort();
        console.log('🔍 Tag0s únicos:', uniqueTag0s);
        console.log('🔍 Tipos únicos:', uniqueTipos);
      } catch (error) {
        console.error('❌ Erro ao carregar dados DRE para Heatmap:', error);
        setDreSummaryData([]);
      } finally {
        setIsLoadingDRE(false);
      }
    };

    fetchDREData();
  }, [selectedMarca, selectedFilial]);

  // Buscar Receita Líquida usando a mesma lógica da DRE (tag0 "01.")
  useEffect(() => {
    const fetchReceitaLiquida = async () => {
      setIsLoadingReceita(true);
      try {
        // Construir monthFrom e monthTo baseado no range selecionado
        const year = new Date().getFullYear();
        const monthFrom = `${year}-${String(selectedMonthStart + 1).padStart(2, '0')}`;
        const monthTo = `${year}-${String(selectedMonthEnd + 1).padStart(2, '0')}`;

        // Buscar Receita Real
        const receitaReal = await getReceitaLiquidaDRE({
          monthFrom,
          monthTo,
          marcas: selectedMarca.length > 0 ? selectedMarca : undefined,
          nomeFiliais: selectedFilial.length > 0 ? selectedFilial : undefined,
          scenario: 'Real'
        });

        // Buscar Receita de Comparação (Orçado ou A-1)
        const scenarioComparacao = comparisonMode === 'budget' ? 'Orçado' : 'A-1';
        const receitaComp = await getReceitaLiquidaDRE({
          monthFrom,
          monthTo,
          marcas: selectedMarca.length > 0 ? selectedMarca : undefined,
          nomeFiliais: selectedFilial.length > 0 ? selectedFilial : undefined,
          scenario: scenarioComparacao
        });

        setReceitaLiquidaReal(receitaReal);
        setReceitaLiquidaComparison(receitaComp);

        // Buscar breakdown detalhado por tag01 para o modal
        const summaryRows = await getDRESummary({
          monthFrom,
          monthTo,
          marcas: selectedMarca.length > 0 ? selectedMarca : undefined,
          nomeFiliais: selectedFilial.length > 0 ? selectedFilial : undefined,
        });

        // Filtrar apenas linhas onde tag0 começa com "01." (Receita)
        const receitaRows = summaryRows.filter(row => row.tag0 && row.tag0.match(/^01\./i));

        // Agrupar por tag01 → tag02 → cenário
        const breakdownMap = new Map<string, {
          real: number;
          orcado: number;
          a1: number;
          txCount: number;
          tag02s: Map<string, { real: number; orcado: number; a1: number; txCount: number }>;
        }>();

        receitaRows.forEach(row => {
          const tag01 = row.tag01 || 'Sem Subclassificação';
          const tag02 = row.tag02 || 'Sem tag02';

          // Inicializar tag01 se não existir
          if (!breakdownMap.has(tag01)) {
            breakdownMap.set(tag01, {
              real: 0,
              orcado: 0,
              a1: 0,
              txCount: 0,
              tag02s: new Map()
            });
          }

          const tag01Entry = breakdownMap.get(tag01)!;
          const amount = Number(row.total_amount);
          const count = Number(row.tx_count);

          // Agregar no nível tag01
          if (row.scenario === 'Real') {
            tag01Entry.real += amount;
            tag01Entry.txCount += count;
          } else if (row.scenario === 'Orçado') {
            tag01Entry.orcado += amount;
          } else if (row.scenario === 'A-1') {
            tag01Entry.a1 += amount;
          }

          // Agregar no nível tag02
          if (!tag01Entry.tag02s.has(tag02)) {
            tag01Entry.tag02s.set(tag02, { real: 0, orcado: 0, a1: 0, txCount: 0 });
          }

          const tag02Entry = tag01Entry.tag02s.get(tag02)!;
          if (row.scenario === 'Real') {
            tag02Entry.real += amount;
            tag02Entry.txCount += count;
          } else if (row.scenario === 'Orçado') {
            tag02Entry.orcado += amount;
          } else if (row.scenario === 'A-1') {
            tag02Entry.a1 += amount;
          }
        });

        // Converter para array e ordenar por valor Real (maior para menor)
        const breakdown = Array.from(breakdownMap.entries())
          .map(([tag01, values]) => ({
            tag01,
            real: values.real,
            orcado: values.orcado,
            a1: values.a1,
            txCount: values.txCount,
            tag02s: Array.from(values.tag02s.entries())
              .map(([tag02, tag02Values]) => ({
                tag02,
                ...tag02Values
              }))
              .sort((a, b) => Math.abs(b.real) - Math.abs(a.real))
          }))
          .sort((a, b) => Math.abs(b.real) - Math.abs(a.real));

        setReceitaBreakdown(breakdown);

        console.log('💰 Receita Líquida atualizada (lógica DRE):');
        console.log(`   Real: R$ ${receitaReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`   ${scenarioComparacao}: R$ ${receitaComp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`   Breakdown: ${breakdown.length} tags01 encontradas`);
      } catch (error) {
        console.error('❌ Erro ao buscar Receita Líquida:', error);
      } finally {
        setIsLoadingReceita(false);
      }
    };

    fetchReceitaLiquida();
  }, [selectedMonthStart, selectedMonthEnd, selectedMarca, selectedFilial, comparisonMode]);

  // Filter transactions by selected month range
  const filteredByMonth = useMemo(() => {
    return transactions.filter(t => {
      const month = parseInt(t.date.substring(5, 7), 10) - 1;
      return month >= selectedMonthStart && month <= selectedMonthEnd;
    });
  }, [transactions, selectedMonthStart, selectedMonthEnd]);

  const branchData = useMemo(() => {
    const data = BRANCHES.map(branch => {
      const bTrans = filteredByMonth.filter(t => t.filial === branch);
      // RECEITA LÍQUIDA: Soma das tag01 específicas conforme DRE
      const rev = bTrans.filter(t =>
        t.tag01 && RECEITA_LIQUIDA_TAGS.includes(t.tag01)
      ).reduce((acc, t) => acc + t.amount, 0);
      const exp = bTrans.filter(t =>
        !(t.tag01 && RECEITA_LIQUIDA_TAGS.includes(t.tag01))
      ).reduce((acc, t) => acc + t.amount, 0);
      const ebitda = rev - exp;
      return { name: branch, revenue: rev, ebitda, margin: rev > 0 ? (ebitda / rev) * 100 : 0 };
    });

    return sortBranchesAZ
      ? data.sort((a, b) => a.name.localeCompare(b.name))
      : data.sort((a, b) => b[activeMetric] - a[activeMetric]);
  }, [filteredByMonth, activeMetric, sortBranchesAZ]);

  // Enhanced KPIs with consumption metrics and additional calculations
  const enhancedKpis = useMemo(() => {
    const real = filteredByMonth.filter(t => t.scenario === 'Real');

    // Category-specific costs
    const waterCost = real.filter(t => t.category === 'Água & Gás')
      .reduce((acc, t) => acc + t.amount, 0);
    const energyCost = real.filter(t => t.category === 'Energia')
      .reduce((acc, t) => acc + t.amount, 0);
    const consumptionMaterialCost = real.filter(t => t.category === 'Material de Consumo' || t.category === 'Material de Consumo & Operação')
      .reduce((acc, t) => acc + t.amount, 0);
    const eventsCost = real.filter(t => t.category === 'Eventos Comerciais' || t.category === 'Eventos Pedagógicos')
      .reduce((acc, t) => acc + t.amount, 0);

    // New metrics
    const teacherCost = real.filter(t => t.category === 'Salários' || t.category?.includes('Professor'))
      .reduce((acc, t) => acc + t.amount, 0);
    const adminPayrollCost = real.filter(t => t.category === 'Folha Administrativa' || t.category?.includes('Folha Adm'))
      .reduce((acc, t) => acc + t.amount, 0);
    const studentMealCost = real.filter(t => t.category === 'Alimentação' || t.category?.includes('Alimentação'))
      .reduce((acc, t) => acc + t.amount, 0);
    const maintenanceCost = real.filter(t => t.category === 'Manutenção' || t.category?.includes('Manutenção'))
      .reduce((acc, t) => acc + t.amount, 0);

    // Calculate revenue and costs
    // RECEITA LÍQUIDA: Usar valor calculado pela mesma lógica da DRE (tag0 "01.")
    const totalRevenue = receitaLiquidaReal;

    const totalFixedCosts = real.filter(t => t.type === 'FIXED_COST').reduce((acc, t) => acc + t.amount, 0);
    const totalVariableCosts = real.filter(t => t.type === 'VARIABLE_COST').reduce((acc, t) => acc + t.amount, 0);
    const sgaCosts = real.filter(t => t.type === 'SGA').reduce((acc, t) => acc + t.amount, 0);
    const rateioCosts = real.filter(t => t.type === 'RATEIO').reduce((acc, t) => acc + t.amount, 0);
    const ebitda = totalRevenue - totalFixedCosts - totalVariableCosts - sgaCosts - rateioCosts;

    // Per-unit calculations
    const numberOfStudents = kpis.activeStudents;
    const numberOfClassrooms = Math.ceil(numberOfStudents / 25);

    // Target calculations
    const targetMargin = 25;
    const targetEbitdaValue = totalRevenue * (targetMargin / 100);
    const diffToTarget = targetEbitdaValue - ebitda;
    const costReductionNeeded = diffToTarget > 0 ? diffToTarget : 0;
    const marginOfSafety = diffToTarget < 0 ? Math.abs(diffToTarget) : 0;

    return {
      totalRevenue,
      totalFixedCosts,
      totalVariableCosts,
      sgaCosts,
      ebitda,
      netMargin: totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0,
      revenuePerStudent: numberOfStudents > 0 ? totalRevenue / numberOfStudents : 0,
      costPerStudent: numberOfStudents > 0 ? (totalFixedCosts + totalVariableCosts + sgaCosts + rateioCosts) / numberOfStudents : 0,
      waterPerStudent: numberOfStudents > 0 ? waterCost / numberOfStudents : 0,
      energyPerClassroom: numberOfClassrooms > 0 ? energyCost / numberOfClassrooms : 0,
      consumptionMaterialPerStudent: numberOfStudents > 0 ? consumptionMaterialCost / numberOfStudents : 0,
      eventsPerStudent: numberOfStudents > 0 ? eventsCost / numberOfStudents : 0,
      costReductionNeeded,
      marginOfSafety,
      targetEbitdaValue,
      isBelowTarget: costReductionNeeded > 0,
      numberOfClassrooms,
      activeStudents: numberOfStudents,
      defaultRate: kpis.defaultRate,
      teacherCostPercent: totalRevenue > 0 ? (teacherCost / totalRevenue) * 100 : 0,
      adminPayrollPercent: totalRevenue > 0 ? (adminPayrollCost / totalRevenue) * 100 : 0,
      studentMealPerStudent: numberOfStudents > 0 ? studentMealCost / numberOfStudents : 0,
      teacherCostPerClassroom: numberOfClassrooms > 0 ? teacherCost / numberOfClassrooms : 0,
      maintenancePercent: totalRevenue > 0 ? (maintenanceCost / totalRevenue) * 100 : 0,
      teacherCost,
      adminPayrollCost,
      studentMealCost,
      maintenanceCost
    };
  }, [filteredByMonth, kpis, receitaLiquidaReal]);

  // Calculate trends based on comparison mode
  const trends = useMemo(() => {
    const comparison = filteredByMonth.filter(t =>
      t.scenario === (comparisonMode === 'budget' ? 'Orçamento' : 'Ano Anterior')
    );
    const real = filteredByMonth.filter(t => t.scenario === 'Real');

    // Calculate comparison KPIs
    // RECEITA LÍQUIDA: Usar valor calculado pela mesma lógica da DRE (tag0 "01.")
    const compRevenue = receitaLiquidaComparison;
    const compFixedCosts = comparison.filter(t => t.type === 'FIXED_COST').reduce((acc, t) => acc + t.amount, 0);
    const compVariableCosts = comparison.filter(t => t.type === 'VARIABLE_COST').reduce((acc, t) => acc + t.amount, 0);
    const compSgaCosts = comparison.filter(t => t.type === 'SGA').reduce((acc, t) => acc + t.amount, 0);
    const compRateioCosts = comparison.filter(t => t.type === 'RATEIO').reduce((acc, t) => acc + t.amount, 0);
    const compEbitda = compRevenue - compFixedCosts - compVariableCosts - compSgaCosts - compRateioCosts;
    const compMargin = compRevenue > 0 ? (compEbitda / compRevenue) * 100 : 0;

    // Calculate variations (%)
    const revenueTrend = compRevenue > 0 ? ((enhancedKpis.totalRevenue - compRevenue) / compRevenue) * 100 : 0;
    const ebitdaTrend = compEbitda !== 0 ? ((enhancedKpis.ebitda - compEbitda) / Math.abs(compEbitda)) * 100 : 0;
    const marginTrend = enhancedKpis.netMargin - compMargin;
    const studentsTrend = 0; // Pode adicionar lógica para alunos se tiver dados históricos

    // Calculate absolute variations
    const revenueAbsolute = enhancedKpis.totalRevenue - compRevenue;
    const ebitdaAbsolute = enhancedKpis.ebitda - compEbitda;
    const revenuePerStudentAbsolute = enhancedKpis.revenuePerStudent - (compRevenue > 0 ? compRevenue / enhancedKpis.activeStudents : 0);
    const studentsAbsolute = 0;

    return {
      revenue: revenueTrend,
      ebitda: ebitdaTrend,
      margin: marginTrend,
      students: studentsTrend,
      revenueAbsolute,
      ebitdaAbsolute,
      revenuePerStudentAbsolute,
      studentsAbsolute,
      compRevenue,
      compEbitda,
      compFixedCosts,
      compVariableCosts,
      compSgaCosts,
      compRateioCosts
    };
  }, [filteredByMonth, enhancedKpis, comparisonMode, receitaLiquidaComparison]);

  // Variation detail data
  const variationDetail = useMemo(() => {
    const targetReached = ((enhancedKpis.ebitda / Math.max(1, enhancedKpis.targetEbitdaValue)) * 100);
    const variationFromTarget = enhancedKpis.ebitda - enhancedKpis.targetEbitdaValue;

    const variationFromComparison = enhancedKpis.ebitda - trends.compEbitda;
    const variationFromComparisonPercent = trends.compEbitda !== 0
      ? ((variationFromComparison / Math.abs(trends.compEbitda)) * 100)
      : 0;

    return {
      targetReached,
      targetValue: enhancedKpis.targetEbitdaValue,
      realValue: enhancedKpis.ebitda,
      variationFromTarget,
      variationFromTargetPercent: enhancedKpis.targetEbitdaValue > 0
        ? (variationFromTarget / enhancedKpis.targetEbitdaValue) * 100
        : 0,
      comparisonValue: trends.compEbitda,
      variationFromComparison,
      variationFromComparisonPercent,
      breakdown: {
        revenue: { real: enhancedKpis.totalRevenue, comparison: trends.compRevenue, diff: enhancedKpis.totalRevenue - trends.compRevenue },
        fixedCosts: { real: enhancedKpis.totalFixedCosts, comparison: trends.compFixedCosts, diff: enhancedKpis.totalFixedCosts - trends.compFixedCosts },
        variableCosts: { real: enhancedKpis.totalVariableCosts, comparison: trends.compVariableCosts, diff: enhancedKpis.totalVariableCosts - trends.compVariableCosts },
        sgaCosts: { real: enhancedKpis.sgaCosts, comparison: trends.compSgaCosts, diff: enhancedKpis.sgaCosts - trends.compSgaCosts },
        rateioCosts: { real: 0, comparison: trends.compRateioCosts, diff: -trends.compRateioCosts }
      }
    };
  }, [enhancedKpis, trends]);

  const unitEconomics = [
    { name: 'Previsto', ticket: enhancedKpis.revenuePerStudent, cost: enhancedKpis.costPerStudent },
    { name: 'Real', ticket: enhancedKpis.revenuePerStudent * 0.98, cost: enhancedKpis.costPerStudent * 1.05 },
  ];

  // Waterfall Chart Data - De Receita até EBITDA
  const waterfallData = useMemo(() => {
    const real = filteredByMonth.filter(t => t.scenario === 'Real');
    const comparison = filteredByMonth.filter(t =>
      t.scenario === (comparisonMode === 'budget' ? 'Orçamento' : 'Ano Anterior')
    );

    // Real values
    // RECEITA LÍQUIDA: Soma das tag01 específicas conforme DRE
    const revenue = real.filter(t =>
      t.tag01 && RECEITA_LIQUIDA_TAGS.includes(t.tag01)
    ).reduce((acc, t) => acc + t.amount, 0);
    const fixedCosts = real.filter(t => t.type === 'FIXED_COST').reduce((acc, t) => acc + t.amount, 0);
    const variableCosts = real.filter(t => t.type === 'VARIABLE_COST').reduce((acc, t) => acc + t.amount, 0);
    const sgaCosts = real.filter(t => t.type === 'SGA').reduce((acc, t) => acc + t.amount, 0);
    const rateioCosts = real.filter(t => t.type === 'RATEIO').reduce((acc, t) => acc + t.amount, 0);
    const ebitda = revenue - fixedCosts - variableCosts - sgaCosts - rateioCosts;

    // Comparison values
    // RECEITA LÍQUIDA: Soma das tag01 específicas conforme DRE
    const compRevenue = comparison.filter(t =>
      t.tag01 && RECEITA_LIQUIDA_TAGS.includes(t.tag01)
    ).reduce((acc, t) => acc + t.amount, 0);
    const compFixedCosts = comparison.filter(t => t.type === 'FIXED_COST').reduce((acc, t) => acc + t.amount, 0);
    const compVariableCosts = comparison.filter(t => t.type === 'VARIABLE_COST').reduce((acc, t) => acc + t.amount, 0);
    const compSgaCosts = comparison.filter(t => t.type === 'SGA').reduce((acc, t) => acc + t.amount, 0);
    const compRateioCosts = comparison.filter(t => t.type === 'RATEIO').reduce((acc, t) => acc + t.amount, 0);
    const compEbitda = compRevenue - compFixedCosts - compVariableCosts - compSgaCosts - compRateioCosts;

    // Calculate variations (%)
    const calcVariation = (real: number, comp: number) => {
      if (comp === 0) return 0;
      return ((real - comp) / Math.abs(comp)) * 100;
    };

    const data = [
      {
        name: 'Receita',
        start: 0,
        value: revenue,
        end: revenue,
        color: '#1B75BB',
        displayValue: revenue,
        variation: calcVariation(revenue, compRevenue)
      },
      {
        name: 'Custos Variáveis',
        start: revenue,
        value: variableCosts,
        end: revenue - variableCosts,
        color: '#F97316',
        displayValue: variableCosts,
        variation: calcVariation(variableCosts, compVariableCosts)
      },
      {
        name: 'Custos Fixos',
        start: revenue - variableCosts,
        value: fixedCosts,
        end: revenue - variableCosts - fixedCosts,
        color: '#F44C00',
        displayValue: fixedCosts,
        variation: calcVariation(fixedCosts, compFixedCosts)
      },
      {
        name: 'SG&A',
        start: revenue - variableCosts - fixedCosts,
        value: sgaCosts,
        end: revenue - variableCosts - fixedCosts - sgaCosts,
        color: '#FB923C',
        displayValue: sgaCosts,
        variation: calcVariation(sgaCosts, compSgaCosts)
      },
      {
        name: 'Rateio',
        start: revenue - variableCosts - fixedCosts - sgaCosts,
        value: rateioCosts,
        end: revenue - variableCosts - fixedCosts - sgaCosts - rateioCosts,
        color: '#FDBA74',
        displayValue: rateioCosts,
        variation: calcVariation(rateioCosts, compRateioCosts)
      },
      {
        name: 'EBITDA',
        start: 0,
        value: ebitda,
        end: ebitda,
        color: ebitda >= 0 ? '#7AC5BF' : '#EF4444',
        displayValue: Math.abs(ebitda),
        isNegative: ebitda < 0,
        variation: calcVariation(ebitda, compEbitda)
      }
    ];

    console.log('🔵 Waterfall Data:', data);
    return data;
  }, [filteredByMonth, comparisonMode]);

  // Função auxiliar para formatar valores do heatmap
  const formatHeatmapValue = (value: number): string => {
    const valueInThousands = value / 1000;
    const rounded = Math.round(valueInThousands);

    // Retornar "-" para zero absoluto
    if (rounded === 0) return '-';

    // Usar toLocaleString('pt-BR') para adicionar "." como separador
    return rounded.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  // Heatmap de Performance Mensal - Usando dados da DRE Gerencial
  const heatmapData = useMemo(() => {
    // Métricas fixas que queremos exibir
    const metrics = ['Receita', 'Custos Variáveis', 'Custos Fixos', 'SG&A', 'Rateio CSC', 'EBITDA'];

    // Se não temos dados da DRE ainda, retornar estrutura vazia
    if (dreSummaryData.length === 0) {
      return { metrics, monthsData: [] };
    }

    // Filtrar apenas dados do cenário Real
    const realData = dreSummaryData.filter(row => row.scenario === 'Real');

    // Manter todos os meses visíveis, mas zerar dados fora do filtro
    const monthsData = months.map((month, idx) => {
      // Verificar se o mês está dentro do intervalo selecionado
      const isInRange = idx >= selectedMonthStart && idx <= selectedMonthEnd;

      // Construir year_month no formato 'YYYY-MM'
      const year = new Date().getFullYear();
      const yearMonth = `${year}-${String(idx + 1).padStart(2, '0')}`;

      // Objeto para armazenar valores e scores
      const monthData: any = {
        month,
        monthIndex: idx,
        scores: {}
      };

      // Se não está no intervalo, retornar dados zerados com "-"
      if (!isInRange) {
        metrics.forEach(metric => {
          monthData[metric] = '-';
          monthData.scores[metric] = 0;
        });
        return monthData;
      }

      // Filtrar dados do mês atual
      const monthRows = realData.filter(row => row.year_month === yearMonth);

      // Calcular valores baseado em tag0 e tipo (mapeamento robusto)
      const revenue = monthRows
        .filter(row =>
          (row.tag0 && row.tag0.match(/^01\./i)) ||
          (row.tag0 && row.tag0.toLowerCase().includes('receita')) ||
          row.tipo === 'REVENUE'
        )
        .reduce((sum, row) => sum + row.total_amount, 0);

      const variableCosts = monthRows
        .filter(row =>
          (row.tag0 && (row.tag0.match(/^02\./i) || row.tag0.toLowerCase().includes('variá'))) ||
          row.tipo === 'VARIABLE_COST'
        )
        .reduce((sum, row) => sum + row.total_amount, 0);

      const fixedCosts = monthRows
        .filter(row =>
          (row.tag0 && (row.tag0.match(/^03\./i) || row.tag0.toLowerCase().includes('fixo'))) ||
          row.tipo === 'FIXED_COST'
        )
        .reduce((sum, row) => sum + row.total_amount, 0);

      const sgaCosts = monthRows
        .filter(row =>
          (row.tag0 && (row.tag0.match(/^04\./i) || row.tag0.toLowerCase().includes('sg&a') || row.tag0.toLowerCase().includes('administrativa'))) ||
          row.tipo === 'SGA'
        )
        .reduce((sum, row) => sum + row.total_amount, 0);

      const rateioCosts = monthRows
        .filter(row =>
          (row.tag0 && (row.tag0.match(/^05\./i) || row.tag0.toLowerCase().includes('rateio') || row.tag0.toLowerCase().includes('csc'))) ||
          row.tipo === 'RATEIO'
        )
        .reduce((sum, row) => sum + row.total_amount, 0);

      const ebitda = revenue - variableCosts - fixedCosts - sgaCosts - rateioCosts;

      // Debug para o primeiro mês no range
      if (idx === selectedMonthStart && monthRows.length > 0) {
        console.log(`\n🔍 Debug Heatmap - ${month}/${year}:`);
        console.log(`   Total de linhas do mês: ${monthRows.length}`);
        console.log(`   Receita: R$ ${revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`   Custos Variáveis (tipo='VARIABLE_COST'): R$ ${variableCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`   Custos Fixos (tipo='FIXED_COST'): R$ ${fixedCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`   SG&A (tipo='SGA'): R$ ${sgaCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`   Rateio (tipo='RATEIO'): R$ ${rateioCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`   EBITDA: R$ ${ebitda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);

        // Mostrar amostra dos tipos que existem
        const tiposNoMes = Array.from(new Set(monthRows.map(r => r.tipo)));
        console.log(`   Tipos encontrados no mês:`, tiposNoMes);

        // Mostrar tag0s que não são receita
        const tag0sNaoReceita = Array.from(new Set(
          monthRows.filter(r => !r.tag0?.match(/^01\./i)).map(r => r.tag0)
        ));
        console.log(`   Tag0s (não-receita) no mês:`, tag0sNaoReceita);
      }

      // Preencher valores formatados
      monthData['Receita'] = formatHeatmapValue(revenue);
      monthData['Custos Variáveis'] = formatHeatmapValue(variableCosts);
      monthData['Custos Fixos'] = formatHeatmapValue(fixedCosts);
      monthData['SG&A'] = formatHeatmapValue(sgaCosts);
      monthData['Rateio CSC'] = formatHeatmapValue(rateioCosts);
      monthData['EBITDA'] = formatHeatmapValue(ebitda);

      // Calcular scores para coloração (0-100)
      monthData.scores['Receita'] = revenue > 0 ? Math.min(100, (revenue / 150000) * 100) : 0;
      monthData.scores['Custos Variáveis'] = variableCosts > 0 ? Math.min(100, 100 - (variableCosts / 80000) * 100) : 100;
      monthData.scores['Custos Fixos'] = fixedCosts > 0 ? Math.min(100, 100 - (fixedCosts / 60000) * 100) : 100;
      monthData.scores['SG&A'] = sgaCosts > 0 ? Math.min(100, 100 - (sgaCosts / 30000) * 100) : 100;
      monthData.scores['Rateio CSC'] = rateioCosts > 0 ? Math.min(100, 100 - (rateioCosts / 20000) * 100) : 100;
      monthData.scores['EBITDA'] = ebitda > 0 ? Math.min(100, (ebitda / 40000) * 100) : 0;

      return monthData;
    });

    // Função auxiliar para somar valores formatados
    const sumFormattedValues = (key: string): string => {
      const sum = monthsData.reduce((acc, m) => {
        const val = m[key] === '-' ? 0 : parseFloat(m[key].replace(/\./g, ''));
        return acc + val;
      }, 0);
      return sum === 0 ? '-' : sum.toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    };

    // Calcular totais dinamicamente para cada métrica
    const totals: any = {
      month: 'TOTAL',
      monthIndex: 12,
      scores: {}
    };

    metrics.forEach(metric => {
      totals[metric] = sumFormattedValues(metric);
      totals.scores[metric] = 85; // Score neutro para totais
    });

    // Adicionar totais ao final
    const monthsDataWithTotal = [...monthsData, totals];

    console.log('🔥 Heatmap Data (DRE Nível 1):', { metrics, monthsData: monthsDataWithTotal });
    return { metrics, monthsData: monthsDataWithTotal };
  }, [dreSummaryData, months, selectedMonthStart, selectedMonthEnd]);

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <div id="dashboard-wrapper" className="animate-in fade-in duration-500 pb-10">
      <header className="sticky top-0 z-40 bg-gray-50 -mx-3 md:-mx-4 lg:-mx-6 px-3 md:px-4 lg:px-6 pt-4 pb-4 border-b border-gray-200 shadow-sm">
        <div className="flex flex-col gap-4">
          {/* Título */}
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="h-5 w-1 bg-[#F44C00] rounded-full"></div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Painel Executivo Raiz</h2>
            </div>
            <p className="text-[10px] text-[#636363] font-bold uppercase tracking-widest">Grupo Raiz Educação • Performance Financeira Consolidada</p>
          </div>

          {/* Filtros e Controles - Altura padronizada */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filtro de Marca - Multi-select */}
            <MultiSelectFilter
              label="Marca"
              icon={<Flag size={14} />}
              options={uniqueBrands}
              selected={selectedMarca}
              onChange={(newSelection) => {
                onMarcaChange(newSelection);
                if (newSelection.length > 0 && selectedFilial.length > 0) {
                  // Limpar filiais se as marcas mudarem
                  onFilialChange([]);
                }
              }}
              colorScheme="blue"
            />

            {/* Filtro de Filial - Multi-select */}
            <MultiSelectFilter
              label="Filial"
              icon={<Building2 size={14} />}
              options={availableBranches}
              selected={selectedFilial}
              onChange={onFilialChange}
              colorScheme="orange"
            />

            {/* Separador visual */}
            <div className="h-[52px] w-px bg-gray-300"></div>

            {/* Botões de Comparação - Altura padronizada */}
            <div className="flex bg-white rounded-lg border-2 border-gray-200 shadow-sm h-[52px]">
              {(['budget', 'prevYear'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setComparisonMode(mode)}
                  className={`px-4 h-full text-[9px] font-black uppercase tracking-widest transition-all first:rounded-l-md last:rounded-r-md ${
                    comparisonMode === mode
                      ? 'bg-[#1B75BB] text-white'
                      : 'text-gray-400 hover:text-[#1B75BB] hover:bg-gray-50'
                  }`}
                >
                  vs {mode === 'budget' ? 'ORÇADO' : 'ANO ANT'}
                </button>
              ))}
            </div>

            {/* Atalhos de período - Altura padronizada */}
            <div className="flex gap-1.5 h-[52px]">
              <button
                onClick={() => { setSelectedMonthStart(0); setSelectedMonthEnd(11); }}
                className={`px-3 h-full text-[9px] font-black uppercase rounded-lg transition-all border-2 ${
                  selectedMonthStart === 0 && selectedMonthEnd === 11
                    ? 'bg-[#1B75BB] text-white border-[#1B75BB] shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                }`}
                title="Ano completo"
              >
                Ano
              </button>
              <button
                onClick={() => { setSelectedMonthStart(0); setSelectedMonthEnd(2); }}
                className={`px-3 h-full text-[9px] font-black uppercase rounded-lg transition-all border-2 ${
                  selectedMonthStart === 0 && selectedMonthEnd === 2
                    ? 'bg-[#1B75BB] text-white border-[#1B75BB] shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                }`}
                title="1º Trimestre"
              >
                1T
              </button>
              <button
                onClick={() => { setSelectedMonthStart(3); setSelectedMonthEnd(5); }}
                className={`px-3 h-full text-[9px] font-black uppercase rounded-lg transition-all border-2 ${
                  selectedMonthStart === 3 && selectedMonthEnd === 5
                    ? 'bg-[#1B75BB] text-white border-[#1B75BB] shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                }`}
                title="2º Trimestre"
              >
                2T
              </button>
              <button
                onClick={() => { setSelectedMonthStart(6); setSelectedMonthEnd(8); }}
                className={`px-3 h-full text-[9px] font-black uppercase rounded-lg transition-all border-2 ${
                  selectedMonthStart === 6 && selectedMonthEnd === 8
                    ? 'bg-[#1B75BB] text-white border-[#1B75BB] shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                }`}
                title="3º Trimestre"
              >
                3T
              </button>
              <button
                onClick={() => { setSelectedMonthStart(9); setSelectedMonthEnd(11); }}
                className={`px-3 h-full text-[9px] font-black uppercase rounded-lg transition-all border-2 ${
                  selectedMonthStart === 9 && selectedMonthEnd === 11
                    ? 'bg-[#1B75BB] text-white border-[#1B75BB] shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                }`}
                title="4º Trimestre"
              >
                4T
              </button>
            </div>

            {/* Seletores de mês - Altura padronizada */}
            <div className="flex items-center gap-2 bg-white border-2 border-gray-200 px-4 h-[52px] rounded-lg shadow-sm">
              <CalendarDays size={14} className="text-[#F44C00]" />
              <div className="flex items-center gap-1.5">
                <select
                  className="bg-transparent text-xs font-bold text-gray-900 outline-none cursor-pointer"
                  value={selectedMonthStart}
                  onChange={(e) => {
                    const newStart = parseInt(e.target.value);
                    setSelectedMonthStart(newStart);
                    if (selectedMonthEnd < newStart) {
                      setSelectedMonthEnd(newStart);
                    }
                  }}
                >
                  {months.map((m, idx) => (
                    <option key={m} value={idx}>{m}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-400 font-bold">até</span>
                <select
                  className="bg-transparent text-xs font-bold text-gray-900 outline-none cursor-pointer"
                  value={selectedMonthEnd}
                  onChange={(e) => {
                    const newEnd = parseInt(e.target.value);
                    setSelectedMonthEnd(newEnd);
                    if (selectedMonthStart > newEnd) {
                      setSelectedMonthStart(newEnd);
                    }
                  }}
                >
                  {months.map((m, idx) => (
                    <option key={m} value={idx}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-4">
      {/* Executive KPIs Section */}
      <section>
        <div className="mb-3">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <div className="h-6 w-1.5 bg-[#1B75BB] rounded-full"></div>
            Indicadores Executivos
          </h2>
          <p className="text-xs text-gray-500 mt-1 ml-4">KPIs principais e tendências de performance</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard
            label="Receita Líquida"
            value={enhancedKpis.totalRevenue}
            trend={trends.revenue}
            trendAbsolute={trends.revenueAbsolute}
            color="blue"
            icon={<Target size={16} />}
            variationType={comparisonMode === 'budget' ? 'vs Orçado' : 'vs A-1'}
            onClick={() => setShowRevenueBreakdown(true)}
          />
          <KPICard label="EBITDA" value={enhancedKpis.ebitda} trend={trends.ebitda} trendAbsolute={trends.ebitdaAbsolute} color="orange" icon={<Target size={16} />} variationType={comparisonMode === 'budget' ? 'vs Orçado' : 'vs A-1'} />
          <KPICard label="Receita / Aluno" value={enhancedKpis.revenuePerStudent} trend={3.2} trendAbsolute={trends.revenuePerStudentAbsolute} color="blue" icon={<Users size={16} />} variationType={comparisonMode === 'budget' ? 'vs Orçado' : 'vs A-1'} />
          <KPICard label="Alunos Ativos" value={enhancedKpis.activeStudents} isNumber trend={trends.students} trendAbsolute={trends.studentsAbsolute} color="teal" icon={<Users size={16} />} variationType={comparisonMode === 'budget' ? 'vs Orçado' : 'vs A-1'} />
        </div>
      </section>

      {/* SEÇÃO DE ANÁLISES AVANÇADAS */}
      <div className="mt-6 mb-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <div className="h-6 w-1.5 bg-[#1B75BB] rounded-full"></div>
          Análises Avançadas
        </h2>
        <p className="text-xs text-gray-500 mt-1 ml-4">Visualizações detalhadas de performance e comparações</p>
      </div>

      {/* Waterfall Chart - Full Width */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
                  <TrendingDown size={18} className="text-[#F44C00]" />
                  Waterfall - Formação do EBITDA
                </h3>
                <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Da Receita Bruta até o Resultado Operacional</p>
              </div>
            </div>
            <div className="h-[250px] md:h-[350px] lg:h-[400px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={waterfallData} margin={{top: 50, right: 30, left: 20, bottom: 5}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#9ca3af', fontSize: 11, fontWeight: '700'}}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#9ca3af', fontSize: 10}}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    cursor={{fill: '#f9fafb'}}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                            <p className="text-xs font-bold text-gray-900">{data.name}</p>
                            <p className="text-sm font-black text-[#1B75BB]">
                              R$ {data.displayValue.toLocaleString('pt-BR')}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* Linha cinza no marco zero */}
                  <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={2} />
                  {/* Barra invisível para posicionar a base (efeito cascata) */}
                  <Bar
                    dataKey={(entry: any) => {
                      // Para EBITDA, sempre começar do zero
                      if (entry.name === 'EBITDA') return 0;
                      // Para outros, posicionar onde a cascata deve começar
                      return Math.min(entry.start, entry.end);
                    }}
                    stackId="a"
                    fill="transparent"
                    barSize={60}
                  />
                  {/* Barra colorida com o valor */}
                  <Bar
                    dataKey="value"
                    stackId="a"
                    barSize={60}
                    radius={[10, 10, 0, 0]}
                    label={(props: any) => {
                      const { x, y, width, index } = props;
                      const entry = waterfallData[index];
                      if (!entry) return null;
                      const variation = entry.variation || 0;
                      const variationColor = variation >= 0 ? '#059669' : '#DC2626';
                      return (
                        <g>
                          {/* Variação percentual */}
                          <text
                            x={x + width / 2}
                            y={y - 20}
                            fill={variationColor}
                            fontSize={10}
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {variation >= 0 ? '↗' : '↘'} {Math.abs(variation).toFixed(0)}%
                          </text>
                          {/* Valor absoluto */}
                          <text
                            x={x + width / 2}
                            y={y - 5}
                            fill="#374151"
                            fontSize={11}
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            R$ {(entry.displayValue / 1000).toFixed(0)}k
                          </text>
                        </g>
                      );
                    }}
                  >
                    {waterfallData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

      {/* Cards Grid - 3 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {/* Target Achievement */}
        <div className="bg-[#1B75BB] p-4 md:p-5 rounded-xl text-white shadow-lg min-h-[160px] lg:h-[180px] relative overflow-hidden flex flex-col justify-between group">
          <div className="relative z-10">
            <span className="text-[9px] font-black text-blue-100 uppercase tracking-widest">Atingimento da Meta</span>
            <p className="text-5xl font-black mt-3 leading-none">{((enhancedKpis.ebitda / Math.max(1, enhancedKpis.targetEbitdaValue)) * 100).toFixed(0)}%</p>
            <div className="w-full bg-white/10 h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-[#7AC5BF] h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (enhancedKpis.ebitda / Math.max(1, enhancedKpis.targetEbitdaValue)) * 100)}%` }}></div>
            </div>
          </div>
          <button
            onClick={() => setShowVariationDetail(true)}
            className="relative z-10 w-full py-2.5 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-1.5 border border-white/5"
          >
            Detalhar Variação <ArrowRight size={12} />
          </button>
          <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-110 transition-transform">
            <GraduationCap size={120} />
          </div>
        </div>

        {/* Dynamic Performance Status */}
        <div className={`p-4 md:p-5 rounded-xl shadow-lg min-h-[160px] lg:h-[180px] flex flex-col justify-center ${
          enhancedKpis.isBelowTarget
            ? 'bg-gradient-to-br from-orange-500 to-orange-600'
            : 'bg-gradient-to-br from-teal-500 to-teal-600'
        } text-white`}>
          {enhancedKpis.isBelowTarget ? (
            <>
              <Scissors size={32} className="mb-3" />
              <h4 className="text-lg font-black mb-2">Atenção Necessária</h4>
              <p className="text-sm font-bold opacity-90 leading-relaxed">
                É necessário reduzir custos em <span className="font-black">R$ {enhancedKpis.costReductionNeeded.toLocaleString('pt-BR')}</span> para atingir a meta de margem de 25%.
              </p>
            </>
          ) : (
            <>
              <ShieldCheck size={32} className="mb-3" />
              <h4 className="text-lg font-black mb-2">Performance Excelente</h4>
              <p className="text-sm font-bold opacity-90 leading-relaxed">
                Unidade operando acima da meta com margem de segurança de <span className="font-black">R$ {enhancedKpis.marginOfSafety.toLocaleString('pt-BR')}</span>.
              </p>
            </>
          )}
        </div>

        {/* Principais Alertas */}
        <div className="bg-white p-4 md:p-5 rounded-xl border border-gray-100 shadow-sm min-h-[160px] lg:h-[180px] flex flex-col">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 flex-shrink-0">
            <AlertCircle size={14} />
            Atenção Necessária
          </h4>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {/* Inadimplência */}
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                enhancedKpis.defaultRate > 10 ? 'bg-red-500' :
                enhancedKpis.defaultRate > 5 ? 'bg-yellow-500' :
                'bg-green-500'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[11px] font-bold text-gray-700 truncate">Inadimplência</span>
                  <span className={`text-xs font-black whitespace-nowrap ${
                    enhancedKpis.defaultRate > 10 ? 'text-red-600' :
                    enhancedKpis.defaultRate > 5 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {enhancedKpis.defaultRate.toFixed(1)}%
                  </span>
                </div>
                <p className="text-[9px] text-gray-400 font-medium mt-0.5">
                  {enhancedKpis.defaultRate > 10 ? 'Acima do aceitável' :
                   enhancedKpis.defaultRate > 5 ? 'Requer atenção' :
                   'Dentro da meta'}
                </p>
              </div>
            </div>

              {/* Custo de Professores % Receita */}
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  enhancedKpis.teacherCostPercent > 40 ? 'bg-red-500' :
                  enhancedKpis.teacherCostPercent > 38 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] font-bold text-gray-700 truncate">Custo Professores</span>
                    <span className={`text-xs font-black whitespace-nowrap ${
                      enhancedKpis.teacherCostPercent > 40 ? 'text-red-600' :
                      enhancedKpis.teacherCostPercent > 38 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {enhancedKpis.teacherCostPercent.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-[9px] text-gray-400 font-medium mt-0.5">
                    {enhancedKpis.teacherCostPercent > 40 ? 'Reduzir custos' :
                     enhancedKpis.teacherCostPercent > 38 ? 'Próximo do limite' :
                     'Meta: 38%'}
                  </p>
                </div>
              </div>

              {/* Energia por Sala */}
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  enhancedKpis.energyPerClassroom > 1000 ? 'bg-red-500' :
                  enhancedKpis.energyPerClassroom > 800 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] font-bold text-gray-700 truncate">Energia/Sala</span>
                    <span className={`text-xs font-black whitespace-nowrap ${
                      enhancedKpis.energyPerClassroom > 1000 ? 'text-red-600' :
                      enhancedKpis.energyPerClassroom > 800 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      R$ {enhancedKpis.energyPerClassroom.toFixed(0)}
                    </span>
                  </div>
                  <p className="text-[9px] text-gray-400 font-medium mt-0.5">
                    {enhancedKpis.energyPerClassroom > 1000 ? 'Consumo elevado' :
                     enhancedKpis.energyPerClassroom > 800 ? 'Acima da média' :
                     'Consumo controlado'}
                  </p>
                </div>
              </div>

              {/* Margem EBITDA */}
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  enhancedKpis.netMargin < 15 ? 'bg-red-500' :
                  enhancedKpis.netMargin < 25 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] font-bold text-gray-700 truncate">Margem EBITDA</span>
                    <span className={`text-xs font-black whitespace-nowrap ${
                      enhancedKpis.netMargin < 15 ? 'text-red-600' :
                      enhancedKpis.netMargin < 25 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {enhancedKpis.netMargin.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-[9px] text-gray-400 font-medium mt-0.5">
                    {enhancedKpis.netMargin < 15 ? 'Crítico - abaixo de 15%' :
                     enhancedKpis.netMargin < 25 ? 'Abaixo da meta de 25%' :
                     'Acima da meta'}
                  </p>
                </div>
              </div>

              {/* Manutenção % Receita */}
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  enhancedKpis.maintenancePercent > 8 ? 'bg-red-500' :
                  enhancedKpis.maintenancePercent > 5 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] font-bold text-gray-700 truncate">Manutenção</span>
                    <span className={`text-xs font-black whitespace-nowrap ${
                      enhancedKpis.maintenancePercent > 8 ? 'text-red-600' :
                      enhancedKpis.maintenancePercent > 5 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {enhancedKpis.maintenancePercent.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-[9px] text-gray-400 font-medium mt-0.5">
                    {enhancedKpis.maintenancePercent > 8 ? 'Custos excessivos' :
                     enhancedKpis.maintenancePercent > 5 ? 'Monitorar de perto' :
                     'Sob controle'}
                  </p>
                </div>
              </div>
            </div>

          {/* Legenda e Botão */}
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-[9px] font-bold text-gray-500">OK</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="text-[9px] font-bold text-gray-500">Atenção</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-[9px] font-bold text-gray-500">Crítico</span>
              </div>
            </div>
            <button
              onClick={() => setShowAlertsDetail(true)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1"
            >
              Detalhar <ArrowRight size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* Heatmap de Performance Mensal - EXPANDIDO HORIZONTALMENTE */}
      <div className="mt-4">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
                <CalendarDays size={20} className="text-[#7AC5BF]" />
                Performance Mensal - Heatmap
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-1">Visualização de tendências mensais por métrica (dados agregados da DRE)</p>
            </div>

            {/* Botão Toggle */}
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1B75BB] to-[#4AC8F4] text-white text-sm font-bold rounded-lg hover:shadow-lg transition-all hover:scale-105"
            >
              {showHeatmap ? (
                <>
                  <ChevronRight size={16} className="rotate-90" />
                  Ocultar Heatmap
                </>
              ) : (
                <>
                  <ChevronRight size={16} />
                  Mostrar Heatmap
                </>
              )}
            </button>
          </div>

          {/* Conteúdo do Heatmap (renderizado apenas quando showHeatmap = true) */}
          {showHeatmap && (
            <>
          {/* Loading State */}
          {isLoadingDRE && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F44C00]"></div>
              <span className="ml-3 text-sm text-gray-500 font-medium">Carregando dados da DRE...</span>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingDRE && heatmapData.metrics.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle size={32} className="text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 font-medium">Nenhum dado disponível</p>
            </div>
          )}

          {/* Heatmap Grid */}
          {!isLoadingDRE && heatmapData.metrics.length > 0 && (
          <div className="w-full">
            <div className="flex">
              {/* Labels das métricas */}
              <div className="flex flex-col w-40 shrink-0 gap-2">
                  <div className="h-10 flex items-center justify-end pr-3 text-sm font-black text-gray-400 uppercase whitespace-nowrap">
                    Métrica
                  </div>
                  {heatmapData.metrics.map((metric) => (
                    <div key={metric} className="h-10 flex items-center justify-end pr-3 text-sm font-black text-gray-700 whitespace-nowrap">
                      {metric}
                    </div>
                  ))}
                </div>

              {/* Grid de células do heatmap */}
              <div className="flex-1 overflow-hidden">
                <div className="flex">
                  {heatmapData.monthsData.map((monthData) => {
                    const isTotal = monthData.month === 'TOTAL';
                    return (
                    <div key={monthData.month} className={`flex-1 min-w-[60px] flex flex-col gap-2 ${isTotal ? 'ml-3 pl-3 border-l-4 border-[#1B75BB]' : ''}`}>
                        {/* Header do mês */}
                        <div className={`h-10 flex items-center justify-center text-sm font-black uppercase ${isTotal ? 'text-[#1B75BB] bg-gradient-to-b from-gray-50 to-white rounded-t-lg' : 'text-gray-500'}`}>
                          {monthData.month}
                        </div>
                        {/* Células de cada métrica */}
                        {heatmapData.metrics.map((metric) => {
                          const score = monthData.scores[metric as keyof typeof monthData.scores];
                          const value = monthData[metric as keyof typeof monthData];

                          // Calcular cor baseada no score (0-100)
                          let bgColor = '#f3f4f6';
                          if (score > 70) bgColor = '#7AC5BF';
                          else if (score > 50) bgColor = '#93C5FD';
                          else if (score > 30) bgColor = '#FCD34D';
                          else if (score > 0) bgColor = '#FCA5A5';

                          return (
                            <div
                              key={`${monthData.month}-${metric}`}
                              className={`h-10 flex items-center justify-center mx-1 rounded-lg transition-all ${isTotal ? 'bg-gradient-to-r from-gray-50 to-white shadow-sm' : 'shadow-md hover:scale-105 cursor-pointer'}`}
                              style={{ backgroundColor: isTotal ? undefined : bgColor }}
                              title={`${metric}: ${value}${isTotal ? ' (Total do Período)' : ` (Score: ${score.toFixed(0)})`}`}
                            >
                              <span className={`text-sm font-black whitespace-nowrap ${isTotal ? 'text-gray-900' : 'text-gray-900'}`}>
                                {value}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Legenda */}
            <div className="mt-6 flex items-center justify-center gap-6 text-xs font-bold text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{backgroundColor: '#FCA5A5'}}></div>
                  <span>Crítico</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{backgroundColor: '#FCD34D'}}></div>
                  <span>Atenção</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{backgroundColor: '#93C5FD'}}></div>
                  <span>Regular</span>
                </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{backgroundColor: '#7AC5BF'}}></div>
                <span>Excelente</span>
              </div>
            </div>
          </div>
          )}
          </>
          )}

          {/* Mensagem quando Heatmap está oculto */}
          {!showHeatmap && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays size={48} className="text-gray-300 mb-3" />
              <p className="text-sm text-gray-500 font-medium">Clique em "Mostrar Heatmap" para visualizar a performance mensal</p>
              <p className="text-xs text-gray-400 mt-2">💡 O Heatmap processa dados pesados. Carregue apenas quando necessário.</p>
            </div>
          )}
        </div>
      </div>

    {/* Modal de Detalhamento de Variação */}
    {showVariationDetail && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-xl shadow-2xl w-[95vw] md:max-w-4xl md:w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-[#1B75BB] to-[#4AC8F4] p-4 rounded-t-xl flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Target size={20} />
                Detalhamento de Variação
              </h3>
              <p className="text-[10px] text-white/80 font-bold mt-0.5">
                Análise detalhada do atingimento de meta e comparações
              </p>
            </div>
            <button
              onClick={() => setShowVariationDetail(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-all"
            >
              <X size={20} className="text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Meta vs Realizado */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl border border-gray-200">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Atingimento da Meta de EBITDA (25%)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                <div>
                  <p className="text-[9px] text-gray-500 font-bold mb-0.5">Meta (25%)</p>
                  <p className="text-base font-black text-gray-900">
                    R$ {variationDetail.targetValue.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 font-bold mb-0.5">Realizado</p>
                  <p className="text-base font-black text-[#1B75BB]">
                    R$ {variationDetail.realValue.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 font-bold mb-0.5">Variação</p>
                  <p className={`text-base font-black ${variationDetail.variationFromTarget >= 0 ? 'text-[#7AC5BF]' : 'text-[#F44C00]'}`}>
                    {variationDetail.variationFromTarget >= 0 ? '+' : ''}
                    R$ {variationDetail.variationFromTarget.toLocaleString('pt-BR')}
                  </p>
                  <p className={`text-[10px] font-bold ${variationDetail.variationFromTarget >= 0 ? 'text-[#7AC5BF]' : 'text-[#F44C00]'}`}>
                    {variationDetail.variationFromTarget >= 0 ? <TrendingUp size={10} className="inline" /> : <TrendingDown size={10} className="inline" />}
                    {' '}{Math.abs(variationDetail.variationFromTargetPercent).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative">
                <div className="flex justify-between mb-1">
                  <span className="text-[9px] font-bold text-gray-600">Progresso</span>
                  <span className="text-[9px] font-black text-[#1B75BB]">
                    {variationDetail.targetReached.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      variationDetail.targetReached >= 100 ? 'bg-[#7AC5BF]' : 'bg-[#F44C00]'
                    }`}
                    style={{ width: `${Math.min(100, variationDetail.targetReached)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Comparação vs Orçado/Ano Anterior */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl border border-blue-200">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Comparação vs {comparisonMode === 'budget' ? 'Orçamento' : 'Ano Anterior'}
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[9px] text-gray-500 font-bold mb-0.5">
                    {comparisonMode === 'budget' ? 'Orçado' : 'Ano Anterior'}
                  </p>
                  <p className="text-base font-black text-gray-900">
                    R$ {variationDetail.comparisonValue.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 font-bold mb-0.5">Realizado</p>
                  <p className="text-base font-black text-[#1B75BB]">
                    R$ {variationDetail.realValue.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 font-bold mb-0.5">Variação</p>
                  <p className={`text-base font-black ${variationDetail.variationFromComparison >= 0 ? 'text-[#7AC5BF]' : 'text-[#F44C00]'}`}>
                    {variationDetail.variationFromComparison >= 0 ? '+' : ''}
                    R$ {variationDetail.variationFromComparison.toLocaleString('pt-BR')}
                  </p>
                  <p className={`text-[10px] font-bold ${variationDetail.variationFromComparison >= 0 ? 'text-[#7AC5BF]' : 'text-[#F44C00]'}`}>
                    {variationDetail.variationFromComparison >= 0 ? <TrendingUp size={10} className="inline" /> : <TrendingDown size={10} className="inline" />}
                    {' '}{Math.abs(variationDetail.variationFromComparisonPercent).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Breakdown por tipo de custo */}
            <div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Detalhamento por Categoria vs {comparisonMode === 'budget' ? 'Orçamento' : 'Ano Anterior'}
              </h4>
              <div className="space-y-2">
                {[
                  { label: 'Receita', data: variationDetail.breakdown.revenue, positive: true },
                  { label: 'Custos Variáveis', data: variationDetail.breakdown.variableCosts, positive: false },
                  { label: 'Custos Fixos', data: variationDetail.breakdown.fixedCosts, positive: false },
                  { label: 'SG&A', data: variationDetail.breakdown.sgaCosts, positive: false },
                  { label: 'Rateio', data: variationDetail.breakdown.rateioCosts, positive: false }
                ].map((item) => {
                  const variationPercent = item.data.comparison !== 0
                    ? ((item.data.diff / Math.abs(item.data.comparison)) * 100)
                    : 0;
                  const isGood = item.positive
                    ? item.data.diff >= 0
                    : item.data.diff <= 0;

                  return (
                    <div key={item.label} className="bg-white p-2.5 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-black text-gray-900">{item.label}</span>
                        <span className={`text-[11px] font-black ${isGood ? 'text-[#7AC5BF]' : 'text-[#F44C00]'}`}>
                          {item.data.diff >= 0 ? '+' : ''}
                          R$ {item.data.diff.toLocaleString('pt-BR')}
                          {' '}({Math.abs(variationPercent).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex gap-3 text-[9px]">
                        <div>
                          <span className="text-gray-500">Real: </span>
                          <span className="font-bold">R$ {item.data.real.toLocaleString('pt-BR')}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">{comparisonMode === 'budget' ? 'Orçado' : 'Ano Ant.'}: </span>
                          <span className="font-bold">R$ {item.data.comparison.toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 p-3 rounded-b-xl border-t border-gray-200 flex justify-end">
            <button
              onClick={() => setShowVariationDetail(false)}
              className="px-4 py-2 bg-[#1B75BB] text-white rounded-lg font-black text-[11px] uppercase tracking-wider hover:bg-[#145a94] transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Modal de Detalhamento dos Alertas */}
    {showAlertsDetail && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-xl shadow-2xl w-[95vw] md:max-w-5xl md:w-full max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#F44C00] to-[#FF6B35] p-3 rounded-t-xl flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <AlertCircle size={18} />
                Análise de Alertas
              </h3>
              <p className="text-[9px] text-white/80 font-bold mt-0.5">
                Detalhamento completo dos indicadores que requerem atenção
              </p>
            </div>
            <button
              onClick={() => setShowAlertsDetail(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-all"
            >
              <X size={18} className="text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-3 space-y-2 overflow-y-auto flex-1">
            {/* Resumo Executivo */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200 flex-shrink-0">
              <h4 className="text-xs font-black text-gray-900 mb-2 uppercase tracking-wide">
                Resumo Executivo
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-xl font-black text-red-600">
                    {[
                      enhancedKpis.defaultRate > 10 ? 1 : 0,
                      enhancedKpis.teacherCostPercent > 40 ? 1 : 0,
                      enhancedKpis.energyPerClassroom > 1000 ? 1 : 0,
                      enhancedKpis.netMargin < 15 ? 1 : 0,
                      enhancedKpis.maintenancePercent > 8 ? 1 : 0
                    ].reduce((a, b) => a + b, 0)}
                  </div>
                  <p className="text-[9px] text-gray-600 font-bold">Críticos</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-black text-yellow-600">
                    {[
                      enhancedKpis.defaultRate > 5 && enhancedKpis.defaultRate <= 10 ? 1 : 0,
                      enhancedKpis.teacherCostPercent > 38 && enhancedKpis.teacherCostPercent <= 40 ? 1 : 0,
                      enhancedKpis.energyPerClassroom > 800 && enhancedKpis.energyPerClassroom <= 1000 ? 1 : 0,
                      enhancedKpis.netMargin >= 15 && enhancedKpis.netMargin < 25 ? 1 : 0,
                      enhancedKpis.maintenancePercent > 5 && enhancedKpis.maintenancePercent <= 8 ? 1 : 0
                    ].reduce((a, b) => a + b, 0)}
                  </div>
                  <p className="text-[9px] text-gray-600 font-bold">Atenção</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-black text-green-600">
                    {[
                      enhancedKpis.defaultRate <= 5 ? 1 : 0,
                      enhancedKpis.teacherCostPercent <= 38 ? 1 : 0,
                      enhancedKpis.energyPerClassroom <= 800 ? 1 : 0,
                      enhancedKpis.netMargin >= 25 ? 1 : 0,
                      enhancedKpis.maintenancePercent <= 5 ? 1 : 0
                    ].reduce((a, b) => a + b, 0)}
                  </div>
                  <p className="text-[9px] text-gray-600 font-bold">OK</p>
                </div>
              </div>
            </div>

            {/* Detalhamento dos Alertas - Ordenados por Criticidade */}
            <div className="space-y-2">
              {(() => {
                // Criar array de alertas com criticidade
                const alerts = [
                  {
                    name: 'Inadimplência',
                    value: enhancedKpis.defaultRate.toFixed(1) + '%',
                    numericValue: enhancedKpis.defaultRate,
                    meta: '≤ 5%',
                    status: enhancedKpis.defaultRate > 10 ? 'Acima do aceitável' : enhancedKpis.defaultRate > 5 ? 'Requer atenção' : 'Dentro da meta',
                    action: enhancedKpis.defaultRate > 5 ? 'Implementar campanha de recuperação de crédito e revisar políticas de cobrança.' : null,
                    criticality: enhancedKpis.defaultRate > 10 ? 0 : enhancedKpis.defaultRate > 5 ? 1 : 2,
                    additionalInfo: null
                  },
                  {
                    name: 'Custo de Professores',
                    value: enhancedKpis.teacherCostPercent.toFixed(1) + '%',
                    numericValue: enhancedKpis.teacherCostPercent,
                    meta: '≤ 38% da receita',
                    status: null,
                    action: enhancedKpis.teacherCostPercent > 38 ? 'Otimizar quadro docente e revisar carga horária.' : null,
                    criticality: enhancedKpis.teacherCostPercent > 40 ? 0 : enhancedKpis.teacherCostPercent > 38 ? 1 : 2,
                    additionalInfo: 'R$ ' + enhancedKpis.teacherCost.toLocaleString('pt-BR')
                  },
                  {
                    name: 'Energia por Sala',
                    value: 'R$ ' + enhancedKpis.energyPerClassroom.toFixed(0),
                    numericValue: enhancedKpis.energyPerClassroom,
                    meta: '≤ R$ 800/sala',
                    status: null,
                    action: enhancedKpis.energyPerClassroom > 800 ? 'Implementar medidas de eficiência energética e revisar uso de climatização.' : null,
                    criticality: enhancedKpis.energyPerClassroom > 1000 ? 0 : enhancedKpis.energyPerClassroom > 800 ? 1 : 2,
                    additionalInfo: enhancedKpis.numberOfClassrooms + ' salas'
                  },
                  {
                    name: 'Margem EBITDA',
                    value: enhancedKpis.netMargin.toFixed(1) + '%',
                    numericValue: enhancedKpis.netMargin,
                    meta: '≥ 25%',
                    status: null,
                    action: enhancedKpis.netMargin < 15 ? 'Plano de recuperação urgente necessário.' : enhancedKpis.netMargin < 25 ? 'Revisar estrutura de custos e oportunidades de receita.' : null,
                    criticality: enhancedKpis.netMargin < 15 ? 0 : enhancedKpis.netMargin < 25 ? 1 : 2,
                    additionalInfo: 'R$ ' + enhancedKpis.ebitda.toLocaleString('pt-BR')
                  },
                  {
                    name: 'Manutenção',
                    value: enhancedKpis.maintenancePercent.toFixed(1) + '%',
                    numericValue: enhancedKpis.maintenancePercent,
                    meta: '≤ 5% da receita',
                    status: null,
                    action: enhancedKpis.maintenancePercent > 5 ? 'Revisar contratos de manutenção e implementar manutenção preventiva.' : null,
                    criticality: enhancedKpis.maintenancePercent > 8 ? 0 : enhancedKpis.maintenancePercent > 5 ? 1 : 2,
                    additionalInfo: 'R$ ' + enhancedKpis.maintenanceCost.toLocaleString('pt-BR')
                  }
                ];

                // Ordenar por criticidade (0=crítico, 1=atenção, 2=ok)
                alerts.sort((a, b) => a.criticality - b.criticality);

                // Renderizar os cards ordenados
                return alerts.map((alert, index) => (
                  <div key={index} className={`p-3 rounded-lg border-2 ${
                    alert.criticality === 0 ? 'bg-red-50 border-red-200' :
                    alert.criticality === 1 ? 'bg-yellow-50 border-yellow-200' :
                    'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          alert.criticality === 0 ? 'bg-red-500' :
                          alert.criticality === 1 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`} />
                        <h5 className="text-xs font-black text-gray-900">{alert.name}</h5>
                      </div>
                      <span className={`text-base font-black ${
                        alert.criticality === 0 ? 'text-red-600' :
                        alert.criticality === 1 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {alert.value}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <p className="text-gray-600 font-medium">Meta:</p>
                        <p className="font-black text-gray-900">{alert.meta}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">{alert.status ? 'Status:' : 'Valor:'}</p>
                        <p className="font-black text-gray-900">{alert.status || alert.additionalInfo}</p>
                      </div>
                    </div>
                    {alert.action && (
                      <div className="mt-2 p-2 bg-white/60 rounded">
                        <p className="text-[9px] font-bold text-gray-700">
                          <span className="text-[#F44C00]">⚡ Ação:</span> {alert.action}
                        </p>
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-2 rounded-b-xl border-t border-gray-200 flex justify-end flex-shrink-0">
            <button
              onClick={() => setShowAlertsDetail(false)}
              className="px-4 py-2 bg-[#F44C00] text-white rounded-lg font-black text-[10px] uppercase tracking-wider hover:bg-[#d63e00] transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Modal: Breakdown Receita Líquida */}
    {showRevenueBreakdown && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1B75BB] to-[#1557BB] p-6 rounded-t-2xl flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Target size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Breakdown Receita Líquida</h2>
                  <p className="text-sm text-white/80 mt-1">Composição detalhada por tag01</p>
                </div>
              </div>
              <button
                onClick={() => setShowRevenueBreakdown(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all text-white"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-auto flex-1">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-3 text-xs font-black text-gray-600 uppercase">Tag01</th>
                    <th
                      className="text-right p-3 text-xs font-black text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => {
                        setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                        setReceitaBreakdown(prev => [...prev].sort((a, b) =>
                          sortOrder === 'desc' ? Math.abs(a.real) - Math.abs(b.real) : Math.abs(b.real) - Math.abs(a.real)
                        ));
                      }}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Real</span>
                        {sortOrder === 'desc' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                      </div>
                    </th>
                    <th className="text-right p-3 text-xs font-black text-gray-400 uppercase">Orçado</th>
                    <th className="text-right p-3 text-xs font-black text-gray-400 uppercase">A-1</th>
                    <th className="text-right p-3 text-xs font-black text-gray-400 uppercase">Δ R$ Orç.</th>
                    <th className="text-right p-3 text-xs font-black text-gray-400 uppercase">Δ % Orç.</th>
                    <th className="text-right p-3 text-xs font-black text-gray-400 uppercase">Δ R$ A-1</th>
                    <th className="text-right p-3 text-xs font-black text-gray-400 uppercase">Δ % A-1</th>
                  </tr>
                </thead>
                <tbody>
                  {receitaBreakdown.map((item, idx) => {
                    const deltaOrcado = item.real - item.orcado;
                    const deltaPercOrcado = item.orcado !== 0 ? (deltaOrcado / Math.abs(item.orcado)) * 100 : 0;
                    const deltaA1 = item.real - item.a1;
                    const deltaPercA1 = item.a1 !== 0 ? (deltaA1 / Math.abs(item.a1)) * 100 : 0;
                    const isExpanded = expandedTag01s.has(item.tag01);

                    return (
                      <React.Fragment key={idx}>
                        {/* Linha principal - tag01 */}
                        <tr
                          className={`border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer ${item.real === 0 ? 'opacity-40' : ''}`}
                          onClick={() => {
                            setExpandedTag01s(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(item.tag01)) {
                                newSet.delete(item.tag01);
                              } else {
                                newSet.add(item.tag01);
                              }
                              return newSet;
                            });
                          }}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <ChevronRight
                                size={16}
                                className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              />
                              <span className="text-sm font-bold text-gray-700">{item.tag01}</span>
                              {item.real === 0 && (
                                <span className="text-xs text-orange-600 font-bold">⚠️ SEM DADOS</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5 ml-6">
                              {item.txCount.toLocaleString('pt-BR')} transações • {item.tag02s.length} subcategorias
                            </div>
                          </td>
                          <td className={`p-3 text-right text-sm font-black ${item.real >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {item.real === 0 ? '—' : `R$ ${item.real.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                          </td>
                          <td className={`p-3 text-right text-sm ${item.orcado === 0 ? 'text-gray-300' : 'font-semibold text-gray-600'}`}>
                            {item.orcado === 0 ? '—' : `R$ ${item.orcado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                          </td>
                          <td className={`p-3 text-right text-sm ${item.a1 === 0 ? 'text-gray-300' : 'font-semibold text-gray-600'}`}>
                            {item.a1 === 0 ? '—' : `R$ ${item.a1.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                          </td>
                          <td className={`p-3 text-right text-xs ${item.orcado === 0 ? 'text-gray-300' : deltaOrcado >= 0 ? 'text-teal-600 font-bold' : 'text-orange-600 font-bold'}`}>
                            {item.orcado === 0 ? '—' : `R$ ${deltaOrcado.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                          </td>
                          <td className={`p-3 text-right text-xs ${item.orcado === 0 ? 'text-gray-300' : deltaOrcado >= 0 ? 'text-teal-600 font-bold' : 'text-orange-600 font-bold'}`}>
                            {item.orcado === 0 ? '—' : `${deltaPercOrcado >= 0 ? '+' : ''}${deltaPercOrcado.toFixed(1)}%`}
                          </td>
                          <td className={`p-3 text-right text-xs ${item.a1 === 0 ? 'text-gray-300' : deltaA1 >= 0 ? 'text-teal-600 font-bold' : 'text-orange-600 font-bold'}`}>
                            {item.a1 === 0 ? '—' : `R$ ${deltaA1.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                          </td>
                          <td className={`p-3 text-right text-xs ${item.a1 === 0 ? 'text-gray-300' : deltaA1 >= 0 ? 'text-teal-600 font-bold' : 'text-orange-600 font-bold'}`}>
                            {item.a1 === 0 ? '—' : `${deltaPercA1 >= 0 ? '+' : ''}${deltaPercA1.toFixed(1)}%`}
                          </td>
                        </tr>

                        {/* Linhas expandidas - tag02 */}
                        {isExpanded && item.tag02s.map((tag02Item, tag02Idx) => {
                          const tag02DeltaOrc = tag02Item.real - tag02Item.orcado;
                          const tag02DeltaPercOrc = tag02Item.orcado !== 0 ? (tag02DeltaOrc / Math.abs(tag02Item.orcado)) * 100 : 0;
                          const tag02DeltaA1 = tag02Item.real - tag02Item.a1;
                          const tag02DeltaPercA1 = tag02Item.a1 !== 0 ? (tag02DeltaA1 / Math.abs(tag02Item.a1)) * 100 : 0;

                          return (
                            <tr
                              key={`${idx}-${tag02Idx}`}
                              className="border-b border-gray-50 bg-gray-50 hover:bg-blue-50/50 transition-colors"
                            >
                              <td className="p-3 pl-12">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-600">{tag02Item.tag02}</span>
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5">
                                  {tag02Item.txCount.toLocaleString('pt-BR')} tx
                                </div>
                              </td>
                              <td className={`p-3 text-right text-xs font-semibold ${tag02Item.real >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                                {tag02Item.real === 0 ? '—' : `R$ ${tag02Item.real.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                              </td>
                              <td className={`p-3 text-right text-xs ${tag02Item.orcado === 0 ? 'text-gray-300' : 'text-gray-500'}`}>
                                {tag02Item.orcado === 0 ? '—' : `R$ ${tag02Item.orcado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                              </td>
                              <td className={`p-3 text-right text-xs ${tag02Item.a1 === 0 ? 'text-gray-300' : 'text-gray-500'}`}>
                                {tag02Item.a1 === 0 ? '—' : `R$ ${tag02Item.a1.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                              </td>
                              <td className={`p-3 text-right text-xs ${tag02Item.orcado === 0 ? 'text-gray-300' : tag02DeltaOrc >= 0 ? 'text-teal-500' : 'text-orange-500'}`}>
                                {tag02Item.orcado === 0 ? '—' : `R$ ${tag02DeltaOrc.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                              </td>
                              <td className={`p-3 text-right text-xs ${tag02Item.orcado === 0 ? 'text-gray-300' : tag02DeltaOrc >= 0 ? 'text-teal-500' : 'text-orange-500'}`}>
                                {tag02Item.orcado === 0 ? '—' : `${tag02DeltaPercOrc >= 0 ? '+' : ''}${tag02DeltaPercOrc.toFixed(1)}%`}
                              </td>
                              <td className={`p-3 text-right text-xs ${tag02Item.a1 === 0 ? 'text-gray-300' : tag02DeltaA1 >= 0 ? 'text-teal-500' : 'text-orange-500'}`}>
                                {tag02Item.a1 === 0 ? '—' : `R$ ${tag02DeltaA1.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                              </td>
                              <td className={`p-3 text-right text-xs ${tag02Item.a1 === 0 ? 'text-gray-300' : tag02DeltaA1 >= 0 ? 'text-teal-500' : 'text-orange-500'}`}>
                                {tag02Item.a1 === 0 ? '—' : `${tag02DeltaPercA1 >= 0 ? '+' : ''}${tag02DeltaPercA1.toFixed(1)}%`}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                  {/* Linha de Total */}
                  <tr className="border-t-2 border-gray-300 bg-blue-50">
                    <td className="p-3 text-sm font-black text-gray-800 uppercase">TOTAL</td>
                    <td className="p-3 text-right text-base font-black text-blue-600">
                      {(() => {
                        const totalReal = receitaBreakdown.reduce((sum, item) => sum + item.real, 0);
                        return totalReal === 0 ? '—' : `R$ ${totalReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                      })()}
                    </td>
                    <td className="p-3 text-right text-base font-semibold text-gray-600">
                      {(() => {
                        const totalOrcado = receitaBreakdown.reduce((sum, item) => sum + item.orcado, 0);
                        return totalOrcado === 0 ? '—' : `R$ ${totalOrcado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                      })()}
                    </td>
                    <td className="p-3 text-right text-base font-semibold text-gray-600">
                      {(() => {
                        const totalA1 = receitaBreakdown.reduce((sum, item) => sum + item.a1, 0);
                        return totalA1 === 0 ? '—' : `R$ ${totalA1.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                      })()}
                    </td>
                    <td className="p-3 text-right text-sm font-bold text-gray-700">
                      {(() => {
                        const totalReal = receitaBreakdown.reduce((sum, item) => sum + item.real, 0);
                        const totalOrcado = receitaBreakdown.reduce((sum, item) => sum + item.orcado, 0);
                        const diff = totalReal - totalOrcado;
                        return totalOrcado === 0 ? '—' : `R$ ${diff.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;
                      })()}
                    </td>
                    <td className="p-3 text-right text-sm font-bold text-gray-700">
                      {(() => {
                        const totalReal = receitaBreakdown.reduce((sum, item) => sum + item.real, 0);
                        const totalOrcado = receitaBreakdown.reduce((sum, item) => sum + item.orcado, 0);
                        const percChange = totalOrcado === 0 ? 0 : ((totalReal / totalOrcado - 1) * 100);
                        return totalOrcado === 0 ? '—' : `${percChange.toFixed(1)}%`;
                      })()}
                    </td>
                    <td className="p-3 text-right text-sm text-gray-300">—</td>
                    <td className="p-3 text-right text-sm text-gray-300">—</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Legenda */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-start gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700">Observações</p>
                  <ul className="text-xs text-gray-600 mt-2 space-y-1 list-disc list-inside">
                    <li>✅ Dados buscados da DRE usando tag0 "01." (mesma lógica do card)</li>
                    <li>📊 Todas as tag01 que compõem a receita líquida estão listadas</li>
                    <li>💰 Total do breakdown = Total do card (valores idênticos)</li>
                    <li>🔢 Valores negativos (vermelho) = deduções da receita (tributos, devoluções)</li>
                    <li>📈 Deltas calculados vs Orçado quando disponível</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-4 rounded-b-2xl border-t border-gray-200 flex justify-end flex-shrink-0">
            <button
              onClick={() => setShowRevenueBreakdown(false)}
              className="px-6 py-3 bg-[#1B75BB] text-white rounded-lg font-black text-xs uppercase tracking-wider hover:bg-[#1557BB] transition-all shadow-lg"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
    </div>
    </>
  );
};

const KPICard = ({ label, value, trend, trendAbsolute, isPercent, isNumber, color, icon, variationType = 'vs Orçado', onClick }: any) => {
  const colorMaps: any = {
    blue: 'text-[#1B75BB] bg-blue-50',
    orange: 'text-[#F44C00] bg-orange-50',
    amber: 'text-[#F44C00] bg-orange-50',
    teal: 'text-[#7AC5BF] bg-teal-50',
    purple: 'text-purple-600 bg-purple-50',
  };

  // Formatação com "." como separador de milhares e sem decimais para valores >= 1000
  const formatNumber = (num: number) => {
    const absNum = Math.abs(num);
    if (absNum >= 1000) {
      return num.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formattedValue = useMemo(() => {
    if (isNumber) return formatNumber(value);
    return isPercent ? `${formatNumber(value)}%` : `R$ ${formatNumber(value)}`;
  }, [value, isPercent, isNumber]);

  const formattedTrendAbsolute = useMemo(() => {
    if (trendAbsolute === undefined) return null;
    if (isNumber) return formatNumber(Math.abs(trendAbsolute));
    return `R$ ${formatNumber(Math.abs(trendAbsolute))}`;
  }, [trendAbsolute, isNumber]);

  return (
    <div
      className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-1.5">
          {icon && <div className={`p-1.5 rounded-lg ${colorMaps[color]}`}>{icon}</div>}
          <span className="text-[8px] font-black text-[#636363] uppercase tracking-widest">{label}</span>
        </div>
        {trend !== undefined && (
          <div className="flex flex-col items-end gap-0.5">
            <div className={`px-2 py-1 rounded text-[11px] font-black flex items-center gap-1 ${trend > 0 ? 'bg-teal-50 text-[#7AC5BF]' : 'bg-orange-50 text-[#F44C00]'}`}>
              {trend > 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
              {formattedTrendAbsolute && <span>{formattedTrendAbsolute} | </span>}
              {Math.abs(trend).toFixed(1)}%
            </div>
            <span className="text-[7px] font-bold text-gray-400 uppercase tracking-wider">{variationType}</span>
          </div>
        )}
      </div>
      <p className={`text-2xl font-black tracking-tighter ${colorMaps[color].split(' ')[0]}`}>
        {formattedValue}
      </p>
    </div>
  );
};

const ConsumptionCard: React.FC<{
  label: string;
  value: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}> = ({ label, value, desc, icon, color, trend }) => {
  const colorClasses: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    amber: 'text-amber-600 bg-amber-50 border-amber-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    rose: 'text-rose-600 bg-rose-50 border-rose-200'
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
        </div>
        {trend !== undefined && (
          <div className={`px-2 py-1 rounded text-[11px] font-black flex items-center gap-1 ${trend > 0 ? 'bg-orange-50 text-[#F44C00]' : 'bg-teal-50 text-[#7AC5BF]'}`}>
            {trend > 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-black text-gray-900 mb-0.5">{value}</p>
      <p className="text-[8px] text-gray-400 font-bold">{desc}</p>
    </div>
  );
};

// Multi-Select Filter Component
interface MultiSelectFilterProps {
  label: string;
  icon: React.ReactNode;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  colorScheme: 'blue' | 'orange';
}

const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  label,
  icon,
  options,
  selected,
  onChange,
  colorScheme
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const colors = {
    blue: {
      border: 'border-[#1B75BB]',
      borderLight: 'border-gray-100',
      bg: 'bg-[#1B75BB]',
      bgLight: 'bg-blue-50',
      text: 'text-[#1B75BB]',
      ring: 'ring-[#1B75BB]/10'
    },
    orange: {
      border: 'border-[#F44C00]',
      borderLight: 'border-gray-100',
      bg: 'bg-[#F44C00]',
      bgLight: 'bg-orange-50',
      text: 'text-[#F44C00]',
      ring: 'ring-[#F44C00]/10'
    }
  };

  const scheme = colors[colorScheme];
  const hasSelection = selected.length > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const selectAll = () => {
    onChange(options);
  };

  const clearAll = () => {
    onChange([]);
  };

  const displayText = selected.length === 0
    ? 'TODAS'
    : selected.length === 1
    ? selected[0].toUpperCase()
    : `${selected.length} SELECIONADAS`;

  return (
    <div ref={dropdownRef} className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 bg-white px-4 h-[52px] rounded-lg border-2 shadow-sm transition-all cursor-pointer hover:shadow-md ${
          hasSelection ? `${scheme.border} ring-4 ${scheme.ring}` : scheme.borderLight
        }`}
      >
        <div className={`p-1.5 rounded-lg ${hasSelection ? `${scheme.bg} text-white` : `${scheme.bgLight} ${scheme.text}`}`}>
          {icon}
        </div>
        <div className="flex flex-col justify-center">
          <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">{label}</span>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-[10px] uppercase tracking-tight text-gray-900 min-w-[120px]">
              {displayText}
            </span>
            <ChevronDown size={12} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-lg border-2 border-gray-200 shadow-xl z-50 min-w-[240px] max-h-[400px] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header with actions */}
          <div className="p-2 border-b border-gray-100 flex gap-2">
            <button
              onClick={selectAll}
              className="flex-1 px-2 py-1.5 text-[9px] font-black uppercase bg-gray-100 hover:bg-gray-200 rounded transition-all"
            >
              Selecionar Todas
            </button>
            <button
              onClick={clearAll}
              className="flex-1 px-2 py-1.5 text-[9px] font-black uppercase bg-gray-100 hover:bg-gray-200 rounded transition-all"
            >
              Limpar
            </button>
          </div>

          {/* Options list */}
          <div className="overflow-y-auto flex-1">
            {options.map((option) => {
              const isSelected = selected.includes(option);
              return (
                <label
                  key={option}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? `${scheme.border} ${scheme.bg}`
                      : 'border-gray-300'
                  }`}>
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOption(option)}
                    className="sr-only"
                  />
                  <span className="text-xs font-bold text-gray-900">{option}</span>
                </label>
              );
            })}
          </div>

          {/* Footer with count */}
          <div className="p-2 border-t border-gray-100 bg-gray-50">
            <span className="text-[9px] font-bold text-gray-600">
              {selected.length} de {options.length} selecionada(s)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;