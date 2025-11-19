import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// For web: use AsyncStorage as temporary mock
// For mobile (Android/iOS): use expo-sqlite

let db;
const isWeb = Platform.OS === 'web';

// Mock database for web testing
const webDB = {
  users: [],
  kids: [],
  sessions: [],
  attendance: [],
  notes: [], // ✅ ADD THIS
};

// ========== INITIALIZATION ==========

export const initDatabase = async () => {
  if (isWeb) {
    console.log('Using AsyncStorage for web (mock database)');
    // Load mock data from AsyncStorage if exists
    try {
      const stored = await AsyncStorage.getItem('webDB');
      if (stored) {
        const parsed = JSON.parse(stored);
        webDB.users = parsed.users || [];
        webDB.kids = parsed.kids || [];
        webDB.sessions = parsed.sessions || [];
        webDB.attendance = parsed.attendance || [];
        webDB.notes = parsed.notes || []; // ✅ ADD THIS
      }
    } catch (error) {
      console.error('Error loading web DB:', error);
    }
    return;
  }

  // Real SQLite for mobile (Android & iOS)
  const SQLite = require('expo-sqlite');
  db = await SQLite.openDatabaseAsync('accellax361.db');
  
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      username TEXT,
      phone TEXT,
      password_hash TEXT,
      auth_method TEXT DEFAULT 'accellax',
      avatar_base64 TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME,
      firebase_synced INTEGER DEFAULT 0,
      is_offline_account INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS kids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT,
    area_of_residence TEXT,
    age_group TEXT NOT NULL,
    sponsorshipType TEXT DEFAULT 'SP',
    programType TEXT DEFAULT 'ELT',
    programTypeOther TEXT,
    trialNotes TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    firebase_synced INTEGER DEFAULT 0
  );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      academy_id TEXT NOT NULL,
      session_date DATE NOT NULL,
      session_time TEXT NOT NULL,
      day_of_week TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      general_notes TEXT,
      created_by TEXT,
      last_modified_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      firebase_synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      kid_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      firebase_synced INTEGER DEFAULT 0,
      FOREIGN KEY (session_id) REFERENCES sessions(id),
      FOREIGN KEY (kid_id) REFERENCES kids(id)
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      academy_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      note_type TEXT NOT NULL,
      related_id INTEGER,
      related_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      firebase_synced INTEGER DEFAULT 0
    );
  `);
  
  console.log('SQLite database initialized with notes table');
};

// Save web DB to AsyncStorage
const saveWebDB = async () => {
  if (isWeb) {
    await AsyncStorage.setItem('webDB', JSON.stringify(webDB));
  }
};

// Helper function to generate IDs for web
const generateId = () => Date.now() + Math.random();

// ========== USERS CRUD ==========

export const createUser = async (userData) => {
  if (isWeb) {
    const user = {
      id: userData.id,
      full_name: userData.fullName,
      email: userData.email,
      username: userData.username || '',
      phone: userData.phone || '',
      password_hash: userData.passwordHash || '',
      auth_method: userData.authMethod || 'accellax',
      role: userData.role || 'coach',
      avatar_base64: userData.avatarBase64 || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      firebase_synced: 0,
      is_offline_account: userData.isOfflineAccount ? 1 : 0,
    };
    webDB.users.push(user);
    await saveWebDB();
    return user;
  }

  const result = await db.runAsync(
    `INSERT INTO users (id, full_name, email, username, phone, password_hash, auth_method, role, avatar_base64, is_offline_account) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userData.id,
      userData.fullName,
      userData.email,
      userData.username || '',
      userData.phone || '',
      userData.passwordHash || '',
      userData.authMethod || 'accellax',
      userData.role || 'coach',
      userData.avatarBase64 || null,
      userData.isOfflineAccount ? 1 : 0,
    ]
  );

  return {
    id: userData.id,
    full_name: userData.fullName,
    email: userData.email,
    username: userData.username,
    phone: userData.phone,
    role: userData.role || 'coach',
    created_at: new Date().toISOString(),
  };
};

export const getUserById = async (userId) => {
  if (isWeb) {
    return webDB.users.find(u => u.id === userId);
  }
  return await db.getFirstAsync('SELECT * FROM users WHERE id = ?', [userId]);
};

export const getUserByEmail = async (email) => {
  if (isWeb) {
    return webDB.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }
  return await db.getFirstAsync('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
};

export const updateUser = async (userId, updates) => {
  if (isWeb) {
    const index = webDB.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      webDB.users[index] = {
        ...webDB.users[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      await saveWebDB();
    }
    return;
  }

  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(updates), userId];
  
  await db.runAsync(
    `UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    values
  );
};

export const deleteUser = async (userId) => {
  if (isWeb) {
    webDB.users = webDB.users.filter(u => u.id !== userId);
    await saveWebDB();
    return;
  }

  await db.runAsync('DELETE FROM users WHERE id = ?', [userId]);
};

// Update specific user fields (helper for role updates, etc.)
export const updateUserField = async (userId, field, value) => {
  if (isWeb) {
    const index = webDB.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      webDB.users[index][field] = value;
      webDB.users[index].updated_at = new Date().toISOString();
      await saveWebDB();
    }
    return;
  }

  await db.runAsync(
    `UPDATE users SET ${field} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [value, userId]
  );
};

// ========== KIDS CRUD ==========

export const insertKid = async (userId, name, age, gender, area, ageGroup, sponsorshipType = 'SP', programType = 'ELT', programTypeOther = null, trialNotes = null) => {
  // ALWAYS use the fixed academy ID
  const FIXED_ACADEMY_ID = 'academy_accellax361_main';
  
  if (isWeb) {
    const kid = {
      id: generateId(),
      user_id: userId,
      name,
      age,
      gender,
      area_of_residence: area,
      age_group: ageGroup,
      sponsorshipType,
      programType,
      programTypeOther: programTypeOther || null,
      trialNotes: trialNotes || null,
      status: programType === 'Trial' ? 'trial' : 'active',
      created_at: new Date().toISOString(),
      firebase_synced: 0,
    };
    
    // Upload to Firebase academy collection (single source of truth)
    try {
      console.log('🔄 Adding kid to Firebase academy collection...');
      console.log('🏫 Academy ID:', FIXED_ACADEMY_ID);
      
      const { db } = await import('../config/firebase.js');
      const { doc, setDoc, Timestamp } = await import('firebase/firestore');
      
      const kidRef = doc(db, `academies/${FIXED_ACADEMY_ID}/kids`, kid.id.toString());
        await setDoc(kidRef, {
          id: kid.id.toString(),
          name: kid.name,
          age: kid.age,
          gender: kid.gender,
          area_of_residence: kid.area_of_residence,
          age_group: kid.age_group,
          sponsorshipType: kid.sponsorshipType,
          programType: kid.programType,
          programTypeOther: kid.programTypeOther || null,
          trialNotes: kid.trialNotes || null,
          status: kid.status,
          firebase_synced: 1,
          created_at: Timestamp.fromDate(new Date(kid.created_at)),
          created_by: userId,
          updated_at: Timestamp.now(),
          synced_at: Timestamp.now(),
        });
        
        // Mark as synced
      kid.firebase_synced = 1;
      
      console.log('✅ Kid added to academy Firebase collection');
      
      // Ensure academy ID is set in localStorage
      await AsyncStorage.setItem('academyId', FIXED_ACADEMY_ID);
      
    } catch (error) {
      console.error('⚠️ Failed to add kid to Firebase:', error);
      console.error('Error details:', error.message);
      kid.firebase_synced = 0;
    }
    
    // Note: We don't save to local webDB - kids are only in Firebase
    
    return kid;
  }

  const result = await db.runAsync(
    'INSERT INTO kids (user_id, name, age, gender, area_of_residence, age_group, sponsorshipType, programType, programTypeOther, trialNotes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [userId, name, age, gender, area, ageGroup, sponsorshipType, programType, programTypeOther, trialNotes, programType === 'Trial' ? 'trial' : 'active']
  );
  
  const kid = {
    id: result.lastInsertRowId,
    user_id: userId,
    name,
    age,
    gender,
    area_of_residence: area,
    age_group: ageGroup,
    sponsorshipType,
    programType,
    programTypeOther,
    trialNotes,
    status: programType === 'Trial' ? 'trial' : 'active',
    created_at: new Date().toISOString(),
    firebase_synced: 0,
  };
  
  // Background sync to Firebase (non-blocking)
  try {
    const FIXED_ACADEMY_ID = 'academy_accellax361_main';
    const { db: firebaseDb } = await import('../config/firebase.js');
    const { doc, setDoc, Timestamp } = await import('firebase/firestore');
    
    const kidRef = doc(firebaseDb, `academies/${FIXED_ACADEMY_ID}/kids`, kid.id.toString());
    await setDoc(kidRef, {
      id: kid.id.toString(),
      name: kid.name,
      age: kid.age,
      gender: kid.gender,
      area_of_residence: kid.area_of_residence,
      age_group: kid.age_group,
      sponsorshipType: kid.sponsorshipType,
      programType: kid.programType,
      programTypeOther: kid.programTypeOther || null,
      trialNotes: kid.trialNotes || null,
      status: kid.status,
      created_at: Timestamp.fromDate(new Date(kid.created_at)),
      created_by: userId,
      updated_at: Timestamp.now(),
      synced_at: Timestamp.now(),
    });
    
    // Mark as synced
    await db.runAsync('UPDATE kids SET firebase_synced = 1 WHERE id = ?', [kid.id]);
    console.log('✅ [Mobile] Kid synced to Firebase');
    
  } catch (error) {
    console.warn('⚠️ [Mobile] Failed to sync kid to Firebase (will retry later):', error);
    // Don't fail the operation - kid is saved locally
  }
  
  return kid;
};

export const getAllKids = async () => {
  if (isWeb) {
    return webDB.kids; // Return ALL kids, regardless of status
  }
  return await db.getAllAsync('SELECT * FROM kids ORDER BY age_group, name');
};

export const getKidsByAgeGroup = async (ageGroup) => {
  if (isWeb) {
    // Web: Always load from Firebase (no local storage)
    try {
      const FIXED_ACADEMY_ID = 'academy_accellax361_main';
      const { collection, getDocs } = await import('firebase/firestore');
      const { db: firebaseDb } = await import('../config/firebase');
      
      const kidsRef = collection(firebaseDb, `academies/${FIXED_ACADEMY_ID}/kids`);
      const snapshot = await getDocs(kidsRef);
      
      const academyKids = [];
      snapshot.forEach(doc => {
        const kid = doc.data();
        // Only include kids in this age group AND with active status
        if (kid.age_group === ageGroup && (kid.status === 'active' || !kid.status)) {
          academyKids.push({
            id: parseInt(kid.id) || kid.id,
            name: kid.name,
            age: kid.age,
            gender: kid.gender,
            area_of_residence: kid.area_of_residence,
            age_group: kid.age_group,
            sponsorshipType: kid.sponsorshipType,
            programType: kid.programType,
            programTypeOther: kid.programTypeOther || null,
            trialNotes: kid.trialNotes || null,
            status: kid.status || 'active',
            created_at: kid.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          });
        }
      });
      
      console.log(`✅ [Web] Found ${academyKids.length} active kids in ${ageGroup}`);
      return academyKids;
      
    } catch (error) {
      console.error('❌ [Web] Error loading kids from Firebase:', error);
      return [];
    }
  }
  
  // Mobile: Use SQLite as primary (offline-first)
  try {
    const kids = await db.getAllAsync(
      'SELECT * FROM kids WHERE age_group = ? AND status = "active" ORDER BY name',
      [ageGroup]
    );
    
    console.log(`✅ [Mobile] Found ${kids.length} active kids in ${ageGroup} from SQLite`);
    return kids;
    
  } catch (error) {
    console.error('❌ [Mobile] Error loading kids from SQLite:', error);
    return [];
  }
};

export const getKidById = async (id) => {
  if (isWeb) {
    return webDB.kids.find(k => k.id === id);
  }
  return await db.getFirstAsync('SELECT * FROM kids WHERE id = ?', [id]);
};

export const updateKid = async (id, data) => {
  if (isWeb) {
    const index = webDB.kids.findIndex(k => k.id === id);
    if (index !== -1) {
      webDB.kids[index] = { ...webDB.kids[index], ...data };
      await saveWebDB();
      
      // Also update in Firebase academy collection
      try {
        const FIXED_ACADEMY_ID = 'academy_accellax361_main';
        const { db } = await import('../config/firebase.js');
        const { doc, updateDoc, Timestamp } = await import('firebase/firestore');
        
        const kidRef = doc(db, `academies/${FIXED_ACADEMY_ID}/kids`, id.toString());
        await updateDoc(kidRef, {
          ...data,
          firebase_synced: 1,
          updated_at: Timestamp.now(),
        });
        console.log('✅ Kid updated in academy Firebase collection');
      } catch (error) {
        console.warn('⚠️ Failed to update kid in Firebase:', error);
      }
    }
    return;
  }

  const { name, age, gender, area_of_residence, age_group, sponsorshipType, programType, programTypeOther, trialNotes } = data;
  await db.runAsync(
    'UPDATE kids SET name = ?, age = ?, gender = ?, area_of_residence = ?, age_group = ?, sponsorshipType = ?, programType = ?, programTypeOther = ?, trialNotes = ? WHERE id = ?',
    [name, age, gender, area_of_residence, age_group, sponsorshipType, programType, programTypeOther || null, trialNotes || null, id]
  );
};

export const updateKidStatus = async (id, status) => {
  if (isWeb) {
    const index = webDB.kids.findIndex(k => k.id === id);
    if (index !== -1) {
      webDB.kids[index].status = status;
      await saveWebDB();
      
      // Also update status in Firebase academy collection
      try {
        const FIXED_ACADEMY_ID = 'academy_accellax361_main';
        const { db } = await import('../config/firebase.js');
        const { doc, updateDoc, Timestamp } = await import('firebase/firestore');
        
        const kidRef = doc(db, `academies/${FIXED_ACADEMY_ID}/kids`, id.toString());
        await updateDoc(kidRef, {
          status: status,
          firebase_synced: 1,
          updated_at: Timestamp.now(),
        });
        console.log('✅ Kid status updated in academy Firebase collection');
      } catch (error) {
        console.warn('⚠️ Failed to update kid status in Firebase:', error);
      }
    }
    return;
  }

  await db.runAsync('UPDATE kids SET status = ? WHERE id = ?', [status, id]);
};

export const deleteKid = async (id) => {
  if (isWeb) {
    webDB.kids = webDB.kids.filter(k => k.id !== id);
    await saveWebDB();
    
    // Also delete from Firebase academy collection
    try {
      const FIXED_ACADEMY_ID = 'academy_accellax361_main';
      const { db } = await import('../config/firebase.js');
      const { doc, deleteDoc } = await import('firebase/firestore');
      
      const kidRef = doc(db, `academies/${FIXED_ACADEMY_ID}/kids`, id.toString());
      await deleteDoc(kidRef);
      console.log('✅ Kid deleted from academy Firebase collection');
    } catch (error) {
      console.warn('⚠️ Failed to delete kid from Firebase:', error);
    }
    return;
  }

  await db.runAsync('DELETE FROM kids WHERE id = ?', [id]);
};

export const searchKids = async (query) => {
  if (isWeb) {
    return webDB.kids.filter(k => 
      k.name.toLowerCase().includes(query.toLowerCase()) && k.status === 'active'
    );
  }

  return await db.getAllAsync(
    'SELECT * FROM kids WHERE name LIKE ? AND status = "active" ORDER BY name',
    [`%${query}%`]
  );
};

// ========== filter function ==========
export const getKidsByFilter = async (filterType) => {
  if (isWeb) {
    let filtered = webDB.kids.filter(k => k.status === 'active');
    
    if (filterType === 'all') {
      return filtered;
    } else if (filterType === 'SC' || filterType === 'SP') {
      return filtered.filter(k => k.sponsorshipType === filterType);
    } else if (filterType === 'ELT' || filterType === 'WW') {
      return filtered.filter(k => k.programType === filterType);
    }
    
    return filtered;
  }

  if (filterType === 'all') {
    return await db.getAllAsync('SELECT * FROM kids WHERE status = "active" ORDER BY age_group, name');
  } else if (filterType === 'SC' || filterType === 'SP') {
    return await db.getAllAsync(
      'SELECT * FROM kids WHERE status = "active" AND sponsorshipType = ? ORDER BY age_group, name',
      [filterType]
    );
  } else if (filterType === 'ELT' || filterType === 'WW') {
    return await db.getAllAsync(
      'SELECT * FROM kids WHERE status = "active" AND programType = ? ORDER BY age_group, name',
      [filterType]
    );
  }
  
  return await db.getAllAsync('SELECT * FROM kids WHERE status = "active" ORDER BY age_group, name');
};

/**
 * Get session attendance filtered by kid type
 */
export const getFilteredSessionAttendance = async (sessionId, filterType = 'all') => {
  if (isWeb) {
    console.log('🔍 getFilteredSessionAttendance called with:', { sessionId, filterType });
    
    // Get all attendance for this session
    const sessionAttendance = webDB.attendance.filter(a => a.session_id === sessionId);
    console.log('📊 Raw attendance from webDB:', sessionAttendance);
    
    // Load kids from Firebase (since webDB.kids is empty)
    let allKids = [];
    try {
      const FIXED_ACADEMY_ID = 'academy_accellax361_main';
      console.log('🔄 Loading kids from Firebase...');
      
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('../config/firebase');
      
      const kidsRef = collection(db, `academies/${FIXED_ACADEMY_ID}/kids`);
      const snapshot = await getDocs(kidsRef);
      
      console.log('📦 Firebase snapshot size:', snapshot.size);
      
      snapshot.forEach(doc => {
        const kid = doc.data();
        allKids.push({
          id: parseInt(kid.id) || kid.id,
          name: kid.name,
          age: kid.age,
          gender: kid.gender,
          area_of_residence: kid.area_of_residence,
          age_group: kid.age_group,
          sponsorshipType: kid.sponsorshipType,
          programType: kid.programType,
          status: kid.status || 'active',
        });
      });
      
      console.log('✅ Loaded kids from Firebase:', allKids);
      
    } catch (error) {
      console.error('❌ Error loading kids from Firebase:', error);
      return [];
    }
    
    // Join attendance with kid details
const attendanceWithKids = sessionAttendance.map(a => {
  const kid = allKids.find(k => k.id === a.kid_id);
  console.log(`🔗 Matching kid_id ${a.kid_id}:`, kid);
  
  if (!kid) {
    console.warn(`⚠️ Kid not found for kid_id: ${a.kid_id}`);
    return {
      ...a,
      name: 'Unknown',
      age_group: 'Unknown',
      sponsorshipType: 'SP',
      programType: 'ELT',
    };
  }
  
  // Spread kid first, then attendance to preserve attendance.status
  const { status: kidStatus, ...kidData } = kid;
  return { 
    ...kidData,
    ...a,
    kid_status: kidStatus  // Rename kid status to avoid conflict
  };
});
    
    console.log('🎯 Final attendanceWithKids:', attendanceWithKids);
    
    // Apply filter
    if (filterType === 'all') {
      return attendanceWithKids;
    }
    
    // Filter by sponsorship or program type
    return attendanceWithKids.filter(att => {
      if (filterType === 'SC' || filterType === 'SP') {
        return att.sponsorshipType === filterType;
      } else if (filterType === 'ELT' || filterType === 'WW') {
        return att.programType === filterType;
      }
      return true;
    });
  }

  // For native (SQLite)
  let query = `
    SELECT a.*, k.name, k.age, k.gender, k.area_of_residence, k.age_group, 
           k.sponsorshipType, k.programType, k.status
    FROM attendance a
    JOIN kids k ON a.kid_id = k.id
    WHERE a.session_id = ?
  `;
  
  const params = [sessionId];
  
  if (filterType === 'SC' || filterType === 'SP') {
    query += ` AND k.sponsorshipType = ?`;
    params.push(filterType);
  } else if (filterType === 'ELT' || filterType === 'WW') {
    query += ` AND k.programType = ?`;
    params.push(filterType);
  }
  
  query += ` ORDER BY k.age_group, k.name`;
  
  return await db.getAllAsync(query, params);
};

// ========== SESSIONS ==========

export const createSession = async (userId, date, time, dayOfWeek) => {
  const FIXED_ACADEMY_ID = 'academy_accellax361_main';
  
  if (isWeb) {
    // Generate string ID to match Firebase doc IDs
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session = {
      id: sessionId,
      academy_id: FIXED_ACADEMY_ID,
      session_date: date,
      session_time: time,
      day_of_week: dayOfWeek,
      status: 'draft',
      general_notes: '',
      created_by: userId,
      last_modified_by: userId,
      created_at: new Date().toISOString(),
      firebase_synced: 0,
    };
    webDB.sessions.push(session);
    await saveWebDB();
    return session;
  }

  const result = await db.runAsync(
    'INSERT INTO sessions (academy_id, session_date, session_time, day_of_week, status, created_by, last_modified_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [FIXED_ACADEMY_ID, date, time, dayOfWeek, 'draft', userId, userId]
  );
  
  return {
    id: result.lastInsertRowId,
    academy_id: FIXED_ACADEMY_ID,
    session_date: date,
    session_time: time,
    day_of_week: dayOfWeek,
    status: 'draft',
    general_notes: '',
    created_by: userId,
    last_modified_by: userId,
    created_at: new Date().toISOString(),
    firebase_synced: 0,
  };
};

/**
 * Get session by date and user (prevents duplicates)
 */
export const getSessionByDate = async (academyId, date) => {
  if (isWeb) {
    return webDB.sessions.find(
      s => s.academy_id === academyId && s.session_date === date
    ) || null;
  }
  return await db.getFirstAsync(
    'SELECT * FROM sessions WHERE academy_id = ? AND session_date = ?',
    [academyId, date]
  );
};

/**
 * Create or get existing session (prevents duplicates)
 */
export const createOrGetSession = async (userId, date, time, dayOfWeek) => {
  const FIXED_ACADEMY_ID = 'academy_accellax361_main';
  const existingSession = await getSessionByDate(FIXED_ACADEMY_ID, date);
  
  if (existingSession) {
    console.log('📋 Session already exists for', date, '- returning existing');
    return existingSession;
  }
  
  console.log('✨ Creating new session for', date);
  return await createSession(userId, date, time, dayOfWeek);
};

export const getSessionById = async (sessionId) => {
  if (isWeb) {
    return webDB.sessions.find(s => s.id === sessionId);
  }
  return await db.getFirstAsync('SELECT * FROM sessions WHERE id = ?', [sessionId]);
};

export const getAllSessions = async () => {
  if (isWeb) {
    return webDB.sessions.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
  }
  return await db.getAllAsync('SELECT * FROM sessions ORDER BY created_at DESC');
};

export const updateSessionNotes = async (sessionId, notes) => {
  if (isWeb) {
    const session = webDB.sessions.find(s => s.id === sessionId);
    if (session) {
      session.general_notes = notes;
      session.firebase_synced = 0; // Mark as needing sync
      await saveWebDB();
    }
    return;
  }

  await db.runAsync(
    'UPDATE sessions SET general_notes = ?, firebase_synced = 0 WHERE id = ?',
    [notes, sessionId]
  );
};

/**
 * Update session status (draft → in_progress → completed)
 */
export const updateSessionStatus = async (sessionId, status, userId) => {
  if (isWeb) {
    const session = webDB.sessions.find(s => s.id === sessionId);
    if (session) {
      session.status = status;
      session.last_modified_by = userId;
      session.firebase_synced = 0; // Mark as needing sync
      await saveWebDB();
    }
    return;
  }

  await db.runAsync(
    'UPDATE sessions SET status = ?, last_modified_by = ?, firebase_synced = 0 WHERE id = ?',
    [status, userId, sessionId]
  );
};

export const deleteSession = async (sessionId) => {
  if (isWeb) {
    // Delete session and related attendance
    webDB.sessions = webDB.sessions.filter(s => s.id !== sessionId);
    webDB.attendance = webDB.attendance.filter(a => a.session_id !== sessionId);
    await saveWebDB();
    return;
  }

  // Delete attendance records first (foreign key constraint)
  await db.runAsync('DELETE FROM attendance WHERE session_id = ?', [sessionId]);
  await db.runAsync('DELETE FROM sessions WHERE id = ?', [sessionId]);
};

// ========== ATTENDANCE ==========

export const markAttendance = async (sessionId, kidId, status, markedBy = 'System') => {
  const timestamp = new Date().toISOString();
  
  if (isWeb) {
    // Check if attendance already exists for this kid in this session
    const existingIndex = webDB.attendance.findIndex(
      a => a.session_id === sessionId && a.kid_id === kidId
    );

    if (existingIndex !== -1) {
      // Update existing attendance
      webDB.attendance[existingIndex].status = status;
      webDB.attendance[existingIndex].marked_at = timestamp;
      webDB.attendance[existingIndex].marked_by = markedBy;
    } else {
      // Create new attendance record
      const attendance = {
        id: generateId(),
        session_id: sessionId,
        kid_id: kidId,
        status,
        marked_at: timestamp,
        marked_by: markedBy,
        firebase_synced: 0,
      };
      webDB.attendance.push(attendance);
    }
    
    // Update session status to 'in_progress' on first attendance
    const session = webDB.sessions.find(s => s.id === sessionId);
    if (session && session.status === 'draft') {
      session.status = 'in_progress';
      session.last_modified_by = markedBy;
    }
    
    await saveWebDB();
    return;
  }

  // For mobile, use REPLACE to handle duplicates
  await db.runAsync(
    `INSERT OR REPLACE INTO attendance (session_id, kid_id, status, marked_at, marked_by) 
     VALUES (?, ?, ?, ?, ?)`,
    [sessionId, kidId, status, timestamp, markedBy]
  );
  
  // Update session status to 'in_progress' on first attendance
  await db.runAsync(
    `UPDATE sessions SET status = 'in_progress', last_modified_by = ? 
     WHERE id = ? AND status = 'draft'`,
    [markedBy, sessionId]
  );
};

export const getSessionAttendance = async (sessionId) => {
  if (isWeb) {
    return webDB.attendance.filter(a => a.session_id === sessionId);
  }
  return await db.getAllAsync(
    'SELECT * FROM attendance WHERE session_id = ?',
    [sessionId]
  );
};

export const getKidAttendanceHistory = async (kidId) => {
  if (isWeb) {
    const kidAttendance = webDB.attendance.filter(a => a.kid_id === kidId);
    // Join with sessions to get session details
    return kidAttendance.map(a => {
      const session = webDB.sessions.find(s => s.id === a.session_id);
      return { ...a, session };
    });
  }

  return await db.getAllAsync(
    `SELECT a.*, s.session_date, s.session_time, s.day_of_week 
     FROM attendance a 
     JOIN sessions s ON a.session_id = s.id 
     WHERE a.kid_id = ? 
     ORDER BY s.session_date DESC`,
    [kidId]
  );
};

export const getKidAttendanceStats = async (kidId) => {
  if (isWeb) {
    const kidAttendance = webDB.attendance.filter(a => a.kid_id === kidId);
    const total = kidAttendance.length;
    const present = kidAttendance.filter(a => a.status === 'present').length;
    const absent = kidAttendance.filter(a => a.status === 'absent').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      total,
      present,
      absent,
      percentage,
    };
  }

  const result = await db.getFirstAsync(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent
     FROM attendance 
     WHERE kid_id = ?`,
    [kidId]
  );

  return {
    total: result.total || 0,
    present: result.present || 0,
    absent: result.absent || 0,
    percentage: result.total > 0 ? Math.round((result.present / result.total) * 100) : 0,
  };
};

export const clearAgeGroupAttendance = async (sessionId, ageGroup) => {
  if (isWeb) {
    // Get all kid IDs in the age group
    const kidsInGroup = webDB.kids.filter(k => k.age_group === ageGroup);
    const kidIds = kidsInGroup.map(k => k.id);
    
    // Remove attendance records for these kids in this session
    webDB.attendance = webDB.attendance.filter(
      a => !(a.session_id === sessionId && kidIds.includes(a.kid_id))
    );
    await saveWebDB();
    return;
  }

  await db.runAsync(
    `DELETE FROM attendance 
     WHERE session_id = ? 
     AND kid_id IN (SELECT id FROM kids WHERE age_group = ?)`,
    [sessionId, ageGroup]
  );
};

export const deleteAttendanceForAgeGroup = async (sessionId, ageGroup) => {
  if (isWeb) {
    // Get all kid IDs in the age group
    const kidsInGroup = webDB.kids.filter(k => k.age_group === ageGroup);
    const kidIds = kidsInGroup.map(k => k.id);
    
    console.log(`Deleting attendance for ${kidIds.length} kids in age group ${ageGroup}`);
    
    // Remove attendance records for these kids in this session
    webDB.attendance = webDB.attendance.filter(
      a => !(a.session_id === sessionId && kidIds.includes(a.kid_id))
    );
    await saveWebDB();
    return;
  }

  await db.runAsync(
    `DELETE FROM attendance 
     WHERE session_id = ? 
     AND kid_id IN (SELECT id FROM kids WHERE age_group = ?)`,
    [sessionId, ageGroup]
  );
  
  console.log(`Deleted attendance for age group ${ageGroup} in session ${sessionId}`);
};

// ========== STATISTICS & REPORTS ==========

export const getSessionStats = async (sessionId) => {
  if (isWeb) {
    const attendance = webDB.attendance.filter(a => a.session_id === sessionId);
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      total,
      present,
      absent,
      percentage,
    };
  }

  const result = await db.getFirstAsync(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent
     FROM attendance 
     WHERE session_id = ?`,
    [sessionId]
  );

  return {
    total: result.total || 0,
    present: result.present || 0,
    absent: result.absent || 0,
    percentage: result.total > 0 ? Math.round((result.present / result.total) * 100) : 0,
  };
};

export const getOverallStats = async () => {
  if (isWeb) {
    const totalKids = webDB.kids.filter(k => k.status === 'active').length;
    const totalSessions = webDB.sessions.length;
    const totalAttendance = webDB.attendance.length;
    const presentCount = webDB.attendance.filter(a => a.status === 'present').length;
    const avgAttendance = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    return {
      totalKids,
      totalSessions,
      avgAttendance,
    };
  }

  const kids = await db.getFirstAsync('SELECT COUNT(*) as count FROM kids WHERE status = "active"');
  const sessions = await db.getFirstAsync('SELECT COUNT(*) as count FROM sessions');
  const attendance = await db.getFirstAsync(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
     FROM attendance`
  );

  return {
    totalKids: kids.count || 0,
    totalSessions: sessions.count || 0,
    avgAttendance: attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0,
  };
};

/**
 * Get sessions for current week (Sunday to Saturday)
 */
export const getThisWeekSessions = async () => {
  // Get start of week (Sunday)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Get end of week (Saturday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  const startDate = startOfWeek.toISOString().split('T')[0];
  const endDate = endOfWeek.toISOString().split('T')[0];
  
  if (isWeb) {
    return webDB.sessions.filter(s => 
      s.session_date >= startDate && s.session_date <= endDate
    );
  }
  
  return await db.getAllAsync(
    'SELECT * FROM sessions WHERE session_date >= ? AND session_date <= ? ORDER BY session_date DESC',
    [startDate, endDate]
  );
};

/**
 * Get overall attendance percentage across all sessions
 */
export const getOverallAttendancePercentage = async () => {
  if (isWeb) {
    const totalAttendance = webDB.attendance.length;
    if (totalAttendance === 0) return 0;
    
    const presentCount = webDB.attendance.filter(a => a.status === 'present').length;
    return Math.round((presentCount / totalAttendance) * 100);
  }
  
  const result = await db.getFirstAsync(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
     FROM attendance`
  );
  
  if (!result || result.total === 0) return 0;
  return Math.round((result.present / result.total) * 100);
};

// ========== NOTES CRUD ==========

export const insertNote = async (userId, noteData) => {
  const FIXED_ACADEMY_ID = 'academy_accellax361_main';
  
  if (isWeb) {
    const note = {
      id: generateId(),
      user_id: userId,
      academy_id: FIXED_ACADEMY_ID,
      title: noteData.title,
      content: noteData.content,
      note_type: noteData.note_type, // 'general', 'session', 'kid'
      related_id: noteData.related_id || null,
      related_name: noteData.related_name || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      firebase_synced: 0,
    };

    // Initialize notes array if it doesn't exist
    if (!webDB.notes) {
      webDB.notes = [];
    }

    webDB.notes.push(note);
    await saveWebDB();

    // Upload to Firebase
    try {
      const { db: firebaseDb } = await import('../config/firebase.js');
      const { doc, setDoc, Timestamp } = await import('firebase/firestore');

      const noteRef = doc(firebaseDb, `academies/${FIXED_ACADEMY_ID}/notes`, note.id.toString());
      await setDoc(noteRef, {
        ...note,
        id: note.id.toString(),
        created_at: Timestamp.fromDate(new Date(note.created_at)),
        updated_at: Timestamp.now(),
        synced_at: Timestamp.now(),
      });

      note.firebase_synced = 1;
      console.log('✅ Note added to Firebase');
    } catch (error) {
      console.error('⚠️ Failed to add note to Firebase:', error);
      note.firebase_synced = 0;
    }

    return note;
  }

  // Mobile SQLite
  const result = await db.runAsync(
    `INSERT INTO notes (user_id, academy_id, title, content, note_type, related_id, related_name) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, FIXED_ACADEMY_ID, noteData.title, noteData.content, noteData.note_type, noteData.related_id, noteData.related_name]
  );

  return {
    id: result.lastInsertRowId,
    user_id: userId,
    academy_id: FIXED_ACADEMY_ID,
    ...noteData,
    created_at: new Date().toISOString(),
    firebase_synced: 0,
  };
};

export const getAllNotes = async () => {
  if (isWeb) {
    // Initialize notes array if it doesn't exist
    if (!webDB.notes) {
      webDB.notes = [];
    }
    return webDB.notes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  return await db.getAllAsync('SELECT * FROM notes ORDER BY created_at DESC');
};

export const getNoteById = async (id) => {
  if (isWeb) {
    if (!webDB.notes) return null;
    return webDB.notes.find(n => n.id === id);
  }
  return await db.getFirstAsync('SELECT * FROM notes WHERE id = ?', [id]);
};

export const getNotesByType = async (noteType) => {
  if (isWeb) {
    if (!webDB.notes) return [];
    return webDB.notes.filter(n => n.note_type === noteType)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  return await db.getAllAsync(
    'SELECT * FROM notes WHERE note_type = ? ORDER BY created_at DESC',
    [noteType]
  );
};

export const getNotesByRelatedId = async (relatedId, noteType) => {
  if (isWeb) {
    if (!webDB.notes) return [];
    return webDB.notes.filter(n => n.related_id === relatedId && n.note_type === noteType)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  return await db.getAllAsync(
    'SELECT * FROM notes WHERE related_id = ? AND note_type = ? ORDER BY created_at DESC',
    [relatedId, noteType]
  );
};

export const updateNote = async (id, noteData) => {
  if (isWeb) {
    if (!webDB.notes) return;
    
    const index = webDB.notes.findIndex(n => n.id === id);
    if (index !== -1) {
      webDB.notes[index] = {
        ...webDB.notes[index],
        ...noteData,
        updated_at: new Date().toISOString(),
        firebase_synced: 0,
      };
      await saveWebDB();

      // Update in Firebase
      try {
        const FIXED_ACADEMY_ID = 'academy_accellax361_main';
        const { db: firebaseDb } = await import('../config/firebase.js');
        const { doc, updateDoc, Timestamp } = await import('firebase/firestore');

        const noteRef = doc(firebaseDb, `academies/${FIXED_ACADEMY_ID}/notes`, id.toString());
        await updateDoc(noteRef, {
          ...noteData,
          updated_at: Timestamp.now(),
        });
        console.log('✅ Note updated in Firebase');
      } catch (error) {
        console.warn('⚠️ Failed to update note in Firebase:', error);
      }
    }
    return;
  }

  const { title, content, note_type, related_id, related_name } = noteData;
  await db.runAsync(
    'UPDATE notes SET title = ?, content = ?, note_type = ?, related_id = ?, related_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [title, content, note_type, related_id, related_name, id]
  );
};

export const deleteNote = async (id) => {
  if (isWeb) {
    if (!webDB.notes) return;
    
    webDB.notes = webDB.notes.filter(n => n.id !== id);
    await saveWebDB();

    // Delete from Firebase
    try {
      const FIXED_ACADEMY_ID = 'academy_accellax361_main';
      const { db: firebaseDb } = await import('../config/firebase.js');
      const { doc, deleteDoc } = await import('firebase/firestore');

      const noteRef = doc(firebaseDb, `academies/${FIXED_ACADEMY_ID}/notes`, id.toString());
      await deleteDoc(noteRef);
      console.log('✅ Note deleted from Firebase');
    } catch (error) {
      console.warn('⚠️ Failed to delete note from Firebase:', error);
    }
    return;
  }

  await db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
};

// ========== UTILITY ==========

export const getDatabase = () => db;

export const clearAllData = async () => {
  if (isWeb) {
    webDB.users = [];
    webDB.kids = [];
    webDB.sessions = [];
    webDB.attendance = [];
    webDB.notes = []; // ✅ ADD THIS
    await saveWebDB();
    return;
  }

  await db.execAsync(`
    DELETE FROM notes;
    DELETE FROM attendance;
    DELETE FROM sessions;
    DELETE FROM kids;
    DELETE FROM users;
  `);
};

// Export webDB for debugging (web only)
export const getWebDB = () => (isWeb ? webDB : null);

console.log(`Database running in ${isWeb ? 'WEB' : 'NATIVE (Android/iOS)'} mode`);

// Initialize academy ID on app start
if (isWeb) {
  AsyncStorage.getItem('academyId').then(id => {
    if (!id) {
      AsyncStorage.setItem('academyId', 'academy_accellax361_main');
      console.log('✅ Academy ID initialized: academy_accellax361_main');
    } else {
      console.log('✅ Academy ID loaded:', id);
    }
  });
}