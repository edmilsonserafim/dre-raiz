import { supabase } from '../../supabase';
import { Transaction } from '../../types';
import { dbToTransaction } from '../../services/supabaseService';

/**
 * Busca transações do cenário correto (Real, Orçado, A-1)
 */
export async function getTransactionsByScenario(
  scenario: 'Real' | 'Orçado' | 'A-1',
  filters?: {
    startDate?: string;
    endDate?: string;
    marca?: string[];
    filial?: string[];
  }
): Promise<Transaction[]> {
  // Selecionar tabela baseada no cenário
  let tableName = 'transactions';  // Real
  if (scenario === 'Orçado') tableName = 'transactions_orcado';
  if (scenario === 'A-1') tableName = 'transactions_ano_anterior';

  console.log(`🔍 scenarioService: Buscando de ${tableName} (cenário: ${scenario})`);

  let query = supabase.from(tableName).select('*');

  // Aplicar filtros
  if (filters?.startDate) {
    query = query.gte('date', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('date', filters.endDate);
  }
  if (filters?.marca && filters.marca.length > 0) {
    query = query.in('marca', filters.marca);
  }
  if (filters?.filial && filters.filial.length > 0) {
    query = query.in('filial', filters.filial);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`❌ Erro ao buscar ${tableName}:`, error);
    throw error;
  }

  console.log(`✅ ${data.length} transações carregadas de ${tableName}`);

  // Converter para Transaction[]
  return data.map(dbToTransaction);
}

/**
 * Busca de TODAS as 3 tabelas e mescla (para visualização combinada)
 */
export async function getAllScenariosTransactions(
  filters?: {
    startDate?: string;
    endDate?: string;
    marca?: string[];
    filial?: string[];
  }
): Promise<Transaction[]> {
  console.log('🔍 scenarioService: Buscando de TODAS as tabelas');

  const [real, orcado, anoAnterior] = await Promise.all([
    getTransactionsByScenario('Real', filters),
    getTransactionsByScenario('Orçado', filters),
    getTransactionsByScenario('A-1', filters)
  ]);

  const merged = [...real, ...orcado, ...anoAnterior];
  console.log(`✅ Total mesclado: ${merged.length} transações (Real: ${real.length}, Orçado: ${orcado.length}, A-1: ${anoAnterior.length})`);

  return merged;
}
