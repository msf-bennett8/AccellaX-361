/**
 * File: web/frontend/src/services/attendanceService.js
 * Attendance management service
 */

import api, { getErrorMessage } from './api';

export const getSessions = async (filters = {}) => {
  try {
    const response = await api.get('/sessions', { params: filters });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getSession = async (sessionId) => {
  try {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const createSession = async (sessionData) => {
  try {
    const response = await api.post('/sessions', sessionData);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const markAttendance = async (sessionId, attendanceData) => {
  try {
    const response = await api.post(`/sessions/${sessionId}/attendance`, attendanceData);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getAttendanceFilters = async (filter) => {
  try {
    const response = await api.get('/attendance/filters', { params: { filter } });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getAttendanceReports = async (params = {}) => {
  try {
    const response = await api.get('/attendance/reports', { params });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const exportAttendance = async (format = 'csv', params = {}) => {
  try {
    const response = await api.get('/attendance/export', {
      params: { format, ...params },
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export default {
  getSessions,
  getSession,
  createSession,
  markAttendance,
  getAttendanceFilters,
  getAttendanceReports,
  exportAttendance,
};