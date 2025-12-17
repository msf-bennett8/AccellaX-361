// Location: /apps/assessment/src/navigation/KidsStackNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import KidsListScreen from '../screens/Kids/KidsListScreen';
import AddEditKidScreen from '../screens/Kids/AddEditKidScreen';

const Stack = createStackNavigator();

export default function KidsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { flex: 1 }, // ← CRITICAL: Allows children to fill space and scroll
      }}
    >
      <Stack.Screen 
        name="KidsList" 
        component={KidsListScreen} 
      />
      <Stack.Screen 
        name="AddEditKid" 
        component={AddEditKidScreen} 
      />
    </Stack.Navigator>
  );
}