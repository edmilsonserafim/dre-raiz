import { supabase, DatabaseTransaction, DatabaseManualChange } from '../supabase';
import { Transaction, ManualChange } from '../types';

// Converter Transaction do app para formato do banco
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
    filial: t.filial
  };

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
  category: db.category,
  amount: db.amount,
  type: db.type as any,
  scenario: db.scenario,
  status: db.status,
  filial: db.filial,
  marca: db.marca,
  tag01: db.tag01,
  tag02: db.tag02,
  tag03: db.tag03,
  recurring: db.recurring || undefined,
  ticket: db.ticket || undefined,
  vendor: db.vendor || undefined,
  nat_orc: db.nat_orc || undefined,
  chave_id: db.chave_id || undefined
});

// VERSÃO INTELIGENTE: Carrega apenas últimos 3 meses por padrão
export const getAllTransactions = async (monthsBack: number = 3): Promise<Transaction[]> => {
  console.log(`🔄 Carregando últimos ${monthsBack} meses de transações...`);

  try {
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
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('⚠️ Nenhuma transação encontrada no período');
      return [];
    }

    console.log(`✅ ${data.length} transações carregadas (de ${count} no período)!`);

    const transactions = data.map(dbToTransaction);
    return transactions;
  } catch (error) {
    console.error('❌ Erro fatal ao carregar transações:', error);
    return [];
  }
};

// Exportar outras funções do serviço original
export * from './supabaseService';
