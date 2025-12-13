// Location: /apps/assessment/src/navigation/DrawerNavigator.js
// Drawer navigation for authenticated users

import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { Platform } from 'react-native';
import { useEffect } from 'react';

// Import Screens
import HomeScreen from '../screens/Home/HomeScreen';
import KidsListScreen from '../screens/Kids/KidsListScreen';
import AddEditKidScreen from '../screens/Kids/AddEditKidScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';

// Stack Navigators
import AssessmentStackNavigator from './AssessmentStackNavigator';
import HistoryStackNavigator from './HistoryStackNavigator';
import ReportsStackNavigator from './ReportsStackNavigator';
import LeaderboardsStackNavigator from './LeaderboardsStackNavigator';

// Drawer Content
import CustomDrawerContent from './CustomDrawerContent';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator({ onLogout }) {
  // Helper to update browser tab title
  const updatePageTitle = (routeName) => {
    if (Platform.OS === 'web') {
      const pageTitles = {
        Home: 'Home',
        Kids: 'Kids Management',
        AddEditKid: 'Add/Edit Kid',
        History: 'Assessment History',
        Profile: 'Profile',
        EditProfile: 'Edit Profile',
        Settings: 'Settings',
        Assessment: 'New Assessment',
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
          drawerIcon: ({ color }) => (
            <Ionicons name="home" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Kids"
        component={KidsListScreen}
        options={{
          title: 'Kids',
          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons name="account-group" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="AddEditKid"
        component={AddEditKidScreen}
        options={{
          title: 'Add/Edit Kid',
          drawerItemStyle: { display: 'none' }, // Hide from drawer menu
        }}
      />
      {/* ✅ NEW: History Stack Navigator */}
      <Drawer.Screen
        name="History"
        component={HistoryStackNavigator}
        options={{
          title: 'History',
          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons name="history" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Reports"
        component={ReportsStackNavigator}
        options={{
          title: 'Export Data',
          drawerItemStyle: { display: 'none' }, // Hidden - accessed from History
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'My Profile',
          drawerIcon: ({ color }) => (
            <Ionicons name="person-circle" size={22} color={color} />
          ),
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
          drawerIcon: ({ color }) => (
            <Ionicons name="settings" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Assessment"
        component={AssessmentStackNavigator}
        options={{
          title: 'New Assessment',
          drawerItemStyle: { display: 'none' }, // Hidden - accessed via Home button
        }}
      />
      <Drawer.Screen
        name="Leaderboards"
        component={LeaderboardsStackNavigator}
        options={{
          title: 'Rankings',
          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons name="trophy-award" size={22} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}