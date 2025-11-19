import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import CustomDrawerContent from './CustomDrawerContent';
import StackNavigator from './StackNavigator';
import MyKidsStackNavigator from './MyKidsStackNavigator';
import HistoryStackNavigator from './HistoryStackNavigator';
import NotesStackNavigator from './NotesStackNavigator'; // ✅ ADD THIS
import ProfileScreen from '../screens/Profile/ProfileScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import SyncDiagnosticsScreen from '../screens/debug/SyncDiagnosticsScreen';

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: 280,
        },
      }}
    >
      <Drawer.Screen 
        name="HomeStack" 
        component={StackNavigator}
        options={{ title: 'Home' }}
      />
      <Drawer.Screen 
        name="MyKidsStack" 
        component={MyKidsStackNavigator}
        options={{ title: 'My Kids' }}
      />
      <Drawer.Screen 
        name="HistoryStack" 
        component={HistoryStackNavigator}
        options={{ title: 'History' }}
      />
      {/* ✅ ADD NOTES STACK */}
      <Drawer.Screen 
        name="NotesStack" 
        component={NotesStackNavigator}
        options={{ title: 'Notes' }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Drawer.Screen 
        name="SyncDiagnostics" 
        component={SyncDiagnosticsScreen}
        options={{ title: 'Sync Diagnostics' }}
      />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;