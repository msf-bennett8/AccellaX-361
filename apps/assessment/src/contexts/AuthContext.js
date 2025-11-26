// Location: /apps/assessment/src/contexts/AuthContext.js
// Authentication context for managing global auth state

import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, logoutUser, setupAuthListener } from '../utils/auth';
import { initDatabase } from '../database/db';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🔐 AuthContext: Initializing...');
      
      // Initialize database
      await initDatabase();
      
      // Check current user
      const currentUser = await getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
        console.log('✅ AuthContext: User authenticated:', currentUser.fullName);
      } else {
        console.log('❌ AuthContext: No user found');
      }
    } catch (error) {
      console.error('❌ AuthContext: Init error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    console.log('✅ AuthContext: User logged in');
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setIsAuthenticated(false);
    console.log('✅ AuthContext: User logged out');
  };

  const updateUser = async (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    console.log('✅ AuthContext: User updated');
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    refreshUser: initializeAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;