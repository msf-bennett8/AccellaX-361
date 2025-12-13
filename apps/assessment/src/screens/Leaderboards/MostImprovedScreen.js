// Location: /apps/assessment/src/screens/Leaderboards/MostImprovedScreen.js
// Athletes with biggest improvements

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

export default function MostImprovedScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('month');
  const [improvedAthletes, setImprovedAthletes] = useState([]);

  const timeframes = [
    { id: 'week', name: 'This Week' },
    { id: 'month', name: 'This Month' },
    { id: 'quarter', name: 'This Quarter' },
    { id: 'year', name: 'This Year' },
  ];

  useEffect(() => {
    loadMostImproved();
  }, [timeframe]);

  const loadMostImproved = async () => {
    try {
      // TODO: Load from database based on timeframe
      // Mock data for now
      const mockData = [
        { id: 1, name: 'Ahmed Hassan', sport: 'Football', improvement: 45, previousScore: 60, currentScore: 87, tests: 5 },
        { id: 2, name: 'Linda Wambui', sport: 'Athletics', improvement: 38, previousScore: 55, currentScore: 76, tests: 4 },
        { id: 3, name: 'Brian Onyango', sport: 'Rugby', improvement: 35, previousScore: 62, currentScore: 84, tests: 6 },
        { id: 4, name: 'Catherine Njoki', sport: 'Basketball', improvement: 32, previousScore: 58, currentScore: 77, tests: 4 },
        { id: 5, name: 'Samuel Koech', sport: 'Athletics', improvement: 28, previousScore: 65, currentScore: 83, tests: 5 },
        { id: 6, name: 'Joyce Akinyi', sport: 'Football', improvement: 25, previousScore: 60, currentScore: 75, tests: 3 },
      ];
      setImprovedAthletes(mockData);
    } catch (error) {
      console.error('Error loading most improved:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMostImproved();
    setRefreshing(false);
  };

  const getImprovementColor = (improvement) => {
    if (improvement >= 40) return COLORS.success;
    if (improvement >= 25) return '#00B894';
    return COLORS.warning;
  };

  return (
    <View style={styles.container}>
      <Header
        title="Most Improved"
        subtitle="Biggest performance gains"
        showBackButton={true}
        onLeftPress={() => navigation.goBack()}
      />

      {/* Timeframe Filter */}
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
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="trending-up" size={20} color={COLORS.success} />
          <Text style={styles.infoText}>
            Showing athletes with the highest improvement percentage over selected timeframe
          </Text>
        </View>

        {/* Improvements List */}
        <View style={styles.listContainer}>
          {improvedAthletes.map((athlete, index) => (
            <View key={athlete.id} style={styles.athleteCard}>
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
                  <Text style={styles.athleteSport}>{athlete.sport}</Text>
                  <View style={styles.dotSeparator} />
                  <Text style={styles.athleteTests}>{athlete.tests} assessments</Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${(athlete.previousScore / 100) * 100}%`,
                          backgroundColor: COLORS.border,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${(athlete.currentScore / 100) * 100}%`,
                          backgroundColor: getImprovementColor(athlete.improvement),
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.scoreLabels}>
                    <Text style={styles.scoreLabel}>
                      {athlete.previousScore} → {athlete.currentScore}
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
            </View>
          ))}
        </View>

        {/* Empty State */}
        {improvedAthletes.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="chart-line" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No Data Yet</Text>
            <Text style={styles.emptySubtitle}>
              Athletes need multiple assessments to track improvement
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
progressFill: {
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
    paddingHorizontal: 40,
    },
});