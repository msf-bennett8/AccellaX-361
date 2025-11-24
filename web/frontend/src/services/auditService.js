/**
 * File: web/frontend/src/services/auditService.js
 * Audit logs service
 */

import api, { getErrorMessage } from './api';

// Get audit logs
export const getAuditLogs = async (params = {}) => {
  try {
    const response = await api.get('/audit-logs', { params });
    return response.data;
  } catch (error) {
    console.error('❌ Audit logs error:', error);
    throw new Error(getErrorMessage(error));
  }
};

export default {
  getAuditLogs,
};
