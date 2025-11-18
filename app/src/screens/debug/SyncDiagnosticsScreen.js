// src/screens/Debug/SyncDiagnosticsScreen.js
// Debug screen to view sync logs and diagnostics

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { COLORS } from '../../utils/constants';
import Header from '../../components/common/Header';
import {
  getSyncDebugLogs,
  clearSyncDebugLogs,
  getSyncDiagnostics,
  exportSyncLogs,
  performFullSync,
  resetSyncStatus,
} from '../../database/sync';
import { cleanupDuplicateKids, getDuplicateStats } from '../../database/sync';
import { getCurrentUserId } from '../../utils/auth';

const SyncDiagnosticsScreen = ({ navigation }) => {
  const [logs, setLogs] = useState([]);
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [debugLogs, diag] = await Promise.all([
        getSyncDebugLogs(),
        getSyncDiagnostics(),
      ]);
      
      setLogs(debugLogs.reverse()); // Most recent first
      setDiagnostics(diag);
    } catch (error) {
      console.error('Error loading diagnostics:', error);
      Alert.alert('Error', 'Failed to load diagnostics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleClearLogs = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all debug logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearSyncDebugLogs();
            loadData();
          },
        },
      ]
    );
  };

  const handleExportLogs = async () => {
    try {
      await exportSyncLogs();
      Alert.alert('Success', 'Logs exported to console. Check your developer tools.');
    } catch (error) {
      Alert.alert('Error', 'Failed to export logs');
    }
  };

  const handleForceSync = async () => {
    Alert.alert(
      'Force Sync',
      'This will perform a full sync now. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync',
          onPress: async () => {
            try {
              setSyncing(true);
              const userId = await getCurrentUserId();
              const result = await performFullSync(userId);
              
              if (result.success) {
                Alert.alert(
                  'Sync Complete',
                  `Uploaded: ${result.results.kidsUploaded} kids, ${result.results.sessionsUploaded} sessions\n` +
                  `Downloaded: ${result.results.kidsDownloaded} kids, ${result.results.sessionsDownloaded} sessions`
                );
              } else {
                Alert.alert('Sync Failed', result.message || 'Unknown error');
              }
              
              loadData();
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setSyncing(false);
            }
          },
        },
      ]
    );
  };

  const handleResetSyncStatus = () => {
    Alert.alert(
      'Reset Sync Status',
      'This will mark all records as unsynced. Use this if sync is stuck. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetSyncStatus();
              Alert.alert('Success', 'Sync status reset. All records marked as unsynced.');
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to reset sync status');
            }
          },
        },
      ]
    );
  };

  const getCategoryColor = (category) => {
    const colors = {
      ERROR: '#EF4444',
      USER_UPLOAD: '#3B82F6',
      USER_DOWNLOAD: '#10B981',
      KIDS_UPLOAD: '#8B5CF6',
      KIDS_DOWNLOAD: '#EC4899',
      SESSIONS_UPLOAD: '#F59E0B',
      SESSIONS_DOWNLOAD: '#14B8A6',
      FULL_SYNC: '#6366F1',
      AUTO_SYNC: '#059669',
      CONFLICTS: '#DC2626',
      DIAGNOSTICS: '#6B7280',
      SYSTEM: '#9CA3AF',
    };
    return colors[category] || '#6B7280';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading diagnostics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Sync Diagnostics"
        subtitle="Debug & Troubleshoot Sync"
        leftText="Back"
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Diagnostics Summary */}
        {diagnostics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Status</Text>
            <View style={styles.diagCard}>
              <DiagnosticRow label="User ID" value={diagnostics.userId || 'Not logged in'} />
              <DiagnosticRow label="Academy ID" value={diagnostics.academyId} />
              <DiagnosticRow 
                label="Last Sync" 
                value={diagnostics.lastSyncTimestamp} 
                valueColor={diagnostics.lastSyncTimestamp === 'Never' ? COLORS.error : COLORS.text}
              />
              <DiagnosticRow 
                label="Online" 
                value={diagnostics.isOnline ? 'Yes' : 'No'} 
                valueColor={diagnostics.isOnline ? COLORS.success : COLORS.error}
              />
              <DiagnosticRow 
                label="Currently Syncing" 
                value={diagnostics.isSyncing ? 'Yes' : 'No'} 
                valueColor={diagnostics.isSyncing ? COLORS.warning : COLORS.text}
              />
              <DiagnosticRow 
                label="Firebase User Exists" 
                value={diagnostics.firebaseUserExists ? 'Yes' : 'No'} 
                valueColor={diagnostics.firebaseUserExists ? COLORS.success : COLORS.error}
              />
            </View>

            <View style={styles.diagCard}>
              <Text style={styles.cardTitle}>Local Data</Text>
              <DiagnosticRow label="Total Kids" value={diagnostics.local.totalKids.toString()} />
              <DiagnosticRow label="Total Sessions" value={diagnostics.local.totalSessions.toString()} />
              <DiagnosticRow 
                label="Unsynced Kids" 
                value={diagnostics.local.unsyncedKids.toString()} 
                valueColor={diagnostics.local.unsyncedKids > 0 ? COLORS.warning : COLORS.success}
              />
              <DiagnosticRow 
                label="Unsynced Sessions" 
                value={diagnostics.local.unsyncedSessions.toString()} 
                valueColor={diagnostics.local.unsyncedSessions > 0 ? COLORS.warning : COLORS.success}
              />
            </View>

            {diagnostics.syncErrors && diagnostics.syncErrors.length > 0 && (
              <View style={[styles.diagCard, styles.errorCard]}>
                <Text style={styles.cardTitle}>Recent Errors</Text>
                {diagnostics.syncErrors.map((error, index) => (
                  <Text key={index} style={styles.errorText}>• {error}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleForceSync}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Force Sync Now</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.warningButton]}
            onPress={handleResetSyncStatus}
          >
            <Text style={styles.warningButtonText}>Reset Sync Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleExportLogs}
          >
            <Text style={styles.secondaryButtonText}>Export Logs to Console</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleClearLogs}
          >
            <Text style={styles.dangerButtonText}>Clear Debug Logs</Text>
          </TouchableOpacity>
        </View>

        {/* Debug Logs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Debug Logs ({logs.length})
          </Text>
          {logs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No debug logs yet</Text>
            </View>
          ) : (
            logs.map((log, index) => (
              <View key={index} style={styles.logItem}>
                <View style={styles.logHeader}>
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: getCategoryColor(log.category) },
                    ]}
                  >
                    <Text style={styles.categoryText}>{log.category}</Text>
                  </View>
                  <Text style={styles.logTimestamp}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={styles.logMessage}>{log.message}</Text>
                {log.data && (
                  <View style={styles.logData}>
                    <Text style={styles.logDataText}>
                      {JSON.stringify(log.data, null, 2)}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const DiagnosticRow = ({ label, value, valueColor = COLORS.text }) => (
  <View style={styles.diagRow}>
    <Text style={styles.diagLabel}>{label}:</Text>
    <Text style={[styles.diagValue, { color: valueColor }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  diagCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorCard: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  diagLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  diagValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    marginBottom: 4,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  warningButton: {
    backgroundColor: COLORS.warning,
  },
  warningButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  dangerButtonText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
  },
  logItem: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  logTimestamp: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  logMessage: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  logData: {
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
    padding: 8,
    marginTop: 4,
  },
  logDataText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});

export default SyncDiagnosticsScreen;