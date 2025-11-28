// src/components/common/FilterBar.js
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import FilterChip from './FilterChip';
import { FILTER_LABELS, COLORS } from '../../utils/constants';

const FilterBar = ({ filters = [], options = [], activeFilter, selectedValue, onFilterChange, onSelect, counts }) => {
  // Support both prop naming conventions
  const filterList = filters.length > 0 ? filters : options;
  const currentValue = activeFilter || selectedValue;
  const handleChange = onFilterChange || onSelect;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filterList.map((filter) => {
          // Handle both string filters and option objects
          const filterValue = typeof filter === 'object' ? filter.value : filter;
          const filterLabel = typeof filter === 'object' ? filter.label : (FILTER_LABELS[filter] || filter);
          const filterIcon = typeof filter === 'object' ? filter.icon : '';
          
          return (
            <FilterChip
              key={filterValue}
              label={filterIcon ? `${filterIcon} ${filterLabel}` : filterLabel}
              count={counts ? counts[filterValue] : undefined}
              isSelected={currentValue === filterValue}
              onPress={() => handleChange(filterValue)}
            />
          );
        })}
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