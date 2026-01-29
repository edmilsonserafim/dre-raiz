import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ComposedChart, Line, Legend, ReferenceLine } from 'recharts';
import { Target, Users, ArrowUpRight, ArrowDownRight, ArrowRight, GraduationCap, CalendarDays, Droplets, Zap, Box, PartyPopper, Scissors, ShieldCheck, AlertCircle, PieChart, TrendingDown, X, TrendingUp, Flag, Building2 } from 'lucide-react';
import { SchoolKPIs, Transaction } from '../types';
import { BRANCHES, CATEGORIES } from '../constants';

interface DashboardProps {
  kpis: SchoolKPIs;
  transactions: Transaction[];
  selectedBrand: string;
  selectedBranch: string;
  uniqueBrands: string[];
  availableBranches: string[];
  onBrandChange: (brand: string) => void;
  onBranchChange: (branch: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  kpis,
  transactions,
  selectedBrand,
  selectedBranch,
  uniqueBrands,
  availableBranches,
  onBrandChange,
  onBranchChange
}) => {
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'ebitda' | 'margin'>('ebitda');
  const [selectedMonthStart, setSelectedMonthStart] = useState<number>(0);
  const [selectedMonthEnd, setSelectedMonthEnd] = useState<number>(11);
  const [comparisonMode, setComparisonMode] = useState<'budget' | 'prevYear'>('budget');
  const [sortBranchesAZ, setSortBranchesAZ] = useState(false);
  const [showVariationDetail, setShowVariationDetail] = useState(false);
  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  // Filter transactions by selected month range
  const filteredByMonth = useMemo(() => {
    return transactions.filter(t => {
      const month = new Date(t.date).getMonth();
      return month >= selectedMonthStart && month <= selectedMonthEnd;
    });
  }, [transactions, selectedMonthStart, selectedMonthEnd]);

  const branchData = useMemo(() => {
    const data = BRANCHES.map(branch => {
      const bTrans = filteredByMonth.filter(t => t.branch === branch);
      const rev = bTrans.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
      const exp = bTrans.filter(t => t.type !== 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
      const ebitda = rev - exp;
      return { name: branch, revenue: rev, ebitda, margin: rev > 0 ? (ebitda / rev) * 100 : 0 };
    });

    return sortBranchesAZ
      ? data.sort((a, b) => a.name.localeCompare(b.name))
      : data.sort((a, b) => b[activeMetric] - a[activeMetric]);
  }, [filteredByMonth, activeMetric, sortBranchesAZ]);

  // Enhanced KPIs with consumption metrics and additional calculations
  const enhancedKpis = useMemo(() => {
    const real = filteredByMonth.filter(t => t.scenario === 'Real');

    // Category-specific costs
    const waterCost = real.filter(t => t.category === 'Água & Gás')
      .reduce((acc, t) => acc + t.amount, 0);
    const energyCost = real.filter(t => t.category === 'Energia')
      .reduce((acc, t) => acc + t.amount, 0);
    const consumptionMaterialCost = real.filter(t => t.category === 'Material de Consumo' || t.category === 'Material de Consumo & Operação')
      .reduce((acc, t) => acc + t.amount, 0);
    const eventsCost = real.filter(t => t.category === 'Eventos Comerciais' || t.category === 'Eventos Pedagógicos')
      .reduce((acc, t) => acc + t.amount, 0);

    // New metrics
    const teacherCost = real.filter(t => t.category === 'Salários' || t.category?.includes('Professor'))
      .reduce((acc, t) => acc + t.amount, 0);
    const adminPayrollCost = real.filter(t => t.category === 'Folha Administrativa' || t.category?.includes('Folha Adm'))
      .reduce((acc, t) => acc + t.amount, 0);
    const studentMealCost = real.filter(t => t.category === 'Alimentação' || t.category?.includes('Alimentação'))
      .reduce((acc, t) => acc + t.amount, 0);
    const maintenanceCost = real.filter(t => t.category === 'Manutenção' || t.category?.includes('Manutenção'))
      .reduce((acc, t) => acc + t.amount, 0);

    // Calculate revenue and costs
    const totalRevenue = real.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
    const totalFixedCosts = real.filter(t => t.type === 'FIXED_COST').reduce((acc, t) => acc + t.amount, 0);
    const totalVariableCosts = real.filter(t => t.type === 'VARIABLE_COST').reduce((acc, t) => acc + t.amount, 0);
    const sgaCosts = real.filter(t => t.type === 'SGA').reduce((acc, t) => acc + t.amount, 0);
    const rateioCosts = real.filter(t => t.type === 'RATEIO').reduce((acc, t) => acc + t.amount, 0);
    const ebitda = totalRevenue - totalFixedCosts - totalVariableCosts - sgaCosts - rateioCosts;

    // Per-unit calculations
    const numberOfStudents = kpis.activeStudents;
    const numberOfClassrooms = Math.ceil(numberOfStudents / 25);

    // Target calculations
    const targetMargin = 25;
    const targetEbitdaValue = totalRevenue * (targetMargin / 100);
    const diffToTarget = targetEbitdaValue - ebitda;
    const costReductionNeeded = diffToTarget > 0 ? diffToTarget : 0;
    const marginOfSafety = diffToTarget < 0 ? Math.abs(diffToTarget) : 0;

    return {
      totalRevenue,
      totalFixedCosts,
      totalVariableCosts,
      sgaCosts,
      ebitda,
      netMargin: totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0,
      revenuePerStudent: numberOfStudents > 0 ? totalRevenue / numberOfStudents : 0,
      costPerStudent: numberOfStudents > 0 ? (totalFixedCosts + totalVariableCosts + sgaCosts + rateioCosts) / numberOfStudents : 0,
      waterPerStudent: numberOfStudents > 0 ? waterCost / numberOfStudents : 0,
      energyPerClassroom: numberOfClassrooms > 0 ? energyCost / numberOfClassrooms : 0,
      consumptionMaterialPerStudent: numberOfStudents > 0 ? consumptionMaterialCost / numberOfStudents : 0,
      eventsPerStudent: numberOfStudents > 0 ? eventsCost / numberOfStudents : 0,
      costReductionNeeded,
      marginOfSafety,
      targetEbitdaValue,
      isBelowTarget: costReductionNeeded > 0,
      numberOfClassrooms,
      activeStudents: numberOfStudents,
      defaultRate: kpis.defaultRate,
      teacherCostPercent: totalRevenue > 0 ? (teacherCost / totalRevenue) * 100 : 0,
      adminPayrollPercent: totalRevenue > 0 ? (adminPayrollCost / totalRevenue) * 100 : 0,
      studentMealPerStudent: numberOfStudents > 0 ? studentMealCost / numberOfStudents : 0,
      teacherCostPerClassroom: numberOfClassrooms > 0 ? teacherCost / numberOfClassrooms : 0,
      maintenancePercent: totalRevenue > 0 ? (maintenanceCost / totalRevenue) * 100 : 0,
      teacherCost,
      adminPayrollCost,
      studentMealCost,
      maintenanceCost
    };
  }, [filteredByMonth, kpis]);

  // Calculate trends based on comparison mode
  const trends = useMemo(() => {
    const comparison = filteredByMonth.filter(t =>
      t.scenario === (comparisonMode === 'budget' ? 'Orçamento' : 'Ano Anterior')
    );
    const real = filteredByMonth.filter(t => t.scenario === 'Real');

    // Calculate comparison KPIs
    const compRevenue = comparison.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
    const compFixedCosts = comparison.filter(t => t.type === 'FIXED_COST').reduce((acc, t) => acc + t.amount, 0);
    const compVariableCosts = comparison.filter(t => t.type === 'VARIABLE_COST').reduce((acc, t) => acc + t.amount, 0);
    const compSgaCosts = comparison.filter(t => t.type === 'SGA').reduce((acc, t) => acc + t.amount, 0);
    const compRateioCosts = comparison.filter(t => t.type === 'RATEIO').reduce((acc, t) => acc + t.amount, 0);
    const compEbitda = compRevenue - compFixedCosts - compVariableCosts - compSgaCosts - compRateioCosts;
    const compMargin = compRevenue > 0 ? (compEbitda / compRevenue) * 100 : 0;

    // Calculate variations (%)
    const revenueTrend = compRevenue > 0 ? ((enhancedKpis.totalRevenue - compRevenue) / compRevenue) * 100 : 0;
    const ebitdaTrend = compEbitda !== 0 ? ((enhancedKpis.ebitda - compEbitda) / Math.abs(compEbitda)) * 100 : 0;
    const marginTrend = enhancedKpis.netMargin - compMargin;
    const studentsTrend = 0; // Pode adicionar lógica para alunos se tiver dados históricos

    // Calculate absolute variations
    const revenueAbsolute = enhancedKpis.totalRevenue - compRevenue;
    const ebitdaAbsolute = enhancedKpis.ebitda - compEbitda;
    const revenuePerStudentAbsolute = enhancedKpis.revenuePerStudent - (compRevenue > 0 ? compRevenue / enhancedKpis.activeStudents : 0);
    const studentsAbsolute = 0;

    return {
      revenue: revenueTrend,
      ebitda: ebitdaTrend,
      margin: marginTrend,
      students: studentsTrend,
      revenueAbsolute,
      ebitdaAbsolute,
      revenuePerStudentAbsolute,
      studentsAbsolute,
      compRevenue,
      compEbitda,
      compFixedCosts,
      compVariableCosts,
      compSgaCosts,
      compRateioCosts
    };
  }, [filteredByMonth, enhancedKpis, comparisonMode]);

  // Variation detail data
  const variationDetail = useMemo(() => {
    const targetReached = ((enhancedKpis.ebitda / Math.max(1, enhancedKpis.targetEbitdaValue)) * 100);
    const variationFromTarget = enhancedKpis.ebitda - enhancedKpis.targetEbitdaValue;

    const variationFromComparison = enhancedKpis.ebitda - trends.compEbitda;
    const variationFromComparisonPercent = trends.compEbitda !== 0
      ? ((variationFromComparison / Math.abs(trends.compEbitda)) * 100)
      : 0;

    return {
      targetReached,
      targetValue: enhancedKpis.targetEbitdaValue,
      realValue: enhancedKpis.ebitda,
      variationFromTarget,
      variationFromTargetPercent: enhancedKpis.targetEbitdaValue > 0
        ? (variationFromTarget / enhancedKpis.targetEbitdaValue) * 100
        : 0,
      comparisonValue: trends.compEbitda,
      variationFromComparison,
      variationFromComparisonPercent,
      breakdown: {
        revenue: { real: enhancedKpis.totalRevenue, comparison: trends.compRevenue, diff: enhancedKpis.totalRevenue - trends.compRevenue },
        fixedCosts: { real: enhancedKpis.totalFixedCosts, comparison: trends.compFixedCosts, diff: enhancedKpis.totalFixedCosts - trends.compFixedCosts },
        variableCosts: { real: enhancedKpis.totalVariableCosts, comparison: trends.compVariableCosts, diff: enhancedKpis.totalVariableCosts - trends.compVariableCosts },
        sgaCosts: { real: enhancedKpis.sgaCosts, comparison: trends.compSgaCosts, diff: enhancedKpis.sgaCosts - trends.compSgaCosts },
        rateioCosts: { real: 0, comparison: trends.compRateioCosts, diff: -trends.compRateioCosts }
      }
    };
  }, [enhancedKpis, trends]);

  const unitEconomics = [
    { name: 'Previsto', ticket: enhancedKpis.revenuePerStudent, cost: enhancedKpis.costPerStudent },
    { name: 'Real', ticket: enhancedKpis.revenuePerStudent * 0.98, cost: enhancedKpis.costPerStudent * 1.05 },
  ];

  // Waterfall Chart Data - De Receita até EBITDA
  const waterfallData = useMemo(() => {
    const real = filteredByMonth.filter(t => t.scenario === 'Real');
    const comparison = filteredByMonth.filter(t =>
      t.scenario === (comparisonMode === 'budget' ? 'Orçamento' : 'Ano Anterior')
    );

    // Real values
    const revenue = real.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
    const fixedCosts = real.filter(t => t.type === 'FIXED_COST').reduce((acc, t) => acc + t.amount, 0);
    const variableCosts = real.filter(t => t.type === 'VARIABLE_COST').reduce((acc, t) => acc + t.amount, 0);
    const sgaCosts = real.filter(t => t.type === 'SGA').reduce((acc, t) => acc + t.amount, 0);
    const rateioCosts = real.filter(t => t.type === 'RATEIO').reduce((acc, t) => acc + t.amount, 0);
    const ebitda = revenue - fixedCosts - variableCosts - sgaCosts - rateioCosts;

    // Comparison values
    const compRevenue = comparison.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
    const compFixedCosts = comparison.filter(t => t.type === 'FIXED_COST').reduce((acc, t) => acc + t.amount, 0);
    const compVariableCosts = comparison.filter(t => t.type === 'VARIABLE_COST').reduce((acc, t) => acc + t.amount, 0);
    const compSgaCosts = comparison.filter(t => t.type === 'SGA').reduce((acc, t) => acc + t.amount, 0);
    const compRateioCosts = comparison.filter(t => t.type === 'RATEIO').reduce((acc, t) => acc + t.amount, 0);
    const compEbitda = compRevenue - compFixedCosts - compVariableCosts - compSgaCosts - compRateioCosts;

    // Calculate variations (%)
    const calcVariation = (real: number, comp: number) => {
      if (comp === 0) return 0;
      return ((real - comp) / Math.abs(comp)) * 100;
    };

    const data = [
      {
        name: 'Receita',
        start: 0,
        value: revenue,
        end: revenue,
        color: '#1B75BB',
        displayValue: revenue,
        variation: calcVariation(revenue, compRevenue)
      },
      {
        name: 'Custos Variáveis',
        start: revenue,
        value: variableCosts,
        end: revenue - variableCosts,
        color: '#F97316',
        displayValue: variableCosts,
        variation: calcVariation(variableCosts, compVariableCosts)
      },
      {
        name: 'Custos Fixos',
        start: revenue - variableCosts,
        value: fixedCosts,
        end: revenue - variableCosts - fixedCosts,
        color: '#F44C00',
        displayValue: fixedCosts,
        variation: calcVariation(fixedCosts, compFixedCosts)
      },
      {
        name: 'SG&A',
        start: revenue - variableCosts - fixedCosts,
        value: sgaCosts,
        end: revenue - variableCosts - fixedCosts - sgaCosts,
        color: '#FB923C',
        displayValue: sgaCosts,
        variation: calcVariation(sgaCosts, compSgaCosts)
      },
      {
        name: 'Rateio',
        start: revenue - variableCosts - fixedCosts - sgaCosts,
        value: rateioCosts,
        end: revenue - variableCosts - fixedCosts - sgaCosts - rateioCosts,
        color: '#FDBA74',
        displayValue: rateioCosts,
        variation: calcVariation(rateioCosts, compRateioCosts)
      },
      {
        name: 'EBITDA',
        start: 0,
        value: ebitda,
        end: ebitda,
        color: ebitda >= 0 ? '#7AC5BF' : '#EF4444',
        displayValue: Math.abs(ebitda),
        isNegative: ebitda < 0,
        variation: calcVariation(ebitda, compEbitda)
      }
    ];

    console.log('🔵 Waterfall Data:', data);
    return data;
  }, [filteredByMonth, comparisonMode]);

  // Heatmap de Performance Mensal
  const heatmapData = useMemo(() => {
    const metrics = ['Receita', 'Custos Variáveis', 'Custos Fixos', 'SG&A', 'Rateio', 'EBITDA'];
    const monthsData = months.map((month, idx) => {
      const monthTransactions = transactions.filter(t => new Date(t.date).getMonth() === idx && t.scenario === 'Real');
      const revenue = monthTransactions.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
      const variableCosts = monthTransactions.filter(t => t.type === 'VARIABLE_COST').reduce((acc, t) => acc + t.amount, 0);
      const fixedCosts = monthTransactions.filter(t => t.type === 'FIXED_COST').reduce((acc, t) => acc + t.amount, 0);
      const sgaCosts = monthTransactions.filter(t => t.type === 'SGA').reduce((acc, t) => acc + t.amount, 0);
      const rateioCosts = monthTransactions.filter(t => t.type === 'RATEIO').reduce((acc, t) => acc + t.amount, 0);
      const ebitda = revenue - variableCosts - fixedCosts - sgaCosts - rateioCosts;

      return {
        month,
        monthIndex: idx,
        Receita: revenue > 0 ? (revenue / 1000).toFixed(0) : '0', // em milhares
        'Custos Variáveis': variableCosts > 0 ? (variableCosts / 1000).toFixed(0) : '0',
        'Custos Fixos': fixedCosts > 0 ? (fixedCosts / 1000).toFixed(0) : '0',
        'SG&A': sgaCosts > 0 ? (sgaCosts / 1000).toFixed(0) : '0',
        'Rateio': rateioCosts > 0 ? (rateioCosts / 1000).toFixed(0) : '0',
        'EBITDA': ebitda !== 0 ? (ebitda / 1000).toFixed(0) : '0',
        // Scores para coloração (0-100)
        scores: {
          Receita: revenue > 0 ? Math.min(100, (revenue / 150000) * 100) : 0,
          'Custos Variáveis': variableCosts > 0 ? Math.min(100, 100 - (variableCosts / 80000) * 100) : 100,
          'Custos Fixos': fixedCosts > 0 ? Math.min(100, 100 - (fixedCosts / 60000) * 100) : 100,
          'SG&A': sgaCosts > 0 ? Math.min(100, 100 - (sgaCosts / 30000) * 100) : 100,
          'Rateio': rateioCosts > 0 ? Math.min(100, 100 - (rateioCosts / 20000) * 100) : 100,
          'EBITDA': ebitda > 0 ? Math.min(100, (ebitda / 40000) * 100) : 0
        }
      };
    });

    console.log('🔥 Heatmap Data:', { metrics, monthsData });
    return { metrics, monthsData };
  }, [transactions, months]);

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <div className="animate-in fade-in duration-500 pb-10">
      <header className="sticky top-0 z-40 bg-gray-50 -mx-6 px-6 pt-4 pb-4 border-b border-gray-200 shadow-sm">
        <div className="flex flex-col gap-4">
          {/* Título */}
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="h-5 w-1 bg-[#F44C00] rounded-full"></div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Painel Executivo Raiz</h2>
            </div>
            <p className="text-[10px] text-[#636363] font-bold uppercase tracking-widest">Grupo Raiz Educação • Performance Financeira Consolidada</p>
          </div>

          {/* Filtros e Controles */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filtro de Marca */}
            <div className={`flex items-center gap-2 bg-white px-3 py-2 rounded-lg border-2 shadow-sm transition-all ${selectedBrand === 'all' ? 'border-gray-100' : 'border-[#1B75BB]'}`}>
              <div className={`p-1.5 rounded-lg ${selectedBrand === 'all' ? 'bg-blue-50 text-[#1B75BB]' : 'bg-[#1B75BB] text-white'}`}>
                <Flag size={14} />
              </div>
              <div className="flex flex-col">
                <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Marca</span>
                <select
                  value={selectedBrand}
                  onChange={e => {
                    onBrandChange(e.target.value);
                    onBranchChange('all');
                  }}
                  className="font-black text-[10px] uppercase tracking-tight outline-none bg-transparent cursor-pointer text-gray-900"
                >
                  <option value="all">TODAS</option>
                  {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            {/* Filtro de Filial */}
            <div className={`flex items-center gap-2 bg-white px-3 py-2 rounded-lg border-2 shadow-sm transition-all ${selectedBranch === 'all' ? 'border-gray-100' : 'border-[#F44C00]'}`}>
              <div className={`p-1.5 rounded-lg ${selectedBranch === 'all' ? 'bg-orange-50 text-[#F44C00]' : 'bg-[#F44C00] text-white'}`}>
                <Building2 size={14} />
              </div>
              <div className="flex flex-col">
                <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Filial</span>
                <select
                  value={selectedBranch}
                  onChange={e => onBranchChange(e.target.value)}
                  className="font-black text-[10px] uppercase tracking-tight outline-none bg-transparent cursor-pointer text-gray-900"
                >
                  <option value="all">TODAS</option>
                  {availableBranches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            {/* Separador visual */}
            <div className="h-8 w-px bg-gray-300"></div>

            {/* Botões de Comparação */}
            <div className="flex bg-white p-0.5 rounded-lg border border-gray-100 shadow-sm">
              {(['budget', 'prevYear'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setComparisonMode(mode)}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-lg ${
                    comparisonMode === mode
                      ? 'bg-[#1B75BB] text-white'
                      : 'text-gray-400 hover:text-[#1B75BB]'
                  }`}
                >
                  vs {mode === 'budget' ? 'ORÇADO' : 'ANO ANT'}
                </button>
              ))}
            </div>

            {/* Atalhos de período */}
            <div className="flex gap-1">
              <button
                onClick={() => { setSelectedMonthStart(0); setSelectedMonthEnd(11); }}
                className={`px-2 py-1 text-[9px] font-black uppercase rounded transition-all ${
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
                className={`px-2 py-1 text-[9px] font-black uppercase rounded transition-all ${
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
                className={`px-2 py-1 text-[9px] font-black uppercase rounded transition-all ${
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
                className={`px-2 py-1 text-[9px] font-black uppercase rounded transition-all ${
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
                className={`px-2 py-1 text-[9px] font-black uppercase rounded transition-all ${
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
            <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
              <CalendarDays size={14} className="text-[#F44C00]" />
              <div className="flex items-center gap-1.5">
                <select
                  className="bg-transparent text-xs font-bold text-gray-900 outline-none cursor-pointer"
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
                <span className="text-xs text-gray-400 font-bold">até</span>
                <select
                  className="bg-transparent text-xs font-bold text-gray-900 outline-none cursor-pointer"
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

      <div className="space-y-4">
      {/* Executive KPIs Section */}
      <section>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          Indicadores Executivos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard label="Receita Líquida" value={enhancedKpis.totalRevenue} trend={trends.revenue} trendAbsolute={trends.revenueAbsolute} color="blue" icon={<Target size={16} />} />
          <KPICard label="EBITDA" value={enhancedKpis.ebitda} trend={trends.ebitda} trendAbsolute={trends.ebitdaAbsolute} color="orange" icon={<Target size={16} />} />
          <KPICard label="Receita / Aluno" value={enhancedKpis.revenuePerStudent} trend={3.2} trendAbsolute={trends.revenuePerStudentAbsolute} color="blue" icon={<Users size={16} />} />
          <KPICard label="Alunos Ativos" value={enhancedKpis.activeStudents} isNumber trend={trends.students} trendAbsolute={trends.studentsAbsolute} color="teal" icon={<Users size={16} />} />
        </div>
      </section>

      {/* SEÇÃO DE ANÁLISES AVANÇADAS */}
      <div className="mt-6 mb-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <div className="h-6 w-1.5 bg-[#1B75BB] rounded-full"></div>
          Análises Avançadas
        </h2>
        <p className="text-xs text-gray-500 mt-1 ml-4">Visualizações detalhadas de performance e comparações</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* COLUNA ESQUERDA - GRÁFICOS (col-8) */}
        <div className="lg:col-span-8 space-y-4">
          {/* 1. Waterfall Chart */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
                  <TrendingDown size={18} className="text-[#F44C00]" />
                  Waterfall - Formação do EBITDA
                </h3>
                <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Da Receita Bruta até o Resultado Operacional</p>
              </div>
            </div>
            <div className="h-[400px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={waterfallData} margin={{top: 50, right: 30, left: 20, bottom: 5}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#9ca3af', fontSize: 11, fontWeight: '700'}}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#9ca3af', fontSize: 10}}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    cursor={{fill: '#f9fafb'}}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                            <p className="text-xs font-bold text-gray-900">{data.name}</p>
                            <p className="text-sm font-black text-[#1B75BB]">
                              R$ {data.displayValue.toLocaleString('pt-BR')}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* Linha cinza no marco zero */}
                  <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={2} />
                  {/* Barra invisível para posicionar a base (efeito cascata) */}
                  <Bar
                    dataKey={(entry: any) => {
                      // Para EBITDA, sempre começar do zero
                      if (entry.name === 'EBITDA') return 0;
                      // Para outros, posicionar onde a cascata deve começar
                      return Math.min(entry.start, entry.end);
                    }}
                    stackId="a"
                    fill="transparent"
                    barSize={60}
                  />
                  {/* Barra colorida com o valor */}
                  <Bar
                    dataKey="value"
                    stackId="a"
                    barSize={60}
                    radius={[10, 10, 0, 0]}
                    label={(props: any) => {
                      const { x, y, width, index } = props;
                      const entry = waterfallData[index];
                      if (!entry) return null;
                      const variation = entry.variation || 0;
                      const variationColor = variation >= 0 ? '#059669' : '#DC2626';
                      return (
                        <g>
                          {/* Variação percentual */}
                          <text
                            x={x + width / 2}
                            y={y - 20}
                            fill={variationColor}
                            fontSize={10}
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {variation >= 0 ? '↗' : '↘'} {Math.abs(variation).toFixed(0)}%
                          </text>
                          {/* Valor absoluto */}
                          <text
                            x={x + width / 2}
                            y={y - 5}
                            fill="#374151"
                            fontSize={11}
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            R$ {(entry.displayValue / 1000).toFixed(0)}k
                          </text>
                        </g>
                      );
                    }}
                  >
                    {waterfallData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Heatmap de Performance Mensal */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
                  <CalendarDays size={18} className="text-[#7AC5BF]" />
                  Performance Mensal - Heatmap
                </h3>
                <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Visualização de tendências mensais por métrica</p>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="w-full">
              <div className="flex">
                {/* Labels das métricas */}
                <div className="flex flex-col w-20 shrink-0">
                    <div className="h-8 flex items-center justify-end pr-2 text-[8px] font-black text-gray-400 uppercase">
                      Métrica
                    </div>
                    {heatmapData.metrics.map((metric) => (
                      <div key={metric} className="h-12 flex items-center justify-end pr-2 text-[10px] font-black text-gray-700">
                        {metric}
                      </div>
                    ))}
                  </div>

                {/* Grid de células do heatmap */}
                <div className="flex-1 overflow-hidden">
                  <div className="flex">
                    {heatmapData.monthsData.map((monthData) => (
                      <div key={monthData.month} className="flex-1 min-w-[40px]">
                          {/* Header do mês */}
                          <div className="h-8 flex items-center justify-center text-[8px] font-black text-gray-400 uppercase">
                            {monthData.month}
                          </div>
                          {/* Células de cada métrica */}
                          {heatmapData.metrics.map((metric) => {
                            const score = monthData.scores[metric as keyof typeof monthData.scores];
                            const value = monthData[metric as keyof typeof monthData];

                            // Calcular cor baseada no score (0-100)
                            let bgColor = '#f3f4f6';
                            if (score > 70) bgColor = '#7AC5BF';
                            else if (score > 50) bgColor = '#93C5FD';
                            else if (score > 30) bgColor = '#FCD34D';
                            else if (score > 0) bgColor = '#FCA5A5';

                            return (
                              <div
                                key={`${monthData.month}-${metric}`}
                                className="h-12 flex items-center justify-center m-0.5 rounded transition-all hover:scale-105 cursor-pointer shadow-sm"
                                style={{ backgroundColor: bgColor }}
                                title={`${metric}: ${value} (Score: ${score.toFixed(0)})`}
                              >
                                <span className="text-[10px] font-black text-gray-900 whitespace-nowrap">
                                  {value}{metric === 'Margem %' && '%'}{metric === 'Alunos' && '%'}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Legenda */}
              <div className="mt-4 flex items-center justify-center gap-3 text-[9px] font-bold text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{backgroundColor: '#FCA5A5'}}></div>
                    <span>Crítico</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{backgroundColor: '#FCD34D'}}></div>
                    <span>Atenção</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{backgroundColor: '#93C5FD'}}></div>
                    <span>Regular</span>
                  </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{backgroundColor: '#7AC5BF'}}></div>
                  <span>Excelente</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA - CARDS (col-4) */}

        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Target Achievement */}
          <div className="bg-[#1B75BB] p-5 rounded-xl text-white shadow-lg flex-1 relative overflow-hidden flex flex-col justify-between group">
            <div className="relative z-10">
              <span className="text-[9px] font-black text-blue-100 uppercase tracking-widest">Atingimento da Meta</span>
              <p className="text-4xl font-black mt-2">{((enhancedKpis.ebitda / Math.max(1, enhancedKpis.targetEbitdaValue)) * 100).toFixed(0)}%</p>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-[#7AC5BF] h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (enhancedKpis.ebitda / Math.max(1, enhancedKpis.targetEbitdaValue)) * 100)}%` }}></div>
              </div>
            </div>
            <button
              onClick={() => setShowVariationDetail(true)}
              className="relative z-10 w-full mt-4 py-3 bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-1.5 border border-white/5"
            >
              Detalhar Variação <ArrowRight size={12} />
            </button>
            <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-110 transition-transform">
              <GraduationCap size={120} />
            </div>
          </div>

          {/* Dynamic Performance Status */}
          <div className={`p-4 rounded-xl shadow-lg ${
            enhancedKpis.isBelowTarget
              ? 'bg-gradient-to-br from-orange-500 to-orange-600'
              : 'bg-gradient-to-br from-teal-500 to-teal-600'
          } text-white`}>
            {enhancedKpis.isBelowTarget ? (
              <>
                <Scissors size={24} className="mb-2" />
                <h4 className="text-base font-black mb-1.5">Atenção Necessária</h4>
                <p className="text-xs font-bold opacity-90">
                  É necessário reduzir custos em <span className="font-black">R$ {enhancedKpis.costReductionNeeded.toLocaleString('pt-BR')}</span> para atingir a meta de margem de 25%.
                </p>
              </>
            ) : (
              <>
                <ShieldCheck size={24} className="mb-2" />
                <h4 className="text-base font-black mb-1.5">Performance Excelente</h4>
                <p className="text-xs font-bold opacity-90">
                  Unidade operando acima da meta com margem de segurança de <span className="font-black">R$ {enhancedKpis.marginOfSafety.toLocaleString('pt-BR')}</span>.
                </p>
              </>
            )}
          </div>

          {/* Cost Structure Breakdown */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <PieChart size={12} />
              Estrutura de Custos
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-gray-600">Custos Fixos</span>
                  <span className="text-[10px] font-black text-[#1B75BB]">
                    {((enhancedKpis.totalFixedCosts / Math.max(1, enhancedKpis.totalFixedCosts + enhancedKpis.totalVariableCosts)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#1B75BB] h-full rounded-full transition-all"
                    style={{ width: `${(enhancedKpis.totalFixedCosts / Math.max(1, enhancedKpis.totalFixedCosts + enhancedKpis.totalVariableCosts)) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-gray-600">Custos Variáveis</span>
                  <span className="text-[10px] font-black text-[#F44C00]">
                    {((enhancedKpis.totalVariableCosts / Math.max(1, enhancedKpis.totalFixedCosts + enhancedKpis.totalVariableCosts)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#F44C00] h-full rounded-full transition-all"
                    style={{ width: `${(enhancedKpis.totalVariableCosts / Math.max(1, enhancedKpis.totalFixedCosts + enhancedKpis.totalVariableCosts)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col" style={{ height: '500px' }}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Top Unidades (EBITDA)</h4>
              <button
                onClick={() => setSortBranchesAZ(!sortBranchesAZ)}
                className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all ${
                  sortBranchesAZ
                    ? 'bg-[#1B75BB] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={sortBranchesAZ ? 'Ordenar por EBITDA' : 'Ordenar A-Z'}
              >
                {sortBranchesAZ ? 'A-Z' : 'EBITDA'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {branchData.map((b, i) => (
                <div key={b.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all border border-transparent hover:border-[#1B75BB]/20">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 flex items-center justify-center rounded text-[9px] font-black ${!sortBranchesAZ && i === 0 ? 'bg-[#FFF4ED] text-[#F44C00]' : 'bg-white text-gray-400'}`}>
                      {i + 1}
                    </span>
                    <span className="text-[10px] font-black text-gray-900">{b.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-[#1B75BB]">R$ {b.ebitda.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>

    {/* Modal de Detalhamento de Variação */}
    {showVariationDetail && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-[#1B75BB] to-[#4AC8F4] p-4 rounded-t-xl flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Target size={20} />
                Detalhamento de Variação
              </h3>
              <p className="text-[10px] text-white/80 font-bold mt-0.5">
                Análise detalhada do atingimento de meta e comparações
              </p>
            </div>
            <button
              onClick={() => setShowVariationDetail(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-all"
            >
              <X size={20} className="text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Meta vs Realizado */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl border border-gray-200">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Atingimento da Meta de EBITDA (25%)
              </h4>
              <div className="grid grid-cols-3 gap-3 mb-2">
                <div>
                  <p className="text-[9px] text-gray-500 font-bold mb-0.5">Meta (25%)</p>
                  <p className="text-base font-black text-gray-900">
                    R$ {variationDetail.targetValue.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 font-bold mb-0.5">Realizado</p>
                  <p className="text-base font-black text-[#1B75BB]">
                    R$ {variationDetail.realValue.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 font-bold mb-0.5">Variação</p>
                  <p className={`text-base font-black ${variationDetail.variationFromTarget >= 0 ? 'text-[#7AC5BF]' : 'text-[#F44C00]'}`}>
                    {variationDetail.variationFromTarget >= 0 ? '+' : ''}
                    R$ {variationDetail.variationFromTarget.toLocaleString('pt-BR')}
                  </p>
                  <p className={`text-[10px] font-bold ${variationDetail.variationFromTarget >= 0 ? 'text-[#7AC5BF]' : 'text-[#F44C00]'}`}>
                    {variationDetail.variationFromTarget >= 0 ? <TrendingUp size={10} className="inline" /> : <TrendingDown size={10} className="inline" />}
                    {' '}{Math.abs(variationDetail.variationFromTargetPercent).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative">
                <div className="flex justify-between mb-1">
                  <span className="text-[9px] font-bold text-gray-600">Progresso</span>
                  <span className="text-[9px] font-black text-[#1B75BB]">
                    {variationDetail.targetReached.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      variationDetail.targetReached >= 100 ? 'bg-[#7AC5BF]' : 'bg-[#F44C00]'
                    }`}
                    style={{ width: `${Math.min(100, variationDetail.targetReached)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Comparação vs Orçado/Ano Anterior */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl border border-blue-200">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Comparação vs {comparisonMode === 'budget' ? 'Orçamento' : 'Ano Anterior'}
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[9px] text-gray-500 font-bold mb-0.5">
                    {comparisonMode === 'budget' ? 'Orçado' : 'Ano Anterior'}
                  </p>
                  <p className="text-base font-black text-gray-900">
                    R$ {variationDetail.comparisonValue.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 font-bold mb-0.5">Realizado</p>
                  <p className="text-base font-black text-[#1B75BB]">
                    R$ {variationDetail.realValue.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 font-bold mb-0.5">Variação</p>
                  <p className={`text-base font-black ${variationDetail.variationFromComparison >= 0 ? 'text-[#7AC5BF]' : 'text-[#F44C00]'}`}>
                    {variationDetail.variationFromComparison >= 0 ? '+' : ''}
                    R$ {variationDetail.variationFromComparison.toLocaleString('pt-BR')}
                  </p>
                  <p className={`text-[10px] font-bold ${variationDetail.variationFromComparison >= 0 ? 'text-[#7AC5BF]' : 'text-[#F44C00]'}`}>
                    {variationDetail.variationFromComparison >= 0 ? <TrendingUp size={10} className="inline" /> : <TrendingDown size={10} className="inline" />}
                    {' '}{Math.abs(variationDetail.variationFromComparisonPercent).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Breakdown por tipo de custo */}
            <div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Detalhamento por Categoria vs {comparisonMode === 'budget' ? 'Orçamento' : 'Ano Anterior'}
              </h4>
              <div className="space-y-2">
                {[
                  { label: 'Receita', data: variationDetail.breakdown.revenue, positive: true },
                  { label: 'Custos Variáveis', data: variationDetail.breakdown.variableCosts, positive: false },
                  { label: 'Custos Fixos', data: variationDetail.breakdown.fixedCosts, positive: false },
                  { label: 'SG&A', data: variationDetail.breakdown.sgaCosts, positive: false },
                  { label: 'Rateio', data: variationDetail.breakdown.rateioCosts, positive: false }
                ].map((item) => {
                  const variationPercent = item.data.comparison !== 0
                    ? ((item.data.diff / Math.abs(item.data.comparison)) * 100)
                    : 0;
                  const isGood = item.positive
                    ? item.data.diff >= 0
                    : item.data.diff <= 0;

                  return (
                    <div key={item.label} className="bg-white p-2.5 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-black text-gray-900">{item.label}</span>
                        <span className={`text-[11px] font-black ${isGood ? 'text-[#7AC5BF]' : 'text-[#F44C00]'}`}>
                          {item.data.diff >= 0 ? '+' : ''}
                          R$ {item.data.diff.toLocaleString('pt-BR')}
                          {' '}({Math.abs(variationPercent).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex gap-3 text-[9px]">
                        <div>
                          <span className="text-gray-500">Real: </span>
                          <span className="font-bold">R$ {item.data.real.toLocaleString('pt-BR')}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">{comparisonMode === 'budget' ? 'Orçado' : 'Ano Ant.'}: </span>
                          <span className="font-bold">R$ {item.data.comparison.toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 p-3 rounded-b-xl border-t border-gray-200 flex justify-end">
            <button
              onClick={() => setShowVariationDetail(false)}
              className="px-4 py-2 bg-[#1B75BB] text-white rounded-lg font-black text-[11px] uppercase tracking-wider hover:bg-[#145a94] transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

const KPICard = ({ label, value, trend, trendAbsolute, isPercent, isNumber, color, icon }: any) => {
  const colorMaps: any = {
    blue: 'text-[#1B75BB] bg-blue-50',
    orange: 'text-[#F44C00] bg-orange-50',
    amber: 'text-[#F44C00] bg-orange-50',
    teal: 'text-[#7AC5BF] bg-teal-50',
    purple: 'text-purple-600 bg-purple-50',
  };

  const formattedValue = useMemo(() => {
    if (isNumber) return value.toLocaleString();
    const formatted = Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return isPercent ? `${formatted}%` : `R$ ${formatted}`;
  }, [value, isPercent, isNumber]);

  const formattedTrendAbsolute = useMemo(() => {
    if (trendAbsolute === undefined) return null;
    if (isNumber) return Math.abs(trendAbsolute).toLocaleString('pt-BR');
    return `R$ ${Math.abs(trendAbsolute).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }, [trendAbsolute, isNumber]);

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-1.5">
          {icon && <div className={`p-1.5 rounded-lg ${colorMaps[color]}`}>{icon}</div>}
          <span className="text-[8px] font-black text-[#636363] uppercase tracking-widest">{label}</span>
        </div>
        {trend !== undefined && (
          <div className={`px-2 py-1 rounded text-[11px] font-black flex items-center gap-1 ${trend > 0 ? 'bg-teal-50 text-[#7AC5BF]' : 'bg-orange-50 text-[#F44C00]'}`}>
            {trend > 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {formattedTrendAbsolute && <span>{formattedTrendAbsolute} | </span>}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <p className={`text-2xl font-black tracking-tighter ${colorMaps[color].split(' ')[0]}`}>
        {formattedValue}
      </p>
    </div>
  );
};

const ConsumptionCard: React.FC<{
  label: string;
  value: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}> = ({ label, value, desc, icon, color, trend }) => {
  const colorClasses: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    amber: 'text-amber-600 bg-amber-50 border-amber-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    rose: 'text-rose-600 bg-rose-50 border-rose-200'
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
        </div>
        {trend !== undefined && (
          <div className={`px-2 py-1 rounded text-[11px] font-black flex items-center gap-1 ${trend > 0 ? 'bg-orange-50 text-[#F44C00]' : 'bg-teal-50 text-[#7AC5BF]'}`}>
            {trend > 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-black text-gray-900 mb-0.5">{value}</p>
      <p className="text-[8px] text-gray-400 font-bold">{desc}</p>
    </div>
  );
};

export default Dashboard;