// Location: /apps/assessment/src/components/metrics/MetricComparison.js
// Compare metric values across multiple kids or time periods

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * MetricComparison Component
 * Compare metric performance across kids or assessments
 * 
 * @param {Object} props
 * @param {Object} props.metric - Metric object
 * @param {Array} props.comparisons - Array of comparison objects
 * @param {string} props.type - 'kids' | 'time' | 'ageGroup'
 * @param {Object} props.stats - Optional: min, max, avg, median
 */
const MetricComparison = ({
  metric,
  comparisons = [],
  type = 'kids', // 'kids', 'time', 'ageGroup'
  stats = null,
}) => {
  // Format value
  const formatValue = (val) => {
    if (val === null || val === undefined) return '--';
    
    switch (metric.type) {
      case 'numeric':
        return `${parseFloat(val).toFixed(metric.decimals || 1)} ${metric.unit}`;
      case 'rating':
        return `${val}/10`;
      case 'timed':
        return `${parseFloat(val).toFixed(2)}s`;
      case 'counted':
        return `${val} ${metric.unit}`;
      default:
        return val.toString();
    }
  };

  // Get percentile position (0-100)
  const getPercentile = (value) => {
    if (!value || comparisons.length === 0) return 0;
    
    const values = comparisons
      .map((c) => parseFloat(c.value))
      .filter((v) => !isNaN(v))
      .sort((a, b) => (metric.type === 'timed' ? a - b : b - a));
    
    if (values.length === 0) return 0;
    
    const numValue = parseFloat(value);
    const index = values.findIndex((v) => v <= numValue);
    
    return Math.round((index / values.length) * 100);
  };

  // Get performance color
  const getPerformanceColor = (value) => {
    const percentile = getPercentile(value);
    
    if (percentile >= 75) return '#4CAF50'; // Excellent
    if (percentile >= 50) return '#2196F3'; // Good
    if (percentile >= 25) return '#FF9800'; // Fair
    return '#F44336'; // Needs work
  };

  // Calculate bar width percentage
  const getBarWidth = (value) => {
    if (!value || !stats) return 0;
    
    const numValue = parseFloat(value);
    const min = parseFloat(stats.min) || 0;
    const max = parseFloat(stats.max) || 100;
    
    if (max === min) return 100;
    
    const range = max - min;
    const position = numValue - min;
    
    return Math.max(5, Math.min(100, (position / range) * 100));
  };

  // Get label based on type
  const getLabel = (comparison) => {
    switch (type) {
      case 'kids':
        return comparison.kidName || comparison.name;
      case 'time':
        return new Date(comparison.date).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        });
      case 'ageGroup':
        return comparison.ageGroup;
      default:
        return comparison.label;
    }
  };

  // Get rank emoji
  const getRankEmoji = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  // Sort comparisons (best first)
  const sortedComparisons = [...comparisons].sort((a, b) => {
    const aVal = parseFloat(a.value);
    const bVal = parseFloat(b.value);
    
    if (isNaN(aVal)) return 1;
    if (isNaN(bVal)) return -1;
    
    // For timed metrics, lower is better
    return metric.type === 'timed' ? aVal - bVal : bVal - aVal;
  });

  if (comparisons.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="bar-chart-outline" size={48} color="#CCC" />
        <Text style={styles.emptyText}>No comparison data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{metric.name} Comparison</Text>
        {stats && (
          <View style={styles.statsBadge}>
            <Text style={styles.statsText}>
              Avg: {formatValue(stats.avg)}
            </Text>
          </View>
        )}
      </View>

      {/* Stats Summary */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Best</Text>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>
              {formatValue(stats.max)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Average</Text>
            <Text style={styles.statValue}>
              {formatValue(stats.avg)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Lowest</Text>
            <Text style={[styles.statValue, { color: '#F44336' }]}>
              {formatValue(stats.min)}
            </Text>
          </View>
        </View>
      )}

      {/* Comparison Bars */}
      <ScrollView style={styles.comparisonList} showsVerticalScrollIndicator={false}>
        {sortedComparisons.map((comparison, index) => {
          const color = getPerformanceColor(comparison.value);
          const barWidth = getBarWidth(comparison.value);
          const percentile = getPercentile(comparison.value);

          return (
            <View key={comparison.id || index} style={styles.comparisonItem}>
              {/* Rank and Label */}
              <View style={styles.itemHeader}>
                <Text style={styles.rankText}>{getRankEmoji(index)}</Text>
                <Text style={styles.itemLabel} numberOfLines={1}>
                  {getLabel(comparison)}
                </Text>
                <Text style={[styles.itemValue, { color }]}>
                  {formatValue(comparison.value)}
                </Text>
              </View>

              {/* Bar Chart */}
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    { width: `${barWidth}%`, backgroundColor: color },
                  ]}
                />
                <Text style={styles.percentileText}>{percentile}th</Text>
              </View>

              {/* Additional Info */}
              {comparison.notes && (
                <Text style={styles.itemNotes} numberOfLines={1}>
                  {comparison.notes}
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Excellent (75%+)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
          <Text style={styles.legendText}>Good (50-75%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.legendText}>Fair (25-50%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
          <Text style={styles.legendText}>Needs Work (&lt;25%)</Text>
        </View>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statsBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2196F3',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  comparisonList: {
    maxHeight: 400,
  },
  comparisonItem: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankText: {
    fontSize: 16,
    marginRight: 8,
    minWidth: 30,
  },
  itemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  itemValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
  },
  bar: {
    height: '100%',
    borderRadius: 4,
    minWidth: 5,
  },
  percentileText: {
    fontSize: 11,
    color: '#999',
    marginLeft: 8,
    fontWeight: '600',
  },
  itemNotes: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
});

export default MetricComparison;