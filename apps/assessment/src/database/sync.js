// src/database/sync.js - Assessment App Version
// Firebase Sync Manager for AccellaX 361° Assessment

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  Timestamp,
  writeBatch,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import {
  getAllKids,
  getAllSports,
  getMetricsBySport,
  getAllNotes,
  insertKid,
  insertSport,
  insertMetric,
  insertAssessment,
  insertAssessmentResult,
  insertBenchmark,
  insertGoal,
  insertNote,
  updateKid,
  updateKidStatus,
  updateSport,
  updateMetric,
  updateAssessment,
  updateNote,
  deleteKid,
  deleteSport,
  deleteMetric,
  deleteAssessment,
  deleteNote,
  getDatabase,
  createUser,
  getUserById,
  updateUser,
  getAssessmentResults,
} from './db';

const isWeb = Platform.OS === 'web';

// ========== ENHANCED DEBUGGING ==========

const DEBUG_MODE = true; // Set to false in production

const debugLog = (category, message, data = null) => {
  if (!DEBUG_MODE) return;
  
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [ASSESSMENT_SYNC] [${category}] ${message}`;
  
  console.log(logMessage);
  if (data) {
    console.log('Data:', JSON.stringify(data, null, 2));
  }
  
  storeSyncLog(category, message, data);
};

const debugError = (category, message, error) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [ASSESSMENT_SYNC] [${category}] ❌ ${message}`, error);
  
  storeSyncLog(category, `ERROR: ${message}`, {
    error: error.message,
    stack: error.stack,
  });
};

// Store sync logs in AsyncStorage for debugging
const storeSyncLog = async (category, message, data) => {
  try {
    const logs = await AsyncStorage.getItem('assessmentSyncDebugLogs');
    const logArray = logs ? JSON.parse(logs) : [];
    
    logArray.push({
      timestamp: new Date().toISOString(),
      category,
      message,
      data,
    });
    
    // Keep only last 100 logs
    if (logArray.length > 100) {
      logArray.shift();
    }
    
    await AsyncStorage.setItem('assessmentSyncDebugLogs', JSON.stringify(logArray));
  } catch (error) {
    console.warn('Failed to store debug log:', error);
  }
};

// Export function to retrieve debug logs
export const getSyncDebugLogs = async () => {
  try {
    const logs = await AsyncStorage.getItem('assessmentSyncDebugLogs');
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error('Failed to retrieve debug logs:', error);
    return [];
  }
};

// Export function to clear debug logs
export const clearSyncDebugLogs = async () => {
  try {
    await AsyncStorage.removeItem('assessmentSyncDebugLogs');
    debugLog('SYSTEM', 'Debug logs cleared');
  } catch (error) {
    console.error('Failed to clear debug logs:', error);
  }
};

// ========== SYNC CONFIGURATION ==========

const SYNC_CONFIG = {
  batchSize: 50,
  retryAttempts: 3,
  retryDelay: 2000,
  syncInterval: 300000, // 5 minutes
  conflictResolution: 'last-write-wins',
};

// ========== SYNC STATUS TRACKING ==========

let isSyncing = false;
let lastSyncTimestamp = null;
let syncErrors = [];

export const getSyncStatus = () => ({
  isSyncing,
  lastSyncTimestamp,
  errors: syncErrors,
});

// ========== NETWORK DETECTION ==========

export const isOnline = async () => {
  if (Platform.OS === 'web') {
    return navigator.onLine;
  }
  
  try {
    const NetInfo = require('@react-native-community/netinfo');
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  } catch (error) {
    debugLog('NETWORK', 'NetInfo not available, assuming online');
    return true;
  }
};

// ========== ACADEMY ID MANAGEMENT ==========

export const getAcademyId = async () => {
  let academyId = await AsyncStorage.getItem('academyId');
  
  if (!academyId) {
    academyId = 'academy_accellax361_main';
    await AsyncStorage.setItem('academyId', academyId);
    debugLog('ACADEMY', 'Using fixed academy ID', { academyId });
  } else {
    debugLog('ACADEMY', 'Retrieved academy ID', { academyId });
  }
  
  return academyId;
};

// ========== USER VALIDATION ==========

const validateUserExistsInFirebase = async (userId) => {
  debugLog('USER_VALIDATION', 'Checking if user exists in Firebase', { userId });
  
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const exists = userSnap.exists();
    
    debugLog('USER_VALIDATION', `User ${exists ? 'EXISTS' : 'DOES NOT EXIST'}`, { userId, exists });
    
    return exists;
  } catch (error) {
    debugError('USER_VALIDATION', 'Error checking user existence', error);
    return false;
  }
};

// ========== SYNC METADATA ==========

const markAsSynced = async (table, id) => {
  debugLog('SYNC_METADATA', `Marking ${table} record as synced`, { table, id });
  
  if (isWeb) {
    const syncKey = `synced_${table}_${id}`;
    await AsyncStorage.setItem(syncKey, Date.now().toString());
    
    try {
      const webDB = JSON.parse(await AsyncStorage.getItem('assessmentWebDB') || '{}');
      if (webDB[table]) {
        const index = webDB[table].findIndex(r => r.id === id);
        if (index !== -1) {
          webDB[table][index].firebase_synced = 1;
          await AsyncStorage.setItem('assessmentWebDB', JSON.stringify(webDB));
          debugLog('SYNC_METADATA', 'Updated firebase_synced flag in webDB', { table, id });
        }
      }
    } catch (error) {
      debugError('SYNC_METADATA', 'Failed to update firebase_synced flag', error);
    }
  } else {
    const db = getDatabase();
    await db.runAsync(
      `UPDATE ${table} SET firebase_synced = 1 WHERE id = ?`,
      [id]
    );
  }
};

const getUnsyncedRecords = async (table, getAllFunction) => {
  debugLog('SYNC_METADATA', `Getting unsynced records from ${table}`);
  
  if (isWeb) {
    const allRecords = await getAllFunction();
    const unsynced = [];
    
    for (const record of allRecords) {
      const syncKey = `synced_${table}_${record.id}`;
      const synced = await AsyncStorage.getItem(syncKey);
      if (!synced && record.firebase_synced !== 1) {
        unsynced.push(record);
      }
    }
    
    debugLog('SYNC_METADATA', `Found ${unsynced.length} unsynced ${table} records`);
    return unsynced;
  } else {
    const db = getDatabase();
    const unsynced = await db.getAllAsync(
      `SELECT * FROM ${table} WHERE firebase_synced = 0`
    );
    debugLog('SYNC_METADATA', `Found ${unsynced.length} unsynced ${table} records`);
    return unsynced;
  }
};

// ========== UPLOAD TO FIREBASE ==========

const uploadUserProfileToFirebase = async (userId) => {
  debugLog('USER_UPLOAD', 'Starting user profile upload', { userId });
  
  try {
    const userProfile = await getUserById(userId);
    
    if (!userProfile) {
      debugLog('USER_UPLOAD', 'No user profile found locally', { userId });
      return { success: false, error: 'No user profile found' };
    }
    
    debugLog('USER_UPLOAD', 'Retrieved local user profile', {
      userId,
      email: userProfile.email,
      fullName: userProfile.full_name,
    });
    
    if (userId.startsWith('offline_')) {
      debugLog('USER_UPLOAD', 'Offline account - cannot sync without Firebase Auth', { userId });
      return { 
        success: false, 
        error: 'Offline account requires login',
        needsAuth: true
      };
    }
    
    const userRef = doc(db, 'users', userId);
    const userData = {
      id: userId,
      full_name: userProfile.full_name,
      email: userProfile.email,
      username: userProfile.username || '',
      phone: userProfile.phone || '',
      auth_method: userProfile.auth_method || 'accellax',
      role: userProfile.role || 'coach',
      avatar_base64: userProfile.avatar_base64 || null,
      created_at: Timestamp.fromDate(new Date(userProfile.created_at)),
      updated_at: Timestamp.now(),
      synced_at: Timestamp.now(),
    };
    
    await setDoc(userRef, userData, { merge: true });
    await updateUser(userId, { firebase_synced: 1 });
    
    debugLog('USER_UPLOAD', 'User profile uploaded successfully', { userId });
    return { success: true };
    
  } catch (error) {
    debugError('USER_UPLOAD', 'Failed to upload user profile', error);
    return { success: false, error: error.message };
  }
};

// ✅ NEW: Upload Sports to Firebase
const uploadSportsToFirebase = async (userId, academyId) => {
  debugLog('SPORTS_UPLOAD', 'Starting sports upload', { userId, academyId });
  
  try {
    const unsyncedSports = await getUnsyncedRecords('sports', getAllSports);
    const academySports = unsyncedSports.filter(s => s.academy_id === academyId);
    
    debugLog('SPORTS_UPLOAD', 'Found sports to upload', { 
      totalUnsynced: unsyncedSports.length,
      forThisAcademy: academySports.length 
    });
    
    if (academySports.length === 0) {
      return { success: true, count: 0 };
    }
    
    const batch = writeBatch(db);
    let uploadCount = 0;
    
    for (const sport of academySports) {
      const sportRef = doc(db, `academies/${academyId}/sports`, sport.id.toString());
      
      const sportData = {
        id: sport.id.toString(),
        academy_id: sport.academy_id,
        name: sport.name,
        icon: sport.icon || null,
        is_default: sport.is_default || 0,
        is_active: sport.is_active || 1,
        created_by: sport.created_by || userId,
        created_at: Timestamp.fromDate(new Date(sport.created_at)),
        updated_at: Timestamp.now(),
        synced_at: Timestamp.now(),
      };
      
      debugLog('SPORTS_UPLOAD', 'Adding sport to batch', { 
        sportId: sport.id, 
        sportName: sport.name 
      });
      
      batch.set(sportRef, sportData);
      uploadCount++;
      
      if (uploadCount % SYNC_CONFIG.batchSize === 0) {
        await batch.commit();
      }
    }
    
    if (uploadCount % SYNC_CONFIG.batchSize !== 0) {
      await batch.commit();
    }
    
    for (const sport of academySports) {
      await markAsSynced('sports', sport.id);
    }
    
    debugLog('SPORTS_UPLOAD', 'Sports upload completed', { uploadCount });
    return { success: true, count: uploadCount };
    
  } catch (error) {
    debugError('SPORTS_UPLOAD', 'Sports upload failed', error);
    return { success: false, error: error.message, count: 0 };
  }
};

// ✅ NEW: Upload Metrics to Firebase
const uploadMetricsToFirebase = async (userId, academyId) => {
  debugLog('METRICS_UPLOAD', 'Starting metrics upload', { userId, academyId });
  
  try {
    // Get all sports first
    const sports = await getAllSports();
    let allMetrics = [];
    
    for (const sport of sports) {
      const sportMetrics = await getMetricsBySport(sport.id);
      allMetrics = allMetrics.concat(sportMetrics);
    }
    
    const unsyncedMetrics = allMetrics.filter(m => m.firebase_synced !== 1);
    const academyMetrics = unsyncedMetrics.filter(m => m.academy_id === academyId);
    
    debugLog('METRICS_UPLOAD', 'Found metrics to upload', { 
      totalUnsynced: unsyncedMetrics.length,
      forThisAcademy: academyMetrics.length 
    });
    
    if (academyMetrics.length === 0) {
      return { success: true, count: 0 };
    }
    
    const batch = writeBatch(db);
    let uploadCount = 0;
    
    for (const metric of academyMetrics) {
      const metricRef = doc(db, `academies/${academyId}/metrics`, metric.id.toString());
      
      const metricData = {
        id: metric.id.toString(),
        academy_id: metric.academy_id,
        sport_id: metric.sport_id.toString(),
        name: metric.name,
        category: metric.category,
        type: metric.type,
        unit: metric.unit || null,
        min_value: metric.min_value || null,
        max_value: metric.max_value || null,
        is_default: metric.is_default || 0,
        display_order: metric.display_order || 0,
        created_by: metric.created_by || userId,
        created_at: Timestamp.fromDate(new Date(metric.created_at)),
        synced_at: Timestamp.now(),
      };
      
      debugLog('METRICS_UPLOAD', 'Adding metric to batch', { 
        metricId: metric.id, 
        metricName: metric.name 
      });
      
      batch.set(metricRef, metricData);
      uploadCount++;
      
      if (uploadCount % SYNC_CONFIG.batchSize === 0) {
        await batch.commit();
      }
    }
    
    if (uploadCount % SYNC_CONFIG.batchSize !== 0) {
      await batch.commit();
    }
    
    for (const metric of academyMetrics) {
      await markAsSynced('metrics', metric.id);
    }
    
    debugLog('METRICS_UPLOAD', 'Metrics upload completed', { uploadCount });
    return { success: true, count: uploadCount };
    
  } catch (error) {
    debugError('METRICS_UPLOAD', 'Metrics upload failed', error);
    return { success: false, error: error.message, count: 0 };
  }
};

// ✅ NEW: Upload Assessments to Firebase
const uploadAssessmentsToFirebase = async (userId, academyId) => {
  debugLog('ASSESSMENTS_UPLOAD', 'Starting assessments upload', { userId, academyId });
  
  try {
    const { getAllAsync } = getDatabase ? { getAllAsync: async (query, params) => {
      const db = getDatabase();
      return await db.getAllAsync(query, params);
    }} : { getAllAsync: async () => {
      const webDB = JSON.parse(await AsyncStorage.getItem('assessmentWebDB') || '{}');
      return webDB.assessments || [];
    }};
    
    const unsyncedAssessments = isWeb 
      ? (JSON.parse(await AsyncStorage.getItem('assessmentWebDB') || '{}')).assessments?.filter(a => a.firebase_synced !== 1) || []
      : await getAllAsync('SELECT * FROM assessments WHERE firebase_synced = 0', []);
    
    const academyAssessments = unsyncedAssessments.filter(a => a.academy_id === academyId);
    
    debugLog('ASSESSMENTS_UPLOAD', 'Found assessments to upload', { 
      totalUnsynced: unsyncedAssessments.length,
      forThisAcademy: academyAssessments.length 
    });
    
    if (academyAssessments.length === 0) {
      return { success: true, count: 0 };
    }
    
    const batch = writeBatch(db);
    let uploadCount = 0;
    
    for (const assessment of academyAssessments) {
      const assessmentRef = doc(db, `academies/${academyId}/assessments`, assessment.id.toString());
      
      // Get assessment results
      const results = await getAssessmentResults(assessment.id);
      
      const assessmentData = {
        id: assessment.id.toString(),
        academy_id: assessment.academy_id,
        kid_id: assessment.kid_id.toString(),
        sport_id: assessment.sport_id.toString(),
        assessment_date: assessment.assessment_date,
        term: assessment.term,
        assessed_by: assessment.assessed_by,
        notes: assessment.notes || null,
        status: assessment.status || 'completed',
        created_at: Timestamp.fromDate(new Date(assessment.created_at)),
        updated_at: Timestamp.now(),
        synced_at: Timestamp.now(),
        results: results.map(r => ({
          metric_id: r.metric_id.toString(),
          value: r.value,
          percentile: r.percentile || null,
          notes: r.notes || null,
        })),
      };
      
      debugLog('ASSESSMENTS_UPLOAD', 'Adding assessment to batch', { 
        assessmentId: assessment.id,
        kidId: assessment.kid_id,
        resultsCount: results.length 
      });
      
      batch.set(assessmentRef, assessmentData);
      uploadCount++;
      
      if (uploadCount % SYNC_CONFIG.batchSize === 0) {
        await batch.commit();
      }
    }
    
    if (uploadCount % SYNC_CONFIG.batchSize !== 0) {
      await batch.commit();
    }
    
    for (const assessment of academyAssessments) {
      await markAsSynced('assessments', assessment.id);
    }
    
    debugLog('ASSESSMENTS_UPLOAD', 'Assessments upload completed', { uploadCount });
    return { success: true, count: uploadCount };
    
  } catch (error) {
    debugError('ASSESSMENTS_UPLOAD', 'Assessments upload failed', error);
    return { success: false, error: error.message, count: 0 };
  }
};

const uploadKidsToFirebase = async (userId, academyId) => {
  debugLog('KIDS_UPLOAD', 'Starting kids upload (shared with attendance app)', { userId, academyId });
  
  try {
    const userExists = await validateUserExistsInFirebase(userId);
    if (!userExists) {
      const userUpload = await uploadUserProfileToFirebase(userId);
      if (!userUpload.success) {
        return { 
          success: false, 
          error: `User must be uploaded first: ${userUpload.error}`,
          count: 0 
        };
      }
    }
    
    const unsyncedKids = await getUnsyncedRecords('kids', getAllKids);
    const userKids = unsyncedKids.filter(k => k.user_id === userId);
    
    debugLog('KIDS_UPLOAD', 'Found kids to upload', { 
      totalUnsynced: unsyncedKids.length,
      forThisUser: userKids.length 
    });
    
    if (userKids.length === 0) {
      return { success: true, count: 0 };
    }
    
    const batch = writeBatch(db);
    let uploadCount = 0;
    
    for (const kid of userKids) {
      const kidRef = doc(db, `academies/${academyId}/kids`, kid.id.toString());
      
      const kidData = {
        id: kid.id.toString(),
        user_id: kid.user_id,
        name: kid.name,
        age: kid.age,
        gender: kid.gender,
        area_of_residence: kid.area_of_residence,
        age_group: kid.age_group,
        sponsorshipType: kid.sponsorshipType,
        programType: kid.programType,
        sports_enrolled: kid.sports_enrolled || null,
        primary_sport: kid.primary_sport || null,
        status: kid.status || 'active',
        created_at: Timestamp.fromDate(new Date(kid.created_at)),
        updated_at: Timestamp.now(),
        synced_at: Timestamp.now(),
      };
      
      batch.set(kidRef, kidData);
      uploadCount++;
      
      if (uploadCount % SYNC_CONFIG.batchSize === 0) {
        await batch.commit();
      }
    }
    
    if (uploadCount % SYNC_CONFIG.batchSize !== 0) {
      await batch.commit();
    }
    
    for (const kid of userKids) {
      await markAsSynced('kids', kid.id);
    }
    
    debugLog('KIDS_UPLOAD', 'Kids upload completed', { uploadCount });
    return { success: true, count: uploadCount };
    
  } catch (error) {
    debugError('KIDS_UPLOAD', 'Kids upload failed', error);
    return { success: false, error: error.message, count: 0 };
  }
};

const uploadNotesToFirebase = async (userId, academyId) => {
  debugLog('NOTES_UPLOAD', 'Starting notes upload', { userId, academyId });
  
  try {
    const unsyncedNotes = await getUnsyncedRecords('notes', getAllNotes);
    const userNotes = unsyncedNotes.filter(n => n.user_id === userId);
    
    debugLog('NOTES_UPLOAD', 'Found notes to upload', { 
      totalUnsynced: unsyncedNotes.length,
      forThisUser: userNotes.length 
    });
    
    if (userNotes.length === 0) {
      return { success: true, count: 0 };
    }
    
    const batch = writeBatch(db);
    let uploadCount = 0;
    
    for (const note of userNotes) {
      const noteRef = doc(db, `academies/${academyId}/notes`, note.id.toString());
      
      const noteData = {
        id: note.id.toString(),
        user_id: note.user_id,
        academy_id: note.academy_id,
        title: note.title,
        content: note.content,
        note_type: note.note_type,
        related_id: note.related_id || null,
        related_name: note.related_name || null,
        created_at: Timestamp.fromDate(new Date(note.created_at)),
        updated_at: Timestamp.now(),
        synced_at: Timestamp.now(),
      };
      
      batch.set(noteRef, noteData);
      uploadCount++;
      
      if (uploadCount % SYNC_CONFIG.batchSize === 0) {
        await batch.commit();
      }
    }
    
    if (uploadCount % SYNC_CONFIG.batchSize !== 0) {
      await batch.commit();
    }
    
    for (const note of userNotes) {
      await markAsSynced('notes', note.id);
    }
    
    debugLog('NOTES_UPLOAD', 'Notes upload completed', { uploadCount });
    return { success: true, count: uploadCount };
    
  } catch (error) {
    debugError('NOTES_UPLOAD', 'Notes upload failed', error);
    return { success: false, error: error.message, count: 0 };
  }
};

// ========== DOWNLOAD FROM FIREBASE ==========

const downloadUserProfileFromFirebase = async (userId) => {
  debugLog('USER_DOWNLOAD', 'Starting user profile download', { userId });
  
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { success: false, error: 'No user profile found' };
    }
    
    const firebaseUser = userSnap.data();
    
    await updateUser(userId, {
      full_name: firebaseUser.full_name,
      email: firebaseUser.email,
      username: firebaseUser.username || '',
      phone: firebaseUser.phone || '',
      role: firebaseUser.role || 'coach',
      avatar_base64: firebaseUser.avatar_base64 || null,
      updated_at: new Date().toISOString(),
      firebase_synced: 1,
    });
    
    debugLog('USER_DOWNLOAD', 'User profile updated locally', { userId });
    return { success: true };
    
  } catch (error) {
    debugError('USER_DOWNLOAD', 'User profile download failed', error);
    return { success: false, error: error.message };
  }
};

// ✅ NEW: Download Sports from Firebase
const downloadSportsFromFirebase = async (academyId) => {
  debugLog('SPORTS_DOWNLOAD', 'Starting sports download', { academyId });
  
  try {
    const sportsRef = collection(db, `academies/${academyId}/sports`);
    const snapshot = await getDocs(sportsRef);
    
    debugLog('SPORTS_DOWNLOAD', 'Retrieved sports from Firebase', { count: snapshot.size });
    
    if (snapshot.empty) {
      return { success: true, count: 0 };
    }
    
    let downloadCount = 0;
    const localSports = await getAllSports();
    const localSportIds = new Set(localSports.map(s => s.id.toString()));
    
    for (const docSnap of snapshot.docs) {
      const firebaseSport = docSnap.data();
      const sportId = docSnap.id;
      
      if (localSportIds.has(sportId)) {
        debugLog('SPORTS_DOWNLOAD', 'Skipping existing sport', { sportId });
        continue;
      }
      
      await insertSport({
        id: sportId,
        name: firebaseSport.name,
        icon: firebaseSport.icon,
        isDefault: firebaseSport.is_default || 0,
      }, firebaseSport.created_by);
      
      await markAsSynced('sports', sportId);
      downloadCount++;
    }
    
    debugLog('SPORTS_DOWNLOAD', 'Sports download completed', { downloadCount });
    return { success: true, count: downloadCount };
    
  } catch (error) {
    debugError('SPORTS_DOWNLOAD', 'Sports download failed', error);
    return { success: false, error: error.message };
  }
};

// ✅ NEW: Download Metrics from Firebase
const downloadMetricsFromFirebase = async (academyId) => {
  debugLog('METRICS_DOWNLOAD', 'Starting metrics download', { academyId });
  
  try {
    const metricsRef = collection(db, `academies/${academyId}/metrics`);
    const snapshot = await getDocs(metricsRef);
    
    debugLog('METRICS_DOWNLOAD', 'Retrieved metrics from Firebase', { count: snapshot.size });
    
    if (snapshot.empty) {
      return { success: true, count: 0 };
    }
    
    let downloadCount = 0;
    
    // Get all existing metrics to prevent duplicates
    const sports = await getAllSports();
    let allLocalMetrics = [];
    for (const sport of sports) {
      const sportMetrics = await getMetricsBySport(sport.id);
      allLocalMetrics = allLocalMetrics.concat(sportMetrics);
    }
    const localMetricIds = new Set(allLocalMetrics.map(m => m.id.toString()));
    
    for (const docSnap of snapshot.docs) {
      const firebaseMetric = docSnap.data();
      const metricId = docSnap.id;
      
      if (localMetricIds.has(metricId)) {
        debugLog('METRICS_DOWNLOAD', 'Skipping existing metric', { metricId });
        continue;
      }
      
      const userId = await AsyncStorage.getItem('currentUserId');
      await insertMetric({
        id: metricId,
        sportId: firebaseMetric.sport_id,
        name: firebaseMetric.name,
        category: firebaseMetric.category,
        type: firebaseMetric.type,
        unit: firebaseMetric.unit,
        minValue: firebaseMetric.min_value,
        maxValue: firebaseMetric.max_value,
        isDefault: firebaseMetric.is_default || 0,
        displayOrder: firebaseMetric.display_order || 0,
      }, userId);
      
      await markAsSynced('metrics', metricId);
      downloadCount++;
    }
    
    debugLog('METRICS_DOWNLOAD', 'Metrics download completed', { downloadCount });
    return { success: true, count: downloadCount };
    
  } catch (error) {
    debugError('METRICS_DOWNLOAD', 'Metrics download failed', error);
    return { success: false, error: error.message };
  }
};

// ✅ NEW: Download Assessments from Firebase
const downloadAssessmentsFromFirebase = async (academyId) => {
  debugLog('ASSESSMENTS_DOWNLOAD', 'Starting assessments download', { academyId });
  
  try {
    const assessmentsRef = collection(db, `academies/${academyId}/assessments`);
    const snapshot = await getDocs(assessmentsRef);
    
    debugLog('ASSESSMENTS_DOWNLOAD', 'Retrieved assessments from Firebase', { count: snapshot.size });
    
    if (snapshot.empty) {
      return { success: true, count: 0 };
    }
    
    let downloadCount = 0;
    
    // Get existing assessments to prevent duplicates
    const { getAllAsync } = getDatabase ? { getAllAsync: async (query, params) => {
      const db = getDatabase();
      return await db.getAllAsync(query, params);
    }} : { getAllAsync: async () => {
      const webDB = JSON.parse(await AsyncStorage.getItem('assessmentWebDB') || '{}');
      return webDB.assessments || [];
    }};
    
    const localAssessments = isWeb 
      ? (JSON.parse(await AsyncStorage.getItem('assessmentWebDB') || '{}')).assessments || []
      : await getAllAsync('SELECT * FROM assessments', []);
    
    const localAssessmentIds = new Set(localAssessments.map(a => a.id.toString()));
    
    for (const docSnap of snapshot.docs) {
      const firebaseAssessment = docSnap.data();
      const assessmentId = docSnap.id;
      
      if (localAssessmentIds.has(assessmentId)) {
        debugLog('ASSESSMENTS_DOWNLOAD', 'Skipping existing assessment', { assessmentId });
        continue;
      }
      
      const userId = await AsyncStorage.getItem('currentUserId');
      
      // Insert assessment
      await insertAssessment({
        id: assessmentId,
        kidId: firebaseAssessment.kid_id,
        sportId: firebaseAssessment.sport_id,
        assessmentDate: firebaseAssessment.assessment_date,
        term: firebaseAssessment.term,
        notes: firebaseAssessment.notes,
        status: firebaseAssessment.status || 'completed',
      }, userId);
      
      // Insert assessment results
      if (firebaseAssessment.results && firebaseAssessment.results.length > 0) {
        for (const result of firebaseAssessment.results) {
          await insertAssessmentResult({
            assessmentId: assessmentId,
            metricId: result.metric_id,
            value: result.value,
            percentile: result.percentile,
            notes: result.notes,
          });
        }
      }
      
      await markAsSynced('assessments', assessmentId);
      downloadCount++;
    }
    
    debugLog('ASSESSMENTS_DOWNLOAD', 'Assessments download completed', { downloadCount });
    return { success: true, count: downloadCount };
    
  } catch (error) {
    debugError('ASSESSMENTS_DOWNLOAD', 'Assessments download failed', error);
    return { success: false, error: error.message };
  }
};

const downloadKidsFromFirebase = async (userId) => {
  debugLog('KIDS_DOWNLOAD', 'Starting kids download (shared with attendance)', { userId });
  
  try {
    const FIXED_ACADEMY_ID = 'academy_accellax361_main';
    const kidsRef = collection(db, `academies/${FIXED_ACADEMY_ID}/kids`);
    const snapshot = await getDocs(kidsRef);
    
    debugLog('KIDS_DOWNLOAD', 'Retrieved kids from Firebase', { count: snapshot.size });
    
    if (snapshot.empty) {
      return { success: true, count: 0 };
    }
    
    let downloadCount = 0;
    let skippedCount = 0;
    
    const localKids = await getAllKids();
    const existingKidIds = new Set(localKids.map(k => k.id.toString()));
    const insertedInThisRun = new Set();
    
    for (const docSnap of snapshot.docs) {
      const firebaseKid = docSnap.data();
      const kidId = firebaseKid.id.toString();
      
      if (existingKidIds.has(kidId)) {
        debugLog('KIDS_DOWNLOAD', 'Skipping existing kid', { kidId });
        skippedCount++;
        continue;
      }
      
      if (insertedInThisRun.has(kidId)) {
        debugLog('KIDS_DOWNLOAD', 'Skipping duplicate in same run', { kidId });
        skippedCount++;
        continue;
      }
      
      try {
        await insertKid(
          userId,
          firebaseKid.name,
          firebaseKid.age,
          firebaseKid.gender,
          firebaseKid.area_of_residence,
          firebaseKid.age_group,
          firebaseKid.sponsorshipType || 'SP',
          firebaseKid.programType || 'ELT',
          firebaseKid.programTypeOther || null,
          firebaseKid.trialNotes || null,
          true,  // Skip Firebase sync
          kidId  // Use Firebase kid ID
        );
        
        insertedInThisRun.add(kidId);
        downloadCount++;
        
      } catch (insertError) {
        debugError('KIDS_DOWNLOAD', 'Failed to insert kid', insertError);
      }
    }
    
    debugLog('KIDS_DOWNLOAD', 'Kids download completed', { 
      downloadCount, 
      skippedCount 
    });
    return { success: true, count: downloadCount, skipped: skippedCount };
    
  } catch (error) {
    debugError('KIDS_DOWNLOAD', 'Kids download failed', error);
    return { success: false, error: error.message };
  }
};

const downloadNotesFromFirebase = async (userId, academyId) => {
  debugLog('NOTES_DOWNLOAD', 'Starting notes download', { userId, academyId });
  
  try {
    const notesRef = collection(db, `academies/${academyId}/notes`);
    const snapshot = await getDocs(notesRef);
    
    debugLog('NOTES_DOWNLOAD', 'Retrieved notes from Firebase', { count: snapshot.size });
    
    if (snapshot.empty) {
      return { success: true, count: 0 };
    }
    
    let downloadCount = 0;
    const localNotes = await getAllNotes();
    const localNoteIds = new Set(localNotes.map(n => n.id.toString()));
    
    const { getWebDB } = require('./db');
    const webDB = getWebDB();
    
    for (const docSnap of snapshot.docs) {
      const firebaseNote = docSnap.data();
      const noteId = docSnap.id;
      
      if (localNoteIds.has(noteId)) {
        debugLog('NOTES_DOWNLOAD', 'Skipping duplicate note', { noteId });
        continue;
      }
      
      const noteData = {
        id: noteId,
        user_id: firebaseNote.user_id || userId,
        academy_id: academyId,
        title: firebaseNote.title,
        content: firebaseNote.content,
        note_type: firebaseNote.note_type,
        related_id: firebaseNote.related_id || null,
        related_name: firebaseNote.related_name || null,
        created_at: firebaseNote.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        updated_at: firebaseNote.updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        firebase_synced: 1,
      };
      
      if (isWeb && webDB) {
        const currentWebDB = await getWebDB() || webDB;
        if (!currentWebDB.notes) {
          currentWebDB.notes = [];
        }
        currentWebDB.notes.push(noteData);
        downloadCount++;
      } else {
        const db = getDatabase();
        try {
          await db.runAsync(
            `INSERT INTO notes (id, user_id, academy_id, title, content, note_type, related_id, related_name, created_at, updated_at, firebase_synced) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              noteId,
              noteData.user_id,
              noteData.academy_id,
              noteData.title,
              noteData.content,
              noteData.note_type,
              noteData.related_id,
              noteData.related_name,
              noteData.created_at,
              noteData.updated_at,
              1
            ]
          );
          downloadCount++;
        } catch (error) {
          debugError('NOTES_DOWNLOAD', 'Error inserting note', error);
        }
      }
    }
    
    if (isWeb) {
      const finalWebDB = await getWebDB();
      if (finalWebDB) {
        await AsyncStorage.setItem('assessmentWebDB', JSON.stringify(finalWebDB));
      }
    }
    
    debugLog('NOTES_DOWNLOAD', 'Notes download completed', { downloadCount });
    return { success: true, count: downloadCount };
    
  } catch (error) {
    debugError('NOTES_DOWNLOAD', 'Notes download failed', error);
    return { success: false, error: error.message };
  }
};

// ========== CONFLICT RESOLUTION ==========

const resolveConflicts = async (userId) => {
  debugLog('CONFLICTS', 'Starting conflict resolution', { userId });
  
  try {
    const allKids = await getAllKids();
    const localKids = allKids.filter(k => k.user_id === userId);
    
    debugLog('CONFLICTS', 'Checking conflicts for kids', { count: localKids.length });
    
    const FIXED_ACADEMY_ID = 'academy_accellax361_main';
    
    for (const localKid of localKids) {
      const kidRef = doc(db, `academies/${FIXED_ACADEMY_ID}/kids`, localKid.id.toString());
      const firebaseDoc = await getDoc(kidRef);
      
      if (!firebaseDoc.exists()) {
        continue;
      }
      
      const firebaseKid = firebaseDoc.data();
      const localTime = new Date(localKid.updated_at || localKid.created_at).getTime();
      const firebaseTime = firebaseKid.updated_at?.toDate().getTime() || 0;
      
      if (firebaseTime > localTime) {
        debugLog('CONFLICTS', 'Firebase version newer - updating local', {
          kidId: localKid.id,
          kidName: localKid.name,
        });
        
        await updateKid(localKid.id, {
          name: firebaseKid.name,
          age: firebaseKid.age,
          gender: firebaseKid.gender,
          area_of_residence: firebaseKid.area_of_residence,
          age_group: firebaseKid.age_group,
          sports_enrolled: firebaseKid.sports_enrolled,
          primary_sport: firebaseKid.primary_sport,
        });
        
        if (firebaseKid.status !== localKid.status) {
          await updateKidStatus(localKid.id, firebaseKid.status);
        }
      }
    }
    
    debugLog('CONFLICTS', 'Conflict resolution completed');
    return { success: true };
    
  } catch (error) {
    debugError('CONFLICTS', 'Conflict resolution failed', error);
    return { success: false, error: error.message };
  }
};

// ========== FULL SYNC OPERATION ==========

export const performFullSync = async (userId) => {
  debugLog('FULL_SYNC', '========== STARTING ASSESSMENT FULL SYNC ==========', { userId });
  
  if (isSyncing) {
    debugLog('FULL_SYNC', 'Sync already in progress - aborting');
    return { success: false, message: 'Sync already in progress' };
  }
  
  if (!userId) {
    debugLog('FULL_SYNC', 'No user ID provided - aborting');
    return { success: false, message: 'User ID required for sync' };
  }
  
  const online = await isOnline();
  if (!online) {
    debugLog('FULL_SYNC', 'No internet connection - aborting');
    return { success: false, message: 'No internet connection' };
  }
  
  isSyncing = true;
  syncErrors = [];
  
  try {
    const academyId = await getAcademyId();
    const results = {
      userProfileUploaded: false,
      userProfileDownloaded: false,
      kidsUploaded: 0,
      kidsDownloaded: 0,
      sportsUploaded: 0,
      sportsDownloaded: 0,
      metricsUploaded: 0,
      metricsDownloaded: 0,
      assessmentsUploaded: 0,
      assessmentsDownloaded: 0,
      notesUploaded: 0,
      notesDownloaded: 0,
      errors: [],
    };
    
    // Step 0: Upload user profile
    debugLog('FULL_SYNC', 'Step 0: Uploading user profile');
    const profileUpload = await uploadUserProfileToFirebase(userId);
    results.userProfileUploaded = profileUpload.success;
    if (!profileUpload.success) {
      results.errors.push(`User profile upload: ${profileUpload.error}`);
    }
    
    // Step 0.5: Download user profile
    debugLog('FULL_SYNC', 'Step 0.5: Downloading user profile');
    const profileDownload = await downloadUserProfileFromFirebase(userId);
    results.userProfileDownloaded = profileDownload.success;
    if (!profileDownload.success && profileDownload.error !== 'No user profile found') {
      results.errors.push(`User profile download: ${profileDownload.error}`);
    }
    
    // Step 1: Upload kids (shared with attendance)
    debugLog('FULL_SYNC', 'Step 1: Uploading kids');
    const kidsUpload = await uploadKidsToFirebase(userId, academyId);
    results.kidsUploaded = kidsUpload.count || 0;
    if (!kidsUpload.success) {
      results.errors.push(`Kids upload: ${kidsUpload.error}`);
    }
    
    // Step 2: Upload sports
    debugLog('FULL_SYNC', 'Step 2: Uploading sports');
    const sportsUpload = await uploadSportsToFirebase(userId, academyId);
    results.sportsUploaded = sportsUpload.count || 0;
    if (!sportsUpload.success) {
      results.errors.push(`Sports upload: ${sportsUpload.error}`);
    }
    
    // Step 3: Upload metrics
    debugLog('FULL_SYNC', 'Step 3: Uploading metrics');
    const metricsUpload = await uploadMetricsToFirebase(userId, academyId);
    results.metricsUploaded = metricsUpload.count || 0;
    if (!metricsUpload.success) {
      results.errors.push(`Metrics upload: ${metricsUpload.error}`);
    }
    
    // Step 4: Upload assessments
    debugLog('FULL_SYNC', 'Step 4: Uploading assessments');
    const assessmentsUpload = await uploadAssessmentsToFirebase(userId, academyId);
    results.assessmentsUploaded = assessmentsUpload.count || 0;
    if (!assessmentsUpload.success) {
      results.errors.push(`Assessments upload: ${assessmentsUpload.error}`);
    }
    
    // Step 5: Upload notes
    debugLog('FULL_SYNC', 'Step 5: Uploading notes');
    const notesUpload = await uploadNotesToFirebase(userId, academyId);
    results.notesUploaded = notesUpload.count || 0;
    if (!notesUpload.success) {
      results.errors.push(`Notes upload: ${notesUpload.error}`);
    }
    
    // Step 6: Download kids
    debugLog('FULL_SYNC', 'Step 6: Downloading kids');
    const kidsDownload = await downloadKidsFromFirebase(userId);
    results.kidsDownloaded = kidsDownload.count || 0;
    if (!kidsDownload.success) {
      results.errors.push(`Kids download: ${kidsDownload.error}`);
    }
    
    // Step 7: Download sports
    debugLog('FULL_SYNC', 'Step 7: Downloading sports');
    const sportsDownload = await downloadSportsFromFirebase(academyId);
    results.sportsDownloaded = sportsDownload.count || 0;
    if (!sportsDownload.success) {
      results.errors.push(`Sports download: ${sportsDownload.error}`);
    }
    
    // Step 8: Download metrics
    debugLog('FULL_SYNC', 'Step 8: Downloading metrics');
    const metricsDownload = await downloadMetricsFromFirebase(academyId);
    results.metricsDownloaded = metricsDownload.count || 0;
    if (!metricsDownload.success) {
      results.errors.push(`Metrics download: ${metricsDownload.error}`);
    }
    
    // Step 9: Download assessments
    debugLog('FULL_SYNC', 'Step 9: Downloading assessments');
    const assessmentsDownload = await downloadAssessmentsFromFirebase(academyId);
    results.assessmentsDownloaded = assessmentsDownload.count || 0;
    if (!assessmentsDownload.success) {
      results.errors.push(`Assessments download: ${assessmentsDownload.error}`);
    }
    
    // Step 10: Download notes
    debugLog('FULL_SYNC', 'Step 10: Downloading notes');
    const notesDownload = await downloadNotesFromFirebase(userId, academyId);
    results.notesDownloaded = notesDownload.count || 0;
    if (!notesDownload.success) {
      results.errors.push(`Notes download: ${notesDownload.error}`);
    }
    
    // Step 11: Resolve conflicts
    debugLog('FULL_SYNC', 'Step 11: Resolving conflicts');
    const conflictResolution = await resolveConflicts(userId);
    if (!conflictResolution.success) {
      results.errors.push(`Conflict resolution: ${conflictResolution.error}`);
    }
    
    // Update sync timestamp
    lastSyncTimestamp = Date.now();
    await AsyncStorage.setItem('lastAssessmentSyncTimestamp', lastSyncTimestamp.toString());
    
    debugLog('FULL_SYNC', '========== ASSESSMENT SYNC COMPLETED ==========', {
      success: results.errors.length === 0,
      results,
      timestamp: new Date(lastSyncTimestamp).toISOString(),
    });
    
    return {
      success: results.errors.length === 0,
      results,
      timestamp: lastSyncTimestamp,
    };
    
  } catch (error) {
    debugError('FULL_SYNC', 'SYNC FAILED WITH EXCEPTION', error);
    syncErrors.push(error.message);
    
    return {
      success: false,
      error: error.message,
      errors: syncErrors,
    };
    
  } finally {
    isSyncing = false;
    debugLog('FULL_SYNC', 'Sync flag reset');
  }
};

// ========== AUTO SYNC ==========

let autoSyncInterval = null;

export const startAutoSync = () => {
  if (autoSyncInterval) {
    debugLog('AUTO_SYNC', 'Auto-sync already running');
    return;
  }
  
  debugLog('AUTO_SYNC', 'Starting auto-sync (every 5 minutes)');
  
  autoSyncInterval = setInterval(async () => {
    const online = await isOnline();
    if (online && !isSyncing) {
      debugLog('AUTO_SYNC', 'Auto-sync triggered');
      try {
        const userId = await AsyncStorage.getItem('currentUserId');
        if (userId) {
          await performFullSync(userId);
        }
      } catch (error) {
        debugError('AUTO_SYNC', 'Auto-sync error', error);
      }
    }
  }, SYNC_CONFIG.syncInterval);
};

export const stopAutoSync = () => {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
    debugLog('AUTO_SYNC', 'Auto-sync stopped');
  }
};

// ========== MANUAL OPERATIONS ==========

export const uploadKids = async (userId) => {
  const academyId = await getAcademyId();
  return await uploadKidsToFirebase(userId, academyId);
};

export const uploadSports = async (userId) => {
  const academyId = await getAcademyId();
  return await uploadSportsToFirebase(userId, academyId);
};

export const uploadMetrics = async (userId) => {
  const academyId = await getAcademyId();
  return await uploadMetricsToFirebase(userId, academyId);
};

export const uploadAssessments = async (userId) => {
  const academyId = await getAcademyId();
  return await uploadAssessmentsToFirebase(userId, academyId);
};

export const uploadNotes = async (userId) => {
  const academyId = await getAcademyId();
  return await uploadNotesToFirebase(userId, academyId);
};

export const downloadKids = async (userId) => {
  return await downloadKidsFromFirebase(userId);
};

export const downloadSports = async () => {
  const academyId = await getAcademyId();
  return await downloadSportsFromFirebase(academyId);
};

export const downloadMetrics = async () => {
  const academyId = await getAcademyId();
  return await downloadMetricsFromFirebase(academyId);
};

export const downloadAssessments = async () => {
  const academyId = await getAcademyId();
  return await downloadAssessmentsFromFirebase(academyId);
};

export const downloadNotes = async (userId) => {
  const academyId = await getAcademyId();
  return await downloadNotesFromFirebase(userId, academyId);
};

export const uploadUserProfile = async (userId) => {
  return await uploadUserProfileToFirebase(userId);
};

export const downloadUserProfile = async (userId) => {
  return await downloadUserProfileFromFirebase(userId);
};

// ========== RESET SYNC STATUS ==========

export const resetSyncStatus = async () => {
  debugLog('RESET', 'Resetting assessment sync status...');
  
  try {
    if (isWeb) {
      const keys = await AsyncStorage.getAllKeys();
      const syncKeys = keys.filter(k => k.startsWith('synced_'));
      await AsyncStorage.multiRemove(syncKeys);
      debugLog('RESET', `Removed ${syncKeys.length} sync keys`);
    } else {
      const db = getDatabase();
      await db.execAsync(`
        UPDATE kids SET firebase_synced = 0;
        UPDATE sports SET firebase_synced = 0;
        UPDATE metrics SET firebase_synced = 0;
        UPDATE assessments SET firebase_synced = 0;
        UPDATE assessment_results SET firebase_synced = 0;
        UPDATE benchmarks SET firebase_synced = 0;
        UPDATE goals SET firebase_synced = 0;
        UPDATE notes SET firebase_synced = 0;
      `);
      debugLog('RESET', 'Reset firebase_synced flags in database');
    }
    
    await AsyncStorage.removeItem('lastAssessmentSyncTimestamp');
    lastSyncTimestamp = null;
    
    debugLog('RESET', 'Assessment sync status reset complete');
    return { success: true };
    
  } catch (error) {
    debugError('RESET', 'Error resetting sync status', error);
    return { success: false, error: error.message };
  }
};

// ========== INITIALIZE ==========

export const initializeSync = async () => {
  try {
    debugLog('INIT', 'Initializing assessment sync system...');
    
    const storedTimestamp = await AsyncStorage.getItem('lastAssessmentSyncTimestamp');
    if (storedTimestamp) {
      lastSyncTimestamp = parseInt(storedTimestamp);
      debugLog('INIT', 'Loaded last sync timestamp', { 
        timestamp: new Date(lastSyncTimestamp).toISOString() 
      });
    }
    
    debugLog('INIT', 'Assessment sync system initialized');
    
  } catch (error) {
    debugError('INIT', 'Error initializing sync', error);
  }
};

// ========== DIAGNOSTIC TOOLS ==========

export const getSyncDiagnostics = async () => {
  debugLog('DIAGNOSTICS', 'Gathering assessment sync diagnostics...');
  
  try {
    const userId = await AsyncStorage.getItem('currentUserId');
    const academyId = await getAcademyId();
    const lastSync = await AsyncStorage.getItem('lastAssessmentSyncTimestamp');
    const online = await isOnline();
    
    const localKids = await getAllKids();
    const localSports = await getAllSports();
    const localNotes = await getAllNotes();
    
    const unsyncedKids = await getUnsyncedRecords('kids', getAllKids);
    const unsyncedSports = await getUnsyncedRecords('sports', getAllSports);
    const unsyncedNotes = await getUnsyncedRecords('notes', getAllNotes);
    
    let firebaseUserExists = false;
    if (userId) {
      firebaseUserExists = await validateUserExistsInFirebase(userId);
    }
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      userId,
      academyId,
      lastSyncTimestamp: lastSync ? new Date(parseInt(lastSync)).toISOString() : 'Never',
      isOnline: online,
      isSyncing,
      syncErrors,
      firebaseUserExists,
      local: {
        totalKids: localKids.length,
        totalSports: localSports.length,
        totalNotes: localNotes.length,
        unsyncedKids: unsyncedKids.length,
        unsyncedSports: unsyncedSports.length,
        unsyncedNotes: unsyncedNotes.length,
      },
    };
    
    debugLog('DIAGNOSTICS', 'Diagnostics complete', diagnostics);
    
    return diagnostics;
    
  } catch (error) {
    debugError('DIAGNOSTICS', 'Error gathering diagnostics', error);
    return {
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

export const exportSyncLogs = async () => {
  const logs = await getSyncDebugLogs();
  console.log('========== ASSESSMENT SYNC DEBUG LOGS ==========');
  console.log(JSON.stringify(logs, null, 2));
  console.log('================================================');
  return logs;
};

// Export all sync functions
export default {
  performFullSync,
  startAutoSync,
  stopAutoSync,
  getSyncStatus,
  isOnline,
  getAcademyId,
  uploadKids,
  uploadSports,
  uploadMetrics,
  uploadAssessments,
  uploadNotes,
  downloadKids,
  downloadSports,
  downloadMetrics,
  downloadAssessments,
  downloadNotes,
  uploadUserProfile,
  downloadUserProfile,
  resetSyncStatus,
  initializeSync,
  getSyncDebugLogs,
  clearSyncDebugLogs,
  getSyncDiagnostics,
  exportSyncLogs,
};
