//src/screens/Onboarding/OnboardingScreen.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { insertKid } from '../../database/db';
import { registerUser, registerWithGoogle } from '../../utils/auth';
import { createUser } from '../../database/db';

const OnboardingScreen = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [academyName, setAcademyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('coach'); // Default to coach
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [authMethod, setAuthMethod] = useState(null);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!academyName.trim()) {
      newErrors.academyName = 'Academy name is required';
    } else if (academyName.trim().length < 3) {
      newErrors.academyName = 'Name must be at least 3 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (phone.trim().length < 10) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!acceptTerms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      setStep(1.5); // Go to role selection
    } else if (step === 1.5) {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      setStep(3);
    } else if (step === 3 && validateStep3()) {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      setStep(4);
    }
  };

  const handleManualContinue = () => {
    if (validateStep2()) {
      setAuthMethod('manual');
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      setStep(3);
    }
  };

  const handleBack = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(-50);
    setStep(step - 1);
    setErrors({});
  };

  const handleGoogleAuth = () => {
    setAuthMethod('google');
    // In production, this would use real Google Sign-In
    // For now, using demo data
    setFullName('Demo User');
    setEmail('demo.user@gmail.com');
    setShowGoogleModal(true);
  };

  const handleGoogleModalSubmit = () => {
    const newErrors = {};
    
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (!acceptTerms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }
    
    if (Object.keys(newErrors).length === 0) {
      setShowGoogleModal(false);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      setStep(4);
    } else {
      setErrors(newErrors);
    }
  };

  const handleSubmit = async () => {
    // Prevent double submission
    if (isSubmitting) {
      console.log('⚠️ Already submitting, please wait...');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('📝 Creating user account...');
      
      let result;
      
      if (authMethod === 'google') {
        // Register with Google
        result = await registerWithGoogle({
          fullName: fullName.trim(),
          email: email.trim(),
          username: username.trim(),
          phone: phone.trim(),
          role: role,
        });
      } else {
        // Register with AccellaX (manual)
        result = await registerUser({
          fullName: fullName.trim(),
          email: email.trim(),
          username: username.trim(),
          phone: phone.trim(),
          password: password,
          authMethod: 'accellax',
          role: role,
        });
      }
      
      if (!result.success) {
        setIsSubmitting(false);
        Alert.alert('Registration Failed', result.error);
        return;
      }
      
      console.log('✅ User account created:', result.userId);
      
      // Save user to database
      await createUser({
        id: result.userId,
        fullName: fullName.trim(),
        email: email.trim(),
        username: username.trim(),
        phone: phone.trim(),
        passwordHash: result.userProfile.passwordHash || '',
        authMethod: authMethod === 'google' ? 'google' : 'accellax',
        role: role,
        avatarBase64: null,
        isOfflineAccount: result.userProfile.isOfflineAccount || false,
      });
      
      console.log('✅ User saved to database');
      
      // Save academy name separately
      await AsyncStorage.setItem('academyName', academyName.trim());
      await AsyncStorage.setItem('onboardingDate', new Date().toISOString());
      await AsyncStorage.setItem('onboardingComplete', 'true');
      
      console.log('✅ Onboarding complete - kids will be loaded from academy collection');
      onComplete();
      
    } catch (error) {
      console.error('Error creating account:', error);
      setIsSubmitting(false);
      Alert.alert('Error', 'Failed to create your account. Please try again.');
    }
  };

    const renderProgressDots = () => {
    const steps = [1, 1.5, 2, 3, 4];
    const currentStepIndex = steps.indexOf(step);
    
    return (
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4, 5].map((dot) => (
          <View
            key={dot}
            style={[
              styles.progressDot,
              currentStepIndex >= dot - 1 && styles.progressDotActive,
            ]}
          />
        ))}
      </View>
    );
  };

  const renderStep1 = () => (
    <Animated.View
      style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>⚽</Text>
      </View>
      
      <Text style={styles.stepTitle}>Welcome to AccellaX 361°</Text>
      <Text style={styles.stepSubtitle}>
        Let's set up your soccer academy attendance tracker
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Academy Name</Text>
        <TextInput
          style={[styles.input, errors.academyName && styles.inputError]}
          placeholder="e.g., NextGen Multisport Academy"
          value={academyName}
          onChangeText={(text) => {
            setAcademyName(text);
            if (errors.academyName) {
              setErrors({ ...errors, academyName: null });
            }
          }}
          autoCapitalize="words"
          autoFocus
        />
        {errors.academyName && (
          <Text style={styles.errorText}>{errors.academyName}</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, !academyName.trim() && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={!academyName.trim()}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderStep1_5 = () => (
    <Animated.View
      style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>👤</Text>
      </View>
      
      <Text style={styles.stepTitle}>Select Your Role</Text>
      <Text style={styles.stepSubtitle}>
        Choose your role in the academy
      </Text>

      <View style={styles.roleContainer}>
        {/* Coach Role */}
        <TouchableOpacity
          style={[
            styles.roleCard,
            role === 'coach' && styles.roleCardActive,
          ]}
          onPress={() => setRole('coach')}
          activeOpacity={0.7}
        >
          <Text style={styles.roleIcon}>👨‍🏫</Text>
          <Text style={styles.roleLabel}>Coach</Text>
          <Text style={styles.roleDescription}>
            Manage training sessions and track attendance
          </Text>
          {role === 'coach' && (
            <View style={styles.roleCheckmark}>
              <Text style={styles.roleCheckmarkText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Athlete Role */}
        <TouchableOpacity
          style={[
            styles.roleCard,
            role === 'athlete' && styles.roleCardActive,
          ]}
          onPress={() => setRole('athlete')}
          activeOpacity={0.7}
        >
          <Text style={styles.roleIcon}>⚽</Text>
          <Text style={styles.roleLabel}>Athlete</Text>
          <Text style={styles.roleDescription}>
            View your training schedule and attendance
          </Text>
          {role === 'athlete' && (
            <View style={styles.roleCheckmark}>
              <Text style={styles.roleCheckmarkText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Parent Role */}
        <TouchableOpacity
          style={[
            styles.roleCard,
            role === 'parent' && styles.roleCardActive,
          ]}
          onPress={() => setRole('parent')}
          activeOpacity={0.7}
        >
          <Text style={styles.roleIcon}>👪</Text>
          <Text style={styles.roleLabel}>Parent</Text>
          <Text style={styles.roleDescription}>
            Monitor your child's progress and attendance
          </Text>
          {role === 'parent' && (
            <View style={styles.roleCheckmark}>
              <Text style={styles.roleCheckmarkText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.buttonOutline]}
          onPress={handleBack}
        >
          <Text style={styles.buttonOutlineText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.buttonFlex]}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View
      style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>👤</Text>
      </View>
      
      <Text style={styles.stepTitle}>Create Your Account</Text>
      <Text style={styles.stepSubtitle}>
        Fill in your details or sign in with Google
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={[styles.input, errors.fullName && styles.inputError]}
          placeholder="Enter your full name"
          value={fullName}
          onChangeText={(text) => {
            setFullName(text);
            if (errors.fullName) setErrors({ ...errors, fullName: null });
          }}
          autoCapitalize="words"
        />
        {errors.fullName && (
          <Text style={styles.errorText}>{errors.fullName}</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="your.email@example.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (errors.email) setErrors({ ...errors, email: null });
          }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && (
          <Text style={styles.errorText}>{errors.email}</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={[styles.input, errors.username && styles.inputError]}
          placeholder="Choose a unique username"
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            if (errors.username) setErrors({ ...errors, username: null });
          }}
          autoCapitalize="none"
        />
        {errors.username && (
          <Text style={styles.errorText}>{errors.username}</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={[styles.input, errors.phone && styles.inputError]}
          placeholder="+254 700 000 000"
          value={phone}
          onChangeText={(text) => {
            setPhone(text);
            if (errors.phone) setErrors({ ...errors, phone: null });
          }}
          keyboardType="phone-pad"
        />
        {errors.phone && (
          <Text style={styles.errorText}>{errors.phone}</Text>
        )}
      </View>

      <View style={styles.authOptionsContainer}>
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or sign in with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.authButtonsRow}>
          <TouchableOpacity
            style={styles.authButton}
            onPress={handleGoogleAuth}
          >
            <Text style={styles.authButtonIcon}>🔵</Text>
            <Text style={styles.authButtonText}>Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.authButton, styles.authButtonDisabled]}
            disabled={true}
          >
            <Text style={styles.authButtonIcon}>🦆</Text>
            <Text style={[styles.authButtonText, styles.authButtonTextDisabled]}>
              AccellaX 361°
            </Text>
            <Text style={styles.comingSoonBadge}>Soon</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.buttonOutline]}
          onPress={handleBack}
        >
          <Text style={styles.buttonOutlineText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonFlex,
            (!fullName.trim() || !email.trim() || !username.trim() || !phone.trim()) && styles.buttonDisabled,
          ]}
          onPress={handleManualContinue}
          disabled={!fullName.trim() || !email.trim() || !username.trim() || !phone.trim()}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View
      style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🔒</Text>
      </View>
      
      <Text style={styles.stepTitle}>Secure Your Account</Text>
      <Text style={styles.stepSubtitle}>
        Create a strong password to protect your data
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          placeholder="At least 8 characters"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (errors.password) setErrors({ ...errors, password: null });
          }}
          secureTextEntry
        />
        {errors.password && (
          <Text style={styles.errorText}>{errors.password}</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={[styles.input, errors.confirmPassword && styles.inputError]}
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
          }}
          secureTextEntry
        />
        {errors.confirmPassword && (
          <Text style={styles.errorText}>{errors.confirmPassword}</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => {
          setAcceptTerms(!acceptTerms);
          if (errors.terms) setErrors({ ...errors, terms: null });
        }}
      >
        <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
          {acceptTerms && <Text style={styles.checkboxCheck}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>
          I accept the{' '}
          <Text style={styles.linkText}>Terms and Conditions</Text>
        </Text>
      </TouchableOpacity>
      {errors.terms && (
        <Text style={styles.errorText}>{errors.terms}</Text>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.buttonOutline]}
          onPress={handleBack}
        >
          <Text style={styles.buttonOutlineText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonFlex,
            (!password || !confirmPassword || !acceptTerms) && styles.buttonDisabled,
          ]}
          onPress={handleNext}
          disabled={!password || !confirmPassword || !acceptTerms}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderStep4 = () => (
    <Animated.View
      style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>✅</Text>
      </View>
      
      <Text style={styles.stepTitle}>You're all set!</Text>
      <Text style={styles.stepSubtitle}>
        Review your information before starting
      </Text>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Academy:</Text>
          <Text style={styles.summaryValue}>{academyName}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Coach:</Text>
          <Text style={styles.summaryValue}>{fullName}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Email:</Text>
          <Text style={styles.summaryValue}>{email}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Username:</Text>
          <Text style={styles.summaryValue}>@{username}</Text>
        </View>
        {phone && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phone:</Text>
            <Text style={styles.summaryValue}>{phone}</Text>
          </View>
        )}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Auth Method:</Text>
          <Text style={styles.summaryValue}>
            {authMethod === 'google' ? '🔵 Google' : '🦆 AccellaX'}
          </Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>
          {authMethod === 'google' ? '🔵' : 'ℹ️'}
        </Text>
        <Text style={styles.infoText}>
          {authMethod === 'google' 
            ? 'Your Google account will be linked. Data will sync automatically when online.'
            : 'Your account will be created locally and synced to the cloud when you\'re online.'}
        </Text>
      </View>

      <View style={styles.featuresList}>
        <Text style={styles.featuresTitle}>What you can do:</Text>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>📋</Text>
          <Text style={styles.featureText}>Track attendance offline</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>👥</Text>
          <Text style={styles.featureText}>Manage kids by age groups</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>📊</Text>
          <Text style={styles.featureText}>View attendance history</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>☁️</Text>
          <Text style={styles.featureText}>Auto-sync to cloud backup</Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.buttonOutline]}
          onPress={handleBack}
        >
          <Text style={styles.buttonOutlineText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.button, 
            styles.buttonFlex, 
            styles.buttonSuccess,
            isSubmitting && styles.buttonDisabled
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? 'Creating Account...' : 'Get Started 🚀'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderGoogleModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showGoogleModal}
      onRequestClose={() => setShowGoogleModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Complete Your Profile</Text>
          <Text style={styles.modalSubtitle}>
            Just a few more details to get started
          </Text>

          <View style={styles.modalInfo}>
            <Text style={styles.modalInfoLabel}>Signed in as:</Text>
            <Text style={styles.modalInfoValue}>{email}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={[styles.input, errors.username && styles.inputError]}
              placeholder="Choose a unique username"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (errors.username) setErrors({ ...errors, username: null });
              }}
              autoCapitalize="none"
            />
            {errors.username && (
              <Text style={styles.errorText}>{errors.username}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              placeholder="+254 700 000 000"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (errors.phone) setErrors({ ...errors, phone: null });
              }}
              keyboardType="phone-pad"
            />
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => {
              setAcceptTerms(!acceptTerms);
              if (errors.terms) setErrors({ ...errors, terms: null });
            }}
          >
            <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
              {acceptTerms && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              I accept the{' '}
              <Text style={styles.linkText}>Terms and Conditions</Text>
            </Text>
          </TouchableOpacity>
          {errors.terms && (
            <Text style={styles.errorText}>{errors.terms}</Text>
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.button, styles.buttonOutline]}
              onPress={() => {
                setShowGoogleModal(false);
                setAuthMethod(null);
                setFullName('');
                setEmail('');
              }}
            >
              <Text style={styles.buttonOutlineText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.buttonFlex]}
              onPress={handleGoogleModalSubmit}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
  <KeyboardAvoidingView
    style={styles.container}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  >
    <View style={styles.scrollViewContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>AccellaX 361°</Text>
          <Text style={styles.tagline}>Soccer Attendance Tracker</Text>
        </View>

        {renderProgressDots()}

        <View style={styles.content}>
          {step === 1 && renderStep1()}
          {step === 1.5 && renderStep1_5()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </View>

        <Text style={styles.footer}>
          Made with ❤️ for coaches | v1.0.0
        </Text>
      </ScrollView>
      </View>

      {renderGoogleModal()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2196F3',
  },
  scrollViewContainer: {
    height: 0,
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#E3F2FD',
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 6,
  },
  progressDotActive: {
    backgroundColor: '#FFFFFF',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  stepContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 64,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#BDBDBD',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2196F3',
    shadowOpacity: 0,
    elevation: 0,
    flex: 1,
    marginRight: 8,
  },
  buttonFlex: {
    flex: 2,
    marginLeft: 8,
  },
  buttonSuccess: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  buttonOutlineText: {
    color: '#2196F3',
    fontSize: 17,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  summaryContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#757575',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: '#212121',
    fontWeight: 'bold',
  },
  featuresList: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#424242',
  },
  authOptionsContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: '#757575',
  },
  authButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  authButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    position: 'relative',
  },
  authButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#F5F5F5',
  },
  authButtonIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  authButtonTextDisabled: {
    color: '#9E9E9E',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF9800',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#424242',
    flex: 1,
  },
  linkText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 450,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalInfo: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  modalInfoLabel: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 4,
  },
  modalInfoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  footer: {
    textAlign: 'center',
    color: '#E3F2FD',
    fontSize: 13,
    marginTop: 20,
    marginBottom: 10,
  },
  // Role Selection Styles
  roleContainer: {
    marginBottom: 24,
  },
  roleCard: {
    backgroundColor: '#FAFAFA',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
    alignItems: 'center',
  },
  roleCardActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    borderWidth: 3,
  },
  roleIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  roleLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 20,
  },
  roleCheckmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleCheckmarkText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;