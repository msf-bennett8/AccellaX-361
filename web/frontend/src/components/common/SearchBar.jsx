/**
 * File: web/frontend/src/components/common/SearchBar.jsx
 * AccellaX 361° - Search Bar Component
 * 
 * Description:
 * Reusable search input with debounce functionality and clear button.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({
  placeholder = 'Search...',
  value = '',
  onChange,
  onSearch,
  debounceMs = 300,
  className = '',
  showClearButton = true,
  autoFocus = false,
}) => {
  const [internalValue, setInternalValue] = useState(value);
  const debounceTimerRef = useRef(null);
  const inputRef = useRef(null);

  // Sync with external value
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Auto focus if enabled
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInternalValue(newValue);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounced onChange
    if (onChange) {
      debounceTimerRef.current = setTimeout(() => {
        onChange(newValue);
      }, debounceMs);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Trigger immediate search
    if (onSearch) {
      onSearch(internalValue);
    } else if (onChange) {
      onChange(internalValue);
    }
  };

  const handleClear = () => {
    setInternalValue('');
    
    if (onChange) {
      onChange('');
    }
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        
        <input
          ref={inputRef}
          type="text"
          value={internalValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="
            w-full pl-10 pr-10 py-2.5
            border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            text-gray-900 placeholder-gray-400
          "
        />

        {showClearButton && internalValue && (
          <button
            type="button"
            onClick={handleClear}
            className="
              absolute right-3 top-1/2 transform -translate-y-1/2
              p-1 rounded-full hover:bg-gray-100
              text-gray-400 hover:text-gray-600
              transition-colors
            "
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </form>
  );
};

export default SearchBar;