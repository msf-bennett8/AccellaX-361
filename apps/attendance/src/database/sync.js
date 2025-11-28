// src/database/sync.js - COMPLETE FIXED VERSION
// Firebase Sync Manager for AccellaX 361°

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
  getAllSessions,
  getSessionAttendance,
  insertKid,
  createSession,
  markAttendance,
  updateKid,
  updateKidStatus,
  deleteKid,
  deleteSession,
  getDatabase,
  createUser,
  getUserById,
  updateUser,
  getAllNotes,
  insertNote,
  updateNote,
  deleteNote,
} from './db';

const isWeb = Platform.OS === 'web';

// ========== ENHANCED DEBUGGING ==========

const DEBUG_MODE = true; // Set to false in production

const debugLog = (category, message, data = null) => {
  if (!DEBUG_MODE) return;
  
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${category}] ${message}`;
  
  console.log(logMessage);
  if (data) {
    console.log('Data:', JSON.stringify(data, null, 2));
  }
  
  // Store debug logs for later inspection
  storeSyncLog(category, message, data);
};

const debugError = (category, message, error) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [${category}] ❌ ${message}`, error);
  
  storeSyncLog(category, `ERROR: ${message}`, {
    error: error.message,
    stack: error.stack,
  });
};

// Store sync logs in AsyncStorage for debugging
const storeSyncLog = async (category, message, data) => {
  try {
    const logs = await AsyncStorage.getItem('syncDebugLogs');
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
    
    await AsyncStorage.setItem('syncDebugLogs', JSON.stringify(logArray));
  } catch (error) {
    console.warn('Failed to store debug log:', error);
  }
};

// Export function to retrieve debug logs
export const getSyncDebugLogs = async () => {
  try {
    const logs = await AsyncStorage.getItem('syncDebugLogs');
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error('Failed to retrieve debug logs:', error);
    return [];
  }
};

// Export function to clear debug logs
export const clearSyncDebugLogs = async () => {
  try {
    await AsyncStorage.removeItem('syncDebugLogs');
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
  syncInterval: 300000,
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
    academyId = 'academy_accellax361_main'; // Use fixed academy ID
    await AsyncStorage.setItem('academyId', academyId);
    debugLog('ACADEMY', 'Generated new academy ID', { academyId });
  } else {
    debugLog('ACADEMY', 'Retrieved existing academy ID', { academyId });
  }
  
  return academyId;
};

// ========== USER VALIDATION ==========

/**
 * Check if user exists in Firebase
 */
const validateUserExistsInFirebase = async (userId) => {
  debugLog('USER_VALIDATION', 'Checking if user exists in Firebase', { userId });
  
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const exists = userSnap.exists();
    
    debugLog('USER_VALIDATION', `User ${exists ? 'EXISTS' : 'DOES NOT EXIST'} in Firebase`, { 
      userId, 
      exists 
    });
    
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
      const { updateKid } = require('./db');
      if (table === 'kids') {
        const webDB = JSON.parse(await AsyncStorage.getItem('webDB') || '{}');
        if (webDB.kids) {
          const kidIndex = webDB.kids.findIndex(k => k.id === id);
          if (kidIndex !== -1) {
            webDB.kids[kidIndex].firebase_synced = 1;
            await AsyncStorage.setItem('webDB', JSON.stringify(webDB));
            debugLog('SYNC_METADATA', 'Updated firebase_synced flag in webDB', { id });
          }
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
      if (!synced) {
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
      authMethod: userProfile.auth_method,
      isOfflineAccount: userProfile.is_offline_account,
    });
    
    // Check if this is an offline account
    if (userId.startsWith('offline_')) {
      debugLog('USER_UPLOAD', 'Offline account detected - cannot sync without Firebase Auth', { userId });
      return { 
        success: false, 
        error: 'Offline account requires login to create Firebase Authentication account',
        needsAuth: true
      };
    }
    
    // Check if user already exists in Firebase
    const userRef = doc(db, 'users', userId);
    const existingUser = await getDoc(userRef);
    
    if (existingUser.exists()) {
      debugLog('USER_UPLOAD', 'User already exists in Firebase - will update', { userId });
    } else {
      debugLog('USER_UPLOAD', 'Creating new user in Firebase', { userId });
    }
    
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
      last_login_at: userProfile.last_login_at 
        ? Timestamp.fromDate(new Date(userProfile.last_login_at)) 
        : Timestamp.now(),
      synced_at: Timestamp.now(),
    };
    
    await setDoc(userRef, userData, { merge: true });
    
    // Mark as synced locally
    await updateUser(userId, { firebase_synced: 1 });
    
    debugLog('USER_UPLOAD', 'User profile successfully uploaded to Firebase', { userId });
    return { success: true };
    
  } catch (error) {
    debugError('USER_UPLOAD', 'Failed to upload user profile', error);
    return { success: false, error: error.message };
  }
};

const uploadKidsToFirebase = async (userId, academyId) => {
  debugLog('KIDS_UPLOAD', 'Starting kids upload', { userId, academyId });
  
  try {
    // Validate user exists in Firebase first
    const userExists = await validateUserExistsInFirebase(userId);
    if (!userExists) {
      debugLog('KIDS_UPLOAD', 'User does not exist in Firebase - uploading user first', { userId });
      const userUpload = await uploadUserProfileToFirebase(userId);
      if (!userUpload.success) {
        return { 
          success: false, 
          error: `User must be uploaded to Firebase first: ${userUpload.error}`,
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
        ...kid,
        id: kid.id.toString(),
        sports_enrolled: kid.sports_enrolled ? (typeof kid.sports_enrolled === 'string' ? JSON.parse(kid.sports_enrolled) : kid.sports_enrolled) : null,
        primary_sport: kid.primary_sport || null,
        sport_history: kid.sport_history ? (typeof kid.sport_history === 'string' ? JSON.parse(kid.sport_history) : kid.sport_history) : null,
        created_at: Timestamp.fromDate(new Date(kid.created_at)),
        updated_at: Timestamp.now(),
        synced_at: Timestamp.now(),
      };
      
      debugLog('KIDS_UPLOAD', 'Adding kid to batch', { 
        kidId: kid.id, 
        kidName: kid.name 
      });
      
      batch.set(kidRef, kidData);
      uploadCount++;
      
      if (uploadCount % SYNC_CONFIG.batchSize === 0) {
        debugLog('KIDS_UPLOAD', 'Committing batch', { count: uploadCount });
        await batch.commit();
      }
    }
    
    if (uploadCount % SYNC_CONFIG.batchSize !== 0) {
      await batch.commit();
    }
    
    // Mark as synced locally
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

const uploadSessionsToFirebase = async (userId, academyId) => {
  debugLog('SESSIONS_UPLOAD', 'Starting sessions upload', { userId, academyId });
  
  try {
    const unsyncedSessions = await getUnsyncedRecords('sessions', getAllSessions);
    const academySessions = unsyncedSessions.filter(s => s.academy_id === academyId);
    
    debugLog('SESSIONS_UPLOAD', 'Found sessions to upload', { 
      totalUnsynced: unsyncedSessions.length,
      forThisAcademy: academySessions.length 
    });
    
    if (academySessions.length === 0) {
      return { success: true, count: 0 };
    }
    
    const batch = writeBatch(db);
    let uploadCount = 0;
    
    for (const session of academySessions) {
      const sessionRef = doc(db, `academies/${academyId}/sessions`, session.id.toString());
      
      // Get attendance for this session
      const attendance = await getSessionAttendance(session.id);
      
      const sessionData = {
        id: session.id.toString(),
        academy_id: session.academy_id,
        session_date: session.session_date,
        session_time: session.session_time,
        day_of_week: session.day_of_week,
        status: session.status || 'draft',
        general_notes: session.general_notes || '',
        created_by: session.created_by || userId,
        last_modified_by: session.last_modified_by || userId,
        created_at: Timestamp.fromDate(new Date(session.created_at)),
        updated_at: Timestamp.now(),
        synced_at: Timestamp.now(),
        attendance: attendance.map(a => ({
          kid_id: a.kid_id.toString(),
          status: a.status,
          marked_at: Timestamp.fromDate(new Date(a.marked_at)),
        })),
      };
      
      debugLog('SESSIONS_UPLOAD', 'Adding session to batch', { 
        sessionId: session.id,
        sessionDate: session.session_date,
        attendanceCount: attendance.length 
      });
      
      batch.set(sessionRef, sessionData);
      uploadCount++;
      
      if (uploadCount % SYNC_CONFIG.batchSize === 0) {
        debugLog('SESSIONS_UPLOAD', 'Committing batch', { count: uploadCount });
        await batch.commit();
      }
    }
    
    if (uploadCount % SYNC_CONFIG.batchSize !== 0) {
      await batch.commit();
    }
    
    for (const session of academySessions) {
      await markAsSynced('sessions', session.id);
    }
    
    debugLog('SESSIONS_UPLOAD', 'Sessions upload completed', { uploadCount });
    return { success: true, count: uploadCount };
    
  } catch (error) {
    debugError('SESSIONS_UPLOAD', 'Sessions upload failed', error);
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
        ...note,
        id: note.id.toString(),
        created_at: Timestamp.fromDate(new Date(note.created_at)),
        updated_at: Timestamp.now(),
        synced_at: Timestamp.now(),
      };
      
      debugLog('NOTES_UPLOAD', 'Adding note to batch', { 
        noteId: note.id, 
        noteTitle: note.title 
      });
      
      batch.set(noteRef, noteData);
      uploadCount++;
      
      if (uploadCount % SYNC_CONFIG.batchSize === 0) {
        debugLog('NOTES_UPLOAD', 'Committing batch', { count: uploadCount });
        await batch.commit();
      }
    }
    
    if (uploadCount % SYNC_CONFIG.batchSize !== 0) {
      await batch.commit();
    }
    
    // Mark as synced locally
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
      debugLog('USER_DOWNLOAD', 'No user profile found in Firebase', { userId });
      return { success: false, error: 'No user profile found' };
    }
    
    const firebaseUser = userSnap.data();
    
    debugLog('USER_DOWNLOAD', 'Retrieved user profile from Firebase', {
      userId,
      email: firebaseUser.email,
      fullName: firebaseUser.full_name,
    });
    
    await updateUser(userId, {
      full_name: firebaseUser.full_name,
      email: firebaseUser.email,
      username: firebaseUser.username || '',
      phone: firebaseUser.phone || '',
      role: firebaseUser.role || 'coach',
      avatar_base64: firebaseUser.avatar_base64 || null,
      auth_method: firebaseUser.auth_method || 'accellax',
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

// ✅ FIXED: Download kids from Firebase (prevents duplicates during sync)
const downloadKidsFromFirebase = async (userId) => {
  debugLog('KIDS_DOWNLOAD', 'Starting kids download', { userId });
  
  try {
    // Download from ACADEMY collection (not user collection)
    const FIXED_ACADEMY_ID = 'academy_accellax361_main';
    const kidsRef = collection(db, `academies/${FIXED_ACADEMY_ID}/kids`);
    const snapshot = await getDocs(kidsRef);
    
    debugLog('KIDS_DOWNLOAD', 'Retrieved kids from Firebase academy collection', { 
      count: snapshot.size 
    });
    
    if (snapshot.empty) {
      return { success: true, count: 0 };
    }
    
    let downloadCount = 0;
    let skippedCount = 0;
    
    // Get existing local kids to prevent duplicates
    const localKids = await getAllKids();
    const existingKidIds = new Set(localKids.map(k => k.id.toString()));
    
    // Also track kids we're about to insert in THIS sync run
    const insertedInThisRun = new Set();
    
    for (const docSnap of snapshot.docs) {
      const firebaseKid = docSnap.data();
      const kidId = firebaseKid.id.toString();
      
      // Skip if kid already exists locally
      if (existingKidIds.has(kidId)) {
        debugLog('KIDS_DOWNLOAD', 'Skipping existing kid (already in local DB)', { 
          kidId, 
          kidName: firebaseKid.name 
        });
        skippedCount++;
        continue;
      }
      
      // Skip if we already inserted this kid in this sync run
      if (insertedInThisRun.has(kidId)) {
        debugLog('KIDS_DOWNLOAD', 'Skipping duplicate in same sync run', { 
          kidId, 
          kidName: firebaseKid.name 
        });
        skippedCount++;
        continue;
      }
      
      debugLog('KIDS_DOWNLOAD', 'Inserting new kid', { 
        kidId, 
        kidName: firebaseKid.name,
        ageGroup: firebaseKid.age_group 
      });
      
      try {
        // Insert kid WITH the Firebase kid ID (this is the critical fix!)
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
          true,  // ← Skip Firebase sync
          kidId  // ← CRITICAL: Pass the Firebase kid ID!
        );
        
        // Mark as inserted in this run
        insertedInThisRun.add(kidId);
        downloadCount++;
        
      } catch (insertError) {
        debugError('KIDS_DOWNLOAD', 'Failed to insert kid', insertError);
        // Continue with next kid instead of failing entire sync
      }
    }
    
    debugLog('KIDS_DOWNLOAD', 'Kids download completed', { 
      downloadCount, 
      skippedCount,
      totalProcessed: snapshot.size
    });
    return { success: true, count: downloadCount, skipped: skippedCount };
    
  } catch (error) {
    debugError('KIDS_DOWNLOAD', 'Kids download failed', error);
    return { success: false, error: error.message };
  }
};

const downloadSessionsFromFirebase = async (userId, academyId) => {
  debugLog('SESSIONS_DOWNLOAD', 'Starting sessions download', { userId, academyId });
  
  try {
    const sessionsRef = collection(db, `academies/${academyId}/sessions`);
    const snapshot = await getDocs(sessionsRef);
    
    debugLog('SESSIONS_DOWNLOAD', 'Retrieved sessions from Firebase', { 
      count: snapshot.size 
    });
    
    if (snapshot.empty) {
      return { success: true, count: 0 };
    }
    
    let downloadCount = 0;
    let skippedCount = 0;
    const localSessions = await getAllSessions();
    
    const localSessionIds = new Set(localSessions.map(s => s.id.toString()));
    const localSessionsByDate = new Map();
    localSessions.forEach(s => {
      const key = `${s.session_date}_${s.academy_id}`;
      localSessionsByDate.set(key, s);
    });
    
    debugLog('SESSIONS_DOWNLOAD', 'Local sessions state', {
      localCount: localSessions.length,
      localSessionIds: Array.from(localSessionIds),
    });
    
    const { getWebDB } = require('./db');
    const webDB = getWebDB();
    
    for (const docSnap of snapshot.docs) {
      const firebaseSession = docSnap.data();
      const sessionId = docSnap.id;
      const sessionDate = firebaseSession.session_date;
      const sessionKey = `${sessionDate}_${academyId}`;
      
      // Check for duplicates
      if (localSessionIds.has(sessionId)) {
        debugLog('SESSIONS_DOWNLOAD', 'Skipping duplicate session by ID', { 
          sessionId, 
          sessionDate 
        });
        skippedCount++;
        continue;
      }
      
      if (localSessionsByDate.has(sessionKey)) {
        debugLog('SESSIONS_DOWNLOAD', 'Skipping duplicate session by date', { 
          sessionId, 
          sessionDate 
        });
        skippedCount++;
        continue;
      }
      
      debugLog('SESSIONS_DOWNLOAD', 'Downloading new session', {
        sessionId,
        sessionDate,
        attendanceCount: firebaseSession.attendance?.length || 0,
      });
      
      const sessionData = {
        id: sessionId,
        academy_id: academyId,
        session_date: sessionDate,
        session_time: firebaseSession.session_time,
        day_of_week: firebaseSession.day_of_week,
        status: firebaseSession.status || 'draft',
        general_notes: firebaseSession.general_notes || '',
        created_by: firebaseSession.created_by || userId,
        last_modified_by: firebaseSession.last_modified_by || userId,
        created_at: firebaseSession.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        firebase_synced: 1,
      };
      
      if (isWeb && webDB) {
        const currentWebDB = await getWebDB() || webDB;
        
        // Triple check for race conditions
        const existingSession = currentWebDB.sessions.find(s => s.id === sessionId);
        if (existingSession) {
          debugLog('SESSIONS_DOWNLOAD', 'Race condition detected - session already in webDB', { sessionId });
          skippedCount++;
          continue;
        }
        
        currentWebDB.sessions.push(sessionData);
        
        // Add attendance
        if (firebaseSession.attendance && firebaseSession.attendance.length > 0) {
          for (const att of firebaseSession.attendance) {
            const existingAttendance = webDB.attendance.find(
              a => a.session_id === sessionId && a.kid_id.toString() === att.kid_id.toString()
            );
            
            if (!existingAttendance) {
              const attendanceRecord = {
                id: Date.now() + Math.random(),
                session_id: sessionId,
                kid_id: att.kid_id.toString(),  // ✅ Keep as string
                status: att.status,
                marked_at: att.marked_at?.toDate?.()?.toISOString() || new Date().toISOString(),
                firebase_synced: 1,
              };
              webDB.attendance.push(attendanceRecord);
            }
          }
        }
        
        downloadCount++;
      } else {
        // Native SQLite
        const db = getDatabase();
        try {
          await db.runAsync(
            `INSERT INTO sessions (id, academy_id, session_date, session_time, day_of_week, status, general_notes, created_by, last_modified_by, created_at, firebase_synced) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              sessionId,
              sessionData.academy_id,
              sessionData.session_date,
              sessionData.session_time,
              sessionData.day_of_week,
              sessionData.status,
              sessionData.general_notes,
              sessionData.created_by,
              sessionData.last_modified_by,
              sessionData.created_at,
              1
            ]
          );
          
          if (firebaseSession.attendance && firebaseSession.attendance.length > 0) {
            for (const att of firebaseSession.attendance) {
              await db.runAsync(
                `INSERT INTO attendance (session_id, kid_id, status, marked_at, firebase_synced) 
                 VALUES (?, ?, ?, ?, ?)`,
                [
                  sessionId,
                  att.kid_id.toString(),  // ✅ Keep as string to match kids.id
                  att.status,
                  att.marked_at?.toDate?.()?.toISOString() || new Date().toISOString(),
                  1
                ]
              );
            }
          }
          
          downloadCount++;
        } catch (error) {
          debugError('SESSIONS_DOWNLOAD', 'Error inserting session', error);
        }
      }
    }
    
    if (isWeb) {
      const finalWebDB = await getWebDB();
      if (finalWebDB) {
        await AsyncStorage.setItem('webDB', JSON.stringify(finalWebDB));
        debugLog('SESSIONS_DOWNLOAD', 'Saved sessions to webDB', { 
          totalSessions: finalWebDB.sessions.length 
        });
      }
    }
    
    debugLog('SESSIONS_DOWNLOAD', 'Sessions download completed', { 
      downloadCount, 
      skippedCount 
    });
    return { success: true, count: downloadCount, skipped: skippedCount };
    
  } catch (error) {
    debugError('SESSIONS_DOWNLOAD', 'Sessions download failed', error);
    return { success: false, error: error.message };
  }
};

const downloadNotesFromFirebase = async (userId, academyId) => {
  debugLog('NOTES_DOWNLOAD', 'Starting notes download', { userId, academyId });
  
  try {
    const notesRef = collection(db, `academies/${academyId}/notes`);
    const snapshot = await getDocs(notesRef);
    
    debugLog('NOTES_DOWNLOAD', 'Retrieved notes from Firebase', { 
      count: snapshot.size 
    });
    
    if (snapshot.empty) {
      return { success: true, count: 0 };
    }
    
    let downloadCount = 0;
    const localNotes = await getAllNotes();
    const localNoteIds = new Set(localNotes.map(n => n.id.toString()));
    
    debugLog('NOTES_DOWNLOAD', 'Local notes state', {
      localCount: localNotes.length,
      localNoteIds: Array.from(localNoteIds),
    });
    
    const { getWebDB } = require('./db');
    const webDB = getWebDB();
    
    for (const docSnap of snapshot.docs) {
      const firebaseNote = docSnap.data();
      const noteId = docSnap.id;
      
      // Check for duplicates
      if (localNoteIds.has(noteId)) {
        debugLog('NOTES_DOWNLOAD', 'Skipping duplicate note', { noteId });
        continue;
      }
      
      debugLog('NOTES_DOWNLOAD', 'Downloading new note', {
        noteId,
        noteTitle: firebaseNote.title,
      });
      
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
        // Native SQLite
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
        await AsyncStorage.setItem('webDB', JSON.stringify(finalWebDB));
        debugLog('NOTES_DOWNLOAD', 'Saved notes to webDB', { 
          totalNotes: finalWebDB.notes?.length || 0
        });
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
    
    for (const localKid of localKids) {
      const kidRef = doc(db, `users/${userId}/kids`, localKid.id.toString());
      const firebaseDoc = await getDoc(kidRef);
      
      if (!firebaseDoc.exists()) {
        continue;
      }
      
      const firebaseKid = firebaseDoc.data();
      const localTime = new Date(localKid.created_at).getTime();
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
        });
        
        if (firebaseKid.status === 'suspended' && localKid.status === 'active') {
          await updateKidStatus(localKid.id, 'suspended');
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
  debugLog('FULL_SYNC', '========== STARTING FULL SYNC ==========', { userId });
  
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
      sessionsUploaded: 0,
      kidsDownloaded: 0,
      sessionsDownloaded: 0,
      notesUploaded: 0,
      notesDownloaded: 0,
      errors: [],
    };
    
    // Step 0: Upload user profile FIRST (critical for foreign key relationships)
    debugLog('FULL_SYNC', 'Step 0: Uploading user profile');
    const profileUpload = await uploadUserProfileToFirebase(userId);
    results.userProfileUploaded = profileUpload.success;
    if (!profileUpload.success) {
      const error = `User profile upload: ${profileUpload.error}`;
      results.errors.push(error);
      debugLog('FULL_SYNC', 'User profile upload failed - continuing with other syncs', { error });
    }
    
    // Step 0.5: Download user profile (in case updated from another device)
    debugLog('FULL_SYNC', 'Step 0.5: Downloading user profile');
    const profileDownload = await downloadUserProfileFromFirebase(userId);
    results.userProfileDownloaded = profileDownload.success;
    if (!profileDownload.success && profileDownload.error !== 'No user profile found') {
      const error = `User profile download: ${profileDownload.error}`;
      results.errors.push(error);
      debugLog('FULL_SYNC', 'User profile download failed', { error });
    }
    
    // Step 1: Upload local kids to Firebase (user data)
    debugLog('FULL_SYNC', 'Step 1: Uploading kids');
    const kidsUpload = await uploadKidsToFirebase(userId, academyId);
    results.kidsUploaded = kidsUpload.count || 0;
    if (!kidsUpload.success) {
      const error = `Kids upload: ${kidsUpload.error}`;
      results.errors.push(error);
      debugLog('FULL_SYNC', 'Kids upload failed', { error });
    }
    
    // Step 2: Upload local sessions to Firebase (academy-wide data)
    debugLog('FULL_SYNC', 'Step 2: Uploading sessions');
    const sessionsUpload = await uploadSessionsToFirebase(userId, academyId);
    results.sessionsUploaded = sessionsUpload.count || 0;
    if (!sessionsUpload.success) {
      const error = `Sessions upload: ${sessionsUpload.error}`;
      results.errors.push(error);
      debugLog('FULL_SYNC', 'Sessions upload failed', { error });
    }
    
    // Step 2.5: Upload local notes to Firebase
    debugLog('FULL_SYNC', 'Step 2.5: Uploading notes');
    const notesUpload = await uploadNotesToFirebase(userId, academyId);
    results.notesUploaded = notesUpload.count || 0;
    if (!notesUpload.success) {
      const error = `Notes upload: ${notesUpload.error}`;
      results.errors.push(error);
      debugLog('FULL_SYNC', 'Notes upload failed', { error });
    }
    
    // Step 3: Download kids from Firebase
    debugLog('FULL_SYNC', 'Step 3: Downloading kids');
    const kidsDownload = await downloadKidsFromFirebase(userId);
    results.kidsDownloaded = kidsDownload.count || 0;
    if (!kidsDownload.success) {
      const error = `Kids download: ${kidsDownload.error}`;
      results.errors.push(error);
      debugLog('FULL_SYNC', 'Kids download failed', { error });
    }
    
    // Step 4: Download sessions from Firebase (academy-wide)
    debugLog('FULL_SYNC', 'Step 4: Downloading sessions');
    const sessionsDownload = await downloadSessionsFromFirebase(userId, academyId);
    results.sessionsDownloaded = sessionsDownload.count || 0;
    if (!sessionsDownload.success) {
      const error = `Sessions download: ${sessionsDownload.error}`;
      results.errors.push(error);
      debugLog('FULL_SYNC', 'Sessions download failed', { error });
    }
    
    // Step 4.5: Download notes from Firebase
    debugLog('FULL_SYNC', 'Step 4.5: Downloading notes');
    const notesDownload = await downloadNotesFromFirebase(userId, academyId);
    results.notesDownloaded = notesDownload.count || 0;
    if (!notesDownload.success) {
      const error = `Notes download: ${notesDownload.error}`;
      results.errors.push(error);
      debugLog('FULL_SYNC', 'Notes download failed', { error });
    }
    
    // Step 5: Resolve conflicts
    debugLog('FULL_SYNC', 'Step 5: Resolving conflicts');
    const conflictResolution = await resolveConflicts(userId);
    if (!conflictResolution.success) {
      const error = `Conflict resolution: ${conflictResolution.error}`;
      results.errors.push(error);
      debugLog('FULL_SYNC', 'Conflict resolution failed', { error });
    }
    
    // Update sync timestamp
    lastSyncTimestamp = Date.now();
    await AsyncStorage.setItem('lastSyncTimestamp', lastSyncTimestamp.toString());
    
    debugLog('FULL_SYNC', '========== SYNC COMPLETED ==========', {
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
          debugLog('AUTO_SYNC', 'Starting auto-sync for user', { userId });
          await performFullSync(userId);
        } else {
          debugLog('AUTO_SYNC', 'No user ID available for auto-sync');
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

// ========== CLEANUP DUPLICATES ==========

/**
 * Remove duplicate kids from Firebase academy collection
 * Keeps only the first occurrence of each unique kid (by ID)
 */
export const cleanupDuplicateKids = async () => {
  debugLog('CLEANUP', 'Starting duplicate cleanup...');
  
  try {
    const ACADEMY_ID = 'academy_accellax361_main';
    const kidsRef = collection(db, `academies/${ACADEMY_ID}/kids`);
    const snapshot = await getDocs(kidsRef);
    
    debugLog('CLEANUP', 'Total kids in academy', { count: snapshot.size });
    
    // Group kids by ID to find duplicates
    const kidsByID = new Map();
    const duplicates = [];
    
    snapshot.forEach(docSnap => {
      const kid = docSnap.data();
      const kidId = kid.id.toString();
      
      if (kidsByID.has(kidId)) {
        // Duplicate found!
        duplicates.push({
          docId: docSnap.id,
          kidId: kidId,
          name: kid.name,
          created_at: kid.created_at
        });
      } else {
        // First occurrence - keep this one
        kidsByID.set(kidId, {
          docId: docSnap.id,
          kid: kid
        });
      }
    });
    
    debugLog('CLEANUP', 'Found duplicates', { count: duplicates.length });
    
    if (duplicates.length === 0) {
      debugLog('CLEANUP', 'No duplicates found - academy is clean!');
      return { success: true, deleted: 0 };
    }
    
    // Show duplicates before deleting
    duplicates.forEach((dup, index) => {
      debugLog('CLEANUP', `Duplicate ${index + 1}`, {
        kidId: dup.kidId,
        name: dup.name,
        docId: dup.docId
      });
    });
    
    // Delete duplicates
    let deletedCount = 0;
    for (const dup of duplicates) {
      try {
        const kidDocRef = doc(db, `academies/${ACADEMY_ID}/kids`, dup.docId);
        await deleteDoc(kidDocRef);
        debugLog('CLEANUP', 'Deleted duplicate', { name: dup.name, kidId: dup.kidId });
        deletedCount++;
      } catch (error) {
        debugError('CLEANUP', `Failed to delete ${dup.name}`, error);
      }
    }
    
    debugLog('CLEANUP', 'Cleanup complete', {
      deleted: deletedCount,
      remaining: kidsByID.size
    });
    
    return {
      success: true,
      deleted: deletedCount,
      remaining: kidsByID.size
    };
    
  } catch (error) {
    debugError('CLEANUP', 'Cleanup failed', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get duplicate statistics without deleting
 */
export const getDuplicateStats = async () => {
  try {
    const ACADEMY_ID = 'academy_accellax361_main';
    const kidsRef = collection(db, `academies/${ACADEMY_ID}/kids`);
    const snapshot = await getDocs(kidsRef);
    
    const kidsByID = new Map();
    const duplicates = [];
    
    snapshot.forEach(docSnap => {
      const kid = docSnap.data();
      const kidId = kid.id.toString();
      
      if (kidsByID.has(kidId)) {
        duplicates.push({
          kidId: kidId,
          name: kid.name
        });
      } else {
        kidsByID.set(kidId, kid);
      }
    });
    
    return {
      totalKids: snapshot.size,
      uniqueKids: kidsByID.size,
      duplicates: duplicates.length,
      duplicateList: duplicates
    };
    
  } catch (error) {
    debugError('DUPLICATE_STATS', 'Error getting duplicate stats', error);
    return { error: error.message };
  }
};

// ========== MANUAL OPERATIONS ==========

export const uploadKids = async (userId) => {
  const academyId = await getAcademyId();
  return await uploadKidsToFirebase(userId, academyId);
};

export const uploadSessions = async (userId) => {
  const academyId = await getAcademyId();
  return await uploadSessionsToFirebase(userId, academyId);
};

export const downloadKids = async (userId) => {
  return await downloadKidsFromFirebase(userId);
};

export const downloadSessions = async (userId) => {
  const academyId = await getAcademyId();
  return await downloadSessionsFromFirebase(userId, academyId);
};

export const uploadUserProfile = async (userId) => {
  return await uploadUserProfileToFirebase(userId);
};

export const downloadUserProfile = async (userId) => {
  return await downloadUserProfileFromFirebase(userId);
};

export const uploadNotes = async (userId) => {
  const academyId = await getAcademyId();
  return await uploadNotesToFirebase(userId, academyId);
};

export const downloadNotes = async (userId) => {
  const academyId = await getAcademyId();
  return await downloadNotesFromFirebase(userId, academyId);
};

// ========== RESET SYNC STATUS ==========

export const resetSyncStatus = async () => {
  debugLog('RESET', 'Resetting sync status...');
  
  try {
    if (isWeb) {
      const keys = await AsyncStorage.getAllKeys();
      const syncKeys = keys.filter(k => k.startsWith('synced_'));
      await AsyncStorage.multiRemove(syncKeys);
      debugLog('RESET', `Removed ${syncKeys.length} sync keys from AsyncStorage`);
    } else {
      const db = getDatabase();
      await db.execAsync(`
        UPDATE kids SET firebase_synced = 0;
        UPDATE sessions SET firebase_synced = 0;
        UPDATE attendance SET firebase_synced = 0;
        UPDATE notes SET firebase_synced = 0;
      `);
      debugLog('RESET', 'Reset firebase_synced flags in database');
    }
    
    await AsyncStorage.removeItem('lastSyncTimestamp');
    lastSyncTimestamp = null;
    
    debugLog('RESET', 'Sync status reset complete');
    return { success: true };
    
  } catch (error) {
    debugError('RESET', 'Error resetting sync status', error);
    return { success: false, error: error.message };
  }
};

// ========== INITIALIZE ==========

export const initializeSync = async () => {
  try {
    debugLog('INIT', 'Initializing sync system...');
    
    const storedTimestamp = await AsyncStorage.getItem('lastSyncTimestamp');
    if (storedTimestamp) {
      lastSyncTimestamp = parseInt(storedTimestamp);
      debugLog('INIT', 'Loaded last sync timestamp', { 
        timestamp: new Date(lastSyncTimestamp).toISOString() 
      });
    }
    
    debugLog('INIT', 'Sync system initialized (auto-sync will start after login)');
    
  } catch (error) {
    debugError('INIT', 'Error initializing sync', error);
  }
};

// ========== DIAGNOSTIC TOOLS ==========

/**
 * Get comprehensive sync diagnostic information
 */
export const getSyncDiagnostics = async () => {
  debugLog('DIAGNOSTICS', 'Gathering sync diagnostics...');
  
  try {
    const userId = await AsyncStorage.getItem('currentUserId');
    const academyId = await getAcademyId();
    const lastSync = await AsyncStorage.getItem('lastSyncTimestamp');
    const online = await isOnline();
    
    // Get local data counts
    const localKids = await getAllKids();
    const localSessions = await getAllSessions();
    const localNotes = await getAllNotes();
    
    // Get unsynced counts
    const unsyncedKids = await getUnsyncedRecords('kids', getAllKids);
    const unsyncedSessions = await getUnsyncedRecords('sessions', getAllSessions);
    const unsyncedNotes = await getUnsyncedRecords('notes', getAllNotes);
    
    // Check Firebase user existence
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
        totalSessions: localSessions.length,
        totalNotes: localNotes.length,
        unsyncedKids: unsyncedKids.length,
        unsyncedSessions: unsyncedSessions.length,
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

/**
 * Export sync logs to console (for debugging)
 */
export const exportSyncLogs = async () => {
  const logs = await getSyncDebugLogs();
  console.log('========== SYNC DEBUG LOGS ==========');
  console.log(JSON.stringify(logs, null, 2));
  console.log('====================================');
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
  uploadSessions,
  downloadKids,
  downloadSessions,
  uploadUserProfile,
  downloadUserProfile,
  uploadNotes,
  downloadNotes,
  resetSyncStatus,
  initializeSync,
  getSyncDebugLogs,
  clearSyncDebugLogs,
  getSyncDiagnostics,
  exportSyncLogs,
  cleanupDuplicateKids,
  getDuplicateStats,
};