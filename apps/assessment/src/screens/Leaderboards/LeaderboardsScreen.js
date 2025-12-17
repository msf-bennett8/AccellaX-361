// Location: /apps/assessment/src/screens/Leaderboards/LeaderboardsScreen.js
// Main leaderboards hub

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import { COLORS } from '../../utils/constants';

export default function LeaderboardsScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalAthletes: 0,
    activeSports: 0,
    assessmentsThisMonth: 0,
  });
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      console.log('📊 Loading leaderboard stats...');
      
      // Get kids count (same as HomeScreen)
      const { getKidsWithSports } = await import('../../services/kidService');
      const kids = await getKidsWithSports();
      const totalAthletes = kids.length;
      
      // Get sports count
      const { getAllSports } = await import('../../database/db');
      const sports = await getAllSports();
      const activeSports = sports.length;
      
      // Get assessments this month
      const { getAllAssessments } = await import('../../services/assessmentService');
      const allAssessments = await getAllAssessments();
      
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const assessmentsThisMonth = allAssessments.filter(a => 
        new Date(a.assessment_date) >= firstDayOfMonth
      ).length;
      
      setStats({
        totalAthletes,
        activeSports,
        assessmentsThisMonth,
      });
      
      console.log('✅ Leaderboard stats loaded:', { totalAthletes, activeSports, assessmentsThisMonth });
    } catch (error) {
      console.error('Error loading stats:', error);
      // Fallback to defaults if services not available
      setStats({
        totalAthletes: 0,
        activeSports: 0,
        assessmentsThisMonth: 0,
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const leaderboardOptions = [
    {
      id: 'top-performers',
      title: 'Top Performers',
      subtitle: 'Highest scoring athletes',
      icon: 'trophy-award',
      color: '#FFD700',
      screen: 'TopPerformers',
    },
    {
      id: 'most-improved',
      title: 'Most Improved',
      subtitle: 'Biggest gains over time',
      icon: 'trending-up',
      color: '#00B894',
      screen: 'MostImproved',
    },
    {
      id: 'team-rankings',
      title: 'Team Rankings',
      subtitle: 'Compare team performance',
      icon: 'account-group',
      color: '#6C5CE7',
      screen: 'TeamRankings',
    },
  ];

  const handleOptionPress = (option) => {
    navigation.navigate(option.screen);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Rankings & Leaderboards"
        subtitle="Performance comparisons"
        leftIcon="☰"
        onLeftPress={() => navigation.openDrawer()}
      />

      <View style={styles.contentWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Ionicons name="people" size={24} color={COLORS.primary} />
            <Text style={styles.statNumber}>{stats.totalAthletes}</Text>
            <Text style={styles.statLabel}>Athletes</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="trophy" size={24} color="#FFD700" />
            <Text style={styles.statNumber}>{stats.activeSports}</Text>
            <Text style={styles.statLabel}>Sports</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="clipboard-check" size={24} color={COLORS.success} />
            <Text style={styles.statNumber}>{stats.assessmentsThisMonth}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>

        {/* Leaderboard Options */}
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Browse Rankings</Text>
          {leaderboardOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionCard}
              onPress={() => handleOptionPress(option)}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: option.color + '20' }]}>
                <MaterialCommunityIcons
                  name={option.icon}
                  size={32}
                  color={option.color}
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Rankings are updated after each assessment. Athletes are compared within their age groups and sports.
          </Text>
        </View>
      </ScrollView>
      </View>

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
  contentWrapper: {
    position: 'absolute',
    top: 116,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight + '40',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primary,
    lineHeight: 20,
  },
});