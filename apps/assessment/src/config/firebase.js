// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, browserLocalPersistence, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAXUvlKBO7_-EQKuFw9rLW8UpsqWDkoM9E",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "accellax-361.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "accellax-361",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "accellax-361.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "354831496530",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:354831496530:web:f2d7c7ab5f74b9b9fbb68b",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-53YMY2QP9J"
};

// Initialize Firebase
let app;
let db;
let auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  
  // ✅ FIX: Use correct persistence for web vs mobile
  if (Platform.OS === 'web') {
    auth = getAuth(app);
    // Browser persistence is default for web
  } else {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  }
  
  console.log('✅ Firebase initialized successfully');
  console.log('📊 Project ID:', firebaseConfig.projectId);
  console.log('🌐 Platform:', Platform.OS);
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  console.error('Config used:', firebaseConfig);
  
  // Fallback initialization
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log('✅ Firebase initialized with fallback method');
  } catch (fallbackError) {
    console.error('❌ Fallback initialization also failed:', fallbackError);
  }
}

export { app, db, auth };
export default app;