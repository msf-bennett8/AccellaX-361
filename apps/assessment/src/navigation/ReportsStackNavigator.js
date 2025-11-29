// Location: /apps/assessment/src/navigation/ReportsStackNavigator.js
// Stack navigator for Reports/Export screens

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../utils/constants';

// Import Reports Screens
import ReportsScreen from '../screens/Reports/ReportsScreen';
import ExportDetailScreen from '../screens/Reports/ExportDetailScreen';

const Stack = createStackNavigator();

export default function ReportsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Using custom headers in screens
        cardStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen
        name="ReportsMain"
        component={ReportsScreen}
        options={{ title: 'Export Data' }}
      />
      <Stack.Screen
        name="ExportDetail"
        component={ExportDetailScreen}
        options={{ title: 'Export Preview' }}
      />
    </Stack.Navigator>
  );
}