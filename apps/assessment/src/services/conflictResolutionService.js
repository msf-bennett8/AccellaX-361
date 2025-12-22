// Location: /apps/assessment/src/services/conflictResolutionService.js
// Service to manage sync conflicts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';
const CONFLICT_QUEUE_KEY = 'assessment_conflict_queue';

/**
 * Detect conflict between local and Firebase data
 * Uses version and timestamp comparison
 */
export const detectConflict = (localData, firebaseData) => {
  if (!localData || !firebaseData) {
    return { hasConflict: false };
  }

  // Compare versions (optimistic locking)
  const localVersion = localData.version || 1;
  const firebaseVersion = firebaseData.version || 1;

  // Compare timestamps
  const localTimestamp = new Date(localData.updated_at || localData.created_at).getTime();
  const firebaseTimestamp = firebaseData.updated_at?.toDate
    ? firebaseData.updated_at.toDate().getTime()
    : new Date(firebaseData.updated_at).getTime();

  // Conflict exists if:
  // 1. Versions don't match (someone else edited)
  // 2. Both have updates after last sync
  const hasConflict = 
    localVersion !== firebaseVersion || 
    Math.abs(localTimestamp - firebaseTimestamp) > 5000; // 5 second tolerance

  if (hasConflict) {
    return {
      hasConflict: true,
      localVersion,
      firebaseVersion,
      localTimestamp,
      firebaseTimestamp,
      localNewer: localTimestamp > firebaseTimestamp
    };
  }

  return { hasConflict: false };
};

/**
 * Queue a conflict for user resolution
 */
export const queueConflict = async (conflictData) => {
  try {
    const queue = await getConflictQueue();
    
    const conflict = {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...conflictData,
      queuedAt: new Date().toISOString(),
      status: 'pending'
    };

    queue.push(conflict);
    await AsyncStorage.setItem(CONFLICT_QUEUE_KEY, JSON.stringify(queue));

    console.log('📥 Conflict queued:', conflict.id);
    return { success: true, conflictId: conflict.id };
  } catch (error) {
    console.error('Error queuing conflict:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all pending conflicts
 */
export const getConflictQueue = async () => {
  try {
    const data = await AsyncStorage.getItem(CONFLICT_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting conflict queue:', error);
    return [];
  }
};

/**
 * Get conflict by ID
 */
export const getConflictById = async (conflictId) => {
  try {
    const queue = await getConflictQueue();
    return queue.find(c => c.id === conflictId);
  } catch (error) {
    console.error('Error getting conflict:', error);
    return null;
  }
};

/**
 * Resolve conflict with user's choice
 */
export const resolveConflict = async (conflictId, resolution) => {
  try {
    const queue = await getConflictQueue();
    const conflictIndex = queue.findIndex(c => c.id === conflictId);

    if (conflictIndex === -1) {
      return { success: false, error: 'Conflict not found' };
    }

    const conflict = queue[conflictIndex];

    // Apply resolution
    let resolvedData;
    switch (resolution) {
      case 'keep_local':
        resolvedData = conflict.localData;
        break;
      case 'keep_remote':
        resolvedData = conflict.firebaseData;
        break;
      case 'merge':
        resolvedData = mergeData(conflict.localData, conflict.firebaseData);
        break;
      default:
        return { success: false, error: 'Invalid resolution type' };
    }

    // Mark as resolved
    conflict.status = 'resolved';
    conflict.resolution = resolution;
    conflict.resolvedAt = new Date().toISOString();
    conflict.resolvedData = resolvedData;

    queue[conflictIndex] = conflict;
    await AsyncStorage.setItem(CONFLICT_QUEUE_KEY, JSON.stringify(queue));

    console.log('✅ Conflict resolved:', conflictId, resolution);
    return { success: true, resolvedData };
  } catch (error) {
    console.error('Error resolving conflict:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Merge local and remote data (smart merge)
 */
const mergeData = (localData, firebaseData) => {
  // Default strategy: take most recent fields
  const merged = { ...firebaseData };

  // Compare each field and take the newer value
  for (const key in localData) {
    if (key === 'updated_at' || key === 'version') continue;

    const localValue = localData[key];
    const firebaseValue = firebaseData[key];

    // If local has value and firebase doesn't, use local
    if (localValue && !firebaseValue) {
      merged[key] = localValue;
    }

    // For results array, merge both
    if (key === 'results' && Array.isArray(localValue) && Array.isArray(firebaseValue)) {
      merged[key] = mergeResults(localValue, firebaseValue);
    }
  }

  // Increment version
  merged.version = Math.max(localData.version || 1, firebaseData.version || 1) + 1;
  merged.updated_at = new Date().toISOString();

  return merged;
};

/**
 * Merge results arrays (combine unique metric results)
 */
const mergeResults = (localResults, firebaseResults) => {
  const merged = [...firebaseResults];

  localResults.forEach(localResult => {
    const existingIndex = merged.findIndex(r => r.metric_id === localResult.metric_id);
    
    if (existingIndex === -1) {
      // New result not in firebase, add it
      merged.push(localResult);
    } else {
      // Result exists - keep the one with more data or newer
      const existing = merged[existingIndex];
      if (!existing.value && localResult.value) {
        merged[existingIndex] = localResult;
      }
    }
  });

  return merged;
};

/**
 * Clear resolved conflicts older than X days
 */
export const clearResolvedConflicts = async (daysOld = 7) => {
  try {
    const queue = await getConflictQueue();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const filtered = queue.filter(conflict => {
      if (conflict.status !== 'resolved') return true;
      const resolvedDate = new Date(conflict.resolvedAt);
      return resolvedDate > cutoffDate;
    });

    await AsyncStorage.setItem(CONFLICT_QUEUE_KEY, JSON.stringify(filtered));
    console.log(`🧹 Cleared ${queue.length - filtered.length} old conflicts`);
    
    return { success: true, cleared: queue.length - filtered.length };
  } catch (error) {
    console.error('Error clearing conflicts:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get conflict statistics
 */
export const getConflictStats = async () => {
  try {
    const queue = await getConflictQueue();
    
    return {
      total: queue.length,
      pending: queue.filter(c => c.status === 'pending').length,
      resolved: queue.filter(c => c.status === 'resolved').length,
      oldest: queue.length > 0 ? queue[0].queuedAt : null,
      newest: queue.length > 0 ? queue[queue.length - 1].queuedAt : null
    };
  } catch (error) {
    console.error('Error getting conflict stats:', error);
    return {
      total: 0,
      pending: 0,
      resolved: 0,
      oldest: null,
      newest: null
    };
  }
};

/**
 * Clear all conflicts (use with caution)
 */
export const clearAllConflicts = async () => {
  try {
    await AsyncStorage.removeItem(CONFLICT_QUEUE_KEY);
    console.log('🗑️ All conflicts cleared');
    return { success: true };
  } catch (error) {
    console.error('Error clearing all conflicts:', error);
    return { success: false, error: error.message };
  }
};

export default {
  detectConflict,
  queueConflict,
  getConflictQueue,
  getConflictById,
  resolveConflict,
  clearResolvedConflicts,
  getConflictStats,
  clearAllConflicts
};