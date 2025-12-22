// Location: /apps/assessment/src/contexts/ErrorContext.js
// Global error state management

import React, { createContext, useState, useContext, useEffect } from 'react';
import { ErrorSeverity } from '../utils/errorHandler';

const ErrorContext = createContext();

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within ErrorProvider');
  }
  return context;
};

export const ErrorProvider = ({ children }) => {
  const [errors, setErrors] = useState([]);
  const [currentError, setCurrentError] = useState(null);

  // Show error with auto-dismiss for non-critical errors
  const showError = (message, severity = ErrorSeverity.ERROR, duration = 5000) => {
    const error = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message,
      severity,
      timestamp: new Date().toISOString(),
      dismissed: false
    };

    setErrors(prev => [...prev, error]);
    setCurrentError(error);

    // Auto-dismiss non-critical errors
    if (severity !== ErrorSeverity.CRITICAL && duration > 0) {
      setTimeout(() => {
        dismissError(error.id);
      }, duration);
    }

    return error.id;
  };

  // Dismiss specific error
  const dismissError = (errorId) => {
    setErrors(prev =>
      prev.map(err =>
        err.id === errorId ? { ...err, dismissed: true } : err
      )
    );

    if (currentError?.id === errorId) {
      setCurrentError(null);
    }
  };

  // Clear all errors
  const clearErrors = () => {
    setErrors([]);
    setCurrentError(null);
  };

  // Get errors by severity
  const getErrorsBySeverity = (severity) => {
    return errors.filter(err => err.severity === severity && !err.dismissed);
  };

  // Get active errors (not dismissed)
  const getActiveErrors = () => {
    return errors.filter(err => !err.dismissed);
  };

  // Clean up old dismissed errors (keep last 50)
  useEffect(() => {
    if (errors.length > 50) {
      const activeErrors = errors.filter(err => !err.dismissed);
      const dismissedErrors = errors.filter(err => err.dismissed).slice(-20);
      setErrors([...activeErrors, ...dismissedErrors]);
    }
  }, [errors]);

  const value = {
    errors,
    currentError,
    showError,
    dismissError,
    clearErrors,
    getErrorsBySeverity,
    getActiveErrors,
    // Convenience methods for different severities
    showInfo: (message, duration) => showError(message, ErrorSeverity.INFO, duration),
    showWarning: (message, duration) => showError(message, ErrorSeverity.WARNING, duration),
    showCritical: (message) => showError(message, ErrorSeverity.CRITICAL, 0), // No auto-dismiss
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
};

export default ErrorContext;