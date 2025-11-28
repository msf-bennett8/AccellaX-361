// Location: /apps/assessment/src/components/charts/BarChart.js
// Bar Chart for comparing multiple metrics or kids

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

/**
 * BarChart Component
 * 
 * @param {Array} data - Array of data points: [{ name: 'Speed', value: 85, color: '#4CAF50' }, ...]
 * @param {String} title - Chart title
 * @param {String} unit - Unit of measurement
 * @param {Boolean} showGrid - Show background grid (default: true)
 * @param {Boolean} showLegend - Show legend (default: false)
 * @param {Number} height - Chart height (default: 250)
 * @param {String} barColor - Default bar color (default: primary)
 */
export default function BarChart({ 
  data = [], 
  title = 'Comparison',
  unit = '',
  showGrid = true,
  showLegend = false,
  height = 250,
  barColor = COLORS.primary,
}) {
  
  // Empty state
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyState}>
          <Ionicons name="bar-chart-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No data available</Text>
          <Text style={styles.emptySubtext}>Comparison data will appear here</Text>
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
          <Text style={styles.tooltipLabel}>{data.name}</Text>
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
      <Text style={styles.title}>{title}</Text>
      
      <ResponsiveContainer width="100%" height={height - 60}>
        <RechartsBarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
          )}
          <XAxis 
            dataKey="name" 
            tick={{ fill: COLORS.textSecondary, fontSize: 11 }}
            stroke={COLORS.border}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tick={{ fill: COLORS.textSecondary, fontSize: 11 }}
            stroke={COLORS.border}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          <Bar 
            dataKey="value" 
            radius={[8, 8, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || barColor} />
            ))}
          </Bar>
        </RechartsBarChart>
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