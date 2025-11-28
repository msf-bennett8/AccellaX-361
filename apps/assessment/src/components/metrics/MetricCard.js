// Location: /apps/assessment/src/components/metrics/MetricCard.js
// Display card for a single metric with value and trend

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * MetricCard Component
 * Display metric name, current value, and comparison data
 * 
 * @param {Object} props
 * @param {Object} props.metric - Metric object from config
 * @param {number|string} props.value - Current value
 * @param {number|string} props.previousValue - Previous assessment value
 * @param {Object} props.benchmark - Benchmark data for this metric
 * @param {Function} props.onPress - Callback when card is pressed
 * @param {boolean} props.completed - Whether this metric has been assessed
 */
const MetricCard = ({
  metric,
  value = null,
  previousValue = null,
  benchmark = null,
  onPress,
  completed = false,
}) => {
  // Format value based on metric type
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

  // Calculate improvement
  const getImprovement = () => {
    if (!value || !previousValue) return null;
    
    const current = parseFloat(value);
    const previous = parseFloat(previousValue);
    
    if (isNaN(current) || isNaN(previous)) return null;
    
    const diff = current - previous;
    const percentChange = (diff / previous) * 100;
    
    // For timed tests, lower is better
    const isBetter = metric.type === 'timed' ? diff < 0 : diff > 0;
    
    return {
      diff: Math.abs(diff).toFixed(metric.decimals || 1),
      percent: Math.abs(percentChange).toFixed(1),
      improved: isBetter,
    };
  };

  // Get performance rating color
  const getPerformanceColor = () => {
    if (!value || !benchmark) return '#999';
    
    const numValue = parseFloat(value);
    
    if (metric.type === 'rating') {
      if (numValue >= 8) return '#4CAF50'; // Excellent
      if (numValue >= 6) return '#2196F3'; // Good
      if (numValue >= 4) return '#FF9800'; // Fair
      return '#F44336'; // Needs work
    }
    
    // Use benchmark if available
    if (benchmark.excellent && numValue >= benchmark.excellent) return '#4CAF50';
    if (benchmark.good && numValue >= benchmark.good) return '#2196F3';
    if (benchmark.fair && numValue >= benchmark.fair) return '#FF9800';
    return '#F44336';
  };

  const improvement = getImprovement();
  const performanceColor = getPerformanceColor();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        completed && styles.containerCompleted,
        { borderLeftColor: performanceColor },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          {/* Metric Icon/Category Badge */}
          <View style={[styles.categoryBadge, { backgroundColor: `${performanceColor}20` }]}>
            <Text style={[styles.categoryText, { color: performanceColor }]}>
              {metric.category === 'general_fitness' ? 'FIT' :
               metric.category === 'sport_specific' ? 'SKILL' : 'IQ'}
            </Text>
          </View>
          
          <View style={styles.titleContainer}>
            <Text style={styles.metricName} numberOfLines={1}>
              {metric.name}
            </Text>
            <Text style={styles.metricCategory} numberOfLines={1}>
              {metric.category === 'general_fitness' ? 'General Fitness' :
               metric.category === 'sport_specific' ? 'Sport Skill' : 'Sport IQ'}
            </Text>
          </View>
        </View>

        {/* Completion Status */}
        {completed && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          </View>
        )}
      </View>

      {/* Value Display */}
      <View style={styles.valueSection}>
        <View style={styles.currentValue}>
          <Text style={styles.valueLabel}>Current</Text>
          <Text style={[styles.valueText, { color: performanceColor }]}>
            {formatValue(value)}
          </Text>
        </View>

        {previousValue && (
          <View style={styles.previousValue}>
            <Text style={styles.valueLabel}>Previous</Text>
            <Text style={styles.previousValueText}>
              {formatValue(previousValue)}
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
            size={14}
            color={improvement.improved ? '#4CAF50' : '#F44336'}
          />
          <Text
            style={[
              styles.improvementText,
              { color: improvement.improved ? '#4CAF50' : '#F44336' },
            ]}
          >
            {improvement.improved ? '+' : '-'}{improvement.diff} ({improvement.percent}%)
          </Text>
        </View>
      )}

      {/* Arrow */}
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={20} color="#CCC" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  containerCompleted: {
    backgroundColor: '#F8FFF9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 10,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
  },
  metricName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  metricCategory: {
    fontSize: 11,
    color: '#999',
  },
  completedBadge: {
    marginLeft: 8,
  },
  valueSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  currentValue: {
    flex: 1,
  },
  previousValue: {
    flex: 1,
    alignItems: 'flex-end',
  },
  valueLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  valueText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  previousValueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  improvementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  improvementText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  arrowContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
  },
});

export default MetricCard;