import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Clock, ShieldAlert, LogOut, Mail } from 'lucide-react';

const PendingApprovalScreen: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full">
        {/* Ícone de Aguardando */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-amber-100 rounded-full mb-6 relative">
            <Clock className="w-12 h-12 text-amber-600 animate-pulse" />
            <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full p-2">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-black text-gray-900 mb-2">
            Aguardando Aprovação
          </h1>
          <p className="text-lg text-gray-600 font-medium">
            Seu acesso está sendo processado
          </p>
        </div>

        {/* Informações do Usuário */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 mb-8 border-2 border-amber-200">
          <div className="flex items-center gap-4">
            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt={user.name}
                className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
              />
            )}
            <div className="flex-1">
              <p className="text-sm font-black text-amber-600 uppercase tracking-wide">
                Conta identificada
              </p>
              <p className="text-lg font-bold text-gray-900">
                {user?.name}
              </p>
              <p className="text-sm text-gray-600 font-medium">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Mensagem Principal */}
        <div className="space-y-6 mb-8">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg shrink-0">
                <ShieldAlert className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-black text-blue-900 mb-2">
                  ⏳ Solicitação de Acesso Enviada
                </h3>
                <p className="text-sm text-blue-700 leading-relaxed">
                  Sua solicitação foi recebida e está aguardando análise de um administrador do sistema.
                  Você receberá acesso assim que sua conta for aprovada.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-lg shrink-0">
                <Mail className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-black text-purple-900 mb-2">
                  📧 Próximos Passos
                </h3>
                <ul className="text-sm text-purple-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold">1.</span>
                    <span>O administrador receberá uma notificação sobre sua solicitação</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold">2.</span>
                    <span>Seu perfil e permissões serão configurados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold">3.</span>
                    <span>Você poderá fazer login novamente assim que for aprovado</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="bg-gray-100 p-2 rounded-lg shrink-0">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 mb-2">
                  ⏱️ Tempo Estimado
                </h3>
                <p className="text-sm text-gray-700">
                  Normalmente aprovações são processadas em até <strong>1 dia útil</strong>.
                  Se precisar de acesso urgente, entre em contato com o administrador do sistema.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="space-y-3">
          <button
            onClick={signOut}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>

          <p className="text-center text-xs text-gray-500 pt-4">
            Dúvidas? Entre em contato com o administrador do sistema.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PendingApprovalScreen;
