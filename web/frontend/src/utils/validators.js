/**
 * Validation Utilities
 * Functions for validating user input
 */

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with strength and messages
 */
export const validatePassword = (password) => {
  const result = {
    isValid: false,
    strength: 'weak',
    messages: [],
  };

  if (!password) {
    result.messages.push('Password is required');
    return result;
  }

  if (password.length < 8) {
    result.messages.push('Password must be at least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    result.messages.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    result.messages.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    result.messages.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*]/.test(password)) {
    result.messages.push('Password must contain at least one special character');
  }

  // Determine strength
  if (result.messages.length === 0) {
    result.isValid = true;
    result.strength = 'strong';
  } else if (result.messages.length <= 2) {
    result.strength = 'medium';
  }

  return result;
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @returns {boolean} True if not empty
 */
export const isRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

/**
 * Validate minimum length
 * @param {string} value - Value to validate
 * @param {number} minLength - Minimum length
 * @returns {boolean} True if meets minimum
 */
export const minLength = (value, minLength) => {
  return value && value.length >= minLength;
};

/**
 * Validate maximum length
 * @param {string} value - Value to validate
 * @param {number} maxLength - Maximum length
 * @returns {boolean} True if within maximum
 */
export const maxLength = (value, maxLength) => {
  return value && value.length <= maxLength;
};

export default {
  isValidEmail,
  validatePassword,
  isValidPhone,
  isValidUrl,
  isRequired,
  minLength,
  maxLength,
};