import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, WifiOff, Clock } from 'lucide-react';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNC STATUS BADGE - INDICADOR VISUAL DE SINCRONIZAÇÃO
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Exibe status de sincronização de forma discreta mas visível
 */

interface SyncStatusBadgeProps {
  isLoading: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  conflicts: number;
  error: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  isLoading,
  isSyncing,
  pendingOperations,
  conflicts,
  error,
  connectionStatus
}) => {
  // Se está carregando dados iniciais
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl">
        <Loader2 size={16} className="text-blue-600 animate-spin" />
        <span className="text-xs font-bold text-blue-900">Carregando...</span>
      </div>
    );
  }

  // Se há erro crítico
  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border-2 border-red-300 rounded-xl">
        <AlertCircle size={16} className="text-red-600" />
        <span className="text-xs font-bold text-red-900">Erro de Sincronização</span>
      </div>
    );
  }

  // Se há conflitos
  if (conflicts > 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
        <AlertCircle size={16} className="text-yellow-600" />
        <span className="text-xs font-bold text-yellow-900">
          {conflicts} conflito{conflicts > 1 ? 's' : ''} detectado{conflicts > 1 ? 's' : ''}
        </span>
      </div>
    );
  }

  // Se está sincronizando
  if (isSyncing) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl">
        <Loader2 size={16} className="text-blue-600 animate-spin" />
        <span className="text-xs font-bold text-blue-900">Sincronizando...</span>
      </div>
    );
  }

  // Se há operações pendentes
  if (pendingOperations > 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl">
        <Clock size={16} className="text-orange-600" />
        <span className="text-xs font-bold text-orange-900">
          {pendingOperations} operaç{pendingOperations > 1 ? 'ões' : 'ão'} pendente{pendingOperations > 1 ? 's' : ''}
        </span>
      </div>
    );
  }

  // Se está desconectado do Realtime (normal na Fase 2)
  if (connectionStatus === 'disconnected') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
        <WifiOff size={16} className="text-gray-400" />
        <span className="text-xs font-medium text-gray-500">
          Offline (Fase 3)
        </span>
      </div>
    );
  }

  // Tudo OK
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
      <CheckCircle2 size={16} className="text-green-600" />
      <span className="text-xs font-bold text-green-900">Sincronizado</span>
    </div>
  );
};
