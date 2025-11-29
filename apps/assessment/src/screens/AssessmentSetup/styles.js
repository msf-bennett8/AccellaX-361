// Location: /apps/assessment/src/screens/AssessmentSetup/styles.js
// Styles for Assessment Setup Screen

import { StyleSheet } from 'react-native';
import { COLORS } from '../../utils/constants';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
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
  
  // Rest of styles...
  // (Copy from artifact or keep inline in screen file)
});