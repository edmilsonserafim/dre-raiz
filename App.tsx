
import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import KPIsView from './components/KPIsView';
import InsightsView from './components/InsightsView';
import DREView from './components/DREView';
import ManualChangesView from './components/ManualChangesView';
import TransactionsView from './components/TransactionsView';
import AssistantView from './components/AssistantView';
import ForecastingView from './components/ForecastingView';
import DatabaseView from './components/DatabaseView';
import LoginScreen from './components/LoginScreen';
import AdminPanel from './components/AdminPanel';
import { ViewType, Transaction, SchoolKPIs, ManualChange, TransactionType } from './types';
import { INITIAL_TRANSACTIONS, CATEGORIES, BRANCHES } from './constants';
import { PanelLeftOpen, Building2, Maximize2, Minimize2, Flag, Loader2, Lock } from 'lucide-react';
import * as supabaseService from './services/supabaseService';
import { useAuth } from './contexts/AuthContext';
import { usePermissions } from './hooks/usePermissions';

const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { filterTransactions, hasPermissions, allowedBrands, allowedBranches, allowedCategories, loading: permissionsLoading } = usePermissions();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  // Filtros Globais
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');

  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [preFullscreenSidebarState, setPreFullscreenSidebarState] = useState(true);

  const [drillDownFilters, setDrillDownFilters] = useState<any>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [manualChanges, setManualChanges] = useState<ManualChange[]>([]);

  // Carregar dados do Supabase ao iniciar
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [loadedTransactions, loadedChanges] = await Promise.all([
          supabaseService.getAllTransactions(),
          supabaseService.getAllManualChanges()
        ]);

        // Se não há dados no Supabase, usar dados iniciais
        if (loadedTransactions.length === 0) {
          console.log('Nenhum dado encontrado no Supabase. Usando dados iniciais.');
          setTransactions(INITIAL_TRANSACTIONS);
          // Salvar dados iniciais no Supabase
          await supabaseService.bulkAddTransactions(INITIAL_TRANSACTIONS);
        } else {
          console.log('📊 App.tsx: Transações carregadas do Supabase:', loadedTransactions.length);
          console.log('📊 App.tsx: Cenários nas transações carregadas:', [...new Set(loadedTransactions.map(t => t.scenario))]);
          console.log('📊 App.tsx: Primeira transação:', loadedTransactions[0]);
          console.log('📊 App.tsx: Amostra de 10 transações:', loadedTransactions.slice(0, 10).map(t => ({
            id: t.id,
            scenario: t.scenario,
            category: t.category,
            amount: t.amount
          })));
          setTransactions(loadedTransactions);
        }

        setManualChanges(loadedChanges);
      } catch (error) {
        console.error('Erro ao carregar dados do Supabase:', error);
        // Em caso de erro, usar dados iniciais
        setTransactions(INITIAL_TRANSACTIONS);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Contador de pendências para o Sidebar
  const pendingApprovalsCount = useMemo(() =>
    manualChanges.filter(c => c.status === 'Pendente').length
  , [manualChanges]);

  // Marcas únicas presentes nos dados
  const uniqueBrands = useMemo(() => {
    const brands = new Set(transactions.map(t => t.brand).filter(Boolean));
    return Array.from(brands).sort();
  }, [transactions]);

  // Unidades dinâmicas
  const availableBranches = useMemo(() => {
    let filtered = transactions;
    if (selectedBrand !== 'all') {
      filtered = transactions.filter(t => t.brand === selectedBrand);
    }
    const branches = new Set(filtered.map(t => t.branch).filter(Boolean));
    return Array.from(branches).sort();
  }, [transactions, selectedBrand]);

  useEffect(() => {
    setDrillDownFilters((prev: any) => ({
      ...prev,
      brand: selectedBrand,
      branch: selectedBranch
    }));
  }, [selectedBrand, selectedBranch]);

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

  const handleDrillDown = (category?: string, monthIdx?: number, scenario?: string, tags?: any) => {
    const monthFilter = monthIdx !== undefined ? `${String(monthIdx + 1).padStart(2, '0')}-2024` : '';
    setDrillDownFilters({
      category: category || 'all',
      date: monthFilter,
      scenario: scenario || 'all',
      tag01: tags?.tag01 === 'all' ? '' : tags?.tag01 || '',
      tag02: tags?.tag02 === 'all' ? '' : tags?.tag02 || '',
      tag03: tags?.tag03 === 'all' ? '' : tags?.tag03 || '',
      brand: selectedBrand,
      branch: selectedBranch
    });
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
      setTransactions(prev => [t, ...prev]);
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
        setTransactions(prev => [...filteredNew, ...prev]);
      } else {
        console.error('Erro ao importar dados no Supabase');
        alert('Erro ao importar dados. Tente novamente.');
      }
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const success = await supabaseService.deleteTransaction(id);

    if (success) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    } else {
      console.error('Erro ao deletar transação no Supabase');
      alert('Erro ao deletar transação. Tente novamente.');
    }
  };

  const handleRequestChange = async (change: Omit<ManualChange, 'id' | 'status' | 'requestedAt' | 'requestedBy' | 'originalTransaction'>) => {
    const original = transactions.find(t => t.id === change.transactionId);
    if (!original) return;

    const newChange: ManualChange = {
      ...change,
      id: `chg-${Date.now()}`,
      originalTransaction: { ...original },
      status: 'Pendente',
      requestedAt: new Date().toISOString(),
      requestedBy: user?.email || "unknown@raizeducacao.com.br",
      requestedByName: user?.name || "Usuário Desconhecido"
    };

    // Salvar no Supabase
    const successChange = await supabaseService.addManualChange(newChange);
    const successUpdate = await supabaseService.updateTransaction(change.transactionId, { status: 'Pendente' });

    if (successChange && successUpdate) {
      setManualChanges(prev => [newChange, ...prev]);
      setTransactions(prev => prev.map(t => t.id === change.transactionId ? { ...t, status: 'Pendente' } : t));
    } else {
      console.error('Erro ao salvar mudança no Supabase');
      alert('Erro ao solicitar mudança. Tente novamente.');
    }
  };

  const handleApproveChange = async (changeId: string) => {
    const change = manualChanges.find(c => c.id === changeId);
    if (!change) return;

    console.log('🔵 Aprovando mudança:', { changeId, type: change.type, transactionId: change.transactionId });

    try {
      const parsedValue = JSON.parse(change.newValue);
      console.log('📦 Parsed value:', parsedValue);

      if (change.type === 'RATEIO') {
        const newParts = (parsedValue.transactions || (Array.isArray(parsedValue) ? parsedValue : [])) as Transaction[];
        console.log('✂️ RATEIO: deletando transação original e criando', newParts.length, 'novas');

        // Deletar a transação original do Supabase
        const deleteSuccess = await supabaseService.deleteTransaction(change.transactionId);
        console.log('🗑️ Delete resultado:', deleteSuccess);

        // Adicionar as novas transações no Supabase
        const bulkSuccess = await supabaseService.bulkAddTransactions(newParts);
        console.log('➕ Bulk add resultado:', bulkSuccess);

        setTransactions(prev => {
          const filtered = prev.filter(t => t.id !== change.transactionId);
          return [...newParts, ...filtered];
        });
      } else if (change.type === 'EXCLUSAO') {
        console.log('🗑️ EXCLUSAO: deletando transação');

        // Deletar a transação do Supabase
        const deleteSuccess = await supabaseService.deleteTransaction(change.transactionId);
        console.log('🗑️ Delete resultado:', deleteSuccess);

        setTransactions(prev => prev.filter(t => t.id !== change.transactionId));
      } else {
        console.log('✏️ Tipo:', change.type, '- atualizando transação');

        // Para MULTI, CONTA, DATA, MARCA, FILIAL
        // Remover campos que não existem no banco: justification, recurring, ticket, vendor
        const { justification, recurring, ticket, vendor, ...transactionData } = parsedValue;
        const updatedData = {
          ...transactionData,
          status: 'Ajustado',
          type: transactionData.category ? mapCategoryToType(transactionData.category) : undefined
        };

        console.log('📝 Dados para atualizar:', updatedData);

        // Atualizar no Supabase
        const updateSuccess = await supabaseService.updateTransaction(change.transactionId, updatedData);
        console.log('✅ Update resultado:', updateSuccess);

        if (!updateSuccess) {
          throw new Error('Falha ao atualizar transação no Supabase');
        }

        setTransactions(prev => prev.map(t => {
          if (t.id === change.transactionId) {
            return { ...t, ...updatedData, type: updatedData.type || t.type };
          }
          return t;
        }));
      }

      // Atualizar o status da mudança
      console.log('📋 Atualizando status da mudança para Aplicado');
      const changeUpdateSuccess = await supabaseService.updateManualChange(changeId, {
        status: 'Aplicado',
        approvedAt: new Date().toISOString(),
        approvedBy: user?.email || 'unknown@raizeducacao.com.br'
      });
      console.log('✅ Status da mudança atualizado:', changeUpdateSuccess);

      setManualChanges(prev => prev.map(c =>
        c.id === changeId
          ? { ...c, status: 'Aplicado', approvedAt: new Date().toISOString(), approvedBy: user?.email || 'unknown@raizeducacao.com.br' }
          : c
      ));

      console.log('✅ Aprovação concluída com sucesso!');
    } catch (error) {
      console.error("❌ Erro ao aplicar mudança:", error);
      alert('Erro ao aplicar mudança. Tente novamente.');
    }
  };

  const handleRejectChange = async (changeId: string) => {
    const change = manualChanges.find(c => c.id === changeId);
    if (!change) return;

    // Atualizar transação
    await supabaseService.updateTransaction(change.transactionId, { status: 'Normal' });

    // Atualizar mudança
    await supabaseService.updateManualChange(changeId, {
      status: 'Reprovado',
      approvedAt: new Date().toISOString(),
      approvedBy: user?.email || 'unknown@raizeducacao.com.br'
    });

    setTransactions(prev => prev.map(t => t.id === change.transactionId ? { ...t, status: 'Normal' } : t));
    setManualChanges(prev => prev.map(c => c.id === changeId ? { ...c, status: 'Reprovado', approvedAt: new Date().toISOString(), approvedBy: user?.email || 'unknown@raizeducacao.com.br' } : c));
  };

  const clearGlobalFilters = () => {
    setSelectedBrand('all');
    setSelectedBranch('all');
  };

  const filteredTransactions = useMemo(() => {
    // Primeiro, aplicar filtros de permissão
    const permissionFiltered = filterTransactions(transactions);

    // Depois, aplicar filtros de marca/filial selecionados
    if (currentView === 'movements' || currentView === 'dre') return permissionFiltered;
    return permissionFiltered.filter(t => {
      const matchesBrand = selectedBrand === 'all' || t.brand === selectedBrand;
      const matchesBranch = selectedBranch === 'all' || t.branch === selectedBranch;
      return matchesBrand && matchesBranch;
    });
  }, [transactions, selectedBrand, selectedBranch, currentView, filterTransactions]);

  const kpis: SchoolKPIs = useMemo(() => {
    const real = filteredTransactions.filter(t => t.scenario === 'Real');
    const rev = real.filter(t => t.type === 'REVENUE').reduce((a, b) => a + b.amount, 0);
    const exp = real.filter(t => t.type !== 'REVENUE').reduce((a, b) => a + b.amount, 0);
    const ebitda = rev - exp;
    const targetMargin = 25;
    const targetEbitda = rev * (targetMargin / 100);
    const diff = targetEbitda - ebitda;
    const baseStudents = selectedBrand === 'all' ? 5400 : 850;
    const numberOfStudents = selectedBranch === 'all' ? baseStudents : 120;
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
  }, [filteredTransactions, selectedBrand, selectedBranch]);

  const showGlobalFilters = currentView !== 'dre' && currentView !== 'movements';

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
      <div className={`${isSidebarVisible ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden shrink-0`}>
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          selectedBrand={selectedBrand}
          pendingCount={pendingApprovalsCount}
        />
      </div>
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarVisible(!isSidebarVisible)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-all">
              <PanelLeftOpen size={20} />
            </button>
            <button onClick={toggleFullscreen} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 flex items-center gap-2 text-xs font-bold transition-all" title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}>
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>

            {/* Indicador de Permissões Restritas */}
            {hasPermissions && (
              <div className="flex items-center gap-3 bg-yellow-50 border-2 border-yellow-200 px-4 py-2 rounded-xl">
                <Lock size={16} className="text-yellow-600" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-yellow-900 uppercase tracking-wider">Acesso Restrito</span>
                  <div className="flex gap-2 text-[10px] font-bold text-yellow-700">
                    {allowedBrands.length > 0 && <span>Marcas: {allowedBrands.join(', ')}</span>}
                    {allowedBranches.length > 0 && <span>Filiais: {allowedBranches.join(', ')}</span>}
                    {allowedCategories.length > 0 && <span>Categorias: {allowedCategories.join(', ')}</span>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {showGlobalFilters && (
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border-2 shadow-xl transition-all transform hover:scale-105 ${selectedBrand === 'all' ? 'border-[#1B75BB]/20' : 'border-[#1B75BB] ring-4 ring-[#1B75BB]/10'}`}>
                <div className={`p-2 rounded-xl transition-colors ${selectedBrand === 'all' ? 'bg-blue-50 text-[#1B75BB]' : 'bg-[#1B75BB] text-white'}`}>
                  <Flag size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Grupo Raiz</span>
                  <select
                    value={selectedBrand}
                    onChange={e => {
                      setSelectedBrand(e.target.value);
                      setSelectedBranch('all');
                    }}
                    className="font-black text-xs uppercase tracking-tight outline-none bg-transparent cursor-pointer min-w-[170px] text-gray-900"
                  >
                    <option value="all">TODAS AS MARCAS</option>
                    {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div className={`flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border-2 shadow-xl transition-all transform hover:scale-105 ${selectedBranch === 'all' ? 'border-[#F44C00]/20' : 'border-[#F44C00] ring-4 ring-[#F44C00]/10'}`}>
                <div className={`p-2 rounded-xl transition-colors ${selectedBranch === 'all' ? 'bg-orange-50 text-[#F44C00]' : 'bg-[#F44C00] text-white'}`}>
                  <Building2 size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Filial</span>
                  <select
                    value={selectedBranch}
                    onChange={e => setSelectedBranch(e.target.value)}
                    className="font-black text-xs uppercase tracking-tight outline-none bg-transparent cursor-pointer min-w-[170px] text-gray-900"
                  >
                    <option value="all">TODAS AS UNIDADES</option>
                    {availableBranches.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {currentView === 'dashboard' && <Dashboard kpis={kpis} transactions={filteredTransactions} />}
        {currentView === 'movements' && (
          <TransactionsView
            transactions={filteredTransactions}
            addTransaction={handleAddTransaction}
            requestChange={handleRequestChange}
            deleteTransaction={handleDeleteTransaction}
            fetchFromCSV={handleImportData}
            isSyncing={isSyncing}
            externalFilters={drillDownFilters}
            clearGlobalFilters={clearGlobalFilters}
          />
        )}
        {currentView === 'manual_changes' && <ManualChangesView changes={manualChanges} approveChange={handleApproveChange} rejectChange={handleRejectChange} />}
        {currentView === 'insights' && <InsightsView transactions={filteredTransactions} kpis={kpis} />}
        {currentView === 'assistant' && <AssistantView transactions={filteredTransactions} kpis={kpis} />}
        {currentView === 'dre' && <DREView transactions={filteredTransactions} onDrillDown={handleDrillDown} />}
        {currentView === 'kpis' && <KPIsView transactions={filteredTransactions} branch={selectedBranch} />}
        {currentView === 'forecasting' && <ForecastingView transactions={filteredTransactions} />}
        {currentView === 'settings' && <DatabaseView />}
        {currentView === 'admin' && <AdminPanel />}
      </main>
    </div>
  );
};

export default App;
