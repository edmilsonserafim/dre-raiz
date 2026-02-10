import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ManualChange } from '../types';
import {
  History, CheckCircle2, XCircle, ArrowRight, AlertCircle, GitFork,
  User, Clock, ChevronDown, ShieldCheck, FileText, Shield, Lock, FilterX, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';

interface ManualChangesViewProps {
  changes: ManualChange[];
  approveChange: (changeId: string) => void;
  rejectChange: (changeId: string) => void;
}

interface DetailModalProps {
  change: ManualChange;
  onClose: () => void;
  approveChange: (id: string) => void;
  rejectChange: (id: string) => void;
  isAdmin: boolean;
  formatDateToMMAAAA: (dateStr: string) => string;
}

const DetailModal: React.FC<DetailModalProps> = ({ change, onClose, approveChange, rejectChange, isAdmin, formatDateToMMAAAA }) => {
  const orig = change.originalTransaction;
  const isRateio = change.type === 'RATEIO';

  let newValueObj: any = {};
  let rateioTransactions: any[] = [];
  let justification = '';

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
    console.error('Erro ao processar newValue', e);
  }

  const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-xs font-bold text-gray-800">{value || '-'}</span>
    </div>
  );

  const CompareRow = ({ label, oldVal, newVal, formatter }: { label: string; oldVal: any; newVal: any; formatter?: (v: any) => string }) => {
    const vOld = formatter ? formatter(oldVal) : (oldVal || '-');
    const vNew = formatter ? formatter(newVal) : (newVal || '-');
    const isChanged = vOld !== vNew;
    return (
      <div className="grid grid-cols-[120px_1fr_24px_1fr] items-center py-2 border-b border-gray-100 last:border-0 gap-2">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wide">{label}</span>
        <span className={`text-xs font-bold ${isChanged ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{vOld}</span>
        {isChanged ? <ArrowRight size={12} className="text-[#F44C00] mx-auto" /> : <span />}
        <span className={`text-xs font-black ${isChanged ? 'text-[#F44C00]' : 'text-gray-700'}`}>{isChanged ? vNew : ''}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              change.status === 'Pendente' ? 'bg-amber-100 text-amber-600' :
              change.status === 'Aplicado' ? 'bg-emerald-100 text-emerald-600' :
              'bg-rose-100 text-rose-600'
            }`}>
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">Detalhes da Solicitação</h3>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                change.status === 'Pendente' ? 'bg-amber-100 text-amber-700' :
                change.status === 'Aplicado' ? 'bg-emerald-100 text-emerald-700' :
                'bg-rose-100 text-rose-700'
              }`}>{change.status}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Solicitante */}
          <div>
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Solicitante</h4>
            <div className="flex items-center gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><User size={16} /></div>
              <div>
                <p className="text-xs font-black text-gray-900">{change.requestedByName || 'Usuário'}</p>
                <p className="text-[10px] text-blue-600 font-bold">{change.requestedBy}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                  <Clock size={10} /> {new Date(change.requestedAt).toLocaleDateString('pt-BR')} {new Date(change.requestedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>

          {/* Transação Original */}
          <div>
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Lançamento Original</h4>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-0">
              <DetailRow label="Descrição" value={orig.description} />
              <DetailRow label="Filial" value={orig.filial} />
              <DetailRow label="Valor" value={`R$ ${orig.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              <DetailRow label="Conta" value={orig.category} />
              <DetailRow label="Data" value={formatDateToMMAAAA(orig.date)} />
            </div>
          </div>

          {/* Alterações Solicitadas */}
          <div>
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
              {isRateio ? 'Rateio Solicitado' : 'Alterações Solicitadas'}
            </h4>
            {isRateio ? (
              <div className="space-y-2">
                {rateioTransactions.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                    <div>
                      <p className="text-xs font-black text-purple-900">{p.filial}</p>
                      <p className="text-[10px] text-purple-600 font-bold">{p.description || orig.description}</p>
                    </div>
                    <span className="text-sm font-black text-purple-700">R$ {p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-orange-50/30 p-3 rounded-xl border border-orange-100 space-y-0">
                <CompareRow label="Conta" oldVal={orig.category} newVal={newValueObj.category} />
                <CompareRow label="Unidade" oldVal={orig.filial} newVal={newValueObj.filial} />
                <CompareRow label="Data" oldVal={orig.date} newVal={newValueObj.date} formatter={formatDateToMMAAAA} />
                <CompareRow label="Recorrência" oldVal={orig.recurring || 'Sim'} newVal={newValueObj.recurring} formatter={(v) => v === 'Não' ? 'Único' : 'Recorrente'} />
              </div>
            )}
          </div>

          {/* Justificativa */}
          <div>
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Justificativa</h4>
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <p className="text-xs font-medium text-gray-700 italic leading-relaxed">
                "{justification || 'Sem justificativa detalhada.'}"
              </p>
            </div>
          </div>

          {/* Aprovador (se já resolvido) */}
          {change.approvedByName && change.approvedAt && (
            <div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                {change.status === 'Aplicado' ? 'Aprovado por' : 'Rejeitado por'}
              </h4>
              <div className="flex items-center gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg"><ShieldCheck size={16} /></div>
                <div>
                  <p className="text-xs font-black text-gray-900">{change.approvedByName}</p>
                  <p className="text-[10px] text-emerald-600 font-bold">{change.approvedBy}</p>
                </div>
                <div className="ml-auto">
                  <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                    <Clock size={10} /> {new Date(change.approvedAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer com ações */}
        {change.status === 'Pendente' && isAdmin && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
            <button
              onClick={() => { rejectChange(change.id); onClose(); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-rose-600 border-2 border-rose-200 rounded-xl hover:bg-rose-50 font-black text-xs uppercase transition-all active:scale-95"
            >
              <XCircle size={14} />
              Reprovar
            </button>
            <button
              onClick={() => { approveChange(change.id); onClose(); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-black text-xs uppercase shadow-lg transition-all active:scale-95"
            >
              <CheckCircle2 size={14} />
              Aprovar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface MultiSelectDropdownProps {
  label: string;
  icon: React.ReactNode;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  color?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  icon,
  options,
  selected,
  onChange,
  color = "blue"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-600',
      hover: 'hover:bg-blue-100'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-600',
      hover: 'hover:bg-purple-100'
    },
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-600',
      hover: 'hover:bg-emerald-100'
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-600',
      hover: 'hover:bg-amber-100'
    }
  };

  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;
  const isActive = selected.length > 0;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-xs font-bold ${
          isActive
            ? `bg-yellow-50 border-yellow-300 text-yellow-900`
            : `${colors.bg} ${colors.border} ${colors.text}`
        }`}
      >
        {icon}
        <span>{label}</span>
        {selected.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-yellow-200 text-yellow-900 rounded-full text-[10px] font-black">
            {selected.length}
          </span>
        )}
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
          {options.map(option => (
            <label
              key={option}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-0"
            >
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggleOption(option)}
                className="rounded"
              />
              <span className="text-xs font-medium text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const ManualChangesView: React.FC<ManualChangesViewProps> = ({ changes, approveChange, rejectChange }) => {
  const [selectedChange, setSelectedChange] = useState<ManualChange | null>(null);
  const { user, isAdmin } = useAuth();

  // Filter states
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterRequester, setFilterRequester] = useState<string[]>([]);
  const [filterApprover, setFilterApprover] = useState<string[]>([]);
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');

  // Extract unique values for filters
  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(changes.map(c => c.status))).sort();
  }, [changes]);

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(changes.map(c => c.type))).sort();
  }, [changes]);

  const uniqueRequesters = useMemo(() => {
    return Array.from(new Set(changes.map(c => c.requestedByName || c.requestedBy))).sort();
  }, [changes]);

  const uniqueApprovers = useMemo(() => {
    return Array.from(new Set(changes
      .filter(c => c.approvedByName)
      .map(c => c.approvedByName!)
    )).sort();
  }, [changes]);

  // Filtrar mudanças: Admin vê tudo, outros usuários veem apenas as suas + aplicar filtros
  const filteredChanges = useMemo(() => {
    let result = changes;

    // Role-based filter (existing logic)
    if (!isAdmin) {
      result = result.filter(c => c.requestedBy === user?.email);
    }

    // Status filter
    if (filterStatus.length > 0) {
      result = result.filter(c => filterStatus.includes(c.status));
    }

    // Type filter
    if (filterType.length > 0) {
      result = result.filter(c => filterType.includes(c.type));
    }

    // Requester filter
    if (filterRequester.length > 0) {
      result = result.filter(c =>
        filterRequester.includes(c.requestedByName || c.requestedBy)
      );
    }

    // Approver filter
    if (filterApprover.length > 0) {
      result = result.filter(c =>
        c.approvedByName && filterApprover.includes(c.approvedByName)
      );
    }

    // Date range filter (by request date)
    if (filterDateFrom) {
      result = result.filter(c =>
        new Date(c.requestedAt) >= new Date(filterDateFrom)
      );
    }

    if (filterDateTo) {
      // Set time to end of day (23:59:59.999) to include all records from the selected date
      const dateToEndOfDay = new Date(filterDateTo);
      dateToEndOfDay.setHours(23, 59, 59, 999);
      result = result.filter(c =>
        new Date(c.requestedAt) <= dateToEndOfDay
      );
    }

    return result;
  }, [changes, isAdmin, user, filterStatus, filterType, filterRequester, filterApprover, filterDateFrom, filterDateTo]);

  const formatDateToMMAAAA = (dateStr: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      if (parts[0].length === 4) return `${parts[1]}-${parts[0]}`;
      if (parts[2]?.length === 4) return `${parts[1]}-${parts[2]}`;
    }
    return dateStr;
  };

  const handleExportExcel = () => {
    const headers = [
      "ID", "Solicitante Nome", "Solicitante Email", "Data Solicitação",
      "Tipo", "Status", "Transação ID", "Descrição Original", "Filial Original",
      "Valor Original", "Nova Conta", "Nova Filial", "Nova Data",
      "Nova Recorrência", "Justificativa", "Aprovador Nome", "Aprovador Email", "Data Aprovação"
    ];

    const rows = filteredChanges.map(change => {
      const orig = change.originalTransaction;
      let newValueObj: any = {};
      let justification = "";

      try {
        const parsed = JSON.parse(change.newValue || '{}');
        if (change.type === 'RATEIO') {
          justification = parsed.justification || "";
        } else {
          newValueObj = parsed;
          justification = newValueObj.justification || "";
        }
      } catch (e) {
        console.error("Erro ao processar newValue", e);
      }

      return {
        "ID": change.id,
        "Solicitante Nome": change.requestedByName || "-",
        "Solicitante Email": change.requestedBy,
        "Data Solicitação": new Date(change.requestedAt).toLocaleDateString('pt-BR'),
        "Tipo": change.type,
        "Status": change.status,
        "Transação ID": change.transactionId,
        "Descrição Original": orig.description,
        "Filial Original": orig.filial,
        "Valor Original": orig.amount,
        "Nova Conta": newValueObj.category || "-",
        "Nova Filial": newValueObj.filial || "-",
        "Nova Data": newValueObj.date || "-",
        "Nova Recorrência": newValueObj.recurring || "-",
        "Justificativa": justification,
        "Aprovador Nome": change.approvedByName || "-",
        "Aprovador Email": change.approvedBy || "-",
        "Data Aprovação": change.approvedAt ? new Date(change.approvedAt).toLocaleDateString('pt-BR') : "-"
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows, { header: headers });

    // Auto-ajustar largura das colunas
    ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length, 14) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Aprovações');
    XLSX.writeFile(wb, `Aprovacoes_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-8">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-[#1B75BB] text-white p-2.5 rounded-xl shadow-lg">
            <History size={24} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-none">Aprovações</h2>
            <p className="text-gray-500 text-[10px] font-medium mt-1">
              {isAdmin ? 'Gestão de reclassificações financeiras.' : 'Minhas solicitações de aprovação.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Export Button */}
          <button
            onClick={handleExportExcel}
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-700 shadow-md transition-all active:scale-95"
            title="Exportar dados filtrados para Excel"
          >
            <FileText size={16} />
            <span className="text-xs font-black">Exportar Excel</span>
          </button>

          {/* Admin Badge */}
          {isAdmin ? (
            <div className="bg-purple-50 border-2 border-purple-200 px-4 py-2 rounded-xl flex items-center gap-2">
              <Shield className="text-purple-600" size={16} />
              <span className="text-xs font-black text-purple-900">ADMINISTRADOR</span>
            </div>
          ) : (
            <div className="bg-blue-50 border-2 border-blue-200 px-4 py-2 rounded-xl flex items-center gap-2">
              <Lock className="text-blue-600" size={16} />
              <span className="text-xs font-bold text-blue-900">Apenas Visualização</span>
            </div>
          )}
        </div>
      </header>

      {!isAdmin && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-yellow-600 shrink-0" size={20} />
          <div>
            <p className="text-sm font-black text-yellow-900">ℹ️ Visualização Limitada</p>
            <p className="text-xs text-yellow-700 mt-1">
              Você está vendo apenas as solicitações que você criou. Apenas administradores podem aprovar ou reprovar alterações.
            </p>
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <AlertCircle size={14} />
            Filtros de Análise
          </h3>
          <button
            onClick={() => {
              setFilterStatus([]);
              setFilterType([]);
              setFilterRequester([]);
              setFilterApprover([]);
              setFilterDateFrom('');
              setFilterDateTo('');
            }}
            className="flex items-center gap-2 px-3 py-2 bg-[#F44C00] hover:bg-[#d44200] text-white rounded-xl text-xs font-black uppercase tracking-wide transition-all shadow-sm active:scale-95"
          >
            <FilterX size={14} />
            Limpar Filtros
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <MultiSelectDropdown
            label="Status"
            icon={<CheckCircle2 size={14} />}
            options={uniqueStatuses}
            selected={filterStatus}
            onChange={setFilterStatus}
            color="amber"
          />

          <MultiSelectDropdown
            label="Tipo"
            icon={<GitFork size={14} />}
            options={uniqueTypes}
            selected={filterType}
            onChange={setFilterType}
            color="purple"
          />

          <MultiSelectDropdown
            label="Solicitante"
            icon={<User size={14} />}
            options={uniqueRequesters}
            selected={filterRequester}
            onChange={setFilterRequester}
            color="blue"
          />

          <MultiSelectDropdown
            label="Aprovador"
            icon={<ShieldCheck size={14} />}
            options={uniqueApprovers}
            selected={filterApprover}
            onChange={setFilterApprover}
            color="emerald"
          />

          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg">
            <Clock size={14} className="text-gray-500" />
            <span className="text-xs font-bold text-gray-600">De:</span>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="text-xs font-medium border-0 bg-transparent focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg">
            <Clock size={14} className="text-gray-500" />
            <span className="text-xs font-bold text-gray-600">Até:</span>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="text-xs font-medium border-0 bg-transparent focus:outline-none"
            />
          </div>
        </div>

        {/* Active Filter Summary */}
        {(filterStatus.length > 0 || filterType.length > 0 || filterRequester.length > 0 ||
          filterApprover.length > 0 || filterDateFrom || filterDateTo) && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-[10px] font-bold text-gray-500">
              Mostrando {filteredChanges.length} de {changes.length} registros
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
              <tr className="h-9">
                <th className="px-3 w-[90px]">Data</th>
                <th className="px-3 w-[130px]">Solicitante</th>
                <th className="px-3 w-[70px]">Tipo</th>
                <th className="px-3">Descrição</th>
                <th className="px-3 w-[100px] text-right">Valor</th>
                <th className="px-3 w-[90px]">Filial</th>
                <th className="px-3 w-[80px] text-center">Status</th>
                <th className="px-3 w-[100px] text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredChanges.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-300">
                      <AlertCircle size={28} />
                      <p className="font-black text-gray-400 uppercase tracking-widest text-[10px]">
                        {isAdmin ? 'Fila Vazia' : 'Nenhuma Solicitação'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredChanges.map((change) => {
                const orig = change.originalTransaction;
                return (
                  <tr
                    key={change.id}
                    onDoubleClick={() => setSelectedChange(change)}
                    className={`h-10 cursor-pointer transition-colors hover:bg-blue-50/40 ${
                      change.status === 'Aplicado' ? 'bg-emerald-50/20' :
                      change.status === 'Rejeitado' ? 'bg-rose-50/20' : ''
                    }`}
                    title="Duplo clique para ver detalhes"
                  >
                    <td className="px-3 text-[10px] text-gray-500 font-bold whitespace-nowrap">
                      {new Date(change.requestedAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-3 text-[10px] font-bold text-gray-800 truncate max-w-[130px]">
                      {change.requestedByName || 'Usuário'}
                    </td>
                    <td className="px-3">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase border ${
                        change.type === 'CONTA' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        change.type === 'RATEIO' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                        change.type === 'EXCLUSAO' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        'bg-indigo-50 text-indigo-600 border-indigo-100'
                      }`}>
                        {change.type === 'RATEIO' ? 'RATEIO' : 'AJUSTE'}
                      </span>
                    </td>
                    <td className="px-3 text-[10px] font-medium text-gray-700 truncate max-w-[250px]" title={orig.description}>
                      {orig.description}
                    </td>
                    <td className="px-3 text-[10px] font-black text-gray-800 text-right whitespace-nowrap">
                      R$ {orig.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 text-[10px] font-bold text-gray-600 truncate max-w-[90px]">
                      {orig.filial}
                    </td>
                    <td className="px-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                        change.status === 'Pendente' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        change.status === 'Aplicado' ? 'bg-emerald-600 text-white border-emerald-700' :
                        'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {change.status}
                      </span>
                    </td>
                    <td className="px-3 text-center">
                      {change.status === 'Pendente' && isAdmin ? (
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); approveChange(change.id); }}
                            className="bg-emerald-600 text-white p-1.5 rounded-lg hover:bg-emerald-700 active:scale-95 transition-all"
                            title="Aprovar"
                          >
                            <CheckCircle2 size={12} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); rejectChange(change.id); }}
                            className="bg-white text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 border border-rose-200 active:scale-95 transition-all"
                            title="Reprovar"
                          >
                            <XCircle size={12} />
                          </button>
                        </div>
                      ) : change.status === 'Pendente' ? (
                        <span className="text-[8px] text-gray-400 font-bold">Aguardando</span>
                      ) : (
                        <span className="text-[8px] text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[10px] font-bold text-gray-400">
            {filteredChanges.length} {filteredChanges.length === 1 ? 'registro' : 'registros'}
          </p>
          <p className="text-[9px] text-gray-400">Duplo clique na linha para ver detalhes</p>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {selectedChange && (
        <DetailModal
          change={selectedChange}
          onClose={() => setSelectedChange(null)}
          approveChange={approveChange}
          rejectChange={rejectChange}
          isAdmin={isAdmin}
          formatDateToMMAAAA={formatDateToMMAAAA}
        />
      )}
    </div>
  );
};

export default ManualChangesView;
