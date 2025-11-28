// Location: /apps/assessment/src/components/cards/RedFlagCard.js
// Alert card for performance drops and concerns

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import { format, parseISO } from 'date-fns';

/**
 * RedFlagCard Component
 * 
 * @param {String} type - Alert type: 'decline', 'consecutive', 'injury', 'absence'
 * @param {Object} kid - Kid object { id, name, age_group }
 * @param {String} metric - Metric name that triggered the alert
 * @param {Number} change - Percentage change (negative for decline)
 * @param {String} from - Previous value
 * @param {String} to - Current value
 * @param {String} date - Assessment date
 * @param {String} message - Custom alert message
 * @param {Function} onPress - Callback when card is pressed
 * @param {Function} onDismiss - Callback to dismiss the alert
 */
export default function RedFlagCard({ 
  type = 'decline',
  kid,
  metric,
  change,
  from,
  to,
  date,
  message,
  onPress,
  onDismiss,
}) {
  
  const getAlertConfig = () => {
    switch (type) {
      case 'decline':
        return {
          icon: 'trending-down',
          iconBg: COLORS.error + '20',
          iconColor: COLORS.error,
          borderColor: COLORS.error,
          bgColor: '#FFF5F5',
          title: 'Performance Drop',
          defaultMessage: `${metric} decreased by ${Math.abs(change)}%`,
        };
      case 'consecutive':
        return {
          icon: 'alert',
          iconBg: '#FF9800' + '20',
          iconColor: '#FF9800',
          borderColor: '#FF9800',
          bgColor: '#FFF8F0',
          title: 'Consecutive Decline',
          defaultMessage: `${metric} declining for 2+ assessments`,
        };
      case 'injury':
        return {
          icon: 'medical',
          iconBg: COLORS.error + '20',
          iconColor: COLORS.error,
          borderColor: COLORS.error,
          bgColor: '#FFF5F5',
          title: 'Injury Alert',
          defaultMessage: message || 'Recent injury reported',
        };
      case 'absence':
        return {
          icon: 'calendar-outline',
          iconBg: '#FF9800' + '20',
          iconColor: '#FF9800',
          borderColor: '#FF9800',
          bgColor: '#FFF8F0',
          title: 'Attendance Concern',
          defaultMessage: message || 'Low attendance rate',
        };
      default:
        return {
          icon: 'warning',
          iconBg: COLORS.error + '20',
          iconColor: COLORS.error,
          borderColor: COLORS.error,
          bgColor: '#FFF5F5',
          title: 'Alert',
          defaultMessage: message || 'Attention needed',
        };
    }
  };

  const config = getAlertConfig();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: config.bgColor, borderLeftColor: config.borderColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: config.iconBg }]}>
          <Ionicons name={config.icon} size={24} color={config.iconColor} />
        </View>

        {/* Text Content */}
        <View style={styles.textContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.alertTitle}>{config.title}</Text>
            {type === 'decline' && change && (
              <View style={[styles.changeBadge, { backgroundColor: config.iconColor }]}>
                <Text style={styles.changeText}>{Math.abs(change).toFixed(1)}%</Text>
              </View>
            )}
          </View>

          {/* Kid Name */}
          {kid && (
            <Text style={styles.kidName}>{kid.name}</Text>
          )}

          {/* Message */}
          <Text style={styles.message}>
            {message || config.defaultMessage}
          </Text>

          {/* Values Comparison (for decline type) */}
          {type === 'decline' && from && to && (
            <View style={styles.valuesContainer}>
              <View style={styles.valueBox}>
                <Text style={styles.valueLabel}>Previous</Text>
                <Text style={styles.valueText}>{from}</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={COLORS.textSecondary} />
              <View style={styles.valueBox}>
                <Text style={styles.valueLabel}>Current</Text>
                <Text style={[styles.valueText, { color: config.iconColor }]}>{to}</Text>
              </View>
            </View>
          )}

          {/* Date */}
          {date && (
            <View style={styles.dateContainer}>
              <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
              <Text style={styles.dateText}>
                {format(parseISO(date), 'MMM dd, yyyy')}
              </Text>
            </View>
          )}
        </View>

        {/* Dismiss Button */}
        {onDismiss && (
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={onPress}>
          <Ionicons name="eye-outline" size={16} color={config.iconColor} />
          <Text style={[styles.actionText, { color: config.iconColor }]}>View Details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {/* Handle create plan action */}}
        >
          <MaterialCommunityIcons name="clipboard-text-outline" size={16} color={config.iconColor} />
          <Text style={[styles.actionText, { color: config.iconColor }]}>Create Plan</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  changeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  kidName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  valuesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  valueBox: {
    flex: 1,
  },
  valueLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  valueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  dismissButton: {
    padding: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
