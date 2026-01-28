
export type TransactionType = 'REVENUE' | 'FIXED_COST' | 'VARIABLE_COST' | 'SGA' | 'RATEIO';
export type TransactionStatus = 'Normal' | 'Pendente' | 'Ajustado' | 'Rateado' | 'Excluído';

export interface User {
  name: string;
  email: string;
  photo: string;
  role: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: TransactionType;
  branch: string;
  status: TransactionStatus;
  scenario?: string;
  tag01?: string;
  tag02?: string;
  tag03?: string;
  brand?: string;
  ticket?: string;
  vendor?: string;
  recurring?: string;
  justification?: string;
}

export interface ManualChange {
  id: string;
  transactionId: string;
  originalTransaction: Transaction;
  description: string;
  type: 'CONTA' | 'DATA' | 'RATEIO' | 'EXCLUSAO' | 'MARCA' | 'FILIAL' | 'MULTI';
  fieldChanged?: string;     // Campo que foi alterado (para MULTI, CONTA, etc)
  oldValue: string;
  newValue: string;
  justification?: string;    // Justificativa da mudança (obrigatório no banco)
  status: 'Pendente' | 'Aplicado' | 'Reprovado';
  requestedAt: string;
  requestedBy: string;
  requestedByName?: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface SchoolKPIs {
  totalRevenue: number;
  totalFixedCosts: number;
  totalVariableCosts: number;
  sgaCosts: number;
  ebitda: number;
  netMargin: number;
  costPerStudent: number;
  revenuePerStudent: number;
  activeStudents: number;
  breakEvenPoint: number;
  defaultRate: number;
  targetEbitda: number;
  costReductionNeeded: number;
  marginOfSafety: number;
  churnRate: number;
  waterPerStudent: number;
  energyPerClassroom: number;
  consumptionMaterialPerStudent: number;
  eventsPerStudent: number;
}

export interface IAInsight {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: 'Driver Positivo' | 'Driver Negativo' | 'Ação Recomendada';
}

export type ViewType = 'dashboard' | 'kpis' | 'insights' | 'dre' | 'forecasting' | 'manual_changes' | 'assistant' | 'movements' | 'settings' | 'admin';
