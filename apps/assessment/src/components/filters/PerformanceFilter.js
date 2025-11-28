// Location: /apps/assessment/src/components/filters/PerformanceFilter.js
// Filter kids/assessments by performance level

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

/**
 * PerformanceFilter Component
 * 
 * @param {Function} onChange - Callback when filter changes: (selectedLevels, label) => {}
 * @param {Array} selectedLevels - Currently selected performance levels
 * @param {Boolean} multiSelect - Allow multiple selections (default: false)
 */
export default function PerformanceFilter({ 
  onChange,
  selectedLevels = [],
  multiSelect = false,
}) {
  
  const [modalVisible, setModalVisible] = useState(false);
  const [activeLevels, setActiveLevels] = useState(selectedLevels);

  // Performance levels
  const performanceLevels = [
    {
      id: 'all',
      label: 'All Levels',
      icon: 'apps',
      color: COLORS.textSecondary,
      description: 'Show all performance levels',
    },
    {
      id: 'excellent',
      label: 'Excellent',
      icon: 'star',
      color: '#4CAF50',
      description: '75th+ percentile (8-10 rating)',
      percentileRange: '75-100',
      ratingRange: '8-10',
    },
    {
      id: 'good',
      label: 'Good',
      icon: 'thumbs-up',
      color: '#2196F3',
      description: '50-74th percentile (6-7 rating)',
      percentileRange: '50-74',
      ratingRange: '6-7',
    },
    {
      id: 'fair',
      label: 'Fair',
      icon: 'warning',
      color: '#FF9800',
      description: '25-49th percentile (4-5 rating)',
      percentileRange: '25-49',
      ratingRange: '4-5',
    },
    {
      id: 'needsWork',
      label: 'Needs Work',
      icon: 'alert-circle',
      color: '#F44336',
      description: 'Below 25th percentile (1-3 rating)',
      percentileRange: '0-24',
      ratingRange: '1-3',
    },
    {
      id: 'improved',
      label: 'Improved',
      icon: 'trending-up',
      color: COLORS.success,
      description: '15%+ improvement since last assessment',
    },
    {
      id: 'declined',
      label: 'Declined',
      icon: 'trending-down',
      color: COLORS.error,
      description: '15%+ decline since last assessment',
    },
    {
      id: 'consistent',
      label: 'Consistent',
      icon: 'remove',
      color: '#9E9E9E',
      description: 'No major change (<15% variation)',
    },
  ];

  const handleLevelToggle = (levelId) => {
    if (levelId === 'all') {
      setActiveLevels([]);
      if (!multiSelect) setModalVisible(false);
      return;
    }

    if (multiSelect) {
      // Multi-select mode
      setActiveLevels(prev =>
        prev.includes(levelId)
          ? prev.filter(id => id !== levelId)
          : [...prev, levelId]
      );
    } else {
      // Single-select mode
      setActiveLevels([levelId]);
      setModalVisible(false);
    }
  };

  const handleApply = () => {
    const label = activeLevels.length === 0
      ? 'All Levels'
      : activeLevels.map(id => performanceLevels.find(l => l.id === id)?.label).join(', ');
    
    if (onChange) {
      onChange(activeLevels, label);
    }
    setModalVisible(false);
  };

  const handleClear = () => {
    setActiveLevels([]);
    if (onChange) {
      onChange([], 'All Levels');
    }
  };

  const getDisplayLabel = () => {
    if (activeLevels.length === 0) return 'All Levels';
    if (activeLevels.length === 1) {
      return performanceLevels.find(l => l.id === activeLevels[0])?.label || 'Select Level';
    }
    return `${activeLevels.length} levels selected`;
  };

  const getDisplayColor = () => {
    if (activeLevels.length === 1) {
      return performanceLevels.find(l => l.id === activeLevels[0])?.color || COLORS.primary;
    }
    return COLORS.primary;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.triggerContent}>
          <View style={[styles.colorDot, { backgroundColor: getDisplayColor() }]} />
          <Text style={styles.triggerText}>{getDisplayLabel()}</Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>

      {/* Active Levels Display */}
      {activeLevels.length > 0 && (
        <View style={styles.activeLevelsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {activeLevels.map(levelId => {
              const level = performanceLevels.find(l => l.id === levelId);
              return (
                <View key={levelId} style={[styles.levelChip, { backgroundColor: level?.color + '20' }]}>
                  <Ionicons name={level?.icon} size={12} color={level?.color} />
                  <Text style={[styles.levelChipText, { color: level?.color }]}>
                    {level?.label}
                  </Text>
                  <TouchableOpacity onPress={() => handleLevelToggle(levelId)}>
                    <Ionicons name="close-circle" size={14} color={level?.color} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

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
              <Text style={styles.modalTitle}>
                {multiSelect ? 'Select Performance Levels' : 'Filter by Performance'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Info Banner */}
            {multiSelect && (
              <View style={styles.infoBanner}>
                <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                <Text style={styles.infoBannerText}>
                  Select multiple levels to filter results
                </Text>
              </View>
            )}

            {/* Levels List */}
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Performance Ratings */}
              <Text style={styles.sectionTitle}>By Rating</Text>
              {performanceLevels.slice(0, 5).map((level) => (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.levelOption,
                    activeLevels.includes(level.id) && styles.activeLevelOption,
                    level.id === 'all' && styles.allLevelOption,
                  ]}
                  onPress={() => handleLevelToggle(level.id)}
                >
                  <View style={styles.levelLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: level.color + '20' }]}>
                      <Ionicons name={level.icon} size={20} color={level.color} />
                    </View>
                    <View style={styles.levelTextContainer}>
                      <Text style={[
                        styles.levelLabel,
                        activeLevels.includes(level.id) && styles.activeLevelLabel
                      ]}>
                        {level.label}
                      </Text>
                      <Text style={styles.levelDescription}>{level.description}</Text>
                      {level.ratingRange && (
                        <View style={styles.rangeContainer}>
                          <View style={styles.rangeBadge}>
                            <Text style={styles.rangeText}>Rating: {level.ratingRange}</Text>
                          </View>
                          {level.percentileRange && (
                            <View style={styles.rangeBadge}>
                              <Text style={styles.rangeText}>Percentile: {level.percentileRange}</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                  {activeLevels.includes(level.id) && (
                    <Ionicons name="checkmark-circle" size={24} color={level.color} />
                  )}
                </TouchableOpacity>
              ))}

              {/* Performance Trends */}
              <Text style={styles.sectionTitle}>By Trend</Text>
              {performanceLevels.slice(5).map((level) => (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.levelOption,
                    activeLevels.includes(level.id) && styles.activeLevelOption,
                  ]}
                  onPress={() => handleLevelToggle(level.id)}
                >
                  <View style={styles.levelLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: level.color + '20' }]}>
                      <Ionicons name={level.icon} size={20} color={level.color} />
                    </View>
                    <View style={styles.levelTextContainer}>
                      <Text style={[
                        styles.levelLabel,
                        activeLevels.includes(level.id) && styles.activeLevelLabel
                      ]}>
                        {level.label}
                      </Text>
                      <Text style={styles.levelDescription}>{level.description}</Text>
                    </View>
                  </View>
                  {activeLevels.includes(level.id) && (
                    <Ionicons name="checkmark-circle" size={24} color={level.color} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Footer Actions */}
            {multiSelect && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.footerButton}
                  onPress={handleClear}
                >
                  <Text style={styles.footerButtonTextSecondary}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.footerButton, styles.footerButtonPrimary]}
                  onPress={handleApply}
                >
                  <Text style={styles.footerButtonText}>
                    Apply ({activeLevels.length})
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  triggerText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  
  activeLevelsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  chipScroll: {
    flex: 1,
  },
  levelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    gap: 4,
  },
  levelChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.error,
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
    maxHeight: '85%',
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight + '20',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primary,
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
  levelOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeLevelOption: {
    backgroundColor: COLORS.primaryLight + '10',
    borderColor: COLORS.primary,
  },
  allLevelOption: {
    backgroundColor: COLORS.backgroundDark,
  },
  levelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelTextContainer: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  activeLevelLabel: {
    color: COLORS.primary,
  },
  levelDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  rangeContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  rangeBadge: {
    backgroundColor: COLORS.backgroundDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rangeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
  },
  footerButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  footerButtonTextSecondary: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
});