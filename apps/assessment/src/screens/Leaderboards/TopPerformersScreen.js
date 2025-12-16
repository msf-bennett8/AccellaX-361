// Location: /apps/assessment/src/screens/Leaderboards/TopPerformersScreen.js
// Top performing athletes across all sports - REFINED VERSION

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { COLORS, AGE_GROUPS } from '../../utils/constants';
import { calculateCompositeScore, getBestSportScore } from '../../utils/calculations';
import { getAgeGroupPercentile } from '../../utils/percentiles';
import { getAllAssessments } from '../../services/assessmentService';
import { getAllKids } from '../../database/db';
import { DEFAULT_SPORTS, getSportIcon } from '../../config/sports';

// Sport icon mapping (using Expo vector icons)
const SPORT_ICONS = {
  football: { family: 'MaterialCommunityIcons', name: 'soccer', color: '#4CAF50' },
  athletics: { family: 'MaterialCommunityIcons', name: 'run', color: '#FF9800' },
  rugby: { family: 'MaterialCommunityIcons', name: 'rugby', color: '#795548' },
  swimming: { family: 'MaterialCommunityIcons', name: 'swim', color: '#2196F3' },
  tennis: { family: 'MaterialCommunityIcons', name: 'tennis', color: '#FFEB3B' },
  basketball: { family: 'MaterialCommunityIcons', name: 'basketball', color: '#FF5722' },
};

const SportIcon = ({ sportId, size = 24 }) => {
  const icon = SPORT_ICONS[sportId] || { family: 'MaterialCommunityIcons', name: 'trophy', color: COLORS.primary };
  return <MaterialCommunityIcons name={icon.name} size={size} color={icon.color} />;
};

export default function TopPerformersScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedAgeGroups, setSelectedAgeGroups] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [showFilter, setShowFilter] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Available sports
  const sports = [
    { id: 'all', name: 'All Sports' },
    ...DEFAULT_SPORTS.map(s => ({ id: s.id, name: s.name })),
  ];

  useEffect(() => {
    loadTopPerformers();
  }, [selectedSport, selectedAgeGroups]);

  const loadTopPerformers = async () => {
    try {
      setLoading(true);

      // Fetch all assessments and kids
      const assessments = await getAllAssessments();
      const kids = await getAllKids();

      if (!assessments || assessments.length === 0) {
        console.log('ℹ️ No assessments found');
        setPerformers([]);
        setLoading(false);
        return;
      }

      console.log(`📊 Processing ${assessments.length} assessments for ${kids.length} kids`);

      // Group assessments by kid
      const kidAssessmentsMap = {};
      assessments.forEach(assessment => {
        if (!kidAssessmentsMap[assessment.kid_id]) {
          kidAssessmentsMap[assessment.kid_id] = [];
        }
        kidAssessmentsMap[assessment.kid_id].push(assessment);
      });

      // Calculate scores for each kid
      const rankedKids = [];

      Object.entries(kidAssessmentsMap).forEach(([kidId, kidAssessments]) => {
        const kid = kids.find(k => k.id === kidId);
        if (!kid) return;

        // Filter by age group if selected
        if (selectedAgeGroups.length > 0 && !selectedAgeGroups.includes(kid.age_group)) {
          return;
        }

        let score = 0;
        let sportId = null;
        let assessment = null;

        if (selectedSport === 'all') {
          // Get kid's BEST sport score
          const bestSport = getBestSportScore(kidAssessments, kid);
          score = bestSport.bestScore;
          sportId = bestSport.bestSport;
          assessment = kidAssessments.find(a => a.sport_id === sportId);
        } else {
          // Get score for SELECTED sport only
          const sportAssessment = kidAssessments.find(a => a.sport_id === selectedSport);
          if (!sportAssessment) return; // Kid doesn't do this sport

          const result = calculateCompositeScore(
            sportAssessment.results,
            selectedSport,
            kid.age_group,
            kid.gender
          );
          score = result.totalScore;
          sportId = selectedSport;
          assessment = sportAssessment;
        }

        if (score > 0 && sportId) {
          rankedKids.push({
            id: kid.id,
            name: kid.name,
            age: kid.age,
            ageGroup: kid.age_group,
            gender: kid.gender,
            sport: sportId,
            score,
            assessmentDate: assessment?.assessment_date,
            assessmentId: assessment?.id,
          });
        }
      });

      // Sort by score (highest first)
      rankedKids.sort((a, b) => b.score - a.score);

      // Calculate percentiles within age group
      const scoresWithPercentiles = rankedKids.map((kid, index) => {
        // Get all peers in same age group
        const ageGroupPeers = rankedKids.filter(k => k.ageGroup === kid.ageGroup);
        
        // Sort peers by score (descending)
        const sortedPeers = ageGroupPeers.sort((a, b) => b.score - a.score);
        
        // Find this kid's rank within age group (1-indexed)
        const ageGroupRank = sortedPeers.findIndex(p => p.id === kid.id) + 1;
        
        // Calculate percentile: rank 1 = 100th, last rank = lowest percentile
        const percentile = Math.round(((sortedPeers.length - ageGroupRank + 1) / sortedPeers.length) * 100);
        
        console.log(`🎯 ${kid.name}: Rank ${ageGroupRank}/${sortedPeers.length} in ${kid.ageGroup} → ${percentile}th percentile`);

        return {
          ...kid,
          rank: index + 1,
          percentile,
          sportName: sports.find(s => s.id === kid.sport)?.name || kid.sport,
        };
      });

      console.log(`✅ Ranked ${scoresWithPercentiles.length} kids`);
      setPerformers(scoresWithPercentiles);
    } catch (error) {
      console.error('❌ Error loading top performers:', error);
      setPerformers([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTopPerformers();
    setRefreshing(false);
  };

  const toggleAgeGroupFilter = (ageGroup) => {
    if (selectedAgeGroups.includes(ageGroup)) {
      setSelectedAgeGroups(selectedAgeGroups.filter(ag => ag !== ageGroup));
    } else {
      setSelectedAgeGroups([...selectedAgeGroups, ageGroup]);
    }
  };

  const clearAllFilters = () => {
    setSelectedSport('all');
    setSelectedAgeGroups([]);
  };

  const removeFilter = (type, value) => {
    if (type === 'sport') {
      setSelectedSport('all');
    } else if (type === 'ageGroup') {
      setSelectedAgeGroups(selectedAgeGroups.filter(ag => ag !== value));
    }
  };

  const getMedalColor = (rank) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return COLORS.primary;
  };

  const hasActiveFilters = selectedSport !== 'all' || selectedAgeGroups.length > 0;

  return (
    <View style={styles.container}>
      <Header
        title="Top Performers"
        subtitle="Highest scoring athletes"
        showBackButton={true}
        onLeftPress={() => navigation.goBack()}
      />

      {/* Filter Button & Active Filters */}
      {showFilter && (
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons 
            name="filter" 
            size={20} 
            color={hasActiveFilters ? COLORS.white : COLORS.primary} 
          />
          <Text style={[styles.filterButtonText, hasActiveFilters && styles.filterButtonTextActive]}>
            {selectedSport === 'all' ? 'All Sports' : sports.find(s => s.id === selectedSport)?.name}
          </Text>
          {hasActiveFilters && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {(selectedSport !== 'all' ? 1 : 0) + selectedAgeGroups.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Active Filters Chips */}
        {hasActiveFilters && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeFiltersScroll}
          >
            {selectedSport !== 'all' && (
              <View style={styles.activeFilterChip}>
                <SportIcon sportId={selectedSport} size={14} />
                <Text style={styles.activeFilterText}>
                  {sports.find(s => s.id === selectedSport)?.name}
                </Text>
                <TouchableOpacity onPress={() => removeFilter('sport', selectedSport)}>
                  <Ionicons name="close-circle" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            )}

            {selectedAgeGroups.map((ageGroup) => (
              <View key={ageGroup} style={styles.activeFilterChip}>
                <Ionicons name="people-outline" size={14} color={COLORS.primary} />
                <Text style={styles.activeFilterText}>{ageGroup} yrs</Text>
                <TouchableOpacity onPress={() => removeFilter('ageGroup', ageGroup)}>
                  <Ionicons name="close-circle" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={clearAllFilters}
            >
              <Text style={styles.clearFiltersText}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
      )}

      <View style={[
        styles.contentWrapper,
        { top: showFilter ? (hasActiveFilters ? 240 : 176) : 116 }
      ]}>
        {loading ? (
          <LoadingSpinner 
            overlay 
            text="Loading rankings..." 
            color="#1565C0"
          />
        ) : performers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="trophy-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No assessments found</Text>
            <Text style={styles.emptySubtext}>
              {hasActiveFilters 
                ? 'Try adjusting your filters'
                : 'Complete some assessments to see rankings'}
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            onScroll={(event) => {
              const currentScrollY = event.nativeEvent.contentOffset.y;
              const scrollDiff = currentScrollY - lastScrollY;
              
              // Increased threshold to 20px to reduce jitter/shaking
              if (scrollDiff > 20 && currentScrollY > 50) {
                // Scrolling down significantly - hide filter
                if (showFilter) {
                  setShowFilter(false);
                }
              } else if (scrollDiff < -20) {
                // Scrolling up significantly - show filter
                if (!showFilter) {
                  setShowFilter(true);
                }
              }
              setLastScrollY(currentScrollY);
            }}
            scrollEventThrottle={16}
          >
            {/* Top 3 Podium */}
            {performers.length >= 3 && (
              <View style={styles.podiumContainer}>
                {/* 2nd Place */}
                <View style={styles.podiumPlace}>
                  <View style={[styles.podiumMedal, { backgroundColor: '#C0C0C0' + '30' }]}>
                    <SportIcon sportId={performers[1].sport} size={32} />
                  </View>
                  <View style={[styles.podiumBar, styles.podiumBar2]}>
                    <Text style={styles.podiumRank}>2</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {performers[1].name.split(' ')[0]}
                  </Text>
                  <Text style={styles.podiumScore}>{performers[1].score}%</Text>
                </View>

                {/* 1st Place */}
                <View style={styles.podiumPlace}>
                  <MaterialCommunityIcons
                    name="crown"
                    size={24}
                    color="#FFD700"
                    style={{ marginBottom: 4 }}
                  />
                  <View style={[styles.podiumMedal, { backgroundColor: '#FFD700' + '30' }]}>
                    <SportIcon sportId={performers[0].sport} size={32} />
                  </View>
                  <View style={[styles.podiumBar, styles.podiumBar1]}>
                    <Text style={styles.podiumRank}>1</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {performers[0].name.split(' ')[0]}
                  </Text>
                  <Text style={styles.podiumScore}>{performers[0].score}%</Text>
                </View>

                {/* 3rd Place */}
                <View style={styles.podiumPlace}>
                  <View style={[styles.podiumMedal, { backgroundColor: '#CD7F32' + '30' }]}>
                    <SportIcon sportId={performers[2].sport} size={32} />
                  </View>
                  <View style={[styles.podiumBar, styles.podiumBar3]}>
                    <Text style={styles.podiumRank}>3</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {performers[2].name.split(' ')[0]}
                  </Text>
                  <Text style={styles.podiumScore}>{performers[2].score}%</Text>
                </View>
              </View>
            )}

            {/* Full Rankings List */}
            <View style={styles.listContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Complete Rankings</Text>
                <Text style={styles.sectionSubtitle}>
                  {performers.length} athlete{performers.length !== 1 ? 's' : ''}
                </Text>
              </View>

              {performers.map((performer, index) => (
                <TouchableOpacity
                  key={performer.id}
                  style={styles.performerCard}
                  onPress={() => {
                    // Navigate to Comparison screen with performer context
                    navigation.push('Comparison', {
                      kidId: performer.id,
                      sportId: performer.sport,
                      assessmentId: performer.assessmentId,
                      from: 'TopPerformers',
                    });
                  }}
                  activeOpacity={0.7}
                >
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
                      <View style={styles.sportTag}>
                        <SportIcon sportId={performer.sport} size={14} />
                        <Text style={styles.performerSport}>{performer.sportName}</Text>
                      </View>
                      <Text style={styles.performerAge}>
                        {performer.ageGroup} • {performer.gender || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.percentileBadge}>
                      <MaterialCommunityIcons name="chart-line" size={12} color={COLORS.success} />
                      <Text style={styles.percentileText}>
                        {performer.percentile}th percentile
                      </Text>
                    </View>
                  </View>

                  <View style={styles.scoreContainer}>
                    <Text style={styles.scoreNumber}>{performer.score}%</Text>
                    <View style={styles.starRow}>
                      <MaterialCommunityIcons name="star" size={12} color="#FFD700" />
                      <Text style={styles.scoreLabel}>Score</Text>
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>

            {/* View Full History Button */}
            <TouchableOpacity
              style={styles.viewHistoryButton}
              onPress={() => navigation.navigate('History')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="history" size={24} color={COLORS.primary} />
              <View style={styles.viewHistoryTextContainer}>
                <Text style={styles.viewHistoryTitle}>View Full History</Text>
                <Text style={styles.viewHistorySubtitle}>See all assessment records</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Rankings</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Sports Filter */}
              <Text style={styles.modalSectionTitle}>
                <MaterialCommunityIcons name="trophy" size={18} color={COLORS.primary} /> Sport
              </Text>
              <View style={styles.modalOptionsGrid}>
                {sports.map((sport) => (
                  <TouchableOpacity
                    key={sport.id}
                    style={[
                      styles.modalOption,
                      selectedSport === sport.id && styles.modalOptionActive,
                    ]}
                    onPress={() => setSelectedSport(sport.id)}
                  >
                    {sport.id !== 'all' && <SportIcon sportId={sport.id} size={20} />}
                    <Text
                      style={[
                        styles.modalOptionText,
                        selectedSport === sport.id && styles.modalOptionTextActive,
                      ]}
                    >
                      {sport.name}
                    </Text>
                    {selectedSport === sport.id && (
                      <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Age Groups Filter */}
              <Text style={styles.modalSectionTitle}>
                <Ionicons name="people" size={18} color={COLORS.primary} /> Age Groups
              </Text>
              <View style={styles.modalOptionsGrid}>
                {AGE_GROUPS.map((ageGroup) => (
                  <TouchableOpacity
                    key={ageGroup}
                    style={[
                      styles.modalOption,
                      selectedAgeGroups.includes(ageGroup) && styles.modalOptionActive,
                    ]}
                    onPress={() => toggleAgeGroupFilter(ageGroup)}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        selectedAgeGroups.includes(ageGroup) && styles.modalOptionTextActive,
                      ]}
                    >
                      {ageGroup} years
                    </Text>
                    {selectedAgeGroups.includes(ageGroup) && (
                      <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => {
                  clearAllFilters();
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.modalButtonPrimaryText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight + '40',
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 8,
    marginBottom: 8,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
    flex: 1,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  filterBadge: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  activeFiltersScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  clearFiltersText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '600',
  },
  contentWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
    textAlign: 'center',
  },
  podiumScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
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
    marginBottom: 4,
  },
  sportTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  performerSport: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  performerAge: {
    fontSize: 12,
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
    alignSelf: 'flex-start',
  },
  percentileText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.success,
  },
  scoreContainer: {
    alignItems: 'center',
    marginLeft: 8,
    marginRight: 8,
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
  viewHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  viewHistoryTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  viewHistoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  viewHistorySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalBody: {
    padding: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 8,
  },
  modalOptionsGrid: {
    gap: 10,
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  modalOptionActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  modalOptionText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  modalOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});