// Location: /apps/assessment/src/screens/Kids/AddEditKidScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { insertKid, updateKid, getKidById } from '../../database/db';
import { assignSportsToKid } from '../../services/kidService';
import { getCurrentUserId, getUserRole } from '../../utils/auth';
import { getAgeGroup } from '../../utils/helpers';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { HOUSE_TEAMS } from '../../utils/constants';

const SPORTS_CONFIG = {
  football: { name: 'Football', icon: '⚽', color: '#4CAF50' },
  athletics: { name: 'Athletics', icon: '🏃', color: '#2196F3' },
  rugby: { name: 'Rugby', icon: '🏉', color: '#FF9800' },
  swimming: { name: 'Swimming', icon: '🏊', color: '#00BCD4' },
  tennis: { name: 'Tennis', icon: '🎾', color: '#9C27B0' },
  basketball: { name: 'Basketball', icon: '🏀', color: '#FF5722' },
};

const AGE_GROUPS = ['4-6', '7-9', '10-13', '13+'];
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const SPONSORSHIP_TYPES = [
  { value: 'SP', label: 'Self-Sponsored' },
  { value: 'SC', label: 'Scholarship' },
];
const PROGRAM_TYPES = [
  { value: 'ELT', label: 'Elite' },
  { value: 'WW', label: 'Weekend Warrior' },
  { value: 'HP', label: 'Holiday Program' },
  { value: 'TS', label: 'Team Support' },
  { value: 'Trial', label: 'Trial' },
  { value: 'Other', label: 'Other' },
];

const AddEditKidScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const existingKid = route.params?.kid;
  const isEditMode = !!existingKid;

  // Form state
  const [name, setName] = useState(existingKid?.name || '');
  const [age, setAge] = useState(existingKid?.age?.toString() || '');
  const [gender, setGender] = useState(existingKid?.gender || 'Male');
  const [area, setArea] = useState(existingKid?.area_of_residence || '');
  const [ageGroup, setAgeGroup] = useState(existingKid?.age_group || '10-13');
  const [sponsorshipType, setSponsorshipType] = useState(existingKid?.sponsorshipType || 'SP');
  const [programType, setProgramType] = useState(existingKid?.programType || 'ELT');
  const [houseTeam, setHouseTeam] = useState(existingKid?.house_team || null);
  
  // Sports state
  const [selectedSports, setSelectedSports] = useState([]);
  const [primarySport, setPrimarySport] = useState(null);

  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check user role
  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const role = await getUserRole();
    setIsAdmin(role === 'super_admin' || role === 'admin');
  };

  // Auto-calculate age group when age changes
  useEffect(() => {
    if (age) {
      const ageNum = parseInt(age);
      if (!isNaN(ageNum) && ageNum >= 4 && ageNum <= 20) {
        const calculatedAgeGroup = getAgeGroup(ageNum);
        if (calculatedAgeGroup !== 'Unknown') {
          setAgeGroup(calculatedAgeGroup);
        }
      }
    }
  }, [age]);

  // Load existing sports if editing
  useEffect(() => {
    if (isEditMode && existingKid) {
      const sports = existingKid.sports_enrolled || [];
      setSelectedSports(sports);
      setPrimarySport(existingKid.primary_sport || (sports.length > 0 ? sports[0] : null));
    }
  }, []);

  // Toggle sport selection
  const toggleSport = (sportId) => {
    if (selectedSports.includes(sportId)) {
      // Remove sport
      const updated = selectedSports.filter(s => s !== sportId);
      setSelectedSports(updated);
      
      // If removing primary sport, set new primary
      if (primarySport === sportId) {
        setPrimarySport(updated.length > 0 ? updated[0] : null);
      }
    } else {
      // Add sport
      const updated = [...selectedSports, sportId];
      setSelectedSports(updated);
      
      // If no primary, set this as primary
      if (!primarySport) {
        setPrimarySport(sportId);
      }
    }
  };

  // Set primary sport
  const handleSetPrimary = (sportId) => {
    if (selectedSports.includes(sportId)) {
      setPrimarySport(sportId);
    }
  };

  // Validate form
  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter kid name');
      return false;
    }

    const ageNum = parseInt(age);
    if (!age || isNaN(ageNum) || ageNum < 1 || ageNum > 20) {
      Alert.alert('Validation Error', 'Please enter a valid age (1-20)');
      return false;
    }

    if (selectedSports.length === 0) {
      Alert.alert(
        'No Sports Selected',
        'Kids should have at least one sport assigned. Do you want to continue without assigning sports?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue Anyway', onPress: () => handleSave(true) },
        ]
      );
      return false;
    }

    if (selectedSports.length > 0 && !primarySport) {
      Alert.alert('Validation Error', 'Please select a primary sport');
      return false;
    }

    return true;
  };

  // Save kid
  const handleSave = async (skipSportsValidation = false) => {
    if (!skipSportsValidation && !validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const userId = await AsyncStorage.getItem('currentUserId');
      if (!userId) {
        Alert.alert('Error', 'User not logged in');
        return;
      }

      const ageNum = parseInt(age);

      if (isEditMode) {
        // Update existing kid
        await updateKid(existingKid.id, {
          name: name.trim(),
          age: ageNum,
          gender,
          area_of_residence: area.trim(),
          age_group: ageGroup,
          sponsorshipType,
          programType,
          house_team: houseTeam,
        });

        // Update sports assignment
        if (selectedSports.length > 0 && primarySport) {
          await assignSportsToKid(existingKid.id, selectedSports, primarySport);
        }

        Alert.alert('Success', 'Kid updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        // Create new kid
        const newKid = await insertKid(
          userId,
          name.trim(),
          ageNum,
          gender,
          area.trim(),
          ageGroup,
          sponsorshipType,
          programType,
          null, // programTypeOther
          null, // trialNotes
          false, // skipFirebaseSync
          null, // providedKidId
          houseTeam // house_team
        );

        // Assign sports
        if (selectedSports.length > 0 && primarySport && newKid.id) {
          await assignSportsToKid(newKid.id, selectedSports, primarySport);
        }

        Alert.alert('Success', 'Kid added successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('❌ Error saving kid:', error);
      Alert.alert('Error', error.message || 'Failed to save kid. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Header
        title={isEditMode ? 'Edit Kid' : 'Add New Kid'}
        leftIcon="←"
        onLeftPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter kid's full name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Age *</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
            placeholder="Enter age"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollableOptions}
          >
            {GENDER_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  gender === option && styles.optionButtonSelected
                ]}
                onPress={() => setGender(option)}
              >
                <Text style={[
                  styles.optionText,
                  gender === option && styles.optionTextSelected
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Area of Residence</Text>
          <TextInput
            style={styles.input}
            value={area}
            onChangeText={setArea}
            placeholder="Enter area (e.g., Nairobi)"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Age Group *</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollableOptions}
          >
            {AGE_GROUPS.map(group => (
              <TouchableOpacity
                key={group}
                style={[
                  styles.optionButton,
                  ageGroup === group && styles.optionButtonSelected
                ]}
                onPress={() => setAgeGroup(group)}
              >
                <Text style={[
                  styles.optionText,
                  ageGroup === group && styles.optionTextSelected
                ]}>{group}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Sponsorship Type
            {isAdmin && <Text style={styles.adminBadge}> (Admin Only)</Text>}
          </Text>
          {isAdmin ? (
            <View style={styles.optionsRow}>
              {SPONSORSHIP_TYPES.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    sponsorshipType === option.value && styles.optionButtonSelected
                  ]}
                  onPress={() => setSponsorshipType(option.value)}
                >
                  <Text style={[
                    styles.optionText,
                    sponsorshipType === option.value && styles.optionTextSelected
                  ]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.readOnlyContainer}>
              <Text style={styles.readOnlyText}>
                {SPONSORSHIP_TYPES.find(t => t.value === sponsorshipType)?.label || 'Not set'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Program Type
            {isAdmin && <Text style={styles.adminBadge}> (Admin Only)</Text>}
          </Text>
          {isAdmin ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollableOptions}
            >
              {PROGRAM_TYPES.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    programType === option.value && styles.optionButtonSelected
                  ]}
                  onPress={() => setProgramType(option.value)}
                >
                  <Text style={[
                    styles.optionText,
                    programType === option.value && styles.optionTextSelected
                  ]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.readOnlyContainer}>
              <Text style={styles.readOnlyText}>
                {PROGRAM_TYPES.find(t => t.value === programType)?.label || 'Not set'}
              </Text>
            </View>
          )}
        </View>

        {/* Info box for age group auto-calculation */}
        {ageGroup && (
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              Age group automatically calculated based on age
            </Text>
          </View>
        )}

        {/* House Team Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>House Team</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollableOptions}
          >
            {HOUSE_TEAMS.map(team => (
              <TouchableOpacity
                key={team.id}
                style={[
                  styles.houseTeamButton,
                  houseTeam === team.id && styles.houseTeamButtonSelected,
                  { borderColor: team.color }
                ]}
                onPress={() => setHouseTeam(team.id)}
              >
                <Text style={styles.houseTeamEmoji}>{team.emoji}</Text>
                <Text style={[
                  styles.houseTeamText,
                  houseTeam === team.id && { color: team.color }
                ]}>{team.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {houseTeam && (
            <View style={[styles.selectedHouseTeamBadge, { backgroundColor: HOUSE_TEAMS.find(t => t.id === houseTeam)?.color + '20' }]}>
              <Text style={styles.selectedHouseTeamText}>
                Selected: {HOUSE_TEAMS.find(t => t.id === houseTeam)?.name}
              </Text>
            </View>
          )}
        </View>
      </Card>

      {/* Sports Selection */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Sports Assignment</Text>
        <Text style={styles.sectionSubtitle}>
          Select sports this kid participates in. Mark one as primary.
        </Text>

        <View style={styles.sportsGrid}>
          {Object.keys(SPORTS_CONFIG).map(sportId => {
            const sport = SPORTS_CONFIG[sportId];
            const isSelected = selectedSports.includes(sportId);
            const isPrimary = primarySport === sportId;

            return (
              <View key={sportId} style={styles.sportCardWrapper}>
                <TouchableOpacity
                  style={[
                    styles.sportCard,
                    isSelected && styles.sportCardSelected,
                    isPrimary && styles.sportCardPrimary,
                  ]}
                  onPress={() => toggleSport(sportId)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sportIcon}>{sport.icon}</Text>
                  <Text style={[
                    styles.sportName,
                    isSelected && styles.sportNameSelected
                  ]}>{sport.name}</Text>
                  
                  {isPrimary && (
                    <Badge
                      text="PRIMARY"
                      backgroundColor="#4CAF50"
                      textColor="#FFFFFF"
                      style={styles.primaryBadge}
                    />
                  )}
                </TouchableOpacity>

                {isSelected && !isPrimary && (
                  <TouchableOpacity
                    style={styles.setPrimaryButton}
                    onPress={() => handleSetPrimary(sportId)}
                  >
                    <Text style={styles.setPrimaryText}>Set as Primary</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {selectedSports.length === 0 && (
          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              No sports selected. Kids should have at least one sport assigned.
            </Text>
          </View>
        )}
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          title="Cancel"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={styles.cancelButton}
        />
        <Button
          title={saving ? 'Saving...' : isEditMode ? 'Update Kid' : 'Add Kid'}
          onPress={handleSave}
          disabled={saving}
          style={styles.saveButton}
        />
      </View>

      {saving && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Saving...</Text>
        </View>
      )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    outlineStyle: 'none',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  optionButtonSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  optionText: {
    fontSize: 14,
    color: '#212121',
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollableOptions: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  adminBadge: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: 'bold',
  },
  readOnlyContainer: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
  },
  readOnlyText: {
    fontSize: 16,
    color: '#757575',
    fontStyle: 'italic',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1976D2',
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  sportCardWrapper: {
    width: '48%',
  },
sportCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  sportCardSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  sportCardPrimary: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
    borderWidth: 3,
  },
  sportIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  sportName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'center',
  },
  sportNameSelected: {
    color: '#2196F3',
  },
  primaryBadge: {
    marginTop: 8,
  },
  setPrimaryButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    alignItems: 'center',
  },
  setPrimaryText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  houseTeamButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    minWidth: 120,
  },
  houseTeamButtonSelected: {
    backgroundColor: '#F5F5F5',
    borderWidth: 3,
  },
  houseTeamEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  houseTeamText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#212121',
  },
  selectedHouseTeamBadge: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedHouseTeamText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
});

export default AddEditKidScreen;
