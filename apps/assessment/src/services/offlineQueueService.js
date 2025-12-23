// Location: /apps/assessment/src/services/offlineQueueService.js
// Offline Queue Management Service - Phase 3.1

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getDatabase } from '../database/db';

const QUEUE_STORAGE_KEY = 'sync_queue';
const isWeb = Platform.OS === 'web';

/**
 * Operation types that can be queued
 */
export const OperationType = {
  UPLOAD_ASSESSMENT: 'upload_assessment',
  UPLOAD_KID: 'upload_kid',
  UPLOAD_SPORT: 'upload_sport',
  UPLOAD_METRIC: 'upload_metric',
  UPLOAD_NOTE: 'upload_note',
  UPDATE_ASSESSMENT: 'update_assessment',
  DELETE_ASSESSMENT: 'delete_assessment',
};

/**
 * Get all queued operations
 */
export const getQueuedOperations = async () => {
  try {
    if (isWeb) {
      const queue = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      return queue ? JSON.parse(queue) : [];
    }

    const db = getDatabase();
    if (!db) {
      console.log('⚠️ Database not initialized yet, returning empty queue');
      return [];
    }
    const operations = await db.getAllAsync(
      `SELECT * FROM sync_queue ORDER BY created_at ASC`
    );
    
    return operations || [];
  } catch (error) {
    console.error('Error getting queued operations:', error);
    return [];
  }
};

/**
 * Add operation to sync queue
 */
export const queueOperation = async (operation) => {
  try {
    const queueItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: operation.type,
      data: operation.data,
      retry_count: 0,
      last_error: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isWeb) {
      const queue = await getQueuedOperations();
      queue.push(queueItem);
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } else {
      const db = getDatabase();
      if (!db) {
        console.log('⚠️ Database not initialized yet, skipping queue operation');
        return { success: false, error: 'Database not initialized' };
      }
      await db.runAsync(
        `INSERT INTO sync_queue (id, type, data, retry_count, last_error, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          queueItem.id,
          queueItem.type,
          JSON.stringify(queueItem.data),
          0,
          null,
          queueItem.created_at,
          queueItem.updated_at,
        ]
      );
    }

    console.log(`✅ Operation queued: ${operation.type}`, queueItem.id);
    return { success: true, id: queueItem.id };
  } catch (error) {
    console.error('Error queueing operation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Retry a specific operation
 */
export const retryOperation = async (operationId) => {
  try {
    const operation = await getOperationById(operationId);
    
    if (!operation) {
      return { success: false, error: 'Operation not found' };
    }

    // Attempt to execute the operation
    const result = await executeOperation(operation);

    if (result.success) {
      // Remove from queue on success
      await removeFromQueue(operationId);
      return { success: true };
    } else {
      // Increment retry count and update error
      await updateOperationError(operationId, result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error retrying operation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Execute a queued operation
 */
const executeOperation = async (operation) => {
  try {
    const { type, data } = operation;

    // Import sync functions dynamically
    const syncModule = await import('../database/sync');

    switch (type) {
      case OperationType.UPLOAD_ASSESSMENT:
        return await syncModule.uploadAssessmentsToFirebase(data.userId, data.academyId);
      
      case OperationType.UPLOAD_KID:
        return await syncModule.uploadKids(data.userId);
      
      case OperationType.UPLOAD_SPORT:
        return await syncModule.uploadSports(data.userId);
      
      case OperationType.UPLOAD_METRIC:
        return await syncModule.uploadMetrics(data.userId);
      
      case OperationType.UPLOAD_NOTE:
        return await syncModule.uploadNotes(data.userId);
      
      default:
        return { success: false, error: `Unknown operation type: ${type}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get operation by ID
 */
const getOperationById = async (operationId) => {
  try {
    if (isWeb) {
      const queue = await getQueuedOperations();
      return queue.find(op => op.id === operationId);
    }

    const db = getDatabase();
    if (!db) {
      console.log('⚠️ Database not initialized yet');
      return null;
    }
    const operation = await db.getFirstAsync(
      `SELECT * FROM sync_queue WHERE id = ?`,
      [operationId]
    );

    if (operation && operation.data) {
      operation.data = JSON.parse(operation.data);
    }

    return operation;
  } catch (error) {
    console.error('Error getting operation:', error);
    return null;
  }
};

/**
 * Update operation error and increment retry count
 */
const updateOperationError = async (operationId, error) => {
  try {
    if (isWeb) {
      const queue = await getQueuedOperations();
      const index = queue.findIndex(op => op.id === operationId);
      
      if (index !== -1) {
        queue[index].retry_count += 1;
        queue[index].last_error = error;
        queue[index].updated_at = new Date().toISOString();
        await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
      }
    } else {
      const db = getDatabase();
      if (!db) {
        console.log('⚠️ Database not initialized yet, skipping error update');
        return;
      }
      await db.runAsync(
        `UPDATE sync_queue 
         SET retry_count = retry_count + 1, 
             last_error = ?, 
             updated_at = ? 
         WHERE id = ?`,
        [error, new Date().toISOString(), operationId]
      );
    }
  } catch (err) {
    console.error('Error updating operation error:', err);
  }
};

/**
 * Remove operation from queue
 */
const removeFromQueue = async (operationId) => {
  try {
    if (isWeb) {
      const queue = await getQueuedOperations();
      const filtered = queue.filter(op => op.id !== operationId);
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(filtered));
    } else {
      const db = getDatabase();
      if (!db) {
        console.log('⚠️ Database not initialized yet, skipping queue removal');
        return;
      }
      await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [operationId]);
    }

    console.log(`✅ Operation removed from queue: ${operationId}`);
  } catch (error) {
    console.error('Error removing from queue:', error);
  }
};

/**
 * Clear entire queue
 */
export const clearQueue = async () => {
  try {
    if (isWeb) {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify([]));
    } else {
      const db = getDatabase();
      if (!db) {
        console.log('⚠️ Database not initialized yet');
        return { success: false, error: 'Database not initialized' };
      }
      await db.runAsync(`DELETE FROM sync_queue`);
    }

    console.log('✅ Sync queue cleared');
    return { success: true };
  } catch (error) {
    console.error('Error clearing queue:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get queue statistics
 */
export const getQueueStats = async () => {
  try {
    const operations = await getQueuedOperations();

    const stats = {
      total: operations.length,
      byType: {},
      oldestAge: 0,
      failedCount: 0,
    };

    // Count by type
    operations.forEach(op => {
      stats.byType[op.type] = (stats.byType[op.type] || 0) + 1;
      
      // Count failed operations (retry_count > 0)
      if (op.retry_count > 0) {
        stats.failedCount++;
      }
    });

    // Calculate oldest operation age (in hours)
    if (operations.length > 0) {
      const oldest = operations[0];
      const ageMs = Date.now() - new Date(oldest.created_at).getTime();
      stats.oldestAge = Math.floor(ageMs / (1000 * 60 * 60)); // Convert to hours
    }

    return stats;
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return {
      total: 0,
      byType: {},
      oldestAge: 0,
      failedCount: 0,
    };
  }
};

/**
 * Retry all failed operations
 */
export const retryAllOperations = async () => {
  try {
    const operations = await getQueuedOperations();
    let successCount = 0;
    let failCount = 0;

    for (const operation of operations) {
      const result = await retryOperation(operation.id);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    return {
      success: true,
      successCount,
      failCount,
      total: operations.length,
    };
  } catch (error) {
    console.error('Error retrying all operations:', error);
    return {
      success: false,
      error: error.message,
      successCount: 0,
      failCount: 0,
    };
  }
};

/**
 * Auto-retry operations (called by background sync)
 */
export const autoRetryPendingOperations = async () => {
  try {
    const operations = await getQueuedOperations();
    
    // Filter operations that should be retried (retry_count < 3)
    const retryable = operations.filter(op => op.retry_count < 3);

    for (const operation of retryable) {
      await retryOperation(operation.id);
      
      // Add small delay between retries to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`✅ Auto-retry completed: ${retryable.length} operations processed`);
  } catch (error) {
    console.error('Error in auto-retry:', error);
  }
};

export default {
  OperationType,
  getQueuedOperations,
  queueOperation,
  retryOperation,
  clearQueue,
  getQueueStats,
  retryAllOperations,
  autoRetryPendingOperations,
};