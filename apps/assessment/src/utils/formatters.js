// Location: /apps/assessment/src/utils/formatters.js
// Data formatting utilities for consistent display

/**
 * Format a date to readable string
 * @param {string|Date} date - Date to format
 * @param {string} format - 'short', 'long', 'time'
 * @returns {string} Formatted date
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return 'N/A';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return 'Invalid Date';
  
  const options = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
    time: { hour: '2-digit', minute: '2-digit' },
  };
  
  return d.toLocaleDateString('en-US', options[format] || options.short);
};

/**
 * Format a number with optional decimal places
 * @param {number} value - Number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number
 */
export const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  
  return Number(value).toFixed(decimals);
};

/**
 * Format a score as percentage
 * @param {number} score - Score (0-100)
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (score) => {
  if (score === null || score === undefined || isNaN(score)) return 'N/A';
  
  return `${Math.round(score)}%`;
};

/**
 * Format age group for display
 * @param {string} ageGroup - Age group code (e.g., '4-6')
 * @returns {string} Formatted age group
 */
export const formatAgeGroup = (ageGroup) => {
  if (!ageGroup) return 'N/A';
  
  return `${ageGroup} years`;
};

/**
 * Format team name with emoji
 * @param {string} teamId - Team ID
 * @param {Array} houseTeams - HOUSE_TEAMS array
 * @returns {string} Formatted team name
 */
export const formatTeamName = (teamId, houseTeams) => {
  if (!teamId || !houseTeams) return 'N/A';
  
  const team = houseTeams.find(t => t.id === teamId);
  
  return team ? `${team.emoji} ${team.name}` : teamId;
};

/**
 * Format sport IDs array to readable string
 * @param {Array} sportIds - Array of sport IDs
 * @param {Array} allSports - All sports array
 * @param {number} limit - Max number to show (default: 3)
 * @returns {string} Formatted sports string
 */
export const formatSports = (sportIds, allSports, limit = 3) => {
  if (!sportIds || sportIds.length === 0) return 'No sports';
  
  const sportNames = sportIds
    .slice(0, limit)
    .map(id => {
      const sport = allSports?.find(s => s.id === id);
      return sport?.name || id;
    });
  
  const remaining = sportIds.length - limit;
  
  if (remaining > 0) {
    return `${sportNames.join(', ')} +${remaining}`;
  }
  
  return sportNames.join(', ');
};

/**
 * Format metric value with unit
 * @param {number} value - Metric value
 * @param {string} unit - Unit (e.g., 'cm', 'kg', 'sec')
 * @param {number} decimals - Decimal places (default: 1)
 * @returns {string} Formatted value with unit
 */
export const formatMetricValue = (value, unit, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  
  const formatted = Number(value).toFixed(decimals);
  
  return unit ? `${formatted} ${unit}` : formatted;
};

/**
 * Format time duration
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted time (MM:SS)
 */
export const formatDuration = (seconds) => {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return 'N/A';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format improvement change
 * @param {number} change - Change value
 * @param {boolean} showSign - Show + sign for positive (default: true)
 * @returns {string} Formatted change with sign
 */
export const formatChange = (change, showSign = true) => {
  if (change === null || change === undefined || isNaN(change)) return 'N/A';
  
  const sign = change > 0 ? '+' : '';
  
  return showSign ? `${sign}${change}` : `${change}`;
};

/**
 * Format name to initials
 * @param {string} name - Full name
 * @returns {string} Initials (e.g., "John Doe" -> "JD")
 */
export const formatInitials = (name) => {
  if (!name) return '??';
  
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Truncate text to max length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length (default: 50)
 * @returns {string} Truncated text with ellipsis
 */
export const truncate = (text, maxLength = 50) => {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Format assessment status to readable string
 * @param {string} status - Status code
 * @returns {string} Formatted status
 */
export const formatAssessmentStatus = (status) => {
  const statusMap = {
    completed: 'Completed',
    in_progress: 'In Progress',
    scheduled: 'Scheduled',
    draft: 'Draft',
    cancelled: 'Cancelled',
  };
  
  return statusMap[status] || status;
};

/**
 * Format rank with ordinal suffix
 * @param {number} rank - Rank number
 * @returns {string} Rank with suffix (e.g., "1st", "2nd")
 */
export const formatRank = (rank) => {
  if (!rank || isNaN(rank)) return 'N/A';
  
  const j = rank % 10;
  const k = rank % 100;
  
  if (j === 1 && k !== 11) return `${rank}st`;
  if (j === 2 && k !== 12) return `${rank}nd`;
  if (j === 3 && k !== 13) return `${rank}rd`;
  
  return `${rank}th`;
};

/**
 * Format list to readable string
 * @param {Array} items - Array of items
 * @param {number} limit - Max items to show (default: 3)
 * @returns {string} Formatted list
 */
export const formatList = (items, limit = 3) => {
  if (!items || items.length === 0) return 'None';
  
  const visible = items.slice(0, limit);
  const remaining = items.length - limit;
  
  if (remaining > 0) {
    return `${visible.join(', ')} +${remaining} more`;
  }
  
  return visible.join(', ');
};

export default {
  formatDate,
  formatNumber,
  formatPercentage,
  formatAgeGroup,
  formatTeamName,
  formatSports,
  formatMetricValue,
  formatDuration,
  formatChange,
  formatInitials,
  truncate,
  formatAssessmentStatus,
  formatRank,
  formatList,
};