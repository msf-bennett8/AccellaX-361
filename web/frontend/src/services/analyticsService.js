/**
 * File: web/frontend/src/services/analyticsService.js
 * Analytics and reporting service
 */

import api, { getErrorMessage } from './api';

export const getDashboardAnalytics = async () => {
  try {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getAttendancePatterns = async (filters = {}) => {
  try {
    const response = await api.get('/analytics/attendance-patterns', { params: filters });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getSponsorshipAnalytics = async () => {
  try {
    const response = await api.get('/analytics/sponsorship');
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const exportAnalytics = async (format = 'pdf', params = {}) => {
  try {
    const response = await api.get('/analytics/export', {
      params: { format, ...params },
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export default {
  getDashboardAnalytics,
  getAttendancePatterns,
  getSponsorshipAnalytics,
  exportAnalytics,
};