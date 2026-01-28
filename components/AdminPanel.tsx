import React, { useState, useEffect } from 'react';
import { Shield, Users, X, Plus, Trash2, Save, AlertTriangle, CheckCircle2, User as UserIcon, Database, Search } from 'lucide-react';
import * as supabaseService from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: string;
  email: string;
  name: string;
  photo_url: string | null;
  role: 'admin' | 'manager' | 'viewer';
  created_at: string;
  last_login: string | null;
}

interface Permission {
  id: string;
  user_id: string;
  permission_type: 'centro_custo' | 'cia' | 'filial';
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
  const [availableValues, setAvailableValues] = useState<{brands: string[], branches: string[], categories: string[], tags: string[]}>({
    brands: [],
    branches: [],
    categories: [],
    tags: []
  });

  // Estado para adicionar nova permissão
  const [newPermissionType, setNewPermissionType] = useState<'centro_custo' | 'cia' | 'filial'>('centro_custo');
  const [newPermissionValue, setNewPermissionValue] = useState('');

  useEffect(() => {
    loadUsers();
    loadAvailableValues();
  }, []);

  const loadAvailableValues = async () => {
    try {
      const transactions = await supabaseService.getAllTransactions();

      const brands = [...new Set(transactions.map(t => t.brand).filter(Boolean))].sort();
      const branches = [...new Set(transactions.map(t => t.branch).filter(Boolean))].sort();
      const categories = [...new Set(transactions.map(t => t.category).filter(Boolean))].sort();
      const tags = [...new Set([
        ...transactions.map(t => t.tag01).filter(Boolean),
        ...transactions.map(t => t.tag02).filter(Boolean),
        ...transactions.map(t => t.tag03).filter(Boolean)
      ])].sort();

      setAvailableValues({ brands, branches, categories, tags });
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

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'manager' | 'viewer') => {
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

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
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
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-xl">
            <Shield className="text-purple-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Painel de Administração</h1>
            <p className="text-sm text-gray-500">Gerencie usuários e permissões do sistema</p>
          </div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="flex gap-3">
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-3 min-w-[100px]">
            <p className="text-[9px] font-black text-purple-500 uppercase tracking-wider">Total Usuários</p>
            <p className="text-2xl font-black text-purple-900">{users.length}</p>
          </div>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 min-w-[100px]">
            <p className="text-[9px] font-black text-blue-500 uppercase tracking-wider">Admins</p>
            <p className="text-2xl font-black text-blue-900">{users.filter(u => u.role === 'admin').length}</p>
          </div>
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 min-w-[100px]">
            <p className="text-[9px] font-black text-green-500 uppercase tracking-wider">Gestores</p>
            <p className="text-2xl font-black text-green-900">{users.filter(u => u.role === 'manager').length}</p>
          </div>
        </div>
      </div>

      {/* Mensagem de feedback */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-2 border-green-200' : 'bg-red-50 text-red-700 border-2 border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <span className="font-bold text-sm">{message.text}</span>
        </div>
      )}

      {/* Botão para mostrar valores disponíveis */}
      <button
        onClick={() => setShowValuesHelper(!showValuesHelper)}
        className="w-full bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl p-4 flex items-center justify-between transition-all"
      >
        <div className="flex items-center gap-3">
          <Database className="text-blue-600" size={20} />
          <div className="text-left">
            <p className="font-black text-sm text-blue-900">💡 Valores Disponíveis no Banco</p>
            <p className="text-xs text-blue-600">Clique aqui para ver quais valores usar nas permissões</p>
          </div>
        </div>
        <span className="text-blue-600 font-black">{showValuesHelper ? '▼' : '▶'}</span>
      </button>

      {/* Helper de valores disponíveis */}
      {showValuesHelper && (
        <div className="bg-white border-2 border-blue-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Search className="text-blue-600" size={20} />
            <h3 className="font-black text-blue-900">Use estes valores EXATOS ao configurar permissões</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* CIAs (Marcas) */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <p className="font-black text-xs text-green-900 uppercase mb-2">🏢 CIAs (Marcas) Disponíveis:</p>
              {availableValues.brands.length > 0 ? (
                <div className="space-y-1">
                  {availableValues.brands.map(brand => (
                    <div key={brand} className="flex items-center gap-2 text-sm">
                      <span className="bg-green-200 px-2 py-1 rounded font-mono text-xs">{brand}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-green-600">Nenhuma marca encontrada</p>
              )}
            </div>

            {/* Filiais */}
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
              <p className="font-black text-xs text-orange-900 uppercase mb-2">🏫 Filiais Disponíveis:</p>
              {availableValues.branches.length > 0 ? (
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {availableValues.branches.map(branch => (
                    <div key={branch} className="flex items-center gap-2 text-sm">
                      <span className="bg-orange-200 px-2 py-1 rounded font-mono text-xs">{branch}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-orange-600">Nenhuma filial encontrada</p>
              )}
            </div>

            {/* Categorias (Centro de Custo) */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
              <p className="font-black text-xs text-purple-900 uppercase mb-2">📊 Categorias (Centro Custo):</p>
              {availableValues.categories.length > 0 ? (
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {availableValues.categories.map(cat => (
                    <div key={cat} className="flex items-center gap-2 text-sm">
                      <span className="bg-purple-200 px-2 py-1 rounded font-mono text-xs">{cat}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-purple-600">Nenhuma categoria encontrada</p>
              )}
            </div>

            {/* Tags */}
            <div className="bg-pink-50 border-2 border-pink-200 rounded-lg p-4">
              <p className="font-black text-xs text-pink-900 uppercase mb-2">🏷️ Tags Disponíveis:</p>
              {availableValues.tags.length > 0 ? (
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {availableValues.tags.slice(0, 20).map(tag => (
                    <div key={tag} className="flex items-center gap-2 text-sm">
                      <span className="bg-pink-200 px-2 py-1 rounded font-mono text-xs">{tag}</span>
                    </div>
                  ))}
                  {availableValues.tags.length > 20 && (
                    <p className="text-xs text-pink-600 italic">E mais {availableValues.tags.length - 20}...</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-pink-600">Nenhuma tag encontrada</p>
              )}
            </div>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-yellow-800">
              <strong>⚠️ IMPORTANTE:</strong> Os valores devem ser digitados EXATAMENTE como aparecem acima (maiúsculas/minúsculas, espaços, acentos).
              Se o usuário não ver dados, verifique se o valor da permissão está escrito corretamente.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Lista de Usuários */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Users size={20} className="text-gray-600" />
            <h2 className="text-lg font-black text-gray-900">Usuários ({users.length})</h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin mx-auto mb-3 w-8 h-8 border-4 border-gray-200 border-t-purple-600 rounded-full"></div>
              <p className="text-sm text-gray-500">Carregando usuários...</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedUser?.id === user.id
                      ? 'bg-purple-50 border-purple-300 shadow-md'
                      : 'bg-gray-50 border-gray-200 hover:border-purple-200 hover:bg-purple-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {user.photo_url ? (
                      <img src={user.photo_url} alt={user.name} className="w-10 h-10 rounded-full border-2 border-purple-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center">
                        <UserIcon className="text-purple-600" size={20} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : user.role === 'manager' ? 'Gestor' : 'Viewer'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detalhes do Usuário Selecionado */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {selectedUser ? (
            <div className="space-y-6">
              {/* Informações do Usuário */}
              <div>
                <h3 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-4">Informações do Usuário</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {selectedUser.photo_url ? (
                      <img src={selectedUser.photo_url} alt={selectedUser.name} className="w-16 h-16 rounded-full border-4 border-purple-200" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-purple-200 flex items-center justify-center">
                        <UserIcon className="text-purple-600" size={32} />
                      </div>
                    )}
                    <div>
                      <p className="font-black text-gray-900">{selectedUser.name}</p>
                      <p className="text-xs text-gray-500">{selectedUser.email}</p>
                    </div>
                  </div>
                  {selectedUser.last_login && (
                    <p className="text-xs text-gray-500">
                      Último acesso: {new Date(selectedUser.last_login).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>

              {/* Alterar Função */}
              <div>
                <h3 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3">Função no Sistema</h3>
                <div className="grid grid-cols-3 gap-2">
                  {(['viewer', 'manager', 'admin'] as const).map(role => (
                    <button
                      key={role}
                      onClick={() => handleUpdateRole(selectedUser.id, role)}
                      disabled={saving || selectedUser.id === currentUser?.uid}
                      className={`p-3 rounded-xl font-bold text-xs uppercase transition-all ${
                        selectedUser.role === role
                          ? role === 'admin' ? 'bg-purple-600 text-white' :
                            role === 'manager' ? 'bg-blue-600 text-white' :
                            'bg-gray-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } ${saving || selectedUser.id === currentUser?.uid ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {role === 'admin' ? 'Admin' : role === 'manager' ? 'Gestor' : 'Viewer'}
                    </button>
                  ))}
                </div>
                {selectedUser.id === currentUser?.uid && (
                  <p className="text-xs text-gray-500 mt-2">* Você não pode alterar sua própria função</p>
                )}
              </div>

              {/* Permissões */}
              <div>
                <h3 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3">Permissões de Acesso</h3>

                {/* Lista de Permissões */}
                <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto">
                  {permissions.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500">Nenhuma permissão específica</p>
                      <p className="text-xs text-gray-400 mt-1">Usuário tem acesso a todos os dados</p>
                    </div>
                  ) : (
                    permissions.map(perm => (
                      <div key={perm.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div>
                          <span className={`px-2 py-1 rounded text-[9px] font-black uppercase mr-2 ${
                            perm.permission_type === 'centro_custo' ? 'bg-blue-100 text-blue-700' :
                            perm.permission_type === 'cia' ? 'bg-green-100 text-green-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {perm.permission_type.replace('_', ' ')}
                          </span>
                          <span className="text-sm font-bold text-gray-900">{perm.permission_value}</span>
                        </div>
                        <button
                          onClick={() => handleRemovePermission(perm.id)}
                          disabled={saving}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Adicionar Nova Permissão */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-purple-900 uppercase">Adicionar Permissão</p>
                    <button
                      onClick={() => setShowValuesHelper(!showValuesHelper)}
                      className="text-xs text-purple-600 hover:text-purple-800 underline font-bold"
                    >
                      Ver valores disponíveis ▲
                    </button>
                  </div>
                  <div className="space-y-2">
                    <select
                      value={newPermissionType}
                      onChange={(e) => setNewPermissionType(e.target.value as any)}
                      className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg text-sm font-bold focus:outline-none focus:border-purple-400"
                    >
                      <option value="centro_custo">Centro de Custo (Category)</option>
                      <option value="cia">CIA (Marca/Brand)</option>
                      <option value="filial">Filial (Branch)</option>
                    </select>
                    <div className="relative">
                      <input
                        type="text"
                        value={newPermissionValue}
                        onChange={(e) => setNewPermissionValue(e.target.value)}
                        placeholder="Digite o valor EXATO..."
                        className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                        list={`suggestions-${newPermissionType}`}
                      />
                      <datalist id={`suggestions-${newPermissionType}`}>
                        {newPermissionType === 'cia' && availableValues.brands.map(b => (
                          <option key={b} value={b} />
                        ))}
                        {newPermissionType === 'filial' && availableValues.branches.map(b => (
                          <option key={b} value={b} />
                        ))}
                        {newPermissionType === 'centro_custo' && availableValues.categories.map(c => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>
                    <button
                      onClick={handleAddPermission}
                      disabled={saving || !newPermissionValue.trim()}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={16} />
                      Adicionar Permissão
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <Users className="mx-auto mb-4 text-gray-300" size={64} />
              <p className="text-gray-500 font-bold">Selecione um usuário</p>
              <p className="text-sm text-gray-400 mt-2">Escolha um usuário da lista ao lado para gerenciar</p>
            </div>
          )}
        </div>
      </div>

      {/* Informações */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <h4 className="font-black text-blue-900 text-sm mb-2">ℹ️ Sobre Funções e Permissões</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li><strong>Viewer:</strong> Pode visualizar dados conforme suas permissões</li>
          <li><strong>Gestor:</strong> Pode visualizar e solicitar alterações</li>
          <li><strong>Admin:</strong> Acesso total, incluindo aprovar alterações e gerenciar usuários</li>
          <li><strong>Permissões:</strong> Limitam o acesso a centros de custo, CIAs ou filiais específicas</li>
          <li><strong>Sem permissões:</strong> Usuário tem acesso a todos os dados do sistema</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminPanel;
