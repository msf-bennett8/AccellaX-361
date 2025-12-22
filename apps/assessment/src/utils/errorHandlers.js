// Location: /apps/assessment/src/utils/errorHandler.js
// Centralized error handling and logging (MERGED VERSION)

import AsyncStorage from '@react-native-async-storage/async-storage';

const ERROR_LOG_KEY = 'assessment_error_log';
const MAX_ERROR_LOGS = 100;

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

/**
 * Error categories
 */
export const ErrorCategory = {
  SYNC: 'sync',
  VALIDATION: 'validation',
  DATABASE: 'database',
  NETWORK: 'network',
  AUTH: 'auth',
  GENERAL: 'general',
};

/**
 * Log error with context to AsyncStorage
 */
export const logErrorWithContext = async (error, context = {}) => {
  try {
    const errorLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      message: error.message || String(error),
      stack: error.stack,
      context,
      severity: context.severity || ErrorSeverity.ERROR,
      category: context.category || ErrorCategory.GENERAL,
    };

    // Get existing logs
    const existingLogs = await getErrorLog();
    
    // Add new log at beginning
    const updatedLogs = [errorLog, ...existingLogs].slice(0, MAX_ERROR_LOGS);
    
    // Save back to storage
    await AsyncStorage.setItem(ERROR_LOG_KEY, JSON.stringify(updatedLogs));
    
    // Console log for debugging
    console.error(`[${errorLog.severity.toUpperCase()}] [${errorLog.category}]`, errorLog.message);
    if (errorLog.context) {
      console.error('Context:', errorLog.context);
    }
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
};

/**
 * Get all error logs
 */
export const getErrorLog = async () => {
  try {
    const logs = await AsyncStorage.getItem(ERROR_LOG_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error('Failed to get error logs:', error);
    return [];
  }
};

/**
 * Clear all error logs
 */
export const clearErrorLog = async () => {
  try {
    await AsyncStorage.removeItem(ERROR_LOG_KEY);
    console.log('✅ Error logs cleared');
  } catch (error) {
    console.error('Failed to clear error logs:', error);
  }
};

/**
 * Export error log for support/diagnostics
 */
export const exportErrorLog = async () => {
  try {
    const log = await getErrorLog();
    return JSON.stringify(log, null, 2);
  } catch (error) {
    console.error('Failed to export error log:', error);
    return null;
  }
};

/**
 * Handle sync errors specifically
 */
export const handleSyncError = async (error, context = {}) => {
  await logErrorWithContext(error, {
    ...context,
    type: 'sync_error',
    category: ErrorCategory.SYNC,
    severity: ErrorSeverity.WARNING,
  });

  // Return user-friendly message
  return showUserFriendlyError(error);
};

/**
 * Show user-friendly error message
 */
export const showUserFriendlyError = (error) => {
  const errorMessages = {
    // Network errors
    'Network request failed': 'No internet connection. Please check your network.',
    'Failed to fetch': 'Cannot connect to server. Check your internet connection.',
    'Request timeout': 'Connection timeout. Please try again.',
    'Firebase: Error': 'Connection error. Please try again.',
    
    // Database errors
    'UNIQUE constraint failed': 'This record already exists.',
    'FOREIGN KEY constraint failed': 'Related data is missing or invalid.',
    'NOT NULL constraint failed': 'Required field is missing.',
    'Not found': 'The requested data was not found.',
    
    // Validation errors
    'Invalid email': 'Please enter a valid email address.',
    'Invalid phone': 'Please enter a valid phone number.',
    'Required field': 'This field is required.',
    
    // Auth errors
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'Permission denied': 'You do not have permission to access this data.',
  };

  const message = error.message || String(error);
  
  for (const [key, friendlyMessage] of Object.entries(errorMessages)) {
    if (message.includes(key)) {
      return friendlyMessage;
    }
  }
  
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Attempt to recover from corrupt AsyncStorage data
 */
export const recoverFromCorruptData = async (key) => {
  try {
    console.log(`🔧 Attempting to recover corrupt data for key: ${key}`);
    
    // Try to read the data
    const data = await AsyncStorage.getItem(key);
    
    if (!data) {
      console.log('No data found, nothing to recover');
      return { success: true, recovered: false, data: null };
    }
    
    // Try to parse JSON
    try {
      const parsed = JSON.parse(data);
      console.log('✅ Data is valid JSON');
      return { success: true, recovered: false, data: parsed };
    } catch (parseError) {
      console.error('❌ JSON parse failed, attempting repair...');
      
      // Try to fix common JSON issues
      let repaired = data
        .replace(/[\u0000-\u001F]+/g, '') // Remove control characters
        .replace(/,\s*([}\]])/g, '$1')    // Remove trailing commas
        .trim();
      
      try {
        const parsed = JSON.parse(repaired);
        console.log('✅ Data repaired successfully');
        
        // Save repaired data
        await AsyncStorage.setItem(key, JSON.stringify(parsed));
        
        return { success: true, recovered: true, data: parsed };
      } catch (repairError) {
        console.error('❌ Could not repair data, removing corrupt key');
        
        // Log the corruption
        await logErrorWithContext(
          new Error(`Corrupt data removed: ${key}`),
          {
            category: ErrorCategory.DATABASE,
            severity: ErrorSeverity.ERROR,
            key,
            parseError: parseError.message,
          }
        );
        
        await AsyncStorage.removeItem(key);
        return { 
          success: true, 
          recovered: true, 
          data: null,
          message: 'Corrupt data was removed. Please re-enter the information.'
        };
      }
    }
  } catch (error) {
    console.error('Failed to recover corrupt data:', error);
    return {
      success: false,
      recovered: false,
      error: error.message,
    };
  }
};

/**
 * Create structured error object
 */
export const createError = (category, severity, message, context = {}) => {
  return {
    category,
    severity,
    message,
    context,
    timestamp: new Date().toISOString(),
    stack: new Error().stack,
  };
};

export default {
  logErrorWithContext,
  getErrorLog,
  clearErrorLog,
  exportErrorLog,
  handleSyncError,
  showUserFriendlyError,
  recoverFromCorruptData,
  createError,
  ErrorSeverity,
  ErrorCategory,
};