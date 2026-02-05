/**
 * ConflictHistory - Histórico de Conflitos Resolvidos
 *
 * Registra todos os conflitos detectados e resolvidos para auditoria e análise.
 * Utiliza localStorage para persistência.
 *
 * Fase 4 - Advanced Conflict Resolution
 */

import type { ConflictHistoryEntry, Conflict, ConflictResolutionStrategy } from '../types/sync';

const STORAGE_KEY = 'dre_conflict_history';
const MAX_HISTORY_SIZE = 1000; // Máximo de entradas no histórico

/**
 * Serviço de Histórico de Conflitos
 */
export class ConflictHistory {
  private history: ConflictHistoryEntry[] = [];

  constructor() {
    this.loadFromLocalStorage();
  }

  /**
   * Registra um conflito resolvido no histórico
   */
  public recordResolution(
    conflict: Conflict,
    strategy: ConflictResolutionStrategy,
    resolution: 'keep-local' | 'use-server' | 'auto-merged',
    autoMergedFields?: string[],
    severity: 'low' | 'medium' | 'high' = 'medium',
    resolvedBy: 'user' | 'system' = 'user'
  ): void {
    const entry: ConflictHistoryEntry = {
      id: `history_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      conflictId: conflict.id,
      transactionId: conflict.transactionId,
      detectedAt: conflict.detectedAt,
      resolvedAt: Date.now(),
      strategy,
      resolution,
      conflictingFields: conflict.conflictingFields,
      autoMergedFields,
      severity,
      resolvedBy
    };

    // Adicionar ao histórico
    this.history.unshift(entry); // Mais recentes primeiro

    // Limitar tamanho do histórico
    if (this.history.length > MAX_HISTORY_SIZE) {
      this.history = this.history.slice(0, MAX_HISTORY_SIZE);
    }

    // Persistir
    this.saveToLocalStorage();

    console.log(`📜 ConflictHistory: Conflito registrado no histórico`, entry);
  }

  /**
   * Obtém todo o histórico
   */
  public getHistory(): ConflictHistoryEntry[] {
    return [...this.history];
  }

  /**
   * Obtém histórico de uma transação específica
   */
  public getHistoryForTransaction(transactionId: string): ConflictHistoryEntry[] {
    return this.history.filter(entry => entry.transactionId === transactionId);
  }

  /**
   * Obtém estatísticas do histórico
   */
  public getStats(): {
    total: number;
    byStrategy: Record<ConflictResolutionStrategy, number>;
    bySeverity: Record<'low' | 'medium' | 'high', number>;
    byResolvedBy: Record<'user' | 'system', number>;
    avgResolutionTime: number;
  } {
    const stats = {
      total: this.history.length,
      byStrategy: {
        'last-write-wins': 0,
        'manual': 0,
        'field-level-merge': 0
      } as Record<ConflictResolutionStrategy, number>,
      bySeverity: {
        'low': 0,
        'medium': 0,
        'high': 0
      },
      byResolvedBy: {
        'user': 0,
        'system': 0
      },
      avgResolutionTime: 0
    };

    let totalResolutionTime = 0;

    this.history.forEach(entry => {
      // Contar por estratégia
      stats.byStrategy[entry.strategy]++;

      // Contar por severidade
      stats.bySeverity[entry.severity]++;

      // Contar por resolvedBy
      stats.byResolvedBy[entry.resolvedBy]++;

      // Somar tempo de resolução
      totalResolutionTime += entry.resolvedAt - entry.detectedAt;
    });

    // Calcular média de tempo de resolução
    if (this.history.length > 0) {
      stats.avgResolutionTime = Math.round(totalResolutionTime / this.history.length);
    }

    return stats;
  }

  /**
   * Obtém conflitos recentes (últimas N entradas)
   */
  public getRecent(limit: number = 10): ConflictHistoryEntry[] {
    return this.history.slice(0, limit);
  }

  /**
   * Limpa histórico antigo (mais de X dias)
   */
  public cleanOldHistory(daysOld: number = 30): number {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    const oldLength = this.history.length;

    this.history = this.history.filter(entry => entry.resolvedAt > cutoffTime);

    const removed = oldLength - this.history.length;

    if (removed > 0) {
      this.saveToLocalStorage();
      console.log(`🗑️ ConflictHistory: ${removed} entradas antigas removidas`);
    }

    return removed;
  }

  /**
   * Limpa todo o histórico
   */
  public clearAll(): void {
    this.history = [];
    this.saveToLocalStorage();
    console.log(`🗑️ ConflictHistory: Histórico limpo`);
  }

  /**
   * Exporta histórico como JSON
   */
  public exportToJSON(): string {
    return JSON.stringify(this.history, null, 2);
  }

  /**
   * Importa histórico de JSON
   */
  public importFromJSON(json: string): boolean {
    try {
      const imported = JSON.parse(json) as ConflictHistoryEntry[];

      // Validação básica
      if (!Array.isArray(imported)) {
        throw new Error('JSON inválido: não é um array');
      }

      this.history = imported;
      this.saveToLocalStorage();

      console.log(`📥 ConflictHistory: ${imported.length} entradas importadas`);
      return true;
    } catch (error) {
      console.error('❌ ConflictHistory: Erro ao importar JSON:', error);
      return false;
    }
  }

  /**
   * Salva histórico no localStorage
   */
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
    } catch (error) {
      console.error('❌ ConflictHistory: Erro ao salvar no localStorage:', error);
    }
  }

  /**
   * Carrega histórico do localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.history = JSON.parse(stored);
        console.log(`📜 ConflictHistory: ${this.history.length} entradas carregadas do localStorage`);
      }
    } catch (error) {
      console.error('❌ ConflictHistory: Erro ao carregar do localStorage:', error);
      this.history = [];
    }
  }
}

// Singleton instance
export const conflictHistory = new ConflictHistory();
