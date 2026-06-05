import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api/client';

const AuthContext = createContext(null);

const TOKEN_KEY = 'fast_reports_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const persistAuth = useCallback((nextToken, nextUser) => {
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken);
      setToken(nextToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    }
    setUser(nextUser);
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    api
      .getMe(token)
      .then(({ user: u }) => setUser(u))
      .catch(() => persistAuth(null, null))
      .finally(() => setLoading(false));
  }, [token, persistAuth]);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    persistAuth(data.token, data.user);
    return data.user;
  };

  const register = async (email, password, name) => {
    const data = await api.register(email, password, name);
    persistAuth(data.token, data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      if (token) await api.logout(token);
    } catch {
      /* ignore */
    }
    persistAuth(null, null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
