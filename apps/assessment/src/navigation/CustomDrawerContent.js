// Location: /apps/assessment/src/navigation/CustomDrawerContent.js
// Custom drawer content with user info and logout

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import {
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, APP_NAME } from '../utils/constants';
import { getAllAssessments } from '../services/assessmentService';
import { getKidsWithSports } from '../services/kidService';

export default function CustomDrawerContent(props) {
  const [userProfile, setUserProfile] = useState(null);
  const [stats, setStats] = useState({ totalKids: 0, totalAssessments: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
  });

  useEffect(() => {
    loadUserProfile();
    loadQuickStats();
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

  const loadQuickStats = async () => {
    try {
      setLoadingStats(true);
      
      // Load kids count
      const kids = await getKidsWithSports();
      
      // Load assessments count
      const assessments = await getAllAssessments();
      
      setStats({
        totalKids: kids.length,
        totalAssessments: assessments.length,
      });
      
      setLoadingStats(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      setLoadingStats(false);
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
    <View style={styles.container}>
      {/* Sticky Header with User Info */}
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

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          {loadingStats ? (
            <ActivityIndicator size="small" color={COLORS.primaryLight} />
          ) : (
            <>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.totalKids}</Text>
                <Text style={styles.statLabel}>Kids</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.totalAssessments}</Text>
                <Text style={styles.statLabel}>Assessments</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Scrollable Drawer Items */}
      <View style={styles.scrollContainer}>
        <DrawerContentScrollView 
          {...props}
          contentContainerStyle={styles.drawerScrollContent}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.drawerItems}>
            <DrawerItemList {...props} />
          </View>
        </DrawerContentScrollView>
      </View>

      {/* Sticky Footer with Logout */}
      <View style={styles.footer}>
        {/* Separator */}
        <View style={styles.drawerSeparator} />
        
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryDark,
    // Sticky header - stays at top
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
    marginBottom: 16,
  },
  userRole: {
    fontSize: 11,
    color: COLORS.primaryLight,
  },
  
  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.primaryLight,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  
  // Scrollable content
  scrollContainer: {
    flex: 1,
    position: 'relative',
  },
  drawerScrollContent: {
    flexGrow: 1,
  },
  drawerItems: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    // Sticky footer - stays at bottom
  },
  
  // Separator
  drawerSeparator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 12,
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
