// Location: src/services/loggerService.js
// Global application logging service

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const MAX_LOGS = 500;
const STORAGE_KEY = 'app_logs';

export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SYSTEM: 'system',
};

class LoggerService {
  constructor() {
    this.initialized = false;
    this.queue = [];
  }

  async init() {
    if (this.initialized) return;
    
    try {
      // Ensure storage exists
      const existing = await AsyncStorage.getItem(STORAGE_KEY);
      if (!existing) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      }
      
      this.initialized = true;
      console.log('✅ LoggerService initialized');
      
      // Process queued logs
      if (this.queue.length > 0) {
        console.log(`📝 Processing ${this.queue.length} queued logs`);
        for (const queuedLog of this.queue) {
          await this._saveLog(queuedLog);
        }
        this.queue = [];
      }
    } catch (error) {
      console.error('❌ LoggerService init failed:', error);
    }
  }

  async addLog(level, module, action, message, details = null) {
    const log = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      module,
      action,
      message,
      details,
      userId: await this._getUserId(),
      appVersion: '1.0.0', // Get from constants
      platform: Platform.OS,
    };

    if (!this.initialized) {
      // Queue the log if not initialized
      this.queue.push(log);
      console.log('📋 Log queued (service not initialized)');
      return;
    }

    await this._saveLog(log);
  }

  async _saveLog(log) {
    try {
      const storedLogs = await AsyncStorage.getItem(STORAGE_KEY);
      const logs = storedLogs ? JSON.parse(storedLogs) : [];
      
      logs.unshift(log); // Add to beginning
      
      // Keep only last MAX_LOGS entries (FIFO)
      const trimmedLogs = logs.slice(0, MAX_LOGS);
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedLogs));
      
      // Console output for development
      if (__DEV__) {
        const emoji = this._getLogEmoji(log.level);
        console.log(`${emoji} [${log.level.toUpperCase()}] ${log.module}: ${log.message}`);
        if (log.details) console.log('   Details:', log.details);
      }
    } catch (error) {
      console.error('❌ Failed to save log:', error);
    }
  }

  async _getUserId() {
    try {
      const userId = await AsyncStorage.getItem('currentUserId');
      return userId || 'anonymous';
    } catch {
      return 'anonymous';
    }
  }

  _getLogEmoji(level) {
    const emojis = {
      debug: '🐛',
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      system: '🔧',
    };
    return emojis[level] || 'ℹ️';
  }

  async getLogs() {
    try {
      const storedLogs = await AsyncStorage.getItem(STORAGE_KEY);
      return storedLogs ? JSON.parse(storedLogs) : [];
    } catch (error) {
      console.error('❌ Failed to get logs:', error);
      return [];
    }
  }

  async clearLogs() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      console.log('✅ Logs cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear logs:', error);
      return false;
    }
  }

  // Convenience methods
  debug(module, action, message, details) {
    return this.addLog(LOG_LEVELS.DEBUG, module, action, message, details);
  }

  info(module, action, message, details) {
    return this.addLog(LOG_LEVELS.INFO, module, action, message, details);
  }

  warning(module, action, message, details) {
    return this.addLog(LOG_LEVELS.WARNING, module, action, message, details);
  }

  error(module, action, message, details) {
    return this.addLog(LOG_LEVELS.ERROR, module, action, message, details);
  }

  system(module, action, message, details) {
    return this.addLog(LOG_LEVELS.SYSTEM, module, action, message, details);
  }
}

// Export singleton instance
const logger = new LoggerService();
export default logger;