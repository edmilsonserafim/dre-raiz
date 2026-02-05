import React, { useState, useEffect } from 'react';

const TestApp2: React.FC = () => {
  const [currentTest, setCurrentTest] = useState(1);
  const [results, setResults] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  const runTest = async (testNumber: number) => {
    setLoading(true);
    setCurrentTest(testNumber);

    try {
      switch(testNumber) {
        case 1:
          // Teste básico - já passou
          setResults(prev => ({ ...prev, 1: '✅ React funcionando' }));
          break;

        case 2:
          // Teste de importação de tipos
          const { Transaction } = await import('./types');
          setResults(prev => ({ ...prev, 2: '✅ Types importados' }));
          break;

        case 3:
          // Teste de Supabase client
          const { supabase } = await import('./supabase');
          console.log('Supabase client:', supabase);
          setResults(prev => ({ ...prev, 3: '✅ Supabase client criado' }));
          break;

        case 4:
          // Teste de Firebase
          const firebase = await import('./firebase');
          console.log('Firebase auth:', firebase.auth);
          setResults(prev => ({ ...prev, 4: '✅ Firebase configurado' }));
          break;

        case 5:
          // Teste de AuthContext
          const { AuthProvider } = await import('./contexts/AuthContext');
          console.log('AuthProvider:', AuthProvider);
          setResults(prev => ({ ...prev, 5: '✅ AuthContext carregado' }));
          break;

        case 6:
          // Teste de carregar App completo
          const App = await import('./App');
          console.log('App:', App);
          setResults(prev => ({ ...prev, 6: '✅ App carregado - redirecionando...' }));

          // Aguardar 2 segundos e recarregar com o app real
          setTimeout(() => {
            window.location.href = '/app';
          }, 2000);
          break;
      }
    } catch (error: any) {
      console.error(`❌ Erro no teste ${testNumber}:`, error);
      setResults(prev => ({
        ...prev,
        [testNumber]: `❌ ERRO: ${error.message || 'Erro desconhecido'}`
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-executar o primeiro teste
    if (currentTest === 1) {
      runTest(1);
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        padding: '40px',
        maxWidth: '700px',
        width: '100%'
      }}>
        <h1 style={{ marginBottom: '10px', color: '#333' }}>🔍 Diagnóstico DRE RAIZ</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Testando cada componente separadamente...
        </p>

        <div style={{ marginBottom: '30px' }}>
          {[1, 2, 3, 4, 5, 6].map(testNum => (
            <div
              key={testNum}
              style={{
                padding: '15px',
                marginBottom: '10px',
                borderRadius: '10px',
                background: currentTest === testNum ? '#f0f0f0' : '#fafafa',
                border: currentTest === testNum ? '2px solid #667eea' : '1px solid #e0e0e0'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>Teste {testNum}:</strong>{' '}
                  {testNum === 1 && 'React básico'}
                  {testNum === 2 && 'Tipos TypeScript'}
                  {testNum === 3 && 'Supabase Client'}
                  {testNum === 4 && 'Firebase Auth'}
                  {testNum === 5 && 'Auth Context'}
                  {testNum === 6 && 'App Completo'}
                </div>
                <div>
                  {results[testNum] || (currentTest === testNum && loading ? '⏳' : '⏸️')}
                </div>
              </div>
              {results[testNum]?.includes('❌') && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  background: '#fee',
                  borderRadius: '5px',
                  fontSize: '12px',
                  color: '#c00'
                }}>
                  {results[testNum]}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => runTest(currentTest < 6 ? currentTest + 1 : currentTest)}
            disabled={loading || currentTest >= 6}
            style={{
              flex: 1,
              padding: '12px',
              background: loading || currentTest >= 6 ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading || currentTest >= 6 ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {loading ? '⏳ Testando...' : 'Próximo Teste →'}
          </button>

          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 20px',
              background: '#f0f0f0',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🔄 Reiniciar
          </button>
        </div>

        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#f8f9fa',
          borderRadius: '10px',
          fontSize: '13px',
          color: '#666'
        }}>
          <p><strong>📋 Instruções:</strong></p>
          <p>• Clique em "Próximo Teste" para testar cada componente</p>
          <p>• Se aparecer ❌ vermelho, me avise qual teste falhou</p>
          <p>• Mantenha o Console (F12) aberto para ver detalhes</p>
        </div>
      </div>
    </div>
  );
};

export default TestApp2;
