// Location: /apps/assessment/src/navigation/LeaderboardsStackNavigator.js
// Stack navigator for Rankings/Leaderboards section (UPDATED)

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../utils/constants';

// Import screens
import LeaderboardsScreen from '../screens/Leaderboards/LeaderboardsScreen';
import MostImprovedScreen from '../screens/Leaderboards/MostImprovedScreen';
import TopPerformersScreen from '../screens/Leaderboards/TopPerformersScreen';
import TeamRankingsScreen from '../screens/Leaderboards/TeamRankingsScreen';
import TeamDetailScreen from '../screens/Leaderboards/TeamDetailScreen'; // ✅ NEW
import ComparisonScreen from '../screens/Comparison/ComparisonScreen';

const Stack = createStackNavigator();

export default function LeaderboardsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Using custom Header component in each screen
        cardStyle: { backgroundColor: COLORS.background },
      }}
    >
      {/* Main Leaderboards Hub */}
      <Stack.Screen
        name="LeaderboardsMain"
        component={LeaderboardsScreen}
        options={{ title: 'Rankings' }}
      />

      {/* Most Improved Athletes */}
      <Stack.Screen
        name="MostImproved"
        component={MostImprovedScreen}
        options={{ title: 'Most Improved' }}
      />

      {/* Top Performers */}
      <Stack.Screen
        name="TopPerformers"
        component={TopPerformersScreen}
        options={{ title: 'Top Performers' }}
      />

      {/* Team Rankings */}
      <Stack.Screen
        name="TeamRankings"
        component={TeamRankingsScreen}
        options={{ title: 'Team Rankings' }}
      />

      {/* Team Detail - NEW SCREEN */}
      <Stack.Screen
        name="TeamDetail"
        component={TeamDetailScreen}
        options={{ title: 'Team Details' }}
      />

      {/* Comparison Screen - Available from any leaderboard screen */}
      <Stack.Screen
        name="Comparison"
        component={ComparisonScreen}
        options={{ title: 'Comparison' }}
      />
    </Stack.Navigator>
  );
}
