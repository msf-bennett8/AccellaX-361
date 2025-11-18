// src/components/kids/KidListItem.js

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { COLORS, BADGE_COLORS } from '../../utils/constants';

const KidListItem = ({ 
  kid, 
  onPress, 
  onLongPress, 
  showAgeGroup = false,
  showAttendanceRate = false,
  attendanceStats = null,
  style 
}) => {
  const isSuspended = kid.status === 'suspended';
  
  // Calculate attendance percentage if stats provided
  const attendancePercentage = attendanceStats 
    ? Math.round((attendanceStats.present / attendanceStats.total) * 100) || 0
    : 0;

  // Get status badge color and text
  const getStatusBadge = () => {
    if (isSuspended) {
      return {
        color: COLORS.suspended,
        backgroundColor: '#F5F5F5',
        text: 'Suspended',
      };
    }
    return {
      color: COLORS.present,
      backgroundColor: '#E8F5E9',
      text: 'Active',
    };
  };

  const statusBadge = getStatusBadge();

  // Get attendance badge color based on rate
  const getAttendanceBadgeColor = () => {
    if (attendancePercentage >= 80) return COLORS.present;
    if (attendancePercentage >= 60) return COLORS.warning;
    return COLORS.absent;
  };

  // Format age group display
  const formatAgeGroup = (ageGroup) => {
    return `${ageGroup} years`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSuspended && styles.suspendedContainer,
        style
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      delayLongPress={500}
    >
      {/* Left Section: Avatar/Initial */}
      <View style={[
        styles.avatar,
        isSuspended && styles.avatarSuspended
      ]}>
        <Text style={[
          styles.avatarText,
          isSuspended && styles.avatarTextSuspended
        ]}>
          {kid.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Middle Section: Kid Info */}
      <View style={styles.infoContainer}>
        {/* Name with Badges */}
        <View style={styles.nameRow}>
          <Text style={[
            styles.name,
            isSuspended && styles.nameSuspended
          ]}>
            {kid.name}
          </Text>
          {kid.sponsorshipType && kid.programType && (
            <View style={styles.badgeContainer}>
              <View style={[styles.badge, { backgroundColor: BADGE_COLORS[kid.sponsorshipType] || '#9E9E9E' }]}>
                <Text style={styles.badgeText}>{kid.sponsorshipType}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: BADGE_COLORS[kid.programType] || '#9E9E9E' }]}>
                <Text style={styles.badgeText}>{kid.programType}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Details Row */}
        <View style={styles.detailsRow}>
          {/* Age */}
          {kid.age && (
            <Text style={styles.detailText}>
              {kid.age} yrs
            </Text>
          )}

          {/* Gender */}
          {kid.gender && (
            <>
              <Text style={styles.detailDivider}>•</Text>
              <Text style={styles.detailText}>
                {kid.gender}
              </Text>
            </>
          )}

          {/* Age Group (if shown) */}
          {showAgeGroup && kid.age_group && (
            <>
              <Text style={styles.detailDivider}>•</Text>
              <Text style={styles.detailText}>
                {formatAgeGroup(kid.age_group)}
              </Text>
            </>
          )}

          {/* Area of Residence */}
          {kid.area_of_residence && (
            <>
              <Text style={styles.detailDivider}>•</Text>
              <Text style={styles.detailText}>
                {kid.area_of_residence}
              </Text>
            </>
          )}
        </View>

        {/* Attendance Rate (if shown) */}
        {showAttendanceRate && attendanceStats && (
          <View style={styles.attendanceRow}>
            <View style={[
              styles.attendanceBadge,
              { backgroundColor: `${getAttendanceBadgeColor()}20` }
            ]}>
              <Text style={[
                styles.attendanceText,
                { color: getAttendanceBadgeColor() }
              ]}>
                {attendancePercentage}% attendance
              </Text>
            </View>
            <Text style={styles.attendanceDetail}>
              ({attendanceStats.present}/{attendanceStats.total} sessions)
            </Text>
          </View>
        )}
      </View>

      {/* Right Section: Status Badge */}
      <View style={styles.rightSection}>
        <View style={[
          styles.statusBadge,
          { backgroundColor: statusBadge.backgroundColor }
        ]}>
          <Text style={[
            styles.statusText,
            { color: statusBadge.color }
          ]}>
            {statusBadge.text}
          </Text>
        </View>

        {/* Long press hint */}
        {onLongPress && (
          <Text style={styles.longPressHint}>Hold for options</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
  suspendedContainer: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E0E0E0',
    opacity: 0.7,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarSuspended: {
    backgroundColor: COLORS.suspended,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  avatarTextSuspended: {
    color: '#FFFFFF',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  nameSuspended: {
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  detailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  detailDivider: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginHorizontal: 6,
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  attendanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  attendanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  attendanceDetail: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  longPressHint: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default KidListItem;