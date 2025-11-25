// src/navigation/StackNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/Home/HomeScreen';
import AgeGroupScreen from '../screens/AgeGroup/AgeGroupScreen';
import AttendanceScreen from '../screens/Attendance/AttendanceScreen';
import SummaryScreen from '../screens/Summary/SummaryScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import { SCREEN_NAMES } from '../utils/constants';

const Stack = createStackNavigator();

const StackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={SCREEN_NAMES.HOME}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name={SCREEN_NAMES.HOME} component={HomeScreen} />
      <Stack.Screen name={SCREEN_NAMES.AGE_GROUP} component={AgeGroupScreen} />
      <Stack.Screen name={SCREEN_NAMES.ATTENDANCE} component={AttendanceScreen} />
      <Stack.Screen name={SCREEN_NAMES.SUMMARY} component={SummaryScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
};

export default StackNavigator;