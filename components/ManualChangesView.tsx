import React, { useState } from 'react';
import { ManualChange } from '../types';
import { 
  History, CheckCircle2, XCircle, ArrowRight, AlertCircle, GitFork, 
  User, Clock, ChevronDown, ChevronUp, ShieldCheck, FileText
} from 'lucide-react';

interface ManualChangesViewProps {
  changes: ManualChange[];
  approveChange: (changeId: string) => void;
  rejectChange: (changeId: string) => void;
}

const ManualChangesView: React.FC<ManualChangesViewProps> = ({ changes, approveChange, rejectChange }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDateToMMAAAA = (dateStr: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      if (parts[0].length === 4) return `${parts[1]}-${parts[0]}`;
      if (parts[2]?.length === 4) return `${parts[1]}-${parts[2]}`;
    }
    return dateStr;
  };

  const ComparisonRow = ({ label, oldVal, newVal, formatter }: { label: string, oldVal: any, newVal: any, formatter?: (v: any) => string }) => {
    const vOld = formatter ? formatter(oldVal) : oldVal;
    const vNew = formatter ? formatter(newVal) : newVal;
    const isChanged = vOld !== vNew;

    return (
      <div className="grid grid-cols-2 gap-2 items-center border-b border-gray-50 py-1 last:border-0">
        <div className="flex flex-col min-w-0">
          <span className="text-[6px] font-black text-gray-400 uppercase tracking-tighter">{label}</span>
          <span className={`text-[9px] font-bold text-gray-400 truncate ${isChanged ? 'line-through decoration-black decoration-1' : ''}`}>
            {vOld || '-'}
          </span>
        </div>
        <div className="flex flex-col border-l border-gray-100 pl-2 min-w-0">
          <span className="text-[6px] font-black text-gray-400 uppercase tracking-tighter">Para</span>
          <span className={`text-[9px] font-black truncate ${isChanged ? 'text-[#F44C00]' : 'text-gray-600'}`}>
            {vNew || '-'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#1B75BB] text-white p-2.5 rounded-xl shadow-lg">
            <History size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Aprovações</h2>
            <p className="text-gray-500 text-[10px] font-medium mt-1">Gestão de reclassificações financeiras.</p>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed min-w-0">
            <thead className="bg-gray-50/80 border-b border-gray-100 text-[8px] font-black text-gray-400 uppercase tracking-widest h-12">
              <tr>
                <th className="px-4 w-[180px]">Solicitante</th>
                <th className="px-4 w-[160px]">Lançamento Base</th>
                <th className="px-4 w-[80px]">Tipo</th>
                <th className="px-4">Comparativo Ajuste</th>
                <th className="px-4 w-[90px] text-center">Status</th>
                <th className="px-4 w-[110px] text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {changes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-300">
                      <AlertCircle size={32} />
                      <p className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Fila Vazia</p>
                    </div>
                  </td>
                </tr>
              ) : changes.map((change) => {
                const isRateio = change.type === 'RATEIO';
                const isExpanded = expandedId === change.id;
                const orig = change.originalTransaction;
                
                let newValueObj: any = {};
                let rateioTransactions: any[] = [];
                let justification = "";

                try {
                  const parsed = JSON.parse(change.newValue || '{}');
                  if (isRateio) {
                    if (parsed.transactions) {
                      rateioTransactions = parsed.transactions;
                      justification = parsed.justification;
                    } else {
                      rateioTransactions = Array.isArray(parsed) ? parsed : [];
                    }
                  } else {
                    newValueObj = parsed;
                    justification = newValueObj.justification;
                  }
                } catch (e) {
                  console.error("Erro ao processar newValue", e);
                }

                return (
                  <React.Fragment key={change.id}>
                    <tr className={`hover:bg-gray-50/30 transition-colors ${change.status === 'Aplicado' ? 'bg-emerald-50/5' : ''}`}>
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-start gap-2">
                          <div className="bg-blue-50 text-blue-600 p-1 rounded-lg shrink-0"><User size={10} /></div>
                          <div className="min-w-0">
                             <p className="text-[9px] font-black text-gray-900 leading-none truncate">{change.requestedByName || "Usuário"}</p>
                             <p className="text-[8px] text-blue-600 font-bold truncate mt-0.5">{change.requestedBy}</p>
                             <p className="text-[7px] text-gray-400 font-bold flex items-center gap-1 mt-1 whitespace-nowrap">
                               <Clock size={7} /> {new Date(change.requestedAt).toLocaleDateString('pt-BR')}
                             </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="min-w-0">
                          <p className="text-[9px] font-black text-gray-800 leading-tight truncate" title={orig.description}>
                            {orig.description}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[7px] bg-gray-100 px-1 py-0.5 rounded text-gray-500 font-black border border-gray-200">
                              {orig.branch}
                            </span>
                            <span className="text-[7px] bg-[#F44C00]/5 px-1 py-0.5 rounded text-[#F44C00] font-black border border-[#F44C00]/10">
                              R${orig.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                          <button 
                            onClick={() => setExpandedId(isExpanded ? null : change.id)}
                            className="text-[8px] font-black text-[#1B75BB] mt-2 flex items-center gap-1 hover:underline"
                          >
                            {isExpanded ? <ChevronUp size={8}/> : <ChevronDown size={8}/>}
                            Justificativa
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className={`text-[7px] font-black px-1.5 py-1 rounded-md uppercase border w-fit ${
                          change.type === 'CONTA' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                          isRateio ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                          change.type === 'EXCLUSAO' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          'bg-indigo-50 text-indigo-600 border-indigo-100'
                        }`}>
                          {change.type === 'RATEIO' ? 'RATEIO' : 'AJUSTE'}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="min-w-0">
                          {isRateio ? (
                            <div className="flex flex-wrap gap-1">
                              {rateioTransactions.slice(0, 3).map((p: any, i: number) => (
                                <div key={i} className="text-[8px] bg-emerald-50/50 px-1.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">
                                  <span className="font-black text-emerald-800">{p.branch}:</span>
                                  <span className="font-bold text-emerald-600">R${p.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                </div>
                              ))}
                              {rateioTransactions.length > 3 && <span className="text-[7px] text-gray-400 font-black mt-1">+ {rateioTransactions.length - 3} partes</span>}
                            </div>
                          ) : (
                            <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-2 space-y-0.5">
                                <ComparisonRow label="Conta" oldVal={orig.category} newVal={newValueObj.category} />
                                <ComparisonRow label="Unidade" oldVal={orig.branch} newVal={newValueObj.branch} />
                                <ComparisonRow label="Data" oldVal={orig.date} newVal={newValueObj.date} formatter={formatDateToMMAAAA} />
                                <ComparisonRow label="Recorrência" oldVal={orig.recurring || 'Sim'} newVal={newValueObj.recurring} formatter={(v) => v === 'Não' ? 'Único' : 'Recorrente'} />
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center align-top">
                        <span className={`inline-flex px-2 py-1 rounded-full text-[7px] font-black uppercase border ${
                          change.status === 'Pendente' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                          change.status === 'Aplicado' ? 'bg-emerald-600 text-white border-emerald-700' :
                          'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                          {change.status}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right align-top">
                        {change.status === 'Pendente' && (
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => approveChange(change.id)} className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 shadow-md active:scale-95"><CheckCircle2 size={12} /></button>
                            <button onClick={() => rejectChange(change.id)} className="bg-white text-rose-500 p-2 rounded-lg hover:bg-rose-50 border border-rose-100 active:scale-95"><XCircle size={12} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                    
                    {isExpanded && (
                      <tr className="bg-blue-50/10 animate-in slide-in-from-top-1">
                        <td colSpan={6} className="px-6 py-3">
                           <div className="bg-white rounded-xl border border-blue-100 p-3 shadow-sm flex items-start gap-3">
                              <FileText size={14} className="text-blue-500 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <h5 className="text-[8px] font-black text-blue-600 uppercase tracking-widest leading-none">Justificativa do Solicitante</h5>
                                <p className="text-[10px] font-medium text-gray-600 italic mt-1 leading-snug">
                                  "{justification || "Sem justificativa detalhada."}"
                                </p>
                              </div>
                           </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManualChangesView;
