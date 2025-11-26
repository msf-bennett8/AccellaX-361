// src/screens/Auth/RegistrationScreen.js
// User registration screen for Assessment App

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, APP_NAME, USER_ROLES } from '../../utils/constants';
import { registerUser } from '../../utils/auth';
import { initDatabase } from '../../database/db';

const RegistrationScreen = ({ navigation, onAuthComplete }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const updateFormData = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Name must be at least 3 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Username validation (optional but if provided, must be valid)
    if (formData.username && formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username && !/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Phone validation (optional but if provided, must be valid)
    if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      console.log('🔐 Starting registration process...');

      // Initialize database first
      await initDatabase();
      console.log('✅ Database initialized');

      // Register user
      const result = await registerUser({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        username: formData.username.trim() || '',
        phone: formData.phone.trim() || '',
        password: formData.password,
        role: USER_ROLES.COACH, // Default role for assessment app
        authMethod: 'accellax',
      });

      if (result.success) {
        console.log('✅ Registration successful:', result.userProfile.fullName);
        console.log('User ID:', result.userId);
        console.log('Offline mode:', result.offlineMode || false);

        // Mark onboarding as complete
        await AsyncStorage.setItem('onboardingComplete', 'true');
        console.log('✅ Onboarding marked complete');

        // Trigger sync in background if online
        if (!result.offlineMode) {
          (async () => {
            try {
              console.log('🔄 Triggering initial sync after registration...');
              const { performFullSync } = await import('../../database/sync');
              const syncResult = await performFullSync(result.userId);
              
              if (syncResult.success) {
                console.log('✅ Initial sync completed:', syncResult.results);
              } else {
                console.warn('⚠️ Initial sync failed:', syncResult.error);
              }
            } catch (syncError) {
              console.error('❌ Sync error:', syncError);
            }
          })();
        }

        // Navigate immediately
        console.log('🚀 Calling onAuthComplete to trigger navigation...');
        if (onAuthComplete) {
          await onAuthComplete();
        }

        // Show welcome message after navigation starts
        setTimeout(() => {
          Alert.alert(
            'Welcome!',
            `Welcome to ${APP_NAME}, ${result.userProfile.fullName || 'there'}! ${
              result.offlineMode 
                ? 'Your account was created in offline mode. It will sync when you connect to the internet.' 
                : 'Your account has been created and synced.'
            }`,
            [{ text: 'Get Started' }]
          );
        }, 500);
      } else {
        console.error('❌ Registration failed:', result.error);
        setErrors({ general: result.error || 'Registration failed. Please try again.' });
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      setErrors({ 
        general: error.message || 'An unexpected error occurred. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleSignIn = () => {
    navigation.navigate('Login');
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>⚽</Text>
            </View>
          </View>
          
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join {APP_NAME} today</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* General Error */}
          {errors.general && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {errors.general}</Text>
            </View>
          )}

          {/* Full Name Input */}
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
              autoCorrect={false}
              editable={!isLoading}
            />
            {errors.fullName && (
              <Text style={styles.inputErrorText}>{errors.fullName}</Text>
            )}
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Email Address <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="your.email@example.com"
              placeholderTextColor={COLORS.textSecondary}
              value={formData.email}
              onChangeText={(text) => updateFormData('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            {errors.email && (
              <Text style={styles.inputErrorText}>{errors.email}</Text>
            )}
          </View>

          {/* Username Input (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Username <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.username && styles.inputError]}
              placeholder="coach_john"
              placeholderTextColor={COLORS.textSecondary}
              value={formData.username}
              onChangeText={(text) => updateFormData('username', text)}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            {errors.username && (
              <Text style={styles.inputErrorText}>{errors.username}</Text>
            )}
          </View>

          {/* Phone Input (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Phone Number <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              placeholder="+1 234 567 8900"
              placeholderTextColor={COLORS.textSecondary}
              value={formData.phone}
              onChangeText={(text) => updateFormData('phone', text)}
              keyboardType="phone-pad"
              autoCorrect={false}
              editable={!isLoading}
            />
            {errors.phone && (
              <Text style={styles.inputErrorText}>{errors.phone}</Text>
            )}
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Password <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  errors.password && styles.inputError,
                ]}
                placeholder="At least 8 characters"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.password}
                onChangeText={(text) => updateFormData('password', text)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.inputErrorText}>{errors.password}</Text>
            )}
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Confirm Password <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  errors.confirmPassword && styles.inputError,
                ]}
                placeholder="Re-enter your password"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.confirmPassword}
                onChangeText={(text) => updateFormData('confirmPassword', text)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                activeOpacity={0.7}
              >
                <Text style={styles.eyeIcon}>
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.inputErrorText}>{errors.confirmPassword}</Text>
            )}
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Password must contain:</Text>
            <View style={styles.requirementItem}>
              <Text style={styles.requirementBullet}>•</Text>
              <Text style={styles.requirementText}>At least 8 characters</Text>
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.white} />
                <Text style={styles.loadingText}>Creating Account...</Text>
              </View>
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Terms and Privacy */}
          <Text style={styles.termsText}>
            By creating an account, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign In Link */}
          <View style={styles.signinContainer}>
            <Text style={styles.signinText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleSignIn} activeOpacity={0.7}>
              <Text style={styles.signinLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 35,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.primaryLight,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
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
  optional: {
    color: COLORS.textSecondary,
    fontWeight: 'normal',
    fontSize: 12,
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
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 8,
  },
  eyeIcon: {
    fontSize: 20,
  },
  requirementsContainer: {
    backgroundColor: COLORS.backgroundDark,
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementBullet: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  requirementText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 16,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  signinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signinText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  signinLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default RegistrationScreen;