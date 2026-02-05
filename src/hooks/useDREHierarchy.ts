import { useState, useEffect, useCallback } from 'react';
import * as dreHierarchyService from '../services/dreHierarchyService';
import { DRELevel2Item, DREHierarchyGrouped } from '../services/dreHierarchyService';

export const useDREHierarchy = () => {
  const [hierarchy, setHierarchy] = useState<DRELevel2Item[]>([]);
  const [groupedHierarchy, setGroupedHierarchy] = useState<DREHierarchyGrouped>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carrega hierarquia do banco
   */
  const loadHierarchy = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 useDREHierarchy: Carregando hierarquia...');
      const [items, grouped] = await Promise.all([
        dreHierarchyService.getDREHierarchy(),
        dreHierarchyService.getDREHierarchyGrouped()
      ]);

      setHierarchy(items);
      setGroupedHierarchy(grouped);
      console.log('✅ useDREHierarchy: Hierarquia carregada');
    } catch (err: any) {
      console.error('❌ useDREHierarchy: Erro ao carregar:', err);
      setError(err.message || 'Erro ao carregar hierarquia DRE');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Carrega ao montar
   */
  useEffect(() => {
    loadHierarchy();
  }, [loadHierarchy]);

  /**
   * Refresh manual
   */
  const refresh = useCallback(() => {
    loadHierarchy();
  }, [loadHierarchy]);

  return {
    hierarchy,
    groupedHierarchy,
    isLoading,
    error,
    refresh
  };
};
