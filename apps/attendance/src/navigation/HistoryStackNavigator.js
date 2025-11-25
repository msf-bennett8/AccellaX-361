//src/navigation/HistoryStackNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HistoryScreen from '../screens/History/HistoryScreen';
import SessionDetailScreen from '../screens/History/SessionDetailScreen';
import AttendanceDetailScreen from '../screens/History/AttendanceDetailScreen';
import { SCREEN_NAMES } from '../utils/constants';

const Stack = createStackNavigator();

const HistoryStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name={SCREEN_NAMES.HISTORY} component={HistoryScreen} />
      <Stack.Screen name={SCREEN_NAMES.SESSION_DETAIL} component={SessionDetailScreen} />
      <Stack.Screen name="AttendanceDetail" component={AttendanceDetailScreen} />
    </Stack.Navigator>
  );
};

export default HistoryStackNavigator;