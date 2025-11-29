// Location: /apps/assessment/src/contexts/AssessmentContext.js
// Global state management for assessment flow

import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AssessmentContext = createContext();

export const useAssessment = () => {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within AssessmentProvider');
  }
  return context;
};

export const AssessmentProvider = ({ children }) => {
  // Current assessment session state
  const [currentAssessment, setCurrentAssessment] = useState({
    // Metadata (captured on Assessment Setup screen)
    year: null,
    term: null,
    assessmentType: null,
    weekNumber: null,
    location: null,
    assessorName: null,
    generalNotes: null,
    setupDate: null,
    
    // Assessment flow data
    sport: null,
    mode: null, // 'test_by_test' or 'kid_by_kid'
    selectedTests: [],
    selectedKids: [],
    assessmentData: {}, // { 'kid_id_metric_id': value }
    startTime: null,
    isActive: false,
  });

  // Settings
  const [settings, setSettings] = useState({
    prefillEnabled: false,
    autoSave: true,
    showPreviousValues: true,
  });

  // Load saved settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('assessment_settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      await AsyncStorage.setItem('assessment_settings', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  // Start new assessment
  const startAssessment = ({ sport, mode, selectedTests, selectedKids, metadata }) => {
    console.log('🎯 Starting assessment:', { 
      sport: sport?.name, 
      mode, 
      tests: selectedTests?.length, 
      kids: selectedKids?.length,
      year: metadata?.year,
      term: metadata?.term,
      type: metadata?.assessmentType,
    });
    
    setCurrentAssessment({
      // Metadata
      year: metadata?.year || null,
      term: metadata?.term || null,
      assessmentType: metadata?.assessmentType || null,
      weekNumber: metadata?.weekNumber || null,
      location: metadata?.location || null,
      assessorName: metadata?.assessorName || null,
      generalNotes: metadata?.generalNotes || null,
      setupDate: metadata?.setupDate || new Date().toISOString(),
      
      // Assessment data
      sport,
      mode,
      selectedTests: selectedTests || [],
      selectedKids: selectedKids || [],
      assessmentData: {},
      startTime: new Date().toISOString(),
      isActive: true,
    });
  };

  // Update assessment data
  const updateAssessmentValue = (kidId, metricId, value) => {
    const key = `${kidId}_${metricId}`;
    setCurrentAssessment(prev => ({
      ...prev,
      assessmentData: {
        ...prev.assessmentData,
        [key]: value,
      },
    }));
  };

  // Complete assessment
  const completeAssessment = () => {
    console.log('✅ Assessment completed:', {
      sport: currentAssessment.sport?.name,
      year: currentAssessment.year,
      term: currentAssessment.term,
      type: currentAssessment.assessmentType,
      resultsCount: Object.keys(currentAssessment.assessmentData).length,
    });
    
    setCurrentAssessment({
      // Reset all state
      year: null,
      term: null,
      assessmentType: null,
      weekNumber: null,
      location: null,
      assessorName: null,
      generalNotes: null,
      setupDate: null,
      sport: null,
      mode: null,
      selectedTests: [],
      selectedKids: [],
      assessmentData: {},
      startTime: null,
      isActive: false,
    });
  };

  // Cancel/Reset assessment
  const cancelAssessment = () => {
    console.log('❌ Assessment cancelled');
    setCurrentAssessment({
      // Reset all state
      year: null,
      term: null,
      assessmentType: null,
      weekNumber: null,
      location: null,
      assessorName: null,
      generalNotes: null,
      setupDate: null,
      sport: null,
      mode: null,
      selectedTests: [],
      selectedKids: [],
      assessmentData: {},
      startTime: null,
      isActive: false,
    });
  };

  // Get progress percentage
  const getProgress = () => {
    const totalItems = currentAssessment.selectedKids.length * currentAssessment.selectedTests.length;
    const completedItems = Object.keys(currentAssessment.assessmentData).length;
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  const value = {
    // State
    currentAssessment,
    settings,
    
    // Actions
    startAssessment,
    updateAssessmentValue,
    completeAssessment,
    cancelAssessment,
    saveSettings,
    
    // Helpers
    getProgress,
    isAssessmentActive: currentAssessment.isActive,
  };

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
};

export default AssessmentContext;