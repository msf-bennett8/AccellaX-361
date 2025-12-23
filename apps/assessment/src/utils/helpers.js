// Location: /apps/assessment/src/utils/helpers.js
// Enhanced helper utility functions for AccellaX 361° Assessment App

/**
 * Calculate attendance percentage
 * @param {number} present - Number of present
 * @param {number} total - Total number
 * @returns {number} - Percentage (0-100)
 */
export const calculateAttendancePercentage = (present, total) => {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
};

/**
 * Format percentage for display
 * @param {number} percentage - Percentage value
 * @returns {string} - Formatted percentage (e.g., "85%")
 */
export const formatPercentage = (percentage) => {
  return `${Math.round(percentage)}%`;
};

/**
 * Capitalize first letter of string
 * @param {string} str - Input string
 * @returns {string} - Capitalized string
 */
export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} - Initials (e.g., "JD" for "John Doe")
 */
export const getInitials = (name) => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} - True if valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (basic)
 * @param {string} phone - Phone number
 * @returns {boolean} - True if valid phone
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Generate unique ID
 * @returns {string} - Unique ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} - Cloned object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Group array by key
 * @param {Array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {Object} - Grouped object
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};

/**
 * Sort array by key
 * @param {Array} array - Array to sort
 * @param {string} key - Key to sort by
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array} - Sorted array
 */
export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Filter array by search query
 * @param {Array} array - Array to filter
 * @param {string} query - Search query
 * @param {Array} keys - Keys to search in
 * @returns {Array} - Filtered array
 */
export const filterBySearch = (array, query, keys) => {
  if (!query) return array;
  const lowerQuery = query.toLowerCase();
  return array.filter(item => {
    return keys.some(key => {
      const value = item[key];
      return value && value.toString().toLowerCase().includes(lowerQuery);
    });
  });
};

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} - Formatted number (e.g., "1,234")
 */
export const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Truncate string
 * @param {string} str - String to truncate
 * @param {number} length - Max length
 * @returns {string} - Truncated string
 */
export const truncate = (str, length = 50) => {
  if (!str || str.length <= length) return str;
  return str.substring(0, length) + '...';
};

/**
 * Check if object is empty
 * @param {Object} obj - Object to check
 * @returns {boolean} - True if empty
 */
export const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after delay
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Validate age group
 * @param {number} age - Age value
 * @returns {string} - Age group (e.g., "4-6")
 */
export const getAgeGroup = (age) => {
  if (age >= 4 && age <= 6) return '4-6';
  if (age >= 7 && age <= 9) return '7-9';
  if (age >= 10 && age <= 13) return '10-13';
  if (age >= 13) return '13+';
  return 'Unknown';
};

/**
 * Get random color (for avatars, etc.)
 * @returns {string} - Random hex color
 */
export const getRandomColor = () => {
  const colors = ['#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4'];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Format attendance status for display
 * @param {string} status - Status ('present' or 'absent')
 * @returns {Object} - Object with display text and color
 */
export const formatAttendanceStatus = (status) => {
  if (status === 'present') {
    return { text: 'Present', color: '#4CAF50', icon: '✓' };
  }
  return { text: 'Absent', color: '#F44336', icon: '✗' };
};

/**
 * Calculate attendance streak
 * @param {Array} attendanceRecords - Array of attendance records (sorted by date)
 * @returns {number} - Current streak count
 */
export const calculateStreak = (attendanceRecords) => {
  if (!attendanceRecords || attendanceRecords.length === 0) return 0;
  
  let streak = 0;
  for (let i = attendanceRecords.length - 1; i >= 0; i--) {
    if (attendanceRecords[i].status === 'present') {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

/**
 * Export data as CSV format
 * @param {Array} data - Array of objects
 * @param {Array} headers - Array of header names
 * @returns {string} - CSV formatted string
 */
export const exportToCSV = (data, headers) => {
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header] || '';
      return `"${value}"`;
    }).join(',');
  });
  return [csvHeaders, ...csvRows].join('\n');
};

// ========== ASSESSMENT-SPECIFIC HELPERS ==========

/**
 * Calculate percentile rank within a dataset
 * @param {number} value - Value to rank
 * @param {Array} dataset - Array of numbers
 * @returns {number} - Percentile (0-100)
 */
export const calculatePercentile = (value, dataset) => {
  if (!dataset || dataset.length === 0) return 0;
  
  const sorted = [...dataset].sort((a, b) => a - b);
  const count = sorted.filter(v => v < value).length;
  return Math.round((count / sorted.length) * 100);
};

/**
 * Get performance rating based on percentile
 * @param {number} percentile - Percentile value (0-100)
 * @returns {Object} - Rating object with label, color, and icon
 */
export const getPerformanceRating = (percentile) => {
  if (percentile >= 75) {
    return { label: 'Excellent', color: '#4CAF50', icon: '🌟', emoji: '🏆' };
  } else if (percentile >= 50) {
    return { label: 'Good', color: '#2196F3', icon: '✅', emoji: '👍' };
  } else if (percentile >= 25) {
    return { label: 'Fair', color: '#FF9800', icon: '⚠️', emoji: '💪' };
  } else {
    return { label: 'Needs Work', color: '#F44336', icon: '❌', emoji: '📈' };
  }
};

/**
 * Calculate improvement percentage between two values
 * @param {number} oldValue - Previous value
 * @param {number} newValue - Current value
 * @returns {number} - Improvement percentage (can be negative for decline)
 */
export const calculateImprovement = (oldValue, newValue) => {
  if (oldValue === 0) return 0;
  return Math.round(((newValue - oldValue) / oldValue) * 100);
};

/**
 * Format improvement percentage for display
 * @param {number} improvement - Improvement percentage
 * @returns {Object} - Object with text, color, and icon
 */
export const formatImprovement = (improvement) => {
  if (improvement > 0) {
    return {
      text: `+${improvement}%`,
      color: '#4CAF50',
      icon: '↑',
      emoji: '📈',
    };
  } else if (improvement < 0) {
    return {
      text: `${improvement}%`,
      color: '#F44336',
      icon: '↓',
      emoji: '📉',
    };
  } else {
    return {
      text: '0%',
      color: '#9E9E9E',
      icon: '→',
      emoji: '➡️',
    };
  }
};

/**
 * Calculate average of an array of numbers
 * @param {Array} numbers - Array of numbers
 * @returns {number} - Average value
 */
export const calculateAverage = (numbers) => {
  if (!numbers || numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / numbers.length) * 100) / 100;
};

/**
 * Calculate median of an array of numbers
 * @param {Array} numbers - Array of numbers
 * @returns {number} - Median value
 */
export const calculateMedian = (numbers) => {
  if (!numbers || numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

/**
 * Calculate standard deviation
 * @param {Array} numbers - Array of numbers
 * @returns {number} - Standard deviation
 */
export const calculateStandardDeviation = (numbers) => {
  if (!numbers || numbers.length === 0) return 0;
  const avg = calculateAverage(numbers);
  const squareDiffs = numbers.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = calculateAverage(squareDiffs);
  return Math.round(Math.sqrt(avgSquareDiff) * 100) / 100;
};

/**
 * Format metric value based on type
 * @param {number} value - Value to format
 * @param {string} type - Metric type (numeric, rating, timed, counted)
 * @param {string} unit - Unit (cm, kg, seconds, etc.)
 * @returns {string} - Formatted value
 */
export const formatMetricValue = (value, type, unit) => {
  if (value === null || value === undefined) return 'N/A';
  
  switch (type) {
    case 'numeric':
      return `${value}${unit ? ` ${unit}` : ''}`;
    case 'rating':
      return `${value}/10`;
    case 'timed':
      return formatTime(value, unit);
    case 'counted':
      return `${value} ${unit || 'reps'}`;
    default:
      return `${value}`;
  }
};

/**
 * Format time value (seconds to readable format)
 * @param {number} seconds - Time in seconds
 * @param {string} unit - Unit hint (optional)
 * @returns {string} - Formatted time (e.g., "2:35" for 155 seconds)
 */
export const formatTime = (seconds, unit) => {
  if (unit === 'minutes') {
    const mins = Math.floor(seconds);
    const secs = Math.round((seconds - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`;
  }
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Parse time string to seconds
 * @param {string} timeStr - Time string (e.g., "2:35" or "35.5")
 * @returns {number} - Time in seconds
 */
export const parseTime = (timeStr) => {
  if (!timeStr) return 0;
  
  if (timeStr.includes(':')) {
    const [mins, secs] = timeStr.split(':').map(Number);
    return (mins * 60) + secs;
  }
  
  return parseFloat(timeStr);
};

/**
 * Get metric category display info
 * @param {string} category - Category (general_fitness, sport_specific, iq)
 * @returns {Object} - Display info with label, color, icon
 */
export const getMetricCategoryInfo = (category) => {
  const categories = {
    general_fitness: {
      label: 'General Fitness',
      color: '#FF9800',
      icon: '💪',
      emoji: '🏃',
    },
    sport_specific: {
      label: 'Sport-Specific Skills',
      color: '#2196F3',
      icon: '🎯',
      emoji: '⚽',
    },
    iq: {
      label: 'Sport IQ',
      color: '#9C27B0',
      icon: '🧠',
      emoji: '🎓',
    },
  };
  
  return categories[category] || {
    label: category,
    color: '#9E9E9E',
    icon: '📊',
    emoji: '📈',
  };
};

/**
 * Get sport icon/emoji
 * @param {string} sportName - Sport name
 * @returns {string} - Emoji icon
 */
export const getSportIcon = (sportName) => {
  const icons = {
    football: '⚽',
    athletics: '🏃',
    rugby: '🏉',
    swimming: '🏊',
    tennis: '🎾',
    basketball: '🏀',
  };
  
  return icons[sportName.toLowerCase()] || '🏅';
};

/**
 * Calculate BMI (Body Mass Index)
 * @param {number} weight - Weight in kg
 * @param {number} height - Height in cm
 * @returns {number} - BMI value
 */
export const calculateBMI = (weight, height) => {
  if (!weight || !height || height === 0) return 0;
  const heightInMeters = height / 100;
  return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
};

/**
 * Get BMI category
 * @param {number} bmi - BMI value
 * @param {number} age - Age in years
 * @returns {Object} - Category info with label and color
 */
export const getBMICategory = (bmi, age) => {
  // For kids, BMI categories are age-dependent
  // This is a simplified version - real implementation should use CDC growth charts
  if (age < 18) {
    if (bmi < 14) return { label: 'Underweight', color: '#FF9800' };
    if (bmi < 20) return { label: 'Healthy Weight', color: '#4CAF50' };
    if (bmi < 25) return { label: 'Overweight', color: '#FF9800' };
    return { label: 'Obese', color: '#F44336' };
  }
  
  // Adult categories
  if (bmi < 18.5) return { label: 'Underweight', color: '#FF9800' };
  if (bmi < 25) return { label: 'Normal', color: '#4CAF50' };
  if (bmi < 30) return { label: 'Overweight', color: '#FF9800' };
  return { label: 'Obese', color: '#F44336' };
};

/**
 * Calculate z-score (standard score)
 * @param {number} value - Value to score
 * @param {number} mean - Population mean
 * @param {number} stdDev - Standard deviation
 * @returns {number} - Z-score
 */
export const calculateZScore = (value, mean, stdDev) => {
  if (stdDev === 0) return 0;
  return Math.round(((value - mean) / stdDev) * 100) / 100;
};

/**
 * Calculate trend direction from array of values
 * @param {Array} values - Array of values (chronological)
 * @returns {string} - 'improving', 'declining', or 'stable'
 */
export const calculateTrend = (values) => {
  if (!values || values.length < 2) return 'stable';
  
  let improvements = 0;
  let declines = 0;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i - 1]) improvements++;
    else if (values[i] < values[i - 1]) declines++;
  }
  
  if (improvements > declines) return 'improving';
  if (declines > improvements) return 'declining';
  return 'stable';
};

/**
 * Get trend display info
 * @param {string} trend - Trend ('improving', 'declining', 'stable')
 * @returns {Object} - Display info with label, color, icon
 */
export const getTrendInfo = (trend) => {
  const trends = {
    improving: {
      label: 'Improving',
      color: '#4CAF50',
      icon: '📈',
      emoji: '🚀',
    },
    declining: {
      label: 'Declining',
      color: '#F44336',
      icon: '📉',
      emoji: '⚠️',
    },
    stable: {
      label: 'Stable',
      color: '#2196F3',
      icon: '➡️',
      emoji: '🔄',
    },
  };
  
  return trends[trend] || trends.stable;
};

/**
 * Generate color for chart based on index
 * @param {number} index - Index in chart
 * @returns {string} - Hex color code
 */
export const getChartColor = (index) => {
  const colors = [
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
  
  return colors[index % colors.length];
};

/**
 * Validate metric value based on type and constraints
 * @param {number} value - Value to validate
 * @param {string} type - Metric type
 * @param {number} min - Min value (optional)
 * @param {number} max - Max value (optional)
 * @returns {Object} - Validation result with isValid and error
 */
export const validateMetricValue = (value, type, min, max) => {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: 'Value is required' };
  }
  
  const numValue = parseFloat(value);
  
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Value must be a number' };
  }
  
  if (type === 'rating' && (numValue < 1 || numValue > 10)) {
    return { isValid: false, error: 'Rating must be between 1 and 10' };
  }
  
  if (min !== null && min !== undefined && numValue < min) {
    return { isValid: false, error: `Value must be at least ${min}` };
  }
  
  if (max !== null && max !== undefined && numValue > max) {
    return { isValid: false, error: `Value must be at most ${max}` };
  }
  
  if (type === 'counted' && numValue < 0) {
    return { isValid: false, error: 'Count cannot be negative' };
  }
  
  if (type === 'timed' && numValue < 0) {
    return { isValid: false, error: 'Time cannot be negative' };
  }
  
  return { isValid: true };
};

/**
 * Compare kid to benchmark standards
 * @param {number} value - Kid's value
 * @param {Object} benchmarks - Benchmark thresholds
 * @returns {string} - Performance level (excellent, good, fair, poor)
 */
export const compareToStandard = (value, benchmarks) => {
  if (!benchmarks) return 'unknown';
  
  const { excellent_min, good_min, fair_min, poor_max } = benchmarks;
  
  if (excellent_min && value >= excellent_min) return 'excellent';
  if (good_min && value >= good_min) return 'good';
  if (fair_min && value >= fair_min) return 'fair';
  return 'poor';
};

/**
 * Generate assessment summary text
 * @param {Array} results - Assessment results
 * @returns {string} - Summary text
 */
export const generateAssessmentSummary = (results) => {
  if (!results || results.length === 0) return 'No assessment data available.';
  
  const ratings = results.filter(r => r.type === 'rating');
  const avgRating = calculateAverage(ratings.map(r => r.value));
  
  const excellent = results.filter(r => r.percentile >= 75).length;
  const good = results.filter(r => r.percentile >= 50 && r.percentile < 75).length;
  
  let summary = `Completed ${results.length} metrics. `;
  
  if (excellent > 0) {
    summary += `${excellent} excellent performance${excellent > 1 ? 's' : ''}. `;
  }
  
  if (good > 0) {
    summary += `${good} good performance${good > 1 ? 's' : ''}. `;
  }
  
  if (ratings.length > 0) {
    summary += `Average skill rating: ${avgRating.toFixed(1)}/10.`;
  }
  
  return summary;
};

/**
 * Filter assessments by date range
 * @param {Array} assessments - Array of assessments
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} - Filtered assessments
 */
export const filterByDateRange = (assessments, startDate, endDate) => {
  if (!assessments || assessments.length === 0) return [];
  
  return assessments.filter(assessment => {
    const assessmentDate = new Date(assessment.assessment_date);
    return assessmentDate >= startDate && assessmentDate <= endDate;
  });
};

/**
 * Extract unique values from array of objects
 * @param {Array} array - Array of objects
 * @param {string} key - Key to extract
 * @returns {Array} - Unique values
 */
export const getUniqueValues = (array, key) => {
  return [...new Set(array.map(item => item[key]))].filter(Boolean);
};

/**
 * Safe divide (avoid division by zero)
 * @param {number} numerator - Numerator
 * @param {number} denominator - Denominator
 * @param {number} defaultValue - Default if division fails
 * @returns {number} - Result or default
 */
export const safeDivide = (numerator, denominator, defaultValue = 0) => {
  if (denominator === 0) return defaultValue;
  return numerator / denominator;
};

/**
 * safeJsonParse
 * @param 
 * @param 
 * @param 
 * @returns 
 */
// src/utils/helpers.js
export const safeJsonParse = (str, fallback = {}) => {
  try {
    if (!str || str === 'undefined' || str === 'null') {
      return fallback;
    }
    return JSON.parse(str);
  } catch (error) {
    console.error('[helpers] JSON parse error:', error);
    return fallback;
  }
};

/**
 * Clamp value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Clamped value
 */
export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

// Export all functions
export default {
  calculateAttendancePercentage,
  formatPercentage,
  capitalizeFirst,
  getInitials,
  isValidEmail,
  isValidPhone,
  generateId,
  debounce,
  deepClone,
  groupBy,
  sortBy,
  filterBySearch,
  formatNumber,
  truncate,
  isEmpty,
  sleep,
  getAgeGroup,
  getRandomColor,
  formatAttendanceStatus,
  calculateStreak,
  exportToCSV,
  calculatePercentile,
  getPerformanceRating,
  calculateImprovement,
  formatImprovement,
  calculateAverage,
  calculateMedian,
  calculateStandardDeviation,
  formatMetricValue,
  formatTime,
  parseTime,
  getMetricCategoryInfo,
  getSportIcon,
  calculateBMI,
  getBMICategory,
  calculateZScore,
  calculateTrend,
  getTrendInfo,
  getChartColor,
  validateMetricValue,
  compareToStandard,
  generateAssessmentSummary,
  filterByDateRange,
  getUniqueValues,
  safeDivide,
  clamp,
};