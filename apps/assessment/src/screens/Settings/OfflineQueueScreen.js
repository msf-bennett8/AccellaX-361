// Location: /apps/assessment/src/screens/Settings/OfflineQueueScreen.js
// Offline Queue Viewer - Phase 3.1

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/common/Header';
import { COLORS } from '../../utils/constants';
import {
  getQueuedOperations,
  retryOperation,
  clearQueue,
  getQueueStats,
  retryAllOperations,
} from '../../services/offlineQueueService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function OfflineQueueScreen() {
  const navigation = useNavigation();
  const [operations, setOperations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState(null);

  useEffect(() => {
    loadQueueData();
  }, []);

  const loadQueueData = async () => {
    try {
      const [queueOps, queueStats] = await Promise.all([
        getQueuedOperations(),
        getQueueStats(),
      ]);

      setOperations(queueOps);
      setStats(queueStats);
    } catch (error) {
      console.error('Error loading queue data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadQueueData();
  };

  const handleRetryOperation = async (operationId) => {
    setRetrying(operationId);
    try {
      const result = await retryOperation(operationId);
      
      if (result.success) {
        Alert.alert('Success', 'Operation synced successfully!');
        await loadQueueData();
      } else {
        Alert.alert('Retry Failed', result.error || 'Please try again later.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to retry operation.');
    } finally {
      setRetrying(null);
    }
  };

  const handleRetryAll = async () => {
    Alert.alert(
      'Retry All',
      `Retry all ${operations.length} pending operations?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retry All',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await retryAllOperations();
              Alert.alert(
                'Retry Complete',
                `Success: ${result.successCount}\nFailed: ${result.failCount}`
              );
              await loadQueueData();
            } catch (error) {
              Alert.alert('Error', 'Failed to retry operations.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleClearQueue = async () => {
    Alert.alert(
      'Clear Queue',
      'This will permanently remove all pending operations. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearQueue();
              Alert.alert('Success', 'Queue cleared successfully!');
              await loadQueueData();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear queue.');
            }
          },
        },
      ]
    );
  };

  const getOperationIcon = (type) => {
    const icons = {
      upload_assessment: 'clipboard-text',
      upload_kid: 'account-plus',
      upload_sport: 'soccer',
      upload_metric: 'ruler',
      upload_note: 'note-text',
      update_assessment: 'clipboard-edit',
      delete_assessment: 'delete',
    };
    return icons[type] || 'file-document';
  };

  const formatOperationType = (type) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Offline Queue"
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
        />
        <LoadingSpinner text="Loading queue..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Offline Queue"
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Stats Card */}
        {stats && (
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.failedCount}</Text>
                <Text style={styles.statLabel}>Failed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.oldestAge}h</Text>
                <Text style={styles.statLabel}>Oldest</Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        {operations.length > 0 && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleRetryAll}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Retry All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={handleClearQueue}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Clear Queue</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Operations List */}
        {operations.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="cloud-check"
              size={80}
              color={COLORS.success}
            />
            <Text style={styles.emptyTitle}>All Synced!</Text>
            <Text style={styles.emptyText}>
              No pending operations. All data is synced to the cloud.
            </Text>
          </View>
        ) : (
          <View style={styles.operationsList}>
            <Text style={styles.sectionTitle}>
              Pending Operations ({operations.length})
            </Text>

            {operations.map((operation) => (
              <View key={operation.id} style={styles.operationCard}>
                <View style={styles.operationHeader}>
                  <MaterialCommunityIcons
                    name={getOperationIcon(operation.type)}
                    size={24}
                    color={operation.retry_count > 0 ? COLORS.error : COLORS.primary}
                  />
                  <View style={styles.operationInfo}>
                    <Text style={styles.operationType}>
                      {formatOperationType(operation.type)}
                    </Text>
                    <Text style={styles.operationTime}>
                      {formatTimestamp(operation.created_at)}
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => handleRetryOperation(operation.id)}
                    disabled={retrying === operation.id}
                    activeOpacity={0.7}
                  >
                    {retrying === operation.id ? (
                      <Text style={styles.retryingText}>...</Text>
                    ) : (
                      <Ionicons name="refresh" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                </View>

                {operation.retry_count > 0 && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                    <Text style={styles.errorText}>
                      Failed {operation.retry_count} time{operation.retry_count > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}

                {operation.last_error && (
                  <Text style={styles.errorMessage} numberOfLines={2}>
                    {operation.last_error}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
    padding: 20,
  },
  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  dangerButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  operationsList: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  operationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  operationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  operationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  operationType: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  operationTime: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  retryButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryingText: {
    fontSize: 20,
    color: COLORS.primary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
  },
  errorMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
});