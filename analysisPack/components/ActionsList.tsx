import React, { useState } from 'react';
import type { AnalysisPack } from '../../types';

interface ActionsListProps {
  actions: AnalysisPack['actions'];
}

export const ActionsList: React.FC<ActionsListProps> = ({ actions }) => {
  const [sortBy, setSortBy] = useState<'owner' | 'eta'>('eta');
  const [filterOwner, setFilterOwner] = useState<string>('all');

  // Extrair lista única de owners
  const owners = Array.from(new Set(actions.map(a => a.owner))).sort();

  // Filtrar e ordenar ações
  const filteredActions = actions
    .filter(action => filterOwner === 'all' || action.owner === filterOwner)
    .sort((a, b) => {
      if (sortBy === 'owner') {
        return a.owner.localeCompare(b.owner);
      }
      // Ordenar por data ETA
      return new Date(a.eta.split('/').reverse().join('-')).getTime() -
             new Date(b.eta.split('/').reverse().join('-')).getTime();
    });

  return (
    <div className="bg-white rounded-[1rem] p-6 shadow-sm border border-gray-200 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F44C00] flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Plano de Ação</h2>
            <p className="text-sm text-gray-600">{actions.length} ações recomendadas</p>
          </div>
        </div>

        {/* Controles de Filtro e Ordenação */}
        <div className="flex items-center gap-3">
          <select
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1B75BB]"
          >
            <option value="all">Todos os responsáveis</option>
            {owners.map(owner => (
              <option key={owner} value={owner}>{owner}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'owner' | 'eta')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1B75BB]"
          >
            <option value="eta">Ordenar por prazo</option>
            <option value="owner">Ordenar por responsável</option>
          </select>
        </div>
      </div>

      {/* Tabela de Ações */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-black text-gray-700 uppercase tracking-wider">
                Responsável
              </th>
              <th className="text-left py-3 px-4 text-sm font-black text-gray-700 uppercase tracking-wider">
                Ação
              </th>
              <th className="text-left py-3 px-4 text-sm font-black text-gray-700 uppercase tracking-wider">
                Prazo
              </th>
              <th className="text-left py-3 px-4 text-sm font-black text-gray-700 uppercase tracking-wider">
                Impacto Esperado
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredActions.map((action, idx) => {
              // Calcular dias até o prazo
              const etaDate = new Date(action.eta.split('/').reverse().join('-'));
              const today = new Date();
              const daysUntil = Math.ceil((etaDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const isUrgent = daysUntil <= 7;
              const isOverdue = daysUntil < 0;

              return (
                <tr
                  key={idx}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    isOverdue ? 'bg-red-50' : isUrgent ? 'bg-yellow-50' : ''
                  }`}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#1B75BB] flex items-center justify-center text-white text-xs font-bold">
                        {action.owner.split(' ').map(word => word[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-bold text-gray-900">{action.owner}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-700 max-w-md">
                    {action.action}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        isOverdue
                          ? 'bg-red-100 text-red-800'
                          : isUrgent
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {action.eta}
                      </span>
                      {isOverdue && (
                        <span className="text-xs text-red-600 font-medium">Atrasado</span>
                      )}
                      {isUrgent && !isOverdue && (
                        <span className="text-xs text-yellow-600 font-medium">Urgente</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm font-medium text-green-700">
                    {action.expected_impact}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredActions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-lg font-medium">Nenhuma ação encontrada com os filtros selecionados</p>
        </div>
      )}
    </div>
  );
};
