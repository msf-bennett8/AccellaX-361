/**
 * File: web/frontend/src/hooks/useFirebase.js
 * AccellaX 361° - Firebase Real-time Hook
 * 
 * Description:
 * Custom hook for managing Firebase Firestore real-time subscriptions.
 * Handles automatic subscription/unsubscription and provides real-time data updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import firebaseService from '@/services/firebaseService';
import { useAuth } from './useAuth';

/**
 * Custom hook for Firebase real-time operations
 * @param {string} collection - Firestore collection name
 * @param {Object} options - Configuration options
 * @returns {Object} Firebase state and methods
 */
export const useFirebase = (collection, options = {}) => {
  const {
    autoSubscribe = false,
    filters = {},
    onUpdate = null,
    onError = null,
  } = options;

  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(true);
  const unsubscribeRef = useRef(null);

  /**
   * Handle real-time updates
   */
  const handleUpdate = useCallback((newData) => {
    setData(newData);
    setLoading(false);
    
    if (onUpdate) {
      onUpdate(newData);
    }
  }, [onUpdate]);

  /**
   * Handle errors
   */
  const handleError = useCallback((err) => {
    const message = err.message || 'Firebase error occurred';
    setError(message);
    setLoading(false);

    if (onError) {
      onError(err);
    }

    console.error(`Firebase ${collection} error:`, err);
  }, [collection, onError]);

  /**
   * Subscribe to real-time updates
   */
  const subscribe = useCallback(() => {
    if (unsubscribeRef.current) {
      console.warn(`Already subscribed to ${collection}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let unsubscribe;

      switch (collection) {
        case 'kids':
          unsubscribe = firebaseService.subscribeToKids(
            filters.academyId || user?.academy_id,
            handleUpdate
          );
          break;

        case 'sessions':
          if (filters.today) {
            unsubscribe = firebaseService.subscribeToTodaySessions(
              filters.academyId || user?.academy_id,
              handleUpdate
            );
          }
          break;

        case 'attendance':
          if (filters.sessionId) {
            unsubscribe = firebaseService.subscribeToSessionAttendance(
              filters.sessionId,
              handleUpdate
            );
          }
          break;

        case 'events':
          unsubscribe = firebaseService.subscribeToEvents(
            filters.academyId || user?.academy_id,
            handleUpdate
          );
          break;

        case 'notifications':
          unsubscribe = firebaseService.subscribeToNotifications(
            user?.id,
            handleUpdate
          );
          break;

        default:
          throw new Error(`Unsupported collection: ${collection}`);
      }

      unsubscribeRef.current = unsubscribe;
    } catch (err) {
      handleError(err);
    }
  }, [collection, filters, user, handleUpdate, handleError]);

  /**
   * Unsubscribe from real-time updates
   */
  const unsubscribe = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      setData([]);
      setLoading(false);
      setError(null);
    }
  }, []);

  /**
   * Fetch data once (without subscription)
   */
  const fetchOnce = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let result;

      switch (collection) {
        case 'kids':
          result = await firebaseService.getKids(filters);
          break;

        case 'sessions':
          result = await firebaseService.getSessions(filters);
          break;

        case 'events':
          result = await firebaseService.getUpcomingEvents(
            filters.academyId || user?.academy_id
          );
          break;

        case 'notifications':
          result = await firebaseService.getUserNotifications(user?.id);
          break;

        default:
          throw new Error(`Unsupported collection: ${collection}`);
      }

      setData(result);
      return result;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [collection, filters, user, handleError]);

  /**
   * Check Firebase connection status
   */
  const checkConnection = useCallback(async () => {
    try {
      const isConnected = await firebaseService.checkFirebaseConnection();
      setConnected(isConnected);
      return isConnected;
    } catch (err) {
      setConnected(false);
      return false;
    }
  }, []);

  /**
   * Auto-subscribe on mount if enabled
   */
  useEffect(() => {
    if (autoSubscribe && user) {
      subscribe();
    }

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [autoSubscribe, user, subscribe, unsubscribe]);

  /**
   * Monitor connection status
   */
  useEffect(() => {
    checkConnection();

    const interval = setInterval(checkConnection, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, [checkConnection]);

  return {
    // State
    data,
    loading,
    error,
    connected,
    isSubscribed: !!unsubscribeRef.current,

    // Methods
    subscribe,
    unsubscribe,
    fetchOnce,
    checkConnection,

    // Helper flags
    hasData: data.length > 0,
  };
};

/**
 * Specialized hooks for common collections
 */

export const useFirebaseKids = (options = {}) => {
  return useFirebase('kids', { autoSubscribe: true, ...options });
};

export const useFirebaseSessions = (options = {}) => {
  return useFirebase('sessions', { autoSubscribe: true, ...options });
};

export const useFirebaseAttendance = (sessionId, options = {}) => {
  return useFirebase('attendance', {
    autoSubscribe: true,
    filters: { sessionId },
    ...options,
  });
};

export const useFirebaseEvents = (options = {}) => {
  return useFirebase('events', { autoSubscribe: true, ...options });
};

export const useFirebaseNotifications = (options = {}) => {
  return useFirebase('notifications', { autoSubscribe: true, ...options });
};

/**
 * USAGE EXAMPLES:
 * 
 * // Basic usage
 * const { data: kids, loading } = useFirebase('kids', { autoSubscribe: true });
 * 
 * // With filters
 * const { data: sessions } = useFirebase('sessions', {
 *   autoSubscribe: true,
 *   filters: { today: true, academyId: 'academy-123' }
 * });
 * 
 * // Manual subscription control
 * const { data, subscribe, unsubscribe } = useFirebase('kids');
 * useEffect(() => {
 *   subscribe();
 *   return () => unsubscribe();
 * }, []);
 * 
 * // Fetch once without subscription
 * const { fetchOnce } = useFirebase('kids');
 * const kids = await fetchOnce();
 * 
 * // Specialized hooks
 * const { data: kids } = useFirebaseKids();
 * const { data: notifications } = useFirebaseNotifications();
 * 
 * // With callbacks
 * const { data } = useFirebase('kids', {
 *   autoSubscribe: true,
 *   onUpdate: (newData) => console.log('Kids updated:', newData),
 *   onError: (error) => toast.error(error.message)
 * });
 */

export default useFirebase;