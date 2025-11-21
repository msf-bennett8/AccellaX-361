/**
 * File: web/frontend/src/services/api.js
 * AccellaX 361° - Core API Service
 * 
 * Description:
 * Centralized API client using Axios. All HTTP requests to the Laravel backend
 * go through this service. Handles authentication tokens, request/response
 * interceptors, error handling, and retry logic.
 */

import axios from 'axios';

// Base API URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important for Laravel Sanctum
});

/**
 * Request Interceptor
 * Adds authentication token to every request
 */
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add academy_id if exists (for multi-academy support)
    const academyId = localStorage.getItem('academy_id');
    if (academyId) {
      config.headers['X-Academy-ID'] = academyId;
    }

    // Log requests in development
    if (import.meta.env.DEV) {
      console.log('🌐 API Request:', config.method.toUpperCase(), config.url);
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles responses and errors globally
 */
api.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (import.meta.env.DEV) {
      console.log('✅ API Response:', response.config.url, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log errors
    console.error('❌ API Error:', error.response?.status, error.response?.data);

    // Handle 401 Unauthorized (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear auth data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');

      // Redirect to login
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Handle 403 Forbidden (insufficient permissions)
    if (error.response?.status === 403) {
      // Redirect to unauthorized page
      window.location.href = '/unauthorized';
      return Promise.reject(error);
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.warn('⚠️ Resource not found:', originalRequest.url);
    }

    // Handle 500 Server Error
    if (error.response?.status === 500) {
      console.error('💥 Server Error:', error.response?.data);
      // Could trigger a toast notification here
    }

    // Handle network errors (offline)
    if (!error.response) {
      console.error('🌐 Network Error: No response from server');
      // Could trigger offline mode here
    }

    return Promise.reject(error);
  }
);

/**
 * Helper function to extract error message
 */
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

/**
 * Helper function to check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('auth_token');
};

/**
 * Helper function to get current user
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Helper function to set auth data
 */
export const setAuthData = (token, user) => {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Helper function to clear auth data
 */
export const clearAuthData = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  localStorage.removeItem('academy_id');
};

// Export the configured axios instance
export default api;

/**
 * Usage Examples:
 * 
 * import api from '@/services/api';
 * 
 * // GET request
 * const response = await api.get('/kids');
 * 
 * // POST request
 * const response = await api.post('/kids', { name: 'John', age: 10 });
 * 
 * // PUT request
 * const response = await api.put('/kids/1', { name: 'Jane' });
 * 
 * // DELETE request
 * const response = await api.delete('/kids/1');
 * 
 * // With error handling
 * try {
 *   const response = await api.get('/kids');
 *   console.log(response.data);
 * } catch (error) {
 *   console.error(getErrorMessage(error));
 * }
 */