import { useState, useCallback } from 'react';
import type { AnalysisPack } from '../../types';
import type { AnalysisOptions } from '../../services/analysisService';

interface UseAnalysisPackReturn {
  analysisPack: AnalysisPack | null;
  loading: boolean;
  error: string | null;
  generate: (options: AnalysisOptions) => Promise<void>;
}

export function useAnalysisPack(): UseAnalysisPackReturn {
  const [analysisPack, setAnalysisPack] = useState<AnalysisPack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (options: AnalysisOptions) => {
    setLoading(true);
    setError(null);

    try {
      // Fazer requisição para o endpoint de geração
      const response = await fetch('/api/analysis/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        throw new Error(`Erro ao gerar análise: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido ao gerar análise');
      }

      setAnalysisPack(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao gerar análise:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    analysisPack,
    loading,
    error,
    generate,
  };
}
