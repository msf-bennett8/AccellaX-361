// src/screens/Auth/RegistrationScreen.js
// User registration screen for Assessment App

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { COLORS, APP_NAME, USER_ROLES } from '../../utils/constants';
import { registerUser } from '../../utils/auth';
import { initDatabase } from '../../database/db';
import LoadingSpinner from '../../components/common/LoadingSpinner';

import LegalDocumentBottomSheet from '../../components/modals/LegalDocumentBottomSheet';
import {
  recordLegalAcceptance,
  saveLegalAcceptanceToDatabase,
} from '../../utils/legalTracker';
import { signUpWithGoogle, configureGoogleSignIn } from '../../services/googleOAuthService';
import { signUpWithStrava } from '../../services/stravaOAuthService';

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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [termsRead, setTermsRead] = useState(false);
  const [privacyRead, setPrivacyRead] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const emailInputRef = useRef(null);

  // Configure Google Sign-In on mount
  useEffect(() => {
    configureGoogleSignIn();
  }, []);

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

    // Terms agreement validation (must have READ both documents)
    if (!termsRead || !privacyRead) {
      newErrors.terms = 'You must read both Terms of Service and Privacy Policy';
    }

    if (!agreedToTerms) {
      newErrors.terms = 'You must accept both Terms of Service and Privacy Policy';
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
      
      // ✅ FIX: Ensure Firebase is initialized
      try {
        const { auth } = await import('../../config/firebase');
        if (auth) {
          console.log('✅ Firebase auth ready for registration');
        } else {
          console.warn('⚠️ Firebase auth not available, will register in offline mode');
        }
      } catch (authError) {
        console.warn('⚠️ Firebase auth initialization warning:', authError.message);
      }

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

        // Record legal acceptance
        await recordLegalAcceptance(result.userId, formData.email.trim().toLowerCase());
        await saveLegalAcceptanceToDatabase(result.userId, {
          termsVersion: '1.0.0',
          privacyVersion: '1.0.0',
          acceptedAt: new Date().toISOString(),
        });

        // Save preferences
        if (rememberMe) {
          await AsyncStorage.setItem('rememberMe', 'true');
          await AsyncStorage.setItem('rememberedEmail', formData.email.trim().toLowerCase());
        }
        if (emailUpdates) {
          await AsyncStorage.setItem('emailUpdates', 'true');
        }

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
          setUserName(result.userProfile.fullName || 'there');
          setWelcomeMessage(
            result.offlineMode 
              ? 'Your account was created in offline mode. It will sync when you connect to the internet.' 
              : 'Your account has been created and synced.'
          );
          setShowWelcomeModal(true);
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

  const handleGoogleSignUp = async () => {
    try {
      setIsLoading(true);
      
      const state = await NetInfo.fetch();
      
      if (!state.isConnected) {
        setShowOfflineModal(true);
        setIsLoading(false);
        return;
      }

      console.log('🔐 Starting Google sign-up...');

      // Initialize database
      await initDatabase();
      
      // Sign up with Google (registration only - creates new account)
      const result = await signUpWithGoogle();

      if (result.success) {
        console.log('✅ Google sign-up successful:', result.userProfile.fullName);
        
        // Mark onboarding as complete
        await AsyncStorage.setItem('onboardingComplete', 'true');
        
        // Save user profile locally
        const { saveUserProfile } = await import('../../utils/auth');
        await saveUserProfile(result.userProfile);
        
        // Create user in local database
        try {
          const { createUser } = await import('../../database/db');
          await createUser({
            id: result.userId,
            fullName: result.userProfile.fullName,
            email: result.userProfile.email,
            username: result.userProfile.username || '',
            phone: result.userProfile.phone || '',
            passwordHash: null,
            authMethod: 'google',
            role: result.userProfile.role || 'coach',
            avatarBase64: result.userProfile.avatarBase64 || null,
            isOfflineAccount: false,
          });
          console.log('✅ User synced to local database');
        } catch (dbError) {
          console.warn('⚠️ Failed to sync user to local DB:', dbError);
        }
        
        // Record legal acceptance (auto-accepted for OAuth)
        await recordLegalAcceptance(result.userId, result.userProfile.email);
        await saveLegalAcceptanceToDatabase(result.userId, {
          termsVersion: '1.0.0',
          privacyVersion: '1.0.0',
          acceptedAt: new Date().toISOString(),
          acceptedVia: 'google_oauth',
        });
        
        // Trigger sync in background
        (async () => {
          try {
            console.log('🔄 Triggering initial sync...');
            const { performFullSync } = await import('../../database/sync');
            await performFullSync(result.userId);
          } catch (syncError) {
            console.error('❌ Sync error:', syncError);
          }
        })();
        
        // Invalidate cache
        const { invalidateCache } = await import('../../services/assessmentService');
        invalidateCache();
        
        // Navigate
        if (onAuthComplete) {
          await onAuthComplete();
        }
        
        // Show welcome message with terms info
        setTimeout(() => {
          setUserName(result.userProfile.fullName || 'there');
          setWelcomeMessage('Your account has been created with Google! By using Google Sign-In, you agree to our Terms of Service and Privacy Policy.');
          setShowWelcomeModal(true);
        }, 500);
        
      } else if (result.cancelled) {
        console.log('ℹ️ Google sign-up cancelled by user');
      } else if (result.accountExists) {
        // Account already exists - show message
        setErrors({
          general: 'An account with this Google email already exists. Please sign in instead.'
        });
        setTimeout(() => {
          navigation.navigate('Login');
        }, 2000);
      } else if (result.requiresBackend) {
        // Mobile OAuth requires backend
        setErrors({ 
          general: 'Please use the web version for Google sign-up, or we\'ll implement a backend server soon.' 
        });
      } else {
        console.error('❌ Google sign-up failed:', result.error);
        setErrors({ general: result.error || 'Failed to sign up with Google' });
      }
    } catch (error) {
      console.error('❌ Google sign-up error:', error);
      setErrors({ 
        general: error.message || 'An unexpected error occurred with Google sign-up' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStravaSignUp = async () => {
    try {
      setIsLoading(true);
      
      const state = await NetInfo.fetch();
      
      if (!state.isConnected) {
        setShowOfflineModal(true);
        setIsLoading(false);
        return;
      }

      console.log('🔐 Starting Strava sign-up...');

      // Initialize database
      await initDatabase();
      
      // Sign up with Strava (registration only - creates new account)
      const result = await signUpWithStrava();

      if (result.success) {
        console.log('✅ Strava sign-up successful:', result.userProfile.fullName);
        
        // Mark onboarding as complete
        await AsyncStorage.setItem('onboardingComplete', 'true');
        
        // Save user profile locally
        const { saveUserProfile } = await import('../../utils/auth');
        await saveUserProfile(result.userProfile);
        
        // Create user in local database
        try {
          const { createUser } = await import('../../database/db');
          await createUser({
            id: result.userId,
            fullName: result.userProfile.fullName,
            email: result.userProfile.email,
            username: result.userProfile.username || '',
            phone: result.userProfile.phone || '',
            passwordHash: null,
            authMethod: 'strava',
            role: result.userProfile.role || 'coach',
            avatarBase64: result.userProfile.avatarBase64 || null,
            isOfflineAccount: false,
          });
          console.log('✅ User synced to local database');
        } catch (dbError) {
          console.warn('⚠️ Failed to sync user to local DB:', dbError);
        }
        
        // Record legal acceptance (auto-accepted for OAuth)
        await recordLegalAcceptance(result.userId, result.userProfile.email);
        await saveLegalAcceptanceToDatabase(result.userId, {
          termsVersion: '1.0.0',
          privacyVersion: '1.0.0',
          acceptedAt: new Date().toISOString(),
          acceptedVia: 'strava_oauth',
        });
        
        // Trigger sync in background
        (async () => {
          try {
            console.log('🔄 Triggering initial sync...');
            const { performFullSync } = await import('../../database/sync');
            await performFullSync(result.userId);
          } catch (syncError) {
            console.error('❌ Sync error:', syncError);
          }
        })();
        
        // Invalidate cache
        const { invalidateCache } = await import('../../services/assessmentService');
        invalidateCache();
        
        // Navigate
        if (onAuthComplete) {
          await onAuthComplete();
        }
        
        // Show welcome message with terms info
        setTimeout(() => {
          setUserName(result.userProfile.fullName || 'there');
          setWelcomeMessage('Your account has been created with Strava! By using Strava authorization, you agree to our Terms of Service and Privacy Policy.');
          setShowWelcomeModal(true);
        }, 500);
        
      } else if (result.cancelled) {
        console.log('ℹ️ Strava authorization cancelled by user');
      } else if (result.accountExists) {
        // Account already exists - show message
        setErrors({
          general: 'An account with this Strava profile already exists. Please sign in instead.'
        });
        setTimeout(() => {
          navigation.navigate('Login');
        }, 2000);
      } else {
        console.error('❌ Strava sign-up failed:', result.error);
        setErrors({ general: result.error || 'Failed to sign up with Strava' });
      }
    } catch (error) {
      console.error('❌ Strava sign-up error:', error);
      setErrors({ 
        general: error.message || 'An unexpected error occurred with Strava sign-up' 
      });
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
        keyboardDismissMode="on-drag"
        nestedScrollEnabled={false}
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
              <Image 
                source={require('../../../assets/icon.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
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
              ref={emailInputRef}
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="your.email@example.com"
              placeholderTextColor={COLORS.textSecondary}
              value={formData.email}
              onChangeText={(text) => updateFormData('email', text)}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={true}
              editable={!isLoading}
              textContentType="emailAddress"
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
                <Ionicons 
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={22} 
                  color={COLORS.textSecondary} 
                />
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
                <Ionicons 
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={22} 
                  color={COLORS.textSecondary} 
                />
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

          {/* Read Terms and Privacy Button */}
          <TouchableOpacity
            style={[
              styles.readTermsButton,
              (termsRead && privacyRead) && { borderColor: COLORS.success }
            ]}
            onPress={() => setShowLegalModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.readTermsContent}>
              <Ionicons name="document-text" size={24} color={COLORS.primary} />
              <View style={styles.readTermsTextContainer}>
                <Text style={styles.readTermsTitle}>Read Legal Documents</Text>
                <Text style={styles.readTermsSubtitle}>
                  {termsRead && privacyRead
                    ? '✓ Both documents read'
                    : 'Tap to read Terms & Privacy Policy'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </View>
          </TouchableOpacity>

          {/* Agreement Checkbox (only appears after reading) */}
          {termsRead && privacyRead && (
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => {
                setAgreedToTerms(!agreedToTerms);
                if (errors.terms) {
                  setErrors({ ...errors, terms: null });
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                {agreedToTerms && (
                  <Ionicons name="checkmark" size={18} color={COLORS.white} />
                )}
              </View>
              <Text style={styles.checkboxText}>
                I agree to the Terms of Service and Privacy Policy
              </Text>
            </TouchableOpacity>
          )}

          {/* Remember Me Checkbox */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && (
                <Ionicons name="checkmark" size={18} color={COLORS.white} />
              )}
            </View>
            <Text style={styles.checkboxText}>Remember me on this device</Text>
          </TouchableOpacity>

          {/* Email Updates Checkbox */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setEmailUpdates(!emailUpdates)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, emailUpdates && styles.checkboxChecked]}>
              {emailUpdates && (
                <Ionicons name="checkmark" size={18} color={COLORS.white} />
              )}
            </View>
            <Text style={styles.checkboxText}>Email me about important updates</Text>
          </TouchableOpacity>

          {errors.terms && (
            <Text style={styles.termsErrorText}>{errors.terms}</Text>
          )}

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <LoadingSpinner size="small" color={COLORS.white} />
                <Text style={styles.loadingText}>Creating Account...</Text>
              </View>
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Social Registration Buttons */}
          <View style={styles.socialLoginContainer}>
            {/* Google Sign Up Button */}
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleSignUp}
              activeOpacity={0.8}
            >
              <Image
                source={require('../../assets/logos/google-logo.png')}
                style={styles.socialLogo}
                resizeMode="contain"
                onError={() => console.log('Google logo failed to load')}
              />
              <Text style={styles.socialButtonText}>Sign up with Google</Text>
            </TouchableOpacity>

            {/* Strava Sign Up Button */}
            <TouchableOpacity
              style={[styles.socialButton, styles.stravaButton]}
              onPress={handleStravaSignUp}
              activeOpacity={0.8}
            >
              <Image
                source={require('../../assets/logos/strava-logo.png')}
                style={styles.socialLogo}
                resizeMode="contain"
                onError={() => console.log('Strava logo failed to load')}
              />
              <Text style={[styles.socialButtonText, styles.stravaButtonText]}>
                Sign up with Strava
              </Text>
            </TouchableOpacity>
          </View>

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
        {/* Legal Document Bottom Sheet */}
        <LegalDocumentBottomSheet
          visible={showLegalModal}
          onClose={() => setShowLegalModal(false)}
          onAcceptBoth={() => {
            setAgreedToTerms(true);
            setShowLegalModal(false);
          }}
          termsRead={termsRead}
          privacyRead={privacyRead}
          setTermsRead={setTermsRead}
          setPrivacyRead={setPrivacyRead}
        />
      </ScrollView>

      {/* Offline Modal */}
      <Modal visible={showOfflineModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.offlineModalContent}>
            <Ionicons name="cloud-offline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.offlineModalTitle}>You're Offline</Text>
            <Text style={styles.offlineModalMessage}>
              Social registration requires an internet connection. Please use email to create your account locally, and it will sync when you're back online.
            </Text>
            <TouchableOpacity
              style={styles.offlineModalButton}
              onPress={() => setShowOfflineModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.offlineModalButtonText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Welcome Modal */}
      <Modal visible={showWelcomeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.welcomeIconContainer}>
                <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
              </View>
            </View>
            <Text style={styles.modalTitle}>Welcome! 🎉</Text>
            <Text style={styles.modalSubtitle}>
              Welcome to {APP_NAME}, {userName}!
            </Text>
            <Text style={styles.modalMessage}>{welcomeMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowWelcomeModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    maxHeight: '100vh',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
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
  logoImage: {
    width: 50,
    height: 50,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
  },
  checkboxLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  termsErrorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: -16,
    marginBottom: 16,
    marginLeft: 4,
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
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  readTermsButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
readTermsContent: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 16,
},
readTermsTextContainer: {
  flex: 1,
  marginLeft: 12,
},
readTermsTitle: {
  fontSize: 15,
  fontWeight: '600',
  color: COLORS.text,
  marginBottom: 4,
},
readTermsSubtitle: {
  fontSize: 12,
  color: COLORS.textSecondary,
},
  socialLoginContainer: {
    marginBottom: 24,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stravaButton: {
    borderColor: '#FC4C02',
  },
  socialLogo: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  stravaButtonText: {
    color: '#FC4C02',
  },
  offlineModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  offlineModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  offlineModalMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  offlineModalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  offlineModalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});

export default RegistrationScreen;