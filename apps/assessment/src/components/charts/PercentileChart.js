// Location: /apps/assessment/src/components/charts/PercentileChart.js
// Percentile distribution chart showing kid's position in age group

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

/**
 * PercentileChart Component
 * 
 * @param {Number} percentile - Kid's percentile (0-100)
 * @param {String} metricName - Name of the metric
 * @param {String} kidValue - Kid's actual value
 * @param {String} unit - Unit of measurement
 * @param {String} ageGroup - Age group (e.g., '10-13')
 */
export default function PercentileChart({ 
  percentile = 0,
  metricName = 'Metric',
  kidValue = '—',
  unit = '',
  ageGroup = '',
}) {
  
  // Determine performance level
  const getPerformanceLevel = () => {
    if (percentile >= 75) return { label: 'Excellent', color: COLORS.success, icon: 'star' };
    if (percentile >= 50) return { label: 'Good', color: '#2196F3', icon: 'thumbs-up' };
    if (percentile >= 25) return { label: 'Fair', color: '#FF9800', icon: 'alert-circle' };
    return { label: 'Needs Work', color: COLORS.error, icon: 'alert' };
  };

  const performance = getPerformanceLevel();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.metricName}>{metricName}</Text>
          {ageGroup && (
            <Text style={styles.ageGroup}>Age Group: {ageGroup}</Text>
          )}
        </View>
        <View style={[styles.performanceBadge, { backgroundColor: performance.color + '20' }]}>
          <Ionicons name={performance.icon} size={16} color={performance.color} />
          <Text style={[styles.performanceText, { color: performance.color }]}>
            {performance.label}
          </Text>
        </View>
      </View>

      {/* Value Display */}
      <View style={styles.valueContainer}>
        <Text style={styles.value}>{kidValue}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>

      {/* Percentile Bar */}
      <View style={styles.percentileContainer}>
        <View style={styles.percentileBar}>
          <View 
            style={[
              styles.percentileFill, 
              { 
                width: `${percentile}%`, 
                backgroundColor: performance.color 
              }
            ]} 
          />
          <View 
            style={[
              styles.percentileMarker, 
              { 
                left: `${percentile}%`, 
                backgroundColor: performance.color 
              }
            ]}
          >
            <View style={styles.markerTriangle} />
          </View>
        </View>
        
        {/* Percentile Labels */}
        <View style={styles.labelsContainer}>
          <Text style={styles.label}>0</Text>
          <Text style={styles.label}>25</Text>
          <Text style={styles.label}>50</Text>
          <Text style={styles.label}>75</Text>
          <Text style={styles.label}>100</Text>
        </View>
      </View>

      {/* Percentile Text */}
      <View style={styles.percentileTextContainer}>
        <Ionicons name="stats-chart" size={18} color={performance.color} />
        <Text style={styles.percentileText}>
          <Text style={styles.percentileValue}>{percentile}th</Text> percentile in {ageGroup} age group
        </Text>
      </View>

      {/* Interpretation */}
      <View style={styles.interpretationContainer}>
        <Text style={styles.interpretationText}>
          {percentile >= 75 && `Outstanding! Better than ${percentile}% of peers.`}
          {percentile >= 50 && percentile < 75 && `Above average performance in this age group.`}
          {percentile >= 25 && percentile < 50 && `Room for improvement. Keep training!`}
          {percentile < 25 && `Focus on this metric in training sessions.`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  metricName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  ageGroup: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  performanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  performanceText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  value: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  unit: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  percentileContainer: {
    marginBottom: 12,
  },
  percentileBar: {
    height: 12,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 6,
    overflow: 'visible',
    position: 'relative',
  },
  percentileFill: {
    height: '100%',
    borderRadius: 6,
  },
  percentileMarker: {
    position: 'absolute',
    top: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    marginLeft: -14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  markerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.white,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  label: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  percentileTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  percentileText: {
    fontSize: 14,
    color: COLORS.text,
  },
  percentileValue: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  interpretationContainer: {
    backgroundColor: COLORS.backgroundDark,
    padding: 12,
    borderRadius: 8,
  },
  interpretationText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
});