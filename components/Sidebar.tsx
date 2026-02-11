
import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  TableProperties,
  LineChart,
  History,
  ReceiptText,
  BarChart3,
  Brain,
  LogOut,
  User as UserIcon,
  Shield,
  FileText,
  TrendingUp
} from 'lucide-react';
import { ViewType } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  selectedBrand: string;
  pendingCount?: number;
  isDrawer?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, selectedBrand, pendingCount = 0, isDrawer = false, onClose }) => {
  const { user, signOut, isAdmin } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'kpis', label: 'Indicadores e KPIs', icon: BarChart3 },
    { id: 'analysis', label: 'Análise Financeira', icon: FileText },
    { id: 'dre', label: 'DRE Gerencial', icon: TableProperties },
    { id: 'movements', label: 'Lançamentos', icon: ReceiptText },
    { id: 'manual_changes', label: 'Aprovações', icon: History, badge: pendingCount },
    { id: 'forecasting', label: 'Forecasting', icon: LineChart },
    ...(isAdmin ? [
      { id: 'admin', label: 'Admin', icon: Shield }
    ] : []),
  ];

  const handleNavClick = (viewId: string) => {
    setCurrentView(viewId as ViewType);
    if (isDrawer && onClose) {
      onClose();
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-[#F44C00] p-2 rounded-lg shadow-lg shadow-orange-100">
          <GraduationCap className="text-white w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-[#F44C00] leading-none tracking-tighter">RAIZ</h1>
          <span className="text-[10px] font-bold text-[#7AC5BF] uppercase tracking-widest -mt-0.5">educação</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 mt-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-[#FFF4ED] text-[#F44C00] font-bold shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={isActive ? 'text-[#F44C00]' : 'text-gray-400'} />
                <span className="text-[11px] uppercase font-black tracking-tight">{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F44C00] text-[10px] font-black text-white animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 space-y-3">
        {/* User Profile */}
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <div className="flex items-center gap-3 mb-3">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.name} className="w-10 h-10 rounded-full border-2 border-[#1B75BB]" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#1B75BB] flex items-center justify-center">
                <UserIcon className="text-white" size={20} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{user?.name}</p>
              <p className="text-[9px] text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
              user?.role === 'admin' ? 'bg-purple-100 text-purple-700' :
              user?.role === 'manager' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {user?.role === 'admin' ? 'Administrador' :
               user?.role === 'manager' ? 'Gestor' :
               'Visualizador'}
            </span>
          </div>

          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-lg transition-all text-[10px] font-bold uppercase"
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>

      </div>
    </aside>
  );
};

export default Sidebar;
