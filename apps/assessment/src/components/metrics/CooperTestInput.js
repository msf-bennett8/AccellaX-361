// Location: /apps/assessment/src/components/metrics/CooperTestInput.js
// Special input for Cooper Test (12-minute run distance)

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * CooperTestInput Component
 * Input for Cooper Test (12-minute run) - distance in meters
 * 
 * @param {Object} props
 * @param {number} props.value - Distance in meters
 * @param {Function} props.onChange - Callback with distance
 * @param {boolean} props.disabled - Disable input
 * @param {number} props.previousValue - Previous assessment value
 * @param {string} props.ageGroup - Age group for benchmarks
 * @param {string} props.gender - Gender for benchmarks
 */
const CooperTestInput = ({
  value = 0,
  onChange,
  disabled = false,
  previousValue = null,
  ageGroup = null,
  gender = null,
}) => {
  const [distance, setDistance] = useState(value || 0);
  const [inputMode, setInputMode] = useState('meters'); // 'meters' or 'laps'
  const [laps, setLaps] = useState(Math.floor((value || 0) / 400)); // 400m track
  const [extraMeters, setExtraMeters] = useState((value || 0) % 400);

  // Handle distance input (meters)
  const handleDistanceChange = (text) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    const parsed = parseInt(numericValue, 10) || 0;
    setDistance(parsed);
    onChange(parsed);
    
    // Update laps calculation
    setLaps(Math.floor(parsed / 400));
    setExtraMeters(parsed % 400);
  };

  // Handle laps input
  const handleLapsChange = (text) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    const parsed = parseInt(numericValue, 10) || 0;
    setLaps(parsed);
    const totalDistance = (parsed * 400) + extraMeters;
    setDistance(totalDistance);
    onChange(totalDistance);
  };

  // Handle extra meters input
  const handleExtraMetersChange = (text) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    const parsed = parseInt(numericValue, 10) || 0;
    const clamped = Math.min(parsed, 399); // Max 399m extra
    setExtraMeters(clamped);
    const totalDistance = (laps * 400) + clamped;
    setDistance(totalDistance);
    onChange(totalDistance);
  };

  // Quick add buttons
  const handleQuickAdd = (meters) => {
    const newDistance = distance + meters;
    setDistance(newDistance);
    onChange(newDistance);
    setLaps(Math.floor(newDistance / 400));
    setExtraMeters(newDistance % 400);
  };

  // Get performance rating
  const getPerformanceRating = () => {
    if (!ageGroup || distance === 0) return null;

    // Simplified benchmarks (expand based on benchmarks.js)
    const benchmarks = {
      '4-6': { excellent: 800, good: 600, fair: 400 },
      '7-9': { excellent: 1200, good: 1000, fair: 800 },
      '10-13': { excellent: 1800, good: 1500, fair: 1200 },
      '13+': { excellent: 2400, good: 2000, fair: 1600 },
    };

    // Gender adjustments (males typically run 10-15% further)
    const genderMultiplier = gender === 'Female' ? 0.9 : 1.0;
    const ageGroupBenchmark = benchmarks[ageGroup];
    
    if (!ageGroupBenchmark) return null;

    const adjustedExcellent = ageGroupBenchmark.excellent * genderMultiplier;
    const adjustedGood = ageGroupBenchmark.good * genderMultiplier;
    const adjustedFair = ageGroupBenchmark.fair * genderMultiplier;

    if (distance >= adjustedExcellent) {
      return { rating: 'Excellent', color: '#4CAF50', icon: 'trophy', percentile: 90 };
    } else if (distance >= adjustedGood) {
      return { rating: 'Good', color: '#2196F3', icon: 'thumbs-up', percentile: 70 };
    } else if (distance >= adjustedFair) {
      return { rating: 'Fair', color: '#FF9800', icon: 'hand-right', percentile: 50 };
    } else {
      return { rating: 'Needs Work', color: '#F44336', icon: 'alert-circle', percentile: 30 };
    }
  };

  const rating = getPerformanceRating();

  // Calculate improvement
  const getImprovement = () => {
    if (!previousValue || previousValue === 0 || distance === 0) return null;
    const diff = distance - previousValue;
    const percentChange = (diff / previousValue) * 100;
    return {
      diff: Math.abs(diff),
      percent: Math.abs(percentChange).toFixed(1),
      improved: diff > 0,
    };
  };

  const improvement = getImprovement();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Cooper Test (12-Minute Run)</Text>
        {previousValue && (
          <View style={styles.previousBadge}>
            <Ionicons name="trending-up" size={12} color="#666" />
            <Text style={styles.previousText}>
              Previous: {previousValue}m
            </Text>
          </View>
        )}
      </View>

      {/* Current Distance Display */}
      <View style={styles.distanceDisplay}>
        <Text style={styles.distanceText}>{distance}</Text>
        <Text style={styles.unitText}>meters</Text>
        {laps > 0 && (
          <Text style={styles.lapsText}>
            {laps} lap{laps !== 1 ? 's' : ''} {extraMeters > 0 && `+ ${extraMeters}m`}
          </Text>
        )}
      </View>

      {/* Performance Rating */}
      {rating && distance > 0 && (
        <View style={[styles.ratingBadge, { backgroundColor: rating.color + '20' }]}>
          <Ionicons name={rating.icon} size={18} color={rating.color} />
          <Text style={[styles.ratingText, { color: rating.color }]}>
            {rating.rating} ({rating.percentile}th percentile)
          </Text>
        </View>
      )}

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
            {improvement.improved ? '+' : '-'}{improvement.diff}m ({improvement.percent}%)
          </Text>
        </View>
      )}

      {/* Input Mode Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            inputMode === 'meters' && styles.toggleButtonActive,
          ]}
          onPress={() => setInputMode('meters')}
        >
          <Text
            style={[
              styles.toggleText,
              inputMode === 'meters' && styles.toggleTextActive,
            ]}
          >
            Meters
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            inputMode === 'laps' && styles.toggleButtonActive,
          ]}
          onPress={() => setInputMode('laps')}
        >
          <Text
            style={[
              styles.toggleText,
              inputMode === 'laps' && styles.toggleTextActive,
            ]}
          >
            Laps (400m track)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Input Fields */}
      {inputMode === 'meters' ? (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Distance (meters)</Text>
          <TextInput
            style={[styles.input, disabled && styles.inputDisabled]}
            value={distance.toString()}
            onChangeText={handleDistanceChange}
            keyboardType="numeric"
            placeholder="0"
            editable={!disabled}
          />
        </View>
      ) : (
        <View style={styles.lapsInputContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Laps</Text>
            <TextInput
              style={[styles.input, disabled && styles.inputDisabled]}
              value={laps.toString()}
              onChangeText={handleLapsChange}
              keyboardType="numeric"
              placeholder="0"
              editable={!disabled}
            />
          </View>
          <Text style={styles.plusText}>+</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Extra meters</Text>
            <TextInput
              style={[styles.input, disabled && styles.inputDisabled]}
              value={extraMeters.toString()}
              onChangeText={handleExtraMetersChange}
              keyboardType="numeric"
              placeholder="0"
              editable={!disabled}
            />
          </View>
        </View>
      )}

      {/* Quick Add Buttons */}
      <View style={styles.quickAddContainer}>
        <Text style={styles.quickAddLabel}>Quick Add:</Text>
        <View style={styles.quickAddButtons}>
          {[50, 100, 200, 400].map((meters) => (
            <TouchableOpacity
              key={meters}
              style={[styles.quickAddButton, disabled && styles.buttonDisabled]}
              onPress={() => handleQuickAdd(meters)}
              disabled={disabled}
            >
              <Text style={styles.quickAddText}>+{meters}m</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={16} color="#666" />
        <Text style={styles.infoText}>
          The Cooper Test measures aerobic fitness. Run as far as possible in 12 minutes on a
          standard 400m track.
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
  distanceDisplay: {
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    paddingVertical: 20,
    marginBottom: 16,
  },
  distanceText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  unitText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  lapsText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#FFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  toggleText: {
    fontSize: 14,
    color: '#666',
  },
  toggleTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputDisabled: {
    opacity: 0.5,
  },
  lapsInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  plusText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
    marginHorizontal: 12,
    marginBottom: 12,
  },
  quickAddContainer: {
    marginTop: 16,
  },
  quickAddLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  quickAddButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAddButton: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  quickAddText: {
    fontSize: 14,
    fontWeight: '600',
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
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    lineHeight: 18,
  },
});

export default CooperTestInput;