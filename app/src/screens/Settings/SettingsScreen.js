// src/screens/Settings/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../utils/constants';
import { formatDateLong } from '../../utils/dateUtils';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import { performFullSync, getSyncStatus } from '../../database/sync';
import {
  getAllKids,
  getAllSessions,
  getDatabase,
} from '../../database/db';
import { getCurrentUserId, logoutUser } from '../../utils/auth';
import {
  removeTestData,
  removeDuplicateKids,
  getDatabaseStats,
  exportDatabaseJSON,
  clearAllData,
} from '../../utils/dataCleanup';

const SettingsScreen = ({ navigation }) => {
  const [academyName, setAcademyName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [lastSyncDate, setLastSyncDate] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState({
    totalKids: 0,
    totalSessions: 0,
    activeKids: 0,
  });
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'info', // 'info', 'success', 'error', 'confirm'
    onConfirm: null,
    confirmText: 'OK',
    cancelText: 'Cancel',
    isProcessing: false,
  });

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  const loadSettings = async () => {
    try {
      const name = await AsyncStorage.getItem('academyName');
      const autoSyncEnabled = await AsyncStorage.getItem('autoSync');
      const lastSync = await AsyncStorage.getItem('lastSyncDate');
      
      setAcademyName(name || '');
      setAutoSync(autoSyncEnabled !== 'false');
      setLastSyncDate(lastSync ? new Date(lastSync) : null);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const userId = await getCurrentUserId();
      
      if (!userId) {
        console.warn('⚠️ No user ID found');
        return;
      }
      
      console.log(`📊 Loading stats from academy collection...`);
      
      // Load kids from Firebase academy collection
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('../../config/firebase');
      
      const academyId = (await AsyncStorage.default.getItem('academyId')) || 'academy_accellax361_main';
      const kidsRef = collection(db, `academies/${academyId}/kids`);
      const snapshot = await getDocs(kidsRef);
      
      const academyKids = [];
      snapshot.forEach(doc => {
        const kid = doc.data();
        academyKids.push({
          id: parseInt(kid.id) || kid.id,
          status: kid.status || 'active',
        });
      });
      
      // Get database stats
      const dbStats = await getDatabaseStats();
      
      const totalKids = academyKids.length;
      const activeKids = academyKids.filter(k => k.status === 'active').length;
      
      console.log(`📊 Stats: ${totalKids} total kids, ${activeKids} active kids`);
      
      setStats({
        totalKids,
        activeKids,
        totalSessions: dbStats?.totalSessions || 0,
        duplicates: dbStats?.duplicates || 0,
        testData: dbStats?.testData || 0,
        storageMode: dbStats?.storageMode || 'Firebase',
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Modal helper
  const showModal = (config) => {
    setModalConfig({ ...config, isProcessing: false });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleSaveAcademyName = async () => {
    if (!tempName.trim()) {
      showModal({
        title: 'Error',
        message: 'Academy name cannot be empty',
        type: 'error',
      });
      return;
    }

    try {
      await AsyncStorage.setItem('academyName', tempName.trim());
      setAcademyName(tempName.trim());
      setEditingName(false);
      showModal({
        title: 'Success',
        message: 'Academy name updated successfully',
        type: 'success',
      });
    } catch (error) {
      showModal({
        title: 'Error',
        message: 'Failed to update academy name',
        type: 'error',
      });
    }
  };

  const handleCancelEdit = () => {
    setTempName(academyName);
    setEditingName(false);
  };

  const handleToggleAutoSync = async (value) => {
    try {
      await AsyncStorage.setItem('autoSync', value.toString());
      setAutoSync(value);
    } catch (error) {
      showModal({
        title: 'Error',
        message: 'Failed to update sync settings',
        type: 'error',
      });
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    
    try {
      const userId = await AsyncStorage.getItem('currentUserId');
      
      if (!userId) {
        showModal({
          title: 'No User Found',
          message: 'Please log in or create an account first',
          type: 'error',
        });
        setSyncing(false);
        return;
      }
      
      const { performFullSync } = require('../../database/sync');
      const result = await performFullSync(userId);
      
      const hasData = result.results && (
        result.results.kidsUploaded > 0 || 
        result.results.sessionsUploaded > 0 || 
        result.results.kidsDownloaded > 0 || 
        result.results.sessionsDownloaded > 0
      );
      
      const onlyUserProfileError = result.results?.errors?.length === 1 && 
        result.results.errors[0].includes('User profile');
      
      const syncSuccessful = result.success || hasData || onlyUserProfileError;
      
      if (syncSuccessful) {
        setLastSyncDate(new Date(result.timestamp));
        await AsyncStorage.setItem('lastSyncDate', new Date(result.timestamp).toISOString());
        await loadStats();
        
        showModal({
          title: 'Sync Complete',
          message: `Uploaded:\n• ${result.results.kidsUploaded} kids\n• ${result.results.sessionsUploaded} sessions\n\nDownloaded:\n• ${result.results.kidsDownloaded} kids\n• ${result.results.sessionsDownloaded} sessions`,
          type: 'success',
        });
      } else {
        showModal({
          title: 'Sync Failed',
          message: result.message || result.error || 'Failed to sync data',
          type: 'error',
        });
      }
    } catch (error) {
      showModal({
        title: 'Sync Error',
        message: error.message,
        type: 'error',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleRemoveTestData = () => {
    if (stats.testData === 0) {
      showModal({
        title: 'No Test Data',
        message: 'No test data found in the database',
        type: 'info',
      });
      return;
    }

    showModal({
      title: 'Remove Test Data',
      message: `Found ${stats.testData} test kid${stats.testData > 1 ? 's' : ''}.\n\nThis will permanently delete them from the database.\n\nContinue?`,
      type: 'confirm',
      confirmText: 'Remove',
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isProcessing: true }));
        
        const result = await removeTestData();
        
        if (result.success) {
          await loadStats();
          closeModal();
          setTimeout(() => {
            showModal({
              title: 'Success',
              message: `Removed ${result.count} test kid${result.count > 1 ? 's' : ''}`,
              type: 'success',
            });
          }, 300);
        } else {
          setModalConfig(prev => ({ ...prev, isProcessing: false }));
          showModal({
            title: 'Error',
            message: result.error || 'Failed to remove test data',
            type: 'error',
          });
        }
      },
    });
  };

  const handleRemoveDuplicates = () => {
    if (stats.duplicates === 0) {
      showModal({
        title: 'No Duplicates',
        message: 'No duplicate entries found in the database',
        type: 'info',
      });
      return;
    }

    showModal({
      title: 'Remove Duplicates',
      message: `Found ${stats.duplicates} duplicate ${stats.duplicates > 1 ? 'entries' : 'entry'}.\n\nThis will keep the oldest entry and remove duplicates.\n\nContinue?`,
      type: 'confirm',
      confirmText: 'Remove',
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isProcessing: true }));
        
        const result = await removeDuplicateKids();
        
        if (result.success) {
          await loadStats();
          closeModal();
          setTimeout(() => {
            showModal({
              title: 'Success',
              message: `Removed ${result.count} duplicate${result.count > 1 ? 's' : ''}`,
              type: 'success',
            });
          }, 300);
        } else {
          setModalConfig(prev => ({ ...prev, isProcessing: false }));
          showModal({
            title: 'Error',
            message: result.error || 'Failed to remove duplicates',
            type: 'error',
          });
        }
      },
    });
  };

  const handleExportData = async () => {
    const result = await exportDatabaseJSON();
    if (result.success) {
      if (Platform.OS === 'web' && navigator.clipboard) {
        await navigator.clipboard.writeText(result.data);
        showModal({
          title: 'Success',
          message: 'Data copied to clipboard!\n\nYou can now paste it into a text file to save.',
          type: 'success',
        });
      } else {
        console.log('Export data:', result.data);
        showModal({
          title: 'Success',
          message: 'Data exported! Check browser console to copy.',
          type: 'success',
        });
      }
    } else {
      showModal({
        title: 'Error',
        message: result.error || 'Failed to export data',
        type: 'error',
      });
    }
  };

  const handleClearAllData = () => {
    showModal({
      title: 'Clear All Data',
      message: `⚠️ WARNING\n\nThis will permanently delete:\n\n• All kids (${stats.totalKids})\n• All sessions (${stats.totalSessions})\n• All attendance records\n\nThis action CANNOT be undone!\n\nAre you sure?`,
      type: 'confirm',
      confirmText: 'Delete Everything',
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isProcessing: true }));
        
        const result = await clearAllData();
        
        if (result.success) {
          await loadStats();
          closeModal();
          setTimeout(() => {
            showModal({
              title: 'Success',
              message: 'All data has been cleared successfully',
              type: 'success',
            });
          }, 300);
        } else {
          setModalConfig(prev => ({ ...prev, isProcessing: false }));
          showModal({
            title: 'Error',
            message: result.error || 'Failed to clear data',
            type: 'error',
          });
        }
      },
    });
  };

  const handleTestFirebaseConnection = async () => {
    console.log('🔥 Testing Firebase connection...');
    
    try {
      const userId = await AsyncStorage.getItem('currentUserId');
      
      if (!userId) {
        showModal({
          title: 'No User Found',
          message: 'Please log in or create an account first',
          type: 'error',
        });
        return;
      }
      
      const { performFullSync } = require('../../database/sync');
      const result = await performFullSync(userId);
      
      showModal({
        title: result.success ? 'Firebase Connected!' : 'Connection Failed',
        message: result.success 
          ? `Uploaded:\n• ${result.results.kidsUploaded} kids\n• ${result.results.sessionsUploaded} sessions\n\nDownloaded:\n• ${result.results.kidsDownloaded} kids\n• ${result.results.sessionsDownloaded} sessions`
          : result.message || 'Check console for errors',
        type: result.success ? 'success' : 'error',
      });
    } catch (error) {
      console.error('Firebase test error:', error);
      showModal({
        title: 'Error',
        message: error.message,
        type: 'error',
      });
    }
  };

  const handleResetApp = () => {
    showModal({
      title: 'Reset App',
      message: 'This will reset the app to initial state.\n\nYou will need to go through onboarding again.\n\nContinue?',
      type: 'confirm',
      confirmText: 'Reset',
      onConfirm: async () => {
        try {
          await AsyncStorage.clear();
          closeModal();
          
          setTimeout(() => {
            showModal({
              title: 'App Reset',
              message: 'The app has been reset successfully.\n\nThe app will now restart.',
              type: 'success',
              onConfirm: () => {
                closeModal();
                setTimeout(() => {
                  if (global.handleAppLogout) {
                    global.handleAppLogout();
                  } else if (Platform.OS === 'web') {
                    window.location.href = '/';
                  }
                }, 300);
              },
            });
          }, 300);
        } catch (error) {
          showModal({
            title: 'Error',
            message: 'Failed to reset app',
            type: 'error',
          });
        }
      },
    });
  };

  const handleLogoutAndClearEverything = () => {
    showModal({
      title: 'Nuclear Option',
      message: `⚠️ FINAL WARNING\n\nThis will:\n\n• Logout your account\n• Delete ALL kids (${stats.totalKids})\n• Delete ALL sessions (${stats.totalSessions})\n• Delete ALL attendance records\n• Reset academy settings\n\nThis is IRREVERSIBLE!\n\nAre you ABSOLUTELY sure?`,
      type: 'confirm',
      confirmText: 'Continue',
      onConfirm: () => {
        closeModal();
        
        // DOUBLE CONFIRMATION
        setTimeout(() => {
          showModal({
            title: 'Last Chance',
            message: 'This is your final warning.\n\nAll data will be permanently deleted.\n\nContinue?',
            type: 'confirm',
            confirmText: 'DELETE EVERYTHING',
            onConfirm: async () => {
              setModalConfig(prev => ({ ...prev, isProcessing: true }));
              
              try {
                // 1. Clear all database data
                const clearResult = await clearAllData();
                
                if (!clearResult.success) {
                  throw new Error(clearResult.error || 'Failed to clear data');
                }
                
                // 2. Logout user
                const logoutResult = await logoutUser();
                
                if (!logoutResult.success) {
                  throw new Error(logoutResult.error || 'Failed to logout');
                }
                
                // 3. Clear ALL AsyncStorage
                await AsyncStorage.clear();
                
                // 4. Show success and navigate
                closeModal();
                
                setTimeout(() => {
                  showModal({
                    title: 'Complete Reset',
                    message: 'All data cleared and logged out successfully.\n\nThe app will now restart.',
                    type: 'success',
                    onConfirm: () => {
                      closeModal();
                      
                      setTimeout(() => {
                        if (global.handleAppLogout) {
                          global.handleAppLogout();
                        } else if (Platform.OS === 'web') {
                          window.location.href = '/';
                        }
                      }, 300);
                    },
                  });
                }, 300);
                
              } catch (error) {
                console.error('Error during nuclear clear:', error);
                setModalConfig(prev => ({ ...prev, isProcessing: false }));
                showModal({
                  title: 'Error',
                  message: `Failed to complete operation:\n\n${error.message}`,
                  type: 'error',
                });
              }
            },
          });
        }, 300);
      },
    });
  };

  const renderModal = () => {
    const isConfirm = modalConfig.type === 'confirm';
    const iconMap = {
      info: '💡',
      success: '✅',
      error: '❌',
      confirm: '⚠️',
    };

    const colorMap = {
      info: COLORS.primary,
      success: COLORS.present,
      error: COLORS.absent,
      confirm: COLORS.primary, // Changed from warning to primary (blue)
    };

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalHeader, { backgroundColor: colorMap[modalConfig.type] + '15' }]}>
              <Text style={styles.modalIcon}>{iconMap[modalConfig.type]}</Text>
              <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>{modalConfig.message}</Text>
            </View>
            
            <View style={styles.modalFooter}>
              {isConfirm && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={closeModal}
                  disabled={modalConfig.isProcessing}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalCancelText}>{modalConfig.cancelText}</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  isConfirm ? styles.modalConfirmButton : styles.modalOkButton,
                  { backgroundColor: colorMap[modalConfig.type] },
                  modalConfig.isProcessing && styles.modalButtonDisabled,
                ]}
                onPress={() => {
                  if (!isConfirm) {
                    closeModal();
                    if (modalConfig.onConfirm) {
                      setTimeout(() => modalConfig.onConfirm(), 300);
                    }
                  } else if (modalConfig.onConfirm) {
                    modalConfig.onConfirm();
                  }
                }}
                disabled={modalConfig.isProcessing}
                activeOpacity={0.8}
              >
                {modalConfig.isProcessing ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.modalConfirmText}>
                    {isConfirm ? modalConfig.confirmText : 'OK'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderAcademyInfo = () => (
    <Card style={styles.section}>
      <Text style={styles.sectionTitle}>Academy Information</Text>
      
      {editingName ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.input}
            value={tempName}
            onChangeText={setTempName}
            placeholder="Enter academy name"
            autoFocus
          />
          <View style={styles.editButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancelEdit}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSaveAcademyName}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Text style={styles.label}>Academy Name</Text>
            <Text style={styles.value}>{academyName || 'Not set'}</Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              setTempName(academyName);
              setEditingName(true);
            }}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );

  const renderDataStats = () => (
    <Card style={styles.section}>
      <Text style={styles.sectionTitle}>Data Statistics</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalKids}</Text>
          <Text style={styles.statLabel}>Total Kids</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.activeKids}</Text>
          <Text style={styles.statLabel}>Active Kids</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalSessions}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
      </View>

      {(stats.testData > 0 || stats.duplicates > 0) && (
        <View style={styles.cleanupWarning}>
          <Text style={styles.cleanupWarningIcon}>⚠️</Text>
          <View style={styles.cleanupWarningContent}>
            <Text style={styles.cleanupWarningTitle}>Data Issues Found</Text>
            {stats.testData > 0 && (
              <Text style={styles.cleanupWarningText}>
                • {stats.testData} test kid{stats.testData > 1 ? 's' : ''}
              </Text>
            )}
            {stats.duplicates > 0 && (
              <Text style={styles.cleanupWarningText}>
                • {stats.duplicates} duplicate{stats.duplicates > 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.storageInfo}>
        <Text style={styles.storageLabel}>Storage Mode:</Text>
        <Text style={styles.storageValue}>{stats.storageMode || 'Unknown'}</Text>
      </View>
    </Card>
  );

  const renderSyncSettings = () => (
    <Card style={styles.section}>
      <Text style={styles.sectionTitle}>Firebase Sync</Text>
      
      <View style={styles.syncRow}>
        <View style={styles.syncLeft}>
          <Text style={styles.syncLabel}>Auto-sync when online</Text>
          <Text style={styles.syncDescription}>
            Automatically sync data to cloud when connected
          </Text>
        </View>
        <Switch
          value={autoSync}
          onValueChange={handleToggleAutoSync}
          trackColor={{ false: COLORS.textSecondary, true: COLORS.primary }}
          thumbColor={COLORS.white}
        />
      </View>

      <View style={styles.syncInfo}>
        <View style={styles.syncStatus}>
          <Text style={styles.syncStatusLabel}>Last Sync:</Text>
          <Text style={styles.syncStatusValue}>
            {lastSyncDate ? formatDateLong(lastSyncDate) : 'Never'}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
          onPress={handleManualSync}
          disabled={syncing}
        >
          {syncing ? (
            <>
              <ActivityIndicator size="small" color={COLORS.white} />
              <Text style={[styles.syncButtonText, { marginLeft: 8 }]}>Syncing...</Text>
            </>
          ) : (
            <Text style={styles.syncButtonText}>🔄 Sync Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderDataManagement = () => (
    <Card style={styles.section}>
      <Text style={styles.sectionTitle}>Data Management</Text>
      
      {stats.testData > 0 && (
        <TouchableOpacity
          style={[styles.actionButton, styles.cleanupButton]}
          onPress={handleRemoveTestData}
        >
          <Text style={styles.actionButtonIcon}>🧹</Text>
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionButtonTitle}>
              Remove Test Data ({stats.testData})
            </Text>
            <Text style={styles.actionButtonDescription}>
              Clean up test kids from database
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {stats.duplicates > 0 && (
        <TouchableOpacity
          style={[styles.actionButton, styles.cleanupButton]}
          onPress={handleRemoveDuplicates}
        >
          <Text style={styles.actionButtonIcon}>🔄</Text>
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionButtonTitle}>
              Remove Duplicates ({stats.duplicates})
            </Text>
            <Text style={styles.actionButtonDescription}>
              Remove duplicate kid entries
            </Text>
          </View>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.actionButton, styles.exportButton]}
        onPress={handleExportData}
      >
        <Text style={styles.actionButtonIcon}>📤</Text>
        <View style={styles.actionButtonContent}>
          <Text style={styles.actionButtonTitle}>Export All Data</Text>
          <Text style={styles.actionButtonDescription}>
            Copy backup data to clipboard
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.exportButton]}
        onPress={handleTestFirebaseConnection}
      >
        <Text style={styles.actionButtonIcon}>🔥</Text>
        <View style={styles.actionButtonContent}>
          <Text style={styles.actionButtonTitle}>Test Firebase Connection</Text>
          <Text style={styles.actionButtonDescription}>
            Verify cloud sync is working
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.dangerButton]}
        onPress={handleClearAllData}
      >
        <Text style={styles.actionButtonIcon}>🗑️</Text>
        <View style={styles.actionButtonContent}>
          <Text style={[styles.actionButtonTitle, { color: COLORS.absent }]}>
            Clear All Data
          </Text>
          <Text style={styles.actionButtonDescription}>
            Delete all kids, sessions, and attendance
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.nuclearButton]}
        onPress={handleLogoutAndClearEverything}
      >
        <Text style={styles.actionButtonIcon}>☢️</Text>
        <View style={styles.actionButtonContent}>
          <Text style={[styles.actionButtonTitle, { color: '#D32F2F' }]}>
            Logout & Clear Everything
          </Text>
          <Text style={styles.actionButtonDescription}>
            Logout + delete all data (nuclear option)
          </Text>
        </View>
      </TouchableOpacity>
    </Card>
  );

  const renderAppInfo = () => (
    <Card style={styles.section}>
      <Text style={styles.sectionTitle}>About</Text>
      
      <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>App Version</Text>
        <Text style={styles.infoValue}>1.0.0</Text>
      </View>
      
      <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>App Name</Text>
        <Text style={styles.infoValue}>AccellaX 361°</Text>
      </View>
      
      <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>Developer</Text>
        <Text style={styles.infoValue}>NextGen MultiSport Academy</Text>
      </View>

      <TouchableOpacity
        style={[styles.actionButton, styles.resetButton]}
        onPress={handleResetApp}
      >
        <Text style={styles.actionButtonIcon}>⚠️</Text>
        <View style={styles.actionButtonContent}>
          <Text style={[styles.actionButtonTitle, { color: COLORS.warning }]}>
            Reset App
          </Text>
          <Text style={styles.actionButtonDescription}>
            Reset to initial state (requires restart)
          </Text>
        </View>
      </TouchableOpacity>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Settings"
          leftIcon="☰"
          onLeftPress={() => navigation.openDrawer()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Settings"
        leftIcon="☰"
        onLeftPress={() => navigation.openDrawer()}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderAcademyInfo()}
        {renderDataStats()}
        {renderSyncSettings()}
        {renderDataManagement()}
        {renderAppInfo()}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for coaches
          </Text>
          <Text style={styles.footerSubtext}>
            AccellaX 361° © 2024
          </Text>
        </View>
      </ScrollView>

      {renderModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Modal Styles - IMPROVED
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  modalIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  modalMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    overflow: 'hidden',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalCancelButton: {
    backgroundColor: COLORS.white,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  modalConfirmButton: {
    // backgroundColor set dynamically
  },
  modalOkButton: {
    // backgroundColor set dynamically
  },
  modalCancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000', // Pure black for maximum visibility
  },
  modalConfirmText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.white,
  },

  // Section
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },

  // Academy Info
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLeft: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  editContainer: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.textSecondary + '40',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  saveButton: {
    backgroundColor: COLORS.present,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Sync Settings
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  syncLeft: {
    flex: 1,
    marginRight: 16,
  },
  syncLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  syncDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  syncInfo: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  syncStatusLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  syncStatusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  syncButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },

  // Action Buttons
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: COLORS.background,
  },
  actionButtonIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  actionButtonContent: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  actionButtonDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  exportButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: COLORS.absent,
  },
  nuclearButton: {
    borderWidth: 2,
    borderColor: '#D32F2F',
    backgroundColor: '#FFEBEE',
  },
  resetButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  cleanupButton: {
    borderWidth: 1,
    borderColor: COLORS.warning,
  },

  // App Info
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  infoLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Cleanup Warning
  cleanupWarning: {
    flexDirection: 'row',
    backgroundColor: COLORS.warning + '20',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  cleanupWarningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cleanupWarningContent: {
    flex: 1,
  },
  cleanupWarningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  cleanupWarningText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  storageInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
  },
  storageLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginRight: 6,
  },
  storageValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

export default SettingsScreen;