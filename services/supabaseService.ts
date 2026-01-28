import { supabase, DatabaseTransaction, DatabaseManualChange } from '../supabase';
import { Transaction, ManualChange } from '../types';

// Converter Transaction do app para formato do banco
// Remove campos que não existem na tabela: ticket, vendor, recurring, justification
const transactionToDb = (t: Transaction): DatabaseTransaction => {
  const dbTransaction: any = {
    id: t.id,
    date: t.date,
    description: t.description,
    category: t.category,
    amount: t.amount,
    type: t.type,
    scenario: t.scenario || 'Orçado',
    status: t.status,
    branch: t.branch
  };

  // Adicionar campos opcionais apenas se existirem
  if (t.brand) dbTransaction.brand = t.brand;
  if (t.tag01) dbTransaction.tag01 = t.tag01;
  if (t.tag02) dbTransaction.tag02 = t.tag02;
  if (t.tag03) dbTransaction.tag03 = t.tag03;

  return dbTransaction;
};

// Converter Transaction do banco para formato do app
const dbToTransaction = (db: DatabaseTransaction): Transaction => ({
  id: db.id,
  date: db.date,
  description: db.description,
  category: db.category,
  amount: db.amount,
  type: db.type as any,
  scenario: db.scenario,
  status: db.status,
  branch: db.branch,
  brand: db.brand,
  tag01: db.tag01,
  tag02: db.tag02,
  tag03: db.tag03
});

// Converter ManualChange para formato do banco
const manualChangeToDb = (mc: ManualChange): DatabaseManualChange => {
  // Extrair justificativa - se não estiver direta, tentar extrair do newValue (para RATEIO)
  let justification = mc.justification || mc.description || '';

  // Para RATEIO, a justificativa pode estar dentro do JSON do newValue
  if (!justification && mc.type === 'RATEIO') {
    try {
      const parsed = JSON.parse(mc.newValue);
      justification = parsed.justification || '';
    } catch (e) {
      // Se falhar parsing, usa string vazia
    }
  }

  return {
    id: mc.id,
    transaction_id: mc.transactionId,
    type: mc.type,
    field_changed: mc.fieldChanged || null,
    old_value: mc.oldValue || null,
    new_value: mc.newValue,
    justification: justification || 'Sem justificativa',  // Garantir que nunca seja vazio
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

export const getAllTransactions = async (): Promise<Transaction[]> => {
  // Supabase tem limite de 1000 por página
  // Vamos buscar em múltiplas páginas até não ter mais dados
  let allData: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  console.log('🔄 Iniciando carregamento de transações do Supabase...');

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    console.log(`📥 Buscando transações ${from} a ${to}...`);

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching transactions page', page, ':', error);
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allData = [...allData, ...data];
      console.log(`✅ Página ${page + 1}: ${data.length} transações carregadas. Total: ${allData.length}`);

      // Se retornou menos que pageSize, não há mais páginas
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  console.log('✅ Supabase: Total de transações carregadas:', allData.length);

  return allData.map(dbToTransaction);
};

export const addTransaction = async (transaction: Transaction): Promise<boolean> => {
  const { error } = await supabase
    .from('transactions')
    .insert([transactionToDb(transaction)]);

  if (error) {
    console.error('Error adding transaction:', error);
    return false;
  }

  return true;
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

export const bulkAddTransactions = async (transactions: Transaction[]): Promise<boolean> => {
  const { error } = await supabase
    .from('transactions')
    .insert(transactions.map(transactionToDb));

  if (error) {
    console.error('Error bulk adding transactions:', error);
    return false;
  }

  return true;
};

// ========== MANUAL CHANGES ==========

export const getAllManualChanges = async (): Promise<ManualChange[]> => {
  const { data, error } = await supabase
    .from('manual_changes')
    .select('*')
    .order('requested_at', { ascending: false });

  if (error) {
    console.error('Error fetching manual changes:', error);
    return [];
  }

  return data.map(dbToManualChange);
};

export const addManualChange = async (change: ManualChange): Promise<boolean> => {
  try {
    const dbChange = manualChangeToDb(change);

    // Garantir que original_transaction é um objeto válido
    if (typeof dbChange.original_transaction === 'string') {
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

    console.log('Tentando salvar manual change:', {
      id: cleanedChange.id,
      type: cleanedChange.type,
      transaction_id: cleanedChange.transaction_id
    });

    const { error, data } = await supabase
      .from('manual_changes')
      .insert([cleanedChange])
      .select();

    if (error) {
      console.error('Error adding manual change:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Data being sent:', JSON.stringify(cleanedChange, null, 2));
      return false;
    }

    console.log('Manual change saved successfully:', data);
    return true;
  } catch (err) {
    console.error('Exception in addManualChange:', err);
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
