// Location: /apps/assessment/src/screens/Leaderboards/TeamRankingsScreen.js
// Team-based performance comparisons with advanced filtering

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
import { COLORS } from '../../utils/constants';
import { getAllSports } from '../../database/db';

// House team definitions
const HOUSE_TEAMS = [
  { id: 'fire', name: 'Fire Team', icon: 'fire', iconFamily: 'MaterialCommunityIcons', color: '#FF6B6B' },
  { id: 'ice', name: 'Ice Team', icon: 'snowflake', iconFamily: 'MaterialCommunityIcons', color: '#4ECDC4' },
  { id: 'water', name: 'Water Team', icon: 'water', iconFamily: 'MaterialCommunityIcons', color: '#45B7D1' },
  { id: 'wind', name: 'Wind Team', icon: 'weather-windy', iconFamily: 'MaterialCommunityIcons', color: '#96CEB4' },
  { id: 'earth', name: 'Earth Team', icon: 'earth', iconFamily: 'MaterialCommunityIcons', color: '#FFEAA7' },
];

// Age group definitions
const AGE_GROUPS = [
  { id: '4-6', name: '4-6 years' },
  { id: '7-9', name: '7-9 years' },
  { id: '10-13', name: '10-13 years' },
  { id: '13+', name: '13+ years' },
];

export default function TeamRankingsScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [teams, setTeams] = useState([]);
  const [stats, setStats] = useState({ teams: 0, athletes: 0, assessments: 0 });
  const [showFilter, setShowFilter] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Filter state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sports, setSports] = useState([]);
  const [selectedSports, setSelectedSports] = useState([]);
  const [selectedAgeGroups, setSelectedAgeGroups] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  
  // Accordion state
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    loadSportsFromDB();
    loadTeamRankings();
  }, []);

  useEffect(() => {
    // Reload rankings when filters change
    loadTeamRankings();
  }, [selectedSports, selectedAgeGroups, selectedTeams]);

  const loadSportsFromDB = async () => {
    try {
      const sportsData = await getAllSports();
      setSports(sportsData);
    } catch (error) {
      console.error('Error loading sports:', error);
    }
  };

  const loadTeamRankings = async () => {
    try {
      // TODO: Replace with actual database query
      // For now, mock data that respects filters
      const mockData = [
        { 
          id: 1, 
          name: 'Green Eagles FC', 
          sport: 'Football',
          sportId: 'football',
          houseTeam: 'fire',
          ageGroup: '10-13',
          members: 45, 
          avgScore: 87, 
          totalAssessments: 180,
          topPerformer: 'John Kipchoge',
          recentChange: 5,
        },
        { 
          id: 2, 
          name: 'Thunder Athletics', 
          sport: 'Athletics',
          sportId: 'athletics',
          houseTeam: 'ice',
          ageGroup: '7-9',
          members: 38, 
          avgScore: 85, 
          totalAssessments: 152,
          topPerformer: 'Mary Wanjiku',
          recentChange: 3,
        },
        { 
          id: 3, 
          name: 'Lions Rugby Club', 
          sport: 'Rugby',
          sportId: 'rugby',
          houseTeam: 'water',
          ageGroup: '10-13',
          members: 32, 
          avgScore: 82, 
          totalAssessments: 128,
          topPerformer: 'David Omondi',
          recentChange: -2,
        },
        { 
          id: 4, 
          name: 'Hoops Basketball', 
          sport: 'Basketball',
          sportId: 'basketball',
          houseTeam: 'wind',
          ageGroup: '13+',
          members: 28, 
          avgScore: 80, 
          totalAssessments: 112,
          topPerformer: 'Grace Achieng',
          recentChange: 0,
        },
        { 
          id: 5, 
          name: 'Swift Strikers', 
          sport: 'Football',
          sportId: 'football',
          houseTeam: 'earth',
          ageGroup: '7-9',
          members: 35, 
          avgScore: 78, 
          totalAssessments: 140,
          topPerformer: 'Peter Kamau',
          recentChange: 4,
        },
      ];

      // Apply filters
      let filteredData = mockData;

      if (selectedSports.length > 0) {
        filteredData = filteredData.filter(team => 
          selectedSports.includes(team.sportId)
        );
      }

      if (selectedAgeGroups.length > 0) {
        filteredData = filteredData.filter(team => 
          selectedAgeGroups.includes(team.ageGroup)
        );
      }

      if (selectedTeams.length > 0) {
        filteredData = filteredData.filter(team => 
          selectedTeams.includes(team.houseTeam)
        );
      }

      setTeams(filteredData);

      // Calculate stats
      const totalMembers = filteredData.reduce((sum, team) => sum + team.members, 0);
      const totalAssessments = filteredData.reduce((sum, team) => sum + team.totalAssessments, 0);
      
      setStats({
        teams: filteredData.length,
        athletes: totalMembers,
        assessments: totalAssessments,
      });
    } catch (error) {
      console.error('Error loading team rankings:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTeamRankings();
    setRefreshing(false);
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const toggleSportFilter = (sportId) => {
    setSelectedSports(prev => 
      prev.includes(sportId)
        ? prev.filter(id => id !== sportId)
        : [...prev, sportId]
    );
  };

  const toggleAgeGroupFilter = (ageGroupId) => {
    setSelectedAgeGroups(prev => 
      prev.includes(ageGroupId)
        ? prev.filter(id => id !== ageGroupId)
        : [...prev, ageGroupId]
    );
  };

  const toggleTeamFilter = (teamId) => {
    setSelectedTeams(prev => 
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const clearAllFilters = () => {
    setSelectedSports([]);
    setSelectedAgeGroups([]);
    setSelectedTeams([]);
  };

  const removeFilter = (type, value) => {
    if (type === 'sport') {
      setSelectedSports(prev => prev.filter(id => id !== value));
    } else if (type === 'age') {
      setSelectedAgeGroups(prev => prev.filter(id => id !== value));
    } else if (type === 'team') {
      setSelectedTeams(prev => prev.filter(id => id !== value));
    }
  };

  const hasActiveFilters = () => {
    return selectedSports.length > 0 || selectedAgeGroups.length > 0 || selectedTeams.length > 0;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return COLORS.primary;
  };

  const getTrendIcon = (change) => {
    if (change > 0) return 'trending-up';
    if (change < 0) return 'trending-down';
    return 'minus';
  };

  const getTrendColor = (change) => {
    if (change > 0) return COLORS.success;
    if (change < 0) return COLORS.error;
    return COLORS.textSecondary;
  };

  const getHouseTeamInfo = (teamId) => {
    return HOUSE_TEAMS.find(t => t.id === teamId);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Team Rankings"
        subtitle="Compare team performance"
        showBackButton={true}
        onLeftPress={() => navigation.goBack()}
      />

      {/* Main Filter Button */}
      {showFilter && (
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Text style={styles.filterButtonText}>
            {hasActiveFilters() ? 'Filtered' : 'All'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      )}

      {/* Active Filters Chips (Horizontal Scroll) */}
      {showFilter && hasActiveFilters() && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersLabel}>Active Filters:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsScroll}
          >
            {selectedSports.map(sportId => {
              const sport = sports.find(s => s.id === sportId);
              return sport ? (
                <View key={sportId} style={styles.filterChip}>
                  <MaterialCommunityIcons name="soccer" size={14} color={COLORS.primary} />
                  <Text style={styles.filterChipText}>{sport.name}</Text>
                  <TouchableOpacity onPress={() => removeFilter('sport', sportId)}>
                    <Ionicons name="close-circle" size={18} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ) : null;
            })}
            {selectedAgeGroups.map(ageId => {
              const age = AGE_GROUPS.find(a => a.id === ageId);
              return age ? (
                <View key={ageId} style={styles.filterChip}>
                  <Ionicons name="people" size={14} color={COLORS.primary} />
                  <Text style={styles.filterChipText}>{age.name}</Text>
                  <TouchableOpacity onPress={() => removeFilter('age', ageId)}>
                    <Ionicons name="close-circle" size={18} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ) : null;
            })}
            {selectedTeams.map(teamId => {
              const team = HOUSE_TEAMS.find(t => t.id === teamId);
              return team ? (
                <View key={teamId} style={styles.filterChip}>
                  <MaterialCommunityIcons name={team.icon} size={14} color={COLORS.primary} />
                  <Text style={styles.filterChipText}>{team.name}</Text>
                  <TouchableOpacity onPress={() => removeFilter('team', teamId)}>
                    <Ionicons name="close-circle" size={18} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ) : null;
            })}
          </ScrollView>
        </View>
      )}

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <MaterialCommunityIcons name="filter-variant" size={24} color={COLORS.primary} />
                <Text style={styles.modalTitle}>Filter Rankings</Text>
              </View>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* By Sport Section */}
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => toggleSection('sport')}
              >
                <View style={styles.accordionTitleRow}>
                  <MaterialCommunityIcons name="soccer" size={20} color={COLORS.text} />
                  <Text style={styles.accordionTitle}>By Sport</Text>
                </View>
                <Ionicons
                  name={expandedSection === 'sport' ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={COLORS.text}
                />
              </TouchableOpacity>
              {expandedSection === 'sport' && (
                <View style={styles.accordionContent}>
                  {sports.map(sport => (
                    <TouchableOpacity
                      key={sport.id}
                      style={styles.filterOption}
                      onPress={() => toggleSportFilter(sport.id)}
                    >
                      <View style={styles.checkboxRow}>
                        <View style={[
                          styles.checkbox,
                          selectedSports.includes(sport.id) && styles.checkboxActive
                        ]}>
                          {selectedSports.includes(sport.id) && (
                            <Ionicons name="checkmark" size={16} color={COLORS.white} />
                          )}
                        </View>
                        <Text style={styles.filterOptionText}>{sport.name}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* By Age Group Section */}
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => toggleSection('age')}
              >
                <View style={styles.accordionTitleRow}>
                  <Ionicons name="people" size={20} color={COLORS.text} />
                  <Text style={styles.accordionTitle}>By Age Group</Text>
                </View>
                <Ionicons
                  name={expandedSection === 'age' ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={COLORS.text}
                />
              </TouchableOpacity>
              {expandedSection === 'age' && (
                <View style={styles.accordionContent}>
                  {AGE_GROUPS.map(age => (
                    <TouchableOpacity
                      key={age.id}
                      style={styles.filterOption}
                      onPress={() => toggleAgeGroupFilter(age.id)}
                    >
                      <View style={styles.checkboxRow}>
                        <View style={[
                          styles.checkbox,
                          selectedAgeGroups.includes(age.id) && styles.checkboxActive
                        ]}>
                          {selectedAgeGroups.includes(age.id) && (
                            <Ionicons name="checkmark" size={16} color={COLORS.white} />
                          )}
                        </View>
                        <Text style={styles.filterOptionText}>{age.name}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* By Team Section */}
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => toggleSection('team')}
              >
                <View style={styles.accordionTitleRow}>
                  <MaterialCommunityIcons name="shield-account" size={20} color={COLORS.text} />
                  <Text style={styles.accordionTitle}>By Team</Text>
                </View>
                <Ionicons
                  name={expandedSection === 'team' ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={COLORS.text}
                />
              </TouchableOpacity>
              {expandedSection === 'team' && (
                <View style={styles.accordionContent}>
                  {HOUSE_TEAMS.map(team => (
                    <TouchableOpacity
                      key={team.id}
                      style={styles.filterOption}
                      onPress={() => toggleTeamFilter(team.id)}
                    >
                      <View style={styles.checkboxRow}>
                        <View style={[
                          styles.checkbox,
                          selectedTeams.includes(team.id) && styles.checkboxActive
                        ]}>
                          {selectedTeams.includes(team.id) && (
                            <Ionicons name="checkmark" size={16} color={COLORS.white} />
                          )}
                        </View>
                        <MaterialCommunityIcons name={team.icon} size={18} color={team.color} />
                        <Text style={styles.filterOptionText}>{team.name}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearAllFilters}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Main Content */}
      <View style={[
        styles.contentWrapper, 
        { top: showFilter ? (hasActiveFilters() ? 240 : 184) : 116 }
      ]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          onScroll={(event) => {
            const currentScrollY = event.nativeEvent.contentOffset.y;
            if (currentScrollY > lastScrollY && currentScrollY > 50) {
              // Scrolling down - hide filter
              setShowFilter(false);
            } else if (currentScrollY < lastScrollY) {
              // Scrolling up - show filter
              setShowFilter(true);
            }
            setLastScrollY(currentScrollY);
          }}
          scrollEventThrottle={16}
        >
        {/* Summary Stats */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <MaterialCommunityIcons name="account-group" size={24} color={COLORS.primary} />
            <Text style={styles.summaryNumber}>{stats.teams}</Text>
            <Text style={styles.summaryLabel}>Teams</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="people" size={24} color={COLORS.success} />
            <Text style={styles.summaryNumber}>{stats.athletes}</Text>
            <Text style={styles.summaryLabel}>Athletes</Text>
          </View>
          <View style={styles.summaryCard}>
            <MaterialCommunityIcons name="clipboard-check" size={24} color={COLORS.warning} />
            <Text style={styles.summaryNumber}>{stats.assessments}</Text>
            <Text style={styles.summaryLabel}>Assessments</Text>
          </View>
        </View>

        {/* Teams List */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Team Rankings</Text>
          {teams.map((team, index) => (
            <TouchableOpacity
              key={team.id}
              style={styles.teamCard}
              activeOpacity={0.7}
            >
              {/* Rank Badge */}
              <View style={[styles.rankBadge, { backgroundColor: getRankColor(index + 1) + '20' }]}>
                <Text style={[styles.rankNumber, { color: getRankColor(index + 1) }]}>
                  {index + 1}
                </Text>
              </View>

              {/* Team Info */}
              <View style={styles.teamInfo}>
                <View style={styles.teamHeader}>
                  <Text style={styles.teamName}>{team.name}</Text>
                  {team.recentChange !== 0 && (
                    <View style={[styles.trendBadge, { backgroundColor: getTrendColor(team.recentChange) + '20' }]}>
                      <Ionicons
                        name={getTrendIcon(team.recentChange)}
                        size={12}
                        color={getTrendColor(team.recentChange)}
                      />
                      <Text style={[styles.trendText, { color: getTrendColor(team.recentChange) }]}>
                        {Math.abs(team.recentChange)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.teamMeta}>
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="trophy" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.metaText}>{team.sport}</Text>
                  </View>
                  <View style={styles.metaDot} />
                  <View style={styles.metaItem}>
                    {(() => {
                      const houseTeam = getHouseTeamInfo(team.houseTeam);
                      return houseTeam ? (
                        <>
                          <MaterialCommunityIcons name={houseTeam.icon} size={14} color={houseTeam.color} />
                          <Text style={styles.metaText}>{houseTeam.name}</Text>
                        </>
                      ) : (
                        <Text style={styles.metaText}>No Team</Text>
                      );
                    })()}
                  </View>
                  <View style={styles.metaDot} />
                  <View style={styles.metaItem}>
                    <Ionicons name="people" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.metaText}>{team.members} members</Text>
                  </View>
                </View>

                <View style={styles.teamStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Avg Score</Text>
                    <Text style={styles.statValue}>{team.avgScore}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Assessments</Text>
                    <Text style={styles.statValue}>{team.totalAssessments}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Top Performer</Text>
                    <Text style={styles.statValue} numberOfLines={1}>{team.topPerformer}</Text>
                  </View>
                </View>
              </View>

              {/* Score Badge */}
              <View style={styles.scoreContainer}>
                <View style={[styles.scoreBadge, { backgroundColor: getRankColor(index + 1) }]}>
                  <Text style={styles.scoreNumber}>{team.avgScore}</Text>
                </View>
                <View style={styles.starRow}>
                  <Ionicons name="star" size={10} color="#FFD700" />
                  <Text style={styles.scoreLabel}>Score</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Empty State */}
        {teams.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-group-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No Teams Found</Text>
            <Text style={styles.emptySubtitle}>
              {hasActiveFilters() 
                ? 'No teams match your current filters. Try adjusting your selection.'
                : 'Teams will appear here once assessments are completed'}
            </Text>
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  activeFiltersContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activeFiltersLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  filterChipsScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primary + '20',
    borderRadius: 16,
  },
  filterChipText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalBody: {
    paddingVertical: 8,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  accordionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  accordionContent: {
    paddingVertical: 8,
    backgroundColor: COLORS.white,
  },
  filterOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterOptionText: {
    fontSize: 15,
    color: COLORS.text,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
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
    backgroundColor: COLORS.background,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 12,
    backgroundColor: COLORS.background,
  },
  summaryCard: {
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
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
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
  teamCard: {
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  teamInfo: {
    flex: 1,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  teamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textSecondary,
    marginHorizontal: 8,
  },
  teamStats: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  scoreBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  scoreNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
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
});