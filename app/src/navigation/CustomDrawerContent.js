import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '../utils/constants';

const CustomDrawerContent = ({ navigation, state }) => {
  const routes = [
    { name: 'HomeStack', label: 'Home', icon: '🏠', screen: 'Home' },
    { name: 'MyKidsStack', label: 'My Kids', icon: '👶', screen: 'MyKids' },
    { name: 'NotesStack', label: 'Notes', icon: '📝', screen: 'Notes' }, // ✅ ADD THIS
    { name: 'HistoryStack', label: 'History', icon: '📅', screen: 'History' },
    { name: 'Settings', label: 'Settings', icon: '⚙️' },
  ];

  const activeRoute = state.routes[state.index].name;

  const handleNavigation = (route) => {
    // For stack navigators, navigate to the initial screen within that stack
    if (route.screen) {
      navigation.navigate(route.name, { screen: route.screen });
    } else {
      navigation.navigate(route.name);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AccellaX 361°</Text>
        <Text style={styles.headerSubtitle}>Kids Attendance</Text>
      </View>

      <ScrollView style={styles.menuContainer}>
        {routes.map((route) => {
          const isActive = activeRoute === route.name;
          
          return (
            <TouchableOpacity
              key={route.name}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={() => handleNavigation(route)}
              activeOpacity={0.7}
            >
              <Text style={styles.menuIcon}>{route.icon}</Text>
              <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                {route.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.1</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.primaryLight,
  },
  menuContainer: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
  },
  menuItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  menuLabel: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  menuLabelActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

export default CustomDrawerContent;