import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clean up any old localStorage tokens (migration to sessionStorage)
    if (localStorage.getItem('token') || localStorage.getItem('user')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    // Check if user is logged in (using sessionStorage for auto-logout on close)
    const token = sessionStorage.getItem('token');
    const savedUser = sessionStorage.getItem('user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing user data:', error);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, official } = response.data.data;

      // Use sessionStorage instead of localStorage for session-based auth
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(official));
      setUser(official);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (data) => {
    try {
      const response = await authAPI.register(data);

      // Registration successful - backend doesn't return token, user needs to login
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
        details: error.response?.data?.details || [],
      };
    }
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isChairman: user?.role === 'Chairman',
    isTreasurer: user?.role === 'Treasurer',
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div className="loading" style={{ width: '2rem', height: '2rem' }}></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
