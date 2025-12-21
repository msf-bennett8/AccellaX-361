// Location: /apps/assessment/src/components/assessment/AssessmentForm.js
// Reusable Assessment Form Component

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MetricInput from '../metrics/MetricInput';
import { COLORS } from '../../utils/constants';
import { triggerSyncOnChange } from '../../services/autoSyncTrigger';

const AssessmentForm = ({ 
  kid, 
  metric, 
  sport,
  value, 
  onChange,
  previousValue,
  showPrevious = false,
  metadata = {}
}) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [saving, setSaving] = useState(false);

  const handleChange = async (newValue) => {
    setLocalValue(newValue);
    
    if (onChange) {
      onChange(newValue);
      
      // ✅ Trigger sync after value change
      try {
        await triggerSyncOnChange('assessment_value_changed');
      } catch (error) {
        console.warn('Failed to trigger sync:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.kidName}>{kid?.name}</Text>
        <Text style={styles.metricName}>{metric?.name}</Text>
      </View>

      <MetricInput
        metric={metric}
        value={localValue}
        onChange={handleChange}
        previousValue={previousValue}
        showPrevious={showPrevious}
      />

      {previousValue && showPrevious && (
        <View style={styles.previousValueCard}>
          <Ionicons name="time-outline" size={16} color={COLORS.primary} />
          <Text style={styles.previousLabel}>Last: {previousValue}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginVertical: 8,
  },
  header: {
    marginBottom: 16,
  },
  kidName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  metricName: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  previousValueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight + '20',
    padding: 8,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  previousLabel: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default AssessmentForm;