// Location: /apps/assessment/src/navigation/ReportsStackNavigator.js
// Stack navigator for Reports/Export screens

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../utils/constants';

// Import Reports Screens
import ReportsScreen from '../screens/Reports/ReportsScreen';
import ExportDetailScreen from '../screens/Reports/ExportDetailScreen';
import SportAssessmentReportScreen from '../screens/Reports/SportAssessmentReportScreen';
import HistoryReportScreen from '../screens/History/HistoryReportScreen';

const Stack = createStackNavigator();

export default function ReportsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { flex: 1, backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen
        name="ReportsMain"
        component={ReportsScreen}
        options={{ title: 'Export Data' }}
      />
      <Stack.Screen
        name="SportReport"
        component={SportAssessmentReportScreen}
        options={{ title: 'Sport Report' }}
      />
      <Stack.Screen
        name="HistoryReport"
        component={HistoryReportScreen}
        options={{ title: 'Full Report' }}
      />
      <Stack.Screen
        name="ExportDetail"
        component={ExportDetailScreen}
        options={{ title: 'Export Preview' }}
      />
    </Stack.Navigator>
  );
}
