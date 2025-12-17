// UPDATED HistoryStackNavigator.js
// Location: /apps/assessment/src/navigation/HistoryStackNavigator.js

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../utils/constants';

// Import History Screens
import HistoryScreen from '../screens/History/HistoryScreen';
import KidProgressScreen from '../screens/KidProgress/KidProgressScreen';
import ComparisonScreen from '../screens/Comparison/ComparisonScreen';
import HistoryReportScreen from '../screens/History/HistoryReportScreen';
import SportAssessmentReportScreen from '../screens/Reports/SportAssessmentReportScreen';

const Stack = createStackNavigator();

export default function HistoryStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { flex: 1, backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen
        name="HistoryMain"
        component={HistoryScreen}
        options={{ title: 'Assessment History' }}
      />
      <Stack.Screen
        name="KidProgress"
        component={KidProgressScreen}
        options={{ title: 'Kid Progress' }}
      />
      <Stack.Screen
        name="Comparison"
        component={ComparisonScreen}
        options={{ title: 'Compare Performance' }}
      />
      <Stack.Screen
        name="HistoryReport"
        component={HistoryReportScreen}
        options={{ title: 'Full Report' }}
      />
      <Stack.Screen
        name="SportReport"
        component={SportAssessmentReportScreen}
        options={{ title: 'Sport Report' }}
      />
    </Stack.Navigator>
  );
}