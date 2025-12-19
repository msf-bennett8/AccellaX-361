// Location: /apps/assessment/src/components/filters/SportFilter.js
// Sport filter dropdown component

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import { getAllSports } from '../../database/db';

/**
 * SportFilter Component
 * 
 * @param {Function} onSportChange - Callback when sport changes: (sportId, sportName) => {}
 * @param {String} selectedSport - Currently selected sport ID
 * @param {Boolean} showAllOption - Show "All Sports" option (default: true)
 */
export default function SportFilter({ 
  onSportChange,
  selectedSport = 'all',
  showAllOption = true,
}) {
  
  const [modalVisible, setModalVisible] = useState(false);
  const [sports, setSports] = useState([]);
  const [activeSport, setActiveSport] = useState(selectedSport);

  useEffect(() => {
    loadSports();
  }, []);

  const loadSports = async () => {
    try {
      const allSports = await getAllSports();
      
      // Remove duplicates based on sport.id
      const uniqueSports = allSports.filter((sport, index, self) =>
        index === self.findIndex((s) => s.id === sport.id)
      );
      
      const sportsWithIcons = uniqueSports.map(sport => ({
      
      const sportsWithIcons = allSports.map(sport => ({
        ...sport,
        iconName: getSportIcon(sport.id),
        color: getSportColor(sport.id),
      }));
      
      setSports(sportsWithIcons);
    } catch (error) {
      console.error('Error loading sports:', error);
    }
  };

  const getSportIcon = (sportId) => {
    const iconMap = {
      'football': 'soccer',
      'athletics': 'run-fast',
      'rugby': 'rugby',
      'basketball': 'basketball',
      'tennis': 'tennis',
      'swimming': 'swim',
      'general': 'heart-pulse',
    };
    return iconMap[sportId] || 'trophy';
  };

  const getSportColor = (sportId) => {
    const colorMap = {
      'football': '#4CAF50',
      'athletics': '#FF9800',
      'rugby': '#795548',
      'basketball': '#FF5722',
      'tennis': '#9C27B0',
      'swimming': '#2196F3',
      'general': '#E74C3C',
    };
    return colorMap[sportId] || COLORS.primary;
  };

  const handleSportSelect = (sportId, sportName) => {
    setActiveSport(sportId);
    setModalVisible(false);
    
    if (onSportChange) {
      onSportChange(sportId, sportName);
    }
  };

  const getDisplayLabel = () => {
    if (activeSport === 'all') return 'All Sports';
    const sport = sports.find(s => s.id === activeSport);
    return sport?.name || 'Select Sport';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.triggerContent}>
          <MaterialCommunityIcons name="trophy" size={20} color={COLORS.primary} />
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
              <Text style={styles.modalTitle}>Select Sport</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Sports List */}
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {showAllOption && (
                <TouchableOpacity
                  style={[
                    styles.sportOption,
                    activeSport === 'all' && styles.activeSportOption
                  ]}
                  onPress={() => handleSportSelect('all', 'All Sports')}
                >
                  <View style={styles.sportLeft}>
                    <View style={[styles.sportIconContainer, { backgroundColor: COLORS.primaryLight + '40' }]}>
                      <MaterialCommunityIcons 
                        name="trophy-variant" 
                        size={24} 
                        color={COLORS.primary} 
                      />
                    </View>
                    <Text style={[
                      styles.sportLabel,
                      activeSport === 'all' && styles.activeSportLabel
                    ]}>
                      All Sports
                    </Text>
                  </View>
                  {activeSport === 'all' && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}

              {sports.map((sport) => (
                <TouchableOpacity
                  key={sport.id}
                  style={[
                    styles.sportOption,
                    activeSport === sport.id && styles.activeSportOption
                  ]}
                  onPress={() => handleSportSelect(sport.id, sport.name)}
                >
                  <View style={styles.sportLeft}>
                    <View style={[styles.sportIconContainer, { backgroundColor: sport.color + '20' }]}>
                      <MaterialCommunityIcons 
                        name={sport.iconName} 
                        size={24} 
                        color={sport.color} 
                      />
                    </View>
                    <Text style={[
                      styles.sportLabel,
                      activeSport === sport.id && styles.activeSportLabel
                    ]}>
                      {sport.name}
                    </Text>
                  </View>
                  {activeSport === sport.id && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
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
    maxHeight: '70%',
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
  sportOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  activeSportOption: {
    backgroundColor: COLORS.primaryLight + '40',
  },
  sportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sportLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  activeSportLabel: {
    fontWeight: '600',
    color: COLORS.primary,
  },
});