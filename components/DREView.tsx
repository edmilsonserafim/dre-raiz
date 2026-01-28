
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Transaction } from '../types';
import { DRE_STRUCTURE, TAG_STRUCTURE } from '../constants';
import { 
  ChevronRight, 
  ChevronDown, 
  Activity,
  Calendar,
  Table as TableIcon,
  Percent,
  TrendingUpDown,
  Layers,
  X,
  Filter,
  ChevronUp,
  Square,
  CheckSquare,
  Building2,
  Flag,
  FilterX
} from 'lucide-react';

interface DREViewProps {
  transactions: Transaction[];
  onDrillDown: (category?: string, monthIdx?: number, scenario?: string, tags?: any) => void;
}

const DRE_DIMENSIONS = [
  { id: 'tag01', label: 'C. Custo' },
  { id: 'tag02', label: 'Segmento' },
  { id: 'tag03', label: 'Projeto' },
  { id: 'brand', label: 'Marca' },
  { id: 'branch', label: 'Unidade' },
  { id: 'vendor', label: 'Fornecedor' },
  { id: 'ticket', label: 'Ticket' },
];

const DREView: React.FC<DREViewProps> = ({ transactions, onDrillDown }) => {
  const [referenceMonthIdx, setReferenceMonthIdx] = useState<number>(4);

  // Estados de Filtros Multi-seleção
  const [selectedTags01, setSelectedTags01] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

  // Estados para controlar colunas visíveis (novo sistema de filtros)
  const [showReal, setShowReal] = useState<boolean>(true);
  const [showOrcado, setShowOrcado] = useState<boolean>(true);
  const [showA1, setShowA1] = useState<boolean>(true);
  const [showDeltaPerc, setShowDeltaPerc] = useState<boolean>(true);
  const [showDeltaAbs, setShowDeltaAbs] = useState<boolean>(false);
  
  // Estados de UI (Dropdowns abertos)
  const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);
  const [isBrandFilterOpen, setIsBrandFilterOpen] = useState(false);
  const [isBranchFilterOpen, setIsBranchFilterOpen] = useState(false);

  const [dynamicPath, setDynamicPath] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
    '01': true, '02': true, '03': true, '04': true
  });

  const tagRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const branchRef = useRef<HTMLDivElement>(null);

  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagRef.current && !tagRef.current.contains(event.target as Node)) setIsTagFilterOpen(false);
      if (brandRef.current && !brandRef.current.contains(event.target as Node)) setIsBrandFilterOpen(false);
      if (branchRef.current && !branchRef.current.contains(event.target as Node)) setIsBranchFilterOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Opções dinâmicas baseadas nos dados recebidos
  const availableBrands = useMemo(() => 
    Array.from(new Set(transactions.map(t => t.brand).filter(Boolean))).sort() as string[]
  , [transactions]);

  const availableBranches = useMemo(() => {
    let filtered = transactions;
    if (selectedBrands.length > 0) {
      filtered = transactions.filter(t => selectedBrands.includes(t.brand || ''));
    }
    return Array.from(new Set(filtered.map(t => t.branch).filter(Boolean))).sort() as string[];
  }, [transactions, selectedBrands]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDimension = (dimId: string) => {
    setDynamicPath(prev => {
      if (prev.includes(dimId)) return prev.filter(id => id !== dimId);
      if (prev.length >= 5) return prev; 
      return [...prev, dimId];
    });
  };

  const toggleFilter = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const selectAll = (list: string[], setList: (v: string[]) => void, allOptions: string[]) => {
    if (list.length === allOptions.length) setList([]);
    else setList([...allOptions]);
  };

  const clearAllFilters = () => {
    setSelectedTags01([]);
    setSelectedBrands([]);
    setSelectedBranches([]);
  };

  const hasAnyFilterActive = selectedTags01.length > 0 || selectedBrands.length > 0 || selectedBranches.length > 0;

  // Lógica de filtragem global para a DRE
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchTag = selectedTags01.length === 0 || selectedTags01.includes(t.tag01 || '');
      const matchBrand = selectedBrands.length === 0 || selectedBrands.includes(t.brand || '');
      const matchBranch = selectedBranches.length === 0 || selectedBranches.includes(t.branch || '');
      return matchTag && matchBrand && matchBranch;
    });
  }, [transactions, selectedTags01, selectedBrands, selectedBranches]);

  const dataMap = useMemo(() => {
    const map: Record<string, Record<string, number[]>> = { Real: {}, Orçado: {}, 'A-1': {} };

    console.log('🔵 DRE: Total de transações recebidas:', transactions.length);
    console.log('🔵 DRE: Transações filtradas:', filteredTransactions.length);

    if (filteredTransactions.length > 0) {
      console.log('🔵 DRE: Primeira transação:', filteredTransactions[0]);
      console.log('🔵 DRE: Cenários encontrados:', [...new Set(filteredTransactions.map(t => t.scenario))]);
      console.log('🔵 DRE: Categorias encontradas:', [...new Set(filteredTransactions.map(t => t.category))].slice(0, 10));
    }

    filteredTransactions.forEach(t => {
      // Normalizar scenario: 'Original' vira 'Real', undefined vira 'Real'
      let scenario = t.scenario || 'Real';
      if (scenario === 'Original') scenario = 'Real';

      const month = new Date(t.date).getMonth();
      if (!map[scenario][t.category]) map[scenario][t.category] = new Array(12).fill(0);
      map[scenario][t.category][month] += t.amount;
    });

    console.log('🔵 DRE: DataMap criado:', {
      Real: Object.keys(map.Real).length,
      Orçado: Object.keys(map.Orçado).length,
      'A-1': Object.keys(map['A-1']).length
    });

    return map;
  }, [filteredTransactions, transactions]);

  const getValues = (scenario: string, categories: string[]) => {
    const values = new Array(12).fill(0);
    const scenarioMap = dataMap[scenario] || {};
    categories.forEach(cat => {
      if (scenarioMap[cat]) {
        scenarioMap[cat].forEach((v, i) => values[i] += v);
      }
    });
    return values;
  };

  const getDynamicValues = (categories: string[], dimensionKey: string, dimensionValue: string, filters: Record<string, string>, scenario: string) => {
    const vals = new Array(12).fill(0);
    filteredTransactions
      .filter(t => {
        const matchesScenario = t.scenario === scenario;
        const matchesCat = categories.includes(t.category);
        const matchesThisDim = String(t[dimensionKey as keyof Transaction] || 'N/A') === dimensionValue;
        
        const matchesAllParentFilters = Object.entries(filters).every(([key, val]) => 
          String(t[key as keyof Transaction] || 'N/A') === val
        );

        return matchesScenario && matchesCat && matchesThisDim && matchesAllParentFilters;
      })
      .forEach(t => {
        vals[new Date(t.date).getMonth()] += t.amount;
      });
    return vals;
  };

  const renderRow = (
    id: string, 
    label: string, 
    level: number, 
    categories: string[],
    hasChildren: boolean = false,
    accumulatedFilters: Record<string, string> = {}
  ) => {
    const isExpanded = expandedRows[id];
    
    const valsReal = level <= 3 
      ? getValues('Real', categories) 
      : getDynamicValues(categories, dynamicPath[level - 4], label, accumulatedFilters, 'Real');
    
    const valsBudget = level <= 3 
      ? getValues('Orçado', categories) 
      : getDynamicValues(categories, dynamicPath[level - 4], label, accumulatedFilters, 'Orçado');

    const valsA1 = level <= 3 
      ? getValues('A-1', categories) 
      : getDynamicValues(categories, dynamicPath[level - 4], label, accumulatedFilters, 'A-1');
    
    const ytdReal = valsReal.slice(0, referenceMonthIdx + 1).reduce((a, b) => a + b, 0);
    const ytdBudget = valsBudget.slice(0, referenceMonthIdx + 1).reduce((a, b) => a + b, 0);
    const ytdA1 = valsA1.slice(0, referenceMonthIdx + 1).reduce((a, b) => a + b, 0);
    
    const varBudgetPerc = ytdBudget !== 0 ? ((ytdReal - ytdBudget) / Math.abs(ytdBudget)) * 100 : 0;
    const varA1Perc = ytdA1 !== 0 ? ((ytdReal - ytdA1) / Math.abs(ytdA1)) * 100 : 0;
    
    let bgClass = '';
    if (level === 1) bgClass = 'bg-[#152e55] text-white font-black';
    else if (level === 2) bgClass = 'bg-gray-100 text-gray-950 font-extrabold border-b border-gray-200';
    else if (level === 3) bgClass = 'bg-white text-gray-800 border-b border-gray-100 font-bold hover:bg-orange-50/20';
    else if (level === 4) bgClass = 'bg-blue-50/30 text-blue-900 border-b border-blue-50/50 italic font-semibold';
    else if (level === 5) bgClass = 'bg-emerald-50/20 text-emerald-900 border-b border-emerald-50/30 italic font-medium';
    else if (level === 6) bgClass = 'bg-amber-50/20 text-amber-900 border-b border-amber-50/30 italic font-medium';
    else if (level === 7) bgClass = 'bg-rose-50/20 text-rose-900 border-b border-rose-50/30 italic font-medium';
    else bgClass = 'bg-gray-50 text-gray-400 border-b border-gray-100 italic font-normal opacity-80';

    const paddingLeft = `${(level - 1) * 1 + 0.75}rem`;

    return (
      <React.Fragment key={id}>
        <tr className={`${bgClass} transition-all text-[9px] h-8 group`}>
          <td className={`sticky left-0 z-30 border-r border-gray-200 shadow-[1px_0_0_rgba(0,0,0,0.1)] w-[20%] ${level === 1 ? 'bg-[#152e55]' : 'bg-inherit'} group-hover:bg-yellow-50`}>
            <div className="flex items-center gap-1 px-2 overflow-hidden" style={{ paddingLeft }}>
              {hasChildren && (
                <button onClick={() => toggleRow(id)} className={`p-0.5 rounded-none shrink-0 ${level === 1 ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
                  {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                </button>
              )}
              <span className={`truncate ${level === 1 ? 'uppercase tracking-tighter' : ''}`}>{label || 'Não Informado'}</span>
            </div>
          </td>
          {months.map((_, i) => (
            <td 
              key={i} 
              onDoubleClick={() => onDrillDown(label, i, 'Real', { tag01: selectedTags01.length === 1 ? selectedTags01[0] : 'all' })}
              className={`px-1 text-right font-mono font-bold border-r border-gray-100 w-[3.5%] cursor-pointer hover:bg-yellow-100/60 transition-colors ${i > referenceMonthIdx ? 'opacity-20' : (level === 1 ? 'text-white' : 'text-gray-900')}`}
            >
              {valsReal[i] === 0 ? '-' : Math.round(valsReal[i]).toLocaleString()}
            </td>
          ))}
          <td className={`px-1 text-right font-mono font-black border-l border-gray-300 w-[10%] hover:bg-yellow-200/40 transition-colors ${level === 1 ? 'text-white bg-[#1B75BB]' : 'bg-blue-50 text-[#152e55]'}`}>
            {Math.round(ytdReal).toLocaleString()}
          </td>
          <td className={`px-1 text-right font-mono font-bold w-[6%] hover:bg-yellow-50 transition-colors ${level === 1 ? 'text-white bg-white/5' : 'text-gray-500 bg-gray-50/30'}`}>
            {ytdBudget !== 0 ? Math.round(ytdBudget).toLocaleString() : '-'}
          </td>
          <td className={`px-0.5 text-center font-black w-[3%] border-r border-gray-100 ${level === 1 ? 'text-white' : (varBudgetPerc > 0 ? 'text-emerald-600' : varBudgetPerc < 0 ? 'text-rose-600' : 'text-gray-400')}`}>
            {varBudgetPerc !== 0 ? `${varBudgetPerc > 0 ? '+' : ''}${varBudgetPerc.toFixed(0)}%` : '-'}
          </td>
          <td className={`px-1 text-right font-mono font-bold w-[6%] hover:bg-yellow-50 transition-colors ${level === 1 ? 'text-white bg-white/5' : 'text-gray-500 bg-gray-50/30'}`}>
            {ytdA1 !== 0 ? Math.round(ytdA1).toLocaleString() : '-'}
          </td>
          <td className={`px-0.5 text-center font-black w-[3%] ${level === 1 ? 'text-white' : (varA1Perc > 0 ? 'text-emerald-600' : varA1Perc < 0 ? 'text-rose-600' : 'text-gray-400')}`}>
            {varA1Perc !== 0 ? `${varA1Perc > 0 ? '+' : ''}${varA1Perc.toFixed(0)}%` : '-'}
          </td>
        </tr>
        
        {isExpanded && hasChildren && (() => {
          if (level === 1) {
            const structure = (DRE_STRUCTURE as any)[id === '01' ? 'REVENUE' : id === '02' ? 'VARIABLE_COST' : id === '03' ? 'FIXED_COST' : 'SGA'];
            return Object.entries(structure.children).map(([childId, child]: any) => 
              renderRow(childId, child.label, 2, child.items, true)
            );
          }
          
          if (level === 2) {
            return categories.map((cat, idx) => {
              const hasDynamic = dynamicPath.length > 0;
              return renderRow(`${id}.${idx}`, cat, 3, [cat], hasDynamic);
            });
          }

          if (level >= 3 && dynamicPath.length > (level - 3)) {
            const currentDimKey = dynamicPath[level - 3];
            
            const uniqueValues = Array.from(new Set(
              filteredTransactions
                .filter(t => {
                  const matchesCat = categories.includes(t.category);
                  const matchesAllParents = Object.entries(accumulatedFilters).every(([key, val]) => 
                    String(t[key as keyof Transaction] || 'N/A') === val
                  );
                  return matchesCat && matchesAllParents;
                })
                .map(t => String(t[currentDimKey as keyof Transaction] || 'N/A'))
            )).sort();

            return uniqueValues.map((val, idx) => {
              const nextId = `${id}-${currentDimKey}-${idx}`;
              const hasMoreLevels = dynamicPath.length > (level - 2);
              const nextFilters = { ...accumulatedFilters, [currentDimKey]: val };
              return renderRow(nextId, val, level + 1, categories, hasMoreLevels, nextFilters);
            });
          }

          return null;
        })()}
      </React.Fragment>
    );
  };

  const renderCalculationLine = (label: string, posCategories: string[], negCategories: string[][], color: string) => {
    const calcReal = new Array(12).fill(0);
    const calcBudget = new Array(12).fill(0);
    const calcA1 = new Array(12).fill(0);

    const baseReal = getValues('Real', posCategories);
    const baseBudget = getValues('Orçado', posCategories);
    const baseA1 = getValues('A-1', posCategories);

    for(let i=0; i<12; i++) {
      calcReal[i] = baseReal[i];
      calcBudget[i] = baseBudget[i];
      calcA1[i] = baseA1[i];
      negCategories.forEach(cats => {
        const negReal = getValues('Real', cats);
        const negBudget = getValues('Orçado', cats);
        const negA1 = getValues('A-1', cats);
        calcReal[i] -= negReal[i];
        calcBudget[i] -= negBudget[i];
        calcA1[i] -= negA1[i];
      });
    }

    const ytdReal = calcReal.slice(0, referenceMonthIdx + 1).reduce((a, b) => a + b, 0);
    const ytdBudget = calcBudget.slice(0, referenceMonthIdx + 1).reduce((a, b) => a + b, 0);
    const ytdA1 = calcA1.slice(0, referenceMonthIdx + 1).reduce((a, b) => a + b, 0);

    const varBudgetPerc = ytdBudget !== 0 ? ((ytdReal - ytdBudget) / Math.abs(ytdBudget)) * 100 : 0;
    const varA1Perc = ytdA1 !== 0 ? ((ytdReal - ytdA1) / Math.abs(ytdA1)) * 100 : 0;

    return (
      <tr className={`${color} text-white text-[10px] font-black h-9 shadow-sm group`}>
        <td className="sticky left-0 bg-inherit z-30 border-r border-white/10 shadow-[1px_0_0_rgba(255,255,255,0.1)] w-[20%] group-hover:bg-yellow-400 group-hover:text-black transition-colors">
          <div className="flex items-center gap-2 px-4 uppercase tracking-tighter truncate font-black">
            <Activity size={12} /> {label}
          </div>
        </td>
        {months.map((_, i) => (
          <td key={i} className={`px-1 text-right font-mono border-r border-white/5 w-[3.5%] hover:bg-yellow-100/40 transition-colors ${i > referenceMonthIdx ? 'opacity-20' : ''}`}>
            {Math.round(calcReal[i]).toLocaleString()}
          </td>
        ))}
        <td className="px-1 text-right font-mono border-l border-white/20 bg-black/10 w-[10%] hover:bg-yellow-200 transition-colors">
          {Math.round(ytdReal).toLocaleString()}
        </td>
        <td className="px-1 text-right font-mono border-l border-white/5 bg-black/5 opacity-80 w-[6%] hover:bg-yellow-50 transition-colors">
          {Math.round(ytdBudget).toLocaleString()}
        </td>
        <td className={`px-0.5 text-center border-r border-white/10 text-[9px] w-[3%] font-black ${varBudgetPerc >= 0 ? 'text-emerald-300' : 'text-rose-100'}`}>
          {varBudgetPerc === 0 ? '-' : `${varBudgetPerc > 0 ? '+' : ''}${varBudgetPerc.toFixed(0)}%`}
        </td>
        <td className="px-1 text-right font-mono border-l border-white/5 bg-black/5 opacity-80 w-[6%] hover:bg-yellow-50 transition-colors">
          {Math.round(ytdA1).toLocaleString()}
        </td>
        <td className={`px-0.5 text-center text-[9px] w-[3%] font-black ${varA1Perc >= 0 ? 'text-emerald-300' : 'text-rose-100'}`}>
          {varA1Perc === 0 ? '-' : `${varA1Perc > 0 ? '+' : ''}${varA1Perc.toFixed(0)}%`}
        </td>
      </tr>
    );
  };

  const getSummary = (selected: string[], all: string[], label: string) => {
    if (selected.length === 0) return `TODAS AS ${label}S`;
    if (selected.length === all.length) return `TODAS SELECIONADAS`;
    if (selected.length === 1) return selected[0].toUpperCase();
    return `${selected[0].toUpperCase()} + ${selected.length - 1}`;
  };

  // Componente Reutilizável de Dropdown Multi-select
  const MultiSelectDropdown = ({ 
    label, 
    summary, 
    isOpen, 
    setOpen, 
    options, 
    selected, 
    toggle, 
    allSelect, 
    icon: Icon, 
    color,
    refObj
  }: any) => {
    const isActive = selected.length > 0;
    return (
      <div ref={refObj} className="relative">
        <button 
          onClick={() => setOpen(!isOpen)}
          className={`flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border-2 transition-all min-w-[200px] shadow-sm hover:shadow-md ${isOpen ? `border-${color} ring-4 ring-${color}/10` : isActive ? 'border-yellow-400 bg-yellow-50 shadow-yellow-100/50' : 'border-gray-100'}`}
        >
          <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-yellow-400 text-black' : 'bg-gray-50 text-gray-400'}`}>
            <Icon size={16} />
          </div>
          <div className="flex flex-col items-start flex-1 overflow-hidden">
            <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</span>
            <span className={`font-black text-[10px] uppercase truncate w-full text-left ${isActive ? 'text-yellow-700' : 'text-gray-900'}`}>{summary}</span>
          </div>
          <div className="text-gray-400">{isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</div>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-full min-w-[220px] bg-white border border-gray-100 shadow-2xl rounded-[1.5rem] z-[100] p-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-50">
              <span className="text-[8px] font-black text-gray-400 uppercase">Seleção de {label}</span>
              <button 
                onClick={() => allSelect()}
                className="text-[8px] font-black text-blue-600 uppercase hover:underline"
              >
                {selected.length === options.length ? 'Limpar' : 'Todos'}
              </button>
            </div>
            <div className="space-y-0.5 max-h-[300px] overflow-y-auto pr-1">
              {options.map((opt: string) => {
                const active = selected.includes(opt);
                return (
                  <button 
                    key={opt}
                    onClick={() => toggle(opt)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-all group ${active ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className={`transition-colors ${active ? 'text-yellow-600' : 'text-gray-300'}`}>
                      {active ? <CheckSquare size={14} strokeWidth={3} /> : <Square size={14} strokeWidth={3} />}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-tight truncate ${active ? 'text-yellow-700' : 'text-gray-600'}`}>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col 2xl:flex-row justify-between items-start 2xl:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-[#152e55] text-white p-3 rounded-2xl shadow-xl shadow-blue-50/50">
            <TableIcon size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 leading-tight">Análise de Resultado Estrutural</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">DRE Fixa • Filtros Inteligentes de Grupo</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Botão de Limpar Filtros */}
          {hasAnyFilterActive && (
            <button 
              onClick={clearAllFilters}
              className="flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-2.5 rounded-2xl border border-rose-100 font-black text-[9px] uppercase tracking-widest hover:bg-rose-100 transition-all shadow-sm"
            >
              <FilterX size={16} /> Limpar Filtros
            </button>
          )}

          {/* Dropdown de Centro de Custo */}
          <MultiSelectDropdown 
            label="Centro de Custo"
            summary={getSummary(selectedTags01, TAG_STRUCTURE.TAG01.options, "UNIDADE")}
            isOpen={isTagFilterOpen}
            setOpen={setIsTagFilterOpen}
            options={TAG_STRUCTURE.TAG01.options}
            selected={selectedTags01}
            toggle={(opt: string) => toggleFilter(selectedTags01, setSelectedTags01, opt)}
            allSelect={() => selectAll(selectedTags01, setSelectedTags01, TAG_STRUCTURE.TAG01.options)}
            icon={Filter}
            color="[#1B75BB]"
            refObj={tagRef}
          />

          {/* Dropdown de Marca */}
          <MultiSelectDropdown 
            label="Marca"
            summary={getSummary(selectedBrands, availableBrands, "MARCA")}
            isOpen={isBrandFilterOpen}
            setOpen={setIsBrandFilterOpen}
            options={availableBrands}
            selected={selectedBrands}
            toggle={(opt: string) => {
              toggleFilter(selectedBrands, setSelectedBrands, opt);
              setSelectedBranches([]); 
            }}
            allSelect={() => {
              selectAll(selectedBrands, setSelectedBrands, availableBrands);
              setSelectedBranches([]);
            }}
            icon={Flag}
            color="[#1B75BB]"
            refObj={brandRef}
          />

          {/* Dropdown de Filial */}
          <MultiSelectDropdown 
            label="Filial"
            summary={getSummary(selectedBranches, availableBranches, "FILIAL")}
            isOpen={isBranchFilterOpen}
            setOpen={setIsBranchFilterOpen}
            options={availableBranches}
            selected={selectedBranches}
            toggle={(opt: string) => toggleFilter(selectedBranches, setSelectedBranches, opt)}
            allSelect={() => selectAll(selectedBranches, setSelectedBranches, availableBranches)}
            icon={Building2}
            color="[#F44C00]"
            refObj={branchRef}
          />

          <div className="h-10 w-px bg-gray-200 mx-1 hidden 2xl:block" />

          {/* Período Select */}
          <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border-2 border-gray-100 shadow-sm">
            <div className="p-2 rounded-xl bg-gray-50 text-gray-400">
              <Calendar size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Período</span>
              <select 
                value={referenceMonthIdx} 
                onChange={e => setReferenceMonthIdx(Number(e.target.value))} 
                className="font-black text-[10px] uppercase tracking-tight outline-none bg-transparent cursor-pointer text-gray-900"
              >
                {months.map((m, i) => <option key={m} value={i}>ATÉ {m}</option>)}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Painel de Seleção de Colunas Visíveis */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-5 py-4 rounded-2xl border border-blue-100 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-blue-500 text-white">
            <TableIcon size={16} />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Colunas Visíveis</h3>
            <p className="text-[9px] text-gray-500 font-semibold">Selecione quais métricas deseja visualizar na tabela DRE</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {/* Real */}
          <button
            onClick={() => setShowReal(!showReal)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all ${
              showReal
                ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            {showReal ? <CheckSquare size={16} strokeWidth={3} /> : <Square size={16} strokeWidth={3} />}
            <span className="text-xs font-black uppercase">Real</span>
          </button>

          {/* Orçado */}
          <button
            onClick={() => setShowOrcado(!showOrcado)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all ${
              showOrcado
                ? 'bg-green-500 text-white border-green-500 shadow-md'
                : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
            }`}
          >
            {showOrcado ? <CheckSquare size={16} strokeWidth={3} /> : <Square size={16} strokeWidth={3} />}
            <span className="text-xs font-black uppercase">Orçado</span>
          </button>

          {/* A-1 */}
          <button
            onClick={() => setShowA1(!showA1)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all ${
              showA1
                ? 'bg-purple-500 text-white border-purple-500 shadow-md'
                : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
            }`}
          >
            {showA1 ? <CheckSquare size={16} strokeWidth={3} /> : <Square size={16} strokeWidth={3} />}
            <span className="text-xs font-black uppercase">A-1</span>
          </button>

          {/* Δ % */}
          <button
            onClick={() => setShowDeltaPerc(!showDeltaPerc)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all ${
              showDeltaPerc
                ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
            }`}
          >
            {showDeltaPerc ? <CheckSquare size={16} strokeWidth={3} /> : <Square size={16} strokeWidth={3} />}
            <span className="text-xs font-black uppercase">Δ %</span>
          </button>

          {/* Δ R$ */}
          <button
            onClick={() => setShowDeltaAbs(!showDeltaAbs)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all ${
              showDeltaAbs
                ? 'bg-rose-500 text-white border-rose-500 shadow-md'
                : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'
            }`}
          >
            {showDeltaAbs ? <CheckSquare size={16} strokeWidth={3} /> : <Square size={16} strokeWidth={3} />}
            <span className="text-xs font-black uppercase">Δ R$</span>
          </button>
        </div>

        {/* Aviso se nenhuma coluna selecionada */}
        {!showReal && !showOrcado && !showA1 && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-xs font-bold text-yellow-800">⚠️ Selecione pelo menos um cenário (Real, Orçado ou A-1)</p>
          </div>
        )}
      </div>

      {/* Seção de Níveis Analíticos Dinâmicos */}
      <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm">
        <div className={`p-2 rounded-xl transition-colors ${dynamicPath.length > 0 ? 'bg-[#F44C00] text-white' : 'bg-gray-50 text-gray-400'}`}>
          <Layers size={16} />
        </div>
        <div className="flex flex-col pr-4 mr-2 border-r border-gray-100 shrink-0">
          <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1">Drill-down Profundo</span>
          <span className="text-[10px] font-black text-gray-900 uppercase">Níveis 4 a 8</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {DRE_DIMENSIONS.map(dim => {
            const index = dynamicPath.indexOf(dim.id);
            const isActive = index !== -1;
            return (
              <button 
                key={dim.id}
                onClick={() => toggleDimension(dim.id)}
                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2 border ${
                  isActive 
                    ? 'bg-[#F44C00] text-white border-[#F44C00] shadow-md' 
                    : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'
                }`}
              >
                {isActive && <span className="bg-white/20 px-1 rounded-md text-[8px]">{index + 1}º</span>}
                {dim.label}
              </button>
            );
          })}
          {dynamicPath.length > 0 && (
            <button onClick={() => setDynamicPath([])} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg ml-2">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-none border border-gray-100 shadow-2xl overflow-hidden relative">
        <div className="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto">
          <table className="w-full border-separate border-spacing-0 text-left table-fixed min-w-[1500px]">
            <thead className="sticky top-0 z-50">
              <tr className="bg-[#152e55] text-white h-9">
                <th rowSpan={2} className="sticky left-0 z-[60] bg-[#152e55] px-4 py-1.5 text-[9px] font-black uppercase w-[20%] border-r border-white/10">Contas Gerenciais</th>
                <th colSpan={12} className="px-2 py-1 text-center text-[8px] font-black border-b border-white/10 uppercase tracking-widest bg-[#1B75BB]">Evolução Mensal (Real)</th>
                <th rowSpan={2} className="px-2 py-1.5 text-center text-[9px] font-black border-l border-white/20 w-[10%] bg-[#1B75BB]">YTD REAL</th>
                <th colSpan={2} className="px-2 py-1 text-center text-[8px] font-black border-l border-white/10 bg-[#3a3a3a] uppercase">Meta (Budget)</th>
                <th colSpan={2} className="px-2 py-1 text-center text-[8px] font-black border-l border-white/10 bg-[#2b2b2b] uppercase">Ano Ant. (A-1)</th>
              </tr>
              <tr className="bg-[#1B75BB] text-white h-6">
                {months.map(m => (
                  <th key={m} className="px-1 py-1 text-center text-[7px] font-black w-[3.5%] border-r border-white/5">{m}</th>
                ))}
                <th className="px-1 py-1 text-center text-[7px] w-[6%] border-l border-white/10">VALOR</th>
                <th className="px-1 py-1 text-center text-[7px] w-[3%] border-r border-white/10">VAR%</th>
                <th className="px-1 py-1 text-center text-[7px] w-[6%] border-l border-white/10">VALOR</th>
                <th className="px-1 py-1 text-center text-[7px] w-[3%]">VAR%</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {renderRow('01', DRE_STRUCTURE.REVENUE.label, 1, Object.values(DRE_STRUCTURE.REVENUE.children).flatMap(c => c.items), true)}
              {renderRow('02', DRE_STRUCTURE.VARIABLE_COST.label, 1, Object.values(DRE_STRUCTURE.VARIABLE_COST.children).flatMap(c => c.items), true)}
              
              {renderCalculationLine(
                '06. MARGEM DE CONTRIBUIÇÃO', 
                Object.values(DRE_STRUCTURE.REVENUE.children).flatMap(c => c.items),
                [Object.values(DRE_STRUCTURE.VARIABLE_COST.children).flatMap(c => c.items)],
                'bg-[#F44C00]'
              )}

              {renderRow('03', DRE_STRUCTURE.FIXED_COST.label, 1, Object.values(DRE_STRUCTURE.FIXED_COST.children).flatMap(c => c.items), true)}
              {renderRow('04', DRE_STRUCTURE.SGA.label, 1, Object.values(DRE_STRUCTURE.SGA.children).flatMap(c => c.items), true)}

              {renderCalculationLine(
                '09. EBITDA OPERACIONAL', 
                Object.values(DRE_STRUCTURE.REVENUE.children).flatMap(c => c.items),
                [
                  Object.values(DRE_STRUCTURE.VARIABLE_COST.children).flatMap(c => c.items),
                  Object.values(DRE_STRUCTURE.FIXED_COST.children).flatMap(c => c.items),
                  Object.values(DRE_STRUCTURE.SGA.children).flatMap(c => c.items)
                ],
                'bg-[#152e55]'
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-3xl flex items-start gap-4 shadow-sm">
          <div className="bg-white p-2 rounded-2xl shadow-sm text-[#152e55]">
            <Building2 size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-wider">Filtragem Multidimensional</h4>
            <p className="text-[10px] font-medium text-blue-800 leading-snug">
              Agora você pode cruzar marcas e unidades simultaneamente com indicações visuais amarelas para seleções ativas.
            </p>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-100 p-4 rounded-3xl flex items-start gap-4 shadow-sm">
          <div className="bg-white p-2 rounded-2xl shadow-sm text-[#F44C00]">
            <TrendingUpDown size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="text-[11px] font-black text-orange-900 uppercase tracking-wider">Consolidação em Tempo Real</h4>
            <p className="text-[10px] font-medium text-orange-800 leading-snug">
              O sistema recalcula orçamentos (Budget) e realizados de anos anteriores (A-1) para qualquer combinação de filtros selecionada.
            </p>
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-3xl flex items-start gap-4 shadow-sm md:col-span-2 lg:col-span-1">
          <div className="bg-white p-2 rounded-2xl shadow-sm text-emerald-600">
            <CheckSquare size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="text-[11px] font-black text-emerald-900 uppercase tracking-wider">Destaques Analíticos</h4>
            <p className="text-[10px] font-medium text-emerald-800 leading-snug">
              Explore os dados com o mouse para destacar células e identificar desvios rapidamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DREView;
