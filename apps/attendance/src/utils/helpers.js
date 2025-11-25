// Helper utility functions for AccellaX 361°

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