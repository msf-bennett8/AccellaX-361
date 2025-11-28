// Location: /apps/assessment/src/components/metrics/BeepTestInput.js
// Special input for Beep Test (Multi-Stage Fitness Test)

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * BeepTestInput Component
 * Special picker for Beep Test levels and shuttles
 * 
 * @param {Object} props
 * @param {number} props.value - Current beep test score (level)
 * @param {Function} props.onChange - Callback with level number
 * @param {boolean} props.disabled - Disable input
 * @param {number} props.previousValue - Previous assessment value
 * @param {string} props.ageGroup - Age group for benchmark comparison
 * @param {string} props.gender - Gender for benchmark comparison
 */
const BeepTestInput = ({
  value = 0,
  onChange,
  disabled = false,
  previousValue = null,
  ageGroup = null,
  gender = null,
}) => {
  const [selectedLevel, setSelectedLevel] = useState(value ? Math.floor(value) : 1);
  const [selectedShuttle, setSelectedShuttle] = useState(
    value ? Math.round((value % 1) * 10) : 1
  );

  // Beep test levels with shuttles per level
  const beepTestLevels = [
    { level: 1, shuttles: 7, speed: 8.5 },
    { level: 2, shuttles: 8, speed: 9.0 },
    { level: 3, shuttles: 8, speed: 9.5 },
    { level: 4, shuttles: 9, speed: 10.0 },
    { level: 5, shuttles: 9, speed: 10.5 },
    { level: 6, shuttles: 10, speed: 11.0 },
    { level: 7, shuttles: 10, speed: 11.5 },
    { level: 8, shuttles: 11, speed: 12.0 },
    { level: 9, shuttles: 11, speed: 12.5 },
    { level: 10, shuttles: 11, speed: 13.0 },
    { level: 11, shuttles: 12, speed: 13.5 },
    { level: 12, shuttles: 12, speed: 14.0 },
    { level: 13, shuttles: 13, speed: 14.5 },
  ];

  // Get shuttles for selected level
  const getCurrentLevelData = () => {
    return beepTestLevels.find((l) => l.level === selectedLevel) || beepTestLevels[0];
  };

  // Handle level selection
  const handleLevelSelect = (level) => {
    if (disabled) return;
    setSelectedLevel(level);
    setSelectedShuttle(1);
    const score = level + (1 / getCurrentLevelData().shuttles);
    onChange(parseFloat(score.toFixed(2)));
  };

  // Handle shuttle selection
  const handleShuttleSelect = (shuttle) => {
    if (disabled) return;
    setSelectedShuttle(shuttle);
    const levelData = getCurrentLevelData();
    const score = selectedLevel + (shuttle / levelData.shuttles);
    onChange(parseFloat(score.toFixed(2)));
  };

  // Get performance rating based on benchmarks
  const getPerformanceRating = () => {
    if (!ageGroup) return null;
    
    // Simplified benchmarks (you can expand based on benchmarks.js)
    const benchmarks = {
      '4-6': { excellent: 3, good: 2, fair: 1 },
      '7-9': { excellent: 5, good: 4, fair: 3 },
      '10-13': { excellent: 7, good: 6, fair: 5 },
      '13+': { excellent: 9, good: 7, fair: 6 },
    };

    const ageGroupBenchmark = benchmarks[ageGroup];
    if (!ageGroupBenchmark) return null;

    const currentScore = selectedLevel + (selectedShuttle / getCurrentLevelData().shuttles);

    if (currentScore >= ageGroupBenchmark.excellent) {
      return { rating: 'Excellent', color: '#4CAF50', icon: 'trophy' };
    } else if (currentScore >= ageGroupBenchmark.good) {
      return { rating: 'Good', color: '#2196F3', icon: 'thumbs-up' };
    } else if (currentScore >= ageGroupBenchmark.fair) {
      return { rating: 'Fair', color: '#FF9800', icon: 'hand-right' };
    } else {
      return { rating: 'Needs Work', color: '#F44336', icon: 'alert-circle' };
    }
  };

  const rating = getPerformanceRating();

  // Calculate improvement
  const getImprovement = () => {
    if (!previousValue || previousValue === 0) return null;
    const currentScore = selectedLevel + (selectedShuttle / getCurrentLevelData().shuttles);
    const diff = currentScore - previousValue;
    const percentChange = (diff / previousValue) * 100;
    return {
      diff: Math.abs(diff).toFixed(1),
      percent: Math.abs(percentChange).toFixed(1),
      improved: diff > 0,
    };
  };

  const improvement = getImprovement();
  const levelData = getCurrentLevelData();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Beep Test (Multi-Stage Fitness Test)</Text>
        {previousValue && (
          <View style={styles.previousBadge}>
            <Ionicons name="trending-up" size={12} color="#666" />
            <Text style={styles.previousText}>
              Previous: Level {Math.floor(previousValue)}.{Math.round((previousValue % 1) * 10)}
            </Text>
          </View>
        )}
      </View>

      {/* Current Selection Display */}
      <View style={styles.selectionDisplay}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Selected:</Text>
          <Text style={styles.scoreText}>
            Level {selectedLevel}.{selectedShuttle}
          </Text>
          <Text style={styles.speedText}>
            {levelData.speed} km/h
          </Text>
        </View>

        {/* Performance Rating */}
        {rating && (
          <View style={[styles.ratingBadge, { backgroundColor: rating.color + '20' }]}>
            <Ionicons name={rating.icon} size={18} color={rating.color} />
            <Text style={[styles.ratingText, { color: rating.color }]}>
              {rating.rating}
            </Text>
          </View>
        )}
      </View>

      {/* Improvement Indicator */}
      {improvement && (
        <View
          style={[
            styles.improvementBadge,
            { backgroundColor: improvement.improved ? '#E8F5E9' : '#FFEBEE' },
          ]}
        >
          <Ionicons
            name={improvement.improved ? 'trending-up' : 'trending-down'}
            size={16}
            color={improvement.improved ? '#4CAF50' : '#F44336'}
          />
          <Text
            style={[
              styles.improvementText,
              { color: improvement.improved ? '#4CAF50' : '#F44336' },
            ]}
          >
            {improvement.improved ? '+' : '-'}{improvement.diff} levels ({improvement.percent}%)
          </Text>
        </View>
      )}

      {/* Level Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Level (1-13)</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.levelScroll}
        >
          {beepTestLevels.map((level) => (
            <TouchableOpacity
              key={level.level}
              style={[
                styles.levelButton,
                selectedLevel === level.level && styles.levelButtonActive,
                disabled && styles.buttonDisabled,
              ]}
              onPress={() => handleLevelSelect(level.level)}
              disabled={disabled}
            >
              <Text
                style={[
                  styles.levelButtonText,
                  selectedLevel === level.level && styles.levelButtonTextActive,
                ]}
              >
                {level.level}
              </Text>
              <Text style={styles.levelSpeedText}>{level.speed}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Shuttle Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Select Shuttle (1-{levelData.shuttles})
        </Text>
        <View style={styles.shuttleGrid}>
          {Array.from({ length: levelData.shuttles }, (_, i) => i + 1).map((shuttle) => (
            <TouchableOpacity
              key={shuttle}
              style={[
                styles.shuttleButton,
                selectedShuttle === shuttle && styles.shuttleButtonActive,
                disabled && styles.buttonDisabled,
              ]}
              onPress={() => handleShuttleSelect(shuttle)}
              disabled={disabled}
            >
              <Text
                style={[
                  styles.shuttleButtonText,
                  selectedShuttle === shuttle && styles.shuttleButtonTextActive,
                ]}
              >
                {shuttle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={16} color="#666" />
        <Text style={styles.infoText}>
          The Beep Test measures cardiovascular endurance. Complete as many shuttles as possible
          before the beep.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  previousBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previousText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  selectionDisplay: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  speedText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  improvementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  improvementText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  levelScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  levelButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 60,
  },
  levelButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  levelButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  levelButtonTextActive: {
    color: '#2196F3',
  },
  levelSpeedText: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  shuttleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shuttleButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  shuttleButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  shuttleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  shuttleButtonTextActive: {
    color: '#2196F3',
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    lineHeight: 18,
  },
});

export default BeepTestInput;