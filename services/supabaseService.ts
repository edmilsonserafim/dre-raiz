import { supabase, DatabaseTransaction, DatabaseManualChange } from '../supabase';
import { Transaction, ManualChange, PaginationParams, PaginatedResponse } from '../types';

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
  tag01: db.tag01 || undefined,
  tag02: db.tag02 || undefined,
  tag03: db.tag03 || undefined,
  recurring: db.recurring || undefined,  // Mantém o valor do banco (comparação case-insensitive no filtro)
  ticket: db.ticket || undefined,
  vendor: db.vendor || undefined,
  nat_orc: db.nat_orc || undefined,
  chave_id: db.chave_id || undefined,
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

  const mapped = data.map(dbToTransaction);

  // Debug: Verificar após mapeamento
  if (mapped.length > 0) {
    console.log('🔍 DEBUG - Primeira transação DEPOIS do mapeamento (para o app):', {
      id: mapped[0].id,
      chave_id: mapped[0].chave_id,
      ticket: mapped[0].ticket,
      vendor: mapped[0].vendor,
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
  tag01?: string[];
  tag02?: string[];
  tag03?: string[];
  category?: string[];
  ticket?: string;
  chave_id?: string[];
  vendor?: string;
  description?: string;
  amount?: string;
  recurring?: string[];
  scenario?: string;       // Para filtrar por aba (Real, Orçamento, etc)
}

// Helper para aplicar filtros em uma query (reutilizado em paginação)
const applyTransactionFilters = (query: any, filters: TransactionFilters) => {
  // Filtros de data (período)
  if (filters.monthFrom) {
    const startDate = `${filters.monthFrom}-01`;
    query = query.gte('date', startDate);
  }

  if (filters.monthTo) {
    const [year, month] = filters.monthTo.split('-');
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${filters.monthTo}-${lastDay}`;
    query = query.lte('date', endDate);
  }

  // Filtros de array (marca, filial, tags, category, etc)
  if (filters.marca && filters.marca.length > 0) query = query.in('marca', filters.marca);
  if (filters.filial && filters.filial.length > 0) query = query.in('filial', filters.filial);
  if (filters.tag01 && filters.tag01.length > 0) query = query.in('tag01', filters.tag01);
  if (filters.tag02 && filters.tag02.length > 0) query = query.in('tag02', filters.tag02);
  if (filters.tag03 && filters.tag03.length > 0) query = query.in('tag03', filters.tag03);
  if (filters.category && filters.category.length > 0) query = query.in('category', filters.category);
  if (filters.chave_id && filters.chave_id.length > 0) query = query.in('chave_id', filters.chave_id);
  if (filters.recurring && filters.recurring.length > 0) query = query.in('recurring', filters.recurring);

  // Filtros de texto (LIKE)
  if (filters.ticket && filters.ticket.trim() !== '') query = query.ilike('ticket', `%${filters.ticket.trim()}%`);
  if (filters.vendor && filters.vendor.trim() !== '') query = query.ilike('vendor', `%${filters.vendor.trim()}%`);
  if (filters.description && filters.description.trim() !== '') query = query.ilike('description', `%${filters.description.trim()}%`);

  // Filtro de valor (amount)
  if (filters.amount && filters.amount.trim() !== '') {
    const amountValue = parseFloat(filters.amount.trim());
    if (!isNaN(amountValue)) query = query.eq('amount', amountValue);
  }

  // Filtro de cenário (aba ativa)
  if (filters.scenario) query = query.ilike('scenario', filters.scenario);

  return query;
};

export const getFilteredTransactions = async (
  filters: TransactionFilters,
  pagination?: PaginationParams
): Promise<PaginatedResponse<Transaction>> => {
  console.log('🔍 Buscando transações com filtros:', filters);
  if (pagination) {
    console.log(`📄 Paginação: Página ${pagination.pageNumber}, ${pagination.pageSize} registros/página`);
  }

  // Iniciar query com contagem
  let query = supabase
    .from('transactions')
    .select('*', { count: 'exact' });

  // Aplicar todos os filtros
  query = applyTransactionFilters(query, filters);

  // Ordenar
  query = query.order('date', { ascending: false });

  // Aplicar paginação se fornecida
  if (pagination) {
    const { pageNumber, pageSize } = pagination;

    // Validar parâmetros
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
  } else {
    // Sem paginação - buscar até 50k (comportamento legado)
    console.log('⚠️ Sem paginação - buscando até 50k registros (modo legado)');
    query = query.limit(50000);
  }

  // Executar query
  const { data, count, error } = await query;

  if (error) {
    console.error('❌ Erro ao buscar transações:', error);
    return { data: [], totalCount: 0, currentPage: 1, totalPages: 0, hasMore: false };
  }

  const totalCount = count || 0;
  console.log(`📊 Total de registros filtrados: ${totalCount}`);

  if (!data || data.length === 0) {
    console.log('⚠️ Nenhuma transação encontrada com os filtros aplicados');
    return { data: [], totalCount: 0, currentPage: 1, totalPages: 0, hasMore: false };
  }

  console.log(`✅ ${data.length} transações retornadas nesta página`);

  // Preparar resposta paginada
  if (pagination) {
    const { pageNumber, pageSize } = pagination;
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasMore = pageNumber < totalPages;

    return {
      data: data.map(dbToTransaction),
      totalCount,
      currentPage: pageNumber,
      totalPages,
      hasMore
    };
  } else {
    // Modo legado - retornar como PaginatedResponse mas sem paginação real
    return {
      data: data.map(dbToTransaction),
      totalCount,
      currentPage: 1,
      totalPages: 1,
      hasMore: false
    };
  }
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

export const addUserPermission = async (userId: string, permissionType: 'centro_custo' | 'cia' | 'filial', permissionValue: string) => {
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
