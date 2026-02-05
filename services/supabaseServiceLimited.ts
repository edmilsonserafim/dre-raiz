import { supabase } from '../supabase';
import { Transaction, ManualChange } from '../types';
import * as originalService from './supabaseService';

// Exportar tudo do serviço original, exceto getAllTransactions
export * from './supabaseService';

// Versão otimizada que carrega apenas últimas 5000 transações
export const getAllTransactions = async (): Promise<Transaction[]> => {
  console.log('🔄 Carregando últimas 5000 transações (limite de segurança)...');

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .limit(5000);

    if (error) {
      console.error('❌ Erro ao carregar transações:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('⚠️ Nenhuma transação encontrada');
      return [];
    }

    console.log(`✅ ${data.length} transações carregadas com sucesso!`);

    // Converter do formato do banco para o formato do app
    const transactions = data.map((db: any) => ({
      id: db.id,
      date: db.date,
      description: db.description,
      category: db.category,
      amount: db.amount,
      type: db.type,
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
    }));

    return transactions;
  } catch (error) {
    console.error('❌ Erro fatal ao carregar transações:', error);
    return [];
  }
};
