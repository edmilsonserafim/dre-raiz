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
  category: string;
  amount: number;
  type: string;
  scenario: string;
  status: string;
  branch: string;
  brand?: string | null;
  tag01?: string | null;
  tag02?: string | null;
  tag03?: string | null;
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
  original_transaction: any;
  created_at?: string;
  updated_at?: string;
}
