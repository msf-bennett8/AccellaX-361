// Location: /apps/assessment/src/contexts/SyncContext.js
// Global Sync State Manager - Phase 3.2

import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { performFullSync, getSyncStatus } from '../database/sync';
import { autoRetryPendingOperations } from '../services/offlineQueueService';

const SyncContext = createContext();

export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within SyncProvider');
  }
  return context;
};

export const SyncProvider = ({ children }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [pendingItemsCount, setPendingItemsCount] = useState(0);
  
  const appState = useRef(AppState.currentState);

  // Load last sync time on mount
  useEffect(() => {
    loadLastSyncTime();
    loadPendingItemsCount();

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  const loadLastSyncTime = async () => {
    try {
      const timestamp = await AsyncStorage.getItem('lastAssessmentSyncTimestamp');
      if (timestamp) {
        setLastSyncTime(parseInt(timestamp));
      }
    } catch (error) {
      console.error('Error loading last sync time:', error);
    }
  };

  const loadPendingItemsCount = async () => {
    try {
      const { getQueueStats } = await import('../services/offlineQueueService');
      const stats = await getQueueStats();
      setPendingItemsCount(stats.total || 0);
    } catch (error) {
      console.error('Error loading pending items:', error);
    }
  };

  const handleAppStateChange = async (nextAppState) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      console.log('App came to foreground - triggering auto-retry');
      await autoRetryPendingOperations();
      await loadPendingItemsCount();
    }
    appState.current = nextAppState;
  };

  const triggerSync = async (userId) => {
    if (isSyncing) {
      console.log('Sync already in progress');
      return { success: false, message: 'Sync already in progress' };
    }

    setIsSyncing(true);
    setSyncProgress(0);
    setSyncError(null);

    try {
      // Emit sync_started event
      emitSyncEvent('sync_started');

      // Perform sync with progress updates
      const result = await performFullSync(userId);

      if (result.success) {
        // Update last sync time
        const now = Date.now();
        await AsyncStorage.setItem('lastAssessmentSyncTimestamp', now.toString());
        setLastSyncTime(now);
        
        // Clear pending items
        setPendingItemsCount(0);
        setSyncProgress(100);

        // Emit sync_completed event
        emitSyncEvent('sync_completed', { results: result.results });

        return { success: true, results: result.results };
      } else {
        setSyncError(result.error || 'Sync failed');
        
        // Emit sync_failed event
        emitSyncEvent('sync_failed', { error: result.error });

        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncError(error.message);
      
      // Emit sync_failed event
      emitSyncEvent('sync_failed', { error: error.message });

      return { success: false, error: error.message };
    } finally {
      setIsSyncing(false);
    }
  };

  const updateSyncProgress = (progress) => {
    setSyncProgress(progress);
    
    // Emit sync_progress event
    emitSyncEvent('sync_progress', { progress });
  };

  const emitSyncEvent = (eventName, data = {}) => {
    // Custom event emitter for sync events
    // Components can subscribe to these events if needed
    console.log(`[SyncEvent] ${eventName}`, data);
  };

  const clearSyncError = () => {
    setSyncError(null);
  };

  const refreshPendingCount = async () => {
    await loadPendingItemsCount();
  };

  const value = {
    // State
    isSyncing,
    syncProgress,
    lastSyncTime,
    syncError,
    pendingItemsCount,

    // Actions
    triggerSync,
    updateSyncProgress,
    clearSyncError,
    refreshPendingCount,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

export default SyncContext;