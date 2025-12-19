// Location: /apps/assessment/src/database/db.js

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
  notes: [],
  sports: [],
  metrics: [],
  assessments: [],
  assessment_results: [],
  benchmarks: [],
  goals: [],
};

// Initialize webDB from AsyncStorage if exists
const initializeWebDB = async () => {
  try {
    const stored = await AsyncStorage.getItem('assessmentWebDB');
    if (stored) {
      const parsed = JSON.parse(stored);
      webDB.users = parsed.users || [];
      webDB.kids = parsed.kids || [];
      webDB.sessions = parsed.sessions || [];
      webDB.attendance = parsed.attendance || [];
      webDB.notes = parsed.notes || [];
      webDB.sports = parsed.sports || [];
      webDB.metrics = parsed.metrics || [];
      webDB.assessments = parsed.assessments || [];
      webDB.assessment_results = parsed.assessment_results || [];
      webDB.benchmarks = parsed.benchmarks || [];
      webDB.goals = parsed.goals || [];
      console.log('✅ Web DB initialized from storage');
    } else {
      console.log('📦 Web DB initialized empty');
    }
  } catch (error) {
    console.error('❌ Error initializing web DB:', error);
  }
};

// ========== INITIALIZATION ==========

export const initDatabase = async () => {
  if (isWeb) {
    console.log('Using AsyncStorage for web (Assessment App mock database)');
    await initializeWebDB();
    return;
  }

  // Real SQLite for mobile (Android & iOS)
  const SQLite = require('expo-sqlite');
  db = await SQLite.openDatabaseAsync('accellax361_assessment.db');
  
  await db.execAsync(`
    -- ========== SHARED TABLES (from Attendance App) ==========
    
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      username TEXT,
      phone TEXT,
      password_hash TEXT,
      auth_method TEXT DEFAULT 'accellax',
      role TEXT DEFAULT 'coach',
      avatar_base64 TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME,
      firebase_synced INTEGER DEFAULT 0,
      is_offline_account INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS kids (
      id TEXT PRIMARY KEY,
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
      firebase_synced INTEGER DEFAULT 0,
      sports_enrolled TEXT,
      primary_sport TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
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
      session_id TEXT NOT NULL,
      kid_id TEXT NOT NULL,
      status TEXT NOT NULL,
      marked_by TEXT DEFAULT 'System',
      marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      firebase_synced INTEGER DEFAULT 0,
      FOREIGN KEY (session_id) REFERENCES sessions(id),
      FOREIGN KEY (kid_id) REFERENCES kids(id)
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      academy_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      note_type TEXT NOT NULL,
      related_id TEXT,
      related_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      firebase_synced INTEGER DEFAULT 0
    );

    -- ========== NEW TABLES (Assessment-specific) ==========

    CREATE TABLE IF NOT EXISTS sports (
      id TEXT PRIMARY KEY,
      academy_id TEXT NOT NULL,
      name TEXT NOT NULL,
      icon TEXT,
      is_default INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      firebase_synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS metrics (
      id TEXT PRIMARY KEY,
      academy_id TEXT NOT NULL,
      sport_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL,
      unit TEXT,
      min_value REAL,
      max_value REAL,
      is_default INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      firebase_synced INTEGER DEFAULT 0,
      FOREIGN KEY (sport_id) REFERENCES sports(id)
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      academy_id TEXT NOT NULL,
      kid_id TEXT NOT NULL,
      sport_id TEXT NOT NULL,
      assessment_date DATE NOT NULL,
      term TEXT NOT NULL,
      assessed_by TEXT NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      firebase_synced INTEGER DEFAULT 0,
      FOREIGN KEY (kid_id) REFERENCES kids(id),
      FOREIGN KEY (sport_id) REFERENCES sports(id)
    );

    CREATE TABLE IF NOT EXISTS assessment_results (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL,
      metric_id TEXT NOT NULL,
      value REAL NOT NULL,
      percentile REAL,
      notes TEXT,
      firebase_synced INTEGER DEFAULT 0,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id),
      FOREIGN KEY (metric_id) REFERENCES metrics(id)
    );

    CREATE TABLE IF NOT EXISTS benchmarks (
      id TEXT PRIMARY KEY,
      metric_id TEXT NOT NULL,
      age_group TEXT NOT NULL,
      gender TEXT,
      excellent_min REAL,
      good_min REAL,
      fair_min REAL,
      poor_max REAL,
      source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (metric_id) REFERENCES metrics(id)
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      kid_id TEXT NOT NULL,
      metric_id TEXT NOT NULL,
      target_value REAL NOT NULL,
      target_date DATE NOT NULL,
      status TEXT DEFAULT 'active',
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      firebase_synced INTEGER DEFAULT 0,
      FOREIGN KEY (kid_id) REFERENCES kids(id),
      FOREIGN KEY (metric_id) REFERENCES metrics(id)
    );

    -- ========== PERFORMANCE INDEXES ==========
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
  
  // Add sports columns to kids table if they don't exist
  try {
    await db.execAsync(`
      ALTER TABLE kids ADD COLUMN sports_enrolled TEXT;
    `);
    console.log('✅ Migration: Added sports_enrolled column to kids table');
  } catch (error) {
    // Add house_team column to kids table
    try {
      await db.execAsync(`
        ALTER TABLE kids ADD COLUMN house_team TEXT;
      `);
      console.log('✅ Migration: Added house_team column to kids table');
    } catch (error) {
      if (!error.message.includes('duplicate column')) {
        console.warn('⚠️ Migration warning:', error.message);
      }
    }
    if (!error.message.includes('duplicate column')) {
      console.warn('⚠️ Migration warning:', error.message);
    }
  }

  try {
    await db.execAsync(`
      ALTER TABLE kids ADD COLUMN primary_sport TEXT;
    `);
    console.log('✅ Migration: Added primary_sport column to kids table');
  } catch (error) {
    if (!error.message.includes('duplicate column')) {
      console.warn('⚠️ Migration warning:', error.message);
    }
  }
  
  // ✅ NEW: Add metadata columns to assessments table
  try {
    await db.execAsync(`ALTER TABLE assessments ADD COLUMN year TEXT;`);
    console.log('✅ Migration: Added year column to assessments table');
  } catch (error) {
    if (!error.message.includes('duplicate column')) {
      console.warn('⚠️ Migration warning:', error.message);
    }
  }
  
  try {
    await db.execAsync(`ALTER TABLE assessments ADD COLUMN assessment_type TEXT;`);
    console.log('✅ Migration: Added assessment_type column to assessments table');
  } catch (error) {
    if (!error.message.includes('duplicate column')) {
      console.warn('⚠️ Migration warning:', error.message);
    }
  }
  
  try {
    await db.execAsync(`ALTER TABLE assessments ADD COLUMN week_number INTEGER;`);
    console.log('✅ Migration: Added week_number column to assessments table');
  } catch (error) {
    if (!error.message.includes('duplicate column')) {
      console.warn('⚠️ Migration warning:', error.message);
    }
  }
  
  try {
    await db.execAsync(`ALTER TABLE assessments ADD COLUMN location TEXT;`);
    console.log('✅ Migration: Added location column to assessments table');
  } catch (error) {
    if (!error.message.includes('duplicate column')) {
      console.warn('⚠️ Migration warning:', error.message);
    }
  }
  
  try {
    await db.execAsync(`ALTER TABLE assessments ADD COLUMN assessor_name TEXT;`);
    console.log('✅ Migration: Added assessor_name column to assessments table');
  } catch (error) {
    if (!error.message.includes('duplicate column')) {
      console.warn('⚠️ Migration warning:', error.message);
    }
  }
  
  try {
    await db.execAsync(`ALTER TABLE assessments ADD COLUMN general_notes TEXT;`);
    console.log('✅ Migration: Added general_notes column to assessments table');
  } catch (error) {
    if (!error.message.includes('duplicate column')) {
      console.warn('⚠️ Migration warning:', error.message);
    }
  }
  
  try {
    await db.execAsync(`ALTER TABLE assessments ADD COLUMN scheduled_date DATE;`);
    console.log('✅ Migration: Added scheduled_date column to assessments table');
  } catch (error) {
    if (!error.message.includes('duplicate column')) {
      console.warn('⚠️ Migration warning:', error.message);
    }
  }
  
  try {
    await db.execAsync(`ALTER TABLE assessments ADD COLUMN rescheduled_reason TEXT;`);
    console.log('✅ Migration: Added rescheduled_reason column to assessments table');
  } catch (error) {
    if (!error.message.includes('duplicate column')) {
      console.warn('⚠️ Migration warning:', error.message);
    }
  }
  
  console.log('✅ SQLite database initialized for Assessment App with all tables');
};

// Save web DB to AsyncStorage
const saveWebDB = async () => {
  if (isWeb) {
    await AsyncStorage.setItem('assessmentWebDB', JSON.stringify(webDB));
  }
};

// Helper function to generate IDs (consistent with attendance app)
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ========== USERS CRUD (REUSED FROM ATTENDANCE) ==========

export const createUser = async (userData) => {
  try {
    if (isWeb) {
      // Check if user already exists
      const existingUser = webDB.users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

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
      console.log('✅ User created in web DB:', user.id);
      return user;
    }

    // Check if user already exists (mobile)
    const existingUser = await db.getFirstAsync('SELECT id FROM users WHERE email = ?', [userData.email]);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    await db.runAsync(
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

    console.log('✅ User created in SQLite:', userData.id);

    return {
      id: userData.id,
      full_name: userData.fullName,
      email: userData.email,
      username: userData.username,
      phone: userData.phone,
      role: userData.role || 'coach',
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Error creating user in database:', error);
    throw error; // Re-throw to let caller handle
  }
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

// ========== KIDS CRUD (REUSED FROM ATTENDANCE) ==========

export const insertKid = async (userId, name, age, gender, area, ageGroup, sponsorshipType = 'SP', programType = 'ELT', programTypeOther = null, trialNotes = null, skipFirebaseSync = false, providedKidId = null, houseTeam = null) => {
  const FIXED_ACADEMY_ID = 'academy_accellax361_main';
  
   if (isWeb) {
    const kid = {
      id: providedKidId || generateId(),
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
      house_team: houseTeam || null,
      created_at: new Date().toISOString(),
      firebase_synced: 0,
    };
    
    if (!skipFirebaseSync) {
      try {
        console.log('🔄 Adding kid to Firebase academy collection...');
        
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
          house_team: kid.house_team || null,
          firebase_synced: 1,
          created_at: Timestamp.fromDate(new Date(kid.created_at)),
          created_by: userId,
          updated_at: Timestamp.now(),
          synced_at: Timestamp.now(),
        });
        
        kid.firebase_synced = 1;
        console.log('✅ Kid added to academy Firebase collection');
        
        await AsyncStorage.setItem('academyId', FIXED_ACADEMY_ID);
        
      } catch (error) {
        console.error('⚠️ Failed to add kid to Firebase:', error);
        kid.firebase_synced = 0;
      }
    } else {
      console.log('⏭️ Skipping Firebase sync (download operation)');
      kid.firebase_synced = 1;
    }
    
    // ✅ FIX: Add kid to local webDB BEFORE returning
    webDB.kids.push(kid);
    await saveWebDB();
    console.log('✅ Kid added to local webDB:', kid.id);
    
    return kid;
  }

  // Mobile path
  const uniqueId = providedKidId || generateId();
  
  const existingKid = await db.getFirstAsync('SELECT id FROM kids WHERE id = ?', [uniqueId]);
  if (existingKid) {
    console.log('⚠️ Kid already exists, skipping insert:', uniqueId);
    return existingKid;
  }
  
  await db.runAsync(
    'INSERT INTO kids (id, user_id, name, age, gender, area_of_residence, age_group, sponsorshipType, programType, programTypeOther, trialNotes, status, house_team) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [uniqueId, userId, name, age, gender, area, ageGroup, sponsorshipType, programType, programTypeOther, trialNotes, programType === 'Trial' ? 'trial' : 'active', houseTeam]
  );
  
  const kid = {
    id: uniqueId,
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
  
  if (!skipFirebaseSync) {
    try {
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
      
      await db.runAsync('UPDATE kids SET firebase_synced = 1 WHERE id = ?', [kid.id]);
      console.log('✅ [Mobile] Kid synced to Firebase');
      
    } catch (error) {
      console.warn('⚠️ [Mobile] Failed to sync kid to Firebase:', error);
    }
  } else {
    console.log('⏭️ [Mobile] Skipping Firebase sync (download operation)');
    await db.runAsync('UPDATE kids SET firebase_synced = 1 WHERE id = ?', [kid.id]);
  }
  
  return kid;
};

export const getAllKids = async () => {
  if (isWeb) {
    try {
      const FIXED_ACADEMY_ID = 'academy_accellax361_main';
      const { collection, getDocs } = await import('firebase/firestore');
      const { db: firebaseDb } = await import('../config/firebase');
      
      const kidsRef = collection(firebaseDb, `academies/${FIXED_ACADEMY_ID}/kids`);
      const snapshot = await getDocs(kidsRef);
      
      const kids = [];
      snapshot.forEach(doc => {
        const kid = doc.data();
        kids.push({
          id: kid.id,
          user_id: kid.user_id || kid.created_by,
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
          house_team: kid.house_team || null,  // ← CRITICAL: Include house_team!
          sports_enrolled: kid.sports_enrolled || null,
          primary_sport: kid.primary_sport || null,
          created_at: kid.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
      });
      
      console.log(`✅ [Web] Loaded ${kids.length} kids from Firebase`);
      return kids.sort((a, b) => a.age_group.localeCompare(b.age_group) || a.name.localeCompare(b.name));
      
    } catch (error) {
      console.error('❌ [Web] Error loading kids from Firebase:', error);
      return webDB.kids; // Fallback to local storage
    }
  }
  
  return await db.getAllAsync('SELECT * FROM kids ORDER BY age_group, name');
};

export const getKidsByAgeGroup = async (ageGroup) => {
  if (isWeb) {
    try {
      const FIXED_ACADEMY_ID = 'academy_accellax361_main';
      const { collection, getDocs } = await import('firebase/firestore');
      const { db: firebaseDb } = await import('../config/firebase');
      
      const kidsRef = collection(firebaseDb, `academies/${FIXED_ACADEMY_ID}/kids`);
      const snapshot = await getDocs(kidsRef);
      
      const academyKids = [];
      snapshot.forEach(doc => {
        const kid = doc.data();
        if (kid.age_group === ageGroup && (kid.status === 'active' || !kid.status)) {
          academyKids.push({
            id: kid.id,
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
  
  try {
    const kids = await db.getAllAsync(
      'SELECT DISTINCT id, user_id, name, age, gender, area_of_residence, age_group, sponsorshipType, programType, programTypeOther, trialNotes, status, created_at, updated_at, firebase_synced FROM kids WHERE age_group = ? AND status = "active" GROUP BY id ORDER BY name',
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

  const { name, age, gender, area_of_residence, age_group, sponsorshipType, programType, programTypeOther, trialNotes, house_team } = data;
  await db.runAsync(
    'UPDATE kids SET name = ?, age = ?, gender = ?, area_of_residence = ?, age_group = ?, sponsorshipType = ?, programType = ?, programTypeOther = ?, trialNotes = ?, house_team = ? WHERE id = ?',
    [name, age, gender, area_of_residence, age_group, sponsorshipType, programType, programTypeOther || null, trialNotes || null, house_team || null, id]
  );
};

export const updateKidStatus = async (id, status) => {
  if (isWeb) {
    const index = webDB.kids.findIndex(k => k.id === id);
    if (index !== -1) {
      webDB.kids[index].status = status;
      await saveWebDB();
      
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

// ========== NOTES CRUD (REUSED FROM ATTENDANCE) ==========

export const insertNote = async (userId, noteData) => {
  const FIXED_ACADEMY_ID = 'academy_accellax361_main';
  
  if (isWeb) {
    const note = {
      id: generateId(),
      user_id: userId,
      academy_id: FIXED_ACADEMY_ID,
      title: noteData.title,
      content: noteData.content,
      note_type: noteData.note_type,
      related_id: noteData.related_id || null,
      related_name: noteData.related_name || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      firebase_synced: 0,
    };

    if (!webDB.notes) {
      webDB.notes = [];
    }

    webDB.notes.push(note);
    await saveWebDB();

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

  const noteId = generateId();
  
  await db.runAsync(
    `INSERT INTO notes (id, user_id, academy_id, title, content, note_type, related_id, related_name) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [noteId, userId, FIXED_ACADEMY_ID, noteData.title, noteData.content, noteData.note_type, noteData.related_id, noteData.related_name]
  );

  return {
    id: noteId,
    user_id: userId,
    academy_id: FIXED_ACADEMY_ID,
    ...noteData,
    created_at: new Date().toISOString(),
    firebase_synced: 0,
  };
};

export const getAllNotes = async () => {
  if (isWeb) {
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

    try {
      const FIXED_ACADEMY_ID = 'academy_accellax361_main';
      const { db: firebaseDb } = await import('../config/firebase.js');
      const { doc, deleteDoc } = await import('firebase/firestore');

      const noteRef = doc(firebaseDb, `academies/${FIXED_ACADEMY_ID}/notes`, id.toString());
      await deleteDoc(noteRef);
      console.log('✅ Note deleted from Firebase');
    } catch (error) {
      console.warn('⚠️ Failed to delete notefrom Firebase:', error);
    }
    return;
  }

  await db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
};

// ========== SPORTS CRUD (NEW) ==========

export const insertSport = async (sportData, userId, skipFirebaseSync = false) => {
  const sportId = sportData.id || generateId();
  const FIXED_ACADEMY_ID = 'academy_accellax361_main';
  
  if (isWeb) {
    const sport = {
      id: sportId,
      academy_id: FIXED_ACADEMY_ID,
      name: sportData.name,
      icon: sportData.icon || null,
      is_default: sportData.isDefault ? 1 : 0,
      is_active: 1,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      firebase_synced: skipFirebaseSync ? 1 : 0, // Mark as synced if skipping
    };
    
    webDB.sports.push(sport);
    await saveWebDB();

    // Only sync to Firebase if not skipping
    if (!skipFirebaseSync) {
      try {
        const { db: firebaseDb } = await import('../config/firebase.js');
        const { doc, setDoc, Timestamp } = await import('firebase/firestore');

        const sportRef = doc(firebaseDb, `academies/${FIXED_ACADEMY_ID}/sports`, sportId);
        await setDoc(sportRef, {
          ...sport,
          created_at: Timestamp.fromDate(new Date(sport.created_at)),
          updated_at: Timestamp.now(),
          synced_at: Timestamp.now(),
        });

        sport.firebase_synced = 1;
        console.log('✅ Sport added to Firebase');
      } catch (error) {
        console.error('⚠️ Failed to add sport to Firebase:', error);
        sport.firebase_synced = 0;
      }
    } else {
      console.log('⏭️ Skipping Firebase sync for sport (seeding mode)');
    }

    return sport;
  }

  await db.runAsync(
    'INSERT INTO sports (id, academy_id, name, icon, is_default, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [sportId, FIXED_ACADEMY_ID, sportData.name, sportData.icon, sportData.isDefault ? 1 : 0, 1, userId]
  );

  return { id: sportId, ...sportData };
};

export const getAllSports = async () => {
  if (isWeb) {
    const activeSports = webDB.sports.filter(s => s.is_active === 1);
    // Remove duplicates based on sport.id
    const uniqueSports = activeSports.filter((sport, index, self) =>
      index === self.findIndex((s) => s.id === sport.id)
    );
    return uniqueSports;
  }
  return await db.getAllAsync('SELECT * FROM sports WHERE is_active = 1 ORDER BY name');
};

export const getSportById = async (sportId) => {
  if (isWeb) {
    return webDB.sports.find(s => s.id === sportId);
  }
  return await db.getFirstAsync('SELECT * FROM sports WHERE id = ?', [sportId]);
};

export const getActiveSports = async () => {
  if (isWeb) {
    return webDB.sports.filter(s => s.is_active === 1 && s.is_default === 1);
  }
  return await db.getAllAsync('SELECT * FROM sports WHERE is_active = 1 AND is_default = 1 ORDER BY name');
};

export const updateSport = async (sportId, sportData) => {
  if (isWeb) {
    const index = webDB.sports.findIndex(s => s.id === sportId);
    if (index !== -1) {
      webDB.sports[index] = {
        ...webDB.sports[index],
        ...sportData,
        updated_at: new Date().toISOString(),
        firebase_synced: 0,
      };
      await saveWebDB();

      try {
        const FIXED_ACADEMY_ID = 'academy_accellax361_main';
        const { db: firebaseDb } = await import('../config/firebase.js');
        const { doc, updateDoc, Timestamp } = await import('firebase/firestore');

        const sportRef = doc(firebaseDb, `academies/${FIXED_ACADEMY_ID}/sports`, sportId);
        await updateDoc(sportRef, {
          ...sportData,
          updated_at: Timestamp.now(),
        });
        console.log('✅ Sport updated in Firebase');
      } catch (error) {
        console.warn('⚠️ Failed to update sport in Firebase:', error);
      }
    }
    return;
  }

  const { name, icon, is_default } = sportData;
  await db.runAsync(
    'UPDATE sports SET name = ?, icon = ?, is_default = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, icon, is_default ? 1 : 0, sportId]
  );
};

export const deleteSport = async (sportId) => {
  if (isWeb) {
    const index = webDB.sports.findIndex(s => s.id === sportId);
    if (index !== -1) {
      webDB.sports[index].is_active = 0;
      await saveWebDB();
    }
    return;
  }

  await db.runAsync('UPDATE sports SET is_active = 0 WHERE id = ?', [sportId]);
};

// ========== METRICS CRUD (NEW) ==========

export const insertMetric = async (metricData, userId, skipFirebaseSync = false) => {
  const metricId = metricData.id || generateId();
  const FIXED_ACADEMY_ID = 'academy_accellax361_main';
  
  if (isWeb) {
    const metric = {
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
      created_at: new Date().toISOString(),
      firebase_synced: skipFirebaseSync ? 1 : 0, // Mark as synced if skipping
    };
    
    webDB.metrics.push(metric);
    await saveWebDB();

    // Only sync to Firebase if not skipping
    if (!skipFirebaseSync) {
      try {
        const { db: firebaseDb } = await import('../config/firebase.js');
        const { doc, setDoc, Timestamp } = await import('firebase/firestore');

        const metricRef = doc(firebaseDb, `academies/${FIXED_ACADEMY_ID}/metrics`, metricId);
        await setDoc(metricRef, {
          ...metric,
          created_at: Timestamp.fromDate(new Date(metric.created_at)),
          synced_at: Timestamp.now(),
        });

        metric.firebase_synced = 1;
        console.log('✅ Metric added to Firebase');
      } catch (error) {
        console.error('⚠️ Failed to add metric to Firebase:', error);
        metric.firebase_synced = 0;
      }
    } else {
      console.log('⏭️ Skipping Firebase sync for metric (seeding mode)');
    }

    return metric;
  }

  await db.runAsync(
    'INSERT INTO metrics (id, academy_id, sport_id, name, category, type, unit, min_value, max_value, is_default, display_order, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [metricId, FIXED_ACADEMY_ID, metricData.sportId, metricData.name, metricData.category, metricData.type, metricData.unit, metricData.minValue, metricData.maxValue, metricData.isDefault ? 1 : 0, metricData.displayOrder, userId]
  );

  return { id: metricId, ...metricData };
};

export const getMetricsBySport = async (sportId) => {
  if (isWeb) {
    return webDB.metrics.filter(m => m.sport_id === sportId).sort((a, b) => a.display_order - b.display_order);
  }
  return await db.getAllAsync('SELECT * FROM metrics WHERE sport_id = ? ORDER BY display_order', [sportId]);
};

export const getMetricsByCategory = async (sportId, category) => {
  if (isWeb) {
    return webDB.metrics.filter(m => m.sport_id === sportId && m.category === category).sort((a, b) => a.display_order - b.display_order);
  }
  return await db.getAllAsync('SELECT * FROM metrics WHERE sport_id = ? AND category = ? ORDER BY display_order', [sportId, category]);
};

export const updateMetric = async (metricId, metricData) => {
  if (isWeb) {
    const index = webDB.metrics.findIndex(m => m.id === metricId);
    if (index !== -1) {
      webDB.metrics[index] = {
        ...webDB.metrics[index],
        ...metricData,
        firebase_synced: 0,
      };
      await saveWebDB();

      try {
        const FIXED_ACADEMY_ID = 'academy_accellax361_main';
        const { db: firebaseDb } = await import('../config/firebase.js');
        const { doc, updateDoc, Timestamp } = await import('firebase/firestore');

        const metricRef = doc(firebaseDb, `academies/${FIXED_ACADEMY_ID}/metrics`, metricId);
        await updateDoc(metricRef, {
          ...metricData,
          updated_at: Timestamp.now(),
        });
        console.log('✅ Metric updated in Firebase');
      } catch (error) {
        console.warn('⚠️ Failed to update metric in Firebase:', error);
      }
    }
    return;
  }

  const { name, category, type, unit, min_value, max_value, display_order } = metricData;
  await db.runAsync(
    'UPDATE metrics SET name = ?, category = ?, type = ?, unit = ?, min_value = ?, max_value = ?, display_order = ? WHERE id = ?',
    [name, category, type, unit, min_value, max_value, display_order, metricId]
  );
};

export const deleteMetric = async (metricId) => {
  if (isWeb) {
    webDB.metrics = webDB.metrics.filter(m => m.id !== metricId);
    await saveWebDB();
    return;
  }

  await db.runAsync('DELETE FROM metrics WHERE id = ?', [metricId]);
};

// ========== ASSESSMENTS CRUD (NEW) ==========

export const insertAssessment = async (assessmentData, userId) => {
  const assessmentId = assessmentData.id || generateId();
  const FIXED_ACADEMY_ID = 'academy_accellax361_main';
  
  if (isWeb) {
    const assessment = {
      id: assessmentId,
      academy_id: FIXED_ACADEMY_ID,
      kid_id: assessmentData.kidId,
      sport_id: assessmentData.sportId,
      assessment_date: assessmentData.assessmentDate,
      // ✅ METADATA FIELDS
      year: assessmentData.year || null,
      term: assessmentData.term || 'Q1',
      assessment_type: assessmentData.assessmentType || null,
      week_number: assessmentData.weekNumber || null,
      location: assessmentData.location || null,
      assessor_name: assessmentData.assessorName || 'Coach',
      general_notes: assessmentData.generalNotes || assessmentData.notes || null,
      // Standard fields
      assessed_by: userId,
      notes: assessmentData.notes || null,
      status: assessmentData.status || 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      firebase_synced: 0,
    };
    
    webDB.assessments.push(assessment);
    await saveWebDB();

    try {
      const { db: firebaseDb } = await import('../config/firebase.js');
      const { doc, setDoc, Timestamp } = await import('firebase/firestore');

      const assessmentRef = doc(firebaseDb, `academies/${FIXED_ACADEMY_ID}/assessments`, assessmentId);
      await setDoc(assessmentRef, {
        ...assessment,
        created_at: Timestamp.fromDate(new Date(assessment.created_at)),
        updated_at: Timestamp.now(),
        synced_at: Timestamp.now(),
      });

      assessment.firebase_synced = 1;
      console.log('✅ Assessment added to Firebase');
    } catch (error) {
      console.error('⚠️ Failed to add assessment to Firebase:', error);
      assessment.firebase_synced = 0;
    }

    return assessment;
  }

  await db.runAsync(
      'INSERT INTO assessments (id, academy_id, kid_id, sport_id, assessment_date, year, term, assessment_type, week_number, location, assessor_name, general_notes, assessed_by, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        assessmentId, 
        FIXED_ACADEMY_ID, 
        assessmentData.kidId, 
        assessmentData.sportId, 
        assessmentData.assessmentDate, 
        assessmentData.year || null,
        assessmentData.term, 
        assessmentData.assessmentType || null,
        assessmentData.weekNumber || null,
        assessmentData.location || null,
        assessmentData.assessorName || 'Coach',
        assessmentData.generalNotes || assessmentData.notes || null,
        userId, 
        assessmentData.notes, 
        assessmentData.status || 'completed'
      ]
    );

  return { id: assessmentId, ...assessmentData };
};

export const getAssessmentById = async (assessmentId) => {
  if (isWeb) {
    return webDB.assessments.find(a => a.id === assessmentId);
  }
  return await db.getFirstAsync('SELECT * FROM assessments WHERE id = ?', [assessmentId]);
};

export const getAssessmentsByKid = async (kidId) => {
  if (isWeb) {
    return webDB.assessments.filter(a => a.kid_id === kidId).sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date));
  }
  return await db.getAllAsync('SELECT * FROM assessments WHERE kid_id = ? ORDER BY assessment_date DESC', [kidId]);
};

export const getAssessmentsByTerm = async (term) => {
  if (isWeb) {
    return webDB.assessments.filter(a => a.term === term);
  }
  return await db.getAllAsync('SELECT * FROM assessments WHERE term = ? ORDER BY assessment_date DESC', [term]);
};

/**
 * Get all assessments with their results
 * @returns {Array} All assessments with results attached
 */
export const getAllAssessments = async () => {
  if (isWeb) {
    // Get all assessments and attach their results
    const assessmentsWithResults = webDB.assessments.map(assessment => {
      const results = webDB.assessment_results.filter(r => r.assessment_id === assessment.id);
      return {
        ...assessment,
        results: results.map(r => ({
          metric_id: r.metric_id,
          value: r.value,
          percentile: r.percentile,
          notes: r.notes,
        })),
      };
    });
    
    console.log(`✅ [Web] Loaded ${assessmentsWithResults.length} assessments with results`);
    return assessmentsWithResults;
  }

  // Mobile: Join assessments with their results
  const assessments = await db.getAllAsync('SELECT * FROM assessments ORDER BY assessment_date DESC');
  
  // Attach results to each assessment
  const assessmentsWithResults = await Promise.all(
    assessments.map(async (assessment) => {
      const results = await db.getAllAsync(
        'SELECT metric_id, value, percentile, notes FROM assessment_results WHERE assessment_id = ?',
        [assessment.id]
      );
      
      return {
        ...assessment,
        results,
      };
    })
  );
  
  console.log(`✅ [Mobile] Loaded ${assessmentsWithResults.length} assessments with results`);
  return assessmentsWithResults;
};

export const getLatestAssessmentByKid = async (kidId, sportId = null) => {
  if (isWeb) {
    let assessments = webDB.assessments.filter(a => a.kid_id === kidId);
    if (sportId) assessments = assessments.filter(a => a.sport_id === sportId);
    
    return assessments.sort((a, b) => 
      new Date(b.assessment_date) - new Date(a.assessment_date)
    )[0] || null;
  }

  const query = sportId
    ? 'SELECT * FROM assessments WHERE kid_id = ? AND sport_id = ? ORDER BY assessment_date DESC LIMIT 1'
    : 'SELECT * FROM assessments WHERE kid_id = ? ORDER BY assessment_date DESC LIMIT 1';
  
  const params = sportId ? [kidId, sportId] : [kidId];
  return await db.getFirstAsync(query, params);
};

export const updateAssessment = async (assessmentId, assessmentData) => {
  if (isWeb) {
    const index = webDB.assessments.findIndex(a => a.id === assessmentId);
    if (index !== -1) {
      webDB.assessments[index] = {
        ...webDB.assessments[index],
        ...assessmentData,
        updated_at: new Date().toISOString(),
        firebase_synced: 0,
      };
      await saveWebDB();

      try {
        const FIXED_ACADEMY_ID = 'academy_accellax361_main';
        const { db: firebaseDb } = await import('../config/firebase.js');
        const { doc, updateDoc, Timestamp } = await import('firebase/firestore');

        const assessmentRef = doc(firebaseDb, `academies/${FIXED_ACADEMY_ID}/assessments`, assessmentId);
        await updateDoc(assessmentRef, {
          ...assessmentData,
          updated_at: Timestamp.now(),
        });
        console.log('✅ Assessment updated in Firebase');
      } catch (error) {
        console.warn('⚠️ Failed to update assessment in Firebase:', error);
      }
    }
    return;
  }

  const { notes, status } = assessmentData;
  await db.runAsync(
    'UPDATE assessments SET notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [notes, status, assessmentId]
  );
};

export const deleteAssessment = async (assessmentId) => {
  if (isWeb) {
    webDB.assessments = webDB.assessments.filter(a => a.id !== assessmentId);
    webDB.assessment_results = webDB.assessment_results.filter(r => r.assessment_id !== assessmentId);
    await saveWebDB();
    return;
  }

  await db.runAsync('DELETE FROM assessment_results WHERE assessment_id = ?', [assessmentId]);
  await db.runAsync('DELETE FROM assessments WHERE id = ?', [assessmentId]);
};

// ========== ASSESSMENT RESULTS CRUD (NEW) ==========

export const insertAssessmentResult = async (resultData) => {
  const FIXED_ACADEMY_ID = 'academy_accellax361_main';
  
  if (isWeb) {
    const result = {
      id: generateId(),
      assessment_id: resultData.assessmentId,
      metric_id: resultData.metricId,
      value: resultData.value,
      percentile: resultData.percentile || null,
      notes: resultData.notes || null,
      firebase_synced: 0,
    };
    
    webDB.assessment_results.push(result);
    await saveWebDB();

    try {
      const { db: firebaseDb } = await import('../config/firebase.js');
      const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');

      const assessmentRef = doc(firebaseDb, `academies/${FIXED_ACADEMY_ID}/assessments`, resultData.assessmentId);
      
      // Build result object with only defined values
      const resultForFirebase = {
        metric_id: resultData.metricId,
        value: resultData.value,
      };
      
      if (resultData.percentile !== null && resultData.percentile !== undefined) {
        resultForFirebase.percentile = resultData.percentile;
      }
      
      if (resultData.notes !== null && resultData.notes !== undefined) {
        resultForFirebase.notes = resultData.notes;
      }
      
      await updateDoc(assessmentRef, {
        results: arrayUnion(resultForFirebase)
      });

      result.firebase_synced = 1;
      console.log('✅ Assessment result added to Firebase');
    } catch (error) {
      console.error('⚠️ Failed to add result to Firebase:', error);
      result.firebase_synced = 0;
    }

    return result;
  }

  const resultId = generateId();
  
  await db.runAsync(
    'INSERT INTO assessment_results (id, assessment_id, metric_id, value, percentile, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [resultId, resultData.assessmentId, resultData.metricId, resultData.value, resultData.percentile, resultData.notes]
  );

  return { id: resultId, ...resultData };
};

export const getAssessmentResults = async (assessmentId) => {
  if (isWeb) {
    return webDB.assessment_results.filter(r => r.assessment_id === assessmentId);
  }
  return await db.getAllAsync('SELECT * FROM assessment_results WHERE assessment_id = ?', [assessmentId]);
};

export const updateAssessmentResult = async (resultId, resultData) => {
  if (isWeb) {
    const index = webDB.assessment_results.findIndex(r => r.id === resultId);
    if (index !== -1) {
      webDB.assessment_results[index] = {
        ...webDB.assessment_results[index],
        ...resultData,
        firebase_synced: 0,
      };
      await saveWebDB();
    }
    return;
  }

  const { value, percentile, notes } = resultData;
  await db.runAsync(
    'UPDATE assessment_results SET value = ?, percentile = ?, notes = ? WHERE id = ?',
    [value, percentile, notes, resultId]
  );
};

// ========== BENCHMARKS CRUD (NEW) ==========

export const insertBenchmark = async (benchmarkData, skipFirebaseSync = false) => {
  const FIXED_ACADEMY_ID = 'academy_accellax361_main';
  
  if (isWeb) {
    const benchmark = {
      id: generateId(),
      metric_id: benchmarkData.metricId,
      age_group: benchmarkData.ageGroup,
      gender: benchmarkData.gender || null,
      excellent_min: benchmarkData.excellentMin,
      good_min: benchmarkData.goodMin,
      fair_min: benchmarkData.fairMin,
      poor_max: benchmarkData.poorMax,
      source: benchmarkData.source || null,
      created_at: new Date().toISOString(),
    };
    
    webDB.benchmarks.push(benchmark);
    await saveWebDB();

    // Only sync to Firebase if not skipping
    if (!skipFirebaseSync) {
      try {
        const { db: firebaseDb } = await import('../config/firebase.js');
        const { doc, setDoc, Timestamp } = await import('firebase/firestore');

        const benchmarkRef = doc(firebaseDb, `academies/${FIXED_ACADEMY_ID}/benchmarks`, `${benchmarkData.metricId}_${benchmarkData.ageGroup}_${benchmarkData.gender || 'all'}`);
        await setDoc(benchmarkRef, {
          ...benchmark,
          created_at: Timestamp.fromDate(new Date(benchmark.created_at)),
        });

        console.log('✅ Benchmark added to Firebase');
      } catch (error) {
        console.error('⚠️ Failed to add benchmark to Firebase:', error);
      }
    } else {
      console.log('⏭️ Skipping Firebase sync for benchmark (seeding mode)');
    }

    return benchmark;
  }

  const benchmarkId = generateId();
  
  await db.runAsync(
    'INSERT INTO benchmarks (id, metric_id, age_group, gender, excellent_min, good_min, fair_min, poor_max, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [benchmarkId, benchmarkData.metricId, benchmarkData.ageGroup, benchmarkData.gender, benchmarkData.excellentMin, benchmarkData.goodMin, benchmarkData.fairMin, benchmarkData.poorMax, benchmarkData.source]
  );

  return { id: benchmarkId, ...benchmarkData };
};

export const getBenchmarksByMetric = async (metricId, ageGroup, gender) => {
  if (isWeb) {
    return webDB.benchmarks.filter(b => 
      b.metric_id === metricId && 
      b.age_group === ageGroup && 
      (b.gender === gender || b.gender === null)
    );
  }
  return await db.getAllAsync(
    'SELECT * FROM benchmarks WHERE metric_id = ? AND age_group = ? AND (gender = ? OR gender IS NULL)',
    [metricId, ageGroup, gender]
  );
};

export const getBenchmarksByAgeGroup = async (ageGroup) => {
  if (isWeb) {
    return webDB.benchmarks.filter(b => b.age_group === ageGroup);
  }
  return await db.getAllAsync('SELECT * FROM benchmarks WHERE age_group = ?', [ageGroup]);
};

// ========== GOALS CRUD (NEW) ==========

export const insertGoal = async (goalData, userId) => {
  const goalId = goalData.id || generateId();
  const FIXED_ACADEMY_ID = 'academy_accellax361_main';
  
  if (isWeb) {
    const goal = {
      id: goalId,
      kid_id: goalData.kidId,
      metric_id: goalData.metricId,
      target_value: goalData.targetValue,
      target_date: goalData.targetDate,
      status: goalData.status || 'active',
      created_by: userId,
      created_at: new Date().toISOString(),
      firebase_synced: 0,
    };
    
    webDB.goals.push(goal);
    await saveWebDB();

    try {
      const { db: firebaseDb } = await import('../config/firebase.js');
      const { doc, setDoc, Timestamp } = await import('firebase/firestore');

      const goalRef = doc(firebaseDb, `academies/${FIXED_ACADEMY_ID}/goals`, goalId);
      await setDoc(goalRef, {
        ...goal,
        created_at: Timestamp.fromDate(new Date(goal.created_at)),
        synced_at: Timestamp.now(),
      });

      goal.firebase_synced = 1;
      console.log('✅ Goal added to Firebase');
    } catch (error) {
      console.error('⚠️ Failed to add goal to Firebase:', error);
      goal.firebase_synced = 0;
    }

    return goal;
  }

  await db.runAsync(
    'INSERT INTO goals (id, kid_id, metric_id, target_value, target_date, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [goalId, goalData.kidId, goalData.metricId, goalData.targetValue, goalData.targetDate, goalData.status || 'active', userId]
  );

  return { id: goalId, ...goalData };
};

export const getGoalsByKid = async (kidId) => {
  if (isWeb) {
    return webDB.goals.filter(g => g.kid_id === kidId);
  }
  return await db.getAllAsync('SELECT * FROM goals WHERE kid_id = ? ORDER BY target_date', [kidId]);
};

export const updateGoalStatus = async (goalId, status) => {
  if (isWeb) {
    const index = webDB.goals.findIndex(g => g.id === goalId);
    if (index !== -1) {
      webDB.goals[index].status = status;
      webDB.goals[index].firebase_synced = 0;
      await saveWebDB();
    }
    return;
  }

  await db.runAsync('UPDATE goals SET status = ? WHERE id = ?', [status, goalId]);
};

// ========== PROGRESS TRACKING (NEW) ==========

export const getKidProgressByMetric = async (kidId, metricId) => {
  if (isWeb) {
    const assessments = webDB.assessments.filter(a => a.kid_id === kidId);
    const results = [];
    
    for (const assessment of assessments) {
      const result = webDB.assessment_results.find(r => 
        r.assessment_id === assessment.id && r.metric_id === metricId
      );
      if (result) {
        results.push({
          assessment_date: assessment.assessment_date,
          term: assessment.term,
          value: result.value,
          percentile: result.percentile,
        });
      }
    }
    
    return results.sort((a, b) => new Date(a.assessment_date) - new Date(b.assessment_date));
  }

  return await db.getAllAsync(
    `SELECT a.assessment_date, a.term, ar.value, ar.percentile
     FROM assessments a
     JOIN assessment_results ar ON a.id = ar.assessment_id
     WHERE a.kid_id = ? AND ar.metric_id = ?
     ORDER BY a.assessment_date ASC`,
    [kidId, metricId]
  );
};

export const compareKidToAgeGroup = async (kidId, metricId, ageGroup) => {
  if (isWeb) {
    const allKids = webDB.kids.filter(k => k.age_group === ageGroup && k.status === 'active');
    const kidAssessments = webDB.assessments.filter(a => 
      allKids.some(k => k.id === a.kid_id)
    );
    
    const values = [];
    for (const assessment of kidAssessments) {
      const result = webDB.assessment_results.find(r => 
        r.assessment_id === assessment.id && r.metric_id === metricId
      );
      if (result) {
        values.push(result.value);
      }
    }
    
    if (values.length === 0) return null;
    
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const sorted = values.sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    
    return { average: avg, median, count: values.length };
  }

  const result = await db.getFirstAsync(
    `SELECT 
      AVG(ar.value) as average,
      COUNT(ar.value) as count
     FROM assessments a
     JOIN assessment_results ar ON a.id = ar.assessment_id
     JOIN kids k ON a.kid_id = k.id
     WHERE k.age_group = ? AND ar.metric_id = ? AND k.status = 'active'`,
    [ageGroup, metricId]
  );

  return result;
};

export const compareKidToTeamBest = async (kidId, metricId) => {
  if (isWeb) {
    const allResults = webDB.assessment_results.filter(r => r.metric_id === metricId);
    if (allResults.length === 0) return null;
    
    const bestValue = Math.max(...allResults.map(r => r.value));
    const kidLatestAssessment = webDB.assessments.filter(a => a.kid_id === kidId)
      .sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date))[0];
    
    if (!kidLatestAssessment) return null;
    
    const kidResult = webDB.assessment_results.find(r => 
      r.assessment_id === kidLatestAssessment.id && r.metric_id === metricId
    );
    
    if (!kidResult) return null;
    
    return {
      kidValue: kidResult.value,
      teamBest: bestValue,
      differenceFromBest: kidResult.value - bestValue,
      percentageOfBest: Math.round((kidResult.value / bestValue) * 100),
    };
  }

  const result = await db.getFirstAsync(
    `SELECT 
      MAX(ar.value) as team_best,
      (SELECT ar2.value FROM assessment_results ar2
       JOIN assessments a2 ON ar2.assessment_id = a2.id
       WHERE a2.kid_id = ? AND ar2.metric_id = ?
       ORDER BY a2.assessment_date DESC LIMIT 1) as kid_value
     FROM assessment_results ar
     WHERE ar.metric_id = ?`,
    [kidId, metricId, metricId]
  );

  if (!result || !result.kid_value) return null;

  return {
    kidValue: result.kid_value,
    teamBest: result.team_best,
    differenceFromBest: result.kid_value - result.team_best,
    percentageOfBest: Math.round((result.kid_value / result.team_best) * 100),
  };
};

export const getImprovementRate = async (kidId, metricId) => {
  const progress = await getKidProgressByMetric(kidId, metricId);
  
  if (progress.length < 2) return null;
  
  const first = progress[0].value;
  const last = progress[progress.length - 1].value;
  const improvement = last - first;
  const improvementPercentage = (improvement / first) * 100;
  
  return {
    firstValue: first,
    lastValue: last,
    improvement,
    improvementPercentage: Math.round(improvementPercentage * 100) / 100,
    assessmentCount: progress.length,
  };
};

export const calculatePercentile = async (kidId, metricId, value, ageGroup) => {
  if (isWeb) {
    const allKids = webDB.kids.filter(k => k.age_group === ageGroup && k.status === 'active');
    const kidAssessments = webDB.assessments.filter(a => 
      allKids.some(k => k.id === a.kid_id)
    );
    
    const values = [];
    for (const assessment of kidAssessments) {
      const result = webDB.assessment_results.find(r => 
        r.assessment_id === assessment.id && r.metric_id === metricId
      );
      if (result) values.push(result.value);
    }
    
    if (values.length === 0) return null;
    
    // Sort and find rank (actual percentile calculation)
    const sorted = values.sort((a, b) => a - b);
    const rank = sorted.filter(v => v < value).length;
    const percentile = (rank / sorted.length) * 100;
    
    return Math.round(percentile);
  }

  // Mobile: Use SQL ranking for accurate percentile
  const result = await db.getFirstAsync(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN ar.value < ? THEN 1 ELSE 0 END) as below_count
     FROM assessment_results ar
     JOIN assessments a ON ar.assessment_id = a.id
     JOIN kids k ON a.kid_id = k.id
     WHERE ar.metric_id = ? AND k.age_group = ? AND k.status = 'active'`,
    [value, metricId, ageGroup]
  );

  if (!result || result.total === 0) return null;
  return Math.round((result.below_count / result.total) * 100);
};

// ========== UTILITY ==========

export const getDatabase = () => db;

export const clearAllData = async () => {
  if (isWeb) {
    webDB.users = [];
    webDB.kids = [];
    webDB.sessions = [];
    webDB.attendance = [];
    webDB.notes = [];
    webDB.sports = [];
    webDB.metrics = [];
    webDB.assessments = [];
    webDB.assessment_results = [];
    webDB.benchmarks = [];
    webDB.goals = [];
    await saveWebDB();
    return;
  }

  await db.execAsync(`
    DELETE FROM goals;
    DELETE FROM benchmarks;
    DELETE FROM assessment_results;
    DELETE FROM assessments;
    DELETE FROM metrics;
    DELETE FROM sports;
    DELETE FROM notes;
    DELETE FROM attendance;
    DELETE FROM sessions;
    DELETE FROM kids;
    DELETE FROM users;
  `);
};

// Export webDB for debugging (web only)
export const getWebDB = () => (isWeb ? webDB : null);

// ========== ACADEMY INITIALIZATION ==========

/**
 * Initialize academy in Firebase (creates academy document if doesn't exist)
 */
export const initializeAcademyInFirebase = async (userId) => {
  try {
    const FIXED_ACADEMY_ID = 'academy_accellax361_main';
    const { db: firebaseDb } = await import('../config/firebase.js');
    const { doc, getDoc, setDoc, Timestamp } = await import('firebase/firestore');

    const academyRef = doc(firebaseDb, 'academies', FIXED_ACADEMY_ID);
    const academySnap = await getDoc(academyRef);

    if (!academySnap.exists()) {
      console.log('🏫 Creating academy in Firebase...');
      
      await setDoc(academyRef, {
        id: FIXED_ACADEMY_ID,
        name: 'AccellaX 361° Academy',
        description: 'Main Academy',
        owner_id: userId,
        created_by: userId,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
        settings: {
          age_groups: ['4-6', '7-9', '10-13', '13+'],
          assessment_terms: ['Q1', 'Q2', 'Q3', 'Q4'],
        },
      });

      console.log('✅ Academy created in Firebase');
      return { success: true, created: true };
    } else {
      console.log('✅ Academy already exists in Firebase');
      return { success: true, created: false };
    }
  } catch (error) {
    console.error('❌ Error initializing academy:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sync user to local database from Firebase
 */
export const syncUserToLocalDB = async (userId, firebaseUserData) => {
  try {
    console.log('🔄 Syncing user to local DB:', userId);

    // Check if user exists
    const existingUser = await getUserById(userId);

    if (existingUser) {
      // Update existing user
      await updateUser(userId, {
        full_name: firebaseUserData.full_name,
        email: firebaseUserData.email,
        username: firebaseUserData.username || '',
        phone: firebaseUserData.phone || '',
        role: firebaseUserData.role || 'coach',
        avatar_base64: firebaseUserData.avatar_base64 || null,
        updated_at: new Date().toISOString(),
        firebase_synced: 1,
      });
      console.log('✅ User updated in local DB');
    } else {
      // Create new user
      await createUser({
        id: userId,
        fullName: firebaseUserData.full_name,
        email: firebaseUserData.email,
        username: firebaseUserData.username || '',
        phone: firebaseUserData.phone || '',
        authMethod: firebaseUserData.auth_method || 'accellax',
        role: firebaseUserData.role || 'coach',
        avatarBase64: firebaseUserData.avatar_base64 || null,
        isOfflineAccount: false,
      });
      console.log('✅ User created in local DB from Firebase');
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error syncing user to local DB:', error);
    return { success: false, error: error.message };
  }
};

// ========== STATISTICS & COUNTS ==========

/**
 * Get total number of kids (for leaderboards stats)
 */
export const getKidsCount = async () => {
  try {
    if (isWeb) {
      return webDB.kids.filter(k => k.status === 'active').length;
    }
    const result = await db.getFirstAsync('SELECT COUNT(*) as count FROM kids WHERE status = ?', ['active']);
    return result?.count || 0;
  } catch (error) {
    console.error('Error getting kids count:', error);
    return 0;
  }
};

/**
 * Get assessment statistics for current time periods
 */
export const getAssessmentStats = async () => {
  try {
    const now = new Date();
    
    if (isWeb) {
      const assessments = webDB.assessments || [];
      
      // This week
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      // This month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // This quarter
      const quarter = Math.floor(now.getMonth() / 3);
      const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
      
      const thisWeek = assessments.filter(a => 
        new Date(a.assessment_date) >= startOfWeek
      ).length;
      
      const thisMonth = assessments.filter(a => 
        new Date(a.assessment_date) >= startOfMonth
      ).length;
      
      const thisQuarter = assessments.filter(a => 
        new Date(a.assessment_date) >= startOfQuarter
      ).length;
      
      return {
        thisWeek,
        thisMonth,
        thisQuarter,
        total: assessments.length,
      };
    }
    
    // Mobile: Use SQL queries
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const quarter = Math.floor(now.getMonth() / 3);
    const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
    
    const weekResult = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM assessments WHERE assessment_date >= ? AND status = ?',
      [startOfWeek.toISOString().split('T')[0], 'completed']
    );
    
    const monthResult = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM assessments WHERE assessment_date >= ? AND status = ?',
      [startOfMonth.toISOString().split('T')[0], 'completed']
    );
    
    const quarterResult = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM assessments WHERE assessment_date >= ? AND status = ?',
      [startOfQuarter.toISOString().split('T')[0], 'completed']
    );
    
    const totalResult = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM assessments WHERE status = ?',
      ['completed']
    );
    
    return {
      thisWeek: weekResult?.count || 0,
      thisMonth: monthResult?.count || 0,
      thisQuarter: quarterResult?.count || 0,
      total: totalResult?.count || 0,
    };
  } catch (error) {
    console.error('Error getting assessment stats:', error);
    return { thisWeek: 0, thisMonth: 0, thisQuarter: 0, total: 0 };
  }
};

/**
 * Get storage information for settings screen
 */
export const getStorageInfo = async () => {
  try {
    if (isWeb) {
      const totalAssessments = webDB.assessments?.length || 0;
      const totalKids = webDB.kids?.length || 0;
      
      // Estimate database size
      const dbString = JSON.stringify(webDB);
      const dbSizeMB = (dbString.length / 1024 / 1024).toFixed(2);
      
      return {
        totalAssessments,
        totalKids,
        databaseSize: `${dbSizeMB} MB`,
        photosSize: '0 MB', // Not tracked in web version
        videosSize: '0 MB', // Not tracked in web version
      };
    }
    
    // Mobile: Get actual counts
    const assessmentCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM assessments');
    const kidCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM kids WHERE status = ?', ['active']);
    
    return {
      totalAssessments: assessmentCount?.count || 0,
      totalKids: kidCount?.count || 0,
      databaseSize: 'Calculating...', // TODO: Get actual SQLite file size
      photosSize: '0 MB',
      videosSize: '0 MB',
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return {
      totalAssessments: 0,
      totalKids: 0,
      databaseSize: '0 MB',
      photosSize: '0 MB',
      videosSize: '0 MB',
    };
  }
};

/**
 * Delete all data (for settings reset)
 */
export const deleteAllData = async () => {
  try {
    if (isWeb) {
      webDB.users = [];
      webDB.kids = [];
      webDB.sessions = [];
      webDB.attendance = [];
      webDB.notes = [];
      webDB.sports = [];
      webDB.metrics = [];
      webDB.assessments = [];
      webDB.assessment_results = [];
      webDB.benchmarks = [];
      webDB.goals = [];
      await saveWebDB();
      console.log('✅ All data deleted (web)');
      return { success: true };
    }
    
    // Mobile: Delete all tables
    await db.execAsync(`
      DELETE FROM goals;
      DELETE FROM benchmarks;
      DELETE FROM assessment_results;
      DELETE FROM assessments;
      DELETE FROM metrics;
      DELETE FROM sports;
      DELETE FROM notes;
      DELETE FROM attendance;
      DELETE FROM sessions;
      DELETE FROM kids;
    `);
    // Note: Don't delete users to preserve login
    
    console.log('✅ All data deleted (mobile)');
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting all data:', error);
    return { success: false, error: error.message };
  }
};

console.log(`✅ Assessment Database running in ${isWeb ? 'WEB' : 'NATIVE (Android/iOS)'} mode`);

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