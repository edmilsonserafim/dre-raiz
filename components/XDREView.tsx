
import React, { useMemo, useState } from 'react';
import { Transaction } from '../types';
import { DRE_STRUCTURE } from '../constants';
import { 
  Columns, 
  ChevronRight, 
  ChevronDown, 
  Activity,
  Calendar,
  Building2,
  Tag,
  ArrowRightLeft,
  Percent
} from 'lucide-react';

interface XDREViewProps {
  transactions: Transaction[];
  onDrillDown: (category?: string, monthIdx?: number, scenario?: string, tags?: any) => void;
}

type PivotType = 'month' | 'filial' | 'tag01';

const XDREView: React.FC<XDREViewProps> = ({ transactions, onDrillDown }) => {
  const [pivot, setPivot] = useState<PivotType>('month');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
    '01': true, '02': true, '03': true, '04': true
  });

  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  const columns = useMemo(() => {
    if (pivot === 'month') return months;
    const uniqueValues = new Set(transactions.map(t => t[pivot]).filter(Boolean));
    return Array.from(uniqueValues).sort() as string[];
  }, [transactions, pivot]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const aggregatedData = useMemo(() => {
    const map: Record<string, Record<string, Record<string, number>>> = { Real: {}, Orçado: {}, 'A-1': {} };
    
    transactions.forEach(t => {
      const scenario = (t.scenario as 'Real' | 'Orçado' | 'A-1') || 'Real';
      let colKey = '';
      if (pivot === 'month') {
        colKey = months[parseInt(t.date.substring(5, 7), 10) - 1];
      } else {
        colKey = (t[pivot] as string) || 'Não Classificado';
      }

      if (!map[scenario][t.category]) map[scenario][t.category] = {};
      if (!map[scenario][t.category][colKey]) map[scenario][t.category][colKey] = 0;
      map[scenario][t.category][colKey] += t.amount;
    });
    
    return map;
  }, [transactions, pivot]);

  const getRowValues = (categories: string[], scenario: 'Real' | 'Orçado' = 'Real') => {
    return columns.map(col => {
      return categories.reduce((sum, cat) => sum + (aggregatedData[scenario]?.[cat]?.[col] || 0), 0);
    });
  };

  const calculateVar = (real: number, budget: number) => {
    if (budget === 0) return 0;
    return ((real - budget) / Math.abs(budget)) * 100;
  };

  const renderRow = (id: string, label: string, level: 1 | 2 | 3, categories: string[], hasChildren: boolean = false) => {
    const isExpanded = expandedRows[id];
    const valsReal = getRowValues(categories, 'Real');
    const valsBudget = getRowValues(categories, 'Orçado');
    const totalReal = valsReal.reduce((a, b) => a + b, 0);
    const totalBudget = valsBudget.reduce((a, b) => a + b, 0);

    const isRevenue = id.startsWith('01');
    const bgClass = level === 1 
      ? 'bg-[#152e55] text-white font-black' 
      : level === 2 
        ? 'bg-gray-100 text-gray-900 font-extrabold border-b border-gray-200' 
        : 'bg-white text-gray-600 border-b border-gray-50 hover:bg-blue-50/50';

    const paddingLeft = level === 1 ? '1rem' : level === 2 ? '2rem' : '3.5rem';

    return (
      <React.Fragment key={id}>
        {/* Linha de Valor Real */}
        <tr className={`${bgClass} transition-all text-[9px] h-8`}>
          <td className={`sticky left-0 z-30 border-r border-gray-200 shadow-[1px_0_0_rgba(0,0,0,0.1)] w-[20%] ${level === 1 ? 'bg-[#152e55]' : 'bg-inherit'}`}>
            <div className="flex items-center gap-2 px-2 overflow-hidden" style={{ paddingLeft }}>
              {hasChildren && (
                <button onClick={() => toggleRow(id)} className="p-0.5 hover:bg-black/5 rounded">
                  {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                </button>
              )}
              <span className={`truncate ${level === 1 ? 'uppercase tracking-tighter' : ''}`}>{label}</span>
            </div>
          </td>
          {valsReal.map((v, i) => (
            <td key={i} className="px-2 text-right font-mono border-r border-gray-100">
              {v === 0 ? '-' : Math.round(v).toLocaleString()}
            </td>
          ))}
          <td className={`px-3 text-right font-mono font-black border-l border-gray-300 w-[10%] ${level === 1 ? 'bg-[#1B75BB]' : 'bg-black/5'}`}>
            {Math.round(totalReal).toLocaleString()}
          </td>
        </tr>

        {/* Linha de Variação % vs Orçado */}
        <tr className={`h-6 text-[7px] border-b border-gray-100 ${level === 1 ? 'bg-[#152e55]/90 text-white/60' : 'bg-gray-50/50 text-gray-400'}`}>
          <td className={`sticky left-0 z-30 border-r border-gray-100 w-[20%] italic font-medium ${level === 1 ? 'bg-[#152e55]/90' : 'bg-inherit'}`}>
            <div className="px-10 flex items-center gap-1">
              <Percent size={8} /> Var. vs Orçado
            </div>
          </td>
          {columns.map((_, i) => {
            const v = calculateVar(valsReal[i], valsBudget[i]);
            // Se for receita, v > 0 é bom (verde). Se for custo, v > 0 é ruim (vermelho).
            const isPositiveGood = isRevenue;
            const colorClass = v === 0 ? 'text-gray-400' : (v > 0 === isPositiveGood) ? 'text-emerald-500' : 'text-rose-400';
            return (
              <td key={i} className={`px-2 text-right font-mono font-bold border-r border-gray-100 ${colorClass}`}>
                {v === 0 ? '-' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`}
              </td>
            );
          })}
          <td className={`px-3 text-right font-mono font-black border-l border-gray-200 ${calculateVar(totalReal, totalBudget) > 0 === isRevenue ? 'text-emerald-500' : 'text-rose-400'}`}>
            {calculateVar(totalReal, totalBudget).toFixed(1)}%
          </td>
        </tr>

        {hasChildren && isExpanded && (
          id.includes('.') 
            ? categories.map((cat, idx) => renderRow(`${id}.${idx}`, cat, 3, [cat], false))
            : Object.entries((DRE_STRUCTURE as any)[id === '01' ? 'REVENUE' : id === '02' ? 'VARIABLE_COST' : id === '03' ? 'FIXED_COST' : 'SGA'].children).map(([childId, child]: any) => 
                renderRow(childId, child.label, 2, child.items, true)
              )
        )}
      </React.Fragment>
    );
  };

  const renderCalcLine = (label: string, pos: string[], negs: string[][], color: string) => {
    const getCalculated = (scenario: 'Real' | 'Orçado') => {
      return columns.map(col => {
        const p = pos.reduce((s, c) => s + (aggregatedData[scenario]?.[c]?.[col] || 0), 0);
        const n = negs.reduce((s, list) => s + list.reduce((ss, c) => ss + (aggregatedData[scenario]?.[c]?.[col] || 0), 0), 0);
        return p - n;
      });
    };

    const valsReal = getCalculated('Real');
    const valsBudget = getCalculated('Orçado');
    const totalReal = valsReal.reduce((a, b) => a + b, 0);
    const totalBudget = valsBudget.reduce((a, b) => a + b, 0);

    return (
      <React.Fragment key={label}>
        <tr className={`${color} text-white text-[10px] font-black h-9 shadow-inner`}>
          <td className="sticky left-0 bg-inherit z-30 border-r border-white/10 shadow-[1px_0_0_rgba(255,255,255,0.1)] w-[20%]">
            <div className="flex items-center gap-2 px-4 uppercase tracking-tighter truncate">
              <Activity size={14} /> {label}
            </div>
          </td>
          {valsReal.map((v, i) => (
            <td key={i} className="px-2 text-right font-mono border-r border-white/5">
              {Math.round(v).toLocaleString()}
            </td>
          ))}
          <td className="px-3 text-right font-mono font-black bg-black/20 w-[10%]">
            {Math.round(totalReal).toLocaleString()}
          </td>
        </tr>
        <tr className={`${color} opacity-90 text-[8px] h-6 border-b border-white/10 italic text-white/60`}>
          <td className="sticky left-0 bg-inherit z-30 border-r border-white/10 px-10">
            % Eficiência vs Orçado
          </td>
          {columns.map((_, i) => {
            const v = calculateVar(valsReal[i], valsBudget[i]);
            return (
              <td key={i} className={`px-2 text-right font-mono font-bold border-r border-white/5 ${v >= 0 ? 'text-emerald-300' : 'text-rose-200'}`}>
                {v === 0 ? '-' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`}
              </td>
            );
          })}
          <td className={`px-3 text-right font-mono font-black bg-black/30 ${calculateVar(totalReal, totalBudget) >= 0 ? 'text-emerald-300' : 'text-rose-200'}`}>
            {calculateVar(totalReal, totalBudget).toFixed(1)}%
          </td>
        </tr>
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-12">
      <header className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-[#F44C00] text-white p-3 rounded-2xl shadow-lg shadow-orange-50">
            <Columns size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 leading-tight">XDRE - Pivot Dinâmico</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Analise o resultado por diferentes dimensões</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
          <button 
            onClick={() => setPivot('month')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${pivot === 'month' ? 'bg-[#1B75BB] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Calendar size={14} /> Mensal
          </button>
          <button
            onClick={() => setPivot('filial')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${pivot === 'filial' ? 'bg-[#1B75BB] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Building2 size={14} /> Unidades
          </button>
          <button 
            onClick={() => setPivot('tag01')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${pivot === 'tag01' ? 'bg-[#1B75BB] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Tag size={14} /> Centro de Custo
          </button>
        </div>
      </header>

      <div className="bg-white rounded-none border border-gray-100 shadow-2xl overflow-hidden relative">
        <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
          <table className="w-full border-separate border-spacing-0 text-left table-fixed min-w-[1200px]">
            <thead className="sticky top-0 z-50">
              <tr className="bg-[#152e55] text-white h-11">
                <th className="sticky left-0 z-[60] bg-[#152e55] px-4 py-2 text-[10px] font-black uppercase w-[20%] border-r border-white/10">
                  Estrutura de Contas
                </th>
                {columns.map(col => (
                  <th key={col} className="px-2 py-2 text-center text-[9px] font-black uppercase tracking-tighter border-r border-white/5 truncate">
                    {col}
                  </th>
                ))}
                <th className="px-3 py-2 text-center text-[10px] font-black bg-[#1B75BB] w-[10%]">TOTAL ACUM.</th>
              </tr>
            </thead>
            <tbody>
              {renderRow('01', DRE_STRUCTURE.REVENUE.label, 1, Object.values(DRE_STRUCTURE.REVENUE.children).flatMap(c => c.items), true)}
              {renderRow('02', DRE_STRUCTURE.VARIABLE_COST.label, 1, Object.values(DRE_STRUCTURE.VARIABLE_COST.children).flatMap(c => c.items), true)}
              
              {renderCalcLine(
                '06. MARGEM DE CONTRIBUIÇÃO', 
                Object.values(DRE_STRUCTURE.REVENUE.children).flatMap(c => c.items),
                [Object.values(DRE_STRUCTURE.VARIABLE_COST.children).flatMap(c => c.items)],
                'bg-[#F44C00]'
              )}

              {renderRow('03', DRE_STRUCTURE.FIXED_COST.label, 1, Object.values(DRE_STRUCTURE.FIXED_COST.children).flatMap(c => c.items), true)}
              {renderRow('04', DRE_STRUCTURE.SGA.label, 1, Object.values(DRE_STRUCTURE.SGA.children).flatMap(c => c.items), true)}

              {renderCalcLine(
                '09. EBITDA OPERACIONAL', 
                Object.values(DRE_STRUCTURE.REVENUE.children).flatMap(c => c.items),
                [
                  Object.values(DRE_STRUCTURE.VARIABLE_COST.children).flatMap(c => c.items),
                  Object.values(DRE_STRUCTURE.FIXED_COST.children).flatMap(c => c.items),
                  Object.values(DRE_STRUCTURE.SGA.children).flatMap(c => c.items)
                ],
                'bg-[#152e55]'
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-3xl flex items-start gap-4">
        <div className="bg-white p-2 rounded-2xl shadow-sm">
          <ArrowRightLeft size={20} className="text-[#1B75BB]" />
        </div>
        <div>
          <h4 className="text-xs font-black text-blue-900 uppercase">Dica de Navegação</h4>
          <p className="text-[10px] text-blue-800 font-medium leading-relaxed mt-1">
            Utilize os seletores no cabeçalho para rotacionar as colunas da DRE. A visão por <strong>Unidades</strong> permite comparar filiais rapidamente, enquanto a visão de <strong>Centro de Custo</strong> isola a performance de departamentos como Pedagógico ou TI. As linhas secundárias mostram a eficiência em relação ao orçamento planejado.
          </p>
        </div>
      </div>
    </div>
  );
};

export default XDREView;
