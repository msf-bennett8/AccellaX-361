// Location: /apps/assessment/src/navigation/AppNavigator.js
// Main app navigator with authentication routing

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Auth Screens
import AuthChoiceScreen from '../screens/Auth/AuthChoiceScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegistrationScreen from '../screens/Auth/RegistrationScreen';

// Main App Navigation
import DrawerNavigator from './DrawerNavigator';
// Import new report screens
import VisualizationScreen from '../screens/Reports/VisualizationScreen';
import ExportScreen from '../screens/Reports/ExportScreen';

const Stack = createStackNavigator();

export default function AppNavigator({ isAuthenticated, onAuthComplete, onLogout }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      {!isAuthenticated ? (
        // Auth Stack
        <>
          <Stack.Screen 
            name="AuthChoice" 
            component={AuthChoiceScreen}
          />
          <Stack.Screen 
            name="Login"
          >
            {(props) => (
              <LoginScreen 
                {...props} 
                onAuthComplete={onAuthComplete}
              />
            )}
          </Stack.Screen>
          <Stack.Screen 
            name="Register"
          >
            {(props) => (
              <RegistrationScreen 
                {...props} 
                onAuthComplete={onAuthComplete}
              />
            )}
          </Stack.Screen>
        </>
      ) : (
        // Main App Stack
        <Stack.Screen name="Main">
          {() => (
            <DrawerNavigator 
              onLogout={onLogout}
            />
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}