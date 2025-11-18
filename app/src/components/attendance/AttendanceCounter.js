import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../utils/constants';

const AttendanceCounter = ({ 
  total, 
  marked, 
  present, 
  absent, 
  onFilterChange,
  activeFilter = 'unmarked' // 'unmarked', 'marked', 'present', 'absent', 'all'
}) => {
  const percentage = total > 0 ? Math.round((marked / total) * 100) : 0;
  const isComplete = marked === total;

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <TouchableOpacity
          style={[
            styles.statItem,
            activeFilter === 'marked' && styles.statItemActive
          ]}
          onPress={() => onFilterChange('marked')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.statNumber,
            activeFilter === 'marked' && styles.statNumberActive
          ]}>
            {marked}
          </Text>
          <Text style={[
            styles.statLabel,
            activeFilter === 'marked' && styles.statLabelActive
          ]}>
            Marked
          </Text>
        </TouchableOpacity>
        
        <View style={styles.divider} />
        
        <TouchableOpacity
          style={[
            styles.statItem,
            activeFilter === 'present' && styles.statItemActivePresent
          ]}
          onPress={() => onFilterChange('present')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.statNumber, 
            { color: COLORS.present },
            activeFilter === 'present' && styles.statNumberActive
          ]}>
            {present}
          </Text>
          <Text style={[
            styles.statLabel,
            activeFilter === 'present' && styles.statLabelActive
          ]}>
            Present
          </Text>
        </TouchableOpacity>
        
        <View style={styles.divider} />
        
        <TouchableOpacity
          style={[
            styles.statItem,
            activeFilter === 'absent' && styles.statItemActiveAbsent
          ]}
          onPress={() => onFilterChange('absent')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.statNumber, 
            { color: COLORS.absent },
            activeFilter === 'absent' && styles.statNumberActive
          ]}>
            {absent}
          </Text>
          <Text style={[
            styles.statLabel,
            activeFilter === 'absent' && styles.statLabelActive
          ]}>
            Absent
          </Text>
        </TouchableOpacity>
        
        <View style={styles.divider} />
        
        <TouchableOpacity
          style={[
            styles.statItem,
            activeFilter === 'all' && styles.statItemActive
          ]}
          onPress={() => onFilterChange('all')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.statNumber,
            activeFilter === 'all' && styles.statNumberActive
          ]}>
            {total}
          </Text>
          <Text style={[
            styles.statLabel,
            activeFilter === 'all' && styles.statLabelActive
          ]}>
            Total
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${percentage}%`,
                backgroundColor: isComplete ? COLORS.present : COLORS.primary 
              }
            ]} 
          />
        </View>
        <Text style={[
          styles.progressText,
          isComplete && { color: COLORS.present, fontWeight: 'bold' }
        ]}>
          {isComplete ? 'All done! ✓' : `${percentage}% complete`}
        </Text>
      </View>

      {/* Remaining Count */}
      {!isComplete && activeFilter === 'unmarked' && (
        <Text style={styles.remainingText}>
          {total - marked} {total - marked === 1 ? 'kid' : 'kids'} remaining
        </Text>
      )}

      {/* Filter Hint */}
      {activeFilter !== 'unmarked' && (
        <TouchableOpacity 
          onPress={() => onFilterChange('unmarked')}
          style={styles.resetFilterButton}
        >
          <Text style={styles.resetFilterText}>
            Tap to show unmarked kids
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  statItemActive: {
    backgroundColor: '#E3F2FD',
  },
  statItemActivePresent: {
    backgroundColor: '#E8F5E9',
  },
  statItemActiveAbsent: {
    backgroundColor: '#FFEBEE',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statNumberActive: {
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  statLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border || '#E0E0E0',
    marginHorizontal: 8,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  remainingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  resetFilterButton: {
    marginTop: 8,
    paddingVertical: 6,
  },
  resetFilterText: {
    fontSize: 13,
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

export default AttendanceCounter;