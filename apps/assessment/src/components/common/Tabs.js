// src/components/common/Tabs.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';

const Tabs = ({
  tabs = [],
  activeTab,
  onTabChange,
  tabStyle,
  activeTabStyle,
  tabTextStyle,
  activeTabTextStyle,
  containerStyle,
  indicatorColor = '#2196F3',
  scrollable = false,
}) => {
  const [selectedTab, setSelectedTab] = useState(activeTab || tabs[0]?.value);

  const handleTabPress = (tabValue) => {
    setSelectedTab(tabValue);
    if (onTabChange) {
      onTabChange(tabValue);
    }
  };

  const currentTab = activeTab !== undefined ? activeTab : selectedTab;

  const renderTab = (tab) => {
    const isActive = currentTab === tab.value;

    return (
      <TouchableOpacity
        key={tab.value}
        style={[
          styles.tab,
          tabStyle,
          isActive && styles.activeTab,
          isActive && activeTabStyle,
        ]}
        onPress={() => handleTabPress(tab.value)}
        activeOpacity={0.7}
      >
        {tab.icon && <Text style={styles.tabIcon}>{tab.icon}</Text>}
        <Text
          style={[
            styles.tabText,
            tabTextStyle,
            isActive && styles.activeTabText,
            isActive && activeTabTextStyle,
          ]}
        >
          {tab.label}
        </Text>
        {tab.badge !== undefined && tab.badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{tab.badge > 99 ? '99+' : tab.badge}</Text>
          </View>
        )}
        {isActive && (
          <View style={[styles.indicator, { backgroundColor: indicatorColor }]} />
        )}
      </TouchableOpacity>
    );
  };

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.scrollContainer, containerStyle]}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map(renderTab)}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {tabs.map(renderTab)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  scrollContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  scrollContent: {
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    position: 'relative',
    minWidth: 80,
  },
  activeTab: {
    // Active tab styles (indicator handles the visual)
  },
  tabIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#2196F3',
  },
  badge: {
    backgroundColor: '#FF5252',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default Tabs;