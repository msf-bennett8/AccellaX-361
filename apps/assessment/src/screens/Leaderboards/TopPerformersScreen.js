// Location: /apps/assessment/src/screens/Leaderboards/TopPerformersScreen.js
// Top performing athletes across all sports

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
import { COLORS } from '../../utils/constants';

export default function TopPerformersScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSport, setSelectedSport] = useState('all');
  const [performers, setPerformers] = useState([]);

  const sports = [
    { id: 'all', name: 'All Sports' },
    { id: 'football', name: 'Football' },
    { id: 'athletics', name: 'Athletics' },
    { id: 'rugby', name: 'Rugby' },
    { id: 'basketball', name: 'Basketball' },
  ];

  useEffect(() => {
    loadTopPerformers();
  }, [selectedSport]);

  const loadTopPerformers = async () => {
    try {
      // TODO: Load from database based on selectedSport
      // Mock data for now
      const mockData = [
        { id: 1, name: 'John Kipchoge', sport: 'Athletics', score: 95, percentile: 98, avatar: '🏃' },
        { id: 2, name: 'Mary Wanjiku', sport: 'Football', score: 92, percentile: 95, avatar: '⚽' },
        { id: 3, name: 'David Omondi', sport: 'Rugby', score: 90, percentile: 93, avatar: '🏉' },
        { id: 4, name: 'Grace Achieng', sport: 'Athletics', score: 89, percentile: 91, avatar: '🏃' },
        { id: 5, name: 'Peter Kamau', sport: 'Basketball', score: 87, percentile: 88, avatar: '🏀' },
        { id: 6, name: 'Susan Njeri', sport: 'Football', score: 85, percentile: 85, avatar: '⚽' },
        { id: 7, name: 'James Otieno', sport: 'Rugby', score: 84, percentile: 83, avatar: '🏉' },
        { id: 8, name: 'Faith Muthoni', sport: 'Athletics', score: 83, percentile: 81, avatar: '🏃' },
      ];
      setPerformers(mockData);
    } catch (error) {
      console.error('Error loading top performers:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTopPerformers();
    setRefreshing(false);
  };

  const getMedalColor = (rank) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return COLORS.primary;
  };

  return (
    <View style={styles.container}>
      <Header
        title="Top Performers"
        subtitle="Highest scoring athletes"
        showBackButton={true}
        onLeftPress={() => navigation.goBack()}
      />

      {/* Sport Filter */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {sports.map((sport) => (
            <TouchableOpacity
              key={sport.id}
              style={[
                styles.filterChip,
                selectedSport === sport.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedSport(sport.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedSport === sport.id && styles.filterChipTextActive,
                ]}
              >
                {sport.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.contentWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Top 3 Podium */}
        {performers.length >= 3 && (
          <View style={styles.podiumContainer}>
            {/* 2nd Place */}
            <View style={styles.podiumPlace}>
              <View style={[styles.podiumMedal, { backgroundColor: '#C0C0C0' + '30' }]}>
                <Text style={styles.podiumAvatar}>{performers[1].avatar}</Text>
              </View>
              <View style={[styles.podiumBar, styles.podiumBar2]}>
                <Text style={styles.podiumRank}>2</Text>
              </View>
              <Text style={styles.podiumName}>{performers[1].name.split(' ')[0]}</Text>
              <Text style={styles.podiumScore}>{performers[1].score}</Text>
            </View>

            {/* 1st Place */}
            <View style={styles.podiumPlace}>
              <MaterialCommunityIcons name="crown" size={24} color="#FFD700" style={{ marginBottom: 4 }} />
              <View style={[styles.podiumMedal, { backgroundColor: '#FFD700' + '30' }]}>
                <Text style={styles.podiumAvatar}>{performers[0].avatar}</Text>
              </View>
              <View style={[styles.podiumBar, styles.podiumBar1]}>
                <Text style={styles.podiumRank}>1</Text>
              </View>
              <Text style={styles.podiumName}>{performers[0].name.split(' ')[0]}</Text>
              <Text style={styles.podiumScore}>{performers[0].score}</Text>
            </View>

            {/* 3rd Place */}
            <View style={styles.podiumPlace}>
              <View style={[styles.podiumMedal, { backgroundColor: '#CD7F32' + '30' }]}>
                <Text style={styles.podiumAvatar}>{performers[2].avatar}</Text>
              </View>
              <View style={[styles.podiumBar, styles.podiumBar3]}>
                <Text style={styles.podiumRank}>3</Text>
              </View>
              <Text style={styles.podiumName}>{performers[2].name.split(' ')[0]}</Text>
              <Text style={styles.podiumScore}>{performers[2].score}</Text>
            </View>
          </View>
        )}

        {/* Full Rankings List */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Complete Rankings</Text>
          {performers.map((performer, index) => (
            <View key={performer.id} style={styles.performerCard}>
              <View
                style={[
                  styles.rankBadge,
                  { backgroundColor: getMedalColor(index + 1) + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.rankNumber,
                    { color: getMedalColor(index + 1) },
                  ]}
                >
                  #{index + 1}
                </Text>
              </View>
              <View style={styles.performerInfo}>
                <Text style={styles.performerName}>{performer.name}</Text>
                <View style={styles.performerMeta}>
                  <Text style={styles.performerSport}>{performer.sport}</Text>
                  <View style={styles.percentileBadge}>
                    <Ionicons name="stats-chart" size={12} color={COLORS.success} />
                    <Text style={styles.percentileText}>{performer.percentile}th percentile</Text>
                  </View>
                </View>
              </View>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreNumber}>{performer.score}</Text>
                <View style={styles.starRow}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.scoreLabel}>Score</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  contentWrapper: {
    position: 'absolute',
    top: 172,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 8,
  },
  podiumPlace: {
    flex: 1,
    alignItems: 'center',
  },
  podiumMedal: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  podiumAvatar: {
    fontSize: 32,
  },
  podiumBar: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  podiumBar1: {
    height: 100,
    backgroundColor: '#FFD700',
  },
  podiumBar2: {
    height: 80,
    backgroundColor: '#C0C0C0',
  },
  podiumBar3: {
    height: 60,
    backgroundColor: '#CD7F32',
  },
  podiumRank: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  podiumName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  podiumScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  performerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
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
  performerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  performerSport: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  percentileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  percentileText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.success,
  },
  scoreContainer: {
    alignItems: 'center',
    marginLeft: 8,
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});