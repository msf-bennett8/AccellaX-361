// src/services/stravaOAuthService.js
// Strava OAuth authentication service (Browser-based for all platforms)

import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import Constants from 'expo-constants';
import { signInWithCustomToken } from 'firebase/auth';

// Enable web browser for authentication
WebBrowser.maybeCompleteAuthSession();

// Pending auth state management
let pendingAuthResolve = null;
let pendingAuthReject = null;

/**
 * Complete pending OAuth from deep link
 */
export const completePendingAuth = (code, error) => {
  if (pendingAuthResolve) {
    if (error) {
      pendingAuthReject(new Error(error));
    } else {
      pendingAuthResolve(code);
    }
    pendingAuthResolve = null;
    pendingAuthReject = null;
  }
};

/**
 * Sign in with Strava (Login - must have existing account)
 */
export const signInWithStrava = async () => {
  return await stravaOAuth(false); // false = login only
};

/**
 * Sign up with Strava (Register - create new account)
 */
export const signUpWithStrava = async () => {
  return await stravaOAuth(true); // true = allow registration
};

/**
 * Strava OAuth (Browser-based)
 */
const stravaOAuth = async (allowRegistration = false) => {
  try {
    console.log('🔐 Starting Strava OAuth...');

    const clientId = Constants.expoConfig?.extra?.stravaClientId;
    const backendUrl = Constants.expoConfig?.extra?.oauthBackendUrl;
    
    if (!clientId) {
      return { 
        success: false, 
        error: 'Strava not configured. Please contact support.' 
      };
    }

    if (!backendUrl) {
      return {
        success: false,
        error: 'OAuth backend not configured. Please update your .env file.'
      };
    }

    // Use backend callback for all platforms
    const redirectUri = `${backendUrl}/api/callback`;

    console.log('📍 Redirect URI:', redirectUri);

    // Build Strava authorization URL
    const authUrl = `https://www.strava.com/oauth/mobile/authorize?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&approval_prompt=auto` +
      `&scope=read,activity:read`;

    console.log('🔗 Opening Strava authorization in browser...');

    // Create promise that will be resolved by deep link handler
    const codePromise = new Promise((resolve, reject) => {
      pendingAuthResolve = resolve;
      pendingAuthReject = reject;
      
      // Timeout after 5 minutes
      setTimeout(() => {
        if (pendingAuthResolve) {
          reject(new Error('Authentication timeout'));
          pendingAuthResolve = null;
          pendingAuthReject = null;
        }
      }, 300000);
    });

    // Open browser (don't await it - it will return 'dismiss')
    WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    // Wait for deep link to resolve the promise
    console.log('⏳ Waiting for authentication...');
    const code = await codePromise;
    console.log('✅ Authorization code received from deep link');

    // Exchange code for access token via backend
    console.log('🔄 Exchanging code for token via backend...');
    const tokenResponse = await fetch(`${backendUrl}/api/oauth/strava`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      throw new Error(errorData.error || 'Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Access token received');

    // Sign in to Firebase with custom token
    if (tokenData.firebase_token) {
      await signInWithCustomToken(auth, tokenData.firebase_token);
      console.log('✅ Signed in to Firebase');
    }

    // Get athlete data
    const athlete = tokenData.athlete;

    if (!athlete) {
      throw new Error('No athlete data received');
    }

    // Create user ID
    const userId = `strava_${athlete.id}`;
    const email = `${athlete.id}@strava.athlete.local`; // Strava doesn't provide email

    // Check if user exists
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // User doesn't exist
      if (!allowRegistration) {
        // This is a login attempt, but account doesn't exist
        return {
          success: false,
          error: 'No account found. Please sign up first.',
          needsRegistration: true,
        };
      }

      // This is registration - create new account
      console.log('📝 Creating new Strava user profile...');
      return await createStravaUser(userId, email, athlete, tokenData);
    } else {
      // User exists
      if (allowRegistration) {
        // This is a sign-up attempt, but account already exists
        return {
          success: false,
          error: 'Account already exists. Please sign in instead.',
          accountExists: true,
        };
      }

      // This is login - update tokens and last login
      console.log('🔄 Logging in existing Strava user...');
      return await loginStravaUser(userId, tokenData);
    }

  } catch (error) {
    console.error('❌ Strava OAuth error:', error);
    // Clean up pending state
    pendingAuthResolve = null;
    pendingAuthReject = null;
    return { 
      success: false, 
      error: error.message || 'Failed to authenticate with Strava' 
    };
  }
};

/**
 * Create new Strava user
 */
const createStravaUser = async (userId, email, athlete, tokenData) => {
  try {
    const userRef = doc(db, 'users', userId);

    const userProfile = {
      id: userId,
      full_name: `${athlete.firstname} ${athlete.lastname}`,
      email: email,
      username: athlete.username || '',
      phone: '',
      auth_method: 'strava',
      role: 'coach',
      avatar_base64: athlete.profile || null,
      strava_id: athlete.id.toString(),
      strava_access_token: tokenData.access_token,
      strava_refresh_token: tokenData.refresh_token,
      strava_expires_at: tokenData.expires_at,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
      last_login_at: Timestamp.now(),
    };

    await setDoc(userRef, userProfile);
    console.log('✅ Strava user profile created');

    return {
      success: true,
      isNewUser: true,
      userId: userId,
      userProfile: {
        userId: userId,
        fullName: userProfile.full_name,
        email: userProfile.email,
        username: userProfile.username || '',
        phone: userProfile.phone || '',
        authMethod: 'strava',
        role: userProfile.role || 'coach',
        avatarBase64: userProfile.avatar_base64 || null,
        stravaId: userProfile.strava_id,
        createdAt: userProfile.created_at?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        firebaseSynced: true,
        isOfflineAccount: false,
      },
    };

  } catch (error) {
    console.error('❌ Error creating Strava user:', error);
    throw error;
  }
};

/**
 * Login existing Strava user
 */
const loginStravaUser = async (userId, tokenData) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User profile not found');
    }

    const userProfile = userSnap.data();

    // Update tokens and last login
    await setDoc(userRef, {
      strava_access_token: tokenData.access_token,
      strava_refresh_token: tokenData.refresh_token,
      strava_expires_at: tokenData.expires_at,
      last_login_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    }, { merge: true });

    return {
      success: true,
      isNewUser: false,
      userId: userId,
      userProfile: {
        userId: userId,
        fullName: userProfile.full_name,
        email: userProfile.email,
        username: userProfile.username || '',
        phone: userProfile.phone || '',
        authMethod: 'strava',
        role: userProfile.role || 'coach',
        avatarBase64: userProfile.avatar_base64 || null,
        stravaId: userProfile.strava_id,
        createdAt: userProfile.created_at?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        firebaseSynced: true,
        isOfflineAccount: false,
      },
    };

  } catch (error) {
    console.error('❌ Error logging in Strava user:', error);
    throw error;
  }
};

export default {
  signInWithStrava,
  signUpWithStrava,
};
