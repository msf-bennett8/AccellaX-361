// Location: /apps/assessment/src/navigation/StackNavigator.js
// Stack navigator for main app screens (if needed for sub-navigation)

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../utils/constants';

// Import screens that need stack navigation
import HomeScreen from '../screens/Home/HomeScreen';
import SelectSportScreen from '../screens/SelectSport/SelectSportScreen';
import SelectKidsScreen from '../screens/SelectKids/SelectKidsScreen';

const Stack = createStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ title: 'Assessment Home' }}
      />
      <Stack.Screen
        name="SelectSport"
        component={SelectSportScreen}
        options={{ title: 'Select Sport' }}
      />
      <Stack.Screen
        name="SelectKids"
        component={SelectKidsScreen}
        options={{ title: 'Select Athletes' }}
      />
    </Stack.Navigator>
  );
}