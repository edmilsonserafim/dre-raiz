import React, { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { SyncStatusBadge } from './SyncStatusBadge';
import { ConflictModal } from './ConflictModal';
import * as supabaseService from '../../services/supabaseService';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TRANSACTIONS SYNC UI - COMPONENTE DE UI DE SINCRONIZAÇÃO
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Integra o SyncStatusBadge e ConflictModal com o TransactionsContext
 * Adicione este componente em qualquer view que use transações
 */

export const TransactionsSyncUI: React.FC = () => {
  const {
    isLoading,
    isSyncing,
    pendingOperations,
    conflicts,
    error,
    connectionStatus,
    resolveConflict
  } = useTransactions();

  const [activeConflictIndex, setActiveConflictIndex] = useState(0);

  // Se não há conflitos, mostrar apenas o badge
  if (conflicts.length === 0) {
    return (
      <SyncStatusBadge
        isLoading={isLoading}
        isSyncing={isSyncing}
        pendingOperations={pendingOperations.length}
        conflicts={0}
        error={error}
        connectionStatus={connectionStatus}
      />
    );
  }

  // Se há conflitos, mostrar badge + modal
  const currentConflict = conflicts[activeConflictIndex];

  const handleResolveConflict = async (
    conflictId: string,
    resolution: 'keep-local' | 'use-server'
  ) => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    try {
      if (resolution === 'keep-local') {
        // Forçar atualização com versão local
        await supabaseService.updateTransaction(conflict.transactionId, conflict.localVersion);
        console.log('✅ Conflito resolvido: versão local mantida');
      } else {
        // Usar versão do servidor (já está lá, apenas remover do estado)
        console.log('✅ Conflito resolvido: versão do servidor mantida');
      }

      // Resolver conflito no context
      resolveConflict(conflictId, resolution);

      // Se há mais conflitos, mostrar o próximo
      if (conflicts.length > 1) {
        setActiveConflictIndex(prev => (prev + 1) % conflicts.length);
      }
    } catch (error) {
      console.error('❌ Erro ao resolver conflito:', error);
    }
  };

  return (
    <>
      <SyncStatusBadge
        isLoading={isLoading}
        isSyncing={isSyncing}
        pendingOperations={pendingOperations.length}
        conflicts={conflicts.length}
        error={error}
        connectionStatus={connectionStatus}
      />

      {currentConflict && (
        <ConflictModal
          conflict={currentConflict}
          onResolve={handleResolveConflict}
          onClose={() => {
            // Fechar sem resolver - apenas esconder o modal
            // O conflito permanece na lista
            console.log('⚠️ Modal fechado sem resolver conflito');
          }}
        />
      )}
    </>
  );
};
