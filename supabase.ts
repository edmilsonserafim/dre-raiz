import { createClient } from '@supabase/supabase-js';

// As variáveis de ambiente serão configuradas na Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration error:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'MISSING');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'MISSING');
  throw new Error('Supabase URL and Anon Key must be set in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para o banco de dados
export interface DatabaseTransaction {
  id: string;
  date: string;
  description: string;
  conta_contabil: string;  // Popula coluna "Conta" na UI
  category?: string | null;  // Existe no banco mas não é usada no momento (reservada para futuro)
  amount: number;
  type: string;
  scenario: string;
  status: string;
  filial: string;
  marca?: string | null;
  tag0?: string | null;
  tag01?: string | null;
  tag02?: string | null;
  tag03?: string | null;
  recurring?: string | null;
  ticket?: string | null;
  vendor?: string | null;
  nat_orc?: string | null;
  chave_id?: string | null;
  nome_filial?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseManualChange {
  id: string;
  transaction_id: string;
  type: string;
  field_changed?: string;
  old_value?: string;
  new_value: string;
  justification: string;
  status: string;
  requested_at: string;
  requested_by: string;
  requested_by_name: string;
  approved_at?: string;
  approved_by?: string;
  approved_by_name?: string;
  original_transaction: any;
  created_at?: string;
  updated_at?: string;
}
