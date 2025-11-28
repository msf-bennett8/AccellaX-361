// Location: /apps/assessment/src/components/charts/ProgressChart.js
// Compact progress chart showing improvement trends

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

/**
 * ProgressChart Component - Mini sparkline chart
 * 
 * @param {Array} data - Array of data points: [{ value: 85 }, { value: 87 }, ...]
 * @param {String} label - Metric label
 * @param {String} currentValue - Current value to display
 * @param {String} unit - Unit of measurement
 * @param {String} trend - 'up' or 'down'
 * @param {Number} height - Chart height (default: 60)
 */
export default function ProgressChart({ 
  data = [], 
  label = 'Metric',
  currentValue = '—',
  unit = '',
  trend = 'neutral',
  height = 60,
}) {
  
  // Determine trend
  const getTrendIcon = () => {
    if (trend === 'up') return 'trending-up';
    if (trend === 'down') return 'trending-down';
    return 'remove-outline';
  };

  const getTrendColor = () => {
    if (trend === 'up') return COLORS.success;
    if (trend === 'down') return COLORS.error;
    return COLORS.textSecondary;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          <View style={styles.valueRow}>
            <Text style={styles.value}>{currentValue}</Text>
            {unit && <Text style={styles.unit}>{unit}</Text>}
          </View>
        </View>
        
        <View style={[styles.trendBadge, { backgroundColor: getTrendColor() + '20' }]}>
          <Ionicons name={getTrendIcon()} size={18} color={getTrendColor()} />
        </View>
      </View>

      {data && data.length > 0 && (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data}>
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={getTrendColor()} 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
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
    alignItems: 'center',
    marginBottom: 8,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  unit: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  trendBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});