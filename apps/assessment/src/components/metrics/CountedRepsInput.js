// Location: /apps/assessment/src/components/metrics/CountedRepsInput.js
// Counter component for rep-based tests (push-ups, sit-ups, etc.)

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * CountedRepsInput Component
 * Counter for rep-based assessments (push-ups, sit-ups, jumps, etc.)
 * 
 * @param {Object} props
 * @param {string} props.metricName - Name of the metric
 * @param {string} props.unit - Unit (default: "reps")
 * @param {number} props.value - Current count
 * @param {Function} props.onChange - Callback with count
 * @param {number} props.maxReps - Maximum reps allowed (default: 999)
 * @param {boolean} props.disabled - Disable input
 * @param {number} props.previousValue - Previous assessment value
 * @param {number} props.step - Increment/decrement step (default: 1)
 */
const CountedRepsInput = ({
  metricName = 'Reps',
  unit = 'reps',
  value = 0,
  onChange,
  maxReps = 999,
  disabled = false,
  previousValue = null,
  step = 1,
}) => {
  const [count, setCount] = useState(value || 0);
  const [manualEntry, setManualEntry] = useState(false);
  const [tempValue, setTempValue] = useState('');

  // Increment counter
  const handleIncrement = () => {
    if (disabled || count >= maxReps) return;
    const newCount = Math.min(count + step, maxReps);
    setCount(newCount);
    onChange(newCount);
  };

  // Decrement counter
  const handleDecrement = () => {
    if (disabled || count <= 0) return;
    const newCount = Math.max(count - step, 0);
    setCount(newCount);
    onChange(newCount);
  };

  // Handle manual entry
  const handleManualEntry = (text) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setTempValue(numericValue);
  };

  // Save manual entry
  const saveManualEntry = () => {
    const parsed = parseInt(tempValue, 10);
    if (!isNaN(parsed)) {
      const newCount = Math.min(Math.max(parsed, 0), maxReps);
      setCount(newCount);
      onChange(newCount);
    }
    setManualEntry(false);
    setTempValue('');
  };

  // Reset counter
  const handleReset = () => {
    if (disabled) return;
    setCount(0);
    onChange(0);
  };

  // Calculate improvement
  const getImprovement = () => {
    if (!previousValue || previousValue === 0 || count === 0) return null;
    const diff = count - previousValue;
    const percentChange = (diff / previousValue) * 100;
    return {
      diff: Math.abs(diff),
      percent: Math.abs(percentChange).toFixed(1),
      improved: diff > 0, // More reps = better
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

      {/* Counter Display */}
      <View style={styles.counterDisplay}>
        {!manualEntry ? (
          <TouchableOpacity
            onPress={() => !disabled && setManualEntry(true)}
            disabled={disabled}
          >
            <Text style={[styles.counterText, disabled && styles.disabledText]}>
              {count}
            </Text>
            <Text style={styles.unitText}>{unit}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.manualEntryContainer}>
            <TextInput
              style={styles.manualInput}
              value={tempValue}
              onChangeText={handleManualEntry}
              keyboardType="numeric"
              placeholder={count.toString()}
              autoFocus
              maxLength={3}
              onBlur={saveManualEntry}
              onSubmitEditing={saveManualEntry}
            />
            <Text style={styles.unitText}>{unit}</Text>
          </View>
        )}
      </View>

      {/* Improvement Indicator */}
      {improvement && (
        <View
          style={[
            styles.improvementBadge,
            { backgroundColor: improvement.improved ? '#E8F5E9' : '#FFEBEE' },
          ]}
        >
          <Ionicons
            name={improvement.improved ? 'trending-up' : 'trending-down'}
            size={16}
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

      {/* Control Buttons */}
      <View style={styles.controls}>
        {/* Decrement Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.decrementButton,
            (disabled || count === 0) && styles.buttonDisabled,
          ]}
          onPress={handleDecrement}
          disabled={disabled || count === 0}
        >
          <Ionicons name="remove" size={32} color="#FFF" />
        </TouchableOpacity>

        {/* Quick Add Buttons */}
        <View style={styles.quickAddContainer}>
          {[1, 5, 10].map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.quickAddButton,
                disabled && styles.buttonDisabled,
              ]}
              onPress={() => {
                if (!disabled) {
                  const newCount = Math.min(count + num, maxReps);
                  setCount(newCount);
                  onChange(newCount);
                }
              }}
              disabled={disabled}
            >
              <Text style={styles.quickAddText}>+{num}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Increment Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.incrementButton,
            (disabled || count >= maxReps) && styles.buttonDisabled,
          ]}
          onPress={handleIncrement}
          disabled={disabled || count >= maxReps}
        >
          <Ionicons name="add" size={32} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, disabled && styles.buttonDisabled]}
          onPress={handleReset}
          disabled={disabled}
        >
          <Ionicons name="refresh" size={20} color="#666" />
          <Text style={styles.actionText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, disabled && styles.buttonDisabled]}
          onPress={() => !disabled && setManualEntry(true)}
          disabled={disabled}
        >
          <Ionicons name="create-outline" size={20} color="#666" />
          <Text style={styles.actionText}>Manual Entry</Text>
        </TouchableOpacity>
      </View>

      {/* Info */}
      {count > 0 && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Total: {count} {unit}
          </Text>
        </View>
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
    marginBottom: 16,
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
  counterDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingVertical: 24,
    marginBottom: 16,
  },
  counterText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
  },
  disabledText: {
    color: '#999',
  },
  unitText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  manualEntryContainer: {
    alignItems: 'center',
  },
  manualInput: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    minWidth: 100,
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  improvementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  improvementText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decrementButton: {
    backgroundColor: '#F44336',
  },
  incrementButton: {
    backgroundColor: '#4CAF50',
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  quickAddContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAddButton: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  quickAddText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});

export default CountedRepsInput;