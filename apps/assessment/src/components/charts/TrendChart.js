// Location: /apps/assessment/src/components/charts/TrendChart.js
// Multi-line chart showing trends for multiple metrics

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

/**
 * TrendChart Component
 * 
 * @param {Array} data - Array of data points with multiple metrics: [{ date: '2025-01', speed: 85, strength: 78 }, ...]
 * @param {Array} metrics - Array of metric configs: [{ key: 'speed', name: 'Speed', color: '#4CAF50' }, ...]
 * @param {String} title - Chart title
 * @param {Number} height - Chart height (default: 300)
 */
export default function TrendChart({ 
  data = [], 
  metrics = [],
  title = 'Performance Trends',
  height = 300,
}) {
  
  // Empty state
  if (!data || data.length === 0 || !metrics || metrics.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyState}>
          <Ionicons name="trending-up-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No trend data available</Text>
          <Text style={styles.emptySubtext}>Multiple assessments needed</Text>
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
          <Text style={styles.tooltipDate}>{data.label || data.date}</Text>
          {payload.map((entry, index) => (
            <View key={index} style={styles.tooltipRow}>
              <View style={[styles.tooltipDot, { backgroundColor: entry.color }]} />
              <Text style={styles.tooltipText}>
                {entry.name}: {entry.value}
              </Text>
            </View>
          ))}
        </View>
      );
    }
    return null;
  };

  return (
    <View style={[styles.container, { height }]}>
      <Text style={styles.title}>{title}</Text>
      
      <ResponsiveContainer width="100%" height={height - 60}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
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
          <Legend />
          
          {metrics.map((metric, index) => (
            <Line 
              key={index}
              type="monotone" 
              dataKey={metric.key} 
              name={metric.name}
              stroke={metric.color || COLORS.primary} 
              strokeWidth={2}
              dot={{ fill: metric.color || COLORS.primary, r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
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
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
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
    minWidth: 150,
  },
  tooltipDate: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tooltipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  tooltipText: {
    fontSize: 13,
    color: COLORS.text,
  },
});