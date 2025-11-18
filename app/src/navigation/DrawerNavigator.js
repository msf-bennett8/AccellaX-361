// src/navigation/DrawerNavigator.js
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import CustomDrawerContent from './CustomDrawerContent';
import StackNavigator from './StackNavigator';
import MyKidsStackNavigator from './MyKidsStackNavigator';
import HistoryStackNavigator from './HistoryStackNavigator';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import SyncDiagnosticsScreen from '../screens/debug/SyncDiagnosticsScreen'; // ✅ ADD THIS

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
      {/* ✅ ADD THIS SCREEN */}
      <Drawer.Screen 
        name="SyncDiagnostics" 
        component={SyncDiagnosticsScreen}
        options={{ title: 'Sync Diagnostics' }}
      />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;