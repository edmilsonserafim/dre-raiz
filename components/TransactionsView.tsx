
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Transaction, TransactionType, TransactionStatus, ManualChange } from '../types';
import { BRANCHES, ALL_CATEGORIES, CATEGORIES } from '../constants';
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
  transactions,
  requestChange,
  fetchFromCSV,
  isSyncing: initialSyncing,
  externalFilters,
  clearGlobalFilters,
  externalActiveTab,
  onBackToDRE
}) => {
  const [showFilters, setShowFilters] = useState(true);
  const [isSyncing, setIsSyncing] = useState(initialSyncing);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [rateioTransaction, setRateioTransaction] = useState<Transaction | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'date', direction: 'desc' });

  // Abas e Paginação
  const [activeTab, setActiveTab] = useState<'real' | 'orcamento' | 'comparativo'>(() => {
    // Carregar aba ativa salva do sessionStorage
    const saved = sessionStorage.getItem('transactionsActiveTab');
    return saved ? JSON.parse(saved) : 'real';
  });
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
    const getOptions = (field: keyof Transaction) => {
      const filtered = transactions.filter(t => {
        return Object.entries(colFilters).every(([key, value]) => {
          if (key === field || !value || (Array.isArray(value) && value.length === 0)) return true;

          // Handle month range filters
          if (key === 'monthFrom' || key === 'monthTo') {
            const tDate = new Date(t.date);
            const tYearMonth = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`;

            if (key === 'monthFrom' && value) {
              const passes = tYearMonth >= value;
              if (!passes) return false;
            }
            if (key === 'monthTo' && value) {
              const passes = tYearMonth <= value;
              if (!passes) return false;
            }
            return true;
          }

          const tValue = String(t[key as keyof Transaction] || '');
          if (Array.isArray(value)) return value.includes(tValue);

          const filterValue = String(value).toLowerCase();
          return tValue.toLowerCase().includes(filterValue);
        });
      });
      return Array.from(new Set(filtered.map(t => t[field]).filter(Boolean))).sort() as string[];
    };

    return {
      marcas: getOptions('brand'),
      filiais: getOptions('branch'),
      tag01s: getOptions('tag01'),
      tag02s: getOptions('tag02'),
      tag03s: getOptions('tag03'),
      categories: getOptions('category'),
      chave_id: getOptions('chave_id'),
      recurrings: ['Sim', 'Não']
    };
  }, [transactions, colFilters]);

  const ALL_BRANDS = useMemo(() => Array.from(new Set(transactions.map(t => t.brand).filter(Boolean))).sort(), [transactions]);

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
        filial: editingTransaction.branch,
        marca: editingTransaction.brand || 'SAP',
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
          filial: rateioTransaction.branch,
          marca: rateioTransaction.brand || 'SAP',
          amount: Number((rateioTransaction.amount / 2).toFixed(2)),
          percent: 50,
          date: rateioTransaction.date,
          category: rateioTransaction.category
        },
        {
          id: `p2-${Date.now()}`,
          filial: rateioTransaction.branch,
          marca: rateioTransaction.brand || 'SAP',
          amount: Number((rateioTransaction.amount / 2).toFixed(2)),
          percent: 50,
          date: rateioTransaction.date,
          category: rateioTransaction.category
        }
      ]);
    }
  }, [rateioTransaction]);

  const filteredAndSorted = useMemo(() => {
    // Log de debug para drill-down
    if (colFilters.monthFrom || colFilters.monthTo) {
      console.log('🟢 Filtros de data aplicados:', {
        monthFrom: colFilters.monthFrom,
        monthTo: colFilters.monthTo,
        totalTransactions: transactions.length
      });
    }

    return transactions
      .filter(t => {
        // Filtrar por aba ativa (cenário) - case-insensitive e sem acentos
        const scenarioNormalized = (t.scenario || '').toLowerCase().trim()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove acentos

        // Usar a lógica da aba ativa
        if (activeTab === 'real') {
          // Aceita: "Real", "real", "REAL", etc.
          if (scenarioNormalized !== 'real') return false;
        }

        if (activeTab === 'orcamento') {
          // Aceita: "Orçamento", "Orcamento", "orcamento", "ORCAMENTO", etc.
          if (scenarioNormalized !== 'orcamento') return false;
        }

        if (activeTab === 'comparativo') {
          const currentYear = new Date().getFullYear();
          const tYear = new Date(t.date).getFullYear();
          if (tYear !== currentYear - 1) return false;
        }

        return Object.entries(colFilters).every(([key, value]) => {
          if (!value || (Array.isArray(value) && value.length === 0)) return true;

          // Handle month range filters
          if (key === 'monthFrom' || key === 'monthTo') {
            const tDate = new Date(t.date);
            const tYearMonth = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`;

            if (key === 'monthFrom' && value) {
              const passes = tYearMonth >= value;
              if (!passes) return false;
            }
            if (key === 'monthTo' && value) {
              const passes = tYearMonth <= value;
              if (!passes) return false;
            }
            return true;
          }

          const tValue = String(t[key as keyof Transaction] || '');
          if (Array.isArray(value)) return value.includes(tValue);

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

  // Paginação
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

  // Contadores por aba
  const tabCounts = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const counts = {
      real: 0,
      orcamento: 0,
      comparativo: 0
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
      if (scenarioNormalized === 'orcamento') counts.orcamento++;
      if (tYear === currentYear - 1) counts.comparativo++;
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
      t.scenario || 'Real', t.date, t.tag01 || '', t.tag02 || '', t.tag03 || '', 
      t.category, t.branch, t.brand || 'SAP', t.ticket || '', t.vendor || '', 
      t.description.replace(/;/g, ','), t.amount, t.recurring || 'Sim', t.id, t.status, t.justification || ''
    ]);
    const csvContent = [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Relatorio_SAP_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmitAjuste = () => {
    if (!editingTransaction || !editForm.justification.trim()) return;
    requestChange({
      transactionId: editingTransaction.id,
      description: `Ajuste: ${editForm.justification}`,
      type: 'MULTI',
      oldValue: JSON.stringify(editingTransaction),
      newValue: JSON.stringify(editForm)
    });
    setEditingTransaction(null);
  };

  const currentRateioSum = useMemo(() => rateioParts.reduce((sum, p) => sum + Number(p.amount), 0), [rateioParts]);
  const remainingRateio = useMemo(() => (rateioTransaction?.amount || 0) - currentRateioSum, [rateioTransaction, currentRateioSum]);
  const isRateioFullyAllocated = useMemo(() => Math.abs(remainingRateio) < 0.05, [remainingRateio]);

  const handleSubmitRateio = () => {
    if (!rateioTransaction || !isRateioFullyAllocated || !rateioJustification.trim()) return;
    const newTransactions: Transaction[] = rateioParts.filter(p => p.amount > 0).map((p, idx) => ({
      ...rateioTransaction,
      id: `${rateioTransaction.id}-R${idx}-${Date.now()}`,
      branch: p.filial,
      brand: p.marca,
      date: p.date,
      category: p.category,
      amount: Number(p.amount.toFixed(2)),
      type: CATEGORIES.FIXED_COST.includes(p.category) ? 'FIXED_COST' : CATEGORIES.VARIABLE_COST.includes(p.category) ? 'VARIABLE_COST' : 'REVENUE',
      status: 'Rateado'
    }));
    requestChange({
      transactionId: rateioTransaction.id,
      description: `Rateio: ${rateioJustification}`,
      type: 'RATEIO',
      oldValue: JSON.stringify(rateioTransaction),
      newValue: JSON.stringify({ transactions: newTransactions, justification: rateioJustification })
    });
    setRateioTransaction(null);
  };

  const updateRateioPart = (id: string, updates: Partial<RateioPart>) => {
    setRateioParts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleClearAllFilters = () => {
    setColFilters(initialFilters);
    if (clearGlobalFilters) clearGlobalFilters();
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
              <button onClick={handleClearAllFilters} className="flex items-center gap-2 px-3 py-2 bg-[#F44C00] hover:bg-[#d44200] text-white rounded-xl text-xs font-black uppercase tracking-wide transition-all shadow-sm active:scale-95">
                <FilterX size={14} />
                Limpar Filtros
              </button>
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

      {/* Controles de Paginação */}
      {filteredAndSorted.length > 0 && (
        <div className="bg-white border border-gray-200 p-1.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold text-gray-600">
              <span className="text-[#1B75BB] font-black">{((currentPage - 1) * RECORDS_PER_PAGE) + 1}</span>-<span className="text-[#1B75BB] font-black">{Math.min(currentPage * RECORDS_PER_PAGE, filteredAndSorted.length)}</span> de{' '}
              <span className="text-[#1B75BB] font-black">{filteredAndSorted.length.toLocaleString()}</span>
            </p>
            {filteredAndSorted.length > RECORDS_PER_PAGE && (
              <p className="text-[9px] text-gray-400">
                (Pág {currentPage}/{totalPages})
              </p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 font-black text-xs uppercase rounded-none hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                ← Anterior
              </button>

              <div className="flex gap-1">
                {currentPage > 2 && (
                  <>
                    <button onClick={() => setCurrentPage(1)} className="px-2 py-1 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded">1</button>
                    {currentPage > 3 && <span className="px-2 py-1 text-xs text-gray-400">...</span>}
                  </>
                )}

                {currentPage > 1 && (
                  <button onClick={() => setCurrentPage(currentPage - 1)} className="px-2 py-1 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded">
                    {currentPage - 1}
                  </button>
                )}

                <button className="px-2 py-1 text-xs font-black bg-[#1B75BB] text-white rounded">
                  {currentPage}
                </button>

                {currentPage < totalPages && (
                  <button onClick={() => setCurrentPage(currentPage + 1)} className="px-2 py-1 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded">
                    {currentPage + 1}
                  </button>
                )}

                {currentPage < totalPages - 1 && (
                  <>
                    {currentPage < totalPages - 2 && <span className="px-2 py-1 text-xs text-gray-400">...</span>}
                    <button onClick={() => setCurrentPage(totalPages)} className="px-2 py-1 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded">
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 font-black text-xs uppercase rounded-none hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Próxima →
              </button>
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-gray-200 overflow-hidden shadow-sm rounded-none">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-420px)] relative">
          <table className="w-full border-separate border-spacing-0 text-left table-fixed min-w-[1200px]">
            <thead>
              <tr className="whitespace-nowrap">
                <HeaderCell label="Cen" sortKey="scenario" config={sortConfig} setConfig={setSortConfig} className="w-[50px]" />
                <HeaderCell label="Data" sortKey="date" config={sortConfig} setConfig={setSortConfig} className="w-[65px]" />
                <HeaderCell label="Tag01" sortKey="tag01" config={sortConfig} setConfig={setSortConfig} className="w-[75px]" />
                <HeaderCell label="Tag02" sortKey="tag02" config={sortConfig} setConfig={setSortConfig} className="w-[85px]" />
                <HeaderCell label="Tag03" sortKey="tag03" config={sortConfig} setConfig={setSortConfig} className="w-[85px]" />
                <HeaderCell label="Conta" sortKey="category" config={sortConfig} setConfig={setSortConfig} className="w-[105px]" />
                <HeaderCell label="Mar" sortKey="brand" config={sortConfig} setConfig={setSortConfig} className="w-[45px]" />
                <HeaderCell label="Filial" sortKey="branch" config={sortConfig} setConfig={setSortConfig} className="w-[100px]" />
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
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-20">
                    <div className="text-center">
                      <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 font-bold text-sm">Nenhum lançamento encontrado</p>
                      <p className="text-gray-400 text-xs mt-2">Ajuste os filtros ou limpe-os para ver mais dados</p>
                      {isAnyFilterActive && (
                        <button
                          onClick={handleClearAllFilters}
                          className="mt-4 px-4 py-2 bg-[#F44C00] text-white rounded-xl text-xs font-black uppercase hover:bg-[#d44200] transition-all"
                        >
                          Limpar Filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : paginatedData.map(t => (
                <tr key={t.id} className="hover:bg-blue-50/50 transition-colors border-b border-gray-50 h-8">
                  <td className="px-2 py-1 border-r border-gray-100 text-center whitespace-nowrap overflow-hidden"><span className="px-1.5 py-0.5 rounded-none text-[8px] font-black uppercase border bg-blue-50 text-blue-700">{t.scenario || 'Real'}</span></td>
                  <td className="px-2 py-1 text-[8px] font-mono text-gray-500 border-r border-gray-100 whitespace-nowrap overflow-hidden">{formatDateToMMAAAA(t.date)}</td>
                  <td className="px-2 py-1 text-[8px] font-bold text-gray-600 border-r border-gray-100 uppercase truncate">{t.tag01 || '-'}</td>
                  <td className="px-2 py-1 text-[8px] font-bold text-gray-600 border-r border-gray-100 uppercase truncate">{t.tag02 || '-'}</td>
                  <td className="px-2 py-1 text-[8px] font-bold text-gray-600 border-r border-gray-100 uppercase truncate">{t.tag03 || '-'}</td>
                  <td className="px-2 py-1 text-[8px] font-black text-[#F44C00] border-r border-gray-100 uppercase truncate">{t.category}</td>
                  <td className="px-2 py-1 text-[8px] font-black text-[#1B75BB] border-r border-gray-100 uppercase truncate">{t.brand || 'SAP'}</td>
                  <td className="px-2 py-1 text-[8px] font-bold text-gray-600 border-r border-gray-100 uppercase truncate">{t.branch}</td>
                  <td className="px-2 py-1 text-[8px] font-mono border-r border-gray-100 truncate">
                    {t.ticket ? (
                      <a href={`https://raizeducacao.zeev.it/report/main/?inpsearch=${t.ticket}`} target="_blank" rel="noopener noreferrer" className="text-[#1B75BB] font-black flex items-center gap-0.5 hover:underline active:scale-95">
                        {t.ticket} <ExternalLink size={8} />
                      </a>
                    ) : '-'}
                  </td>
                  <td className="px-3 py-2 text-xs">{t.chave_id || '-'}</td>
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
                        <DeParaVisualizer oldValue={editingTransaction.branch} newValue={editForm.filial} />
                      </div>
                      <select value={editForm.filial} onChange={e => setEditForm({...editForm, filial: e.target.value})} className="w-full border border-gray-200 p-2 text-[10px] font-black outline-none focus:border-[#F44C00] bg-gray-50/30">
                        {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-end">
                        <label className="text-[8px] font-black text-gray-500 uppercase">Nova Marca</label>
                        <DeParaVisualizer oldValue={editingTransaction.brand} newValue={editForm.marca} />
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
