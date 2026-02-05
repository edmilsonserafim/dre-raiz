import React from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { CheckCircle2, XCircle, AlertCircle, Activity } from 'lucide-react';

/**
 * Componente de TESTE para verificar se o TransactionsContext está funcionando
 *
 * COMO USAR:
 * 1. Importar no App.tsx: import { TransactionsContextTest } from './src/components/TransactionsContextTest';
 * 2. Adicionar antes do switch de views: <TransactionsContextTest />
 * 3. Remover após confirmar que está funcionando
 */
export const TransactionsContextTest: React.FC = () => {
  try {
    const {
      transactions,
      serverTransactions,
      isLoading,
      isSyncing,
      conflicts,
      pendingOperations,
      currentFilters,
      connectionStatus,
      error,
    } = useTransactions();

    const stats = {
      'Transações Locais': transactions.length,
      'Transações Servidor': serverTransactions.length,
      'Operações Pendentes': pendingOperations.length,
      'Conflitos': conflicts.length,
      'Status Conexão': connectionStatus,
      'Carregando': isLoading ? 'Sim' : 'Não',
      'Sincronizando': isSyncing ? 'Sim' : 'Não',
      'Tem Erro': error ? 'Sim' : 'Não',
      'Filtros Ativos': currentFilters ? 'Sim' : 'Não',
    };

    const allGood = !isLoading && !isSyncing && !error && pendingOperations.length === 0 && conflicts.length === 0;

    return (
      <div className="fixed bottom-4 right-4 z-50 bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-6 max-w-md">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
          {allGood ? (
            <CheckCircle2 size={24} className="text-green-500 shrink-0" />
          ) : (
            <Activity size={24} className="text-blue-500 shrink-0 animate-pulse" />
          )}
          <div>
            <h3 className="font-bold text-gray-900">TransactionsContext Test</h3>
            <p className="text-xs text-gray-500">Fase 1 - Fundações</p>
          </div>
        </div>

        <div className="space-y-2">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center text-sm">
              <span className="text-gray-600 font-medium">{key}:</span>
              <span className={`font-bold ${
                key === 'Tem Erro' && value === 'Sim' ? 'text-red-600' :
                key === 'Status Conexão' && value === 'disconnected' ? 'text-yellow-600' :
                key === 'Carregando' && value === 'Sim' ? 'text-blue-600' :
                'text-gray-900'
              }`}>
                {String(value)}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <XCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-900">Erro:</p>
                <p className="text-xs text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {allGood && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-green-900">✅ Context funcionando!</p>
                <p className="text-xs text-green-700">Tudo OK - Fase 1 completa</p>
              </div>
            </div>
          </div>
        )}

        {connectionStatus === 'disconnected' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-yellow-700">
                  Realtime desconectado (normal na Fase 1)
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Remova este componente após confirmar que está OK
          </p>
        </div>
      </div>
    );
  } catch (err) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-red-50 rounded-xl shadow-2xl border-2 border-red-300 p-6 max-w-md">
        <div className="flex items-center gap-3 mb-3">
          <XCircle size={24} className="text-red-600 shrink-0" />
          <h3 className="font-bold text-red-900">❌ Erro no Context</h3>
        </div>
        <div className="bg-white p-3 rounded border border-red-200">
          <p className="text-xs font-mono text-red-700">
            {err instanceof Error ? err.message : String(err)}
          </p>
        </div>
        <div className="mt-3 text-xs text-red-600">
          <p className="font-bold">Possíveis causas:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>TransactionsProvider não está no App.tsx</li>
            <li>Componente está fora do Provider</li>
            <li>Import path incorreto</li>
          </ul>
        </div>
      </div>
    );
  }
};
