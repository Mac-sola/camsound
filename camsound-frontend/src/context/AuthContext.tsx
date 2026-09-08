import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authService } from '../services/api';


export interface User {
  _id: string;
  name: string;
  email: string;
  type: string;
  status?: string;
  avatar?: string;
  country?: string;
  subscriptionStatus?: string;
  phone?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  csrfToken: string | null;
  login: (token: string, user: User, csrfToken?: string) => void;
  updateUser: (user: User) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  setNavigate: (callback: (path: string) => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [csrfToken, setCsrfToken] = useState<string | null>(localStorage.getItem('csrfToken'));
  const [isLoading, setIsLoading] = useState(true);
  const navigateRef = useRef<((path: string) => void) | undefined>(undefined);

  const setNavigate = (callback: (path: string) => void) => {
    navigateRef.current = callback;
  };

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await authService.getSession();
        const data = response.data;
        if (data.success && data.data?.user) {
          setUser(data.data.user);
          if (data.data.csrfToken) {
            setCsrfToken(data.data.csrfToken);
            localStorage.setItem('csrfToken', data.data.csrfToken);
          }
        }
      } catch {
        setUser(null);
      }
      setIsLoading(false);
    };

    validateToken();
  }, []);

  const login = (newToken: string, newUser: User, newCsrfToken?: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    if (newCsrfToken) {
      localStorage.setItem('csrfToken', newCsrfToken);
      setCsrfToken(newCsrfToken);
    }
    setToken(newToken);
    setUser(newUser);
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const logout = async () => {
    try {
      if (token) await authService.logout();
    } catch {
      // Clear local state even if the server is unavailable.
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('csrfToken');
      setToken(null);
      setCsrfToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, csrfToken, login, updateUser, logout, isAuthenticated: !!user, isLoading, setNavigate }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
