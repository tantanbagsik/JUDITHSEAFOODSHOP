import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authClient } from '../services/authClient';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await authClient.getToken();
      if (token) {
        const userData = await authClient.getUser();
        if (userData) {
          setUser(userData);
        } else {
          const profile = await authClient.getProfile();
          setUser(profile.user || profile);
          await authClient.saveUser(profile.user || profile);
        }
      }
    } catch (e) {
      console.error('Error loading user:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    const data = await authClient.login(email, password);
    if (data.token || data.url) {
      if (data.token) {
        await authClient.saveToken(data.token);
      }
      const profile = await authClient.getProfile();
      const userData = profile.user || profile;
      setUser(userData);
      await authClient.saveUser(userData);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await authClient.register(name, email, password);
    if (data.token) {
      await authClient.saveToken(data.token);
    }
    if (data.user) {
      setUser(data.user);
      await authClient.saveUser(data.user);
    }
  }, []);

  const logout = useCallback(async () => {
    await authClient.logout();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authClient.getProfile();
      const userData = profile.user || profile;
      setUser(userData);
      await authClient.saveUser(userData);
    } catch (e) {
      console.error('Error refreshing profile:', e);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
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

export const useAuth = () => useContext(AuthContext);
