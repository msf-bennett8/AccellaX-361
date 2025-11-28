// Location: /apps/assessment/src/services/syncService.js
// Sync Service Wrapper for Assessment App

import {
  performFullSync,
  startAutoSync,
  stopAutoSync,
  getSyncStatus,
  isOnline,
  uploadKids,
  uploadSports,
  uploadMetrics,
  uploadAssessments,
  downloadKids,
  downloadSports,
  downloadMetrics,
  downloadAssessments,
  resetSyncStatus,
  getSyncDiagnostics,
} from '../database/sync';

// Re-export all sync functions for easier importing
export {
  performFullSync,
  startAutoSync,
  stopAutoSync,
  getSyncStatus,
  isOnline,
  uploadKids,
  uploadSports,
  uploadMetrics,
  uploadAssessments,
  downloadKids,
  downloadSports,
  downloadMetrics,
  downloadAssessments,
  resetSyncStatus,
  getSyncDiagnostics,
};

export default {
  performFullSync,
  startAutoSync,
  stopAutoSync,
  getSyncStatus,
  isOnline,
  uploadKids,
  uploadSports,
  uploadMetrics,
  uploadAssessments,
  downloadKids,
  downloadSports,
  downloadMetrics,
  downloadAssessments,
  resetSyncStatus,
  getSyncDiagnostics,
};