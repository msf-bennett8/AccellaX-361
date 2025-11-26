// Location: /apps/assessment/App.js
// Root application component with authentication check

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/database/db';
import { COLORS } from './src/utils/constants';
import { Platform } from 'react-native';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  // Set initial document title for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = 'AccellaX 361° | Sports Academy Assessment';
    }
  }, []);

  // Update document title for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = 'AccellaX 361° | Sports Academy Assessment';
    }
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 Initializing Assessment App...');

      // Initialize database
      await initDatabase();
      console.log('✅ Database initialized');

      // Check authentication status
      const userProfile = await AsyncStorage.getItem('userProfile');
      const currentUserId = await AsyncStorage.getItem('currentUserId');

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
      setIsAuthenticated(true);
      console.log('✅ User authenticated - navigating to main app');
    } else {
      console.warn('⚠️ Auth check failed - staying on auth screens');
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
    <NavigationContainer>
      <StatusBar style="auto" />
      <AppNavigator 
        isAuthenticated={isAuthenticated}
        onAuthComplete={handleAuthComplete}
        onLogout={handleLogout}
      />
    </NavigationContainer>
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