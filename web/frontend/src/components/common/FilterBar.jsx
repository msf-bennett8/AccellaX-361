/**
 * File: web/frontend/src/components/common/FilterBar.jsx
 * AccellaX 361° - Filter Bar Component
 * 
 * Description:
 * Reusable filter bar with dropdown filters and chips.
 */

import React, { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import Button from './Button';

const FilterBar = ({
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClearAll,
  className = '',
}) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const handleFilterSelect = (filterKey, value) => {
    onFilterChange({ ...activeFilters, [filterKey]: value });
    setOpenDropdown(null);
  };

  const handleRemoveFilter = (filterKey) => {
    const newFilters = { ...activeFilters };
    delete newFilters[filterKey];
    onFilterChange(newFilters);
  };

  const activeFilterCount = Object.keys(activeFilters).length;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filters:
        </span>

        {filters.map((filter) => {
          const isActive = activeFilters[filter.key];
          
          return (
            <div key={filter.key} className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === filter.key ? null : filter.key)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg border
                  text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-primary-50 border-primary-300 text-primary-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                {filter.label}
                {isActive && `: ${filter.options.find(opt => opt.value === isActive)?.label}`}
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Dropdown */}
              {openDropdown === filter.key && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="p-2 max-h-60 overflow-y-auto">
                    {filter.options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleFilterSelect(filter.key, option.value)}
                        className={`
                          w-full text-left px-3 py-2 rounded-md text-sm
                          transition-colors
                          ${activeFilters[filter.key] === option.value
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-50'
                          }
                        `}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            icon={X}
          >
            Clear All ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">Active:</span>
          {Object.entries(activeFilters).map(([key, value]) => {
            const filter = filters.find(f => f.key === key);
            const option = filter?.options.find(opt => opt.value === value);
            
            if (!filter || !option) return null;

            return (
              <div
                key={key}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full"
              >
                <span>{filter.label}: {option.label}</span>
                <button
                  onClick={() => handleRemoveFilter(key)}
                  className="hover:bg-primary-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FilterBar;