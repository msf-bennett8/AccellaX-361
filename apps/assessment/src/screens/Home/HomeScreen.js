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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { COLORS, APP_NAME, AGE_GROUPS, SPORTS } from '../../utils/constants';
import { getCurrentUser } from '../../utils/auth';
import { getAssessmentStats, getAllAssessments } from '../../services/assessmentService';
import { getKidsWithSports } from '../../services/kidService';
import { getAllSports } from '../../database/db';
import { getAllSportsWithFitness } from '../../services/sportService';
import { getStartOfWeek, getEndOfWeek, isThisWeek, getCurrentTerm as getTermHelper } from '../../utils/dateUtils';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();
  
  // State Management
  const [userProfile, setUserProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalAssessments: 0,
    totalKids: 0,
    activeSports: 0,
    thisWeek: 0,
  });
  const [loading, setLoading] = useState(true);
  const [sports, setSports] = useState([]);
  const [upcomingTests, setUpcomingTests] = useState([]);
  const [redFlags, setRedFlags] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
  });

  // Load data on mount and when screen focused
  useEffect(() => {
    const initialize = async () => {
      // Ensure Basketball exists in database
      const { ensureBasketballExists } = await import('../../services/sportService');
      const user = await getCurrentUser();
      await ensureBasketballExists(user?.id || 'system');
      
      // Load dashboard
      await loadDashboardData();
    };
    
    initialize();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [])
  );

  // Loading spinner is now handled by LoadingSpinner component

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading dashboard data...');
      
      const profile = await getCurrentUser();
      setUserProfile(profile);

      await Promise.all([
        loadStats(),
        loadSports(),
        loadUpcomingTests(),
        loadRedFlags(),
        loadTopPerformers(),
        loadRecentActivity(),
      ]);
      
      console.log('✅ Dashboard data loaded');
    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      console.log('📊 Loading stats...');
      
      // Get kids count
      const kids = await getKidsWithSports();
      const totalKids = kids.length;
      
      // Get sports count
      const allSports = await getAllSports();
      const activeSports = allSports.length;
      
      // Get assessments from this week
      const allAssessments = await getAllAssessments();
      const thisWeekAssessments = allAssessments.filter(a => 
        isThisWeek(new Date(a.assessment_date))
      );
      
      setStats({
        totalAssessments: allAssessments.length,
        totalKids,
        activeSports,
        thisWeek: thisWeekAssessments.length,
      });
      
      console.log('✅ Stats loaded:', { totalKids, activeSports, thisWeek: thisWeekAssessments.length });
    } catch (error) {
      console.error('❌ Error loading stats:', error);
    }
  };

  const loadSports = async () => {
    try {
      console.log('🏃 [HomeScreen] Loading sports...');
      
      const allSports = await getAllSportsWithFitness();
      console.log('📊 [HomeScreen] Loaded sports:', allSports.length);
      console.log('📋 [HomeScreen] Sport names:', allSports.map(s => s.name).join(', '));
      
      const SPORTS_CONFIG = {
        fitness: { icon: 'heart-pulse', color: '#E74C3C' },
        football: { icon: 'soccer', color: '#4CAF50' },
        athletics: { icon: 'run-fast', color: '#FF9800' },
        rugby: { icon: 'rugby', color: '#795548' },
        swimming: { icon: 'swim', color: '#2196F3' },
        tennis: { icon: 'tennis', color: '#FFEB3B' },
        basketball: { icon: 'basketball', color: '#FF5722' },
      };
      
      const mappedSports = allSports.map(sport => ({
  id: sport.id,
  name: sport.name,
  icon: SPORTS_CONFIG[sport.id]?.icon || 'trophy',
  color: sport.color || SPORTS_CONFIG[sport.id]?.color || COLORS.primary,
  isActive: sport.is_active === 1,
}));

console.log('🎨 [HomeScreen] Mapped sports:', mappedSports);
setSports(mappedSports);
console.log('✅ [HomeScreen] Sports loaded:', mappedSports.length);
    } catch (error) {
      console.error('❌ Error loading sports:', error);
      setSports([]);
    }
  };

  const loadUpcomingTests = async () => {
    try {
      console.log('📅 Loading upcoming tests...');
      
      const allAssessments = await getAllAssessments();
      const kids = await getKidsWithSports();
      const allSports = await getAllSports();
      
      const startOfWeek = getStartOfWeek(new Date());
      const endOfWeek = getEndOfWeek(new Date());
      
      const upcomingBySport = {};
      
      for (const sport of allSports) {
        const kidsInSport = kids.filter(k => 
          k.sports_enrolled && k.sports_enrolled.includes(sport.id)
        );
        
        const assessedThisWeek = allAssessments.filter(a => 
          a.sport_id === sport.id &&
          new Date(a.assessment_date) >= startOfWeek &&
          new Date(a.assessment_date) <= endOfWeek
        );
        
        const kidsAssessedThisWeek = new Set(assessedThisWeek.map(a => a.kid_id));
        const kidsDue = kidsInSport.filter(k => !kidsAssessedThisWeek.has(k.id));
        
        if (kidsDue.length > 0) {
          upcomingBySport[sport.id] = {
            id: sport.id,
            sport: sport.name,
            date: 'This Week',
            kidsCount: kidsDue.length,
          };
        }
      }
      
      const upcoming = Object.values(upcomingBySport).slice(0, 3);
      setUpcomingTests(upcoming);
      console.log('✅ Upcoming tests loaded:', upcoming.length);
    } catch (error) {
      console.error('❌ Error loading upcoming tests:', error);
      setUpcomingTests([]);
    }
  };

  const loadRedFlags = async () => {
    try {
      console.log('🚩 Loading red flags...');
      
      const allAssessments = await getAllAssessments();
      const kids = await getKidsWithSports();
      const flags = [];
      
      for (const kid of kids) {
        const kidAssessments = allAssessments
          .filter(a => a.kid_id === kid.id)
          .sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date));
        
        if (kidAssessments.length >= 2) {
          const latest = kidAssessments[0];
          const previous = kidAssessments[1];
          
          if (latest.results && previous.results) {
            for (const latestResult of latest.results) {
              const previousResult = previous.results.find(r => r.metric_id === latestResult.metric_id);
              
              if (previousResult) {
                const latestValue = parseFloat(latestResult.value);
                const previousValue = parseFloat(previousResult.value);
                
                if (!isNaN(latestValue) && !isNaN(previousValue) && previousValue > 0) {
                  const change = ((latestValue - previousValue) / previousValue) * 100;
                  
                  if (change < -15) {
                    flags.push({
                      id: `${kid.id}_${latestResult.metric_id}`,
                      kidId: kid.id,
                      kidName: kid.name,
                      metric: latestResult.metric_id || 'Performance',
                      change: Math.round(change),
                      type: 'decline',
                    });
                  }
                }
              }
            }
          }
        }
      }
      
      setRedFlags(flags.slice(0, 5));
      console.log('✅ Red flags loaded:', flags.length);
    } catch (error) {
      console.error('❌ Error loading red flags:', error);
      setRedFlags([]);
    }
  };

  const loadTopPerformers = async () => {
    try {
      console.log('🏆 Loading top performers...');
      
      const allAssessments = await getAllAssessments();
      const kids = await getKidsWithSports();
      const allSports = await getAllSports();
      
      const kidScores = {};
      
      for (const kid of kids) {
        const kidAssessments = allAssessments.filter(a => a.kid_id === kid.id);
        
        if (kidAssessments.length > 0) {
          const latestAssessment = kidAssessments.sort((a, b) => 
            new Date(b.assessment_date) - new Date(a.assessment_date)
          )[0];
          
          if (latestAssessment.results && latestAssessment.results.length > 0) {
            const avgScore = latestAssessment.results.reduce((sum, r) => {
              const value = parseFloat(r.value);
              return sum + (isNaN(value) ? 0 : value);
            }, 0) / latestAssessment.results.length;
            
            const sport = allSports.find(s => s.id === latestAssessment.sport_id);
            
            kidScores[kid.id] = {
              id: kid.id,
              name: kid.name,
              sport: sport?.name || 'General',
              score: Math.round(avgScore),
            };
          }
        }
      }
      
      const topPerformersArray = Object.values(kidScores)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      
      setTopPerformers(topPerformersArray);
      console.log('✅ Top performers loaded:', topPerformersArray.length);
    } catch (error) {
      console.error('❌ Error loading top performers:', error);
      setTopPerformers([]);
    }
  };

  const loadRecentActivity = async () => {
    try {
      console.log('📋 Loading recent activity...');
      
      const allAssessments = await getAllAssessments();
      const allSports = await getAllSports();
      const kids = await getKidsWithSports();
      
      const activities = [];
      
      // Recent assessments
      const recentAssessments = allAssessments
        .sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date))
        .slice(0, 3);
      
      for (const assessment of recentAssessments) {
        const sport = allSports.find(s => s.id === assessment.sport_id);
        const daysAgo = Math.floor((new Date() - new Date(assessment.assessment_date)) / (1000 * 60 * 60 * 24));
        const timeText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;
        
        activities.push({
          id: assessment.id,
          action: 'Assessment completed',
          sport: sport?.name,
          time: timeText,
          count: assessment.results?.length || 0,
        });
      }
      
      setRecentActivity(activities);
      console.log('✅ Recent activity loaded:', activities.length);
    } catch (error) {
      console.error('❌ Error loading recent activity:', error);
      setRecentActivity([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleNewAssessment = async () => {
    // Check for pending assessment session
    try {
      const keys = await AsyncStorage.getAllKeys();
      const sessionKeys = keys.filter(key => key.startsWith('assessment_session_'));
      
      if (sessionKeys.length > 0) {
        // Found pending session
        const sessionKey = sessionKeys[0];
        const sessionData = await AsyncStorage.getItem(sessionKey);
        const session = JSON.parse(sessionData);
        
        setModalConfig({
          visible: true,
          title: 'Resume Assessment?',
          message: `You have an incomplete assessment:\n\n${session.sport?.name || 'Sport'} • ${session.kids?.length || 0} kids\n${Object.keys(session.assessmentData || {}).length} of ${(session.kids?.length || 0) * (session.selectedTests?.length || 0)} tests completed\n\nLast updated: ${new Date(session.lastUpdated).toLocaleString()}`,
          type: 'info',
          showCancel: true,
          confirmText: 'Resume',
          cancelText: 'Start New',
          onConfirm: () => {
            setModalConfig({ ...modalConfig, visible: false });
            // Resume assessment
            navigation.navigate('Assessment', { 
              screen: 'AssessmentEntry',
              params: {
                sessionId: session.sessionId,
                sport: session.sport,
                kids: session.kids,
                mode: session.mode,
                selectedTests: session.selectedTests,
                assessmentMetadata: session.assessmentMetadata,
                initialKidIndex: session.currentKidIndex,
                initialTestIndex: session.currentTestIndex,
                existingAssessmentData: session.assessmentData,
              }
            });
          },
          onCancel: async () => {
            // Clear pending session and start new
            await AsyncStorage.removeItem(sessionKey);
            setModalConfig({ ...modalConfig, visible: false });
            navigation.navigate('Assessment', { screen: 'AssessmentSetup' });
          },
        });
      } else {
        // No pending session, start new
        navigation.navigate('Assessment', { screen: 'AssessmentSetup' });
      }
    } catch (error) {
      console.error('Error checking for pending session:', error);
      navigation.navigate('Assessment', { screen: 'AssessmentSetup' });
    }
  };

  const handleViewHistory = () => {
    navigation.navigate('History');
  };

  const handleViewReports = () => {
    navigation.navigate('Reports', { screen: 'ReportsMain' });
  };

  const handleViewKids = () => {
    setModalConfig({
      visible: true,
      title: 'Kids Management',
      message: 'Coming soon!',
      type: 'info',
      onConfirm: () => setModalConfig({ ...modalConfig, visible: false }),
    });
  };

  const handleViewLeaderboards = () => {
    navigation.navigate('Leaderboards');
  };

  const handleSportPress = (sportName, sportId) => {
    console.log('🎯 [HomeScreen] Sport pressed:', sportName, '| ID:', sportId);
    
    // Navigate to sport-specific report screen
    navigation.navigate('Reports', {
      screen: 'SportReport',
      params: {
        sportId: sportId,
        sportName: sportName,
      }
    });
  };

  const handleRedFlagPress = (flag) => {
    setModalConfig({
      visible: true,
      title: 'Performance Alert',
      message: `${flag.kidName}'s ${flag.metric} dropped by ${Math.abs(flag.change)}%. Tap to view details.`,
      type: 'warning',
      onConfirm: () => setModalConfig({ ...modalConfig, visible: false }),
    });
  };

  const handleUpcomingTestPress = (test) => {
    setModalConfig({
      visible: true,
      title: 'Upcoming Test',
      message: `${test.sport} assessment scheduled for ${test.date}\n${test.kidsCount} kids to assess`,
      type: 'info',
      showCancel: true,
      confirmText: 'Start Now',
      cancelText: 'Cancel',
      onConfirm: () => {
        setModalConfig({ ...modalConfig, visible: false });
        navigation.navigate('Assessment', { screen: 'SelectSport' });
      },
      onCancel: () => setModalConfig({ ...modalConfig, visible: false }),
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  const getCurrentTermDisplay = () => {
    return getTermHelper(new Date());
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
            <Text style={styles.termBadge}>Current Term: {getCurrentTermDisplay()}</Text>
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
              onPress={() => navigation.navigate('Kids')}
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
              <Text style={styles.statNumber}>{stats.thisWeek}</Text>
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
              <TouchableOpacity onPress={() => navigation.navigate('History')}>
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
                <TouchableOpacity 
                  style={styles.redFlagBadge}
                  onPress={(e) => {
                    e.stopPropagation();
                    // Navigate to Comparison screen with kid context
                    navigation.navigate('Comparison', { 
                      kidId: flag.kidId, 
                      sportId: 'football' // You can enhance this to detect the sport dynamically
                    });
                  }}
                >
                  <Text style={styles.redFlagBadgeText}>View</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Upcoming Tests */}
        {upcomingTests.length > 0 && (
          <View style={styles.upcomingSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Tests</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Assessment', { screen: 'AssessmentSetup' })}>
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
            <TouchableOpacity onPress={() => setModalConfig({
              visible: true,
              title: 'Manage Sports',
              message: 'Add or edit sports - Coming soon!',
              type: 'info',
              onConfirm: () => setModalConfig({ ...modalConfig, visible: false }),
            })}>
              <Text style={styles.seeAllText}>Manage</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sportsGrid}>
            {/* Display all loaded sports (Fitness + default sports) */}
            {sports.map((sport, index) => {
              console.log(`🎨 Rendering sport card: ${sport.name} (${sport.icon})`);
              
              return (
                <TouchableOpacity
                  key={sport.id}
                  style={styles.sportCard}
                  onPress={() => handleSportPress(sport.name, sport.id)}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.sportIconContainer,
                    { backgroundColor: (sport.color || COLORS.primary) + '20' }
                  ]}>
                    <MaterialCommunityIcons 
                      name={sport.icon || 'trophy'} 
                      size={32} 
                      color={sport.color || COLORS.primary} 
                    />
                  </View>
                  <Text style={styles.sportName}>{sport.name}</Text>
                  <View style={styles.sportBadge}>
                    <Ionicons name="checkmark-circle" size={10} color={COLORS.success} />
                    <Text style={styles.sportBadgeText}>Active</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Add Sport Card */}
            <TouchableOpacity
              style={[styles.sportCard, styles.addSportCard]}
              onPress={() => {
                // TODO: Implement add sport functionality
                // This will open a modal or navigate to add sport screen
                setModalConfig({
                  visible: true,
                  title: 'Add Sport',
                  message: 'Add a new sport module - Coming soon!',
                  type: 'info',
                  onConfirm: () => setModalConfig({ ...modalConfig, visible: false }),
                });
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.sportIconContainer, styles.addSportIconContainer]}>
                <Ionicons 
                  name="add" 
                  size={32} 
                  color={COLORS.primary} 
                />
              </View>
              <Text style={styles.sportName}>Add Sport</Text>
              <View style={[styles.sportBadge, styles.addSportBadge]}>
                <Text style={styles.addSportBadgeText}>New</Text>
              </View>
            </TouchableOpacity>
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

      {/* Loading Spinner - Must be AFTER closing View to overlay everything */}
      {loading && (
        <LoadingSpinner 
          overlay 
          text="Loading dashboard..." 
          color="#1565C0"
        />
      )}
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
    gap: 8,
  },
  sportCard: {
    width: '48%',
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
  addSportCard: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'solid',
    backgroundColor: COLORS.primaryLight + '20',
  },
  addSportIconContainer: {
    backgroundColor: COLORS.primaryLight + '40',
  },
  addSportBadge: {
    backgroundColor: COLORS.primary + '20',
  },
  addSportBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
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

  // Loading handled by LoadingSpinner component
  // Bottom Padding
  bottomPadding: {
    height: 32,
  },
});