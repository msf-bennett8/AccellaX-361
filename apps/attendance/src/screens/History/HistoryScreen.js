// src/screens/History/HistoryScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FILTER_LABELS } from '../../utils/constants';
import { exportMultipleSessions } from '../../utils/exportUtils';
import { formatDate, formatDateShort } from '../../utils/dateUtils';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import { getAllSessions, getSessionAttendance, getSessionStats, getAllKids } from '../../database/db';
import { getCurrentUserId } from '../../utils/auth';

const HistoryScreen = ({ navigation }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groupedSessions, setGroupedSessions] = useState({});
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [exportFilter, setExportFilter] = useState('all');

  // Load sessions when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [])
  );

  const loadSessions = async () => {
    try {
      setLoading(true);
      
      console.log('📊 Loading all sessions from academy');
      
      const allSessions = await getAllSessions();
      
      console.log(`📊 Loaded ${allSessions.length} sessions`);
      
      // Enhance sessions with attendance counts
      const enhancedSessions = await Promise.all(
        allSessions.map(async (session) => {
          const attendance = await getSessionAttendance(session.id);
          const presentCount = attendance.filter(a => a.status === 'present').length;
          const totalCount = attendance.length;
          
          return {
            ...session,
            presentCount,
            totalCount,
            attendanceRate: totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0,
          };
        })
      );

      // Group sessions by month
      const grouped = enhancedSessions.reduce((acc, session) => {
        const date = new Date(session.session_date);
        const monthYear = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        
        if (!acc[monthYear]) {
          acc[monthYear] = [];
        }
        acc[monthYear].push(session);
        return acc;
      }, {});

      setSessions(enhancedSessions);
      setGroupedSessions(grouped);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSessions();
  };

  const handleSessionPress = (session) => {
    navigation.navigate('SessionDetail', { sessionId: session.id });
  };

  const handleExportAll = () => {
    Alert.alert(
      'Export All Sessions',
      'Choose filter for export',
      [
        {
          text: 'All Kids',
          onPress: () => performExport('all')
        },
        {
          text: 'Scholarship (SC)',
          onPress: () => performExport('SC')
        },
        {
          text: 'Self-Sponsored (SP)',
          onPress: () => performExport('SP')
        },
        {
          text: 'Elite Program',
          onPress: () => performExport('ELT')
        },
        {
          text: 'Weekend Program',
          onPress: () => performExport('WW')
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const performExport = async (filterType) => {
    try {
      const result = await exportMultipleSessions(sessions, filterType);
      
      if (result.success) {
        if (result.method === 'clipboard') {
          Alert.alert('Success', 'Report copied to clipboard!');
        }
      } else {
        Alert.alert('Error', 'Failed to export sessions');
      }
    } catch (error) {
      console.error('Error exporting sessions:', error);
      Alert.alert('Error', 'Failed to export sessions');
    }
  };

  const renderSessionItem = ({ item: session }) => (
    <TouchableOpacity
      onPress={() => handleSessionPress(session)}
      activeOpacity={0.7}
    >
      <Card style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <View style={styles.sessionDateContainer}>
            <Text style={styles.sessionDay}>
              {new Date(session.session_date).getDate()}
            </Text>
            <Text style={styles.sessionMonth}>
              {new Date(session.session_date).toLocaleDateString('en-US', { month: 'short' })}
            </Text>
          </View>
          
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTitle}>
              {session.day_of_week} Training
            </Text>
            <Text style={styles.sessionTime}>
              {session.session_time}
            </Text>
            <Text style={styles.sessionDate}>
              {formatDate(new Date(session.session_date))}
            </Text>
          </View>

          <View style={styles.attendanceContainer}>
            <View style={[
              styles.attendanceBadge,
              { backgroundColor: session.attendanceRate >= 75 ? COLORS.present : COLORS.warning }
            ]}>
              <Text style={styles.attendanceRate}>{session.attendanceRate}%</Text>
            </View>
            <Text style={styles.attendanceCount}>
              {session.presentCount}/{session.totalCount}
            </Text>
            <Text style={styles.attendanceLabel}>Present</Text>
          </View>
        </View>

        {session.general_notes && (
          <View style={styles.notesPreview}>
            <Text style={styles.notesIcon}>📝</Text>
            <Text style={styles.notesText} numberOfLines={2}>
              {session.general_notes}
            </Text>
          </View>
        )}

        <View style={styles.sessionFooter}>
          <Text style={styles.viewDetails}>Tap to view details →</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderMonthSection = ({ item: monthYear }) => {
    const monthSessions = groupedSessions[monthYear];
    
    return (
      <View style={styles.monthSection}>
        <View style={styles.monthHeader}>
          <Text style={styles.monthTitle}>{monthYear}</Text>
          <Text style={styles.monthCount}>
            {monthSessions.length} session{monthSessions.length !== 1 ? 's' : ''}
          </Text>
        </View>
        
        {monthSessions.map((session) => (
          <View key={session.id}>
            {renderSessionItem({ item: session })}
          </View>
        ))}
      </View>
    );
  };

  const renderViewModeToggle = () => (
    <View style={styles.viewModeContainer}>
      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
        onPress={() => setViewMode('list')}
      >
        <Text style={[styles.viewModeText, viewMode === 'list' && styles.viewModeTextActive]}>
          📋 List
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'calendar' && styles.viewModeButtonActive]}
        onPress={() => setViewMode('calendar')}
      >
        <Text style={[styles.viewModeText, viewMode === 'calendar' && styles.viewModeTextActive]}>
          📅 Calendar
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => {
    if (sessions.length === 0) return null;

    const totalSessions = sessions.length;
    const totalPresent = sessions.reduce((sum, s) => sum + s.presentCount, 0);
    const totalKids = sessions.reduce((sum, s) => sum + s.totalCount, 0);
    const avgAttendanceRate = Math.round(
      sessions.reduce((sum, s) => sum + s.attendanceRate, 0) / totalSessions
    );

    return (
      <Card style={styles.statsCard}>
        <Text style={styles.statsTitle}>Overview Statistics</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.present }]}>
              {avgAttendanceRate}%
            </Text>
            <Text style={styles.statLabel}>Avg Rate</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalPresent}</Text>
            <Text style={styles.statLabel}>Total Present</Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📊</Text>
      <Text style={styles.emptyTitle}>No Sessions Yet</Text>
      <Text style={styles.emptyText}>
        Start marking attendance to see your training history here
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.emptyButtonText}>Go to Home</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCalendarView = () => (
    <View style={styles.calendarContainer}>
      <Text style={styles.calendarPlaceholder}>
        📅 Calendar view coming soon!
      </Text>
      <Text style={styles.calendarSubtext}>
        This feature will show sessions in a monthly calendar format
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="History"
          leftIcon="☰"
          onLeftPress={() => navigation.openDrawer()}
          rightIcon="📤"
          onRightPress={handleExportAll}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="History"
        leftIcon="☰"
        onLeftPress={() => navigation.openDrawer()}
      />

      {sessions.length === 0 ? (
        <View style={styles.scrollViewContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {renderEmptyState()}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.contentWrapper}>
          {renderStats()}
          {renderViewModeToggle()}
          
          {viewMode === 'list' ? (
            <FlatList
              data={Object.keys(groupedSessions).sort((a, b) => {
                const dateA = new Date(a);
                const dateB = new Date(b);
                return dateB - dateA; // Most recent first
              })}
              renderItem={renderMonthSection}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.scrollViewContainer}>
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
              >
                {renderCalendarView()}
              </ScrollView>
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  contentWrapper: {
    height: 0,
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollViewContainer: {
    height: 0,
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  
  // Stats Card
  statsCard: {
    margin: 16,
    marginBottom: 8,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
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
    backgroundColor: COLORS.textSecondary + '30',
  },

  // View Mode Toggle
  viewModeContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  viewModeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  viewModeTextActive: {
    color: COLORS.white,
  },

  // Month Section
  monthSection: {
    marginBottom: 24,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  monthCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Session Card
  sessionCard: {
    marginBottom: 12,
    padding: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sessionDateContainer: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.primary + '15',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sessionDay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  sessionMonth: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sessionInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  sessionDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  attendanceContainer: {
    alignItems: 'center',
    marginLeft: 12,
  },
  attendanceBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  attendanceRate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  attendanceCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  attendanceLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  notesPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
  },
  notesIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  notesText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  sessionFooter: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  viewDetails: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // Calendar View
  calendarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  calendarPlaceholder: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  calendarSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default HistoryScreen;