
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Zap, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Target, Lightbulb, ArrowRight } from 'lucide-react';
import { IAInsight, Transaction, SchoolKPIs } from '../types';
import { getFinancialInsights } from '../services/geminiService';

interface InsightsViewProps {
  transactions: Transaction[];
  kpis: SchoolKPIs;
}

const InsightsView: React.FC<InsightsViewProps> = ({ transactions, kpis }) => {
  const [insights, setInsights] = useState<IAInsight[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    const data = await getFinancialInsights(transactions, kpis);
    setInsights(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Sparkles className="text-[#F44C00]" />
            IA Advisor: Resumo Executivo
          </h2>
          <p className="text-gray-500 mt-1 font-medium">Insights e narrativas geradas via Google Gemini 3 Pro.</p>
        </div>
        <button 
          onClick={fetchInsights} 
          disabled={loading} 
          className="bg-[#1B75BB] text-white px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-[#152e55] disabled:opacity-50 transition-all shadow-xl shadow-blue-100"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
          Gerar Novo Resumo
        </button>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-gray-400 space-y-6 bg-white rounded-[3rem] border border-dashed border-gray-200">
          <div className="relative">
             <Loader2 className="animate-spin text-[#F44C00]" size={64} />
             <Sparkles className="absolute -top-2 -right-2 text-[#F44C00] animate-pulse" size={24} />
          </div>
          <div className="text-center">
            <p className="text-xl font-black text-gray-900">Analisando DRE e Unit Economics...</p>
            <p className="text-sm font-medium mt-1">Isso pode levar alguns segundos dependendo da base de dados.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.map((insight, i) => {
            const isAction = insight.category === 'Ação Recomendada';
            const isNegative = insight.category === 'Driver Negativo';
            
            return (
              <div key={i} className={`p-8 rounded-[2.5rem] border transition-all hover:shadow-2xl flex flex-col group ${
                isAction ? 'bg-white border-[#1B75BB]/10 shadow-sm' : 
                isNegative ? 'bg-[#fdf2f2] border-red-100' : 
                'bg-emerald-50/50 border-emerald-100'
              }`}>
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-4 rounded-2xl ${
                    isAction ? 'bg-blue-50 text-[#1B75BB]' : 
                    isNegative ? 'bg-white text-red-600 shadow-sm' : 
                    'bg-white text-emerald-600 shadow-sm'
                  }`}>
                    {isAction ? <Lightbulb size={24} /> : isNegative ? <TrendingDown size={24} /> : <TrendingUp size={24} />}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl border ${
                    insight.priority === 'high' ? 'bg-red-600 text-white border-red-700' : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>
                    Impacto {insight.priority === 'high' ? 'Crítico' : 'Moderado'}
                  </span>
                </div>

                <div className="flex-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">{insight.category}</span>
                  <h4 className="text-xl font-black text-gray-900 mb-4 group-hover:text-[#F44C00] transition-colors leading-tight">{insight.title}</h4>
                  <p className="text-gray-500 font-medium leading-relaxed text-sm">{insight.description}</p>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                  <button className="text-[10px] font-black uppercase tracking-widest text-[#1B75BB] flex items-center gap-2 hover:gap-3 transition-all">
                    Ver detalhes analíticos <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InsightsView;
