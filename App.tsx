
import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import { DashboardEnhanced } from './components/DashboardEnhanced';
import LoginScreen from './components/LoginScreen';
import PendingApprovalScreen from './components/PendingApprovalScreen';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy loading de views pesadas (carregam sob demanda)
const KPIsView = React.lazy(() => import('./components/KPIsView'));
const AnalysisView = React.lazy(() => import('./components/AnalysisView'));
const DREView = React.lazy(() => import('./components/DREView'));
const ManualChangesView = React.lazy(() => import('./components/ManualChangesView'));
const TransactionsView = React.lazy(() => import('./components/TransactionsView'));
const ForecastingView = React.lazy(() => import('./components/ForecastingView'));
const AdminPanel = React.lazy(() => import('./components/AdminPanel'));
import { ViewType, Transaction, SchoolKPIs, ManualChange, TransactionType } from './types';
import { INITIAL_TRANSACTIONS, CATEGORIES, BRANCHES } from './constants';
import { PanelLeftOpen, Building2, Maximize2, Minimize2, Flag, Loader2, Lock, Menu, X } from 'lucide-react';
import * as supabaseService from './services/supabaseService';
import { useAuth } from './contexts/AuthContext';
import { usePermissions } from './hooks/usePermissions';
import { useIsMobile } from './hooks/useIsMobile';
import { TransactionsSyncUI } from './src/components/TransactionsSyncUI';
import { useTransactions } from './src/hooks/useTransactions';

const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { filterTransactions, hasPermissions, allowedMarcas, allowedFiliais, allowedCategories, loading: permissionsLoading } = usePermissions();
  const { isMobile, isTablet, isDesktop } = useIsMobile();

  // Hook do TransactionsContext (COM Realtime!)
  const {
    transactions: contextTransactions,
    isLoading: isLoadingTransactions,
    applyFilters,
    currentFilters
  } = useTransactions();

  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filtros Globais (agora arrays para seleção múltipla)
  const [selectedMarca, setSelectedMarca] = useState<string[]>([]);
  const [selectedFilial, setSelectedFilial] = useState<string[]>([]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [hasMountedDRE, setHasMountedDRE] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [preFullscreenSidebarState, setPreFullscreenSidebarState] = useState(true);

  const [drillDownFilters, setDrillDownFilters] = useState<any>(() => {
    // Carregar filtros salvos do sessionStorage
    const saved = sessionStorage.getItem('drillDownFilters');
    return saved ? JSON.parse(saved) : null;
  });

  const [drillDownActiveTab, setDrillDownActiveTab] = useState<'real' | 'orcamento' | 'comparativo' | undefined>(() => {
    // Carregar aba ativa salva do sessionStorage
    const saved = sessionStorage.getItem('drillDownActiveTab');
    return saved ? JSON.parse(saved) : undefined;
  });

  // Usar transactions do Context em vez de estado local
  const transactions = contextTransactions;
  const [manualChanges, setManualChanges] = useState<ManualChange[]>([]);

  // Estado para dados buscados na página de Lançamentos (persistente ao trocar de aba)
  const [searchedTransactions, setSearchedTransactions] = useState<Transaction[]>([]);
  const [hasSearchedTransactions, setHasSearchedTransactions] = useState(false);

  // Helper para re-buscar dados do banco após operações de escrita
  const refreshData = React.useCallback(async () => {
    if (currentFilters) {
      await applyFilters(currentFilters);
    }
  }, [applyFilters, currentFilters]);

  // Loading combinado
  const isLoading = isLoadingTransactions || permissionsLoading;

  // Carregar transações iniciais ao montar (via Context)
  // useRef evita execução duplicada do React StrictMode
  const initialLoadRef = React.useRef(false);
  useEffect(() => {
    if (!currentFilters && !initialLoadRef.current) {
      initialLoadRef.current = true;
      // Carregar ano atual completo (jan-dez) para DRE
      const year = new Date().getFullYear();
      applyFilters({
        monthFrom: `${year}-01`,
        monthTo: `${year}-12`
      });
    }
  }, [applyFilters, currentFilters]);

  // Carregar manual changes ao iniciar
  useEffect(() => {
    const loadManualChanges = async () => {
      try {
        console.log('🔵 Carregando manual changes do Supabase...');
        const loadedChanges = await supabaseService.getAllManualChanges();
        console.log('✅ Manual changes carregados:', {
          total: loadedChanges.length,
          pendentes: loadedChanges.filter(c => c.status === 'Pendente').length,
          aprovados: loadedChanges.filter(c => c.status === 'Aprovado').length,
          rejeitados: loadedChanges.filter(c => c.status === 'Rejeitado').length,
          primeiros5IDs: loadedChanges.slice(0, 5).map(c => ({ id: c.id, type: c.type, status: c.status }))
        });
        setManualChanges(loadedChanges);
      } catch (error) {
        console.error('❌ Erro ao carregar manual changes:', error);
      }
    };
    loadManualChanges();
  }, []);

  // Salvar filtros no sessionStorage quando mudarem
  useEffect(() => {
    if (drillDownFilters) {
      sessionStorage.setItem('drillDownFilters', JSON.stringify(drillDownFilters));
    } else {
      sessionStorage.removeItem('drillDownFilters');
    }
  }, [drillDownFilters]);

  useEffect(() => {
    if (drillDownActiveTab) {
      sessionStorage.setItem('drillDownActiveTab', JSON.stringify(drillDownActiveTab));
    } else {
      sessionStorage.removeItem('drillDownActiveTab');
    }
  }, [drillDownActiveTab]);

  // Manter DRE montada após primeira visita (preservar estado ao trocar guias)
  useEffect(() => {
    if (currentView === 'dre') setHasMountedDRE(true);
  }, [currentView]);

  // Contador de pendências para o Sidebar
  const pendingApprovalsCount = useMemo(() =>
    manualChanges.filter(c => c.status === 'Pendente').length
  , [manualChanges]);

  // Marcas únicas presentes nos dados
  const uniqueBrands = useMemo(() => {
    const marcas = new Set(transactions.map(t => t.marca).filter(Boolean));
    return Array.from(marcas).sort();
  }, [transactions]);

  // Unidades dinâmicas
  const availableBranches = useMemo(() => {
    let filtered = transactions;
    if (selectedMarca.length > 0) {
      filtered = transactions.filter(t => selectedMarca.includes(t.marca || ''));
    }
    const filiais = new Set(filtered.map(t => t.filial).filter(Boolean));
    return Array.from(filiais).sort();
  }, [transactions, selectedMarca]);

  useEffect(() => {
    setDrillDownFilters((prev: any) => ({
      ...prev,
      marca: selectedMarca,
      filial: selectedFilial
    }));
  }, [selectedMarca, selectedFilial]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (active) {
        setPreFullscreenSidebarState(isSidebarVisible);
        setIsSidebarVisible(false);
      } else {
        setIsSidebarVisible(preFullscreenSidebarState);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isSidebarVisible, preFullscreenSidebarState]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleDrillDown = (drillDownData: {
    categories: string[];
    monthIdx?: number;
    scenario?: string;
    filters?: Record<string, any>;
  }) => {
    const { categories, monthIdx, scenario, filters = {} } = drillDownData;

    // Formatar mês usando ano dinâmico (não fixo 2024)
    const year = new Date().getFullYear();
    const monthFilter = monthIdx !== undefined ? `${year}-${String(monthIdx + 1).padStart(2, '0')}` : '';

    // Construir filtros para TransactionsView
    const drillFilters: any = {
      // conta_contabil: array de contas da linha clicada na DRE
      conta_contabil: categories || [],

      // Data: passa o mês específico ou vazio
      monthFrom: monthFilter,
      monthTo: monthFilter,

      // NÃO passa scenario aqui, pois a aba ativa vai cuidar disso

      // Filtros acumulados das dimensões dinâmicas da DRE
      tag0: Array.isArray(filters.tag0) ? filters.tag0 : (filters.tag0 ? [filters.tag0] : []),
      tag01: Array.isArray(filters.tag01) ? filters.tag01 : (filters.tag01 ? [filters.tag01] : []),
      tag02: Array.isArray(filters.tag02) ? filters.tag02 : (filters.tag02 ? [filters.tag02] : []),
      tag03: Array.isArray(filters.tag03) ? filters.tag03 : (filters.tag03 ? [filters.tag03] : []),
      marca: Array.isArray(filters.marca) ? filters.marca : (filters.marca ? [filters.marca] : []),
      nome_filial: Array.isArray(filters.nome_filial) ? filters.nome_filial : (filters.nome_filial ? [filters.nome_filial] : []),
      ticket: filters.ticket || '',
      vendor: filters.vendor || ''
    };

    // Definir aba ativa baseada no cenário
    let activeTab: 'real' | 'orcamento' | 'comparativo' = 'real';
    if (scenario === 'Real') {
      activeTab = 'real';
    } else if (scenario === 'Orçado') {
      activeTab = 'orcamento';
    } else if (scenario === 'A-1') {
      activeTab = 'comparativo';
    }

    console.log('🔵 Drill-down aplicado:', {
      categories,
      monthIdx,
      monthFilter,
      scenario,
      activeTab,
      filters,
      drillFilters
    });

    setDrillDownFilters(drillFilters);
    setDrillDownActiveTab(activeTab);
    setCurrentView('movements');
  };

  const mapCategoryToType = (category: string): TransactionType => {
    if (CATEGORIES.FIXED_COST.includes(category)) return 'FIXED_COST';
    if (CATEGORIES.VARIABLE_COST.includes(category)) return 'VARIABLE_COST';
    if (CATEGORIES.SGA.includes(category)) return 'SGA';
    if (CATEGORIES.RATEIO.includes(category)) return 'RATEIO';
    return 'REVENUE';
  };

  const handleAddTransaction = async (newT: Omit<Transaction, 'id' | 'status'>) => {
    const t: Transaction = { ...newT, id: `m-${Date.now()}`, status: 'Normal' };

    // Salvar no Supabase
    const success = await supabaseService.addTransaction(t);

    if (success) {
      await refreshData();
    } else {
      console.error('Erro ao adicionar transação no Supabase');
      alert('Erro ao salvar transação. Tente novamente.');
    }
  };

  const handleImportData = async (importedTransactions: Transaction[]) => {
    // Filtrar transações que já existem
    const existingIds = new Set(transactions.map(t => t.id));
    const filteredNew = importedTransactions.filter(t => !existingIds.has(t.id));

    if (filteredNew.length > 0) {
      // Salvar em lote no Supabase
      const success = await supabaseService.bulkAddTransactions(filteredNew);

      if (success) {
        await refreshData();
      } else {
        console.error('Erro ao importar dados no Supabase');
        alert('Erro ao importar dados. Tente novamente.');
      }
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const success = await supabaseService.deleteTransaction(id);

    if (success) {
      await refreshData();
    } else {
      console.error('Erro ao deletar transação no Supabase');
      alert('Erro ao deletar transação. Tente novamente.');
    }
  };

  const handleRequestChange = async (change: Omit<ManualChange, 'id' | 'status' | 'requestedAt' | 'requestedBy' | 'originalTransaction'>) => {
    console.log('🔵 handleRequestChange INICIADO');
    console.log('🔵 Dados recebidos:', {
      transactionId: change.transactionId,
      type: change.type,
      description: change.description,
      justification: change.justification,
      hasNewValues: !!change.newValues,
      newValuesKeys: change.newValues ? Object.keys(change.newValues) : []
    });

    const original = transactions.find(t => t.id === change.transactionId)
      || searchedTransactions.find(t => t.id === change.transactionId);
    if (!original) {
      console.error('❌ Transação original NÃO ENCONTRADA:', change.transactionId);
      console.error('❌ Total de transações (context):', transactions.length);
      console.error('❌ Total de transações (searched):', searchedTransactions.length);
      return;
    }

    console.log('✅ Transação original encontrada:', {
      id: original.id,
      description: original.description,
      amount: original.amount,
      status: original.status
    });

    const newChange: ManualChange = {
      ...change,
      id: `chg-${Date.now()}`,
      originalTransaction: { ...original },
      status: 'Pendente',
      requestedAt: new Date().toISOString(),
      requestedBy: user?.email || "unknown@raizeducacao.com.br",
      requestedByName: user?.name || "Usuário Desconhecido"
    };

    console.log('📦 ManualChange criado:', {
      id: newChange.id,
      type: newChange.type,
      justification: newChange.justification,
      status: newChange.status,
      requestedAt: newChange.requestedAt,
      requestedBy: newChange.requestedBy,
      requestedByName: newChange.requestedByName,
      hasOriginalTransaction: !!newChange.originalTransaction,
      hasNewValues: !!newChange.newValues
    });

    // Salvar no Supabase
    console.log('🔄 Chamando addManualChange...');
    const successChange = await supabaseService.addManualChange(newChange);
    console.log('🔄 addManualChange retornou:', successChange);

    console.log('🔄 Chamando updateTransaction...');
    const successUpdate = await supabaseService.updateTransaction(change.transactionId, { status: 'Pendente' });
    console.log('🔄 updateTransaction retornou:', successUpdate);

    console.log('🔍 Verificando sucesso:', {
      successChange,
      successUpdate,
      ambosTrue: successChange && successUpdate,
      typeofSuccessChange: typeof successChange,
      typeofSuccessUpdate: typeof successUpdate
    });

    if (successChange && successUpdate) {
      console.log('✅ AMBOS SUCESSO - Atualizando estados locais');
      console.log('✅ manualChanges antes:', manualChanges.length);

      setManualChanges(prev => {
        const updated = [newChange, ...prev];
        console.log('✅ manualChanges depois:', updated.length);
        return updated;
      });

      // Atualizar status localmente nos searchedTransactions (sem re-fetch)
      setSearchedTransactions(prev =>
        prev.map(t => t.id === change.transactionId ? { ...t, status: 'Pendente' } : t)
      );

      console.log('✅ Estados locais atualizados com SUCESSO!');
    } else {
      console.error('❌ FALHA ao salvar:', {
        successChange,
        successUpdate,
        motivoFalha: !successChange ? 'addManualChange falhou' : 'updateTransaction falhou'
      });
      alert('Erro ao solicitar mudança. Tente novamente. Veja o console para detalhes.');
    }
  };

  const handleApproveChange = async (changeId: string) => {
    // Verificar se o usuário é admin
    if (user?.role !== 'admin') {
      alert('⚠️ Acesso negado!\n\nApenas administradores podem aprovar alterações.');
      return;
    }

    const change = manualChanges.find(c => c.id === changeId);
    if (!change) return;

    console.log('🔵 Aprovando mudança:', { changeId, type: change.type, transactionId: change.transactionId });

    try {
      const parsedValue = JSON.parse(change.newValue);
      console.log('📦 Parsed value:', parsedValue);

      if (change.type === 'RATEIO') {
        const rawParts = (parsedValue.transactions || (Array.isArray(parsedValue) ? parsedValue : [])) as Transaction[];
        // Gerar novo id (UUID), manter chave_id original, marcar rateio na description
        const newParts = rawParts.map(({ updated_at, id, ...rest }, idx) => ({
          ...rest,
          id: crypto.randomUUID(),
          description: `${rest.description} [R${idx + 1}/${rawParts.length}]`
        }));
        console.log('✂️ RATEIO: criando', newParts.length, 'novas transações');
        console.log('📦 Primeira part:', JSON.stringify(newParts[0]));

        // PRIMEIRO inserir as novas (antes de deletar a original)
        const bulkResult = await supabaseService.bulkAddTransactions(newParts as any);
        console.log('➕ Bulk add resultado:', bulkResult);

        // SÓ deletar a original APÓS confirmar que o insert funcionou
        const deleteSuccess = await supabaseService.deleteTransaction(change.transactionId);
        console.log('🗑️ Delete resultado:', deleteSuccess);
      } else if (change.type === 'EXCLUSAO') {
        console.log('🗑️ EXCLUSAO: deletando transação');

        // Deletar a transação do Supabase
        const deleteSuccess = await supabaseService.deleteTransaction(change.transactionId);
        console.log('🗑️ Delete resultado:', deleteSuccess);
      } else {
        console.log('✏️ Tipo:', change.type, '- atualizando transação');

        // Para MULTI, CONTA, DATA, MARCA, FILIAL
        // Remover justification e categoryLabel (campos que não existem no banco)
        const { justification, categoryLabel, ...transactionData } = parsedValue;
        const updatedData = {
          ...transactionData,
          conta_contabil: transactionData.category || undefined,
          status: 'Ajustado',
          type: transactionData.category ? mapCategoryToType(transactionData.category) : undefined,
          // Atualizar tags e nat_orc para refletir a hierarquia da nova conta
          tag01: transactionData.tag01 || undefined,
          tag02: transactionData.tag02 || undefined,
          tag03: transactionData.tag03 || undefined,
          nat_orc: transactionData.nat_orc || undefined,
        };

        console.log('📝 Dados para atualizar:', updatedData);

        // Atualizar no Supabase
        const updateSuccess = await supabaseService.updateTransaction(change.transactionId, updatedData);
        console.log('✅ Update resultado:', updateSuccess);

        if (!updateSuccess) {
          throw new Error('Falha ao atualizar transação no Supabase');
        }
      }

      // Atualizar o status da mudança
      console.log('📋 Atualizando status da mudança para Aplicado');
      const changeUpdateSuccess = await supabaseService.updateManualChange(changeId, {
        status: 'Aplicado',
        approvedAt: new Date().toISOString(),
        approvedBy: user?.email || 'unknown@raizeducacao.com.br',
        approvedByName: user?.name || 'Usuário Desconhecido'
      });
      console.log('✅ Status da mudança atualizado:', changeUpdateSuccess);

      setManualChanges(prev => prev.map(c =>
        c.id === changeId
          ? { ...c, status: 'Aplicado', approvedAt: new Date().toISOString(), approvedBy: user?.email || 'unknown@raizeducacao.com.br', approvedByName: user?.name || 'Usuário Desconhecido' }
          : c
      ));

      // Re-fetch dados do banco para refletir as mudanças
      await refreshData();

      console.log('✅ Aprovação concluída com sucesso!');
    } catch (error) {
      console.error("❌ Erro ao aplicar mudança:", error);
      alert('Erro ao aplicar mudança. Tente novamente.');
    }
  };

  const handleRejectChange = async (changeId: string) => {
    // Verificar se o usuário é admin
    if (user?.role !== 'admin') {
      alert('⚠️ Acesso negado!\n\nApenas administradores podem reprovar alterações.');
      return;
    }

    const change = manualChanges.find(c => c.id === changeId);
    if (!change) return;

    // Atualizar transação
    await supabaseService.updateTransaction(change.transactionId, { status: 'Normal' });

    // Atualizar mudança
    await supabaseService.updateManualChange(changeId, {
      status: 'Reprovado',
      approvedAt: new Date().toISOString(),
      approvedBy: user?.email || 'unknown@raizeducacao.com.br',
      approvedByName: user?.name || 'Usuário Desconhecido'
    });

    setManualChanges(prev => prev.map(c => c.id === changeId ? { ...c, status: 'Reprovado', approvedAt: new Date().toISOString(), approvedBy: user?.email || 'unknown@raizeducacao.com.br', approvedByName: user?.name || 'Usuário Desconhecido' } : c));

    // Re-fetch dados do banco para refletir as mudanças
    await refreshData();
  };

  const clearGlobalFilters = () => {
    setSelectedMarca([]);
    setSelectedFilial([]);
    setDrillDownFilters(null);
    setDrillDownActiveTab(undefined);
  };

  const handleBackToDRE = () => {
    setDrillDownFilters(null);
    setDrillDownActiveTab(undefined);
    setCurrentView('dre');
  };

  const filteredTransactions = useMemo(() => {
    // Primeiro, aplicar filtros de permissão
    const permissionFiltered = filterTransactions(transactions);

    // Depois, aplicar filtros de marca/filial selecionados
    if (currentView === 'movements' || currentView === 'dre') return permissionFiltered;
    return permissionFiltered.filter(t => {
      const matchesMarca = selectedMarca.length === 0 || selectedMarca.includes(t.marca || '');
      const matchesFilial = selectedFilial.length === 0 || selectedFilial.includes(t.filial || '');
      return matchesMarca && matchesFilial;
    });
  }, [transactions, selectedMarca, selectedFilial, currentView, filterTransactions]);

  const kpis: SchoolKPIs = useMemo(() => {
    const real = filteredTransactions.filter(t => t.scenario === 'Real');
    const rev = real.filter(t => t.type === 'REVENUE').reduce((a, b) => a + b.amount, 0);
    const exp = real.filter(t => t.type !== 'REVENUE').reduce((a, b) => a + b.amount, 0);
    const ebitda = rev - exp;
    const targetMargin = 25;
    const targetEbitda = rev * (targetMargin / 100);
    const diff = targetEbitda - ebitda;
    const baseStudents = selectedMarca.length === 0 ? 5400 : selectedMarca.length * 850;
    const numberOfStudents = selectedFilial.length === 0 ? baseStudents : selectedFilial.length * 120;
    const waterCost = real.filter(t => t.category === 'Água & Gás').reduce((acc, t) => acc + t.amount, 0);
    const energyCost = real.filter(t => t.category === 'Energia').reduce((acc, t) => acc + t.amount, 0);
    const consumptionMaterialCost = real.filter(t => t.category === 'Material de Consumo').reduce((acc, t) => acc + t.amount, 0);
    const eventsCost = real.filter(t => t.category === 'Eventos Pedagógicos').reduce((acc, t) => acc + t.amount, 0);
    return {
      totalRevenue: rev,
      totalFixedCosts: real.filter(t => t.type === 'FIXED_COST').reduce((a, b) => a + b.amount, 0),
      totalVariableCosts: real.filter(t => t.type === 'VARIABLE_COST').reduce((a, b) => a + b.amount, 0),
      sgaCosts: real.filter(t => t.type === 'SGA').reduce((a, b) => a + b.amount, 0),
      ebitda,
      netMargin: rev > 0 ? (ebitda / rev) * 100 : 0,
      costPerStudent: numberOfStudents > 0 ? (exp / numberOfStudents) : 0,
      revenuePerStudent: numberOfStudents > 0 ? (rev / numberOfStudents) : 0,
      activeStudents: numberOfStudents,
      breakEvenPoint: 0,
      defaultRate: 8.5,
      targetEbitda,
      costReductionNeeded: diff > 0 ? diff : 0,
      marginOfSafety: diff < 0 ? Math.abs(diff) : 0,
      churnRate: 0,
      waterPerStudent: waterCost / Math.max(1, numberOfStudents),
      energyPerClassroom: energyCost / 20,
      consumptionMaterialPerStudent: consumptionMaterialCost / Math.max(1, numberOfStudents),
      eventsPerStudent: eventsCost / Math.max(1, numberOfStudents)
    };
  }, [filteredTransactions, selectedMarca, selectedFilial]);

  const showGlobalFilters = currentView !== 'dre' && currentView !== 'movements' && currentView !== 'dashboard';

  // Tela de loading - autenticação
  if (authLoading) {
    return (
      <div className="flex h-screen bg-[#fcfcfc] items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-[#1B75BB]" size={48} />
          <h2 className="text-xl font-bold text-gray-900">Verificando autenticação...</h2>
          <p className="text-sm text-gray-500 mt-2">Aguarde</p>
        </div>
      </div>
    );
  }

  // Tela de login se não autenticado
  if (!user) {
    return <LoginScreen />;
  }

  // Tela de aguardando aprovação para usuários pendentes
  if (user.role === 'pending') {
    return <PendingApprovalScreen />;
  }

  // Tela de loading - dados
  if (isLoading) {
    return (
      <div className="flex h-screen bg-[#fcfcfc] items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-[#1B75BB]" size={48} />
          <h2 className="text-xl font-bold text-gray-900">Carregando DRE RAIZ...</h2>
          <p className="text-sm text-gray-500 mt-2">Conectando ao banco de dados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#fcfcfc] overflow-hidden">
        {/* Sidebar: Desktop = fixa lateral; Mobile/Tablet = drawer overlay */}
        {isDesktop ? (
          <div className={`${isSidebarVisible ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden shrink-0`}>
            <Sidebar
              currentView={currentView}
              setCurrentView={setCurrentView}
              selectedBrand={selectedMarca}
              pendingCount={pendingApprovalsCount}
            />
          </div>
        ) : (
          <>
            {/* Backdrop */}
            {isDrawerOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-[60] transition-opacity"
                onClick={() => setIsDrawerOpen(false)}
              />
            )}
            {/* Drawer */}
            <div className={`fixed inset-y-0 left-0 z-[70] w-64 transform transition-transform duration-300 ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              <Sidebar
                currentView={currentView}
                setCurrentView={setCurrentView}
                selectedBrand={selectedMarca}
                pendingCount={pendingApprovalsCount}
                isDrawer={true}
                onClose={() => setIsDrawerOpen(false)}
              />
            </div>
          </>
        )}

      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="sticky top-0 z-40 bg-[#fcfcfc] px-3 md:px-4 lg:px-6 pt-3 md:pt-4 lg:pt-6 pb-3 md:pb-4 lg:pb-6 mb-3 md:mb-4 lg:mb-6 flex justify-between items-center border-b border-gray-200 shadow-sm gap-2 flex-wrap">
          <div className="flex items-center gap-2 lg:gap-4 flex-wrap">
            {/* Hamburger para mobile/tablet */}
            {!isDesktop && (
              <button onClick={() => setIsDrawerOpen(true)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-all">
                <Menu size={20} />
              </button>
            )}
            {/* Toggle sidebar para desktop */}
            {isDesktop && (
              <button onClick={() => setIsSidebarVisible(!isSidebarVisible)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-all">
                <PanelLeftOpen size={20} />
              </button>
            )}
            <button onClick={toggleFullscreen} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 flex items-center gap-2 text-xs font-bold transition-all" title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}>
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>

            {/* Indicador de Permissões Restritas */}
            {hasPermissions && (
              <div className={`flex items-center gap-2 lg:gap-3 bg-yellow-50 border-2 border-yellow-200 px-2 lg:px-4 py-1.5 lg:py-2 rounded-xl ${isMobile ? 'hidden' : ''}`}>
                <Lock size={16} className="text-yellow-600 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-black text-yellow-900 uppercase tracking-wider">Acesso Restrito</span>
                  <div className="flex gap-2 text-[10px] font-bold text-yellow-700 flex-wrap">
                    {allowedMarcas.length > 0 && <span>Marcas: {allowedMarcas.join(', ')}</span>}
                    {allowedFiliais.length > 0 && <span>Filiais: {allowedFiliais.join(', ')}</span>}
                    {allowedCategories.length > 0 && <span>Categorias: {allowedCategories.join(', ')}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Indicador de Sincronização - Fase 2 */}
            <TransactionsSyncUI />
          </div>

          {showGlobalFilters && (
            <div className="flex items-center gap-4">
              {/* Nota: Filtros globais não são usados no dashboard, apenas nas outras views */}
            </div>
          )}
        </div>

        <div className="px-3 md:px-4 lg:px-6 pb-3 md:pb-4 lg:pb-6">
          {currentView === 'dashboard' && (
            <DashboardEnhanced
              kpis={kpis}
              transactions={filteredTransactions}
              selectedMarca={selectedMarca}
              selectedFilial={selectedFilial}
              uniqueBrands={uniqueBrands}
              availableBranches={availableBranches}
              onMarcaChange={setSelectedMarca}
              onFilialChange={setSelectedFilial}
            />
          )}
          {currentView === 'kpis' && (
            <Suspense fallback={<LoadingSpinner message="Carregando KPIs..." />}>
              <KPIsView kpis={kpis} transactions={filteredTransactions} />
            </Suspense>
          )}
          {currentView === 'movements' && (
            <Suspense fallback={<LoadingSpinner message="Carregando lançamentos..." />}>
              <TransactionsView
                transactions={filteredTransactions}
                searchedTransactions={searchedTransactions}
                setSearchedTransactions={setSearchedTransactions}
                hasSearchedTransactions={hasSearchedTransactions}
                setHasSearchedTransactions={setHasSearchedTransactions}
                addTransaction={handleAddTransaction}
                requestChange={handleRequestChange}
                deleteTransaction={handleDeleteTransaction}
                fetchFromCSV={handleImportData}
                isSyncing={isSyncing}
                externalFilters={drillDownFilters}
                externalActiveTab={drillDownActiveTab}
                clearGlobalFilters={clearGlobalFilters}
                onBackToDRE={handleBackToDRE}
              />
            </Suspense>
          )}
          {currentView === 'manual_changes' && (
            <Suspense fallback={<LoadingSpinner message="Carregando alterações..." />}>
              <ManualChangesView changes={manualChanges} approveChange={handleApproveChange} rejectChange={handleRejectChange} />
            </Suspense>
          )}
          {hasMountedDRE && (
            <div style={{ display: currentView === 'dre' ? undefined : 'none' }}>
              <Suspense fallback={<LoadingSpinner message="Carregando DRE..." />}>
                <DREView
                  onDrillDown={handleDrillDown}
                />
              </Suspense>
            </div>
          )}
          {currentView === 'forecasting' && (
            <Suspense fallback={<LoadingSpinner message="Carregando previsões..." />}>
              <ForecastingView transactions={filteredTransactions} />
            </Suspense>
          )}
          {currentView === 'analysis' && (
            <Suspense fallback={<LoadingSpinner message="Carregando análises..." />}>
              <AnalysisView transactions={filteredTransactions} kpis={kpis} />
            </Suspense>
          )}
          {currentView === 'admin' && (
            <Suspense fallback={<LoadingSpinner message="Carregando painel admin..." />}>
              <AdminPanel />
            </Suspense>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
