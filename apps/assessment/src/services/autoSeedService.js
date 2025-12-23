// Location: /apps/assessment/src/services/autoSeedService.js
// Auto-Seed Service - Seeds missing data on app startup (both local & Firebase)

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, setDoc, Timestamp } from 'firebase/firestore';
import { 
  getAllSports, 
  insertSport, 
  insertMetric,
  insertBenchmark,
  getDatabase 
} from '../database/db';
import { DEFAULT_SPORTS } from '../config/sports';
import { ALL_DEFAULT_METRICS } from '../config/metrics';
import { ALL_BENCHMARKS } from '../config/benchmarks';

const isWeb = Platform.OS === 'web';
const ACADEMY_ID = 'academy_accellax361_main';

// ========== LOGGING ==========

const log = (message, data = null) => {
  console.log(`🌱 [AutoSeed] ${message}`, data || '');
};

const logError = (message, error) => {
  console.error(`❌ [AutoSeed] ${message}`, error);
};

// ========== CHECK IF SEEDED ==========

/**
 * Check if local database has been seeded
 */
const isLocalSeeded = async () => {
  try {
    const flag = await AsyncStorage.getItem('local_db_seeded');
    return flag === 'true';
  } catch (error) {
    return false;
  }
};

/**
 * Mark local database as seeded
 */
const markLocalSeeded = async () => {
  try {
    await AsyncStorage.setItem('local_db_seeded', 'true');
    await AsyncStorage.setItem('local_seeded_at', new Date().toISOString());
    log('Local database marked as seeded');
  } catch (error) {
    logError('Failed to mark local as seeded', error);
  }
};

/**
 * Check if Firebase has been seeded
 */
const isFirebaseSeeded = async () => {
  try {
    const sportsRef = collection(db, `academies/${ACADEMY_ID}/sports`);
    const snapshot = await getDocs(sportsRef);
    
    // If we have 7 sports (including Fitness), consider it seeded
    return snapshot.size >= 7;
  } catch (error) {
    logError('Error checking Firebase seed status', error);
    return false;
  }
};

// ========== SEED LOCAL DATABASE ==========

/**
 * Seed sports to local database
 */
const seedLocalSports = async (userId) => {
  log('Seeding sports to local database...');
  
  try {
    const existingSports = await getAllSports();
    const existingSportIds = new Set(existingSports.map(s => s.id));
    
    let addedCount = 0;
    
    for (const sport of DEFAULT_SPORTS) {
      if (!existingSportIds.has(sport.id)) {
        await insertSport({
          id: sport.id,
          name: sport.name,
          icon: sport.icon,
          color: sport.color,
          isDefault: true,
        }, userId, true); // Skip Firebase sync (we'll sync separately)
        
        addedCount++;
        log(`  ✅ Added sport: ${sport.name}`);
      } else {
        log(`  ⏭️  Sport already exists: ${sport.name}`);
      }
    }
    
    log(`Local sports seeded: ${addedCount} added, ${existingSportIds.size} already existed`);
    return { success: true, added: addedCount };
    
  } catch (error) {
    logError('Failed to seed local sports', error);
    return { success: false, error: error.message };
  }
};

/**
 * Seed metrics to local database
 */
const seedLocalMetrics = async (userId) => {
  log('Seeding metrics to local database...');
  
  try {
    // Get all existing metrics
    const sports = await getAllSports();
    let existingMetrics = [];
    
    for (const sport of sports) {
      const { getMetricsBySport } = await import('../database/db');
      const sportMetrics = await getMetricsBySport(sport.id);
      existingMetrics = existingMetrics.concat(sportMetrics);
    }
    
    const existingMetricIds = new Set(existingMetrics.map(m => m.id));
    
    let addedCount = 0;
    
    for (const metric of ALL_DEFAULT_METRICS) {
      if (!existingMetricIds.has(metric.id)) {
        await insertMetric({
          id: metric.id,
          sportId: metric.sportId,
          name: metric.name,
          category: metric.category,
          type: metric.type,
          unit: metric.unit,
          minValue: metric.minValue,
          maxValue: metric.maxValue,
          isDefault: true,
          displayOrder: metric.displayOrder,
        }, userId, true); // Skip Firebase sync
        
        addedCount++;
        
        if (addedCount % 10 === 0) {
          log(`  ✅ Added ${addedCount} metrics so far...`);
        }
      }
    }
    
    log(`Local metrics seeded: ${addedCount} added, ${existingMetricIds.size} already existed`);
    return { success: true, added: addedCount };
    
  } catch (error) {
    logError('Failed to seed local metrics', error);
    return { success: false, error: error.message };
  }
};

/**
 * Seed benchmarks to local database
 */
const seedLocalBenchmarks = async () => {
  log('Seeding benchmarks to local database...');
  
  try {
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const benchmark of ALL_BENCHMARKS) {
      // ✅ CRITICAL FIX: Skip benchmarks with undefined metricId
      if (!benchmark.metricId) {
        skippedCount++;
        continue;
      }
      
      try {
        await insertBenchmark({
          metricId: benchmark.metricId,
          ageGroup: benchmark.ageGroup,
          gender: benchmark.gender,
          excellentMin: benchmark.excellent,
          goodMin: benchmark.good,
          fairMin: benchmark.fair,
          poorMax: benchmark.poor,
          source: benchmark.source || 'AccellaX Standard',
        }, true); // Skip Firebase sync
        
        addedCount++;
      } catch (error) {
        // Benchmark might already exist (duplicate key), skip silently
      }
    }
    
    if (skippedCount > 0) {
      log(`  ⚠️  Skipped ${skippedCount} invalid benchmarks`);
    }
    
    log(`Local benchmarks seeded: ${addedCount} added`);
    return { success: true, added: addedCount };
    
  } catch (error) {
    logError('Failed to seed local benchmarks', error);
    return { success: false, error: error.message };
  }
};

// ========== SEED FIREBASE ==========

/**
 * Seed sports to Firebase
 */
const seedFirebaseSports = async () => {
  log('Seeding sports to Firebase...');
  
  try {
    const sportsRef = collection(db, `academies/${ACADEMY_ID}/sports`);
    const snapshot = await getDocs(sportsRef);
    
    const existingSportIds = new Set();
    snapshot.forEach(doc => existingSportIds.add(doc.id));
    
    let addedCount = 0;
    
    for (const sport of DEFAULT_SPORTS) {
      if (!existingSportIds.has(sport.id)) {
        const sportRef = doc(db, `academies/${ACADEMY_ID}/sports`, sport.id);
        
        await setDoc(sportRef, {
          id: sport.id,
          academy_id: ACADEMY_ID,
          name: sport.name,
          icon: sport.icon,
          color: sport.color || '#2196F3',
          is_default: 1,
          is_active: 1,
          created_by: 'system',
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
          firebase_synced: 1,
        });
        
        addedCount++;
        log(`  ✅ Added sport to Firebase: ${sport.name}`);
      } else {
        log(`  ⏭️  Sport already exists in Firebase: ${sport.name}`);
      }
    }
    
    log(`Firebase sports seeded: ${addedCount} added, ${existingSportIds.size} already existed`);
    return { success: true, added: addedCount };
    
  } catch (error) {
    logError('Failed to seed Firebase sports', error);
    return { success: false, error: error.message };
  }
};

/**
 * Seed metrics to Firebase
 */
const seedFirebaseMetrics = async () => {
  log('Seeding metrics to Firebase...');
  
  try {
    const metricsRef = collection(db, `academies/${ACADEMY_ID}/metrics`);
    const snapshot = await getDocs(metricsRef);
    
    const existingMetricIds = new Set();
    snapshot.forEach(doc => existingMetricIds.add(doc.id));
    
    let addedCount = 0;
    
    for (const metric of ALL_DEFAULT_METRICS) {
      if (!existingMetricIds.has(metric.id)) {
        const metricRef = doc(db, `academies/${ACADEMY_ID}/metrics`, metric.id);
        
        await setDoc(metricRef, {
          id: metric.id,
          academy_id: ACADEMY_ID,
          sport_id: metric.sportId,
          name: metric.name,
          category: metric.category,
          type: metric.type,
          unit: metric.unit || null,
          min_value: metric.minValue || null,
          max_value: metric.maxValue || null,
          is_default: 1,
          display_order: metric.displayOrder || 0,
          created_by: 'system',
          created_at: Timestamp.now(),
          firebase_synced: 1,
        });
        
        addedCount++;
        
        if (addedCount % 10 === 0) {
          log(`  ✅ Added ${addedCount} metrics to Firebase so far...`);
        }
      }
    }
    
    log(`Firebase metrics seeded: ${addedCount} added, ${existingMetricIds.size} already existed`);
    return { success: true, added: addedCount };
    
  } catch (error) {
    logError('Failed to seed Firebase metrics', error);
    return { success: false, error: error.message };
  }
};

/**
 * Seed benchmarks to Firebase
 */
const seedFirebaseBenchmarks = async () => {
  log('Seeding benchmarks to Firebase...');
  
  try {
    const benchmarksRef = collection(db, `academies/${ACADEMY_ID}/benchmarks`);
    const snapshot = await getDocs(benchmarksRef);
    
    const existingBenchmarkIds = new Set();
    snapshot.forEach(doc => existingBenchmarkIds.add(doc.id));
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const benchmark of ALL_BENCHMARKS) {
      // ✅ CRITICAL FIX: Skip benchmarks with undefined metricId
      if (!benchmark.metricId) {
        skippedCount++;
        log(`  ⚠️  Skipped benchmark with undefined metricId: ${JSON.stringify(benchmark)}`);
        continue;
      }
      
      const benchmarkId = `${benchmark.metricId}_${benchmark.ageGroup}_${benchmark.gender || 'all'}`;
      
      if (!existingBenchmarkIds.has(benchmarkId)) {
        const benchmarkRef = doc(db, `academies/${ACADEMY_ID}/benchmarks`, benchmarkId);
        
        await setDoc(benchmarkRef, {
          id: benchmarkId,
          metric_id: benchmark.metricId,
          age_group: benchmark.ageGroup,
          gender: benchmark.gender || null,
          excellent_min: benchmark.excellent,
          good_min: benchmark.good,
          fair_min: benchmark.fair,
          poor_max: benchmark.poor,
          source: benchmark.source || 'AccellaX Standard',
          created_at: Timestamp.now(),
        });
        
        addedCount++;
      }
    }
    
    if (skippedCount > 0) {
      log(`  ⚠️  Skipped ${skippedCount} invalid benchmarks`);
    }
    
    log(`Firebase benchmarks seeded: ${addedCount} added, ${existingBenchmarkIds.size} already existed`);
    return { success: true, added: addedCount };
    
  } catch (error) {
    logError('Failed to seed Firebase benchmarks', error);
    return { success: false, error: error.message };
  }
};

// ========== MAIN AUTO-SEED FUNCTION ==========

/**
 * MASTER AUTO-SEED FUNCTION
 * Runs on app startup - seeds missing data intelligently
 */
export const autoSeedDatabase = async (userId = 'system') => {
  try {
    log('========== AUTO-SEED STARTED ==========');
    
    const results = {
      local: { sports: 0, metrics: 0, benchmarks: 0 },
      firebase: { sports: 0, metrics: 0, benchmarks: 0 },
      errors: [],
    };
    
    // Check if already seeded
    const localSeeded = await isLocalSeeded();
    
    if (!localSeeded) {
      log('Local database not seeded - seeding now...');
      
      // Seed local database
      const sportsResult = await seedLocalSports(userId);
      results.local.sports = sportsResult.added || 0;
      if (!sportsResult.success) results.errors.push(`Local sports: ${sportsResult.error}`);
      
      const metricsResult = await seedLocalMetrics(userId);
      results.local.metrics = metricsResult.added || 0;
      if (!metricsResult.success) results.errors.push(`Local metrics: ${metricsResult.error}`);
      
      const benchmarksResult = await seedLocalBenchmarks();
      results.local.benchmarks = benchmarksResult.added || 0;
      if (!benchmarksResult.success) results.errors.push(`Local benchmarks: ${benchmarksResult.error}`);
      
      // Mark as seeded
      await markLocalSeeded();
      
    } else {
      log('✅ Local database already seeded - skipping');
    }
    
    // Always check Firebase (in case user has multiple devices)
    try {
      // ✅ CRITICAL: Check if user is authenticated FIRST
      const { auth } = await import('../config/firebase');
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        log('⚠️ Firebase seeding skipped - user not authenticated yet');
        log('   Firebase will be seeded after login via background sync');
        // Don't add to errors - this is expected on first load
      } else {
        const firebaseSeeded = await isFirebaseSeeded();
        
        if (!firebaseSeeded) {
          log('Firebase not fully seeded - seeding now...');
          
          const fbSportsResult = await seedFirebaseSports();
          results.firebase.sports = fbSportsResult.added || 0;
          if (!fbSportsResult.success) results.errors.push(`Firebase sports: ${fbSportsResult.error}`);
          
          const fbMetricsResult = await seedFirebaseMetrics();
          results.firebase.metrics = fbMetricsResult.added || 0;
          if (!fbMetricsResult.success) results.errors.push(`Firebase metrics: ${fbMetricsResult.error}`);
          
          const fbBenchmarksResult = await seedFirebaseBenchmarks();
          results.firebase.benchmarks = fbBenchmarksResult.added || 0;
          if (!fbBenchmarksResult.success) results.errors.push(`Firebase benchmarks: ${fbBenchmarksResult.error}`);
          
        } else {
          log('✅ Firebase already fully seeded - skipping');
        }
      }
    } catch (fbError) {
      log('⚠️  Firebase seeding skipped (offline or error)');
      // Only add to errors if it's NOT an auth error
      if (!fbError.message.includes('permissions')) {
        results.errors.push(`Firebase: ${fbError.message}`);
      }
    }
    
    log('========== AUTO-SEED COMPLETED ==========');
    log('Results:', results);
    
    return {
      success: results.errors.length === 0,
      results,
      timestamp: new Date().toISOString(),
    };
    
  } catch (error) {
    logError('AUTO-SEED FAILED', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Force re-seed (for testing or manual reset)
 */
export const forceReseed = async (userId = 'system') => {
  log('🔄 FORCE RE-SEED - Clearing seed flags...');
  
  try {
    await AsyncStorage.removeItem('local_db_seeded');
    await AsyncStorage.removeItem('local_seeded_at');
    
    log('✅ Seed flags cleared - running auto-seed...');
    return await autoSeedDatabase(userId);
    
  } catch (error) {
    logError('Force re-seed failed', error);
    return { success: false, error: error.message };
  }
};

export default {
  autoSeedDatabase,
  forceReseed,
};