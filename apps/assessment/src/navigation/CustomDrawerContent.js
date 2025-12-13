// Location: /apps/assessment/src/navigation/CustomDrawerContent.js
// Custom drawer content with user info and logout

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import {
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, APP_NAME } from '../utils/constants';

export default function CustomDrawerContent(props) {
  const [userProfile, setUserProfile] = useState(null);
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
  });

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
    setModalConfig({
      visible: true,
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      type: 'warning',
      showCancel: true,
      confirmText: 'Logout',
      cancelText: 'Cancel',
      onConfirm: () => {
        setModalConfig({ ...modalConfig, visible: false });
        props.onLogout();
      },
      onCancel: () => setModalConfig({ ...modalConfig, visible: false }),
    });
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      {/* Header with User Info */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons 
            name="person" 
            size={40} 
            color={COLORS.primary} 
          />
        </View>
        <Text style={styles.userName}>{userProfile?.fullName || 'User'}</Text>
        <Text style={styles.userEmail}>{userProfile?.email || ''}</Text>
        <View style={styles.roleBadge}>
          <MaterialCommunityIcons name="shield-account" size={12} color={COLORS.primaryLight} />
          <Text style={styles.userRole}>
            {userProfile?.role?.toUpperCase() || 'COACH'}
          </Text>
        </View>
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
          <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.appInfo}>
          <View style={styles.appNameRow}>
            <MaterialCommunityIcons name="shield-star" size={14} color={COLORS.textSecondary} />
            <Text style={styles.appName}>{APP_NAME}</Text>
          </View>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </View>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={modalConfig.visible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        showCancel={modalConfig.showCancel}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel}
      />
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
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userRole: {
    fontSize: 11,
    color: COLORS.primaryLight,
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
    backgroundColor: COLORS.white,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.backgroundDark,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
  appInfo: {
    alignItems: 'center',
    paddingTop: 8,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  appName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  version: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});