// Location: /apps/assessment/src/components/inputs/PrefillToggle.js
// Toggle to show/hide previous assessment values for pre-filling

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * PrefillToggle Component
 * Global toggle to enable/disable pre-filling previous assessment values
 * 
 * @param {Object} props
 * @param {boolean} props.enabled - Whether prefill is enabled
 * @param {Function} props.onToggle - Callback when toggled
 * @param {number} props.previousCount - Number of fields with previous values
 * @param {boolean} props.disabled - Disable toggle
 */
const PrefillToggle = ({
  enabled = false,
  onToggle,
  previousCount = 0,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon and Title */}
        <View style={styles.leftSection}>
          <View style={[styles.iconContainer, enabled && styles.iconContainerActive]}>
            <Ionicons
              name={enabled ? 'refresh' : 'refresh-outline'}
              size={20}
              color={enabled ? '#2196F3' : '#666'}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Pre-fill Previous Values</Text>
            {previousCount > 0 && (
              <Text style={styles.subtitle}>
                {previousCount} field{previousCount !== 1 ? 's' : ''} available
              </Text>
            )}
            {previousCount === 0 && (
              <Text style={styles.subtitleEmpty}>No previous assessment found</Text>
            )}
          </View>
        </View>

        {/* Toggle Switch */}
        <Switch
          value={enabled}
          onValueChange={onToggle}
          disabled={disabled || previousCount === 0}
          trackColor={{ false: '#E0E0E0', true: '#BBDEFB' }}
          thumbColor={enabled ? '#2196F3' : '#F5F5F5'}
          ios_backgroundColor="#E0E0E0"
        />
      </View>

      {/* Info Text */}
      {enabled && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={14} color="#2196F3" />
          <Text style={styles.infoText}>
            Previous values are shown in input fields. You can edit any value before saving.
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
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      },
    }),
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconContainerActive: {
    backgroundColor: '#E3F2FD',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  subtitleEmpty: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1976D2',
    marginLeft: 8,
    lineHeight: 16,
  },
});

export default PrefillToggle;