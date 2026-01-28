import React, { useState } from 'react';
import { Database, Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { migrateFromLocalStorage } from '../services/supabaseService';

/**
 * Componente auxiliar para migrar dados do localStorage para Supabase
 * Use este componente apenas UMA VEZ para fazer a migração inicial
 * Depois você pode remover este componente do projeto
 */
const MigrationHelper: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleMigration = async () => {
    setStatus('loading');
    setMessage('Migrando dados do localStorage para Supabase...');

    try {
      const success = await migrateFromLocalStorage();

      if (success) {
        setStatus('success');
        setMessage('Migração concluída com sucesso! Seus dados agora estão no Supabase.');
      } else {
        setStatus('error');
        setMessage('Erro ao migrar dados. Verifique o console para mais detalhes.');
      }
    } catch (error) {
      setStatus('error');
      setMessage(`Erro: ${error}`);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-blue-50 rounded-xl">
          <Database className="text-blue-600" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Migração de Dados</h2>
          <p className="text-sm text-gray-500">Transfira seus dados do localStorage para Supabase</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-yellow-800">
              <p className="font-bold mb-1">Atenção!</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Execute esta migração apenas UMA VEZ</li>
                <li>Certifique-se de ter configurado o Supabase corretamente</li>
                <li>Os dados do localStorage serão copiados para o banco</li>
                <li>Seus dados locais não serão apagados</li>
              </ul>
            </div>
          </div>
        </div>

        {status === 'idle' && (
          <button
            onClick={handleMigration}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Upload size={20} />
            Iniciar Migração
          </button>
        )}

        {status === 'loading' && (
          <div className="flex items-center justify-center gap-3 py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">{message}</span>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-600" size={24} />
              <div>
                <p className="font-bold text-green-900">Sucesso!</p>
                <p className="text-sm text-green-700">{message}</p>
              </div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-600" size={24} />
              <div>
                <p className="font-bold text-red-900">Erro na migração</p>
                <p className="text-sm text-red-700">{message}</p>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Dica:</strong> Após migrar com sucesso, você pode:</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Remover este componente do projeto</li>
            <li>Atualizar o App.tsx para carregar dados do Supabase</li>
            <li>Limpar o localStorage se desejar</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MigrationHelper;
