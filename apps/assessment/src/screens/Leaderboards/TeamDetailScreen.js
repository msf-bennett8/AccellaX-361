// Location: /apps/assessment/src/screens/Leaderboards/TeamDetailScreen.js
// Detailed view of team performance with individual kid scores

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { COLORS, HOUSE_TEAMS } from '../../utils/constants';
import { getAllKids, getAllAssessments } from '../../database/db';
import { calculateCompositeScore } from '../../utils/calculations';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function TeamDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { teamId, teamName, teamColor } = route.params;
  const scrollViewRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamStats, setTeamStats] = useState({
    avgScore: 0,
    totalAssessments: 0,
    topPerformer: null,
    bottomPerformer: null,
  });
  const [sortBy, setSortBy] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedAgeGroups, setExpandedAgeGroups] = useState({});

  useEffect(() => {
    loadTeamDetails();
  }, [teamId]);

  useEffect(() => {
    sortMembers();
  }, [sortBy, sortOrder]);

  const loadTeamDetails = async () => {
    try {
      setLoading(true);

      const [allKids, allAssessments] = await Promise.all([
        getAllKids(),
        getAllAssessments(),
      ]);

      const teamKids = allKids.filter(
        k => k.house_team === teamId && k.status === 'active'
      );

      if (teamKids.length === 0) {
        setTeamMembers([]);
        setLoading(false);
        return;
      }

      const membersWithScores = teamKids.map(kid => {
        const kidAssessments = allAssessments.filter(a => a.kid_id === kid.id);

        if (kidAssessments.length === 0) {
          return {
            ...kid,
            avgScore: 0,
            totalAssessments: 0,
            latestAssessmentDate: null,
            sports: [],
          };
        }

        const sportIds = [...new Set(kidAssessments.map(a => a.sport_id))];
        let totalScore = 0;
        let scoredAssessments = 0;

        sportIds.forEach(sportId => {
          const latestForSport = kidAssessments
            .filter(a => a.sport_id === sportId)
            .sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date))[0];

          if (latestForSport && latestForSport.results) {
            const score = calculateCompositeScore(
              latestForSport.results,
              sportId,
              kid.age_group,
              kid.gender
            ).totalScore;

            totalScore += score;
            scoredAssessments++;
          }
        });

        const avgScore = scoredAssessments > 0 ? Math.round(totalScore / scoredAssessments) : 0;
        const latestAssessment = kidAssessments.sort(
          (a, b) => new Date(b.assessment_date) - new Date(a.assessment_date)
        )[0];

        return {
          ...kid,
          avgScore,
          totalAssessments: kidAssessments.length,
          latestAssessmentDate: latestAssessment?.assessment_date,
          sports: sportIds,
        };
      });

      const scores = membersWithScores.map(m => m.avgScore).filter(s => s > 0);
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
        : 0;

      const topPerformer = membersWithScores.reduce((top, member) =>
        member.avgScore > (top?.avgScore || 0) ? member : top
      , null);

      const bottomPerformer = membersWithScores
        .filter(m => m.avgScore > 0)
        .reduce((bottom, member) =>
          member.avgScore < (bottom?.avgScore || Infinity) ? member : bottom
        , null);

      setTeamStats({
        avgScore,
        totalAssessments: membersWithScores.reduce((sum, m) => sum + m.totalAssessments, 0),
        topPerformer,
        bottomPerformer,
      });

      setTeamMembers(membersWithScores);
    } catch (error) {
      console.error('Error loading team details:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortMembers = () => {
    const sorted = [...teamMembers].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'score':
          comparison = b.avgScore - a.avgScore;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'age':
          comparison = a.age - b.age;
          break;
        case 'assessments':
          comparison = b.totalAssessments - a.totalAssessments;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? -comparison : comparison;
    });

    setTeamMembers(sorted);
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const toggleAgeGroup = (ageGroup) => {
    setExpandedAgeGroups(prev => ({
      ...prev,
      [ageGroup]: !prev[ageGroup],
    }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTeamDetails();
    setRefreshing(false);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return COLORS.primary;
    if (score >= 40) return COLORS.warning;
    return COLORS.error;
  };

  const getHouseTeamInfo = () => {
    return HOUSE_TEAMS.find(t => t.id === teamId);
  };

  const getMembersByAgeGroup = () => {
    const grouped = {};
    
    teamMembers.forEach(member => {
      if (!grouped[member.age_group]) {
        grouped[member.age_group] = [];
      }
      grouped[member.age_group].push(member);
    });
    
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  };

  const houseTeam = getHouseTeamInfo();

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title={teamName}
          showBackButton={true}
          onLeftPress={() => navigation.goBack()}
        />
        <LoadingSpinner overlay text="Loading team details..." />
      </View>
    );
  }

  const ageGroupsData = getMembersByAgeGroup();

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Header
          title={teamName}
          subtitle={`${teamMembers.length} athletes`}
          showBackButton={true}
          onLeftPress={() => navigation.goBack()}
        />
      </View>

      <View style={styles.scrollViewWrapper}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          scrollEnabled={true}
          nestedScrollEnabled={true}
        >
          <View style={styles.teamHeader}>
            <MaterialCommunityIcons
              name={houseTeam?.icon || 'shield-account'}
              size={48}
              color={teamColor}
            />
            <Text style={styles.teamTitle}>{teamName}</Text>
            <Text style={styles.teamSubtitle}>{houseTeam?.emoji}</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{teamStats.avgScore}</Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{teamMembers.length}</Text>
              <Text style={styles.statLabel}>Athletes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{teamStats.totalAssessments}</Text>
              <Text style={styles.statLabel}>Assessments</Text>
            </View>
          </View>

          {teamStats.topPerformer && (
            <View style={styles.performersContainer}>
              <View style={styles.performerCard}>
                <Ionicons name="trophy" size={20} color="#FFD700" />
                <Text style={styles.performerLabel}>Top Performer</Text>
                <Text style={styles.performerName}>{teamStats.topPerformer.name}</Text>
                <Text style={styles.performerScore}>{teamStats.topPerformer.avgScore}</Text>
              </View>
              {teamStats.bottomPerformer && (
                <View style={styles.performerCard}>
                  <Ionicons name="trending-down" size={20} color={COLORS.warning} />
                  <Text style={styles.performerLabel}>Needs Support</Text>
                  <Text style={styles.performerName}>{teamStats.bottomPerformer.name}</Text>
                  <Text style={styles.performerScore}>{teamStats.bottomPerformer.avgScore}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'score' && styles.sortButtonActive]}
                onPress={() => toggleSort('score')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'score' && styles.sortButtonTextActive]}>
                  Score {sortBy === 'score' && (sortOrder === 'desc' ? '↓' : '↑')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
                onPress={() => toggleSort('name')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>
                  Name {sortBy === 'name' && (sortOrder === 'desc' ? '↓' : '↑')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'age' && styles.sortButtonActive]}
                onPress={() => toggleSort('age')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'age' && styles.sortButtonTextActive]}>
                  Age {sortBy === 'age' && (sortOrder === 'desc' ? '↓' : '↑')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'assessments' && styles.sortButtonActive]}
                onPress={() => toggleSort('assessments')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'assessments' && styles.sortButtonTextActive]}>
                  Assessments {sortBy === 'assessments' && (sortOrder === 'desc' ? '↓' : '↑')}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <View style={styles.membersContainer}>
            <Text style={styles.sectionTitle}>Team Members</Text>
            {ageGroupsData.map(([ageGroup, members]) => {
              const isExpanded = expandedAgeGroups[ageGroup] === true;
              
              return (
                <View key={ageGroup} style={styles.ageGroupContainer}>
                  <TouchableOpacity
                    style={styles.ageGroupHeader}
                    onPress={() => toggleAgeGroup(ageGroup)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.ageGroupHeaderLeft}>
                      <MaterialCommunityIcons
                        name="human-child"
                        size={18}
                        color={COLORS.textSecondary}
                      />
                      <Text style={styles.ageGroupTitle}>{ageGroup} years</Text>
                      <View style={styles.ageGroupBadge}>
                        <Text style={styles.ageGroupBadgeText}>{members.length}</Text>
                      </View>
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>

                  {isExpanded && members.map((member) => {
                    let sportsEnrolled = [];
                    if (member.sports_enrolled) {
                      try {
                        let parsed = member.sports_enrolled;
                        
                        if (typeof parsed === 'string') {
                          parsed = JSON.parse(parsed);
                          if (typeof parsed === 'string') {
                            parsed = JSON.parse(parsed);
                          }
                        }
                        
                        if (Array.isArray(parsed)) {
                          sportsEnrolled = parsed;
                        }
                      } catch (e) {
                        console.warn('Failed to parse sports for', member.name, ':', e.message);
                        sportsEnrolled = [];
                      }
                    }

                    const SPORTS_CONFIG = {
                      football: { name: 'Football', icon: '⚽' },
                      athletics: { name: 'Athletics', icon: '🏃' },
                      rugby: { name: 'Rugby', icon: '🏉' },
                      swimming: { name: 'Swimming', icon: '🏊' },
                      tennis: { name: 'Tennis', icon: '🎾' },
                      basketball: { name: 'Basketball', icon: '🏀' },
                    };

                    const primarySport = member.primary_sport;
                    const sortedSports = [...sportsEnrolled].sort((a, b) => {
                      if (a === primarySport) return -1;
                      if (b === primarySport) return 1;
                      return 0;
                    });

                    return (
                      <View key={member.id} style={styles.memberCard}>
                        <View style={styles.memberRank}>
                          <Text style={styles.memberRankText}>
                            {teamMembers.findIndex(m => m.id === member.id) + 1}
                          </Text>
                        </View>

                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>{member.name}</Text>
                          <View style={styles.memberMeta}>
                            <Text style={styles.memberMetaText}>
                              Age {member.age} • {member.gender} • {member.totalAssessments} assessments
                            </Text>
                          </View>
                          {sortedSports.length > 0 && (
                            <View style={styles.memberSports}>
                              {sortedSports.map((sportId, idx) => {
                                const sport = SPORTS_CONFIG[sportId];
                                if (!sport) return null;
                                return (
                                  <Text key={sportId} style={styles.sportTag}>
                                    {sport.icon} {sport.name}
                                    {idx < sortedSports.length - 1 ? ' | ' : ''}
                                  </Text>
                                );
                              })}
                            </View>
                          )}
                        </View>

                        <View style={styles.memberScore}>
                          <View
                            style={[
                              styles.scoreBadge,
                              { backgroundColor: getScoreColor(member.avgScore) + '20' }
                            ]}
                          >
                            <Text
                              style={[
                                styles.scoreValue,
                                { color: getScoreColor(member.avgScore) }
                              ]}
                            >
                              {member.avgScore}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>

          {teamMembers.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="account-group-outline"
                size={64}
                color={COLORS.textSecondary}
              />
              <Text style={styles.emptyTitle}>No Team Members</Text>
              <Text style={styles.emptySubtitle}>
                No athletes have been assigned to {teamName} yet.
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
  headerContainer: {
    backgroundColor: COLORS.background,
    zIndex: 10,
  },
  scrollViewWrapper: {
    position: 'absolute',
    top: 116,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  teamHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: COLORS.white,
  },
  teamTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 12,
  },
  teamSubtitle: {
    fontSize: 32,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  performersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  performerCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  performerLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  performerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 4,
    textAlign: 'center',
  },
  performerScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 4,
  },
  sortContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortButtonText: {
    fontSize: 14,
    color: COLORS.text,
  },
  sortButtonTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  membersContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  ageGroupContainer: {
    marginBottom: 16,
  },
  ageGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  ageGroupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  ageGroupTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  ageGroupBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  ageGroupBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  memberCard: {
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
  memberRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberRankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  memberMeta: {
    marginTop: 4,
  },
  memberMetaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  memberSports: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  sportTag: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '500',
  },
  memberScore: {
    marginLeft: 12,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyState: {
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