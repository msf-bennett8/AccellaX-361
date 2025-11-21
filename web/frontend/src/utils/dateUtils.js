/**
 * Date Utilities
 * Helper functions for date formatting and manipulation
 */
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @param {string} formatStr - Format string (default: 'MMM dd, yyyy')
 * @returns {string} Formatted date
 */
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid date';
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format date with time
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date with time
 */
export const formatDateTime = (date) => {
  return formatDate(date, 'MMM dd, yyyy HH:mm');
};

/**
 * Get relative time (e.g., "2 hours ago")
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid date';
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    console.error('Error getting relative time:', error);
    return 'Invalid date';
  }
};

/**
 * Check if date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  return dateObj.toDateString() === today.toDateString();
};

/**
 * Get time ago in short format (e.g., "2h", "3d")
 * @param {Date|string} date - Date to format
 * @returns {string} Short time ago string
 */
export const getTimeAgoShort = (date) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const seconds = Math.floor((new Date() - dateObj) / 1000);

  const intervals = {
    y: 31536000,
    mo: 2592000,
    d: 86400,
    h: 3600,
    m: 60,
  };

  for (const [key, value] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / value);
    if (interval >= 1) {
      return `${interval}${key}`;
    }
  }

  return 'now';
};

export default {
  formatDate,
  formatDateTime,
  getRelativeTime,
  isToday,
  getTimeAgoShort,
};