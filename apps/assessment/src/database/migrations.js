// Location: /apps/assessment/src/database/migrations.js
// Database migration scripts for AccellaX 361° Assessment App

import { getDatabase } from './db';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWeb = Platform.OS === 'web';

// ========== MIGRATION TRACKER ==========

const MIGRATION_KEY = 'assessment_db_migrations_applied';

/**
 * Get list of applied migrations
 */
const getAppliedMigrations = async () => {
  try {
    const applied = await AsyncStorage.getItem(MIGRATION_KEY);
    return applied ? JSON.parse(applied) : [];
  } catch (error) {
    console.error('Error getting applied migrations:', error);
    return [];
  }
};

/**
 * Mark migration as applied
 */
const markMigrationApplied = async (migrationName) => {
  try {
    const applied = await getAppliedMigrations();
    if (!applied.includes(migrationName)) {
      applied.push(migrationName);
      await AsyncStorage.setItem(MIGRATION_KEY, JSON.stringify(applied));
    }
  } catch (error) {
    console.error('Error marking migration as applied:', error);
  }
};

/**
 * Check if migration has been applied
 */
const isMigrationApplied = async (migrationName) => {
  const applied = await getAppliedMigrations();
  return applied.includes(migrationName);
};

// ========== MIGRATION DEFINITIONS ==========

/**
 * Migration 001: Add sports_enrolled and primary_sport columns to kids table
 */
export const migration_001_add_sports_columns = async () => {
  const migrationName = '001_add_sports_columns';
  
  if (await isMigrationApplied(migrationName)) {
    console.log('⏭️ Migration already applied:', migrationName);
    return { success: true, skipped: true };
  }
  
  console.log('🔄 Running migration:', migrationName);
  
  if (isWeb) {
    // Web: AsyncStorage - data already has these fields from schema
    console.log('✅ Web: No migration needed (fields in schema)');
    await markMigrationApplied(migrationName);
    return { success: true };
  }
  
  // Mobile: SQLite
  try {
    const db = getDatabase();
    
    // Add sports_enrolled column
    try {
      await db.execAsync(`ALTER TABLE kids ADD COLUMN sports_enrolled TEXT;`);
      console.log('✅ Added sports_enrolled column');
    } catch (error) {
      if (!error.message.includes('duplicate column')) {
        throw error;
      }
    }
    
    // Add primary_sport column
    try {
      await db.execAsync(`ALTER TABLE kids ADD COLUMN primary_sport TEXT;`);
      console.log('✅ Added primary_sport column');
    } catch (error) {
      if (!error.message.includes('duplicate column')) {
        throw error;
      }
    }
    
    await markMigrationApplied(migrationName);
    console.log('✅ Migration completed:', migrationName);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Migration failed:', migrationName, error);
    return { success: false, error: error.message };
  }
};

/**
 * Migration 002: Add role column to users table
 */
export const migration_002_add_user_role = async () => {
  const migrationName = '002_add_user_role';
  
  if (await isMigrationApplied(migrationName)) {
    console.log('⏭️ Migration already applied:', migrationName);
    return { success: true, skipped: true };
  }
  
  console.log('🔄 Running migration:', migrationName);
  
  if (isWeb) {
    console.log('✅ Web: No migration needed (field in schema)');
    await markMigrationApplied(migrationName);
    return { success: true };
  }
  
  try {
    const db = getDatabase();
    
    try {
      await db.execAsync(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'coach';`);
      console.log('✅ Added role column to users table');
    } catch (error) {
      if (!error.message.includes('duplicate column')) {
        throw error;
      }
    }
    
    await markMigrationApplied(migrationName);
    console.log('✅ Migration completed:', migrationName);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Migration failed:', migrationName, error);
    return { success: false, error: error.message };
  }
};

/**
 * Migration 003: Create indexes for performance
 */
export const migration_003_create_indexes = async () => {
  const migrationName = '003_create_indexes';
  
  if (await isMigrationApplied(migrationName)) {
    console.log('⏭️ Migration already applied:', migrationName);
    return { success: true, skipped: true };
  }
  
  console.log('🔄 Running migration:', migrationName);
  
  if (isWeb) {
    console.log('✅ Web: No indexes needed (AsyncStorage)');
    await markMigrationApplied(migrationName);
    return { success: true };
  }
  
  try {
    const db = getDatabase();
    
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_kids_age_group ON kids(age_group);
      CREATE INDEX IF NOT EXISTS idx_kids_status ON kids(status);
      CREATE INDEX IF NOT EXISTS idx_sports_academy ON sports(academy_id);
      CREATE INDEX IF NOT EXISTS idx_metrics_sport ON metrics(sport_id);
      CREATE INDEX IF NOT EXISTS idx_metrics_category ON metrics(category);
      CREATE INDEX IF NOT EXISTS idx_assessments_kid ON assessments(kid_id);
      CREATE INDEX IF NOT EXISTS idx_assessments_sport ON assessments(sport_id);
      CREATE INDEX IF NOT EXISTS idx_assessments_academy ON assessments(academy_id);
      CREATE INDEX IF NOT EXISTS idx_results_assessment ON assessment_results(assessment_id);
      CREATE INDEX IF NOT EXISTS idx_benchmarks_metric ON benchmarks(metric_id, age_group);
      CREATE INDEX IF NOT EXISTS idx_goals_kid ON goals(kid_id);
    `);
    
    console.log('✅ Created performance indexes');
    await markMigrationApplied(migrationName);
    console.log('✅ Migration completed:', migrationName);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Migration failed:', migrationName, error);
    return { success: false, error: error.message };
  }
};

// ========== MIGRATION RUNNER ==========

/**
 * Run all pending migrations in order
 */
export const runMigrations = async () => {
  console.log('🔄 ========== RUNNING DATABASE MIGRATIONS ==========');
  
  const migrations = [
    { name: '001_add_sports_columns', func: migration_001_add_sports_columns },
    { name: '002_add_user_role', func: migration_002_add_user_role },
    { name: '003_create_indexes', func: migration_003_create_indexes },
  ];
  
  const results = {
    total: migrations.length,
    applied: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };
  
  for (const migration of migrations) {
    try {
      const result = await migration.func();
      
      if (result.success) {
        if (result.skipped) {
          results.skipped++;
        } else {
          results.applied++;
        }
      } else {
        results.failed++;
        results.errors.push({ name: migration.name, error: result.error });
      }
    } catch (error) {
      results.failed++;
      results.errors.push({ name: migration.name, error: error.message });
      console.error(`❌ Error running migration ${migration.name}:`, error);
    }
  }
  
  console.log('✅ ========== MIGRATIONS COMPLETE ==========');
  console.log(`   Total: ${results.total}`);
  console.log(`   Applied: ${results.applied}`);
  console.log(`   Skipped: ${results.skipped}`);
  console.log(`   Failed: ${results.failed}`);
  
  if (results.errors.length > 0) {
    console.error('   Errors:', results.errors);
  }
  
  return results;
};

/**
 * Reset migrations (use with caution!)
 */
export const resetMigrations = async () => {
  console.log('⚠️ Resetting all migrations...');
  try {
    await AsyncStorage.removeItem(MIGRATION_KEY);
    console.log('✅ Migrations reset');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to reset migrations:', error);
    return { success: false, error: error.message };
  }
};

export default {
  runMigrations,
  resetMigrations,
  getAppliedMigrations,
};
