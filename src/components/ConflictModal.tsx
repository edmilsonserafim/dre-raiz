import React from 'react';
import { Conflict } from '../types/sync';
import { AlertTriangle, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONFLICT MODAL - UI DE RESOLUÇÃO DE CONFLITOS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Exibe diff lado-a-lado entre versão local e servidor
 * Permite usuário escolher qual versão manter
 */

interface ConflictModalProps {
  conflict: Conflict;
  onResolve: (conflictId: string, resolution: 'keep-local' | 'use-server') => void;
  onClose: () => void;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  conflict,
  onResolve,
  onClose
}) => {
  const { localVersion, serverVersion, conflictingFields } = conflict;

  const handleResolve = (resolution: 'keep-local' | 'use-server') => {
    onResolve(conflict.id, resolution);
    onClose();
  };

  // Campos a exibir no diff
  const fieldsToShow: Array<keyof typeof localVersion> = [
    'description',
    'amount',
    'date',
    'category',
    'type',
    'filial',
    'marca',
    'status',
    'tag01',
    'tag02',
    'tag03'
  ];

  // Labels amigáveis
  const fieldLabels: Record<string, string> = {
    description: 'Descrição',
    amount: 'Valor',
    date: 'Data',
    category: 'Categoria',
    type: 'Tipo',
    filial: 'Filial',
    marca: 'Marca',
    status: 'Status',
    tag01: 'Tag 1',
    tag02: 'Tag 2',
    tag03: 'Tag 3'
  };

  // Formatar valor para exibição
  const formatValue = (field: string, value: any): string => {
    if (value === null || value === undefined) return '-';

    if (field === 'amount') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    }

    if (field === 'date') {
      return new Date(value).toLocaleDateString('pt-BR');
    }

    return String(value);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-yellow-50 border-b-2 border-yellow-200 p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle size={32} className="text-yellow-600 shrink-0" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                Conflito Detectado
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Esta transação foi modificada por outro usuário enquanto você estava editando.
                Escolha qual versão deseja manter.
              </p>
              <div className="mt-3 flex gap-2">
                <span className="px-2 py-1 bg-yellow-200 text-yellow-900 text-xs font-bold rounded">
                  {conflictingFields.length} {conflictingFields.length === 1 ? 'campo' : 'campos'} conflitante(s)
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle size={24} />
            </button>
          </div>
        </div>

        {/* Diff */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Coluna Esquerda - Sua Versão */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-200">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <h3 className="font-bold text-blue-900">Sua Versão (Local)</h3>
              </div>
              <div className="space-y-3">
                {fieldsToShow.map(field => {
                  const isConflicting = conflictingFields.includes(String(field));
                  const value = localVersion[field];

                  return (
                    <div
                      key={field}
                      className={`p-3 rounded-lg ${
                        isConflicting
                          ? 'bg-red-50 border-2 border-red-300'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="text-xs font-bold text-gray-500 uppercase mb-1">
                        {fieldLabels[field] || field}
                        {isConflicting && (
                          <span className="ml-2 text-red-600">● Conflito</span>
                        )}
                      </div>
                      <div className={`text-sm ${isConflicting ? 'font-bold text-red-900' : 'text-gray-700'}`}>
                        {formatValue(field, value)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coluna Direita - Versão do Servidor */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-green-200">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h3 className="font-bold text-green-900">Versão do Servidor</h3>
              </div>
              <div className="space-y-3">
                {fieldsToShow.map(field => {
                  const isConflicting = conflictingFields.includes(String(field));
                  const value = serverVersion[field];

                  return (
                    <div
                      key={field}
                      className={`p-3 rounded-lg ${
                        isConflicting
                          ? 'bg-red-50 border-2 border-red-300'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="text-xs font-bold text-gray-500 uppercase mb-1">
                        {fieldLabels[field] || field}
                        {isConflicting && (
                          <span className="ml-2 text-red-600">● Conflito</span>
                        )}
                      </div>
                      <div className={`text-sm ${isConflicting ? 'font-bold text-red-900' : 'text-gray-700'}`}>
                        {formatValue(field, value)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-6 text-xs text-gray-500">
              <div>
                <span className="font-bold">Última modificação local:</span>
                <br />
                {new Date(localVersion.updated_at).toLocaleString('pt-BR')}
              </div>
              <div>
                <span className="font-bold">Última modificação no servidor:</span>
                <br />
                {new Date(serverVersion.updated_at).toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Botões */}
        <div className="border-t-2 border-gray-200 p-6 bg-gray-50">
          <div className="flex gap-4 justify-end">
            <button
              onClick={() => handleResolve('keep-local')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
            >
              <CheckCircle2 size={20} />
              Manter Minha Versão
            </button>
            <button
              onClick={() => handleResolve('use-server')}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors"
            >
              <ArrowRight size={20} />
              Usar Versão do Servidor
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Escolha cuidadosamente - esta ação não pode ser desfeita
          </p>
        </div>
      </div>
    </div>
  );
};
