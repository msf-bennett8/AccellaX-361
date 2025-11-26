// Location: /apps/assessment/src/navigation/DrawerNavigator.js
// Drawer navigation for authenticated users

import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../utils/constants';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import { Platform } from 'react-native';
import { useEffect } from 'react';

// Import Screens
import HomeScreen from '../screens/Home/HomeScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

// Drawer Content
import CustomDrawerContent from './CustomDrawerContent';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator({ onLogout }) {
  // Helper to update browser tab title
  const updatePageTitle = (routeName) => {
    if (Platform.OS === 'web') {
      const pageTitles = {
        Home: 'Home',
        Profile: 'Profile',
        EditProfile: 'Edit Profile',
        Settings: 'Settings',
      };
      const pageTitle = pageTitles[routeName] || routeName;
      document.title = `AccellaX 361° | ${pageTitle}`;
    }
  };

  // Set initial page title on mount
  useEffect(() => {
    updatePageTitle('Home');
  }, []);

  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <CustomDrawerContent {...props} onLogout={onLogout} />
      )}
      screenOptions={({ route }) => ({
        headerShown: false, // We use custom Header component
        drawerActiveTintColor: COLORS.primary,
        drawerInactiveTintColor: COLORS.textSecondary,
        drawerLabelStyle: {
          fontSize: 16,
        },
      })}
      screenListeners={{
        state: (e) => {
          // Update page title when navigation state changes
          const currentRoute = e.data?.state?.routes[e.data?.state?.index];
          if (currentRoute) {
            updatePageTitle(currentRoute.name);
          }
        },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          drawerIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'My Profile',
          drawerIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👤</Text>,
        }}
      />
      <Drawer.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: 'Edit Profile',
          drawerItemStyle: { display: 'none' }, // Hide from drawer menu
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          drawerIcon: ({ color }) => <Text style={{ fontSize: 20 }}>⚙️</Text>,
        }}
      />
    </Drawer.Navigator>
  );
}