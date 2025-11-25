// src/utils/constants.js

export const AGE_GROUPS = ['4-6', '7-9', '10-13', '13+'];

export const AGE_GROUP_LABELS = {
  '4-6': '4-6 years',
  '7-9': '7-9 years',
  '10-13': '10-13 years',
  '13+': '13+ years',
};

// ========== USER ROLES ==========

export const USER_ROLES = {
  ATHLETE: 'athlete',
  COACH: 'coach',
  PARENT: 'parent',
  SUPER_ADMIN: 'super_admin',
};

export const ROLE_LABELS = {
  athlete: 'Athlete',
  coach: 'Coach',
  parent: 'Parent',
  super_admin: 'Super Admin',
};

export const ROLE_ICONS = {
  athlete: '⚽',
  coach: '👨‍🏫',
  parent: '👪',
  super_admin: '🔐',
};

export const DEFAULT_ROLE = USER_ROLES.COACH;

export const TRAINING_SCHEDULE = {
  Sunday: { start: '2:00 PM', end: '4:30 PM', display: '2:00 PM - 4:30 PM' },
  Monday: { start: '4:00 PM', end: '6:00 PM', display: '4:00 PM - 6:00 PM' },
  Wednesday: { start: '4:00 PM', end: '6:00 PM', display: '4:00 PM - 6:00 PM' },
  Friday: { start: '4:00 PM', end: '6:00 PM', display: '4:00 PM - 6:00 PM' },
  Saturday: { start: '9:00 AM', end: '11:00 AM', display: '9:00 AM - 11:00 AM' },
};

export const TRAINING_DAYS = ['Sunday', 'Monday', 'Wednesday', 'Friday', 'Saturday'];

export const NON_TRAINING_DAYS = ['Tuesday', 'Thursday'];

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday', 
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

// ========== NEW: SPONSORSHIP & PROGRAM TYPES ==========

export const SPONSORSHIP_TYPES = [
  { value: 'SP', label: 'Self-Sponsored' },
  { value: 'SC', label: 'Scholarship' },
];

export const PROGRAM_TYPES = [
  { value: 'ELT', label: 'Elite' },
  { value: 'WW', label: 'Weekend Warrior' },
  { value: 'HP', label: 'Holiday Program' },
  { value: 'TS', label: 'Team Support' },
  { value: 'Trial', label: 'Trial' },
  { value: 'Other', label: 'Other' },
];

export const FILTER_TYPES = {
  ALL: 'all',
  SCHOLARSHIP: 'SC',
  SELF_SPONSORED: 'SP',
  ELITE: 'ELT',
  WEEKEND_WARRIOR: 'WW',
  HOLIDAY_PROGRAM: 'HP',
  TEAM_SUPPORT: 'TS',
  TRIAL: 'Trial',
};

export const FILTER_LABELS = {
  all: 'All',
  SC: 'Scholarship',
  SP: 'Self-Sponsored',
  ELT: 'Elite',
  WW: 'Weekend',
  HP: 'Holiday',
  TS: 'Team Support',
  Trial: 'Trial',
};

export const BADGE_COLORS = {
  SC: '#4CAF50',    // Green - Scholarship
  SP: '#2196F3',    // Blue - Self-Sponsored
  ELT: '#FF9800',   // Orange - Elite
  WW: '#9E9E9E',    // Gray - Weekend Warrior
  HP: '#9C27B0',    // Purple - Holiday Program
  TS: '#00BCD4',    // Cyan - Team Support
  Trial: '#FFC107', // Amber - Trial
  Other: '#795548',  // Brown - Other
};

export const PROGRAM_SCHEDULE_INFO = {
  ELT: {
    label: 'Elite',
    days: ['Sunday', 'Monday', 'Wednesday', 'Friday', 'Saturday'],
    sessionsPerWeek: 5,
    description: 'Trains 5 days per week',
  },
  WW: {
    label: 'Weekend Warrior',
    days: ['Saturday', 'Sunday'],
    sessionsPerWeek: 2,
    description: 'Trains weekends only',
  },
  HP: {
    label: 'Holiday Program',
    days: [],
    sessionsPerWeek: 0,
    description: 'Attends during school holidays',
  },
  TS: {
    label: 'Team Support',
    days: [],
    sessionsPerWeek: 0,
    description: 'Supports team activities',
  },
  Trial: {
    label: 'Trial',
    days: [],
    sessionsPerWeek: 0,
    description: 'On trial period',
  },
  Other: {
    label: 'Other',
    days: [],
    sessionsPerWeek: 0,
    description: 'Custom program type',
  },
};

// ========== END NEW ==========

export const COLORS = {
  primary: '#2196F3',
  primaryDark: '#1976D2',
  primaryLight: '#BBDEFB',
  secondary: '#4CAF50',
  secondaryDark: '#388E3C',
  present: '#4CAF50',
  absent: '#F44336',
  suspended: '#9E9E9E',
  warning: '#FF9800',
  error: '#F44336',
  background: '#F5F5F5',
  backgroundDark: '#EEEEEE',
  white: '#FFFFFF',
  black: '#000000',
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#BDBDBD',
  border: '#E0E0E0',
  borderDark: '#BDBDBD',
  success: '#4CAF50',
  info: '#2196F3',
  cardBackground: '#FFFFFF',
  shadow: '#000000',
};

export const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

export const KID_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive',
  DISCONTINUED: 'discontinued',
  TRIAL: 'trial',
};

export const KID_STATUS_LABELS = {
  active: 'Active',
  suspended: 'Suspended',
  inactive: 'Inactive',
  discontinued: 'Discontinued',
  trial: 'Trial',
};

export const KID_STATUS_COLORS = {
  active: '#4CAF50',      // Green
  suspended: '#FF9800',   // Orange
  inactive: '#9E9E9E',    // Gray
  discontinued: '#F44336', // Red
  trial: '#2196F3',       // Blue
};

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
};

export const SCREEN_NAMES = {
  ONBOARDING: 'Onboarding',
  HOME: 'Home',
  AGE_GROUP: 'AgeGroup',
  ATTENDANCE: 'Attendance',
  SUMMARY: 'Summary',
  MY_KIDS: 'My Kids',
  ADD_EDIT_KID: 'AddEditKid',
  HISTORY: 'History',
  SESSION_DETAIL: 'SessionDetail',
  SETTINGS: 'Settings',
  NOTES: 'Notes',
  ADD_EDIT_NOTE: 'AddEditNote',
};

export const NOTE_TYPES = {
  GENERAL: 'general',
  SESSION: 'session',
  KID: 'kid',
};

export const NOTE_TYPE_LABELS = {
  general: 'General Note',
  session: 'Session Note',
  kid: 'Kid Note',
};

export const NOTE_TYPE_ICONS = {
  general: '📝',
  session: '📅',
  kid: '👶',
};

export const NOTE_TYPE_COLORS = {
  general: '#FF9800',
  session: '#2196F3',
  kid: '#4CAF50',
};

export const ANIMATION_DURATION = {
  fast: 200,
  normal: 300,
  slow: 500,
};

export const SWIPE_THRESHOLD = 100;
export const SWIPE_DISAPPEAR_DELAY = 3000; // 3 seconds

export const APP_NAME = 'AccellaX 361°';
export const APP_VERSION = '1.0.4';