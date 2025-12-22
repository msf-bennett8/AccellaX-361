// Location: /apps/assessment/src/utils/validators.js
// Comprehensive validation functions for assessment data

import { getDatabase } from '../database/db';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWeb = Platform.OS === 'web';

/**
 * Validate kid_id format
 * Expected: timestamp_randomstring (e.g., 1764027045553_3j93r7fxo)
 */
export const validateKidId = (kidId) => {
  if (!kidId || typeof kidId !== 'string') {
    return {
      isValid: false,
      error: 'kid_id must be a non-empty string'
    };
  }

  // Check for correct format: timestamp_randomstring
  const correctFormat = /^\d{13}_[a-z0-9]+$/;
  const legacyFormat = /^\d{13}$/; // Just timestamp (legacy)

  if (correctFormat.test(kidId)) {
    return { isValid: true };
  }

  if (legacyFormat.test(kidId)) {
    return {
      isValid: true,
      warning: 'Legacy kid_id format (numeric only). Consider regenerating with random suffix.'
    };
  }

  return {
    isValid: false,
    error: `Malformed kid_id: ${kidId}. Expected format: timestamp_randomstring`
  };
};

/**
 * Validate week number (1-12)
 */
export const validateWeekNumber = (week) => {
  const weekNum = parseInt(week);
  
  if (isNaN(weekNum)) {
    return {
      isValid: false,
      error: 'Week number must be a valid number'
    };
  }

  if (weekNum < 1 || weekNum > 12) {
    return {
      isValid: false,
      error: 'Week number must be between 1 and 12'
    };
  }

  return { isValid: true };
};

/**
 * Validate metric value based on metric definition
 */
export const validateMetricValue = (value, metric) => {
  if (value === null || value === undefined || value === '') {
    return {
      isValid: false,
      error: 'Value is required'
    };
  }

  const numValue = parseFloat(value);

  if (isNaN(numValue)) {
    return {
      isValid: false,
      error: 'Value must be a valid number'
    };
  }

  // Check min value constraint
  if (metric.min_value !== null && metric.min_value !== undefined) {
    if (numValue < metric.min_value) {
      return {
        isValid: false,
        error: `Value must be at least ${metric.min_value}${metric.unit ? ` ${metric.unit}` : ''}`
      };
    }
  }

  // Check max value constraint
  if (metric.max_value !== null && metric.max_value !== undefined) {
    if (numValue > metric.max_value) {
      return {
        isValid: false,
        error: `Value must be at most ${metric.max_value}${metric.unit ? ` ${metric.unit}` : ''}`
      };
    }
  }

  // Type-specific validation
  if (metric.type === 'rating') {
    if (numValue < 1 || numValue > 10) {
      return {
        isValid: false,
        error: 'Rating must be between 1 and 10'
      };
    }
  }

  if (metric.type === 'counted' && numValue < 0) {
    return {
      isValid: false,
      error: 'Count cannot be negative'
    };
  }

  if (metric.type === 'timed' && numValue < 0) {
    return {
      isValid: false,
      error: 'Time cannot be negative'
    };
  }

  return { isValid: true };
};

/**
 * Check for duplicate assessments
 * (same kid + sport + date + type)
 */
export const checkDuplicateAssessment = async (kidId, sportId, date, assessmentType) => {
  try {
    if (isWeb) {
      const webDB = JSON.parse(await AsyncStorage.getItem('assessmentWebDB') || '{}');
      const assessments = webDB.assessments || [];
      
      const duplicate = assessments.find(a => 
        a.kid_id === kidId &&
        a.sport_id === sportId &&
        a.assessment_date === date &&
        a.assessment_type === assessmentType
      );

      if (duplicate) {
        return {
          isDuplicate: true,
          existingAssessmentId: duplicate.id,
          message: `Assessment already exists for this kid, sport, date, and type (ID: ${duplicate.id})`
        };
      }

      return { isDuplicate: false };
    }

    // Mobile SQLite check
    const db = getDatabase();
    const existing = await db.getFirstAsync(
      'SELECT id FROM assessments WHERE kid_id = ? AND sport_id = ? AND assessment_date = ? AND assessment_type = ?',
      [kidId, sportId, date, assessmentType]
    );

    if (existing) {
      return {
        isDuplicate: true,
        existingAssessmentId: existing.id,
        message: `Assessment already exists for this kid, sport, date, and type (ID: ${existing.id})`
      };
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error('Error checking duplicate assessment:', error);
    return {
      isDuplicate: false,
      error: 'Could not verify duplicate assessment'
    };
  }
};

/**
 * Validate assessment metadata
 */
export const validateAssessmentMetadata = (metadata) => {
  const errors = [];

  if (!metadata) {
    return {
      isValid: false,
      errors: ['Metadata is required']
    };
  }

  // Required fields
  if (!metadata.year) {
    errors.push('Academic year is required');
  }

  if (!metadata.term) {
    errors.push('Term is required');
  }

  if (!metadata.assessmentType) {
    errors.push('Assessment type is required');
  }

  if (!metadata.weekNumber) {
    errors.push('Week number is required');
  }

  // Validate week number if present
  if (metadata.weekNumber) {
    const weekValidation = validateWeekNumber(metadata.weekNumber);
    if (!weekValidation.isValid) {
      errors.push(weekValidation.error);
    }
  }

  // Validate term format
  if (metadata.term && !['Q1', 'Q2', 'Q3', 'Q4'].includes(metadata.term)) {
    errors.push('Term must be Q1, Q2, Q3, or Q4');
  }

  // Validate assessment type
  const validTypes = ['baseline', 'mid_term', 'final', 'ad_hoc'];
  if (metadata.assessmentType && !validTypes.includes(metadata.assessmentType)) {
    errors.push(`Assessment type must be one of: ${validTypes.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate all required fields before saving
 */
export const validateAssessmentData = (assessmentData) => {
  const errors = [];

  if (!assessmentData.kid_id) {
    errors.push('Kid ID is required');
  } else {
    const kidIdValidation = validateKidId(assessmentData.kid_id);
    if (!kidIdValidation.isValid) {
      errors.push(kidIdValidation.error);
    }
  }

  if (!assessmentData.sport_id) {
    errors.push('Sport ID is required');
  }

  if (!assessmentData.assessment_date) {
    errors.push('Assessment date is required');
  }

  // Validate metadata if present
  if (assessmentData.metadata) {
    const metadataValidation = validateAssessmentMetadata(assessmentData.metadata);
    if (!metadataValidation.isValid) {
      errors.push(...metadataValidation.errors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  validateKidId,
  validateWeekNumber,
  validateMetricValue,
  checkDuplicateAssessment,
  validateAssessmentMetadata,
  validateAssessmentData
};