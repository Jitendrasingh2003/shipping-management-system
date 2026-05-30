import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('shiptrack_token');
    const savedUser = localStorage.getItem('shiptrack_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Verify token
      authAPI.getMe()
        .then(res => setUser(res.data.user))
        .catch(() => { logout(false); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('shiptrack_token', token);
    localStorage.setItem('shiptrack_user', JSON.stringify(userData));
    setUser(userData);
    toast.success(`Welcome back, ${userData.name}! 👋`);
    return userData;
  };

  const logout = useCallback((showToast = true) => {
    localStorage.removeItem('shiptrack_token');
    localStorage.removeItem('shiptrack_user');
    setUser(null);
    if (showToast) toast.success('Logged out successfully');
  }, []);

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('shiptrack_user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
