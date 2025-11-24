// User Roles
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  HEAD_COACH: 'head_coach',
  COACH: 'coach',
  PAYMENT_RECORDER: 'payment_recorder',
  PARENT: 'parent',
  KID: 'kid',
  SPONSOR: 'sponsor',
};

// Age Groups
export const AGE_GROUPS = ['4-6', '7-9', '10-13', '13+'];

// Sponsorship Types
export const SPONSORSHIP_TYPES = {
  SELF_SPONSORED: 'SP',
  SCHOLARSHIP: 'SC',
};

// Program Types
export const PROGRAM_TYPES = {
  ELITE: 'Elite',
  WEEKEND_WARRIOR: 'Weekend Warrior',
  HOLIDAY_PROGRAMME: 'Holiday Programme',
  TEAM_SUPPORT: 'Team Support',
};

// Kid Status
export const KID_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive',
  EXPELLED: 'expelled',
};

// Attendance Status
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
};

// Attendance Patterns (for filters)
export const ATTENDANCE_PATTERNS = {
  CHRONIC_ABSENTEE: 'chronic_absentee', // < 50%
  INCONSISTENT: 'inconsistent', // 50-75%
  ACTIVE: 'active', // > 75%
};

// Training Schedule
export const TRAINING_SCHEDULE = {
  Sunday: { start: '2:00 PM', end: '4:30 PM' },
  Monday: { start: '4:00 PM', end: '6:00 PM' },
  Wednesday: { start: '4:00 PM', end: '6:00 PM' },
  Friday: { start: '4:00 PM', end: '6:00 PM' },
  Saturday: { start: '9:00 AM', end: '11:00 AM' },
};

export const TRAINING_DAYS = ['Sunday', 'Monday', 'Wednesday', 'Friday', 'Saturday'];

// Event Types
export const EVENT_TYPES = {
  TRAINING: 'training',
  TOURNAMENT: 'tournament',
  CAMP: 'camp',
  MEETING: 'meeting',
  FUNDRAISER: 'fundraiser',
};

// Colors
export const COLORS = {
  primary: '#2196F3',
  success: '#4CAF50',
  danger: '#F44336',
  warning: '#FF9800',
  gray: '#9E9E9E',
};

// Badge Colors
export const BADGE_COLORS = {
  SP: 'bg-green-100 text-green-800 border-green-300',
  SC: 'bg-blue-100 text-blue-800 border-blue-300',
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-gray-100 text-gray-800',
  inactive: 'bg-yellow-100 text-yellow-800',
  expelled: 'bg-red-100 text-red-800',
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    ELEVATE_ROLE: '/auth/elevate-role',
  },
  KIDS: {
    LIST: '/kids',
    CREATE: '/kids',
    UPDATE: (id) => `/kids/${id}`,
    DELETE: (id) => `/kids/${id}`,
    SUSPEND: (id) => `/kids/${id}/suspend`,
    ACTIVATE: (id) => `/kids/${id}/activate`,
    HISTORY: (id) => `/kids/${id}/attendance-history`,
    STATS: (id) => `/kids/${id}/statistics`,
  },
  SESSIONS: {
    LIST: '/sessions',
    CREATE: '/sessions',
    DETAIL: (id) => `/sessions/${id}`,
    ATTENDANCE: (id) => `/sessions/${id}/attendance`,
  },
  ATTENDANCE: {
    FILTERS: '/attendance/filters',
    REPORTS: '/attendance/reports',
    EXPORT: '/attendance/export',
  },
  EVENTS: {
    LIST: '/events',
    CREATE: '/events',
    UPDATE: (id) => `/events/${id}`,
    DELETE: (id) => `/events/${id}`,
    RSVP: (id) => `/events/${id}/rsvp`,
  },
  MESSAGES: {
    INBOX: '/messages',
    SEND: '/messages/send',
    CONVERSATION: (userId) => `/messages/conversations/${userId}`,
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    CREATE: '/notifications/popup',
  },
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    PATTERNS: '/analytics/attendance-patterns',
    SPONSORSHIP: '/analytics/sponsorship',
  },
};