import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { api } from './api';
import { Role, User } from './types';

interface RegisterInput { name: string; email: string; password: string; role: Role }
interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>(null!);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api<{ user: User }>('/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const handle = async (path: string, body: unknown) => {
    const r = await api<{ token: string; user: User }>(path, { method: 'POST', body });
    localStorage.setItem('token', r.token);
    setUser(r.user);
    return r.user;
  };

  const value: AuthCtx = {
    user,
    loading,
    login: (email, password) => handle('/auth/login', { email, password }),
    register: (input) => handle('/auth/register', input),
    logout: () => { localStorage.removeItem('token'); setUser(null); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
