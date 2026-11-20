import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '@/lib/api';
import { User } from '@/types';

const TOKEN_KEY = 'llb_access_token';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, turnstileToken: string) => Promise<User>;
  register: (name: string, email: string, password: string, turnstileToken: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function saveSession(user: User, token: string): User {
  localStorage.setItem(TOKEN_KEY, token);
  return user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    authApi.me()
      .then((response) => setUser(response.data.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    login: async (email, password, turnstileToken) => {
      const response = await authApi.login(email, password, turnstileToken);
      const sessionUser = saveSession(response.data.user, response.data.token);
      setUser(sessionUser);
      return sessionUser;
    },
    register: async (name, email, password, turnstileToken) => {
      const response = await authApi.register(name, email, password, turnstileToken);
      const sessionUser = saveSession(response.data.user, response.data.token);
      setUser(sessionUser);
      return sessionUser;
    },
    logout: async () => {
      try {
        if (user) await authApi.logout();
      } finally {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      }
    },
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
