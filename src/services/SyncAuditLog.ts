/**
 * SyncAuditLog - Log de Auditoria de Sincronização
 *
 * Registra TODAS as operações de sincronização (INSERT, UPDATE, DELETE, Realtime)
 * para auditoria, debug e análise de performance.
 *
 * Utiliza localStorage para persistência.
 *
 * Fase 4 - Advanced Conflict Resolution
 */

import type { Transaction } from '../../types';

/**
 * Tipo de operação no log
 */
export type AuditOperationType =
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | 'BULK_INSERT'
  | 'REALTIME_INSERT'
  | 'REALTIME_UPDATE'
  | 'REALTIME_DELETE';

/**
 * Status da operação
 */
export type AuditOperationStatus =
  | 'success'
  | 'failed'
  | 'conflict'
  | 'rollback';

/**
 * Entrada no log de auditoria
 */
export interface AuditLogEntry {
  id: string;
  timestamp: number;
  operationType: AuditOperationType;
  transactionId: string;
  status: AuditOperationStatus;
  duration?: number; // Duração em ms
  error?: string;
  conflictId?: string;
  changedFields?: string[]; // Campos modificados (para UPDATE)
  dataSnapshot?: Partial<Transaction>; // Snapshot dos dados (opcional)
}

const STORAGE_KEY = 'dre_sync_audit_log';
const MAX_LOG_SIZE = 5000; // Máximo de entradas no log

/**
 * Serviço de Log de Auditoria de Sincronização
 */
export class SyncAuditLog {
  private log: AuditLogEntry[] = [];

  constructor() {
    this.loadFromLocalStorage();
  }

  /**
   * Registra uma operação no log
   */
  public recordOperation(
    operationType: AuditOperationType,
    transactionId: string,
    status: AuditOperationStatus,
    options?: {
      duration?: number;
      error?: string;
      conflictId?: string;
      changedFields?: string[];
      dataSnapshot?: Partial<Transaction>;
    }
  ): void {
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      operationType,
      transactionId,
      status,
      ...options
    };

    // Adicionar ao log
    this.log.unshift(entry); // Mais recentes primeiro

    // Limitar tamanho do log
    if (this.log.length > MAX_LOG_SIZE) {
      this.log = this.log.slice(0, MAX_LOG_SIZE);
    }

    // Persistir
    this.saveToLocalStorage();

    // Log no console (apenas para debug)
    if (status === 'failed' || status === 'conflict') {
      console.warn(`⚠️ SyncAuditLog: Operação ${operationType} falhou`, entry);
    } else {
      console.log(`📝 SyncAuditLog: ${operationType} - ${status}`, entry.id);
    }
  }

  /**
   * Inicia rastreamento de uma operação (retorna função para finalizar)
   */
  public startTracking(
    operationType: AuditOperationType,
    transactionId: string
  ): (status: AuditOperationStatus, options?: Omit<AuditLogEntry, 'id' | 'timestamp' | 'operationType' | 'transactionId' | 'status' | 'duration'>) => void {
    const startTime = Date.now();

    // Retorna função de finalização
    return (status, options) => {
      const duration = Date.now() - startTime;

      this.recordOperation(operationType, transactionId, status, {
        duration,
        ...options
      });
    };
  }

  /**
   * Obtém todo o log
   */
  public getLog(): AuditLogEntry[] {
    return [...this.log];
  }

  /**
   * Obtém log de uma transação específica
   */
  public getLogForTransaction(transactionId: string): AuditLogEntry[] {
    return this.log.filter(entry => entry.transactionId === transactionId);
  }

  /**
   * Obtém logs recentes (últimas N entradas)
   */
  public getRecent(limit: number = 50): AuditLogEntry[] {
    return this.log.slice(0, limit);
  }

  /**
   * Obtém logs por tipo de operação
   */
  public getByOperationType(operationType: AuditOperationType): AuditLogEntry[] {
    return this.log.filter(entry => entry.operationType === operationType);
  }

  /**
   * Obtém logs por status
   */
  public getByStatus(status: AuditOperationStatus): AuditLogEntry[] {
    return this.log.filter(entry => entry.status === status);
  }

  /**
   * Obtém estatísticas do log
   */
  public getStats(): {
    total: number;
    byType: Record<AuditOperationType, number>;
    byStatus: Record<AuditOperationStatus, number>;
    avgDuration: number;
    successRate: number;
    failureRate: number;
    conflictRate: number;
  } {
    const stats = {
      total: this.log.length,
      byType: {
        'INSERT': 0,
        'UPDATE': 0,
        'DELETE': 0,
        'BULK_INSERT': 0,
        'REALTIME_INSERT': 0,
        'REALTIME_UPDATE': 0,
        'REALTIME_DELETE': 0
      } as Record<AuditOperationType, number>,
      byStatus: {
        'success': 0,
        'failed': 0,
        'conflict': 0,
        'rollback': 0
      } as Record<AuditOperationStatus, number>,
      avgDuration: 0,
      successRate: 0,
      failureRate: 0,
      conflictRate: 0
    };

    let totalDuration = 0;
    let operationsWithDuration = 0;

    this.log.forEach(entry => {
      // Contar por tipo
      stats.byType[entry.operationType]++;

      // Contar por status
      stats.byStatus[entry.status]++;

      // Somar duração
      if (entry.duration !== undefined) {
        totalDuration += entry.duration;
        operationsWithDuration++;
      }
    });

    // Calcular médias e taxas
    if (operationsWithDuration > 0) {
      stats.avgDuration = Math.round(totalDuration / operationsWithDuration);
    }

    if (this.log.length > 0) {
      stats.successRate = (stats.byStatus.success / this.log.length) * 100;
      stats.failureRate = (stats.byStatus.failed / this.log.length) * 100;
      stats.conflictRate = (stats.byStatus.conflict / this.log.length) * 100;
    }

    return stats;
  }

  /**
   * Obtém performance metrics (últimas 100 operações)
   */
  public getPerformanceMetrics(): {
    avgDuration: number;
    p50: number; // Mediana
    p95: number; // 95th percentile
    p99: number; // 99th percentile
    slowestOperations: AuditLogEntry[];
  } {
    const recent = this.log
      .slice(0, 100)
      .filter(entry => entry.duration !== undefined)
      .sort((a, b) => (a.duration || 0) - (b.duration || 0));

    if (recent.length === 0) {
      return {
        avgDuration: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        slowestOperations: []
      };
    }

    const durations = recent.map(e => e.duration!);
    const sum = durations.reduce((acc, d) => acc + d, 0);

    const p50Index = Math.floor(recent.length * 0.5);
    const p95Index = Math.floor(recent.length * 0.95);
    const p99Index = Math.floor(recent.length * 0.99);

    return {
      avgDuration: Math.round(sum / recent.length),
      p50: durations[p50Index],
      p95: durations[p95Index],
      p99: durations[p99Index],
      slowestOperations: this.log
        .filter(e => e.duration !== undefined)
        .sort((a, b) => (b.duration || 0) - (a.duration || 0))
        .slice(0, 5)
    };
  }

  /**
   * Limpa logs antigos (mais de X dias)
   */
  public cleanOldLogs(daysOld: number = 7): number {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    const oldLength = this.log.length;

    this.log = this.log.filter(entry => entry.timestamp > cutoffTime);

    const removed = oldLength - this.log.length;

    if (removed > 0) {
      this.saveToLocalStorage();
      console.log(`🗑️ SyncAuditLog: ${removed} logs antigos removidos`);
    }

    return removed;
  }

  /**
   * Limpa todo o log
   */
  public clearAll(): void {
    this.log = [];
    this.saveToLocalStorage();
    console.log(`🗑️ SyncAuditLog: Log limpo`);
  }

  /**
   * Exporta log como JSON
   */
  public exportToJSON(): string {
    return JSON.stringify(this.log, null, 2);
  }

  /**
   * Exporta log como CSV
   */
  public exportToCSV(): string {
    const headers = ['ID', 'Timestamp', 'OperationType', 'TransactionID', 'Status', 'Duration', 'Error'];
    const rows = this.log.map(entry => [
      entry.id,
      new Date(entry.timestamp).toISOString(),
      entry.operationType,
      entry.transactionId,
      entry.status,
      entry.duration?.toString() || '',
      entry.error || ''
    ]);

    const csvLines = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ];

    return csvLines.join('\n');
  }

  /**
   * Salva log no localStorage
   */
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.log));
    } catch (error) {
      console.error('❌ SyncAuditLog: Erro ao salvar no localStorage:', error);
    }
  }

  /**
   * Carrega log do localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.log = JSON.parse(stored);
        console.log(`📝 SyncAuditLog: ${this.log.length} entradas carregadas do localStorage`);
      }
    } catch (error) {
      console.error('❌ SyncAuditLog: Erro ao carregar do localStorage:', error);
      this.log = [];
    }
  }
}

// Singleton instance
export const syncAuditLog = new SyncAuditLog();
