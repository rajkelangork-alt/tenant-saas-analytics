import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Create an Axios instance using relative pathing (Vite proxy handles destination)
const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Fetch current user details if token exists
      api
        .get('/auth/me')
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      // Sends payload matching backend expectations, with fallback tenant slug
      const response = await api.post('/auth/login', {
        email,
        password,
        tenant_slug: 'acme-corp',
      });

      const accessToken = response.data.access_token || response.data.token;
      if (accessToken) {
        localStorage.setItem('token', accessToken);
        setToken(accessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        setUser(response.data.user || { email });
        return { success: true };
      }
      return { success: false, error: 'No token received' };
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Invalid email or password';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;