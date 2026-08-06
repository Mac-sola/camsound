import React, { createContext, useContext, useState, useEffect, useRef } from 'react';


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
  logout: () => void;
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
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const setNavigate = (callback: (path: string) => void) => {
    navigateRef.current = callback;
  };

  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        try {
          const headers: HeadersInit = {};
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const response = await fetch(`${baseUrl}/api/auth/session`, {
            method: 'GET',
            headers,
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setUser(data.data.user);
              if (data.data.csrfToken) {
                setCsrfToken(data.data.csrfToken);
                localStorage.setItem('csrfToken', data.data.csrfToken);
              }
            }
          } else if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
            if (navigateRef.current) navigateRef.current('/login');
          } else {
            const storedUser = localStorage.getItem('user');
            if (storedUser) setUser(JSON.parse(storedUser));
          }
        } catch {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch {
              setUser(null);
            }
          }
        }
      }
      setIsLoading(false);
    };

    validateToken();
  }, [token, baseUrl]);

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

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('csrfToken');
    setToken(null);
    setCsrfToken(null);
    setUser(null);
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
