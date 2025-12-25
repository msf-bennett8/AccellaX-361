// src/services/oauthService.js
// OAuth service for Google and Strava authentication

import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import Constants from 'expo-constants';

// Enable web browser for authentication
WebBrowser.maybeCompleteAuthSession();

// ========== GOOGLE SIGN-IN ==========

/**
 * Configure Google Sign-In
 */
export const configureGoogleSignIn = () => {
  try {
    const webClientId = Constants.expoConfig?.extra?.googleWebClientId;
    
    if (!webClientId) {
      console.warn('⚠️ Google Web Client ID not configured');
      return false;
    }

    GoogleSignin.configure({
      webClientId: webClientId,
      offlineAccess: true,
    });

    console.log('✅ Google Sign-In configured');
    return true;
  } catch (error) {
    console.error('❌ Error configuring Google Sign-In:', error);
    return false;
  }
};

/**
 * Sign in with Google (Native)
 */
export const signInWithGoogle = async () => {
  try {
    console.log('🔐 Starting Google Sign-In...');

    // Check if device supports Google Play services
    await GoogleSignin.hasPlayServices();

    // Get user info
    const userInfo = await GoogleSignin.signIn();
    console.log('✅ Google user info obtained:', userInfo.user.email);

    // Get Google ID token
    const { idToken } = await GoogleSignin.getTokens();

    if (!idToken) {
      throw new Error('No ID token received from Google');
    }

    // Create Firebase credential
    const credential = GoogleAuthProvider.credential(idToken);

    // Sign in to Firebase
    const userCredential = await signInWithCredential(auth, credential);
    const firebaseUser = userCredential.user;

    console.log('✅ Firebase authentication successful:', firebaseUser.uid);

    // Check if user profile exists in Firestore
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    let userProfile;

    if (!userSnap.exists()) {
      // Create new user profile
      console.log('📝 Creating new user profile...');

      userProfile = {
        id: firebaseUser.uid,
        full_name: userInfo.user.name || firebaseUser.displayName || 'Google User',
        email: firebaseUser.email,
        username: '',
        phone: '',
        auth_method: 'google',
        role: 'coach',
        avatar_base64: userInfo.user.photo || firebaseUser.photoURL || null,
        google_id: userInfo.user.id,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
        last_login_at: Timestamp.now(),
      };

      await setDoc(userRef, userProfile);
      console.log('✅ User profile created in Firestore');
    } else {
      // Update existing user profile
      console.log('🔄 Updating existing user profile...');

      userProfile = userSnap.data();
      
      await setDoc(userRef, {
        ...userProfile,
        last_login_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      }, { merge: true });
    }

    return {
      success: true,
      userId: firebaseUser.uid,
      userProfile: {
        userId: firebaseUser.uid,
        fullName: userProfile.full_name,
        email: userProfile.email,
        username: userProfile.username || '',
        phone: userProfile.phone || '',
        authMethod: 'google',
        role: userProfile.role || 'coach',
        avatarBase64: userProfile.avatar_base64 || null,
        googleId: userProfile.google_id,
        createdAt: userProfile.created_at?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        firebaseSynced: true,
        isOfflineAccount: false,
      },
    };

  } catch (error) {
    console.error('❌ Google Sign-In error:', error);
    
    if (error.code === 'SIGN_IN_CANCELLED') {
      return { success: false, error: 'Sign-in was cancelled', cancelled: true };
    }
    
    if (error.code === 'IN_PROGRESS') {
      return { success: false, error: 'Sign-in is already in progress' };
    }
    
    if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      return { success: false, error: 'Google Play Services not available' };
    }

    return { 
      success: false, 
      error: error.message || 'Failed to sign in with Google' 
    };
  }
};

/**
 * Sign out from Google
 */
export const signOutFromGoogle = async () => {
  try {
    await GoogleSignin.revokeAccess();
    await GoogleSignin.signOut();
    console.log('✅ Signed out from Google');
    return { success: true };
  } catch (error) {
    console.error('❌ Error signing out from Google:', error);
    return { success: false, error: error.message };
  }
};

// ========== STRAVA OAUTH ==========

/**
 * Get Strava OAuth configuration
 */
const getStravaConfig = () => {
  const clientId = Constants.expoConfig?.extra?.stravaClientId;
  const clientSecret = Constants.expoConfig?.extra?.stravaClientSecret;
  
  if (!clientId || !clientSecret) {
    console.warn('⚠️ Strava credentials not configured');
    return null;
  }

  return {
    clientId,
    clientSecret,
    redirectUri: AuthSession.makeRedirectUri({
      scheme: 'accellax361',
      path: 'redirect',
    }),
  };
};

/**
 * Sign in with Strava
 */
export const signInWithStrava = async () => {
  try {
    console.log('🔐 Starting Strava OAuth...');

    const config = getStravaConfig();
    if (!config) {
      return { 
        success: false, 
        error: 'Strava not configured. Please contact support.' 
      };
    }

    console.log('📍 Redirect URI:', config.redirectUri);

    // Strava OAuth endpoints
    const discovery = {
      authorizationEndpoint: 'https://www.strava.com/oauth/mobile/authorize',
      tokenEndpoint: 'https://www.strava.com/oauth/token',
    };

    // Create auth request
    const [request, response, promptAsync] = AuthSession.useAuthRequest(
      {
        clientId: config.clientId,
        scopes: ['read', 'activity:read'],
        redirectUri: config.redirectUri,
        responseType: AuthSession.ResponseType.Code,
      },
      discovery
    );

    if (!request) {
      return { success: false, error: 'Failed to create auth request' };
    }

    // Prompt user for authorization
    const result = await promptAsync();

    if (result.type === 'cancel') {
      return { success: false, error: 'Authorization cancelled', cancelled: true };
    }

    if (result.type !== 'success') {
      return { success: false, error: 'Authorization failed' };
    }

    const { code } = result.params;

    if (!code) {
      return { success: false, error: 'No authorization code received' };
    }

    console.log('✅ Authorization code received');

    // Exchange code for access token
    const tokenResponse = await fetch(discovery.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: code,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Access token received');

    // Get athlete data
    const athlete = tokenData.athlete;

    if (!athlete) {
      throw new Error('No athlete data received');
    }

    // Create user in Firebase (using email as identifier)
    const email = `${athlete.id}@strava.athlete.local`; // Strava doesn't provide email
    const userId = `strava_${athlete.id}`;

    // Check if user exists
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    let userProfile;

    if (!userSnap.exists()) {
      console.log('📝 Creating new Strava user profile...');

      userProfile = {
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
    } else {
      console.log('🔄 Updating Strava user profile...');

      userProfile = userSnap.data();

      await setDoc(userRef, {
        ...userProfile,
        strava_access_token: tokenData.access_token,
        strava_refresh_token: tokenData.refresh_token,
        strava_expires_at: tokenData.expires_at,
        last_login_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      }, { merge: true });
    }

    return {
      success: true,
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
    console.error('❌ Strava OAuth error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to sign in with Strava' 
    };
  }
};

/**
 * Refresh Strava access token
 */
export const refreshStravaToken = async (refreshToken) => {
  try {
    const config = getStravaConfig();
    if (!config) return null;

    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error refreshing Strava token:', error);
    return null;
  }
};

// ========== EXPORTS ==========

export default {
  configureGoogleSignIn,
  signInWithGoogle,
  signOutFromGoogle,
  signInWithStrava,
  refreshStravaToken,
};
