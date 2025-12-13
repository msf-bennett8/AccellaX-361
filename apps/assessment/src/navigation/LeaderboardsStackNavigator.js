// Location: /apps/assessment/src/navigation/LeaderboardsStackNavigator.js
// Stack navigator for leaderboards and rankings

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Leaderboards Screens
import LeaderboardsScreen from '../screens/Leaderboards/LeaderboardsScreen';
import TopPerformersScreen from '../screens/Leaderboards/TopPerformersScreen';
import MostImprovedScreen from '../screens/Leaderboards/MostImprovedScreen';
import TeamRankingsScreen from '../screens/Leaderboards/TeamRankingsScreen';

const Stack = createStackNavigator();

export default function LeaderboardsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="LeaderboardsMain"
        component={LeaderboardsScreen}
        options={{ title: 'Leaderboards' }}
      />
      <Stack.Screen
        name="TopPerformers"
        component={TopPerformersScreen}
        options={{ title: 'Top Performers' }}
      />
      <Stack.Screen
        name="MostImproved"
        component={MostImprovedScreen}
        options={{ title: 'Most Improved' }}
      />
      <Stack.Screen
        name="TeamRankings"
        component={TeamRankingsScreen}
        options={{ title: 'Team Rankings' }}
      />
    </Stack.Navigator>
  );
}