// Location: /apps/assessment/src/components/cards/AssessmentProgressCard.js
// Display assessment completion progress for kids

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * AssessmentProgressCard Component
 * Shows completion status: Not Started | In Progress | Completed
 * 
 * @param {Object} props
 * @param {Object} props.kid - Kid object
 * @param {string} props.status - 'not_started' | 'in_progress' | 'completed'
 * @param {number} props.completed - Number of metrics completed
 * @param {number} props.total - Total number of metrics
 * @param {number} props.percentage - Completion percentage (0-100)
 * @param {string} props.lastAssessmentDate - ISO date string of last assessment
 * @param {Function} props.onPress - Callback when card is pressed
 */
const AssessmentProgressCard = ({
  kid,
  status = 'not_started',
  completed = 0,
  total = 0,
  percentage = 0,
  lastAssessmentDate = null,
  onPress,
}) => {
  // Get status config
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed',
          color: '#4CAF50',
          bgColor: '#E8F5E9',
          icon: 'checkmark-circle',
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          color: '#FF9800',
          bgColor: '#FFF3E0',
          icon: 'time',
        };
      case 'not_started':
      default:
        return {
          label: 'Not Started',
          color: '#999',
          bgColor: '#F5F5F5',
          icon: 'ellipse-outline',
        };
    }
  };

  const statusConfig = getStatusConfig();

  // Format date
  const formatDate = (isoDate) => {
    if (!isoDate) return null;
    const date = new Date(isoDate);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: statusConfig.color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Left Section - Kid Info */}
      <View style={styles.leftSection}>
        {/* Kid Name */}
        <Text style={styles.kidName} numberOfLines={1}>
          {kid.name}
        </Text>

        {/* Progress Info */}
        <View style={styles.progressInfo}>
          {status !== 'not_started' && (
            <Text style={styles.progressText}>
              {completed}/{total} metrics
            </Text>
          )}
          {lastAssessmentDate && (
            <Text style={styles.dateText}>
              Last: {formatDate(lastAssessmentDate)}
            </Text>
          )}
        </View>

        {/* Progress Bar */}
        {status !== 'not_started' && (
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${percentage}%`, backgroundColor: statusConfig.color },
                ]}
              />
            </View>
            <Text style={[styles.percentageText, { color: statusConfig.color }]}>
              {percentage}%
            </Text>
          </View>
        )}
      </View>

      {/* Right Section - Status Badge */}
      <View style={styles.rightSection}>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
          <Ionicons name={statusConfig.icon} size={20} color={statusConfig.color} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>

        {/* Arrow Icon */}
        <Ionicons name="chevron-forward" size={20} color="#CCC" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  leftSection: {
    flex: 1,
    marginRight: 12,
  },
  kidName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  progressText: {
    fontSize: 13,
    color: '#666',
    marginRight: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    minWidth: 40,
    textAlign: 'right',
  },
  rightSection: {
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default AssessmentProgressCard;