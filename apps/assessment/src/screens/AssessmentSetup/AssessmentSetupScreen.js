// Location: /apps/assessment/src/screens/AssessmentSetup/AssessmentSetupScreen.js
// Assessment Setup Screen - Capture metadata before sport selection

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import { COLORS } from '../../utils/constants';
import { getCurrentUser } from '../../utils/auth';
import { triggerSyncOnChange } from '../../services/autoSyncTrigger';

export default function AssessmentSetupScreen() {
  const navigation = useNavigation();
  
  // Metadata state
  const [year, setYear] = useState('');
  const [term, setTerm] = useState('');
  const [assessmentType, setAssessmentType] = useState('');
  const [weekNumber, setWeekNumber] = useState('');
  const [location, setLocation] = useState('');
  const [assessorName, setAssessorName] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  
  // Validation state
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    loadDefaults();
  }, []);
  
  const loadDefaults = async () => {
    try {
      // Get current user
      const user = await getCurrentUser();
      setAssessorName(user?.username || user?.fullName || user?.full_name || 'Coach');
      
      // Auto-suggest current academic year
      const currentYear = getCurrentAcademicYear();
      setYear(currentYear);
      
      // Auto-suggest current term based on month
      const currentTerm = getCurrentTerm();
      setTerm(currentTerm);
      
      // Auto-suggest week number based on term start
      const suggestedWeek = getSuggestedWeekNumber(currentTerm);
      setWeekNumber(suggestedWeek.toString());
      
    } catch (error) {
      console.error('Error loading defaults:', error);
    }
  };
  
  // Get current academic year (Jan-Dec cycles)
  const getCurrentAcademicYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const nextYear = year + 1;
    return `${year}/${nextYear}`;
  };
  
  // Get current term based on month
  const getCurrentTerm = () => {
    const month = new Date().getMonth() + 1; // 1-12
    if (month >= 1 && month <= 3) return 'Q1';
    if (month >= 4 && month <= 6) return 'Q2';
    if (month >= 7 && month <= 9) return 'Q3';
    return 'Q4';
  };
  
  // Get suggested week number based on term and current date
  const getSuggestedWeekNumber = (selectedTerm) => {
    const now = new Date();
    const year = now.getFullYear();
    
    // Term start dates (approximate)
    const termStarts = {
      Q1: new Date(year, 0, 1),   // Jan 1
      Q2: new Date(year, 3, 1),   // Apr 1
      Q3: new Date(year, 6, 1),   // Jul 1
      Q4: new Date(year, 9, 1),   // Oct 1
    };
    
    const termStart = termStarts[selectedTerm];
    const daysSinceStart = Math.floor((now - termStart) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.min(Math.floor(daysSinceStart / 7) + 1, 12);
    
    return Math.max(weekNumber, 1); // Min week 1
  };
  
  // Generate academic year options (current + 2 years back, 1 year forward)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    for (let i = -2; i <= 1; i++) {
      const year = currentYear + i;
      years.push(`${year}/${year + 1}`);
    }
    
    return years;
  };
  
  const TERM_OPTIONS = [
    { value: 'Q1', label: 'Term 1 (Jan-Mar)' },
    { value: 'Q2', label: 'Term 2 (Apr-Jun)' },
    { value: 'Q3', label: 'Term 3 (Jul-Sep)' },
    { value: 'Q4', label: 'Term 4 (Oct-Dec)' },
  ];
  
  const ASSESSMENT_TYPE_OPTIONS = [
    { value: 'baseline', label: 'Baseline', description: 'Start of term assessment' },
    { value: 'mid_term', label: 'Mid-Term', description: 'Week 6 checkpoint' },
    { value: 'final', label: 'Final', description: 'End of term assessment' },
    { value: 'ad_hoc', label: 'Ad-hoc', description: 'One-off assessment' },
  ];
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!year) newErrors.year = 'Year is required';
    if (!term) newErrors.term = 'Term is required';
    if (!assessmentType) newErrors.assessmentType = 'Assessment type is required';
    if (!weekNumber || weekNumber < 1 || weekNumber > 12) {
      newErrors.weekNumber = 'Week must be between 1-12';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleContinue = async () => {
    if (!validateForm()) {
      return;
    }
    
    console.log('🔍 AssessmentSetup - Metadata being passed:', {
      year,
      term,
      assessmentType,
      weekNumber,
    });
    
    // ✅ Trigger sync after setting up assessment
    try {
      await triggerSyncOnChange('assessment_setup_completed');
    } catch (error) {
      console.warn('Failed to trigger sync:', error);
    }
    
    // Pass metadata to next screen (Select Sport)
    navigation.navigate('SelectSport', {
      assessmentMetadata: {
        year,
        term,
        assessmentType,
        weekNumber: parseInt(weekNumber),
        location: location.trim() || null,
        assessorName,
        generalNotes: generalNotes.trim() || null,
        setupDate: new Date().toISOString(),
        assessmentDate: new Date().toISOString().split('T')[0],
      },
    });
  };
  
  return (
    <View style={styles.container}>
      <Header
        title="Assessment Setup"
        subtitle="Configure assessment details"
        leftIcon="☰"
        onLeftPress={() => navigation.openDrawer()}
      />
      
      <View style={styles.contentWrapper}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Instructions Card */}
        <View style={styles.instructionsCard}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <Text style={styles.instructionsText}>
            Set up assessment context. This information will apply to all kids assessed in this session.
          </Text>
        </View>
        
        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Academic Year */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Academic Year *</Text>
            <View style={styles.chipContainer}>
              {getYearOptions().map((yearOption) => (
                <TouchableOpacity
                  key={yearOption}
                  style={[
                    styles.chip,
                    year === yearOption && styles.chipSelected,
                  ]}
                  onPress={() => setYear(yearOption)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.chipText,
                    year === yearOption && styles.chipTextSelected,
                  ]}>
                    {yearOption}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}
          </View>
          
          {/* Term */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Term *</Text>
            <View style={styles.chipContainer}>
              {TERM_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.chip,
                    term === option.value && styles.chipSelected,
                  ]}
                  onPress={() => {
                    setTerm(option.value);
                    // Update suggested week number when term changes
                    const suggestedWeek = getSuggestedWeekNumber(option.value);
                    setWeekNumber(suggestedWeek.toString());
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.chipText,
                    term === option.value && styles.chipTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.term && <Text style={styles.errorText}>{errors.term}</Text>}
          </View>
          
          {/* Assessment Type */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Assessment Type *</Text>
            <View style={styles.typeContainer}>
              {ASSESSMENT_TYPE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.typeCard,
                    assessmentType === option.value && styles.typeCardSelected,
                  ]}
                  onPress={() => setAssessmentType(option.value)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.typeRadio,
                    assessmentType === option.value && styles.typeRadioSelected,
                  ]}>
                    {assessmentType === option.value && (
                      <View style={styles.typeRadioDot} />
                    )}
                  </View>
                  <View style={styles.typeContent}>
                    <Text style={[
                      styles.typeLabel,
                      assessmentType === option.value && styles.typeLabelSelected,
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={styles.typeDescription}>{option.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            {errors.assessmentType && (
              <Text style={styles.errorText}>{errors.assessmentType}</Text>
            )}
          </View>
          
          {/* Week Number */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Week Number (1-12) *</Text>
            <TextInput
              style={[styles.input, errors.weekNumber && styles.inputError]}
              value={weekNumber}
              onChangeText={setWeekNumber}
              placeholder="e.g., 6"
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={styles.fieldHint}>
              Week {weekNumber || '?'} of {term || 'Term'}
            </Text>
            {errors.weekNumber && (
              <Text style={styles.errorText}>{errors.weekNumber}</Text>
            )}
          </View>
          
          {/* Location (Optional) */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Location (Optional)</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Main Field, Indoor Hall"
              maxLength={50}
            />
            <Text style={styles.fieldHint}>Where is the assessment taking place?</Text>
          </View>
          
          {/* Assessor Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Assessor Name</Text>
            <TextInput
              style={styles.input}
              value={assessorName}
              onChangeText={setAssessorName}
              placeholder="Coach name"
              maxLength={50}
            />
            <Text style={styles.fieldHint}>Your name will be recorded</Text>
          </View>
          
          {/* General Notes (Optional) */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>General Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={generalNotes}
              onChangeText={setGeneralNotes}
              placeholder="e.g., Post-training camp, Rainy conditions, First assessment of the term..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.fieldHint}>
              {generalNotes.length}/500 characters
            </Text>
          </View>
        </View>
        
        {/* Summary Preview */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Assessment Context Summary</Text>
          <View style={styles.summaryRow}>
            <Ionicons name="calendar" size={16} color={COLORS.textSecondary} />
            <Text style={styles.summaryText}>
              {year || 'Year not set'} {'\u2022'} {TERM_OPTIONS.find(t => t.value === term)?.label || 'Term not set'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="clipboard" size={16} color={COLORS.textSecondary} />
            <Text style={styles.summaryText}>
              {ASSESSMENT_TYPE_OPTIONS.find(t => t.value === assessmentType)?.label || 'Type not set'} {'\u2022'} Week {weekNumber || '?'}
            </Text>
          </View>
          {location && (
            <View style={styles.summaryRow}>
              <Ionicons name="location" size={16} color={COLORS.textSecondary} />
              <Text style={styles.summaryText}>{location}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Ionicons name="person" size={16} color={COLORS.textSecondary} />
            <Text style={styles.summaryText}>{assessorName || 'Assessor not set'}</Text>
          </View>
        </View>
        
        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!year || !term || !assessmentType || !weekNumber) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          activeOpacity={0.8}
          disabled={!year || !term || !assessmentType || !weekNumber}
        >
          <Text style={styles.continueButtonText}>Continue to Sport Selection</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
        </TouchableOpacity>
        
        <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentWrapper: {
    position: 'absolute',
    top: 116,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  
  // Instructions
  instructionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight + '40',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.primary,
    lineHeight: 20,
  },
  
  // Form Section
  formSection: {
    paddingHorizontal: 20,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  fieldHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  
  // Chips
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  chipTextSelected: {
    color: COLORS.white,
  },
  
  // Assessment Type Cards
  typeContainer: {
    gap: 12,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  typeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight + '20',
  },
  typeRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeRadioSelected: {
    borderColor: COLORS.primary,
  },
  typeRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  typeContent: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  typeLabelSelected: {
    color: COLORS.primary,
  },
  typeDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  
  // Input
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  textArea: {
    height: 100,
    paddingTop: 16,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    marginTop: 8,
  },
  
  // Summary Card
  summaryCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  summaryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  
  // Continue Button
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 18,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  
  bottomPadding: {
    height: 32,
  },
});