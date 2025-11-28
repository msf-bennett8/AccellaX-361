// Location: /apps/assessment/src/components/charts/LineChart.js
// Line Chart for showing metric progress over time

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

const { width } = Dimensions.get('window');

/**
 * LineChart Component
 * 
 * @param {Array} data - Array of data points: [{ date: '2025-01', value: 85, label: 'Jan' }, ...]
 * @param {String} metricName - Name of the metric being displayed
 * @param {String} unit - Unit of measurement (e.g., 'cm', 'kg', 'seconds')
 * @param {String} color - Line color (default: primary)
 * @param {Boolean} showGrid - Show background grid (default: true)
 * @param {Boolean} showLegend - Show legend (default: false)
 * @param {Number} height - Chart height (default: 250)
 */
export default function LineChart({ 
  data = [], 
  metricName = 'Metric',
  unit = '',
  color = COLORS.primary,
  showGrid = true,
  showLegend = false,
  height = 250,
}) {
  
  // Empty state
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No data available</Text>
          <Text style={styles.emptySubtext}>Assessment data will appear here</Text>
        </View>
      </View>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipLabel}>{data.label || data.date}</Text>
          <Text style={styles.tooltipValue}>
            {payload[0].value} {unit}
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{metricName}</Text>
        {data.length > 0 && (
          <View style={styles.trendBadge}>
            <Ionicons 
              name={data[data.length - 1].value > data[0].value ? "trending-up" : "trending-down"} 
              size={16} 
              color={data[data.length - 1].value > data[0].value ? COLORS.success : COLORS.error} 
            />
            <Text style={[
              styles.trendText,
              { color: data[data.length - 1].value > data[0].value ? COLORS.success : COLORS.error }
            ]}>
              {Math.abs(((data[data.length - 1].value - data[0].value) / data[0].value) * 100).toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
      
      <ResponsiveContainer width="100%" height={height - 60}>
        <RechartsLineChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
          )}
          <XAxis 
            dataKey="label" 
            tick={{ fill: COLORS.textSecondary, fontSize: 11 }}
            stroke={COLORS.border}
          />
          <YAxis 
            tick={{ fill: COLORS.textSecondary, fontSize: 11 }}
            stroke={COLORS.border}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={3}
            dot={{ fill: color, r: 5 }}
            activeDot={{ r: 7 }}
            name={metricName}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  trendText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  tooltip: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tooltipLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  tooltipValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
});