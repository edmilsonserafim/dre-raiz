import React, { useState, useMemo } from 'react';
import { Target, Users, ArrowUpRight, ArrowDownRight, GraduationCap, Droplets, Zap, Box, PartyPopper } from 'lucide-react';
import { SchoolKPIs, Transaction } from '../types';

interface KPIsViewProps {
  kpis: SchoolKPIs;
  transactions: Transaction[];
}

// Helper function to format monetary values
const formatCurrency = (value: number): string => {
  const absValue = Math.abs(value);
  if (absValue >= 1000) {
    // Valores >= 1000: sem decimais, ponto como separador de milhares
    return absValue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  } else {
    // Valores < 1000: com 2 decimais, vírgula como separador decimal
    return absValue.toFixed(2).replace('.', ',');
  }
};

const KPIsView: React.FC<KPIsViewProps> = ({ kpis, transactions }) => {
  const [selectedMonthStart, setSelectedMonthStart] = useState<number>(0);
  const [selectedMonthEnd, setSelectedMonthEnd] = useState<number>(11);
  const [comparisonMode, setComparisonMode] = useState<'budget' | 'prevYear'>('budget');
  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  // Filter transactions by selected month range
  const filteredByMonth = useMemo(() => {
    return transactions.filter(t => {
      const month = parseInt(t.date.substring(5, 7), 10) - 1;
      return month >= selectedMonthStart && month <= selectedMonthEnd;
    });
  }, [transactions, selectedMonthStart, selectedMonthEnd]);

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

  // Calculate trends with absolute variations
  const trends = useMemo(() => {
    const comparison = filteredByMonth.filter(t =>
      t.scenario === (comparisonMode === 'budget' ? 'Orçamento' : 'Ano Anterior')
    );
    const real = filteredByMonth.filter(t => t.scenario === 'Real');

    // Comparison values
    const compRevenue = comparison.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
    const compSgaCosts = comparison.filter(t => t.type === 'SGA').reduce((acc, t) => acc + t.amount, 0);
    const compRateioCosts = comparison.filter(t => t.type === 'RATEIO').reduce((acc, t) => acc + t.amount, 0);

    const compTeacherCost = comparison.filter(t => t.category === 'Salários' || t.category?.includes('Professor')).reduce((acc, t) => acc + t.amount, 0);
    const compAdminPayrollCost = comparison.filter(t => t.category === 'Folha Administrativa' || t.category?.includes('Folha Adm')).reduce((acc, t) => acc + t.amount, 0);
    const compMaintenanceCost = comparison.filter(t => t.category === 'Manutenção' || t.category?.includes('Manutenção')).reduce((acc, t) => acc + t.amount, 0);
    const compWaterCost = comparison.filter(t => t.category === 'Água & Gás').reduce((acc, t) => acc + t.amount, 0);
    const compEnergyCost = comparison.filter(t => t.category === 'Energia').reduce((acc, t) => acc + t.amount, 0);
    const compMaterialCost = comparison.filter(t => t.category === 'Material de Consumo' || t.category === 'Material de Consumo & Operação').reduce((acc, t) => acc + t.amount, 0);
    const compEventsCost = comparison.filter(t => t.category === 'Eventos Comerciais' || t.category === 'Eventos Pedagógicos').reduce((acc, t) => acc + t.amount, 0);
    const compMealCost = comparison.filter(t => t.category === 'Alimentação' || t.category?.includes('Alimentação')).reduce((acc, t) => acc + t.amount, 0);

    // Real values for calculation
    const realRevenue = real.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
    const realTeacherCost = real.filter(t => t.category === 'Salários' || t.category?.includes('Professor')).reduce((acc, t) => acc + t.amount, 0);
    const realAdminPayrollCost = real.filter(t => t.category === 'Folha Administrativa' || t.category?.includes('Folha Adm')).reduce((acc, t) => acc + t.amount, 0);

    // Percentages
    const compTeacherPercent = compRevenue > 0 ? (compTeacherCost / compRevenue) * 100 : 0;
    const compAdminPercent = compRevenue > 0 ? (compAdminPayrollCost / compRevenue) * 100 : 0;
    const compMaintenancePercent = compRevenue > 0 ? (compMaintenanceCost / compRevenue) * 100 : 0;

    // Per unit
    const numberOfStudents = kpis.activeStudents;
    const numberOfClassrooms = Math.ceil(numberOfStudents / 25);
    const compTeacherPerClassroom = numberOfClassrooms > 0 ? compTeacherCost / numberOfClassrooms : 0;
    const compWaterPerStudent = numberOfStudents > 0 ? compWaterCost / numberOfStudents : 0;
    const compEnergyPerClassroom = numberOfClassrooms > 0 ? compEnergyCost / numberOfClassrooms : 0;
    const compMaterialPerStudent = numberOfStudents > 0 ? compMaterialCost / numberOfStudents : 0;
    const compEventsPerStudent = numberOfStudents > 0 ? compEventsCost / numberOfStudents : 0;
    const compMealPerStudent = numberOfStudents > 0 ? compMealCost / numberOfStudents : 0;

    return {
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
  }, [filteredByMonth, enhancedKpis, kpis, comparisonMode]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-gray-50 p-6 border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="h-5 w-1 bg-[#F44C00] rounded-full"></div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Indicadores e KPIs</h2>
            </div>
            <p className="text-[10px] text-[#636363] font-bold uppercase tracking-widest">Métricas operacionais e de consumo detalhadas</p>
          </div>

          {/* Comparison Mode and Month Range Filters */}
          <div className="flex items-center gap-4">
            {/* Comparison Mode Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setComparisonMode('budget')}
                className={`px-3 py-2 rounded-lg text-xs font-black transition-all ${
                  comparisonMode === 'budget'
                    ? 'bg-[#1B75BB] text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                vs Orçado
              </button>
              <button
                onClick={() => setComparisonMode('prevYear')}
                className={`px-3 py-2 rounded-lg text-xs font-black transition-all ${
                  comparisonMode === 'prevYear'
                    ? 'bg-[#1B75BB] text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                vs Ano Anterior
              </button>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-gray-300"></div>

            {/* Month Range Filter */}
            <div className="flex items-center gap-2">
            {/* Quick access buttons */}
            <button
              onClick={() => { setSelectedMonthStart(0); setSelectedMonthEnd(11); }}
              className={`px-3 py-2 rounded-lg text-xs font-black transition-all ${
                selectedMonthStart === 0 && selectedMonthEnd === 11
                  ? 'bg-[#F44C00] text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Ano
            </button>
            <button
              onClick={() => { setSelectedMonthStart(0); setSelectedMonthEnd(2); }}
              className={`px-3 py-2 rounded-lg text-xs font-black transition-all ${
                selectedMonthStart === 0 && selectedMonthEnd === 2
                  ? 'bg-[#F44C00] text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              1T
            </button>
            <button
              onClick={() => { setSelectedMonthStart(3); setSelectedMonthEnd(5); }}
              className={`px-3 py-2 rounded-lg text-xs font-black transition-all ${
                selectedMonthStart === 3 && selectedMonthEnd === 5
                  ? 'bg-[#F44C00] text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              2T
            </button>
            <button
              onClick={() => { setSelectedMonthStart(6); setSelectedMonthEnd(8); }}
              className={`px-3 py-2 rounded-lg text-xs font-black transition-all ${
                selectedMonthStart === 6 && selectedMonthEnd === 8
                  ? 'bg-[#F44C00] text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              3T
            </button>
            <button
              onClick={() => { setSelectedMonthStart(9); setSelectedMonthEnd(11); }}
              className={`px-3 py-2 rounded-lg text-xs font-black transition-all ${
                selectedMonthStart === 9 && selectedMonthEnd === 11
                  ? 'bg-[#F44C00] text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              4T
            </button>

            {/* Month selectors */}
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 font-bold">De:</span>
                <select
                  value={selectedMonthStart}
                  onChange={e => {
                    const newStart = parseInt(e.target.value);
                    setSelectedMonthStart(newStart);
                    // Auto-adjust end if needed
                    if (selectedMonthEnd < newStart) {
                      setSelectedMonthEnd(newStart);
                    }
                  }}
                  className="bg-gray-50 text-gray-900 text-xs font-black px-2 py-1 rounded outline-none cursor-pointer border border-gray-200"
                >
                  {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 font-bold">Até:</span>
                <select
                  value={selectedMonthEnd}
                  onChange={e => {
                    const newEnd = parseInt(e.target.value);
                    setSelectedMonthEnd(newEnd);
                    // Auto-adjust start if needed
                    if (selectedMonthStart > newEnd) {
                      setSelectedMonthStart(newEnd);
                    }
                  }}
                  className="bg-gray-50 text-gray-900 text-xs font-black px-2 py-1 rounded outline-none cursor-pointer border border-gray-200"
                >
                  {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>
          </div>
        </div>
      </header>

      {/* Operational KPIs Section */}
      <section>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          Indicadores Operacionais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard
            label="Professor / ROL"
            value={enhancedKpis.teacherCostPercent}
            isPercent
            color="purple"
            icon={<GraduationCap size={16} />}
            trend={-2.3}
            trendAbsolute={trends.teacherPercentAbsolute}
          />
          <KPICard
            label="Professor / Turma"
            value={enhancedKpis.teacherCostPerClassroom}
            color="teal"
            icon={<GraduationCap size={16} />}
            trend={-1.8}
            trendAbsolute={trends.teacherPerClassroomAbsolute}
          />
          <KPICard
            label="Folha Adm / ROL"
            value={enhancedKpis.adminPayrollPercent}
            isPercent
            color="amber"
            icon={<Users size={16} />}
            trend={1.5}
            trendAbsolute={trends.adminPercentAbsolute}
          />
          <KPICard
            label="Rateio CSC"
            value={enhancedKpis.sgaCosts + enhancedKpis.rateioCosts}
            trend={0}
            color="purple"
            icon={<Target size={16} />}
            trendAbsolute={trends.rateioCscAbsolute}
          />
          <KPICard
            label="Manutenção / ROL"
            value={enhancedKpis.maintenancePercent}
            isPercent
            color="orange"
            icon={<Target size={16} />}
            trend={2.5}
            trendAbsolute={trends.maintenancePercentAbsolute}
          />
        </div>
      </section>

      {/* Consumption Metrics Section */}
      <section>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          Indicadores de Consumo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <ConsumptionCard
            label="Água / Aluno"
            value={`R$ ${formatCurrency(enhancedKpis.waterPerStudent)}`}
            desc="Gasto médio de água por estudante"
            icon={<Droplets size={16} />}
            color="blue"
            trend={-3.2}
            trendAbsolute={trends.waterPerStudentAbsolute}
          />
          <ConsumptionCard
            label="Energia / Turma"
            value={`R$ ${formatCurrency(enhancedKpis.energyPerClassroom)}`}
            desc={`${enhancedKpis.numberOfClassrooms} turmas ativas`}
            icon={<Zap size={16} />}
            color="amber"
            trend={2.1}
            trendAbsolute={trends.energyPerClassroomAbsolute}
          />
          <ConsumptionCard
            label="Mat. Consumo / Aluno"
            value={`R$ ${formatCurrency(enhancedKpis.consumptionMaterialPerStudent)}`}
            desc="Material operacional por estudante"
            icon={<Box size={16} />}
            color="purple"
            trend={-1.5}
            trendAbsolute={trends.materialPerStudentAbsolute}
          />
          <ConsumptionCard
            label="Eventos / Aluno"
            value={`R$ ${formatCurrency(enhancedKpis.eventsPerStudent)}`}
            desc="Investimento em eventos comerciais"
            icon={<PartyPopper size={16} />}
            color="emerald"
            trend={5.3}
            trendAbsolute={trends.eventsPerStudentAbsolute}
          />
          <ConsumptionCard
            label="Alimentação / Aluno"
            value={`R$ ${formatCurrency(enhancedKpis.studentMealPerStudent)}`}
            desc="Custo de alimentação por aluno"
            icon={<Users size={16} />}
            color="rose"
            trend={-2.8}
            trendAbsolute={trends.mealPerStudentAbsolute}
          />
        </div>
      </section>
    </div>
  );
};

const KPICard = ({ label, value, trend, trendAbsolute, isPercent, isNumber, color, icon }: any) => {
  const colorMaps: any = {
    blue: 'text-[#1B75BB] bg-blue-50',
    orange: 'text-[#F44C00] bg-orange-50',
    amber: 'text-[#F44C00] bg-orange-50',
    teal: 'text-[#7AC5BF] bg-teal-50',
    purple: 'text-purple-600 bg-purple-50'
  };

  const formattedValue = isPercent
    ? `${value.toFixed(1)}%`
    : isNumber
    ? value.toLocaleString('pt-BR')
    : `R$ ${formatCurrency(value)}`;

  const formattedTrendAbsolute = useMemo(() => {
    if (trendAbsolute === undefined) return null;
    if (isPercent) return `${Math.abs(trendAbsolute).toFixed(1)}%`;
    if (isNumber) return Math.abs(trendAbsolute).toLocaleString('pt-BR');
    return `R$ ${formatCurrency(trendAbsolute)}`;
  }, [trendAbsolute, isPercent, isNumber]);

  return (
    <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 hover:shadow-lg transition-all hover:border-gray-200">
      <div className="flex items-center justify-between mb-2">
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

const ConsumptionCard = ({ label, value, desc, icon, color, trend, trendAbsolute }: any) => {
  const colorMaps: any = {
    blue: 'text-[#1B75BB] bg-blue-50',
    amber: 'text-[#F44C00] bg-orange-50',
    purple: 'text-purple-600 bg-purple-50',
    emerald: 'text-[#7AC5BF] bg-teal-50',
    rose: 'text-rose-600 bg-rose-50'
  };

  const formattedTrendAbsolute = useMemo(() => {
    if (trendAbsolute === undefined) return null;
    return `R$ ${formatCurrency(trendAbsolute)}`;
  }, [trendAbsolute]);

  return (
    <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 hover:shadow-lg transition-all hover:border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${colorMaps[color]}`}>
            {icon}
          </div>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
        </div>
        {trend !== undefined && (
          <div className={`px-2 py-1 rounded text-[11px] font-black flex items-center gap-1 ${trend > 0 ? 'bg-orange-50 text-[#F44C00]' : 'bg-teal-50 text-[#7AC5BF]'}`}>
            {trend > 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {formattedTrendAbsolute && <span>{formattedTrendAbsolute} | </span>}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-black text-gray-900 mb-0.5">{value}</p>
      <p className="text-[8px] text-gray-400 font-bold">{desc}</p>
    </div>
  );
};

export default KPIsView;
