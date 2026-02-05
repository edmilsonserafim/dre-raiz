import { useContext } from 'react';
import { TransactionsContext } from '../contexts/TransactionsContext';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HOOK useTransactions
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Hook customizado para consumir TransactionsContext.
 * Lança erro se usado fora do TransactionsProvider.
 *
 * Uso:
 * ```tsx
 * const { transactions, addTransaction, updateTransaction } = useTransactions();
 * ```
 */
export const useTransactions = () => {
  const context = useContext(TransactionsContext);

  if (!context) {
    throw new Error(
      'useTransactions must be used within a TransactionsProvider. ' +
      'Make sure your component is wrapped with <TransactionsProvider>.'
    );
  }

  return context;
};
