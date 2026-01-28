
import React, { useState, useMemo } from 'react';
import { Transaction, ManualChange } from '../types';
import { BRANCHES, ALL_CATEGORIES } from '../constants';
import { 
  Table, Edit3, Trash2, GitFork, Save, X, Calendar, Building2, Tag, Layers, Search, ChevronUp, ChevronDown, ArrowUpDown
} from 'lucide-react';

interface XXViewProps {
  transactions: Transaction[];
  requestChange: (change: any) => void;
}

const XXView: React.FC<XXViewProps> = ({ transactions, requestChange }) => {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({ category: '', date: '', branch: '', brand: '' });
  const [filters, setFilters] = useState({ description: '', category: '', branch: '' });

  const filteredData = useMemo(() => {
    return transactions.filter(t => 
      t.description.toLowerCase().includes(filters.description.toLowerCase()) &&
      t.category.toLowerCase().includes(filters.category.toLowerCase()) &&
      t.branch.toLowerCase().includes(filters.branch.toLowerCase())
    );
  }, [transactions, filters]);

  const handleOpenEdit = (tx: Transaction) => {
    setSelectedTx(tx);
    setEditForm({ category: tx.category, date: tx.date, branch: tx.branch, brand: tx.brand || 'SAP' });
  };

  const handleSubmitAjuste = () => {
    if (!selectedTx) return;
    requestChange({
      transactionId: selectedTx.id,
      description: `Ajuste: ${selectedTx.description}`,
      type: 'MULTI',
      oldValue: JSON.stringify(selectedTx),
      newValue: JSON.stringify(editForm)
    });
    setSelectedTx(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#1B75BB] text-white text-[7px] font-black uppercase tracking-widest h-10">
              <tr>
                <th className="px-4">Data</th>
                <th className="px-4">Conta</th>
                <th className="px-4">Unidade</th>
                <th className="px-4">Descrição</th>
                <th className="px-4 text-right">Valor</th>
                <th className="px-4 text-center">Status</th>
                <th className="px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredData.map(t => (
                <tr key={t.id} className={`h-8 hover:bg-blue-50/50 transition-all ${t.status === 'Pendente' ? 'opacity-50' : ''}`}>
                  <td className="px-4 text-[8px] font-mono">{t.date}</td>
                  <td className="px-4 text-[8px] font-black text-[#F44C00]">{t.category}</td>
                  <td className="px-4 text-[8px] font-bold">{t.branch}</td>
                  <td className="px-4 text-[9px] truncate max-w-xs">{t.description}</td>
                  <td className="px-4 text-[9px] font-mono text-right">R$ {t.amount.toLocaleString()}</td>
                  <td className="px-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[6px] font-black uppercase border ${
                      t.status === 'Pendente' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                      t.status === 'Ajustado' ? 'bg-blue-600 text-white border-blue-700' : 'bg-gray-50 text-gray-400'
                    }`}>{t.status}</span>
                  </td>
                  <td className="px-4 text-center">
                    {t.status === 'Normal' && (
                      <button onClick={() => handleOpenEdit(t)} className="p-1 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 size={12}/></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-[#1B75BB] p-6 text-white flex justify-between items-center">
              <h3 className="text-lg font-black uppercase">Solicitar Ajuste Operacional</h3>
              <button onClick={() => setSelectedTx(null)}><X /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase">Nova Data</label>
                  <input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} className="w-full border-2 border-gray-100 p-3 rounded-2xl text-xs font-black outline-none focus:border-[#F44C00]" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase">Nova Unidade</label>
                  <select value={editForm.branch} onChange={e => setEditForm({...editForm, branch: e.target.value})} className="w-full border-2 border-gray-100 p-3 rounded-2xl text-xs font-black outline-none focus:border-[#F44C00]">
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase">Nova Conta Contábil</label>
                  <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} className="w-full border-2 border-gray-100 p-3 rounded-2xl text-xs font-black outline-none focus:border-[#F44C00]">
                    {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setSelectedTx(null)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black text-[10px] uppercase text-gray-500">Cancelar</button>
                <button onClick={handleSubmitAjuste} className="flex-[2] py-4 bg-[#F44C00] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"><Save size={16}/> Enviar p/ Aprovação</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default XXView;
