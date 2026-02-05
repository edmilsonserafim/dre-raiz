/**
 * PerformanceMonitor - Monitor de Performance da Sincronização
 *
 * Exibe métricas em tempo real sobre:
 * - Operações de sincronização (audit log)
 * - Conflitos resolvidos (conflict history)
 * - Performance (latência, success rate)
 *
 * Fase 4 - Advanced Conflict Resolution
 */

import React, { useState, useEffect } from 'react';
import { syncAuditLog } from '../services/SyncAuditLog';
import { conflictHistory } from '../services/ConflictHistory';

interface PerformanceMonitorProps {
  /** Se deve atualizar automaticamente (padrão: true) */
  autoRefresh?: boolean;
  /** Intervalo de atualização em ms (padrão: 5000) */
  refreshInterval?: number;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  autoRefresh = true,
  refreshInterval = 5000
}) => {
  const [auditStats, setAuditStats] = useState(syncAuditLog.getStats());
  const [conflictStats, setConflictStats] = useState(conflictHistory.getStats());
  const [performanceMetrics, setPerformanceMetrics] = useState(
    syncAuditLog.getPerformanceMetrics()
  );
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Atualizar métricas
  const refreshMetrics = () => {
    setAuditStats(syncAuditLog.getStats());
    setConflictStats(conflictHistory.getStats());
    setPerformanceMetrics(syncAuditLog.getPerformanceMetrics());
  };

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refreshMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Exportar logs
  const handleExportAuditLog = () => {
    const json = syncAuditLog.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportConflictHistory = () => {
    const json = conflictHistory.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conflict_history_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csv = syncAuditLog.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isCollapsed) {
    return (
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-50">
        <button
          onClick={() => setIsCollapsed(false)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          📊 Mostrar Performance Monitor
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 z-50 max-w-md max-h-[600px] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">📊 Performance Monitor</h3>
        <div className="flex gap-2">
          <button
            onClick={refreshMetrics}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            🔄 Atualizar
          </button>
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            ➖
          </button>
        </div>
      </div>

      {/* Audit Log Stats */}
      <div className="mb-4">
        <h4 className="font-semibold text-sm mb-2">📝 Audit Log</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Total de operações:</span>
            <span className="font-mono">{auditStats.total}</span>
          </div>
          <div className="flex justify-between">
            <span>Taxa de sucesso:</span>
            <span className={`font-mono ${auditStats.successRate > 95 ? 'text-green-600' : 'text-yellow-600'}`}>
              {auditStats.successRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Taxa de falhas:</span>
            <span className={`font-mono ${auditStats.failureRate > 5 ? 'text-red-600' : 'text-gray-600'}`}>
              {auditStats.failureRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Taxa de conflitos:</span>
            <span className="font-mono text-yellow-600">
              {auditStats.conflictRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Duração média:</span>
            <span className="font-mono">{auditStats.avgDuration}ms</span>
          </div>
        </div>

        {/* Operações por tipo */}
        <div className="mt-2">
          <h5 className="font-semibold text-xs mb-1">Por Tipo:</h5>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {Object.entries(auditStats.byType).map(([type, count]) => (
              count > 0 && (
                <div key={type} className="flex justify-between">
                  <span>{type}:</span>
                  <span className="font-mono">{count}</span>
                </div>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="mb-4">
        <h4 className="font-semibold text-sm mb-2">⚡ Performance</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Média (últimas 100):</span>
            <span className="font-mono">{performanceMetrics.avgDuration}ms</span>
          </div>
          <div className="flex justify-between">
            <span>Mediana (p50):</span>
            <span className="font-mono">{performanceMetrics.p50}ms</span>
          </div>
          <div className="flex justify-between">
            <span>p95:</span>
            <span className={`font-mono ${performanceMetrics.p95 > 1000 ? 'text-yellow-600' : 'text-green-600'}`}>
              {performanceMetrics.p95}ms
            </span>
          </div>
          <div className="flex justify-between">
            <span>p99:</span>
            <span className={`font-mono ${performanceMetrics.p99 > 2000 ? 'text-red-600' : 'text-yellow-600'}`}>
              {performanceMetrics.p99}ms
            </span>
          </div>
        </div>

        {/* Operações mais lentas */}
        {performanceMetrics.slowestOperations.length > 0 && (
          <div className="mt-2">
            <h5 className="font-semibold text-xs mb-1">🐌 Mais lentas:</h5>
            <div className="space-y-1 text-xs">
              {performanceMetrics.slowestOperations.slice(0, 3).map((op, index) => (
                <div key={op.id} className="flex justify-between text-xs">
                  <span className="truncate max-w-[150px]">
                    {index + 1}. {op.operationType}
                  </span>
                  <span className="font-mono">{op.duration}ms</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Conflict History Stats */}
      <div className="mb-4">
        <h4 className="font-semibold text-sm mb-2">⚠️ Conflitos</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Total resolvidos:</span>
            <span className="font-mono">{conflictStats.total}</span>
          </div>
          <div className="flex justify-between">
            <span>Tempo médio resolução:</span>
            <span className="font-mono">{Math.round(conflictStats.avgResolutionTime / 1000)}s</span>
          </div>
        </div>

        {/* Conflitos por severidade */}
        <div className="mt-2">
          <h5 className="font-semibold text-xs mb-1">Por Severidade:</h5>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>🟢 Baixa:</span>
              <span className="font-mono">{conflictStats.bySeverity.low}</span>
            </div>
            <div className="flex justify-between">
              <span>🟡 Média:</span>
              <span className="font-mono">{conflictStats.bySeverity.medium}</span>
            </div>
            <div className="flex justify-between">
              <span>🔴 Alta:</span>
              <span className="font-mono">{conflictStats.bySeverity.high}</span>
            </div>
          </div>
        </div>

        {/* Conflitos por estratégia */}
        <div className="mt-2">
          <h5 className="font-semibold text-xs mb-1">Por Estratégia:</h5>
          <div className="space-y-1 text-xs">
            {Object.entries(conflictStats.byStrategy).map(([strategy, count]) => (
              count > 0 && (
                <div key={strategy} className="flex justify-between">
                  <span>{strategy}:</span>
                  <span className="font-mono">{count}</span>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Conflitos por quem resolveu */}
        <div className="mt-2">
          <h5 className="font-semibold text-xs mb-1">Resolvido por:</h5>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>👤 Usuário:</span>
              <span className="font-mono">{conflictStats.byResolvedBy.user}</span>
            </div>
            <div className="flex justify-between">
              <span>🤖 Sistema:</span>
              <span className="font-mono">{conflictStats.byResolvedBy.system}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="border-t pt-3 space-y-2">
        <h4 className="font-semibold text-sm mb-2">📤 Exportar</h4>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleExportAuditLog}
            className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            📝 Audit Log (JSON)
          </button>
          <button
            onClick={handleExportCSV}
            className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
          >
            📊 Audit Log (CSV)
          </button>
          <button
            onClick={handleExportConflictHistory}
            className="text-xs bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
          >
            ⚠️ Conflict History (JSON)
          </button>
        </div>
      </div>

      {/* Clear Actions */}
      <div className="border-t mt-3 pt-3 space-y-2">
        <h4 className="font-semibold text-sm mb-2">🗑️ Limpeza</h4>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              if (confirm('Limpar logs antigos (7+ dias)?')) {
                const removed = syncAuditLog.cleanOldLogs(7);
                alert(`${removed} logs antigos removidos`);
                refreshMetrics();
              }
            }}
            className="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
          >
            Limpar logs antigos (7+ dias)
          </button>
          <button
            onClick={() => {
              if (confirm('Limpar conflitos antigos (30+ dias)?')) {
                const removed = conflictHistory.cleanOldHistory(30);
                alert(`${removed} conflitos antigos removidos`);
                refreshMetrics();
              }
            }}
            className="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
          >
            Limpar conflitos antigos (30+ dias)
          </button>
        </div>
      </div>
    </div>
  );
};
