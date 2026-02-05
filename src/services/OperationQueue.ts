import { PendingOperation, RetryConfig } from '../types/sync';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OPERATION QUEUE - FILA DE OPERAÇÕES PENDENTES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Gerencia uma fila de operações (INSERT/UPDATE/DELETE) que aguardam
 * sincronização com o servidor. Suporta retry com exponential backoff
 * e persistence no localStorage para futuro modo offline.
 */

const STORAGE_KEY = 'transactionsOperationQueue';

export class OperationQueue {
  private queue: PendingOperation[] = [];
  private isProcessing = false;

  private retryConfig: RetryConfig = {
    maxRetries: 5,        // [FASE 5] Aumentado de 3 para 5
    baseDelay: 1000,      // 1 segundo
    maxDelay: 30000,      // 30 segundos
    exponentialFactor: 2  // Delays: 1s, 2s, 4s, 8s, 16s (capped at 30s)
  };

  constructor() {
    this.loadFromLocalStorage();
  }

  /**
   * Adiciona operação à fila
   */
  enqueue(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>): string {
    const id = this.generateOperationId();
    const newOperation: PendingOperation = {
      ...operation,
      id,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending'
    };

    this.queue.push(newOperation);
    this.saveToLocalStorage();

    console.log(`✅ Operation enqueued: ${operation.type} for transaction ${operation.transactionId}`);
    return id;
  }

  /**
   * Remove operação da fila pelo ID
   */
  dequeue(operationId: string): void {
    const index = this.queue.findIndex(op => op.id === operationId);
    if (index !== -1) {
      const operation = this.queue[index];
      this.queue.splice(index, 1);
      this.saveToLocalStorage();
      console.log(`✅ Operation dequeued: ${operation.type} for transaction ${operation.transactionId}`);
    }
  }

  /**
   * Busca operação por ID
   */
  getOperation(operationId: string): PendingOperation | undefined {
    return this.queue.find(op => op.id === operationId);
  }

  /**
   * Retorna todas as operações da fila
   */
  getAll(): PendingOperation[] {
    return [...this.queue];
  }

  /**
   * Retorna operações pendentes (não em execução)
   */
  getPending(): PendingOperation[] {
    return this.queue.filter(op => op.status === 'pending');
  }

  /**
   * Retorna operações com falha
   */
  getFailed(): PendingOperation[] {
    return this.queue.filter(op => op.status === 'failed');
  }

  /**
   * Marca operação como executando
   */
  markAsExecuting(operationId: string): void {
    const operation = this.queue.find(op => op.id === operationId);
    if (operation) {
      operation.status = 'executing';
      this.saveToLocalStorage();
    }
  }

  /**
   * Marca operação como falha e incrementa retry count
   *
   * [FASE 5] Verifica se erro é retryable:
   * - Se não for retryable (4xx): remove da fila imediatamente
   * - Se for retryable: incrementa retry count e aguarda
   */
  markAsFailed(operationId: string, error: string): void {
    const operation = this.queue.find(op => op.id === operationId);
    if (!operation) return;

    // [FASE 5] Verificar se erro é retryable
    if (!this.isRetryableError(error)) {
      console.error(`❌ Operation failed with non-retryable error, removing from queue:`, error);
      this.dequeue(operationId);
      return;
    }

    // Erro retryable: incrementar contador
    operation.status = 'failed';
    operation.retryCount++;
    operation.error = error;
    this.saveToLocalStorage();

    const nextDelay = this.calculateRetryDelay(operation.retryCount);
    console.warn(
      `⚠️ Operation failed (attempt ${operation.retryCount}/${this.retryConfig.maxRetries}). ` +
      `Next retry in ~${Math.round(nextDelay / 1000)}s: ${error}`
    );
  }

  /**
   * Processa fila de operações
   * Retorna array de operações que devem ser executadas (respeitando retry delay)
   */
  async processQueue(): Promise<PendingOperation[]> {
    if (this.isProcessing) {
      return [];
    }

    this.isProcessing = true;

    try {
      const operationsToExecute: PendingOperation[] = [];
      const now = Date.now();

      for (const operation of this.queue) {
        // Pular operações já em execução
        if (operation.status === 'executing') {
          continue;
        }

        // Verificar se operação falhou muitas vezes
        if (operation.retryCount >= this.retryConfig.maxRetries) {
          console.error(`❌ Operation exceeded max retries:`, operation);
          continue;
        }

        // Verificar se já passou o delay de retry
        if (operation.status === 'failed') {
          const retryDelay = this.calculateRetryDelay(operation.retryCount);
          const nextRetryTime = operation.timestamp + retryDelay;

          if (now < nextRetryTime) {
            // Ainda não é hora de retry
            continue;
          }
        }

        // Adicionar à lista de execução
        operationsToExecute.push(operation);
      }

      return operationsToExecute;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Calcula delay para retry com exponential backoff + jitter
   *
   * [FASE 5] Melhorado com:
   * - Delays mais progressivos: 1s → 2s → 5s → 10s → 20s
   * - Jitter (randomização) para evitar thundering herd
   */
  private calculateRetryDelay(retryCount: number): number {
    // Delays progressivos customizados
    const customDelays = [1000, 2000, 5000, 10000, 20000, 30000];
    const baseDelay = customDelays[retryCount] || this.retryConfig.maxDelay;

    // Adicionar jitter: ±25% do delay
    const jitter = baseDelay * 0.25;
    const randomJitter = (Math.random() * 2 - 1) * jitter; // -25% a +25%
    const delayWithJitter = baseDelay + randomJitter;

    // Garantir que não ultrapassa maxDelay
    return Math.min(Math.max(delayWithJitter, 0), this.retryConfig.maxDelay);
  }

  /**
   * [FASE 5] Verifica se um erro deve ser retryable
   *
   * Retry apenas em:
   * - Erros de rede (network, timeout)
   * - Erros 5xx (servidor)
   * - Erros 409 (conflict - será resolvido)
   * - Erros 429 (rate limit)
   * - Circuit breaker OPEN
   *
   * NÃO retry em:
   * - Erros 4xx (exceto 409 e 429) - erro do cliente
   * - Erros de validação
   */
  isRetryableError(errorMessage: string): boolean {
    const msg = errorMessage.toLowerCase();

    // Erros que devem fazer retry
    const retryable = [
      'network',
      'timeout',
      'failed to fetch',
      'circuit breaker',
      '5', // 5xx errors
      '409', // Conflict
      '429', // Rate limit
      'econnrefused',
      'enotfound',
      'etimedout'
    ];

    // Erros que NÃO devem fazer retry
    const nonRetryable = [
      '400', '401', '403', '404', '405', '406', '410', '422',
      'invalid',
      'unauthorized',
      'forbidden',
      'not found',
      'validation'
    ];

    // Verificar se é não-retryable
    if (nonRetryable.some(pattern => msg.includes(pattern))) {
      return false;
    }

    // Verificar se é retryable
    if (retryable.some(pattern => msg.includes(pattern))) {
      return true;
    }

    // Por padrão, retry (fail-safe)
    return true;
  }

  /**
   * Limpa todas as operações da fila
   */
  clear(): void {
    this.queue = [];
    this.saveToLocalStorage();
    console.log('✅ Operation queue cleared');
  }

  /**
   * Remove operações antigas com falha (mais de 1 hora)
   */
  cleanupOldFailures(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const before = this.queue.length;

    this.queue = this.queue.filter(op => {
      if (op.status === 'failed' && op.timestamp < oneHourAgo) {
        return false; // Remove
      }
      return true; // Mantém
    });

    const removed = before - this.queue.length;
    if (removed > 0) {
      this.saveToLocalStorage();
      console.log(`🧹 Cleaned up ${removed} old failed operations`);
    }
  }

  /**
   * Salva fila no localStorage
   */
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save operation queue to localStorage:', error);
    }
  }

  /**
   * Carrega fila do localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`📦 Loaded ${this.queue.length} operations from localStorage`);
      }
    } catch (error) {
      console.error('Failed to load operation queue from localStorage:', error);
      this.queue = [];
    }
  }

  /**
   * Gera ID único para operação
   */
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Retorna estatísticas da fila
   */
  getStats() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(op => op.status === 'pending').length,
      executing: this.queue.filter(op => op.status === 'executing').length,
      failed: this.queue.filter(op => op.status === 'failed').length
    };
  }
}

// Export singleton instance
export const operationQueue = new OperationQueue();
