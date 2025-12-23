/**
 * Smart Logging Manager for AccellaX Assessment App
 * 
 * Purpose: Keep console clean by hiding completed/working feature logs
 * while preserving errors, warnings, and logs for active debugging areas.
 * 
 * Usage:
 * 1. Import at top of App.js: import './utils/logManager';
 * 2. Set DEV_FOCUS areas below for what you're currently debugging
 * 3. Replace console.log with log.dev() for discretionary logs
 * 4. Keep console.error and console.warn as-is (always visible)
 */

// ============================================================================
// CONFIGURATION - Edit this section only
// ============================================================================

const CONFIG = {
  // Master switch - set to false to silence ALL non-critical logs
  LOGGING_ENABLED: true,

  // Environment detection
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  
  // DEV_FOCUS: Features you're actively debugging (only these will log)
  // Set to [] to see all logs, or add specific areas you're working on
  DEV_FOCUS: [
    // 'assessment_entry',    // AssessmentEntryScreen issues
    // 'kid_selection',       // SelectKidsScreen problems
    // 'sync',                // Firebase sync debugging
    // 'auth',                // Authentication issues
    // 'metrics',             // Metric input problems
    // 'navigation',          // Navigation flow issues
  ],

  // COMPLETED_FEATURES: Hide logs from these working components
  COMPLETED_FEATURES: [
    'auto_seed',           // Auto-seed is working
    'sports_loading',      // Sports load successfully
    'kids_loading',        // Kids load successfully
    'header',              // Header loads user correctly
    'firebase_init',       // Firebase initializes fine
    'database_init',       // Database schema works
    'storage',             // Local storage working
    'kid_enrollment',      // Kid enrollment parsing works
  ],

  // ALWAYS_SHOW: Critical logs that should always appear
  ALWAYS_SHOW: [
    'error',               // All errors
    'warning',             // All warnings
    'auth_failure',        // Authentication failures
    'sync_failure',        // Sync failures
    'navigation_error',    // Navigation errors
    'data_loss',           // Potential data loss
  ],
};

// ============================================================================
// LOGGING IMPLEMENTATION - Don't edit below unless modifying behavior
// ============================================================================

class LogManager {
  constructor(config) {
    this.config = config;
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug,
    };
  }

  /**
   * Determine if a log should be shown based on context
   */
  shouldShow(message, category = null) {
    // Production: Only errors and warnings
    if (this.config.IS_PRODUCTION) {
      return false;
    }

    // Master switch off: Only errors and warnings
    if (!this.config.LOGGING_ENABLED) {
      return false;
    }

    // Always show critical logs
    if (category && this.config.ALWAYS_SHOW.includes(category)) {
      return true;
    }

    // Check if message is from completed feature (hide it)
    const msgLower = String(message).toLowerCase();
    for (const feature of this.config.COMPLETED_FEATURES) {
      if (msgLower.includes(feature.replace('_', ' ')) || 
          msgLower.includes(feature)) {
        return false;
      }
    }

    // If DEV_FOCUS is set, only show those logs
    if (this.config.DEV_FOCUS.length > 0) {
      if (!category) return false;
      return this.config.DEV_FOCUS.includes(category);
    }

    // Default: show the log
    return true;
  }

  /**
   * Smart filter for existing console.log calls
   */
  filterLog(message, ...args) {
    if (this.shouldShow(message)) {
      this.originalConsole.log(message, ...args);
    }
  }

  /**
   * Development logs - for active debugging
   */
  dev(category, message, ...args) {
    if (this.shouldShow(message, category)) {
      this.originalConsole.log(`[${category.toUpperCase()}]`, message, ...args);
    }
  }

  /**
   * Critical logs - always shown
   */
  critical(message, ...args) {
    this.originalConsole.error('🚨 [CRITICAL]', message, ...args);
  }

  /**
   * Errors - always shown
   */
  error(message, ...args) {
    this.originalConsole.error('❌ [ERROR]', message, ...args);
  }

  /**
   * Warnings - always shown
   */
  warn(message, ...args) {
    this.originalConsole.warn('⚠️ [WARN]', message, ...args);
  }

  /**
   * Success logs - for completed operations
   */
  success(message, ...args) {
    if (this.shouldShow(message)) {
      this.originalConsole.log('✅', message, ...args);
    }
  }

  /**
   * Info logs - general information
   */
  info(message, ...args) {
    if (this.shouldShow(message)) {
      this.originalConsole.info('ℹ️', message, ...args);
    }
  }

  /**
   * Override native console methods
   */
  patchConsole() {
    // Keep error and warn as-is (always visible)
    // Only filter console.log, info, and debug
    
    console.log = (...args) => {
      this.filterLog(...args);
    };

    console.info = (...args) => {
      if (this.shouldShow(args[0])) {
        this.originalConsole.info(...args);
      }
    };

    console.debug = (...args) => {
      if (this.shouldShow(args[0])) {
        this.originalConsole.debug(...args);
      }
    };
  }

  /**
   * Restore original console methods
   */
  unpatchConsole() {
    console.log = this.originalConsole.log;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.info = this.originalConsole.info;
    console.debug = this.originalConsole.debug;
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

const logManager = new LogManager(CONFIG);

// Patch console methods to filter existing logs
logManager.patchConsole();

// Export log utility for use throughout the app
export const log = {
  // Development logs - only shown for DEV_FOCUS areas
  dev: (category, message, ...args) => logManager.dev(category, message, ...args),
  
  // Critical logs - always shown
  critical: (message, ...args) => logManager.critical(message, ...args),
  error: (message, ...args) => logManager.error(message, ...args),
  warn: (message, ...args) => logManager.warn(message, ...args),
  
  // Optional logs - shown unless filtered
  success: (message, ...args) => logManager.success(message, ...args),
  info: (message, ...args) => logManager.info(message, ...args),
  
  // Access original console if needed
  raw: logManager.originalConsole,
  
  // Toggle logging on/off
  enable: () => { CONFIG.LOGGING_ENABLED = true; },
  disable: () => { CONFIG.LOGGING_ENABLED = false; },
  
  // Focus on specific area
  focus: (...areas) => { 
    CONFIG.DEV_FOCUS = areas;
    console.log('🎯 DEV_FOCUS set to:', areas);
  },
  
  // Clear focus (show all logs)
  clearFocus: () => { 
    CONFIG.DEV_FOCUS = [];
    console.log('🎯 DEV_FOCUS cleared - showing all logs');
  },
  
  // Mark feature as completed (hide its logs)
  markComplete: (...features) => {
    CONFIG.COMPLETED_FEATURES.push(...features);
    console.log('✅ Marked as complete:', features);
  },
};

// Make log available globally for console access
if (typeof window !== 'undefined') {
  window.log = log;
}

export default logManager;