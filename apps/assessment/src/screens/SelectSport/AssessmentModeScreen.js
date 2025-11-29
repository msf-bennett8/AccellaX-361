// Location: /apps/assessment/src/screens/SelectSport/AssessmentModeScreen.js
// Choose Assessment Mode: Test-by-Test OR Kid-by-Kid

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import { COLORS } from '../../utils/constants';

export default function AssessmentModeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  const { sport, kidCount, assessmentMetadata } = route.params;

  const handleTestByTest = () => {
    // Test-by-Test: Coach selects tests first, then kids
    navigation.navigate('SelectTests', { 
      sport,
      assessmentMode: 'test_by_test',
      kidCount,
      assessmentMetadata: assessmentMetadata, // Pass metadata forward
    });
  };

  const handleKidByKid = () => {
    // Kid-by-Kid: Coach selects kids first, then tests
    navigation.navigate('SelectKids', { 
      sport,
      assessmentMode: 'kid_by_kid',
      kidCount,
      assessmentMetadata: assessmentMetadata, // Pass metadata forward
    });
  };

  return (
    <View style={styles.container}>
      <Header
        title="Assessment Mode"
        subtitle={`${sport.name} - ${kidCount} kids`}
        leftIcon="←"
        onLeftPress={() => navigation.goBack()}
        showAvatar={false}
      />

      <View style={styles.content}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Sport Header */}
          <View style={styles.sportHeader}>
            <View style={[
              styles.sportIconLarge,
              { backgroundColor: sport.color || COLORS.primary + '20' }
            ]}>
              <MaterialCommunityIcons 
                name="trophy" 
                size={48} 
                color={sport.color || COLORS.primary} 
              />
            </View>
            <Text style={styles.sportName}>{sport.name}</Text>
            <View style={styles.sportSubtextRow}>
              <Ionicons name="people" size={16} color={COLORS.textSecondary} />
              <Text style={styles.sportSubtext}>{kidCount} kids enrolled</Text>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <View style={styles.instructionsHeader}>
              <Ionicons name="information-circle" size={20} color={COLORS.primary} />
              <Text style={styles.instructionsTitle}>Choose Assessment Method</Text>
            </View>
            <Text style={styles.instructionsText}>
              Select how you'd like to conduct the assessment based on your testing setup.
            </Text>
          </View>

          {/* Mode Options */}
          <View style={styles.modesContainer}>
            {/* Test-by-Test Mode */}
            <TouchableOpacity
              style={styles.modeCard}
              onPress={handleTestByTest}
              activeOpacity={0.8}
            >
              <View style={styles.modeHeader}>
                <View style={[styles.modeIconContainer, styles.modeIconPrimary]}>
                  <MaterialCommunityIcons 
                    name="clipboard-list" 
                    size={32} 
                    color={COLORS.primary} 
                  />
                </View>
                <View style={styles.modeBadge}>
                  <Ionicons name="star" size={12} color={COLORS.white} />
                  <Text style={styles.modeBadgeText}>Recommended</Text>
                </View>
              </View>

              <Text style={styles.modeTitle}>Test-by-Test</Text>
              <Text style={styles.modeSubtitle}>Station-based assessment</Text>

              <View style={styles.modeFeatures}>
                <View style={styles.featureRow}>
                  <View style={styles.checkmarkCircle}>
                    <Ionicons name="checkmark" size={14} color={COLORS.white} />
                  </View>
                  <Text style={styles.featureText}>Select specific tests first</Text>
                </View>
                <View style={styles.featureRow}>
                  <View style={styles.checkmarkCircle}>
                    <Ionicons name="checkmark" size={14} color={COLORS.white} />
                  </View>
                  <Text style={styles.featureText}>All kids do same test together</Text>
                </View>
                <View style={styles.featureRow}>
                  <View style={styles.checkmarkCircle}>
                    <Ionicons name="checkmark" size={14} color={COLORS.white} />
                  </View>
                  <Text style={styles.featureText}>Great for group tests (Cooper run, beep test)</Text>
                </View>
                <View style={styles.featureRow}>
                  <View style={styles.checkmarkCircle}>
                    <Ionicons name="checkmark" size={14} color={COLORS.white} />
                  </View>
                  <Text style={styles.featureText}>Kids move from station to station</Text>
                </View>
              </View>

              <View style={styles.modeExample}>
                <View style={styles.exampleHeader}>
                  <Ionicons name="bulb" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.exampleLabel}>Example:</Text>
                </View>
                <Text style={styles.exampleText}>
                  1. Select "Cooper Run" → 2. Choose 30 kids → 3. Mark times as kids finish
                </Text>
              </View>

              <View style={styles.modeButton}>
                <Text style={styles.modeButtonText}>Choose This Mode</Text>
                <Ionicons name="arrow-forward-circle" size={22} color={COLORS.white} />
              </View>
            </TouchableOpacity>

            {/* Kid-by-Kid Mode */}
            <TouchableOpacity
              style={styles.modeCard}
              onPress={handleKidByKid}
              activeOpacity={0.8}
            >
              <View style={styles.modeHeader}>
                <View style={[styles.modeIconContainer, styles.modeIconSecondary]}>
                  <Ionicons 
                    name="person" 
                    size={32} 
                    color="#6C5CE7" 
                  />
                </View>
              </View>

              <Text style={styles.modeTitle}>Kid-by-Kid</Text>
              <Text style={styles.modeSubtitle}>Individual assessment</Text>

              <View style={styles.modeFeatures}>
                <View style={styles.featureRow}>
                  <View style={[styles.checkmarkCircle, styles.checkmarkSecondary]}>
                    <Ionicons name="checkmark" size={14} color={COLORS.white} />
                  </View>
                  <Text style={styles.featureText}>Select kids first</Text>
                </View>
                <View style={styles.featureRow}>
                  <View style={[styles.checkmarkCircle, styles.checkmarkSecondary]}>
                    <Ionicons name="checkmark" size={14} color={COLORS.white} />
                  </View>
                  <Text style={styles.featureText}>Complete all tests per kid</Text>
                </View>
                <View style={styles.featureRow}>
                  <View style={[styles.checkmarkCircle, styles.checkmarkSecondary]}>
                    <Ionicons name="checkmark" size={14} color={COLORS.white} />
                  </View>
                  <Text style={styles.featureText}>Good for skill-specific assessments</Text>
                </View>
                <View style={styles.featureRow}>
                  <View style={[styles.checkmarkCircle, styles.checkmarkSecondary]}>
                    <Ionicons name="checkmark" size={14} color={COLORS.white} />
                  </View>
                  <Text style={styles.featureText}>One-on-one detailed focus</Text>
                </View>
              </View>

              <View style={styles.modeExample}>
                <View style={styles.exampleHeader}>
                  <Ionicons name="bulb" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.exampleLabel}>Example:</Text>
                </View>
                <Text style={styles.exampleText}>
                  1. Select Ahmed → 2. Choose tests (Passing, Shooting) → 3. Assess all selected tests
                </Text>
              </View>

              <View style={[styles.modeButton, styles.modeButtonSecondary]}>
                <Text style={styles.modeButtonTextSecondary}>Choose This Mode</Text>
                <Ionicons name="arrow-forward-circle" size={22} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Help Card */}
          <View style={styles.helpCard}>
            <View style={styles.helpIconContainer}>
              <Ionicons name="help-circle" size={24} color="#FDCB6E" />
            </View>
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>Not sure which to choose?</Text>
              <Text style={styles.helpText}>
                Use Test-by-Test for group fitness tests (Cooper run, beep test). 
                Use Kid-by-Kid for detailed skill assessments (dribbling, shooting).
              </Text>
            </View>
          </View>

          {/* Bottom Padding */}
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
  content: {
    position: 'absolute',
    top: 116,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  
  // Sport Header
  sportHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  sportIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  sportName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  sportSubtextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sportSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  
  // Instructions
  instructionsCard: {
    backgroundColor: COLORS.primaryLight + '20',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.primary,
    lineHeight: 20,
  },
  
  // Modes
  modesContainer: {
    paddingHorizontal: 20,
  },
  modeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeIconPrimary: {
    backgroundColor: COLORS.primary + '20',
  },
  modeIconSecondary: {
    backgroundColor: '#6C5CE7' + '20',
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  modeSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  
  // Features
  modeFeatures: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkmarkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkmarkSecondary: {
    backgroundColor: '#6C5CE7',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  
  // Example
  modeExample: {
    backgroundColor: COLORS.backgroundDark,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  exampleText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  
  // Button
  modeButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  modeButtonSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  modeButtonTextSecondary: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  
  // Help Card
  helpCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF9E6',
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FDCB6E',
  },
  helpIconContainer: {
    marginRight: 12,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B8860B',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 13,
    color: '#B8860B',
    lineHeight: 18,
  },
  
  bottomPadding: {
    height: 16,
  },
});