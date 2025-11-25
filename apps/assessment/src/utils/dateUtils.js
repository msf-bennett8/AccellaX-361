// Location: /apps/assessment/src/utils/dateUtils.js
// Enhanced date utility functions for AccellaX 361° Assessment App

/**
 * Format date to readable string
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} - Formatted date string (e.g., "Monday, January 15, 2024")
 */
export const formatDate = (date) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return dateObj.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

// Keep formatDateLong as an alias for backward compatibility
export const formatDateLong = formatDate;

/**
 * Format time to readable string
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} - Formatted time string (e.g., "4:30 PM")
 */
export const formatTime = (date) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid Time';
  }
};

/**
 * Get current day of the week
 * @returns {string} - Day name (e.g., "Monday")
 */
export const getCurrentDay = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

/**
 * Check if a day is a training day
 * @param {string} day - Day name
 * @returns {boolean} - True if training day
 */
export const isTrainingDay = (day) => {
  const TRAINING_DAYS = ['Sunday', 'Monday', 'Wednesday', 'Friday', 'Saturday'];
  return TRAINING_DAYS.includes(day);
};

/**
 * Get date in YYYY-MM-DD format
 * @param {Date} date - Date object
 * @returns {string} - ISO date string
 */
export const getISODate = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};

/**
 * Format date for display in lists (e.g., "Jan 15, 2024")
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} - Short formatted date
 */
export const formatShortDate = (date) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return dateObj.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting short date:', error);
    return 'Invalid Date';
  }
};

/**
 * Check if date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if date is today
 */
export const isToday = (date) => {
  const today = new Date();
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Get day of week from date
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} - Day name
 */
export const getDayOfWeek = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return days[dateObj.getDay()];
};

/**
 * Parse ISO date string to Date object
 * @param {string} isoString - ISO date string
 * @returns {Date} - Date object
 */
export const parseISODate = (isoString) => {
  return new Date(isoString);
};

/**
 * Get month name from date
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} - Month name (e.g., "January")
 */
export const getMonthName = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', { month: 'long' });
};

/**
 * Get time ago string (e.g., "2 days ago")
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} - Time ago string
 */
export const getTimeAgo = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now - dateObj;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
};

/**
 * Compare two dates (ignoring time)
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {number} - -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export const compareDates = (date1, date2) => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  
  if (d1 < d2) return -1;
  if (d1 > d2) return 1;
  return 0;
};

// ========== ASSESSMENT-SPECIFIC DATE UTILITIES ==========

/**
 * Get current quarter/term (Q1, Q2, Q3, Q4)
 * @param {Date} date - Date to check (defaults to now)
 * @returns {string} - Term code (Q1, Q2, Q3, Q4)
 */
export const getCurrentTerm = (date = new Date()) => {
  const month = date.getMonth();
  if (month >= 0 && month <= 2) return 'Q1';
  if (month >= 3 && month <= 5) return 'Q2';
  if (month >= 6 && month <= 8) return 'Q3';
  return 'Q4';
};

/**
 * Get full term label with date range
 * @param {string} term - Term code (Q1, Q2, Q3, Q4)
 * @param {number} year - Year (defaults to current year)
 * @returns {string} - Full term label (e.g., "Q1 2024 (Jan-Mar)")
 */
export const getTermLabel = (term, year = new Date().getFullYear()) => {
  const termLabels = {
    Q1: `Q1 ${year} (Jan-Mar)`,
    Q2: `Q2 ${year} (Apr-Jun)`,
    Q3: `Q3 ${year} (Jul-Sep)`,
    Q4: `Q4 ${year} (Oct-Dec)`,
  };
  return termLabels[term] || term;
};

/**
 * Get term from a specific date
 * @param {Date|string} date - Date to check
 * @returns {string} - Term code (Q1, Q2, Q3, Q4)
 */
export const getTermFromDate = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return getCurrentTerm(dateObj);
};

/**
 * Get start date of a term
 * @param {string} term - Term code (Q1, Q2, Q3, Q4)
 * @param {number} year - Year
 * @returns {Date} - Start date of the term
 */
export const getTermStartDate = (term, year = new Date().getFullYear()) => {
  const termStarts = {
    Q1: new Date(year, 0, 1),  // January 1
    Q2: new Date(year, 3, 1),  // April 1
    Q3: new Date(year, 6, 1),  // July 1
    Q4: new Date(year, 9, 1),  // October 1
  };
  return termStarts[term] || new Date();
};

/**
 * Get end date of a term
 * @param {string} term - Term code (Q1, Q2, Q3, Q4)
 * @param {number} year - Year
 * @returns {Date} - End date of the term
 */
export const getTermEndDate = (term, year = new Date().getFullYear()) => {
  const termEnds = {
    Q1: new Date(year, 2, 31),  // March 31
    Q2: new Date(year, 5, 30),  // June 30
    Q3: new Date(year, 8, 30),  // September 30
    Q4: new Date(year, 11, 31), // December 31
  };
  return termEnds[term] || new Date();
};

/**
 * Get all months in a term
 * @param {string} term - Term code (Q1, Q2, Q3, Q4)
 * @returns {string[]} - Array of month names
 */
export const getTermMonths = (term) => {
  const termMonths = {
    Q1: ['January', 'February', 'March'],
    Q2: ['April', 'May', 'June'],
    Q3: ['July', 'August', 'September'],
    Q4: ['October', 'November', 'December'],
  };
  return termMonths[term] || [];
};

/**
 * Check if a date falls within a specific term
 * @param {Date|string} date - Date to check
 * @param {string} term - Term code (Q1, Q2, Q3, Q4)
 * @param {number} year - Year
 * @returns {boolean} - True if date is in the term
 */
export const isDateInTerm = (date, term, year = new Date().getFullYear()) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const startDate = getTermStartDate(term, year);
  const endDate = getTermEndDate(term, year);
  
  return dateObj >= startDate && dateObj <= endDate;
};

/**
 * Get previous term
 * @param {string} term - Current term code (Q1, Q2, Q3, Q4)
 * @returns {object} - { term: string, year: number }
 */
export const getPreviousTerm = (term, year = new Date().getFullYear()) => {
  const termOrder = ['Q4', 'Q1', 'Q2', 'Q3'];
  const currentIndex = termOrder.indexOf(term);
  const previousTerm = termOrder[currentIndex];
  
  if (term === 'Q1') {
    return { term: 'Q4', year: year - 1 };
  }
  
  const terms = ['Q1', 'Q2', 'Q3', 'Q4'];
  const index = terms.indexOf(term);
  return { term: terms[index - 1], year };
};

/**
 * Get next term
 * @param {string} term - Current term code (Q1, Q2, Q3, Q4)
 * @returns {object} - { term: string, year: number }
 */
export const getNextTerm = (term, year = new Date().getFullYear()) => {
  if (term === 'Q4') {
    return { term: 'Q1', year: year + 1 };
  }
  
  const terms = ['Q1', 'Q2', 'Q3', 'Q4'];
  const index = terms.indexOf(term);
  return { term: terms[index + 1], year };
};

/**
 * Calculate age from birth date
 * @param {Date|string} birthDate - Birth date
 * @returns {number} - Age in years
 */
export const calculateAge = (birthDate) => {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Get age group from age
 * @param {number} age - Age in years
 * @returns {string} - Age group (4-6, 7-9, 10-13, 13+)
 */
export const getAgeGroup = (age) => {
  if (age >= 4 && age <= 6) return '4-6';
  if (age >= 7 && age <= 9) return '7-9';
  if (age >= 10 && age <= 13) return '10-13';
  if (age >= 13) return '13+';
  return '4-6'; // Default
};

/**
 * Calculate days between two dates
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {number} - Number of days between dates
 */
export const daysBetween = (date1, date2) => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Add days to a date
 * @param {Date|string} date - Starting date
 * @param {number} days - Number of days to add
 * @returns {Date} - New date
 */
export const addDays = (date, days) => {
  const result = typeof date === 'string' ? new Date(date) : new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Subtract days from a date
 * @param {Date|string} date - Starting date
 * @param {number} days - Number of days to subtract
 * @returns {Date} - New date
 */
export const subtractDays = (date, days) => {
  return addDays(date, -days);
};

/**
 * Get start of week (Sunday)
 * @param {Date|string} date - Date in the week
 * @returns {Date} - Start of week date
 */
export const getStartOfWeek = (date) => {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

/**
 * Get end of week (Saturday)
 * @param {Date|string} date - Date in the week
 * @returns {Date} - End of week date
 */
export const getEndOfWeek = (date) => {
  const start = getStartOfWeek(date);
  return addDays(start, 6);
};

/**
 * Get start of month
 * @param {Date|string} date - Date in the month
 * @returns {Date} - Start of month date
 */
export const getStartOfMonth = (date) => {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

/**
 * Get end of month
 * @param {Date|string} date - Date in the month
 * @returns {Date} - End of month date
 */
export const getEndOfMonth = (date) => {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
};

/**
 * Check if date is in the past
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if date is in the past
 */
export const isPast = (date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d < new Date();
};

/**
 * Check if date is in the future
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if date is in the future
 */
export const isFuture = (date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d > new Date();
};

/**
 * Format date for assessment display (e.g., "15 Jan 2024")
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date
 */
export const formatAssessmentDate = (date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate();
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

/**
 * Format date range (e.g., "1 Jan - 31 Mar 2024")
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {string} - Formatted date range
 */
export const formatDateRange = (startDate, endDate) => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  const startDay = start.getDate();
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endDay = end.getDate();
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const year = end.getFullYear();
  
  if (start.getMonth() === end.getMonth()) {
    return `${startDay}-${endDay} ${endMonth} ${year}`;
  }
  
  return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
};

/**
 * Get weeks between two dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {number} - Number of weeks
 */
export const weeksBetween = (startDate, endDate) => {
  const days = daysBetween(startDate, endDate);
  return Math.floor(days / 7);
};

/**
 * Get months between two dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {number} - Number of months
 */
export const monthsBetween = (startDate, endDate) => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  return (end.getFullYear() - start.getFullYear()) * 12 + 
         (end.getMonth() - start.getMonth());
};

/**
 * Format timestamp to readable datetime (e.g., "Jan 15, 2024 at 4:30 PM")
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted datetime
 */
export const formatDateTime = (date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = formatShortDate(d);
  const timeStr = formatTime(d);
  return `${dateStr} at ${timeStr}`;
};

/**
 * Check if date is this week
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if date is in current week
 */
export const isThisWeek = (date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const startOfWeek = getStartOfWeek(new Date());
  const endOfWeek = getEndOfWeek(new Date());
  return d >= startOfWeek && d <= endOfWeek;
};

/**
 * Check if date is this month
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if date is in current month
 */
export const isThisMonth = (date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

/**
 * Check if date is this year
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if date is in current year
 */
export const isThisYear = (date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getFullYear() === new Date().getFullYear();
};

/**
 * Get relative date string (e.g., "Today", "Tomorrow", "Yesterday", or formatted date)
 * @param {Date|string} date - Date to format
 * @returns {string} - Relative or formatted date string
 */
export const getRelativeDateString = (date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const yesterday = subtractDays(today, 1);
  
  if (isToday(d)) return 'Today';
  if (compareDates(d, tomorrow) === 0) return 'Tomorrow';
  if (compareDates(d, yesterday) === 0) return 'Yesterday';
  
  return formatShortDate(d);
};

// Export all utilities
export default {
  formatDate,
  formatDateLong,
  formatTime,
  getCurrentDay,
  isTrainingDay,
  getISODate,
  formatShortDate,
  isToday,
  getDayOfWeek,
  parseISODate,
  getMonthName,
  getTimeAgo,
  compareDates,
  getCurrentTerm,
  getTermLabel,
  getTermFromDate,
  getTermStartDate,
  getTermEndDate,
  getTermMonths,
  isDateInTerm,
  getPreviousTerm,
  getNextTerm,
  calculateAge,
  getAgeGroup,
  daysBetween,
  addDays,
  subtractDays,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  isPast,
  isFuture,
  formatAssessmentDate,
  formatDateRange,
  weeksBetween,
  monthsBetween,
  formatDateTime,
  isThisWeek,
  isThisMonth,
  isThisYear,
  getRelativeDateString,
};