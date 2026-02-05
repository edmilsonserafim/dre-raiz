/**
 * CircuitBreaker - Proteção contra falhas consecutivas
 *
 * Implementa o padrão Circuit Breaker para prevenir cascata de falhas
 * quando o serviço downstream (Supabase) está com problemas.
 *
 * Estados:
 * - CLOSED: Normal, operações passam direto
 * - OPEN: Muitas falhas, rejeita operações por timeout
 * - HALF_OPEN: Timeout expirou, testa uma operação
 *
 * Fase 5 - Performance & Polish
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  /** Número de falhas consecutivas para abrir o circuit */
  failureThreshold: number;

  /** Tempo em ms para esperar antes de tentar novamente (estado OPEN) */
  openTimeout: number;

  /** Tempo em ms para considerar uma operação como sucesso (resetar contador) */
  successThreshold: number;

  /** Nome do circuit (para logs) */
  name: string;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  openedAt: number | null;
  halfOpenedAt: number | null;
}

/**
 * Circuit Breaker para proteção contra falhas
 */
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private openedAt: number | null = null;
  private halfOpenedAt: number | null = null;

  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      openTimeout: config.openTimeout ?? 60000, // 60s
      successThreshold: config.successThreshold ?? 2,
      name: config.name ?? 'CircuitBreaker'
    };
  }

  /**
   * Executa operação protegida pelo circuit breaker
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Verificar se pode executar
    if (!this.canExecute()) {
      const error = new Error(
        `Circuit breaker is OPEN for ${this.config.name}. ` +
        `Will retry after ${this.getRemainingTimeout()}ms`
      );
      this.logState('REJECTED', error.message);
      throw error;
    }

    // Se estiver HALF_OPEN, tentar uma operação de teste
    if (this.state === 'HALF_OPEN') {
      this.logState('TESTING', 'Attempting test operation in HALF_OPEN state');
    }

    try {
      // Executar operação
      const result = await operation();

      // Sucesso: registrar
      this.onSuccess();

      return result;
    } catch (error) {
      // Falha: registrar
      this.onFailure();

      throw error;
    }
  }

  /**
   * Verifica se pode executar operação
   */
  private canExecute(): boolean {
    // CLOSED: sempre pode executar
    if (this.state === 'CLOSED') {
      return true;
    }

    // HALF_OPEN: pode executar (tentativa de teste)
    if (this.state === 'HALF_OPEN') {
      return true;
    }

    // OPEN: verificar se timeout expirou
    if (this.state === 'OPEN') {
      const now = Date.now();
      const timeSinceOpened = now - (this.openedAt || 0);

      // Se timeout expirou, mudar para HALF_OPEN
      if (timeSinceOpened >= this.config.openTimeout) {
        this.transitionTo('HALF_OPEN');
        this.halfOpenedAt = now;
        return true;
      }

      // Ainda em timeout
      return false;
    }

    return false;
  }

  /**
   * Registra sucesso de operação
   */
  private onSuccess(): void {
    this.successes++;
    this.lastSuccessTime = Date.now();

    // Se estava HALF_OPEN e sucesso, voltar para CLOSED
    if (this.state === 'HALF_OPEN') {
      this.logState('SUCCESS_IN_HALF_OPEN', 'Test operation succeeded, closing circuit');
      this.transitionTo('CLOSED');
      this.reset();
      return;
    }

    // Se estava CLOSED, resetar contador de falhas
    if (this.state === 'CLOSED') {
      if (this.failures > 0) {
        this.logState('SUCCESS', `Resetting failure count (was ${this.failures})`);
        this.failures = 0;
      }
    }
  }

  /**
   * Registra falha de operação
   */
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    this.logState('FAILURE', `Failure count: ${this.failures}/${this.config.failureThreshold}`);

    // Se estava HALF_OPEN e falhou, voltar para OPEN
    if (this.state === 'HALF_OPEN') {
      this.logState('FAILURE_IN_HALF_OPEN', 'Test operation failed, reopening circuit');
      this.transitionTo('OPEN');
      this.openedAt = Date.now();
      return;
    }

    // Se atingiu threshold, abrir circuit
    if (this.failures >= this.config.failureThreshold) {
      this.logState('THRESHOLD_REACHED', `Opening circuit after ${this.failures} failures`);
      this.transitionTo('OPEN');
      this.openedAt = Date.now();
    }
  }

  /**
   * Transição de estado
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;

    console.log(
      `🔌 CircuitBreaker [${this.config.name}]: ${oldState} → ${newState}`
    );
  }

  /**
   * Reseta contadores
   */
  private reset(): void {
    this.failures = 0;
    this.successes = 0;
    this.openedAt = null;
    this.halfOpenedAt = null;
  }

  /**
   * Tempo restante de timeout (em ms)
   */
  private getRemainingTimeout(): number {
    if (this.state !== 'OPEN' || !this.openedAt) {
      return 0;
    }

    const now = Date.now();
    const elapsed = now - this.openedAt;
    const remaining = this.config.openTimeout - elapsed;

    return Math.max(0, remaining);
  }

  /**
   * Log de estado
   */
  private logState(event: string, message: string): void {
    console.log(
      `🔌 CircuitBreaker [${this.config.name}] [${this.state}] ${event}: ${message}`
    );
  }

  /**
   * Obtém estatísticas
   */
  public getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      openedAt: this.openedAt,
      halfOpenedAt: this.halfOpenedAt
    };
  }

  /**
   * Força reset do circuit (para testes ou admin)
   */
  public forceReset(): void {
    this.logState('FORCE_RESET', 'Manually resetting circuit breaker');
    this.transitionTo('CLOSED');
    this.reset();
  }

  /**
   * Verifica se está aberto
   */
  public isOpen(): boolean {
    return this.state === 'OPEN' && !this.canExecute();
  }

  /**
   * Verifica se está fechado
   */
  public isClosed(): boolean {
    return this.state === 'CLOSED';
  }

  /**
   * Verifica se está meio-aberto
   */
  public isHalfOpen(): boolean {
    return this.state === 'HALF_OPEN';
  }
}

// Singleton para operações do Supabase
export const supabaseCircuitBreaker = new CircuitBreaker({
  name: 'Supabase',
  failureThreshold: 5,
  openTimeout: 60000, // 60s
  successThreshold: 2
});
