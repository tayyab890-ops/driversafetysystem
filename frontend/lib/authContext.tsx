'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiUser } from '@/lib/api';

interface AuthContextType {
  user: ApiUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, role: 'driver' | 'admin') => Promise<ApiUser>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    vehicle_id?: string;
  }) => Promise<ApiUser>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<ApiUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Restore authenticated user on initial load / refresh
  const restoreUser = useCallback(async (): Promise<ApiUser | null> => {
    try {
      if (api.hasToken()) {
        const profile = await api.getMe();
        setUser(profile);
        setError(null);
        return profile;
      } else {
        // Attempt silent session restore via secure HttpOnly cookie
        const refreshed = await api.refreshToken();
        if (refreshed) {
          const profile = await api.getMe();
          setUser(profile);
          setError(null);
          return profile;
        }
      }
      setUser(null);
      return null;
    } catch {
      api.clearTokens();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreUser();
  }, [restoreUser]);

  const login = useCallback(
    async (email: string, password: string, role: 'driver' | 'admin'): Promise<ApiUser> => {
      setError(null);
      const res = await api.login(email, password, role);
      setUser(res.user);
      return res.user;
    },
    []
  );

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      vehicle_id?: string;
    }): Promise<ApiUser> => {
      setError(null);
      const res = await api.register({ ...payload, role: 'driver' });
      setUser(res.user);
      return res.user;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setError(null);
      router.push('/login');
    }
  }, [router]);

  const refreshProfile = useCallback(async (): Promise<ApiUser | null> => {
    try {
      const updated = await api.getMe();
      setUser(updated);
      return updated;
    } catch {
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
