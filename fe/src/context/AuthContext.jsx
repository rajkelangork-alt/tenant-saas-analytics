import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('saas_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      // 1. Attempt live backend login
      const response = await api.post('/api/v1/auth/login', {
        email: email.trim(),
        password: password
      });

      const { access_token, user: userData } = response.data;
      localStorage.setItem('access_token', access_token);
      
      const loggedUser = userData || {
        email: email.trim(),
        role: email.includes('admin') ? 'tenant_admin' : 'member',
        tenant_id: '24e0061d-9664-4538-b397-3dbf11354ea3',
        tenant_name: 'Production Analytics Corp'
      };

      localStorage.setItem('saas_user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      return { success: true };
    } catch (err) {
      console.warn('Backend server offline or unreachable. Engaging portfolio demo session mode:', err);

      // 2. Seamless Portfolio Fallback (for Vercel showcase)
      // Allow valid login for demo inspection
      const fallbackUser = {
        email: email.trim() || 'admin@tenant1.com',
        role: email.includes('admin') ? 'tenant_admin' : 'member',
        tenant_id: '24e0061d-9664-4538-b397-3dbf11354ea3',
        tenant_name: 'Production Analytics Corp'
      };

      const demoToken = 'demo_jwt_token_portfolio_mode';
      localStorage.setItem('access_token', demoToken);
      localStorage.setItem('saas_user', JSON.stringify(fallbackUser));
      setUser(fallbackUser);

      return { success: true, mode: 'demo' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('saas_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);