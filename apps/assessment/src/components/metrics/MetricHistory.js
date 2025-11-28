// Location: /apps/assessment/src/components/metrics/MetricHistory.js
// Display historical data for a specific metric

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
 * MetricHistory Component
 * Shows historical assessments for a single metric with trend visualization
 * 
 * @param {Object} props
 * @param {Object} props.metric - Metric object
 * @param {Array} props.history - Array of assessment results (newest first)
 * @param {number} props.limit - Number of results to show (default: 5)
 */
const MetricHistory = ({
  metric,
  history = [],
  limit = 5,
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

  // Format date
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Calculate trend (comparing consecutive assessments)
  const getTrend = (current, previous) => {
    if (!current || !previous) return null;
    
    const curr = parseFloat(current);
    const prev = parseFloat(previous);
    
    if (isNaN(curr) || isNaN(prev)) return null;
    
    const diff = curr - prev;
    
    // For timed tests, lower is better
    const improved = metric.type === 'timed' ? diff < 0 : diff > 0;
    
    return {
      improved,
      diff: Math.abs(diff).toFixed(metric.decimals || 1),
    };
  };

  // Get performance color based on value
  const getPerformanceColor = (value) => {
    if (!value) return '#999';
    
    const numValue = parseFloat(value);
    
    if (metric.type === 'rating') {
      if (numValue >= 8) return '#4CAF50';
      if (numValue >= 6) return '#2196F3';
      if (numValue >= 4) return '#FF9800';
      return '#F44336';
    }
    
    return '#2196F3';
  };

  // Limit history
  const displayHistory = history.slice(0, limit);

  // Calculate overall trend (first to last)
  const overallTrend = () => {
    if (displayHistory.length < 2) return null;
    
    const latest = parseFloat(displayHistory[0].value);
    const oldest = parseFloat(displayHistory[displayHistory.length - 1].value);
    
    if (isNaN(latest) || isNaN(oldest)) return null;
    
    const diff = latest - oldest;
    const percentChange = (diff / oldest) * 100;
    const improved = metric.type === 'timed' ? diff < 0 : diff > 0;
    
    return {
      improved,
      diff: Math.abs(diff).toFixed(metric.decimals || 1),
      percent: Math.abs(percentChange).toFixed(1),
    };
  };

  const overall = overallTrend();

  if (displayHistory.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="analytics-outline" size={48} color="#CCC" />
        <Text style={styles.emptyText}>No assessment history</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{metric.name} History</Text>
        {overall && (
          <View
            style={[
              styles.overallBadge,
              { backgroundColor: overall.improved ? '#E8F5E9' : '#FFEBEE' },
            ]}
          >
            <Ionicons
              name={overall.improved ? 'trending-up' : 'trending-down'}
              size={14}
              color={overall.improved ? '#4CAF50' : '#F44336'}
            />
            <Text
              style={[
                styles.overallText,
                { color: overall.improved ? '#4CAF50' : '#F44336' },
              ]}
            >
              {overall.improved ? '+' : '-'}{overall.diff} ({overall.percent}%)
            </Text>
          </View>
        )}
      </View>

      {/* Timeline */}
      <ScrollView style={styles.timeline} showsVerticalScrollIndicator={false}>
        {displayHistory.map((assessment, index) => {
          const trend =
            index < displayHistory.length - 1
              ? getTrend(assessment.value, displayHistory[index + 1].value)
              : null;
          
          const color = getPerformanceColor(assessment.value);
          const isLatest = index === 0;

          return (
            <View key={assessment.id} style={styles.timelineItem}>
              {/* Timeline Connector */}
              <View style={styles.timelineConnector}>
                <View style={[styles.timelineDot, { backgroundColor: color }]} />
                {index < displayHistory.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>

              {/* Content */}
              <View style={[styles.itemContent, isLatest && styles.itemContentLatest]}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemDate}>
                    {formatDate(assessment.assessment_date)}
                  </Text>
                  {isLatest && (
                    <View style={styles.latestBadge}>
                      <Text style={styles.latestText}>Latest</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.itemValue, { color }]}>
                  {formatValue(assessment.value)}
                </Text>

                {trend && (
                  <View style={styles.trendContainer}>
                    <Ionicons
                      name={trend.improved ? 'arrow-up' : 'arrow-down'}
                      size={12}
                      color={trend.improved ? '#4CAF50' : '#F44336'}
                    />
                    <Text
                      style={[
                        styles.trendText,
                        { color: trend.improved ? '#4CAF50' : '#F44336' },
                      ]}
                    >
                      {trend.improved ? '+' : '-'}{trend.diff} from previous
                    </Text>
                  </View>
                )}

                {assessment.notes && (
                  <Text style={styles.itemNotes} numberOfLines={2}>
                    {assessment.notes}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {history.length > limit && (
        <Text style={styles.moreText}>
          Showing {limit} of {history.length} assessments
        </Text>
      )}
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
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  overallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  overallText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  timeline: {
    maxHeight: 400,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineConnector: {
    alignItems: 'center',
    marginRight: 16,
    width: 20,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#FFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E0E0E0',
    marginVertical: 4,
    minHeight: 40,
  },
  itemContent: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  itemContentLatest: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemDate: {
    fontSize: 12,
    color: '#666',
  },
  latestBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  latestText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  itemValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  trendText: {
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '500',
  },
  itemNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  moreText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
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

export default MetricHistory;