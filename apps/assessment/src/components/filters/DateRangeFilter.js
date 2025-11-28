// Location: /apps/assessment/src/components/filters/DateRangeFilter.js
// Date range filter with presets and custom selection

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays, subMonths } from 'date-fns';

/**
 * DateRangeFilter Component
 * 
 * @param {Function} onRangeChange - Callback when date range changes: (startDate, endDate, label) => {}
 * @param {String} selectedRange - Currently selected range preset
 * @param {Boolean} showCustom - Show custom date picker (default: true)
 */
export default function DateRangeFilter({ 
  onRangeChange,
  selectedRange = 'all',
  showCustom = true,
}) {
  
  const [modalVisible, setModalVisible] = useState(false);
  const [activeRange, setActiveRange] = useState(selectedRange);

  // Date range presets
  const presets = [
    { id: 'all', label: 'All Time', icon: 'infinite' },
    { id: 'today', label: 'Today', icon: 'today' },
    { id: 'yesterday', label: 'Yesterday', icon: 'calendar' },
    { id: 'thisWeek', label: 'This Week', icon: 'calendar-outline' },
    { id: 'lastWeek', label: 'Last Week', icon: 'calendar-outline' },
    { id: 'thisMonth', label: 'This Month', icon: 'calendar' },
    { id: 'lastMonth', label: 'Last Month', icon: 'calendar' },
    { id: 'thisQuarter', label: 'This Quarter (Term)', icon: 'calendar-sharp' },
    { id: 'lastQuarter', label: 'Last Quarter', icon: 'calendar-sharp' },
    { id: 'thisYear', label: 'This Year', icon: 'calendar' },
    { id: 'lastYear', label: 'Last Year', icon: 'calendar' },
    { id: 'last7days', label: 'Last 7 Days', icon: 'time' },
    { id: 'last30days', label: 'Last 30 Days', icon: 'time' },
    { id: 'last90days', label: 'Last 90 Days', icon: 'time' },
  ];

  if (showCustom) {
    presets.push({ id: 'custom', label: 'Custom Range', icon: 'options' });
  }

  const calculateDateRange = (rangeId) => {
    const now = new Date();
    let startDate, endDate;

    switch (rangeId) {
      case 'all':
        return { startDate: null, endDate: null, label: 'All Time' };
      
      case 'today':
        startDate = now;
        endDate = now;
        break;
      
      case 'yesterday':
        startDate = subDays(now, 1);
        endDate = subDays(now, 1);
        break;
      
      case 'thisWeek':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      
      case 'lastWeek':
        const lastWeek = subDays(now, 7);
        startDate = startOfWeek(lastWeek, { weekStartsOn: 1 });
        endDate = endOfWeek(lastWeek, { weekStartsOn: 1 });
        break;
      
      case 'thisMonth':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        break;
      
      case 'thisQuarter':
        startDate = startOfQuarter(now);
        endDate = endOfQuarter(now);
        break;
      
      case 'lastQuarter':
        const lastQuarter = subMonths(now, 3);
        startDate = startOfQuarter(lastQuarter);
        endDate = endOfQuarter(lastQuarter);
        break;
      
      case 'thisYear':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      
      case 'lastYear':
        const lastYear = new Date(now.getFullYear() - 1, 0, 1);
        startDate = startOfYear(lastYear);
        endDate = endOfYear(lastYear);
        break;
      
      case 'last7days':
        startDate = subDays(now, 7);
        endDate = now;
        break;
      
      case 'last30days':
        startDate = subDays(now, 30);
        endDate = now;
        break;
      
      case 'last90days':
        startDate = subDays(now, 90);
        endDate = now;
        break;
      
      case 'custom':
        // Handle custom date picker
        return { startDate: null, endDate: null, label: 'Custom Range' };
      
      default:
        return { startDate: null, endDate: null, label: 'All Time' };
    }

    const label = presets.find(p => p.id === rangeId)?.label || rangeId;
    return { startDate, endDate, label };
  };

  const handleRangeSelect = (rangeId) => {
    const { startDate, endDate, label } = calculateDateRange(rangeId);
    setActiveRange(rangeId);
    setModalVisible(false);
    
    if (onRangeChange) {
      onRangeChange(
        startDate ? format(startDate, 'yyyy-MM-dd') : null,
        endDate ? format(endDate, 'yyyy-MM-dd') : null,
        label
      );
    }
  };

  const getDisplayLabel = () => {
    const preset = presets.find(p => p.id === activeRange);
    return preset?.label || 'Select Date Range';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.triggerContent}>
          <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
          <Text style={styles.triggerText}>{getDisplayLabel()}</Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date Range</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Presets List */}
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Quick Access */}
              <Text style={styles.sectionTitle}>Quick Access</Text>
              {presets.slice(0, 4).map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.presetOption,
                    activeRange === preset.id && styles.activePresetOption
                  ]}
                  onPress={() => handleRangeSelect(preset.id)}
                >
                  <View style={styles.presetLeft}>
                    <Ionicons 
                      name={preset.icon} 
                      size={20} 
                      color={activeRange === preset.id ? COLORS.primary : COLORS.textSecondary} 
                    />
                    <Text style={[
                      styles.presetLabel,
                      activeRange === preset.id && styles.activePresetLabel
                    ]}>
                      {preset.label}
                    </Text>
                  </View>
                  {activeRange === preset.id && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}

              {/* By Week */}
              <Text style={styles.sectionTitle}>By Week</Text>
              {presets.slice(4, 6).map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.presetOption,
                    activeRange === preset.id && styles.activePresetOption
                  ]}
                  onPress={() => handleRangeSelect(preset.id)}
                >
                  <View style={styles.presetLeft}>
                    <Ionicons 
                      name={preset.icon} 
                      size={20} 
                      color={activeRange === preset.id ? COLORS.primary : COLORS.textSecondary} 
                    />
                    <Text style={[
                      styles.presetLabel,
                      activeRange === preset.id && styles.activePresetLabel
                    ]}>
                      {preset.label}
                    </Text>
                  </View>
                  {activeRange === preset.id && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}

              {/* By Month */}
              <Text style={styles.sectionTitle}>By Month</Text>
              {presets.slice(6, 8).map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.presetOption,
                    activeRange === preset.id && styles.activePresetOption
                  ]}
                  onPress={() => handleRangeSelect(preset.id)}
                >
                  <View style={styles.presetLeft}>
                    <Ionicons 
                      name={preset.icon} 
                      size={20} 
                      color={activeRange === preset.id ? COLORS.primary : COLORS.textSecondary} 
                    />
                    <Text style={[
                      styles.presetLabel,
                      activeRange === preset.id && styles.activePresetLabel
                    ]}>
                      {preset.label}
                    </Text>
                  </View>
                  {activeRange === preset.id && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}

              {/* By Quarter (Term) */}
              <Text style={styles.sectionTitle}>By Term</Text>
              {presets.slice(8, 10).map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.presetOption,
                    activeRange === preset.id && styles.activePresetOption
                  ]}
                  onPress={() => handleRangeSelect(preset.id)}
                >
                  <View style={styles.presetLeft}>
                    <Ionicons 
                      name={preset.icon} 
                      size={20} 
                      color={activeRange === preset.id ? COLORS.primary : COLORS.textSecondary} 
                    />
                    <Text style={[
                      styles.presetLabel,
                      activeRange === preset.id && styles.activePresetLabel
                    ]}>
                      {preset.label}
                    </Text>
                  </View>
                  {activeRange === preset.id && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}

              {/* By Year */}
              <Text style={styles.sectionTitle}>By Year</Text>
              {presets.slice(10, 12).map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.presetOption,
                    activeRange === preset.id && styles.activePresetOption
                  ]}
                  onPress={() => handleRangeSelect(preset.id)}
                >
                  <View style={styles.presetLeft}>
                    <Ionicons 
                      name={preset.icon} 
                      size={20} 
                      color={activeRange === preset.id ? COLORS.primary : COLORS.textSecondary} 
                    />
                    <Text style={[
                      styles.presetLabel,
                      activeRange === preset.id && styles.activePresetLabel
                    ]}>
                      {preset.label}
                    </Text>
                  </View>
                  {activeRange === preset.id && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}

              {/* Rolling Periods */}
              <Text style={styles.sectionTitle}>Rolling Periods</Text>
              {presets.slice(12, 15).map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.presetOption,
                    activeRange === preset.id && styles.activePresetOption
                  ]}
                  onPress={() => handleRangeSelect(preset.id)}
                >
                  <View style={styles.presetLeft}>
                    <Ionicons 
                      name={preset.icon} 
                      size={20} 
                      color={activeRange === preset.id ? COLORS.primary : COLORS.textSecondary} 
                    />
                    <Text style={[
                      styles.presetLabel,
                      activeRange === preset.id && styles.activePresetLabel
                    ]}>
                      {preset.label}
                    </Text>
                  </View>
                  {activeRange === preset.id && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}

              {/* Custom (if enabled) */}
              {showCustom && (
                <>
                  <Text style={styles.sectionTitle}>Custom</Text>
                  <TouchableOpacity
                    style={styles.customButton}
                    onPress={() => {
                      setModalVisible(false);
                      // Open custom date picker (implement separately)
                    }}
                  >
                    <Ionicons name="options" size={20} color={COLORS.primary} />
                    <Text style={styles.customButtonText}>Select Custom Date Range</Text>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  triggerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  triggerText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  presetOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  activePresetOption: {
    backgroundColor: COLORS.primaryLight + '40',
  },
  presetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  presetLabel: {
    fontSize: 15,
    color: COLORS.text,
  },
  activePresetLabel: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryLight + '20',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  customButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 12,
  },
});