/**
 * Route Helpers
 * Utilities for route management and prefetching
 */

/**
 * Prefetch a route for faster navigation
 * @param {string} path - Route path to prefetch
 */
export const prefetchRoute = (path) => {
  try {
    // Create a link element for prefetching
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    document.head.appendChild(link);
  } catch (error) {
    console.error('Error prefetching route:', error);
  }
};

/**
 * Navigate to a route with optional state
 * @param {function} navigate - React Router navigate function
 * @param {string} path - Path to navigate to
 * @param {object} state - Optional state to pass
 */
export const navigateWithState = (navigate, path, state = {}) => {
  navigate(path, { state });
};

/**
 * Get query parameters from URL
 * @param {string} search - URL search string
 * @returns {object} Query parameters as object
 */
export const getQueryParams = (search) => {
  return Object.fromEntries(new URLSearchParams(search));
};

/**
 * Build URL with query parameters
 * @param {string} path - Base path
 * @param {object} params - Query parameters
 * @returns {string} URL with query string
 */
export const buildUrlWithParams = (path, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return queryString ? `${path}?${queryString}` : path;
};

export default {
  prefetchRoute,
  navigateWithState,
  getQueryParams,
  buildUrlWithParams,
};