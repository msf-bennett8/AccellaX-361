// Location: /apps/assessment/src/screens/Home/HomeScreen.js
// Comprehensive Home Dashboard for Fitness Assessment App

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import { COLORS, APP_NAME, AGE_GROUPS, SPORTS } from '../../utils/constants';
import { getCurrentUser } from '../../utils/auth';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();
  
  // State Management
  const [userProfile, setUserProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalAssessments: 0,
    totalKids: 0,
    activeSports: 6,
    pendingAssessments: 0,
    recentAssessments: 0,
    lastAssessmentDate: null,
  });
  const [quickStats, setQuickStats] = useState({
    thisWeek: 0,
    thisMonth: 0,
    thisQuarter: 0,
  });
  const [upcomingTests, setUpcomingTests] = useState([]);
  const [redFlags, setRedFlags] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // Load data on mount and when screen focused
  useEffect(() => {
    loadDashboardData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      console.log('📊 Loading dashboard data...');
      
      const profile = await getCurrentUser();
      setUserProfile(profile);

      try {
        await loadStats();
      } catch (error) {
        console.log('⚠️ Stats not available yet');
      }
      await loadQuickStats();
      await loadUpcomingTests();
      await loadRedFlags();
      await loadTopPerformers();
      await loadRecentActivity();
      
      console.log('✅ Dashboard data loaded');
    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { getAssessmentStats } = await import('../../services/assessmentService');
      const statsData = await getAssessmentStats();
      
      setStats({
        totalAssessments: statsData?.totalAssessments || 0,
        totalKids: statsData?.totalKids || 0,
        activeSports: statsData?.activeSports || 6,
        pendingAssessments: statsData?.pendingAssessments || 0,
        recentAssessments: statsData?.recentAssessments || 0,
        lastAssessmentDate: statsData?.lastAssessmentDate || null,
      });
    } catch (error) {
      console.log('⚠️ Stats not yet available:', error.message);
    }
  };

  const loadQuickStats = async () => {
    try {
      const { getQuickStats } = await import('../../database/db');
      const quickStatsData = await getQuickStats();
      
      setQuickStats({
        thisWeek: quickStatsData?.thisWeek || 0,
        thisMonth: quickStatsData?.thisMonth || 0,
        thisQuarter: quickStatsData?.thisQuarter || 0,
      });
    } catch (error) {
      console.log('⚠️ Quick stats not yet available');
    }
  };

  const loadUpcomingTests = async () => {
    try {
      setUpcomingTests([
        { id: 1, sport: 'Football', date: 'Next Week', kidsCount: 45 },
        { id: 2, sport: 'Athletics', date: '2 Weeks', kidsCount: 38 },
      ]);
    } catch (error) {
      console.log('⚠️ Upcoming tests not yet available');
    }
  };

  const loadRedFlags = async () => {
    try {
      setRedFlags([
        { id: 1, kidName: 'Ahmed Hassan', metric: 'Endurance', change: -15, type: 'decline' },
        { id: 2, kidName: 'Sarah Ali', metric: 'Speed', change: -12, type: 'decline' },
      ]);
    } catch (error) {
      console.log('⚠️ Red flags not yet available');
    }
  };

  const loadTopPerformers = async () => {
    try {
      setTopPerformers([
        { id: 1, name: 'John Kipchoge', sport: 'Athletics', score: 95 },
        { id: 2, name: 'Mary Wanjiku', sport: 'Football', score: 92 },
        { id: 3, name: 'David Omondi', sport: 'Rugby', score: 90 },
      ]);
    } catch (error) {
      console.log('⚠️ Top performers not yet available');
    }
  };

  const loadRecentActivity = async () => {
    try {
      setRecentActivity([
        { id: 1, action: 'Assessment completed', sport: 'Football', time: '2 hours ago', count: 25 },
        { id: 2, action: 'New kids added', count: 8, time: '1 day ago' },
        { id: 3, action: 'Report exported', sport: 'Athletics', time: '3 days ago' },
      ]);
    } catch (error) {
      console.log('⚠️ Recent activity not yet available');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleNewAssessment = () => {
    navigation.navigate('Assessment', { screen: 'SelectSport' });
  };

  const handleViewHistory = () => {
    navigation.navigate('History');
  };

  const handleViewReports = () => {
    navigation.navigate('Reports');
  };

  const handleViewKids = () => {
    Alert.alert('Kids Management', 'Coming soon!');
  };

  const handleViewLeaderboards = () => {
    navigation.navigate('Leaderboards');
  };

  const handleSportPress = (sportName) => {
    Alert.alert(sportName, `View ${sportName} assessments - Coming soon!`);
  };

  const handleRedFlagPress = (flag) => {
    Alert.alert(
      'Performance Alert',
      `${flag.kidName}'s ${flag.metric} dropped by ${Math.abs(flag.change)}%. Tap to view details.`,
      [{ text: 'OK' }]
    );
  };

  const handleUpcomingTestPress = (test) => {
    Alert.alert(
      'Upcoming Test',
      `${test.sport} assessment scheduled for ${test.date}\n${test.kidsCount} kids to assess`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Now', onPress: () => navigation.navigate('SelectSport') },
      ]
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  const getCurrentTerm = () => {
    const month = new Date().getMonth() + 1;
    if (month >= 1 && month <= 3) return 'Q1';
    if (month >= 4 && month <= 6) return 'Q2';
    if (month >= 7 && month <= 9) return 'Q3';
    return 'Q4';
  };

  const getSportIcon = (sportName) => {
    const iconMap = {
      'Football': 'soccer',
      'Athletics': 'run-fast',
      'Rugby': 'rugby',
      'Basketball': 'basketball',
      'Tennis': 'tennis',
      'Swimming': 'swim',
      'default': 'trophy'
    };
    return iconMap[sportName] || iconMap['default'];
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header
        title={APP_NAME}
        subtitle="Assessment Dashboard"
        leftIcon="☰"
        onLeftPress={() => navigation.openDrawer()}
        showAvatar={true}
        variant="large"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting Section */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>
            {getGreeting()}, {userProfile?.username || userProfile?.fullName?.split(' ')[0] || 'there'}!
          </Text>
          <View style={styles.termBadgeContainer}>
            <Ionicons name="calendar" size={14} color={COLORS.primary} style={{ marginTop: 1 }} />
            <Text style={styles.termBadge}>Current Term: {getCurrentTerm()}</Text>
          </View>
        </View>

        {/* Main Stats Cards */}
        <View style={styles.mainStatsContainer}>
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={[styles.statCard, styles.statCardPrimary]}
              onPress={handleViewHistory}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="clipboard-check" size={32} color={COLORS.white} />
              <Text style={styles.statNumber}>{stats.totalAssessments}</Text>
              <Text style={styles.statLabel}>Total Assessments</Text>
              <Text style={styles.statSubtext}>All time</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, styles.statCardSecondary]}
              onPress={handleViewKids}
              activeOpacity={0.8}
            >
              <Ionicons name="people" size={32} color={COLORS.white} />
              <Text style={styles.statNumber}>{stats.totalKids}</Text>
              <Text style={styles.statLabel}>Athletes</Text>
              <Text style={styles.statSubtext}>Registered</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.statCardSuccess]}>
              <MaterialCommunityIcons name="trophy" size={32} color={COLORS.white} />
              <Text style={styles.statNumber}>{stats.activeSports}</Text>
              <Text style={styles.statLabel}>Sports</Text>
              <Text style={styles.statSubtext}>Active</Text>
            </View>

            <View style={[styles.statCard, styles.statCardWarning]}>
              <Ionicons name="time" size={32} color={COLORS.white} />
              <Text style={styles.statNumber}>{stats.recentAssessments}</Text>
              <Text style={styles.statLabel}>This Week</Text>
              <Text style={styles.statSubtext}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryActionButton]}
            onPress={handleNewAssessment}
            activeOpacity={0.85}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="add-circle" size={28} color={COLORS.white} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>New Assessment</Text>
              <Text style={styles.actionSubtitle}>Start fitness testing</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryActionButton]}
              onPress={handleViewHistory}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="history" size={28} color={COLORS.primary} />
              <Text style={styles.secondaryActionText}>History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryActionButton]}
              onPress={handleViewReports}
              activeOpacity={0.85}
            >
              <Ionicons name="stats-chart" size={28} color={COLORS.primary} />
              <Text style={styles.secondaryActionText}>Reports</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryActionButton]}
              onPress={handleViewLeaderboards}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="trophy-award" size={28} color={COLORS.primary} />
              <Text style={styles.secondaryActionText}>Rankings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Red Flags Alert */}
        {redFlags.length > 0 && (
          <View style={styles.redFlagsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Performance Alerts</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {redFlags.map((flag) => (
              <TouchableOpacity
                key={flag.id}
                style={styles.redFlagCard}
                onPress={() => handleRedFlagPress(flag)}
                activeOpacity={0.7}
              >
                <View style={styles.redFlagIcon}>
                  <Ionicons name="trending-down" size={24} color={COLORS.error} />
                </View>
                <View style={styles.redFlagContent}>
                  <Text style={styles.redFlagName}>{flag.kidName}</Text>
                  <Text style={styles.redFlagMetric}>
                    {flag.metric} decreased by {Math.abs(flag.change)}%
                  </Text>
                </View>
                <View style={styles.redFlagBadge}>
                  <Text style={styles.redFlagBadgeText}>View</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Upcoming Tests */}
        {upcomingTests.length > 0 && (
          <View style={styles.upcomingSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Tests</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>Manage</Text>
              </TouchableOpacity>
            </View>
            {upcomingTests.map((test) => (
              <TouchableOpacity
                key={test.id}
                style={styles.upcomingCard}
                onPress={() => handleUpcomingTestPress(test)}
                activeOpacity={0.7}
              >
                <View style={styles.upcomingIcon}>
                  <MaterialCommunityIcons name="clipboard-list" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.upcomingContent}>
                  <Text style={styles.upcomingTitle}>{test.sport} Assessment</Text>
                  <View style={styles.upcomingMeta}>
                    <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.upcomingDate}>{test.date}</Text>
                    <Ionicons name="people-outline" size={14} color={COLORS.textSecondary} style={{ marginLeft: 8 }} />
                    <Text style={styles.upcomingDate}>{test.kidsCount} kids</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Available Sports Grid */}
        <View style={styles.sportsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sports Modules</Text>
            <TouchableOpacity onPress={() => Alert.alert('Manage Sports', 'Add or edit sports - Coming soon!')}>
              <Text style={styles.seeAllText}>Manage</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sportsGrid}>
            {(SPORTS || []).slice(0, 6).map((sport, index) => (
              <TouchableOpacity
                key={index}
                style={styles.sportCard}
                onPress={() => handleSportPress(sport.name)}
                activeOpacity={0.8}
              >
                <View style={styles.sportIconContainer}>
                  <MaterialCommunityIcons 
                    name={getSportIcon(sport.name)} 
                    size={32} 
                    color={COLORS.primary} 
                  />
                </View>
                <Text style={styles.sportName}>{sport.name}</Text>
                <View style={styles.sportBadge}>
                  <Ionicons name="checkmark-circle" size={10} color={COLORS.success} />
                  <Text style={styles.sportBadgeText}>Active</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Top Performers */}
        {topPerformers.length > 0 && (
          <View style={styles.topPerformersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Performers</Text>
              <TouchableOpacity onPress={handleViewLeaderboards}>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {topPerformers.map((performer, index) => (
              <View key={performer.id} style={styles.performerCard}>
                <View style={styles.performerRank}>
                  <Text style={styles.performerRankText}>#{index + 1}</Text>
                </View>
                <View style={styles.performerInfo}>
                  <Text style={styles.performerName}>{performer.name}</Text>
                  <Text style={styles.performerSport}>{performer.sport}</Text>
                </View>
                <View style={styles.performerScore}>
                  <Text style={styles.performerScoreNumber}>{performer.score}</Text>
                  <View style={styles.performerScoreLabelRow}>
                    <Ionicons name="star" size={10} color="#FFD700" />
                    <Text style={styles.performerScoreLabel}>Score</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <View style={styles.activitySection}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {recentActivity.map((activity) => (
              <View key={activity.id} style={styles.activityCard}>
                <View style={styles.activityDot} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityAction}>{activity.action}</Text>
                  <Text style={styles.activityDetails}>
                    {activity.sport && `${activity.sport} • `}
                    {activity.count && `${activity.count} items • `}
                    {activity.time}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} style={styles.infoBannerIcon} />
          <Text style={styles.infoBannerText}>
            Assessment Module tracks fitness metrics, sport-specific skills, and cognitive abilities across multiple sports. Quarterly assessments recommended.
          </Text>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
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
    paddingBottom: 32,
  },
  
  // Greeting Section
  greetingSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 4,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  termBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  termBadge: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Main Stats
  mainStatsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 6,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statCardPrimary: {
    backgroundColor: COLORS.primary,
  },
  statCardSecondary: {
    backgroundColor: '#6C5CE7',
  },
  statCardSuccess: {
    backgroundColor: '#00B894',
  },
  statCardWarning: {
    backgroundColor: '#FDCB6E',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Quick Actions
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryActionButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  actionIconContainer: {
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    // Base button styles
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Red Flags
  redFlagsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  redFlagCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  redFlagIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  redFlagContent: {
    flex: 1,
  },
  redFlagName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  redFlagMetric: {
    fontSize: 13,
    color: COLORS.error,
  },
  redFlagBadge: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  redFlagBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },

  // Upcoming Tests
  upcomingSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  upcomingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  upcomingContent: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  upcomingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upcomingDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // Sports Grid
  sportsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sportCard: {
    width: (width - 56) / 3,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sportIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  sportName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sportBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.success,
  },

  // Top Performers
  topPerformersSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  performerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  performerRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  performerRankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  performerSport: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  performerScore: {
    alignItems: 'center',
  },
  performerScoreNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  performerScoreLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  performerScoreLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  // Recent Activity
  activitySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  activityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginTop: 4,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  activityDetails: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // Info Banner
  infoBanner: {
    backgroundColor: COLORS.primaryLight + '40',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoBannerIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primary,
    lineHeight: 20,
  },

  // Bottom Padding
  bottomPadding: {
    height: 32,
  },
});