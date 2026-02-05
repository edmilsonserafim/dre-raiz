import { Transaction } from '../../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TIPOS PARA SINCRONIZAÇÃO BIDIRECIONAL
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Este arquivo define os tipos TypeScript necessários para o sistema de
 * sincronização bidirecional entre a UI e o Supabase.
 */

/**
 * Representa um conflito detectado entre versão local e servidor
 */
export interface Conflict {
  id: string;
  transactionId: string;
  localVersion: Transaction;
  serverVersion: Transaction;
  detectedAt: number;
  resolved: boolean;
  conflictingFields: string[];  // Lista de campos que diferem
}

/**
 * Estratégia de resolução de conflitos
 */
export type ConflictResolutionStrategy =
  | 'last-write-wins'       // Última escrita vence (baseado em updated_at)
  | 'manual'                // Requer intervenção do usuário
  | 'field-level-merge';    // Merge automático campo-a-campo

/**
 * Operação pendente na fila
 */
export interface PendingOperation {
  id: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  transactionId: string;
  data: Partial<Transaction>;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'executing' | 'failed';
  error?: string;
}

/**
 * Status da conexão Realtime
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

/**
 * Resultado de uma operação com detecção de conflito
 */
export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  conflict?: Transaction;
  error?: string;
}

/**
 * Configuração de retry com exponential backoff
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;        // Delay base em ms
  maxDelay: number;         // Delay máximo em ms
  exponentialFactor: number; // Fator de multiplicação (ex: 2 = dobra a cada retry)
}

/**
 * Callbacks para eventos Realtime
 */
export interface RealtimeCallbacks {
  onInsert: (transaction: Transaction) => void;
  onUpdate: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Estatísticas de sincronização (para monitoramento)
 */
export interface SyncStats {
  operationsInQueue: number;
  conflictsDetected: number;
  conflictsResolved: number;
  lastSyncTime: number | null;
  failedOperations: number;
  totalOperations: number;
}

/**
 * [FASE 4] Entrada no histórico de conflitos
 */
export interface ConflictHistoryEntry {
  id: string;
  conflictId: string;
  transactionId: string;
  detectedAt: number;
  resolvedAt: number;
  strategy: ConflictResolutionStrategy;
  resolution: 'keep-local' | 'use-server' | 'auto-merged';
  conflictingFields: string[];
  autoMergedFields?: string[];
  severity: 'low' | 'medium' | 'high';
  resolvedBy: 'user' | 'system';
}
