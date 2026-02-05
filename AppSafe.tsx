import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const AppSafe: React.FC = () => {
  const [step, setStep] = useState('Iniciando...');
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const loadApp = async () => {
      try {
        console.log('🔄 Passo 1: Verificando autenticação...');
        setStep('Verificando autenticação...');
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!user && !authLoading) {
          console.log('❌ Usuário não autenticado');
          setStep('Redirecionando para login...');
          return;
        }

        console.log('✅ Passo 1: Autenticação OK');
        console.log('🔄 Passo 2: Carregando permissões...');
        setStep('Carregando permissões...');

        const { usePermissions } = await import('./hooks/usePermissions');
        console.log('✅ Passo 2: Permissões carregadas');

        console.log('🔄 Passo 3: Conectando ao Supabase...');
        setStep('Conectando ao Supabase...');

        const supabaseService = await import('./services/supabaseServiceLimited');
        console.log('✅ Passo 3: Supabase conectado');

        console.log('🔄 Passo 4: Carregando transações (máx 5000)...');
        setStep('Carregando transações (máx 5000)...');

        const transactions = await supabaseService.getAllTransactions();
        console.log('✅ Passo 4: Transações carregadas:', transactions.length);

        console.log('🔄 Passo 5: Carregando mudanças...');
        setStep('Carregando mudanças...');

        const changes = await supabaseService.getAllManualChanges();
        console.log('✅ Passo 5: Mudanças carregadas:', changes.length);

        console.log('🔄 Passo 6: Carregando componentes...');
        setStep('Carregando componentes...');

        await import('./components/DashboardEnhanced');
        await import('./components/Sidebar');
        console.log('✅ Passo 6: Componentes carregados');

        console.log('🔄 Passo 7: Montando aplicação...');
        setStep('Montando aplicação...');

        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('✅ TUDO OK! Carregando app completo...');
        setStep('Carregando app completo...');

        // Redirecionar para o app real
        setTimeout(() => {
          window.location.href = '/full-app';
        }, 1000);

      } catch (err: any) {
        console.error('❌ ERRO:', err);
        setError(err.message || 'Erro desconhecido');
        setStep('Erro ao carregar');
      }
    };

    if (!authLoading) {
      loadApp();
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fcfcfc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
            Verificando autenticação...
          </h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fcfcfc',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          maxWidth: '600px',
          width: '100%'
        }}>
          <h1 style={{ color: '#dc2626', marginBottom: '20px', fontSize: '24px' }}>
            ❌ Erro ao Carregar
          </h1>
          <div style={{
            background: '#fee',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            <p style={{ color: '#991b1b', fontFamily: 'monospace', fontSize: '14px' }}>
              {error}
            </p>
          </div>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            <strong>Última etapa:</strong> {step}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            🔄 Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center',
        minWidth: '400px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid #f3f4f6',
          borderTopColor: '#667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }} />
        <h2 style={{ color: '#333', marginBottom: '10px', fontSize: '20px' }}>
          {step}
        </h2>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Aguarde enquanto carregamos tudo...
        </p>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AppSafe;
