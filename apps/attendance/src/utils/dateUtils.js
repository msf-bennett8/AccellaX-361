// Date utility functions for AccellaX 361°

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