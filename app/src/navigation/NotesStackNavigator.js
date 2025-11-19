//app/src/navigation/NotesStackNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import NotesScreen from '../screens/Notes/NotesScreen';
import AddEditNoteScreen from '../screens/Notes/AddEditNoteScreen';

const Stack = createStackNavigator();

const NotesStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Notes" component={NotesScreen} />
      <Stack.Screen name="AddEditNote" component={AddEditNoteScreen} />
    </Stack.Navigator>
  );
};

export default NotesStackNavigator;