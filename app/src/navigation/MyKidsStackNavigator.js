//src/navigation/MyKidsStackNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MyKidsScreen from '../screens/MyKids/MyKidsScreen';
import AddEditKidScreen from '../screens/MyKids/AddEditKidScreen';
import { SCREEN_NAMES } from '../utils/constants';

const Stack = createStackNavigator();

const MyKidsStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name={SCREEN_NAMES.MY_KIDS} component={MyKidsScreen} />
      <Stack.Screen name={SCREEN_NAMES.ADD_EDIT_KID} component={AddEditKidScreen} />
    </Stack.Navigator>
  );
};

export default MyKidsStackNavigator;