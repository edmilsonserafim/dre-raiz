
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Transaction, TransactionType, TransactionStatus, ManualChange } from '../types';
import { BRANCHES, ALL_CATEGORIES, CATEGORIES } from '../constants';
import * as XLSX from 'xlsx';
import { 
  Edit3, GitFork, X, Save, 
  ReceiptText, FilterX, 
  PlusCircle, ExternalLink, 
  Trash2, Filter, Loader2,
  Split, CheckCircle2, Upload, Download, ListOrdered, Calculator, ArrowRight,
  ChevronDown, Check, Square, CheckSquare, TrendingUp, History
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
}

type SortKey = keyof Transaction;
type SortDirection = 'asc' | 'desc';

interface RateioPart {
  id: string;
  amount: number;
  percent: number;
  branch: string;
  brand: string;
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
  clearGlobalFilters
}) => {
  const [showFilters, setShowFilters] = useState(true);
  const [isSyncing, setIsSyncing] = useState(initialSyncing);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [rateioTransaction, setRateioTransaction] = useState<Transaction | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'date', direction: 'desc' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filterContainerRef = useRef<HTMLDivElement>(null);

  const [rateioParts, setRateioParts] = useState<RateioPart[]>([]);
  const [editForm, setEditForm] = useState({ category: '', date: '', branch: '', brand: '', justification: '', amount: 0, recurring: 'Sim' });
  const [rateioJustification, setRateioJustification] = useState('');

  const initialFilters = {
    scenario: [] as string[],
    date: '',
    brand: [] as string[],
    branch: [] as string[],
    tag01: [] as string[],
    tag02: [] as string[],
    tag03: [] as string[],
    category: [] as string[],
    ticket: '',
    vendor: '',
    description: '',
    amount: ''
  };

  const [colFilters, setColFilters] = useState(initialFilters);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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

  const dynamicOptions = useMemo(() => {
    const getOptions = (field: keyof Transaction) => {
      const filtered = transactions.filter(t => {
        return Object.entries(colFilters).every(([key, value]) => {
          if (key === field || !value || (Array.isArray(value) && value.length === 0)) return true;
          if (key === 'date') return formatDateToMMAAAA(t.date).includes(value as string);
          
          const tValue = String(t[key as keyof Transaction] || '');
          if (Array.isArray(value)) return value.includes(tValue);
          
          const filterValue = String(value).toLowerCase();
          return tValue.toLowerCase().includes(filterValue);
        });
      });
      return Array.from(new Set(filtered.map(t => t[field]).filter(Boolean))).sort() as string[];
    };

    return {
      brands: getOptions('brand'),
      branches: getOptions('branch'),
      tag01s: getOptions('tag01'),
      tag02s: getOptions('tag02'),
      tag03s: getOptions('tag03'),
      categories: getOptions('category'),
      scenarios: getOptions('scenario')
    };
  }, [transactions, colFilters]);

  const ALL_BRANDS = useMemo(() => Array.from(new Set(transactions.map(t => t.brand).filter(Boolean))).sort(), [transactions]);

  useEffect(() => {
    if (externalFilters) {
      const formatted = { ...externalFilters };
      ['scenario', 'brand', 'branch', 'tag01', 'tag02', 'tag03', 'category'].forEach(key => {
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

  // Sincroniza estado do formulário de edição
  useEffect(() => {
    if (editingTransaction) {
      setEditForm({
        category: editingTransaction.category,
        date: editingTransaction.date,
        branch: editingTransaction.branch,
        brand: editingTransaction.brand || 'SAP',
        justification: '',
        amount: editingTransaction.amount,
        recurring: editingTransaction.recurring || 'Sim'
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
          branch: rateioTransaction.branch,
          brand: rateioTransaction.brand || 'SAP',
          amount: Number((rateioTransaction.amount / 2).toFixed(2)),
          percent: 50,
          date: rateioTransaction.date,
          category: rateioTransaction.category
        },
        {
          id: `p2-${Date.now()}`,
          branch: rateioTransaction.branch,
          brand: rateioTransaction.brand || 'SAP',
          amount: Number((rateioTransaction.amount / 2).toFixed(2)),
          percent: 50,
          date: rateioTransaction.date,
          category: rateioTransaction.category
        }
      ]);
    }
  }, [rateioTransaction]);

  const filteredAndSorted = useMemo(() => {
    return transactions
      .filter(t => {
        const fmtDate = formatDateToMMAAAA(t.date);
        return Object.entries(colFilters).every(([key, value]) => {
          if (!value || (Array.isArray(value) && value.length === 0)) return true;
          if (key === 'date') return fmtDate.includes(value as string);
          
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
  }, [transactions, colFilters, sortConfig]);

  const totalAmount = useMemo(() => {
    return filteredAndSorted.reduce((sum, t) => t.type === 'REVENUE' ? sum + t.amount : sum - t.amount, 0);
  }, [filteredAndSorted]);

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
      branch: p.branch,
      brand: p.brand,
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

  const MultiSelectFilter = ({ id, label, options, selected, active }: any) => {
    const isOpen = openDropdown === id;
    const summary = selected.length === 0 ? "Todos" : selected.length === 1 ? selected[0] : `${selected.length} Sel.`;
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
          <div className="absolute top-full left-0 z-[150] w-[180px] bg-white border border-gray-200 shadow-2xl mt-1 p-2 animate-in fade-in slide-in-from-top-1 duration-150" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-gray-50">
              <span className="text-[7px] font-black text-gray-400 uppercase">Filtro: {label}</span>
              <button onClick={() => setColFilters(prev => ({...prev, [id]: []}))} className="text-[7px] font-black text-rose-500 uppercase hover:underline">Limpar</button>
            </div>
            <div className="max-h-[200px] overflow-y-auto space-y-0.5 pr-1">
              {options.map((opt: string) => {
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
              })}
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
    <div className="space-y-3 animate-in fade-in duration-500 pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <ReceiptText className="text-[#F44C00]" size={18} /> Lançamentos
          </h2>
          <p className="text-gray-500 text-[8px] font-bold uppercase tracking-widest leading-none">Gestão de Dados SAP • Raiz Educação</p>
        </div>
        <div className="flex items-center gap-1.5">
           <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1 px-2 py-1.5 rounded-none font-black text-[8px] uppercase tracking-widest transition-all border ${showFilters ? 'bg-[#1B75BB] text-white border-[#1B75BB]' : 'bg-white text-[#1B75BB] border-[#1B75BB]'}`}><Filter size={10}/> {showFilters ? 'Ocultar Filtros' : 'Filtrar'}</button>
           <button onClick={() => fileInputRef.current?.click()} disabled={isSyncing} className="flex items-center gap-1 px-2 py-1.5 rounded-none font-black text-[8px] uppercase border bg-white text-[#7AC5BF] border-[#7AC5BF] hover:bg-teal-50">
             {isSyncing ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />} Importar
           </button>
           <button onClick={handleExportExcel} className="flex items-center gap-1 px-2 py-1.5 rounded-none font-black text-[8px] uppercase border bg-[#1B75BB] text-white border-[#1B75BB] hover:bg-[#152e55]">
             <Download size={10} /> Exportar
           </button>
        </div>
      </header>

      {showFilters && (
        <div ref={filterContainerRef} className="bg-white p-3 border border-gray-200 shadow-sm animate-in slide-in-from-top-1 duration-300 rounded-none">
           <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                 <div className="bg-blue-50 p-1.5 rounded-none text-[#1B75BB]"><Filter size={12}/></div>
                 <h3 className="text-[9px] font-black text-gray-900 uppercase tracking-tighter">Painel de Refinamento Dinâmico</h3>
              </div>
              <button onClick={handleClearAllFilters} className="text-[7.5px] font-black text-white bg-[#F44C00] hover:bg-[#d44200] px-3 py-1.5 rounded-none shadow-sm transition-all flex items-center gap-1 border border-[#F44C00] uppercase tracking-widest">
                <FilterX size={10} /> LIMPAR TODOS
              </button>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-[repeat(14,minmax(0,1fr))] gap-1.5">
              <MultiSelectFilter id="scenario" label="Cenário" options={dynamicOptions.scenarios} selected={colFilters.scenario} active={isFilterActive('scenario')} />
              <div className="space-y-0.5">
                <label className="text-[6.5px] font-black text-gray-400 uppercase tracking-widest leading-none">Data</label>
                <div className={`border p-1 rounded-none text-[8px] font-black transition-all ${isFilterActive('date') ? 'bg-yellow-50 border-yellow-400 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                  <input type="text" placeholder="MM-AAAA" className="w-full bg-transparent outline-none uppercase" value={colFilters.date} onChange={e => setColFilters({...colFilters, date: e.target.value})} />
                </div>
              </div>
              <MultiSelectFilter id="tag01" label="C.Custo" options={dynamicOptions.tag01s} selected={colFilters.tag01} active={isFilterActive('tag01')} />
              <MultiSelectFilter id="tag02" label="Segmento" options={dynamicOptions.tag02s} selected={colFilters.tag02} active={isFilterActive('tag02')} />
              <MultiSelectFilter id="tag03" label="Projeto" options={dynamicOptions.tag03s} selected={colFilters.tag03} active={isFilterActive('tag03')} />
              <MultiSelectFilter id="category" label="Conta" options={dynamicOptions.categories} selected={colFilters.category} active={isFilterActive('category')} />
              <MultiSelectFilter id="brand" label="Marca" options={dynamicOptions.brands} selected={colFilters.brand} active={isFilterActive('brand')} />
              <MultiSelectFilter id="branch" label="Unidade" options={dynamicOptions.branches} selected={colFilters.branch} active={isFilterActive('branch')} />
              <FilterTextInput label="Ticket" id="ticket" value={colFilters.ticket} colFilters={colFilters} setColFilters={setColFilters} />
              <FilterTextInput label="Fornecedor" id="vendor" value={colFilters.vendor} colFilters={colFilters} setColFilters={setColFilters} className="xl:col-span-2" />
              <FilterTextInput label="Desc" id="description" value={colFilters.description} colFilters={colFilters} setColFilters={setColFilters} className="xl:col-span-2" />
              <FilterTextInput label="Valor" id="amount" value={colFilters.amount} colFilters={colFilters} setColFilters={setColFilters} />
           </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 overflow-hidden shadow-sm rounded-none">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)] relative">
          <table className="w-full border-separate border-spacing-0 text-left table-fixed min-w-[1200px]">
            <thead>
              <tr className="whitespace-nowrap">
                <HeaderCell label="Cen" sortKey="scenario" config={sortConfig} setConfig={setSortConfig} className="w-[50px]" />
                <HeaderCell label="Data" sortKey="date" config={sortConfig} setConfig={setSortConfig} className="w-[65px]" />
                <HeaderCell label="CC" sortKey="tag01" config={sortConfig} setConfig={setSortConfig} className="w-[75px]" />
                <HeaderCell label="Seg" sortKey="tag02" config={sortConfig} setConfig={setSortConfig} className="w-[85px]" />
                <HeaderCell label="Proj" sortKey="tag03" config={sortConfig} setConfig={setSortConfig} className="w-[85px]" />
                <HeaderCell label="Conta" sortKey="category" config={sortConfig} setConfig={setSortConfig} className="w-[105px]" />
                <HeaderCell label="Mar" sortKey="brand" config={sortConfig} setConfig={setSortConfig} className="w-[45px]" />
                <HeaderCell label="Filial" sortKey="branch" config={sortConfig} setConfig={setSortConfig} className="w-[100px]" />
                <HeaderCell label="Tick" sortKey="ticket" config={sortConfig} setConfig={setSortConfig} className="w-[60px]" />
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
                  <td colSpan={14} className="py-20 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">Nenhum lançamento encontrado com os filtros atuais</td>
                </tr>
              ) : filteredAndSorted.map(t => (
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
                        <DeParaVisualizer oldValue={editingTransaction.branch} newValue={editForm.branch} />
                      </div>
                      <select value={editForm.branch} onChange={e => setEditForm({...editForm, branch: e.target.value})} className="w-full border border-gray-200 p-2 text-[10px] font-black outline-none focus:border-[#F44C00] bg-gray-50/30">
                        {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-end">
                        <label className="text-[8px] font-black text-gray-500 uppercase">Nova Marca</label>
                        <DeParaVisualizer oldValue={editingTransaction.brand} newValue={editForm.brand} />
                      </div>
                      <select value={editForm.brand} onChange={e => setEditForm({...editForm, brand: e.target.value})} className="w-full border border-gray-200 p-2 text-[10px] font-black outline-none focus:border-[#F44C00] bg-gray-50/30">
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
                           <select value={part.branch} onChange={e => updateRateioPart(part.id, { branch: e.target.value })} className="w-full bg-white border border-gray-100 p-1.5 text-[8px] font-black outline-none focus:border-[#1B75BB]">
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
                    <button onClick={() => setRateioParts([...rateioParts, { id: `p-${Date.now()}`, branch: BRANCHES[0], brand: 'SAP', amount: 0, percent: 0, date: rateioTransaction.date, category: rateioTransaction.category }])} className="w-full py-2.5 border-2 border-dashed border-gray-100 text-gray-300 hover:text-[#1B75BB] hover:border-[#1B75BB]/30 transition-all font-black text-[8px] uppercase flex items-center justify-center gap-2">
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

const FilterTextInput = ({ label, id, value, colFilters, setColFilters, className }: any) => (
  <div className={`space-y-0.5 ${className || ''}`}>
    <label className="text-[6.5px] font-black text-gray-400 uppercase tracking-widest leading-none">{label}</label>
    <div className={`border p-1 rounded-none text-[8px] font-black transition-all ${value ? 'bg-yellow-50 border-yellow-400 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
      <input type="text" placeholder={label} className="w-full bg-transparent outline-none uppercase" value={value} onChange={e => setColFilters({...colFilters, [id]: e.target.value})} />
    </div>
  </div>
);

export default TransactionsView;
