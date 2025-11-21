/**
 * File: web/frontend/src/hooks/useAttendance.js
 * AccellaX 361° - Attendance Management Hook
 * 
 * Description:
 * Custom hook for managing attendance data, fetching sessions, marking attendance,
 * and accessing attendance-related operations throughout the application.
 */

import { useState, useEffect, useCallback } from 'react';
import attendanceService from '@/services/attendanceService';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

/**
 * Custom hook for attendance management
 * @param {Object} options - Hook configuration options
 * @param {boolean} options.autoFetch - Automatically fetch sessions on mount
 * @param {Object} options.filters - Initial filters for sessions
 * @returns {Object} Attendance state and methods
 */
export const useAttendance = (options = {}) => {
  const { autoFetch = false, filters: initialFilters = {} } = options;
  const { user } = useAuth();

  // State
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);

  /**
   * Fetch sessions with optional filters
   */
  const fetchSessions = useCallback(async (customFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const appliedFilters = { ...filters, ...customFilters };
      const data = await attendanceService.getSessions(appliedFilters);

      setSessions(data.sessions || data);
      return data;
    } catch (err) {
      const message = err.message || 'Failed to fetch sessions';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Fetch single session details
   */
  const fetchSession = useCallback(async (sessionId) => {
    try {
      setLoading(true);
      setError(null);

      const data = await attendanceService.getSession(sessionId);
      setCurrentSession(data);
      
      if (data.attendance) {
        setAttendance(data.attendance);
      }

      return data;
    } catch (err) {
      const message = err.message || 'Failed to fetch session';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new session
   */
  const createSession = useCallback(async (sessionData) => {
    try {
      setLoading(true);
      setError(null);

      const newSession = await attendanceService.createSession(sessionData);
      setSessions(prev => [newSession, ...prev]);
      
      toast.success('Session created successfully');
      return newSession;
    } catch (err) {
      const message = err.message || 'Failed to create session';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Mark attendance for a session
   */
  const markAttendance = useCallback(async (sessionId, attendanceData) => {
    try {
      setLoading(true);
      setError(null);

      const result = await attendanceService.markAttendance(sessionId, attendanceData);
      
      // Update local attendance state
      setAttendance(prev => {
        const updated = [...prev];
        attendanceData.forEach(record => {
          const existingIndex = updated.findIndex(
            a => a.kid_id === record.kid_id
          );
          if (existingIndex >= 0) {
            updated[existingIndex] = { ...updated[existingIndex], ...record };
          } else {
            updated.push(record);
          }
        });
        return updated;
      });

      toast.success('Attendance marked successfully');
      return result;
    } catch (err) {
      const message = err.message || 'Failed to mark attendance';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get attendance by filter (chronic absentees, inconsistent, etc.)
   */
  const getFilteredAttendance = useCallback(async (filterType) => {
    try {
      setLoading(true);
      setError(null);

      const data = await attendanceService.getAttendanceFilters(filterType);
      return data;
    } catch (err) {
      const message = err.message || `Failed to fetch ${filterType}`;
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get attendance reports
   */
  const getAttendanceReports = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const data = await attendanceService.getAttendanceReports(params);
      setStatistics(data.statistics);
      return data;
    } catch (err) {
      const message = err.message || 'Failed to fetch reports';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Export attendance data
   */
  const exportAttendance = useCallback(async (format = 'csv', params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const blob = await attendanceService.exportAttendance(format, params);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-export-${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Attendance exported successfully');
      return true;
    } catch (err) {
      const message = err.message || 'Failed to export attendance';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update filters and optionally refetch
   */
  const updateFilters = useCallback((newFilters, shouldFetch = true) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    if (shouldFetch) {
      fetchSessions(newFilters);
    }
  }, [fetchSessions]);

  /**
   * Clear current session
   */
  const clearSession = useCallback(() => {
    setCurrentSession(null);
    setAttendance([]);
  }, []);

  /**
   * Auto-fetch on mount if enabled
   */
  useEffect(() => {
    if (autoFetch && user) {
      fetchSessions();
    }
  }, [autoFetch, user]);

  return {
    // State
    sessions,
    currentSession,
    attendance,
    filters,
    loading,
    error,
    statistics,

    // Methods
    fetchSessions,
    fetchSession,
    createSession,
    markAttendance,
    getFilteredAttendance,
    getAttendanceReports,
    exportAttendance,
    updateFilters,
    clearSession,

    // Helper flags
    hasSessions: sessions.length > 0,
    hasAttendance: attendance.length > 0,
  };
};

/**
 * USAGE EXAMPLES:
 * 
 * // Basic usage
 * const { sessions, loading, fetchSessions } = useAttendance({ autoFetch: true });
 * 
 * // With filters
 * const { sessions, updateFilters } = useAttendance({
 *   autoFetch: true,
 *   filters: { date: '2025-01-20', ageGroup: '10-13' }
 * });
 * 
 * // Mark attendance
 * const { markAttendance } = useAttendance();
 * await markAttendance(sessionId, [
 *   { kid_id: 1, status: 'present' },
 *   { kid_id: 2, status: 'absent' },
 * ]);
 * 
 * // Get chronic absentees
 * const { getFilteredAttendance } = useAttendance();
 * const absentees = await getFilteredAttendance('chronic_absentee');
 * 
 * // Export attendance
 * const { exportAttendance } = useAttendance();
 * await exportAttendance('csv', { startDate: '2025-01-01', endDate: '2025-01-31' });
 */

export default useAttendance;