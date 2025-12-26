// Location: /apps/assessment/App.js
// Root application component with authentication check

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SyncProvider } from './src/contexts/SyncContext';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Platform, Linking } from 'react-native'; // ← ADDED Linking
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { UndoProvider } from './src/contexts/UndoContext';
import { AssessmentProvider } from './src/contexts/AssessmentContext';
import { initDatabase } from './src/database/db';
import { seedDatabaseIfNeeded } from './src/database/seeds';
import { COLORS } from './src/utils/constants';
import LegalUpdateModal from './src/components/modals/LegalUpdateModal';
import { checkForVersionUpdate, recordLegalAcceptance, saveLegalAcceptanceToDatabase } from './src/utils/legalTracker';

// ✅ Suppress known deprecation warnings (optional)
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  '"shadow*" style props are deprecated',
  'props.pointerEvents is deprecated',
  'Animated: `useNativeDriver` is not supported'
]);

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLegalUpdateModal, setShowLegalUpdateModal] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  // Set initial document title for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = 'AccellaX 361° | Sports Academy Assessment';
    }
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initializing AccellaX 361°...');

      // Initialize logger service
      const logger = (await import('./src/services/loggerService')).default;
      await logger.init();
      await logger.system('App', 'Startup', 'Application starting');

      // 1. Initialize database schema
      await initDatabase();
      console.log('✅ Database schema initialized');
      await logger.info('Database', 'Init', 'Database schema initialized successfully');

      // Check authentication status
      const userProfile = await AsyncStorage.getItem('userProfile');
      const currentUserId = await AsyncStorage.getItem('currentUserId');

      // 2. Auto-seed missing data
      console.log('🌱 Running auto-seed...');
      const { autoSeedDatabase } = await import('./src/services/autoSeedService');
      const seedResult = await autoSeedDatabase(currentUserId || 'system');
      
      if (seedResult.success) {
        console.log('✅ Auto-seed completed successfully');
        await logger.info('Database', 'Seed', 'Auto-seed completed', seedResult.results);
      } else {
        console.warn('⚠️  Auto-seed completed with errors:', seedResult.results?.errors);
        await logger.warn('Database', 'Seed', 'Auto-seed had errors', seedResult.results?.errors);
      }

      // 3. Start periodic background sync (every 5 minutes)
      if (currentUserId) {
        const { startAutoSync } = await import('./src/database/sync');
        startAutoSync();
        console.log('✅ Periodic background sync started');
        await logger.info('Sync', 'AutoSync', 'Periodic sync started');
      }

      if (userProfile && currentUserId) {
        console.log('✅ User is authenticated');
        setIsAuthenticated(true);
      } else {
        console.log('❌ User is not authenticated');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ App initialization error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // ========== : DEEP LINK HANDLER ==========
  const handleDeepLink = async ({ url }) => {
    console.log('🔗 Deep link received:', url);
    
    try {
      // Parse the URL
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      
      // Check if this is an OAuth callback
      if (urlObj.pathname === '/oauth/callback' || url.includes('oauth/callback')) {
        const code = params.get('code');
        const error = params.get('error');
        
        if (error) {
          console.error('❌ OAuth error:', error);
          // Complete pending auth with error
          const { completePendingAuth: completeGoogleAuth } = await import('./src/services/googleOAuthService');
          const { completePendingAuth: completeStravaAuth } = await import('./src/services/stravaOAuthService');
          completeGoogleAuth && completeGoogleAuth(null, error);
          completeStravaAuth && completeStravaAuth(null, error);
          return;
        }
        
        if (code) {
          console.log('✅ OAuth code received:', code.substring(0, 10) + '...');
          // Complete pending auth with code
          // Try both - only the one that's waiting will respond
          try {
            const { completePendingAuth: completeGoogleAuth } = await import('./src/services/googleOAuthService');
            completeGoogleAuth(code);
          } catch (e) {
            // Google auth not pending
          }
          
          try {
            const { completePendingAuth: completeStravaAuth } = await import('./src/services/stravaOAuthService');
            completeStravaAuth(code);
          } catch (e) {
            // Strava auth not pending
          }
        }
      }
    } catch (error) {
      console.error('❌ Error parsing deep link:', error);
    }
  };

  // ========== NEW: DEEP LINK LISTENER ==========
  useEffect(() => {
    // Handle deep links when app is already open
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🔗 App opened with URL:', url);
        handleDeepLink({ url });
      }
    });

    // Cleanup
    return () => {
      subscription.remove();
    };
  }, []);
  // ========== END OF NEW CODE ==========

  const handleAuthComplete = async () => {
    console.log('🔄 Auth completed, checking status...');
    
    // Small delay to ensure AsyncStorage has written
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const userProfile = await AsyncStorage.getItem('userProfile');
    const currentUserId = await AsyncStorage.getItem('currentUserId');

    console.log('📋 Auth check result:', { 
      hasProfile: !!userProfile, 
      hasUserId: !!currentUserId 
    });

    if (userProfile && currentUserId) {
      // Sync legal documents from GitHub (background, non-blocking)
      const { checkGitHubForUpdates } = await import('./src/utils/legalTracker');
      checkGitHubForUpdates().catch(err => console.log('GitHub sync skipped:', err.message));
      
      // Check if legal terms have been updated
      const versionCheck = await checkForVersionUpdate();
      
      if (versionCheck.needsReAcceptance) {
        console.log('⚠️ Legal terms updated - showing acceptance modal');
        setShowLegalUpdateModal(true);
      }
      
      setIsAuthenticated(true);
      console.log('✅ User authenticated - navigating to main app');
    } else {
      console.warn('⚠️ Auth check failed - staying on auth screens');
    }
  };

  const handleAcceptLegalUpdate = async () => {
    try {
      const userProfileJson = await AsyncStorage.getItem('userProfile');
      const userProfile = JSON.parse(userProfileJson);
      
      // Record acceptance
      const result = await recordLegalAcceptance(userProfile.userId, userProfile.email);
      
      if (result.success) {
        // Save to database
        await saveLegalAcceptanceToDatabase(userProfile.userId, result.data);
        
        console.log('✅ Legal update accepted');
        setShowLegalUpdateModal(false);
      }
    } catch (error) {
      console.error('❌ Error accepting legal update:', error);
    }
  };

  const handleLogout = async () => {
    console.log('🔓 Logging out...');
    await AsyncStorage.removeItem('userProfile');
    await AsyncStorage.removeItem('currentUserId');
    setIsAuthenticated(false);
    console.log('✅ Logged out');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
   <AuthProvider>
      <UndoProvider>
      <AssessmentProvider>
      <SyncProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <AppNavigator 
            isAuthenticated={isAuthenticated}
            onAuthComplete={handleAuthComplete}
            onLogout={handleLogout}
          />
        </NavigationContainer>
        
        {/* Global Legal Update Modal - blocks all interaction */}
        <LegalUpdateModal
          visible={showLegalUpdateModal && isAuthenticated}
          onAccept={handleAcceptLegalUpdate}
        />
        </SyncProvider>
      </AssessmentProvider>
      </UndoProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});