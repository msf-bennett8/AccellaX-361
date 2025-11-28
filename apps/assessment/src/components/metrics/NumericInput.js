// Location: /apps/assessment/src/components/metrics/NumericInput.js
// Simple numeric input for measurements (height, weight, etc.)

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * NumericInput Component
 * Input for numeric measurements (height, weight, distance, etc.)
 * 
 * @param {Object} props
 * @param {string} props.metricName - Name of the metric
 * @param {string} props.unit - Unit of measurement
 * @param {number} props.value - Current value
 * @param {Function} props.onChange - Callback with new value
 * @param {boolean} props.disabled - Disable input
 * @param {number} props.previousValue - Previous assessment value
 * @param {number} props.min - Minimum allowed value
 * @param {number} props.max - Maximum allowed value
 * @param {number} props.decimals - Number of decimal places (default: 1)
 * @param {string} props.placeholder - Placeholder text
 */
const NumericInput = ({
  metricName,
  unit = '',
  value = '',
  onChange,
  disabled = false,
  previousValue = null,
  min = 0,
  max = 9999,
  decimals = 1,
  placeholder = '0',
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // Handle input change
  const handleChange = (text) => {
    // Allow only numbers and decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    
    // Limit decimal places
    if (parts.length === 2 && parts[1].length > decimals) return;
    
    onChange(cleaned);
  };

  // Handle blur (validate and format)
  const handleBlur = () => {
    setIsFocused(false);
    
    if (value === '' || value === '.') {
      onChange('');
      return;
    }

    const numValue = parseFloat(value);
    
    // Validate range
    if (!isNaN(numValue)) {
      const clamped = Math.max(min, Math.min(max, numValue));
      onChange(clamped.toFixed(decimals));
    } else {
      onChange('');
    }
  };

  // Calculate improvement
  const getImprovement = () => {
    if (!previousValue || !value || value === '') return null;
    
    const current = parseFloat(value);
    const previous = parseFloat(previousValue);
    
    if (isNaN(current) || isNaN(previous)) return null;
    
    const diff = current - previous;
    const percentChange = (diff / previous) * 100;
    
    return {
      diff: Math.abs(diff).toFixed(decimals),
      percent: Math.abs(percentChange).toFixed(1),
      improved: diff > 0, // For height/weight, more is generally better
    };
  };

  const improvement = getImprovement();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.metricName}>{metricName}</Text>
        {previousValue && (
          <View style={styles.previousBadge}>
            <Ionicons name="bar-chart-outline" size={12} color="#666" />
            <Text style={styles.previousText}>
              Previous: {previousValue} {unit}
            </Text>
          </View>
        )}
      </View>

      {/* Input Field */}
      <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
        <TextInput
          style={[styles.input, disabled && styles.inputDisabled]}
          value={value?.toString() || ''}
          onChangeText={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor="#CCC"
          editable={!disabled}
        />
        {unit && <Text style={styles.unitLabel}>{unit}</Text>}
      </View>

      {/* Improvement Indicator */}
      {improvement && value && value !== '' && (
        <View
          style={[
            styles.improvementBadge,
            { backgroundColor: improvement.improved ? '#E8F5E9' : '#FFEBEE' },
          ]}
        >
          <Ionicons
            name={improvement.improved ? 'trending-up' : 'trending-down'}
            size={14}
            color={improvement.improved ? '#4CAF50' : '#F44336'}
          />
          <Text
            style={[
              styles.improvementText,
              { color: improvement.improved ? '#4CAF50' : '#F44336' },
            ]}
          >
            {improvement.improved ? '+' : '-'}{improvement.diff} {unit} ({improvement.percent}%)
          </Text>
        </View>
      )}

      {/* Range Info */}
      {(min > 0 || max < 9999) && (
        <Text style={styles.rangeText}>
          Valid range: {min} - {max} {unit}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  previousBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previousText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputContainerFocused: {
    borderColor: '#2196F3',
    backgroundColor: '#FFF',
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    padding: 0,
  },
  inputDisabled: {
    color: '#999',
  },
  unitLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  improvementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  improvementText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  rangeText: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
    textAlign: 'right',
  },
});

export default NumericInput;