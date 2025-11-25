// Location: /apps/assessment/src/services/firebaseService.js
// Firebase Service for AccellaX 361° Assessment App
// Handles all Firebase operations: Authentication, Firestore, Storage, Real-time sync

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fixed Academy ID for Assessment App
const FIXED_ACADEMY_ID = 'academy_accellax361_main';

// ========== HELPER FUNCTIONS ==========

/**
 * Get current user ID
 */
const getCurrentUserId = async () => {
  try {
    const userId = await AsyncStorage.getItem('currentUserId');
    return userId || auth.currentUser?.uid;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return auth.currentUser?.uid;
  }
};

/**
 * Convert Firestore Timestamp to ISO string
 */
const timestampToISO = (timestamp) => {
  if (!timestamp) return new Date().toISOString();
  if (timestamp.toDate) return timestamp.toDate().toISOString();
  return new Date(timestamp).toISOString();
};

/**
 * Create Firestore Timestamp from date
 */
const createTimestamp = (date) => {
  if (!date) return Timestamp.now();
  if (date instanceof Date) return Timestamp.fromDate(date);
  return Timestamp.fromDate(new Date(date));
};

// ========== SPORTS OPERATIONS ==========

/**
 * Get all sports for the academy
 */
export const getAllSports = async () => {
  try {
    const sportsRef = collection(db, `academies/${FIXED_ACADEMY_ID}/sports`);
    const snapshot = await getDocs(sportsRef);
    
    const sports = [];
    snapshot.forEach(doc => {
      sports.push({
        id: doc.id,
        ...doc.data(),
        created_at: timestampToISO(doc.data().created_at),
        updated_at: timestampToISO(doc.data().updated_at),
      });
    });
    
    return sports.filter(s => s.is_active !== 0);
  } catch (error) {
    console.error('Error getting sports:', error);
    throw error;
  }
};

/**
 * Get sport by ID
 */
export const getSportById = async (sportId) => {
  try {
    const sportRef = doc(db, `academies/${FIXED_ACADEMY_ID}/sports`, sportId);
    const sportSnap = await getDoc(sportRef);
    
    if (!sportSnap.exists()) {
      throw new Error('Sport not found');
    }
    
    return {
      id: sportSnap.id,
      ...sportSnap.data(),
      created_at: timestampToISO(sportSnap.data().created_at),
      updated_at: timestampToISO(sportSnap.data().updated_at),
    };
  } catch (error) {
    console.error('Error getting sport:', error);
    throw error;
  }
};

/**
 * Create new sport
 */
export const createSport = async (sportData) => {
  try {
    const userId = await getCurrentUserId();
    const sportId = sportData.id || `sport_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const sportRef = doc(db, `academies/${FIXED_ACADEMY_ID}/sports`, sportId);
    
    const newSport = {
      id: sportId,
      academy_id: FIXED_ACADEMY_ID,
      name: sportData.name,
      icon: sportData.icon || null,
      is_default: sportData.isDefault ? 1 : 0,
      is_active: 1,
      created_by: userId,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
      synced_at: Timestamp.now(),
    };
    
    await setDoc(sportRef, newSport);
    
    return {
      id: sportId,
      ...newSport,
      created_at: timestampToISO(newSport.created_at),
      updated_at: timestampToISO(newSport.updated_at),
    };
  } catch (error) {
    console.error('Error creating sport:', error);
    throw error;
  }
};

/**
 * Update sport
 */
export const updateSport = async (sportId, updates) => {
  try {
    const sportRef = doc(db, `academies/${FIXED_ACADEMY_ID}/sports`, sportId);
    
    await updateDoc(sportRef, {
      ...updates,
      updated_at: Timestamp.now(),
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating sport:', error);
    throw error;
  }
};

/**
 * Delete sport (soft delete)
 */
export const deleteSport = async (sportId) => {
  try {
    const sportRef = doc(db, `academies/${FIXED_ACADEMY_ID}/sports`, sportId);
    
    await updateDoc(sportRef, {
      is_active: 0,
      updated_at: Timestamp.now(),
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting sport:', error);
    throw error;
  }
};

// ========== METRICS OPERATIONS ==========

/**
 * Get all metrics for a sport
 */
export const getMetricsBySport = async (sportId) => {
  try {
    const metricsRef = collection(db, `academies/${FIXED_ACADEMY_ID}/metrics`);
    const q = query(metricsRef, where('sport_id', '==', sportId), orderBy('display_order'));
    const snapshot = await getDocs(q);
    
    const metrics = [];
    snapshot.forEach(doc => {
      metrics.push({
        id: doc.id,
        ...doc.data(),
        created_at: timestampToISO(doc.data().created_at),
      });
    });
    
    return metrics;
  } catch (error) {
    console.error('Error getting metrics:', error);
    throw error;
  }
};

/**
 * Get metrics by category
 */
export const getMetricsByCategory = async (sportId, category) => {
  try {
    const metricsRef = collection(db, `academies/${FIXED_ACADEMY_ID}/metrics`);
    const q = query(
      metricsRef, 
      where('sport_id', '==', sportId),
      where('category', '==', category),
      orderBy('display_order')
    );
    const snapshot = await getDocs(q);
    
    const metrics = [];
    snapshot.forEach(doc => {
      metrics.push({
        id: doc.id,
        ...doc.data(),
        created_at: timestampToISO(doc.data().created_at),
      });
    });
    
    return metrics;
  } catch (error) {
    console.error('Error getting metrics by category:', error);
    throw error;
  }
};

/**
 * Create new metric
 */
export const createMetric = async (metricData) => {
  try {
    const userId = await getCurrentUserId();
    const metricId = metricData.id || `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const metricRef = doc(db, `academies/${FIXED_ACADEMY_ID}/metrics`, metricId);
    
    const newMetric = {
      id: metricId,
      academy_id: FIXED_ACADEMY_ID,
      sport_id: metricData.sportId,
      name: metricData.name,
      category: metricData.category,
      type: metricData.type,
      unit: metricData.unit || null,
      min_value: metricData.minValue || null,
      max_value: metricData.maxValue || null,
      is_default: metricData.isDefault ? 1 : 0,
      display_order: metricData.displayOrder || 0,
      created_by: userId,
      created_at: Timestamp.now(),
      synced_at: Timestamp.now(),
    };
    
    await setDoc(metricRef, newMetric);
    
    return {
      id: metricId,
      ...newMetric,
      created_at: timestampToISO(newMetric.created_at),
    };
  } catch (error) {
    console.error('Error creating metric:', error);
    throw error;
  }
};

/**
 * Update metric
 */
export const updateMetric = async (metricId, updates) => {
  try {
    const metricRef = doc(db, `academies/${FIXED_ACADEMY_ID}/metrics`, metricId);
    
    await updateDoc(metricRef, {
      ...updates,
      updated_at: Timestamp.now(),
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating metric:', error);
    throw error;
  }
};

/**
 * Delete metric
 */
export const deleteMetric = async (metricId) => {
  try {
    const metricRef = doc(db, `academies/${FIXED_ACADEMY_ID}/metrics`, metricId);
    await deleteDoc(metricRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting metric:', error);
    throw error;
  }
};

// ========== ASSESSMENTS OPERATIONS ==========

/**
 * Get assessments for a kid
 */
export const getAssessmentsByKid = async (kidId) => {
  try {
    const assessmentsRef = collection(db, `academies/${FIXED_ACADEMY_ID}/assessments`);
    const q = query(assessmentsRef, where('kid_id', '==', kidId), orderBy('assessment_date', 'desc'));
    const snapshot = await getDocs(q);
    
    const assessments = [];
    snapshot.forEach(doc => {
      assessments.push({
        id: doc.id,
        ...doc.data(),
        assessment_date: doc.data().assessment_date,
        created_at: timestampToISO(doc.data().created_at),
        updated_at: timestampToISO(doc.data().updated_at),
      });
    });
    
    return assessments;
  } catch (error) {
    console.error('Error getting assessments:', error);
    throw error;
  }
};

/**
 * Get assessments by term
 */
export const getAssessmentsByTerm = async (term, year) => {
  try {
    const assessmentsRef = collection(db, `academies/${FIXED_ACADEMY_ID}/assessments`);
    const q = query(
      assessmentsRef, 
      where('term', '==', term),
      orderBy('assessment_date', 'desc')
    );
    const snapshot = await getDocs(q);
    
    const assessments = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Filter by year if provided
      if (!year || data.assessment_date?.includes(year.toString())) {
        assessments.push({
          id: doc.id,
          ...data,
          created_at: timestampToISO(data.created_at),
          updated_at: timestampToISO(data.updated_at),
        });
      }
    });
    
    return assessments;
  } catch (error) {
    console.error('Error getting assessments by term:', error);
    throw error;
  }
};

/**
 * Get assessment by ID
 */
export const getAssessmentById = async (assessmentId) => {
  try {
    const assessmentRef = doc(db, `academies/${FIXED_ACADEMY_ID}/assessments`, assessmentId);
    const assessmentSnap = await getDoc(assessmentRef);
    
    if (!assessmentSnap.exists()) {
      throw new Error('Assessment not found');
    }
    
    return {
      id: assessmentSnap.id,
      ...assessmentSnap.data(),
      created_at: timestampToISO(assessmentSnap.data().created_at),
      updated_at: timestampToISO(assessmentSnap.data().updated_at),
    };
  } catch (error) {
    console.error('Error getting assessment:', error);
    throw error;
  }
};

/**
 * Create new assessment
 */
export const createAssessment = async (assessmentData) => {
  try {
    const userId = await getCurrentUserId();
    const assessmentId = assessmentData.id || `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const assessmentRef = doc(db, `academies/${FIXED_ACADEMY_ID}/assessments`, assessmentId);
    
    const newAssessment = {
      id: assessmentId,
      academy_id: FIXED_ACADEMY_ID,
      kid_id: assessmentData.kidId,
      sport_id: assessmentData.sportId,
      assessment_date: assessmentData.assessmentDate,
      term: assessmentData.term,
      assessed_by: userId,
      notes: assessmentData.notes || null,
      status: assessmentData.status || 'completed',
      results: assessmentData.results || [],
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
      synced_at: Timestamp.now(),
    };
    
    await setDoc(assessmentRef, newAssessment);
    
    return {
      id: assessmentId,
      ...newAssessment,
      created_at: timestampToISO(newAssessment.created_at),
      updated_at: timestampToISO(newAssessment.updated_at),
    };
  } catch (error) {
    console.error('Error creating assessment:', error);
    throw error;
  }
};

/**
 * Update assessment
 */
export const updateAssessment = async (assessmentId, updates) => {
  try {
    const assessmentRef = doc(db, `academies/${FIXED_ACADEMY_ID}/assessments`, assessmentId);
    
    await updateDoc(assessmentRef, {
      ...updates,
      updated_at: Timestamp.now(),
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating assessment:', error);
    throw error;
  }
};

/**
 * Delete assessment
 */
export const deleteAssessment = async (assessmentId) => {
  try {
    const assessmentRef = doc(db, `academies/${FIXED_ACADEMY_ID}/assessments`, assessmentId);
    await deleteDoc(assessmentRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting assessment:', error);
    throw error;
  }
};

/**
 * Add result to assessment
 */
export const addAssessmentResult = async (assessmentId, result) => {
  try {
    const assessmentRef = doc(db, `academies/${FIXED_ACADEMY_ID}/assessments`, assessmentId);
    
    await updateDoc(assessmentRef, {
      results: arrayUnion({
        metric_id: result.metricId,
        value: result.value,
        percentile: result.percentile || null,
        notes: result.notes || null,
      }),
      updated_at: Timestamp.now(),
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error adding assessment result:', error);
    throw error;
  }
};

// ========== BENCHMARKS OPERATIONS ==========

/**
 * Get benchmarks for a metric
 */
export const getBenchmarksByMetric = async (metricId, ageGroup, gender) => {
  try {
    const benchmarksRef = collection(db, `academies/${FIXED_ACADEMY_ID}/benchmarks`);
    let q = query(benchmarksRef, where('metric_id', '==', metricId));
    
    if (ageGroup) {
      q = query(q, where('age_group', '==', ageGroup));
    }
    
    const snapshot = await getDocs(q);
    
    const benchmarks = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Filter by gender (null means applies to all)
      if (!gender || data.gender === gender || data.gender === null) {
        benchmarks.push({
          id: doc.id,
          ...data,
          created_at: timestampToISO(data.created_at),
        });
      }
    });
    
    return benchmarks;
  } catch (error) {
    console.error('Error getting benchmarks:', error);
    throw error;
  }
};

/**
 * Create benchmark
 */
export const createBenchmark = async (benchmarkData) => {
  try {
    const benchmarkId = `benchmark_${benchmarkData.metricId}_${benchmarkData.ageGroup}_${benchmarkData.gender || 'all'}`;
    const benchmarkRef = doc(db, `academies/${FIXED_ACADEMY_ID}/benchmarks`, benchmarkId);
    
    const newBenchmark = {
      id: benchmarkId,
      metric_id: benchmarkData.metricId,
      age_group: benchmarkData.ageGroup,
      gender: benchmarkData.gender || null,
      excellent_min: benchmarkData.excellentMin,
      good_min: benchmarkData.goodMin,
      fair_min: benchmarkData.fairMin,
      poor_max: benchmarkData.poorMax,
      source: benchmarkData.source || 'Custom',
      created_at: Timestamp.now(),
    };
    
    await setDoc(benchmarkRef, newBenchmark);
    
    return {
      id: benchmarkId,
      ...newBenchmark,
      created_at: timestampToISO(newBenchmark.created_at),
    };
  } catch (error) {
    console.error('Error creating benchmark:', error);
    throw error;
  }
};

// ========== GOALS OPERATIONS ==========

/**
 * Get goals for a kid
 */
export const getGoalsByKid = async (kidId) => {
  try {
    const goalsRef = collection(db, `academies/${FIXED_ACADEMY_ID}/goals`);
    const q = query(goalsRef, where('kid_id', '==', kidId), orderBy('target_date'));
    const snapshot = await getDocs(q);
    
    const goals = [];
    snapshot.forEach(doc => {
      goals.push({
        id: doc.id,
        ...doc.data(),
        created_at: timestampToISO(doc.data().created_at),
      });
    });
    
    return goals;
  } catch (error) {
    console.error('Error getting goals:', error);
    throw error;
  }
};

/**
 * Create goal
 */
export const createGoal = async (goalData) => {
  try {
    const userId = await getCurrentUserId();
    const goalId = goalData.id || `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const goalRef = doc(db, `academies/${FIXED_ACADEMY_ID}/goals`, goalId);
    
    const newGoal = {
      id: goalId,
      kid_id: goalData.kidId,
      metric_id: goalData.metricId,
      target_value: goalData.targetValue,
      target_date: goalData.targetDate,
      status: goalData.status || 'active',
      created_by: userId,
      created_at: Timestamp.now(),
      synced_at: Timestamp.now(),
    };
    
    await setDoc(goalRef, newGoal);
    
    return {
      id: goalId,
      ...newGoal,
      created_at: timestampToISO(newGoal.created_at),
    };
  } catch (error) {
    console.error('Error creating goal:', error);
    throw error;
  }
};

/**
 * Update goal status
 */
export const updateGoalStatus = async (goalId, status) => {
  try {
    const goalRef = doc(db, `academies/${FIXED_ACADEMY_ID}/goals`, goalId);
    
    await updateDoc(goalRef, {
      status: status,
      updated_at: Timestamp.now(),
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating goal status:', error);
    throw error;
  }
};

// ========== KIDS OPERATIONS (SHARED WITH ATTENDANCE) ==========

/**
 * Get all kids for the academy
 */
export const getAllKids = async () => {
  try {
    const kidsRef = collection(db, `academies/${FIXED_ACADEMY_ID}/kids`);
    const snapshot = await getDocs(kidsRef);
    
    const kids = [];
    snapshot.forEach(doc => {
      kids.push({
        id: doc.id,
        ...doc.data(),
        created_at: timestampToISO(doc.data().created_at),
        updated_at: timestampToISO(doc.data().updated_at),
      });
    });
    
    return kids.filter(k => k.status === 'active' || !k.status);
  } catch (error) {
    console.error('Error getting kids:', error);
    throw error;
  }
};

/**
 * Get kids by age group
 */
export const getKidsByAgeGroup = async (ageGroup) => {
  try {
    const kidsRef = collection(db, `academies/${FIXED_ACADEMY_ID}/kids`);
    const q = query(kidsRef, where('age_group', '==', ageGroup));
    const snapshot = await getDocs(q);
    
    const kids = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'active' || !data.status) {
        kids.push({
          id: doc.id,
          ...data,
          created_at: timestampToISO(data.created_at),
          updated_at: timestampToISO(data.updated_at),
        });
      }
    });
    
    return kids;
  } catch (error) {
    console.error('Error getting kids by age group:', error);
    throw error;
  }
};

/**
 * Get kid by ID
 */
export const getKidById = async (kidId) => {
  try {
    const kidRef = doc(db, `academies/${FIXED_ACADEMY_ID}/kids`, kidId);
    const kidSnap = await getDoc(kidRef);
    
    if (!kidSnap.exists()) {
      throw new Error('Kid not found');
    }
    
    return {
      id: kidSnap.id,
      ...kidSnap.data(),
      created_at: timestampToISO(kidSnap.data().created_at),
      updated_at: timestampToISO(kidSnap.data().updated_at),
    };
  } catch (error) {
    console.error('Error getting kid:', error);
    throw error;
  }
};

// ========== REAL-TIME LISTENERS ==========

/**
 * Listen to assessments changes for a kid
 */
export const subscribeToKidAssessments = (kidId, callback) => {
  const assessmentsRef = collection(db, `academies/${FIXED_ACADEMY_ID}/assessments`);
  const q = query(assessmentsRef, where('kid_id', '==', kidId), orderBy('assessment_date', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const assessments = [];
    snapshot.forEach(doc => {
      assessments.push({
        id: doc.id,
        ...doc.data(),
        created_at: timestampToISO(doc.data().created_at),
        updated_at: timestampToISO(doc.data().updated_at),
      });
    });
    callback(assessments);
  }, (error) => {
    console.error('Error in assessments listener:', error);
  });
};

/**
 * Listen to sports changes
 */
export const subscribeToSports = (callback) => {
  const sportsRef = collection(db, `academies/${FIXED_ACADEMY_ID}/sports`);
  
  return onSnapshot(sportsRef, (snapshot) => {
    const sports = [];
    snapshot.forEach(doc => {
      if (doc.data().is_active !== 0) {
        sports.push({
          id: doc.id,
          ...doc.data(),
          created_at: timestampToISO(doc.data().created_at),
          updated_at: timestampToISO(doc.data().updated_at),
        });
      }
    });
    callback(sports);
  }, (error) => {
    console.error('Error in sports listener:', error);
  });
};

// ========== BATCH OPERATIONS ==========

/**
 * Batch create default sports and metrics
 */
export const initializeDefaultSportsAndMetrics = async () => {
  try {
    const batch = writeBatch(db);
    const userId = await getCurrentUserId();
    
    // Default sports with metrics will be defined here
    // This is called during academy setup
    
    await batch.commit();
    console.log('✅ Default sports and metrics initialized');
    
    return { success: true };
  } catch (error) {
    console.error('Error initializing defaults:', error);
    throw error;
  }
};

// ========== EXPORT ALL ==========

export default {
  // Sports
  getAllSports,
  getSportById,
  createSport,
  updateSport,
  deleteSport,
  
  // Metrics
  getMetricsBySport,
  getMetricsByCategory,
  createMetric,
  updateMetric,
  deleteMetric,
  
  // Assessments
  getAssessmentsByKid,
  getAssessmentsByTerm,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  addAssessmentResult,
  
  // Benchmarks
  getBenchmarksByMetric,
  createBenchmark,
  
  // Goals
  getGoalsByKid,
  createGoal,
  updateGoalStatus,
  
  // Kids
  getAllKids,
  getKidsByAgeGroup,
  getKidById,
  
  // Real-time
  subscribeToKidAssessments,
  subscribeToSports,
  
  // Batch
  initializeDefaultSportsAndMetrics,
};