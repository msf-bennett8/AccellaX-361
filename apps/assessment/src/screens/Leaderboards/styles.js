// Location: /apps/assessment/src/screens/Leaderboards/styles.js
// Shared styles for leaderboard screens

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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
});