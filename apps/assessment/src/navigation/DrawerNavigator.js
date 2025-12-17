// Location: /apps/assessment/src/navigation/DrawerNavigator.js
// Drawer navigation for authenticated users (UPDATED)

import React, { useState, useEffect } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

// Import Screens
import HomeScreen from '../screens/Home/HomeScreen';
import KidsStackNavigator from './KidsStackNavigator';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import TeamsListScreen from '../screens/Teams/TeamsListScreen';

// Stack Navigators
import AssessmentStackNavigator from './AssessmentStackNavigator';
import HistoryStackNavigator from './HistoryStackNavigator';
import ReportsStackNavigator from './ReportsStackNavigator';
import LeaderboardsStackNavigator from './LeaderboardsStackNavigator';

// Drawer Content
import CustomDrawerContent from './CustomDrawerContent';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator({ onLogout }) {
  const [pendingAssessments, setPendingAssessments] = useState(0);

  // Helper to update browser tab title
  const updatePageTitle = (routeName) => {
    if (Platform.OS === 'web') {
      const pageTitles = {
        Home: 'Home',
        Kids: 'Kids Management',
        Teams: 'Teams', // ✅ NEW
        AddEditKid: 'Add/Edit Kid',
        History: 'Assessment History',
        Profile: 'Profile',
        EditProfile: 'Edit Profile',
        Settings: 'Settings',
        Assessment: 'Start Assessment',
      };
      const pageTitle = pageTitles[routeName] || routeName;
      document.title = `AccellaX 361° | ${pageTitle}`;
    }
  };

  // Set initial page title on mount
  useEffect(() => {
    updatePageTitle('Home');
    loadPendingAssessments();
  }, []);

  // Load pending assessments count (optional feature)
  const loadPendingAssessments = async () => {
    try {
      // TODO: Implement logic to count assessments due today
      // For now, set to 0
      setPendingAssessments(0);
    } catch (error) {
      console.error('Error loading pending assessments:', error);
    }
  };

  // Badge component for drawer icons
  const DrawerIconWithBadge = ({ iconName, iconLibrary = 'Ionicons', color, badgeCount = 0 }) => {
    const IconComponent = iconLibrary === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;
    
    return (
      <View style={styles.iconContainer}>
        <IconComponent name={iconName} size={22} color={color} />
        {badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
          </View>
        )}
      </View>
    );
  };

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
      {/* 1. HOME - Dashboard overview */}
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

      {/* 2. START ASSESSMENT - Primary action with optional badge */}
      <Drawer.Screen
        name="Assessment"
        component={AssessmentStackNavigator}
        options={{
          title: 'Start Assessment',
          drawerIcon: ({ color }) => (
            <DrawerIconWithBadge
              iconName="add-circle-outline"
              iconLibrary="Ionicons"
              color={color}
              badgeCount={pendingAssessments}
            />
          ),
        }}
      />

      {/* 3. KIDS - Athlete management */}
      <Drawer.Screen
        name="Kids"
        component={KidsStackNavigator}
        options={{
          title: 'Kids',
          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons name="account-group" size={22} color={color} />
          ),
        }}
      />

      {/* 4. TEAMS - House team management ✅ NEW */}
      <Drawer.Screen
        name="Teams"
        component={TeamsListScreen}
        options={{
          title: 'Teams',
          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons name="shield-account" size={22} color={color} />
          ),
        }}
      />

      {/* 5. HISTORY - Past assessments */}
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

      {/* 6. RANKINGS - Leaderboards (includes Comparison screen in its stack) */}
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

      {/* 7. REPORTS - Data Export */}
      <Drawer.Screen
        name="Reports"
        component={ReportsStackNavigator}
        options={{
          title: 'Reports',
          drawerIcon: ({ color }) => (
            <Ionicons name="stats-chart" size={22} color={color} />
          ),
        }}
      />

      {/* 8. MY PROFILE - User account */}
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

      {/* 9. SETTINGS - App configuration */}
      <Drawer.Screen
        name="Settings"
        options={{
          title: 'Settings',
          drawerIcon: ({ color }) => (
            <Ionicons name="settings" size={22} color={color} />
          ),
        }}
      >
        {(props) => <SettingsScreen {...props} onLogout={onLogout} />}
      </Drawer.Screen>

      {/* HIDDEN SCREENS - Not visible in drawer */}
      <Drawer.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: 'Edit Profile',
          drawerItemStyle: { display: 'none' },
        }}
      />
      </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
});