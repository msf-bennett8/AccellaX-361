/**
 * File: web/frontend/src/services/authService.js
 * AccellaX 361° - Authentication Service (HYBRID: Laravel + Firebase)
 * 
 * Description:
 * Handles all authentication operations including login, registration,
 * logout, role elevation, and session management.
 * 
 * Architecture:
 * - User authenticates with Laravel API (MySQL database)
 * - Laravel creates Firebase custom token
 * - Frontend signs into Firebase with custom token (for real-time data)
 */

import api, { setAuthData, clearAuthData, getErrorMessage } from './api';
import { getAuth, signInWithCustomToken, signOut as firebaseSignOut } from 'firebase/auth';

/**
 * Get Firebase Auth instance (lazily initialized)
 * This ensures Firebase is initialized before trying to use it
 */
const getFirebaseAuth = () => {
  try {
    return getAuth();
  } catch (error) {
    console.warn('⚠️ Firebase Auth not available:', error.message);
    return null;
  }
};

/**
 * Login user (Laravel + Firebase)
 */
export const login = async (credentials) => {
  try {
    // Send identifier (can be email, username, or phone)
    const loginPayload = {
      identifier: credentials.identifier,
      password: credentials.password
    };
    
    // 1. Login to Laravel backend
    const response = await api.post('/auth/login', loginPayload);
    
    console.log('🔍 Full response:', response);
    console.log('🔍 Response data:', response.data);
    
    const { token, firebase_token, user } = response.data;
    
    console.log('🔍 Extracted - token:', token, 'user:', user);
    
    // 2. Store Laravel Sanctum token
    setAuthData(token, user);
    
    // 3. Sign into Firebase with custom token (not email/password!)
    if (firebase_token) {
      try {
        const firebaseAuth = getFirebaseAuth();
        if (firebaseAuth) {
          await signInWithCustomToken(firebaseAuth, firebase_token);
          console.log('✅ Signed into Firebase with custom token');
        }
      } catch (firebaseError) {
        console.warn('⚠️ Firebase login failed (non-critical):', firebaseError.message);
      }
    }
    
    return { token, user };
  } catch (error) {
    console.error('❌ Login error:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Login with Google
 */
export const loginWithGoogle = async () => {
  try {
    // This would integrate with Firebase Google Auth
    // For now, we'll call the backend endpoint
    const response = await api.post('/auth/login/google');
    
    const { token, firebase_token, user } = response.data;
    
    // Store auth data
    setAuthData(token, user);
    
    // Sign into Firebase if token provided
    if (firebase_token) {
      try {
        const firebaseAuth = getFirebaseAuth();
        if (firebaseAuth) {
          await signInWithCustomToken(firebaseAuth, firebase_token);
        }
      } catch (firebaseError) {
        console.warn('⚠️ Firebase login failed:', firebaseError.message);
      }
    }
    
    return { token, user };
  } catch (error) {
    console.error('❌ Google login error:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Login with Apple
 */
export const loginWithApple = async () => {
  try {
    // This would integrate with Firebase Apple Auth
    // For now, we'll call the backend endpoint
    const response = await api.post('/auth/login/apple');
    
    const { token, firebase_token, user } = response.data;
    
    // Store auth data
    setAuthData(token, user);
    
    // Sign into Firebase if token provided
    if (firebase_token) {
      try {
        const firebaseAuth = getFirebaseAuth();
        if (firebaseAuth) {
          await signInWithCustomToken(firebaseAuth, firebase_token);
        }
      } catch (firebaseError) {
        console.warn('⚠️ Firebase login failed:', firebaseError.message);
      }
    }
    
    return { token, user };
  } catch (error) {
    console.error('❌ Apple login error:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Register new user (Laravel + Firebase)
 */
export const register = async (userData) => {
  try {
    // 1. Register via Laravel API (creates both MySQL + Firebase user)
    const response = await api.post('/auth/register', {
      name: userData.name,
      username: userData.username,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      password_confirmation: userData.password, // Laravel requires this
      role: userData.role || 'parent',
    });
    
    const { token, firebase_token, user } = response.data;
    
    // 2. Store Laravel Sanctum token
    setAuthData(token, user);
    
    // 3. Sign into Firebase with custom token
    if (firebase_token) {
      try {
        const firebaseAuth = getFirebaseAuth();
        if (firebaseAuth) {
          await signInWithCustomToken(firebaseAuth, firebase_token);
          console.log('✅ Signed into Firebase with custom token');
        }
      } catch (firebaseError) {
        console.warn('⚠️ Firebase login failed (non-critical):', firebaseError.message);
      }
    }
    
    return { token, user };
  } catch (error) {
    console.error('❌ Registration error:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Register with Google
 */
export const registerWithGoogle = async (additionalData = {}) => {
  try {
    const response = await api.post('/auth/register/google', additionalData);
    
    const { token, firebase_token, user } = response.data;
    
    // Store auth data
    setAuthData(token, user);
    
    // Sign into Firebase if token provided
    if (firebase_token) {
      try {
        const firebaseAuth = getFirebaseAuth();
        if (firebaseAuth) {
          await signInWithCustomToken(firebaseAuth, firebase_token);
        }
      } catch (firebaseError) {
        console.warn('⚠️ Firebase login failed:', firebaseError.message);
      }
    }
    
    return { token, user };
  } catch (error) {
    console.error('❌ Google registration error:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Register with Apple
 */
export const registerWithApple = async (additionalData = {}) => {
  try {
    const response = await api.post('/auth/register/apple', additionalData);
    
    const { token, firebase_token, user } = response.data;
    
    // Store auth data
    setAuthData(token, user);
    
    // Sign into Firebase if token provided
    if (firebase_token) {
      try {
        const firebaseAuth = getFirebaseAuth();
        if (firebaseAuth) {
          await signInWithCustomToken(firebaseAuth, firebase_token);
        }
      } catch (firebaseError) {
        console.warn('⚠️ Firebase login failed:', firebaseError.message);
      }
    }
    
    return { token, user };
  } catch (error) {
    console.error('❌ Apple registration error:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Logout user (Laravel + Firebase)
 */
export const logout = async () => {
  try {
    // Logout from Laravel
    try {
      await api.post('/auth/logout');
    } catch (apiError) {
      console.warn('⚠️ Backend logout failed:', apiError.message);
    }
    
    // Logout from Firebase
    try {
      const firebaseAuth = getFirebaseAuth();
      if (firebaseAuth) {
        await firebaseSignOut(firebaseAuth);
      }
    } catch (firebaseError) {
      console.warn('⚠️ Firebase logout failed:', firebaseError.message);
    }
    
    // Clear local auth data (always do this)
    clearAuthData();
    
    return true;
  } catch (error) {
    console.error('❌ Logout error:', error);
    // Clear data anyway
    clearAuthData();
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get current user profile
 */
export const getProfile = async () => {
  try {
    const response = await api.get('/auth/profile');
    
    const { user } = response.data;
    
    // Update stored user data
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  } catch (error) {
    console.error('❌ Get profile error:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get profile with Firebase token
 */
export const getProfileWithToken = async (firebaseToken) => {
  try {
    const response = await api.get('/auth/profile', {
      headers: {
        'X-Firebase-Token': firebaseToken
      }
    });
    
    const { user } = response.data;
    
    // Update stored user data
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  } catch (error) {
    console.error('❌ Get profile with token error:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/auth/profile', profileData);
    
    const { user } = response.data;
    
    // Update stored user data
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  } catch (error) {
    console.error('❌ Update profile error:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Elevate user role (for sensitive operations)
 * Requires secret code + password
 */
export const elevateRole = async (secretCode, password, targetRole) => {
  try {
    const response = await api.post('/auth/elevate-role', {
      secretCode: secretCode,
      password,
      targetRole: targetRole,
    });
    
    const { token, user } = response.data;
    
    // Update auth data with new role
    setAuthData(token, user);
    
    return { token, user };
  } catch (error) {
    console.error('❌ Role elevation error:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Change password
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPassword,
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Change password error:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email) => {
  try {
    const response = await api.post('/auth/password/reset-request', { email });
    return response.data;
  } catch (error) {
    console.error('❌ Password reset request error:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (token, email, password) => {
  try {
    const response = await api.post('/auth/password/reset', {
      token,
      email,
      password,
      password_confirmation: password,
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Password reset error:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Verify email
 */
export const verifyEmail = async (token) => {
  try {
    const response = await api.post('/auth/email/verify', { token });
    return response.data;
  } catch (error) {
    console.error('❌ Email verification error:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('auth_token');
};

/**
 * Get current user from localStorage
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Check if user has specific role
 */
export const hasRole = (roles) => {
  const user = getCurrentUser();
  if (!user) return false;
  
  const rolesArray = Array.isArray(roles) ? roles : [roles];
  return rolesArray.includes(user.role);
};

/**
 * Export all auth functions
 */
export default {
  login,
  loginWithGoogle,
  loginWithApple,
  register,
  registerWithGoogle,
  registerWithApple,
  logout,
  getProfile,
  getProfileWithToken,
  updateProfile,
  elevateRole,
  changePassword,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  isAuthenticated,
  getCurrentUser,
  hasRole,
};