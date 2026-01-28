import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Target, Users, ArrowUpRight, ArrowDownRight, ArrowRight, GraduationCap } from 'lucide-react';
import { SchoolKPIs, Transaction } from '../types';
import { BRANCHES } from '../constants';

interface DashboardProps {
  kpis: SchoolKPIs;
  transactions: Transaction[];
}

const Dashboard: React.FC<DashboardProps> = ({ kpis, transactions }) => {
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'ebitda' | 'margin'>('ebitda');

  const branchData = useMemo(() => {
    return BRANCHES.map(branch => {
      const bTrans = transactions.filter(t => t.branch === branch);
      const rev = bTrans.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
      const exp = bTrans.filter(t => t.type !== 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
      const ebitda = rev - exp;
      return { name: branch, revenue: rev, ebitda, margin: rev > 0 ? (ebitda / rev) * 100 : 0 };
    }).sort((a, b) => b[activeMetric] - a[activeMetric]);
  }, [transactions, activeMetric]);

  const unitEconomics = [
    { name: 'Previsto', ticket: kpis.revenuePerStudent, cost: kpis.costPerStudent },
    { name: 'Real', ticket: kpis.revenuePerStudent * 0.98, cost: kpis.costPerStudent * 1.05 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="h-6 w-1 bg-[#F44C00] rounded-full"></div>
             <h2 className="text-2xl font-black text-gray-900 tracking-tight">Painel Executivo Raiz</h2>
          </div>
          <p className="text-xs text-[#636363] font-bold uppercase tracking-widest">Grupo Raiz Educação • Performance Financeira Consolidada</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
          {['budget', 'prevYear'].map(mode => (
            <button key={mode} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#1B75BB] transition-all">
              vs {mode === 'budget' ? 'ORÇAMENTO' : 'ANO ANTERIOR'}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard label="Receita Bruta" value={kpis.totalRevenue} trend={+4.2} color="blue" />
        <KPICard label="EBITDA" value={kpis.ebitda} trend={-2.1} color="orange" />
        <KPICard label="Margem Líquida" value={kpis.netMargin} isPercent trend={-0.5} color="amber" />
        <KPICard label="Alunos Ativos" value={kpis.activeStudents} isNumber trend={+12} color="teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Unit Economics</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Ticket Médio vs Custo Operacional por Aluno</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitEconomics} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 11, fontWeight: '700'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                <Tooltip cursor={{fill: '#f9fafb'}} />
                <Bar dataKey="ticket" name="Ticket Médio" fill="#1B75BB" radius={[10, 10, 0, 0]} barSize={50} />
                <Bar dataKey="cost" name="Custo/Aluno" fill="#F44C00" radius={[10, 10, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[#1B75BB] p-8 rounded-[2rem] text-white shadow-xl flex-1 relative overflow-hidden flex flex-col justify-between group">
            <div className="relative z-10">
              <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Atingimento da Meta</span>
              <p className="text-5xl font-black mt-2">{( (kpis.ebitda / Math.max(1, kpis.targetEbitda)) * 100).toFixed(0)}%</p>
              <div className="w-full bg-white/10 h-2 rounded-full mt-4 overflow-hidden">
                <div className="bg-[#7AC5BF] h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (kpis.ebitda / Math.max(1, kpis.targetEbitda)) * 100)}%` }}></div>
              </div>
            </div>
            <button className="relative z-10 w-full mt-6 py-4 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2 border border-white/5">
              Detalhar Variação <ArrowRight size={14} />
            </button>
            <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-110 transition-transform">
              <GraduationCap size={160} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Top Unidades (EBITDA)</h4>
            <div className="space-y-3">
              {branchData.map((b, i) => (
                <div key={b.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-transparent hover:border-[#1B75BB]/20">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-lg font-black text-[10px] ${i === 0 ? 'bg-[#FFF4ED] text-[#F44C00]' : 'bg-white text-gray-400'}`}>
                      {i + 1}
                    </span>
                    <span className="text-xs font-black text-gray-900">{b.name}</span>
                  </div>
                  <span className="text-xs font-black text-[#1B75BB]">R$ {b.ebitda.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ label, value, trend, isPercent, isNumber, color }: any) => {
  const colorMaps: any = {
    blue: 'text-[#1B75BB] bg-blue-50',
    orange: 'text-[#F44C00] bg-orange-50',
    amber: 'text-[#F44C00] bg-orange-50',
    teal: 'text-[#7AC5BF] bg-teal-50',
  };

  const formattedValue = useMemo(() => {
    if (isNumber) return value.toLocaleString();
    const formatted = Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return isPercent ? `${formatted}%` : `R$ ${formatted}`;
  }, [value, isPercent, isNumber]);

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
      <div className="flex justify-between items-start mb-4">
        <span className="text-[9px] font-black text-[#636363] uppercase tracking-widest">{label}</span>
        <div className={`px-2 py-1 rounded-lg text-[9px] font-black flex items-center gap-1 ${trend > 0 ? 'bg-teal-50 text-[#7AC5BF]' : 'bg-orange-50 text-[#F44C00]'}`}>
          {trend > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {Math.abs(trend)}%
        </div>
      </div>
      <p className={`text-2xl font-black tracking-tighter ${colorMaps[color].split(' ')[0]}`}>
        {formattedValue}
      </p>
    </div>
  );
};

export default Dashboard;