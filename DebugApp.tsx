import React, { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { usePermissions } from './hooks/usePermissions';
import * as supabaseService from './services/supabaseService';

const DebugApp: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { loading: permissionsLoading, hasPermissions } = usePermissions();
  const [dataStatus, setDataStatus] = useState<string>('Não carregado');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        setDataStatus('Carregando...');
        console.log('🔍 Testando conexão com Supabase...');

        const transactions = await supabaseService.getAllTransactions();
        console.log('✅ Transações carregadas:', transactions.length);

        const changes = await supabaseService.getAllManualChanges();
        console.log('✅ Mudanças carregadas:', changes.length);

        setDataStatus(`OK - ${transactions.length} transações, ${changes.length} mudanças`);
      } catch (err: any) {
        console.error('❌ Erro ao carregar dados:', err);
        setError(err.message || 'Erro desconhecido');
        setDataStatus('Erro ao carregar');
      }
    };

    if (user && !authLoading) {
      testConnection();
    }
  }, [user, authLoading]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">🔍 Debug - DRE RAIZ</h1>

        <div className="space-y-4">
          {/* Status de Autenticação */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">1. Autenticação (Firebase)</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> <span className={authLoading ? 'text-yellow-600' : 'text-green-600'}>{authLoading ? 'Sim' : 'Não'}</span></p>
              <p><strong>Usuário:</strong> <span className={user ? 'text-green-600' : 'text-red-600'}>{user ? user.email : 'Não autenticado'}</span></p>
              {user && (
                <>
                  <p><strong>Nome:</strong> {user.name}</p>
                  <p><strong>Role:</strong> <span className={user.role === 'pending' ? 'text-yellow-600' : 'text-green-600'}>{user.role}</span></p>
                </>
              )}
            </div>
          </div>

          {/* Status de Permissões */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">2. Permissões (Supabase)</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> <span className={permissionsLoading ? 'text-yellow-600' : 'text-green-600'}>{permissionsLoading ? 'Sim' : 'Não'}</span></p>
              <p><strong>Tem Permissões:</strong> <span className={hasPermissions ? 'text-yellow-600' : 'text-green-600'}>{hasPermissions ? 'Sim (restrito)' : 'Não (acesso total)'}</span></p>
            </div>
          </div>

          {/* Status de Dados */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">3. Dados (Supabase)</h2>
            <div className="space-y-2">
              <p><strong>Status:</strong> <span className={dataStatus.includes('OK') ? 'text-green-600' : dataStatus.includes('Erro') ? 'text-red-600' : 'text-yellow-600'}>{dataStatus}</span></p>
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-800 font-bold">Erro:</p>
                  <pre className="text-sm text-red-600 mt-2 whitespace-pre-wrap">{error}</pre>
                </div>
              )}
            </div>
          </div>

          {/* Variáveis de Ambiente */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">4. Configuração</h2>
            <div className="space-y-2">
              <p><strong>Supabase URL:</strong> <span className="text-xs font-mono">{import.meta.env.VITE_SUPABASE_URL ? '✅ Configurado' : '❌ Não configurado'}</span></p>
              <p><strong>Supabase Key:</strong> <span className="text-xs font-mono">{import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ Não configurado'}</span></p>
              <p><strong>Firebase API Key:</strong> <span className="text-xs font-mono">{import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Configurado' : '❌ Não configurado'}</span></p>
            </div>
          </div>

          {/* Console */}
          <div className="bg-gray-900 p-6 rounded-lg shadow text-white">
            <h2 className="text-xl font-bold mb-4">5. Console do Navegador</h2>
            <p className="text-sm">Pressione <code className="bg-gray-800 px-2 py-1 rounded">F12</code> e veja a aba Console para mais detalhes.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugApp;
