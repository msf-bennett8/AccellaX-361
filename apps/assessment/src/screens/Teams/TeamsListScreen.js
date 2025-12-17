// Location: /apps/assessment/src/screens/Teams/TeamsListScreen.js
// Browse all house teams with expandable member lists

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
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { COLORS, HOUSE_TEAMS } from '../../utils/constants';
import { getAllKids } from '../../database/db';

export default function TeamsListScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teams, setTeams] = useState([]);
  const [expandedTeams, setExpandedTeams] = useState({});
  const [expandedAgeGroups, setExpandedAgeGroups] = useState({}); // ✅ NEW

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading teams...');

      const allKids = await getAllKids();
      const activeKids = allKids.filter(k => k.status === 'active');

      // Group kids by house team
      const teamData = HOUSE_TEAMS.map(houseTeam => {
        const members = activeKids.filter(k => k.house_team === houseTeam.id);

        // Group by age group
        const ageGroups = {};
        members.forEach(member => {
          if (!ageGroups[member.age_group]) {
            ageGroups[member.age_group] = [];
          }
          ageGroups[member.age_group].push(member);
        });

        return {
          ...houseTeam,
          members,
          memberCount: members.length,
          ageGroups,
        };
      });

      setTeams(teamData);
      console.log('✅ Teams loaded:', teamData.length);
    } catch (error) {
      console.error('❌ Error loading teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTeam = (teamId) => {
    setExpandedTeams(prev => ({
      ...prev,
      [teamId]: !prev[teamId],
    }));
  };

  const toggleAgeGroup = (teamId, ageGroup) => {
    const key = `${teamId}_${ageGroup}`;
    setExpandedAgeGroups(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTeams();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Teams" />
        <LoadingSpinner overlay text="Loading teams..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Teams"
        subtitle="House team management"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Stats */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Ionicons name="people" size={24} color={COLORS.primary} />
            <Text style={styles.summaryNumber}>
              {teams.reduce((sum, t) => sum + t.memberCount, 0)}
            </Text>
            <Text style={styles.summaryLabel}>Total Athletes</Text>
          </View>
          <View style={styles.summaryCard}>
            <MaterialCommunityIcons name="shield-account" size={24} color={COLORS.success} />
            <Text style={styles.summaryNumber}>{HOUSE_TEAMS.length}</Text>
            <Text style={styles.summaryLabel}>House Teams</Text>
          </View>
        </View>

        {/* Teams List */}
        <View style={styles.teamsContainer}>
          {teams.map(team => (
            <View key={team.id} style={styles.teamContainer}>
              <TouchableOpacity
                style={[
                  styles.teamHeader,
                  { backgroundColor: team.color + '20' }
                ]}
                onPress={() => toggleTeam(team.id)}
                activeOpacity={0.7}
              >
                <View style={styles.teamHeaderLeft}>
                  <Text style={styles.teamEmoji}>{team.emoji}</Text>
                  <View style={styles.teamHeaderInfo}>
                    <Text style={styles.teamName}>{team.name}</Text>
                    <Text style={styles.teamMemberCount}>
                      {team.memberCount} {team.memberCount === 1 ? 'athlete' : 'athletes'}
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name={expandedTeams[team.id] ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color={COLORS.text}
                />
              </TouchableOpacity>

              {/* Expanded Content */}
              {expandedTeams[team.id] && (
                <View style={styles.teamContent}>
                  {team.memberCount === 0 ? (
                    <View style={styles.emptyTeam}>
                      <Ionicons name="people-outline" size={32} color={COLORS.textSecondary} />
                      <Text style={styles.emptyTeamText}>No athletes in this team yet</Text>
                    </View>
                  ) : (
                    Object.entries(team.ageGroups)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([ageGroup, members]) => {
                        const ageGroupKey = `${team.id}_${ageGroup}`;
                        const isAgeGroupExpanded = expandedAgeGroups[ageGroupKey];
                        
                        return (
                          <View key={ageGroup} style={styles.ageGroupSection}>
                            {/* Age Group Header - Collapsible */}
                            <TouchableOpacity
                              style={styles.ageGroupHeader}
                              onPress={() => toggleAgeGroup(team.id, ageGroup)}
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
                                name={isAgeGroupExpanded ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={COLORS.textSecondary}
                              />
                            </TouchableOpacity>

                            {/* Age Group Members */}
                            {isAgeGroupExpanded && members
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map(member => {
                                // Parse sports_enrolled safely with multiple fallbacks
                                let sportsEnrolled = [];
                                if (member.sports_enrolled) {
                                  try {
                                    let parsed = member.sports_enrolled;
                                    
                                    // Handle string (might be single or double stringified)
                                    if (typeof parsed === 'string') {
                                      parsed = JSON.parse(parsed);
                                      
                                      // Check if still a string (double stringified)
                                      if (typeof parsed === 'string') {
                                        parsed = JSON.parse(parsed);
                                      }
                                    }
                                    
                                    // Ensure it's an array
                                    if (Array.isArray(parsed)) {
                                      sportsEnrolled = parsed;
                                    }
                                  } catch (e) {
                                    console.warn('Failed to parse sports for', member.name, ':', e.message);
                                    sportsEnrolled = [];
                                  }
                                }

                                // Sports config
                                const SPORTS_CONFIG = {
                                  football: { name: 'Football' },
                                  athletics: { name: 'Athletics' },
                                  rugby: { name: 'Rugby' },
                                  swimming: { name: 'Swimming' },
                                  tennis: { name: 'Tennis' },
                                  basketball: { name: 'Basketball' },
                                };

                                // Sort sports: primary first, then others
                                const primarySport = member.primary_sport;
                                const sortedSports = [...sportsEnrolled].sort((a, b) => {
                                  if (a === primarySport) return -1;
                                  if (b === primarySport) return 1;
                                  return 0;
                                });

                                return (
                                  <View key={member.id} style={styles.memberRow}>
                                    <View style={styles.memberInfo}>
                                      <Text style={styles.memberName}>{member.name}</Text>
                                      <Text style={styles.memberMeta}>
                                        Age {member.age} • {member.gender}
                                      </Text>
                                      {/* Sports List with Primary Indicator */}
                                      {sortedSports.length > 0 && (
                                        <View style={styles.memberSports}>
                                          {sortedSports.map((sportId, idx) => {
                                            const sport = SPORTS_CONFIG[sportId];
                                            if (!sport) return null;
                                            
                                            const isPrimary = sportId === primarySport;
                                            
                                            return (
                                              <Text 
                                                key={sportId} 
                                                style={[
                                                  styles.sportTag,
                                                  isPrimary && styles.sportTagPrimary
                                                ]}
                                              >
                                                {sport.name}
                                                {idx < sortedSports.length - 1 ? ' | ' : ''}
                                              </Text>
                                            );
                                          })}
                                        </View>
                                      )}
                                    </View>
                                    <View style={styles.memberBadges}>
                                      {member.programType && (
                                        <View style={[styles.badge, { backgroundColor: COLORS.primary + '20' }]}>
                                          <Text style={[styles.badgeText, { color: COLORS.primary }]}>
                                            {member.programType}
                                          </Text>
                                        </View>
                                      )}
                                    </View>
                                  </View>
                                );
                              })}
                          </View>
                        );
                      })
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
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
  teamsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  teamContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  teamHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  teamEmoji: {
    fontSize: 32,
  },
  teamHeaderInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  teamMemberCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  teamContent: {
    backgroundColor: COLORS.white,
    paddingTop: 8,
  },
  emptyTeam: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTeamText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  ageGroupSection: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  ageGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: 8,
  },
  ageGroupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  ageGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  ageGroupBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  ageGroupBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  memberMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
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
  memberBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});