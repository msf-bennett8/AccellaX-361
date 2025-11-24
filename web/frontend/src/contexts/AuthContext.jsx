/**
 * File: web/frontend/src/contexts/AuthContext.jsx
 * AccellaX 361° - Authentication Context
 * 
 * Description:
 * Provides global authentication state and methods throughout the app.
 * Handles login, logout, user state, and role-based access control.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import authService from '@/services/authService';

// Create context with default values
const AuthContext = createContext({
  user: null,
  firebaseUser: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
  loginWithApple: async () => {},
  registerWithGoogle: async () => {},
  registerWithApple: async () => {},
  logout: async () => {},
  updateUserProfile: async () => {},
  elevateRole: async () => {},
  refreshUser: async () => {},
  hasRole: () => false,
  isAdmin: () => false,
  isCoach: () => false,
  isParent: () => false,
  isKid: () => false,
  isSponsor: () => false,
});

// Export the context itself (for direct imports)
export { AuthContext };

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);

  // Initialize auth state on mount
  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Initialize authentication
  // Initialize authentication
  const initializeAuth = () => {
    try {
      // Check if user is authenticated via localStorage/session
      if (authService.isAuthenticated()) {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
      }
      
      // Set loading to false immediately since we have the user from localStorage
      setLoading(false);

      // Listen to Firebase auth state changes (but don't block on it)
      const firebaseAuth = getAuth();
      const unsubscribe = onAuthStateChanged(firebaseAuth, (fbUser) => {
        setFirebaseUser(fbUser);
        
        // If Firebase user exists but no local user, sync them
        if (fbUser && !user) {
          syncFirebaseUser(fbUser);
        } else if (!fbUser && user) {
          // Firebase logged out but local user still exists - clear it
          setUser(null);
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Auth initialization error:', error);
      setLoading(false);
      return () => {};
    }
  };

  // Sync Firebase user with local user state
  const syncFirebaseUser = async (fbUser) => {
    try {
      // Get user profile from backend using Firebase token
      const token = await fbUser.getIdToken();
      const userProfile = await authService.getProfileWithToken(token);
      setUser(userProfile);
    } catch (error) {
      console.error('❌ Error syncing Firebase user:', error);
    }
  };

  // Login function (Email/Password or Phone/Password)
  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      return response;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  // Google Login
  const loginWithGoogle = async () => {
    try {
      const response = await authService.loginWithGoogle();
      setUser(response.user);
      return response;
    } catch (error) {
      console.error('❌ Google login error:', error);
      throw error;
    }
  };

  // Apple Login
  const loginWithApple = async () => {
    try {
      const response = await authService.loginWithApple();
      setUser(response.user);
      return response;
    } catch (error) {
      console.error('❌ Apple login error:', error);
      throw error;
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      setUser(response.user);
      return response;
    } catch (error) {
      console.error('❌ Register error:', error);
      throw error;
    }
  };

  // Google Registration
  const registerWithGoogle = async (additionalData = {}) => {
    try {
      const response = await authService.registerWithGoogle(additionalData);
      setUser(response.user);
      return response;
    } catch (error) {
      console.error('❌ Google registration error:', error);
      throw error;
    }
  };

  // Apple Registration
  const registerWithApple = async (additionalData = {}) => {
    try {
      const response = await authService.registerWithApple(additionalData);
      setUser(response.user);
      return response;
    } catch (error) {
      console.error('❌ Apple registration error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (profileData) => {
    try {
      const updatedUser = await authService.updateProfile(profileData);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('❌ Update profile error:', error);
      throw error;
    }
  };

  // Elevate user role
  const elevateRole = async (secretCode, password, targetRole) => {
    try {
      const response = await authService.elevateRole(secretCode, password, targetRole);
      setUser(response.user);
      return response;
    } catch (error) {
      console.error('❌ Role elevation error:', error);
      throw error;
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const updatedUser = await authService.getProfile();
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('❌ Refresh user error:', error);
      throw error;
    }
  };

  // Check if user has specific role(s)
  const hasRole = (roles) => {
    if (!user) return false;
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    return rolesArray.includes(user.role);
  };

  // Check if user is admin (Super Admin or Academy Owner)
  const isAdmin = () => {
    return hasRole(['super_admin', 'academy_owner', 'owner']);
  };

  // Check if user is coach (Head Coach or Coach)
  const isCoach = () => {
    return hasRole(['head_coach', 'coach']);
  };

  // Check if user is parent
  const isParent = () => {
    return hasRole(['parent']);
  };

  // Check if user is kid
  const isKid = () => {
    return hasRole(['kid']);
  };

  // Check if user is sponsor
  const isSponsor = () => {
    return hasRole(['sponsor']);
  };

  // Check if user is payment recorder
  const isPaymentRecorder = () => {
    return hasRole(['payment_recorder']);
  };

  // Context value
  const value = {
    user,
    firebaseUser,
    loading,
    isAuthenticated: !!user,
    login,
    loginWithGoogle,
    loginWithApple,
    register,
    registerWithGoogle,
    registerWithApple,
    logout,
    updateUserProfile,
    elevateRole,
    refreshUser,
    hasRole,
    isAdmin,
    isCoach,
    isParent,
    isKid,
    isSponsor,
    isPaymentRecorder,
  };

  return (
  <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Default export
export default AuthContext;