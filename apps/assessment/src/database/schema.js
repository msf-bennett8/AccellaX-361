// Location: /apps/assessment/src/database/schema.js
// Database Schema Documentation & SQL Definitions for AccellaX 361° Assessment App

/**
 * ========== DATABASE SCHEMA OVERVIEW ==========
 * 
 * This assessment app uses SQLite (mobile) and AsyncStorage (web) with Firebase sync.
 * Tables are organized into SHARED (with attendance app) and ASSESSMENT-SPECIFIC.
 * 
 * FIXED ACADEMY ID: academy_accellax361_main (shared across all apps)
 */

// ========== SQL SCHEMA STRINGS (for reference) ==========

/**
 * SQL schema for Users table (SHARED with attendance)
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
 * SQL schema for Kids table (SHARED with attendance)
 */
export const KIDS_TABLE_SCHEMA = `
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
`;

/**
 * SQL schema for Notes table (SHARED with attendance)
 */
export const NOTES_TABLE_SCHEMA = `
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
`;

/**
 * SQL schema for Sports table (ASSESSMENT-SPECIFIC)
 */
export const SPORTS_TABLE_SCHEMA = `
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
`;

/**
 * SQL schema for Metrics table (ASSESSMENT-SPECIFIC)
 */
export const METRICS_TABLE_SCHEMA = `
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
`;

/**
 * SQL schema for Assessments table (ASSESSMENT-SPECIFIC)
 */
export const ASSESSMENTS_TABLE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS assessments (
    id TEXT PRIMARY KEY,
    academy_id TEXT NOT NULL,
    kid_id TEXT NOT NULL,
    sport_id TEXT NOT NULL,
    assessment_date DATE NOT NULL,
    year TEXT NOT NULL,
    term TEXT NOT NULL,
    assessment_type TEXT NOT NULL,
    week_number INTEGER NOT NULL,
    location TEXT,
    assessor_name TEXT NOT NULL,
    general_notes TEXT,
    assessed_by TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'completed',
    scheduled_date DATE,
    rescheduled_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    firebase_synced INTEGER DEFAULT 0,
    FOREIGN KEY (kid_id) REFERENCES kids(id),
    FOREIGN KEY (sport_id) REFERENCES sports(id)
  );
`;

/**
 * SQL schema for Assessment Results table (ASSESSMENT-SPECIFIC)
 */
export const ASSESSMENT_RESULTS_TABLE_SCHEMA = `
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
`;

/**
 * SQL schema for Benchmarks table (ASSESSMENT-SPECIFIC)
 */
export const BENCHMARKS_TABLE_SCHEMA = `
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
`;

/**
 * SQL schema for Goals table (ASSESSMENT-SPECIFIC)
 */
export const GOALS_TABLE_SCHEMA = `
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
`;

/**
 * SQL schema for Settings table (OPTIONAL)
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
  ${NOTES_TABLE_SCHEMA}
  ${SPORTS_TABLE_SCHEMA}
  ${METRICS_TABLE_SCHEMA}
  ${ASSESSMENTS_TABLE_SCHEMA}
  ${ASSESSMENT_RESULTS_TABLE_SCHEMA}
  ${BENCHMARKS_TABLE_SCHEMA}
  ${GOALS_TABLE_SCHEMA}
  ${SETTINGS_TABLE_SCHEMA}
`;

/**
 * Create indexes for better query performance
 */
export const CREATE_INDEXES = `
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
`;

/**
 * Drop all tables (use with caution!)
 */
export const DROP_ALL_TABLES = `
  DROP TABLE IF EXISTS goals;
  DROP TABLE IF EXISTS benchmarks;
  DROP TABLE IF EXISTS assessment_results;
  DROP TABLE IF EXISTS assessments;
  DROP TABLE IF EXISTS metrics;
  DROP TABLE IF EXISTS sports;
  DROP TABLE IF EXISTS notes;
  DROP TABLE IF EXISTS kids;
  DROP TABLE IF EXISTS users;
  DROP TABLE IF EXISTS settings;
`;

// ========== TABLE DOCUMENTATION ==========

export const USERS_TABLE = {
  name: 'users',
  description: 'Coach/staff accounts (shared with attendance app)',
  columns: {
    id: { type: 'TEXT', primaryKey: true, description: 'Firebase Auth UID or offline_TIMESTAMP' },
    full_name: { type: 'TEXT', required: true, description: 'Coach full name' },
    email: { type: 'TEXT', required: true, unique: true, description: 'Email address' },
    username: { type: 'TEXT', nullable: true, description: 'Username (optional)' },
    phone: { type: 'TEXT', nullable: true, description: 'Phone number' },
    password_hash: { type: 'TEXT', nullable: true, description: 'Hashed password (offline accounts only)' },
    auth_method: { type: 'TEXT', default: 'accellax', values: ['accellax', 'google', 'apple'] },
    role: { type: 'TEXT', default: 'coach', values: ['coach', 'admin', 'owner'] },
    avatar_base64: { type: 'TEXT', nullable: true, description: 'Base64-encoded avatar' },
    created_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
    last_login_at: { type: 'DATETIME', nullable: true },
    firebase_synced: { type: 'INTEGER', default: 0, values: [0, 1] },
    is_offline_account: { type: 'INTEGER', default: 1, values: [0, 1] },
  },
  firebasePath: 'users/{id}',
};

export const KIDS_TABLE = {
  name: 'kids',
  description: 'Athlete profiles (shared with attendance app)',
  columns: {
    id: { type: 'TEXT', primaryKey: true, description: 'Unique kid ID' },
    user_id: { type: 'TEXT', required: true, description: 'Coach who added the kid' },
    name: { type: 'TEXT', required: true, description: 'Kid full name' },
    age: { type: 'INTEGER', required: true, description: 'Current age' },
    gender: { type: 'TEXT', nullable: true, values: ['male', 'female', 'other'] },
    area_of_residence: { type: 'TEXT', nullable: true, description: 'Residential area' },
    age_group: { type: 'TEXT', required: true, values: ['4-6', '7-9', '10-13', '13+'] },
    sponsorshipType: { type: 'TEXT', default: 'SP', values: ['SP', 'SC'] },
    programType: { type: 'TEXT', default: 'ELT', values: ['ELT', 'WW', 'Trial'] },
    programTypeOther: { type: 'TEXT', nullable: true },
    trialNotes: { type: 'TEXT', nullable: true },
    status: { type: 'TEXT', default: 'active', values: ['active', 'inactive', 'trial', 'graduated'] },
    sports_enrolled: { type: 'TEXT', nullable: true, description: 'JSON array of sport IDs' },
    primary_sport: { type: 'TEXT', nullable: true, description: 'Primary sport for specialization' },
    created_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
    firebase_synced: { type: 'INTEGER', default: 0, values: [0, 1] },
  },
  firebasePath: 'academies/{academy_id}/kids/{id}',
};

export const SPORTS_TABLE = {
  name: 'sports',
  description: 'Sports definitions and configurations',
  columns: {
    id: { type: 'TEXT', primaryKey: true, description: 'Unique sport ID', example: 'football' },
    academy_id: { type: 'TEXT', required: true, default: 'academy_accellax361_main' },
    name: { type: 'TEXT', required: true, example: 'Football' },
    icon: { type: 'TEXT', nullable: true, example: '⚽' },
    is_default: { type: 'INTEGER', default: 1, values: [0, 1] },
    is_active: { type: 'INTEGER', default: 1, values: [0, 1] },
    created_by: { type: 'TEXT', nullable: true },
    created_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
    firebase_synced: { type: 'INTEGER', default: 0, values: [0, 1] },
  },
  firebasePath: 'academies/{academy_id}/sports/{id}',
  defaultSports: [
    { id: 'football', name: 'Football', icon: '⚽' },
    { id: 'athletics', name: 'Athletics', icon: '🏃' },
    { id: 'rugby', name: 'Rugby', icon: '🏉' },
    { id: 'swimming', name: 'Swimming', icon: '🏊' },
    { id: 'tennis', name: 'Tennis', icon: '🎾' },
    { id: 'basketball', name: 'Basketball', icon: '🏀' },
  ],
};

export const METRICS_TABLE = {
  name: 'metrics',
  description: 'Assessment metrics per sport',
  columns: {
    id: { type: 'TEXT', primaryKey: true },
    academy_id: { type: 'TEXT', required: true },
    sport_id: { type: 'TEXT', required: true },
    name: { type: 'TEXT', required: true, example: 'Passing Accuracy' },
    category: { type: 'TEXT', required: true, values: ['general_fitness', 'sport_specific', 'iq'] },
    type: { type: 'TEXT', required: true, values: ['numeric', 'rating', 'timed', 'counted'] },
    unit: { type: 'TEXT', nullable: true, example: 'cm, kg, seconds, /10' },
    min_value: { type: 'REAL', nullable: true },
    max_value: { type: 'REAL', nullable: true },
    is_default: { type: 'INTEGER', default: 1, values: [0, 1] },
    display_order: { type: 'INTEGER', default: 0 },
    created_by: { type: 'TEXT', nullable: true },
    created_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
    firebase_synced: { type: 'INTEGER', default: 0, values: [0, 1] },
  },
  firebasePath: 'academies/{academy_id}/metrics/{id}',
};

export const ASSESSMENTS_TABLE = {
  name: 'assessments',
  description: 'Assessment records per kid per sport per term',
  columns: {
    id: { type: 'TEXT', primaryKey: true },
    academy_id: { type: 'TEXT', required: true },
    kid_id: { type: 'TEXT', required: true },
    sport_id: { type: 'TEXT', required: true },
    assessment_date: { type: 'DATE', required: true, example: '2025-03-15' },
    term: { type: 'TEXT', required: true, values: ['Q1', 'Q2', 'Q3', 'Q4'] },
    assessed_by: { type: 'TEXT', required: true },
    notes: { type: 'TEXT', nullable: true },
    status: { type: 'TEXT', default: 'completed', values: ['draft', 'completed'] },
    created_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
    firebase_synced: { type: 'INTEGER', default: 0, values: [0, 1] },
  },
  firebasePath: 'academies/{academy_id}/assessments/{id}',
};

export const ASSESSMENT_RESULTS_TABLE = {
  name: 'assessment_results',
  description: 'Individual metric results per assessment',
  columns: {
    id: { type: 'TEXT', primaryKey: true },
    assessment_id: { type: 'TEXT', required: true },
    metric_id: { type: 'TEXT', required: true },
    value: { type: 'REAL', required: true },
    percentile: { type: 'REAL', nullable: true, description: 'Percentile rank within age group' },
    notes: { type: 'TEXT', nullable: true },
    firebase_synced: { type: 'INTEGER', default: 0, values: [0, 1] },
  },
  firebasePath: 'academies/{academy_id}/assessments/{assessment_id} (embedded)',
};

export const BENCHMARKS_TABLE = {
  name: 'benchmarks',
  description: 'Performance standards per metric per age group',
  columns: {
    id: { type: 'TEXT', primaryKey: true },
    metric_id: { type: 'TEXT', required: true },
    age_group: { type: 'TEXT', required: true, values: ['4-6', '7-9', '10-13', '13+'] },
    gender: { type: 'TEXT', nullable: true, values: ['male', 'female', null] },
    excellent_min: { type: 'REAL', nullable: true },
    good_min: { type: 'REAL', nullable: true },
    fair_min: { type: 'REAL', nullable: true },
    poor_max: { type: 'REAL', nullable: true },
    source: { type: 'TEXT', nullable: true, example: 'FIFA 11+, Cooper Test' },
    created_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
  },
  firebasePath: 'academies/{academy_id}/benchmarks/{metric_id}_{age_group}_{gender}',
};

export const GOALS_TABLE = {
  name: 'goals',
  description: 'Performance goals per kid per metric',
  columns: {
    id: { type: 'TEXT', primaryKey: true },
    kid_id: { type: 'TEXT', required: true },
    metric_id: { type: 'TEXT', required: true },
    target_value: { type: 'REAL', required: true },
    target_date: { type: 'DATE', required: true },
    status: { type: 'TEXT', default: 'active', values: ['active', 'achieved', 'missed'] },
    created_by: { type: 'TEXT', nullable: true },
    created_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
    firebase_synced: { type: 'INTEGER', default: 0, values: [0, 1] },
  },
  firebasePath: 'academies/{academy_id}/goals/{id}',
};

// ========== SCHEMA EXPORT ==========

export const ASSESSMENT_SCHEMA = {
  version: '1.0.0',
  database: 'accellax361_assessment.db',
  academyId: 'academy_accellax361_main',
  tables: {
    users: USERS_TABLE,
    kids: KIDS_TABLE,
    notes: NOTES_TABLE,
    sports: SPORTS_TABLE,
    metrics: METRICS_TABLE,
    assessments: ASSESSMENTS_TABLE,
    assessment_results: ASSESSMENT_RESULTS_TABLE,
    benchmarks: BENCHMARKS_TABLE,
    goals: GOALS_TABLE,
  },
};

export default ASSESSMENT_SCHEMA;