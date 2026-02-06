
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TRANSAÇÕES VIEW - EM MIGRAÇÃO PARA CONTEXT API
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * FASE 1 (ATUAL): Estrutura base criada
 * - TransactionsContext criado (src/contexts/TransactionsContext.tsx)
 * - useTransactions hook disponível (src/hooks/useTransactions.ts)
 * - PRÓXIMO PASSO: Migrar este componente para consumir o context
 *
 * TODO - CONFIGURAÇÕES FUTURAS
 *
 * 1. ABA "ORÇAMENTO":
 *    - Atualmente desabilitada (retorna false no filtro)
 *    - Precisa configurar fonte de dados de orçamento
 *
 * 2. ABA "ANO ANTERIOR":
 *    - Atualmente desabilitada (retorna false no filtro)
 *    - Precisa configurar lógica de comparação com ano anterior
 *
 * STATUS: Por enquanto, apenas a aba REAL está funcional (50.000 registros)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Transaction, TransactionType, TransactionStatus, ManualChange, PaginationParams } from '../types';
import { BRANCHES, ALL_CATEGORIES, CATEGORIES } from '../constants';
import { getFilteredTransactions, TransactionFilters } from '../services/supabaseService';
import * as XLSX from 'xlsx';
import debounce from 'lodash.debounce';
import {
  Edit3, GitFork, X, Save,
  ReceiptText, FilterX,
  PlusCircle, ExternalLink,
  Trash2, Filter, Loader2,
  Split, CheckCircle2, Download, ListOrdered, Calculator, ArrowRight,
  ChevronDown, Check, Square, CheckSquare, TrendingUp, History,
  TrendingDown, ArrowUpRight, ArrowDownRight, AlertCircle, Search, ArrowLeft, TableProperties
} from 'lucide-react';

interface TransactionsViewProps {
  transactions: Transaction[];
  searchedTransactions: Transaction[];
  setSearchedTransactions: (transactions: Transaction[]) => void;
  hasSearchedTransactions: boolean;
  setHasSearchedTransactions: (value: boolean) => void;
  addTransaction: (t: Omit<Transaction, 'id' | 'status'>) => void;
  requestChange: (change: Omit<ManualChange, 'id' | 'status' | 'requestedAt' | 'requestedBy' | 'originalTransaction'>) => void;
  deleteTransaction: (id: string) => void;
  fetchFromCSV?: (imported: Transaction[]) => void;
  isSyncing?: boolean;
  externalFilters?: any;
  clearGlobalFilters?: () => void;
  externalActiveTab?: 'real' | 'orcamento' | 'comparativo';
  onBackToDRE?: () => void;
}

type SortKey = keyof Transaction;
type SortDirection = 'asc' | 'desc';

interface RateioPart {
  id: string;
  amount: number;
  percent: number;
  filial: string;
  marca: string;
  date: string;
  category: string;
}

const formatDateToMMAAAA = (date: any) => {
  if (!date) return '-';
  let d = date;
  if (typeof d === 'number') {
    const dateObj = new Date((d - 25569) * 86400 * 1000);
    return `${String(dateObj.getMonth() + 1).padStart(2, '0')}-${dateObj.getFullYear()}`;
  }
  const parts = String(d).split('-');
  if (parts.length >= 2) {
    if (parts[0].length === 4) return `${parts[1]}-${parts[0]}`;
    if (parts[2]?.length === 4) return `${parts[1]}-${parts[2]}`;
  }
  return String(d);
};

const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions: propsTransactions,
  searchedTransactions,
  setSearchedTransactions,
  hasSearchedTransactions,
  setHasSearchedTransactions,
  requestChange,
  fetchFromCSV,
  isSyncing: initialSyncing,
  externalFilters,
  clearGlobalFilters,
  externalActiveTab,
  onBackToDRE
}) => {
  // Estado de busca
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchAllModal, setShowSearchAllModal] = useState(false);
  const [searchAllProgress, setSearchAllProgress] = useState({ current: 0, total: 0, loaded: 0 });
  const cancelSearchAllRef = useRef(false); // Usar ref para cancelamento funcionar no loop

  const [showFilters, setShowFilters] = useState(true);
  const [isSyncing, setIsSyncing] = useState(initialSyncing);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [rateioTransaction, setRateioTransaction] = useState<Transaction | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'date', direction: 'desc' });

  // Usar transactions buscados do estado do App.tsx se já buscou, senão mostrar vazio
  const transactions = hasSearchedTransactions ? searchedTransactions : [];

  // Abas e Paginação
  const [activeTab, setActiveTab] = useState<'real' | 'orcamento' | 'comparativo'>(() => {
    // Carregar aba ativa salva do sessionStorage
    const saved = sessionStorage.getItem('transactionsActiveTab');
    return saved ? JSON.parse(saved) : 'real';
  });
  // Paginação server-side (Virtual Scrolling)
  const PAGE_SIZE = 500;  // 500 registros por página (scroll infinito)
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Paginação client-side legada (será removida após virtual scrolling)
  const [currentPage, setCurrentPage] = useState(1);
  const RECORDS_PER_PAGE = 1000;

  const filterContainerRef = useRef<HTMLDivElement>(null);

  const [rateioParts, setRateioParts] = useState<RateioPart[]>([]);
  const [editForm, setEditForm] = useState({ category: '', date: '', filial: '', marca: '', justification: '', amount: 0, recurring: 'Sim', chave_id: '' });
  const [rateioJustification, setRateioJustification] = useState('');

  const initialFilters = {
    monthFrom: '',
    monthTo: '',
    marca: [] as string[],
    filial: [] as string[],
    tag01: [] as string[],
    tag02: [] as string[],
    tag03: [] as string[],
    category: [] as string[],
    ticket: '',
    chave_id: [] as string[],
    vendor: '',
    description: '',
    amount: '',
    recurring: ['Sim'] as string[]  // Filtro padrão: apenas "Sim"
  };

  const [colFilters, setColFilters] = useState(() => {
    // Carregar filtros salvos do sessionStorage
    const saved = sessionStorage.getItem('transactionsColFilters');
    return saved ? JSON.parse(saved) : initialFilters;
  });
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownSearches, setDropdownSearches] = useState<Record<string, string>>({});

  // Debounced filter setter for text inputs
  const debouncedSetFilter = useMemo(
    () => debounce((key: string, value: string) => {
      setColFilters(prev => ({ ...prev, [key]: value }));
    }, 300),
    []
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => debouncedSetFilter.cancel();
  }, [debouncedSetFilter]);

  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      if (openDropdown && filterContainerRef.current) {
        const target = event.target as HTMLElement;
        if (!target.closest('.multi-select-container')) {
          setOpenDropdown(null);
        }
      }
    };
    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, [openDropdown]);

  // Limpar busca quando dropdown for fechado
  useEffect(() => {
    if (!openDropdown) {
      setDropdownSearches({});
    }
  }, [openDropdown]);

  const dynamicOptions = useMemo(() => {
    // Gerar opções dinâmicas baseadas nos filtros ativos
    // Mostra apenas as opções relevantes considerando os outros filtros
    const getOptions = (field: keyof Transaction) => {
      const filtered = transactions.filter(t => {
        return Object.entries(colFilters).every(([key, value]) => {
          // Não filtrar pelo próprio campo que estamos gerando opções
          if (key === field) return true;

          // Ignorar filtros vazios
          if (!value || (Array.isArray(value) && value.length === 0)) return true;

          // Ignorar filtros de período (já aplicados no servidor)
          if (key === 'monthFrom' || key === 'monthTo') return true;

          // Filtros de array
          const tValue = String(t[key as keyof Transaction] || '');
          if (Array.isArray(value)) {
            return value.includes(tValue);
          }

          // Filtros de texto
          const filterValue = String(value).toLowerCase();
          return tValue.toLowerCase().includes(filterValue);
        });
      });
      return Array.from(new Set(filtered.map(t => t[field]).filter(Boolean))).sort() as string[];
    };

    return {
      marcas: getOptions('marca'),
      filiais: getOptions('filial'),
      tag01s: getOptions('tag01'),
      tag02s: getOptions('tag02'),
      tag03s: getOptions('tag03'),
      categories: getOptions('category'),
      chave_id: getOptions('chave_id'),
      recurrings: ['Sim', 'Não']
    };
  }, [transactions, colFilters]);

  const ALL_BRANDS = useMemo(() => Array.from(new Set(transactions.map(t => t.marca).filter(Boolean))).sort(), [transactions]);

  useEffect(() => {
    if (externalFilters) {
      const formatted = { ...externalFilters };
      ['marca', 'filial', 'tag01', 'tag02', 'tag03', 'category'].forEach(key => {
        if (formatted[key] && typeof formatted[key] === 'string' && formatted[key] !== 'all') {
          formatted[key] = [formatted[key]];
        } else if (formatted[key] === 'all' || !formatted[key]) {
          formatted[key] = [];
        }
      });
      setColFilters(prev => ({ ...prev, ...formatted }));
      setShowFilters(true);
    }
  }, [externalFilters]);

  // Sincronizar aba ativa quando vem do drill-down
  useEffect(() => {
    if (externalActiveTab) {
      setActiveTab(externalActiveTab);
    }
  }, [externalActiveTab]);

  // Salvar filtros no sessionStorage quando mudarem
  useEffect(() => {
    sessionStorage.setItem('transactionsColFilters', JSON.stringify(colFilters));
  }, [colFilters]);

  // Salvar aba ativa no sessionStorage
  useEffect(() => {
    sessionStorage.setItem('transactionsActiveTab', JSON.stringify(activeTab));
  }, [activeTab]);

  // Sincroniza estado do formulário de edição
  useEffect(() => {
    if (editingTransaction) {
      setEditForm({
        category: editingTransaction.category,
        date: editingTransaction.date,
        filial: editingTransaction.filial,
        marca: editingTransaction.marca || 'SAP',
        justification: '',
        amount: editingTransaction.amount,
        recurring: editingTransaction.recurring || 'Sim',
        chave_id: editingTransaction.chave_id || ''
      });
    }
  }, [editingTransaction]);

  // Sincroniza estado do rateio
  useEffect(() => {
    if (rateioTransaction) {
      setRateioJustification('');
      setRateioParts([
        {
          id: `p1-${Date.now()}`,
          filial: rateioTransaction.filial,
          marca: rateioTransaction.marca || 'SAP',
          amount: Number((rateioTransaction.amount / 2).toFixed(2)),
          percent: 50,
          date: rateioTransaction.date,
          category: rateioTransaction.category
        },
        {
          id: `p2-${Date.now()}`,
          filial: rateioTransaction.filial,
          marca: rateioTransaction.marca || 'SAP',
          amount: Number((rateioTransaction.amount / 2).toFixed(2)),
          percent: 50,
          date: rateioTransaction.date,
          category: rateioTransaction.category
        }
      ]);
    }
  }, [rateioTransaction]);

  // Função para buscar dados com filtros
  const handleSearchData = async (pageNumber: number | any = 1) => {
    // Garantir que pageNumber é sempre um número
    const page = typeof pageNumber === 'number' ? pageNumber : 1;

    setIsSearching(true);
    console.log('🔍 Iniciando busca com filtros:', colFilters);

    try {
      // ESTRATÉGIA DE FILTRAGEM HÍBRIDA:
      // - Servidor: aplica filtros de PERÍODO e CENÁRIO (para limitar volume de dados)
      // - Client-side: aplica todos os outros filtros em tempo real (tags, marca, filial, etc.)
      const filters: TransactionFilters = {
        monthFrom: colFilters.monthFrom || undefined,
        monthTo: colFilters.monthTo || undefined,
        scenario: activeTab === 'real' ? 'Real' : activeTab === 'orcamento' ? 'Orçamento' : undefined,
        // Todos os outros filtros serão aplicados no client-side
      };

      const pagination: PaginationParams = { pageNumber: page, pageSize: PAGE_SIZE };

      const response = await getFilteredTransactions(filters, pagination);

      if (page === 1) {
        // Nova busca - substitui dados
        setSearchedTransactions(response.data);
      } else {
        // Página adicional - append
        setSearchedTransactions(prev => [...prev, ...response.data]);
      }

      setTotalCount(response.totalCount);
      setHasMore(response.hasMore);
      setCurrentPageNumber(page);
      setHasSearchedTransactions(true);

      console.log(`✅ Busca concluída: ${response.data.length} registros retornados (página ${page})`);
      console.log(`📊 Total de registros: ${response.totalCount}, Mais páginas: ${response.hasMore}`);
    } catch (error) {
      console.error('❌ Erro ao buscar dados:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Função para carregar próxima página (scroll infinito)
  const loadNextPage = async () => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    console.log(`📥 Carregando próxima página: ${currentPageNumber + 1}`);

    try {
      await handleSearchData(currentPageNumber + 1);
    } catch (error) {
      console.error('❌ Erro ao carregar próxima página:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Função para buscar TODOS os dados (loop paginado com progresso)
  const handleSearchAll = async () => {
    setShowSearchAllModal(false);
    setIsSearching(true);
    cancelSearchAllRef.current = false; // Reset do flag de cancelamento
    setSearchAllProgress({ current: 0, total: 0, loaded: 0 });
    console.log('🔍 Buscando TODOS os dados com filtros:', colFilters);

    try {
      // Passar TODOS os filtros para o servidor
      const filters: TransactionFilters = {
        monthFrom: colFilters.monthFrom || undefined,
        monthTo: colFilters.monthTo || undefined,
        scenario: activeTab === 'real' ? 'Real' : activeTab === 'orcamento' ? 'Orçamento' : undefined,
        marca: colFilters.marca && colFilters.marca.length > 0 ? colFilters.marca : undefined,
        filial: colFilters.filial && colFilters.filial.length > 0 ? colFilters.filial : undefined,
        tag01: colFilters.tag01 && colFilters.tag01.length > 0 ? colFilters.tag01 : undefined,
        tag02: colFilters.tag02 && colFilters.tag02.length > 0 ? colFilters.tag02 : undefined,
        tag03: colFilters.tag03 && colFilters.tag03.length > 0 ? colFilters.tag03 : undefined,
        category: colFilters.category && colFilters.category.length > 0 ? colFilters.category : undefined,
        chave_id: colFilters.chave_id && colFilters.chave_id.length > 0 ? colFilters.chave_id : undefined,
        recurring: colFilters.recurring && colFilters.recurring.length > 0 ? colFilters.recurring : undefined,
        ticket: colFilters.ticket || undefined,
        vendor: colFilters.vendor || undefined,
        description: colFilters.description || undefined,
        amount: colFilters.amount || undefined,
      };

      console.log('📋 Filtros aplicados:', filters);

      // Primeira busca para descobrir o total
      const firstResponse = await getFilteredTransactions(filters, {
        pageNumber: 1,
        pageSize: 1000
      });

      if (firstResponse.data.length === 0) {
        console.log('⚠️ Nenhum dado encontrado');
        setIsSearching(false);
        setHasSearchedTransactions(true);
        return;
      }

      const totalPages = firstResponse.totalPages;
      const totalRecords = firstResponse.totalCount;

      console.log(`📊 Total: ${totalRecords} registros em ${totalPages} páginas`);
      setSearchAllProgress({ current: 1, total: totalPages, loaded: firstResponse.data.length });

      // Iniciar com dados da primeira página
      let allData: Transaction[] = [...firstResponse.data];

      // Atualizar UI com primeira página
      setSearchedTransactions(allData);
      setHasSearchedTransactions(true);

      // Buscar páginas restantes
      for (let page = 2; page <= totalPages; page++) {
        // Verificar se foi cancelado (usando ref)
        if (cancelSearchAllRef.current) {
          console.log(`⚠️ Busca cancelada pelo usuário na página ${page}/${totalPages}`);
          console.log(`✅ ${allData.length} registros foram carregados antes do cancelamento`);
          break;
        }

        console.log(`📄 Buscando página ${page}/${totalPages}...`);

        const response = await getFilteredTransactions(filters, {
          pageNumber: page,
          pageSize: 1000
        });

        allData = [...allData, ...response.data];

        // Atualizar UI incrementalmente a cada 5 páginas
        if (page % 5 === 0 || page === totalPages) {
          setSearchedTransactions([...allData]);
          console.log(`✅ Carregado: ${allData.length}/${totalRecords} registros (${Math.round((allData.length / totalRecords) * 100)}%)`);
        }

        setSearchAllProgress({
          current: page,
          total: totalPages,
          loaded: allData.length
        });

        // Segurança: parar se passar de 150 páginas
        if (page >= 150) {
          console.warn('⚠️ Limite de segurança atingido (150 páginas)');
          break;
        }

        // Pequeno delay para não sobrecarregar (50ms)
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Atualização final
      setSearchedTransactions(allData);
      setTotalCount(allData.length);
      setHasMore(false);
      setCurrentPageNumber(1);

      if (!cancelSearchAllRef.current) {
        console.log(`✅ Busca completa: ${allData.length} registros carregados em ${totalPages} páginas`);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar todos os dados:', error);
      alert(`Erro ao buscar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsSearching(false);
      cancelSearchAllRef.current = false;
      setSearchAllProgress({ current: 0, total: 0, loaded: 0 });
    }
  };

  const filteredAndSorted = useMemo(() => {
    console.log('🔍 Aplicando filtros client-side e ordenação:', {
      activeTab,
      totalTransactions: transactions.length,
      activeFilters: Object.keys(colFilters).filter(key => {
        const value = colFilters[key as keyof typeof colFilters];
        return value && (Array.isArray(value) ? value.length > 0 : true);
      })
    });

    return transactions
      .filter(t => {
        // 1. Filtrar por aba ativa (cenário) - case-insensitive e sem acentos
        const scenarioNormalized = (t.scenario || '').toLowerCase().trim()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        if (activeTab === 'real') {
          // Aceitar 'real' ou vazio (transações sem cenário definido são consideradas 'real')
          if (scenarioNormalized !== 'real' && scenarioNormalized !== '') return false;
        }

        if (activeTab === 'orcamento') {
          // TODO: ORÇAMENTO será configurado futuramente
          return false;
        }

        if (activeTab === 'comparativo') {
          // TODO: ANO ANTERIOR será configurado futuramente
          return false;
        }

        // 2. Aplicar filtros client-side (EXCETO período, que já foi aplicado no servidor)
        return Object.entries(colFilters).every(([key, value]) => {
          // Ignorar filtros vazios
          if (!value || (Array.isArray(value) && value.length === 0)) return true;

          // IMPORTANTE: NÃO filtrar por período aqui (já foi aplicado no servidor)
          if (key === 'monthFrom' || key === 'monthTo') return true;

          // Filtros de array (marca, filial, tags, category, chave_id, recurring)
          const tValue = String(t[key as keyof Transaction] || '');
          if (Array.isArray(value)) {
            // Comparação case-insensitive para campos que podem ter variação de maiúsculas/minúsculas
            if (key === 'recurring') {
              return value.some(v => String(v).toLowerCase() === tValue.toLowerCase());
            }
            return value.includes(tValue);
          }

          // Filtros de texto (ticket, vendor, description, amount)
          const filterValue = String(value).toLowerCase();
          return tValue.toLowerCase().includes(filterValue);
        });
      })
      .sort((a, b) => {
        const aVal = a[sortConfig.key] ?? '';
        const bVal = b[sortConfig.key] ?? '';
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return sortConfig.direction === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
      });
  }, [transactions, colFilters, sortConfig, activeTab]);

  const totalAmount = useMemo(() => {
    return filteredAndSorted.reduce((sum, t) => t.type === 'REVENUE' ? sum + t.amount : sum - t.amount, 0);
  }, [filteredAndSorted]);

  // Paginação client-side legada (será removida)
  const totalPages = Math.ceil(filteredAndSorted.length / RECORDS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
    const endIndex = startIndex + RECORDS_PER_PAGE;
    return filteredAndSorted.slice(startIndex, endIndex);
  }, [filteredAndSorted, currentPage]);

  // Resetar para página 1 quando filtros ou aba mudar
  useEffect(() => {
    setCurrentPage(1);
  }, [colFilters, activeTab]);

  // Scroll infinito (SEM virtual scrolling - renderização normal com paginação server-side)
  const parentRef = useRef<HTMLDivElement>(null);

  // Detectar scroll até o fim para carregar próxima página
  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = parent;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200;

      if (isNearBottom && hasMore && !isLoadingMore && filteredAndSorted.length > 0) {
        console.log('📥 Scroll infinito: Carregando próxima página...');
        loadNextPage();
      }
    };

    parent.addEventListener('scroll', handleScroll);
    return () => parent.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, filteredAndSorted.length]);

  // Contadores por aba
  const tabCounts = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const counts = {
      real: 0,
      orcamento: 0,
      comparativo: 0  // TODO: Será configurado futuramente
    };

    // Debug: Ver quais cenários existem no banco
    const uniqueScenarios = new Set<string>();

    transactions.forEach(t => {
      const tYear = new Date(t.date).getFullYear();
      uniqueScenarios.add(t.scenario || 'undefined');

      // Normalizar cenário para comparação
      const scenarioNormalized = (t.scenario || '').toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      if (scenarioNormalized === 'real') counts.real++;
      // TODO: Orçamento será configurado futuramente
      // if (scenarioNormalized === 'orcamento') counts.orcamento++;
      // TODO: Ano Anterior será configurado futuramente
      // if (tYear === currentYear - 1) counts.comparativo++;
    });

    // Log para debug (temporário)
    console.log('🔍 Cenários encontrados no banco:', Array.from(uniqueScenarios));
    console.log('📊 Contadores:', counts);

    return counts;
  }, [transactions]);

  // Calculate summary metrics for filtered data
  const filteredSummary = useMemo(() => {
    const filtered = filteredAndSorted;
    const budget = transactions.filter(t => t.scenario === 'Orçamento');

    const totalRevenue = filtered.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
    const totalVariableCosts = filtered.filter(t => t.type === 'VARIABLE_COST').reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const totalFixedCosts = filtered.filter(t => t.type === 'FIXED_COST').reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const sgaCosts = filtered.filter(t => t.type === 'SGA').reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const rateioCosts = filtered.filter(t => t.type === 'RATEIO').reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const ebitda = totalRevenue - totalVariableCosts - totalFixedCosts - sgaCosts - rateioCosts;

    // Budget comparisons
    const budgetRevenue = budget.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
    const budgetVariableCosts = budget.filter(t => t.type === 'VARIABLE_COST').reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const budgetFixedCosts = budget.filter(t => t.type === 'FIXED_COST').reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const budgetSga = budget.filter(t => t.type === 'SGA').reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const budgetRateio = budget.filter(t => t.type === 'RATEIO').reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const budgetEbitda = budgetRevenue - budgetVariableCosts - budgetFixedCosts - budgetSga - budgetRateio;

    const revenueVsBudget = budgetRevenue > 0 ? ((totalRevenue - budgetRevenue) / budgetRevenue) * 100 : undefined;
    const variableCostsVsBudget = budgetVariableCosts > 0 ? ((totalVariableCosts - budgetVariableCosts) / budgetVariableCosts) * 100 : undefined;
    const fixedCostsVsBudget = budgetFixedCosts > 0 ? ((totalFixedCosts - budgetFixedCosts) / budgetFixedCosts) * 100 : undefined;
    const ebitdaVsBudget = budgetEbitda !== 0 ? ((ebitda - budgetEbitda) / Math.abs(budgetEbitda)) * 100 : undefined;

    return {
      totalRevenue,
      totalVariableCosts,
      totalFixedCosts,
      ebitda,
      revenueVsBudget,
      variableCostsVsBudget,
      fixedCostsVsBudget,
      ebitdaVsBudget
    };
  }, [filteredAndSorted, transactions]);

  const handleExportExcel = () => {
    const headers = ["Cenário", "Data", "Tag 01", "Tag 02", "Tag 03", "Conta", "Unidade", "Marca", "Ticket", "Fornecedor", "Descrição", "Valor", "Recorrente", "ID", "Status", "Justificativa"];
    const rows = filteredAndSorted.map(t => [
      t.scenario || 'Real',
      t.date,
      t.tag01 || '',
      t.tag02 || '',
      t.tag03 || '',
      t.category,
      t.filial,
      t.marca || 'SAP',
      t.ticket || '',
      t.vendor || '',
      t.description,
      t.amount,
      t.recurring || 'Sim',
      t.id,
      t.status,
      t.justification || ''
    ]);

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Definir largura das colunas
    const colWidths = [
      { wch: 10 },  // Cenário
      { wch: 12 },  // Data
      { wch: 15 },  // Tag 01
      { wch: 15 },  // Tag 02
      { wch: 15 },  // Tag 03
      { wch: 25 },  // Conta
      { wch: 12 },  // Unidade
      { wch: 10 },  // Marca
      { wch: 15 },  // Ticket
      { wch: 30 },  // Fornecedor
      { wch: 50 },  // Descrição
      { wch: 15 },  // Valor
      { wch: 12 },  // Recorrente
      { wch: 30 },  // ID
      { wch: 12 },  // Status
      { wch: 40 }   // Justificativa
    ];
    ws['!cols'] = colWidths;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, "Lançamentos");

    // Gerar e baixar o arquivo Excel
    const fileName = `Relatorio_SAP_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleSubmitAjuste = () => {
    console.log('🟢 handleSubmitAjuste INICIADO');

    if (!editingTransaction) {
      console.error('❌ editingTransaction é NULL');
      return;
    }

    if (!editForm.justification.trim()) {
      console.error('❌ justification está vazia');
      return;
    }

    console.log('✅ Validações OK', {
      transactionId: editingTransaction.id,
      justification: editForm.justification,
      justificationLength: editForm.justification.length
    });

    const changeData = {
      transactionId: editingTransaction.id,
      description: `Ajuste: ${editForm.justification}`,
      justification: editForm.justification,
      type: 'MULTI' as const,
      oldValue: JSON.stringify(editingTransaction),
      newValue: JSON.stringify(editForm)
    };

    console.log('📦 Dados do change (ajuste):', {
      transactionId: changeData.transactionId,
      description: changeData.description,
      justification: changeData.justification,
      type: changeData.type,
      oldValuePreview: changeData.oldValue.substring(0, 50) + '...',
      newValuePreview: changeData.newValue.substring(0, 50) + '...'
    });

    console.log('🔄 Chamando requestChange...');
    requestChange(changeData);

    console.log('✅ requestChange chamado, fechando modal');
    setEditingTransaction(null);
  };

  const currentRateioSum = useMemo(() => rateioParts.reduce((sum, p) => sum + Number(p.amount), 0), [rateioParts]);
  const remainingRateio = useMemo(() => (rateioTransaction?.amount || 0) - currentRateioSum, [rateioTransaction, currentRateioSum]);
  const isRateioFullyAllocated = useMemo(() => Math.abs(remainingRateio) < 0.05, [remainingRateio]);

  const handleSubmitRateio = () => {
    console.log('🟢 handleSubmitRateio INICIADO');

    if (!rateioTransaction) {
      console.error('❌ rateioTransaction é NULL');
      return;
    }

    if (!isRateioFullyAllocated) {
      console.error('❌ Rateio não está totalmente alocado', {
        currentSum: currentRateioSum,
        remaining: remainingRateio
      });
      return;
    }

    if (!rateioJustification.trim()) {
      console.error('❌ rateioJustification está vazia');
      return;
    }

    console.log('✅ Validações OK', {
      transactionId: rateioTransaction.id,
      justification: rateioJustification,
      justificationLength: rateioJustification.length,
      partsCount: rateioParts.length
    });

    const newTransactions: Transaction[] = rateioParts.filter(p => p.amount !== 0).map((p, idx) => ({
      ...rateioTransaction,
      id: crypto.randomUUID(),
      chave_id: `${rateioTransaction.chave_id || rateioTransaction.id}-R${idx}`,
      filial: p.filial,
      marca: p.marca,
      date: p.date,
      category: p.category,
      amount: Number(p.amount.toFixed(2)),
      type: CATEGORIES.FIXED_COST.includes(p.category) ? 'FIXED_COST' : CATEGORIES.VARIABLE_COST.includes(p.category) ? 'VARIABLE_COST' : 'REVENUE',
      status: 'Rateado'
    }));

    console.log('📦 Novas transações criadas:', {
      count: newTransactions.length,
      ids: newTransactions.map(t => t.id),
      amounts: newTransactions.map(t => t.amount)
    });

    const changeData = {
      transactionId: rateioTransaction.id,
      description: `Rateio: ${rateioJustification}`,
      justification: rateioJustification,
      type: 'RATEIO' as const,
      oldValue: JSON.stringify(rateioTransaction),
      newValue: JSON.stringify({ transactions: newTransactions, justification: rateioJustification })
    };

    console.log('📦 Dados do change (rateio):', {
      transactionId: changeData.transactionId,
      description: changeData.description,
      justification: changeData.justification,
      type: changeData.type,
      oldValuePreview: changeData.oldValue.substring(0, 50) + '...',
      newValuePreview: changeData.newValue.substring(0, 100) + '...'
    });

    console.log('🔄 Chamando requestChange...');
    requestChange(changeData);

    console.log('✅ requestChange chamado, fechando modal');
    setRateioTransaction(null);
  };

  const updateRateioPart = (id: string, updates: Partial<RateioPart>) => {
    setRateioParts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleClearAllFilters = () => {
    setColFilters(initialFilters);
    if (clearGlobalFilters) clearGlobalFilters();
    // Limpar também os dados da busca
    setHasSearchedTransactions(false);
    setSearchedTransactions([]);
  };

  const toggleMultiFilter = (key: string, value: string) => {
    setColFilters(prev => {
      const current = (prev as any)[key] as string[];
      const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const isFilterActive = (key: keyof typeof initialFilters) => {
    const val = colFilters[key];
    if (Array.isArray(val)) return val.length > 0;
    return val !== initialFilters[key];
  };

  // Check if any filter is active
  const isAnyFilterActive = useMemo(() => {
    return Object.keys(colFilters).some(key => isFilterActive(key as keyof typeof initialFilters));
  }, [colFilters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.keys(colFilters).filter(key => isFilterActive(key as keyof typeof initialFilters)).length;
  }, [colFilters]);

  const MultiSelectFilter = ({ id, label, options, selected, active }: any) => {
    const isOpen = openDropdown === id;
    const summary = selected.length === 0 ? "Todos" : selected.length === 1 ? selected[0] : `${selected.length} Sel.`;
    const searchTerm = dropdownSearches[id] || '';

    // Filtrar opções baseado no termo de busca
    const filteredOptions = useMemo(() => {
      if (!searchTerm) return options;
      return options.filter((opt: string) =>
        opt.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }, [options, searchTerm]);

    return (
      <div className="space-y-0.5 relative multi-select-container">
        <label className="text-[6.5px] font-black text-gray-400 uppercase tracking-widest leading-none">{label}</label>
        <button
          onClick={(e) => { e.stopPropagation(); setOpenDropdown(isOpen ? null : id); }}
          className={`w-full flex items-center justify-between border p-1 rounded-none text-[8px] font-black transition-all ${active ? 'bg-yellow-50 border-yellow-400 shadow-sm' : 'bg-gray-50 border-gray-100'}`}
        >
          <span className="truncate pr-1 uppercase">{summary}</span>
          <ChevronDown size={8} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="absolute top-full left-0 z-[150] w-[200px] bg-white border border-gray-200 shadow-2xl mt-1 p-2 animate-in fade-in slide-in-from-top-1 duration-150" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-gray-50">
              <div className="flex items-center gap-1">
                <span className="text-[7px] font-black text-gray-400 uppercase">Filtro: {label}</span>
                {searchTerm && (
                  <span className="text-[7px] font-bold text-[#1B75BB] bg-blue-50 px-1 rounded">
                    {filteredOptions.length}
                  </span>
                )}
              </div>
              <button onClick={() => setColFilters(prev => ({...prev, [id]: []}))} className="text-[7px] font-black text-rose-500 uppercase hover:underline">Limpar</button>
            </div>

            {/* Campo de busca */}
            <div className="mb-1.5 relative">
              <div className="flex items-center gap-1 border border-gray-200 rounded-sm bg-gray-50 px-1.5 py-1 focus-within:border-[#1B75BB] focus-within:ring-1 focus-within:ring-[#1B75BB]">
                <Search size={10} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setDropdownSearches(prev => ({ ...prev, [id]: e.target.value }))}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 text-[8px] font-bold bg-transparent outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownSearches(prev => ({ ...prev, [id]: '' }));
                    }}
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            </div>

            {/* Botão Selecionar Todos os filtrados */}
            {filteredOptions.length > 0 && filteredOptions.length < options.length && (
              <div className="mb-1 pb-1 border-b border-gray-50">
                <button
                  onClick={() => {
                    const currentSelected = [...selected];
                    filteredOptions.forEach((opt: string) => {
                      if (!currentSelected.includes(opt)) {
                        currentSelected.push(opt);
                      }
                    });
                    setColFilters(prev => ({ ...prev, [id]: currentSelected }));
                  }}
                  className="w-full px-1.5 py-0.5 text-[7px] font-black text-[#1B75BB] hover:bg-blue-50 rounded-sm transition-colors uppercase"
                >
                  Selecionar Resultados ({filteredOptions.length})
                </button>
              </div>
            )}

            <div className="max-h-[200px] overflow-y-auto space-y-0.5 pr-1">
              {filteredOptions.length === 0 ? (
                <div className="text-center py-3 text-[8px] text-gray-400 font-bold">
                  Nenhum resultado encontrado
                </div>
              ) : (
                filteredOptions.map((opt: string) => {
                  const isChecked = selected.includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => toggleMultiFilter(id, opt)}
                      className={`w-full flex items-center gap-2 px-1.5 py-1 text-left rounded-sm transition-colors ${isChecked ? 'bg-yellow-50/50' : 'hover:bg-gray-50'}`}
                    >
                      <div className={isChecked ? 'text-yellow-600' : 'text-gray-300'}>
                        {isChecked ? <CheckSquare size={10} /> : <Square size={10} />}
                      </div>
                      <span className={`text-[8px] font-bold uppercase truncate ${isChecked ? 'text-yellow-800' : 'text-gray-600'}`}>{opt}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const DeParaVisualizer = ({ oldValue, newValue, labelFormatter }: any) => {
    const isChanged = oldValue !== newValue;
    if (!isChanged) return null;
    const formattedOld = labelFormatter ? labelFormatter(oldValue) : oldValue;
    const formattedNew = labelFormatter ? labelFormatter(newValue) : newValue;
    return (
      <div className="flex items-center gap-1 mt-0.5 animate-in fade-in slide-in-from-top-1">
        <span className="text-[7px] font-bold text-gray-400 line-through truncate max-w-[80px]">{formattedOld}</span>
        <ArrowRight size={7} className="text-gray-300" />
        <span className="text-[8px] font-black text-[#F44C00] truncate max-w-[80px]">{formattedNew}</span>
      </div>
    );
  };

  return (
    <div className="space-y-2 animate-in fade-in duration-500 pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
            <ReceiptText className="text-[#F44C00]" size={16} /> Lançamentos
          </h2>
          <p className="text-gray-500 text-[7px] font-bold uppercase tracking-widest leading-none">Gestão de Dados SAP • Raiz Educação</p>
        </div>
        <div className="flex items-center gap-1.5">
           {/* Botão Voltar para DRE - só aparece quando há filtros de drill-down */}
           {externalFilters && onBackToDRE && (
             <button
               onClick={onBackToDRE}
               className="flex items-center gap-1 px-2 py-1.5 rounded-none font-black text-[8px] uppercase tracking-widest transition-all border bg-[#152e55] text-white border-[#152e55] hover:bg-[#1B75BB]"
             >
               <ArrowLeft size={10} />
               <TableProperties size={10} />
               Voltar para DRE
             </button>
           )}
           <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1 px-2 py-1.5 rounded-none font-black text-[8px] uppercase tracking-widest transition-all border ${showFilters ? 'bg-[#1B75BB] text-white border-[#1B75BB]' : 'bg-white text-[#1B75BB] border-[#1B75BB]'}`}>
             <Filter size={10}/> {showFilters ? 'Ocultar Filtros' : 'Filtrar'}
             {activeFilterCount > 0 && (
               <span className="ml-1 px-1.5 py-0.5 bg-[#F44C00] text-white rounded-full text-[8px] font-black">
                 {activeFilterCount}
               </span>
             )}
           </button>
           <button onClick={handleExportExcel} className="flex items-center gap-1 px-2 py-1.5 rounded-none font-black text-[8px] uppercase border bg-[#1B75BB] text-white border-[#1B75BB] hover:bg-[#152e55]">
             <Download size={10} /> Exportar Tudo
           </button>
        </div>
      </header>

      {/* Abas de Cenário */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('real')}
          className={`px-3 py-1.5 font-black text-[10px] uppercase tracking-wide transition-all relative ${
            activeTab === 'real'
              ? 'text-[#1B75BB] border-b-2 border-[#1B75BB] -mb-[1px]'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Real
          <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${
            activeTab === 'real' ? 'bg-[#1B75BB] text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {tabCounts.real.toLocaleString()}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('orcamento')}
          className={`px-3 py-1.5 font-black text-[10px] uppercase tracking-wide transition-all relative ${
            activeTab === 'orcamento'
              ? 'text-[#F44C00] border-b-2 border-[#F44C00] -mb-[1px]'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Orçamento
          <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${
            activeTab === 'orcamento' ? 'bg-[#F44C00] text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {tabCounts.orcamento.toLocaleString()}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('comparativo')}
          className={`px-3 py-1.5 font-black text-[10px] uppercase tracking-wide transition-all relative ${
            activeTab === 'comparativo'
              ? 'text-emerald-600 border-b-2 border-emerald-600 -mb-[1px]'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Ano Anterior
          <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${
            activeTab === 'comparativo' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {tabCounts.comparativo.toLocaleString()}
          </span>
        </button>
      </div>

      {showFilters && (
        <div ref={filterContainerRef} className="bg-white p-3 border border-gray-200 shadow-sm animate-in slide-in-from-top-1 duration-300 rounded-none">
           <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                 <div className="bg-blue-50 p-1.5 rounded-none text-[#1B75BB]"><Filter size={12}/></div>
                 <h3 className="text-[9px] font-black text-gray-900 uppercase tracking-tighter">Painel de Refinamento Dinâmico</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSearchData()}
                  disabled={isSearching}
                  className="flex items-center gap-2 px-3 py-2 bg-[#1B75BB] hover:bg-[#152e55] text-white rounded-xl text-xs font-black uppercase tracking-wide transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search size={14} />
                      Buscar Dados
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowSearchAllModal(true)}
                  disabled={isSearching}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wide transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Buscar todos os dados (pode demorar)"
                >
                  <Download size={14} />
                  Buscar Tudo
                </button>
                <button onClick={handleClearAllFilters} className="flex items-center gap-2 px-3 py-2 bg-[#F44C00] hover:bg-[#d44200] text-white rounded-xl text-xs font-black uppercase tracking-wide transition-all shadow-sm active:scale-95">
                  <FilterX size={14} />
                  Limpar Filtros
                </button>
              </div>
           </div>
           <div className="space-y-1.5">
              {/* Primeira linha de filtros */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-10 gap-1.5">
                <div className="col-span-2 space-y-0.5">
                  <label className="text-[6.5px] font-black text-gray-400 uppercase tracking-widest leading-none">Período (Mês-Ano)</label>
                  <div className="flex gap-1">
                    <div className={`border p-1 rounded-none text-[8px] flex items-center gap-1 flex-1 ${isFilterActive('monthFrom') ? 'bg-yellow-50 border-yellow-400' : 'bg-gray-50 border-gray-100'}`}>
                      <span className="text-[7px] text-gray-400">De:</span>
                      <input
                        type="month"
                        value={colFilters.monthFrom}
                        onChange={e => setColFilters({...colFilters, monthFrom: e.target.value})}
                        className="bg-transparent outline-none text-[8px] font-bold flex-1 min-w-0"
                        placeholder="MM-AAAA"
                      />
                    </div>
                    <div className={`border p-1 rounded-none text-[8px] flex items-center gap-1 flex-1 ${isFilterActive('monthTo') ? 'bg-yellow-50 border-yellow-400' : 'bg-gray-50 border-gray-100'}`}>
                      <span className="text-[7px] text-gray-400">Até:</span>
                      <input
                        type="month"
                        value={colFilters.monthTo}
                        onChange={e => setColFilters({...colFilters, monthTo: e.target.value})}
                        className="bg-transparent outline-none text-[8px] font-bold flex-1 min-w-0"
                        placeholder="MM-AAAA"
                      />
                    </div>
                  </div>
                </div>
                <MultiSelectFilter id="tag01" label="Tag01" options={dynamicOptions.tag01s} selected={colFilters.tag01} active={isFilterActive('tag01')} />
                <MultiSelectFilter id="tag02" label="Tag02" options={dynamicOptions.tag02s} selected={colFilters.tag02} active={isFilterActive('tag02')} />
                <MultiSelectFilter id="tag03" label="Tag03" options={dynamicOptions.tag03s} selected={colFilters.tag03} active={isFilterActive('tag03')} />
                <MultiSelectFilter id="category" label="Conta" options={dynamicOptions.categories} selected={colFilters.category} active={isFilterActive('category')} />
                <MultiSelectFilter id="marca" label="Marca" options={dynamicOptions.marcas} selected={colFilters.marca} active={isFilterActive('marca')} />
                <MultiSelectFilter id="filial" label="Unidade" options={dynamicOptions.filiais} selected={colFilters.filial} active={isFilterActive('filial')} />
              </div>

              {/* Segunda linha de filtros */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-1.5">
                <FilterTextInput label="Ticket" id="ticket" value={colFilters.ticket} colFilters={colFilters} setColFilters={setColFilters} debouncedSetFilter={debouncedSetFilter} />
                <MultiSelectFilter id="chave_id" label="Chave ID" options={dynamicOptions.chave_id} selected={colFilters.chave_id} active={isFilterActive('chave_id')} />
                <FilterTextInput label="Fornecedor" id="vendor" value={colFilters.vendor} colFilters={colFilters} setColFilters={setColFilters} className="xl:col-span-2" debouncedSetFilter={debouncedSetFilter} />
                <FilterTextInput label="Descrição" id="description" value={colFilters.description} colFilters={colFilters} setColFilters={setColFilters} className="xl:col-span-3" debouncedSetFilter={debouncedSetFilter} />
                <FilterTextInput label="Valor" id="amount" value={colFilters.amount} colFilters={colFilters} setColFilters={setColFilters} debouncedSetFilter={debouncedSetFilter} />
                <MultiSelectFilter id="recurring" label="Recorrência" options={dynamicOptions.recurrings} selected={colFilters.recurring} active={isFilterActive('recurring')} />
              </div>
           </div>
        </div>
      )}

      {/* Indicador de Progresso "Buscar Tudo" */}
      {isSearching && searchAllProgress.total > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 mb-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              <div>
                <p className="text-sm font-black text-emerald-900">
                  Carregando todos os dados...
                </p>
                <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                  Página {searchAllProgress.current} de {searchAllProgress.total} • {searchAllProgress.loaded.toLocaleString()} registros carregados
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-2xl font-black text-emerald-600">
                  {Math.round((searchAllProgress.current / searchAllProgress.total) * 100)}%
                </p>
              </div>
              <button
                onClick={() => {
                  cancelSearchAllRef.current = true;
                  console.log('🛑 Cancelamento solicitado pelo usuário...');
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-black uppercase transition-all shadow-sm active:scale-95 flex items-center gap-2"
              >
                <X size={14} />
                Cancelar
              </button>
            </div>
          </div>
          <div className="w-full bg-emerald-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-full transition-all duration-300"
              style={{ width: `${(searchAllProgress.current / searchAllProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Controles de Paginação */}
      {filteredAndSorted.length > 0 && (
        <div className="bg-white border border-gray-200 p-2 flex items-center justify-between shadow-sm">
          {/* Contador à esquerda */}
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold text-gray-600">
              <span className="text-[#1B75BB] font-black">{((currentPage - 1) * RECORDS_PER_PAGE) + 1}</span>-<span className="text-[#1B75BB] font-black">{Math.min(currentPage * RECORDS_PER_PAGE, filteredAndSorted.length)}</span> de{' '}
              <span className="text-[#1B75BB] font-black">{filteredAndSorted.length.toLocaleString()}</span>
            </p>
          </div>

          {/* Controles de navegação à direita - sempre visível */}
          <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 bg-gray-100 text-gray-600 font-black text-[10px] uppercase rounded-none hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                ←
              </button>

              <div className="flex gap-1">
                {currentPage > 2 && (
                  <>
                    <button onClick={() => setCurrentPage(1)} className="px-2 py-1 text-[10px] font-bold text-gray-600 hover:bg-gray-100 rounded border border-gray-200">1</button>
                    {currentPage > 3 && <span className="px-2 py-1 text-[10px] text-gray-400">...</span>}
                  </>
                )}

                {currentPage > 1 && (
                  <button onClick={() => setCurrentPage(currentPage - 1)} className="px-2 py-1 text-[10px] font-bold text-gray-600 hover:bg-gray-100 rounded border border-gray-200">
                    {currentPage - 1}
                  </button>
                )}

                <button className="px-2 py-1 text-[10px] font-black bg-[#1B75BB] text-white rounded border border-[#1B75BB]">
                  {currentPage}
                </button>

                {currentPage < totalPages && (
                  <button onClick={() => setCurrentPage(currentPage + 1)} className="px-2 py-1 text-[10px] font-bold text-gray-600 hover:bg-gray-100 rounded border border-gray-200">
                    {currentPage + 1}
                  </button>
                )}

                {currentPage < totalPages - 1 && (
                  <>
                    {currentPage < totalPages - 2 && <span className="px-2 py-1 text-[10px] text-gray-400">...</span>}
                    <button onClick={() => setCurrentPage(totalPages)} className="px-2 py-1 text-[10px] font-bold text-gray-600 hover:bg-gray-100 rounded border border-gray-200">
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 bg-gray-100 text-gray-600 font-black text-[10px] uppercase rounded-none hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                →
              </button>

              <span className="text-[10px] text-gray-500 font-bold ml-2">
                Pág {currentPage}/{totalPages}
              </span>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 overflow-hidden shadow-sm rounded-none">
        <div ref={parentRef} className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-420px)] relative">
          <table className="w-full border-separate border-spacing-0 text-left table-fixed min-w-[1200px]">
            <thead>
              <tr className="whitespace-nowrap">
                <HeaderCell label="Cen" sortKey="scenario" config={sortConfig} setConfig={setSortConfig} className="w-[50px]" />
                <HeaderCell label="Data" sortKey="date" config={sortConfig} setConfig={setSortConfig} className="w-[65px]" />
                <HeaderCell label="Tag01" sortKey="tag01" config={sortConfig} setConfig={setSortConfig} className="w-[75px]" />
                <HeaderCell label="Tag02" sortKey="tag02" config={sortConfig} setConfig={setSortConfig} className="w-[85px]" />
                <HeaderCell label="Tag03" sortKey="tag03" config={sortConfig} setConfig={setSortConfig} className="w-[85px]" />
                <HeaderCell label="Conta" sortKey="category" config={sortConfig} setConfig={setSortConfig} className="w-[105px]" />
                <HeaderCell label="Mar" sortKey="marca" config={sortConfig} setConfig={setSortConfig} className="w-[45px]" />
                <HeaderCell label="Filial" sortKey="filial" config={sortConfig} setConfig={setSortConfig} className="w-[100px]" />
                <HeaderCell label="Tick" sortKey="ticket" config={sortConfig} setConfig={setSortConfig} className="w-[60px]" />
                <HeaderCell label="Chave ID" sortKey="chave_id" config={sortConfig} setConfig={setSortConfig} className="w-[80px]" />
                <HeaderCell label="Fornecedor" sortKey="vendor" config={sortConfig} setConfig={setSortConfig} className="w-[120px]" />
                <HeaderCell label="Descrição" sortKey="description" config={sortConfig} setConfig={setSortConfig} className="w-[180px]" />
                <HeaderCell label="Valor" sortKey="amount" config={sortConfig} setConfig={setSortConfig} align="right" className="w-[95px]" />
                <HeaderCell label="Status" sortKey="status" config={sortConfig} setConfig={setSortConfig} align="center" className="w-[70px]" />
                <th className="sticky top-0 z-[60] bg-[#1B75BB] text-white text-center w-[65px] border-b border-white/10 px-1 py-1.5 uppercase text-[8px] font-black">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-20">
                    <div className="text-center">
                      {!hasSearchedTransactions ? (
                        <>
                          <Search size={48} className="mx-auto text-[#1B75BB] mb-4" />
                          <p className="text-gray-700 font-black text-base mb-2">Configure os filtros e clique em "Buscar Dados"</p>
                          <p className="text-gray-400 text-xs mt-2">Aplique filtros de período, marca, filial ou outros campos para buscar os lançamentos</p>
                          <button
                            onClick={() => handleSearchData()}
                            disabled={isSearching}
                            className="mt-4 px-6 py-3 bg-[#1B75BB] text-white rounded-xl text-sm font-black uppercase hover:bg-[#152e55] transition-all shadow-lg disabled:opacity-50"
                          >
                            {isSearching ? 'Buscando...' : 'Buscar Dados'}
                          </button>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                          <p className="text-gray-500 font-bold text-sm">Nenhum lançamento encontrado</p>
                          <p className="text-gray-400 text-xs mt-2">Ajuste os filtros e busque novamente</p>
                          <div className="flex gap-2 justify-center mt-4">
                            {isAnyFilterActive && (
                              <button
                                onClick={handleClearAllFilters}
                                className="px-4 py-2 bg-[#F44C00] text-white rounded-xl text-xs font-black uppercase hover:bg-[#d44200] transition-all"
                              >
                                Limpar Filtros
                              </button>
                            )}
                            <button
                              onClick={() => handleSearchData()}
                              disabled={isSearching}
                              className="px-4 py-2 bg-[#1B75BB] text-white rounded-xl text-xs font-black uppercase hover:bg-[#152e55] transition-all disabled:opacity-50"
                            >
                              Buscar Novamente
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : filteredAndSorted.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-blue-50/50 transition-colors border-b border-gray-50"
                  >
                    <td className="px-2 py-1 border-r border-gray-100 text-center whitespace-nowrap overflow-hidden"><span className="px-1.5 py-0.5 rounded-none text-[8px] font-black uppercase border bg-blue-50 text-blue-700">{t.scenario || 'Real'}</span></td>
                    <td className="px-2 py-1 text-[8px] font-mono text-gray-500 border-r border-gray-100 whitespace-nowrap overflow-hidden">{formatDateToMMAAAA(t.date)}</td>
                    <td className="px-2 py-1 text-[8px] font-bold text-gray-600 border-r border-gray-100 uppercase truncate">{t.tag01 || '-'}</td>
                    <td className="px-2 py-1 text-[8px] font-bold text-gray-600 border-r border-gray-100 uppercase truncate">{t.tag02 || '-'}</td>
                    <td className="px-2 py-1 text-[8px] font-bold text-gray-600 border-r border-gray-100 uppercase truncate">{t.tag03 || '-'}</td>
                    <td className="px-2 py-1 text-[8px] font-black text-[#F44C00] border-r border-gray-100 uppercase truncate">{t.category}</td>
                    <td className="px-2 py-1 text-[8px] font-black text-[#1B75BB] border-r border-gray-100 uppercase truncate">{t.marca || 'SAP'}</td>
                    <td className="px-2 py-1 text-[8px] font-bold text-gray-600 border-r border-gray-100 uppercase truncate">{t.filial}</td>
                    <td className="px-2 py-1 text-[8px] font-mono border-r border-gray-100 truncate">
                      {t.ticket ? (
                        <a href={`https://raizeducacao.zeev.it/report/main/?inpsearch=${t.ticket}`} target="_blank" rel="noopener noreferrer" className="text-[#1B75BB] font-black flex items-center gap-0.5 hover:underline active:scale-95">
                          {t.ticket} <ExternalLink size={8} />
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-2 py-1 text-[8px] font-black text-[#F44C00] border-r border-gray-100 uppercase truncate">{t.chave_id || '-'}</td>
                    <td className="px-2 py-1 text-[8px] font-bold text-gray-600 border-r border-gray-100 uppercase truncate" title={t.vendor}>{t.vendor || '-'}</td>
                    <td className="px-2 py-1 text-[8px] font-bold text-gray-600 border-r border-gray-100 uppercase truncate" title={t.description}>{t.description}</td>
                    <td className={`px-2 py-1 text-[8px] font-mono font-black text-right border-r border-gray-100 ${t.type === 'REVENUE' ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 py-1 text-center border-r border-gray-100">
                      <span className={`px-2 py-0.5 rounded-none text-[8px] font-black uppercase border ${
                        t.status === 'Pendente' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                        t.status === 'Ajustado' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        t.status === 'Rateado' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                        t.status === 'Excluído' ? 'bg-red-50 text-red-600 border-red-200' :
                        'bg-gray-50 text-gray-400 border-gray-200'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                         <button onClick={() => setEditingTransaction(t)} className="p-1.5 text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-100 active:scale-90 transition-all"><Edit3 size={12}/></button>
                         <button onClick={() => setRateioTransaction(t)} className="p-1.5 text-[#F44C00] bg-amber-50 hover:bg-amber-100 border border-amber-100 active:scale-90 transition-all"><GitFork size={12}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {isLoadingMore && (
            <div className="sticky bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-gray-200 py-4">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="animate-spin text-[#1B75BB]" size={20} />
                <span className="text-sm font-bold text-gray-700">Carregando mais registros...</span>
              </div>
            </div>
          )}

          <table className="w-full border-separate border-spacing-0 text-left table-fixed min-w-[1200px]">
            <tfoot className="sticky bottom-0 z-50 bg-[#152e55] text-white">
              <tr className="h-10 border-t border-white/20 whitespace-nowrap">
                <td colSpan={11} className="px-4 text-[10px] font-black uppercase tracking-widest bg-[#152e55]">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                       <ListOrdered size={14} className="text-[#4AC8F4]" />
                       <span>ITENS: <span className="text-[#4AC8F4]">{filteredAndSorted.length}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                       <Calculator size={14} className="text-[#4AC8F4]" />
                       <span>TOTAL: <span className="text-[#4AC8F4]">R$ {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                    </div>
                  </div>
                </td>
                <td colSpan={3} className="bg-[#152e55]"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* --- MODAL DE SOLICITAÇÃO DE AJUSTE --- */}
      {editingTransaction && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden rounded-none">
            <div className="bg-[#F44C00] p-4 text-white flex justify-between items-center shrink-0">
               <div className="flex items-center gap-2">
                 <Edit3 size={18} />
                 <h3 className="text-sm font-black uppercase">Solicitar Ajuste Operacional: {editingTransaction.ticket || 'AVULSO'}</h3>
               </div>
               <button onClick={() => setEditingTransaction(null)} className="p-1 hover:bg-white/10 rounded"><X size={20} /></button>
            </div>
            <div className="flex-1 flex overflow-hidden">
              <div className="w-1/3 bg-gray-50 p-6 border-r border-gray-100 overflow-y-auto space-y-4">
                 <div className="bg-white p-4 border border-gray-100 shadow-sm space-y-2">
                    <p className="text-[8px] font-black text-gray-400 uppercase">Contexto do Lançamento</p>
                    <p className="text-[10px] font-bold text-gray-900 leading-tight">{editingTransaction.description}</p>
                    <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                       <span className="text-[8px] font-black text-gray-400 uppercase">Valor Atual</span>
                       <span className="text-sm font-black text-[#F44C00]">R$ {editingTransaction.amount.toLocaleString()}</span>
                    </div>
                 </div>
              </div>
              <div className="flex-1 p-8 overflow-y-auto bg-white">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <div className="flex justify-between items-end">
                        <label className="text-[8px] font-black text-gray-500 uppercase">Nova Competência</label>
                        <DeParaVisualizer oldValue={editingTransaction.date} newValue={editForm.date} labelFormatter={formatDateToMMAAAA} />
                      </div>
                      <input type="month" value={editForm.date.substring(0, 7)} onChange={e => setEditForm({...editForm, date: `${e.target.value}-01`})} className="w-full border border-gray-200 p-2 text-[10px] font-black outline-none focus:border-[#F44C00] bg-gray-50/30" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-end">
                        <label className="text-[8px] font-black text-gray-500 uppercase">Nova Unidade</label>
                        <DeParaVisualizer oldValue={editingTransaction.filial} newValue={editForm.filial} />
                      </div>
                      <select value={editForm.filial} onChange={e => setEditForm({...editForm, filial: e.target.value})} className="w-full border border-gray-200 p-2 text-[10px] font-black outline-none focus:border-[#F44C00] bg-gray-50/30">
                        {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-end">
                        <label className="text-[8px] font-black text-gray-500 uppercase">Nova Marca</label>
                        <DeParaVisualizer oldValue={editingTransaction.marca} newValue={editForm.marca} />
                      </div>
                      <select value={editForm.marca} onChange={e => setEditForm({...editForm, marca: e.target.value})} className="w-full border border-gray-200 p-2 text-[10px] font-black outline-none focus:border-[#F44C00] bg-gray-50/30">
                        {ALL_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-end">
                        <label className="text-[8px] font-black text-gray-500 uppercase">Nova Conta Contábil</label>
                        <DeParaVisualizer oldValue={editingTransaction.category} newValue={editForm.category} />
                      </div>
                      <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} className="w-full border border-gray-200 p-2 text-[10px] font-black outline-none focus:border-[#F44C00] bg-gray-50/30">
                        {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-end">
                        <label className="text-[8px] font-black text-gray-500 uppercase">Status de Recorrência</label>
                        <DeParaVisualizer oldValue={editingTransaction.recurring || 'Sim'} newValue={editForm.recurring} />
                      </div>
                      <select value={editForm.recurring} onChange={e => setEditForm({...editForm, recurring: e.target.value})} className="w-full border border-gray-200 p-2 text-[10px] font-black outline-none focus:border-[#F44C00] bg-gray-50/30">
                        <option value="Sim">Sim</option>
                        <option value="Não">Não</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-300 mb-1">Chave ID</label>
                      <input
                        type="text"
                        value={editForm.chave_id || ''}
                        onChange={e => setEditForm({...editForm, chave_id: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        disabled={true}
                      />
                    </div>
                    <div className="col-span-2 space-y-1 pt-4">
                      <label className="text-[8px] font-black text-[#F44C00] uppercase">Justificativa da Solicitação (Obrigatório)</label>
                      <textarea value={editForm.justification} onChange={e => setEditForm({...editForm, justification: e.target.value})} placeholder="Explique o motivo deste ajuste para aprovação da diretoria..." className="w-full border border-gray-200 p-3 text-[10px] font-bold h-32 outline-none focus:border-[#F44C00] bg-gray-50/10" />
                    </div>
                 </div>
                 <div className="mt-8 flex gap-4">
                    <button onClick={() => setEditingTransaction(null)} className="flex-1 py-3 bg-gray-100 text-gray-500 font-black text-[10px] uppercase">Cancelar</button>
                    <button onClick={handleSubmitAjuste} disabled={!editForm.justification.trim()} className="flex-[2] py-3 bg-[#F44C00] text-white font-black text-[10px] uppercase shadow-lg disabled:opacity-50">Enviar p/ Aprovação</button>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE RATEIO ESTRUTURAL --- */}
      {rateioTransaction && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden rounded-none">
            <div className="bg-[#1B75BB] p-4 text-white flex justify-between items-center shrink-0">
               <div className="flex items-center gap-2">
                 <Split size={18} />
                 <h3 className="text-sm font-black uppercase">Rateio Estrutural: {rateioTransaction.ticket || 'AVULSO'}</h3>
               </div>
               <button onClick={() => setRateioTransaction(null)} className="p-1 hover:bg-white/10 rounded"><X size={20} /></button>
            </div>
            <div className="flex-1 flex overflow-hidden">
               <div className="w-1/4 bg-gray-50 p-6 border-r border-gray-100 space-y-4">
                  <div className="bg-white p-4 border border-gray-100 shadow-sm">
                    <p className="text-[8px] font-black text-gray-400 uppercase">Montante Original</p>
                    <p className="text-xl font-black text-gray-900">R$ {rateioTransaction.amount.toLocaleString()}</p>
                  </div>
                  <div className={`p-4 border-2 transition-all ${isRateioFullyAllocated ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-rose-200'}`}>
                    <p className={`text-[8px] font-black uppercase mb-1 ${isRateioFullyAllocated ? 'text-emerald-700' : 'text-rose-700'}`}>Status do Saldo</p>
                    {isRateioFullyAllocated ? (
                      <div className="flex items-center gap-1 text-emerald-600">
                         <CheckCircle2 size={14} />
                         <span className="text-[10px] font-black">100% DISTRIBUÍDO</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                         <p className="text-lg font-black text-rose-600">R$ {Math.abs(remainingRateio).toLocaleString()}</p>
                         <p className="text-[7px] font-black text-rose-400 uppercase">Pendente</p>
                      </div>
                    )}
                  </div>
               </div>
               <div className="flex-1 p-6 bg-white overflow-y-auto">
                  <div className="space-y-2">
                    {rateioParts.map((part) => (
                      <div key={part.id} className="grid grid-cols-12 gap-2 bg-gray-50 p-2 border border-gray-100 items-center">
                         <div className="col-span-3">
                           <select value={part.filial} onChange={e => updateRateioPart(part.id, { filial: e.target.value })} className="w-full bg-white border border-gray-100 p-1.5 text-[8px] font-black outline-none focus:border-[#1B75BB]">
                             {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                           </select>
                         </div>
                         <div className="col-span-3">
                            <input type="month" value={part.date.substring(0, 7)} onChange={e => updateRateioPart(part.id, { date: `${e.target.value}-01` })} className="w-full bg-white border border-gray-100 p-1.5 text-[8px] font-black outline-none focus:border-[#1B75BB]" />
                         </div>
                         <div className="col-span-3 relative">
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[7px] text-gray-300 font-black">R$</span>
                            <input type="number" value={part.amount} onChange={e => {
                              const val = Number(e.target.value);
                              updateRateioPart(part.id, { amount: val, percent: Number(((val / rateioTransaction.amount) * 100).toFixed(2)) });
                            }} className="w-full bg-white border border-gray-100 p-1.5 pl-5 text-[8px] font-black outline-none focus:border-[#1B75BB]" />
                         </div>
                         <div className="col-span-2 relative">
                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[7px] text-gray-300 font-black">%</span>
                            <input type="number" value={part.percent} onChange={e => {
                              const perc = Number(e.target.value);
                              updateRateioPart(part.id, { percent: perc, amount: Number(((rateioTransaction.amount * perc) / 100).toFixed(2)) });
                            }} className="w-full bg-white border border-gray-100 p-1.5 text-[8px] font-black outline-none focus:border-[#1B75BB]" />
                         </div>
                         <div className="col-span-1 flex justify-center">
                            <button onClick={() => setRateioParts(prev => prev.filter(p => p.id !== part.id))} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"><Trash2 size={12}/></button>
                         </div>
                      </div>
                    ))}
                    <button onClick={() => setRateioParts([...rateioParts, { id: `p-${Date.now()}`, filial: BRANCHES[0], marca: 'SAP', amount: 0, percent: 0, date: rateioTransaction.date, category: rateioTransaction.category }])} className="w-full py-2.5 border-2 border-dashed border-gray-100 text-gray-300 hover:text-[#1B75BB] hover:border-[#1B75BB]/30 transition-all font-black text-[8px] uppercase flex items-center justify-center gap-2">
                      <PlusCircle size={12} /> Adicionar Linha
                    </button>
                    <div className="pt-6 space-y-2">
                       <label className="text-[8px] font-black text-blue-700 uppercase">Motivo do Rateio (Obrigatório)</label>
                       <textarea value={rateioJustification} onChange={e => setRateioJustification(e.target.value)} placeholder="Descreva o critério utilizado para este rateio..." className="w-full border border-gray-100 p-3 text-[10px] font-bold h-24 outline-none focus:border-[#1B75BB] bg-gray-50/20" />
                    </div>
                  </div>
                  <div className="mt-8 flex gap-4">
                    <button onClick={() => setRateioTransaction(null)} className="flex-1 py-3 bg-gray-100 text-gray-500 font-black text-[10px] uppercase">Cancelar</button>
                    <button onClick={handleSubmitRateio} disabled={!isRateioFullyAllocated || !rateioJustification.trim()} className="flex-[2] py-3 bg-[#1B75BB] text-white font-black text-[10px] uppercase shadow-lg disabled:opacity-50">Confirmar Rateio</button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE CONFIRMAÇÃO "BUSCAR TUDO" --- */}
      {showSearchAllModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-gray-900 mb-2">
                  ⚠️ Buscar Todos os Dados?
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <p className="font-bold">
                    Esta ação vai buscar <span className="text-amber-600 font-black">TODOS os registros</span> do banco de dados que correspondem aos filtros aplicados.
                  </p>
                  <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded">
                    <p className="text-xs font-bold text-amber-800">
                      <strong>⚠️ ATENÇÃO:</strong> Se você não aplicou filtros de período, marca ou filial, a busca pode retornar <strong>+100 mil registros</strong> e causar lentidão ou travamento!
                    </p>
                  </div>
                  <p className="text-xs font-semibold">
                    <strong>Recomendação:</strong> Aplique filtros (período, marca, filial) antes de buscar todos os dados para melhor performance.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded text-xs">
                    <p className="font-bold text-blue-900 mb-1">Filtros atualmente aplicados:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                      {colFilters.monthFrom && <li>Período: {colFilters.monthFrom} a {colFilters.monthTo || 'hoje'}</li>}
                      {colFilters.marca && colFilters.marca.length > 0 && <li>Marca: {colFilters.marca.join(', ')}</li>}
                      {colFilters.filial && colFilters.filial.length > 0 && <li>Filial: {colFilters.filial.join(', ')}</li>}
                      {!colFilters.monthFrom && (!colFilters.marca || colFilters.marca.length === 0) && (!colFilters.filial || colFilters.filial.length === 0) && (
                        <li className="text-amber-600 font-black">⚠️ Nenhum filtro aplicado!</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowSearchAllModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSearchAll}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-black text-sm hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Confirmar Busca
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const HeaderCell = ({ label, sortKey, config, setConfig, align = 'left', className = '' }: any) => {
  const isSorted = config.key === sortKey;
  return (
    <th 
      onClick={() => setConfig({ key: sortKey, direction: isSorted && config.direction === 'asc' ? 'desc' : 'asc' })} 
      className={`sticky top-0 z-[60] bg-[#1B75BB] text-white text-left border-b border-white/10 border-r border-white/20 px-2 py-2.5 cursor-pointer hover:bg-[#152e55] transition-colors whitespace-nowrap ${className}`}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        <span className="text-[8px] font-black uppercase tracking-tighter truncate leading-none">{label}</span>
      </div>
    </th>
  );
};

const FilterTextInput = ({ label, id, value, colFilters, setColFilters, className, debouncedSetFilter }: any) => (
  <div className={`space-y-0.5 ${className || ''}`}>
    <label className="text-[6.5px] font-black text-gray-400 uppercase tracking-widest leading-none">{label}</label>
    <div className={`border p-1 rounded-none text-[8px] font-black transition-all ${value ? 'bg-yellow-50 border-yellow-400 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
      <input
        type="text"
        placeholder={label}
        className="w-full bg-transparent outline-none uppercase"
        defaultValue={value}
        onChange={e => debouncedSetFilter ? debouncedSetFilter(id, e.target.value) : setColFilters({...colFilters, [id]: e.target.value})}
      />
    </div>
  </div>
);

const SummaryCard: React.FC<{
  label: string;
  value: number;
  color: 'emerald' | 'orange' | 'blue' | 'teal' | 'rose';
  icon: React.ReactNode;
  change?: number;
}> = ({ label, value, color, icon, change }) => {
  const colorClasses = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    teal: 'bg-teal-50 border-teal-200 text-teal-700',
    rose: 'bg-rose-50 border-rose-200 text-rose-700'
  };

  return (
    <div className={`border-2 rounded-lg p-2 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[7px] font-black uppercase tracking-widest opacity-70">{label}</span>
        <div className="scale-75">{icon}</div>
      </div>
      <p className="text-base font-black mb-0">
        R$ {Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
      </p>
      {change !== undefined && (
        <div className="flex items-center gap-0.5 text-[8px] font-bold">
          {change >= 0 ? <ArrowUpRight size={8} /> : <ArrowDownRight size={8} />}
          <span>{Math.abs(change).toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
};

export default TransactionsView;
