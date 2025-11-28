// Location: /apps/assessment/src/components/charts/ComparisonChart.js
// Chart for comparing multiple kids on same metric

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

/**
 * ComparisonChart Component
 * 
 * @param {Array} data - Array of kids data: [{ name: 'Ahmed', value: 85, color: '#4CAF50' }, ...]
 * @param {String} title - Chart title
 * @param {String} metricName - Metric being compared
 * @param {String} unit - Unit of measurement
 * @param {Number} height - Chart height (default: 300)
 * @param {Number} averageLine - Average value to show as reference line
 */
export default function ComparisonChart({ 
  data = [], 
  title = 'Kid Comparison',
  metricName = 'Metric',
  unit = '',
  height = 300,
  averageLine = null,
}) {
  
  // Empty state
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No comparison data</Text>
          <Text style={styles.emptySubtext}>Select kids to compare</Text>
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
            {metricName}: {payload[0].value} {unit}
          </Text>
          {averageLine && (
            <Text style={styles.tooltipAverage}>
              Avg: {averageLine} {unit}
            </Text>
          )}
        </View>
      );
    }
    return null;
  };

  // Sort by value (highest first)
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {averageLine && (
          <View style={styles.averageBadge}>
            <Ionicons name="stats-chart" size={14} color={COLORS.primary} />
            <Text style={styles.averageText}>Avg: {averageLine} {unit}</Text>
          </View>
        )}
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <ResponsiveContainer width={Math.max(400, sortedData.length * 80)} height={height - 80}>
          <BarChart
            data={sortedData}
            margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: COLORS.textSecondary, fontSize: 10 }}
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
            <Bar 
              dataKey="value" 
              radius={[8, 8, 0, 0]}
            >
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || COLORS.primary} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ScrollView>

      {/* Ranking List */}
      <View style={styles.rankingContainer}>
        {sortedData.slice(0, 3).map((kid, index) => (
          <View key={kid.name} style={styles.rankingItem}>
            <View style={[
              styles.rankBadge,
              index === 0 && styles.goldBadge,
              index === 1 && styles.silverBadge,
              index === 2 && styles.bronzeBadge,
            ]}>
              <Text style={styles.rankText}>#{index + 1}</Text>
            </View>
            <Text style={styles.rankName}>{kid.name}</Text>
            <Text style={styles.rankValue}>{kid.value} {unit}</Text>
          </View>
        ))}
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
  averageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight + '40',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  averageText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  tooltipAverage: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
  },
  rankingContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goldBadge: {
    backgroundColor: '#FFD700',
  },
  silverBadge: {
    backgroundColor: '#C0C0C0',
  },
  bronzeBadge: {
    backgroundColor: '#CD7F32',
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  rankName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  rankValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});