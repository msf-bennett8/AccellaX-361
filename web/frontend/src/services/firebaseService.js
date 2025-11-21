/**
 * File: web/frontend/src/services/firebaseService.js
 * AccellaX 361° - Firebase Real-time Service
 */

import { 
  getFirestore, 
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
  onSnapshot,
  Timestamp
} from 'firebase/firestore';

import { getAuth } from 'firebase/auth';
import { getApp } from 'firebase/app';

/**
 * Get Firebase instances (initialized in index.jsx)
 * These are lazily loaded to ensure Firebase is initialized first
 */
let app;
let db;
let auth;

const getFirebaseApp = () => {
  if (!app) {
    try {
      app = getApp();
    } catch (error) {
      console.error('❌ Firebase not initialized. Make sure index.jsx initializes Firebase first.');
      throw new Error('Firebase not initialized');
    }
  }
  return app;
};

const getFirebaseDb = () => {
  if (!db) {
    const firebaseApp = getFirebaseApp();
    db = getFirestore(firebaseApp);
  }
  return db;
};

const getFirebaseAuth = () => {
  if (!auth) {
    const firebaseApp = getFirebaseApp();
    auth = getAuth(firebaseApp);
  }
  return auth;
};

/**
 * KIDS COLLECTION
 */

// Get all kids (with optional filters)
export const getKids = async (filters = {}) => {
  try {
    const firebaseDb = getFirebaseDb();
    let q = collection(firebaseDb, 'kids');
    
    // Apply filters
    if (filters.academyId) {
      q = query(q, where('academy_id', '==', filters.academyId));
    }
    if (filters.ageGroup) {
      q = query(q, where('age_group', '==', filters.ageGroup));
    }
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('❌ Error fetching kids:', error);
    throw error;
  }
};

// Get single kid by ID
export const getKid = async (kidId) => {
  try {
    const firebaseDb = getFirebaseDb();
    const docRef = doc(firebaseDb, 'kids', kidId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching kid:', error);
    throw error;
  }
};

// Real-time listener for kids
export const subscribeToKids = (academyId, callback) => {
  const firebaseDb = getFirebaseDb();
  const q = query(
    collection(firebaseDb, 'kids'),
    where('academy_id', '==', academyId)
  );

  return onSnapshot(q, (snapshot) => {
    const kids = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(kids);
  }, (error) => {
    console.error('❌ Kids listener error:', error);
  });
};

/**
 * SESSIONS COLLECTION
 */

// Get all sessions
export const getSessions = async (filters = {}) => {
  try {
    const firebaseDb = getFirebaseDb();
    let q = collection(firebaseDb, 'sessions');
    
    if (filters.academyId) {
      q = query(q, where('academy_id', '==', filters.academyId));
    }
    if (filters.date) {
      q = query(q, where('session_date', '==', filters.date));
    }
    if (filters.coachId) {
      q = query(q, where('coach_id', '==', filters.coachId));
    }

    // Order by date descending
    q = query(q, orderBy('session_date', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('❌ Error fetching sessions:', error);
    throw error;
  }
};

// Get single session
export const getSession = async (sessionId) => {
  try {
    const firebaseDb = getFirebaseDb();
    const docRef = doc(firebaseDb, 'sessions', sessionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching session:', error);
    throw error;
  }
};

// Real-time listener for today's sessions
export const subscribeToTodaySessions = (academyId, callback) => {
  const firebaseDb = getFirebaseDb();
  const today = new Date().toISOString().split('T')[0];
  
  const q = query(
    collection(firebaseDb, 'sessions'),
    where('academy_id', '==', academyId),
    where('session_date', '==', today)
  );

  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(sessions);
  }, (error) => {
    console.error('❌ Sessions listener error:', error);
  });
};

/**
 * ATTENDANCE COLLECTION
 */

// Get attendance for a session
export const getSessionAttendance = async (sessionId) => {
  try {
    const firebaseDb = getFirebaseDb();
    const q = query(
      collection(firebaseDb, 'attendance'),
      where('session_id', '==', sessionId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('❌ Error fetching attendance:', error);
    throw error;
  }
};

// Real-time listener for session attendance
export const subscribeToSessionAttendance = (sessionId, callback) => {
  const firebaseDb = getFirebaseDb();
  const q = query(
    collection(firebaseDb, 'attendance'),
    where('session_id', '==', sessionId)
  );

  return onSnapshot(q, (snapshot) => {
    const attendance = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(attendance);
  }, (error) => {
    console.error('❌ Attendance listener error:', error);
  });
};

// Get kid's attendance history
export const getKidAttendanceHistory = async (kidId) => {
  try {
    const firebaseDb = getFirebaseDb();
    const q = query(
      collection(firebaseDb, 'attendance'),
      where('kid_id', '==', kidId),
      orderBy('marked_at', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('❌ Error fetching kid attendance:', error);
    throw error;
  }
};

/**
 * EVENTS COLLECTION
 */

// Get upcoming events
export const getUpcomingEvents = async (academyId) => {
  try {
    const firebaseDb = getFirebaseDb();
    const today = Timestamp.now();
    
    const q = query(
      collection(firebaseDb, 'events'),
      where('academy_id', '==', academyId),
      where('event_date', '>=', today),
      orderBy('event_date', 'asc'),
      limit(10)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('❌ Error fetching events:', error);
    throw error;
  }
};

// Real-time listener for events
export const subscribeToEvents = (academyId, callback) => {
  const firebaseDb = getFirebaseDb();
  const q = query(
    collection(firebaseDb, 'events'),
    where('academy_id', '==', academyId),
    orderBy('event_date', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(events);
  }, (error) => {
    console.error('❌ Events listener error:', error);
  });
};

/**
 * NOTIFICATIONS COLLECTION
 */

// Get user notifications
export const getUserNotifications = async (userId) => {
  try {
    const firebaseDb = getFirebaseDb();
    const q = query(
      collection(firebaseDb, 'notifications'),
      where('user_id', '==', userId),
      where('read', '==', false),
      orderBy('created_at', 'desc'),
      limit(20)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    throw error;
  }
};

// Real-time listener for notifications
export const subscribeToNotifications = (userId, callback) => {
  const firebaseDb = getFirebaseDb();
  const q = query(
    collection(firebaseDb, 'notifications'),
    where('user_id', '==', userId),
    orderBy('created_at', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(notifications);
  }, (error) => {
    console.error('❌ Notifications listener error:', error);
  });
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const firebaseDb = getFirebaseDb();
    const docRef = doc(firebaseDb, 'notifications', notificationId);
    await updateDoc(docRef, { read: true });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    throw error;
  }
};

/**
 * UTILITY FUNCTIONS
 */

// Check Firebase connection status
export const checkFirebaseConnection = () => {
  return new Promise((resolve) => {
    const firebaseDb = getFirebaseDb();
    const testRef = doc(firebaseDb, '__connection_test__', 'test');
    const unsubscribe = onSnapshot(
      testRef,
      () => {
        unsubscribe();
        resolve(true);
      },
      () => {
        unsubscribe();
        resolve(false);
      }
    );
  });
};

// Get Firebase Auth current user
export const getCurrentFirebaseUser = () => {
  const firebaseAuth = getFirebaseAuth();
  return firebaseAuth.currentUser;
};

// Export getters for Firebase instances
export { getFirebaseApp as app, getFirebaseDb as db, getFirebaseAuth as auth };

/**
 * Export all services
 */
export default {
  // Kids
  getKids,
  getKid,
  subscribeToKids,
  
  // Sessions
  getSessions,
  getSession,
  subscribeToTodaySessions,
  
  // Attendance
  getSessionAttendance,
  subscribeToSessionAttendance,
  getKidAttendanceHistory,
  
  // Events
  getUpcomingEvents,
  subscribeToEvents,
  
  // Notifications
  getUserNotifications,
  subscribeToNotifications,
  markNotificationAsRead,
  
  // Utilities
  checkFirebaseConnection,
  getCurrentFirebaseUser,
};