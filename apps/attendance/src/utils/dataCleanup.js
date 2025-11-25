//src/utils/dataCleanup.js
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllKids, getAllSessions, deleteKid, deleteSession } from '../database/db';

const isWeb = Platform.OS === 'web';

/**
 * Remove all test data (kids with "Test" in name)
 */
export const removeTestData = async () => {
  try {
    console.log('🧹 Cleaning test data...');
    const kids = await getAllKids();
    
    let removedCount = 0;
    for (const kid of kids) {
      if (kid.name.toLowerCase().includes('test')) {
        await deleteKid(kid.id);
        removedCount++;
      }
    }
    
    console.log(`✅ Removed ${removedCount} test kids`);
    return { success: true, count: removedCount };
  } catch (error) {
    console.error('❌ Error removing test data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove duplicate kids (same name + age + age_group)
 */
export const removeDuplicateKids = async () => {
  try {
    console.log('🧹 Removing duplicate kids...');
    const kids = await getAllKids();
    
    const seen = new Map();
    const duplicates = [];
    
    for (const kid of kids) {
      const key = `${kid.name}-${kid.age}-${kid.age_group}`;
      
      if (seen.has(key)) {
        // Keep the older entry, remove the newer one
        const existing = seen.get(key);
        if (new Date(kid.created_at) > new Date(existing.created_at)) {
          duplicates.push(kid.id);
        } else {
          duplicates.push(existing.id);
          seen.set(key, kid);
        }
      } else {
        seen.set(key, kid);
      }
    }
    
    for (const id of duplicates) {
      await deleteKid(id);
    }
    
    console.log(`✅ Removed ${duplicates.length} duplicate kids`);
    return { success: true, count: duplicates.length };
  } catch (error) {
    console.error('❌ Error removing duplicates:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clear all data (DANGEROUS - requires confirmation)
 */
export const clearAllData = async () => {
  try {
    console.log('🗑️ Clearing all data...');
    
    if (isWeb) {
      // Clear AsyncStorage web database
      await AsyncStorage.removeItem('webDB');
      await AsyncStorage.removeItem('onboardingComplete');
      await AsyncStorage.removeItem('academyName');
      console.log('✅ Web database cleared');
    } else {
      // For native: delete all records
      const kids = await getAllKids();
      const sessions = await getAllSessions();
      
      for (const kid of kids) {
        await deleteKid(kid.id);
      }
      
      for (const session of sessions) {
        await deleteSession(session.id);
      }
      
      console.log('✅ Native database cleared');
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get database statistics
 */
export const getDatabaseStats = async () => {
  try {
    const kids = await getAllKids();
    const sessions = await getAllSessions();
    
    // Count by age group
    const ageGroupCounts = {};
    kids.forEach(kid => {
      ageGroupCounts[kid.age_group] = (ageGroupCounts[kid.age_group] || 0) + 1;
    });
    
    // Count duplicates
    const nameMap = new Map();
    kids.forEach(kid => {
      const key = `${kid.name}-${kid.age}`;
      nameMap.set(key, (nameMap.get(key) || 0) + 1);
    });
    const duplicateCount = Array.from(nameMap.values()).filter(count => count > 1).length;
    
    // Count test data
    const testDataCount = kids.filter(kid => 
      kid.name.toLowerCase().includes('test')
    ).length;
    
    return {
      totalKids: kids.length,
      totalSessions: sessions.length,
      ageGroupBreakdown: ageGroupCounts,
      duplicates: duplicateCount,
      testData: testDataCount,
      storageMode: isWeb ? 'AsyncStorage (Web)' : 'SQLite (Native)',
    };
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    return null;
  }
};

/**
 * Export database as JSON (for backup)
 */
export const exportDatabaseJSON = async () => {
  try {
    const kids = await getAllKids();
    const sessions = await getAllSessions();
    
    const exportData = {
      exportDate: new Date().toISOString(),
      academyName: await AsyncStorage.getItem('academyName'),
      data: {
        kids,
        sessions,
        // Note: attendance is linked via sessions
      },
    };
    
    return {
      success: true,
      data: JSON.stringify(exportData, null, 2),
    };
  } catch (error) {
    console.error('❌ Error exporting data:', error);
    return { success: false, error: error.message };
  }
};