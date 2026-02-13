
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Transaction } from '../types';
import {
  getDRESummary,
  getDREDimension,
  getDREFilterOptions,
  getFiliais,
  DRESummaryRow,
  DREDimensionRow,
  DREFilterOptions,
  FilialOption
} from '../services/supabaseService';
import {
  ChevronRight,
  ChevronDown,
  Activity,
  Calendar,
  CalendarDays,
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
  FilterX,
  ArrowLeftRight,
  RefreshCw,
  Loader2,
  ArrowUpDown,
  ArrowDownAZ,
  ArrowDown10,
  ArrowUp10
} from 'lucide-react';

interface DREViewProps {
  transactions?: Transaction[];  // Mantido para compatibilidade, mas NÃO usado para DRE
  onDrillDown: (drillDownData: {
    categories: string[];
    monthIdx?: number;
    scenario?: string;
    filters?: Record<string, string>;
  }) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  dreYear?: number;  // Ano para buscar dados (default: ano atual)
  // ✅ PERMISSÕES: Sempre aplicadas nas queries RPC
  allowedMarcas?: string[];
  allowedFiliais?: string[];
  allowedCategories?: string[];
  allowedTag01?: string[];
  allowedTag02?: string[];
  allowedTag03?: string[];
}

const DRE_DIMENSIONS = [
  { id: 'tag02', label: 'tag02' },
  { id: 'tag03', label: 'tag03' },
  { id: 'marca', label: 'Marca' },
  { id: 'nome_filial', label: 'Unidade' },
  { id: 'vendor', label: 'Fornecedor' },
  { id: 'ticket', label: 'Ticket' },
];

const DREView: React.FC<DREViewProps> = ({
  onDrillDown,
  onRefresh,
  isRefreshing = false,
  dreYear,
  allowedMarcas,
  allowedFiliais,
  allowedCategories,
  allowedTag01,
  allowedTag02,
  allowedTag03
}) => {
  // Estado para dados agregados do servidor
  const [summaryRows, setSummaryRows] = useState<DRESummaryRow[]>([]);
  const [filterOptions, setFilterOptions] = useState<DREFilterOptions>({ marcas: [], nome_filiais: [], tags01: [] });
  const [filialTable, setFilialTable] = useState<FilialOption[]>([]); // Tabela filial (master)
  const [isLoadingDRE, setIsLoadingDRE] = useState(true);
  const [dimensionCache, setDimensionCache] = useState<Record<string, DREDimensionRow[]>>({});
  const currentYear = dreYear || new Date().getFullYear();
  const fetchIdRef = useRef(0);  // Para evitar race conditions
  const [selectedMonthStart, setSelectedMonthStart] = useState<number>(() => {
    const saved = sessionStorage.getItem('dreMonthStart');
    return saved ? JSON.parse(saved) : 0;
  });
  const [selectedMonthEnd, setSelectedMonthEnd] = useState<number>(() => {
    const saved = sessionStorage.getItem('dreMonthEnd');
    return saved ? JSON.parse(saved) : 11;
  });

  // Estados de Filtros Multi-seleção
  const [selectedTags01, setSelectedTags01] = useState<string[]>(() => {
    const saved = sessionStorage.getItem('dreTags01');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedMarcas, setSelectedMarcas] = useState<string[]>(() => {
    const saved = sessionStorage.getItem('dreBrands');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedFiliais, setSelectedFiliais] = useState<string[]>(() => {
    const saved = sessionStorage.getItem('dreBranches');
    return saved ? JSON.parse(saved) : [];
  });

  // Estados para controlar colunas visíveis (novo sistema de filtros)
  const [showReal, setShowReal] = useState<boolean>(true);
  const [showOrcado, setShowOrcado] = useState<boolean>(false);
  const [showA1, setShowA1] = useState<boolean>(false);
  const [showDeltaPercOrcado, setShowDeltaPercOrcado] = useState<boolean>(false);
  const [showDeltaPercA1, setShowDeltaPercA1] = useState<boolean>(false);
  const [showDeltaAbsOrcado, setShowDeltaAbsOrcado] = useState<boolean>(false);
  const [showDeltaAbsA1, setShowDeltaAbsA1] = useState<boolean>(false);

  // Sistema de ordem de seleção - todos os elementos (cenários + deltas)
  const [selectionOrder, setSelectionOrder] = useState<string[]>([
    'Real', 'Orçado', 'A-1', 'DeltaPercOrcado', 'DeltaPercA1', 'DeltaAbsOrcado', 'DeltaAbsA1'
  ]);

  // Modo de visualização: 'scenario' (por cenário) ou 'month' (por mês)
  const [viewMode, setViewMode] = useState<'scenario' | 'month'>('scenario');
  
  // Estados de UI (Dropdowns abertos)
  const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);
  const [isBrandFilterOpen, setIsBrandFilterOpen] = useState(false);
  const [isBranchFilterOpen, setIsBranchFilterOpen] = useState(false);

  const [dynamicPath, setDynamicPath] = useState<string[]>([]);
  // Ordenação de dimensões: 'alpha' (A-Z), 'desc' (maior→menor), 'asc' (menor→maior)
  const [dimensionSort, setDimensionSort] = useState<'alpha' | 'desc' | 'asc'>('desc');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
    '01': true, '02': true, '03': true, '04': true
  });

  const tagRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const branchRef = useRef<HTMLDivElement>(null);

  // Salvar filtros da DRE no sessionStorage quando mudarem
  useEffect(() => {
    sessionStorage.setItem('dreMonthStart', JSON.stringify(selectedMonthStart));
  }, [selectedMonthStart]);

  useEffect(() => {
    sessionStorage.setItem('dreMonthEnd', JSON.stringify(selectedMonthEnd));
  }, [selectedMonthEnd]);

  useEffect(() => {
    sessionStorage.setItem('dreTags01', JSON.stringify(selectedTags01));
  }, [selectedTags01]);

  useEffect(() => {
    sessionStorage.setItem('dreBrands', JSON.stringify(selectedMarcas));
  }, [selectedMarcas]);

  useEffect(() => {
    sessionStorage.setItem('dreBranches', JSON.stringify(selectedFiliais));
  }, [selectedFiliais]);

  // ========== BUSCA DE DADOS AGREGADOS DO SERVIDOR ==========
  const fetchDREData = useCallback(async () => {
    const fetchId = ++fetchIdRef.current;
    setIsLoadingDRE(true);
    setDimensionCache({});  // Limpar cache de dimensões

    const monthFrom = `${currentYear}-01`;
    const monthTo = `${currentYear}-12`;

    try {
      // ✅ APLICAR PERMISSÕES: Mesclar filtros do usuário com permissões
      let finalMarcas = selectedMarcas.length > 0 ? selectedMarcas : undefined;
      let finalFiliais = selectedFiliais.length > 0 ? selectedFiliais : undefined;

      // Se há permissões de marca, aplicar
      if (allowedMarcas && allowedMarcas.length > 0) {
        if (finalMarcas && finalMarcas.length > 0) {
          // Intersecção: usuário selecionou marcas + tem permissões
          finalMarcas = finalMarcas.filter(m => allowedMarcas.includes(m));
        } else {
          // Usuário não selecionou, usar apenas as permitidas
          finalMarcas = allowedMarcas;
        }
        console.log('🔒 DRE: Filtro de permissão MARCA aplicado:', finalMarcas);
      }

      // Se há permissões de filial, aplicar
      if (allowedFiliais && allowedFiliais.length > 0) {
        if (finalFiliais && finalFiliais.length > 0) {
          finalFiliais = finalFiliais.filter(f => allowedFiliais.includes(f));
        } else {
          finalFiliais = allowedFiliais;
        }
        console.log('🔒 DRE: Filtro de permissão FILIAL aplicado:', finalFiliais);
      }

      // Se há permissões de TAG01, aplicar
      let finalTags01 = selectedTags01.length > 0 ? selectedTags01 : undefined;
      if (allowedTag01 && allowedTag01.length > 0) {
        if (finalTags01 && finalTags01.length > 0) {
          // Intersecção: usuário selecionou tags + tem permissões
          finalTags01 = finalTags01.filter(t => allowedTag01.includes(t));
        } else {
          // Usuário não selecionou, usar apenas as permitidas
          finalTags01 = allowedTag01;
        }
        console.log('🔒 DRE: Filtro de permissão TAG01 aplicado:', finalTags01);
      }

      const [summary, options, filiais] = await Promise.all([
        getDRESummary({
          monthFrom,
          monthTo,
          marcas: finalMarcas,
          nomeFiliais: finalFiliais,
          tags01: finalTags01,
        }),
        getDREFilterOptions({ monthFrom, monthTo }),
        getFiliais(),
      ]);

      // Verificar se este fetch ainda é o mais recente
      if (fetchId !== fetchIdRef.current) return;

      setSummaryRows(summary);
      setFilterOptions(options);
      setFilialTable(filiais);
      console.log(`✅ DRE: ${summary.length} linhas agregadas carregadas`);

      // 🔍 ANÁLISE: Mapear tag0 → tag01 e calcular totais de receita
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 ANÁLISE DRE - Mapeamento tag0 → tag01');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const tag0Map = new Map<string, { tag01s: Set<string>, total: number }>();

      summary.forEach(row => {
        const tag0 = row.tag0 || 'Sem Classificação';
        const tag01 = row.tag01 || 'Sem Subclassificação';
        const amount = Number(row.total_amount);

        if (!tag0Map.has(tag0)) {
          tag0Map.set(tag0, { tag01s: new Set(), total: 0 });
        }

        const entry = tag0Map.get(tag0)!;
        entry.tag01s.add(tag01);
        entry.total += amount;
      });

      // Ordenar tag0s
      const sortedTag0s = Array.from(tag0Map.keys()).sort();

      sortedTag0s.forEach(tag0 => {
        const entry = tag0Map.get(tag0)!;
        const tag01List = Array.from(entry.tag01s).sort();
        console.log(`\n📦 ${tag0}`);
        console.log(`   Total: R$ ${entry.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`   Tags01 (${tag01List.length}):`, tag01List);
      });

      // Calcular total de RECEITA (tags que começam com "01." ou contém "Receita" no nome)
      let totalReceita = 0;
      const receitaTags: string[] = [];

      sortedTag0s.forEach(tag0 => {
        if (tag0.match(/^01\./i) || tag0.toLowerCase().includes('receita')) {
          const entry = tag0Map.get(tag0)!;
          totalReceita += entry.total;
          receitaTags.push(tag0);
        }
      });

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('💰 RECEITA LÍQUIDA TOTAL (DRE)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   📊 Total: R$ ${totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`   📦 Tag0s de Receita (${receitaTags.length}):`, receitaTags);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (error) {
      console.error('❌ Erro ao carregar dados DRE:', error);
    } finally {
      if (fetchId === fetchIdRef.current) {
        setIsLoadingDRE(false);
      }
    }
  }, [currentYear, selectedMarcas, selectedFiliais, selectedTags01, allowedMarcas, allowedFiliais, allowedTag01]);

  // Carregar dados na montagem e quando filtros mudam
  useEffect(() => {
    fetchDREData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentYear, selectedMarcas, selectedFiliais, selectedTags01]);

  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  // Meses filtrados baseado no range selecionado
  const filteredMonths = useMemo(() => {
    return months.slice(selectedMonthStart, selectedMonthEnd + 1);
  }, [selectedMonthStart, selectedMonthEnd]);

  const filteredMonthIndices = useMemo(() => {
    return Array.from({ length: selectedMonthEnd - selectedMonthStart + 1 }, (_, i) => selectedMonthStart + i);
  }, [selectedMonthStart, selectedMonthEnd]);

  // Função para gerenciar toggle com tracking de ordem (funciona para cenários e deltas)
  const toggleElement = (element: string, currentState: boolean, setState: (val: boolean) => void) => {
    if (!currentState) {
      // Está sendo ativado - adiciona ao final da ordem
      setSelectionOrder(prev => [...prev.filter(s => s !== element), element]);
    } else {
      // Está sendo desativado - remove da ordem
      setSelectionOrder(prev => prev.filter(s => s !== element));
    }
    setState(!currentState);
  };

  // Calcula todos os elementos ativos (cenários + deltas) na ordem de seleção
  const activeElements = useMemo(() => {
    const active = [];
    if (showReal) active.push('Real');
    if (showOrcado) active.push('Orçado');
    if (showA1) active.push('A-1');
    if (showDeltaPercOrcado) active.push('DeltaPercOrcado');
    if (showDeltaPercA1) active.push('DeltaPercA1');
    if (showDeltaAbsOrcado) active.push('DeltaAbsOrcado');
    if (showDeltaAbsA1) active.push('DeltaAbsA1');

    // Ordena pela ordem de seleção
    return active.sort((a, b) => selectionOrder.indexOf(a) - selectionOrder.indexOf(b));
  }, [showReal, showOrcado, showA1, showDeltaPercOrcado, showDeltaPercA1, showDeltaAbsOrcado, showDeltaAbsA1, selectionOrder]);

  // Calcula apenas os cenários ativos (para cálculos)
  const activeScenarios = useMemo(() => {
    return activeElements.filter(el => ['Real', 'Orçado', 'A-1'].includes(el));
  }, [activeElements]);

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

  // Opções de marca/filial da tabela filial (master)
  const availableBrands = useMemo(() => {
    const cias = new Set(filialTable.map(f => f.cia));
    return Array.from(cias).sort();
  }, [filialTable]);

  // Filiais filtradas pela marca selecionada (formato "CIA - NomeFilial")
  const availableBranches = useMemo(() => {
    let filtered = filialTable;
    if (selectedMarcas.length > 0) {
      filtered = filialTable.filter(f => selectedMarcas.includes(f.cia));
    }
    return filtered.map(f => f.label).sort();
  }, [filialTable, selectedMarcas]);

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
    setSelectedMarcas([]);
    setSelectedFiliais([]);
  };

  const hasAnyFilterActive = selectedTags01.length > 0 || selectedMarcas.length > 0 || selectedFiliais.length > 0;

  // ========== CONSTRUIR dataMap E dreStructure A PARTIR DE summaryRows ==========

  const dataMap = useMemo(() => {
    const map: Record<string, Record<string, number[]>> = { Real: {}, Orçado: {}, 'A-1': {} };

    console.log('🔵 DRE: Construindo dataMap a partir de', summaryRows.length, 'linhas agregadas');

    summaryRows.forEach(row => {
      // Normalizar scenario
      let scenario = row.scenario || 'Real';
      if (scenario === 'Original') scenario = 'Real';

      // Extrair mês do year_month (YYYY-MM)
      const monthIdx = parseInt(row.year_month.substring(5, 7), 10) - 1;
      const key = row.conta_contabil;

      if (!map[scenario]) map[scenario] = {};
      if (!map[scenario][key]) map[scenario][key] = new Array(12).fill(0);
      map[scenario][key][monthIdx] += Number(row.total_amount);
    });

    console.log('🔵 DRE: DataMap criado:', {
      Real: Object.keys(map.Real).length,
      Orçado: Object.keys(map.Orçado).length,
      'A-1': Object.keys(map['A-1']).length
    });

    return map;
  }, [summaryRows]);

  // Construir hierarquia DRE a partir de summaryRows (tag0 → tag01 → conta_contabil)
  const dreStructure = useMemo(() => {
    console.log('🔵 DRE: Construindo hierarquia a partir de summaryRows...');

    const tag0Map = new Map<string, Map<string, Set<string>>>();
    const tag0TypeCount = new Map<string, Record<string, number>>();

    summaryRows.forEach(row => {
      const tag0 = row.tag0 || 'Sem Classificação';
      const tag01 = row.tag01 || 'Sem Subclassificação';
      const conta = row.conta_contabil;

      if (!tag0Map.has(tag0)) tag0Map.set(tag0, new Map());
      const tag01Map = tag0Map.get(tag0)!;
      if (!tag01Map.has(tag01)) tag01Map.set(tag01, new Set());
      tag01Map.get(tag01)!.add(conta);

      if (!tag0TypeCount.has(tag0)) tag0TypeCount.set(tag0, {});
      const counts = tag0TypeCount.get(tag0)!;
      counts[row.tipo] = (counts[row.tipo] || 0) + Number(row.tx_count);
    });

    const data: Record<string, { label: string; type: string; items: Array<{ id: string; nivel_2_label: string; items: string[] }> }> = {};

    const sortedTag0s = Array.from(tag0Map.keys()).sort((a, b) => {
      if (a === 'Sem Classificação') return 1;
      if (b === 'Sem Classificação') return -1;
      return a.localeCompare(b);
    });

    sortedTag0s.forEach((tag0, idx) => {
      const code = String(idx + 1).padStart(2, '0');
      const tag01Map = tag0Map.get(tag0)!;
      const sortedTag01s = Array.from(tag01Map.keys()).sort();

      const counts = tag0TypeCount.get(tag0) || {};
      const predominantType = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'FIXED_COST';

      data[code] = {
        label: tag0,
        type: predominantType,
        items: sortedTag01s.map((tag01, jdx) => ({
          id: `${code}-${jdx}`,
          nivel_2_label: tag01,
          items: Array.from(tag01Map.get(tag01)!).sort()
        }))
      };
    });

    console.log(`✅ DRE: Hierarquia construída - ${sortedTag0s.length} níveis 1 encontrados:`, sortedTag0s);
    return { source: 'data', data };
  }, [summaryRows]);

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

  // getDynamicValues: usa cache de dimensões carregadas do servidor
  // Para o nível de dimensão dinâmica, os dados são pré-carregados via getDREDimension
  const getDynamicValues = (categories: string[], dimensionKey: string, dimensionValue: string, filters: Record<string, string>, scenario: string) => {
    const vals = new Array(12).fill(0);

    // Construir chave do cache (inclui filtros acumulados dos níveis anteriores)
    // Remove a dimensão atual dos filtros para montar a key correta
    const parentFilters = { ...filters };
    delete parentFilters[dimensionKey];
    const filtersKey = Object.entries(parentFilters).sort().map(([k, v]) => `${k}=${v}`).join('&');
    const cacheKey = `${scenario}|${categories.sort().join(',')}|${dimensionKey}|${filtersKey}`;
    const cachedRows = dimensionCache[cacheKey];

    if (cachedRows) {
      cachedRows
        .filter(row => row.dimension_value === dimensionValue)
        .forEach(row => {
          const monthIdx = parseInt(row.year_month.substring(5, 7), 10) - 1;
          vals[monthIdx] += Number(row.total_amount);
        });
    }

    return vals;
  };

  // Função para carregar dados de dimensão sob demanda
  const loadDimensionData = useCallback(async (
    categories: string[],
    dimensionKey: string,
    scenario: string,
    accFilters: Record<string, string> = {}
  ) => {
    // Cache key inclui accumulatedFilters para diferenciar marca QI vs CGS
    const filtersKey = Object.entries(accFilters).sort().map(([k, v]) => `${k}=${v}`).join('&');
    const cacheKey = `${scenario}|${categories.sort().join(',')}|${dimensionKey}|${filtersKey}`;
    if (dimensionCache[cacheKey]) return; // Já carregado

    const monthFrom = `${currentYear}-01`;
    const monthTo = `${currentYear}-12`;

    // Merge filtros do dropdown + filtros acumulados do drill-down
    let mergedMarcas = accFilters.marca
      ? [accFilters.marca]
      : (selectedMarcas.length > 0 ? selectedMarcas : undefined);
    let mergedFiliais = accFilters.nome_filial
      ? [accFilters.nome_filial]
      : (selectedFiliais.length > 0 ? selectedFiliais : undefined);

    // ✅ APLICAR PERMISSÕES: Sempre injetar filtros de permissão
    if (allowedMarcas && allowedMarcas.length > 0) {
      if (mergedMarcas && mergedMarcas.length > 0) {
        mergedMarcas = mergedMarcas.filter(m => allowedMarcas.includes(m));
      } else {
        mergedMarcas = allowedMarcas;
      }
      console.log('🔒 DRE Dimension: Filtro de permissão MARCA aplicado:', mergedMarcas);
    }

    if (allowedFiliais && allowedFiliais.length > 0) {
      if (mergedFiliais && mergedFiliais.length > 0) {
        mergedFiliais = mergedFiliais.filter(f => allowedFiliais.includes(f));
      } else {
        mergedFiliais = allowedFiliais;
      }
      console.log('🔒 DRE Dimension: Filtro de permissão FILIAL aplicado:', mergedFiliais);
    }

    // Se há permissões de TAG01, aplicar
    let mergedTags01 = selectedTags01.length > 0 ? selectedTags01 : undefined;
    if (allowedTag01 && allowedTag01.length > 0) {
      if (mergedTags01 && mergedTags01.length > 0) {
        mergedTags01 = mergedTags01.filter(t => allowedTag01.includes(t));
      } else {
        mergedTags01 = allowedTag01;
      }
      console.log('🔒 DRE Dimension: Filtro de permissão TAG01 aplicado:', mergedTags01);
    }

    const rows = await getDREDimension({
      monthFrom,
      monthTo,
      contaContabils: categories,
      scenario,
      dimension: dimensionKey,
      marcas: mergedMarcas,
      nomeFiliais: mergedFiliais,
      tags01: mergedTags01,
    });

    setDimensionCache(prev => ({ ...prev, [cacheKey]: rows }));
  }, [currentYear, selectedMarcas, selectedFiliais, selectedTags01, allowedMarcas, allowedFiliais, allowedTag01]);

  const renderRow = (
    id: string,
    label: string,
    level: number,
    categories: string[],
    hasChildren: boolean = false,
    accumulatedFilters: Record<string, string> = {}
  ) => {
    const isExpanded = expandedRows[id];

    // Obter valores para todos os cenários
    // level 1-2: dados do summary (getValues), level 3+: drill-down dinâmico
    const scenarioValues: Record<string, number[]> = {
      'Real': level <= 2
        ? getValues('Real', categories)
        : getDynamicValues(categories, dynamicPath[level - 3], label, accumulatedFilters, 'Real'),
      'Orçado': level <= 2
        ? getValues('Orçado', categories)
        : getDynamicValues(categories, dynamicPath[level - 3], label, accumulatedFilters, 'Orçado'),
      'A-1': level <= 2
        ? getValues('A-1', categories)
        : getDynamicValues(categories, dynamicPath[level - 3], label, accumulatedFilters, 'A-1')
    };

    // Calcular YTDs para todos os cenários
    const scenarioYTDs: Record<string, number> = {
      'Real': scenarioValues['Real'].slice(0, selectedMonthEnd + 1).reduce((a, b) => a + b, 0),
      'Orçado': scenarioValues['Orçado'].slice(0, selectedMonthEnd + 1).reduce((a, b) => a + b, 0),
      'A-1': scenarioValues['A-1'].slice(0, selectedMonthEnd + 1).reduce((a, b) => a + b, 0)
    };

    // Manter variáveis legadas para compatibilidade
    const valsReal = scenarioValues['Real'];
    const valsBudget = scenarioValues['Orçado'];
    const valsA1 = scenarioValues['A-1'];
    const ytdReal = scenarioYTDs['Real'];
    const ytdBudget = scenarioYTDs['Orçado'];
    const ytdA1 = scenarioYTDs['A-1'];

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
        <tr className={`${bgClass} transition-all text-[11px] h-8 group`}>
          <td className={`sticky left-0 z-30 ${viewMode === 'scenario' ? 'border-r-2 border-r-gray-300' : ''} shadow-[2px_0_4px_rgba(0,0,0,0.1)] w-[280px] ${level === 1 ? 'bg-[#152e55] group-hover:bg-[#1e3d6e]' : 'bg-inherit group-hover:bg-yellow-100/60'} transition-colors cursor-pointer`}>
            <div className="flex items-center gap-1 px-1.5 overflow-hidden" style={{ paddingLeft }}>
              {hasChildren && (
                <button onClick={() => toggleRow(id)} className={`p-0.5 rounded-none shrink-0 ${level === 1 ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
                  {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                </button>
              )}
              <span className={`truncate ${level === 1 ? 'uppercase tracking-tighter' : ''}`}>{label || 'Não Informado'}</span>
            </div>
          </td>

          {/* Modo: Por Cenário */}
          {viewMode === 'scenario' && activeElements.map((element, elementIndex) => {
            // Verifica se é um cenário ou um delta
            const isScenario = ['Real', 'Orçado', 'A-1'].includes(element);
            const isDelta = element.startsWith('Delta');

            if (isScenario) {
              // Renderizar cenário
              const values = scenarioValues[element];
              const ytd = scenarioYTDs[element];

              const colors = {
                'Real': { text: level === 1 ? 'text-white' : 'text-gray-900', bg: level === 1 ? 'bg-[#1B75BB]' : 'bg-blue-50 text-[#152e55]' },
                'Orçado': { text: level === 1 ? 'text-white' : 'text-gray-600', bg: level === 1 ? 'bg-green-600' : 'bg-green-50 text-green-900' },
                'A-1': { text: level === 1 ? 'text-white' : 'text-gray-600', bg: level === 1 ? 'bg-purple-600' : 'bg-purple-50 text-purple-900' }
              };

              return (
                <React.Fragment key={`element-${element}`}>
                  {/* Colunas mensais do cenário */}
                  {filteredMonthIndices.map((i, idx) => {
                    const isLastMonth = idx === filteredMonthIndices.length - 1;
                    return (
                      <td
                        key={`${element}-${i}`}
                        onDoubleClick={() => onDrillDown({
                          categories,
                          monthIdx: i,
                          scenario: element,
                          filters: {
                            ...accumulatedFilters,
                            ...(selectedTags01.length > 0 ? { tag01: selectedTags01 } : {}),
                            ...(selectedMarcas.length > 0 ? { marca: selectedMarcas } : {}),
                            ...(selectedFiliais.length > 0 ? { nome_filial: selectedFiliais } : {})
                          }
                        })}
                        className={`px-1 text-right font-mono font-bold cursor-pointer hover:bg-yellow-100/60 transition-colors w-[80px] ${colors[element as keyof typeof colors].text} ${isLastMonth ? '' : 'border-r border-gray-100'}`}
                      >
                        {values[i] === 0 ? '-' : Math.round(values[i]).toLocaleString()}
                      </td>
                    );
                  })}

                  {/* Coluna YTD */}
                  <td className={`px-1 text-right font-mono font-black border-l border-gray-300 border-r-2 border-r-gray-300 hover:bg-yellow-200/40 transition-colors w-[100px] ${colors[element as keyof typeof colors].bg}`}>
                    {Math.round(ytd).toLocaleString()}
                  </td>
                </React.Fragment>
              );
            } else if (isDelta) {
              // Renderizar delta
              const baseScenario = 'Real'; // Base sempre Real
              let compareScenario = '';
              const isPercentual = element.includes('Perc');

              if (element === 'DeltaPercOrcado' || element === 'DeltaAbsOrcado') {
                compareScenario = 'Orçado';
              } else if (element === 'DeltaPercA1' || element === 'DeltaAbsA1') {
                compareScenario = 'A-1';
              }

              // Verificar se os dados existem
              if (!compareScenario || !scenarioValues[baseScenario] || !scenarioValues[compareScenario]) {
                return null;
              }

              const baseValues = scenarioValues[baseScenario];
              const compareValues = scenarioValues[compareScenario];
              const baseYTD = scenarioYTDs[baseScenario];
              const compareYTD = scenarioYTDs[compareScenario];

              return (
                <React.Fragment key={`element-${element}`}>
                  {/* Colunas mensais de delta */}
                  {filteredMonthIndices.map((i, idx) => {
                    const baseVal = baseValues[i];
                    const compareVal = compareValues[i];

                    if (isPercentual) {
                      const deltaPerc = compareVal !== 0 ? ((baseVal - compareVal) / Math.abs(compareVal)) * 100 : 0;
                      return (
                        <td key={`${element}-${i}`} className={`px-0.5 text-center font-black text-[11px] w-[70px] ${level === 1 ? 'text-white bg-white/10' : (deltaPerc > 0 ? 'text-emerald-600' : deltaPerc < 0 ? 'text-rose-600' : 'text-gray-400')}`}>
                          {deltaPerc !== 0 ? `${deltaPerc > 0 ? '+' : ''}${deltaPerc.toFixed(0)}%` : '-'}
                        </td>
                      );
                    } else {
                      const deltaAbs = baseVal - compareVal;
                      return (
                        <td key={`${element}-${i}`} className={`px-0.5 text-right font-mono font-bold text-[11px] hover:bg-yellow-50 transition-colors w-[85px] ${level === 1 ? 'text-white bg-white/10' : (deltaAbs > 0 ? 'text-emerald-600' : deltaAbs < 0 ? 'text-rose-600' : 'text-gray-400')}`}>
                          {deltaAbs !== 0 ? `${deltaAbs > 0 ? '+' : ''}${Math.round(deltaAbs).toLocaleString()}` : '-'}
                        </td>
                      );
                    }
                  })}

                  {/* Coluna YTD do delta */}
                  {isPercentual ? (
                    (() => {
                      const deltaPercYTD = compareYTD !== 0 ? ((baseYTD - compareYTD) / Math.abs(compareYTD)) * 100 : 0;
                      const deltaBgColor = element.includes('Orcado') ? 'bg-green-50 text-green-900' : 'bg-purple-50 text-purple-900';
                      return (
                        <td className={`px-1 text-center font-mono font-black border-r-2 border-r-gray-300 hover:bg-yellow-200/40 transition-colors w-[100px] ${level === 1 ? 'bg-white/10 text-white' : deltaBgColor}`}>
                          {deltaPercYTD !== 0 ? `${deltaPercYTD > 0 ? '+' : ''}${deltaPercYTD.toFixed(0)}%` : '-'}
                        </td>
                      );
                    })()
                  ) : (
                    (() => {
                      const deltaAbsYTD = baseYTD - compareYTD;
                      const deltaBgColor = element.includes('Orcado') ? 'bg-green-50 text-green-900' : 'bg-purple-50 text-purple-900';
                      return (
                        <td className={`px-1 text-right font-mono font-black border-r-2 border-r-gray-300 hover:bg-yellow-200/40 transition-colors w-[100px] ${level === 1 ? 'bg-white/10 text-white' : deltaBgColor}`}>
                          {deltaAbsYTD !== 0 ? `${deltaAbsYTD > 0 ? '+' : ''}${Math.round(deltaAbsYTD).toLocaleString()}` : '-'}
                        </td>
                      );
                    })()
                  )}
                </React.Fragment>
              );
            }

            return null;
          })}

          {/* Modo: Por Mês */}
          {viewMode === 'month' && (
            <>
              {filteredMonthIndices.map((monthIdx) => {
                const colors = {
                  'Real': { text: level === 1 ? 'text-white' : 'text-gray-900' },
                  'Orçado': { text: level === 1 ? 'text-white' : 'text-gray-600' },
                  'A-1': { text: level === 1 ? 'text-white' : 'text-gray-600' }
                };

                return (
                  <React.Fragment key={`month-${monthIdx}`}>
                    {activeElements.map((element, elemIdx) => {
                      const isScenario = ['Real', 'Orçado', 'A-1'].includes(element);
                      const isDelta = element.startsWith('Delta');
                      const isFirstOfMonth = elemIdx === 0;
                      const monthSeparator = isFirstOfMonth ? 'border-l-2 border-l-gray-300' : '';

                      if (isScenario) {
                        const values = scenarioValues[element];
                        const value = values[monthIdx];

                        return (
                          <td
                            key={`month-${monthIdx}-${element}`}
                            onDoubleClick={() => onDrillDown({
                              categories,
                              monthIdx,
                              scenario: element,
                              filters: {
                                ...accumulatedFilters,
                                ...(selectedTags01.length > 0 ? { tag01: selectedTags01 } : {}),
                                ...(selectedMarcas.length > 0 ? { marca: selectedMarcas } : {}),
                                ...(selectedFiliais.length > 0 ? { nome_filial: selectedFiliais } : {})
                              }
                            })}
                            className={`px-1 text-right font-mono font-bold cursor-pointer hover:bg-yellow-100/60 transition-colors w-[80px] ${colors[element as keyof typeof colors].text} ${monthSeparator}`}
                          >
                            {value === 0 ? '-' : Math.round(value).toLocaleString()}
                          </td>
                        );
                      } else if (isDelta) {
                        const baseScenario = 'Real';
                        let compareScenario = '';
                        const isPercentual = element.includes('Perc');

                        if (element === 'DeltaPercOrcado' || element === 'DeltaAbsOrcado') {
                          compareScenario = 'Orçado';
                        } else if (element === 'DeltaPercA1' || element === 'DeltaAbsA1') {
                          compareScenario = 'A-1';
                        }

                        // Verificar se os dados existem
                        if (!compareScenario || !scenarioValues[baseScenario] || !scenarioValues[compareScenario]) {
                          return null;
                        }

                        const baseValues = scenarioValues[baseScenario];
                        const compareValues = scenarioValues[compareScenario];
                        const baseVal = baseValues[monthIdx];
                        const compareVal = compareValues[monthIdx];

                        if (isPercentual) {
                          const deltaPerc = compareVal !== 0 ? ((baseVal - compareVal) / Math.abs(compareVal)) * 100 : 0;
                          return (
                            <td key={`month-${monthIdx}-${element}`} className={`px-0.5 text-center font-black text-[10px] w-[70px] ${level === 1 ? 'text-white bg-white/10' : (deltaPerc > 0 ? 'text-emerald-600' : deltaPerc < 0 ? 'text-rose-600' : 'text-gray-400')} ${monthSeparator}`}>
                              {deltaPerc !== 0 ? `${deltaPerc > 0 ? '+' : ''}${deltaPerc.toFixed(0)}%` : '-'}
                            </td>
                          );
                        } else {
                          const deltaAbs = baseVal - compareVal;
                          return (
                            <td key={`month-${monthIdx}-${element}`} className={`px-0.5 text-right font-mono font-bold text-[11px] hover:bg-yellow-50 transition-colors w-[85px] ${level === 1 ? 'text-white bg-white/10' : (deltaAbs > 0 ? 'text-emerald-600' : deltaAbs < 0 ? 'text-rose-600' : 'text-gray-400')} ${monthSeparator}`}>
                              {deltaAbs !== 0 ? `${deltaAbs > 0 ? '+' : ''}${Math.round(deltaAbs).toLocaleString()}` : '-'}
                            </td>
                          );
                        }
                      }

                      return null;
                    })}
                  </React.Fragment>
                );
              })}
              {/* YTDs */}
              {activeElements.map((element, elemIdx) => {
                const isScenario = ['Real', 'Orçado', 'A-1'].includes(element);
                const isDelta = element.startsWith('Delta');
                const isFirstOfYTD = elemIdx === 0;
                const ytdSeparator = isFirstOfYTD ? 'border-l-2 border-l-gray-300' : '';
                const colors = {
                  'Real': { text: level === 1 ? 'text-white' : 'text-gray-900', bg: level === 1 ? 'bg-[#1B75BB]' : 'bg-blue-50 text-[#152e55]' },
                  'Orçado': { text: level === 1 ? 'text-white' : 'text-gray-600', bg: level === 1 ? 'bg-green-600' : 'bg-green-50 text-green-900' },
                  'A-1': { text: level === 1 ? 'text-white' : 'text-gray-600', bg: level === 1 ? 'bg-purple-600' : 'bg-purple-50 text-purple-900' }
                };

                if (isScenario) {
                  const ytd = scenarioYTDs[element];

                  return (
                    <td key={`ytd-${element}`} className={`px-1 text-right font-mono font-black hover:bg-yellow-200/40 transition-colors w-[100px] ${colors[element as keyof typeof colors].bg} ${ytdSeparator}`}>
                      {Math.round(ytd).toLocaleString()}
                    </td>
                  );
                } else if (isDelta) {
                  const baseScenario = 'Real';
                  let compareScenario = '';
                  const isPercentual = element.includes('Perc');

                  if (element === 'DeltaPercOrcado' || element === 'DeltaAbsOrcado') {
                    compareScenario = 'Orçado';
                  } else if (element === 'DeltaPercA1' || element === 'DeltaAbsA1') {
                    compareScenario = 'A-1';
                  }

                  // Verificar se os dados existem
                  if (!compareScenario || !scenarioYTDs[baseScenario] || !scenarioYTDs[compareScenario]) {
                    return null;
                  }

                  const baseYTD = scenarioYTDs[baseScenario];
                  const compareYTD = scenarioYTDs[compareScenario];

                  const deltaBgColor = element.includes('Orcado') ? 'bg-green-50 text-green-900' : 'bg-purple-50 text-purple-900';

                  if (isPercentual) {
                    const deltaPerc = compareYTD !== 0 ? ((baseYTD - compareYTD) / Math.abs(compareYTD)) * 100 : 0;
                    return (
                      <td key={`ytd-${element}`} className={`px-1 text-center font-mono font-black hover:bg-yellow-200/40 transition-colors w-[100px] ${level === 1 ? 'bg-white/10 text-white' : deltaBgColor} ${ytdSeparator}`}>
                        {deltaPerc !== 0 ? `${deltaPerc > 0 ? '+' : ''}${deltaPerc.toFixed(0)}%` : '-'}
                      </td>
                    );
                  } else {
                    const deltaAbs = baseYTD - compareYTD;
                    return (
                      <td key={`ytd-${element}`} className={`px-1 text-right font-mono font-black hover:bg-yellow-200/40 transition-colors w-[100px] ${level === 1 ? 'bg-white/10 text-white' : deltaBgColor} ${ytdSeparator}`}>
                        {deltaAbs !== 0 ? `${deltaAbs > 0 ? '+' : ''}${Math.round(deltaAbs).toLocaleString()}` : '-'}
                      </td>
                    );
                  }
                }

                return null;
              })}
            </>
          )}
        </tr>
        
        {isExpanded && hasChildren && (() => {
          if (level === 1) {
            // Expandir para nível 2 (tag01 groups) a partir de dreStructure
            const nivel1Data = dreStructure.data[id];
            if (!nivel1Data) return null;
            const hasDynamic = dynamicPath.length > 0;

            // Ordenar itens do nível 2 conforme dimensionSort
            let sortedItems = [...nivel1Data.items];
            if (dimensionSort !== 'alpha') {
              sortedItems.sort((a: any, b: any) => {
                const ytdA = getValues('Real', a.items).reduce((s: number, v: number) => s + v, 0);
                const ytdB = getValues('Real', b.items).reduce((s: number, v: number) => s + v, 0);
                return dimensionSort === 'desc'
                  ? Math.abs(ytdB) - Math.abs(ytdA)
                  : Math.abs(ytdA) - Math.abs(ytdB);
              });
            }

            return sortedItems.map((item: any, idx: number) =>
              renderRow(`${id}.${idx}`, item.nivel_2_label, 2, item.items, hasDynamic)
            );
          }

          // Nível 2+: expande para drill-down dinâmico (dimensões selecionadas)
          // dynamicPath[0] = primeira dimensão, dynamicPath[1] = segunda, etc.
          // Para level=2: usa dynamicPath[0], level=3: dynamicPath[1], etc.
          if (level >= 2 && dynamicPath.length > (level - 2)) {
            const dimIndex = level - 2;  // level 2 → index 0, level 3 → index 1, etc.
            const currentDimKey = dynamicPath[dimIndex];

            // Carregar dados de dimensão do servidor (sob demanda)
            // accumulatedFilters contém filtros dos níveis anteriores (ex: { marca: 'QI' })
            const accFiltersKey = Object.entries(accumulatedFilters).sort().map(([k, v]) => `${k}=${v}`).join('&');
            for (const scenario of ['Real', 'Orçado', 'A-1']) {
              const cacheKey = `${scenario}|${categories.sort().join(',')}|${currentDimKey}|${accFiltersKey}`;
              if (!dimensionCache[cacheKey]) {
                loadDimensionData(categories, currentDimKey, scenario, accumulatedFilters);
                return <tr key={`loading-${id}`}><td colSpan={99} className="text-center text-gray-400 text-xs py-2"><Loader2 className="inline w-3 h-3 animate-spin mr-1" />Carregando...</td></tr>;
              }
            }

            // Extrair valores únicos de dimensão do cache
            const allDimensionValues = new Set<string>();
            for (const scenario of ['Real', 'Orçado', 'A-1']) {
              const cacheKey = `${scenario}|${categories.sort().join(',')}|${currentDimKey}|${accFiltersKey}`;
              const cachedRows = dimensionCache[cacheKey] || [];
              cachedRows.forEach(row => allDimensionValues.add(row.dimension_value));
            }

            // Ordenar valores conforme o modo selecionado
            let sortedValues = Array.from(allDimensionValues);
            if (dimensionSort === 'alpha') {
              sortedValues.sort((a, b) => a.localeCompare(b));
            } else {
              // Calcular YTD do cenário Real para ordenar por valor
              const ytdMap = new Map<string, number>();
              const realCacheKey = `Real|${categories.sort().join(',')}|${currentDimKey}|${accFiltersKey}`;
              const realRows = dimensionCache[realCacheKey] || [];
              realRows.forEach(row => {
                ytdMap.set(row.dimension_value, (ytdMap.get(row.dimension_value) || 0) + Number(row.total_amount));
              });
              if (dimensionSort === 'desc') {
                sortedValues.sort((a, b) => Math.abs(ytdMap.get(b) || 0) - Math.abs(ytdMap.get(a) || 0));
              } else {
                sortedValues.sort((a, b) => Math.abs(ytdMap.get(a) || 0) - Math.abs(ytdMap.get(b) || 0));
              }
            }

            return sortedValues.map((val, idx) => {
              const nextId = `${id}-${currentDimKey}-${idx}`;
              const hasMoreLevels = dynamicPath.length > (dimIndex + 1);
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
    // Calcular para todos os cenários
    const calcValues: Record<string, number[]> = {
      'Real': new Array(12).fill(0),
      'Orçado': new Array(12).fill(0),
      'A-1': new Array(12).fill(0)
    };

    const baseReal = getValues('Real', posCategories);
    const baseBudget = getValues('Orçado', posCategories);
    const baseA1 = getValues('A-1', posCategories);

    for (let i = 0; i < 12; i++) {
      calcValues['Real'][i] = baseReal[i];
      calcValues['Orçado'][i] = baseBudget[i];
      calcValues['A-1'][i] = baseA1[i];
      // Custos já são negativos no banco, então SOMAR (não subtrair)
      // Ex: Receita=1.000.000, Custos=-500.000 → EBITDA = 1.000.000 + (-500.000) = 500.000
      negCategories.forEach(cats => {
        const negReal = getValues('Real', cats);
        const negBudget = getValues('Orçado', cats);
        const negA1 = getValues('A-1', cats);
        calcValues['Real'][i] += negReal[i];
        calcValues['Orçado'][i] += negBudget[i];
        calcValues['A-1'][i] += negA1[i];
      });
    }

    // Calcular YTDs
    const calcYTDs: Record<string, number> = {
      'Real': calcValues['Real'].slice(0, selectedMonthEnd + 1).reduce((a, b) => a + b, 0),
      'Orçado': calcValues['Orçado'].slice(0, selectedMonthEnd + 1).reduce((a, b) => a + b, 0),
      'A-1': calcValues['A-1'].slice(0, selectedMonthEnd + 1).reduce((a, b) => a + b, 0)
    };

    // Manter variáveis legadas para compatibilidade
    const calcReal = calcValues['Real'];
    const calcBudget = calcValues['Orçado'];
    const calcA1 = calcValues['A-1'];
    const ytdReal = calcYTDs['Real'];
    const ytdBudget = calcYTDs['Orçado'];
    const ytdA1 = calcYTDs['A-1'];

    const varBudgetPerc = ytdBudget !== 0 ? ((ytdReal - ytdBudget) / Math.abs(ytdBudget)) * 100 : 0;
    const varA1Perc = ytdA1 !== 0 ? ((ytdReal - ytdA1) / Math.abs(ytdA1)) * 100 : 0;

    return (
      <tr className={`${color} text-white text-[11px] font-black h-8 shadow-sm group`}>
        <td className="sticky left-0 bg-inherit z-30 border-r border-white/10 shadow-[2px_0_4px_rgba(0,0,0,0.2)] w-[280px] group-hover:bg-yellow-400 group-hover:text-black transition-colors">
          <div className="flex items-center gap-1.5 px-3 uppercase tracking-tighter truncate font-black">
            <Activity size={12} /> {label}
          </div>
        </td>

        {/* Modo: Por Cenário */}
        {viewMode === 'scenario' && activeElements.map((element, elementIndex) => {
          const isScenario = ['Real', 'Orçado', 'A-1'].includes(element);
          const isDelta = element.startsWith('Delta');

          if (isScenario) {
            const values = calcValues[element];
            const ytd = calcYTDs[element];

            return (
              <React.Fragment key={`calc-scenario-${element}`}>
                {/* Colunas mensais do cenário */}
                {filteredMonthIndices.map((i, idx) => {
                  const isLastMonth = idx === filteredMonthIndices.length - 1;
                  return (
                    <td key={`calc-${element}-${i}`} className={`px-1 text-right font-mono hover:bg-yellow-100/40 transition-colors w-[80px] ${isLastMonth ? '' : 'border-r border-white/5'}`}>
                      {Math.round(values[i]).toLocaleString()}
                    </td>
                  );
                })}

                {/* Coluna YTD */}
                <td className="px-1 text-right font-mono border-l border-white/20 border-r-2 border-r-gray-300 bg-black/10 hover:bg-yellow-200 transition-colors w-[100px]">
                  {Math.round(ytd).toLocaleString()}
                </td>
              </React.Fragment>
            );
          } else if (isDelta) {
            const baseScenario = 'Real';
            let compareScenario = '';
            const isPercentual = element.includes('Perc');

            if (element.includes('Orcado')) {
              compareScenario = 'Orçado';
            } else if (element.includes('A1')) {
              compareScenario = 'A-1';
            }

            // Verificar se os dados existem
            if (!compareScenario || !calcValues[baseScenario] || !calcValues[compareScenario]) {
              return null;
            }

            const baseValues = calcValues[baseScenario];
            const compareValues = calcValues[compareScenario];
            const baseYTD = calcYTDs[baseScenario];
            const compareYTD = calcYTDs[compareScenario];

            return (
              <React.Fragment key={`calc-delta-${element}`}>
                {/* Deltas mensais */}
                {filteredMonthIndices.map((i, idx) => {
                  const baseVal = baseValues[i];
                  const compareVal = compareValues[i];
                  const isLastMonth = idx === filteredMonthIndices.length - 1;

                  if (isPercentual) {
                    const deltaPerc = compareVal !== 0 ? ((baseVal - compareVal) / Math.abs(compareVal)) * 100 : 0;
                    return (
                      <td key={`calc-delta-${element}-${i}`} className={`px-0.5 text-center text-[11px] font-black w-[70px] ${deltaPerc >= 0 ? 'text-emerald-300' : 'text-rose-100'} ${isLastMonth ? '' : 'border-l border-white/10'}`}>
                        {deltaPerc === 0 ? '-' : `${deltaPerc > 0 ? '+' : ''}${deltaPerc.toFixed(0)}%`}
                      </td>
                    );
                  } else {
                    const deltaAbs = baseVal - compareVal;
                    return (
                      <td key={`calc-delta-${element}-${i}`} className={`px-0.5 text-right font-mono text-[11px] font-black w-[85px] ${deltaAbs >= 0 ? 'text-emerald-300' : 'text-rose-100'} ${isLastMonth ? '' : 'border-l border-white/5'}`}>
                        {deltaAbs === 0 ? '-' : `${deltaAbs > 0 ? '+' : ''}${Math.round(deltaAbs).toLocaleString()}`}
                      </td>
                    );
                  }
                })}

                {/* Delta YTD */}
                {isPercentual ? (
                  <td className={`px-0.5 text-center border-l border-white/20 border-r-2 border-r-gray-300 bg-black/10 text-[11px] font-black w-[100px] ${compareYTD !== 0 ? ((baseYTD - compareYTD) / Math.abs(compareYTD)) * 100 >= 0 ? 'text-emerald-300' : 'text-rose-100' : 'text-gray-400'}`}>
                    {compareYTD === 0 ? '-' : `${((baseYTD - compareYTD) / Math.abs(compareYTD)) * 100 > 0 ? '+' : ''}${(((baseYTD - compareYTD) / Math.abs(compareYTD)) * 100).toFixed(0)}%`}
                  </td>
                ) : (
                  <td className={`px-0.5 text-right font-mono border-l border-white/20 border-r-2 border-r-gray-300 bg-black/10 text-[11px] font-black w-[100px] ${(baseYTD - compareYTD) >= 0 ? 'text-emerald-300' : 'text-rose-100'}`}>
                    {(baseYTD - compareYTD) === 0 ? '-' : `${(baseYTD - compareYTD) > 0 ? '+' : ''}${Math.round(baseYTD - compareYTD).toLocaleString()}`}
                  </td>
                )}
              </React.Fragment>
            );
          }

          return null;
        })}

        {/* Modo: Por Mês */}
        {viewMode === 'month' && (
          <>
            {filteredMonthIndices.map((monthIdx) => {
              return (
                <React.Fragment key={`calc-month-${monthIdx}`}>
                  {activeElements.map((element, elemIdx) => {
                    const isScenario = ['Real', 'Orçado', 'A-1'].includes(element);
                    const isDelta = element.startsWith('Delta');
                    const isFirstOfMonth = elemIdx === 0;
                    const monthSeparator = isFirstOfMonth ? 'border-l-2 border-l-white/30' : '';

                    if (isScenario) {
                      const values = calcValues[element];
                      const value = values[monthIdx];

                      return (
                        <td
                          key={`calc-month-${monthIdx}-${element}`}
                          className={`px-1 text-right font-mono hover:bg-yellow-100/40 transition-colors w-[80px] ${monthSeparator}`}
                        >
                          {Math.round(value).toLocaleString()}
                        </td>
                      );
                    } else if (isDelta) {
                      const baseScenario = 'Real';
                      let compareScenario = '';
                      const isPercentual = element.includes('Perc');

                      if (element.includes('Orcado')) {
                        compareScenario = 'Orçado';
                      } else if (element.includes('A1')) {
                        compareScenario = 'A-1';
                      }

                      // Verificar se os dados existem
                      if (!compareScenario || !calcValues[baseScenario] || !calcValues[compareScenario]) {
                        return null;
                      }

                      const baseValues = calcValues[baseScenario];
                      const compareValues = calcValues[compareScenario];
                      const baseVal = baseValues[monthIdx];
                      const compareVal = compareValues[monthIdx];

                      if (isPercentual) {
                        const deltaPerc = compareVal !== 0 ? ((baseVal - compareVal) / Math.abs(compareVal)) * 100 : 0;
                        return (
                          <td key={`calc-month-${monthIdx}-${element}`} className={`px-0.5 text-center text-[11px] font-black w-[70px] ${deltaPerc >= 0 ? 'text-emerald-300' : 'text-rose-100'} ${monthSeparator}`}>
                            {deltaPerc === 0 ? '-' : `${deltaPerc > 0 ? '+' : ''}${deltaPerc.toFixed(0)}%`}
                          </td>
                        );
                      } else {
                        const deltaAbs = baseVal - compareVal;
                        return (
                          <td key={`calc-month-${monthIdx}-${element}`} className={`px-0.5 text-right font-mono text-[11px] font-black w-[85px] ${deltaAbs >= 0 ? 'text-emerald-300' : 'text-rose-100'} ${monthSeparator}`}>
                            {deltaAbs === 0 ? '-' : `${deltaAbs > 0 ? '+' : ''}${Math.round(deltaAbs).toLocaleString()}`}
                          </td>
                        );
                      }
                    }

                    return null;
                  })}
                </React.Fragment>
              );
            })}
            {/* YTDs */}
            {activeElements.map((element, elemIdx) => {
              const isScenario = ['Real', 'Orçado', 'A-1'].includes(element);
              const isDelta = element.startsWith('Delta');
              const isFirstOfYTD = elemIdx === 0;
              const ytdSeparator = isFirstOfYTD ? 'border-l-2 border-l-white/30' : 'border-l border-white/20';

              if (isScenario) {
                const ytd = calcYTDs[element];

                return (
                  <td key={`calc-ytd-${element}`} className={`px-1 text-right font-mono ${ytdSeparator} bg-black/10 hover:bg-yellow-200 transition-colors w-[100px]`}>
                    {Math.round(ytd).toLocaleString()}
                  </td>
                );
              } else if (isDelta) {
                const baseScenario = 'Real';
                let compareScenario = '';
                const isPercentual = element.includes('Perc');

                if (element.includes('Orcado')) {
                  compareScenario = 'Orçado';
                } else if (element.includes('A1')) {
                  compareScenario = 'A-1';
                }

                // Verificar se os dados existem
                if (!compareScenario || !calcYTDs[baseScenario] || !calcYTDs[compareScenario]) {
                  return null;
                }

                const baseYTD = calcYTDs[baseScenario];
                const compareYTD = calcYTDs[compareScenario];

                if (isPercentual) {
                  const deltaPerc = compareYTD !== 0 ? ((baseYTD - compareYTD) / Math.abs(compareYTD)) * 100 : 0;
                  return (
                    <td key={`calc-ytd-${element}`} className={`px-0.5 text-center ${ytdSeparator} bg-black/10 text-[10px] font-black w-[100px] ${deltaPerc >= 0 ? 'text-emerald-300' : 'text-rose-100'}`}>
                      {deltaPerc === 0 ? '-' : `${deltaPerc > 0 ? '+' : ''}${deltaPerc.toFixed(0)}%`}
                    </td>
                  );
                } else {
                  const deltaAbs = baseYTD - compareYTD;
                  return (
                    <td key={`calc-ytd-${element}`} className={`px-0.5 text-right font-mono ${ytdSeparator} bg-black/10 text-[10px] font-black w-[100px] ${deltaAbs >= 0 ? 'text-emerald-300' : 'text-rose-100'}`}>
                      {deltaAbs === 0 ? '-' : `${deltaAbs > 0 ? '+' : ''}${Math.round(deltaAbs).toLocaleString()}`}
                    </td>
                  );
                }
              }

              return null;
            })}
          </>
        )}
      </tr>
    );
  };

  const getSummary = (selected: string[], all: string[], labelPlural: string) => {
    const feminino = labelPlural.endsWith('AS'); // MARCAS, FILIAIS → feminino
    if (selected.length === 0) return `${feminino ? 'TODAS AS' : 'TODOS OS'} ${labelPlural}`;
    if (selected.length === all.length) return `${feminino ? 'TODAS SELECIONADAS' : 'TODOS SELECIONADOS'}`;
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
          className={`flex items-center gap-3 bg-white px-3 md:px-4 py-2.5 rounded-2xl border-2 transition-all min-w-[160px] md:min-w-[200px] shadow-sm hover:shadow-md ${isOpen ? `border-${color} ring-4 ring-${color}/10` : isActive ? 'border-yellow-400 bg-yellow-50 shadow-yellow-100/50' : 'border-gray-100'}`}
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
    <div className="space-y-2 animate-in fade-in duration-500 pb-2">
      <header className="flex flex-col 2xl:flex-row justify-between items-start 2xl:items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-[#152e55] text-white p-2 rounded-xl shadow-lg shadow-blue-50/50">
            <TableIcon size={18} />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900 leading-tight">Análise de Resultado Estrutural</h2>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">DRE • Filtros Inteligentes de Grupo</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botão de Limpar Filtros */}
          {hasAnyFilterActive && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1.5 bg-rose-50 text-rose-600 px-3 py-1.5 rounded-xl border border-rose-100 font-black text-[8px] uppercase tracking-widest hover:bg-rose-100 transition-all shadow-sm"
            >
              <FilterX size={14} /> Limpar Filtros
            </button>
          )}

          {/* Botão Atualizar DRE */}
          <button
            onClick={fetchDREData}
            disabled={isLoadingDRE}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-black text-[8px] uppercase tracking-widest shadow-sm"
            title="Forçar atualização dos dados da DRE"
          >
            {isLoadingDRE ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Atualizando...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Atualizar DRE</span>
              </>
            )}
          </button>

          {/* Dropdown de Pacotes */}
          <MultiSelectDropdown
            label="Pacotes"
            summary={getSummary(selectedTags01, filterOptions.tags01, "PACOTES")}
            isOpen={isTagFilterOpen}
            setOpen={setIsTagFilterOpen}
            options={filterOptions.tags01}
            selected={selectedTags01}
            toggle={(opt: string) => toggleFilter(selectedTags01, setSelectedTags01, opt)}
            allSelect={() => selectAll(selectedTags01, setSelectedTags01, filterOptions.tags01)}
            icon={Filter}
            color="[#1B75BB]"
            refObj={tagRef}
          />

          {/* Dropdown de Marca */}
          <MultiSelectDropdown
            label="Marca"
            summary={getSummary(selectedMarcas, availableBrands, "MARCAS")}
            isOpen={isBrandFilterOpen}
            setOpen={setIsBrandFilterOpen}
            options={availableBrands}
            selected={selectedMarcas}
            toggle={(opt: string) => {
              toggleFilter(selectedMarcas, setSelectedMarcas, opt);
              setSelectedFiliais([]);
            }}
            allSelect={() => {
              selectAll(selectedMarcas, setSelectedMarcas, availableBrands);
              setSelectedFiliais([]);
            }}
            icon={Flag}
            color="[#1B75BB]"
            refObj={brandRef}
          />

          {/* Dropdown de Filial */}
          <MultiSelectDropdown
            label="Filial"
            summary={getSummary(selectedFiliais, availableBranches, "FILIAIS")}
            isOpen={isBranchFilterOpen}
            setOpen={setIsBranchFilterOpen}
            options={availableBranches}
            selected={selectedFiliais}
            toggle={(opt: string) => toggleFilter(selectedFiliais, setSelectedFiliais, opt)}
            allSelect={() => selectAll(selectedFiliais, setSelectedFiliais, availableBranches)}
            icon={Building2}
            color="[#F44C00]"
            refObj={branchRef}
          />

          <div className="h-8 w-px bg-gray-200 mx-1 hidden 2xl:block" />

          {/* Controles de Período */}
          <div className="flex items-center gap-1.5">
            {/* Atalhos rápidos */}
            <div className="flex gap-1">
              <button
                onClick={() => { setSelectedMonthStart(0); setSelectedMonthEnd(11); }}
                className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded transition-all ${
                  selectedMonthStart === 0 && selectedMonthEnd === 11
                    ? 'bg-[#1B75BB] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Ano completo"
              >
                Ano
              </button>
              <button
                onClick={() => { setSelectedMonthStart(0); setSelectedMonthEnd(2); }}
                className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded transition-all ${
                  selectedMonthStart === 0 && selectedMonthEnd === 2
                    ? 'bg-[#1B75BB] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="1º Trimestre"
              >
                1T
              </button>
              <button
                onClick={() => { setSelectedMonthStart(3); setSelectedMonthEnd(5); }}
                className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded transition-all ${
                  selectedMonthStart === 3 && selectedMonthEnd === 5
                    ? 'bg-[#1B75BB] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="2º Trimestre"
              >
                2T
              </button>
              <button
                onClick={() => { setSelectedMonthStart(6); setSelectedMonthEnd(8); }}
                className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded transition-all ${
                  selectedMonthStart === 6 && selectedMonthEnd === 8
                    ? 'bg-[#1B75BB] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="3º Trimestre"
              >
                3T
              </button>
              <button
                onClick={() => { setSelectedMonthStart(9); setSelectedMonthEnd(11); }}
                className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded transition-all ${
                  selectedMonthStart === 9 && selectedMonthEnd === 11
                    ? 'bg-[#1B75BB] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="4º Trimestre"
              >
                4T
              </button>
            </div>

            {/* Seletores de mês */}
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-2 py-1 rounded-lg shadow-sm">
              <Calendar size={12} className="text-[#F44C00]" />
              <div className="flex items-center gap-1">
                <select
                  className="bg-transparent text-[10px] font-bold text-gray-900 outline-none cursor-pointer"
                  value={selectedMonthStart}
                  onChange={(e) => {
                    const newStart = parseInt(e.target.value);
                    setSelectedMonthStart(newStart);
                    if (selectedMonthEnd < newStart) {
                      setSelectedMonthEnd(newStart);
                    }
                  }}
                >
                  {months.map((m, idx) => (
                    <option key={m} value={idx}>{m}</option>
                  ))}
                </select>
                <span className="text-[9px] text-gray-400 font-bold">até</span>
                <select
                  className="bg-transparent text-[10px] font-bold text-gray-900 outline-none cursor-pointer"
                  value={selectedMonthEnd}
                  onChange={(e) => {
                    const newEnd = parseInt(e.target.value);
                    setSelectedMonthEnd(newEnd);
                    if (selectedMonthStart > newEnd) {
                      setSelectedMonthStart(newEnd);
                    }
                  }}
                >
                  {months.map((m, idx) => (
                    <option key={m} value={idx}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Painel de Seleção de Colunas Visíveis */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-3 py-2 rounded-xl border border-blue-100 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          {/* Título */}
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded-lg bg-blue-500 text-white">
              <TableIcon size={12} />
            </div>
            <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-tight">Colunas Visíveis</h3>
          </div>

          {/* Cards em linha horizontal */}
          <div className="flex items-center gap-1.5">
            {/* Real */}
            <button
              onClick={() => toggleElement('Real', showReal, setShowReal)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border-2 transition-all ${
                showReal
                  ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {showReal ? <CheckSquare size={10} strokeWidth={3} /> : <Square size={10} strokeWidth={3} />}
              <span className="text-[9px] font-black uppercase">Real</span>
              {showReal && activeElements.indexOf('Real') >= 0 && (
                <span className="ml-1 bg-white/30 px-1 rounded text-[8px]">{activeElements.indexOf('Real') + 1}º</span>
              )}
            </button>

            {/* Orçado */}
            <button
              onClick={() => toggleElement('Orçado', showOrcado, setShowOrcado)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border-2 transition-all ${
                showOrcado
                  ? 'bg-green-500 text-white border-green-500 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
              }`}
            >
              {showOrcado ? <CheckSquare size={12} strokeWidth={3} /> : <Square size={12} strokeWidth={3} />}
              <span className="text-[10px] font-black uppercase">Orçado</span>
              {showOrcado && activeElements.indexOf('Orçado') >= 0 && (
                <span className="ml-1 bg-white/30 px-1 rounded text-[8px]">{activeElements.indexOf('Orçado') + 1}º</span>
              )}
            </button>

            {/* A-1 */}
            <button
              onClick={() => toggleElement('A-1', showA1, setShowA1)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border-2 transition-all ${
                showA1
                  ? 'bg-purple-500 text-white border-purple-500 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
              }`}
            >
              {showA1 ? <CheckSquare size={12} strokeWidth={3} /> : <Square size={12} strokeWidth={3} />}
              <span className="text-[10px] font-black uppercase">A-1</span>
              {showA1 && activeElements.indexOf('A-1') >= 0 && (
                <span className="ml-1 bg-white/30 px-1 rounded text-[8px]">{activeElements.indexOf('A-1') + 1}º</span>
              )}
            </button>

            {/* Δ % vs Orçado */}
            <button
              onClick={() => toggleElement('DeltaPercOrcado', showDeltaPercOrcado, setShowDeltaPercOrcado)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border-2 transition-all ${
                showDeltaPercOrcado
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
              }`}
              title="Variação % vs Orçado"
            >
              {showDeltaPercOrcado ? <CheckSquare size={12} strokeWidth={3} /> : <Square size={12} strokeWidth={3} />}
              <span className="text-[9px] font-black uppercase">Δ% Orç</span>
              {showDeltaPercOrcado && activeElements.indexOf('DeltaPercOrcado') >= 0 && (
                <span className="ml-1 bg-white/30 px-1 rounded text-[8px]">{activeElements.indexOf('DeltaPercOrcado') + 1}º</span>
              )}
            </button>

            {/* Δ % vs A-1 */}
            <button
              onClick={() => toggleElement('DeltaPercA1', showDeltaPercA1, setShowDeltaPercA1)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border-2 transition-all ${
                showDeltaPercA1
                  ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-400'
              }`}
              title="Variação % vs A-1"
            >
              {showDeltaPercA1 ? <CheckSquare size={12} strokeWidth={3} /> : <Square size={12} strokeWidth={3} />}
              <span className="text-[9px] font-black uppercase">Δ% A-1</span>
              {showDeltaPercA1 && activeElements.indexOf('DeltaPercA1') >= 0 && (
                <span className="ml-1 bg-white/30 px-1 rounded text-[8px]">{activeElements.indexOf('DeltaPercA1') + 1}º</span>
              )}
            </button>

            {/* Δ R$ vs Orçado */}
            <button
              onClick={() => toggleElement('DeltaAbsOrcado', showDeltaAbsOrcado, setShowDeltaAbsOrcado)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border-2 transition-all ${
                showDeltaAbsOrcado
                  ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'
              }`}
              title="Variação R$ vs Orçado"
            >
              {showDeltaAbsOrcado ? <CheckSquare size={12} strokeWidth={3} /> : <Square size={12} strokeWidth={3} />}
              <span className="text-[9px] font-black uppercase">ΔR$ Orç</span>
              {showDeltaAbsOrcado && activeElements.indexOf('DeltaAbsOrcado') >= 0 && (
                <span className="ml-1 bg-white/30 px-1 rounded text-[8px]">{activeElements.indexOf('DeltaAbsOrcado') + 1}º</span>
              )}
            </button>

            {/* Δ R$ vs A-1 */}
            <button
              onClick={() => toggleElement('DeltaAbsA1', showDeltaAbsA1, setShowDeltaAbsA1)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border-2 transition-all ${
                showDeltaAbsA1
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-rose-400'
              }`}
              title="Variação R$ vs A-1"
            >
              {showDeltaAbsA1 ? <CheckSquare size={12} strokeWidth={3} /> : <Square size={12} strokeWidth={3} />}
              <span className="text-[9px] font-black uppercase">ΔR$ A-1</span>
              {showDeltaAbsA1 && activeElements.indexOf('DeltaAbsA1') >= 0 && (
                <span className="ml-1 bg-white/30 px-1 rounded text-[8px]">{activeElements.indexOf('DeltaAbsA1') + 1}º</span>
              )}
            </button>

            {/* Separador */}
            <div className="h-8 w-px bg-gray-300" />

            {/* Toggle visualização: Por Cenário vs Por Mês */}
            <button
              onClick={() => setViewMode(viewMode === 'scenario' ? 'month' : 'scenario')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-all"
              title="Alternar entre visualização por cenário ou por mês"
            >
              <ArrowLeftRight size={14} className="text-indigo-600" />
              <span className="text-[10px] font-black uppercase text-indigo-900">
                {viewMode === 'scenario' ? 'Por Cenário' : 'Por Mês'}
              </span>
            </button>

            {/* Aviso compacto */}
            {!showReal && !showOrcado && !showA1 && (
              <span className="text-[9px] font-bold text-yellow-800 bg-yellow-50 px-2 py-1 rounded">⚠️ Selecione ao menos 1 cenário</span>
            )}
          </div>
        </div>
      </div>

      {/* Seção de Níveis Analíticos Dinâmicos */}
      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
        <div className={`p-1.5 rounded-lg transition-colors ${dynamicPath.length > 0 ? 'bg-[#F44C00] text-white' : 'bg-gray-50 text-gray-400'}`}>
          <Layers size={14} />
        </div>
        <div className="flex flex-col pr-3 mr-2 border-r border-gray-100 shrink-0">
          <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Drill-down Profundo</span>
          <span className="text-[9px] font-black text-gray-900 uppercase">Níveis 4 a 8</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {DRE_DIMENSIONS.map(dim => {
            const index = dynamicPath.indexOf(dim.id);
            const isActive = index !== -1;
            return (
              <button
                key={dim.id}
                onClick={() => toggleDimension(dim.id)}
                className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase transition-all flex items-center gap-1.5 border ${
                  isActive
                    ? 'bg-[#F44C00] text-white border-[#F44C00] shadow-sm'
                    : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'
                }`}
              >
                {isActive && <span className="bg-white/20 px-0.5 rounded text-[7px]">{index + 1}º</span>}
                {dim.label}
              </button>
            );
          })}
          <div className="h-5 w-px bg-gray-200 mx-0.5" />
          <button
            onClick={() => setDimensionSort(prev => prev === 'desc' ? 'asc' : prev === 'asc' ? 'alpha' : 'desc')}
            className="px-2 py-1 rounded-lg text-[8px] font-black uppercase transition-all flex items-center gap-1 border bg-[#1B75BB] text-white border-[#1B75BB] shadow-sm"
            title={dimensionSort === 'desc' ? 'Maior → Menor' : dimensionSort === 'asc' ? 'Menor → Maior' : 'Alfabético (A-Z)'}
          >
            {dimensionSort === 'desc' && <><ArrowDown10 size={11} /> Maior→Menor</>}
            {dimensionSort === 'asc' && <><ArrowUp10 size={11} /> Menor→Maior</>}
            {dimensionSort === 'alpha' && <><ArrowDownAZ size={11} /> A-Z</>}
          </button>
          {dynamicPath.length > 0 && (
            <button onClick={() => setDynamicPath([])} className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg ml-0.5">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-none border border-gray-100 shadow-2xl overflow-hidden relative">
        {/* Loading overlay */}
        {isLoadingDRE && (
          <div className="absolute inset-0 bg-white/80 z-[100] flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#1B75BB] mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-600">Carregando DRE...</p>
              <p className="text-xs text-gray-400">Agregando dados no servidor</p>
            </div>
          </div>
        )}
        <div className="overflow-x-scroll max-h-[calc(100vh-260px)] overflow-y-auto dre-scrollbar">
          <table className="border-separate border-spacing-0 text-left table-fixed">
            <thead className="sticky top-0 z-50">
              <tr className="bg-[#152e55] text-white h-7">
                <th rowSpan={2} className={`sticky left-0 z-[60] bg-[#152e55] px-3 py-1 text-[9px] font-black uppercase ${viewMode === 'scenario' ? 'border-r-2 border-r-gray-300' : ''} w-[280px]`}>Contas Gerenciais</th>

                {/* Modo: Por Cenário */}
                {viewMode === 'scenario' && activeElements.map((element) => {
                  const isScenario = ['Real', 'Orçado', 'A-1'].includes(element);
                  const isDelta = element.startsWith('Delta');

                  if (isScenario) {
                    const scenarioLabels = {
                      'Real': 'REAL',
                      'Orçado': 'ORÇADO',
                      'A-1': 'A-1'
                    };

                    const scenarioColors = {
                      'Real': '#1B75BB',
                      'Orçado': '#16a34a',
                      'A-1': '#9333ea'
                    };

                    return (
                      <React.Fragment key={`header-${element}`}>
                        {/* Colunas do cenário */}
                        <th colSpan={filteredMonths.length} className="px-1.5 py-0.5 text-center text-[9px] font-black border-b border-white/10 uppercase tracking-widest" style={{ backgroundColor: scenarioColors[element as keyof typeof scenarioColors] }}>
                          Evolução Mensal ({scenarioLabels[element as keyof typeof scenarioLabels]})
                        </th>
                        <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-black border-l border-white/20 border-r-2 border-r-gray-300 w-[100px]" style={{ backgroundColor: scenarioColors[element as keyof typeof scenarioColors] }}>
                          YTD {scenarioLabels[element as keyof typeof scenarioLabels]}
                        </th>
                      </React.Fragment>
                    );
                  } else if (isDelta) {
                    const isPercentual = element.includes('Perc');
                    let compareLabel = '';
                    let deltaColor = '#22c55e';

                    if (element.includes('Orcado')) {
                      compareLabel = 'Or';
                      deltaColor = '#22c55e';
                    } else if (element.includes('A1')) {
                      compareLabel = 'A-1';
                      deltaColor = '#a855f7';
                    }

                    return (
                      <React.Fragment key={`header-${element}`}>
                        <th colSpan={filteredMonths.length} className="px-1.5 py-0.5 text-center text-[9px] font-black border-b border-white/10 uppercase tracking-widest" style={{ backgroundColor: deltaColor }}>
                          Δ{compareLabel} {isPercentual ? '%' : 'R$'} (Mensal)
                        </th>
                        <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-black border-l border-white/20 border-r-2 border-r-gray-300 w-[100px]" style={{ backgroundColor: deltaColor }}>
                          YTD Δ{compareLabel}
                        </th>
                      </React.Fragment>
                    );
                  }

                  return null;
                })}

                {/* Modo: Por Mês */}
                {viewMode === 'month' && (
                  <>
                    {filteredMonths.map((month, monthIndex) => {
                      const monthIdx = selectedMonthStart + monthIndex;
                      return (
                        <React.Fragment key={`month-header-${month}`}>
                          {/* Cada mês tem colunas para todos os elementos ativos */}
                          <th colSpan={activeElements.length} className={`px-1.5 py-0.5 text-center text-[9px] font-black border-b border-white/10 uppercase tracking-widest bg-[#1B75BB] border-l-2 border-l-gray-300`}>
                            {month} / 2024
                          </th>
                        </React.Fragment>
                      );
                    })}
                    {/* Coluna YTD Total */}
                    <th colSpan={activeElements.length} className="px-1.5 py-0.5 text-center text-[9px] font-black border-b border-white/10 border-l-2 border-l-gray-300 uppercase tracking-widest bg-[#152e55]">
                      YTD Total
                    </th>
                  </>
                )}
              </tr>
              <tr className="bg-[#1B75BB] text-white h-5">
                {/* Segunda linha do header com os meses */}
                {viewMode === 'scenario' && activeElements.map((element) => {
                  const isScenario = ['Real', 'Orçado', 'A-1'].includes(element);
                  const isDelta = element.startsWith('Delta');

                  if (isScenario) {
                    const scenarioColors = {
                      'Real': '#1B75BB',
                      'Orçado': '#16a34a',
                      'A-1': '#9333ea'
                    };

                    return (
                      <React.Fragment key={`months-${element}`}>
                        {/* Meses do cenário */}
                        {filteredMonths.map((m, idx) => {
                          const isLastMonth = idx === filteredMonths.length - 1;
                          return (
                            <th key={`${element}-${m}`} className={`px-1 py-1 text-center text-[9px] font-black w-[80px] ${isLastMonth ? '' : 'border-r border-white/5'}`} style={{ backgroundColor: scenarioColors[element as keyof typeof scenarioColors] }}>
                              {m}
                            </th>
                          );
                        })}
                      </React.Fragment>
                    );
                  } else if (isDelta) {
                    const isPercentual = element.includes('Perc');
                    let deltaColor = '#22c55e';

                    if (element.includes('Orcado')) {
                      deltaColor = '#22c55e';
                    } else if (element.includes('A1')) {
                      deltaColor = '#a855f7';
                    }

                    const colWidth = isPercentual ? 'w-[70px]' : 'w-[85px]';
                    return (
                      <React.Fragment key={`months-${element}`}>
                        {/* Meses das colunas delta */}
                        {filteredMonths.map((m, idx) => {
                          const isLastMonth = idx === filteredMonths.length - 1;
                          return (
                            <th key={`${element}-${m}`} className={`px-1 py-1 text-center text-[9px] font-black ${colWidth} ${isLastMonth ? '' : 'border-r border-white/5'}`} style={{ backgroundColor: deltaColor }}>
                              {m}
                            </th>
                          );
                        })}
                      </React.Fragment>
                    );
                  }

                  return null;
                })}

                {/* Segunda linha para modo por mês: cenários dentro de cada mês */}
                {viewMode === 'month' && (
                  <>
                    {filteredMonths.map((month, monthIndex) => {
                      const scenarioColors = {
                        'Real': '#1B75BB',
                        'Orçado': '#16a34a',
                        'A-1': '#9333ea'
                      };

                      const scenarioLabels = {
                        'Real': 'Real',
                        'Orçado': 'Orç',
                        'A-1': 'A-1'
                      };

                      return (
                        <React.Fragment key={`month-scenarios-${month}`}>
                          {activeElements.map((element, elemIdx) => {
                            const isScenario = ['Real', 'Orçado', 'A-1'].includes(element);
                            const isFirstOfMonth = elemIdx === 0;
                            const borderClass = isFirstOfMonth ? 'border-l-2 border-l-gray-300' : '';

                            if (isScenario) {
                              return (
                                <th key={`${month}-${element}`} className={`px-1 py-1 text-center text-[9px] font-black w-[80px] ${borderClass}`} style={{ backgroundColor: '#1B75BB' }}>
                                  {scenarioLabels[element as keyof typeof scenarioLabels]}
                                </th>
                              );
                            } else {
                              const isPercentual = element.includes('Perc');
                              const compareLabel = element.includes('Orcado') ? 'ΔOrç' : 'ΔA1';
                              const colWidth = isPercentual ? 'w-[70px]' : 'w-[85px]';
                              return (
                                <th key={`${month}-${element}`} className={`px-1 py-1 text-center text-[9px] font-black ${colWidth} ${borderClass}`} style={{ backgroundColor: '#1B75BB' }}>
                                  {compareLabel}{isPercentual ? '%' : 'R$'}
                                </th>
                              );
                            }
                          })}
                        </React.Fragment>
                      );
                    })}
                    {/* YTDs */}
                    {activeElements.map((element, elemIdx) => {
                      const isScenario = ['Real', 'Orçado', 'A-1'].includes(element);
                      const isFirstOfYTD = elemIdx === 0;
                      const borderClass = isFirstOfYTD ? 'border-l-2 border-l-gray-300' : '';

                      if (isScenario) {
                        const scenarioLabels = {
                          'Real': 'Real',
                          'Orçado': 'Orç',
                          'A-1': 'A-1'
                        };

                        return (
                          <th key={`ytd-${element}`} className={`px-1 py-1 text-center text-[9px] font-black border-r border-white/5 bg-[#152e55] w-[100px] ${borderClass}`}>
                            {scenarioLabels[element as keyof typeof scenarioLabels]}
                          </th>
                        );
                      } else {
                        const isPercentual = element.includes('Perc');
                        const compareLabel = element.includes('Orcado') ? 'ΔOrç' : 'ΔA1';
                        const colWidth = 'w-[100px]';

                        return (
                          <th key={`ytd-${element}`} className={`px-1 py-1 text-center text-[9px] font-black border-r border-white/5 ${colWidth} ${borderClass}`} style={{ backgroundColor: '#152e55' }}>
                            {compareLabel}{isPercentual ? '%' : 'R$'}
                          </th>
                        );
                      }
                    })}
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white">
              {/* Renderização dinâmica da hierarquia DRE baseada em tag0/tag01 */}
              {(() => {
                // Filtrar apenas grupos que compõem o EBITDA: 01 (Receita), 02 (CV), 03 (CF), 04 (SG&A)
                const ebitdaPrefixes = ['01.', '02.', '03.', '04.'];
                const entries = Object.entries(dreStructure.data)
                  .filter(([, nivel1Data]) => ebitdaPrefixes.some(p => nivel1Data.label.startsWith(p)))
                  .sort(([a], [b]) => a.localeCompare(b));

                // Classificar grupos pelo prefixo do tag0 (ex: "01." = receita, "02."/"03." = custos diretos)
                const revenueCategories: string[] = [];        // 01.* = Receita
                const variableCostCategories: string[] = [];   // 02.* = Custos Variáveis
                const fixedCostCategories: string[] = [];      // 03.* = Custos Fixos
                const allCostCategories: string[][] = [];      // Todos os custos (para EBITDA)

                entries.forEach(([, nivel1Data]) => {
                  const allCats = nivel1Data.items.flatMap((item: any) => item.items);
                  const label = nivel1Data.label;

                  if (label.startsWith('01.')) {
                    revenueCategories.push(...allCats);
                  } else {
                    allCostCategories.push(allCats);
                    if (label.startsWith('02.')) {
                      variableCostCategories.push(...allCats);
                    } else if (label.startsWith('03.')) {
                      fixedCostCategories.push(...allCats);
                    }
                  }
                });

                // Encontrar o índice após "03. CUSTOS FIXOS" para inserir MARGEM
                const margemAfterIdx = entries.findIndex(([, d]) => d.label.startsWith('03.'));

                return (
                  <>
                    {entries.map(([nivel1Code, nivel1Data], entryIdx) => {
                      const allCategories = nivel1Data.items.flatMap((item: any) => item.items);

                      return (
                        <React.Fragment key={nivel1Code}>
                          {renderRow(nivel1Code, nivel1Data.label, 1, allCategories, true)}

                          {/* MARGEM DE CONTRIBUIÇÃO: Receita - (Custos Var + Custos Fix), após grupo 03 */}
                          {entryIdx === margemAfterIdx && margemAfterIdx >= 0 && revenueCategories.length > 0 && renderCalculationLine(
                            '05. MARGEM DE CONTRIBUIÇÃO',
                            revenueCategories,
                            [variableCostCategories, fixedCostCategories].filter(c => c.length > 0),
                            'bg-[#F44C00]'
                          )}
                        </React.Fragment>
                      );
                    })}

                    {/* EBITDA: Receita - todos os custos */}
                    {revenueCategories.length > 0 && allCostCategories.length > 0 && renderCalculationLine(
                      'EBITDA OPERACIONAL',
                      revenueCategories,
                      allCostCategories,
                      'bg-[#152e55]'
                    )}
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        <div className="bg-blue-50 border border-blue-100 p-2 rounded-xl flex items-start gap-2 shadow-sm">
          <div className="bg-white p-1.5 rounded-lg shadow-sm text-[#152e55]">
            <Building2 size={14} />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-[9px] font-black text-blue-900 uppercase tracking-wider">Filtragem Multidimensional</h4>
            <p className="text-[8px] font-medium text-blue-800 leading-snug">
              Agora você pode cruzar marcas e unidades simultaneamente com indicações visuais amarelas para seleções ativas.
            </p>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-100 p-2 rounded-xl flex items-start gap-2 shadow-sm">
          <div className="bg-white p-1.5 rounded-lg shadow-sm text-[#F44C00]">
            <TrendingUpDown size={14} />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-[9px] font-black text-orange-900 uppercase tracking-wider">Consolidação em Tempo Real</h4>
            <p className="text-[8px] font-medium text-orange-800 leading-snug">
              O sistema recalcula orçamentos (Budget) e realizados de anos anteriores (A-1) para qualquer combinação de filtros selecionada.
            </p>
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-xl flex items-start gap-2 shadow-sm md:col-span-2 lg:col-span-1">
          <div className="bg-white p-1.5 rounded-lg shadow-sm text-emerald-600">
            <CheckSquare size={14} />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-[9px] font-black text-emerald-900 uppercase tracking-wider">Destaques Analíticos</h4>
            <p className="text-[8px] font-medium text-emerald-800 leading-snug">
              Explore os dados com o mouse para destacar células e identificar desvios rapidamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DREView;
