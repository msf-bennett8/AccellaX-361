// Location: /apps/assessment/src/utils/constants.js
// Constants for AccellaX 361° Assessment App

// ========== AGE GROUPS ==========

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
  ADMIN: 'admin',
  OWNER: 'owner',
};

export const ROLE_LABELS = {
  athlete: 'Athlete',
  coach: 'Coach',
  parent: 'Parent',
  admin: 'Admin',
  owner: 'Owner',
};

export const ROLE_ICONS = {
  athlete: '⚽',
  coach: '👨‍🏫',
  parent: '👪',
  admin: '🔐',
  owner: '👑',
};

export const DEFAULT_ROLE = USER_ROLES.COACH;

// ========== SPONSORSHIP & PROGRAM TYPES ==========

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
  Other: '#795548', // Brown - Other
};

// ========== ASSESSMENT-SPECIFIC CONSTANTS ==========

// Assessment Terms
export const ASSESSMENT_TERMS = ['Q1', 'Q2', 'Q3', 'Q4'];

export const TERM_LABELS = {
  Q1: 'Quarter 1 (Jan-Mar)',
  Q2: 'Quarter 2 (Apr-Jun)',
  Q3: 'Quarter 3 (Jul-Sep)',
  Q4: 'Quarter 4 (Oct-Dec)',
};

export const TERM_MONTHS = {
  Q1: [0, 1, 2],    // Jan, Feb, Mar
  Q2: [3, 4, 5],    // Apr, May, Jun
  Q3: [6, 7, 8],    // Jul, Aug, Sep
  Q4: [9, 10, 11],  // Oct, Nov, Dec
};

// Get current term based on month
export const getCurrentTerm = () => {
  const month = new Date().getMonth();
  if (month >= 0 && month <= 2) return 'Q1';
  if (month >= 3 && month <= 5) return 'Q2';
  if (month >= 6 && month <= 8) return 'Q3';
  return 'Q4';
};

// Metric Categories
export const METRIC_CATEGORIES = {
  GENERAL_FITNESS: 'general_fitness',
  SPORT_SPECIFIC: 'sport_specific',
  IQ: 'iq',
};

export const METRIC_CATEGORY_LABELS = {
  general_fitness: 'General Fitness',
  sport_specific: 'Sport-Specific Skills',
  iq: 'Sport IQ',
};

export const METRIC_CATEGORY_ICONS = {
  general_fitness: '💪',
  sport_specific: '🎯',
  iq: '🧠',
};

export const METRIC_CATEGORY_COLORS = {
  general_fitness: '#FF9800',
  sport_specific: '#2196F3',
  iq: '#9C27B0',
};

// Metric Types
export const METRIC_TYPES = {
  NUMERIC: 'numeric',    // Height, weight, etc.
  RATING: 'rating',      // 1-10 scale
  TIMED: 'timed',        // Seconds, minutes
  COUNTED: 'counted',    // Reps, attempts
};

export const METRIC_TYPE_LABELS = {
  numeric: 'Numeric',
  rating: 'Rating (1-10)',
  timed: 'Timed',
  counted: 'Counted',
};

// Assessment Status
export const ASSESSMENT_STATUS = {
  DRAFT: 'draft',
  COMPLETED: 'completed',
};

export const ASSESSMENT_STATUS_LABELS = {
  draft: 'Draft',
  completed: 'Completed',
};

export const ASSESSMENT_STATUS_COLORS = {
  draft: '#FF9800',
  completed: '#4CAF50',
};

// Performance Ratings
export const PERFORMANCE_RATINGS = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
};

export const PERFORMANCE_RATING_LABELS = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

export const PERFORMANCE_RATING_COLORS = {
  excellent: '#4CAF50',  // Green
  good: '#2196F3',       // Blue
  fair: '#FF9800',       // Orange
  poor: '#F44336',       // Red
};

export const PERFORMANCE_RATING_ICONS = {
  excellent: '🌟',
  good: '✅',
  fair: '⚠️',
  poor: '❌',
};

// Percentile Ranges
export const PERCENTILE_RANGES = {
  EXCELLENT: { min: 75, max: 100, label: 'Excellent', color: '#4CAF50' },
  GOOD: { min: 50, max: 74, label: 'Good', color: '#2196F3' },
  FAIR: { min: 25, max: 49, label: 'Fair', color: '#FF9800' },
  POOR: { min: 0, max: 24, label: 'Poor', color: '#F44336' },
};

export const getPercentileRating = (percentile) => {
  if (percentile >= 75) return 'excellent';
  if (percentile >= 50) return 'good';
  if (percentile >= 25) return 'fair';
  return 'poor';
};

// Goal Status
export const GOAL_STATUS = {
  ACTIVE: 'active',
  ACHIEVED: 'achieved',
  MISSED: 'missed',
};

export const GOAL_STATUS_LABELS = {
  active: 'Active',
  achieved: 'Achieved ✅',
  missed: 'Missed',
};

export const GOAL_STATUS_COLORS = {
  active: '#2196F3',
  achieved: '#4CAF50',
  missed: '#F44336',
};

// Default Sports
export const DEFAULT_SPORTS = [
  { id: 'football', name: 'Football', icon: '⚽' },
  { id: 'athletics', name: 'Athletics', icon: '🏃' },
  { id: 'rugby', name: 'Rugby', icon: '🏉' },
  { id: 'swimming', name: 'Swimming', icon: '🏊' },
  { id: 'tennis', name: 'Tennis', icon: '🎾' },
  { id: 'basketball', name: 'Basketball', icon: '🏀' },
];

// Benchmark Sources
export const BENCHMARK_SOURCES = [
  'FIFA 11+',
  'Cooper Test',
  'Beep Test',
  'Custom',
  'Academy Standard',
];

// ========== KID STATUS ==========

export const KID_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  TRIAL: 'trial',
  GRADUATED: 'graduated',
};

export const KID_STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
  trial: 'Trial',
  graduated: 'Graduated',
};

export const KID_STATUS_COLORS = {
  active: '#4CAF50',      // Green
  inactive: '#9E9E9E',    // Gray
  trial: '#2196F3',       // Blue
  graduated: '#FF9800',   // Orange
};

// ========== NOTE TYPES ==========

export const NOTE_TYPES = {
  GENERAL: 'general',
  SESSION: 'session',
  KID: 'kid',
  ASSESSMENT: 'assessment',
  SPORT: 'sport',
};

export const NOTE_TYPE_LABELS = {
  general: 'General Note',
  session: 'Session Note',
  kid: 'Kid Note',
  assessment: 'Assessment Note',
  sport: 'Sport Note',
};

export const NOTE_TYPE_ICONS = {
  general: '📝',
  session: '📅',
  kid: '👶',
  assessment: '📊',
  sport: '⚽',
};

export const NOTE_TYPE_COLORS = {
  general: '#FF9800',
  session: '#2196F3',
  kid: '#4CAF50',
  assessment: '#9C27B0',
  sport: '#00BCD4',
};

// ========== COLORS ==========

export const COLORS = {
  primary: '#2196F3',
  primaryDark: '#1976D2',
  primaryLight: '#BBDEFB',
  secondary: '#4CAF50',
  secondaryDark: '#388E3C',
  accent: '#FF9800',
  accentDark: '#F57C00',
  present: '#4CAF50',
  absent: '#F44336',
  suspended: '#9E9E9E',
  warning: '#FF9800',
  error: '#F44336',
  success: '#4CAF50',
  info: '#2196F3',
  background: '#F5F5F5',
  backgroundDark: '#EEEEEE',
  white: '#FFFFFF',
  black: '#000000',
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#BDBDBD',
  border: '#E0E0E0',
  borderDark: '#BDBDBD',
  cardBackground: '#FFFFFF',
  shadow: '#000000',
};

// ========== SPACING ==========

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ========== FONT SIZES ==========

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

// ========== BORDER RADIUS ==========

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
};

// ========== SCREEN NAMES ==========

export const SCREEN_NAMES = {
  // Auth & Onboarding
  ONBOARDING: 'Onboarding',
  LOGIN: 'Login',
  
  // Main Navigation
  HOME: 'Home',
  
  // Assessment Flow
  SELECT_SPORT: 'SelectSport',
  SELECT_KIDS: 'SelectKids',
  GENERAL_FITNESS: 'GeneralFitness',
  SPORT_SPECIFIC: 'SportSpecific',
  ASSESSMENT_SUMMARY: 'AssessmentSummary',
  
  // History & Progress
  HISTORY: 'History',
  KID_PROGRESS: 'KidProgress',
  COMPARISON: 'Comparison',
  
  // Management
  MY_KIDS: 'MyKids',
  ADD_EDIT_KID: 'AddEditKid',
  SPORTS_MANAGEMENT: 'SportsManagement',
  METRICS_MANAGEMENT: 'MetricsManagement',
  
  // Reports & Analytics
  REPORTS: 'Reports',
  LEADERBOARDS: 'Leaderboards',
  BENCHMARKING: 'Benchmarking',
  
  // Notes
  NOTES: 'Notes',
  ADD_EDIT_NOTE: 'AddEditNote',
  
  // Settings
  SETTINGS: 'Settings',
  PROFILE: 'Profile',
};

// ========== GENDER OPTIONS ==========

export const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

// ========== ANIMATION ==========

export const ANIMATION_DURATION = {
  fast: 200,
  normal: 300,
  slow: 500,
};

export const SWIPE_THRESHOLD = 100;
export const SWIPE_DISAPPEAR_DELAY = 3000; // 3 seconds

// ========== APP INFO ==========

export const APP_NAME = 'AccellaX 361° Assessment';
export const APP_VERSION = '1.0.0';
export const ACADEMY_ID = 'academy_accellax361_main';

// ========== LIMITS & VALIDATION ==========

export const VALIDATION = {
  MIN_AGE: 4,
  MAX_AGE: 18,
  MIN_HEIGHT: 50,
  MAX_HEIGHT: 250,
  MIN_WEIGHT: 10,
  MAX_WEIGHT: 150,
  MIN_RATING: 1,
  MAX_RATING: 10,
  MAX_NAME_LENGTH: 100,
  MAX_NOTE_LENGTH: 1000,
};

// ========== EXPORT FORMATS ==========

export const EXPORT_FORMATS = {
  PDF: 'pdf',
  CSV: 'csv',
  EXCEL: 'excel',
  JSON: 'json',
};

export const EXPORT_FORMAT_LABELS = {
  pdf: 'PDF Document',
  csv: 'CSV Spreadsheet',
  excel: 'Excel Spreadsheet',
  json: 'JSON Data',
};

// ========== CHART COLORS ==========

export const CHART_COLORS = [
  '#2196F3', // Blue
  '#4CAF50', // Green
  '#FF9800', // Orange
  '#9C27B0', // Purple
  '#F44336', // Red
  '#00BCD4', // Cyan
  '#FFEB3B', // Yellow
  '#795548', // Brown
  '#607D8B', // Blue Gray
  '#E91E63', // Pink
];

export default {
  AGE_GROUPS,
  AGE_GROUP_LABELS,
  USER_ROLES,
  ROLE_LABELS,
  ROLE_ICONS,
  DEFAULT_ROLE,
  SPONSORSHIP_TYPES,
  PROGRAM_TYPES,
  FILTER_TYPES,
  FILTER_LABELS,
  BADGE_COLORS,
  ASSESSMENT_TERMS,
  TERM_LABELS,
  TERM_MONTHS,
  getCurrentTerm,
  METRIC_CATEGORIES,
  METRIC_CATEGORY_LABELS,
  METRIC_CATEGORY_ICONS,
  METRIC_CATEGORY_COLORS,
  METRIC_TYPES,
  METRIC_TYPE_LABELS,
  ASSESSMENT_STATUS,
  ASSESSMENT_STATUS_LABELS,
  ASSESSMENT_STATUS_COLORS,
  PERFORMANCE_RATINGS,
  PERFORMANCE_RATING_LABELS,
  PERFORMANCE_RATING_COLORS,
  PERFORMANCE_RATING_ICONS,
  PERCENTILE_RANGES,
  getPercentileRating,
  GOAL_STATUS,
  GOAL_STATUS_LABELS,
  GOAL_STATUS_COLORS,
  DEFAULT_SPORTS,
  BENCHMARK_SOURCES,
  KID_STATUS,
  KID_STATUS_LABELS,
  KID_STATUS_COLORS,
  NOTE_TYPES,
  NOTE_TYPE_LABELS,
  NOTE_TYPE_ICONS,
  NOTE_TYPE_COLORS,
  COLORS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SCREEN_NAMES,
  GENDER_OPTIONS,
  ANIMATION_DURATION,
  SWIPE_THRESHOLD,
  SWIPE_DISAPPEAR_DELAY,
  APP_NAME,
  APP_VERSION,
  ACADEMY_ID,
  VALIDATION,
  EXPORT_FORMATS,
  EXPORT_FORMAT_LABELS,
  CHART_COLORS,
};