// Location: /apps/assessment/src/navigation/HistoryStackNavigator.js
// Stack navigator for History screens (History → KidProgress → Comparison)

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../utils/constants';

// Import History Screens
import HistoryScreen from '../screens/History/HistoryScreen';
import KidProgressScreen from '../screens/KidProgress/KidProgressScreen';
import ComparisonScreen from '../screens/Comparison/ComparisonScreen';

const Stack = createStackNavigator();

export default function HistoryStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Using custom headers in screens
        cardStyle: { backgroundColor: COLORS.background },
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
    </Stack.Navigator>
  );
}