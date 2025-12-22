// Location: /apps/assessment/src/screens/Settings/SyncHistoryScreen.js
// Sync History Viewer - Phase 3.2

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Header from '../../components/common/Header';
import { COLORS } from '../../utils/constants';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getDatabase } from '../../database/db';

const isWeb = Platform.OS === 'web';

export default function SyncHistoryScreen() {
  const navigation = useNavigation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'success', 'failed'

  useEffect(() => {
    loadSyncHistory();
  }, []);

  const loadSyncHistory = async () => {
    try {
      if (isWeb) {
        const stored = await AsyncStorage.getItem('sync_history');
        const parsedHistory = stored ? JSON.parse(stored) : [];
        setHistory(parsedHistory.reverse()); // Most recent first
      } else {
        const db = getDatabase();
        const records = await db.getAllAsync(
          'SELECT * FROM sync_history ORDER BY started_at DESC LIMIT 100'
        );
        setHistory(records || []);
      }
    } catch (error) {
      console.error('Error loading sync history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSyncHistory();
  };

  const filteredHistory = history.filter((item) => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />;
      case 'failed':
        return <Ionicons name="close-circle" size={24} color={COLORS.error} />;
      case 'partial':
        return <Ionicons name="alert-circle" size={24} color={COLORS.warning} />;
      default:
        return <Ionicons name="help-circle" size={24} color={COLORS.textSecondary} />;
    }
  };

  const formatOperationType = (type) => {
    const typeMap = {
      upload_assessment: 'Upload Assessments',
      download_kids: 'Download Kids',
      upload_kids: 'Upload Kids',
      download_sports: 'Download Sports',
      upload_sports: 'Upload Sports',
      download_metrics: 'Download Metrics',
      upload_metrics: 'Upload Metrics',
      full_sync: 'Full Sync',
    };
    return typeMap[type] || type;
  };

  const formatDuration = (startedAt, completedAt) => {
    if (!completedAt) return 'In progress...';
    
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const durationMs = end - start;
    const seconds = Math.floor(durationMs / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
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
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Sync History"
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
        />
        <LoadingSpinner text="Loading history..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Sync History"
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
      />

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'all' && styles.filterTabTextActive,
            ]}
          >
            All ({history.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'success' && styles.filterTabActive]}
          onPress={() => setFilter('success')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'success' && styles.filterTabTextActive,
            ]}
          >
            Success ({history.filter((h) => h.status === 'success').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'failed' && styles.filterTabActive]}
          onPress={() => setFilter('failed')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'failed' && styles.filterTabTextActive,
            ]}
          >
            Failed ({history.filter((h) => h.status === 'failed').length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="history"
              size={80}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyTitle}>No Sync History</Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? 'Sync operations will appear here.'
                : `No ${filter} sync operations found.`}
            </Text>
          </View>
        ) : (
          filteredHistory.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                {getStatusIcon(item.status)}
                <View style={styles.historyInfo}>
                  <Text style={styles.operationType}>
                    {formatOperationType(item.operation_type)}
                  </Text>
                  <Text style={styles.timestamp}>{formatTimestamp(item.started_at)}</Text>
                </View>
                <Text style={styles.duration}>
                  {formatDuration(item.started_at, item.completed_at)}
                </Text>
              </View>

              {item.records_affected > 0 && (
                <View style={styles.recordsAffected}>
                  <Ionicons name="document-text" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.recordsText}>
                    {item.records_affected} record{item.records_affected > 1 ? 's' : ''}{' '}
                    affected
                  </Text>
                </View>
              )}

              {item.error_message && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                  <Text style={styles.errorText} numberOfLines={2}>
                    {item.error_message}
                  </Text>
                </View>
              )}
            </View>
          ))
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
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
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
  historyCard: {
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
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  operationType: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  duration: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  recordsAffected: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  recordsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    gap: 6,
    backgroundColor: COLORS.error + '10',
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.error,
  },
});