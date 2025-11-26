//src/utils/auth.js
// src/utils/auth.js
// Authentication utilities for AccellaX 361° with Firebase Integration

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// ========== USER ID GENERATION ==========

/**
 * Generate unique user ID
 * Format: user_<timestamp>_<random>
 */
export const generateUserId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `user_${timestamp}_${random}`;
};

/**
 * Generate offline user ID (temporary until online sync)
 * Format: offline_<timestamp>_<random>
 */
export const generateOfflineUserId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `offline_${timestamp}_${random}`;
};

// ========== PASSWORD UTILITIES ==========

/**
 * Hash password using SHA-256 (cross-platform compatible)
 */
export const hashPassword = async (password) => {
  try {
    // Use SHA-256 hashing (works on web, iOS, and Android)
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password
    );
    return hash;
  } catch (error) {
    console.error('Error hashing password:', error);
    // Fallback to simple base64 if crypto fails
    return btoa(password);
  }
};

/**
 * Verify password against hash
 */
export const verifyPassword = async (password, hash) => {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
};

/**
 * Validate password strength
 * Requirements: Min 8 characters
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ========== EMAIL VALIDATION ==========

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ========== USERNAME VALIDATION ==========

/**
 * Validate username format
 * Requirements: 3-20 chars, alphanumeric + underscore
 */
export const validateUsername = (username) => {
  if (!username || username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (username.length > 20) {
    return { isValid: false, error: 'Username must be less than 20 characters' };
  }
  
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  
  return { isValid: true };
};

// ========== USER PROFILE MANAGEMENT ==========

/**
 * Save user profile to AsyncStorage
 */
export const saveUserProfile = async (userProfile) => {
  try {
    await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));
    await AsyncStorage.setItem('currentUserId', userProfile.userId);
    return { success: true };
  } catch (error) {
    console.error('Error saving user profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async () => {
  try {
    const profileJson = await AsyncStorage.getItem('userProfile');
    if (!profileJson) return null;
    
    const profile = JSON.parse(profileJson);
    
    // Ensure role exists (default to coach if missing)
    if (!profile.role) {
      profile.role = 'coach';
      await saveUserProfile(profile); // Save with default role
    }
    
    return profile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Get current user ID
 */
export const getCurrentUserId = async () => {
  try {
    return await AsyncStorage.getItem('currentUserId');
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

/**
 * Get current user role (admin or coach)
 */
export const getUserRole = async () => {
  try {
    const userProfile = await getCurrentUser();
    if (!userProfile) return 'coach'; // Default to coach if no profile
    
    // Check if user has admin role stored in profile
    return userProfile.role || 'coach'; // Default to 'coach'
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'coach';
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (updates) => {
  try {
    const currentProfile = await getCurrentUser();
    if (!currentProfile) {
      return { success: false, error: 'No user profile found' };
    }
    
    const updatedProfile = {
      ...currentProfile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    // Save to AsyncStorage
    const saveResult = await saveUserProfile(updatedProfile);
    
    if (!saveResult.success) {
      return saveResult;
    }
    
    // If role was updated, also update in database
    if (updates.role) {
      try {
        const { updateUser } = await import('../database/db');
        await updateUser(currentProfile.userId, { role: updates.role });
        console.log('✅ Role updated in database:', updates.role);
      } catch (dbError) {
        console.warn('⚠️ Failed to update role in database:', dbError);
        // Don't fail the whole operation if DB update fails
      }
      
      // Also update in Firestore if online
      try {
        const { doc, updateDoc, Timestamp } = await import('firebase/firestore');
        const { db } = await import('../config/firebase');
        
        const userRef = doc(db, 'users', currentProfile.userId);
        await updateDoc(userRef, {
          role: updates.role,
          updated_at: Timestamp.now(),
        });
        console.log('✅ Role updated in Firestore:', updates.role);
      } catch (firestoreError) {
        console.warn('⚠️ Failed to update role in Firestore:', firestoreError);
        // Don't fail if offline
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete user profile (logout)
 */
export const deleteUserProfile = async () => {
  try {
    // Only clear auth-related data, NOT onboarding or academy settings
    await AsyncStorage.removeItem('userProfile');
    await AsyncStorage.removeItem('currentUserId');
    // DO NOT remove 'onboardingComplete' or 'academyName'
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting user profile:', error);
    return { success: false, error: error.message };
  }
};

// ========== FIREBASE HELPERS ==========

/**
 * Check if online and Firebase is available
 */
const isFirebaseAvailable = () => {
  try {
    return auth && db && (Platform.OS === 'web' ? navigator.onLine : true);
  } catch (error) {
    return false;
  }
};

/**
 * Save user profile to Firebase Firestore
 */
const saveUserProfileToFirebase = async (userId, userProfile) => {
  try {
    // Get academyId from AsyncStorage
    const academyId = await AsyncStorage.getItem('academyId') || 'academy_accellax361_main';
    
    const userRef = doc(db, 'users', userId);
    
    await setDoc(userRef, {
      id: userId,
      full_name: userProfile.fullName,
      email: userProfile.email,
      username: userProfile.username || '',
      phone: userProfile.phone || '',
      auth_method: userProfile.authMethod || 'accellax',
      role: userProfile.role || 'coach',
      academyId: academyId,
      avatar_base64: userProfile.avatarBase64 || null,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
      last_login_at: Timestamp.now(),
    });
    
    console.log('✅ User profile saved to Firebase with academyId:', academyId);
    
    console.log('✅ User profile saved to Firebase');
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving user profile to Firebase:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user profile from Firebase Firestore
 */
const getUserProfileFromFirebase = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { success: false, error: 'User not found' };
    }
    
    return { success: true, data: userSnap.data() };
  } catch (error) {
    console.error('❌ Error getting user profile from Firebase:', error);
    return { success: false, error: error.message };
  }
};

// ========== REGISTRATION ==========

/**
 * Register new user with Firebase Authentication + Firestore
 */
export const registerUser = async (userData) => {
  try {
    console.log('📝 Starting user registration...');
    
    // Validate inputs
    if (!userData.fullName || !userData.email || !userData.password) {
      return { success: false, error: 'Missing required fields' };
    }
    
    // Validate email
    if (!validateEmail(userData.email)) {
      return { success: false, error: 'Invalid email format' };
    }
    
    // Validate username if provided
    if (userData.username) {
      const usernameValidation = validateUsername(userData.username);
      if (!usernameValidation.isValid) {
        return { success: false, error: usernameValidation.error };
      }
    }
    
    // Validate password
    const passwordValidation = validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      return { success: false, error: passwordValidation.errors[0] };
    }
    
    // Hash password for local storage
    const hashedPassword = await hashPassword(userData.password);
    
    let userId;
    let firebaseSynced = false;
    
    // Try Firebase Authentication first
    if (isFirebaseAvailable()) {
      try {
        console.log('🔐 Creating Firebase account...');
        
        // Create Firebase Auth account
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          userData.email,
          userData.password
        );
        
        userId = userCredential.user.uid;
        firebaseSynced = true;
        
        console.log('✅ Firebase account created:', userId);
        
        // Create user profile
        const userProfile = {
          userId,
          fullName: userData.fullName,
          email: userData.email,
          username: userData.username || '',
          phone: userData.phone || '',
          authMethod: userData.authMethod || 'accellax',
          role: userData.role || 'coach',
          passwordHash: hashedPassword,
          avatarBase64: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          firebaseSynced: false,
          isOfflineAccount: true,
        };
        
        // Save to Firestore
        await saveUserProfileToFirebase(userId, userProfile);
        
        // Save to local storage
        await saveUserProfile(userProfile);
        
        console.log('✅ User registered successfully with Firebase');
        
        return { 
          success: true, 
          userId,
          userProfile: {
            ...userProfile,
            passwordHash: undefined, // Don't return password hash
          },
        };
        
      } catch (firebaseError) {
        console.warn('⚠️ Firebase registration failed, falling back to offline mode:', firebaseError.message);
        
        // Check if error is due to email already in use
        if (firebaseError.code === 'auth/email-already-in-use') {
          return { success: false, error: 'Email already in use. Please login instead.' };
        }
        
        // Fall through to offline mode
      }
    }
    
    // Offline mode fallback
    console.log('📴 Registering in offline mode...');
    userId = generateOfflineUserId();
    
    // Create user profile
    const userProfile = {
      userId,
      fullName: userData.fullName,
      email: userData.email,
      username: userData.username || '',
      phone: userData.phone || '',
      authMethod: userData.authMethod || 'accellax',
      role: userData.role || 'coach',
      passwordHash: hashedPassword,
      avatarBase64: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      firebaseSynced: false,
      isOfflineAccount: true,
    };
    
    // Save profile locally
    const saveResult = await saveUserProfile(userProfile);
    
    if (saveResult.success) {
      console.log('✅ User registered in offline mode');
      return { 
        success: true, 
        userId,
        userProfile: {
          ...userProfile,
          passwordHash: undefined,
        },
      };
    } else {
      return saveResult;
    }
    
  } catch (error) {
    console.error('❌ Error registering user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Register user with Google
 */
export const registerWithGoogle = async (googleUserData) => {
  try {
    // Generate user ID
    const userId = generateUserId();
    
    // Create user profile
    const userProfile = {
      userId,
      fullName: googleUserData.fullName || googleUserData.name,
      email: googleUserData.email,
      username: googleUserData.username || '',
      phone: googleUserData.phone || '',
      authMethod: 'google',
      role: googleUserData.role || 'coach',
      googleId: googleUserData.googleId || googleUserData.id,
      avatarBase64: googleUserData.photoUrl || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      firebaseSynced: false,
      isOfflineAccount: false,
    };
    
    // Try to save to Firebase if available
    if (isFirebaseAvailable()) {
      await saveUserProfileToFirebase(userId, userProfile);
      userProfile.firebaseSynced = true;
    }
    
    // Save profile locally
    const saveResult = await saveUserProfile(userProfile);
    
    if (saveResult.success) {
      return { success: true, userId, userProfile };
    } else {
      return saveResult;
    }
    
  } catch (error) {
    console.error('Error registering with Google:', error);
    return { success: false, error: error.message };
  }
};

// ========== LOGIN ==========

/**
 * Login user with email and password (Firebase Auth + fallback to local)
 */
export const loginUser = async (email, password) => {
  try {
    console.log('🔐 Attempting login...');
    
    // Try Firebase Authentication first
    if (isFirebaseAvailable()) {
      try {
        console.log('🔥 Logging in with Firebase...');
        
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        
        const userId = userCredential.user.uid;
        console.log('✅ Firebase login successful:', userId);
        
        // Get user profile from Firestore
        const profileResult = await getUserProfileFromFirebase(userId);
        
        if (profileResult.success) {
          const firebaseProfile = profileResult.data;
          
         // Create local profile from Firebase data
          const userProfile = {
            userId,
            fullName: firebaseProfile.full_name,
            email: firebaseProfile.email,
            username: firebaseProfile.username || '',
            phone: firebaseProfile.phone || '',
            authMethod: firebaseProfile.auth_method || 'accellax',
            role: firebaseProfile.role || 'coach',
            academyId: firebaseProfile.academyId || 'academy_accellax361_main',
            avatarBase64: firebaseProfile.avatar_base64 || null,
            createdAt: firebaseProfile.created_at?.toDate().toISOString() || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            firebaseSynced: true,
            isOfflineAccount: false,
          };
          
          // Update last login in Firestore
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            last_login_at: Timestamp.now(),
            updated_at: Timestamp.now(),
          });
          
          // Save to local storage
          await saveUserProfile(userProfile);
          
          return { 
            success: true, 
            userId,
            userProfile,
          };
        }
        
      } catch (firebaseError) {
        console.warn('⚠️ Firebase login failed:', firebaseError.message);
        
        // Check if it's a "user not found" error - might be an offline account
        if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/invalid-credential') {
          console.log('🔍 User not found in Firebase, checking for offline account...');
          
          // Try to find offline account locally
          console.log('🔍 Attempting to get local user...');
          const profileJson = await AsyncStorage.getItem('userProfile');
          console.log('📦 Raw profile from AsyncStorage:', profileJson ? profileJson.substring(0, 100) + '...' : 'null');
          
          const localUser = await getCurrentUser();
          console.log('👤 Local user from getCurrentUser():', localUser ? {
            userId: localUser.userId,
            email: localUser.email,
            isOfflineAccount: localUser.isOfflineAccount
          } : 'null');
          
          if (localUser && localUser.email.toLowerCase() === email.toLowerCase() && localUser.isOfflineAccount) {
            console.log('📴 Found offline account, attempting migration...');
            
            // Verify password matches
            const isPasswordValid = await verifyPassword(password, localUser.passwordHash);
            
            if (isPasswordValid) {
              // Try to create Firebase account with the same credentials
              try {
                console.log('🔐 Creating Firebase account for offline user...');
                
                const userCredential = await createUserWithEmailAndPassword(
                  auth,
                  email,
                  password
                );
                
                const firebaseUserId = userCredential.user.uid;
                console.log('✅ Firebase account created during login:', firebaseUserId);
                
                // Update local profile with Firebase UID
                const updatedProfile = {
                  ...localUser,
                  userId: firebaseUserId,
                  isOfflineAccount: false,
                  firebaseSynced: true,
                  migratedAt: new Date().toISOString(),
                  lastLoginAt: new Date().toISOString(),
                };
                
                await saveUserProfile(updatedProfile);
                
                // Upload profile to Firestore
                const userRef = doc(db, 'users', firebaseUserId);
                await setDoc(userRef, {
                  id: firebaseUserId,
                  full_name: localUser.fullName,
                  email: localUser.email,
                  username: localUser.username || '',
                  phone: localUser.phone || '',
                  auth_method: localUser.authMethod || 'accellax',
                  avatar_base64: localUser.avatarBase64 || null,
                  created_at: Timestamp.fromDate(new Date(localUser.createdAt)),
                  updated_at: Timestamp.now(),
                  last_login_at: Timestamp.now(),
                  migrated_from_offline: true,
                });
                
                console.log('✅ Offline account successfully migrated to Firebase');
                
                return {
                  success: true,
                  userId: firebaseUserId,
                  userProfile: updatedProfile,
                  migrated: true,
                };
                
              } catch (migrationError) {
                console.error('❌ Failed to migrate offline account:', migrationError);
                
                // If migration fails, still allow local login
                await updateUserProfile({
                  lastLoginAt: new Date().toISOString(),
                });
                
                return {
                  success: true,
                  userId: localUser.userId,
                  userProfile: localUser,
                  warning: 'Logged in locally. Account migration will be attempted later.',
                };
              }
            }
          }
          
          // If no offline account found, return error
          return { success: false, error: 'Invalid email or password' };
        }
        
        if (firebaseError.code === 'auth/wrong-password') {
          return { success: false, error: 'Invalid email or password' };
        }
        if (firebaseError.code === 'auth/too-many-requests') {
          return { success: false, error: 'Too many failed attempts. Please try again later.' };
        }
        
        // Fall through to local authentication for other errors
      }
    }
    
    // Local authentication fallback
    console.log('📴 Attempting local login...');
    
    const userProfile = await getCurrentUser();
    
    if (!userProfile) {
      return { success: false, error: 'No account found. Please register first.' };
    }
    
    // Check email match
    if (userProfile.email.toLowerCase() !== email.toLowerCase()) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(password, userProfile.passwordHash);
    
    if (!isPasswordValid) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    // Update last login time
    await updateUserProfile({
      lastLoginAt: new Date().toISOString(),
    });
    
    console.log('✅ Local login successful');
    
    return { 
      success: true, 
      userId: userProfile.userId,
      userProfile: {
        ...userProfile,
        passwordHash: undefined,
      },
    };
    
  } catch (error) {
    console.error('❌ Error logging in:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if user is logged in
 */
export const isUserLoggedIn = async () => {
  const user = await getCurrentUser();
  return user !== null;
};

/**
 * Logout user (Firebase + local)
 */
export const logoutUser = async () => {
  try {
    // Sign out from Firebase if available
    if (isFirebaseAvailable() && auth.currentUser) {
      await signOut(auth);
      console.log('✅ Signed out from Firebase');
    }
    
    // Clear local storage
    return await deleteUserProfile();
  } catch (error) {
    console.error('❌ Error logging out:', error);
    return { success: false, error: error.message };
  }
};

// ========== ACCOUNT MIGRATION ==========

/**
 * Migrate offline account to online (when Firebase sync happens)
 */
export const migrateToOnlineAccount = async (firebaseUserId) => {
  try {
    const currentProfile = await getCurrentUser();
    
    if (!currentProfile) {
      return { success: false, error: 'No user profile found' };
    }
    
    // Update user ID and sync status
    const updatedProfile = {
      ...currentProfile,
      userId: firebaseUserId,
      isOfflineAccount: false,
      firebaseSynced: true,
      migratedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await saveUserProfile(updatedProfile);
    
    return { success: true, newUserId: firebaseUserId };
    
  } catch (error) {
    console.error('Error migrating account:', error);
    return { success: false, error: error.message };
  }
};

// ========== FIREBASE AUTH STATE LISTENER ==========

/**
 * Listen to Firebase auth state changes
 */
export const setupAuthListener = (callback) => {
  if (!isFirebaseAvailable()) {
    console.log('⚠️ Firebase not available for auth listener');
    return () => {};
  }
  
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log('🔐 User authenticated:', user.uid);
      callback({ authenticated: true, userId: user.uid });
    } else {
      console.log('🔓 User not authenticated');
      callback({ authenticated: false, userId: null });
    }
  });
};

// ========== EXPORTS ==========

export default {
  generateUserId,
  generateOfflineUserId,
  hashPassword,
  verifyPassword,
  validatePassword,
  validateEmail,
  validateUsername,
  saveUserProfile,
  getCurrentUser,
  getCurrentUserId,
  getUserRole,
  updateUserProfile,
  deleteUserProfile,
  registerUser,
  registerWithGoogle,
  loginUser,
  isUserLoggedIn,
  logoutUser,
  migrateToOnlineAccount,
  setupAuthListener,
};