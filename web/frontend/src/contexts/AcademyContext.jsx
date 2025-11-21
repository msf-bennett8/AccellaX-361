/**
 * File: web/frontend/src/contexts/AcademyContext.jsx
 * AccellaX 361° - Academy Context
 * 
 * Description:
 * Provides academy-specific data and settings throughout the app.
 * Manages multi-academy support and academy-scoped operations.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '@/services/api';

// Create context
const AcademyContext = createContext(null);

// Custom hook to use academy context
export const useAcademy = () => {
  const context = useContext(AcademyContext);
  if (!context) {
    throw new Error('useAcademy must be used within AcademyProvider');
  }
  return context;
};

// Academy Provider Component
export const AcademyProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [academy, setAcademy] = useState(null);
  const [academies, setAcademies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load academy data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadAcademyData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Load academy data
  const loadAcademyData = async () => {
    try {
      setLoading(true);

      // Get user's academy
      if (user.academy_id) {
        const response = await api.get(`/academies/${user.academy_id}`);
        setAcademy(response.data);
        
        // Store in localStorage for API interceptor
        localStorage.setItem('academy_id', user.academy_id);
      }

      // If super admin, load all academies
      if (user.role === 'super_admin') {
        const response = await api.get('/academies');
        setAcademies(response.data);
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ Load academy error:', error);
      setLoading(false);
    }
  };

  // Switch academy (for super admin)
  const switchAcademy = async (academyId) => {
    try {
      const response = await api.get(`/academies/${academyId}`);
      setAcademy(response.data);
      localStorage.setItem('academy_id', academyId);
      
      // Reload page to refresh all data
      window.location.reload();
    } catch (error) {
      console.error('❌ Switch academy error:', error);
      throw error;
    }
  };

  // Update academy settings
  const updateAcademySettings = async (settings) => {
    try {
      const response = await api.put(`/academies/${academy.id}`, settings);
      setAcademy(response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Update academy error:', error);
      throw error;
    }
  };

  // Create new academy (super admin only)
  const createAcademy = async (academyData) => {
    try {
      const response = await api.post('/academies', academyData);
      setAcademies([...academies, response.data]);
      return response.data;
    } catch (error) {
      console.error('❌ Create academy error:', error);
      throw error;
    }
  };

  // Context value
  const value = {
    academy,
    academies,
    loading,
    loadAcademyData,
    switchAcademy,
    updateAcademySettings,
    createAcademy,
  };

  return (
    <AcademyContext.Provider value={value}>
      {!loading && children}
    </AcademyContext.Provider>
  );
};

export default AcademyContext;