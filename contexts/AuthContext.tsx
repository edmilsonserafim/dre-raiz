import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider, signInWithPopup, signOut as firebaseSignOut } from '../firebase';
import * as supabaseService from '../services/supabaseService';

interface User {
  uid: string;
  email: string;
  name: string;
  photoURL: string;
  role: 'admin' | 'manager' | 'viewer';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Buscar dados do usuário no Supabase
  const fetchUserData = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    if (!firebaseUser.email) return null;

    try {
      // Buscar ou criar usuário no Supabase
      const dbUser = await supabaseService.getUserByEmail(firebaseUser.email);

      if (dbUser) {
        // Atualizar último login
        await supabaseService.updateUserLastLogin(dbUser.id);

        return {
          uid: firebaseUser.uid,
          email: dbUser.email,
          name: dbUser.name,
          photoURL: firebaseUser.photoURL || '',
          role: dbUser.role as 'admin' | 'manager' | 'viewer'
        };
      } else {
        // Criar novo usuário no Supabase (primeiro login)
        const newUser = await supabaseService.createUser({
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          photoURL: firebaseUser.photoURL || '',
          role: 'viewer' // Novo usuário começa como viewer
        });

        return {
          uid: firebaseUser.uid,
          email: newUser.email,
          name: newUser.name,
          photoURL: firebaseUser.photoURL || '',
          role: newUser.role as 'admin' | 'manager' | 'viewer'
        };
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      return null;
    }
  };

  // Monitorar mudanças de autenticação do Firebase
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await fetchUserData(firebaseUser);
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      console.log('🔐 Iniciando login com Google...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('✅ Login Google bem-sucedido:', result.user.email);
      const userData = await fetchUserData(result.user);
      console.log('✅ Dados do usuário carregados:', userData);
      setUser(userData);
    } catch (error: any) {
      console.error('❌ Erro completo ao fazer login:', error);
      console.error('Código do erro:', error.code);
      console.error('Mensagem do erro:', error.message);

      if (error.code === 'auth/popup-closed-by-user') {
        alert('Login cancelado. Tente novamente.');
      } else if (error.code === 'auth/network-request-failed') {
        alert('Erro de conexão. Verifique sua internet e tente novamente.');
      } else if (error.code === 'auth/configuration-not-found' || error.message.includes('auth/invalid-api-key')) {
        alert('⚠️ Firebase não configurado!\n\nPara habilitar o login com Google, configure o Firebase:\n\n1. Acesse: https://console.firebase.google.com\n2. Crie/selecione projeto\n3. Ative Authentication > Google\n4. Configure as credenciais no arquivo .env');
        console.error('🔴 FIREBASE NÃO CONFIGURADO - Siga as instruções em INSTRUCOES-FIREBASE.md');
      } else {
        alert(`Erro ao fazer login: ${error.message}\n\nVerifique o console para mais detalhes.`);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      alert('Erro ao fazer logout. Tente novamente.');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    signOut,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager' || user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
