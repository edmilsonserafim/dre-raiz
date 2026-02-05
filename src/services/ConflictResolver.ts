/**
 * ConflictResolver - Advanced Conflict Resolution Service
 *
 * Implementa estratégias automáticas e manuais para resolver conflitos
 * de sincronização entre versões local e servidor de transações.
 *
 * Estratégias:
 * - Last-Write-Wins (LWW): Versão mais recente vence
 * - Manual: Usuário escolhe versão
 * - Field-Level-Merge: Merge campo-a-campo automático
 *
 * Fase 4 - Advanced Conflict Resolution
 */

import type { Transaction } from '../types';
import type { Conflict, ConflictResolutionStrategy } from '../types/sync';

/**
 * Resultado da resolução de conflito
 */
export interface ConflictResolutionResult {
  /** Transação final após resolução */
  resolved: Transaction;

  /** Estratégia utilizada */
  strategy: ConflictResolutionStrategy;

  /** Se requer intervenção manual */
  requiresManual: boolean;

  /** Campos que foram mesclados automaticamente */
  autoMergedFields?: string[];

  /** Campos que requerem escolha manual */
  manualFields?: string[];

  /** Explicação da resolução (para logs) */
  reason?: string;
}

/**
 * Configuração de campos críticos
 */
interface FieldConfig {
  /** Campos financeiros críticos (sempre requerem manual) */
  criticalFinancial: string[];

  /** Campos categóricos críticos (sempre requerem manual) */
  criticalCategorical: string[];

  /** Campos descritivos (podem usar LWW) */
  descriptive: string[];

  /** Campos metadados (sempre LWW) */
  metadata: string[];
}

/**
 * Serviço de Resolução de Conflitos
 */
export class ConflictResolver {
  private strategy: ConflictResolutionStrategy;
  private fieldConfig: FieldConfig;

  constructor(strategy: ConflictResolutionStrategy = 'field-level-merge') {
    this.strategy = strategy;

    // Configuração de campos por importância
    this.fieldConfig = {
      criticalFinancial: ['amount'], // Valores financeiros
      criticalCategorical: ['category', 'type', 'status', 'scenario'], // Categorização
      descriptive: ['description', 'tag01', 'tag02', 'tag03', 'ticket', 'vendor', 'nat_orc'], // Descritivos
      metadata: ['updated_at', 'chave_id', 'recurring'] // Metadados
    };
  }

  /**
   * Resolve um conflito usando a estratégia configurada
   */
  public resolve(
    conflict: Conflict,
    userChoice?: 'keep-local' | 'use-server'
  ): ConflictResolutionResult {
    const { localVersion, serverVersion } = conflict;

    // Se usuário escolheu explicitamente
    if (userChoice) {
      return {
        resolved: userChoice === 'keep-local' ? localVersion : serverVersion,
        strategy: 'manual',
        requiresManual: false,
        reason: `Usuário escolheu: ${userChoice === 'keep-local' ? 'versão local' : 'versão servidor'}`
      };
    }

    // Aplicar estratégia configurada
    switch (this.strategy) {
      case 'last-write-wins':
        return this.resolveLastWriteWins(localVersion, serverVersion);

      case 'field-level-merge':
        return this.resolveFieldLevelMerge(conflict);

      case 'manual':
      default:
        return {
          resolved: localVersion,
          strategy: 'manual',
          requiresManual: true,
          reason: 'Estratégia manual configurada - requer intervenção do usuário'
        };
    }
  }

  /**
   * Estratégia: Last-Write-Wins (versão mais recente vence)
   */
  private resolveLastWriteWins(
    local: Transaction,
    server: Transaction
  ): ConflictResolutionResult {
    const localTime = new Date(local.updated_at).getTime();
    const serverTime = new Date(server.updated_at).getTime();

    const winner = localTime > serverTime ? local : server;
    const isLocal = localTime > serverTime;

    return {
      resolved: winner,
      strategy: 'last-write-wins',
      requiresManual: false,
      reason: `Last-Write-Wins: ${isLocal ? 'versão local' : 'versão servidor'} mais recente (${new Date(winner.updated_at).toLocaleString()})`
    };
  }

  /**
   * Estratégia: Field-Level-Merge (merge campo-a-campo)
   *
   * Lógica:
   * - Campos críticos (amount, category): requer manual
   * - Campos descritivos: LWW
   * - Campos iguais: usa qualquer versão
   */
  private resolveFieldLevelMerge(conflict: Conflict): ConflictResolutionResult {
    const { localVersion, serverVersion, conflictingFields } = conflict;

    // Identificar campos críticos que conflitam
    const criticalConflicts = conflictingFields.filter(field =>
      this.isCriticalField(field)
    );

    // Se houver conflitos em campos críticos → MANUAL
    if (criticalConflicts.length > 0) {
      return {
        resolved: localVersion,
        strategy: 'field-level-merge',
        requiresManual: true,
        manualFields: criticalConflicts,
        reason: `Conflitos em campos críticos: ${criticalConflicts.join(', ')}`
      };
    }

    // Merge automático campo-a-campo (apenas campos descritivos)
    const merged = this.mergeFields(localVersion, serverVersion, conflictingFields);

    return {
      resolved: merged,
      strategy: 'field-level-merge',
      requiresManual: false,
      autoMergedFields: conflictingFields,
      reason: `Merge automático de ${conflictingFields.length} campos não-críticos`
    };
  }

  /**
   * Verifica se um campo é considerado crítico
   */
  private isCriticalField(field: string): boolean {
    return (
      this.fieldConfig.criticalFinancial.includes(field) ||
      this.fieldConfig.criticalCategorical.includes(field)
    );
  }

  /**
   * Merge campo-a-campo usando Last-Write-Wins para cada campo
   */
  private mergeFields(
    local: Transaction,
    server: Transaction,
    conflictingFields: string[]
  ): Transaction {
    const merged = { ...local };
    const localTime = new Date(local.updated_at).getTime();
    const serverTime = new Date(server.updated_at).getTime();

    // Para campos descritivos conflitantes, usar versão mais recente
    conflictingFields.forEach(field => {
      if (!this.isCriticalField(field)) {
        // LWW para campos descritivos
        merged[field as keyof Transaction] = (
          localTime > serverTime
            ? local[field as keyof Transaction]
            : server[field as keyof Transaction]
        ) as any;
      }
    });

    // Sempre usar updated_at mais recente
    merged.updated_at = localTime > serverTime ? local.updated_at : server.updated_at;

    return merged;
  }

  /**
   * Analisa um conflito e sugere a melhor estratégia
   */
  public analyzeConflict(conflict: Conflict): {
    suggestedStrategy: ConflictResolutionStrategy;
    severity: 'low' | 'medium' | 'high';
    reason: string;
  } {
    const { conflictingFields } = conflict;

    // Verificar campos críticos
    const hasCriticalFinancial = conflictingFields.some(field =>
      this.fieldConfig.criticalFinancial.includes(field)
    );

    const hasCriticalCategorical = conflictingFields.some(field =>
      this.fieldConfig.criticalCategorical.includes(field)
    );

    // Conflito financeiro = ALTA severidade
    if (hasCriticalFinancial) {
      return {
        suggestedStrategy: 'manual',
        severity: 'high',
        reason: 'Conflito em valores financeiros (amount) - requer revisão manual'
      };
    }

    // Conflito categórico = MÉDIA severidade
    if (hasCriticalCategorical) {
      return {
        suggestedStrategy: 'manual',
        severity: 'medium',
        reason: 'Conflito em categorização (category/type/status) - requer escolha manual'
      };
    }

    // Apenas descritivos = BAIXA severidade
    return {
      suggestedStrategy: 'field-level-merge',
      severity: 'low',
      reason: 'Apenas campos descritivos - merge automático possível'
    };
  }

  /**
   * Gera um relatório detalhado do conflito
   */
  public generateConflictReport(conflict: Conflict): string {
    const { localVersion, serverVersion, conflictingFields, detectedAt } = conflict;
    const analysis = this.analyzeConflict(conflict);

    const lines: string[] = [
      '=== RELATÓRIO DE CONFLITO ===',
      `Transação ID: ${conflict.transactionId}`,
      `Detectado em: ${new Date(detectedAt).toLocaleString()}`,
      `Severidade: ${analysis.severity.toUpperCase()}`,
      `Estratégia Sugerida: ${analysis.suggestedStrategy}`,
      '',
      '--- Campos Conflitantes ---',
      ...conflictingFields.map(field => {
        const localValue = localVersion[field as keyof Transaction];
        const serverValue = serverVersion[field as keyof Transaction];
        const isCritical = this.isCriticalField(field);

        return `${isCritical ? '⚠️ [CRÍTICO]' : '  '} ${field}:\n    Local:  ${localValue}\n    Server: ${serverValue}`;
      }),
      '',
      '--- Timestamps ---',
      `Local:  ${new Date(localVersion.updated_at).toLocaleString()}`,
      `Server: ${new Date(serverVersion.updated_at).toLocaleString()}`,
      '',
      `Razão: ${analysis.reason}`
    ];

    return lines.join('\n');
  }

  /**
   * Muda a estratégia de resolução padrão
   */
  public setStrategy(strategy: ConflictResolutionStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Obtém a estratégia atual
   */
  public getStrategy(): ConflictResolutionStrategy {
    return this.strategy;
  }

  /**
   * Customiza a configuração de campos
   */
  public setFieldConfig(config: Partial<FieldConfig>): void {
    this.fieldConfig = { ...this.fieldConfig, ...config };
  }
}

// Singleton instance
export const conflictResolver = new ConflictResolver();
