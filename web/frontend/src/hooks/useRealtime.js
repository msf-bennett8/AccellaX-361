/**
 * File: web/frontend/src/hooks/useRealtime.js
 * AccellaX 361° - Real-time Synchronization Hook
 * 
 * Description:
 * High-level hook that combines Firebase real-time updates with API calls.
 * Provides a unified interface for real-time data synchronization across
 * the application, handling both Firebase Firestore and Laravel API.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useFirebase } from './useFirebase';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

/**
 * Custom hook for real-time data synchronization
 * @param {string} resource - Resource type (kids, sessions, attendance, etc.)
 * @param {Object} options - Configuration options
 * @returns {Object} Real-time state and methods
 */
export const useRealtime = (resource, options = {}) => {
  const {
    enableFirebase = true,
    enableAPI = true,
    syncInterval = 60000, // 1 minute
    onSync = null,
    filters = {},
  } = options;

  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);
  const syncTimerRef = useRef(null);

  // Firebase real-time subscription
  const firebase = useFirebase(resource, {
    autoSubscribe: enableFirebase,
    filters,
    onUpdate: (firebaseData) => {
      setData(firebaseData);
      setLastSync(new Date());
      
      if (onSync) {
        onSync({ source: 'firebase', data: firebaseData });
      }
    },
    onError: (err) => {
      console.error(`Firebase ${resource} error:`, err);
    },
  });

  /**
   * Fetch data from API (fallback or primary source)
   */
  const fetchFromAPI = useCallback(async () => {
    if (!enableAPI) return;

    try {
      setSyncing(true);
      setError(null);

      // Import appropriate service dynamically
      let service;
      switch (resource) {
        case 'kids':
          service = (await import('@/services/kidService')).default;
          break;
        case 'sessions':
        case 'attendance':
          service = (await import('@/services/attendanceService')).default;
          break;
        case 'events':
          service = (await import('@/services/eventService')).default;
          break;
        case 'notifications':
          service = (await import('@/services/notificationService')).default;
          break;
        default:
          throw new Error(`Unsupported resource: ${resource}`);
      }

      // Fetch data based on resource type
      let apiData;
      switch (resource) {
        case 'kids':
          apiData = await service.getKids(filters);
          break;
        case 'sessions':
          apiData = await service.getSessions(filters);
          break;
        case 'attendance':
          if (filters.sessionId) {
            apiData = await service.getAttendanceFilters(filters);
          }
          break;
        case 'events':
          apiData = await service.getEvents(filters);
          break;
        case 'notifications':
          apiData = await service.getNotifications();
          break;
      }

      // Only update if no Firebase data or Firebase is disabled
      if (!enableFirebase || firebase.data.length === 0) {
        setData(Array.isArray(apiData) ? apiData : apiData.data || []);
      }

      setLastSync(new Date());

      if (onSync) {
        onSync({ source: 'api', data: apiData });
      }

      return apiData;
    } catch (err) {
      const message = err.message || `Failed to sync ${resource}`;
      setError(message);
      console.error(`API ${resource} error:`, err);
    } finally {
      setSyncing(false);
    }
  }, [resource, enableAPI, filters, firebase.data, enableFirebase, onSync]);

  /**
   * Manual sync trigger
   */
  const sync = useCallback(async () => {
    setLoading(true);
    try {
      await fetchFromAPI();
      toast.success(`${resource} synced successfully`);
    } catch (err) {
      toast.error(`Failed to sync ${resource}`);
    } finally {
      setLoading(false);
    }
  }, [resource, fetchFromAPI]);

  /**
   * Force refresh from both sources
   */
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch from API
      await fetchFromAPI();

      // Re-fetch from Firebase if enabled
      if (enableFirebase && firebase.fetchOnce) {
        await firebase.fetchOnce();
      }

      toast.success('Data refreshed');
    } catch (err) {
      toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [fetchFromAPI, enableFirebase, firebase]);

  /**
   * Setup periodic sync
   */
  useEffect(() => {
    if (!enableAPI || !syncInterval) return;

    // Initial API fetch if Firebase is disabled
    if (!enableFirebase) {
      fetchFromAPI();
    }

    // Setup periodic sync
    syncTimerRef.current = setInterval(fetchFromAPI, syncInterval);

    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
      }
    };
  }, [enableAPI, enableFirebase, syncInterval, fetchFromAPI]);

  /**
   * Determine primary data source
   */
  const primaryData = enableFirebase && firebase.hasData ? firebase.data : data;

  /**
   * Calculate sync status
   */
  const getSyncStatus = useCallback(() => {
    if (!lastSync) return 'Never synced';

    const now = new Date();
    const diffMs = now - lastSync;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  }, [lastSync]);

  return {
    // Data
    data: primaryData,
    loading: loading || firebase.loading,
    syncing,
    error: error || firebase.error,
    
    // Sync info
    lastSync,
    syncStatus: getSyncStatus(),
    isRealtime: enableFirebase && firebase.isSubscribed,
    connected: firebase.connected,

    // Methods
    sync,
    refresh,
    subscribe: firebase.subscribe,
    unsubscribe: firebase.unsubscribe,
    checkConnection: firebase.checkConnection,

    // Helper flags
    hasData: primaryData.length > 0,
    isEmpty: primaryData.length === 0 && !loading,
  };
};

/**
 * Specialized hooks for common resources
 */

export const useRealtimeKids = (options = {}) => {
  return useRealtime('kids', options);
};

export const useRealtimeSessions = (options = {}) => {
  return useRealtime('sessions', options);
};

export const useRealtimeAttendance = (sessionId, options = {}) => {
  return useRealtime('attendance', {
    filters: { sessionId },
    ...options,
  });
};

export const useRealtimeEvents = (options = {}) => {
  return useRealtime('events', options);
};

export const useRealtimeNotifications = (options = {}) => {
  return useRealtime('notifications', options);
};

/**
 * USAGE EXAMPLES:
 * 
 * // Basic usage (Firebase + API fallback)
 * const { data: kids, loading, sync } = useRealtime('kids');
 * 
 * // Firebase only
 * const { data: sessions } = useRealtime('sessions', {
 *   enableAPI: false,
 *   enableFirebase: true
 * });
 * 
 * // API only (no real-time)
 * const { data: events } = useRealtime('events', {
 *   enableFirebase: false,
 *   enableAPI: true,
 *   syncInterval: 30000 // Sync every 30 seconds
 * });
 * 
 * // With filters
 * const { data: attendance } = useRealtime('attendance', {
 *   filters: { sessionId: '123' }
 * });
 * 
 * // Manual refresh
 * const { data, refresh, lastSync, syncStatus } = useRealtime('kids');
 * <button onClick={refresh}>
 *   Refresh (Last: {syncStatus})
 * </button>
 * 
 * // Specialized hooks
 * const { data: kids } = useRealtimeKids();
 * const { data: sessions } = useRealtimeSessions({ filters: { today: true } });
 * const { data: notifications } = useRealtimeNotifications();
 * 
 * // With sync callback
 * const { data } = useRealtime('kids', {
 *   onSync: ({ source, data }) => {
 *     console.log(`Synced from ${source}:`, data.length, 'items');
 *   }
 * });
 */

export default useRealtime;