
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Zap, TrendingUp, TrendingDown, Lightbulb, ArrowRight, Brain } from 'lucide-react';
import { chatWithFinancialData, getFinancialInsights } from '../services/geminiService';
import { Transaction, SchoolKPIs, IAInsight } from '../types';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface AIFinancialViewProps {
  transactions: Transaction[];
  kpis: SchoolKPIs;
}

const AIFinancialView: React.FC<AIFinancialViewProps> = ({ transactions, kpis }) => {
  // Insights state
  const [insights, setInsights] = useState<IAInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'Olá! Sou seu **Analista IA Financeiro**. Vi os insights automáticos acima e posso responder perguntas específicas sobre EBITDA, margens, custos ou sugerir estratégias. Como posso ajudar?' }
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch insights on mount
  useEffect(() => {
    fetchInsights();
  }, []);

  // Auto scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatLoading]);

  const fetchInsights = async () => {
    setInsightsLoading(true);
    const data = await getFinancialInsights(transactions, kpis);
    setInsights(data);
    setInsightsLoading(false);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || chatLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      // Convert message history to the format expected by chatWithFinancialData
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await chatWithFinancialData(userMessage, history, { transactions, kpis });
      setMessages(prev => [...prev, { role: 'model', content: response || 'Não consegui processar sua solicitação.' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: 'Houve um erro na comunicação com a IA.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const suggestions = [
    "Qual é a nossa margem de segurança?",
    "Onde estão os maiores custos variáveis?",
    "Como podemos atingir 25% de margem?",
    "Resumo executivo do EBITDA anual."
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Brain className="text-[#F44C00]" />
            IA Financeira
            <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">Groq Llama 3.3</span>
          </h2>
          <p className="text-gray-500 mt-1 font-medium">Análise automática estruturada + chat conversacional para deep dive.</p>
        </div>
        <button
          onClick={fetchInsights}
          disabled={insightsLoading}
          className="bg-[#1B75BB] text-white px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-[#152e55] disabled:opacity-50 transition-all shadow-xl shadow-blue-100"
        >
          {insightsLoading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
          Gerar Novo Resumo
        </button>
      </header>

      {/* Section 1: Insights Cards (Auto Analysis) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-[#F44C00]" size={20} />
          <h3 className="text-xl font-black text-gray-900">Análise Automática</h3>
        </div>

        {insightsLoading ? (
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

      {/* Section 2: Chat Conversacional */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="text-[#1B75BB]" size={20} />
          <h3 className="text-xl font-black text-gray-900">Chat Estratégico</h3>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Perguntas e Respostas</span>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col overflow-hidden h-[600px]">
          {/* Chat Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
                  m.role === 'user' ? 'bg-[#1B75BB] text-white' : 'bg-[#fdf2f2] text-[#F44C00]'
                }`}>
                  {m.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className={`max-w-[80%] p-5 rounded-3xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-blue-50 text-gray-800 rounded-tr-none border border-blue-100'
                    : 'bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100'
                }`}>
                  <div className="prose prose-sm max-w-none">
                     {m.content.split('\n').map((line, idx) => (
                       <p key={idx} className="mb-2 last:mb-0">
                         {line.split('**').map((part, pIdx) => (
                           pIdx % 2 === 1 ? <strong key={pIdx} className="font-black text-gray-900">{part}</strong> : part
                         ))}
                       </p>
                     ))}
                  </div>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-[#fdf2f2] text-[#F44C00] flex items-center justify-center animate-pulse">
                  <Bot size={20} />
                </div>
                <div className="bg-gray-50 p-5 rounded-3xl rounded-tl-none border border-gray-100 flex items-center gap-3">
                  <Loader2 className="animate-spin text-[#1B75BB]" size={16} />
                  <span className="text-xs font-medium text-gray-500">Analisando dados...</span>
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="px-8 pb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Perguntas Sugeridas:</p>
              <div className="grid grid-cols-2 gap-2">
                {suggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(sug)}
                    className="text-left px-4 py-3 bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-2xl text-xs font-medium text-gray-600 hover:text-[#1B75BB] transition-all"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-6 border-t border-gray-100 bg-gray-50/50">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Digite sua pergunta sobre a análise financeira..."
                className="flex-1 px-6 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:border-[#1B75BB] focus:ring-2 focus:ring-[#1B75BB]/10 transition-all"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || chatLoading}
                className="px-8 py-4 bg-[#1B75BB] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#152e55] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
              >
                <Send size={16} />
                Enviar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIFinancialView;
