
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, MessageSquare, TrendingUp, Info } from 'lucide-react';
import { chatWithFinancialData } from '../services/geminiService';
import { Transaction, SchoolKPIs } from '../types';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface AssistantViewProps {
  transactions: Transaction[];
  kpis: SchoolKPIs;
}

const AssistantView: React.FC<AssistantViewProps> = ({ transactions, kpis }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'Olá! Sou seu **Estrategista SAP**. Como posso ajudar você a analisar os resultados financeiros hoje? Posso responder perguntas sobre o EBITDA, margens ou sugerir onde cortar custos.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await chatWithFinancialData(userMessage, [], { transactions, kpis });
      setMessages(prev => [...prev, { role: 'model', content: response || 'Não consegui processar sua solicitação.' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: 'Houve um erro na comunicação com a IA.' }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Qual é a nossa margem de segurança?",
    "Onde estão os maiores custos variáveis?",
    "Como podemos atingir 25% de margem?",
    "Resumo executivo do EBITDA anual."
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] animate-in fade-in duration-700">
      <header className="mb-6">
        <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
          <MessageSquare className="text-[#F44C00]" />
          Estrategista SAP
          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">IA Live</span>
        </h2>
        <p className="text-gray-500 font-medium">Análise conversacional profunda sobre sua base financeira.</p>
      </header>

      <div className="flex-1 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col overflow-hidden relative">
        {/* Chat Area */}
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
          {loading && (
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-[#fdf2f2] text-[#F44C00] flex items-center justify-center animate-pulse">
                <Bot size={20} />
              </div>
              <div className="bg-gray-50 p-5 rounded-3xl rounded-tl-none border border-gray-100 flex items-center gap-3">
                <Loader2 className="animate-spin text-[#F44C00]" size={16} />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Consultando DRE e KPIs...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions Overlay (when chat is empty/start) */}
        {messages.length === 1 && !loading && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-8">
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] border border-gray-100 shadow-xl text-center">
              <Sparkles className="mx-auto mb-4 text-[#F44C00]" size={32} />
              <h3 className="text-lg font-black text-gray-900 mb-2">Como posso ajudar?</h3>
              <p className="text-xs text-gray-500 mb-6 font-medium">Tente uma dessas análises rápidas:</p>
              <div className="grid grid-cols-1 gap-2">
                {suggestions.map(s => (
                  <button 
                    key={s} 
                    onClick={() => { setInput(s); handleSend(); }}
                    className="text-left px-4 py-3 bg-gray-50 hover:bg-[#fdf2f2] text-xs font-bold text-gray-600 hover:text-[#F44C00] rounded-xl transition-all border border-transparent hover:border-[#F44C00]/10"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <form onSubmit={handleSend} className="relative group">
            <input 
              type="text" 
              placeholder="Pergunte ao estrategista sobre seus números..." 
              className="w-full pl-6 pr-24 py-5 bg-white border border-gray-200 rounded-3xl outline-none focus:ring-4 focus:ring-[#F44C00]/5 shadow-sm transition-all text-sm font-medium"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#F44C00] text-white p-3 rounded-2xl hover:bg-[#d94300] disabled:bg-gray-300 transition-all active:scale-95 flex items-center gap-2"
            >
              <Send size={18} />
              <span className="hidden md:inline text-xs font-black uppercase tracking-widest mr-1">Analisar</span>
            </button>
          </form>
          <div className="mt-3 flex items-center justify-center gap-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">
            <div className="flex items-center gap-1"><TrendingUp size={10} className="text-emerald-500" /> Decisões Baseadas em Dados</div>
            <div className="flex items-center gap-1"><Info size={10} className="text-blue-500" /> Analisando {transactions.length} Lançamentos</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantView;
