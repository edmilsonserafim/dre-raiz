import React, { useState, useMemo } from 'react';
import { Target, Users, ArrowUpRight, ArrowDownRight, GraduationCap, Droplets, Zap, Box, PartyPopper, TrendingUp, TrendingDown } from 'lucide-react';
import { SchoolKPIs, Transaction } from '../types';
import { filterTransactionsByPermissions } from '../services/permissionsService';

interface KPIsViewProps {
  kpis: SchoolKPIs;
  transactions: Transaction[];
  // ✅ RLS: Permissões do usuário
  allowedMarcas?: string[];
  allowedFiliais?: string[];
  allowedCategories?: string[];
}

// Helper function to format monetary values
const formatCurrency = (value: number): string => {
  const absValue = Math.abs(value);
  if (absValue >= 1000) {
    return absValue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  } else {
    return absValue.toFixed(2).replace('.', ',');
  }
};

const KPIsView: React.FC<KPIsViewProps> = ({ kpis, transactions }) => {
  const [selectedMonthStart, setSelectedMonthStart] = useState<number>(0);
  const [selectedMonthEnd, setSelectedMonthEnd] = useState<number>(11);
  const [comparisonMode, setComparisonMode] = useState<'budget' | 'prevYear'>('budget');
  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  // 🔒 RLS: Filtrar transações por permissões do usuário
  const permissionFilteredTransactions = useMemo(() => {
    console.log('🔒 KPIsView: Aplicando permissões RLS nas transações...');
    const filtered = filterTransactionsByPermissions(transactions);
    console.log(`🔒 KPIsView: ${transactions.length} → ${filtered.length} transações após RLS`);
    return filtered;
  }, [transactions]);

  // Filter transactions by selected month range
  const filteredByMonth = useMemo(() => {
    return permissionFilteredTransactions.filter(t => {
      const month = parseInt(t.date.substring(5, 7), 10) - 1;
      return month >= selectedMonthStart && month <= selectedMonthEnd;
    });
  }, [permissionFilteredTransactions, selectedMonthStart, selectedMonthEnd]);

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

    return {
      totalRevenue,
      sgaCosts,
      rateioCosts,
      teacherCost,
      adminPayrollCost,
      ebitda,
      revenuePerStudent: numberOfStudents > 0 ? totalRevenue / numberOfStudents : 0,
      waterPerStudent: numberOfStudents > 0 ? waterCost / numberOfStudents : 0,
      energyPerClassroom: numberOfClassrooms > 0 ? energyCost / numberOfClassrooms : 0,
      consumptionMaterialPerStudent: numberOfStudents > 0 ? consumptionMaterialCost / numberOfStudents : 0,
      eventsPerStudent: numberOfStudents > 0 ? eventsCost / numberOfStudents : 0,
      teacherCostPercent: totalRevenue > 0 ? (teacherCost / totalRevenue) * 100 : 0,
      adminPayrollPercent: totalRevenue > 0 ? (adminPayrollCost / totalRevenue) * 100 : 0,
      studentMealPerStudent: numberOfStudents > 0 ? studentMealCost / numberOfStudents : 0,
      teacherCostPerClassroom: numberOfClassrooms > 0 ? teacherCost / numberOfClassrooms : 0,
      maintenancePercent: totalRevenue > 0 ? (maintenanceCost / totalRevenue) * 100 : 0,
      numberOfClassrooms
    };
  }, [filteredByMonth, kpis]);

  // Calculate trends with absolute variations for BOTH budget and previous year
  const trends = useMemo(() => {
    const budget = filteredByMonth.filter(t => t.scenario === 'Orçamento');
    const prevYear = filteredByMonth.filter(t => t.scenario === 'Ano Anterior');
    const real = filteredByMonth.filter(t => t.scenario === 'Real');

    // Helper to calculate comparisons
    const calculateComparison = (comparisonData: Transaction[]) => {
      const compRevenue = comparisonData.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
      const compSgaCosts = comparisonData.filter(t => t.type === 'SGA').reduce((acc, t) => acc + t.amount, 0);
      const compRateioCosts = comparisonData.filter(t => t.type === 'RATEIO').reduce((acc, t) => acc + t.amount, 0);
      const compTeacherCost = comparisonData.filter(t => t.category === 'Salários' || t.category?.includes('Professor')).reduce((acc, t) => acc + t.amount, 0);
      const compAdminPayrollCost = comparisonData.filter(t => t.category === 'Folha Administrativa' || t.category?.includes('Folha Adm')).reduce((acc, t) => acc + t.amount, 0);
      const compMaintenanceCost = comparisonData.filter(t => t.category === 'Manutenção' || t.category?.includes('Manutenção')).reduce((acc, t) => acc + t.amount, 0);
      const compWaterCost = comparisonData.filter(t => t.category === 'Água & Gás').reduce((acc, t) => acc + t.amount, 0);
      const compEnergyCost = comparisonData.filter(t => t.category === 'Energia').reduce((acc, t) => acc + t.amount, 0);
      const compMaterialCost = comparisonData.filter(t => t.category === 'Material de Consumo' || t.category === 'Material de Consumo & Operação').reduce((acc, t) => acc + t.amount, 0);
      const compEventsCost = comparisonData.filter(t => t.category === 'Eventos Comerciais' || t.category === 'Eventos Pedagógicos').reduce((acc, t) => acc + t.amount, 0);
      const compMealCost = comparisonData.filter(t => t.category === 'Alimentação' || t.category?.includes('Alimentação')).reduce((acc, t) => acc + t.amount, 0);

      const compTeacherPercent = compRevenue > 0 ? (compTeacherCost / compRevenue) * 100 : 0;
      const compAdminPercent = compRevenue > 0 ? (compAdminPayrollCost / compRevenue) * 100 : 0;
      const compMaintenancePercent = compRevenue > 0 ? (compMaintenanceCost / compRevenue) * 100 : 0;

      const numberOfStudents = kpis.activeStudents;
      const numberOfClassrooms = Math.ceil(numberOfStudents / 25);
      const compTeacherPerClassroom = numberOfClassrooms > 0 ? compTeacherCost / numberOfClassrooms : 0;
      const compWaterPerStudent = numberOfStudents > 0 ? compWaterCost / numberOfStudents : 0;
      const compEnergyPerClassroom = numberOfClassrooms > 0 ? compEnergyCost / numberOfClassrooms : 0;
      const compMaterialPerStudent = numberOfStudents > 0 ? compMaterialCost / numberOfStudents : 0;
      const compEventsPerStudent = numberOfStudents > 0 ? compEventsCost / numberOfStudents : 0;
      const compMealPerStudent = numberOfStudents > 0 ? compMealCost / numberOfStudents : 0;

      return {
        teacherCostComp: compTeacherCost,
        adminPayrollComp: compAdminPayrollCost,
        teacherPercentAbsolute: enhancedKpis.teacherCostPercent - compTeacherPercent,
        teacherPerClassroomAbsolute: enhancedKpis.teacherCostPerClassroom - compTeacherPerClassroom,
        adminPercentAbsolute: enhancedKpis.adminPayrollPercent - compAdminPercent,
        rateioCscAbsolute: (enhancedKpis.sgaCosts + enhancedKpis.rateioCosts) - (compSgaCosts + compRateioCosts),
        maintenancePercentAbsolute: enhancedKpis.maintenancePercent - compMaintenancePercent,
        waterPerStudentAbsolute: enhancedKpis.waterPerStudent - compWaterPerStudent,
        energyPerClassroomAbsolute: enhancedKpis.energyPerClassroom - compEnergyPerClassroom,
        materialPerStudentAbsolute: enhancedKpis.consumptionMaterialPerStudent - compMaterialPerStudent,
        eventsPerStudentAbsolute: enhancedKpis.eventsPerStudent - compEventsPerStudent,
        mealPerStudentAbsolute: enhancedKpis.studentMealPerStudent - compMealPerStudent
      };
    };

    const vsBudget = calculateComparison(budget);
    const vsPrevYear = calculateComparison(prevYear);

    return { vsBudget, vsPrevYear };
  }, [filteredByMonth, enhancedKpis, kpis]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="bg-gray-50 p-3 md:p-4 border-b border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="h-5 w-1 bg-[#F44C00] rounded-full"></div>
              <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Indicadores e KPIs</h2>
            </div>
            <p className="text-[10px] text-[#636363] font-bold uppercase tracking-widest">Métricas operacionais e de consumo detalhadas</p>
          </div>

          {/* Comparison Mode and Month Range Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Comparison Mode Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setComparisonMode('budget')}
                className={`h-[52px] px-3 py-2 rounded-lg text-xs font-black transition-all border-2 ${
                  comparisonMode === 'budget'
                    ? 'bg-[#1B75BB] text-white border-[#1B75BB] shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                vs Orçado
              </button>
              <button
                onClick={() => setComparisonMode('prevYear')}
                className={`h-[52px] px-3 py-2 rounded-lg text-xs font-black transition-all border-2 ${
                  comparisonMode === 'prevYear'
                    ? 'bg-[#1B75BB] text-white border-[#1B75BB] shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                vs Ano Anterior
              </button>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-gray-300"></div>

            {/* Month Range Filter */}
            <div className="flex items-center gap-2">
            <button
              onClick={() => { setSelectedMonthStart(0); setSelectedMonthEnd(11); }}
              className={`h-[52px] px-3 py-2 rounded-lg text-xs font-black transition-all border-2 ${
                selectedMonthStart === 0 && selectedMonthEnd === 11
                  ? 'bg-[#F44C00] text-white border-[#F44C00] shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              Ano
            </button>
            <button
              onClick={() => { setSelectedMonthStart(0); setSelectedMonthEnd(2); }}
              className={`h-[52px] px-3 py-2 rounded-lg text-xs font-black transition-all border-2 ${
                selectedMonthStart === 0 && selectedMonthEnd === 2
                  ? 'bg-[#F44C00] text-white border-[#F44C00] shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              1T
            </button>
            <button
              onClick={() => { setSelectedMonthStart(3); setSelectedMonthEnd(5); }}
              className={`h-[52px] px-3 py-2 rounded-lg text-xs font-black transition-all border-2 ${
                selectedMonthStart === 3 && selectedMonthEnd === 5
                  ? 'bg-[#F44C00] text-white border-[#F44C00] shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              2T
            </button>
            <button
              onClick={() => { setSelectedMonthStart(6); setSelectedMonthEnd(8); }}
              className={`h-[52px] px-3 py-2 rounded-lg text-xs font-black transition-all border-2 ${
                selectedMonthStart === 6 && selectedMonthEnd === 8
                  ? 'bg-[#F44C00] text-white border-[#F44C00] shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              3T
            </button>
            <button
              onClick={() => { setSelectedMonthStart(9); setSelectedMonthEnd(11); }}
              className={`h-[52px] px-3 py-2 rounded-lg text-xs font-black transition-all border-2 ${
                selectedMonthStart === 9 && selectedMonthEnd === 11
                  ? 'bg-[#F44C00] text-white border-[#F44C00] shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              4T
            </button>

            <div className="flex items-center gap-2 bg-white h-[52px] px-3 py-2 rounded-lg border-2 border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-600 font-bold">De:</span>
                <select
                  value={selectedMonthStart}
                  onChange={e => {
                    const newStart = parseInt(e.target.value);
                    setSelectedMonthStart(newStart);
                    if (selectedMonthEnd < newStart) {
                      setSelectedMonthEnd(newStart);
                    }
                  }}
                  className="bg-gray-50 text-gray-900 text-[10px] font-black px-2 py-1 rounded outline-none cursor-pointer border border-gray-200"
                >
                  {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-600 font-bold">Até:</span>
                <select
                  value={selectedMonthEnd}
                  onChange={e => {
                    const newEnd = parseInt(e.target.value);
                    setSelectedMonthEnd(newEnd);
                    if (selectedMonthStart > newEnd) {
                      setSelectedMonthStart(newEnd);
                    }
                  }}
                  className="bg-gray-50 text-gray-900 text-[10px] font-black px-2 py-1 rounded outline-none cursor-pointer border border-gray-200"
                >
                  {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>
          </div>
        </div>
      </header>

      {/* Hero Cards - Main KPIs */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <HeroCard
            label="Custo Professor"
            value={enhancedKpis.teacherCost}
            valueComparison={comparisonMode === 'budget' ? trends.vsBudget.teacherCostComp : trends.vsPrevYear.teacherCostComp}
            subtitle={`${enhancedKpis.teacherCostPercent.toFixed(1)}% da Receita`}
            icon={<GraduationCap size={20} />}
            color="purple"
            trendPercent={comparisonMode === 'budget' ? trends.vsBudget.teacherPercentAbsolute : trends.vsPrevYear.teacherPercentAbsolute}
            comparisonMode={comparisonMode}
          />
          <HeroCard
            label="Folha Administrativa"
            value={enhancedKpis.adminPayrollCost}
            valueComparison={comparisonMode === 'budget' ? trends.vsBudget.adminPayrollComp : trends.vsPrevYear.adminPayrollComp}
            subtitle={`${enhancedKpis.adminPayrollPercent.toFixed(1)}% da Receita`}
            icon={<Users size={20} />}
            color="blue"
            trendPercent={comparisonMode === 'budget' ? trends.vsBudget.adminPercentAbsolute : trends.vsPrevYear.adminPercentAbsolute}
            comparisonMode={comparisonMode}
          />
          <HeroCard
            label="Rateio CSC"
            value={enhancedKpis.sgaCosts + enhancedKpis.rateioCosts}
            valueComparison={0}
            subtitle="SG&A + Rateio"
            icon={<Target size={20} />}
            color="orange"
            trendPercent={comparisonMode === 'budget' ? trends.vsBudget.rateioCscAbsolute : trends.vsPrevYear.rateioCscAbsolute}
            comparisonMode={comparisonMode}
          />
        </div>
      </section>

      {/* Operational KPIs Section */}
      <section>
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
          <div className="h-4 w-1 bg-purple-500 rounded-full"></div>
          Indicadores Operacionais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <CompactKPICard
            label="Professor / ROL"
            value={enhancedKpis.teacherCostPercent}
            isPercent
            color="purple"
            icon={<GraduationCap size={14} />}
            trendAbsolute={comparisonMode === 'budget' ? trends.vsBudget.teacherPercentAbsolute : trends.vsPrevYear.teacherPercentAbsolute}
            comparisonMode={comparisonMode}
          />
          <CompactKPICard
            label="Professor / Turma"
            value={enhancedKpis.teacherCostPerClassroom}
            color="teal"
            icon={<GraduationCap size={14} />}
            trendAbsolute={comparisonMode === 'budget' ? trends.vsBudget.teacherPerClassroomAbsolute : trends.vsPrevYear.teacherPerClassroomAbsolute}
            comparisonMode={comparisonMode}
          />
          <CompactKPICard
            label="Folha Adm / ROL"
            value={enhancedKpis.adminPayrollPercent}
            isPercent
            color="blue"
            icon={<Users size={14} />}
            trendAbsolute={comparisonMode === 'budget' ? trends.vsBudget.adminPercentAbsolute : trends.vsPrevYear.adminPercentAbsolute}
            comparisonMode={comparisonMode}
          />
          <CompactKPICard
            label="Rateio CSC"
            value={enhancedKpis.sgaCosts + enhancedKpis.rateioCosts}
            color="orange"
            icon={<Target size={14} />}
            trendAbsolute={comparisonMode === 'budget' ? trends.vsBudget.rateioCscAbsolute : trends.vsPrevYear.rateioCscAbsolute}
            comparisonMode={comparisonMode}
          />
          <CompactKPICard
            label="Manutenção / ROL"
            value={enhancedKpis.maintenancePercent}
            isPercent
            color="amber"
            icon={<Target size={14} />}
            trendAbsolute={comparisonMode === 'budget' ? trends.vsBudget.maintenancePercentAbsolute : trends.vsPrevYear.maintenancePercentAbsolute}
            comparisonMode={comparisonMode}
          />
        </div>
      </section>

      {/* Consumption Metrics Section */}
      <section>
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
          <div className="h-4 w-1 bg-blue-500 rounded-full"></div>
          Indicadores de Consumo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <CompactKPICard
            label="Água / Aluno"
            value={enhancedKpis.waterPerStudent}
            icon={<Droplets size={14} />}
            color="blue"
            trendAbsolute={comparisonMode === 'budget' ? trends.vsBudget.waterPerStudentAbsolute : trends.vsPrevYear.waterPerStudentAbsolute}
            comparisonMode={comparisonMode}
          />
          <CompactKPICard
            label="Energia / Turma"
            value={enhancedKpis.energyPerClassroom}
            icon={<Zap size={14} />}
            color="amber"
            trendAbsolute={comparisonMode === 'budget' ? trends.vsBudget.energyPerClassroomAbsolute : trends.vsPrevYear.energyPerClassroomAbsolute}
            comparisonMode={comparisonMode}
          />
          <CompactKPICard
            label="Mat. Consumo / Aluno"
            value={enhancedKpis.consumptionMaterialPerStudent}
            icon={<Box size={14} />}
            color="purple"
            trendAbsolute={comparisonMode === 'budget' ? trends.vsBudget.materialPerStudentAbsolute : trends.vsPrevYear.materialPerStudentAbsolute}
            comparisonMode={comparisonMode}
          />
          <CompactKPICard
            label="Eventos / Aluno"
            value={enhancedKpis.eventsPerStudent}
            icon={<PartyPopper size={14} />}
            color="emerald"
            trendAbsolute={comparisonMode === 'budget' ? trends.vsBudget.eventsPerStudentAbsolute : trends.vsPrevYear.eventsPerStudentAbsolute}
            comparisonMode={comparisonMode}
          />
          <CompactKPICard
            label="Alimentação / Aluno"
            value={enhancedKpis.studentMealPerStudent}
            icon={<Users size={14} />}
            color="rose"
            trendAbsolute={comparisonMode === 'budget' ? trends.vsBudget.mealPerStudentAbsolute : trends.vsPrevYear.mealPerStudentAbsolute}
            comparisonMode={comparisonMode}
          />
        </div>
      </section>
    </div>
  );
};

const HeroCard = ({ label, value, valueComparison, subtitle, icon, color, trendPercent, comparisonMode }: any) => {
  const colorMaps: any = {
    blue: { bg: 'bg-gradient-to-br from-[#1B75BB] to-[#4AC8F4]', icon: 'bg-white/20 text-white' },
    orange: { bg: 'bg-gradient-to-br from-[#F44C00] to-[#FF8C42]', icon: 'bg-white/20 text-white' },
    purple: { bg: 'bg-gradient-to-br from-purple-600 to-purple-400', icon: 'bg-white/20 text-white' }
  };

  const percentChange = valueComparison !== 0 ? ((value - valueComparison) / Math.abs(valueComparison)) * 100 : 0;
  const comparisonLabel = comparisonMode === 'budget' ? 'Or' : 'A-1';
  const hasTrend = trendPercent != null && trendPercent !== 0 && !isNaN(trendPercent);

  return (
    <div className={`${colorMaps[color].bg} rounded-xl p-4 text-white shadow-lg relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-lg ${colorMaps[color].icon}`}>
            {icon}
          </div>
          {hasTrend && (
            <div className={`flex items-center gap-0.5 px-2 py-1 rounded ${trendPercent < 0 ? 'bg-white/30' : 'bg-white/20'}`}>
              {trendPercent < 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
              <span className="text-[10px] font-black">{Math.abs(trendPercent).toFixed(1)}pp vs {comparisonLabel}</span>
            </div>
          )}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-90 mb-1">{label}</p>
        <p className="text-3xl font-black mb-1">R$ {formatCurrency(value)}</p>
        <p className="text-[10px] font-bold opacity-75">{subtitle}</p>

        {/* Comparison Bar */}
        {valueComparison !== 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[9px] font-bold mb-1 opacity-75">
              <span>Real</span>
              <span>vs {comparisonLabel}</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/60 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.abs(percentChange))}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CompactKPICard = ({ label, value, trendAbsolute, isPercent, color, icon, comparisonMode }: any) => {
  const colorMaps: any = {
    blue: 'text-[#1B75BB] bg-blue-50',
    orange: 'text-[#F44C00] bg-orange-50',
    amber: 'text-[#F44C00] bg-orange-50',
    teal: 'text-[#7AC5BF] bg-teal-50',
    purple: 'text-purple-600 bg-purple-50',
    emerald: 'text-[#7AC5BF] bg-teal-50',
    rose: 'text-rose-600 bg-rose-50'
  };

  const formattedValue = isPercent
    ? `${value.toFixed(1)}%`
    : `R$ ${formatCurrency(value)}`;

  const formattedTrend = useMemo(() => {
    if (trendAbsolute === undefined || trendAbsolute === 0) return null;
    if (isPercent) return `${Math.abs(trendAbsolute).toFixed(1)}pp`;
    return `R$ ${formatCurrency(Math.abs(trendAbsolute))}`;
  }, [trendAbsolute, isPercent]);

  const isPositiveTrend = trendAbsolute < 0; // Negative change is good for costs
  const comparisonLabel = comparisonMode === 'budget' ? 'Or' : 'A-1';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition-all hover:border-gray-300">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {icon && <div className={`p-1 rounded-lg ${colorMaps[color]}`}>{icon}</div>}
        </div>
        {formattedTrend && (
          <div className={`px-1.5 py-0.5 rounded text-[9px] font-black flex items-center gap-0.5 ${
            isPositiveTrend ? 'bg-teal-50 text-[#7AC5BF]' : 'bg-orange-50 text-[#F44C00]'
          }`}>
            {isPositiveTrend ? <ArrowDownRight size={10} /> : <ArrowUpRight size={10} />}
            <span>{formattedTrend} vs {comparisonLabel}</span>
          </div>
        )}
      </div>
      <p className="text-[8px] font-black text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-black tracking-tight ${colorMaps[color].split(' ')[0]}`}>
        {formattedValue}
      </p>
    </div>
  );
};

export default KPIsView;
