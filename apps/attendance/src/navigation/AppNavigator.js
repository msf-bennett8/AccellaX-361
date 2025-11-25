//src/navigation/AppNavigator.js
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import DrawerNavigator from './DrawerNavigator';
import AuthChoiceScreen from '../screens/Auth/AuthChoiceScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import { initDatabase } from '../database/db';
import { initializeSync } from '../database/sync';
import { getCurrentUser } from '../utils/auth';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasUser, setHasUser] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); 

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      // Initialize database
      await initDatabase();
      
      // Check if user account exists
      const currentUser = await getCurrentUser();
      
      if (currentUser) {
        console.log('✅ User found:', currentUser.fullName);
        setHasUser(true);
        
        // Initialize Firebase sync system (but don't perform sync yet)
        // Sync will happen after login in LoginScreen
        await initializeSync();
        
        // Start auto-sync for future syncs
        const { startAutoSync } = await import('../database/sync');
        startAutoSync();
      } else {
        console.log('ℹ️ No user account found');
        setHasUser(false);
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      setHasUser(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    console.log('🔄 Handling logout - refreshing app state...');
    setHasUser(false);
    setRefreshKey(prev => prev + 1); // Force re-render
  };

  const handleAuthComplete = async () => {
    // Reload user status
    const currentUser = await getCurrentUser();
    if (currentUser) {
      setHasUser(true);
      
      // Don't call initializeSync again - it was already called in LoginScreen
      // Just start auto-sync for future updates
      const { startAutoSync } = await import('../database/sync');
      startAutoSync();
    }
  };

  // Make logout handler available globally
  useEffect(() => {
    // Store in global scope so ProfileScreen can access it
    global.handleAppLogout = handleLogout;
    
    return () => {
      delete global.handleAppLogout;
    };
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {hasUser ? (
        <DrawerNavigator />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen 
            name="AuthChoice" 
            component={AuthChoiceScreen}
          />
          <Stack.Screen name="Login">
            {props => (
              <LoginScreen 
                {...props} 
                onAuthComplete={handleAuthComplete} 
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Onboarding">
            {props => (
              <OnboardingScreen 
                {...props} 
                onComplete={handleAuthComplete} 
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;