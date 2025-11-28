// Location: /apps/assessment/src/components/metrics/CustomMetricBuilder.js
// Form to create or edit custom metrics for sports

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * CustomMetricBuilder Component
 * Create or edit custom metrics for a sport
 * 
 * @param {Object} props
 * @param {Object} props.metric - Existing metric to edit (optional)
 * @param {string} props.sportId - Sport ID this metric belongs to
 * @param {Function} props.onSave - Callback with metric data
 * @param {Function} props.onCancel - Callback when cancelled
 */
const CustomMetricBuilder = ({
  metric = null,
  sportId,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: metric?.name || '',
    type: metric?.type || 'numeric',
    category: metric?.category || 'sport_specific',
    unit: metric?.unit || '',
    min: metric?.min?.toString() || '0',
    max: metric?.max?.toString() || '100',
    decimals: metric?.decimals?.toString() || '1',
    description: metric?.description || '',
  });

  const [errors, setErrors] = useState({});

  // Metric type options
  const metricTypes = [
    { id: 'numeric', name: 'Numeric', icon: '123', description: 'Height, weight, distance' },
    { id: 'rating', name: 'Rating (1-10)', icon: 'star', description: 'Skill level rating' },
    { id: 'timed', name: 'Timed', icon: 'timer', description: 'Sprint time, lap time' },
    { id: 'counted', name: 'Counted Reps', icon: 'fitness', description: 'Push-ups, sit-ups' },
  ];

  // Category options
  const categories = [
    { id: 'general_fitness', name: 'General Fitness', icon: 'pulse' },
    { id: 'sport_specific', name: 'Sport-Specific Skill', icon: 'football' },
    { id: 'iq', name: 'Sport IQ', icon: 'bulb' },
  ];

  // Handle input change
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Metric name is required';
    }

    if (formData.type === 'numeric') {
      if (!formData.unit.trim()) {
        newErrors.unit = 'Unit is required for numeric metrics';
      }

      const min = parseFloat(formData.min);
      const max = parseFloat(formData.max);

      if (isNaN(min)) {
        newErrors.min = 'Invalid minimum value';
      }
      if (isNaN(max)) {
        newErrors.max = 'Invalid maximum value';
      }
      if (!isNaN(min) && !isNaN(max) && min >= max) {
        newErrors.max = 'Maximum must be greater than minimum';
      }

      const decimals = parseInt(formData.decimals, 10);
      if (isNaN(decimals) || decimals < 0 || decimals > 5) {
        newErrors.decimals = 'Decimals must be between 0 and 5';
      }
    }

    if (formData.type === 'counted' && !formData.unit.trim()) {
      newErrors.unit = 'Unit is required (e.g., "reps", "times")';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (!validate()) {
      if (Platform.OS === 'web') {
        alert('Please fix the errors before saving');
      } else {
        Alert.alert('Validation Error', 'Please fix the errors before saving');
      }
      return;
    }

    // Prepare metric object
    const metricData = {
      id: metric?.id || `custom_${Date.now()}`,
      sport_id: sportId,
      name: formData.name.trim(),
      type: formData.type,
      category: formData.category,
      unit: formData.unit.trim(),
      description: formData.description.trim(),
      is_custom: true,
      created_at: metric?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add type-specific fields
    if (formData.type === 'numeric') {
      metricData.min = parseFloat(formData.min);
      metricData.max = parseFloat(formData.max);
      metricData.decimals = parseInt(formData.decimals, 10);
    }

    if (formData.type === 'rating') {
      metricData.min = 1;
      metricData.max = 10;
      metricData.unit = '';
    }

    if (formData.type === 'timed') {
      metricData.unit = 'seconds';
      metricData.decimals = 2;
    }

    onSave(metricData);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {metric ? 'Edit Metric' : 'Create Custom Metric'}
        </Text>
      </View>

      {/* Metric Name */}
      <View style={styles.section}>
        <Text style={styles.label}>Metric Name *</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={formData.name}
          onChangeText={(text) => handleChange('name', text)}
          placeholder="e.g., Ball Control, Shooting Accuracy"
          placeholderTextColor="#999"
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      {/* Metric Type */}
      <View style={styles.section}>
        <Text style={styles.label}>Metric Type *</Text>
        <View style={styles.optionsGrid}>
          {metricTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.optionCard,
                formData.type === type.id && styles.optionCardActive,
              ]}
              onPress={() => handleChange('type', type.id)}
            >
              <Ionicons
                name={type.icon}
                size={24}
                color={formData.type === type.id ? '#2196F3' : '#666'}
              />
              <Text
                style={[
                  styles.optionName,
                  formData.type === type.id && styles.optionNameActive,
                ]}
              >
                {type.name}
              </Text>
              <Text style={styles.optionDescription}>{type.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Category */}
      <View style={styles.section}>
        <Text style={styles.label}>Category *</Text>
        <View style={styles.categoryButtons}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryButton,
                formData.category === cat.id && styles.categoryButtonActive,
              ]}
              onPress={() => handleChange('category', cat.id)}
            >
              <Ionicons
                name={cat.icon}
                size={16}
                color={formData.category === cat.id ? '#FFF' : '#666'}
              />
              <Text
                style={[
                  styles.categoryButtonText,
                  formData.category === cat.id && styles.categoryButtonTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Unit (for numeric and counted types) */}
      {(formData.type === 'numeric' || formData.type === 'counted') && (
        <View style={styles.section}>
          <Text style={styles.label}>Unit *</Text>
          <TextInput
            style={[styles.input, errors.unit && styles.inputError]}
            value={formData.unit}
            onChangeText={(text) => handleChange('unit', text)}
            placeholder="e.g., cm, kg, meters, reps"
            placeholderTextColor="#999"
          />
          {errors.unit && <Text style={styles.errorText}>{errors.unit}</Text>}
        </View>
      )}

      {/* Range (for numeric type only) */}
      {formData.type === 'numeric' && (
        <View style={styles.section}>
          <Text style={styles.label}>Value Range</Text>
          <View style={styles.rangeRow}>
            <View style={styles.rangeInput}>
              <Text style={styles.rangeLabel}>Min</Text>
              <TextInput
                style={[styles.input, errors.min && styles.inputError]}
                value={formData.min}
                onChangeText={(text) => handleChange('min', text)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
              />
              {errors.min && <Text style={styles.errorText}>{errors.min}</Text>}
            </View>

            <Text style={styles.rangeSeparator}>to</Text>

            <View style={styles.rangeInput}>
              <Text style={styles.rangeLabel}>Max</Text>
              <TextInput
                style={[styles.input, errors.max && styles.inputError]}
                value={formData.max}
                onChangeText={(text) => handleChange('max', text)}
                keyboardType="numeric"
                placeholder="100"
                placeholderTextColor="#999"
              />
              {errors.max && <Text style={styles.errorText}>{errors.max}</Text>}
            </View>
          </View>
        </View>
      )}

      {/* Decimals (for numeric type only) */}
      {formData.type === 'numeric' && (
        <View style={styles.section}>
          <Text style={styles.label}>Decimal Places</Text>
          <TextInput
            style={[styles.input, errors.decimals && styles.inputError]}
            value={formData.decimals}
            onChangeText={(text) => handleChange('decimals', text)}
            keyboardType="numeric"
            placeholder="1"
            placeholderTextColor="#999"
          />
          {errors.decimals && <Text style={styles.errorText}>{errors.decimals}</Text>}
        </View>
      )}

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => handleChange('description', text)}
          placeholder="Describe how to measure this metric..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFF" />
          <Text style={styles.saveButtonText}>
            {metric ? 'Update' : 'Create'} Metric
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: '#FFF',
    padding: 16,
    marginTop: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#F44336',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    padding: 16,
    alignItems: 'center',
  },
  optionCardActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  optionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  optionNameActive: {
    color: '#2196F3',
  },
  optionDescription: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  categoryButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  categoryButtonTextActive: {
    color: '#FFF',
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rangeInput: {
    flex: 1,
  },
  rangeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  rangeSeparator: {
    fontSize: 16,
    color: '#666',
    marginTop: 36,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
});

export default CustomMetricBuilder;