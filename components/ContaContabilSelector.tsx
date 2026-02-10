import React, { useState, useMemo } from 'react';
import { ContaContabilOption } from '../types';

interface ContaContabilSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (codConta: string, label: string) => void;
  currentValue?: string;
  contas: ContaContabilOption[];
}

const ContaContabilSelector: React.FC<ContaContabilSelectorProps> = ({ isOpen, onClose, onSelect, currentValue, contas }) => {
  const [selTag0, setSelTag0] = useState('');
  const [selTag01, setSelTag01] = useState('');
  const [selTag02, setSelTag02] = useState('');
  const [selTag03, setSelTag03] = useState('');
  const [selectedConta, setSelectedConta] = useState(currentValue || '');
  const [searchText, setSearchText] = useState('');

  // Filtros cascata
  const afterTag0 = useMemo(() => {
    if (!selTag0) return contas;
    return contas.filter(c => c.tag0 === selTag0);
  }, [contas, selTag0]);

  const afterTag01 = useMemo(() => {
    if (!selTag01) return afterTag0;
    return afterTag0.filter(c => c.tag01 === selTag01);
  }, [afterTag0, selTag01]);

  const afterTag02 = useMemo(() => {
    if (!selTag02) return afterTag01;
    return afterTag01.filter(c => c.tag02 === selTag02);
  }, [afterTag01, selTag02]);

  const afterTag03 = useMemo(() => {
    if (!selTag03) return afterTag02;
    return afterTag02.filter(c => c.tag03 === selTag03);
  }, [afterTag02, selTag03]);

  // Busca por texto
  const filteredContas = useMemo(() => {
    if (!searchText.trim()) return afterTag03;
    const term = searchText.toLowerCase();
    return afterTag03.filter(c =>
      c.cod_conta.toLowerCase().includes(term) ||
      (c.nome_nat_orc && c.nome_nat_orc.toLowerCase().includes(term))
    );
  }, [afterTag03, searchText]);

  // Opções DISTINCT para cada nível
  const tag0Options = useMemo(() => {
    return Array.from(new Set(contas.map(c => c.tag0).filter(Boolean) as string[])).sort();
  }, [contas]);

  const tag01Options = useMemo(() => {
    return Array.from(new Set(afterTag0.map(c => c.tag01).filter(Boolean) as string[])).sort();
  }, [afterTag0]);

  const tag02Options = useMemo(() => {
    return Array.from(new Set(afterTag01.map(c => c.tag02).filter(Boolean) as string[])).sort();
  }, [afterTag01]);

  const tag03Options = useMemo(() => {
    return Array.from(new Set(afterTag02.map(c => c.tag03).filter(Boolean) as string[])).sort();
  }, [afterTag02]);

  // Reset cascata
  const handleTag0Change = (v: string) => { setSelTag0(v); setSelTag01(''); setSelTag02(''); setSelTag03(''); };
  const handleTag01Change = (v: string) => { setSelTag01(v); setSelTag02(''); setSelTag03(''); };
  const handleTag02Change = (v: string) => { setSelTag02(v); setSelTag03(''); };

  const handleConfirm = () => {
    if (!selectedConta) return;
    const conta = contas.find(c => c.cod_conta === selectedConta);
    const label = conta ? `${conta.cod_conta} - ${conta.nome_nat_orc || ''}` : selectedConta;
    onSelect(selectedConta, label);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-white w-[95vw] max-w-4xl max-h-[90vh] flex flex-col rounded shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <h2 className="text-sm font-black uppercase text-gray-700">Selecionar Conta Contábil</h2>
          <span className="text-[9px] text-gray-400">{contas.length} contas</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg font-bold px-2">&times;</button>
        </div>

        {/* Filtros cascata */}
        <div className="px-4 py-3 border-b bg-gray-50/50 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div>
            <label className="text-[8px] font-black text-gray-500 uppercase block mb-1">Tag0 ({tag0Options.length})</label>
            <select value={selTag0} onChange={e => handleTag0Change(e.target.value)}
              className="w-full border border-gray-200 p-1.5 text-[10px] font-bold outline-none focus:border-[#F44C00] bg-white">
              <option value="">Todos</option>
              {tag0Options.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[8px] font-black text-gray-500 uppercase block mb-1">Tag01 ({tag01Options.length})</label>
            <select value={selTag01} onChange={e => handleTag01Change(e.target.value)}
              className="w-full border border-gray-200 p-1.5 text-[10px] font-bold outline-none focus:border-[#F44C00] bg-white">
              <option value="">Todos</option>
              {tag01Options.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[8px] font-black text-gray-500 uppercase block mb-1">Tag02 ({tag02Options.length})</label>
            <select value={selTag02} onChange={e => handleTag02Change(e.target.value)}
              className="w-full border border-gray-200 p-1.5 text-[10px] font-bold outline-none focus:border-[#F44C00] bg-white">
              <option value="">Todos</option>
              {tag02Options.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[8px] font-black text-gray-500 uppercase block mb-1">Tag03 ({tag03Options.length})</label>
            <select value={selTag03} onChange={e => setSelTag03(e.target.value)}
              className="w-full border border-gray-200 p-1.5 text-[10px] font-bold outline-none focus:border-[#F44C00] bg-white">
              <option value="">Todos</option>
              {tag03Options.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        {/* Busca por texto */}
        <div className="px-4 py-2 border-b">
          <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)}
            placeholder="Buscar por código ou nome..."
            className="w-full border border-gray-200 p-2 text-[10px] font-bold outline-none focus:border-[#F44C00] bg-gray-50/30" />
        </div>

        {/* Lista de contas */}
        <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
          {contas.length === 0 ? (
            <div className="text-center py-8 text-red-400 text-xs font-bold">
              Nenhuma conta carregada. Verifique o console (F12).
            </div>
          ) : filteredContas.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">Nenhuma conta para os filtros selecionados</div>
          ) : (
            <>
              <div className="text-[9px] text-gray-500 mb-2">{filteredContas.length} conta(s)</div>
              {filteredContas.map(conta => (
                <div key={conta.cod_conta} onClick={() => setSelectedConta(conta.cod_conta)}
                  className={`px-3 py-2 cursor-pointer border-b border-gray-100 text-[10px] font-bold transition-colors ${
                    selectedConta === conta.cod_conta
                      ? 'bg-[#F44C00]/10 text-[#F44C00] border-[#F44C00]/20'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}>
                  <span className="font-black">{conta.cod_conta}</span>
                  {conta.nome_nat_orc && <span className="ml-2 text-gray-500">— {conta.nome_nat_orc}</span>}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-[9px] text-gray-400">
            {selectedConta && <span>Selecionada: <strong className="text-gray-700">{selectedConta}</strong></span>}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-500 font-black text-[10px] uppercase">Cancelar</button>
            <button onClick={handleConfirm} disabled={!selectedConta}
              className="px-6 py-2 bg-[#F44C00] text-white font-black text-[10px] uppercase shadow disabled:opacity-50">Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ContaContabilSelector);
