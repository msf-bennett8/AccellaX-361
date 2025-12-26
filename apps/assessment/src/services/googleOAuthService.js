// src/services/googleOAuthService.js
// Google OAuth authentication service (Web & Mobile compatible)

import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import Constants from 'expo-constants';

// Required for web browser authentication
WebBrowser.maybeCompleteAuthSession();

/**
 * Configure Google Sign-In (no-op for web)
 */
export const configureGoogleSignIn = () => {
  console.log('✅ Google Sign-In ready for', Platform.OS);
  return true;
};

/**
 * Sign in with Google (Login - must have existing account)
 */
export const signInWithGoogle = async () => {
  try {
    console.log('🔐 Starting Google Sign-In (Login)...');

    if (Platform.OS === 'web') {
      return await signInWithGoogleWeb(false); // false = login only
    } else {
      return await signInWithGoogleBrowser(false); // Use browser for mobile
    }

  } catch (error) {
    console.error('❌ Google Sign-In error:', error);
    
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled') {
      return { success: false, error: 'Sign-in was cancelled', cancelled: true };
    }

    return { 
      success: false, 
      error: error.message || 'Failed to sign in with Google' 
    };
  }
};

/**
 * Sign up with Google (Register - create new account)
 */
export const signUpWithGoogle = async () => {
  try {
    console.log('🔐 Starting Google Sign-Up (Register)...');

    if (Platform.OS === 'web') {
      return await signInWithGoogleWeb(true); // true = allow registration
    } else {
      return await signInWithGoogleBrowser(true); // Use browser for mobile
    }

  } catch (error) {
    console.error('❌ Google Sign-Up error:', error);
    
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled') {
      return { success: false, error: 'Sign-up was cancelled', cancelled: true };
    }

    return { 
      success: false, 
      error: error.message || 'Failed to sign up with Google' 
    };
  }
};

/**
 * Google Sign-In for Web (Firebase Popup)
 */
const signInWithGoogleWeb = async (allowRegistration = false) => {
  try {
    console.log('🌐 Using web popup authentication...');

    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    // Sign in with popup
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;

    console.log('✅ Firebase authentication successful:', firebaseUser.uid);

    // Check if user exists
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // User doesn't exist
      if (!allowRegistration) {
        // This is a login attempt, but account doesn't exist
        await auth.signOut(); // Sign out the Firebase user
        return {
          success: false,
          error: 'No account found. Please sign up first.',
          needsRegistration: true,
        };
      }

      // This is registration - create new account
      console.log('📝 Creating new user account...');
      
      const userInfo = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        photo: firebaseUser.photoURL,
      };

      return await createGoogleUser(firebaseUser, userInfo);
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

      // This is login - update last login
      console.log('🔄 Logging in existing user...');
      return await loginGoogleUser(firebaseUser);
    }

  } catch (error) {
    console.error('❌ Web authentication error:', error);
    throw error;
  }
};

/**
 * Google Sign-In using Browser (Mobile & Web)
 */
const signInWithGoogleBrowser = async (allowRegistration = false) => {
  try {
    console.log('🌐 Opening browser for Google authentication...');

   /* Platform based auth
    // Get appropriate client ID based on platform
    let clientId;
    if (Platform.OS === 'android') {
      clientId = Constants.expoConfig?.extra?.googleAndroidClientId;
      if (!clientId) {
        console.warn('⚠️ Android Client ID not found, using Web Client ID');
        clientId = Constants.expoConfig?.extra?.googleWebClientId;
      }
    } else {
      clientId = Constants.expoConfig?.extra?.googleWebClientId;
    }

    */

    // Use Web Client ID for browser-based OAuth on all platforms
    const clientId = Constants.expoConfig?.extra?.googleWebClientId;

    const backendUrl = Constants.expoConfig?.extra?.oauthBackendUrl;
    
    if (!clientId) {
      throw new Error('Google Client ID not configured');
    }

    if (!backendUrl) {
      throw new Error('OAuth backend not configured');
    }
    
    console.log('📱 Using Client ID for platform:', Platform.OS);

    const redirectUri = Platform.OS === 'web'
      ? AuthSession.makeRedirectUri({ scheme: 'accellax361', path: 'redirect' })
      : `${backendUrl}/api/oauth/google/callback`;

    console.log('📍 Redirect URI:', redirectUri);

    // Use WebBrowser to open Google OAuth
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('profile email')}` +
      `&access_type=offline` +
      `&prompt=consent`;

    console.log('🔗 Opening OAuth URL in browser...');
    
    const result = await WebBrowser.openAuthSessionAsync(
      authUrl,
      redirectUri
    );

    console.log('📱 Browser result:', result.type);

    if (result.type === 'cancel') {
      return { success: false, error: 'Authorization cancelled', cancelled: true };
    }

    if (result.type !== 'success') {
      return { success: false, error: 'Authorization failed' };
    }

    // Extract authorization code from URL
    const url = result.url;
    const codeMatch = url.match(/code=([^&]+)/);
    
    if (!codeMatch) {
      return { success: false, error: 'No authorization code received' };
    }

    const code = codeMatch[1];
    console.log('✅ Authorization code received');

    // Exchange code for token via backend
    console.log('🔄 Exchanging code for token via backend...');
    const tokenResponse = await fetch(`${backendUrl}/api/oauth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      throw new Error(errorData.error || 'Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Google tokens received from backend');

    // Use the user data from backend response
    const userInfo = {
      id: tokenData.user.id,
      name: tokenData.user.name,
      email: tokenData.user.email,
      photo: tokenData.user.picture,
    };

    // Check if user exists in Firebase
    const userRef = doc(db, 'users', userInfo.id);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      if (!allowRegistration) {
        return {
          success: false,
          error: 'No account found. Please sign up first.',
          needsRegistration: true,
        };
      }
      return await createGoogleUser({ uid: userInfo.id, email: userInfo.email }, userInfo);
    } else {
      if (allowRegistration) {
        return {
          success: false,
          error: 'Account already exists. Please sign in instead.',
          accountExists: true,
        };
      }
      return await loginGoogleUser({ uid: userInfo.id });
    }

  } catch (error) {
    console.error('❌ Browser authentication error:', error);
    throw error;
  }
};

/**
 * Create new Google user
 */
const createGoogleUser = async (firebaseUser, userInfo) => {
  try {
    const userRef = doc(db, 'users', firebaseUser.uid);

    const userProfile = {
      id: firebaseUser.uid,
      full_name: userInfo.name || 'Google User',
      email: firebaseUser.email,
      username: '',
      phone: '',
      auth_method: 'google',
      role: 'coach',
      avatar_base64: userInfo.photo || null,
      google_id: firebaseUser.uid,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
      last_login_at: Timestamp.now(),
    };

    await setDoc(userRef, userProfile);
    console.log('✅ User profile created in Firestore');

    return {
      success: true,
      isNewUser: true,
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
    console.error('❌ Error creating Google user:', error);
    throw error;
  }
};

/**
 * Login existing Google user
 */
const loginGoogleUser = async (firebaseUser) => {
  try {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User profile not found');
    }

    const userProfile = userSnap.data();

    // Update last login
    await setDoc(userRef, {
      last_login_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    }, { merge: true });

    return {
      success: true,
      isNewUser: false,
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
    console.error('❌ Error logging in Google user:', error);
    throw error;
  }
};

/**
 * Sign out from Google
 */
export const signOutFromGoogle = async () => {
  try {
    await auth.signOut();
    console.log('✅ Signed out from Google');
    return { success: true };
  } catch (error) {
    console.error('❌ Error signing out from Google:', error);
    return { success: false, error: error.message };
  }
};

export default {
  configureGoogleSignIn,
  signInWithGoogle,
  signUpWithGoogle,
  signOutFromGoogle,
};