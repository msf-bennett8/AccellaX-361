// src/screens/Auth/AuthChoiceScreen.js
// Authentication choice screen - Login or Register

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { COLORS, APP_NAME } from '../../utils/constants';

const AuthChoiceScreen = ({ navigation }) => {
  const handleCreateAccount = () => {
    navigation.navigate('Register');
  };

  const handleSignIn = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image 
              source={require('../../../assets/icon.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>
        
        <Text style={styles.appName}>{APP_NAME}</Text>
        <Text style={styles.tagline}>
          Track Performance • Measure Progress • Build Champions
        </Text>
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome!</Text>
          <Text style={styles.welcomeSubtitle}>
            Professional sports assessment and athlete development platform
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {/* Create Account Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleCreateAccount}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Create Account</Text>
            <Text style={styles.primaryButtonSubtext}>
              Start assessing athletes today
            </Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSignIn}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Sign In</Text>
            <Text style={styles.secondaryButtonSubtext}>
              Already have an account?
            </Text>
          </TouchableOpacity>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>What you can do:</Text>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={styles.featureText}>Track fitness assessments across multiple sports</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>⚽</Text>
            <Text style={styles.featureText}>Measure sport-specific skills and performance</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📈</Text>
            <Text style={styles.featureText}>View progress charts and athlete comparisons</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎯</Text>
            <Text style={styles.featureText}>Set goals and track achievement over time</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>☁️</Text>
            <Text style={styles.featureText}>Cloud sync across all your devices</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Works offline • Syncs automatically • Secure & Private
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logoImage: {
    width: 70,
    height: 70,
  },
  appName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 13,
    color: COLORS.primaryLight,
    textAlign: 'center',
    opacity: 0.95,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  welcomeSection: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  buttonContainer: {
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 4,
  },
  primaryButtonSubtext: {
    fontSize: 13,
    color: COLORS.primaryLight,
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  secondaryButtonSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  featuresContainer: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 28,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default AuthChoiceScreen;