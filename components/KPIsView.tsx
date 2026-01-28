import React, { useState, useMemo } from 'react';
import { Target, Users, ArrowUpRight, ArrowDownRight, GraduationCap, Droplets, Zap, Box, PartyPopper } from 'lucide-react';
import { SchoolKPIs, Transaction } from '../types';

interface KPIsViewProps {
  kpis: SchoolKPIs;
  transactions: Transaction[];
}

const KPIsView: React.FC<KPIsViewProps> = ({ kpis, transactions }) => {
  const [selectedMonthStart, setSelectedMonthStart] = useState<number>(0);
  const [selectedMonthEnd, setSelectedMonthEnd] = useState<number>(11);
  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  // Filter transactions by selected month range
  const filteredByMonth = useMemo(() => {
    return transactions.filter(t => {
      const month = new Date(t.date).getMonth();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1B75BB] to-[#4AC8F4] p-6 rounded-[2rem] shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
              <Target size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Indicadores e KPIs</h1>
              <p className="text-sm text-white/80 font-bold mt-1">Métricas operacionais e de consumo detalhadas</p>
            </div>
          </div>

          {/* Month Range Filter */}
          <div className="flex items-center gap-3">
            {/* Quick access buttons */}
            <button
              onClick={() => { setSelectedMonthStart(0); setSelectedMonthEnd(11); }}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                selectedMonthStart === 0 && selectedMonthEnd === 11
                  ? 'bg-white text-[#1B75BB] shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Ano
            </button>
            <button
              onClick={() => { setSelectedMonthStart(0); setSelectedMonthEnd(2); }}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                selectedMonthStart === 0 && selectedMonthEnd === 2
                  ? 'bg-white text-[#1B75BB] shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              1T
            </button>
            <button
              onClick={() => { setSelectedMonthStart(3); setSelectedMonthEnd(5); }}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                selectedMonthStart === 3 && selectedMonthEnd === 5
                  ? 'bg-white text-[#1B75BB] shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              2T
            </button>
            <button
              onClick={() => { setSelectedMonthStart(6); setSelectedMonthEnd(8); }}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                selectedMonthStart === 6 && selectedMonthEnd === 8
                  ? 'bg-white text-[#1B75BB] shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              3T
            </button>
            <button
              onClick={() => { setSelectedMonthStart(9); setSelectedMonthEnd(11); }}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                selectedMonthStart === 9 && selectedMonthEnd === 11
                  ? 'bg-white text-[#1B75BB] shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              4T
            </button>

            {/* Month selectors */}
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/80 font-bold">De:</span>
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
                  className="bg-white/30 text-white text-xs font-black px-2 py-1 rounded outline-none cursor-pointer"
                >
                  {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/80 font-bold">Até:</span>
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
                  className="bg-white/30 text-white text-xs font-black px-2 py-1 rounded outline-none cursor-pointer"
                >
                  {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
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
          />
          <KPICard
            label="Professor / Turma"
            value={enhancedKpis.teacherCostPerClassroom}
            color="teal"
            icon={<GraduationCap size={16} />}
            trend={-1.8}
          />
          <KPICard
            label="Folha Adm / ROL"
            value={enhancedKpis.adminPayrollPercent}
            isPercent
            color="amber"
            icon={<Users size={16} />}
            trend={1.5}
          />
          <KPICard
            label="Rateio CSC"
            value={enhancedKpis.sgaCosts + enhancedKpis.rateioCosts}
            trend={0}
            color="purple"
            icon={<Target size={16} />}
          />
          <KPICard
            label="Manutenção / ROL"
            value={enhancedKpis.maintenancePercent}
            isPercent
            color="orange"
            icon={<Target size={16} />}
            trend={2.5}
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
            value={`R$ ${enhancedKpis.waterPerStudent.toFixed(2)}`}
            desc="Gasto médio de água por estudante"
            icon={<Droplets size={16} />}
            color="blue"
            trend={-3.2}
          />
          <ConsumptionCard
            label="Energia / Turma"
            value={`R$ ${enhancedKpis.energyPerClassroom.toFixed(2)}`}
            desc={`${enhancedKpis.numberOfClassrooms} turmas ativas`}
            icon={<Zap size={16} />}
            color="amber"
            trend={2.1}
          />
          <ConsumptionCard
            label="Mat. Consumo / Aluno"
            value={`R$ ${enhancedKpis.consumptionMaterialPerStudent.toFixed(2)}`}
            desc="Material operacional por estudante"
            icon={<Box size={16} />}
            color="purple"
            trend={-1.5}
          />
          <ConsumptionCard
            label="Eventos / Aluno"
            value={`R$ ${enhancedKpis.eventsPerStudent.toFixed(2)}`}
            desc="Investimento em eventos comerciais"
            icon={<PartyPopper size={16} />}
            color="emerald"
            trend={5.3}
          />
          <ConsumptionCard
            label="Alimentação / Aluno"
            value={`R$ ${enhancedKpis.studentMealPerStudent.toFixed(2)}`}
            desc="Custo de alimentação por aluno"
            icon={<Users size={16} />}
            color="rose"
            trend={-2.8}
          />
        </div>
      </section>
    </div>
  );
};

const KPICard = ({ label, value, trend, isPercent, isNumber, color, icon }: any) => {
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
    : `R$ ${Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;

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

const ConsumptionCard = ({ label, value, desc, icon, color, trend }: any) => {
  const colorMaps: any = {
    blue: 'text-[#1B75BB] bg-blue-50',
    amber: 'text-[#F44C00] bg-orange-50',
    purple: 'text-purple-600 bg-purple-50',
    emerald: 'text-[#7AC5BF] bg-teal-50',
    rose: 'text-rose-600 bg-rose-50'
  };

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
