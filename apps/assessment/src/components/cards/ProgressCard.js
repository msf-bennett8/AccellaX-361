// Location: /apps/assessment/src/components/cards/ProgressCard.js
// Compact card showing kid's progress summary

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import { format, parseISO } from 'date-fns';

/**
 * ProgressCard Component
 * 
 * @param {Object} kid - Kid object { id, name, age, age_group, gender }
 * @param {Object} sport - Sport object { id, name, color }
 * @param {Object} latestAssessment - Latest assessment { assessment_date, results }
 * @param {Object} previousAssessment - Previous assessment for comparison
 * @param {Function} onPress - Callback when card is pressed
 */
export default function ProgressCard({ 
  kid, 
  sport, 
  latestAssessment, 
  previousAssessment,
  onPress,
}) {
  
  // Calculate overall trend
  const calculateTrend = () => {
    if (!latestAssessment || !previousAssessment) return { direction: 'neutral', percentage: 0 };
    
    // Calculate average of all metrics
    const latestAvg = latestAssessment.results.reduce((sum, r) => sum + parseFloat(r.value), 0) / latestAssessment.results.length;
    const previousAvg = previousAssessment.results.reduce((sum, r) => sum + parseFloat(r.value), 0) / previousAssessment.results.length;
    
    const change = ((latestAvg - previousAvg) / previousAvg) * 100;
    
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      percentage: Math.abs(change).toFixed(1),
    };
  };

  const trend = calculateTrend();

  const getTrendIcon = () => {
    if (trend.direction === 'up') return 'trending-up';
    if (trend.direction === 'down') return 'trending-down';
    return 'remove-outline';
  };

  const getTrendColor = () => {
    if (trend.direction === 'up') return COLORS.success;
    if (trend.direction === 'down') return COLORS.error;
    return COLORS.textSecondary;
  };

  // Count improvements and declines
  const countChanges = () => {
    if (!latestAssessment || !previousAssessment) return { improvements: 0, declines: 0 };
    
    let improvements = 0;
    let declines = 0;

    latestAssessment.results.forEach(latestResult => {
      const prevResult = previousAssessment.results?.find(r => r.metric_id === latestResult.metric_id);
      if (prevResult) {
        const change = parseFloat(latestResult.value) - parseFloat(prevResult.value);
        if (change > 0) improvements++;
        if (change < 0) declines++;
      }
    });

    return { improvements, declines };
  };

  const changes = countChanges();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Sport Indicator */}
      <View style={[styles.sportIndicator, { backgroundColor: sport?.color || COLORS.primary }]} />
      
      <View style={styles.cardContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.kidInfo}>
            <Text style={styles.kidName}>{kid?.name}</Text>
            <Text style={styles.kidMeta}>
              {kid?.age} yrs • {kid?.age_group} • {kid?.gender}
            </Text>
          </View>
          
          {trend.direction !== 'neutral' && (
            <View style={[styles.trendBadge, { backgroundColor: getTrendColor() + '20' }]}>
              <Ionicons name={getTrendIcon()} size={16} color={getTrendColor()} />
              <Text style={[styles.trendText, { color: getTrendColor() }]}>
                {trend.percentage}%
              </Text>
            </View>
          )}
        </View>

        {/* Sport Info */}
        <View style={styles.sportInfo}>
          <MaterialCommunityIcons 
            name="trophy" 
            size={14} 
            color={sport?.color || COLORS.primary} 
          />
          <Text style={styles.sportName}>{sport?.name}</Text>
        </View>

        {/* Assessment Date */}
        {latestAssessment && (
          <View style={styles.dateInfo}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.dateText}>
              Last assessed: {format(parseISO(latestAssessment.assessment_date), 'MMM dd, yyyy')}
            </Text>
          </View>
        )}

        {/* Progress Indicators */}
        <View style={styles.progressIndicators}>
          <View style={styles.indicator}>
            <View style={[styles.indicatorIcon, { backgroundColor: COLORS.success + '20' }]}>
              <Ionicons name="arrow-up" size={14} color={COLORS.success} />
            </View>
            <Text style={styles.indicatorText}>{changes.improvements} improved</Text>
          </View>
          
          {changes.declines > 0 && (
            <View style={styles.indicator}>
              <View style={[styles.indicatorIcon, { backgroundColor: COLORS.error + '20' }]}>
                <Ionicons name="arrow-down" size={14} color={COLORS.error} />
              </View>
              <Text style={styles.indicatorText}>{changes.declines} declined</Text>
            </View>
          )}

          <View style={styles.indicator}>
            <View style={[styles.indicatorIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="clipboard-outline" size={14} color={COLORS.primary} />
            </View>
            <Text style={styles.indicatorText}>
              {latestAssessment?.results?.length || 0} metrics
            </Text>
          </View>
        </View>
      </View>

      {/* Arrow */}
      <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sportIndicator: {
    width: 4,
    height: 60,
    borderRadius: 2,
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  kidInfo: {
    flex: 1,
  },
  kidName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  kidMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
    fontSize: 12,
    fontWeight: 'bold',
  },
  sportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sportName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  progressIndicators: {
    flexDirection: 'row',
    gap: 12,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  indicatorIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});