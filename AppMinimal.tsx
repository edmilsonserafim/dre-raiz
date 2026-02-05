import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import LoginScreen from './components/LoginScreen';
import PendingApprovalScreen from './components/PendingApprovalScreen';
import { Loader2 } from 'lucide-react';
import { INITIAL_TRANSACTIONS } from './constants';

const AppMinimal: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento rápido com dados mock
    if (!authLoading && user) {
      console.log('✅ Usuário logado:', user.email);
      console.log('🔄 Usando dados MOCK (não do Supabase)');
      console.log('📊 Transações disponíveis:', INITIAL_TRANSACTIONS.length);

      setTimeout(() => {
        console.log('✅ App pronto!');
        setIsLoading(false);
      }, 1000);
    }
  }, [user, authLoading]);

  // Loading de autenticação
  if (authLoading) {
    return (
      <div className="flex h-screen bg-[#fcfcfc] items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-[#1B75BB]" size={48} />
          <h2 className="text-xl font-bold text-gray-900">Verificando autenticação...</h2>
        </div>
      </div>
    );
  }

  // Não autenticado
  if (!user) {
    return <LoginScreen />;
  }

  // Aguardando aprovação
  if (user.role === 'pending') {
    return <PendingApprovalScreen />;
  }

  // Loading de dados
  if (isLoading) {
    return (
      <div className="flex h-screen bg-[#fcfcfc] items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-[#1B75BB]" size={48} />
          <h2 className="text-xl font-bold text-gray-900">Preparando aplicação...</h2>
          <p className="text-sm text-gray-500 mt-2">Carregando dados MOCK</p>
        </div>
      </div>
    );
  }

  // App funcionando!
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🎉 DRE RAIZ - Funcionando!
            </h1>
            <p className="text-gray-600">
              Versão simplificada com dados MOCK
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl p-6 text-white">
              <h3 className="text-sm font-semibold mb-2">✅ Autenticação</h3>
              <p className="text-2xl font-bold">OK</p>
              <p className="text-xs mt-2 opacity-90">{user.email}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl p-6 text-white">
              <h3 className="text-sm font-semibold mb-2">📊 Dados</h3>
              <p className="text-2xl font-bold">{INITIAL_TRANSACTIONS.length}</p>
              <p className="text-xs mt-2 opacity-90">Transações MOCK</p>
            </div>

            <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-sm font-semibold mb-2">👤 Perfil</h3>
              <p className="text-2xl font-bold">{user.role}</p>
              <p className="text-xs mt-2 opacity-90">{user.name}</p>
            </div>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-yellow-900 mb-2">
              ⚠️ Modo Simplificado
            </h3>
            <p className="text-sm text-yellow-800 mb-4">
              O app está funcionando com <strong>dados MOCK</strong> (não do Supabase)
              para evitar o problema do loop infinito.
            </p>
            <p className="text-sm text-yellow-800 mb-4">
              <strong>Problema identificado:</strong> Há muitos dados no Supabase
              causando loop no carregamento.
            </p>
            <p className="text-sm text-yellow-800">
              <strong>Solução:</strong> Precisamos implementar paginação ou
              limitar os dados carregados inicialmente.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">📋 Próximos Passos:</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>✅ Identificar quantos registros existem no Supabase</li>
              <li>⏳ Implementar carregamento paginado/lazy loading</li>
              <li>⏳ Adicionar filtros de data para limitar dados iniciais</li>
              <li>⏳ Otimizar queries do Supabase</li>
              <li>⏳ Carregar app completo com dados reais</li>
            </ul>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              🔄 Recarregar Página
            </button>
            <button
              onClick={() => console.log('📊 Dados:', INITIAL_TRANSACTIONS)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              🔍 Ver Dados no Console
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppMinimal;
