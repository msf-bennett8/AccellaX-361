/**
 * Analytics Utility
 * Handles event logging and analytics tracking
 */

// Check if analytics is available (Google Analytics, Firebase, etc.)
const isAnalyticsAvailable = () => {
  return typeof window !== 'undefined' && (window.gtag || window.analytics);
};

/**
 * Log an event to analytics
 * @param {string} eventName - Name of the event
 * @param {object} eventParams - Additional parameters for the event
 */
export const logEvent = (eventName, eventParams = {}) => {
  try {
    // Console log in development
    if (import.meta.env.DEV) {
      console.log('[Analytics]', eventName, eventParams);
    }

    // Google Analytics 4
    if (window.gtag) {
      window.gtag('event', eventName, eventParams);
    }

    // Firebase Analytics
    if (window.analytics) {
      window.analytics.logEvent(eventName, eventParams);
    }
  } catch (error) {
    console.error('Analytics error:', error);
  }
};

/**
 * Log page view
 * @param {string} pagePath - Path of the page
 * @param {string} pageTitle - Title of the page
 */
export const logPageView = (pagePath, pageTitle) => {
  logEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle,
  });
};

/**
 * Log user login
 * @param {string} method - Login method (email, google, etc.)
 */
export const logLogin = (method) => {
  logEvent('login', { method });
};

/**
 * Log user signup
 * @param {string} method - Signup method
 */
export const logSignup = (method) => {
  logEvent('sign_up', { method });
};

/**
 * Set user properties
 * @param {object} properties - User properties
 */
export const setUserProperties = (properties) => {
  try {
    if (window.gtag) {
      window.gtag('set', 'user_properties', properties);
    }
    if (window.analytics) {
      window.analytics.setUserProperties(properties);
    }
  } catch (error) {
    console.error('Error setting user properties:', error);
  }
};

export default {
  logEvent,
  logPageView,
  logLogin,
  logSignup,
  setUserProperties,
};