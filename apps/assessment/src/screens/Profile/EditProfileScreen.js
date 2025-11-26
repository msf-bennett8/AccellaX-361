// Location: /apps/assessment/src/screens/Profile/EditProfileScreen.js
// Edit user profile screen

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '../../utils/constants';
import { updateUserProfile } from '../../utils/auth';

export default function EditProfileScreen({ navigation, route }) {
  const { profile } = route.params;

  const [formData, setFormData] = useState({
    fullName: profile.fullName || '',
    username: profile.username || '',
    phone: profile.phone || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const updateFormData = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Name must be at least 3 characters';
    }

    if (formData.username && formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await updateUserProfile({
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
        phone: formData.phone.trim(),
      });

      if (result.success) {
        Alert.alert(
          'Success',
          'Your profile has been updated!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        setErrors({ general: result.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* General Error */}
        {errors.general && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {errors.general}</Text>
          </View>
        )}

        {/* Full Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Full Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.fullName && styles.inputError]}
            placeholder="John Doe"
            placeholderTextColor={COLORS.textSecondary}
            value={formData.fullName}
            onChangeText={(text) => updateFormData('fullName', text)}
            autoCapitalize="words"
            editable={!isLoading}
          />
          {errors.fullName && (
            <Text style={styles.inputErrorText}>{errors.fullName}</Text>
          )}
        </View>

        {/* Username */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={[styles.input, errors.username && styles.inputError]}
            placeholder="coach_john"
            placeholderTextColor={COLORS.textSecondary}
            value={formData.username}
            onChangeText={(text) => updateFormData('username', text)}
            autoCapitalize="none"
            editable={!isLoading}
          />
          {errors.username && (
            <Text style={styles.inputErrorText}>{errors.username}</Text>
          )}
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            placeholder="+1 234 567 8900"
            placeholderTextColor={COLORS.textSecondary}
            value={formData.phone}
            onChangeText={(text) => updateFormData('phone', text)}
            keyboardType="phone-pad"
            editable={!isLoading}
          />
          {errors.phone && (
            <Text style={styles.inputErrorText}>{errors.phone}</Text>
          )}
        </View>

        {/* Read-only fields */}
        <View style={styles.readOnlySection}>
          <Text style={styles.readOnlyTitle}>Account Information</Text>
          
          <View style={styles.readOnlyRow}>
            <Text style={styles.readOnlyLabel}>Email</Text>
            <Text style={styles.readOnlyValue}>{profile.email}</Text>
          </View>

          <View style={styles.readOnlyRow}>
            <Text style={styles.readOnlyLabel}>Role</Text>
            <Text style={styles.readOnlyValue}>{profile.role}</Text>
          </View>

          <Text style={styles.readOnlyNote}>
            Email and role cannot be changed
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 24,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  required: {
    color: COLORS.error,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 2,
  },
  inputErrorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  readOnlySection: {
    backgroundColor: COLORS.backgroundDark,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  readOnlyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  readOnlyLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  readOnlyValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  readOnlyNote: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 8,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  cancelButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});