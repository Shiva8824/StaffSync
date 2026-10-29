import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('staffsync_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('staffsync_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize and verify user on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('staffsync_token');
      if (storedToken) {
        try {
          const res = await authApi.getMe();
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('staffsync_user', JSON.stringify(res.data.user));
          }
        } catch (error) {
          console.error('[Auth Init Error] Token invalid or expired:', error.message);
          localStorage.removeItem('staffsync_token');
          localStorage.removeItem('staffsync_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.data.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      setToken(receivedToken);
      setUser(receivedUser);
      localStorage.setItem('staffsync_token', receivedToken);
      localStorage.setItem('staffsync_user', JSON.stringify(receivedUser));
      return receivedUser;
    }
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    if (res.data.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      setToken(receivedToken);
      setUser(receivedUser);
      localStorage.setItem('staffsync_token', receivedToken);
      localStorage.setItem('staffsync_user', JSON.stringify(receivedUser));
      return receivedUser;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore API logout failure, clear local session regardless
    } finally {
      localStorage.removeItem('staffsync_token');
      localStorage.removeItem('staffsync_user');
      setUser(null);
      setToken(null);
    }
  };

  const updateUserProfile = (updatedProfile) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        employeeProfile: { ...prev.employeeProfile, ...updatedProfile },
      };
      localStorage.setItem('staffsync_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
