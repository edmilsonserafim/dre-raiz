
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Transaction } from '../types';
import {
  getDRESummary,
  getDREDimension,
  getDREFilterOptions,
  getMarcasEFiliais,
  DRESummaryRow,
  DREDimensionRow,
  DREFilterOptions
} from '../services/supabaseService';
import * as XLSX from 'xlsx';
import {
  ChevronRight,
  ChevronDown,
  Activity,
  Brain,
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
  ArrowUp10,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  CheckCircle,
  Plus,
  Maximize2,
  Check
} from 'lucide-react';

// ========== COMPONENTE EXTERNO: MultiSelectFilter ==========
// IMPORTANTE: Componente externo para evitar re-criação a cada render
const MultiSelectFilter: React.FC<{
  label: string;
  icon: React.ReactNode;
  options: string[];
  selected: string[];
  onChange: (newSelection: string[]) => void;
  colorScheme: 'blue' | 'orange' | 'purple';
}> = React.memo(({ label, icon, options, selected, onChange, colorScheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const colors = {
    blue: {
      border: 'border-[#1B75BB]',
      borderLight: 'border-gray-100',
      bg: 'bg-[#1B75BB]',
      bgLight: 'bg-blue-50',
      text: 'text-[#1B75BB]',
      ring: 'ring-[#1B75BB]/10'
    },
    orange: {
      border: 'border-[#F44C00]',
      borderLight: 'border-gray-100',
      bg: 'bg-[#F44C00]',
      bgLight: 'bg-orange-50',
      text: 'text-[#F44C00]',
      ring: 'ring-[#F44C00]/10'
    },
    purple: {
      border: 'border-purple-600',
      borderLight: 'border-gray-100',
      bg: 'bg-purple-600',
      bgLight: 'bg-purple-50',
      text: 'text-purple-600',
      ring: 'ring-purple-600/10'
    }
  };

  const scheme = colors[colorScheme];
  const hasSelection = selected.length > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const selectAll = () => {
    onChange(options);
  };

  const clearAll = () => {
    onChange([]);
  };

  const displayText = selected.length === 0
    ? 'TODAS'
    : selected.length === 1
    ? selected[0].toUpperCase()
    : `${selected.length} SELECIONADAS`;

  // Calcular posição do dropdown quando abrir
  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left
      });
    }
    setIsOpen(!isOpen);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <div
        ref={buttonRef}
        onClick={handleToggle}
        className={`flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border-2 shadow-sm transition-all cursor-pointer hover:shadow-md ${
          hasSelection ? `${scheme.border} ring-4 ${scheme.ring}` : scheme.borderLight
        }`}
      >
        <div className={`p-1.5 rounded-lg ${hasSelection ? `${scheme.bg} text-white` : `${scheme.bgLight} ${scheme.text}`}`}>
          {icon}
        </div>
        <div className="flex flex-col justify-center">
          <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">{label}</span>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-[10px] uppercase tracking-tight text-gray-900 min-w-[100px]">
              {displayText}
            </span>
            <ChevronDown size={12} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {/* Dropdown - position fixed para "explodir" fora do container */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed bg-white rounded-md border border-gray-300 shadow-lg z-[9999] w-[200px] max-h-[320px] overflow-hidden flex flex-col"
          style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-700">Selecione</span>
            <button
              onClick={clearAll}
              className="text-[10px] text-blue-600 hover:text-blue-800 font-medium"
            >
              Limpar
            </button>
          </div>

          {/* Options list - interface limpa */}
          <div className="overflow-y-auto">
            {options.map((option) => {
              const isSelected = selected.includes(option);
              return (
                <div
                  key={option}
                  onClick={() => toggleOption(option)}
                  className={`px-3 py-2.5 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                    isSelected ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{option}</span>
                    {isSelected && <Check size={14} className="text-blue-600" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

MultiSelectFilter.displayName = 'MultiSelectFilter';

// ========== INTERFACE ==========

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
  presentationMode?: 'executive' | 'detailed';  // Modo de apresentação (controlado externamente)
  setPresentationMode?: (mode: 'executive' | 'detailed') => void;
  onRegisterActions?: (actions: { refresh: () => void; exportTable: () => void; exportLayout: () => void }) => void;
  onLoadingChange?: (loading: boolean) => void;
}

const DRE_DIMENSIONS = [
  { id: 'tag01', label: 'Tag01' },  // ✅ Adicionado Tag01 como dimensão
  { id: 'tag02', label: 'Tag02' },
  { id: 'tag03', label: 'Tag03' },
  { id: 'marca', label: 'Marca' },
  { id: 'nome_filial', label: 'Unidade' },
  { id: 'vendor', label: 'Fornecedor' },
  { id: 'ticket', label: 'Ticket' },
];

const DREViewV2: React.FC<DREViewProps> = ({
  onDrillDown,
  onRefresh,
  isRefreshing = false,
  dreYear,
  presentationMode: externalPresentationMode,
  setPresentationMode: externalSetPresentationMode,
  onRegisterActions,
  onLoadingChange
}) => {
  // console.log('🚀 DREViewV2: Componente montado');

  // Estado para dados agregados do servidor
  const [summaryRows, setSummaryRows] = useState<DRESummaryRow[]>([]);
  const [filterOptions, setFilterOptions] = useState<DREFilterOptions>({ marcas: [], nome_filiais: [], tags01: [] });


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

  // ✅ NOVO: Filtro de Marca (CIA) para DRE Gerencial - MULTI-SELEÇÃO
  const [selectedMarcas, setSelectedMarcas] = useState<string[]>(() => {
    const saved = sessionStorage.getItem('dreMarcas');
    return saved ? JSON.parse(saved) : [];
  });

  // ✅ NOVO: Filtro de Filial (Unidade) para DRE Gerencial - MULTI-SELEÇÃO
  const [selectedFiliais, setSelectedFiliais] = useState<string[]>(() => {
    const saved = sessionStorage.getItem('dreFiliais');
    return saved ? JSON.parse(saved) : [];
  });

  // 🔑 KEY para forçar re-render quando marca ou filial muda
  const componentKey = useMemo(() => {
    const marcasKey = selectedMarcas.join(',');
    const filiaisKey = selectedFiliais.join(',');
    return `marca-${marcasKey}-filial-${filiaisKey}-${currentYear}`;
  }, [selectedMarcas, selectedFiliais, currentYear]);

  // 🔄 Filtrar opções de filial baseado na marca selecionada (cascata)
  const filiaisFiltradas = useMemo(() => {
    if (selectedMarcas.length === 0) {
      // Se nenhuma marca selecionada, mostra todas as filiais
      return filterOptions.nome_filiais;
    }
    // Filtra filiais que começam com alguma das marcas selecionadas (ex: "AP - ")
    return filterOptions.nome_filiais.filter(filial =>
      selectedMarcas.some(marca =>
        filial.startsWith(marca + ' - ') || filial.startsWith(marca + '-')
      )
    );
  }, [selectedMarcas, filterOptions.nome_filiais]);

  // 🔄 Limpar filial selecionada quando mudar marca (se não pertence mais)
  useEffect(() => {
    if (selectedFiliais.length > 0 && selectedMarcas.length > 0) {
      // Remove filiais que não pertencem mais às marcas selecionadas
      const filiaisValidas = selectedFiliais.filter(f => filiaisFiltradas.includes(f));
      if (filiaisValidas.length !== selectedFiliais.length) {
        console.log('⚠️ Filiais selecionadas não pertencem às marcas, limpando...');
        setSelectedFiliais(filiaisValidas);
      }
    }
  }, [selectedMarcas, selectedFiliais, filiaisFiltradas]);

  // 🔄 Versão dos dados para forçar invalidação de cache
  const [dataVersion, setDataVersion] = useState(0);

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

  // 🎨 V3: MODO FIXO COMO DETALHADO (sem botões de toggle)
  const presentationMode: 'detailed' = 'detailed';
  const setPresentationMode = () => {}; // Função vazia para compatibilidade

  // 🎨 V2: LAYOUT DOS CARDS (compacto, médio, expandido, lista)
  const [cardLayout, setCardLayout] = useState<'compact' | 'medium' | 'expanded' | 'list'>('compact'); // 🔧 Padrão: compact

  // 🎨 V2: FILTROS DO MODO EXECUTIVO
  const [execFilterType, setExecFilterType] = useState<'all' | 'positive' | 'negative'>('all');
  const [execSortBy, setExecSortBy] = useState<'alphabetical' | 'value' | 'delta'>('value');
  const [showOnlyEbitda, setShowOnlyEbitda] = useState<boolean>(true); // ✅ ATIVO por padrão - mostra até EBITDA

  // 🎨 V2: Estado para hover nos sparklines (formato: "code-barIndex")
  const [hoveredSparkline, setHoveredSparkline] = useState<string | null>(null);

  // 🎨 V2: NOVOS RECURSOS (Export, Comparação, Animação)
  const [selectedCardsForComparison, setSelectedCardsForComparison] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // 🎨 V2: Gráfico em Fullscreen
  const [fullscreenChart, setFullscreenChart] = useState<{
    code: string;
    label: string;
    realValues: number[];
    orcadoValues: number[];
    layout: 'medium' | 'expanded';
  } | null>(null);
  const [fullscreenHoveredMonth, setFullscreenHoveredMonth] = useState<number | null>(null);

  // 🎯 SISTEMA DE DESTAQUES ANALÍTICOS
  type AnalysisMode = 'none' | 'visual-alerts' | 'insights-dashboard' | 'ai-analysis' | 'guided-mode';
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('none');
  const [deviationThreshold, setDeviationThreshold] = useState(5); // % mínimo de desvio (reduzido de 10% para 5%)
  const [topDeviations, setTopDeviations] = useState<Array<{
    label: string;
    category: string;
    variation: number;
    type: 'budget' | 'lastYear';
    level: number;
    real: number;
    compare: number;
  }>>([]);
  const [guidedModeIndex, setGuidedModeIndex] = useState(0);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);

  // Estados de UI (Dropdowns abertos)
  const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);
  const [isMarcaFilterOpen, setIsMarcaFilterOpen] = useState(false);
  const [isFilialFilterOpen, setIsFilialFilterOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const [dynamicPath, setDynamicPath] = useState<string[]>([]);
  // Ordenação de dimensões: 'alpha' (A-Z), 'desc' (maior→menor), 'asc' (menor→maior)
  const [dimensionSort, setDimensionSort] = useState<'alpha' | 'desc' | 'asc'>('alpha'); // 🔧 Padrão: A-Z
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
    '01': true, '02': true, '03': true, '04': true
  });

  const tagRef = useRef<HTMLDivElement>(null);
  const marcaRef = useRef<HTMLDivElement>(null);
  const filialRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Função para formatar valores com separador de milhares (ponto)
  const formatValue = (value: number, decimals: number = 1): string => {
    const absValue = Math.abs(value);
    if (absValue >= 1000) {
      const formatted = (absValue / 1000).toFixed(decimals);
      // Substituir ponto decimal por vírgula e adicionar pontos nos milhares
      return formatted.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'M';
    }
    return absValue.toFixed(decimals).replace('.', ',') + 'K';
  };

  // 🎨 V2: Toggle seleção de card para comparação
  const toggleCardSelection = (code: string) => {
    setSelectedCardsForComparison(prev => {
      if (prev.includes(code)) {
        return prev.filter(c => c !== code);
      } else if (prev.length < 2) {
        return [...prev, code];
      } else {
        // Substituir o primeiro selecionado
        return [prev[1], code];
      }
    });
  };

  // 🎨 V2: Export individual de card
  const exportIndividualCard = (code: string, label: string, realValues: number[], orcadoValues: number[]) => {
    try {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      const exportData: any[] = [];

      // Cabeçalho
      exportData.push([label]);
      exportData.push([`Período: ${months[selectedMonthStart]} a ${months[selectedMonthEnd]} ${currentYear}`]);
      exportData.push([]);

      // Headers
      const headers = ['Mês', 'Real', 'Orçado', 'Delta', 'Delta %'];
      exportData.push(headers);

      // Dados
      for (let idx = selectedMonthStart; idx <= selectedMonthEnd; idx++) {
        const real = realValues[idx] || 0;
        const orcado = orcadoValues[idx] || 0;
        const delta = real - orcado;
        const deltaPerc = orcado !== 0 ? ((delta / Math.abs(orcado)) * 100) : 0;

        exportData.push([
          months[idx],
          real,
          orcado,
          delta,
          deltaPerc
        ]);
      }

      // Totais
      const realTotal = realValues.slice(selectedMonthStart, selectedMonthEnd + 1).reduce((a, b) => a + b, 0);
      const orcadoTotal = orcadoValues.slice(selectedMonthStart, selectedMonthEnd + 1).reduce((a, b) => a + b, 0);
      const deltaTotal = realTotal - orcadoTotal;
      const deltaPercTotal = orcadoTotal !== 0 ? ((deltaTotal / Math.abs(orcadoTotal)) * 100) : 0;

      exportData.push([]);
      exportData.push(['TOTAL', realTotal, orcadoTotal, deltaTotal, deltaPercTotal]);

      const ws = XLSX.utils.aoa_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Card DRE');
      XLSX.writeFile(wb, `DRE_${label.replace(/\//g, '-')}_${currentYear}.xlsx`);

      console.log('✅ Card exportado:', label);
    } catch (error) {
      console.error('❌ Erro ao exportar card:', error);
      alert('Erro ao exportar o card. Verifique o console para mais detalhes.');
    }
  };

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
    sessionStorage.setItem('dreMarcas', JSON.stringify(selectedMarcas));
  }, [selectedMarcas]);

  useEffect(() => {
    sessionStorage.setItem('dreFiliais', JSON.stringify(selectedFiliais));
  }, [selectedFiliais]);

  // Notificar mudanças no loading
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoadingDRE);
    }
  }, [isLoadingDRE, onLoadingChange]);

  // 🖱️ Fechar dropdown de Marca ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (marcaRef.current && !marcaRef.current.contains(event.target as Node)) {
        setIsMarcaFilterOpen(false);
      }
    };

    if (isMarcaFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMarcaFilterOpen]);

  // (Removido: useEffect que buscava filiais dinamicamente - agora usa estrutura da tabela FILIAL)

  // ========== BUSCA DE DADOS AGREGADOS DO SERVIDOR ==========
  const fetchDREData = useCallback(async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀🚀🚀 fetchDREData() CHAMADO!');
    console.log('   🎯 selectedMarcas:', selectedMarcas);
    console.log('   🏢 selectedFiliais:', selectedFiliais);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const fetchId = ++fetchIdRef.current;
    setIsLoadingDRE(true);
    setDimensionCache({});  // Limpar cache de dimensões

    const monthFrom = `${currentYear}-01`;
    const monthTo = `${currentYear}-12`;

    try {
      // Aplicar filtros de Marca e Filial (se selecionados)
      const finalMarcas = selectedMarcas.length > 0 ? selectedMarcas : undefined;
      const finalFiliais = selectedFiliais.length > 0 ? selectedFiliais : undefined;
      const finalTags01 = selectedTags01.length > 0 ? selectedTags01 : undefined;

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 [DEBUG FILTROS]');
      console.log('   selectedMarcas:', JSON.stringify(selectedMarcas), '(length:', selectedMarcas.length, ')');
      console.log('   selectedFiliais:', JSON.stringify(selectedFiliais), '(length:', selectedFiliais.length, ')');
      console.log('   finalMarcas:', finalMarcas);
      console.log('   finalFiliais:', finalFiliais);
      console.log('   finalTags01:', finalTags01);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const [summary, options] = await Promise.all([
        getDRESummary({
          monthFrom,
          monthTo,
          marcas: finalMarcas,
          nomeFiliais: finalFiliais,
          tags01: finalTags01,
        }),
        getDREFilterOptions({ monthFrom, monthTo })
      ]);

      console.log('✅ Dados carregados:', summary?.length, 'linhas');

      // Verificar se este fetch ainda é o mais recente
      if (fetchId !== fetchIdRef.current) {
        console.log('⚠️ Fetch cancelado (race condition)');
        return;
      }

      // 🔴 ATUALIZAR ESTADO COM NOVOS DADOS
      console.log('🔴 [SET STATE] Atualizando summaryRows com', summary.length, 'linhas');
      // ⚡ CRIAR NOVO ARRAY para forçar React detectar mudança
      setSummaryRows([...summary]);
      setFilterOptions(options);
      // 🔄 Incrementar versão para forçar reconstrução de dataMap e dreStructure
      setDataVersion(v => v + 1);
      console.log('✅ [SET STATE] summaryRows atualizado! dataVersion:', dataVersion + 1);

      const totalGeral = summary.reduce((acc, row) => acc + Number(row.total_amount), 0);
      const linhasPorTag0 = summary.reduce((acc, row) => {
        const tag = row.tag0 || 'Sem Tag0';
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ DRE carregada:', summary.length, 'linhas agregadas');
      console.log('💰 Total geral:', totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
      console.log('📊 Linhas por Tag0:', linhasPorTag0);
      console.log('🏷️ Filtro aplicado:', finalMarcas ? finalMarcas[0] : 'TODAS as marcas');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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
  }, [currentYear, selectedMarcas, selectedFiliais, selectedTags01]); // 🔥 FIX: Mudado para SINGULAR

  // Carregar dados na montagem e quando filtros mudam
  useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 [TRIGGER] useEffect detectou mudança nos filtros!');
    console.log('   currentYear:', currentYear);
    console.log('   selectedMarcas:', selectedMarcas);
    console.log('   selectedFiliais:', selectedFiliais);
    console.log('   selectedTags01:', selectedTags01);
    console.log('   ⚡ LIMPANDO dados antigos e chamando fetchDREData()...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 🎯 LIMPAR dados antigos ANTES de buscar novos (evita race condition no useMemo)
    setSummaryRows([]);
    setDimensionCache({});

    fetchDREData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentYear, selectedMarcas, selectedFiliais, selectedTags01]);

  // 🔄 REMOVIDO: ATIVADOR causava race condition
  // O dataVersion já é incrementado dentro do fetchDREData() após setSummaryRows
  // Não é necessário incrementar novamente aqui

  // 🎯 ANÁLISE AUTOMÁTICA: Calcular top desvios sempre que dados mudam
  useEffect(() => {
    console.log('🔍 ANÁLISE DE DESVIOS:', {
      summaryRowsLength: summaryRows?.length || 0,
      analysisMode,
      temDados: !!summaryRows && summaryRows.length > 0
    });

    if (!summaryRows || summaryRows.length === 0) {
      console.warn('⚠️ Sem dados para analisar');
      setTopDeviations([]);
      return;
    }

    if (analysisMode === 'none') {
      console.log('ℹ️ Modo "none" - análise desabilitada');
      setTopDeviations([]);
      return;
    }

    const deviations: typeof topDeviations = [];
    let realCount = 0, budgetCount = 0, a1Count = 0;

    // Analisar cada linha do summary
    summaryRows.forEach(row => {
      if (row.scenario === 'Real') realCount++;
      if (row.scenario === 'Orçado') budgetCount++;
      if (row.scenario === 'A-1') a1Count++;
    });

    console.log('📊 Cenários disponíveis:', { realCount, budgetCount, a1Count });

    // 🎯 ANÁLISE ALTERNATIVA: Se só tem Real (sem Orçado/A-1), analisar por valor absoluto
    const hasComparison = budgetCount > 0 || a1Count > 0;

    if (!hasComparison && realCount > 0) {
      console.log('ℹ️ Apenas dados Real - analisando por valor absoluto');

      // Coletar todos os valores Real
      const realValues: Array<{
        label: string;
        category: string;
        real: number;
        level: number;
      }> = [];

      summaryRows.forEach(row => {
        if (row.scenario === 'Real') {
          const label = row.tag01 || row.tag0 || 'Sem classificação';
          const category = row.tag0 || '';
          const real = Number(row.total_amount) || 0;

          if (real !== 0) {
            realValues.push({
              label,
              category,
              real,
              level: row.tag01 ? 2 : 1
            });
          }
        }
      });

      // Ordenar por valor absoluto (maior primeiro)
      realValues.sort((a, b) => Math.abs(b.real) - Math.abs(a.real));

      // Converter para formato de desvio (usar o próprio valor como "variação")
      realValues.slice(0, 10).forEach(item => {
        deviations.push({
          label: item.label,
          category: item.category,
          variation: 0, // Sem comparação
          type: 'budget', // Tipo fake para compatibilidade
          level: item.level,
          real: item.real,
          compare: 0 // Sem comparação
        });
      });
    } else {
      // Análise normal com comparação
      summaryRows.forEach(row => {
        const label = row.tag01 || row.tag0 || 'Sem classificação';
        const category = row.tag0 || '';
        const real = Number(row.total_amount) || 0;

        // Buscar dados de Orçado e A-1 para a mesma linha
        const budgetRow = summaryRows.find(r =>
          r.tag0 === row.tag0 &&
          r.tag01 === row.tag01 &&
          r.scenario === 'Orçado'
        );
        const a1Row = summaryRows.find(r =>
          r.tag0 === row.tag0 &&
          r.tag01 === row.tag01 &&
          r.scenario === 'A-1'
        );

        const budget = Number(budgetRow?.total_amount) || 0;
        const a1 = Number(a1Row?.total_amount) || 0;

        // Calcular variações (apenas se cenário Real)
        if (row.scenario === 'Real') {
          // Variação vs Orçado
          if (budget !== 0) {
            const varBudget = ((real - budget) / Math.abs(budget)) * 100;
            if (Math.abs(varBudget) >= deviationThreshold) {
              deviations.push({
                label,
                category,
                variation: varBudget,
                type: 'budget',
                level: row.tag01 ? 2 : 1,
                real,
                compare: budget
              });
            }
          }

          // Variação vs A-1
          if (a1 !== 0) {
            const varA1 = ((real - a1) / Math.abs(a1)) * 100;
            if (Math.abs(varA1) >= deviationThreshold) {
              deviations.push({
                label,
                category,
                variation: varA1,
                type: 'lastYear',
                level: row.tag01 ? 2 : 1,
                real,
                compare: a1
              });
            }
          }
        }
      });
    }

    // Ordenar por variação absoluta (maior desvio primeiro)
    deviations.sort((a, b) => Math.abs(b.variation) - Math.abs(a.variation));

    // Pegar top 10
    const top10 = deviations.slice(0, 10);
    console.log('✅ Análise concluída:', {
      totalDesvios: deviations.length,
      top10Length: top10.length,
      primeiroDesvio: top10[0] || null
    });

    if (top10.length > 0) {
      console.log('🎯 Top 3 maiores desvios:', top10.slice(0, 3));
    } else {
      console.warn(`⚠️ Nenhum desvio ≥ ${deviationThreshold}% encontrado`);
    }

    setTopDeviations(top10);
  }, [summaryRows, analysisMode, deviationThreshold]);

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
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) setIsExportDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


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
    const newList = list.includes(item) ? list.filter(i => i !== item) : [...list, item];
    console.log('🔄 toggleFilter:', { item, before: list, after: newList });
    setList(newList);
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

  // ========== FUNÇÕES DE EXPORTAÇÃO ==========

  const exportAsTable = useCallback(() => {
    console.log('📊 Exportando dados como tabela Excel...');

    if (summaryRows.length === 0) {
      alert('Nenhum dado disponível para exportar');
      return;
    }

    // Preparar dados para Excel
    const headers = ['Conta Contábil', 'TAG0', 'TAG01', 'Cenário', 'Mês', 'Valor'];
    const rows = summaryRows.map(row => ({
      'Conta Contábil': row.conta_contabil || '',
      'TAG0': row.tag0 || '',
      'TAG01': row.tag01 || '',
      'Cenário': row.scenario || 'Real',
      'Mês': row.year_month || '',
      'Valor': Number(row.total_amount || 0)
    }));

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    // Ajustar largura das colunas
    ws['!cols'] = [
      { wch: 18 }, // Conta Contábil
      { wch: 25 }, // TAG0
      { wch: 30 }, // TAG01
      { wch: 12 }, // Cenário
      { wch: 10 }, // Mês
      { wch: 15 }  // Valor
    ];

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Dados Agregados');

    // Salvar arquivo
    XLSX.writeFile(wb, `DRE_Tabela_${currentYear}.xlsx`);

    console.log('✅ Exportado', rows.length, 'linhas como Excel');
  }, [summaryRows, currentYear]);

  const exportCurrentLayout = () => {
    console.log('📊 Exportando layout atual como Excel formatado...');
    console.log('🔍 [EXPORT DEBUG] currentYear:', currentYear);
    console.log('🔍 [EXPORT DEBUG] selectedMonthStart:', selectedMonthStart);
    console.log('🔍 [EXPORT DEBUG] selectedMonthEnd:', selectedMonthEnd);
    console.log('🔍 [EXPORT DEBUG] summaryRows.length:', summaryRows.length);
    console.log('🔍 [EXPORT DEBUG] dataMap Real keys:', Object.keys(dataMap.Real || {}).length);
    console.log('🔍 [EXPORT DEBUG] dreStructure.data keys:', Object.keys(dreStructure.data || {}).length);

    if (!dreStructure || !dreStructure.data) {
      alert('Nenhum dado disponível para exportar');
      return;
    }

    if (summaryRows.length === 0) {
      alert('Nenhum dado carregado. Clique em "Buscar Dados" primeiro.');
      return;
    }

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const exportData: any[][] = [];

    // Linha 1: Título
    const titleRow = ['DRE GERENCIAL - ' + currentYear];
    exportData.push(titleRow);

    // Linha 2: Período
    const periodRow = [`Período: ${months[selectedMonthStart]} a ${months[selectedMonthEnd]}`];
    exportData.push(periodRow);

    // Linha 3: Vazia
    exportData.push([]);

    // Linha 4: Cabeçalhos
    const headers: string[] = ['Categoria'];

    // Construir cabeçalhos baseado no modo de visualização e cenários ativos
    for (let idx = selectedMonthStart; idx <= selectedMonthEnd; idx++) {
      if (showReal) headers.push(`${months[idx]} Real`);
      if (showOrcado) headers.push(`${months[idx]} Orçado`);
      if (showA1) headers.push(`${months[idx]} A-1`);
      if (showDeltaPercOrcado) headers.push(`${months[idx]} Δ% Orç`);
      if (showDeltaPercA1) headers.push(`${months[idx]} Δ% A-1`);
      if (showDeltaAbsOrcado) headers.push(`${months[idx]} Δ Orç`);
      if (showDeltaAbsA1) headers.push(`${months[idx]} Δ A-1`);
    }

    exportData.push(headers);

    // Metadados para formatação (nível de cada linha)
    const rowLevels: number[] = [0, 0, 0, 0]; // Título, período, vazia, cabeçalho

    // Função recursiva para processar a hierarquia
    const processHierarchy = (code: string) => {
      const node = dreStructure.data[code];
      if (!node) return;

      // items é Record<tag01, contas[]> - flatten para exportar
      const tag01Items = node.items as Record<string, string[]>;
      const categories = Object.values(tag01Items).flat();

      console.log(`🔍 [EXPORT] Processando ${code} - ${node.label}`);
      console.log(`   Tag01s count: ${Object.keys(tag01Items).length}`);
      console.log(`   Total categories: ${categories.length}`);
      console.log(`   Sample categories:`, categories.slice(0, 3));

      // Linha tag0 (Nível 1)
      const tag0Row: any[] = [node.label];

      for (let idx = selectedMonthStart; idx <= selectedMonthEnd; idx++) {
        if (showReal) {
          const values = getValues('Real', categories);
          if (idx === selectedMonthStart) {
            console.log(`   getValues('Real') for ${node.label}:`, values.slice(0, 3), '...');
            console.log(`   values[${idx}]:`, values[idx]);
          }
          tag0Row.push(values[idx] || 0);
        }
        if (showOrcado) {
          const values = getValues('Orçado', categories);
          tag0Row.push(values[idx] || 0);
        }
        if (showA1) {
          const values = getValues('A-1', categories);
          tag0Row.push(values[idx] || 0);
        }
        if (showDeltaPercOrcado) {
          const realVals = getValues('Real', categories);
          const orcVals = getValues('Orçado', categories);
          const delta = orcVals[idx] !== 0 ? ((realVals[idx] - orcVals[idx]) / Math.abs(orcVals[idx]) * 100) : 0;
          tag0Row.push(delta / 100); // Excel percentage format
        }
        if (showDeltaPercA1) {
          const realVals = getValues('Real', categories);
          const a1Vals = getValues('A-1', categories);
          const delta = a1Vals[idx] !== 0 ? ((realVals[idx] - a1Vals[idx]) / Math.abs(a1Vals[idx]) * 100) : 0;
          tag0Row.push(delta / 100);
        }
        if (showDeltaAbsOrcado) {
          const realVals = getValues('Real', categories);
          const orcVals = getValues('Orçado', categories);
          tag0Row.push(realVals[idx] - orcVals[idx]);
        }
        if (showDeltaAbsA1) {
          const realVals = getValues('Real', categories);
          const a1Vals = getValues('A-1', categories);
          tag0Row.push(realVals[idx] - a1Vals[idx]);
        }
      }

      exportData.push(tag0Row);
      rowLevels.push(1);

      // Tag01s podem ser exportados em drill-down separado se necessário
    };

    // Processar todos os níveis TAG0
    Object.keys(dreStructure.data).sort().forEach(code => {
      processHierarchy(code);
    });

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(exportData);

    // Configurar largura das colunas
    const colWidths = [{ wch: 40 }]; // Categoria
    for (let i = 1; i < headers.length; i++) {
      colWidths.push({ wch: 14 }); // Colunas de valores
    }
    ws['!cols'] = colWidths;

    // Aplicar formatação de células
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;

        // Linha 0: Título (merge e negrito)
        if (R === 0) {
          ws[cellAddress].s = {
            font: { bold: true, sz: 14 },
            alignment: { horizontal: 'left', vertical: 'center' }
          };
        }

        // Linha 1: Período
        if (R === 1) {
          ws[cellAddress].s = {
            font: { italic: true },
            alignment: { horizontal: 'left' }
          };
        }

        // Linha 3: Cabeçalhos (negrito, fundo cinza)
        if (R === 3) {
          ws[cellAddress].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '4472C4' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' }
            }
          };
        }

        // Linhas de dados (R >= 4)
        if (R >= 4) {
          const level = rowLevels[R];

          // Formatação baseada no nível
          if (level === 1) {
            // TAG0: Negrito, fundo azul claro
            ws[cellAddress].s = {
              font: { bold: true, sz: 11 },
              fill: { fgColor: { rgb: 'D9E1F2' } },
              alignment: { horizontal: C === 0 ? 'left' : 'right', vertical: 'center' },
              border: {
                top: { style: 'thin' },
                bottom: { style: 'thin' }
              }
            };
          } else if (level === 2) {
            // TAG01: Semi-negrito, fundo cinza claro
            ws[cellAddress].s = {
              font: { bold: true, sz: 10 },
              fill: { fgColor: { rgb: 'F2F2F2' } },
              alignment: { horizontal: C === 0 ? 'left' : 'right', vertical: 'center' }
            };
          } else if (level === 3) {
            // Conta: Normal, sem fundo
            ws[cellAddress].s = {
              font: { sz: 9 },
              alignment: { horizontal: C === 0 ? 'left' : 'right', vertical: 'center' }
            };
          }

          // Formato numérico para colunas de valor (C > 0)
          if (C > 0) {
            const headerText = headers[C];
            if (headerText && (headerText.includes('Δ%') || headerText.includes('Delta %'))) {
              ws[cellAddress].z = '0.0%'; // Formato percentual
            } else if (headerText && headerText.includes('Δ')) {
              ws[cellAddress].z = '#,##0.00'; // Formato numérico com 2 decimais
            } else {
              ws[cellAddress].z = '#,##0.00'; // Formato numérico padrão
            }
          }
        }
      }
    }

    // Merge cells para título (A1:última coluna)
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } });

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'DRE Gerencial');

    // Salvar arquivo
    XLSX.writeFile(wb, `DRE_Layout_${currentYear}_${months[selectedMonthStart]}-${months[selectedMonthEnd]}.xlsx`);

    console.log('✅ Exportado layout hierárquico Excel com', exportData.length, 'linhas e formatação');
  };

  // Registrar ações para uso externo (App.tsx) - DEPOIS das definições das funções
  useEffect(() => {
    if (onRegisterActions) {
      onRegisterActions({
        refresh: fetchDREData,
        exportTable: exportAsTable,
        exportLayout: exportCurrentLayout
      });
    }
  }, [onRegisterActions, fetchDREData, exportAsTable, exportCurrentLayout]); // 🔥 FIX: Adicionar funções para re-registrar quando mudarem

  // ========== CONSTRUIR dataMap E dreStructure A PARTIR DE summaryRows ==========

  const dataMap = useMemo(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗺️ [MEMO] dataMap sendo RECONSTRUÍDO!');
    console.log('📊 summaryRows.length:', summaryRows.length);
    console.log('🎯 Filtros aplicados:', {
      marca: selectedMarcas.length > 0 ? selectedMarcas.join(', ') : 'TODAS',
      filial: selectedFiliais.length > 0 ? selectedFiliais.join(', ') : 'TODAS',
      dataVersion: dataVersion
    });

    // 🔍 DEBUG: Mostrar quais marcas e filiais existem nos dados
    const marcasNosdados = [...new Set(summaryRows.map(r => r.marca))];
    const filiaisNosdados = [...new Set(summaryRows.map(r => r.nome_filial))];
    console.log('🏷️ Marcas ÚNICAS nos dados:', marcasNosdados);
    console.log('🏢 Filiais ÚNICAS nos dados:', filiaisNosdados);
    console.log('🎯 Marca selecionada:', selectedMarcas.length > 0 ? selectedMarcas.join(', ') : 'TODAS');
    console.log('🎯 Filial selecionada:', selectedFiliais.length > 0 ? selectedFiliais.join(', ') : 'TODAS');

    // ✅ DADOS JÁ VÊM FILTRADOS DO RPC - não precisa filtrar localmente!
    // O RPC getDRESummary() já aplica os filtros de marca, filial e tags01 no servidor
    const filteredRows = summaryRows;

    console.log(`📊 [DADOS DO RPC] Marca: ${selectedMarcas.length > 0 ? selectedMarcas.join(', ') : 'TODAS'}, Filial: ${selectedFiliais.length > 0 ? selectedFiliais.join(', ') : 'TODAS'}`);
    console.log(`📊 Total de linhas recebidas: ${filteredRows.length}`);

    const map: Record<string, Record<string, number[]>> = { Real: {}, Orçado: {}, 'A-1': {} };

    // 🔍 DEBUG: Contar quantas linhas por conta para detectar agregação
    const contasPorConta: Record<string, number> = {};
    filteredRows.forEach(row => {
      const key = row.conta_contabil;
      contasPorConta[key] = (contasPorConta[key] || 0) + 1;
    });

    // Mostrar contas com múltiplas linhas (agregação)
    const contasAgregadas = Object.entries(contasPorConta)
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    if (contasAgregadas.length > 0) {
      console.log('🔍 [AGREGAÇÃO] Contas com múltiplas linhas (top 5):');
      contasAgregadas.forEach(([conta, count]) => {
        console.log(`   ${conta}: ${count} linhas`);
      });
    }

    filteredRows.forEach(row => {
      // Normalizar scenario
      let scenario = row.scenario || 'Real';
      if (scenario === 'Original') scenario = 'Real';

      // Extrair mês do year_month (YYYY-MM)
      const monthIdx = parseInt(row.year_month.substring(5, 7), 10) - 1;
      const key = row.conta_contabil;

      if (!map[scenario]) map[scenario] = {};
      if (!map[scenario][key]) map[scenario][key] = new Array(12).fill(0);

      // 🔍 DEBUG: Log antes e depois da soma para a primeira conta agregada
      const isFirstAgregada = contasAgregadas.length > 0 && key === contasAgregadas[0][0];
      if (isFirstAgregada && map[scenario][key][monthIdx] > 0) {
        console.log(`   🔍 [SOMA] ${key} mês ${monthIdx}: ${map[scenario][key][monthIdx]} + ${row.total_amount} = ${map[scenario][key][monthIdx] + Number(row.total_amount)}`);
      }

      map[scenario][key][monthIdx] += Number(row.total_amount);
    });

    // Calcular totais por cenário para debug (usando dados filtrados)
    const totais = {
      Real: Object.values(map.Real).reduce((sum, arr) => sum + arr.reduce((s, v) => s + v, 0), 0),
      Orçado: Object.values(map.Orçado).reduce((sum, arr) => sum + arr.reduce((s, v) => s + v, 0), 0),
      'A-1': Object.values(map['A-1']).reduce((sum, arr) => sum + arr.reduce((s, v) => s + v, 0), 0)
    };

    // Verificação: totais devem bater com dados filtrados
    const totalFiltrado = filteredRows.reduce((sum, r) => sum + Number(r.total_amount), 0);
    console.log(`✅ Total nos dados filtrados: ${totalFiltrado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);

    console.log('✅ [DATAMAP] Criado com totais por cenário:');
    console.log('   Real:', Object.keys(map.Real).length, 'contas →', totais.Real.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
    console.log('   Orçado:', Object.keys(map.Orçado).length, 'contas →', totais.Orçado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
    console.log('   A-1:', Object.keys(map['A-1']).length, 'contas →', totais['A-1'].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
    console.log('   🏷️ Filtros ativos - Marca:', selectedMarcas.length > 0 ? selectedMarcas.join(', ') : 'TODAS', '| Filial:', selectedFiliais.length > 0 ? selectedFiliais.join(', ') : 'TODAS');
    console.log('   📌 dataVersion:', dataVersion);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return map;
  }, [summaryRows, selectedMarcas, selectedFiliais, currentYear, dataVersion]);

  // Construir hierarquia DRE a partir de summaryRows (tag0 → tag01 → conta_contabil)
  const dreStructure = useMemo(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏗️ [MEMO] dreStructure sendo RECONSTRUÍDO!');
    console.log('📊 summaryRows.length:', summaryRows.length);

    // Contar transações por marca para debug
    const porMarca = summaryRows.reduce((acc, row) => {
      const m = row.marca || 'Sem Marca';
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('📦 Linhas por marca:', porMarca);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ✅ Hierarquia ORIGINAL: tag0 → tag01 → conta_contabil
    const tag0Map = new Map<string, Map<string, Set<string>>>(); // tag0 → tag01 → contas

    // ✅ DADOS JÁ VÊM FILTRADOS DO RPC - não precisa filtrar localmente!
    const filteredRows = summaryRows;

    console.log(`📊 [DADOS DO RPC] Marca: ${selectedMarcas.length > 0 ? selectedMarcas.join(', ') : 'TODAS'}, Filial: ${selectedFiliais.length > 0 ? selectedFiliais.join(', ') : 'TODAS'}`);
    console.log(`📊 Total de linhas recebidas: ${filteredRows.length}`);

    // Agrupar por tag0 → tag01 → conta_contabil (hierarquia completa)
    filteredRows.forEach(row => {
      const tag0 = row.tag0 || 'Sem Tag0';
      const tag01 = row.tag01 || 'Sem Tag01';
      const conta = row.conta_contabil;

      // Criar estrutura hierárquica de 3 níveis
      if (!tag0Map.has(tag0)) tag0Map.set(tag0, new Map());
      const tag01Map = tag0Map.get(tag0)!;
      if (!tag01Map.has(tag01)) tag01Map.set(tag01, new Set());
      tag01Map.get(tag01)!.add(conta);
    });

    const data: Record<string, {
      label: string;
      type: string;
      items: Record<string, string[]> | string[]; // tag01 → contas OU array direto de contas
    }> = {};

    // Ordenar tag0s
    const sortedTag0s = Array.from(tag0Map.keys()).sort((a, b) => {
      // Ordenar por prefixo numérico (01., 02., etc)
      const matchA = a.match(/^(\d+)\./);
      const matchB = b.match(/^(\d+)\./);
      if (matchA && matchB) {
        return parseInt(matchA[1]) - parseInt(matchB[1]);
      }
      return a.localeCompare(b);
    });

    // Construir hierarquia completa: tag0 → tag01 → contas
    sortedTag0s.forEach(tag0 => {
      const tag01Map = tag0Map.get(tag0)!;
      const tag01Items: Record<string, string[]> = {};

      tag01Map.forEach((contas, tag01) => {
        tag01Items[tag01] = Array.from(contas).sort();
      });

      data[tag0] = {
        label: tag0,
        type: tag0.split('.')[0] || 'outros', // Extrair prefixo numérico
        items: tag01Items // Hierarquia de tag01 → contas
      };
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ [HIERARQUIA ORIGINAL] tag0 → tag01 → conta_contabil`);
    console.log(`   📊 Total de tag0s: ${sortedTag0s.length}`);
    sortedTag0s.forEach(tag0 => {
      const nivel = data[tag0];
      const totalTag01s = Object.keys(nivel.items).length;
      const totalContas = Object.values(nivel.items as Record<string, string[]>).reduce((acc, arr) => acc + arr.length, 0);
      console.log(`   ${tag0}: ${totalTag01s} tag01s, ${totalContas} contas`);
    });
    console.log('   🏷️ Filtro de marca ativo:', selectedMarcas.length > 0 ? selectedMarcas.join(', ') : 'TODAS');
    console.log('   🏢 Filtro de filial ativo:', selectedFiliais.length > 0 ? selectedFiliais.join(', ') : 'TODAS');
    console.log('   📌 dataVersion:', dataVersion);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return { source: 'data', data };
  }, [summaryRows, selectedMarcas, selectedFiliais, currentYear, dataVersion]);

  const getValues = useCallback((scenario: string, categories: string[]) => {
    const values = new Array(12).fill(0);
    const scenarioMap = dataMap[scenario] || {};

    // 🔍 DEBUG: Contar quantas contas existem vs quantas têm valores
    let contasComValor = 0;
    let totalSomado = 0;

    // 🔥 LOG CRÍTICO: Verificar qual dataMap está sendo usado
    const totalContasNoDataMap = Object.keys(scenarioMap).length;
    const totalValueNoDataMap = Object.values(scenarioMap).reduce((sum, arr) => sum + arr.reduce((s, v) => s + v, 0), 0);

    categories.forEach(cat => {
      if (scenarioMap[cat]) {
        contasComValor++;
        const somaCategoria = scenarioMap[cat].reduce((s, v) => s + v, 0);
        totalSomado += somaCategoria;
        scenarioMap[cat].forEach((v, i) => values[i] += v);
      }
    });

    // 🔥 LOG SEMPRE para Tag01 (categories.length < 100 = nível 2)
    if (categories.length < 100 && categories.length > 1) {
      console.log(`🔥 getValues(${scenario}):`);
      console.log(`   📊 Total contas no dataMap[${scenario}]: ${totalContasNoDataMap}`);
      console.log(`   💰 Valor total no dataMap[${scenario}]: R$ ${totalValueNoDataMap.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`   📋 Contas pedidas: ${categories.length}`);
      console.log(`   ✅ Contas encontradas: ${contasComValor}`);
      console.log(`   💵 Valor somado: R$ ${totalSomado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`   🎯 Filtros: Marca=${selectedMarcas.length > 0 ? selectedMarcas.join(', ') : 'TODAS'}, Filial=${selectedFiliais.length > 0 ? selectedFiliais.join(', ') : 'TODAS'}`);
    }

    return values;
  }, [dataMap, selectedMarcas, selectedFiliais]);

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

    // Merge filtros de TAG01, TAG02 e TAG03 (prioriza accFilters do drill-down)
    const mergedTags01 = accFilters.tag01
      ? [accFilters.tag01]
      : (selectedTags01.length > 0 ? selectedTags01 : undefined);
    const mergedTags02 = accFilters.tag02 ? [accFilters.tag02] : undefined;
    const mergedTags03 = accFilters.tag03 ? [accFilters.tag03] : undefined;

    console.log('🔍 [DRILL-DOWN] Usando filtros:', {
      accFilters,
      selectedMarcas,
      selectedFiliais,
      mergedMarcas,
      mergedFiliais
    });

    const rows = await getDREDimension({
      monthFrom,
      monthTo,
      contaContabils: categories,
      scenario,
      dimension: dimensionKey,
      marcas: mergedMarcas,
      nomeFiliais: mergedFiliais,
      tags01: mergedTags01,
      tags02: mergedTags02,
      tags03: mergedTags03,
    });

    console.log('✅ DRILL-DOWN: Dados carregados', {
      cacheKey,
      dimensionKey,
      scenario,
      linhasRetornadas: rows.length,
      primeiraLinha: rows[0],
      valoresUnicos: [...new Set(rows.map(r => r.dimension_value))].length
    });

    setDimensionCache(prev => {
      const newCache = { ...prev, [cacheKey]: rows };
      console.log('✅ DRILL-DOWN: Cache atualizado', {
        totalChaves: Object.keys(newCache).length,
        chaveAdicionada: cacheKey
      });
      return newCache;
    });
  }, [currentYear, selectedMarcas, selectedTags01, dimensionCache]);

  // 🚨 Helper: Verificar se linha tem alerta de desvio significativo
  const hasDeviationAlert = (label: string): { hasAlert: boolean; deviation?: typeof topDeviations[0] } => {
    if (analysisMode !== 'visual-alerts' || topDeviations.length === 0) {
      return { hasAlert: false };
    }
    const deviation = topDeviations.find(d => d.label === label);
    return {
      hasAlert: !!deviation,
      deviation
    };
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

    // Obter valores para todos os cenários
    // level 1-2: dados do summary (getValues), level 3+: drill-down dinâmico
    // 🔥 TESTE: level 1 usa getValues (Type fixo), level 2+ usa getDynamicValues (drill-down)
    const scenarioValues: Record<string, number[]> = {
      'Real': level <= 1
        ? getValues('Real', categories)
        : getDynamicValues(categories, dynamicPath[level - 2], label, accumulatedFilters, 'Real'),
      'Orçado': level <= 1
        ? getValues('Orçado', categories)
        : getDynamicValues(categories, dynamicPath[level - 2], label, accumulatedFilters, 'Orçado'),
      'A-1': level <= 1
        ? getValues('A-1', categories)
        : getDynamicValues(categories, dynamicPath[level - 2], label, accumulatedFilters, 'A-1')
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
        <tr className={`${bgClass} transition-all text-[10px] h-6 group`}>
          <td className={`sticky left-0 z-30 ${viewMode === 'scenario' ? 'border-r-2 border-r-gray-300' : ''} shadow-[2px_0_4px_rgba(0,0,0,0.1)] w-[280px] ${level === 1 ? 'bg-[#152e55] group-hover:bg-[#1e3d6e]' : 'bg-inherit group-hover:bg-yellow-100/60'} transition-colors cursor-pointer`}>
            <div className="flex items-center gap-1 px-1 overflow-hidden" style={{ paddingLeft }}>
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
                        className={`px-0.5 text-right font-mono font-bold cursor-pointer hover:bg-yellow-100/60 transition-colors w-[80px] ${colors[element as keyof typeof colors].text} ${isLastMonth ? '' : 'border-r border-gray-100'}`}
                      >
                        {values[i] === 0 ? '-' : Math.round(values[i]).toLocaleString()}
                      </td>
                    );
                  })}

                  {/* Coluna YTD */}
                  <td className={`px-0.5 text-right font-mono font-black border-l border-gray-300 border-r-2 border-r-gray-300 hover:bg-yellow-200/40 transition-colors w-[100px] ${colors[element as keyof typeof colors].bg}`}>
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
                        <td key={`${element}-${i}`} className={`px-0.5 text-center font-black text-[10px] w-[70px] ${level === 1 ? 'text-white bg-white/10' : (deltaPerc > 0 ? 'text-emerald-600' : deltaPerc < 0 ? 'text-rose-600' : 'text-gray-400')}`}>
                          {deltaPerc !== 0 ? `${deltaPerc > 0 ? '+' : ''}${deltaPerc.toFixed(0)}%` : '-'}
                        </td>
                      );
                    } else {
                      const deltaAbs = baseVal - compareVal;
                      return (
                        <td key={`${element}-${i}`} className={`px-0.5 text-right font-mono font-bold text-[10px] hover:bg-yellow-50 transition-colors w-[85px] ${level === 1 ? 'text-white bg-white/10' : (deltaAbs > 0 ? 'text-emerald-600' : deltaAbs < 0 ? 'text-rose-600' : 'text-gray-400')}`}>
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
                        <td className={`px-0.5 text-center font-mono font-black border-r-2 border-r-gray-300 hover:bg-yellow-200/40 transition-colors w-[100px] ${level === 1 ? 'bg-white/10 text-white' : deltaBgColor}`}>
                          {deltaPercYTD !== 0 ? `${deltaPercYTD > 0 ? '+' : ''}${deltaPercYTD.toFixed(0)}%` : '-'}
                        </td>
                      );
                    })()
                  ) : (
                    (() => {
                      const deltaAbsYTD = baseYTD - compareYTD;
                      const deltaBgColor = element.includes('Orcado') ? 'bg-green-50 text-green-900' : 'bg-purple-50 text-purple-900';
                      return (
                        <td className={`px-0.5 text-right font-mono font-black border-r-2 border-r-gray-300 hover:bg-yellow-200/40 transition-colors w-[100px] ${level === 1 ? 'bg-white/10 text-white' : deltaBgColor}`}>
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

                  // Verificar se compareScenario foi identificado
                  if (!compareScenario) {
                    return null;
                  }

                  // YTDs são sempre calculados para todos os cenários, não precisa verificar se existem

                  const baseYTD = scenarioYTDs[baseScenario];
                  const compareYTD = scenarioYTDs[compareScenario];

                  const deltaBgColor = element.includes('Orcado') ? 'bg-green-50 text-green-900' : 'bg-purple-50 text-purple-900';

                  // 🚨 Verificar se tem alerta de desvio
                  const { hasAlert } = hasDeviationAlert(label);

                  if (isPercentual) {
                    const deltaPerc = compareYTD !== 0 ? ((baseYTD - compareYTD) / Math.abs(compareYTD)) * 100 : 0;
                    return (
                      <td key={`ytd-${element}`} className={`px-1 text-center font-mono font-black hover:bg-yellow-200/40 transition-colors w-[100px] ${level === 1 ? 'bg-white/10 text-white' : deltaBgColor} ${ytdSeparator} ${hasAlert ? 'ring-2 ring-orange-500 ring-inset' : ''}`}>
                        <div className="flex items-center justify-center gap-0.5">
                          {hasAlert && <AlertTriangle size={10} className="text-orange-600 shrink-0" />}
                          <span>{deltaPerc !== 0 ? `${deltaPerc > 0 ? '+' : ''}${deltaPerc.toFixed(0)}%` : '-'}</span>
                        </div>
                      </td>
                    );
                  } else {
                    const deltaAbs = baseYTD - compareYTD;
                    return (
                      <td key={`ytd-${element}`} className={`px-1 text-right font-mono font-black hover:bg-yellow-200/40 transition-colors w-[100px] ${level === 1 ? 'bg-white/10 text-white' : deltaBgColor} ${ytdSeparator} ${hasAlert ? 'ring-2 ring-orange-500 ring-inset' : ''}`}>
                        <div className="flex items-center justify-end gap-0.5">
                          {hasAlert && <AlertTriangle size={10} className="text-orange-600 shrink-0" />}
                          <span>{deltaAbs !== 0 ? `${deltaAbs > 0 ? '+' : ''}${Math.round(deltaAbs).toLocaleString()}` : '-'}</span>
                        </div>
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
          // 🔥 TESTE: Removido nível 2 (Tag01), level=1 vai direto para drill-down

          // Nível 1+: expande para drill-down dinâmico (dimensões selecionadas)
          // dynamicPath[0] = primeira dimensão, dynamicPath[1] = segunda, etc.
          // Para level=1: usa dynamicPath[0], level=2: dynamicPath[1], etc.
          if (level >= 1 && dynamicPath.length > (level - 1)) {
            const dimIndex = level - 1;  // level 1 → index 0, level 2 → index 1, etc.
            const currentDimKey = dynamicPath[dimIndex];

            console.log('🚀 DRILL-DOWN: Iniciando expansão dinâmica', {
              id,
              label,
              level,
              dimIndex,
              currentDimKey,
              dynamicPath,
              categoriesCount: categories.length,
              primeirasCategories: categories.slice(0, 5),
              accumulatedFilters
            });

            // Carregar dados de dimensão do servidor (sob demanda)
            // accumulatedFilters contém filtros dos níveis anteriores (ex: { marca: 'QI' })
            const accFiltersKey = Object.entries(accumulatedFilters).sort().map(([k, v]) => `${k}=${v}`).join('&');

            console.log('🔍 DRILL-DOWN: Verificando cache...', {
              level,
              currentDimKey,
              accFiltersKey,
              categories: categories.slice(0, 3),
              totalChavesNoCache: Object.keys(dimensionCache).length
            });

            // ⚠️ TEMPORÁRIO: Apenas cenário Real (Orçado e A-1 vazios por enquanto)
            for (const scenario of ['Real']) {
              const cacheKey = `${scenario}|${categories.sort().join(',')}|${currentDimKey}|${accFiltersKey}`;
              const cacheExists = !!dimensionCache[cacheKey];
              const cacheSize = dimensionCache[cacheKey]?.length || 0;

              console.log(`🔍 DRILL-DOWN: Verificando ${scenario}`, {
                cacheKey: cacheKey.slice(0, 80) + '...',
                cacheExists,
                cacheSize
              });

              // ✅ CORREÇÃO: Carregar se não existe OU se está vazio
              if (!dimensionCache[cacheKey] || dimensionCache[cacheKey].length === 0) {
                console.log('⏳ DRILL-DOWN: Cache vazio ou não encontrado, carregando...', {
                  level,
                  currentDimKey,
                  scenario,
                  cacheKey: cacheKey.slice(0, 100),
                  cacheExists,
                  cacheSize,
                  categories: categories.slice(0, 5),
                  accumulatedFilters
                });
                loadDimensionData(categories, currentDimKey, scenario, accumulatedFilters);
                return <tr key={`loading-${id}`}><td colSpan={99} className="text-center text-gray-400 text-xs py-2"><Loader2 className="inline w-3 h-3 animate-spin mr-1" />Carregando...</td></tr>;
              }
            }

            // Extrair valores únicos de dimensão do cache
            // ⚠️ TEMPORÁRIO: Apenas cenário Real (Orçado e A-1 vazios por enquanto)
            const allDimensionValues = new Set<string>();
            for (const scenario of ['Real']) {
              const cacheKey = `${scenario}|${categories.sort().join(',')}|${currentDimKey}|${accFiltersKey}`;
              const cachedRows = dimensionCache[cacheKey] || [];
              cachedRows.forEach(row => allDimensionValues.add(row.dimension_value));
            }

            console.log('🎯 DRILL-DOWN: Renderizando nível dinâmico', {
              level,
              currentDimKey,
              accFiltersKey,
              valoresUnicos: allDimensionValues.size,
              valores: Array.from(allDimensionValues).slice(0, 5)
            });

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

            const renderedRows = sortedValues.map((val, idx) => {
              const nextId = `${id}-${currentDimKey}-${idx}`;
              const hasMoreLevels = dynamicPath.length > (dimIndex + 1);
              const nextFilters = { ...accumulatedFilters, [currentDimKey]: val };
              return renderRow(nextId, val, level + 1, categories, hasMoreLevels, nextFilters);
            });

            console.log('✅ DRILL-DOWN: Linhas renderizadas com sucesso!', {
              level,
              currentDimKey,
              totalLinhas: renderedRows.length,
              labels: sortedValues.slice(0, 5)
            });

            return renderedRows;
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
      <tr className={`${color} text-white text-[10px] font-black h-6 shadow-sm group`}>
        <td className="sticky left-0 bg-inherit z-30 border-r border-white/10 shadow-[2px_0_4px_rgba(0,0,0,0.2)] w-[280px] group-hover:bg-yellow-400 group-hover:text-black transition-colors">
          <div className="flex items-center gap-1 px-2 uppercase tracking-tighter truncate font-black">
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
                    <td key={`calc-${element}-${i}`} className={`px-0.5 text-right font-mono hover:bg-yellow-100/40 transition-colors w-[80px] ${isLastMonth ? '' : 'border-r border-white/5'}`}>
                      {Math.round(values[i]).toLocaleString()}
                    </td>
                  );
                })}

                {/* Coluna YTD */}
                <td className="px-0.5 text-right font-mono border-l border-white/20 border-r-2 border-r-gray-300 bg-black/10 hover:bg-yellow-200 transition-colors w-[100px]">
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
                      <td key={`calc-delta-${element}-${i}`} className={`px-0.5 text-center text-[10px] font-black w-[70px] ${deltaPerc >= 0 ? 'text-emerald-600' : 'text-rose-600'} ${isLastMonth ? '' : 'border-l border-white/10'}`}>
                        {deltaPerc === 0 ? '-' : `${deltaPerc > 0 ? '+' : ''}${deltaPerc.toFixed(0)}%`}
                      </td>
                    );
                  } else {
                    const deltaAbs = baseVal - compareVal;
                    return (
                      <td key={`calc-delta-${element}-${i}`} className={`px-0.5 text-right font-mono text-[10px] font-black w-[85px] ${deltaAbs >= 0 ? 'text-emerald-600' : 'text-rose-600'} ${isLastMonth ? '' : 'border-l border-white/5'}`}>
                        {deltaAbs === 0 ? '-' : `${deltaAbs > 0 ? '+' : ''}${Math.round(deltaAbs).toLocaleString()}`}
                      </td>
                    );
                  }
                })}

                {/* Delta YTD */}
                {isPercentual ? (
                  <td className={`px-0.5 text-center border-l border-white/20 border-r-2 border-r-gray-300 bg-black/10 text-[10px] font-black w-[100px] ${compareYTD !== 0 ? ((baseYTD - compareYTD) / Math.abs(compareYTD)) * 100 >= 0 ? 'text-emerald-600' : 'text-rose-600' : 'text-gray-400'}`}>
                    {compareYTD === 0 ? '-' : `${((baseYTD - compareYTD) / Math.abs(compareYTD)) * 100 > 0 ? '+' : ''}${(((baseYTD - compareYTD) / Math.abs(compareYTD)) * 100).toFixed(0)}%`}
                  </td>
                ) : (
                  <td className={`px-0.5 text-right font-mono border-l border-white/20 border-r-2 border-r-gray-300 bg-black/10 text-[10px] font-black w-[100px] ${(baseYTD - compareYTD) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
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
                          <td key={`calc-month-${monthIdx}-${element}`} className={`px-0.5 text-center text-[11px] font-black w-[70px] ${deltaPerc >= 0 ? 'text-emerald-600' : 'text-rose-600'} ${monthSeparator}`}>
                            {deltaPerc === 0 ? '-' : `${deltaPerc > 0 ? '+' : ''}${deltaPerc.toFixed(0)}%`}
                          </td>
                        );
                      } else {
                        const deltaAbs = baseVal - compareVal;
                        return (
                          <td key={`calc-month-${monthIdx}-${element}`} className={`px-0.5 text-right font-mono text-[11px] font-black w-[85px] ${deltaAbs >= 0 ? 'text-emerald-600' : 'text-rose-600'} ${monthSeparator}`}>
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

                // Verificar se compareScenario foi identificado
                if (!compareScenario) {
                  return null;
                }

                // YTDs são sempre calculados para todos os cenários, não precisa verificar se existem

                const baseYTD = calcYTDs[baseScenario];
                const compareYTD = calcYTDs[compareScenario];

                if (isPercentual) {
                  const deltaPerc = compareYTD !== 0 ? ((baseYTD - compareYTD) / Math.abs(compareYTD)) * 100 : 0;
                  return (
                    <td key={`calc-ytd-${element}`} className={`px-0.5 text-center ${ytdSeparator} bg-black/10 text-[10px] font-black w-[100px] ${deltaPerc >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {deltaPerc === 0 ? '-' : `${deltaPerc > 0 ? '+' : ''}${deltaPerc.toFixed(0)}%`}
                    </td>
                  );
                } else {
                  const deltaAbs = baseYTD - compareYTD;
                  return (
                    <td key={`calc-ytd-${element}`} className={`px-0.5 text-right font-mono ${ytdSeparator} bg-black/10 text-[10px] font-black w-[100px] ${deltaAbs >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
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

    // 🎨 Classes fixas para cada cor (Tailwind precisa ver as classes completas)
    const colorClasses = {
      orange: {
        border: 'border-orange-500',
        ring: 'ring-4 ring-orange-500/10'
      },
      blue: {
        border: 'border-blue-500',
        ring: 'ring-4 ring-blue-500/10'
      },
      purple: {
        border: 'border-purple-500',
        ring: 'ring-4 ring-purple-500/10'
      }
    };

    const activeColorClasses = colorClasses[color as keyof typeof colorClasses] || colorClasses.purple;

    return (
      <div ref={refObj} className="relative">
        <button
          onClick={() => {
            console.log(`🖱️ Clicou no filtro ${label}, isOpen:`, isOpen, '→', !isOpen, 'options:', options.length);
            setOpen(!isOpen);
          }}
          className={`flex items-center gap-3 bg-white px-3 md:px-4 py-2.5 rounded-2xl border-2 transition-all min-w-[160px] md:min-w-[200px] shadow-sm hover:shadow-md cursor-pointer ${
            isOpen
              ? `${activeColorClasses.border} ${activeColorClasses.ring}`
              : isActive
                ? 'border-yellow-400 bg-yellow-50 shadow-yellow-100/50'
                : 'border-gray-100'
          }`}
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

  // 🔍 DEBUG: Verificar se dados estão carregados
  console.log('🎨 [RENDER DREViewV2]', {
    marcas: filterOptions.marcas.length,
    filiais: filterOptions.nome_filiais.length,
    tags01: filterOptions.tags01.length,
    isMarcaFilterOpen,
    isFilialFilterOpen,
    isTagFilterOpen
  });

  return (
    <div key={componentKey} className="space-y-2 animate-in fade-in duration-500 pb-2">
      {/* Linha de Filtros */}
      <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-lg border border-blue-300 shadow-md overflow-x-auto">
          <span className="text-base shrink-0">🎯</span>

            {/* Filtro de Marca (CIA) - MULTI-SELEÇÃO */}
            <MultiSelectFilter
              label="Marca"
              icon={<Flag size={14} />}
              options={filterOptions.marcas}
              selected={selectedMarcas}
              onChange={(newSelection) => {
                console.log('🎯 Marcas selecionadas:', newSelection);
                setSelectedMarcas(newSelection);
              }}
              colorScheme="orange"
            />

            {/* Filtro de Filial (Unidade) - MULTI-SELEÇÃO */}
            <MultiSelectFilter
              label="Filial"
              icon={<Building2 size={14} />}
              options={filiaisFiltradas}
              selected={selectedFiliais}
              onChange={(newSelection) => {
                console.log('🏢 Filiais selecionadas:', newSelection);
                setSelectedFiliais(newSelection);
              }}
              colorScheme="blue"
            />

            {/* Filtro de Tag01 - MULTI-SELEÇÃO */}
            <MultiSelectFilter
              label="Tag01"
              icon={<Layers size={14} />}
              options={filterOptions.tags01}
              selected={selectedTags01}
              onChange={(newSelection) => {
                console.log('🏷️ Tags01 selecionadas:', newSelection);
                setSelectedTags01(newSelection);
              }}
              colorScheme="purple"
            />

            {/* Controles de Período */}
            <div className="flex items-center gap-2 scale-100">
              <CalendarDays size={16} className="text-purple-600 shrink-0" />
              <span className="text-[12px] font-bold text-gray-700 whitespace-nowrap">Período:</span>

              {/* Atalhos rápidos */}
              <div className="flex gap-1">
                <button
                  onClick={() => { setSelectedMonthStart(0); setSelectedMonthEnd(11); }}
                  className={`px-2 py-1 text-[11px] font-black uppercase rounded transition-all shadow-sm whitespace-nowrap ${
                    selectedMonthStart === 0 && selectedMonthEnd === 11
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                  title="Ano completo"
                >
                  Ano
                </button>
                <button
                  onClick={() => { setSelectedMonthStart(0); setSelectedMonthEnd(2); }}
                  className={`px-2 py-1 text-[11px] font-black uppercase rounded transition-all shadow-sm whitespace-nowrap ${
                    selectedMonthStart === 0 && selectedMonthEnd === 2
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                  title="1º Trimestre"
                >
                  1T
                </button>
                <button
                  onClick={() => { setSelectedMonthStart(3); setSelectedMonthEnd(5); }}
                  className={`px-2 py-1 text-[11px] font-black uppercase rounded transition-all shadow-sm whitespace-nowrap ${
                    selectedMonthStart === 3 && selectedMonthEnd === 5
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                  title="2º Trimestre"
                >
                  2T
                </button>
                <button
                  onClick={() => { setSelectedMonthStart(6); setSelectedMonthEnd(8); }}
                  className={`px-2 py-1 text-[11px] font-black uppercase rounded transition-all shadow-sm whitespace-nowrap ${
                    selectedMonthStart === 6 && selectedMonthEnd === 8
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                  title="3º Trimestre"
                >
                  3T
                </button>
                <button
                  onClick={() => { setSelectedMonthStart(9); setSelectedMonthEnd(11); }}
                  className={`px-2 py-1 text-[11px] font-black uppercase rounded transition-all shadow-sm whitespace-nowrap ${
                    selectedMonthStart === 9 && selectedMonthEnd === 11
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                  title="4º Trimestre"
                >
                  4T
                </button>
              </div>

              {/* Seletores de mês */}
              <div className="flex items-center gap-1.5 bg-white border border-purple-300 px-2.5 py-1 rounded shadow-sm">
                <Calendar size={14} className="text-purple-600 shrink-0" />
                <div className="flex items-center gap-1.5">
                  <select
                    className="bg-transparent text-[12px] font-bold text-gray-900 outline-none cursor-pointer"
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
                  <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">até</span>
                  <select
                    className="bg-transparent text-[12px] font-bold text-gray-900 outline-none cursor-pointer"
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

            {/* Separador */}
            <div className="flex-1" />

            {/* Controle de Escopo EBITDA */}
            <button
              onClick={() => setShowOnlyEbitda(!showOnlyEbitda)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-md ${
                showOnlyEbitda
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'bg-gradient-to-r from-gray-600 to-slate-600 text-white'
              }`}
              title={showOnlyEbitda ? 'Exibindo apenas até EBITDA' : 'Exibindo todas as Tag0'}
            >
              {showOnlyEbitda ? (
                <>
                  <CheckSquare size={14} strokeWidth={2.5} />
                  <span>Até EBITDA</span>
                </>
              ) : (
                <>
                  <Square size={14} strokeWidth={2.5} />
                  <span>Todas Tag0</span>
                </>
              )}
            </button>

            {/* Botão Limpar Filtros (se houver filtros ativos) */}
            {hasAnyFilterActive && (
              <>
                <div className="h-8 w-px bg-blue-300 mx-0.5" />
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 bg-rose-50 text-rose-600 px-2 py-1 rounded border border-rose-200 font-bold text-[9px] uppercase tracking-wider hover:bg-rose-100 transition-all shadow-sm"
                  title="Limpar todos os filtros ativos"
                >
                  <FilterX size={12} />
                  <span className="whitespace-nowrap">Limpar</span>
                </button>
              </>
            )}
        </div>

      {/* Painel de Seleção de Colunas Visíveis - Só aparece no modo detalhado */}
      {presentationMode === 'detailed' && (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-2 py-1 rounded-lg border border-blue-100 shadow-sm">
        <div className="flex items-center justify-between gap-1.5">
          {/* Título */}
          <div className="flex items-center gap-1">
            <div className="p-0.5 rounded bg-blue-500 text-white">
              <TableIcon size={10} />
            </div>
            <h3 className="text-[9px] font-black text-gray-900 uppercase tracking-tight">Colunas</h3>
          </div>

          {/* Cards em linha horizontal */}
          <div className="flex items-center gap-1">
            {/* Real */}
            <button
              onClick={() => toggleElement('Real', showReal, setShowReal)}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded border transition-all ${
                showReal
                  ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {showReal ? <CheckSquare size={8} strokeWidth={3} /> : <Square size={8} strokeWidth={3} />}
              <span className="text-[8px] font-black uppercase">Real</span>
              {showReal && activeElements.indexOf('Real') >= 0 && (
                <span className="ml-0.5 bg-white/30 px-0.5 rounded text-[7px]">{activeElements.indexOf('Real') + 1}º</span>
              )}
            </button>

            {/* Orçado */}
            <button
              onClick={() => toggleElement('Orçado', showOrcado, setShowOrcado)}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded border transition-all ${
                showOrcado
                  ? 'bg-green-500 text-white border-green-500 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
              }`}
            >
              {showOrcado ? <CheckSquare size={8} strokeWidth={3} /> : <Square size={8} strokeWidth={3} />}
              <span className="text-[8px] font-black uppercase">Orçado</span>
              {showOrcado && activeElements.indexOf('Orçado') >= 0 && (
                <span className="ml-0.5 bg-white/30 px-0.5 rounded text-[7px]">{activeElements.indexOf('Orçado') + 1}º</span>
              )}
            </button>

            {/* A-1 */}
            <button
              onClick={() => toggleElement('A-1', showA1, setShowA1)}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded border transition-all ${
                showA1
                  ? 'bg-purple-500 text-white border-purple-500 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
              }`}
            >
              {showA1 ? <CheckSquare size={8} strokeWidth={3} /> : <Square size={8} strokeWidth={3} />}
              <span className="text-[8px] font-black uppercase">A-1</span>
              {showA1 && activeElements.indexOf('A-1') >= 0 && (
                <span className="ml-0.5 bg-white/30 px-0.5 rounded text-[7px]">{activeElements.indexOf('A-1') + 1}º</span>
              )}
            </button>

            {/* Δ % vs Orçado */}
            <button
              onClick={() => toggleElement('DeltaPercOrcado', showDeltaPercOrcado, setShowDeltaPercOrcado)}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded border transition-all ${
                showDeltaPercOrcado
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
              }`}
              title="Variação % vs Orçado"
            >
              {showDeltaPercOrcado ? <CheckSquare size={8} strokeWidth={3} /> : <Square size={8} strokeWidth={3} />}
              <span className="text-[8px] font-black uppercase">Δ% Orç</span>
              {showDeltaPercOrcado && activeElements.indexOf('DeltaPercOrcado') >= 0 && (
                <span className="ml-0.5 bg-white/30 px-0.5 rounded text-[7px]">{activeElements.indexOf('DeltaPercOrcado') + 1}º</span>
              )}
            </button>

            {/* Δ % vs A-1 */}
            <button
              onClick={() => toggleElement('DeltaPercA1', showDeltaPercA1, setShowDeltaPercA1)}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded border transition-all ${
                showDeltaPercA1
                  ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-400'
              }`}
              title="Variação % vs A-1"
            >
              {showDeltaPercA1 ? <CheckSquare size={8} strokeWidth={3} /> : <Square size={8} strokeWidth={3} />}
              <span className="text-[8px] font-black uppercase">Δ% A-1</span>
              {showDeltaPercA1 && activeElements.indexOf('DeltaPercA1') >= 0 && (
                <span className="ml-0.5 bg-white/30 px-0.5 rounded text-[7px]">{activeElements.indexOf('DeltaPercA1') + 1}º</span>
              )}
            </button>

            {/* Δ R$ vs Orçado */}
            <button
              onClick={() => toggleElement('DeltaAbsOrcado', showDeltaAbsOrcado, setShowDeltaAbsOrcado)}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded border transition-all ${
                showDeltaAbsOrcado
                  ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'
              }`}
              title="Variação R$ vs Orçado"
            >
              {showDeltaAbsOrcado ? <CheckSquare size={8} strokeWidth={3} /> : <Square size={8} strokeWidth={3} />}
              <span className="text-[8px] font-black uppercase">ΔR$ Orç</span>
              {showDeltaAbsOrcado && activeElements.indexOf('DeltaAbsOrcado') >= 0 && (
                <span className="ml-0.5 bg-white/30 px-0.5 rounded text-[7px]">{activeElements.indexOf('DeltaAbsOrcado') + 1}º</span>
              )}
            </button>

            {/* Δ R$ vs A-1 */}
            <button
              onClick={() => toggleElement('DeltaAbsA1', showDeltaAbsA1, setShowDeltaAbsA1)}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded border transition-all ${
                showDeltaAbsA1
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-rose-400'
              }`}
              title="Variação R$ vs A-1"
            >
              {showDeltaAbsA1 ? <CheckSquare size={8} strokeWidth={3} /> : <Square size={8} strokeWidth={3} />}
              <span className="text-[8px] font-black uppercase">ΔR$ A-1</span>
              {showDeltaAbsA1 && activeElements.indexOf('DeltaAbsA1') >= 0 && (
                <span className="ml-0.5 bg-white/30 px-0.5 rounded text-[7px]">{activeElements.indexOf('DeltaAbsA1') + 1}º</span>
              )}
            </button>

            {/* Separador */}
            <div className="h-6 w-px bg-gray-300" />

            {/* Toggle visualização: Por Cenário vs Por Mês */}
            <button
              onClick={() => setViewMode(viewMode === 'scenario' ? 'month' : 'scenario')}
              className="flex items-center gap-1 px-2 py-0.5 rounded border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-all"
              title="Alternar entre visualização por cenário ou por mês"
            >
              <ArrowLeftRight size={10} className="text-indigo-600" />
              <span className="text-[8px] font-black uppercase text-indigo-900">
                {viewMode === 'scenario' ? 'Cenário' : 'Mês'}
              </span>
            </button>

            {/* Aviso compacto */}
            {!showReal && !showOrcado && !showA1 && (
              <span className="text-[8px] font-bold text-yellow-800 bg-yellow-50 px-1.5 py-0.5 rounded">⚠️ 1+ cenário</span>
            )}
          </div>
        </div>
      </div>
      )}

      {/* 🎨 V2: Seção de Níveis Analíticos Dinâmicos - MELHORADO - Só aparece no modo detalhado */}
      {presentationMode === 'detailed' && (
      <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-red-50 px-2 py-1.5 rounded-lg border border-orange-200 shadow-sm">
        <div className={`p-1 rounded-lg transition-colors shadow-sm ${dynamicPath.length > 0 ? 'bg-gradient-to-br from-orange-600 to-red-600 text-white' : 'bg-white text-gray-400 border border-gray-200'}`}>
          <Layers size={12} />
        </div>
        <div className="flex flex-col pr-2 mr-2 border-r border-orange-200 shrink-0">
          <span className="text-[8px] font-black text-gray-500 uppercase tracking-wider">Drill-down</span>
          <span className="text-[10px] font-black text-gray-900 uppercase">Níveis 4-8</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {DRE_DIMENSIONS.map(dim => {
            const index = dynamicPath.indexOf(dim.id);
            const isActive = index !== -1;
            return (
              <button
                key={dim.id}
                onClick={() => toggleDimension(dim.id)}
                className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1.5 border shadow-sm ${
                  isActive
                    ? 'bg-gradient-to-br from-orange-600 to-red-600 text-white border-orange-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                }`}
              >
                {isActive && <span className="bg-white/30 px-1 py-0.5 rounded text-[8px] font-black">{index + 1}º</span>}
                <span>{dim.label}</span>
              </button>
            );
          })}
          <div className="h-4 w-px bg-gray-200 mx-0.5" />
          <button
            onClick={() => setDimensionSort(prev => prev === 'desc' ? 'asc' : prev === 'asc' ? 'alpha' : 'desc')}
            className="px-1.5 py-0.5 rounded-lg text-[8px] font-black uppercase transition-all flex items-center gap-1 border bg-[#1B75BB] text-white border-[#1B75BB] shadow-sm"
            title={dimensionSort === 'desc' ? 'Maior → Menor' : dimensionSort === 'asc' ? 'Menor → Maior' : 'Alfabético (A-Z)'}
          >
            {dimensionSort === 'desc' && <><ArrowDown10 size={11} /> Maior→Menor</>}
            {dimensionSort === 'asc' && <><ArrowUp10 size={11} /> Menor→Maior</>}
            {dimensionSort === 'alpha' && <><ArrowDownAZ size={11} /> A-Z</>}
          </button>
          {dynamicPath.length > 0 && (
            <button onClick={() => setDynamicPath([])} className="p-0.5 text-rose-500 hover:bg-rose-50 rounded-lg">
              <X size={10} />
            </button>
          )}
        </div>
      </div>
      )}

      {/* 🎨 V2: MODO EXECUTIVO COM CARDS - VERSÃO COMPLETA */}

      {/* 📊 MODAL FULLSCREEN - Gráfico Ampliado */}
      {fullscreenChart && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200">
          {/* Container do Gráfico */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <div>
                <h2 className="text-2xl font-black text-gray-900">{fullscreenChart.label}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Período: {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][selectedMonthStart]} - {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][selectedMonthEnd]} {currentYear}
                </p>
              </div>
              <button
                onClick={() => setFullscreenChart(null)}
                className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                title="Fechar"
              >
                <X size={24} />
              </button>
            </div>

            {/* Corpo do Gráfico */}
            <div className="flex-1 p-8 overflow-hidden flex flex-col">
              {fullscreenChart.layout === 'medium' ? (
                // Gráfico de Barras Agrupadas (Real vs Orçado)
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Legenda */}
                  <div className="flex items-center justify-center gap-6 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-t from-blue-400 to-blue-600"></div>
                      <span className="text-sm font-bold text-gray-700">Real</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-t from-purple-300/60 to-purple-500/60"></div>
                      <span className="text-sm font-bold text-gray-700">Orçado</span>
                    </div>
                  </div>

                  {/* Gráfico */}
                  <div className="flex-1 flex items-end gap-4 px-8 pb-12">
                    {fullscreenChart.realValues.slice(selectedMonthStart, selectedMonthEnd + 1).map((realVal, idx) => {
                      const orcadoVal = fullscreenChart.orcadoValues.slice(selectedMonthStart, selectedMonthEnd + 1)[idx] || 0;
                      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                      const monthName = months[selectedMonthStart + idx];

                      // Normalização baseada no valor máximo absoluto (escala proporcional)
                      const allValues = [
                        ...fullscreenChart.realValues.slice(selectedMonthStart, selectedMonthEnd + 1).map(v => Math.abs(v)),
                        ...fullscreenChart.orcadoValues.slice(selectedMonthStart, selectedMonthEnd + 1).map(v => Math.abs(v))
                      ];
                      const maxValue = Math.max(...allValues);

                      // Barras proporcionais ao valor (partindo de zero)
                      const realHeight = maxValue > 0 ? Math.max(3, (Math.abs(realVal) / maxValue) * 100) : 50;
                      const orcadoHeight = maxValue > 0 ? Math.max(3, (Math.abs(orcadoVal) / maxValue) * 100) : 50;

                      const variance = orcadoVal !== 0 ? (((realVal - orcadoVal) / Math.abs(orcadoVal)) * 100) : 0;

                      const deltaAbs = realVal - orcadoVal;
                      const isHovered = fullscreenHoveredMonth === idx;

                      return (
                        <div
                          key={idx}
                          className="flex-1 flex flex-col items-center group relative"
                          onMouseEnter={() => setFullscreenHoveredMonth(idx)}
                          onMouseLeave={() => setFullscreenHoveredMonth(null)}
                        >
                          {/* Tooltip Detalhado */}
                          {isHovered && (
                            <div className="absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in zoom-in-95 duration-200">
                              <div className="bg-gray-900 text-white rounded-xl shadow-2xl p-4 min-w-[220px]">
                                <div className="text-center space-y-2">
                                  <div className="text-sm font-black text-gray-300 border-b border-gray-700 pb-2">
                                    {monthName} {currentYear}
                                  </div>

                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between gap-3">
                                      <span className="text-xs text-blue-400 font-semibold">Real:</span>
                                      <span className="text-sm font-black text-white">
                                        R$ {(Math.abs(realVal) / 1000).toFixed(2).replace('.', ',')}K
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-3">
                                      <span className="text-xs text-purple-400 font-semibold">Orçado:</span>
                                      <span className="text-sm font-black text-white">
                                        R$ {(Math.abs(orcadoVal) / 1000).toFixed(2).replace('.', ',')}K
                                      </span>
                                    </div>

                                    <div className="border-t border-gray-700 pt-2 mt-2 space-y-1">
                                      <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs text-gray-400 font-semibold">Δ %:</span>
                                        <span className={`text-sm font-black ${
                                          variance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                        }`}>
                                          {variance >= 0 ? '+' : ''}{variance.toFixed(1)}%
                                        </span>
                                      </div>

                                      <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs text-gray-400 font-semibold">Δ R$:</span>
                                        <span className={`text-sm font-black ${
                                          deltaAbs >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                        }`}>
                                          {deltaAbs >= 0 ? '+' : ''}R$ {(Math.abs(deltaAbs) / 1000).toFixed(2).replace('.', ',')}K
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {/* Seta do tooltip */}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          )}

                          {/* Valores no topo */}
                          <div className="mb-2 space-y-1 text-center min-h-[60px] flex flex-col justify-end">
                            <div className="text-xs font-bold text-blue-600">
                              {formatValue(Math.abs(realVal) / 1000)}
                            </div>
                            <div className="text-xs font-bold text-purple-600">
                              {formatValue(Math.abs(orcadoVal) / 1000)}
                            </div>
                            {Math.abs(variance) >= 5 && (
                              <div className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                variance >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                              }`}>
                                {variance >= 0 ? '+' : ''}{variance.toFixed(0)}%
                              </div>
                            )}
                          </div>

                          {/* Barras */}
                          <div className={`flex items-end gap-2 flex-1 w-full transition-all duration-200 ${
                            isHovered ? 'scale-105' : ''
                          }`}>
                            {/* Barra Real */}
                            <div className="flex-1 flex items-end h-full">
                              <div
                                className={`w-full rounded-t-lg transition-all ${
                                  realVal >= 0
                                    ? 'bg-gradient-to-t from-blue-400 to-blue-600'
                                    : 'bg-gradient-to-t from-rose-400 to-rose-600'
                                }`}
                                style={{ height: `${realHeight}%`, minHeight: '20px' }}
                              />
                            </div>

                            {/* Barra Orçado */}
                            <div className="flex-1 flex items-end h-full">
                              <div
                                className={`w-full rounded-t-lg transition-all ${
                                  orcadoVal >= 0
                                    ? 'bg-gradient-to-t from-purple-300/60 to-purple-500/60'
                                    : 'bg-gradient-to-t from-gray-300/60 to-gray-500/60'
                                }`}
                                style={{ height: `${orcadoHeight}%`, minHeight: '20px' }}
                              />
                            </div>
                          </div>

                          {/* Label do mês */}
                          <div className="mt-3 text-sm font-bold text-gray-700">
                            {monthName}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Label do Eixo X */}
                  <div className="text-center mt-4">
                    <span className="text-sm font-bold text-gray-600">Meses</span>
                  </div>
                </div>
              ) : (
                // Gráfico de Área/Linha (Expandido)
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 relative overflow-hidden">
                    {/* Tooltip HTML para gráfico expandido */}
                    {fullscreenHoveredMonth !== null && (() => {
                      const hoveredIdx = fullscreenHoveredMonth;
                      const realVal = fullscreenChart.realValues.slice(selectedMonthStart, selectedMonthEnd + 1)[hoveredIdx];
                      const orcadoVal = fullscreenChart.orcadoValues.slice(selectedMonthStart, selectedMonthEnd + 1)[hoveredIdx];
                      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                      const monthName = months[selectedMonthStart + hoveredIdx];
                      const variance = orcadoVal !== 0 ? (((realVal - orcadoVal) / Math.abs(orcadoVal)) * 100) : 0;
                      const deltaAbs = realVal - orcadoVal;

                      const sparklineData = fullscreenChart.realValues.slice(selectedMonthStart, selectedMonthEnd + 1);
                      const maxVal = Math.max(...sparklineData);
                      const minVal = Math.min(...sparklineData);

                      // Calcular posição do tooltip (proporção no SVG viewBox 1000x500)
                      const xPercent = (hoveredIdx / (sparklineData.length - 1)) * 90 + 5; // 5% offset inicial
                      const yValue = maxVal !== minVal ? 450 - ((realVal - minVal) / (maxVal - minVal)) * 400 : 250;
                      const yPercent = (yValue / 500) * 100;

                      return (
                        <div
                          className="absolute z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-200"
                          style={{
                            left: `${xPercent}%`,
                            top: `${yPercent}%`,
                            transform: 'translate(-50%, -120%)'
                          }}
                        >
                          <div className="bg-gray-900 text-white rounded-xl shadow-2xl p-4 min-w-[220px]">
                            <div className="text-center space-y-2">
                              <div className="text-sm font-black text-gray-300 border-b border-gray-700 pb-2">
                                {monthName} {currentYear}
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-xs text-emerald-400 font-semibold">Real:</span>
                                  <span className="text-sm font-black text-white">
                                    R$ {(Math.abs(realVal) / 1000).toFixed(2).replace('.', ',')}K
                                  </span>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-xs text-purple-400 font-semibold">Orçado:</span>
                                  <span className="text-sm font-black text-white">
                                    R$ {(Math.abs(orcadoVal) / 1000).toFixed(2).replace('.', ',')}K
                                  </span>
                                </div>

                                <div className="border-t border-gray-700 pt-2 mt-2 space-y-1">
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-xs text-gray-400 font-semibold">Δ %:</span>
                                    <span className={`text-sm font-black ${
                                      variance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                    }`}>
                                      {variance >= 0 ? '+' : ''}{variance.toFixed(1)}%
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-xs text-gray-400 font-semibold">Δ R$:</span>
                                    <span className={`text-sm font-black ${
                                      deltaAbs >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                    }`}>
                                      {deltaAbs >= 0 ? '+' : ''}R$ {(Math.abs(deltaAbs) / 1000).toFixed(2).replace('.', ',')}K
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* Seta do tooltip */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      );
                    })()}
                    <svg className="w-full h-full" viewBox="0 0 1000 550" preserveAspectRatio="xMidYMid meet">
                      {/* Grid lines */}
                      {[0, 1, 2, 3, 4].map((i) => (
                        <line
                          key={i}
                          x1="50"
                          y1={50 + i * 100}
                          x2="950"
                          y2={50 + i * 100}
                          stroke="#e5e7eb"
                          strokeWidth="1"
                        />
                      ))}

                      {/* Eixos */}
                      <line x1="50" y1="50" x2="50" y2="450" stroke="#374151" strokeWidth="2" />
                      <line x1="50" y1="450" x2="950" y2="450" stroke="#374151" strokeWidth="2" />

                      {/* Label do eixo X */}
                      <text x="500" y="530" textAnchor="middle" fill="#6b7280" fontSize="18" fontWeight="bold">
                        Meses
                      </text>

                      {(() => {
                        const sparklineData = fullscreenChart.realValues.slice(selectedMonthStart, selectedMonthEnd + 1);
                        const maxVal = Math.max(...sparklineData);
                        const minVal = Math.min(...sparklineData);
                        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

                        return (
                          <>
                            {/* Área preenchida */}
                            <defs>
                              <linearGradient id="fullscreen-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                              </linearGradient>
                            </defs>
                            <path
                              d={`M 50 450 ${sparklineData.map((val, idx) => {
                                const x = 50 + (idx / (sparklineData.length - 1)) * 900;
                                const y = maxVal !== minVal ? 450 - ((val - minVal) / (maxVal - minVal)) * 400 : 250;
                                return `L ${x} ${y}`;
                              }).join(' ')} L 950 450 Z`}
                              fill="url(#fullscreen-gradient)"
                            />

                            {/* Linha */}
                            <path
                              d={`M ${sparklineData.map((val, idx) => {
                                const x = 50 + (idx / (sparklineData.length - 1)) * 900;
                                const y = maxVal !== minVal ? 450 - ((val - minVal) / (maxVal - minVal)) * 400 : 250;
                                return `${x} ${y}`;
                              }).join(' L ')}`}
                              fill="none"
                              stroke="#059669"
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            {/* Pontos com valores */}
                            {sparklineData.map((val, idx) => {
                              const x = 50 + (idx / (sparklineData.length - 1)) * 900;
                              const y = maxVal !== minVal ? 450 - ((val - minVal) / (maxVal - minVal)) * 400 : 250;
                              const monthName = months[selectedMonthStart + idx];
                              const isHovered = fullscreenHoveredMonth === idx;

                              return (
                                <g key={idx}>
                                  {/* Área de hover maior (invisível) */}
                                  <circle
                                    cx={x}
                                    cy={y}
                                    r="25"
                                    fill="transparent"
                                    className="cursor-pointer"
                                    onMouseEnter={() => setFullscreenHoveredMonth(idx)}
                                    onMouseLeave={() => setFullscreenHoveredMonth(null)}
                                  />
                                  {/* Ponto */}
                                  <circle
                                    cx={x}
                                    cy={y}
                                    r={isHovered ? "12" : "8"}
                                    fill="#059669"
                                    stroke="white"
                                    strokeWidth="3"
                                    className="transition-all pointer-events-none"
                                  />
                                  {/* Valor acima do ponto */}
                                  <text
                                    x={x}
                                    y={y - 20}
                                    textAnchor="middle"
                                    fill="#059669"
                                    fontSize="16"
                                    fontWeight="bold"
                                  >
                                    {formatValue(val / 1000)}
                                  </text>
                                  {/* Label do mês */}
                                  <text
                                    x={x}
                                    y={470}
                                    textAnchor="middle"
                                    fill="#374151"
                                    fontSize="14"
                                    fontWeight="bold"
                                  >
                                    {monthName}
                                  </text>
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Footer com estatísticas */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="grid grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-xs text-gray-500 font-semibold">Total Real</p>
                  <p className="text-xl font-black text-blue-600">
                    {formatValue(fullscreenChart.realValues.slice(selectedMonthStart, selectedMonthEnd + 1).reduce((a, b) => a + b, 0) / 1000)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 font-semibold">Total Orçado</p>
                  <p className="text-xl font-black text-purple-600">
                    {formatValue(fullscreenChart.orcadoValues.slice(selectedMonthStart, selectedMonthEnd + 1).reduce((a, b) => a + b, 0) / 1000)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 font-semibold">Variação Absoluta</p>
                  <p className={`text-xl font-black ${
                    (fullscreenChart.realValues.slice(selectedMonthStart, selectedMonthEnd + 1).reduce((a, b) => a + b, 0) -
                     fullscreenChart.orcadoValues.slice(selectedMonthStart, selectedMonthEnd + 1).reduce((a, b) => a + b, 0)) >= 0
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  }`}>
                    {((fullscreenChart.realValues.slice(selectedMonthStart, selectedMonthEnd + 1).reduce((a, b) => a + b, 0) -
                       fullscreenChart.orcadoValues.slice(selectedMonthStart, selectedMonthEnd + 1).reduce((a, b) => a + b, 0)) >= 0 ? '+' : '')}
                    {formatValue((fullscreenChart.realValues.slice(selectedMonthStart, selectedMonthEnd + 1).reduce((a, b) => a + b, 0) -
                                  fullscreenChart.orcadoValues.slice(selectedMonthStart, selectedMonthEnd + 1).reduce((a, b) => a + b, 0)) / 1000)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 font-semibold">Variação %</p>
                  <p className={`text-xl font-black ${
                    (() => {
                      const real = fullscreenChart.realValues.slice(selectedMonthStart, selectedMonthEnd + 1).reduce((a, b) => a + b, 0);
                      const orcado = fullscreenChart.orcadoValues.slice(selectedMonthStart, selectedMonthEnd + 1).reduce((a, b) => a + b, 0);
                      return ((real - orcado) / Math.abs(orcado)) * 100 >= 0 ? 'text-emerald-600' : 'text-rose-600';
                    })()
                  }`}>
                    {(() => {
                      const real = fullscreenChart.realValues.slice(selectedMonthStart, selectedMonthEnd + 1).reduce((a, b) => a + b, 0);
                      const orcado = fullscreenChart.orcadoValues.slice(selectedMonthStart, selectedMonthEnd + 1).reduce((a, b) => a + b, 0);
                      const variance = orcado !== 0 ? ((real - orcado) / Math.abs(orcado)) * 100 : 0;
                      return `${variance >= 0 ? '+' : ''}${variance.toFixed(1)}%`;
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🎨 V2: TABELA DETALHADA (só mostra se presentationMode === 'detailed') */}
      {presentationMode === 'detailed' && (
      <>
        {/* Seção informativa do modo de visualização */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 shadow-sm p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-1.5 rounded-lg shadow-sm">
              <Brain size={14} className="text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900">💡 Modo Detalhado</span>
              <div className="h-4 w-px bg-indigo-300" />
              <p className="text-xs text-gray-700">
                <span className="font-bold text-indigo-600">
                  {(() => {
                    const ebitdaPrefixes = ['01.', '02.', '03.', '04.'];
                    const totalTag0 = Object.keys(dreStructure.data).length;
                    const displayedTag0 = showOnlyEbitda
                      ? Object.values(dreStructure.data).filter(n => ebitdaPrefixes.some(p => n.label.startsWith(p))).length
                      : totalTag0;
                    return `${displayedTag0}/${totalTag0}`;
                  })()}
                </span>
                <span className="text-gray-600 ml-1">Tag0</span>
                {showOnlyEbitda && (
                  <span className="ml-1 text-[9px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-full">
                    EBITDA
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 shadow-2xl overflow-hidden relative">
        {/* Loading overlay */}
        {isLoadingDRE && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-sm z-[100] flex items-center justify-center">
            <div className="text-center bg-white rounded-2xl shadow-xl p-8 border-2 border-indigo-100">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-lg font-black text-gray-900 mb-1">Carregando DRE V2 (Teste)</p>
              <p className="text-sm text-gray-600">Processando dados financeiros...</p>
            </div>
          </div>
        )}
        <div className="overflow-x-auto max-h-[calc(100vh-260px)] overflow-y-auto dre-scrollbar">
          <table className="border-separate border-spacing-0 text-left table-auto min-w-full">
            <thead className="sticky top-0 z-50 shadow-lg">
              <tr className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white h-7">
                <th rowSpan={2} className={`sticky left-0 z-[60] bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-1 text-[9px] font-black uppercase tracking-wider ${viewMode === 'scenario' ? 'border-r-2 border-r-white/20' : ''} w-[280px] shadow-lg`}>
                  <div className="flex items-center gap-2">
                    <TableIcon size={14} />
                    <span>Contas Gerenciais</span>
                  </div>
                </th>

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

                    const scenarioGradients = {
                      'Real': 'bg-gradient-to-r from-blue-600 to-blue-500',
                      'Orçado': 'bg-gradient-to-r from-emerald-600 to-emerald-500',
                      'A-1': 'bg-gradient-to-r from-purple-600 to-purple-500'
                    };

                    return (
                      <React.Fragment key={`header-${element}`}>
                        {/* Colunas do cenário */}
                        <th colSpan={filteredMonths.length} className={`px-2 py-1.5 text-center text-[10px] font-black border-b border-white/20 uppercase tracking-widest ${scenarioGradients[element as keyof typeof scenarioGradients]} shadow-sm`}>
                          <div className="flex items-center justify-center gap-1">
                            <Activity size={12} />
                            <span>Evolução Mensal ({scenarioLabels[element as keyof typeof scenarioLabels]})</span>
                          </div>
                        </th>
                        <th rowSpan={2} className={`px-2 py-2 text-center text-[10px] font-black border-l-2 border-white/30 border-r-2 border-r-white/20 w-[110px] ${scenarioGradients[element as keyof typeof scenarioGradients]} shadow-md`}>
                          <div className="flex flex-col items-center gap-0.5">
                            <TrendingUpDown size={12} />
                            <span>YTD</span>
                            <span className="text-[9px] font-bold">{scenarioLabels[element as keyof typeof scenarioLabels]}</span>
                          </div>
                        </th>
                      </React.Fragment>
                    );
                  } else if (isDelta) {
                    const isPercentual = element.includes('Perc');
                    let compareLabel = '';
                    let deltaGradient = '';

                    if (element.includes('Orcado')) {
                      compareLabel = 'Orç';
                      deltaGradient = 'bg-gradient-to-r from-teal-600 to-teal-500';
                    } else if (element.includes('A1')) {
                      compareLabel = 'A-1';
                      deltaGradient = 'bg-gradient-to-r from-violet-600 to-violet-500';
                    }

                    return (
                      <React.Fragment key={`header-${element}`}>
                        <th colSpan={filteredMonths.length} className={`px-2 py-1.5 text-center text-[10px] font-black border-b border-white/20 uppercase tracking-widest ${deltaGradient} shadow-sm`}>
                          <div className="flex items-center justify-center gap-1">
                            <Percent size={12} />
                            <span>Δ vs {compareLabel} {isPercentual ? '%' : 'R$'} (Mensal)</span>
                          </div>
                        </th>
                        <th rowSpan={2} className={`px-2 py-2 text-center text-[10px] font-black border-l-2 border-white/30 border-r-2 border-r-white/20 w-[110px] ${deltaGradient} shadow-md`}>
                          <div className="flex flex-col items-center gap-0.5">
                            <ArrowUpDown size={12} />
                            <span>YTD Δ</span>
                            <span className="text-[9px] font-bold">{compareLabel}</span>
                          </div>
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
              <tr className="bg-gradient-to-r from-slate-700 to-slate-600 text-white h-6">
                {/* Segunda linha do header com os meses */}
                {viewMode === 'scenario' && activeElements.map((element) => {
                  const isScenario = ['Real', 'Orçado', 'A-1'].includes(element);
                  const isDelta = element.startsWith('Delta');

                  if (isScenario) {
                    const scenarioGradients = {
                      'Real': 'bg-gradient-to-br from-blue-500 to-blue-600',
                      'Orçado': 'bg-gradient-to-br from-emerald-500 to-emerald-600',
                      'A-1': 'bg-gradient-to-br from-purple-500 to-purple-600'
                    };

                    return (
                      <React.Fragment key={`months-${element}`}>
                        {/* Meses do cenário */}
                        {filteredMonths.map((m, idx) => {
                          const isLastMonth = idx === filteredMonths.length - 1;
                          return (
                            <th key={`${element}-${m}`} className={`px-1 py-0.5 text-center text-[9px] font-black w-[85px] ${scenarioGradients[element as keyof typeof scenarioGradients]} ${isLastMonth ? '' : 'border-r-2 border-white/10'}`}>
                              {m}
                            </th>
                          );
                        })}
                      </React.Fragment>
                    );
                  } else if (isDelta) {
                    const isPercentual = element.includes('Perc');
                    let deltaGradient = '';

                    if (element.includes('Orcado')) {
                      deltaGradient = 'bg-gradient-to-br from-teal-500 to-teal-600';
                    } else if (element.includes('A1')) {
                      deltaGradient = 'bg-gradient-to-br from-violet-500 to-violet-600';
                    }

                    const colWidth = isPercentual ? 'w-[75px]' : 'w-[90px]';
                    return (
                      <React.Fragment key={`months-${element}`}>
                        {/* Meses das colunas delta */}
                        {filteredMonths.map((m, idx) => {
                          const isLastMonth = idx === filteredMonths.length - 1;
                          return (
                            <th key={`${element}-${m}`} className={`px-1 py-0.5 text-center text-[9px] font-black ${colWidth} ${deltaGradient} ${isLastMonth ? '' : 'border-r-2 border-white/10'}`}>
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
                // 🎯 Filtrar por EBITDA apenas se showOnlyEbitda estiver ativo
                const ebitdaPrefixes = ['01.', '02.', '03.', '04.'];
                const entries = Object.entries(dreStructure.data)
                  .filter(([, nivel1Data]) => {
                    // Se showOnlyEbitda for false, mostrar todas as tag0
                    if (!showOnlyEbitda) return true;
                    // Se showOnlyEbitda for true, filtrar apenas tag0s 01-04
                    return ebitdaPrefixes.some(p => nivel1Data.label.startsWith(p));
                  })
                  .sort(([a], [b]) => a.localeCompare(b));

                // Classificar grupos pelo prefixo do tag0 (ex: "01." = receita, "02."/"03." = custos diretos)
                const revenueCategories: string[] = [];        // 01.* = Receita
                const variableCostCategories: string[] = [];   // 02.* = Custos Variáveis
                const fixedCostCategories: string[] = [];      // 03.* = Custos Fixos
                const allCostCategories: string[][] = [];      // Todos os custos (para EBITDA)

                entries.forEach(([, nivel1Data]) => {
                  // items agora é Record<tag01, contas[]> - flatten para pegar todas as contas
                  const tag01Items = nivel1Data.items as Record<string, string[]>;
                  const allCats = Object.values(tag01Items).flat();
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

                // 🔍 DEBUG: Log para verificar se categories estão corretas
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('🎨 [RENDERIZAÇÃO] Renderizando tag0 → tag01 → contas');
                console.log('   Filtros ativos:', { marca: selectedMarcas.length > 0 ? selectedMarcas.join(', ') : 'TODAS', filial: selectedFiliais.length > 0 ? selectedFiliais.join(', ') : 'TODAS' });
                console.log('   Total de tag0s a renderizar:', entries.length);

                return (
                  <>
                    {entries.map(([nivel1Code, nivel1Data], entryIdx) => {
                      // items é Record<tag01, contas[]> - flatten para pegar todas as contas
                      const tag01Items = nivel1Data.items as Record<string, string[]>;
                      const allCategories = Object.values(tag01Items).flat();

                      // 🔍 DEBUG: Verificar se as contas existem no dataMap
                      const contasNoDataMap = allCategories.filter(c => dataMap['Real'][c] !== undefined).length;
                      const valorTotal = allCategories.reduce((sum, c) => {
                        const vals = dataMap['Real'][c] || new Array(12).fill(0);
                        return sum + vals.reduce((s, v) => s + v, 0);
                      }, 0);

                      // Log para todos os tag0s
                      console.log(`   📊 ${nivel1Data.label} (${nivel1Code}):`);
                      console.log(`      - Total tag01s: ${Object.keys(tag01Items).length}`);
                      console.log(`      - Total contas: ${allCategories.length}`);
                      console.log(`      - Contas no dataMap: ${contasNoDataMap}`);
                      console.log(`      - Valor total Real: R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);

                      // Verificar YTD que será exibido na tela
                      const valoresReal = getValues('Real', allCategories);
                      const ytdCalculado = valoresReal.reduce((a, b) => a + b, 0);
                      console.log(`      - YTD que será exibido: R$ ${ytdCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);

                      return (
                        <React.Fragment key={nivel1Code}>
                          {renderRow(nivel1Code, nivel1Data.label, 1, allCategories, true)}

                          {/* MARGEM DE CONTRIBUIÇÃO: Receita - (Custos Var + Custos Fix), após grupo 03 */}
                          {showOnlyEbitda && entryIdx === margemAfterIdx && margemAfterIdx >= 0 && revenueCategories.length > 0 && renderCalculationLine(
                            '05. MARGEM DE CONTRIBUIÇÃO',
                            revenueCategories,
                            [variableCostCategories, fixedCostCategories].filter(c => c.length > 0),
                            'bg-[#F44C00]'
                          )}
                        </React.Fragment>
                      );
                    })}

                    {/* EBITDA: Receita - todos os custos (só renderiza se filtro EBITDA ativo) */}
                    {showOnlyEbitda && revenueCategories.length > 0 && allCostCategories.length > 0 && renderCalculationLine(
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
      </>
      )}
      {/* FIM DO MODO DETALHADO */}

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
        {/* 🎯 CARD DESTAQUES ANALÍTICOS - Expandível com múltiplos modos */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl shadow-sm md:col-span-2 lg:col-span-1 overflow-hidden">
          {/* Header do card */}
          <div className="p-2 flex items-start gap-2">
            <div className="bg-white p-1.5 rounded-lg shadow-sm text-emerald-600 shrink-0">
              <CheckSquare size={14} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-[9px] font-black text-emerald-900 uppercase tracking-wider">Destaques Analíticos</h4>
                <button
                  onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
                  className="text-emerald-600 hover:bg-emerald-100 p-0.5 rounded transition-colors"
                  title={isAnalysisExpanded ? "Recolher" : "Expandir opções"}
                >
                  {isAnalysisExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>
              <p className="text-[8px] font-medium text-emerald-800 leading-snug">
                {analysisMode === 'none' && 'Explore os dados com o mouse para destacar células'}
                {analysisMode === 'visual-alerts' && `🚨 ${topDeviations.length} alertas de desvios significativos`}
                {analysisMode === 'insights-dashboard' && `📊 Top ${Math.min(5, topDeviations.length)} maiores desvios identificados`}
                {analysisMode === 'ai-analysis' && '🤖 Análise inteligente com IA ativada'}
                {analysisMode === 'guided-mode' && `🧭 Navegação guiada (${guidedModeIndex + 1}/${topDeviations.length})`}
              </p>
            </div>
          </div>

          {/* Opções de análise (expandível) */}
          {isAnalysisExpanded && (
            <div className="border-t border-emerald-200 bg-white/50 p-2 space-y-1.5">
              <p className="text-[7px] font-black text-emerald-900 uppercase tracking-wider mb-1">Escolha o modo de análise:</p>

              {/* Modo: Nenhum (padrão) */}
              <button
                onClick={() => setAnalysisMode('none')}
                className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-left transition-all ${
                  analysisMode === 'none'
                    ? 'bg-emerald-100 border border-emerald-300 shadow-sm'
                    : 'bg-white border border-emerald-100 hover:bg-emerald-50'
                }`}
              >
                {analysisMode === 'none' ? <CheckSquare size={10} className="text-emerald-600 shrink-0" /> : <Square size={10} className="text-gray-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-[8px] font-bold text-gray-900">🔍 Padrão (Apenas Hover)</div>
                  <div className="text-[7px] text-gray-600 truncate">Destaque ao passar o mouse</div>
                </div>
              </button>

              {/* Modo: Alertas Visuais */}
              <button
                onClick={() => setAnalysisMode('visual-alerts')}
                className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-left transition-all ${
                  analysisMode === 'visual-alerts'
                    ? 'bg-orange-100 border border-orange-300 shadow-sm'
                    : 'bg-white border border-emerald-100 hover:bg-emerald-50'
                }`}
              >
                {analysisMode === 'visual-alerts' ? <CheckSquare size={10} className="text-orange-600 shrink-0" /> : <Square size={10} className="text-gray-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-[8px] font-bold text-gray-900">🚨 Alertas Visuais</div>
                  <div className="text-[7px] text-gray-600 truncate">Ícones em células com desvios ≥ 10%</div>
                </div>
              </button>

              {/* Modo: Dashboard de Insights */}
              <button
                onClick={() => setAnalysisMode('insights-dashboard')}
                className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-left transition-all ${
                  analysisMode === 'insights-dashboard'
                    ? 'bg-blue-100 border border-blue-300 shadow-sm'
                    : 'bg-white border border-emerald-100 hover:bg-emerald-50'
                }`}
              >
                {analysisMode === 'insights-dashboard' ? <CheckSquare size={10} className="text-blue-600 shrink-0" /> : <Square size={10} className="text-gray-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-[8px] font-bold text-gray-900">📊 Dashboard de Insights</div>
                  <div className="text-[7px] text-gray-600 truncate">Lista top 5 maiores desvios</div>
                </div>
              </button>

              {/* Modo: Análise com IA */}
              <button
                onClick={() => setAnalysisMode('ai-analysis')}
                className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-left transition-all ${
                  analysisMode === 'ai-analysis'
                    ? 'bg-purple-100 border border-purple-300 shadow-sm'
                    : 'bg-white border border-emerald-100 hover:bg-emerald-50'
                }`}
              >
                {analysisMode === 'ai-analysis' ? <CheckSquare size={10} className="text-purple-600 shrink-0" /> : <Square size={10} className="text-gray-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-[8px] font-bold text-gray-900 flex items-center gap-1">
                    🤖 Análise com IA
                    {topDeviations.length > 0 && (
                      <span className="bg-purple-500 text-white text-[6px] px-1 rounded-full font-black">
                        {topDeviations.length}
                      </span>
                    )}
                  </div>
                  <div className="text-[7px] text-gray-600 truncate">
                    {topDeviations.length > 0
                      ? `Análise de ${topDeviations.length} desvios encontrados`
                      : `Ajuste threshold para ver análise`}
                  </div>
                </div>
              </button>

              {/* Modo: Navegação Guiada */}
              <button
                onClick={() => {
                  setAnalysisMode('guided-mode');
                  setGuidedModeIndex(0);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-left transition-all ${
                  analysisMode === 'guided-mode'
                    ? 'bg-indigo-100 border border-indigo-300 shadow-sm'
                    : 'bg-white border border-emerald-100 hover:bg-emerald-50'
                }`}
              >
                {analysisMode === 'guided-mode' ? <CheckSquare size={10} className="text-indigo-600 shrink-0" /> : <Square size={10} className="text-gray-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-[8px] font-bold text-gray-900">🧭 Modo Guiado</div>
                  <div className="text-[7px] text-gray-600 truncate">Navegação passo a passo pelos desvios</div>
                </div>
              </button>
            </div>
          )}

          {/* Mensagem: Nenhum desvio/dado encontrado (todos os modos que dependem de topDeviations) */}
          {(analysisMode === 'visual-alerts' || analysisMode === 'insights-dashboard' || analysisMode === 'ai-analysis' || analysisMode === 'guided-mode') && topDeviations.length === 0 && (() => {
            // Verificar se tem dados Real, Orçado ou A-1
            const hasReal = summaryRows?.some(r => r.scenario === 'Real') || false;
            const hasBudget = summaryRows?.some(r => r.scenario === 'Orçado') || false;
            const hasA1 = summaryRows?.some(r => r.scenario === 'A-1') || false;
            const hasComparison = hasBudget || hasA1;

            return (
              <div className="border-t border-emerald-200 bg-gradient-to-br from-gray-50 to-emerald-50 p-2">
                <div className="bg-white/80 border border-gray-200 rounded-lg p-2 text-center">
                  {hasReal && !hasComparison ? (
                    <>
                      <p className="text-[8px] font-bold text-gray-700 mb-1">📊 Nenhum dado Real encontrado</p>
                      <p className="text-[7px] text-gray-600">
                        Aplique filtros para carregar dados e ver análise
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[8px] font-bold text-gray-700 mb-1">📊 Nenhum desvio significativo encontrado</p>
                      <p className="text-[7px] text-gray-600 mb-2">
                        Não há variações ≥ {deviationThreshold}% vs Orçado ou A-1
                      </p>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setDeviationThreshold(Math.max(1, deviationThreshold - 1))}
                          className="bg-blue-500 text-white px-2 py-0.5 rounded text-[7px] font-bold hover:bg-blue-600 transition-colors"
                        >
                          - Reduzir para {Math.max(1, deviationThreshold - 1)}%
                        </button>
                        <span className="text-[7px] font-bold text-gray-700">{deviationThreshold}%</span>
                        <button
                          onClick={() => setDeviationThreshold(Math.min(20, deviationThreshold + 1))}
                          className="bg-blue-500 text-white px-2 py-0.5 rounded text-[7px] font-bold hover:bg-blue-600 transition-colors"
                        >
                          + Aumentar para {Math.min(20, deviationThreshold + 1)}%
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Dashboard de Insights (quando modo ativo) */}
          {analysisMode === 'insights-dashboard' && topDeviations.length > 0 && (
            <div className="border-t border-emerald-200 bg-gradient-to-br from-blue-50 to-emerald-50 p-2 space-y-1">
              <p className="text-[7px] font-black text-blue-900 uppercase tracking-wider mb-1 flex items-center gap-1">
                <TrendingUpDown size={10} />
                {topDeviations[0]?.compare === 0 ? `Top ${Math.min(5, topDeviations.length)} Maiores Valores` : `Top ${Math.min(5, topDeviations.length)} Maiores Desvios`}
              </p>
              {topDeviations.slice(0, 5).map((dev, idx) => (
                <div
                  key={idx}
                  className="bg-white/80 border border-blue-100 rounded-lg p-1.5 hover:bg-white hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[8px] font-bold text-gray-900 truncate">{dev.label}</div>
                      <div className="text-[7px] text-gray-600 truncate">{dev.category}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      {dev.compare === 0 ? (
                        <>
                          <div className={`text-[8px] font-black ${dev.real < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            R$ {Math.abs(dev.real).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </div>
                          <div className="text-[6px] text-gray-500">
                            {dev.real < 0 ? 'Despesa' : 'Receita'}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={`text-[8px] font-black ${dev.variation > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {dev.variation > 0 ? '+' : ''}{dev.variation.toFixed(1)}%
                          </div>
                          <div className="text-[6px] text-gray-500">
                            vs {dev.type === 'budget' ? 'Orç' : 'A-1'}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Navegação Guiada (quando modo ativo) */}
          {analysisMode === 'guided-mode' && topDeviations.length > 0 && (
            <div className="border-t border-emerald-200 bg-gradient-to-br from-indigo-50 to-emerald-50 p-2">
              {(() => {
                const currentDev = topDeviations[guidedModeIndex];
                return (
                  <div className="space-y-2">
                    <div className="bg-white/90 border border-indigo-200 rounded-lg p-2 shadow-sm">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[7px] font-black text-indigo-900 uppercase tracking-wider">
                          {currentDev.compare === 0 ? 'Item' : 'Desvio'} {guidedModeIndex + 1} de {topDeviations.length}
                        </span>
                        {currentDev.compare === 0 ? (
                          <span className={`text-[9px] font-black ${currentDev.real < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            R$ {Math.abs(currentDev.real).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                        ) : (
                          <span className={`text-[9px] font-black ${currentDev.variation > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {currentDev.variation > 0 ? '+' : ''}{currentDev.variation.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <div className="text-[8px] font-bold text-gray-900 mb-0.5">{currentDev.label}</div>
                      <div className="text-[7px] text-gray-600 mb-1">{currentDev.category}</div>
                      <div className="text-[7px] text-gray-700 bg-indigo-50 rounded px-1.5 py-0.5">
                        {currentDev.compare === 0 ? (
                          <>
                            <span className="font-semibold">Valor Real:</span> R$ {currentDev.real.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            <span className="ml-1 text-gray-500">({currentDev.real < 0 ? 'Despesa' : 'Receita'})</span>
                          </>
                        ) : (
                          <>
                            <span className="font-semibold">Real:</span> R$ {currentDev.real.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} |
                            <span className="font-semibold ml-1">{currentDev.type === 'budget' ? 'Orç' : 'A-1'}:</span> R$ {currentDev.compare.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setGuidedModeIndex(Math.max(0, guidedModeIndex - 1))}
                        disabled={guidedModeIndex === 0}
                        className="flex-1 bg-white border border-indigo-200 text-indigo-600 px-2 py-1 rounded-lg text-[7px] font-bold hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        ← Anterior
                      </button>
                      <button
                        onClick={() => setGuidedModeIndex(Math.min(topDeviations.length - 1, guidedModeIndex + 1))}
                        disabled={guidedModeIndex === topDeviations.length - 1}
                        className="flex-1 bg-indigo-600 text-white px-2 py-1 rounded-lg text-[7px] font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Próximo →
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Análise com IA (quando modo ativo) */}
          {analysisMode === 'ai-analysis' && topDeviations.length > 0 && (
            <div className="border-t border-emerald-200 bg-gradient-to-br from-purple-50 to-emerald-50 p-2 space-y-1.5">
              <p className="text-[7px] font-black text-purple-900 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Brain size={10} />
                Análise Inteligente
              </p>
              <div className="bg-white/80 border border-purple-100 rounded-lg p-2 space-y-1">
                {topDeviations[0].compare === 0 ? (
                  <>
                    <p className="text-[8px] font-bold text-gray-900">
                      💰 Análise dos {topDeviations.length} maiores valores em termos absolutos
                    </p>
                    <p className="text-[7px] text-gray-700 leading-relaxed">
                      {topDeviations[0].real < 0 ? '🔴' : '🟢'} <span className="font-semibold">{topDeviations[0].label}</span> apresenta o maior valor absoluto:
                      <span className={`font-black ml-0.5 ${topDeviations[0].real < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        R$ {Math.abs(topDeviations[0].real).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span> ({topDeviations[0].real < 0 ? 'Despesa' : 'Receita'}).
                      {topDeviations[0].real < 0
                        ? ' Representa a maior despesa no período.'
                        : ' Representa a maior receita no período.'}
                    </p>
                    {topDeviations.length > 1 && (
                      <p className="text-[7px] text-gray-600">
                        Outros valores relevantes: {topDeviations.slice(1, 3).map(d => d.label).join(', ')}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-[8px] font-bold text-gray-900">
                      📊 Identificados {topDeviations.length} desvios significativos (≥ {deviationThreshold}%)
                    </p>
                    <p className="text-[7px] text-gray-700 leading-relaxed">
                      {topDeviations[0].variation > 0 ? '🔴' : '🟢'} <span className="font-semibold">{topDeviations[0].label}</span> apresenta a maior variação:
                      <span className={`font-black ml-0.5 ${topDeviations[0].variation > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {topDeviations[0].variation > 0 ? '+' : ''}{topDeviations[0].variation.toFixed(1)}%
                      </span> vs {topDeviations[0].type === 'budget' ? 'Orçado' : 'A-1'}.
                      {topDeviations[0].variation > 0
                        ? ' Sugere-se investigar causas do aumento.'
                        : ' Resultado positivo, mantendo abaixo do esperado.'}
                    </p>
                    {topDeviations.length > 1 && (
                      <p className="text-[7px] text-gray-600">
                        Outros desvios relevantes: {topDeviations.slice(1, 3).map(d => d.label).join(', ')}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🎨 V2: Modal de Comparação de Cards */}
      {showComparison && selectedCardsForComparison.length === 2 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-auto animate-in zoom-in-95 slide-in-from-bottom-4">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black flex items-center gap-2">
                  <ArrowLeftRight size={24} />
                  Comparação de Cards
                </h2>
                <p className="text-sm opacity-90">Análise comparativa detalhada</p>
              </div>
              <button
                onClick={() => setShowComparison(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {selectedCardsForComparison.map((code) => {
                  const node = dreStructure.data[code];
                  if (!node) return null;

                  // items é Record<tag01, contas[]> - flatten
                  const tag01Items = node.items as Record<string, string[]>;
                  const categories = Object.values(tag01Items).flat();
                  const realValues = getValues('Real', categories);
                  const orcadoValues = getValues('Orçado', categories);
                  const realTotal = realValues.slice(selectedMonthStart, selectedMonthEnd + 1).reduce((sum, val) => sum + val, 0);
                  const orcadoTotal = orcadoValues.slice(selectedMonthStart, selectedMonthEnd + 1).reduce((sum, val) => sum + val, 0);
                  const delta = orcadoTotal !== 0 ? ((realTotal - orcadoTotal) / Math.abs(orcadoTotal) * 100) : 0;
                  const sparklineData = realValues.slice(selectedMonthStart, selectedMonthEnd + 1);
                  const maxVal = Math.max(...sparklineData);
                  const minVal = Math.min(...sparklineData);
                  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

                  return (
                    <div key={code} className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                      {/* Header */}
                      <div className="mb-6">
                        <h3 className="text-xl font-black text-gray-900 mb-2">{node.label}</h3>
                        <div className="flex items-center gap-4">
                          <div className={`px-3 py-1 rounded-full text-sm font-black ${
                            delta >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {delta >= 0 ? '+' : ''}{delta.toFixed(0)}%
                          </div>
                          <p className="text-sm text-gray-600 font-semibold">{Object.keys(tag01Items).length} tag01s</p>
                        </div>
                      </div>

                      {/* Valor */}
                      <div className="mb-6 p-4 bg-white rounded-lg">
                        <p className="text-xs text-gray-500 font-semibold mb-1">Real (Período Filtrado)</p>
                        <p className="text-3xl font-black text-gray-900">
                          {realTotal >= 0 ? 'R$ ' : '-R$ '}
                          {formatValue(realTotal / 1000)}
                        </p>
                      </div>

                      {/* Gráfico */}
                      <div className="mb-6">
                        <p className="text-xs text-gray-500 font-semibold mb-2">Evolução Mensal</p>
                        <div className="h-32">
                          <svg className="w-full h-full">
                            <defs>
                              <linearGradient id={`comp-gradient-${code}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={realTotal >= 0 ? '#10b981' : '#ef4444'} stopOpacity="0.6" />
                                <stop offset="100%" stopColor={realTotal >= 0 ? '#10b981' : '#ef4444'} stopOpacity="0.1" />
                              </linearGradient>
                            </defs>
                            <path
                              d={`M 0 ${100} ${sparklineData.map((val, idx) => {
                                const x = (idx / (sparklineData.length - 1)) * 100;
                                const y = maxVal !== minVal ? 100 - ((val - minVal) / (maxVal - minVal)) * 90 : 50;
                                return `L ${x} ${y}`;
                              }).join(' ')} L 100 100 Z`}
                              fill={`url(#comp-gradient-${code})`}
                            />
                            <path
                              d={`M 0 ${maxVal !== minVal ? 100 - ((sparklineData[0] - minVal) / (maxVal - minVal)) * 90 : 50} ${sparklineData.map((val, idx) => {
                                const x = (idx / (sparklineData.length - 1)) * 100;
                                const y = maxVal !== minVal ? 100 - ((val - minVal) / (maxVal - minVal)) * 90 : 50;
                                return `L ${x} ${y}`;
                              }).join(' ')}`}
                              fill="none"
                              stroke={realTotal >= 0 ? '#059669' : '#dc2626'}
                              strokeWidth="2"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Detalhes por Mês */}
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 font-semibold mb-2">Valores Mensais</p>
                        {sparklineData.map((val, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-gray-600">
                              {months[selectedMonthStart + idx]}
                            </span>
                            <span className={`font-black ${val >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {formatValue(val / 1000)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Análise Comparativa */}
              <div className="mt-6 p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                <h4 className="text-lg font-black text-blue-900 mb-4">📊 Análise Comparativa</h4>
                {(() => {
                  const card1 = dreStructure.data[selectedCardsForComparison[0]];
                  const card2 = dreStructure.data[selectedCardsForComparison[1]];

                  if (!card1 || !card2) return null;

                  // items é Record<tag01, contas[]> - flatten
                  const tag01Items1 = card1.items as Record<string, string[]>;
                  const tag01Items2 = card2.items as Record<string, string[]>;
                  const categories1 = Object.values(tag01Items1).flat();
                  const categories2 = Object.values(tag01Items2).flat();
                  const real1 = getValues('Real', categories1).slice(selectedMonthStart, selectedMonthEnd + 1).reduce((a, b) => a + b, 0);
                  const real2 = getValues('Real', categories2).slice(selectedMonthStart, selectedMonthEnd + 1).reduce((a, b) => a + b, 0);
                  const diff = real1 - real2;
                  const diffPerc = real2 !== 0 ? ((diff / Math.abs(real2)) * 100) : 0;

                  return (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-xs text-gray-500 font-semibold mb-1">Diferença Absoluta</p>
                        <p className={`text-2xl font-black ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {diff >= 0 ? '+' : ''}{formatValue(diff / 1000)}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-xs text-gray-500 font-semibold mb-1">Diferença Relativa</p>
                        <p className={`text-2xl font-black ${diffPerc >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {diffPerc >= 0 ? '+' : ''}{diffPerc.toFixed(0)}%
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-xs text-gray-500 font-semibold mb-1">Maior Valor</p>
                        <p className="text-2xl font-black text-blue-600">
                          {Math.abs(real1) > Math.abs(real2) ? card1.label : card2.label}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DREViewV2;
