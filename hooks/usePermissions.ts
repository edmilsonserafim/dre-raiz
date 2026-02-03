import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as supabaseService from '../services/supabaseService';
import { Transaction } from '../types';

interface Permission {
  id: string;
  user_id: string;
  permission_type: 'centro_custo' | 'cia' | 'filial';
  permission_value: string;
}

interface UsePermissionsReturn {
  permissions: Permission[];
  loading: boolean;
  canAccess: (transaction: Transaction) => boolean;
  filterTransactions: (transactions: Transaction[]) => Transaction[];
  hasPermissions: boolean;
  allowedMarcas: string[];
  allowedFiliais: string[];
  allowedCategories: string[];
}

export const usePermissions = (): UsePermissionsReturn => {
  const { user, isAdmin } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      // Buscar o usuário no Supabase para pegar o ID
      const dbUser = await supabaseService.getUserByEmail(user.email);

      if (dbUser) {
        const userPermissions = await supabaseService.getUserPermissions(dbUser.id);
        setPermissions(userPermissions);
      }

      setLoading(false);
    };

    loadPermissions();
  }, [user]);

  // Verifica se o usuário tem permissões específicas configuradas
  const hasPermissions = permissions.length > 0;

  // Admin sempre tem acesso total
  if (isAdmin) {
    return {
      permissions,
      loading,
      canAccess: () => true,
      filterTransactions: (transactions) => transactions,
      hasPermissions: false, // Admin não tem restrições
      allowedMarcas: [],
      allowedFiliais: [],
      allowedCategories: []
    };
  }

  // Se não tem permissões configuradas, tem acesso total
  if (!hasPermissions) {
    return {
      permissions,
      loading,
      canAccess: () => true,
      filterTransactions: (transactions) => transactions,
      hasPermissions: false,
      allowedMarcas: [],
      allowedFiliais: [],
      allowedCategories: []
    };
  }

  // Extrair valores permitidos
  const allowedMarcas = permissions
    .filter(p => p.permission_type === 'cia')
    .map(p => p.permission_value);

  const allowedFiliais = permissions
    .filter(p => p.permission_type === 'filial')
    .map(p => p.permission_value);

  const allowedCentroCusto = permissions
    .filter(p => p.permission_type === 'centro_custo')
    .map(p => p.permission_value);

  // Função para verificar se o usuário pode acessar uma transação
  const canAccess = (transaction: Transaction): boolean => {
    // Se tem permissão de filial configurada, verificar
    if (allowedFiliais.length > 0) {
      if (!transaction.filial || !allowedFiliais.includes(transaction.filial)) {
        return false;
      }
    }

    // Se tem permissão de CIA (marca) configurada, verificar
    if (allowedMarcas.length > 0) {
      if (!transaction.marca || !allowedMarcas.includes(transaction.marca)) {
        return false;
      }
    }

    // Se tem permissão de centro de custo configurada, verificar
    // Centro de custo está mapeado para o campo category
    if (allowedCentroCusto.length > 0) {
      if (!transaction.category || !allowedCentroCusto.includes(transaction.category)) {
        return false;
      }
    }

    return true;
  };

  // Função para filtrar lista de transações
  const filterTransactions = (transactions: Transaction[]): Transaction[] => {
    return transactions.filter(canAccess);
  };

  return {
    permissions,
    loading,
    canAccess,
    filterTransactions,
    hasPermissions: true,
    allowedMarcas,
    allowedFiliais,
    allowedCategories: allowedCentroCusto
  };
};
