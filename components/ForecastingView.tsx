
import React, { useMemo, useState } from 'react';
import { Transaction } from '../types';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Line, ComposedChart, ReferenceArea } from 'recharts';
import { TrendingUp, Target, RefreshCcw, BrainCircuit, Rocket, Building, Settings, CheckCircle2, ChevronRight, Info, Zap, Percent, Calendar, Coins, TrendingDown, Flag, Landmark, Users, History } from 'lucide-react';

interface ForecastingViewProps {
  transactions: Transaction[];
}

const ForecastingView: React.FC<ForecastingViewProps> = ({ transactions }) => {
  const [lastRealMonthIdx, setLastRealMonthIdx] = useState(new Date().getMonth() - 1);
  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const ANNUAL_TARGET = 1200000; // Meta Anual Definida

  // --- ESTADOS DE SIMULAÇÃO (ALAVANCAS) ---
  const [newEnrollmentsDelta, setNewEnrollmentsDelta] = useState(0); 
  const [ticketPriceDelta, setTicketPriceDelta] = useState(0);
  const [personnelEfficiency, setPersonnelEfficiency] = useState(0);
  const [operationalWaste, setOperationalWaste] = useState(0);
  const [fixedNegotiation, setFixedNegotiation] = useState(0);
  const [adminAutomation, setAdminAutomation] = useState(0);

  const seasonalityMatrix = [1.4, 1.2, 1.0, 0.95, 0.95, 1.0, 0.8, 1.0, 1.0, 1.0, 1.1, 0.8];

  const realData = useMemo(() => {
    const data = new Array(12).fill(0).map(() => ({ revenue: 0, costVar: 0, costFix: 0, sga: 0, ebitda: 0 }));
    transactions.forEach(t => {
      const m = new Date(t.date).getMonth();
      if (t.type === 'REVENUE') data[m].revenue += t.amount;
      else if (t.type === 'VARIABLE_COST') data[m].costVar += t.amount;
      else if (t.type === 'FIXED_COST') data[m].costFix += t.amount;
      else data[m].sga += t.amount;
      data[m].ebitda = data[m].revenue - (data[m].costVar + data[m].costFix + data[m].sga);
    });
    return data;
  }, [transactions]);

  const predictiveData = useMemo(() => {
    const completedMonths = realData.slice(0, lastRealMonthIdx + 1);
    const avgRev = completedMonths.length > 0 ? completedMonths.reduce((acc, m) => acc + m.revenue, 0) / completedMonths.length : 150000;
    const avgVar = completedMonths.length > 0 ? completedMonths.reduce((acc, m) => acc + m.costVar, 0) / completedMonths.length : 60000;
    const avgFix = completedMonths.length > 0 ? completedMonths.reduce((acc, m) => acc + m.costFix, 0) / completedMonths.length : 30000;
    const avgSga = completedMonths.length > 0 ? completedMonths.reduce((acc, m) => acc + m.sga, 0) / completedMonths.length : 10000;

    // Primeiro passo: Calcular base Orçada e A-1 para todos os meses
    const baseChart = months.map((_, i) => {
      const s = seasonalityMatrix[i];
      const orcadoEbitda = (avgRev * s * 1.02) - ((avgVar * s) + avgFix + avgSga);
      const a1Ebitda = (avgRev * s * 0.92) - ((avgVar * s * 1.05) + avgFix + avgSga); // Simula comportamento A-1 (pior que budget)
      return { orcadoEbitda, a1Ebitda };
    });

    // Calcular taxa de atingimento YTD (% do Orçado)
    const ytdActualEbitda = completedMonths.reduce((acc, m) => acc + m.ebitda, 0);
    const ytdBudgetEbitda = baseChart.slice(0, lastRealMonthIdx + 1).reduce((acc, m) => acc + m.orcadoEbitda, 0);
    const achievementRate = ytdBudgetEbitda !== 0 ? ytdActualEbitda / ytdBudgetEbitda : 1;

    const chart = [];
    let totalSimulation = 0;
    const bridgeValue = lastRealMonthIdx >= 0 ? realData[lastRealMonthIdx].ebitda : 0;

    for (let i = 0; i < 12; i++) {
      const isReal = i < lastRealMonthIdx;
      const isBridge = i === lastRealMonthIdx;
      const orcado = baseChart[i].orcadoEbitda;
      const a1 = baseChart[i].a1Ebitda;

      if (isReal) {
        const val = realData[i].ebitda;
        chart.push({ 
          name: months[i], 
          Real: val,
          Orcado: orcado,
          A1: a1,
          PercOrcado: val // No real, o % orçado é o próprio real
        });
        totalSimulation += val;
      } else {
        const sRelative = (seasonalityMatrix[i] / (seasonalityMatrix[lastRealMonthIdx] || 1.0));
        
        // CENÁRIO SIMULAÇÃO (ALAVANCAS)
        const calcSimulatedEbitda = () => {
          const pRev = avgRev * sRelative * (1 + (newEnrollmentsDelta + ticketPriceDelta) / 100);
          const pVar = avgVar * sRelative * (1 - (personnelEfficiency + operationalWaste) / 100);
          const pFix = avgFix * (1 - fixedNegotiation / 100);
          const pSga = avgSga * (1 - adminAutomation / 100);
          return pRev - (pVar + pFix + pSga);
        };

        const simulated = isBridge ? bridgeValue : calcSimulatedEbitda();
        const percOrcadoExtrapolado = isBridge ? bridgeValue : orcado * achievementRate;

        totalSimulation += simulated;
        chart.push({ 
          name: months[i], 
          Real: isBridge ? bridgeValue : null,
          Simulacao: simulated, 
          PercOrcado: percOrcadoExtrapolado,
          Orcado: orcado,
          A1: a1
        });
      }
    }

    return { chart, totalSimulation };
  }, [realData, lastRealMonthIdx, newEnrollmentsDelta, ticketPriceDelta, personnelEfficiency, operationalWaste, fixedNegotiation, adminAutomation]);

  const generateActionPlan = () => {
    const plans = [];
    const monthsRemaining = 11 - lastRealMonthIdx;
    
    plans.push({ 
      title: `Ciclo de Projeção: ${monthsRemaining} Meses`, 
      details: `Projetando de ${months[lastRealMonthIdx + 1] || 'Conclusão'}.` 
    });

    if (newEnrollmentsDelta !== 0) plans.push({ title: "Simulação Ativa", details: `Impacto Comercial: ${newEnrollmentsDelta}%` });
    if (personnelEfficiency > 0) plans.push({ title: "Ação Operacional", details: "Ganho de eficiência em curso." });
    
    return plans.slice(0, 3);
  };

  const resetAll = () => {
    setNewEnrollmentsDelta(0); setTicketPriceDelta(0);
    setPersonnelEfficiency(0); setOperationalWaste(0);
    setFixedNegotiation(0); setAdminAutomation(0);
  };

  const varianceToTarget = predictiveData.totalSimulation - ANNUAL_TARGET;
  const isTargetAchieved = varianceToTarget >= 0;

  return (
    <div className="space-y-4 animate-in fade-in duration-700 pb-10">
      {/* Header Central de Referência */}
      <header className="bg-white px-6 py-4 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-[#F44C00] text-white p-2.5 rounded-xl shadow-lg shadow-red-50">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 leading-tight">Forecasting e Simulador de Resultados</h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mr-2 flex items-center gap-1">
                 <Calendar size={10} /> Base Real até:
               </span>
               <div className="flex gap-0.5">
                  {months.map((m, idx) => (
                    <button 
                      key={m} 
                      onClick={() => setLastRealMonthIdx(idx)}
                      className={`text-[8px] font-black px-1.5 py-0.5 rounded transition-all border ${
                        idx <= lastRealMonthIdx 
                          ? 'bg-[#F44C00] text-white border-[#F44C00]' 
                          : 'bg-gray-50 text-gray-300 border-transparent hover:border-gray-100'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
               </div>
            </div>
          </div>
        </div>
        <button onClick={resetAll} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-500 hover:text-[#F44C00] font-bold text-[9px] transition-all border border-gray-100">
          <RefreshCcw size={10} /> Resetar Alavancas
        </button>
      </header>

      {/* Alavancas em Blocos por Assunto (3 Colunas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Rocket size={14} className="text-amber-500" /> Receitas
          </h4>
          <div className="space-y-4">
            <InputGroup label="Matrículas" value={newEnrollmentsDelta} onChange={setNewEnrollmentsDelta} icon={<Users size={12} className="text-amber-500" />} />
            <InputGroup label="Ticket Médio" value={ticketPriceDelta} onChange={setTicketPriceDelta} icon={<Coins size={12} className="text-amber-500" />} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Zap size={14} className="text-[#F44C00]" /> Eficiência
          </h4>
          <div className="space-y-4">
            <InputGroup label="Folha Docente" value={personnelEfficiency} onChange={setPersonnelEfficiency} icon={<Zap size={12} className="text-[#F44C00]" />} />
            <InputGroup label="Custos Op." value={operationalWaste} onChange={setOperationalWaste} icon={<TrendingDown size={12} className="text-[#F44C00]" />} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Landmark size={14} className="text-[#1B75BB]" /> Estrutura
          </h4>
          <div className="space-y-4">
            <InputGroup label="Negoc. Fixos" value={fixedNegotiation} onChange={setFixedNegotiation} icon={<Building size={12} className="text-[#1B75BB]" />} />
            <InputGroup label="ADM/SG&A" value={adminAutomation} onChange={setAdminAutomation} icon={<BrainCircuit size={12} className="text-[#1B75BB]" />} />
          </div>
        </div>
      </div>

      {/* Visualização de Resultados One-Page */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
            <h3 className="text-sm font-black text-gray-900 uppercase">Evolução do EBITDA Projetado</h3>
            <div className="flex flex-wrap gap-4">
               <LegendItem color="#1B75BB" label="REAL" solid />
               <LegendItem color="#10b981" label="ORÇADO" solid />
               <LegendItem color="#F9A825" label="% DO ORÇADO" dashed />
               <LegendItem color="#94a3b8" label="A-1" dotted />
               <LegendItem color="#F44C00" label="SIMULAÇÃO" solid />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={predictiveData.chart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 9}} tickFormatter={(v) => `R$${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(v: any) => v ? `R$ ${Math.round(v).toLocaleString()}` : '-'}
                />
                <ReferenceArea x1={months[0]} x2={months[lastRealMonthIdx]} fill="#1B75BB" fillOpacity={0.03} />
                
                {/* Cenários Comparativos */}
                <Line type="monotone" dataKey="Orcado" stroke="#10b981" strokeWidth={1} dot={false} opacity={0.6} />
                <Line type="monotone" dataKey="PercOrcado" stroke="#F9A825" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="A1" stroke="#94a3b8" strokeWidth={1} strokeDasharray="2 2" dot={false} opacity={0.5} />
                
                {/* Cenário Simulação (Alavancas) */}
                <Line type="monotone" dataKey="Simulacao" stroke="#F44C00" strokeWidth={3} dot={{ r: 3, fill: '#F44C00' }} animationDuration={1500} />
                
                {/* Linha Real */}
                <Line type="monotone" dataKey="Real" stroke="#1B75BB" strokeWidth={5} dot={{ r: 5, fill: '#1B75BB', strokeWidth: 2, stroke: '#fff' }} animationDuration={500} />
                
                <ReferenceLine x={months[lastRealMonthIdx]} stroke="#F44C00" strokeDasharray="3 3" label={{ position: 'top', value: 'FECHADO', fill: '#F44C00', fontSize: 8, fontWeight: '900' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resumo de Metas e Plano de Ação */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          <div className="flex-1 bg-[#1B75BB] p-6 rounded-[2rem] text-white relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10">
              <p className="text-[9px] font-black text-[#F9A825] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Target size={14} /> Potencial de Resultado Anual
              </p>
              <div className="space-y-1">
                <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Previsão Simulada</p>
                <p className="text-4xl font-black">R$ {Math.round(predictiveData.totalSimulation).toLocaleString()}</p>
              </div>
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-end border-t border-white/10 pt-4">
                <div>
                  <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Meta do Ano</p>
                  <p className="text-lg font-black text-white">R$ {ANNUAL_TARGET.toLocaleString()}</p>
                </div>
                <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 ${isTargetAchieved ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                  {isTargetAchieved ? <CheckCircle2 size={12}/> : <Flag size={12}/>}
                  {isTargetAchieved 
                    ? `SUPERÁVIT R$ ${Math.round(varianceToTarget).toLocaleString()}` 
                    : `FALTAM R$ ${Math.round(Math.abs(varianceToTarget)).toLocaleString()}`}
                </div>
              </div>
              
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                 <div 
                   className={`h-full transition-all duration-1000 ${isTargetAchieved ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-[#F9A825] shadow-[0_0_10px_rgba(252,196,25,0.5)]'}`} 
                   style={{ width: `${Math.min(100, (predictiveData.totalSimulation / ANNUAL_TARGET) * 100)}%` }}
                 ></div>
              </div>
            </div>
            <Target className="absolute -bottom-8 -right-8 w-40 h-40 opacity-5" />
          </div>

          <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm">
             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
               <TrendingUp size={12} className="text-[#F44C00]" /> Diretrizes SAP
             </h4>
             <div className="space-y-3">
                {generateActionPlan().map((p, i) => (
                  <div key={i} className="flex gap-3 items-center bg-gray-50/50 p-2.5 rounded-xl group hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-100">
                     <div className="w-1 h-8 bg-[#F44C00] rounded-full"></div>
                     <div>
                        <p className="text-[10px] font-black text-gray-800">{p.title}</p>
                        <p className="text-[9px] text-gray-500 leading-tight mt-0.5">{p.details}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTES AUXILIARES ---

const InputGroup = ({ label, value, onChange, icon }: any) => (
  <div className="flex items-center justify-between gap-2 group">
    <div className="flex items-center gap-2 overflow-hidden">
      <div className="bg-gray-50 p-2 rounded-xl group-hover:bg-white group-hover:shadow-md transition-all flex-shrink-0">{icon}</div>
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight truncate">{label}</label>
    </div>
    <div className="relative w-20 flex-shrink-0">
      <input 
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-2 py-2 text-[12px] font-black text-gray-800 focus:bg-white focus:border-[#F44C00] focus:ring-4 focus:ring-red-50 transition-all outline-none text-right pr-6"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <Percent size={10} className="text-gray-300" />
      </div>
    </div>
  </div>
);

const LegendItem = ({ color, label, dashed, dotted, solid }: any) => (
  <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-tighter hover:text-gray-600 transition-colors cursor-default">
    <div className="h-0.5 w-4 rounded-full" style={{ 
      backgroundColor: color, 
      borderTop: dashed ? `2px dashed ${color}` : dotted ? `2px dotted ${color}` : 'none',
      height: solid ? '4px' : '0px',
    }}></div>
    <span>{label}</span>
  </div>
);

export default ForecastingView;
