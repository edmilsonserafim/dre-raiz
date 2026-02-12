import React, { useState, useEffect } from 'react';
import { Shield, Users, X, Plus, Trash2, Save, AlertTriangle, CheckCircle2, User as UserIcon, Database, Search, Upload, Download, FileSpreadsheet, Eye, CheckCircle } from 'lucide-react';
import * as supabaseService from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';
import { Transaction } from '../types';

interface User {
  id: string;
  email: string;
  name: string;
  photo_url: string | null;
  role: 'admin' | 'manager' | 'viewer' | 'approver' | 'pending';
  created_at: string;
  last_login: string | null;
}

interface Permission {
  id: string;
  user_id: string;
  permission_type: 'centro_custo' | 'cia' | 'filial' | 'tag01';
  permission_value: string;
}

const AdminPanel: React.FC = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showValuesHelper, setShowValuesHelper] = useState(false);
  const [availableValues, setAvailableValues] = useState<{marcas: string[], filiais: string[], categories: string[], tags: string[], tag01Values: string[]}>({
    marcas: [],
    filiais: [],
    categories: [],
    tags: [],
    tag01Values: []
  });

  // Estado para adicionar nova permissão
  const [newPermissionType, setNewPermissionType] = useState<'centro_custo' | 'cia' | 'filial' | 'tag01'>('centro_custo');
  const [newPermissionValue, setNewPermissionValue] = useState('');

  // Estados para importação de dados
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  // Estado para controle de abas
  const [activeTab, setActiveTab] = useState<'import' | 'users'>('import');

  // Estado para busca de usuários
  const [userSearch, setUserSearch] = useState('');

  // Filtrar usuários por busca
  const filteredUsers = users.filter(user => {
    if (!userSearch) return true;
    const searchLower = userSearch.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    loadUsers();
    loadAvailableValues();
  }, []);

  const loadAvailableValues = async () => {
    try {
      const transactions = await supabaseService.getAllTransactions();

      const marcas = [...new Set(transactions.map(t => t.marca).filter(Boolean))].sort();
      const filiais = [...new Set(transactions.map(t => t.nome_filial).filter(Boolean))].sort();
      const categories = [...new Set(transactions.map(t => t.category).filter(Boolean))].sort();
      const tag01Values = [...new Set(transactions.map(t => t.tag01).filter(Boolean))].sort() as string[];
      const tags = [...new Set([
        ...transactions.map(t => t.tag01).filter(Boolean),
        ...transactions.map(t => t.tag02).filter(Boolean),
        ...transactions.map(t => t.tag03).filter(Boolean)
      ])].sort();

      setAvailableValues({ marcas, filiais, categories, tags, tag01Values });
    } catch (error) {
      console.error('Erro ao carregar valores disponíveis:', error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    const allUsers = await supabaseService.getAllUsers();
    setUsers(allUsers);
    setLoading(false);
  };

  const loadUserPermissions = async (userId: string) => {
    const userPermissions = await supabaseService.getUserPermissions(userId);
    setPermissions(userPermissions);
  };

  const handleSelectUser = async (user: User) => {
    setSelectedUser(user);
    await loadUserPermissions(user.id);
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'manager' | 'viewer' | 'approver' | 'pending') => {
    setSaving(true);
    const success = await supabaseService.updateUserRole(userId, newRole);

    if (success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
      showMessage('success', 'Função atualizada com sucesso!');
    } else {
      showMessage('error', 'Erro ao atualizar função.');
    }
    setSaving(false);
  };

  const handleAddPermission = async () => {
    if (!selectedUser || !newPermissionValue.trim()) {
      showMessage('error', 'Preencha o valor da permissão.');
      return;
    }

    setSaving(true);
    const success = await supabaseService.addUserPermission(
      selectedUser.id,
      newPermissionType,
      newPermissionValue.trim()
    );

    if (success) {
      await loadUserPermissions(selectedUser.id);
      setNewPermissionValue('');
      showMessage('success', 'Permissão adicionada com sucesso!');
    } else {
      showMessage('error', 'Erro ao adicionar permissão. Pode já existir.');
    }
    setSaving(false);
  };

  const handleRemovePermission = async (permissionId: string) => {
    if (!confirm('Tem certeza que deseja remover esta permissão?')) return;

    setSaving(true);
    const success = await supabaseService.removeUserPermission(permissionId);

    if (success) {
      setPermissions(prev => prev.filter(p => p.id !== permissionId));
      showMessage('success', 'Permissão removida com sucesso!');
    } else {
      showMessage('error', 'Erro ao remover permissão.');
    }
    setSaving(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!selectedUser) return;

    if (!confirm(`⚠️ ATENÇÃO: Você tem certeza que deseja DELETAR o usuário "${selectedUser.name}"?\n\nEsta ação é IRREVERSÍVEL e removerá:\n- O usuário do sistema\n- Todas as permissões associadas\n\nDigite "CONFIRMAR" para prosseguir.`)) {
      return;
    }

    // Segunda confirmação com verificação de texto
    const confirmText = prompt(`Para confirmar a exclusão de "${selectedUser.name}", digite: CONFIRMAR`);

    if (confirmText !== 'CONFIRMAR') {
      showMessage('error', 'Exclusão cancelada. Texto de confirmação incorreto.');
      return;
    }

    setSaving(true);
    const success = await supabaseService.deleteUser(userId);

    if (success) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      setSelectedUser(null);
      setPermissions([]);
      showMessage('success', 'Usuário deletado com sucesso!');
    } else {
      showMessage('error', 'Erro ao deletar usuário. Tente novamente.');
    }
    setSaving(false);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const showImportMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setImportMessage({ type, text });
    setTimeout(() => setImportMessage(null), 5000);
  };

  // Baixar template Excel
  const handleDownloadTemplate = () => {
    const template = [
      {
        'Cenário': 'Real',
        'Data': '2026-01-15',
        'C.Custo': 'MARKETING',
        'Segmento': 'DIGITAL',
        'Projeto': 'CAMPANHA-2026',
        'Conta': 'Salários',
        'Marca': 'SAP',
        'Unidade': 'Matriz - São Paulo',
        'Ticket': '',
        'Fornecedor': 'FORNECEDOR EXEMPLO LTDA',
        'Descrição': 'Exemplo de lançamento',
        'Valor': 1500.50,
        'Recorrente': 'Sim',
        'Status': 'Normal',
        'Tipo': 'FIXED_COST'
      },
      {
        'Cenário': 'Orçamento',
        'Data': '2026-02-01',
        'C.Custo': 'VENDAS',
        'Segmento': 'B2B',
        'Projeto': 'EXPANSAO',
        'Conta': 'Receita de Serviços',
        'Marca': 'KOGUT',
        'Unidade': 'Filial - Rio de Janeiro',
        'Ticket': '123456',
        'Fornecedor': '',
        'Descrição': 'Receita prevista',
        'Valor': 50000,
        'Recorrente': 'Não',
        'Status': 'Normal',
        'Tipo': 'REVENUE'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 12 }, // Cenário
      { wch: 12 }, // Data
      { wch: 15 }, // C.Custo
      { wch: 15 }, // Segmento
      { wch: 18 }, // Projeto
      { wch: 25 }, // Conta
      { wch: 10 }, // Marca
      { wch: 30 }, // Unidade
      { wch: 10 }, // Ticket
      { wch: 30 }, // Fornecedor
      { wch: 40 }, // Descrição
      { wch: 12 }, // Valor
      { wch: 12 }, // Recorrente
      { wch: 12 }, // Status
      { wch: 15 }  // Tipo
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `Template_Importacao_DRE_RAIZ_${new Date().toISOString().split('T')[0]}.xlsx`);
    showImportMessage('success', 'Template baixado com sucesso!');
  };

  // Ler arquivo Excel/CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          showImportMessage('error', 'Arquivo vazio! Adicione dados no Excel.');
          return;
        }

        // Mapear colunas do Excel para Transaction
        const mappedData = data.map((row: any, index: number) => ({
          id: `IMP-${Date.now()}-${index}`,
          scenario: row['Cenário'] || row['Cenario'] || row['scenario'] || 'Real',
          date: row['Data'] || row['date'] || new Date().toISOString().split('T')[0],
          tag01: row['C.Custo'] || row['C Custo'] || row['tag01'] || '',
          tag02: row['Segmento'] || row['Segment'] || row['tag02'] || '',
          tag03: row['Projeto'] || row['Project'] || row['tag03'] || '',
          category: row['Conta'] || row['Category'] || row['category'] || 'Outros',
          marca: row['Marca'] || row['Brand'] || row['brand'] || row['marca'] || 'SAP',
          filial: row['Unidade'] || row['Branch'] || row['branch'] || row['filial'] || 'Matriz',
          ticket: row['Ticket'] || row['ticket'] || '',
          vendor: row['Fornecedor'] || row['Vendor'] || row['vendor'] || '',
          description: row['Descrição'] || row['Descricao'] || row['Description'] || row['description'] || '',
          amount: parseFloat(String(row['Valor'] || row['Amount'] || row['amount'] || 0).replace(',', '.')),
          recurring: row['Recorrente'] || row['Recurring'] || row['recurring'] || 'Sim',
          status: row['Status'] || row['status'] || 'Normal',
          type: row['Tipo'] || row['Type'] || row['type'] || 'FIXED_COST'
        }));

        setImportPreview(mappedData);
        showImportMessage('info', `${mappedData.length} registros carregados. Revise e clique em "Importar".`);
      } catch (error) {
        console.error('Erro ao ler arquivo:', error);
        showImportMessage('error', 'Erro ao ler arquivo. Verifique o formato.');
      }
    };

    reader.readAsBinaryString(file);
  };

  // Importar dados para o banco
  const handleImportData = async () => {
    if (importPreview.length === 0) {
      showImportMessage('error', 'Nenhum dado para importar!');
      return;
    }

    if (!confirm(`Você tem certeza que deseja importar ${importPreview.length} registros?`)) {
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const batchSize = 100;
      const totalBatches = Math.ceil(importPreview.length / batchSize);

      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const end = start + batchSize;
        const batch = importPreview.slice(start, end);

        await supabaseService.bulkAddTransactions(batch as Transaction[]);

        const progress = ((i + 1) / totalBatches) * 100;
        setImportProgress(progress);
      }

      showImportMessage('success', `✅ ${importPreview.length} registros importados com sucesso!`);
      setImportFile(null);
      setImportPreview([]);
      setImportProgress(0);

      // Recarregar valores disponíveis
      await loadAvailableValues();
    } catch (error) {
      console.error('Erro ao importar:', error);
      showImportMessage('error', 'Erro ao importar dados. Tente novamente.');
    } finally {
      setIsImporting(false);
    }
  };

  // Se não é admin, não pode acessar
  if (!isAdmin) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 max-w-2xl mx-auto mt-20">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-2xl font-black text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Apenas administradores podem acessar o painel de gerenciamento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Shield className="text-purple-600" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">Painel de Administração</h1>
          <p className="text-xs text-gray-500">Gerencie dados e usuários do sistema</p>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex gap-1 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 font-bold text-xs uppercase transition-all relative ${
            activeTab === 'import'
              ? 'text-green-700 bg-green-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Database size={14} />
            📊 Importação
          </div>
          {activeTab === 'import' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-t"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-bold text-xs uppercase transition-all relative ${
            activeTab === 'users'
              ? 'text-purple-700 bg-purple-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Users size={14} />
            Usuários
          </div>
          {activeTab === 'users' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-t"></div>
          )}
        </button>
      </div>

      {/* Aba: Importação de Dados */}
      {activeTab === 'import' && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-xl p-4 shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-green-100 p-2 rounded-lg">
            <Database className="text-green-600" size={20} />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-black text-green-900">📊 Importação de Dados em Massa</h2>
            <p className="text-xs text-green-700">Carregue transações via Excel/CSV</p>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-xs uppercase transition-all shadow hover:shadow-md"
          >
            <Download size={14} />
            Baixar Modelo
          </button>
        </div>

        {/* Mensagem de feedback da importação */}
        {importMessage && (
          <div className={`p-2 rounded-lg flex items-center gap-2 mb-3 ${
            importMessage.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' :
            importMessage.type === 'error' ? 'bg-red-100 text-red-800 border border-red-300' :
            'bg-blue-100 text-blue-800 border border-blue-300'
          }`}>
            {importMessage.type === 'success' ? <CheckCircle size={14} /> :
             importMessage.type === 'error' ? <AlertTriangle size={14} /> :
             <FileSpreadsheet size={14} />}
            <span className="font-bold text-xs">{importMessage.text}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Upload de Arquivo */}
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <Upload className="text-green-600" size={16} />
              <h3 className="font-bold text-green-900 text-xs">1. Selecione o Arquivo</h3>
            </div>

            <div className="space-y-2">
              <div className="border-2 border-dashed border-green-300 rounded-lg p-4 text-center hover:border-green-400 hover:bg-green-50 transition-all">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="import-file"
                  disabled={isImporting}
                />
                <label
                  htmlFor="import-file"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <FileSpreadsheet className="text-green-600" size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-green-900 text-xs mb-0.5">
                      {importFile ? importFile.name : 'Clique para selecionar'}
                    </p>
                    <p className="text-[10px] text-green-600">
                      .xlsx, .xls, .csv
                    </p>
                  </div>
                </label>
              </div>

              {importFile && (
                <div className="bg-green-50 border border-green-200 rounded p-2">
                  <p className="text-[10px] font-bold text-green-900">
                    ✓ {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Preview e Ações */}
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="text-green-600" size={16} />
              <h3 className="font-bold text-green-900 text-xs">2. Revise e Importe</h3>
            </div>

            {importPreview.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileSpreadsheet size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold">Nenhum arquivo carregado</p>
                <p className="text-[10px] mt-0.5">Selecione um arquivo</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-green-50 border border-green-200 rounded p-2">
                  <p className="font-bold text-green-900 text-xs mb-1">
                    📋 {importPreview.length} registros
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div className="bg-white p-1 rounded">
                      <strong>Cenários:</strong> {[...new Set(importPreview.map(r => r.scenario))].join(', ')}
                    </div>
                    <div className="bg-white p-1 rounded">
                      <strong>Marcas:</strong> {[...new Set(importPreview.map(r => r.marca))].length}
                    </div>
                  </div>
                </div>

                {/* Preview dos primeiros registros */}
                <div className="max-h-[150px] overflow-y-auto bg-gray-50 border border-gray-200 rounded p-2">
                  <p className="text-[10px] font-bold text-gray-600 mb-1 uppercase">Preview (5 primeiros):</p>
                  {importPreview.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="bg-white p-1 rounded mb-1 text-[9px] border border-gray-200">
                      <strong>{item.scenario}</strong> | {item.date} | {item.category} | R$ {item.amount}
                    </div>
                  ))}
                </div>

                {/* Botão de Importar */}
                <button
                  onClick={handleImportData}
                  disabled={isImporting}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></div>
                      Importando... {Math.round(importProgress)}%
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      Importar {importPreview.length} Registros
                    </>
                  )}
                </button>

                {isImporting && (
                  <div className="bg-green-100 rounded overflow-hidden">
                    <div
                      className="bg-green-600 h-1 transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Instruções */}
        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-bold text-blue-900 text-xs mb-1.5 flex items-center gap-1.5">
            <AlertTriangle size={12} />
            ℹ️ Como usar:
          </h4>
          <ol className="text-[10px] text-blue-800 space-y-0.5 ml-4 list-decimal">
            <li><strong>Baixe o modelo</strong> → "Baixar Modelo"</li>
            <li><strong>Preencha o Excel</strong> com seus dados</li>
            <li><strong>Selecione o arquivo</strong> preenchido</li>
            <li><strong>Revise o preview</strong> dos dados</li>
            <li><strong>Clique em "Importar"</strong></li>
          </ol>
          <p className="text-[10px] text-blue-700 mt-2 bg-blue-100 p-1.5 rounded">
            <strong>⚠️ Obrigatórios:</strong> Cenário, Data, Conta, Unidade, Valor, Tipo
          </p>
        </div>
        </div>
      )}

      {/* Aba: Gerenciamento de Usuários */}
      {activeTab === 'users' && (
        <>
      {/* Estatísticas de Usuários */}
      <div className="grid grid-cols-6 gap-2 mb-4">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
          <p className="text-[8px] font-black text-purple-500 uppercase tracking-wider mb-0.5">Total</p>
          <p className="text-2xl font-black text-purple-900">{users.length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
          <p className="text-[8px] font-black text-blue-500 uppercase tracking-wider mb-0.5">Admins</p>
          <p className="text-2xl font-black text-blue-900">{users.filter(u => u.role === 'admin').length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-2">
          <p className="text-[8px] font-black text-green-500 uppercase tracking-wider mb-0.5">Gestores</p>
          <p className="text-2xl font-black text-green-900">{users.filter(u => u.role === 'manager').length}</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2">
          <p className="text-[8px] font-black text-indigo-500 uppercase tracking-wider mb-0.5">Aprovadores</p>
          <p className="text-2xl font-black text-indigo-900">{users.filter(u => u.role === 'approver').length}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
          <p className="text-[8px] font-black text-gray-500 uppercase tracking-wider mb-0.5">Viewers</p>
          <p className="text-2xl font-black text-gray-900">{users.filter(u => u.role === 'viewer').length}</p>
        </div>
        {users.filter(u => u.role === 'pending').length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-2 animate-pulse">
            <p className="text-[8px] font-black text-amber-600 uppercase tracking-wider mb-0.5">⏳ Pendentes</p>
            <p className="text-2xl font-black text-amber-900">{users.filter(u => u.role === 'pending').length}</p>
          </div>
        )}
      </div>

      {/* Alerta de Usuários Pendentes */}
      {users.filter(u => u.role === 'pending').length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-lg p-3 shadow">
          <div className="flex items-start gap-2">
            <div className="bg-amber-100 p-1.5 rounded-lg shrink-0">
              <AlertTriangle className="text-amber-600" size={16} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black text-amber-900 mb-1">
                🚨 {users.filter(u => u.role === 'pending').length} {users.filter(u => u.role === 'pending').length === 1 ? 'Usuário' : 'Usuários'} Aguardando Aprovação
              </h3>
              <p className="text-xs text-amber-700 mb-2">
                {users.filter(u => u.role === 'pending').length === 1
                  ? 'Um novo usuário está aguardando aprovação.'
                  : `${users.filter(u => u.role === 'pending').length} novos usuários estão aguardando aprovação.`}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {users.filter(u => u.role === 'pending').map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="bg-white border border-amber-300 hover:border-amber-400 rounded-lg p-1.5 flex items-center gap-1.5 transition-all hover:shadow"
                  >
                    {user.photo_url ? (
                      <img src={user.photo_url} alt={user.name} className="w-6 h-6 rounded-full border border-amber-300" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center">
                        <UserIcon className="text-amber-600" size={12} />
                      </div>
                    )}
                    <div className="text-left">
                      <p className="font-bold text-[10px] text-gray-900">{user.name}</p>
                      <p className="text-[9px] text-gray-600">{user.email}</p>
                    </div>
                    <span className="text-[10px] font-black text-amber-600">→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensagem de feedback */}
      {message && (
        <div className={`p-2 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          <span className="font-bold text-xs">{message.text}</span>
        </div>
      )}

      {/* Botão para mostrar valores disponíveis */}
      <button
        onClick={() => setShowValuesHelper(!showValuesHelper)}
        className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-2 flex items-center justify-between transition-all"
      >
        <div className="flex items-center gap-2">
          <Database className="text-blue-600" size={14} />
          <div className="text-left">
            <p className="font-bold text-xs text-blue-900">💡 Valores Disponíveis no Banco</p>
            <p className="text-[10px] text-blue-600">Ver valores para usar nas permissões</p>
          </div>
        </div>
        <span className="text-blue-600 font-black text-xs">{showValuesHelper ? '▼' : '▶'}</span>
      </button>

      {/* Helper de valores disponíveis */}
      {showValuesHelper && (
        <div className="bg-white border border-blue-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-1.5 mb-2">
            <Search className="text-blue-600" size={14} />
            <h3 className="font-bold text-blue-900 text-xs">Valores EXATOS para permissões</h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* CIAs (Marcas) */}
            <div className="bg-green-50 border border-green-200 rounded p-2">
              <p className="font-bold text-[10px] text-green-900 uppercase mb-1">🏢 CIAs (Marcas):</p>
              {availableValues.marcas.length > 0 ? (
                <div className="space-y-0.5 max-h-[120px] overflow-y-auto">
                  {availableValues.marcas.map(marca => (
                    <span key={marca} className="block bg-green-200 px-1.5 py-0.5 rounded font-mono text-[9px]">{marca}</span>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-green-600">Nenhuma</p>
              )}
            </div>

            {/* Filiais */}
            <div className="bg-orange-50 border border-orange-200 rounded p-2">
              <p className="font-bold text-[10px] text-orange-900 uppercase mb-1">🏫 Filiais:</p>
              {availableValues.filiais.length > 0 ? (
                <div className="space-y-0.5 max-h-[120px] overflow-y-auto">
                  {availableValues.filiais.map(filial => (
                    <span key={filial} className="block bg-orange-200 px-1.5 py-0.5 rounded font-mono text-[9px]">{filial}</span>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-orange-600">Nenhuma</p>
              )}
            </div>

            {/* Categorias (Centro de Custo) */}
            <div className="bg-purple-50 border border-purple-200 rounded p-2">
              <p className="font-bold text-[10px] text-purple-900 uppercase mb-1">📊 Categorias:</p>
              {availableValues.categories.length > 0 ? (
                <div className="space-y-0.5 max-h-[120px] overflow-y-auto">
                  {availableValues.categories.map(cat => (
                    <span key={cat} className="block bg-purple-200 px-1.5 py-0.5 rounded font-mono text-[9px]">{cat}</span>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-purple-600">Nenhuma</p>
              )}
            </div>

            {/* Tag01 */}
            <div className="bg-teal-50 border border-teal-200 rounded p-2">
              <p className="font-bold text-[10px] text-teal-900 uppercase mb-1">🏷️ Tag 01:</p>
              {availableValues.tag01Values.length > 0 ? (
                <div className="space-y-0.5 max-h-[120px] overflow-y-auto">
                  {availableValues.tag01Values.slice(0, 15).map(tag => (
                    <span key={tag} className="block bg-teal-200 px-1.5 py-0.5 rounded font-mono text-[9px]">{tag}</span>
                  ))}
                  {availableValues.tag01Values.length > 15 && (
                    <p className="text-[9px] text-teal-600 italic">+{availableValues.tag01Values.length - 15} mais...</p>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-teal-600">Nenhuma</p>
              )}
            </div>

            {/* Tags (todas) */}
            <div className="bg-pink-50 border border-pink-200 rounded p-2">
              <p className="font-bold text-[10px] text-pink-900 uppercase mb-1">🏷️ Tags (todas):</p>
              {availableValues.tags.length > 0 ? (
                <div className="space-y-0.5 max-h-[120px] overflow-y-auto">
                  {availableValues.tags.slice(0, 15).map(tag => (
                    <span key={tag} className="block bg-pink-200 px-1.5 py-0.5 rounded font-mono text-[9px]">{tag}</span>
                  ))}
                  {availableValues.tags.length > 15 && (
                    <p className="text-[9px] text-pink-600 italic">+{availableValues.tags.length - 15} mais...</p>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-pink-600">Nenhuma</p>
              )}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-1.5 mt-2">
            <p className="text-[9px] text-yellow-800">
              <strong>⚠️ IMPORTANTE:</strong> Digite exatamente como aparece (maiúsculas, espaços, acentos).
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Lista de Usuários */}
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-gray-600" />
            <h2 className="text-sm font-black text-gray-900">Usuários ({filteredUsers.length})</h2>
          </div>

          {/* Campo de Busca */}
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin mx-auto mb-2 w-6 h-6 border-3 border-gray-200 border-t-purple-600 rounded-full"></div>
              <p className="text-xs text-gray-500">Carregando...</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {filteredUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`w-full text-left p-2 rounded-lg border transition-all ${
                    selectedUser?.id === user.id
                      ? 'bg-purple-50 border-purple-300 shadow'
                      : 'bg-gray-50 border-gray-200 hover:border-purple-200 hover:bg-purple-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {user.photo_url ? (
                      <img src={user.photo_url} alt={user.name} className="w-8 h-8 rounded-full border border-purple-200" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center">
                        <UserIcon className="text-purple-600" size={14} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-gray-900 truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                      user.role === 'approver' ? 'bg-indigo-100 text-indigo-700' :
                      user.role === 'pending' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role === 'admin' ? 'ADM' :
                       user.role === 'manager' ? 'GST' :
                       user.role === 'approver' ? 'APV' :
                       user.role === 'pending' ? '⏳' :
                       'VWR'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detalhes do Usuário Selecionado */}
        <div className="bg-white rounded-xl shadow p-4">
          {selectedUser ? (
            <div className="space-y-3">
              {/* Informações do Usuário */}
              <div>
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">Informações</h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    {selectedUser.photo_url ? (
                      <img src={selectedUser.photo_url} alt={selectedUser.name} className="w-12 h-12 rounded-full border-2 border-purple-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center">
                        <UserIcon className="text-purple-600" size={20} />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm text-gray-900">{selectedUser.name}</p>
                      <p className="text-[10px] text-gray-500">{selectedUser.email}</p>
                    </div>
                  </div>
                  {selectedUser.last_login && (
                    <p className="text-[10px] text-gray-500">
                      Último acesso: {new Date(selectedUser.last_login).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>

              {/* Botão de Deletar Usuário */}
              {selectedUser.id !== currentUser?.uid && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                  <h3 className="text-[10px] font-black text-red-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Zona de Perigo
                  </h3>
                  <p className="text-[10px] text-red-600 mb-2">
                    Ação irreversível. Remove usuário e permissões.
                  </p>
                  <button
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    disabled={saving}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                  >
                    <Trash2 size={12} />
                    Deletar Permanentemente
                  </button>
                </div>
              )}

              {/* Alterar Função */}
              <div>
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Função</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['viewer', 'manager', 'approver', 'admin'] as const).map(role => (
                    <button
                      key={role}
                      onClick={() => handleUpdateRole(selectedUser.id, role)}
                      disabled={saving || selectedUser.id === currentUser?.uid}
                      className={`p-2 rounded-lg font-bold text-[10px] uppercase transition-all ${
                        selectedUser.role === role
                          ? role === 'admin' ? 'bg-purple-600 text-white' :
                            role === 'manager' ? 'bg-blue-600 text-white' :
                            role === 'approver' ? 'bg-indigo-600 text-white' :
                            'bg-gray-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } ${saving || selectedUser.id === currentUser?.uid ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {role === 'admin' ? 'Admin' : role === 'manager' ? 'Gestor' : role === 'approver' ? 'Aprovador' : 'Viewer'}
                    </button>
                  ))}
                </div>
                {selectedUser.id === currentUser?.uid && (
                  <p className="text-[9px] text-gray-500 mt-1">* Não pode alterar sua própria função</p>
                )}
              </div>

              {/* Permissões */}
              <div>
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Permissões</h3>

                {/* Lista de Permissões */}
                <div className="space-y-1 mb-2 max-h-[150px] overflow-y-auto">
                  {permissions.length === 0 ? (
                    <div className="text-center py-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Nenhuma permissão</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Acesso total</p>
                    </div>
                  ) : (
                    permissions.map(perm => (
                      <div key={perm.id} className="flex items-center justify-between bg-gray-50 p-1.5 rounded">
                        <div className="flex-1 min-w-0">
                          <span className={`px-1 py-0.5 rounded text-[8px] font-black uppercase mr-1 ${
                            perm.permission_type === 'centro_custo' ? 'bg-blue-100 text-blue-700' :
                            perm.permission_type === 'cia' ? 'bg-green-100 text-green-700' :
                            perm.permission_type === 'tag01' ? 'bg-teal-100 text-teal-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {perm.permission_type.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-bold text-gray-900 truncate">{perm.permission_value}</span>
                        </div>
                        <button
                          onClick={() => handleRemovePermission(perm.id)}
                          disabled={saving}
                          className="p-1 hover:bg-red-100 rounded transition-colors text-red-600 disabled:opacity-50"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Adicionar Nova Permissão */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-purple-900 uppercase">Adicionar</p>
                    <button
                      onClick={() => setShowValuesHelper(!showValuesHelper)}
                      className="text-[9px] text-purple-600 hover:text-purple-800 underline font-bold"
                    >
                      Ver valores ▲
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <select
                      value={newPermissionType}
                      onChange={(e) => setNewPermissionType(e.target.value as any)}
                      className="w-full px-2 py-1 border border-purple-200 rounded text-[10px] font-bold focus:outline-none focus:border-purple-400"
                    >
                      <option value="centro_custo">Centro de Custo</option>
                      <option value="cia">CIA (Marca)</option>
                      <option value="filial">Filial</option>
                      <option value="tag01">Tag 01</option>
                    </select>
                    <div className="relative">
                      <input
                        type="text"
                        value={newPermissionValue}
                        onChange={(e) => setNewPermissionValue(e.target.value)}
                        placeholder="Digite o valor..."
                        className="w-full px-2 py-1 border border-purple-200 rounded text-[10px] focus:outline-none focus:border-purple-400"
                        list={`suggestions-${newPermissionType}`}
                      />
                      <datalist id={`suggestions-${newPermissionType}`}>
                        {newPermissionType === 'cia' && availableValues.marcas.map(m => (
                          <option key={m} value={m} />
                        ))}
                        {newPermissionType === 'filial' && availableValues.filiais.map(f => (
                          <option key={f} value={f} />
                        ))}
                        {newPermissionType === 'centro_custo' && availableValues.categories.map(c => (
                          <option key={c} value={c} />
                        ))}
                        {newPermissionType === 'tag01' && availableValues.tag01Values.map(t => (
                          <option key={t} value={t} />
                        ))}
                      </datalist>
                    </div>
                    <button
                      onClick={handleAddPermission}
                      disabled={saving || !newPermissionValue.trim()}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[10px]"
                    >
                      <Plus size={12} />
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="mx-auto mb-2 text-gray-300" size={48} />
              <p className="text-gray-500 font-bold text-xs">Selecione um usuário</p>
              <p className="text-[10px] text-gray-400 mt-1">Escolha na lista ao lado</p>
            </div>
          )}
        </div>
      </div>

      {/* Informações */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-3">
        <h4 className="font-bold text-blue-900 text-[10px] mb-1">ℹ️ Funções e Permissões</h4>
        <ul className="text-[9px] text-blue-800 space-y-0.5">
          <li><strong>Viewer:</strong> Visualiza dados conforme permissões</li>
          <li><strong>Gestor:</strong> Visualiza e solicita alterações</li>
          <li><strong>Aprovador:</strong> Visualiza, solicita e aprova alterações (não acessa Admin)</li>
          <li><strong>Admin:</strong> Acesso total ao sistema (inclui painel Admin)</li>
          <li><strong>Permissões:</strong> Limitam acesso a dados específicos</li>
        </ul>
      </div>
        </>
      )}

    </div>
  );
};

export default AdminPanel;
