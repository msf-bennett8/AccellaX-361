// Location: /apps/assessment/src/database/migrations/backfillYears.js
// Migration script to backfill missing year values based on assessment_date

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

/**
 * Calculate academic year from assessment date
 * Academic year runs from September to August
 * Example: 2024-09-01 to 2025-08-31 = "2024/2025"
 */
const getAcademicYearFromDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  
  // If September or later, academic year is current/next
  // If before September, academic year is previous/current
  if (month >= 9) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
};

/**
 * Backfill missing year values for all assessments
 */
export const backfillMissingYears = async () => {
  console.log('🔄 Starting year backfill migration...');
  
  try {
    if (isWeb) {
      // Web: Update assessmentWebDB
      const webDBString = await AsyncStorage.getItem('assessmentWebDB');
      if (!webDBString) {
        console.log('ℹ️ No web database found');
        return { success: true, updated: 0 };
      }
      
      const webDB = JSON.parse(webDBString);
      const assessments = webDB.assessments || [];
      
      let updatedCount = 0;
      
      // Update assessments with null year
      const updatedAssessments = assessments.map(assessment => {
        if (!assessment.year || assessment.year === 'null') {
          const academicYear = getAcademicYearFromDate(assessment.assessment_date);
          console.log(`✅ Backfilling year for assessment ${assessment.id}: ${academicYear}`);
          updatedCount++;
          
          return {
            ...assessment,
            year: academicYear,
            updated_at: new Date().toISOString(),
          };
        }
        return assessment;
      });
      
      webDB.assessments = updatedAssessments;
      await AsyncStorage.setItem('assessmentWebDB', JSON.stringify(webDB));
      
      console.log(`✅ Backfilled ${updatedCount} assessments in web storage`);
      return { success: true, updated: updatedCount };
      
    } else {
      // SQLite: Update directly
      const { getDatabase } = await import('../db');
      const db = getDatabase();
      
      // Get all assessments with null year
      const assessments = await db.getAllAsync(
        'SELECT id, assessment_date FROM assessments WHERE year IS NULL OR year = "null"'
      );
      
      console.log(`📊 Found ${assessments.length} assessments with missing year`);
      
      // Update each one
      for (const assessment of assessments) {
        const academicYear = getAcademicYearFromDate(assessment.assessment_date);
        
        await db.runAsync(
          'UPDATE assessments SET year = ?, updated_at = ? WHERE id = ?',
          [academicYear, new Date().toISOString(), assessment.id]
        );
        
        console.log(`✅ Backfilled year for assessment ${assessment.id}: ${academicYear}`);
      }
      
      console.log(`✅ Backfilled ${assessments.length} assessments in SQLite`);
      return { success: true, updated: assessments.length };
    }
  } catch (error) {
    console.error('❌ Year backfill migration failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if backfill has been run before
 */
export const hasBackfillBeenRun = async () => {
  try {
    const migrationFlag = await AsyncStorage.getItem('migration_year_backfill_v1');
    return migrationFlag === 'completed';
  } catch (error) {
    return false;
  }
};

/**
 * Mark backfill as completed
 */
export const markBackfillCompleted = async () => {
  try {
    await AsyncStorage.setItem('migration_year_backfill_v1', 'completed');
    await AsyncStorage.setItem('migration_year_backfill_date', new Date().toISOString());
  } catch (error) {
    console.error('Failed to mark backfill as completed:', error);
  }
};

/**
 * Run backfill migration (safe to call multiple times)
 */
export const runYearBackfillMigration = async () => {
  console.log('🔍 Checking if year backfill migration needed...');
  
  const alreadyRun = await hasBackfillBeenRun();
  
  if (alreadyRun) {
    console.log('✅ Year backfill migration already completed');
    return { success: true, skipped: true };
  }
  
  console.log('🚀 Running year backfill migration...');
  const result = await backfillMissingYears();
  
  if (result.success) {
    await markBackfillCompleted();
    console.log('✅ Year backfill migration completed successfully');
  }
  
  return result;
};

export default {
  backfillMissingYears,
  runYearBackfillMigration,
  hasBackfillBeenRun,
  getAcademicYearFromDate,
};