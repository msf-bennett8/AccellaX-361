// Location: /apps/assessment/src/screens/Leaderboards/MostImprovedScreen.js
// Athletes with biggest improvements - WITH REAL DATA

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
import { calculateCompositeScore } from '../../utils/calculations';
import { getAllAssessments } from '../../services/assessmentService';
import { getAllKids } from '../../database/db';
import { DEFAULT_SPORTS } from '../../config/sports';

// Sport icon mapping
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

export default function MostImprovedScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month');
  const [selectedAgeGroups, setSelectedAgeGroups] = useState([]);
  const [improvedAthletes, setImprovedAthletes] = useState([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [showFilter, setShowFilter] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const timeframes = [
    { id: 'week', name: 'This Week', days: 7 },
    { id: 'month', name: 'This Month', days: 30 },
    { id: 'quarter', name: 'This Quarter', days: 90 },
    { id: 'year', name: 'This Year', days: 365 },
  ];

  useEffect(() => {
    loadMostImproved();
  }, [timeframe, selectedAgeGroups]);

  const loadMostImproved = async () => {
    try {
      setLoading(true);

      // Get lookback period
      const lookbackDays = timeframes.find(tf => tf.id === timeframe)?.days || 30;
      const today = new Date();
      const cutoffDate = new Date(today);
      cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);
      const comparisonDate = new Date(cutoffDate);
      comparisonDate.setDate(comparisonDate.getDate() - lookbackDays);

      console.log(`📅 Timeframe: ${timeframe} (${lookbackDays} days)`);
      console.log(`📅 Today: ${today.toISOString().split('T')[0]}`);
      console.log(`📅 Cutoff: ${cutoffDate.toISOString().split('T')[0]}`);
      console.log(`📅 Comparison: ${comparisonDate.toISOString().split('T')[0]}`);

      // Fetch all assessments and kids
      const assessments = await getAllAssessments();
      const kids = await getAllKids();

      if (!assessments || assessments.length === 0) {
        console.log('ℹ️ No assessments found');
        setImprovedAthletes([]);
        setLoading(false);
        return;
      }

      console.log(`📊 Processing ${assessments.length} assessments for ${kids.length} kids`);

      // 🔍 DEBUG: Show sample assessment dates
      console.log('🔍 Sample assessments:', assessments.slice(0, 3).map(a => ({
        kid_id: a.kid_id,
        sport_id: a.sport_id,
        date: a.assessment_date,
        results_count: a.results?.length || 0
      })));

      // Group assessments by kid + sport
      const kidSportMap = {};
      assessments.forEach(assessment => {
        const key = `${assessment.kid_id}_${assessment.sport_id}`;
        if (!kidSportMap[key]) {
          kidSportMap[key] = [];
        }
        kidSportMap[key].push(assessment);
      });

      // Calculate improvements
      const improvements = [];

      Object.entries(kidSportMap).forEach(([key, kidSportAssessments]) => {
        // FIX: Extract sport_id from the LAST underscore since kid_id contains underscores
        const lastUnderscoreIndex = key.lastIndexOf('_');
        const kidId = key.substring(0, lastUnderscoreIndex);
        const sportId = key.substring(lastUnderscoreIndex + 1);
        const kid = kids.find(k => k.id === kidId);
        if (!kid) return;

        // Filter by age group if selected
        if (selectedAgeGroups.length > 0 && !selectedAgeGroups.includes(kid.age_group)) {
          return;
        }

         // Need at least 2 assessments to compare
        if (kidSportAssessments.length < 2) {
          console.log(`⏭️ ${kid.name} (${sportId}): Only ${kidSportAssessments.length} assessment, need at least 2`);
          return;
        }

        console.log(`👤 ${kid.name} (${sportId}): Has ${kidSportAssessments.length} assessments`);
        console.log(`   Raw dates:`, kidSportAssessments.map(a => a.assessment_date));

        // Sort assessments by date (oldest first)
        kidSportAssessments.sort((a, b) => 
          new Date(a.assessment_date) - new Date(b.assessment_date)
        );

        console.log(`   Sorted dates:`, kidSportAssessments.map(a => a.assessment_date));

        // Get the two most recent assessments
        const latestAssessment = kidSportAssessments[kidSportAssessments.length - 1];
        const previousAssessment = kidSportAssessments[kidSportAssessments.length - 2];

        // Check if EITHER assessment is within the selected timeframe
        const latestDate = new Date(latestAssessment.assessment_date);
        const previousDate = new Date(previousAssessment.assessment_date);
        
        console.log(`📅 ${kid.name}: Dates comparison:`);
        console.log(`   Latest: ${latestDate.toISOString().split('T')[0]} (${latestDate.getTime()})`);
        console.log(`   Previous: ${previousDate.toISOString().split('T')[0]} (${previousDate.getTime()})`);
        console.log(`   Cutoff: ${cutoffDate.toISOString().split('T')[0]} (${cutoffDate.getTime()})`);
        console.log(`   Latest >= Cutoff? ${latestDate >= cutoffDate} (${latestDate.getTime()} >= ${cutoffDate.getTime()})`);
        
        // Show improvement if the latest assessment is within the selected timeframe
        const isRecentEnough = latestDate >= cutoffDate;
        
        if (!isRecentEnough) {
          console.log(`❌ ${kid.name}: Latest assessment is BEFORE cutoff, skipping`);
          return;
        }
        
        console.log(`✅ ${kid.name}: Latest assessment is within timeframe!`);

        // Calculate time between assessments
        const daysBetween = Math.round((latestDate - previousDate) / (1000 * 60 * 60 * 24));
        console.log(`📈 ${kid.name} (${sportId}): Comparing assessments ${daysBetween} days apart`);
        
        // Skip if assessments are too close together (same day)
        if (daysBetween < 1) {
          console.log(`⏭️ ${kid.name}: Assessments on same day, skipping`);
          return;
        }

        // Calculate scores
        const latestScore = calculateCompositeScore(
          latestAssessment.results,
          sportId,
          kid.age_group,
          kid.gender
        ).totalScore;

        const previousScore = calculateCompositeScore(
          previousAssessment.results,
          sportId,
          kid.age_group,
          kid.gender
        ).totalScore;

        // Calculate relative improvement %
        const absoluteImprovement = latestScore - previousScore;
        const relativeImprovement = previousScore > 0
          ? Math.round((absoluteImprovement / previousScore) * 100)
          : 0;

        // Only show positive improvements
        if (relativeImprovement > 0) {
          improvements.push({
            id: `${kidId}_${sportId}`,
            kidId,
            name: kid.name,
            ageGroup: kid.age_group,
            sport: sportId,
            sportName: DEFAULT_SPORTS.find(s => s.id === sportId)?.name || sportId,
            improvement: relativeImprovement,
            absoluteImprovement,
            previousScore,
            currentScore: latestScore,
            assessmentCount: kidSportAssessments.length,
            latestAssessment,
            previousAssessment,
          });
        }
      });

      // Sort by improvement % (highest first)
      improvements.sort((a, b) => b.improvement - a.improvement);

      console.log(`✅ Found ${improvements.length} improvements`);
      setImprovedAthletes(improvements);
    } catch (error) {
      console.error('❌ Error loading most improved:', error);
      setImprovedAthletes([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMostImproved();
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
    setSelectedAgeGroups([]);
  };

  const removeAgeGroupFilter = (ageGroup) => {
    setSelectedAgeGroups(selectedAgeGroups.filter(ag => ag !== ageGroup));
  };

  const getImprovementColor = (improvement) => {
    if (improvement >= 40) return '#00C853'; // Bright green
    if (improvement >= 25) return '#00BFA5'; // Teal
    if (improvement >= 10) return '#00ACC1'; // Cyan
    return COLORS.warning;
  };

  const hasActiveFilters = selectedAgeGroups.length > 0;

  return (
    <View style={styles.container}>
      <Header
        title="Most Improved"
        subtitle="Biggest performance gains"
        showBackButton={true}
        onLeftPress={() => navigation.goBack()}
      />

      {/* Timeframe Filter */}
      {showFilter && (
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {timeframes.map((tf) => (
            <TouchableOpacity
              key={tf.id}
              style={[
                styles.filterChip,
                timeframe === tf.id && styles.filterChipActive,
              ]}
              onPress={() => setTimeframe(tf.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  timeframe === tf.id && styles.filterChipTextActive,
                ]}
              >
                {tf.name}
              </Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={[styles.filterChip, hasActiveFilters && styles.filterChipActive]}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons 
              name="filter" 
              size={16} 
              color={hasActiveFilters ? COLORS.white : COLORS.primary} 
            />
            <Text style={[styles.filterChipText, hasActiveFilters && styles.filterChipTextActive]}>
              Age Groups
            </Text>
            {hasActiveFilters && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{selectedAgeGroups.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Active Age Group Filters */}
        {hasActiveFilters && (
          <View style={styles.activeFiltersContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activeFiltersScroll}
            >
              {selectedAgeGroups.map((ageGroup) => (
                <View key={ageGroup} style={styles.activeFilterChip}>
                  <Ionicons name="people-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.activeFilterText}>{ageGroup} yrs</Text>
                  <TouchableOpacity onPress={() => removeAgeGroupFilter(ageGroup)}>
                    <Ionicons name="close-circle" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.clearFiltersButton} onPress={clearAllFilters}>
                <Text style={styles.clearFiltersText}>Clear All</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
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
            text="Calculating improvements..." 
            color="#1565C0"
          />
        ) : improvedAthletes.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="chart-line" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No Improvements Found</Text>
            <Text style={styles.emptySubtitle}>
              Athletes need at least 2 assessments in the selected timeframe to track improvement
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
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="trending-up" size={20} color={COLORS.success} />
            <Text style={styles.infoText}>
              Showing {improvedAthletes.length} athlete{improvedAthletes.length !== 1 ? 's' : ''} with the highest improvement over {timeframes.find(tf => tf.id === timeframe)?.name.toLowerCase()}
            </Text>
          </View>

          {/* Improvements List */}
          <View style={styles.listContainer}>
            {improvedAthletes.map((athlete, index) => (
              <TouchableOpacity
                key={athlete.id}
                style={styles.athleteCard}
                onPress={() => {
                  // Navigate to Comparison screen with athlete context
                  // Using 'push' instead of 'navigate' to ensure proper back navigation
                  navigation.push('Comparison', {
                    kidId: athlete.kidId,
                    sportId: athlete.sport,
                    assessmentId: athlete.latestAssessment?.id,
                    previousAssessmentId: athlete.previousAssessment?.id,
                    highlightImprovement: true,
                    // Pass origin for tracking
                    from: 'MostImproved',
                  });
                }}
                activeOpacity={0.7}
              >
                {/* Rank Badge */}
                <View style={styles.rankContainer}>
                  <View style={[styles.rankBadge, { backgroundColor: getImprovementColor(athlete.improvement) + '20' }]}>
                    <Text style={[styles.rankNumber, { color: getImprovementColor(athlete.improvement) }]}>
                      #{index + 1}
                    </Text>
                  </View>
                  {index < 3 && (
                    <MaterialCommunityIcons
                      name="medal"
                      size={16}
                      color={getImprovementColor(athlete.improvement)}
                      style={styles.medalIcon}
                    />
                  )}
                </View>

                {/* Athlete Info */}
                <View style={styles.athleteInfo}>
                  <Text style={styles.athleteName}>{athlete.name}</Text>
                  <View style={styles.athleteMeta}>
                    <View style={styles.sportTag}>
                      <SportIcon sportId={athlete.sport} size={14} />
                      <Text style={styles.athleteSport}>{athlete.sportName}</Text>
                    </View>
                    <View style={styles.dotSeparator} />
                    <Text style={styles.athleteTests}>{athlete.assessmentCount} assessments</Text>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFillPrevious,
                          {
                            width: `${athlete.previousScore}%`,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.progressFillCurrent,
                          {
                            width: `${athlete.currentScore}%`,
                            backgroundColor: getImprovementColor(athlete.improvement),
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.scoreLabels}>
                      <Text style={styles.scoreLabel}>
                        {athlete.previousScore}% → {athlete.currentScore}%
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Improvement Badge */}
                <View style={styles.improvementContainer}>
                  <View style={[styles.improvementBadge, { backgroundColor: getImprovementColor(athlete.improvement) }]}>
                    <Ionicons name="trending-up" size={20} color={COLORS.white} />
                    <Text style={styles.improvementText}>+{athlete.improvement}%</Text>
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

      {/* Age Group Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Age Group</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
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
                <Text style={styles.modalButtonPrimaryText}>Apply</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
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
  filterBadge: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  activeFiltersContainer: {
    marginTop: 8,
  },
  activeFiltersScroll: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 8,
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
  scrollContent: {
    paddingBottom: 32,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.success + '20',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.success,
    lineHeight: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  athleteCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    alignItems: 'center',
  },
  rankContainer: {
    alignItems: 'center',
    marginRight: 12,
  },
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  medalIcon: {
    marginTop: 4,
  },
  athleteInfo: {
    flex: 1,
  },
  athleteName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  athleteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sportTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  athleteSport: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textSecondary,
    marginHorizontal: 8,
  },
  athleteTests: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFillPrevious: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: COLORS.border,
    borderRadius: 4,
  },
  progressFillCurrent: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    borderRadius: 4,
  },
  scoreLabels: {
    marginTop: 4,
  },
  scoreLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  improvementContainer: {
    justifyContent: 'center',
    marginLeft: 12,
    marginRight: 8,
  },
  improvementBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 70,
  },
  improvementText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
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
    maxHeight: '60%',
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
  modalOptionsGrid: {
    gap: 10,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalOptionActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  modalOptionText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
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
  },
  modalButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});