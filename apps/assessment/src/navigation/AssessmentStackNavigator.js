// Location: /apps/assessment/src/navigation/AssessmentStackNavigator.js
// Stack navigator for assessment flow

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import Assessment Screens
import SelectSportScreen from '../screens/SelectSport/SelectSportScreen';
import AssessmentModeScreen from '../screens/SelectSport/AssessmentModeScreen';
import SelectTestsScreen from '../screens/SelectSport/SelectTestsScreen';
import SelectKidsScreen from '../screens/SelectKids/SelectKidsScreen';
import AssessmentEntryScreen from '../screens/AssessmentEntry/AssessmentEntryScreen';
import AssessmentSummaryScreen from '../screens/AssessmentSummary/AssessmentSummaryScreen';

const Stack = createStackNavigator();

export default function AssessmentStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="SelectSport" 
        component={SelectSportScreen}
        options={{ title: 'Select Sport' }}
      />
      <Stack.Screen 
        name="AssessmentMode" 
        component={AssessmentModeScreen}
        options={{ title: 'Assessment Mode' }}
      />
      <Stack.Screen 
        name="SelectTests" 
        component={SelectTestsScreen}
        options={{ title: 'Select Tests' }}
      />
      <Stack.Screen 
        name="SelectKids" 
        component={SelectKidsScreen}
        options={{ title: 'Select Kids' }}
      />
      <Stack.Screen 
        name="AssessmentEntry" 
        component={AssessmentEntryScreen}
        options={{ title: 'Assessment Entry' }}
      />
      <Stack.Screen 
        name="AssessmentSummary" 
        component={AssessmentSummaryScreen}
        options={{ title: 'Assessment Summary' }}
      />
    </Stack.Navigator>
  );
}