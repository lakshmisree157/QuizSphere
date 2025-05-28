import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Log user state changes for debugging
  // React.useEffect(() => {
  //   console.log('AuthContext user state changed:', user);
  // }, [user]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', process.env.REACT_APP_API_URL);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        { email, password },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data || !response.data.token) {
        throw new Error('Invalid response from server');
      }

      const { token, user: userData } = response.data;
      
      // Store complete user data including name
      const userToStore = {
        _id: userData._id,
        username: userData.username || '',
        email: userData.email,
        name: userData.name || ''
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userToStore));
      
      setUser(userToStore);
      setIsAuthenticated(true);
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Invalid credentials' 
      };
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
          setLoading(false);
          return;
        }

        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/auth/verify`,
            { 
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log('Verify response data:', response.data);

          if (response.data && response.data.userId) {
            const storedUser = JSON.parse(userData);
            console.log('User data from localStorage:', storedUser);
            setUser(storedUser);
            setIsAuthenticated(true);
          } else {
            throw new Error('Invalid response from verify endpoint');
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          logout();
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [logout]);

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
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