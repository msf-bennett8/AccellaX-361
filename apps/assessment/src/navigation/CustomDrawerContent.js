// Location: /apps/assessment/src/navigation/CustomDrawerContent.js
// Custom drawer content with user info and logout

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, APP_NAME } from '../utils/constants';

export default function CustomDrawerContent(props) {
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profileJson = await AsyncStorage.getItem('userProfile');
      if (profileJson) {
        const profile = JSON.parse(profileJson);
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            props.onLogout();
          },
        },
      ]
    );
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      {/* Header with User Info */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {userProfile?.fullName?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.userName}>{userProfile?.fullName || 'User'}</Text>
        <Text style={styles.userEmail}>{userProfile?.email || ''}</Text>
        <Text style={styles.userRole}>
          {userProfile?.role?.toUpperCase() || 'COACH'}
        </Text>
      </View>

      {/* Drawer Items */}
      <View style={styles.drawerItems}>
        <DrawerItemList {...props} />
      </View>

      {/* Footer with Logout */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.appInfo}>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.primary,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryDark,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.primaryLight,
    marginBottom: 8,
  },
  userRole: {
    fontSize: 11,
    color: COLORS.primaryLight,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  drawerItems: {
    flex: 1,
    paddingTop: 10,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
  appInfo: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  version: {
    fontSize: 10,
    color: COLORS.textLight,
  },
});