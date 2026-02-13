import { supabase, DatabaseTransaction, DatabaseManualChange } from '../supabase';
import { Transaction, ManualChange, PaginationParams, PaginatedResponse, ContaContabilOption } from '../types';
import { addPermissionFiltersToObject, applyPermissionFilters } from './permissionsService';

// Converter Transaction do app para formato do banco
// Remove campos que não existem na tabela: ticket, vendor, recurring, justification
const transactionToDb = (t: Transaction): DatabaseTransaction => {
  const dbTransaction: any = {
    id: t.id,
    date: t.date,
    description: t.description,
    conta_contabil: t.conta_contabil,  // Campo que popula coluna "Conta" na UI
    amount: t.amount,
    type: t.type,
    scenario: t.scenario || 'Orçado',
    status: t.status,
    filial: t.filial
  };

  // Adicionar campos opcionais apenas se existirem
  if (t.category) dbTransaction.category = t.category;  // Reservado para futuro
  if (t.marca) dbTransaction.marca = t.marca;
  // tag0 NÃO existe na tabela transactions (resolvido via tag0_map JOIN)
  if (t.tag01) dbTransaction.tag01 = t.tag01;
  if (t.tag02) dbTransaction.tag02 = t.tag02;
  if (t.tag03) dbTransaction.tag03 = t.tag03;
  if (t.recurring) dbTransaction.recurring = t.recurring;
  if (t.ticket) dbTransaction.ticket = t.ticket;
  if (t.vendor) dbTransaction.vendor = t.vendor;
  if (t.nat_orc) dbTransaction.nat_orc = t.nat_orc;
  if (t.chave_id) dbTransaction.chave_id = t.chave_id;

  return dbTransaction;
};

// Converter Transaction do banco para formato do app
const dbToTransaction = (db: DatabaseTransaction): Transaction => ({
  id: db.id,
  date: db.date,
  description: db.description,
  conta_contabil: db.conta_contabil,  // Campo que popula coluna "Conta" na UI
  category: db.category || undefined,  // Reservado para futuro
  amount: db.amount,
  type: db.type as any,
  scenario: db.scenario,
  status: db.status,
  filial: db.filial,
  marca: db.marca || undefined,
  tag0: db.tag0 || undefined,
  tag01: db.tag01 || undefined,
  tag02: db.tag02 || undefined,
  tag03: db.tag03 || undefined,
  recurring: db.recurring || undefined,  // Mantém o valor do banco (comparação case-insensitive no filtro)
  ticket: db.ticket || undefined,
  vendor: db.vendor || undefined,
  nat_orc: db.nat_orc || undefined,
  chave_id: db.chave_id || undefined,
  nome_filial: db.nome_filial || undefined,
  updated_at: db.updated_at || new Date().toISOString()  // Campo obrigatório para sync
});

// Converter ManualChange para formato do banco
const manualChangeToDb = (mc: ManualChange): DatabaseManualChange => {
  // Extrair justificativa - se não estiver direta, tentar extrair do newValue (para RATEIO)
  let justification = mc.justification || mc.description || '';

  console.log('🔄 manualChangeToDb - Justification inicial:', {
    mcJustification: mc.justification,
    mcDescription: mc.description,
    justification
  });

  // Para RATEIO, a justificativa pode estar dentro do JSON do newValue
  if (!justification && mc.type === 'RATEIO') {
    try {
      const parsed = JSON.parse(mc.newValue);
      justification = parsed.justification || '';
      console.log('🔄 manualChangeToDb - Justification extraída do newValue:', justification);
    } catch (e) {
      console.warn('⚠️ manualChangeToDb - Falha ao fazer parsing do newValue:', e);
    }
  }

  const finalJustification = justification || 'Sem justificativa';
  console.log('✅ manualChangeToDb - Justification final:', finalJustification);

  return {
    id: mc.id,
    transaction_id: mc.transactionId,
    type: mc.type,
    field_changed: mc.fieldChanged || null,
    old_value: mc.oldValue || null,
    new_value: mc.newValue,
    justification: finalJustification,  // Garantir que nunca seja vazio
    status: mc.status,
    requested_at: mc.requestedAt,
    requested_by: mc.requestedBy,
    requested_by_name: mc.requestedByName,
    approved_at: mc.approvedAt || null,
    approved_by: mc.approvedBy || null,
    approved_by_name: mc.approvedByName,
    original_transaction: mc.originalTransaction
  };
};

// Converter ManualChange do banco para formato do app
const dbToManualChange = (db: DatabaseManualChange): ManualChange => ({
  id: db.id,
  transactionId: db.transaction_id,
  type: db.type as any,
  description: db.justification,  // Mapear justification para description
  fieldChanged: db.field_changed || undefined,
  oldValue: db.old_value || '',
  newValue: db.new_value,
  justification: db.justification,
  status: db.status as any,
  requestedAt: db.requested_at,
  requestedBy: db.requested_by,
  requestedByName: db.requested_by_name,
  approvedAt: db.approved_at || undefined,
  approvedBy: db.approved_by || undefined,
  approvedByName: db.approved_by_name,
  originalTransaction: db.original_transaction
});

// ========== LOOKUP TABLES (Filial + Tags) ==========

export interface FilialOption {
  cia: string;          // marca
  filialCodes: string[]; // todos os códigos de filial para esse grupo (vincula com transactions.filial)
  nomefilial: string;   // nome
  label: string;        // "CIA - NomeFilial" (pré-computado, unique)
}

export interface TagRecord {
  tag1: string;
  tag2: string;
  tag3: string;
}

// ========== TAG0 MAP (tag01 → tag0) ==========

export interface Tag0MapEntry {
  tag1_norm: string;
  tag0: string;
  tag1_raw: string;
}

let cachedTag0Map: Map<string, string> | null = null;

/**
 * Carrega tag0_map do Supabase e retorna Map<tag01_normalizado, tag0>
 * Normaliza: lowercase + trim para matching robusto
 */
export const getTag0Map = async (): Promise<Map<string, string>> => {
  if (cachedTag0Map) return cachedTag0Map;

  console.log('🏷️ Carregando tag0_map...');
  const { data, error } = await supabase
    .from('tag0_map')
    .select('tag1_norm, tag0, tag1_raw');

  if (error) {
    console.error('❌ Erro ao carregar tag0_map:', error);
    return new Map();
  }

  cachedTag0Map = new Map();
  for (const row of data || []) {
    // Mapear tanto pela versão normalizada quanto pela raw
    if (row.tag1_norm) cachedTag0Map.set(row.tag1_norm.toLowerCase().trim(), row.tag0);
    if (row.tag1_raw) cachedTag0Map.set(row.tag1_raw.toLowerCase().trim(), row.tag0);
  }

  console.log(`✅ ${cachedTag0Map.size} entradas de tag0_map carregadas`);
  return cachedTag0Map;
};

/**
 * Resolve tag0 a partir de tag01 usando o tag0_map cacheado
 */
export const resolveTag0 = (tag01: string | undefined | null, tag0Map: Map<string, string>): string | undefined => {
  if (!tag01 || tag0Map.size === 0) return undefined;
  const normalized = tag01.toLowerCase().trim();
  return tag0Map.get(normalized);
};

// Cache em variável do módulo (evita re-fetch desnecessário)
let cachedFiliais: FilialOption[] | null = null;
let cachedTagRecords: TagRecord[] | null = null;

export const getFiliais = async (): Promise<FilialOption[]> => {
  if (cachedFiliais) return cachedFiliais;

  console.log('🏢 Carregando tabela filial...');
  const { data, error } = await supabase
    .from('filial')
    .select('cia, filial, nomefilial')
    .order('cia', { ascending: true })
    .order('nomefilial', { ascending: true });

  if (error) {
    console.error('❌ Erro ao carregar filiais:', error);
    return [];
  }

  // Agrupar por cia+nomefilial (label) → coletar todos os códigos de filial do grupo
  const groupMap = new Map<string, FilialOption>();
  for (const row of data || []) {
    const cia = row.cia || '';
    const nomefilial = row.nomefilial || '';
    const filialCode = row.filial || '';
    const label = `${cia} - ${nomefilial}`;

    if (!filialCode) continue;

    const existing = groupMap.get(label);
    if (existing) {
      if (!existing.filialCodes.includes(filialCode)) {
        existing.filialCodes.push(filialCode);
      }
    } else {
      groupMap.set(label, { cia, filialCodes: [filialCode], nomefilial, label });
    }
  }
  cachedFiliais = Array.from(groupMap.values());

  console.log(`✅ ${cachedFiliais.length} filiais carregadas (agrupadas por cia+nome)`);
  return cachedFiliais;
};

export const getTagRecords = async (): Promise<TagRecord[]> => {
  if (cachedTagRecords) return cachedTagRecords;

  console.log('🏷️ Carregando combinações de tags de transactions...');

  // Buscar DISTINCT tag01/tag02/tag03 direto da tabela transactions
  // (tabela tags está vazia — os dados vivem em transactions)
  const { data, error } = await supabase
    .from('transactions')
    .select('tag01, tag02, tag03')
    .not('tag01', 'is', null);

  if (error) {
    console.error('❌ Erro ao carregar tags:', error);
    return [];
  }

  // Extrair combinações únicas
  const seen = new Set<string>();
  cachedTagRecords = [];
  for (const row of data || []) {
    const key = `${row.tag01 || ''}|${row.tag02 || ''}|${row.tag03 || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      cachedTagRecords.push({
        tag1: row.tag01 || '',
        tag2: row.tag02 || '',
        tag3: row.tag03 || ''
      });
    }
  }

  console.log(`✅ ${cachedTagRecords.length} combinações de tags carregadas`);
  return cachedTagRecords;
};

// ========== DRE AGGREGATED DATA (RPC) ==========

export interface DRESummaryRow {
  scenario: string;
  conta_contabil: string;
  year_month: string;  // 'YYYY-MM'
  tag0: string;
  tag01: string;
  tag02: string;
  tag03: string;
  tipo: string;        // type (REVENUE, FIXED_COST, etc.)
  total_amount: number;
  tx_count: number;
}

export interface DREDimensionRow {
  dimension_value: string;
  year_month: string;
  total_amount: number;
}

export interface DREFilterOptions {
  marcas: string[];
  nome_filiais: string[];
  tags01: string[];
}

/**
 * Buscar resumo DRE agregado no servidor (1 API call, ~500-2000 linhas)
 * Substitui o carregamento de 119k transações brutas
 */
export const getDRESummary = async (params: {
  monthFrom?: string;
  monthTo?: string;
  marcas?: string[];
  nomeFiliais?: string[];
  tags01?: string[];
}): Promise<DRESummaryRow[]> => {
  console.log('📊 getDRESummary: Buscando dados agregados...', params);

  const { data, error } = await supabase.rpc('get_dre_summary', {
    p_month_from: params.monthFrom || null,
    p_month_to: params.monthTo || null,
    p_marcas: params.marcas && params.marcas.length > 0 ? params.marcas : null,
    p_nome_filiais: params.nomeFiliais && params.nomeFiliais.length > 0 ? params.nomeFiliais : null,
    p_tags01: params.tags01 && params.tags01.length > 0 ? params.tags01 : null,
  });

  if (error) {
    console.error('❌ Erro ao buscar DRE summary:', error);
    return [];
  }

  console.log(`✅ getDRESummary: ${data?.length || 0} linhas agregadas retornadas`);
  return (data || []) as DRESummaryRow[];
};

/**
 * Calcular Receita Líquida usando a mesma lógica da DRE
 * Soma todos os valores onde tag0 começa com "01." (Receita)
 */
export const getReceitaLiquidaDRE = async (params: {
  monthFrom?: string;
  monthTo?: string;
  marcas?: string[];
  nomeFiliais?: string[];
  scenario?: string;
}): Promise<number> => {
  console.log('💰 getReceitaLiquidaDRE: Calculando receita líquida...', params);

  // Buscar dados agregados usando getDRESummary
  const summaryRows = await getDRESummary({
    monthFrom: params.monthFrom,
    monthTo: params.monthTo,
    marcas: params.marcas,
    nomeFiliais: params.nomeFiliais,
    // Não filtramos por tags01 aqui - queremos TODAS as tags que estão no tag0 de receita
  });

  // Filtrar pelo cenário (se especificado)
  const filteredRows = params.scenario
    ? summaryRows.filter(row => row.scenario === params.scenario)
    : summaryRows;

  // Somar todos os valores onde tag0 começa com "01." (Receita)
  const totalReceita = filteredRows
    .filter(row => row.tag0 && row.tag0.match(/^01\./i))
    .reduce((sum, row) => sum + Number(row.total_amount), 0);

  console.log(`✅ Receita Líquida calculada: R$ ${totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  return totalReceita;
};

/**
 * Buscar detalhe por dimensão dinâmica (1 API call, ~50-200 linhas)
 * Usado quando o usuário expande um drill-down na DRE
 */
export const getDREDimension = async (params: {
  monthFrom?: string;
  monthTo?: string;
  contaContabils?: string[];
  scenario?: string;
  dimension: string;
  marcas?: string[];
  nomeFiliais?: string[];
  tags01?: string[];
}): Promise<DREDimensionRow[]> => {
  console.log('📊 getDREDimension: Buscando dimensão', params.dimension);

  const { data, error } = await supabase.rpc('get_dre_dimension', {
    p_month_from: params.monthFrom || null,
    p_month_to: params.monthTo || null,
    p_conta_contabils: params.contaContabils && params.contaContabils.length > 0 ? params.contaContabils : null,
    p_scenario: params.scenario || null,
    p_dimension: params.dimension,
    p_marcas: params.marcas && params.marcas.length > 0 ? params.marcas : null,
    p_nome_filiais: params.nomeFiliais && params.nomeFiliais.length > 0 ? params.nomeFiliais : null,
    p_tags01: params.tags01 && params.tags01.length > 0 ? params.tags01 : null,
  });

  if (error) {
    console.error('❌ Erro ao buscar DRE dimension:', error);
    return [];
  }

  console.log(`✅ getDREDimension: ${data?.length || 0} linhas retornadas`);
  return (data || []) as DREDimensionRow[];
};

/**
 * Buscar opções de filtro disponíveis (1 API call)
 * Retorna listas de marcas, filiais e tags01 disponíveis no período
 */
export const getDREFilterOptions = async (params: {
  monthFrom?: string;
  monthTo?: string;
}): Promise<DREFilterOptions> => {
  console.log('📊 getDREFilterOptions: Buscando opções de filtro...');

  const { data, error } = await supabase.rpc('get_dre_filter_options', {
    p_month_from: params.monthFrom || null,
    p_month_to: params.monthTo || null,
  });

  if (error) {
    console.error('❌ Erro ao buscar opções de filtro DRE:', error);
    return { marcas: [], nome_filiais: [], tags01: [] };
  }

  const result = data?.[0] || { marcas: [], nome_filiais: [], tags01: [] };
  console.log(`✅ getDREFilterOptions: ${result.marcas?.length || 0} marcas, ${result.nome_filiais?.length || 0} filiais, ${result.tags01?.length || 0} tags01`);
  return result as DREFilterOptions;
};

// ========== TRANSACTIONS ==========

export const getAllTransactions = async (monthsBack: number = 3): Promise<Transaction[]> => {
  // VERSÃO OTIMIZADA: Carrega apenas últimos X meses (padrão: 3)
  console.log(`🔄 Carregando últimos ${monthsBack} meses de transações...`);

  // Calcular data de início (X meses atrás)
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - monthsBack);
  const startDateStr = startDate.toISOString().split('T')[0];

  console.log(`📅 Buscando transações desde: ${startDateStr}`);

  const { data, error, count } = await supabase
    .from('transactions')
    .select('*', { count: 'exact' })
    .gte('date', startDateStr)
    .order('date', { ascending: false })
    .limit(10000); // Limite de segurança

  if (error) {
    console.error('❌ Erro ao carregar transações:', error);
    // Em caso de erro, retornar array vazio em vez de quebrar
    return [];
  }

  if (!data || data.length === 0) {
    console.log('⚠️ Nenhuma transação encontrada no período');
    return [];
  }

  console.log(`✅ ${data.length} transações carregadas (de ${count} no período)!`);

  // Debug: Verificar campos na primeira transação
  if (data.length > 0) {
    console.log('🔍 DEBUG - Primeira transação ANTES do mapeamento (do banco):', {
      id: data[0].id,
      chave_id: data[0].chave_id,
      ticket: data[0].ticket,
      vendor: data[0].vendor,
      description: data[0].description?.substring(0, 50)
    });
  }

  // Enriquecer com tag0 via tag0_map
  const tag0Map = await getTag0Map();
  const mapped = data.map(db => {
    const t = dbToTransaction(db);
    if (!t.tag0 && t.tag01) {
      t.tag0 = resolveTag0(t.tag01, tag0Map);
    }
    return t;
  });

  // Debug: Verificar após mapeamento
  if (mapped.length > 0) {
    console.log('🔍 DEBUG - Primeira transação DEPOIS do mapeamento (para o app):', {
      id: mapped[0].id,
      tag0: mapped[0].tag0,
      tag01: mapped[0].tag01,
      description: mapped[0].description?.substring(0, 50)
    });
  }

  return mapped;
};

// Nova função: Buscar transações com filtros aplicados
export interface TransactionFilters {
  monthFrom?: string;      // YYYY-MM
  monthTo?: string;        // YYYY-MM
  marca?: string[];
  filial?: string[];
  nome_filial?: string[];  // "CIA - NomeFilial" (coluna calculada no banco)
  tag0?: string[];
  tag01?: string[];
  tag02?: string[];
  tag03?: string[];
  category?: string[];
  conta_contabil?: string[];
  ticket?: string;
  chave_id?: string;
  vendor?: string;
  description?: string;
  amount?: string;
  recurring?: string[];
  status?: string[];
  scenario?: string;       // Para filtrar por aba (Real, Orçamento, etc)
}

// Helper para aplicar filtros em uma query (reutilizado em paginação)
const applyTransactionFilters = (query: any, filters: TransactionFilters) => {
  console.log('🔧 applyTransactionFilters chamado com:', JSON.stringify(filters, null, 2));

  // ═══════════════════════════════════════════════════════════════
  // 🔐 APLICAR PERMISSÕES AUTOMATICAMENTE
  // ═══════════════════════════════════════════════════════════════
  filters = addPermissionFiltersToObject(filters);
  console.log('🔐 Filtros após aplicar permissões:', JSON.stringify(filters, null, 2));

  // Filtros de data (período)
  if (filters.monthFrom) {
    const startDate = `${filters.monthFrom}-01`;
    query = query.gte('date', startDate);
    console.log('  ✅ Filtro monthFrom aplicado:', startDate);
  }

  if (filters.monthTo) {
    const [year, month] = filters.monthTo.split('-');
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${filters.monthTo}-${lastDay}`;
    query = query.lte('date', endDate);
    console.log('  ✅ Filtro monthTo aplicado:', endDate);
  }

  // Filtros de array (marca, filial, tags, category, etc)
  if (filters.marca && filters.marca.length > 0) {
    query = query.in('marca', filters.marca);
    console.log('  🔒 Filtro MARCA aplicado:', filters.marca);
  } else {
    console.log('  ⚠️ Filtro marca NÃO aplicado (vazio ou undefined)');
  }
  if (filters.filial && filters.filial.length > 0) query = query.in('filial', filters.filial);
  if (filters.nome_filial && filters.nome_filial.length > 0) query = query.in('nome_filial', filters.nome_filial);
  // tag0 NÃO existe na tabela (resolvido via tag0_map) — filtro aplicado client-side após fetch
  if (filters.tag01 && filters.tag01.length > 0) query = query.in('tag01', filters.tag01);
  if (filters.tag02 && filters.tag02.length > 0) query = query.in('tag02', filters.tag02);
  if (filters.tag03 && filters.tag03.length > 0) query = query.in('tag03', filters.tag03);
  if (filters.category && filters.category.length > 0) query = query.in('category', filters.category);
  if (filters.conta_contabil && filters.conta_contabil.length > 0) query = query.in('conta_contabil', filters.conta_contabil);
  if (filters.chave_id && filters.chave_id.trim() !== '') query = query.ilike('chave_id', `%${filters.chave_id.trim()}%`);
  if (filters.recurring && filters.recurring.length > 0) {
    // Expandir variações com/sem acento para busca case-insensitive
    const recurringPatterns: string[] = [];
    for (const val of filters.recurring) {
      const lower = val.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lower === 'sim') {
        recurringPatterns.push('recurring.ilike.sim', 'recurring.ilike.Sim', 'recurring.ilike.SIM');
      } else if (lower === 'nao') {
        recurringPatterns.push(
          'recurring.ilike.nao', 'recurring.ilike.Nao', 'recurring.ilike.NAO',
          'recurring.ilike.não', 'recurring.ilike.Não', 'recurring.ilike.NÃO'
        );
      } else {
        recurringPatterns.push(`recurring.ilike.${val}`);
      }
    }
    query = query.or(recurringPatterns.join(','));
  }

  // Filtros de texto (LIKE)
  if (filters.ticket && filters.ticket.trim() !== '') query = query.ilike('ticket', `%${filters.ticket.trim()}%`);
  if (filters.vendor && filters.vendor.trim() !== '') query = query.ilike('vendor', `%${filters.vendor.trim()}%`);
  if (filters.description && filters.description.trim() !== '') query = query.ilike('description', `%${filters.description.trim()}%`);

  // Filtro de valor (amount)
  if (filters.amount && filters.amount.trim() !== '') {
    const amountValue = parseFloat(filters.amount.trim());
    if (!isNaN(amountValue)) query = query.eq('amount', amountValue);
  }

  // Filtro de status
  if (filters.status && filters.status.length > 0) query = query.in('status', filters.status);

  // Filtro de cenário (aba ativa)
  // Real: scenario IS NULL ou 'Real' (DRE usa COALESCE(scenario, 'Real'))
  if (filters.scenario) {
    if (filters.scenario === 'Real') {
      query = query.or('scenario.is.null,scenario.ilike.Real');
    } else {
      query = query.ilike('scenario', filters.scenario);
    }
  }

  return query;
};

export const getFilteredTransactions = async (
  filters: TransactionFilters,
  pagination?: PaginationParams
): Promise<PaginatedResponse<Transaction>> => {
  console.log('🔍 Buscando transações com filtros:', filters);

  if (pagination) {
    console.log(`📄 Paginação: Página ${pagination.pageNumber}, ${pagination.pageSize} registros/página`);

    // Iniciar query com contagem
    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' });

    query = applyTransactionFilters(query, filters);
    query = query.order('date', { ascending: false }).order('id', { ascending: true });

    const { pageNumber, pageSize } = pagination;

    if (pageNumber < 1) {
      console.error('❌ Erro: pageNumber deve ser >= 1');
      return { data: [], totalCount: 0, currentPage: 1, totalPages: 0, hasMore: false };
    }
    if (pageSize < 1 || pageSize > 50000) {
      console.error('❌ Erro: pageSize deve estar entre 1 e 50000');
      return { data: [], totalCount: 0, currentPage: 1, totalPages: 0, hasMore: false };
    }

    const offset = (pageNumber - 1) * pageSize;
    const rangeEnd = offset + pageSize - 1;
    query = query.range(offset, rangeEnd);

    console.log(`📥 Buscando registros ${offset + 1} a ${offset + pageSize} (range: ${offset}-${rangeEnd})...`);

    const { data, count, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar transações:', error);
      return { data: [], totalCount: 0, currentPage: 1, totalPages: 0, hasMore: false };
    }

    const totalCount = count || 0;
    console.log(`📊 Total de registros filtrados: ${totalCount}`);

    if (!data || data.length === 0) {
      return { data: [], totalCount: 0, currentPage: 1, totalPages: 0, hasMore: false };
    }

    const tag0Map = await getTag0Map();
    const enriched = data.map(db => {
      const t = dbToTransaction(db);
      if (!t.tag0 && t.tag01) t.tag0 = resolveTag0(t.tag01, tag0Map);
      return t;
    });

    const totalPages = Math.ceil(totalCount / pageSize);
    return {
      data: enriched,
      totalCount,
      currentPage: pageNumber,
      totalPages,
      hasMore: pageNumber < totalPages
    };
  }

  // ═══════════════════════════════════════════════════════════
  // SEM PAGINAÇÃO: Busca em lotes PARALELOS para contornar limite do Supabase
  // O Supabase tem limite de ~1000 linhas por request (server-side).
  // Buscamos em lotes de 10000 usando .range(), 6 lotes em paralelo.
  // ═══════════════════════════════════════════════════════════
  const BATCH_SIZE = 1000;   // Limite real do Supabase server (max-rows)
  const PARALLEL_BATCHES = 3; // REDUZIDO: 3 requests simultâneos para evitar sobrecarga

  // Primeiro: obter contagem total
  let countQuery = supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true });
  countQuery = applyTransactionFilters(countQuery, filters);
  const { count: totalCountRaw, error: countError } = await countQuery;

  if (countError) {
    console.error('❌ Erro ao contar transações:', countError);
    return { data: [], totalCount: 0, currentPage: 1, totalPages: 0, hasMore: false };
  }

  const totalCount = totalCountRaw || 0;
  console.log(`📊 Total de registros filtrados: ${totalCount}`);

  if (totalCount === 0) {
    return { data: [], totalCount: 0, currentPage: 1, totalPages: 0, hasMore: false };
  }

  // Criar todas as promises de lotes
  const totalBatches = Math.ceil(totalCount / BATCH_SIZE);
  console.log(`📦 Buscando ${totalCount} registros em ${totalBatches} lotes de ${BATCH_SIZE} (${PARALLEL_BATCHES} em paralelo)...`);

  const fetchBatch = async (batchIdx: number) => {
    const from = batchIdx * BATCH_SIZE;
    const to = from + BATCH_SIZE - 1;

    let batchQuery = supabase.from('transactions').select('*');
    batchQuery = applyTransactionFilters(batchQuery, filters);
    batchQuery = batchQuery.order('date', { ascending: false }).order('id', { ascending: true });
    batchQuery = batchQuery.range(from, to);

    const { data, error } = await batchQuery;
    if (error) {
      console.error(`❌ Erro no lote ${batchIdx + 1}/${totalBatches}:`, error);
      return [];
    }
    return data || [];
  };

  // Executar lotes em paralelo (grupos de PARALLEL_BATCHES)
  const allData: any[] = [];
  for (let i = 0; i < totalBatches; i += PARALLEL_BATCHES) {
    const batchIndices = Array.from(
      { length: Math.min(PARALLEL_BATCHES, totalBatches - i) },
      (_, j) => i + j
    );

    const results = await Promise.all(batchIndices.map(fetchBatch));
    for (const result of results) {
      allData.push(...result);
    }
    console.log(`  ✅ Lotes ${i + 1}-${i + batchIndices.length}/${totalBatches}: acumulado ${allData.length} registros`);
  }

  console.log(`✅ ${allData.length} transações carregadas de ${totalCount} total`);

  // Enriquecer com tag0
  const tag0Map = await getTag0Map();
  const enriched = allData.map(db => {
    const t = dbToTransaction(db);
    if (!t.tag0 && t.tag01) t.tag0 = resolveTag0(t.tag01, tag0Map);
    return t;
  });

  return {
    data: enriched,
    totalCount,
    currentPage: 1,
    totalPages: 1,
    hasMore: false
  };
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .insert([transactionToDb(transaction as Transaction)])
    .select()
    .single();

  if (error) {
    console.error('Error adding transaction:', error);
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('No data returned from insert');
  }

  return dbToTransaction(data);
};

export const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<boolean> => {
  console.log('updateTransaction called with:', { id, updates });

  // Remover campos null/undefined e campos vazios
  const cleanedUpdates: any = {};
  Object.keys(updates).forEach(key => {
    const value = (updates as any)[key];
    if (value !== null && value !== undefined && value !== '') {
      cleanedUpdates[key] = value;
    }
  });

  console.log('cleanedUpdates:', cleanedUpdates);

  // Se não há nada para atualizar, retornar sucesso
  if (Object.keys(cleanedUpdates).length === 0) {
    console.log('No fields to update, returning success');
    return true;
  }

  const { error } = await supabase
    .from('transactions')
    .update(cleanedUpdates)
    .eq('id', id);

  if (error) {
    console.error('Error updating transaction:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    return false;
  }

  return true;
};

export const deleteTransaction = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }

  return true;
};

export const bulkAddTransactions = async (transactions: Omit<Transaction, 'id'>[]): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transactions.map(t => transactionToDb(t as Transaction)))
    .select();

  if (error) {
    console.error('Error bulk adding transactions:', error);
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('No data returned from bulk insert');
  }

  return data.map(dbToTransaction);
};

// ========== MANUAL CHANGES ==========

export const getAllManualChanges = async (): Promise<ManualChange[]> => {
  console.log('🟦 getAllManualChanges INICIADO');

  const { data, error } = await supabase
    .from('manual_changes')
    .select('*')
    .order('requested_at', { ascending: false });

  console.log('🟦 Resposta do Supabase:', {
    error: error,
    hasData: !!data,
    dataLength: data ? data.length : 0
  });

  if (error) {
    console.error('❌ Error fetching manual changes:', error);
    console.error('❌ Código do erro:', error.code);
    console.error('❌ Mensagem do erro:', error.message);
    return [];
  }

  console.log('✅ Dados brutos (primeiros 2):', data.slice(0, 2));

  const converted = data.map(dbToManualChange);
  console.log('✅ Dados convertidos (primeiros 2):', converted.slice(0, 2).map(c => ({
    id: c.id,
    type: c.type,
    status: c.status,
    transactionId: c.transactionId
  })));

  return converted;
};

export const addManualChange = async (change: ManualChange): Promise<boolean> => {
  console.log('🟦 addManualChange INICIADO:', {
    id: change.id,
    type: change.type,
    transactionId: change.transactionId,
    justification: change.justification,
    hasOriginalTransaction: !!change.originalTransaction
  });

  try {
    const dbChange = manualChangeToDb(change);

    console.log('🟦 Após manualChangeToDb:', {
      id: dbChange.id,
      type: dbChange.type,
      transaction_id: dbChange.transaction_id,
      justification: dbChange.justification,
      original_transaction_type: typeof dbChange.original_transaction,
      original_transaction_preview: typeof dbChange.original_transaction === 'string'
        ? dbChange.original_transaction.substring(0, 100)
        : 'object'
    });

    // Garantir que original_transaction é um objeto válido
    if (typeof dbChange.original_transaction === 'string') {
      console.log('🟦 Convertendo original_transaction de string para objeto');
      dbChange.original_transaction = JSON.parse(dbChange.original_transaction);
    }

    // Remover campos null/undefined para evitar erro de headers
    const cleanedChange: any = {};
    Object.keys(dbChange).forEach(key => {
      const value = (dbChange as any)[key];
      if (value !== null && value !== undefined) {
        cleanedChange[key] = value;
      }
    });

    console.log('🟦 Campos após limpeza:', Object.keys(cleanedChange));
    console.log('🟦 Dados limpos (resumo):', {
      id: cleanedChange.id,
      type: cleanedChange.type,
      transaction_id: cleanedChange.transaction_id,
      justification: cleanedChange.justification,
      status: cleanedChange.status,
      requested_at: cleanedChange.requested_at,
      requested_by: cleanedChange.requested_by,
      requested_by_name: cleanedChange.requested_by_name,
      has_original_transaction: !!cleanedChange.original_transaction,
      has_new_values: !!cleanedChange.new_values
    });

    console.log('🔄 Iniciando INSERT no Supabase...');
    const { error, data } = await supabase
      .from('manual_changes')
      .insert([cleanedChange])
      .select();

    console.log('🟦 Resposta do Supabase:', {
      error: error,
      data: data,
      hasError: !!error,
      hasData: !!data,
      dataLength: data ? data.length : 0
    });

    if (error) {
      console.error('❌ ERRO ao salvar manual change:', error);
      console.error('❌ Código do erro:', error.code);
      console.error('❌ Mensagem do erro:', error.message);
      console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2));
      console.error('❌ Dados enviados (completo):', JSON.stringify(cleanedChange, null, 2));
      return false;
    }

    console.log('✅ Manual change salvo com SUCESSO!');
    console.log('✅ Dados retornados:', data);
    return true;
  } catch (err) {
    console.error('❌ EXCEPTION in addManualChange:', err);
    console.error('❌ Tipo do erro:', (err as Error).name);
    console.error('❌ Mensagem:', (err as Error).message);
    console.error('❌ Stack:', (err as Error).stack);
    return false;
  }
};

export const updateManualChange = async (id: string, updates: Partial<ManualChange>): Promise<boolean> => {
  const dbUpdates: any = {};

  if (updates.status) dbUpdates.status = updates.status;
  if (updates.approvedAt) dbUpdates.approved_at = updates.approvedAt;
  if (updates.approvedBy) dbUpdates.approved_by = updates.approvedBy;
  if (updates.approvedByName) dbUpdates.approved_by_name = updates.approvedByName;

  // Remover campos null/undefined
  const cleanedUpdates: any = {};
  Object.keys(dbUpdates).forEach(key => {
    const value = dbUpdates[key];
    if (value !== null && value !== undefined) {
      cleanedUpdates[key] = value;
    }
  });

  const { error } = await supabase
    .from('manual_changes')
    .update(cleanedUpdates)
    .eq('id', id);

  if (error) {
    console.error('Error updating manual change:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return false;
  }

  return true;
};

// ========== USERS ==========

export const getUserByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }

  return data;
};

export const createUser = async (userData: { email: string; name: string; photoURL: string; role: string }) => {
  const { data, error } = await supabase
    .from('users')
    .insert([{
      email: userData.email,
      name: userData.name,
      photo_url: userData.photoURL,
      role: userData.role
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    throw error;
  }

  return data;
};

export const updateUserLastLogin = async (userId: string) => {
  const { error } = await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Error updating last login:', error);
  }
};

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all users:', error);
    return [];
  }

  return data;
};

export const updateUserRole = async (userId: string, role: 'admin' | 'manager' | 'viewer' | 'pending') => {
  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user role:', error);
    return false;
  }

  return true;
};

export const deleteUser = async (userId: string) => {
  try {
    // Primeiro, deletar todas as permissões do usuário
    const { error: permError } = await supabase
      .from('user_permissions')
      .delete()
      .eq('user_id', userId);

    if (permError) {
      console.error('Error deleting user permissions:', permError);
      // Continuar mesmo se falhar - pode ser que não tenha permissões
    }

    // Depois, deletar o usuário
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (userError) {
      console.error('Error deleting user:', userError);
      return false;
    }

    console.log(`User ${userId} deleted successfully`);
    return true;
  } catch (error) {
    console.error('Exception in deleteUser:', error);
    return false;
  }
};

export const getUserPermissions = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_permissions')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user permissions:', error);
    return [];
  }

  return data;
};

export const addUserPermission = async (userId: string, permissionType: 'centro_custo' | 'cia' | 'filial' | 'tag01' | 'tag02' | 'tag03', permissionValue: string) => {
  const { error } = await supabase
    .from('user_permissions')
    .insert([{
      user_id: userId,
      permission_type: permissionType,
      permission_value: permissionValue
    }]);

  if (error) {
    console.error('Error adding user permission:', error);
    return false;
  }

  return true;
};

export const removeUserPermission = async (permissionId: string) => {
  const { error } = await supabase
    .from('user_permissions')
    .delete()
    .eq('id', permissionId);

  if (error) {
    console.error('Error removing user permission:', error);
    return false;
  }

  return true;
};

// ========== SYNC ==========

/**
 * Atualiza transação com verificação de conflito (Optimistic Locking)
 *
 * Verifica se o updated_at da transação no servidor corresponde ao esperado.
 * Se não corresponder, retorna conflito ao invés de sobrescrever.
 *
 * @param id ID da transação
 * @param updates Campos a atualizar
 * @param expectedUpdatedAt Timestamp esperado (versão local)
 * @returns { success: boolean, conflict?: Transaction }
 */
export const updateTransactionWithConflictCheck = async (
  id: string,
  updates: Partial<Transaction>,
  expectedUpdatedAt: string
): Promise<{ success: boolean; conflict?: Transaction; error?: string }> => {
  try {
    console.log(`🔍 Verificando conflito para transação ${id}`);
    console.log(`   Expected updated_at: ${expectedUpdatedAt}`);

    // 1. Buscar versão atual do servidor
    const { data: current, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      console.error('❌ Erro ao buscar transação atual:', fetchError);
      return {
        success: false,
        error: fetchError?.message || 'Transação não encontrada'
      };
    }

    console.log(`   Server updated_at: ${current.updated_at}`);

    // 2. Verificar conflito (comparar updated_at)
    if (current.updated_at !== expectedUpdatedAt) {
      console.warn('⚠️ Conflito detectado! Versões divergiram.');
      return {
        success: false,
        conflict: dbToTransaction(current)
      };
    }

    // 3. Não há conflito - prosseguir com update
    // Adicionar novo timestamp
    const updatesWithTimestamp = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Limpar campos vazios
    const cleanedUpdates: any = {};
    Object.keys(updatesWithTimestamp).forEach(key => {
      const value = (updatesWithTimestamp as any)[key];
      if (value !== null && value !== undefined && value !== '') {
        cleanedUpdates[key] = value;
      }
    });

    // 4. Executar update COM condição no updated_at (optimistic locking)
    const { error: updateError } = await supabase
      .from('transactions')
      .update(cleanedUpdates)
      .eq('id', id)
      .eq('updated_at', expectedUpdatedAt); // ← Condição crítica para optimistic locking

    if (updateError) {
      console.error('❌ Erro ao atualizar transação:', updateError);
      return {
        success: false,
        error: updateError.message
      };
    }

    console.log('✅ Transação atualizada com sucesso (sem conflito)');

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro inesperado no conflict check:', errorMsg);
    return {
      success: false,
      error: errorMsg
    };
  }
};

// Migrar dados do localStorage para Supabase (executar uma vez)
export const migrateFromLocalStorage = async () => {
  const STORAGE_KEY = 'sap_financial_data_v6';
  const CHANGES_KEY = 'sap_approvals_v6';

  try {
    // Migrar transações
    const savedTransactions = localStorage.getItem(STORAGE_KEY);
    if (savedTransactions) {
      const transactions: Transaction[] = JSON.parse(savedTransactions);
      const success = await bulkAddTransactions(transactions);
      if (success) {
        console.log(`Migrated ${transactions.length} transactions to Supabase`);
      }
    }

    // Migrar mudanças manuais
    const savedChanges = localStorage.getItem(CHANGES_KEY);
    if (savedChanges) {
      const changes: ManualChange[] = JSON.parse(savedChanges);
      for (const change of changes) {
        await addManualChange(change);
      }
      console.log(`Migrated ${changes.length} manual changes to Supabase`);
    }

    return true;
  } catch (error) {
    console.error('Error migrating data:', error);
    return false;
  }
};

/**
 * Subscribe to real-time changes in transactions table (FASE 3)
 *
 * Configura Supabase Realtime para escutar mudanças na tabela transactions.
 * Filtra eventos por marca, filial e período (se fornecidos).
 *
 * @param filters Filtros para aplicar na subscription
 * @param callbacks Callbacks para eventos INSERT/UPDATE/DELETE
 * @returns RealtimeChannel instance (use .unsubscribe() para parar)
 */
export const subscribeToTransactionChanges = (
  filters: Partial<TransactionFilters>,
  callbacks: {
    onInsert?: (transaction: Transaction) => void;
    onUpdate?: (transaction: Transaction) => void;
    onDelete?: (id: string) => void;
    onError?: (error: Error) => void;
  }
): any => {
  console.log('📡 Iniciando subscription Realtime com filtros:', filters);

  // Construir filtro Realtime
  // Nota: Supabase Realtime tem limitações - filtros complexos são aplicados no cliente
  let channelName = 'transactions-changes';

  // Criar channel
  const channel = supabase.channel(channelName);

  // Configurar listener para INSERT
  if (callbacks.onInsert) {
    channel.on(
      'postgres_changes' as any,
      {
        event: 'INSERT',
        schema: 'public',
        table: 'transactions'
      },
      (payload: any) => {
        console.log('📥 Realtime INSERT:', payload.new.id);

        const transaction = dbToTransaction(payload.new);

        // Aplicar filtros no cliente (Realtime não suporta filtros complexos)
        if (shouldIncludeTransaction(transaction, filters)) {
          callbacks.onInsert!(transaction);
        } else {
          console.log('⏭️ Transação filtrada (não corresponde aos critérios)');
        }
      }
    );
  }

  // Configurar listener para UPDATE
  if (callbacks.onUpdate) {
    channel.on(
      'postgres_changes' as any,
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'transactions'
      },
      (payload: any) => {
        console.log('📝 Realtime UPDATE:', payload.new.id);

        const transaction = dbToTransaction(payload.new);

        if (shouldIncludeTransaction(transaction, filters)) {
          callbacks.onUpdate!(transaction);
        } else {
          console.log('⏭️ Transação filtrada (não corresponde aos critérios)');
        }
      }
    );
  }

  // Configurar listener para DELETE
  if (callbacks.onDelete) {
    channel.on(
      'postgres_changes' as any,
      {
        event: 'DELETE',
        schema: 'public',
        table: 'transactions'
      },
      (payload: any) => {
        console.log('🗑️ Realtime DELETE:', payload.old.id);
        callbacks.onDelete!(payload.old.id);
      }
    );
  }

  // Subscribe ao channel
  channel.subscribe((status: string) => {
    console.log(`📡 Realtime status: ${status}`);

    if (status === 'SUBSCRIBED') {
      console.log('✅ Realtime conectado com sucesso!');
    } else if (status === 'CLOSED') {
      console.log('⚠️ Realtime desconectado');
    } else if (status === 'CHANNEL_ERROR') {
      console.error('❌ Erro no canal Realtime');
      if (callbacks.onError) {
        callbacks.onError(new Error('Realtime channel error'));
      }
    }
  });

  return channel;
};

/**
 * Helper: Verifica se transação deve ser incluída baseado nos filtros
 */
const shouldIncludeTransaction = (
  transaction: Transaction,
  filters: Partial<TransactionFilters>
): boolean => {
  // Filtro de marca
  if (filters.marca && filters.marca.length > 0) {
    if (!transaction.marca || !filters.marca.includes(transaction.marca)) {
      return false;
    }
  }

  // Filtro de filial
  if (filters.filial && filters.filial.length > 0) {
    if (!transaction.filial || !filters.filial.includes(transaction.filial)) {
      return false;
    }
  }

  // Filtro de período (monthFrom/monthTo)
  if (filters.monthFrom || filters.monthTo) {
    const transactionDate = new Date(transaction.date);

    if (filters.monthFrom) {
      const [year, month] = filters.monthFrom.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      if (transactionDate < startDate) {
        return false;
      }
    }

    if (filters.monthTo) {
      const [year, month] = filters.monthTo.split('-');
      const endDate = new Date(parseInt(year), parseInt(month), 0); // Último dia do mês
      if (transactionDate > endDate) {
        return false;
      }
    }
  }

  // Filtro de cenário
  if (filters.scenario) {
    if (!transaction.scenario || !transaction.scenario.toLowerCase().includes(filters.scenario.toLowerCase())) {
      return false;
    }
  }

  return true;
};

// ============================================
// Conta Contábil - Hierarquia
// ============================================

let contaContabilCache: ContaContabilOption[] | null = null;

export const getContaContabilOptions = async (): Promise<ContaContabilOption[]> => {
  if (contaContabilCache && contaContabilCache.length > 0) return contaContabilCache;

  // Estratégia: tentar tabela conta_contabil primeiro (tem nome_nat_orc correto)
  // Se não existir, fallback para DISTINCT de transactions
  try {
    // 1) Tentar tabela conta_contabil (plano de contas com nomes corretos)
    console.log('📋 Tentando tabela conta_contabil...');
    const { data: ccData, error: ccError } = await supabase
      .from('conta_contabil')
      .select('cod_conta, tag1, tag2, tag3, tag4, nome_nat_orc, nat_orc')
      .order('cod_conta', { ascending: true });

    if (!ccError && ccData && ccData.length > 0) {
      console.log(`✅ Tabela conta_contabil encontrada com ${ccData.length} registros`);
      contaContabilCache = ccData.map(row => ({
        cod_conta: row.cod_conta,
        nome_nat_orc: row.nome_nat_orc || row.nat_orc || null,
        tag0: row.tag1 || null,
        tag01: row.tag2 || null,
        tag02: row.tag3 || null,
        tag03: row.tag4 || null,
      }));
      return contaContabilCache;
    }

    // 2) Fallback: buscar DISTINCT de transactions
    console.log('📋 Fallback: carregando contas de transactions...');
    const { data, error } = await supabase
      .from('transactions')
      .select('conta_contabil, nat_orc, tag01, tag02, tag03')
      .not('conta_contabil', 'is', null);

    if (error) {
      console.error('❌ Erro ao buscar contas:', error.message);
      return [];
    }

    const tag0Map = await getTag0Map();

    const contaMap = new Map<string, ContaContabilOption>();
    for (const row of data || []) {
      const cod = row.conta_contabil;
      if (!cod || contaMap.has(cod)) continue;
      contaMap.set(cod, {
        cod_conta: cod,
        nome_nat_orc: row.tag03 || null,
        tag0: resolveTag0(row.tag01, tag0Map) || null,
        tag01: row.tag01 || null,
        tag02: row.tag02 || null,
        tag03: row.tag03 || null,
      });
    }

    contaContabilCache = Array.from(contaMap.values()).sort((a, b) => a.cod_conta.localeCompare(b.cod_conta));
    console.log(`✅ ${contaContabilCache.length} contas únicas carregadas (fallback transactions)`);

    return contaContabilCache;
  } catch (e) {
    console.error('❌ EXCEPTION:', e);
    return [];
  }
};
