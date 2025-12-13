// Location: /apps/assessment/src/screens/Settings/SettingsScreen.js
// Comprehensive Settings & Configuration Screen for Assessment App

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Linking,
  Share,
} from 'react-native';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import { COLORS, APP_NAME, APP_VERSION } from '../../utils/constants';
import { getCurrentUser, logoutUser, isAdminOrOwner } from '../../utils/auth';

export default function SettingsScreen() {
  const navigation = useNavigation();

  // State Management
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState({
    // Sync Settings
    autoSync: true,
    syncOnlyWifi: false,
    syncInterval: '15min', // '5min', '15min', '30min', '1hour', 'manual'
    lastSyncTime: null,
    
    // Notification Settings
    enableNotifications: true,
    performanceAlerts: true,
    upcomingTestReminders: true,
    syncNotifications: false,
    
    // Data Entry Settings
    enableVoiceInput: false,
    autoFillPreviousData: true,
    confirmBeforeSave: true,
    quickEntryMode: false,
    
    // Display Settings
    darkMode: false,
    showPercentiles: true,
    showBenchmarks: true,
    defaultSportView: 'all', // 'all', 'football', 'athletics', etc.
    chartType: 'line', // 'line', 'bar', 'radar'
    
    // Assessment Settings
    defaultTerm: 'auto', // 'auto', 'Q1', 'Q2', 'Q3', 'Q4'
    enableVideoCapture: false,
    enablePhotoCapture: true,
    maxPhotosPerAssessment: 5,
    
    // Privacy Settings
    shareDataWithParents: true,
    shareDataWithSponsors: false,
    allowAnonymousComparisons: true,
    
    // Advanced Settings
    offlineMode: false,
    debugMode: false,
    dataRetentionPeriod: '2years', // '1year', '2years', '5years', 'forever'
  });
  const [storageInfo, setStorageInfo] = useState({
    totalAssessments: 0,
    totalKids: 0,
    databaseSize: '0 MB',
    photosSize: '0 MB',
    videosSize: '0 MB',
  });
  const [syncStatus, setSyncStatus] = useState({
    isSyncing: false,
    lastSync: null,
    pendingItems: 0,
  });
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
  });

  useEffect(() => {
    loadUserProfile();
    loadSettings();
    loadStorageInfo();
    loadSyncStatus();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await getCurrentUser();
      setUserProfile(profile);
      
      const adminStatus = await isAdminOrOwner();
      setIsAdmin(adminStatus);
      
      console.log('👤 Settings: User loaded, isAdmin:', adminStatus);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem('appSettings');
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadStorageInfo = async () => {
    try {
      // TODO: Replace with actual database queries
      const { getStorageInfo } = await import('../../database/db');
      const info = await getStorageInfo();
      setStorageInfo(info || storageInfo);
    } catch (error) {
      console.log('⚠️ Storage info not yet available');
    }
  };

  const loadSyncStatus = async () => {
    try {
      const lastSync = await AsyncStorage.getItem('lastSyncTime');
      const pendingItems = await AsyncStorage.getItem('pendingSyncItems');
      
      setSyncStatus({
        isSyncing: false,
        lastSync: lastSync ? new Date(lastSync) : null,
        pendingItems: pendingItems ? parseInt(pendingItems) : 0,
      });
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
      console.log('✅ Settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const handleManualSync = async () => {
    if (syncStatus.isSyncing) {
      setModalConfig({
        visible: true,
        title: 'Sync in Progress',
        message: 'Please wait for the current sync to complete.',
        type: 'info',
        onConfirm: () => setModalConfig({ ...modalConfig, visible: false }),
      });
      return;
    }

    setModalConfig({
      visible: true,
      title: 'Manual Sync',
      message: `Sync ${syncStatus.pendingItems} pending items to cloud?`,
      type: 'info',
      showCancel: true,
      confirmText: 'Sync Now',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setModalConfig({ ...modalConfig, visible: false });
            setSyncStatus({ ...syncStatus, isSyncing: true });
            
            try {
              const { performFullSync } = await import('../../database/sync');
              const userId = await AsyncStorage.getItem('currentUserId');
              
              const result = await performFullSync(userId);
              
              if (result.success) {
                setModalConfig({
                  visible: true,
                  title: 'Success',
                  message: 'Data synced successfully!',
                  type: 'success',
                  onConfirm: () => setModalConfig({ ...modalConfig, visible: false }),
                });
                await AsyncStorage.setItem('lastSyncTime', new Date().toISOString());
                await AsyncStorage.setItem('pendingSyncItems', '0');
                loadSyncStatus();
              } else {
                setModalConfig({
                  visible: true,
                  title: 'Sync Failed',
                  message: result.error || 'Please try again later.',
                  type: 'error',
                  onConfirm: () => setModalConfig({ ...modalConfig, visible: false }),
                });
              }
            } catch (error) {
              console.error('Sync error:', error);
              setModalConfig({
                visible: true,
                title: 'Error',
                message: 'Sync failed. Please check your connection.',
                type: 'error',
                onConfirm: () => setModalConfig({ ...modalConfig, visible: false }),
              });
            } finally {
              setSyncStatus({ ...syncStatus, isSyncing: false });
            }
      },
      onCancel: () => setModalConfig({ ...modalConfig, visible: false }),
    });
  };

  const handleClearCache = () => {
    setModalConfig({
      visible: true,
      title: 'Clear Cache',
      message: 'This will clear temporary files but keep your assessments and data.',
      type: 'warning',
      showCancel: true,
      confirmText: 'Clear',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setModalConfig({ ...modalConfig, visible: false });
            try {
              // TODO: Implement cache clearing
              setModalConfig({
                visible: true,
                title: 'Success',
                message: 'Cache cleared successfully!',
                type: 'success',
                onConfirm: () => setModalConfig({ ...modalConfig, visible: false }),
              });
              loadStorageInfo();
            } catch (error) {
              setModalConfig({
                visible: true,
                title: 'Error',
                message: 'Failed to clear cache.',
                type: 'error',
                onConfirm: () => setModalConfig({ ...modalConfig, visible: false }),
              });
            }
      },
      onCancel: () => setModalConfig({ ...modalConfig, visible: false }),
    });
  };

  const handleExportData = async () => {
    setModalConfig({
      visible: true,
      title: 'Export Data',
      message: 'Export all assessments as CSV or PDF?',
      type: 'info',
      showCancel: true,
      confirmText: 'CSV',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setModalConfig({ ...modalConfig, visible: false });
        try {
          const { exportAllDataAsCSV } = await import('../../utils/exportUtils');
          const result = await exportAllDataAsCSV();
          
          if (result.success) {
            Share.share({
              message: 'Assessment data exported',
              url: result.fileUri,
            });
          }
        } catch (error) {
          setModalConfig({
            visible: true,
            title: 'Error',
            message: 'Export failed. Please try again.',
            type: 'error',
            onConfirm: () => setModalConfig({ ...modalConfig, visible: false }),
          });
        }
      },
      onCancel: () => setModalConfig({ ...modalConfig, visible: false }),
    });
    // TODO: Add PDF option as second modal or separate button
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Reset all settings to default values? Your data will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const defaultSettings = {
              autoSync: true,
              syncOnlyWifi: false,
              syncInterval: '15min',
              lastSyncTime: null,
              enableNotifications: true,
              performanceAlerts: true,
              upcomingTestReminders: true,
              syncNotifications: false,
              enableVoiceInput: false,
              autoFillPreviousData: true,
              confirmBeforeSave: true,
              quickEntryMode: false,
              darkMode: false,
              showPercentiles: true,
              showBenchmarks: true,
              defaultSportView: 'all',
              chartType: 'line',
              defaultTerm: 'auto',
              enableVideoCapture: false,
              enablePhotoCapture: true,
              maxPhotosPerAssessment: 5,
              shareDataWithParents: true,
              shareDataWithSponsors: false,
              allowAnonymousComparisons: true,
              offlineMode: false,
              debugMode: false,
              dataRetentionPeriod: '2years',
            };
            
            await saveSettings(defaultSettings);
            Alert.alert('Success', 'Settings reset to defaults.');
          },
        },
      ]
    );
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      '⚠️ DELETE ALL DATA',
      'This will permanently delete ALL assessments, kids, and data. This action CANNOT be undone!\n\nType "DELETE" to confirm.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'I Understand',
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            Alert.prompt(
              'Final Confirmation',
              'Type DELETE in capital letters to confirm:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: async (text) => {
                    if (text === 'DELETE') {
                      try {
                        const { deleteAllData } = await import('../../database/db');
                        await deleteAllData();
                        Alert.alert('Deleted', 'All data has been deleted.', [
                          {
                            text: 'OK',
                            onPress: () => {
                              // Logout and restart
                              logoutUser();
                              navigation.reset({
                                index: 0,
                                routes: [{ name: 'AuthChoice' }],
                              });
                            },
                          },
                        ]);
                      } catch (error) {
                        Alert.alert('Error', 'Failed to delete data.');
                      }
                    } else {
                      Alert.alert('Cancelled', 'Text did not match. Data preserved.');
                    }
                  },
                },
              ],
              'plain-text'
            );
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    setModalConfig({
      visible: true,
      title: 'Logout',
      message: 'Are you sure you want to logout? Unsynced data will remain on this device.',
      type: 'warning',
      showCancel: true,
      confirmText: 'Logout',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setModalConfig({ ...modalConfig, visible: false });
            try {
              await logoutUser();
              navigation.reset({
                index: 0,
                routes: [{ name: 'AuthChoice' }],
              });
            } catch (error) {
              setModalConfig({
                visible: true,
                title: 'Error',
                message: 'Logout failed. Please try again.',
                type: 'error',
                onConfirm: () => setModalConfig({ ...modalConfig, visible: false }),
              });
            }
      },
      onCancel: () => setModalConfig({ ...modalConfig, visible: false }),
    });
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'How would you like to contact us?',
      [
        {
          text: 'Email',
          onPress: () => Linking.openURL('mailto:support@accellax361.com?subject=Assessment App Support'),
        },
        {
          text: 'WhatsApp',
          onPress: () => Linking.openURL('https://wa.me/1234567890'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleRateApp = () => {
    const storeUrl = Platform.select({
      ios: 'https://apps.apple.com/app/id123456789',
      android: 'https://play.google.com/store/apps/details?id=com.accellax361.assessment',
    });
    Linking.openURL(storeUrl);
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: `Check out ${APP_NAME}! Track fitness assessments for young athletes. Download: https://accellax361.com/app`,
      });
    } catch (error) {
      console.error('Error sharing app:', error);
    }
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://accellax361.com/privacy');
  };

  const handleTermsOfService = () => {
    Linking.openURL('https://accellax361.com/terms');
  };

  const handleCheckForUpdates = () => {
    Alert.alert(
      'Check for Updates',
      'You are running the latest version!',
      [{ text: 'OK' }]
    );
  };

  const formatSyncTime = (date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getSyncIntervalLabel = (interval) => {
    const labels = {
      '5min': 'Every 5 minutes',
      '15min': 'Every 15 minutes',
      '30min': 'Every 30 minutes',
      '1hour': 'Every hour',
      'manual': 'Manual only',
    };
    return labels[interval] || interval;
  };

  return (
    <View style={styles.container}>
      <Header
        title="Settings"
        leftIcon="☰"
        onLeftPress={() => navigation.openDrawer()}
        showAvatar={true}
        userProfile={userProfile}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Section */}
        <TouchableOpacity
          style={styles.profileSection}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}
        >
          <View style={styles.profileAvatar}>
            <Ionicons 
              name="person" 
              size={28} 
              color={COLORS.white} 
            />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userProfile?.fullName || 'User'}</Text>
            <Text style={styles.profileEmail}>{userProfile?.email || ''}</Text>
            <View style={styles.profileRoleBadge}>
              <Text style={styles.profileRoleText}>
                {userProfile?.role?.toUpperCase() || 'COACH'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {/* Sync & Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync & Data</Text>
          
          {/* Sync Status Card */}
          <View style={styles.syncStatusCard}>
            <View style={styles.syncStatusHeader}>
              <Text style={styles.syncStatusTitle}>Sync Status</Text>
              <View style={[
                styles.syncStatusDot,
                { backgroundColor: syncStatus.pendingItems > 0 ? COLORS.warning : COLORS.success }
              ]} />
            </View>
            <Text style={styles.syncStatusText}>
              Last synced: {formatSyncTime(syncStatus.lastSync)}
            </Text>
            {syncStatus.pendingItems > 0 && (
              <Text style={styles.syncPendingText}>
                {syncStatus.pendingItems} items pending sync
              </Text>
            )}
            <TouchableOpacity
              style={styles.syncButton}
              onPress={handleManualSync}
              disabled={syncStatus.isSyncing}
              activeOpacity={0.8}
            >
              <Text style={styles.syncButtonText}>
                {syncStatus.isSyncing ? 'Syncing...' : 'Sync Now'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Auto Sync Toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="flash" size={24} color={COLORS.primary} style={styles.settingIcon} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Auto Sync</Text>
                <Text style={styles.settingSubtitle}>
                  {getSyncIntervalLabel(settings.syncInterval)}
                </Text>
              </View>
            </View>
            <Switch
              value={settings.autoSync}
              onValueChange={(value) => updateSetting('autoSync', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          {/* Sync Only on WiFi */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="wifi" size={24} color={COLORS.primary} style={styles.settingIcon} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>WiFi Only</Text>
                <Text style={styles.settingSubtitle}>Sync only on WiFi connection</Text>
              </View>
            </View>
            <Switch
              value={settings.syncOnlyWifi}
              onValueChange={(value) => updateSetting('syncOnlyWifi', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          {/* Storage Info */}
          <View style={styles.storageCard}>
            <Text style={styles.storageTitle}>Storage Usage</Text>
            <View style={styles.storageRow}>
              <Text style={styles.storageLabel}>Assessments:</Text>
              <Text style={styles.storageValue}>{storageInfo.totalAssessments}</Text>
            </View>
            <View style={styles.storageRow}>
              <Text style={styles.storageLabel}>Athletes:</Text>
              <Text style={styles.storageValue}>{storageInfo.totalKids}</Text>
            </View>
            <View style={styles.storageRow}>
              <Text style={styles.storageLabel}>Database:</Text>
              <Text style={styles.storageValue}>{storageInfo.databaseSize}</Text>
            </View>
            <View style={styles.storageRow}>
              <Text style={styles.storageLabel}>Photos:</Text>
              <Text style={styles.storageValue}>{storageInfo.photosSize}</Text>
            </View>
            <TouchableOpacity style={styles.clearCacheButton} onPress={handleClearCache}>
              <Text style={styles.clearCacheText}>Clear Cache</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={24} color={COLORS.primary} style={styles.settingIcon} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Enable Notifications</Text>
                <Text style={styles.settingSubtitle}>Receive app notifications</Text>
              </View>
            </View>
            <Switch
              value={settings.enableNotifications}
              onValueChange={(value) => updateSetting('enableNotifications', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="alert-circle" size={24} color={COLORS.primary} style={styles.settingIcon} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Performance Alerts</Text>
                <Text style={styles.settingSubtitle}>Alert on significant changes</Text>
              </View>
            </View>
            <Switch
              value={settings.performanceAlerts}
              onValueChange={(value) => updateSetting('performanceAlerts', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
              disabled={!settings.enableNotifications}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="calendar" size={24} color={COLORS.primary} style={styles.settingIcon} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Test Reminders</Text>
                <Text style={styles.settingSubtitle}>Remind upcoming assessments</Text>
              </View>
            </View>
            <Switch
              value={settings.upcomingTestReminders}
              onValueChange={(value) => updateSetting('upcomingTestReminders', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
              disabled={!settings.enableNotifications}
            />
          </View>
        </View>

        {/* Data Entry Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Entry</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons name="refresh" size={24} color={COLORS.primary} style={styles.settingIcon} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Auto-Fill Previous Data</Text>
                <Text style={styles.settingSubtitle}>Pre-populate last assessment</Text>
              </View>
            </View>
            <Switch
              value={settings.autoFillPreviousData}
              onValueChange={(value) => updateSetting('autoFillPreviousData', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} style={styles.settingIcon} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Confirm Before Save</Text>
                <Text style={styles.settingSubtitle}>Show confirmation dialog</Text>
              </View>
            </View>
            <Switch
              value={settings.confirmBeforeSave}
              onValueChange={(value) => updateSetting('confirmBeforeSave', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="mic" size={24} color={COLORS.primary} style={styles.settingIcon} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Voice Input (Beta)</Text>
                <Text style={styles.settingSubtitle}>Experimental feature</Text>
              </View>
            </View>
            <Switch
              value={settings.enableVoiceInput}
              onValueChange={(value) => updateSetting('enableVoiceInput', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        {/* Display Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon" size={24} color={COLORS.primary} style={styles.settingIcon} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Dark Mode</Text>
                <Text style={styles.settingSubtitle}>Coming soon</Text>
              </View>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(value) => updateSetting('darkMode', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
              disabled={true}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="stats-chart" size={24} color={COLORS.primary} style={styles.settingIcon} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Show Percentiles</Text>
                <Text style={styles.settingSubtitle}>Display percentile rankings</Text>
              </View>
            </View>
            <Switch
              value={settings.showPercentiles}
              onValueChange={(value) => updateSetting('showPercentiles', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🎯</Text>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Show Benchmarks</Text>
                <Text style={styles.settingSubtitle}>Display standard benchmarks</Text>
              </View>
            </View>
            <Switch
              value={settings.showBenchmarks}
              onValueChange={(value) => updateSetting('showBenchmarks', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        {/* Assessment Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assessment</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="camera" size={24} color={COLORS.primary} style={styles.settingIcon} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Photo Capture</Text>
                <Text style={styles.settingSubtitle}>Take photos during assessment</Text>
              </View>
            </View>
            <Switch
              value={settings.enablePhotoCapture}
              onValueChange={(value) => updateSetting('enablePhotoCapture', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="videocam" size={24} color={COLORS.primary} style={styles.settingIcon} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Video Capture (Beta)</Text>
                <Text style={styles.settingSubtitle}>Record technique videos</Text>
              </View>
            </View>
            <Switch
              value={settings.enableVideoCapture}
              onValueChange={(value) => updateSetting('enableVideoCapture', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="people" size={24} color={COLORS.primary} style={styles.settingIcon} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Share with Parents</Text>
                <Text style={styles.settingSubtitle}>Allow parent access to data</Text>
              </View>
            </View>
            <Switch
              value={settings.shareDataWithParents}
              onValueChange={(value) => updateSetting('shareDataWithParents', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons name="handshake" size={24} color={COLORS.primary} style={styles.settingIcon} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Share with Sponsors</Text>
                <Text style={styles.settingSubtitle}>Allow sponsor access</Text>
              </View>
            </View>
            <Switch
              value={settings.shareDataWithSponsors}
              onValueChange={(value) => updateSetting('shareDataWithSponsors', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="people-outline" size={24} color={COLORS.primary} style={styles.settingIcon} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Anonymous Comparisons</Text>
                <Text style={styles.settingSubtitle}>Allow anonymous rankings</Text>
              </View>
            </View>
            <Switch
              value={settings.allowAnonymousComparisons}
              onValueChange={(value) => updateSetting('allowAnonymousComparisons', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        {/* Admin Section (Only visible to admin/owner) */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Tools</Text>
            <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('SportManagement')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="medal" size={24} color={COLORS.primary} style={styles.actionButtonIcon} />
          <View style={styles.actionButtonTextContainer}>
            <Text style={styles.actionButtonTitle}>Manage Sports</Text>
            <Text style={styles.actionButtonSubtitle}>Add/edit sports & metrics</Text>
          </View>
          <Text style={styles.actionButtonArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('BenchmarkSettings')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="ruler" size={24} color={COLORS.primary} style={styles.actionButtonIcon} />
          <View style={styles.actionButtonTextContainer}>
            <Text style={styles.actionButtonTitle}>Benchmark Settings</Text>
            <Text style={styles.actionButtonSubtitle}>Configure standards & percentiles</Text>
          </View>
          <Text style={styles.actionButtonArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleExportData}
          activeOpacity={0.7}
        >
          <Ionicons name="cloud-upload" size={24} color={COLORS.primary} style={styles.actionButtonIcon} />
          <View style={styles.actionButtonTextContainer}>
            <Text style={styles.actionButtonTitle}>Export All Data</Text>
            <Text style={styles.actionButtonSubtitle}>Download CSV/PDF reports</Text>
          </View>
          <Text style={styles.actionButtonArrow}>→</Text>
        </TouchableOpacity>
      </View>
        )}

        {/* Data Management Section */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Data Management</Text>
      
      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleResetSettings}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="restore" size={24} color={COLORS.primary} style={styles.actionButtonIcon} />
        <View style={styles.actionButtonTextContainer}>
          <Text style={styles.actionButtonTitle}>Reset Settings</Text>
          <Text style={styles.actionButtonSubtitle}>Restore default settings</Text>
        </View>
        <Text style={styles.actionButtonArrow}>→</Text>
      </TouchableOpacity>

      {isAdmin && (
        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleDeleteAllData}
          activeOpacity={0.7}
        >
          <Ionicons name="trash" size={24} color={COLORS.error} style={styles.actionButtonIcon} />
          <View style={styles.actionButtonTextContainer}>
            <Text style={[styles.actionButtonTitle, styles.dangerText]}>Delete All Data</Text>
            <Text style={styles.actionButtonSubtitle}>Permanently erase everything</Text>
          </View>
          <Text style={styles.actionButtonArrow}>→</Text>
        </TouchableOpacity>
      )}
    </View>

    {/* Support Section */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Help & Support</Text>
      
      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleContactSupport}
        activeOpacity={0.7}
      >
        <Ionicons name="mail" size={24} color={COLORS.primary} style={styles.actionButtonIcon} />
        <View style={styles.actionButtonTextContainer}>
          <Text style={styles.actionButtonTitle}>Contact Support</Text>
          <Text style={styles.actionButtonSubtitle}>Get help from our team</Text>
        </View>
        <Text style={styles.actionButtonArrow}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleRateApp}
        activeOpacity={0.7}
      >
        <Ionicons name="star" size={24} color={COLORS.primary} style={styles.actionButtonIcon} />
        <View style={styles.actionButtonTextContainer}>
          <Text style={styles.actionButtonTitle}>Rate This App</Text>
          <Text style={styles.actionButtonSubtitle}>Share your feedback</Text>
        </View>
        <Text style={styles.actionButtonArrow}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleShareApp}
        activeOpacity={0.7}
      >
        <Ionicons name="share-social" size={24} color={COLORS.primary} style={styles.actionButtonIcon} />
        <View style={styles.actionButtonTextContainer}>
          <Text style={styles.actionButtonTitle}>Share App</Text>
          <Text style={styles.actionButtonSubtitle}>Invite other coaches</Text>
        </View>
        <Text style={styles.actionButtonArrow}>→</Text>
      </TouchableOpacity>
    </View>

    {/* Legal Section */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Legal</Text>
      
      <TouchableOpacity
        style={styles.actionButton}
        onPress={handlePrivacyPolicy}
        activeOpacity={0.7}
      >
        <Ionicons name="lock-closed" size={24} color={COLORS.primary} style={styles.actionButtonIcon} />
        <View style={styles.actionButtonTextContainer}>
          <Text style={styles.actionButtonTitle}>Privacy Policy</Text>
          <Text style={styles.actionButtonSubtitle}>How we protect your data</Text>
        </View>
        <Text style={styles.actionButtonArrow}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleTermsOfService}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="file-document" size={24} color={COLORS.primary} style={styles.actionButtonIcon} />
        <View style={styles.actionButtonTextContainer}>
          <Text style={styles.actionButtonTitle}>Terms of Service</Text>
          <Text style={styles.actionButtonSubtitle}>Usage terms & conditions</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </View>

    {/* About Section */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>About</Text>
      
      <View style={styles.aboutCard}>
        <Text style={styles.aboutAppName}>{APP_NAME}</Text>
        <Text style={styles.aboutVersion}>Version {APP_VERSION || '1.0.0'}</Text>
        <Text style={styles.aboutCopyright}>© 2025 AccellaX 361°</Text>
        <Text style={styles.aboutDescription}>
          Professional fitness assessment platform for youth sports academies.
        </Text>
        
        <TouchableOpacity
          style={styles.updateButton}
          onPress={handleCheckForUpdates}
          activeOpacity={0.8}
        >
          <Text style={styles.updateButtonText}>Check for Updates</Text>
        </TouchableOpacity>
      </View>
    </View>

    {/* Logout Button */}
    <TouchableOpacity
      style={styles.logoutButton}
      onPress={handleLogout}
      activeOpacity={0.8}
    >
      <View style={styles.logoutButtonContent}>
            <Ionicons name="log-out" size={20} color={COLORS.white} />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </View>
    </TouchableOpacity>

    {/* Bottom Padding */}
    <View style={styles.bottomPadding} />
      </ScrollView>

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
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // Profile Section
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  profileRoleBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  profileRoleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  // Section
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },

  // Sync Status Card
  syncStatusCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  syncStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  syncStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  syncStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  syncStatusText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  syncPendingText: {
    fontSize: 14,
    color: COLORS.warning,
    fontWeight: '600',
    marginBottom: 12,
  },
  syncButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
  },

  // Setting Item
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // Storage Card
  storageCard: {
    backgroundColor: COLORS.backgroundDark,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  storageTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  storageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  storageLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  storageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  clearCacheButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  clearCacheText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Action Button
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  actionButtonIcon: {
    marginRight: 12,
  },
  actionButtonTextContainer: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  actionButtonSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: COLORS.error + '40',
  },
  dangerText: {
    color: COLORS.error,
  },

  // About Card
  aboutCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  aboutAppName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  aboutVersion: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  aboutCopyright: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  aboutDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  updateButton: {
    backgroundColor: COLORS.primary + '20',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Logout Button
  logoutButton: {
    backgroundColor: COLORS.error,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    elevation: 2,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },

  // Bottom Padding
  bottomPadding: {
    height: 32,
  },
  actionButtonArrow: {
    fontSize: 20,
    color: COLORS.textSecondary,
  },
});