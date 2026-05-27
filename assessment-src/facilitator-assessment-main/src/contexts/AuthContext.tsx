import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { wpApi, WPUser } from '@/lib/wordpressApi';

interface AuthContextType {
  user: WPUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { first_name: string; last_name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<WPUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate stored token on mount
  useEffect(() => {
    const token = localStorage.getItem('zane_auth_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    wpApi.me()
      .then(setUser)
      .catch(() => localStorage.removeItem('zane_auth_token'))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await wpApi.login(email, password);
    localStorage.setItem('zane_auth_token', res.token);
    setUser(res.user);
  }, []);

  const register = useCallback(async (data: { first_name: string; last_name: string; email: string; password: string }) => {
    const res = await wpApi.register(data);
    localStorage.setItem('zane_auth_token', res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    try { await wpApi.logout(); } catch { /* ignore */ }
    localStorage.removeItem('zane_auth_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
