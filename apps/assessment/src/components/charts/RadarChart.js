// Location: /apps/assessment/src/components/charts/RadarChart.js
// Radar Chart for multi-dimensional skill comparison

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

/**
 * RadarChart Component
 * 
 * @param {Array} data - Array of data points: [{ skill: 'Speed', value: 85, fullMark: 100 }, ...]
 * @param {String} title - Chart title
 * @param {String} dataKey - Key for data values (default: 'value')
 * @param {String} color - Fill color (default: primary)
 * @param {Number} height - Chart height (default: 300)
 * @param {Boolean} showLegend - Show legend (default: false)
 */
export default function RadarChart({ 
  data = [], 
  title = 'Skills Profile',
  dataKey = 'value',
  color = COLORS.primary,
  height = 300,
  showLegend = false,
}) {
  
  // Empty state
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No skills data available</Text>
          <Text style={styles.emptySubtext}>Assessment data will appear here</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <Text style={styles.title}>{title}</Text>
      
      <ResponsiveContainer width="100%" height={height - 60}>
        <RechartsRadarChart data={data}>
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
            name={title}
            dataKey={dataKey} 
            stroke={color} 
            fill={color} 
            fillOpacity={0.6}
          />
          {showLegend && <Legend />}
        </RechartsRadarChart>
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
    textAlign: 'center',
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
});