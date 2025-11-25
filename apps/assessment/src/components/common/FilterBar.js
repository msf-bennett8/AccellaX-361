// src/components/common/FilterBar.js
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import FilterChip from './FilterChip';
import { FILTER_LABELS, COLORS } from '../../utils/constants';

const FilterBar = ({ filters, activeFilter, onFilterChange, counts }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => (
          <FilterChip
            key={filter}
            label={FILTER_LABELS[filter] || filter}
            count={counts ? counts[filter] : undefined}
            isSelected={activeFilter === filter}
            onPress={() => onFilterChange(filter)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
});

export default FilterBar;