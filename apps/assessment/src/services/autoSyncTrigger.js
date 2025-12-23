// Location: /apps/assessment/src/services/autoSyncTrigger.js
// Automatic Sync Trigger - Syncs data on changes

import AsyncStorage from '@react-native-async-storage/async-storage';
import { performFullSync, isOnline } from '../database/sync';

let syncTimeout = null;
let pendingChanges = 0;

const SYNC_DELAY = 5000; // 5 seconds debounce
const MAX_PENDING_CHANGES = 10; // Force sync after 10 changes

/**
 * Trigger sync after data change (debounced)
 */
export const triggerSyncOnChange = async (changeType = 'data_change') => {
  try {
    // Increment pending changes counter
    pendingChanges++;
    
    //console.log(`🔄 [AutoSync] Data changed (${changeType}), pending: ${pendingChanges}`);
    
    // Check if we should sync immediately (max pending reached)
    if (pendingChanges >= MAX_PENDING_CHANGES) {
      console.log('🔄 [AutoSync] Max pending changes reached - forcing immediate sync');
      await forceSyncNow();
      return;
    }
    
    // Clear existing timeout
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }
    
    // Set new debounced timeout
    syncTimeout = setTimeout(async () => {
      //console.log('🔄 [AutoSync] Debounce timer expired - triggering sync');
      await forceSyncNow();
    }, SYNC_DELAY);
    
  } catch (error) {
    console.error('❌ [AutoSync] Error triggering sync:', error);
  }
};

/**
 * Force immediate sync
 */
const forceSyncNow = async () => {
  try {
    // Check if online
    const online = await isOnline();
    if (!online) {
      console.log('⚠️ [AutoSync] Offline - sync skipped');
      return;
    }
    
    // Get user ID
    const userId = await AsyncStorage.getItem('currentUserId');
    if (!userId) {
      console.log('⚠️ [AutoSync] No user ID - sync skipped');
      return;
    }
    
    //console.log('🔄 [AutoSync] Starting background sync...');
    
    // Perform sync
    const result = await performFullSync(userId);
    
    if (result.success) {
      console.log('✅ [AutoSync] Background sync completed successfully');
      pendingChanges = 0; // Reset counter
    } else {
      console.warn('⚠️ [AutoSync] Background sync failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ [AutoSync] Sync error:', error?.message || error);
    console.error('❌ [AutoSync] Full error:', JSON.stringify(error, null, 2));
  }
};

/**
 * Cancel pending sync
 */
export const cancelPendingSync = () => {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
    console.log('🔄 [AutoSync] Pending sync cancelled');
  }
};

/**
 * Get pending changes count
 */
export const getPendingChanges = () => pendingChanges;

/**
 * Reset pending changes counter
 */
export const resetPendingChanges = () => {
  pendingChanges = 0;
};

export default {
  triggerSyncOnChange,
  cancelPendingSync,
  getPendingChanges,
  resetPendingChanges,
};