// Location: /apps/assessment/src/components/charts/HeatmapChart.js
// Heatmap showing performance across multiple metrics

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

/**
 * HeatmapChart Component
 * 
 * @param {Array} data - Array of kids with metrics: [{ name: 'Ahmed', metrics: [{ name: 'Speed', value: 8 }, ...] }]
 * @param {String} title - Chart title
 */
export default function HeatmapChart({ 
  data = [], 
  title = 'Skills Heatmap',
}) {
  
  // Empty state
  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyState}>
          <Ionicons name="grid-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No heatmap data</Text>
        </View>
      </View>
    );
  }

  // Get color based on value (1-10 scale)
  const getColor = (value) => {
    if (value >= 8) return '#4CAF50'; // Green
    if (value >= 6) return '#2196F3'; // Blue
    if (value >= 4) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  // Get all unique metric names
  const allMetrics = [...new Set(data.flatMap(kid => kid.metrics.map(m => m.name)))];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.nameCell}>
              <Text style={styles.headerText}>Name</Text>
            </View>
            {allMetrics.map((metric, index) => (
              <View key={index} style={styles.metricCell}>
                <Text style={styles.headerText} numberOfLines={1}>{metric}</Text>
              </View>
            ))}
          </View>

          {/* Data Rows */}
          {data.map((kid, kidIndex) => (
            <View key={kidIndex} style={styles.dataRow}>
              <View style={styles.nameCell}>
                <Text style={styles.nameText} numberOfLines={1}>{kid.name}</Text>
              </View>
              {allMetrics.map((metricName, metricIndex) => {
                const metric = kid.metrics.find(m => m.name === metricName);
                const value = metric?.value || 0;
                
                return (
                  <View 
                    key={metricIndex} 
                    style={[
                      styles.valueCell,
                      { backgroundColor: getColor(value) }
                    ]}
                  >
                    <Text style={styles.valueText}>{value || '—'}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Performance Scale:</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>8-10 Excellent</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
            <Text style={styles.legendText}>6-7 Good</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.legendText}>4-5 Fair</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
            <Text style={styles.legendText}>1-3 Poor</Text>
          </View>
        </View>
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
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 8,
    marginBottom: 4,
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  nameCell: {
    width: 120,
    padding: 12,
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  metricCell: {
    width: 80,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueCell: {
    width: 80,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginHorizontal: 2,
  },
  headerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  nameText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  valueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  legend: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  legendTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});