import { supabase } from '../../supabase';

export interface DRELevel2Item {
  id: string;
  nivel_1_code: string;
  nivel_1_label: string;
  nivel_2_code: string;
  nivel_2_label: string;
  items: string[];  // Array de conta_contabil
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface DREHierarchyGrouped {
  [nivel1Code: string]: {
    label: string;
    items: DRELevel2Item[];
  };
}

/**
 * Busca toda a hierarquia DRE (ordenada)
 */
export async function getDREHierarchy(): Promise<DRELevel2Item[]> {
  const { data, error } = await supabase
    .from('dre_hierarchy')
    .select('*')
    .eq('ativo', true)
    .order('nivel_1_code', { ascending: true })
    .order('ordem', { ascending: true });

  if (error) {
    console.error('❌ Erro ao buscar hierarquia DRE:', error);
    throw error;
  }

  console.log(`✅ Hierarquia DRE carregada: ${data.length} itens`);
  return data as DRELevel2Item[];
}

/**
 * Busca hierarquia agrupada por Nível 1
 */
export async function getDREHierarchyGrouped(): Promise<DREHierarchyGrouped> {
  const items = await getDREHierarchy();

  const grouped: DREHierarchyGrouped = {};

  items.forEach(item => {
    if (!grouped[item.nivel_1_code]) {
      grouped[item.nivel_1_code] = {
        label: item.nivel_1_label,
        items: []
      };
    }
    grouped[item.nivel_1_code].items.push(item);
  });

  return grouped;
}

/**
 * Adiciona novo item de Nível 2
 */
export async function addDRELevel2(data: Omit<DRELevel2Item, 'id' | 'created_at' | 'updated_at'>): Promise<DRELevel2Item> {
  const { data: inserted, error } = await supabase
    .from('dre_hierarchy')
    .insert({
      nivel_1_code: data.nivel_1_code,
      nivel_1_label: data.nivel_1_label,
      nivel_2_code: data.nivel_2_code,
      nivel_2_label: data.nivel_2_label,
      items: data.items,
      ordem: data.ordem,
      ativo: data.ativo
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao adicionar item Nível 2:', error);
    throw error;
  }

  console.log('✅ Item Nível 2 adicionado:', inserted.nivel_2_code);
  return inserted as DRELevel2Item;
}

/**
 * Atualiza item de Nível 2
 */
export async function updateDRELevel2(id: string, updates: Partial<DRELevel2Item>): Promise<DRELevel2Item> {
  const { data: updated, error } = await supabase
    .from('dre_hierarchy')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao atualizar item Nível 2:', error);
    throw error;
  }

  console.log('✅ Item Nível 2 atualizado:', updated.nivel_2_code);
  return updated as DRELevel2Item;
}

/**
 * Deleta item de Nível 2 (soft delete: marca como inativo)
 */
export async function deleteDRELevel2(id: string): Promise<void> {
  const { error } = await supabase
    .from('dre_hierarchy')
    .update({ ativo: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('❌ Erro ao deletar item Nível 2:', error);
    throw error;
  }

  console.log('✅ Item Nível 2 deletado (soft):', id);
}

/**
 * Reordena itens de Nível 2
 */
export async function reorderDRELevel2(items: { id: string; ordem: number }[]): Promise<void> {
  const promises = items.map(item =>
    supabase
      .from('dre_hierarchy')
      .update({ ordem: item.ordem, updated_at: new Date().toISOString() })
      .eq('id', item.id)
  );

  const results = await Promise.all(promises);

  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    console.error('❌ Erros ao reordenar:', errors);
    throw new Error('Falha ao reordenar itens');
  }

  console.log('✅ Itens reordenados com sucesso');
}

/**
 * Busca todas as categorias (conta_contabil) únicas
 */
export async function getAllCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('conta_contabil')
    .not('conta_contabil', 'is', null);

  if (error) {
    console.error('❌ Erro ao buscar categorias:', error);
    throw error;
  }

  const categories = [...new Set(data.map(t => t.conta_contabil))].sort();
  return categories;
}
