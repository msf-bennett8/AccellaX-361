// src/screens/AgeGroup/AgeGroupScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS, AGE_GROUPS, SCREEN_NAMES } from '../../utils/constants';
import { getSessionAttendance, getKidsByAgeGroup } from '../../database/db';
import Header from '../../components/common/Header';

const AgeGroupScreen = ({ route, navigation }) => {
  const { sessionId, sessionDate, sessionTime, dayOfWeek, isExistingSession } = route.params;
  
  const [completedGroups, setCompletedGroups] = useState([]);
  const [isEditMode] = useState(isExistingSession || false);
  const [groupStats, setGroupStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroupStats();
    
    // Listen for navigation events to refresh when coming back from attendance
    const unsubscribe = navigation.addListener('focus', () => {
      loadGroupStats();
    });

    return unsubscribe;
  }, [navigation]);

  const loadGroupStats = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading group stats for session:', sessionId);
      
      const attendance = await getSessionAttendance(sessionId);
      console.log('📋 Loaded attendance records:', attendance.length);
      
      const stats = {};
      const completed = [];

      for (const ageGroup of AGE_GROUPS) {
        console.log(`🔍 Loading kids for ${ageGroup}...`);
        const kids = await getKidsByAgeGroup(ageGroup);
        console.log(`✅ Found ${kids.length} kids in ${ageGroup}`);
        
        const totalKids = kids.length;
        const markedKids = attendance.filter(
          (a) => kids.some((k) => k.id === a.kid_id)
        ).length;

        stats[ageGroup] = {
          total: totalKids,
          marked: markedKids,
          complete: totalKids > 0 && markedKids === totalKids,
        };

        if (stats[ageGroup].complete) {
          completed.push(ageGroup);
        }
      }

      setGroupStats(stats);
      setCompletedGroups(completed);

      // Check if all groups are complete
      const allComplete = AGE_GROUPS.every(
        (group) => stats[group].complete || stats[group].total === 0
      );

      if (allComplete && AGE_GROUPS.some((group) => stats[group].total > 0)) {
        // Only auto-navigate to summary for NEW sessions (not when editing existing)
        if (!isExistingSession) {
          navigation.replace(SCREEN_NAMES.SUMMARY, {
            sessionId,
            sessionDate,
            sessionTime,
            dayOfWeek,
          });
        }
        // For existing sessions, stay on AgeGroup screen to allow manual navigation
      }
    } catch (error) {
      console.error('Error loading group stats:', error);
      Alert.alert('Error', 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleAgeGroupPress = async (ageGroup) => {
    try {
      const kids = await getKidsByAgeGroup(ageGroup);
      
      if (kids.length === 0) {
        Alert.alert(
          'No Kids',
          `No kids in ${ageGroup} years age group.`,
          [
            { text: 'OK', style: 'cancel' },
            {
              text: 'Add Kids',
              onPress: () => navigation.navigate('MyKidsStack'),
            },
          ]
        );
        return;
      }

      navigation.navigate(SCREEN_NAMES.ATTENDANCE, {
        sessionId,
        sessionDate,
        sessionTime,
        dayOfWeek,
        ageGroup,
        isExistingSession: isEditMode, // Pass the edit mode flag
      });
    } catch (error) {
      console.error('Error checking kids:', error);
      Alert.alert('Error', 'Failed to load kids');
    }
  };

  const getProgressColor = (stats) => {
    if (!stats || stats.total === 0) return COLORS.textSecondary;
    if (stats.complete) return COLORS.success;
    if (stats.marked > 0) return COLORS.warning;
    return COLORS.textSecondary;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading age groups...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={isEditMode ? "Edit Attendance" : "Select Age Group"}
        subtitle={`${sessionDate} • ${sessionTime}${isEditMode ? ' (Editing)' : ''}`}
        leftText="Back"
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Edit Mode Banner */}
        {isEditMode && (
          <View style={styles.editModeBanner}>
            <Text style={styles.editModeIcon}>📝</Text>
            <Text style={styles.editModeText}>Editing existing session attendance</Text>
          </View>
        )}
        
        {/* Progress Summary */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Session Progress</Text>
          <Text style={styles.progressSubtitle}>
            {completedGroups.length} of {AGE_GROUPS.length} age groups marked
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(completedGroups.length / AGE_GROUPS.length) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Age Group Grid */}
        <View style={styles.grid}>
          {AGE_GROUPS.map((group) => {
            const stats = groupStats[group] || { total: 0, marked: 0, complete: false };
            const isComplete = stats.complete;
            const hasKids = stats.total > 0;

            return (
              <TouchableOpacity
                key={group}
                style={[
                  styles.ageGroupCard,
                  isComplete && styles.completedCard,
                  !hasKids && styles.emptyCard,
                ]}
                onPress={() => handleAgeGroupPress(group)}
                activeOpacity={0.7}
              >
                {/* Checkmark for completed */}
                {isComplete && (
                  <View style={styles.checkmarkContainer}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}

                {/* Age Group Label */}
                <Text style={styles.ageGroupText}>{group} years</Text>

                {/* Stats */}
                {hasKids ? (
                  <View style={styles.statsContainer}>
                    <Text
                      style={[
                        styles.statsText,
                        { color: getProgressColor(stats) },
                      ]}
                    >
                      {stats.marked}/{stats.total}
                    </Text>
                    {isComplete ? (
                      <Text style={styles.completeLabel}>✓ Complete</Text>
                    ) : stats.marked > 0 ? (
                      <Text style={styles.inProgressLabel}>In Progress</Text>
                    ) : (
                      <Text style={styles.pendingLabel}>Not Started</Text>
                    )}
                  </View>
                ) : (
                  <View style={styles.noKidsContainer}>
                    <Text style={styles.noKidsIcon}>👥</Text>
                    <Text style={styles.noKidsText}>No kids</Text>
                  </View>
                )}

                {/* Tap indicator */}
                <Text style={styles.tapHint}>Tap to {hasKids ? 'mark' : 'add kids'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.manageKidsButton}
            onPress={() => navigation.navigate('MyKidsStack')}
          >
            <Text style={styles.manageKidsButtonText}>👥 Manage Kids</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 24 }} />
      </ScrollView>
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
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
  },
  progressCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 12,
  },
  ageGroupCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    minHeight: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  completedCard: {
    backgroundColor: '#E8F5E9',
    borderColor: COLORS.success,
  },
  emptyCard: {
    backgroundColor: '#F9F9F9',
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    backgroundColor: COLORS.success,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  checkmark: {
    fontSize: 20,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  ageGroupText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  statsContainer: {
    alignItems: 'center',
  },
  statsText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  completeLabel: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inProgressLabel: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pendingLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noKidsContainer: {
    alignItems: 'center',
  },
  noKidsIcon: {
    fontSize: 32,
    marginBottom: 8,
    opacity: 0.5,
  },
  noKidsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  tapHint: {
    position: 'absolute',
    bottom: 12,
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  actionButtons: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  manageKidsButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  manageKidsButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  editModeBanner: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  editModeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  editModeText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
});

export default AgeGroupScreen;