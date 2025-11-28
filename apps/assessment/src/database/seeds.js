// Location: /apps/assessment/src/database/seeds.js
// Database Seeding Functions for AccellaX 361° Assessment App

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase, insertSport, insertMetric, insertBenchmark } from './db';
import { DEFAULT_SPORTS } from '../config/sports';
import { ALL_DEFAULT_METRICS } from '../config/metrics';
import { ALL_BENCHMARKS } from '../config/benchmarks';

const isWeb = Platform.OS === 'web';
const FIXED_ACADEMY_ID = 'academy_accellax361_main';

// ========== SEEDING STATUS CHECKS ==========

/**
 * Check if database has been seeded
 */
export const isDatabaseSeeded = async () => {
  try {
    if (isWeb) {
      const seeded = await AsyncStorage.getItem('assessment_db_seeded');
      return seeded === 'true';
    }
    
    const db = getDatabase();
    const result = await db.getFirstAsync('SELECT COUNT(*) as count FROM sports WHERE is_default = 1');
    return result && result.count > 0;
  } catch (error) {
    console.error('❌ Error checking seed status:', error);
    return false;
  }
};

/**
 * Mark database as seeded
 */
const markAsSeeded = async () => {
  try {
    if (isWeb) {
      await AsyncStorage.setItem('assessment_db_seeded', 'true');
      console.log('✅ Database marked as seeded (web)');
    } else {
      console.log('✅ Database marked as seeded (mobile)');
    }
  } catch (error) {
    console.error('❌ Error marking as seeded:', error);
  }
};

// ========== SEED SPORTS ==========

/**
 * Seed default sports into the database
 */
export const seedSports = async (userId = 'system') => {
  try {
    console.log('🌱 Seeding sports...');
    
    let successCount = 0;
    
    for (const sport of DEFAULT_SPORTS) {
      try {
        await insertSport({
          id: sport.id,
          name: sport.name,
          icon: sport.icon,
          isDefault: true,
        }, userId, true); // ✅ Skip Firebase sync during seeding
        
        successCount++;
        console.log(`  ✅ Seeded sport: ${sport.name}`);
      } catch (error) {
        // If sport already exists, skip
        if (error.message.includes('UNIQUE constraint') || error.message.includes('already exists')) {
          console.log(`  ⏭️  Sport already exists: ${sport.name}`);
        } else {
          console.error(`  ❌ Error seeding sport ${sport.name}:`, error.message);
        }
      }
    }
    
    console.log(`✅ Seeded ${successCount}/${DEFAULT_SPORTS.length} sports`);
    return { success: true, count: successCount };
    
  } catch (error) {
    console.error('❌ Error seeding sports:', error);
    return { success: false, error: error.message };
  }
};

// ========== SEED METRICS ==========

/**
 * Seed all default metrics (general fitness + sport-specific)
 */
export const seedMetrics = async (userId = 'system') => {
  try {
    console.log('🌱 Seeding metrics...');
    
    let successCount = 0;
    
    for (const metric of ALL_DEFAULT_METRICS) {
      try {
        await insertMetric({
          id: metric.id,
          sportId: metric.sportId || 'general', // General fitness metrics don't have sportId
          name: metric.name,
          category: metric.category,
          type: metric.type,
          unit: metric.unit || null,
          minValue: metric.minValue || null,
          maxValue: metric.maxValue || null,
          isDefault: true,
          displayOrder: metric.displayOrder || 0,
        }, userId, true); // ✅ Skip Firebase sync during seeding
        
        successCount++;
        console.log(`  ✅ Seeded metric: ${metric.name}`);
      } catch (error) {
        if (error.message.includes('UNIQUE constraint') || error.message.includes('already exists')) {
          console.log(`  ⏭️  Metric already exists: ${metric.name}`);
        } else {
          console.error(`  ❌ Error seeding metric ${metric.name}:`, error.message);
        }
      }
    }
    
    console.log(`✅ Seeded ${successCount}/${ALL_DEFAULT_METRICS.length} metrics`);
    return { success: true, count: successCount };
    
  } catch (error) {
    console.error('❌ Error seeding metrics:', error);
    return { success: false, error: error.message };
  }
};

// ========== SEED BENCHMARKS ==========

/**
 * Seed default performance benchmarks
 */
export const seedBenchmarks = async () => {
  try {
    console.log('🌱 Seeding benchmarks...');
    
    let successCount = 0;
    
    for (const benchmark of ALL_BENCHMARKS) {
      try {
        await insertBenchmark({
          metricId: benchmark.metricId || benchmark.category, // Rating benchmarks use 'category' field
          ageGroup: benchmark.ageGroup,
          gender: benchmark.gender,
          excellentMin: benchmark.excellent,
          goodMin: benchmark.good,
          fairMin: benchmark.fair,
          poorMax: benchmark.poor,
          source: benchmark.source || 'AccellaX Standard',
        }, true); // ✅ Skip Firebase sync during seeding
        
        successCount++;
      } catch (error) {
        if (error.message.includes('UNIQUE constraint') || error.message.includes('already exists')) {
          // Skip duplicate benchmarks
        } else {
          console.error(`  ❌ Error seeding benchmark:`, error.message);
        }
      }
    }
    
    console.log(`✅ Seeded ${successCount}/${ALL_BENCHMARKS.length} benchmarks`);
    return { success: true, count: successCount };
    
  } catch (error) {
    console.error('❌ Error seeding benchmarks:', error);
    return { success: false, error: error.message };
  }
};

// ========== SEED ACADEMY SETTINGS ==========

/**
 * Seed academy-wide settings
 */
export const seedAcademySettings = async () => {
  try {
    console.log('🌱 Seeding academy settings...');
    
    const settings = {
      age_groups: ['4-6', '7-9', '10-13', '13+'],
      assessment_terms: ['Q1', 'Q2', 'Q3', 'Q4'],
      default_sport: 'football',
      assessment_frequency: 'quarterly',
    };
    
    if (isWeb) {
      await AsyncStorage.setItem('academy_settings', JSON.stringify(settings));
    } else {
      const db = getDatabase();
      for (const [key, value] of Object.entries(settings)) {
        await db.runAsync(
          'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
          [key, typeof value === 'string' ? value : JSON.stringify(value)]
        );
      }
    }
    
    console.log('✅ Academy settings seeded');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error seeding academy settings:', error);
    return { success: false, error: error.message };
  }
};

// ========== MASTER SEED FUNCTION ==========

/**
 * MASTER SEED FUNCTION
 * Seeds all default data: Sports → Metrics → Benchmarks → Settings
 */
export const seedDatabase = async (userId = 'system') => {
  try {
    console.log('🌱🌱🌱 STARTING DATABASE SEEDING 🌱🌱🌱');
    
    // Check if already seeded
    const alreadySeeded = await isDatabaseSeeded();
    if (alreadySeeded) {
      console.log('✅ Database already seeded. Skipping.');
      return { success: true, message: 'Database already seeded' };
    }
    
    console.log('📦 Seeding fresh database...');
    
    // Step 1: Seed Sports
    const sportsResult = await seedSports(userId);
    if (!sportsResult.success) {
      throw new Error('Failed to seed sports');
    }
    
    // Step 2: Seed Metrics
    const metricsResult = await seedMetrics(userId);
    if (!metricsResult.success) {
      throw new Error('Failed to seed metrics');
    }
    
    // Step 3: Seed Benchmarks
    const benchmarksResult = await seedBenchmarks();
    if (!benchmarksResult.success) {
      throw new Error('Failed to seed benchmarks');
    }
    
    // Step 4: Seed Academy Settings
    const settingsResult = await seedAcademySettings();
    if (!settingsResult.success) {
      console.warn('⚠️  Failed to seed academy settings (non-critical)');
    }
    
    // Mark as seeded
    await markAsSeeded();
    
    console.log('🎉🎉🎉 DATABASE SEEDING COMPLETE 🎉🎉🎉');
    console.log(`📊 Summary:`);
    console.log(`  - Sports: ${sportsResult.count}/${DEFAULT_SPORTS.length}`);
    console.log(`  - Metrics: ${metricsResult.count}/${ALL_DEFAULT_METRICS.length}`);
    console.log(`  - Benchmarks: ${benchmarksResult.count}/${ALL_BENCHMARKS.length}`);
    
    return {
      success: true,
      message: 'Database seeded successfully',
      counts: {
        sports: sportsResult.count,
        metrics: metricsResult.count,
        benchmarks: benchmarksResult.count,
      },
    };
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR SEEDING DATABASE:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Reseed Database (force re-seed, useful for updates)
 */
export const reseedDatabase = async (userId = 'system') => {
  try {
    console.log('🔄 Force reseeding database...');
    
    // Clear seeded flag
    if (isWeb) {
      await AsyncStorage.removeItem('assessment_db_seeded');
    }
    
    // Run seeding
    return await seedDatabase(userId);
    
  } catch (error) {
    console.error('❌ Error reseeding database:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Seed only if not seeded (safe to call on every app start)
 */
export const seedDatabaseIfNeeded = async (userId = 'system') => {
  try {
    const alreadySeeded = await isDatabaseSeeded();
    
    if (alreadySeeded) {
      console.log('✅ Database already seeded');
      return { success: true, message: 'Already seeded' };
    }
    
    console.log('🌱 Database not seeded, seeding now...');
    return await seedDatabase(userId);
    
  } catch (error) {
    console.error('❌ Error in seedDatabaseIfNeeded:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get seeding status (for UI display)
 */
export const getSeedingStatus = async () => {
  try {
    const seeded = await isDatabaseSeeded();
    
    if (!seeded) {
      return {
        seeded: false,
        message: 'Database not seeded',
      };
    }
    
    // Count seeded items
    if (isWeb) {
      const webDB = JSON.parse(await AsyncStorage.getItem('assessmentWebDB') || '{}');
      return {
        seeded: true,
        counts: {
          sports: webDB.sports?.length || 0,
          metrics: webDB.metrics?.length || 0,
          benchmarks: webDB.benchmarks?.length || 0,
        },
      };
    }
    
    const db = getDatabase();
    const sportsCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM sports WHERE is_default = 1');
    const metricsCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM metrics WHERE is_default = 1');
    const benchmarksCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM benchmarks');
    
    return {
      seeded: true,
      counts: {
        sports: sportsCount?.count || 0,
        metrics: metricsCount?.count || 0,
        benchmarks: benchmarksCount?.count || 0,
      },
    };
    
  } catch (error) {
    console.error('❌ Error getting seeding status:', error);
    return { seeded: false, error: error.message };
  }
};

// ========== EXPORTS ==========

export default {
  seedDatabase,
  seedDatabaseIfNeeded,
  reseedDatabase,
  isDatabaseSeeded,
  getSeedingStatus,
  seedSports,
  seedMetrics,
  seedBenchmarks,
  seedAcademySettings,
};