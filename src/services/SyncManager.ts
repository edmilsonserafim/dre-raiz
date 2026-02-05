import { Transaction } from '../../types';
import { Conflict, OperationResult } from '../types/sync';
import { operationQueue } from './OperationQueue';
import { conflictResolver, ConflictResolutionResult } from './ConflictResolver';
import { supabaseCircuitBreaker } from './CircuitBreaker';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNC MANAGER - ORQUESTRADOR DE SINCRONIZAÇÃO OTIMISTA
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Responsável por:
 * - Executar operações com optimistic updates
 * - Detectar conflitos (comparar updated_at)
 * - Gerenciar rollback em caso de erro
 * - Adicionar operações à fila
 */

export class SyncManager {
  /**
   * Executa operação com optimistic update
   *
   * Fluxo:
   * 1. Estado local já foi atualizado (pelo caller)
   * 2. Adiciona operação à fila
   * 3. Executa no servidor
   * 4. Se sucesso: remove da fila
   * 5. Se erro: executa rollback + retorna erro
   *
   * @param operation Função que executa a operação no servidor
   * @param rollback Função que reverte o estado local
   * @param operationData Dados da operação (para a fila)
   * @returns Resultado da operação
   */
  async executeOptimisticUpdate<T>(
    operation: () => Promise<T>,
    rollback: () => void,
    operationData: {
      type: 'INSERT' | 'UPDATE' | 'DELETE';
      transactionId: string;
      data: Partial<Transaction>;
    }
  ): Promise<OperationResult<T>> {
    // [FASE 5] Verificar se circuit está aberto
    if (supabaseCircuitBreaker.isOpen()) {
      const stats = supabaseCircuitBreaker.getStats();
      const errorMsg = `Circuit breaker is OPEN. Service temporarily unavailable.`;

      console.warn(`⚠️ SyncManager: ${errorMsg}`);

      // Não fazer rollback (operação não foi tentada)
      // Adicionar à fila para retry posterior
      const operationId = operationQueue.enqueue(operationData);
      operationQueue.markAsFailed(operationId, errorMsg);

      return {
        success: false,
        error: errorMsg
      };
    }

    // Adicionar à fila
    const operationId = operationQueue.enqueue(operationData);

    try {
      // Marcar como executando
      operationQueue.markAsExecuting(operationId);

      // [FASE 5] Executar operação protegida por Circuit Breaker
      const result = await supabaseCircuitBreaker.execute(async () => {
        return await operation();
      });

      // Sucesso: remover da fila
      operationQueue.dequeue(operationId);

      console.log(`✅ SyncManager: Operação ${operationData.type} concluída com sucesso`);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      console.error(`❌ SyncManager: Erro na operação ${operationData.type}:`, errorMsg);

      // Verificar se é conflito (HTTP 409 ou mensagem específica)
      const isConflict = errorMsg.includes('conflict') || errorMsg.includes('409');

      if (isConflict) {
        // Não fazer rollback ainda - deixar para o ConflictResolver
        operationQueue.markAsFailed(operationId, errorMsg);

        return {
          success: false,
          error: errorMsg
          // conflict será adicionado pelo caller após buscar versão do servidor
        };
      }

      // Outros erros: executar rollback e marcar como falha
      rollback();
      operationQueue.markAsFailed(operationId, errorMsg);

      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * Detecta conflito comparando updated_at
   *
   * @param local Versão local da transação
   * @param server Versão do servidor
   * @returns true se houver conflito (updated_at diferente)
   */
  detectConflict(local: Transaction, server: Transaction): boolean {
    const localTime = new Date(local.updated_at).getTime();
    const serverTime = new Date(server.updated_at).getTime();

    const hasConflict = localTime !== serverTime;

    if (hasConflict) {
      console.warn(`⚠️ SyncManager: Conflito detectado na transação ${local.id}`);
      console.warn(`   Local: ${local.updated_at} (${localTime})`);
      console.warn(`   Server: ${server.updated_at} (${serverTime})`);
    }

    return hasConflict;
  }

  /**
   * Cria objeto Conflict para ser adicionado ao estado
   *
   * @param localVersion Versão local
   * @param serverVersion Versão do servidor
   * @returns Conflict object
   */
  createConflict(localVersion: Transaction, serverVersion: Transaction): Conflict {
    // Identificar campos conflitantes
    const conflictingFields: string[] = [];

    // Comparar campos importantes
    const fieldsToCompare: (keyof Transaction)[] = [
      'amount',
      'category',
      'description',
      'date',
      'filial',
      'marca',
      'type',
      'status',
      'tag01',
      'tag02',
      'tag03'
    ];

    for (const field of fieldsToCompare) {
      if (localVersion[field] !== serverVersion[field]) {
        conflictingFields.push(field);
      }
    }

    return {
      id: `conflict_${localVersion.id}_${Date.now()}`,
      transactionId: localVersion.id,
      localVersion,
      serverVersion,
      detectedAt: Date.now(),
      resolved: false,
      conflictingFields
    };
  }

  /**
   * Verifica se um conflito é crítico (campos financeiros)
   *
   * @param conflict Conflict object
   * @returns true se envolver campos críticos (amount, category, type)
   */
  isCriticalConflict(conflict: Conflict): boolean {
    const criticalFields = ['amount', 'category', 'type'];
    return conflict.conflictingFields.some(field => criticalFields.includes(field));
  }

  /**
   * Resolve conflito automaticamente usando Last-Write-Wins
   *
   * @param conflict Conflict object
   * @returns Versão vencedora (local ou server)
   */
  autoResolveConflict(conflict: Conflict): Transaction {
    // Se for conflito crítico, requer resolução manual
    if (this.isCriticalConflict(conflict)) {
      console.warn(`⚠️ SyncManager: Conflito crítico requer resolução manual:`, conflict.id);
      throw new Error('Critical conflict requires manual resolution');
    }

    // Last-Write-Wins: comparar updated_at
    const localTime = new Date(conflict.localVersion.updated_at).getTime();
    const serverTime = new Date(conflict.serverVersion.updated_at).getTime();

    const winner = localTime > serverTime ? conflict.localVersion : conflict.serverVersion;

    console.log(`✅ SyncManager: Conflito resolvido automaticamente (LWW): ${winner === conflict.localVersion ? 'local' : 'server'} venceu`);

    return winner;
  }

  /**
   * [FASE 4] Resolve conflito usando ConflictResolver avançado
   *
   * Estratégias:
   * - field-level-merge: Merge automático de campos não-críticos
   * - last-write-wins: Versão mais recente vence
   * - manual: Requer escolha do usuário
   *
   * @param conflict Conflict object
   * @param userChoice Escolha manual (opcional)
   * @returns Resultado da resolução
   */
  resolveConflictWithStrategy(
    conflict: Conflict,
    userChoice?: 'keep-local' | 'use-server'
  ): ConflictResolutionResult {
    console.log(`🔧 SyncManager: Resolvendo conflito ${conflict.id} usando ConflictResolver`);

    // Usar ConflictResolver
    const result = conflictResolver.resolve(conflict, userChoice);

    // Log do resultado
    if (result.requiresManual) {
      console.warn(`⚠️ SyncManager: Conflito requer resolução manual`);
      console.warn(`   Campos manuais: ${result.manualFields?.join(', ')}`);
    } else {
      console.log(`✅ SyncManager: Conflito resolvido automaticamente`);
      console.log(`   Estratégia: ${result.strategy}`);
      if (result.autoMergedFields?.length) {
        console.log(`   Campos mesclados: ${result.autoMergedFields.join(', ')}`);
      }
    }

    return result;
  }

  /**
   * [FASE 4] Analisa um conflito e retorna sugestões
   *
   * @param conflict Conflict object
   * @returns Análise do conflito (severidade, estratégia sugerida)
   */
  analyzeConflict(conflict: Conflict) {
    return conflictResolver.analyzeConflict(conflict);
  }

  /**
   * [FASE 4] Gera relatório detalhado do conflito
   *
   * @param conflict Conflict object
   * @returns String formatada com relatório
   */
  generateConflictReport(conflict: Conflict): string {
    return conflictResolver.generateConflictReport(conflict);
  }

  /**
   * Retry de operações pendentes
   * Retorna operações que estão prontas para retry
   */
  async getOperationsForRetry() {
    return await operationQueue.processQueue();
  }

  /**
   * Estatísticas de sincronização
   */
  getStats() {
    return operationQueue.getStats();
  }
}

// Export singleton instance
export const syncManager = new SyncManager();
