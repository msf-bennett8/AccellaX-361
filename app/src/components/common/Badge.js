// src/components/common/Badge.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BADGE_COLORS } from '../../utils/constants';

const Badge = ({ type, label }) => {
  const backgroundColor = BADGE_COLORS[type] || '#9E9E9E';
  const displayLabel = label || type;

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={styles.badgeText}>{displayLabel}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default Badge;