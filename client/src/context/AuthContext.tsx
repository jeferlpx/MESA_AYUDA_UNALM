import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RoleCode } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, deferSetUser?: boolean) => Promise<User | null>;
  loginWithLdap: (username: string, password: string, deferSetUser?: boolean) => Promise<User | null>;
  completeLogin: (user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (updatedFields: Partial<User>) => void;
  isAuthenticated: boolean;
  hasRole: (...roles: RoleCode[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await api.getProfile();
      if (res.success && res.data) {
        setUser(res.data);
      }
    } catch (err) {
      console.error('Error refreshing user profile in AuthContext:', err);
    }
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem('otic_token');
      setUser(null);
    };

    window.addEventListener('otic_unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('otic_unauthorized', handleUnauthorized);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('otic_token');
    if (token) {
      api.getProfile()
        .then((res) => {
          if (res.success && res.data) {
            setUser(res.data);
          } else {
            localStorage.removeItem('otic_token');
            setUser(null);
          }
        })
        .catch(() => {
          localStorage.removeItem('otic_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setUser(null);
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, deferSetUser = false): Promise<User | null> => {
    const res = await api.login(email, password);
    if (res.success && res.data?.token && res.data?.user) {
      localStorage.setItem('otic_token', res.data.token);
      if (!deferSetUser) {
        setUser(res.data.user);
      }
      return res.data.user;
    }
    return null;
  };

  const loginWithLdap = async (username: string, password: string, deferSetUser = false): Promise<User | null> => {
    const res = await api.ldapLogin(username, password);
    if (res.success && res.data?.token && res.data?.user) {
      localStorage.setItem('otic_token', res.data.token);
      if (!deferSetUser) {
        setUser(res.data.user);
      }
      return res.data.user;
    }
    return null;
  };

  const completeLogin = (authenticatedUser: User) => {
    setUser(authenticatedUser);
  };

  const logout = () => {
    localStorage.removeItem('otic_token');
    setUser(null);
  };

  const hasRole = (...rolesToCheck: RoleCode[]): boolean => {
    if (!user) return false;
    const userRoles: RoleCode[] = user.roles && user.roles.length > 0 ? user.roles : [user.rol];
    return userRoles.some((r) => rolesToCheck.includes(r));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithLdap,
        completeLogin,
        logout,
        refreshUser,
        updateUser,
        isAuthenticated: !!user,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
