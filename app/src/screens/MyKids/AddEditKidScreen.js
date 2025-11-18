import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, AGE_GROUPS, GENDER_OPTIONS, SPONSORSHIP_TYPES, PROGRAM_TYPES } from '../../utils/constants';
import Header from '../../components/common/Header';
import Dropdown from '../../components/common/Dropdown';
import { insertKid, updateKid } from '../../database/db';
import { getAgeGroup } from '../../utils/helpers';
import { getCurrentUserId, getUserRole } from '../../utils/auth';

const AddEditKidScreen = ({ navigation, route }) => {
  const kid = route?.params?.kid;
  const isEditMode = !!kid;

  const [formData, setFormData] = useState({
    name: kid?.name || '',
    age: kid?.age?.toString() || '',
    gender: kid?.gender || '',
    area_of_residence: kid?.area_of_residence || '',
    age_group: kid?.age_group || '',
    sponsorshipType: kid?.sponsorshipType || 'SP',
    programType: kid?.programType || 'ELT',
    programTypeOther: kid?.programTypeOther || '',
    trialNotes: kid?.trialNotes || '',
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const role = await getUserRole();
    console.log('👤 AddEditKidScreen: User role:', role);
    setIsAdmin(role === 'super_admin' || role === 'admin');
    console.log('🔐 AddEditKidScreen: isAdmin set to:', role === 'super_admin' || role === 'admin');
  };

  useEffect(() => {
    // Auto-calculate age group when age changes
    if (formData.age) {
      const ageNum = parseInt(formData.age);
      if (!isNaN(ageNum) && ageNum >= 4) {
        const calculatedAgeGroup = getAgeGroup(ageNum);
        if (calculatedAgeGroup !== 'Unknown') {
          setFormData((prev) => ({ ...prev, age_group: calculatedAgeGroup }));
        }
      }
    }
  }, [formData.age]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.age.trim()) {
      newErrors.age = 'Age is required';
    } else {
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 4 || ageNum > 20) {
        newErrors.age = 'Age must be between 4 and 20';
      }
    }

    if (!formData.age_group) {
      newErrors.age_group = 'Age group is required';
    }

    if (isAdmin && !formData.sponsorshipType) {
      newErrors.sponsorshipType = 'Sponsorship type is required';
    }

    if (isAdmin && !formData.programType) {
      newErrors.programType = 'Program type is required';
    }

    if (formData.programType === 'Other' && !formData.programTypeOther.trim()) {
      newErrors.programTypeOther = 'Please specify the program type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    // Prevent double submission
    if (isSaving) {
      console.log('⚠️ Already saving, ignoring duplicate call');
      return;
    }

    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }

    setIsSaving(true);
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        Alert.alert('Error', 'User not found. Please log in again.');
        return;
      }
      
      const ageNum = parseInt(formData.age);
      
      if (isEditMode) {
        await updateKid(kid.id, {
          name: formData.name.trim(),
          age: ageNum,
          gender: formData.gender || null,
          area_of_residence: formData.area_of_residence.trim() || null,
          age_group: formData.age_group,
          sponsorshipType: formData.sponsorshipType,
          programType: formData.programType,
          programTypeOther: formData.programType === 'Other' ? formData.programTypeOther.trim() : null,
          trialNotes: formData.programType === 'Trial' ? formData.trialNotes.trim() : null,
        });
        Alert.alert('Success', `${formData.name} has been updated successfully.`);
      } else {
        console.log('📝 Creating new kid...');
       await insertKid(
          userId,
          formData.name.trim(),
          ageNum,
          formData.gender || null,
          formData.area_of_residence.trim() || null,
          formData.age_group,
          formData.sponsorshipType,
          formData.programType,
          formData.programType === 'Other' ? formData.programTypeOther.trim() : null,
          formData.programType === 'Trial' ? formData.trialNotes.trim() : null
        );
        console.log('✅ Kid created successfully');
        Alert.alert('Success', `${formData.name} has been added successfully.`);
      }

      navigation.goBack();
    } catch (error) {
      console.error('❌ Error saving kid:', error);
      Alert.alert('Error', `Failed to save kid: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const renderInput = (label, field, placeholder, options = {}) => {
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          {label}
          {options.required && <Text style={styles.required}> *</Text>}
        </Text>
        <TextInput
          style={[styles.input, errors[field] && styles.inputError]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          value={formData[field]}
          onChangeText={(value) => updateField(field, value)}
          keyboardType={options.keyboardType || 'default'}
          autoCapitalize={options.autoCapitalize || 'words'}
          maxLength={options.maxLength}
          editable={options.editable !== false}
        />
        {errors[field] && (
          <Text style={styles.errorText}>{errors[field]}</Text>
        )}
      </View>
    );
  };

  const renderPicker = (label, field, options, required = false, adminOnly = false) => {
    // If admin-only field and user is not admin, show read-only view
    if (adminOnly && !isAdmin) {
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{label}</Text>
          <View style={styles.readOnlyContainer}>
            <Text style={styles.readOnlyText}>
              {formData[field] || 'Not set'}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
          {adminOnly && <Text style={styles.adminBadge}> (Admin Only)</Text>}
        </Text>
        <View style={styles.pickerContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.pickerOption,
                formData[field] === option.value && styles.pickerOptionSelected,
              ]}
              onPress={() => updateField(field, option.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  formData[field] === option.value && styles.pickerOptionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors[field] && (
          <Text style={styles.errorText}>{errors[field]}</Text>
        )}
      </View>
    );
  };

  const renderGenderPicker = () => {
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Gender</Text>
        <View style={styles.pickerContainer}>
          {GENDER_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.pickerOption,
                formData.gender === option && styles.pickerOptionSelected,
              ]}
              onPress={() => updateField('gender', option)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  formData.gender === option && styles.pickerOptionTextSelected,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderAgeGroupPicker = () => {
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          Age Group<Text style={styles.required}> *</Text>
        </Text>
        <View style={styles.pickerContainer}>
          {AGE_GROUPS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.pickerOption,
                formData.age_group === option && styles.pickerOptionSelected,
              ]}
              onPress={() => updateField('age_group', option)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  formData.age_group === option && styles.pickerOptionTextSelected,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.age_group && (
          <Text style={styles.errorText}>{errors.age_group}</Text>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title={isEditMode ? 'Edit Kid' : 'Add New Kid'}
        leftIcon="←"
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          {renderInput('Name', 'name', 'Enter kid\'s full name', {
            required: true,
            autoCapitalize: 'words',
          })}

          {renderInput('Age', 'age', 'Enter age (4-20)', {
            required: true,
            keyboardType: 'numeric',
            maxLength: 2,
          })}

          {renderGenderPicker()}

          {renderInput(
            'Area of Residence',
            'area_of_residence',
            'Enter area/neighborhood (optional)',
            { autoCapitalize: 'words' }
          )}

          {renderAgeGroupPicker()}

          {formData.age_group && (
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>
                Age group automatically calculated based on age
              </Text>
            </View>
          )}

          {/* Sponsorship Type - Admin Only */}
          {isAdmin ? (
            <Dropdown
              label="Sponsorship Type"
              value={formData.sponsorshipType}
              options={SPONSORSHIP_TYPES}
              onSelect={(value) => updateField('sponsorshipType', value)}
              placeholder="Select sponsorship type"
              required
              adminOnly
              error={errors.sponsorshipType}
            />
          ) : (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Sponsorship Type</Text>
              <View style={styles.readOnlyContainer}>
                <Text style={styles.readOnlyText}>
                  {SPONSORSHIP_TYPES.find(t => t.value === formData.sponsorshipType)?.label || 'Not set'}
                </Text>
              </View>
            </View>
          )}

          {/* Program Type - Admin Only */}
          {isAdmin ? (
            <Dropdown
              label="Program Type"
              value={formData.programType}
              options={PROGRAM_TYPES}
              onSelect={(value) => updateField('programType', value)}
              placeholder="Select program type"
              required
              adminOnly
              error={errors.programType}
            />
          ) : (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Program Type</Text>
              <View style={styles.readOnlyContainer}>
                <Text style={styles.readOnlyText}>
                  {PROGRAM_TYPES.find(t => t.value === formData.programType)?.label || 'Not set'}
                </Text>
              </View>
            </View>
          )}

          {/* Info box for SC kids */}
          {formData.sponsorshipType === 'SC' && isAdmin && (
            <View style={[styles.infoBox, { backgroundColor: COLORS.secondary + '20' }]}>
              <Text style={styles.infoIcon}>⭐</Text>
              <Text style={[styles.infoText, { color: COLORS.secondary }]}>
                Scholarship kids are expected to attend all training sessions
              </Text>
            </View>
          )}

          {/* Program Type "Other" - Text Input */}
          {formData.programType === 'Other' && isAdmin && (
            renderInput(
              'Specify Program Type',
              'programTypeOther',
              'Enter custom program type',
              { required: true, autoCapitalize: 'words' }
            )
          )}

           {/* Trial Notes - Optional */}
          {formData.programType === 'Trial' && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Trial Notes (Optional)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { minHeight: 80, textAlignVertical: 'top' },
                  errors.trialNotes && styles.inputError,
                ]}
                placeholder="Add notes about this trial..."
                placeholderTextColor={COLORS.textSecondary}
                value={formData.trialNotes}
                onChangeText={(value) => updateField('trialNotes', value)}
                multiline
                numberOfLines={4}
              />
              {errors.trialNotes && (
                <Text style={styles.errorText}>{errors.trialNotes}</Text>
              )}
            </View>
          )}

          {/* Info box for program type */}
          {formData.programType && isAdmin && (
            <View style={[styles.infoBox, { backgroundColor: COLORS.warning + '20' }]}>
              <Text style={styles.infoIcon}>📅</Text>
              <Text style={[styles.infoText, { color: COLORS.warning }]}>
                {formData.programType === 'ELT' && 'Elite: Sun, Mon, Wed, Fri, Sat (5 sessions/week)'}
                {formData.programType === 'WW' && 'Weekend: Saturday & Sunday only (2 sessions/week)'}
                {formData.programType === 'HP' && 'Holiday Program: Attends during school holidays'}
                {formData.programType === 'TS' && 'Team Support: Supports team activities'}
                {formData.programType === 'Trial' && 'Trial: Kid is on trial period'}
                {formData.programType === 'Other' && 'Custom program type'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.7}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : isEditMode ? 'Update' : 'Add Kid'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  form: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  required: {
    color: COLORS.error,
  },
  adminBadge: {
    fontSize: 11,
    color: COLORS.warning,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pickerOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pickerOptionText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  pickerOptionTextSelected: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  readOnlyContainer: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
  },
  readOnlyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.info + '20',
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
    color: COLORS.info,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.suspended,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },

});

export default AddEditKidScreen;