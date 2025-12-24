// src/screens/Auth/LoginScreen.js
// User login screen with email and password

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
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { COLORS, APP_NAME } from '../../utils/constants';
import { loginUser } from '../../utils/auth';
import { initDatabase } from '../../database/db';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmationModal from '../../components/modals/ConfirmationModal';

const LoginScreen = ({ navigation, onAuthComplete }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const passwordInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Load remembered email on mount
  useEffect(() => {
    loadRememberedCredentials();
  }, []);

  const loadRememberedCredentials = async () => {
    try {
      const remembered = await AsyncStorage.getItem('rememberMe');
      const rememberedEmail = await AsyncStorage.getItem('rememberedEmail');
      
      if (remembered === 'true' && rememberedEmail) {
        setEmail(rememberedEmail);
        setRememberMe(true);
        console.log('✅ Loaded remembered email:', rememberedEmail);
        
        // Focus password field after a short delay
        setTimeout(() => {
          if (passwordInputRef.current) {
            passwordInputRef.current.focus();
          }
        }, 300);
      }
    } catch (error) {
      console.error('Error loading remembered credentials:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email, username, or phone is required';
    }
    // Removed strict email validation - accept email, username, or phone

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      console.log('🔐 Starting login process...');

      // Initialize database first
      await initDatabase();
      console.log('✅ Database initialized');
      
      // ✅ FIX: Ensure Firebase is initialized
      try {
        const { auth } = await import('../../config/firebase');
        if (auth) {
          console.log('✅ Firebase auth ready');
        } else {
          console.warn('⚠️ Firebase auth not available, will use offline mode');
        }
      } catch (authError) {
        console.warn('⚠️ Firebase auth initialization warning:', authError.message);
      }

      // Attempt login
      const result = await loginUser(email.trim().toLowerCase(), password);

      if (result.success) {
        console.log('✅ Login successful:', result.userProfile.fullName);
        console.log('User ID:', result.userId);
        console.log('Migrated:', result.migrated || false);
        
        // Save remember me preference
        if (rememberMe) {
          await AsyncStorage.setItem('rememberMe', 'true');
          await AsyncStorage.setItem('rememberedEmail', email.trim().toLowerCase());
          console.log('✅ Remember me preference saved');
        } else {
          await AsyncStorage.removeItem('rememberMe');
          await AsyncStorage.removeItem('rememberedEmail');
        }
        
        // Trigger sync in background
        const syncPromise = (async () => {
          try {
            console.log('🔄 Triggering initial sync after login...');
            const { performFullSync } = await import('../../database/sync');
            const syncResult = await performFullSync(result.userId);
            
            if (syncResult.success) {
              console.log('✅ Initial sync completed:', syncResult.results);
            } else {
              console.warn('⚠️ Initial sync failed:', syncResult.error);
            }
          } catch (syncError) {
            console.error('❌ Sync error:', syncError);
            // Don't block navigation if sync fails
          }
        })();

        // ✅ CRITICAL: Invalidate assessment cache before navigation
        console.log('🔄 Invalidating assessment cache after login...');
        const { invalidateCache } = await import('../../services/assessmentService');
        invalidateCache();
        
        // Navigate immediately (don't wait for sync)
        console.log('🚀 Calling onAuthComplete to trigger navigation...');
        if (onAuthComplete) {
          await onAuthComplete();
        }
        
        // Show welcome message after navigation starts
        setTimeout(() => {
          setModalConfig({
            visible: true,
            title: 'Welcome Back!',
            message: `Hello ${result.userProfile.fullName || 'there'}! ${
              result.migrated 
                ? 'Your offline account has been successfully synced to the cloud.' 
                : result.warning || 'Good to see you again!'
            }`,
            type: 'success',
            onConfirm: () => setModalConfig({ ...modalConfig, visible: false }),
          });
        }, 500);
      } else {
        console.error('❌ Login failed:', result.error);
        setErrors({ general: result.error || 'Invalid email or password' });
      }
    } catch (error) {
      console.error('❌ Login error:', error);
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

  const handleForgotPassword = () => {
    setModalConfig({
      visible: true,
      title: 'Reset Password',
      message: 'Password reset functionality will be available soon. Please contact support if you need assistance.',
      type: 'info',
      onConfirm: () => setModalConfig({ ...modalConfig, visible: false }),
    });
  };

  const handleCreateAccount = () => {
    navigation.navigate('Register');
  };

  const handleGoogleLogin = async () => {
    // TODO: Implement Google OAuth authentication
    try {
      const state = await NetInfo.fetch();
      
      if (!state.isConnected) {
        setShowOfflineModal(true);
        return;
      }

      // TODO: Implement Google Sign-In
      // 1. Initialize Google Sign-In
      // 2. Get Google credentials
      // 3. Sign in with Firebase Auth using Google credentials
      // 4. Create/update user profile in local database
      // 5. Trigger sync
      
      console.log('Google login will be implemented here');
      setModalConfig({
        visible: true,
        title: 'Coming Soon',
        message: 'Google authentication will be available in the next update.',
        type: 'info',
        onConfirm: () => setModalConfig({ ...modalConfig, visible: false }),
      });
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  const handleStravaLogin = async () => {
    // TODO: Implement Strava OAuth authentication
    try {
      const state = await NetInfo.fetch();
      
      if (!state.isConnected) {
        setShowOfflineModal(true);
        return;
      }

      // TODO: Implement Strava OAuth
      // 1. Open Strava OAuth authorization URL
      // 2. Handle callback with authorization code
      // 3. Exchange code for access token
      // 4. Get athlete data from Strava API
      // 5. Create/update user profile in local database
      // 6. Trigger sync
      
      console.log('Strava login will be implemented here');
      setModalConfig({
        visible: true,
        title: 'Coming Soon',
        message: 'Strava authentication will be available in the next update.',
        type: 'info',
        onConfirm: () => setModalConfig({ ...modalConfig, visible: false }),
      });
    } catch (error) {
      console.error('Strava login error:', error);
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
          
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>Welcome back to {APP_NAME}</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* General Error */}
          {errors.general && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {errors.general}</Text>
            </View>
          )}

          {/* Email/Username Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email, Username, or Phone</Text>
            <TextInput
              ref={emailInputRef}
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="email@example.com or username"
              placeholderTextColor={COLORS.textSecondary}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) {
                  setErrors({ ...errors, email: null });
                }
              }}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={!rememberMe}
              editable={!isLoading}
              textContentType="username"
            />
            {errors.email && (
              <Text style={styles.inputErrorText}>{errors.email}</Text>
            )}
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                ref={passwordInputRef}
                style={[
                  styles.input,
                  styles.passwordInput,
                  errors.password && styles.inputError,
                ]}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.textSecondary}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors({ ...errors, password: null });
                  }
                }}
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

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

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
            <Text style={styles.checkboxText}>
              Remember me on this device
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <LoadingSpinner size="small" color={COLORS.white} />
                <Text style={styles.loadingText}>Signing In...</Text>
              </View>
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Offline Mode Info */}
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} style={styles.infoIcon} />
            <Text style={styles.infoText}>
              Works offline. Your data will sync automatically when online.
            </Text>
          </View>

          {/* Social Login Buttons */}
          <View style={styles.socialLoginContainer}>
            {/* Google Login Button */}
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleLogin}
              activeOpacity={0.8}
            >
              <Image
                source={require('../../assets/logos/google-logo.png')}
                style={styles.socialLogo}
                resizeMode="contain"
                onError={() => console.log('Google logo failed to load')}
              />
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Strava Login Button */}
            <TouchableOpacity
              style={[styles.socialButton, styles.stravaButton]}
              onPress={handleStravaLogin}
              activeOpacity={0.8}
            >
              <Image
                source={require('../../assets/logos/strava-logo.png')}
                style={styles.socialLogo}
                resizeMode="contain"
                onError={() => console.log('Strava logo failed to load')}
              />
              <Text style={[styles.socialButtonText, styles.stravaButtonText]}>
                Continue with Strava
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Create Account Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={handleCreateAccount}
              activeOpacity={0.7}
            >
              <Text style={styles.signupLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ConfirmationModal
          visible={modalConfig.visible}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
          onConfirm={modalConfig.onConfirm}
        />
      </ScrollView>

      {/* Offline Modal */}
      <Modal visible={showOfflineModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.offlineModalContent}>
            <Ionicons name="cloud-offline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.offlineModalTitle}>You're Offline</Text>
            <Text style={styles.offlineModalMessage}>
              Social login requires an internet connection. Please use email, username, or phone to sign in locally.
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
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
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
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
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundDark,
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
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
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  signupLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: 'bold',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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

export default LoginScreen;