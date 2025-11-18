// Database schema definitions for AccellaX 361°

/**
 * SQL schema for Kids table
 */
export const KIDS_TABLE_SCHEMA = `
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
`;

/**
 * SQL schema for Sessions table
 */
export const SESSIONS_TABLE_SCHEMA = `
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
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    firebase_synced INTEGER DEFAULT 0
  );
`;

/**
 * SQL schema for Attendance table
 */
export const ATTENDANCE_TABLE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    kid_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    firebase_synced INTEGER DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (kid_id) REFERENCES kids(id) ON DELETE CASCADE
  );
`;

/**
 * SQL schema for Users table
 */
export const USERS_TABLE_SCHEMA = `
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
`;

/**
 * SQL schema for Settings table
 */
export const SETTINGS_TABLE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

/**
 * Create all database tables
 */
export const CREATE_ALL_TABLES = `
  ${USERS_TABLE_SCHEMA}
  ${KIDS_TABLE_SCHEMA}
  ${SESSIONS_TABLE_SCHEMA}
  ${ATTENDANCE_TABLE_SCHEMA}
  ${SETTINGS_TABLE_SCHEMA}
`;

/**
 * Create indexes for better query performance
 */
export const CREATE_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_kids_user_id ON kids(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_kids_age_group ON kids(age_group);
  CREATE INDEX IF NOT EXISTS idx_kids_status ON kids(status);
  CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(session_date);
  CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);
  CREATE INDEX IF NOT EXISTS idx_attendance_kid ON attendance(kid_id);
`;

/**
 * Drop all tables (use with caution!)
 */
export const DROP_ALL_TABLES = `
  DROP TABLE IF EXISTS attendance;
  DROP TABLE IF EXISTS sessions;
  DROP TABLE IF EXISTS kids;
  DROP TABLE IF EXISTS users;
  DROP TABLE IF EXISTS settings;
`;