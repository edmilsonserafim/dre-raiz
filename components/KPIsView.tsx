
import React, { useState, useMemo } from 'react';
import { SchoolKPIs, Transaction } from '../types';
import { Target, Users, TrendingUp, AlertCircle, PieChart, ShieldCheck, Scissors, Droplets, Zap, Box, PartyPopper, CalendarDays } from 'lucide-react';

interface KPIsViewProps {
  transactions: Transaction[];
  branch: string;
}

const KPIsView: React.FC<KPIsViewProps> = ({ transactions, branch }) => {
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  const kpis: SchoolKPIs = useMemo(() => {
    const trans = selectedMonth === 'all' 
      ? transactions 
      : transactions.filter(t => new Date(t.date).getMonth() === selectedMonth);

    const totalRevenue = trans.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
    const totalFixedCosts = trans.filter(t => t.type === 'FIXED_COST').reduce((acc, t) => acc + t.amount, 0);
    const totalVariableCosts = trans.filter(t => t.type === 'VARIABLE_COST').reduce((acc, t) => acc + t.amount, 0);
    const sgaCosts = trans.filter(t => t.type === 'SGA').reduce((acc, t) => acc + t.amount, 0);
    const rateioCosts = trans.filter(t => t.type === 'RATEIO').reduce((acc, t) => acc + t.amount, 0);

    const ebitda = totalRevenue - totalFixedCosts - totalVariableCosts - sgaCosts - rateioCosts;
    const netMargin = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;
    
    const targetMargin = 25; 
    const targetEbitdaValue = totalRevenue * (targetMargin / 100);
    const diffToTarget = targetEbitdaValue - ebitda;
    
    const costReductionNeeded = diffToTarget > 0 ? diffToTarget : 0;
    const marginOfSafety = diffToTarget < 0 ? Math.abs(diffToTarget) : 0;

    const numberOfStudents = branch === 'all' ? 450 : 225;
    const numberOfClassrooms = branch === 'all' ? 18 : 9;

    const waterCost = trans.filter(t => t.category === 'Água & Gás').reduce((acc, t) => acc + t.amount, 0);
    const energyCost = trans.filter(t => t.category === 'Energia').reduce((acc, t) => acc + t.amount, 0);
    const consumptionMaterialCost = trans.filter(t => t.category === 'Material de Consumo & Operação').reduce((acc, t) => acc + t.amount, 0);
    const eventsCost = trans.filter(t => t.category === 'Eventos Comerciais').reduce((acc, t) => acc + t.amount, 0);

    /* Return all fields required by SchoolKPIs interface */
    return {
      totalRevenue,
      totalFixedCosts,
      totalVariableCosts,
      sgaCosts,
      ebitda,
      netMargin: Number(netMargin.toFixed(1)),
      breakEvenPoint: 0, 
      costPerStudent: Number(((totalFixedCosts + totalVariableCosts) / numberOfStudents).toFixed(0)),
      revenuePerStudent: Number((totalRevenue / numberOfStudents).toFixed(0)),
      defaultRate: 8.5,
      targetEbitda: targetEbitdaValue,
      costReductionNeeded,
      marginOfSafety,
      activeStudents: numberOfStudents,
      churnRate: 0,
      waterPerStudent: waterCost / numberOfStudents,
      energyPerClassroom: energyCost / numberOfClassrooms,
      consumptionMaterialPerStudent: consumptionMaterialCost / numberOfStudents,
      eventsPerStudent: eventsCost / numberOfStudents
    };
  }, [transactions, branch, selectedMonth]);

  const isBelowTarget = kpis.costReductionNeeded > 0;

  const mainCards = [
    {
      label: 'Margem Líquida',
      value: `${kpis.netMargin}%`,
      desc: 'Eficiência operacional líquida da unidade.',
      icon: Target,
      color: 'text-[#F44C00]',
      bg: 'bg-orange-50'
    },
    {
      label: 'Receita / Aluno',
      value: `R$ ${kpis.revenuePerStudent.toLocaleString()}`,
      desc: 'Ticket médio gerado por matrícula.',
      icon: Users,
      color: 'text-[#1B75BB]',
      bg: 'bg-blue-50'
    },
    {
      label: isBelowTarget ? 'Redução de Custos' : 'Margem de Segurança',
      value: isBelowTarget 
        ? `R$ ${kpis.costReductionNeeded.toLocaleString()}`
        : `R$ ${kpis.marginOfSafety.toLocaleString()}`,
      desc: isBelowTarget 
        ? 'Necessário cortar para atingir meta de 25%.' 
        : 'Superávit em relação à meta institucional.',
      icon: isBelowTarget ? Scissors : ShieldCheck,
      color: isBelowTarget ? 'text-rose-600' : 'text-emerald-600',
      bg: isBelowTarget ? 'bg-rose-50' : 'bg-emerald-50'
    },
    {
      label: 'Inadimplência',
      value: `${kpis.defaultRate}%`,
      desc: 'Nível de atrasos no recebimento.',
      icon: AlertCircle,
      color: 'text-gray-600',
      bg: 'bg-gray-50'
    }
  ];

  const consumptionCards = [
    {
      label: 'Água / Aluno',
      value: `R$ ${kpis.waterPerStudent.toFixed(2)}`,
      desc: 'Gasto médio de água por estudante.',
      icon: Droplets,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'Energia / Turma',
      value: `R$ ${kpis.energyPerClassroom.toFixed(2)}`,
      desc: 'Consumo elétrico médio por sala/turma.',
      icon: Zap,
      color: 'text-amber-500',
      bg: 'bg-amber-50'
    },
    {
      label: 'Mat. Consumo / Aluno',
      value: `R$ ${kpis.consumptionMaterialPerStudent.toFixed(2)}`,
      desc: 'Insumos de operação por estudante.',
      icon: Box,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      label: 'Eventos / Aluno',
      value: `R$ ${kpis.eventsPerStudent.toFixed(2)}`,
      desc: 'Custo de eventos comerciais por aluno.',
      icon: PartyPopper,
      color: 'text-rose-500',
      bg: 'bg-rose-50'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Indicadores Estratégicos SAP</h2>
          <p className="text-gray-500 mt-1 text-lg">Análise detalhada de custos e performance operacional.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl shadow-sm">
          <CalendarDays size={18} className="text-[#F44C00]" />
          <select 
            className="bg-transparent text-sm font-bold text-gray-900 outline-none appearance-none cursor-pointer pr-4"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
          >
            <option value="all">Visão Acumulada (Ano)</option>
            {months.map((m, idx) => (
              <option key={m} value={idx}>Mês de {m}</option>
            ))}
          </select>
        </div>
      </header>

      <section>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Métricas Principais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainCards.map((card, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className={`${card.bg} ${card.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
                <card.icon size={24} />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{card.value}</p>
              <p className="text-xs text-gray-500 leading-tight">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Indicadores de Consumo por Unidade</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {consumptionCards.map((card, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all border-b-4" style={{ borderBottomColor: `currentColor` }}>
              <div className={`${card.bg} ${card.color} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>
                <card.icon size={20} />
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{card.label}</p>
              <p className={`text-2xl font-bold text-gray-900 mb-1`}>{card.value}</p>
              <p className="text-[10px] text-gray-500">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <PieChart className="text-[#F44C00]" />
            Estrutura de Custos {selectedMonth !== 'all' ? `(${months[selectedMonth as number]})` : '(YTD)'}
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-bold text-gray-700 text-sm">Custos Fixos</span>
                <span className="text-gray-500 font-bold">{((kpis.totalFixedCosts / (Math.max(1, kpis.totalFixedCosts + kpis.totalVariableCosts))) * 100).toFixed(1)}%</span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div className="bg-[#F44C00] h-full rounded-full" style={{ width: `${(kpis.totalFixedCosts / Math.max(1, kpis.totalFixedCosts + kpis.totalVariableCosts)) * 100}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-bold text-gray-700 text-sm">Custos Variáveis</span>
                <span className="text-gray-500 font-bold">{((kpis.totalVariableCosts / (Math.max(1, kpis.totalFixedCosts + kpis.totalVariableCosts))) * 100).toFixed(1)}%</span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div className="bg-[#7AC5BF] h-full rounded-full" style={{ width: `${(kpis.totalVariableCosts / Math.max(1, kpis.totalFixedCosts + kpis.totalVariableCosts)) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className={`p-8 rounded-3xl text-white shadow-xl relative overflow-hidden transition-all duration-700 ${isBelowTarget ? 'bg-gradient-to-br from-[#F44C00] to-[#d94300]' : 'bg-gradient-to-br from-[#7AC5BF] to-[#5ba89e]'}`}>
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-4">{isBelowTarget ? 'Ações Recomendadas' : 'Performance Alinhada'}</h3>
            <p className="text-white/80 mb-8 leading-relaxed text-sm">
              {isBelowTarget 
                ? `O resultado de ${selectedMonth === 'all' ? 'do ano' : months[selectedMonth as number]} está abaixo da meta institucional. Recomendamos reduzir o custo de SGA em pelo menos R$ ${kpis.costReductionNeeded.toLocaleString()} para equalizar a margem em 25%.`
                : `Excelente! Em ${selectedMonth === 'all' ? 'no acumulado do ano' : months[selectedMonth as number]}, a unidade operou com uma folga de R$ ${kpis.marginOfSafety.toLocaleString()} acima da meta. Sugerimos bonificar equipes ou investir em infraestrutura.`
              }
            </p>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold">R$ {kpis.ebitda.toLocaleString()}</span>
              <span className="text-white/80 text-[10px] font-bold mb-1 ml-2 uppercase tracking-widest">EBITDA Período</span>
            </div>
          </div>
          <TrendingUp className={`absolute top-0 right-0 p-8 opacity-10 w-48 h-48 ${isBelowTarget ? 'rotate-180' : ''}`} />
        </div>
      </div>
    </div>
  );
};

export default KPIsView;
