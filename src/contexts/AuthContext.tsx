import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, storage } from '../lib/localStorage';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing user session
    const currentUser = storage.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const user = storage.loginUser(email, password);
      setUser(user);
      toast.success(`歡迎回來，${user.name}！`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '登入失敗');
      throw error;
    }
  };

  const register = async (userData: { email: string; password: string; name: string }) => {
    try {
      const user = storage.registerUser(userData);
      storage.setCurrentUser(user);
      setUser(user);
      toast.success(`註冊成功！歡迎加入，${user.name}！`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '註冊失敗');
      throw error;
    }
  };

  const logout = () => {
    storage.logout();
    setUser(null);
    toast.success('已成功登出');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      loading,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
