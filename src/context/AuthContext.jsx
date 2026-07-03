import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('fs_token');
    const storedUser = localStorage.getItem('fs_user');
    if (token && storedUser) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('fs_token', data.token);
    localStorage.setItem('fs_user', JSON.stringify({ name: data.name, email: data.email }));
    setUser({ name: data.name, email: data.email });
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('fs_token', data.token);
    localStorage.setItem('fs_user', JSON.stringify({ name: data.name, email: data.email }));
    setUser({ name: data.name, email: data.email });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('fs_token');
    localStorage.removeItem('fs_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);