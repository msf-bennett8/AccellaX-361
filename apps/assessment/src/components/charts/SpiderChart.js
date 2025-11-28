// Location: /apps/assessment/src/components/charts/SpiderChart.js
// Spider chart for comparing kid vs average performance

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

/**
 * SpiderChart Component - Compare kid vs average
 * 
 * @param {Array} data - Array of data points: [{ skill: 'Speed', kidValue: 8, avgValue: 6 }, ...]
 * @param {String} title - Chart title
 * @param {String} kidName - Kid's name
 * @param {Number} height - Chart height (default: 320)
 */
export default function SpiderChart({ 
  data = [], 
  title = 'Performance Comparison',
  kidName = 'Kid',
  height = 320,
}) {
  
  // Empty state
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No comparison data</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.legendText}>{kidName}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.legendText}>Age Group Avg</Text>
          </View>
        </View>
      </View>
      
      <ResponsiveContainer width="100%" height={height - 80}>
        <RadarChart data={data}>
          <PolarGrid stroke={COLORS.border} />
          <PolarAngleAxis 
            dataKey="skill" 
            tick={{ fill: COLORS.textSecondary, fontSize: 11 }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 10]}
            tick={{ fill: COLORS.textSecondary, fontSize: 10 }}
          />
          <Radar 
            name={kidName}
            dataKey="kidValue" 
            stroke={COLORS.primary} 
            fill={COLORS.primary} 
            fillOpacity={0.6}
          />
          <Radar 
            name="Average"
            dataKey="avgValue" 
            stroke="#FF9800" 
            fill="#FF9800" 
            fillOpacity={0.3}
          />
        </RadarChart>
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
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
});