// Location: /apps/assessment/src/screens/Settings/ConflictResolutionScreen.js
// UI to show and resolve sync conflicts

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { COLORS } from '../../utils/constants';
import {
  getConflictQueue,
  resolveConflict,
  getConflictStats,
  clearResolvedConflicts,
} from '../../services/conflictResolutionService';

const ConflictResolutionScreen = ({ navigation }) => {
  const [conflicts, setConflicts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState(null);

  useEffect(() => {
    loadConflicts();
  }, []);

  const loadConflicts = async () => {
    try {
      const queue = await getConflictQueue();
      const statistics = await getConflictStats();
      
      setConflicts(queue.filter(c => c.status === 'pending'));
      setStats(statistics);
    } catch (error) {
      console.error('Error loading conflicts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadConflicts();
  };

  const handleResolve = async (conflictId, resolution) => {
    try {
      const result = await resolveConflict(conflictId, resolution);
      
      if (result.success) {
        // Remove from list
        setConflicts(prev => prev.filter(c => c.id !== conflictId));
        setSelectedConflict(null);
        
        // Reload stats
        const statistics = await getConflictStats();
        setStats(statistics);
      }
    } catch (error) {
      console.error('Error resolving conflict:', error);
    }
  };

  const handleClearResolved = async () => {
    try {
      await clearResolvedConflicts();
      const statistics = await getConflictStats();
      setStats(statistics);
    } catch (error) {
      console.error('Error clearing resolved conflicts:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Sync Conflicts"
          leftIcon="←"
          onLeftPress={() => navigation.goBack()}
          showAvatar={false}
        />
        <LoadingSpinner overlay text="Loading conflicts..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Sync Conflicts"
        leftIcon="←"
        onLeftPress={() => navigation.goBack()}
        showAvatar={false}
      />

      {/* Stats Card */}
      {stats && (
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.success }]}>
                {stats.resolved}
              </Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
          
          {stats.resolved > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearResolved}
            >
              <Text style={styles.clearButtonText}>Clear Resolved</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {conflicts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
            <Text style={styles.emptyTitle}>No Conflicts</Text>
            <Text style={styles.emptyText}>
              All your data is synced without conflicts
            </Text>
          </View>
        ) : (
          conflicts.map((conflict) => (
            <ConflictCard
              key={conflict.id}
              conflict={conflict}
              onResolve={handleResolve}
              isExpanded={selectedConflict === conflict.id}
              onToggle={() =>
                setSelectedConflict(
                  selectedConflict === conflict.id ? null : conflict.id
                )
              }
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const ConflictCard = ({ conflict, onResolve, isExpanded, onToggle }) => {
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <View style={styles.conflictCard}>
      <TouchableOpacity style={styles.conflictHeader} onPress={onToggle}>
        <View style={styles.conflictHeaderLeft}>
          <Ionicons name="git-merge" size={24} color={COLORS.error} />
          <View style={styles.conflictInfo}>
            <Text style={styles.conflictTitle}>
              {conflict.type || 'Assessment'} Conflict
            </Text>
            <Text style={styles.conflictDate}>
              {formatTimestamp(conflict.queuedAt)}
            </Text>
          </View>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.conflictDetails}>
          {/* Local Version */}
          <View style={styles.versionCard}>
            <View style={styles.versionHeader}>
              <Ionicons name="phone-portrait" size={20} color={COLORS.primary} />
              <Text style={styles.versionTitle}>Local Version</Text>
            </View>
            <Text style={styles.versionText}>
              {JSON.stringify(conflict.localData, null, 2)}
            </Text>
          </View>

          {/* Remote Version */}
          <View style={styles.versionCard}>
            <View style={styles.versionHeader}>
              <Ionicons name="cloud" size={20} color={COLORS.primary} />
              <Text style={styles.versionTitle}>Remote Version</Text>
            </View>
            <Text style={styles.versionText}>
              {JSON.stringify(conflict.firebaseData, null, 2)}
            </Text>
          </View>

          {/* Resolution Buttons */}
          <View style={styles.resolutionButtons}>
            <TouchableOpacity
              style={[styles.resolutionButton, styles.localButton]}
              onPress={() => onResolve(conflict.id, 'keep_local')}
            >
              <Text style={styles.resolutionButtonText}>Keep Local</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resolutionButton, styles.remoteButton]}
              onPress={() => onResolve(conflict.id, 'keep_remote')}
            >
              <Text style={styles.resolutionButtonText}>Keep Remote</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resolutionButton, styles.mergeButton]}
              onPress={() => onResolve(conflict.id, 'merge')}
            >
              <Text style={styles.resolutionButtonText}>Merge Both</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  statsCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.error,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  clearButton: {
    marginTop: 12,
    padding: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  conflictCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  conflictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  conflictHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  conflictInfo: {
    marginLeft: 12,
    flex: 1,
  },
  conflictTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  conflictDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  conflictDetails: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  versionCard: {
    backgroundColor: COLORS.backgroundDark,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  versionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  versionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
  versionText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: COLORS.textSecondary,
  },
  resolutionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  resolutionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  localButton: {
    backgroundColor: COLORS.primary,
  },
  remoteButton: {
    backgroundColor: COLORS.warning,
  },
  mergeButton: {
    backgroundColor: COLORS.success,
  },
  resolutionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default ConflictResolutionScreen;