// Location: /apps/assessment/src/components/metrics/MetricInput.js
// COMPLETE Universal Metric Input - Handles all metric types with previous values

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

const MetricInput = ({ 
  metric, 
  value, 
  onChange, 
  previousValue, 
  showPrevious 
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimerRef = useRef(null); // ✅ ADD: Debounce timer

  // Update input value when value prop changes OR when prefill is enabled
  useEffect(() => {
    const newValue = value || (showPrevious && previousValue ? previousValue : '');
    setInputValue(newValue);
  }, [value, previousValue, showPrevious]);

  // Auto-fill on mount if showPrevious is enabled and value is empty
  useEffect(() => {
    if (showPrevious && previousValue && (!value || value === '')) {
      setInputValue(previousValue);
      onChange(previousValue);
    }
  }, []);

  // ✅ ADD: Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        console.log('🧹 [MetricInput] Cleaned up debounce timer on unmount');
      }
    };
  }, []);

  const handleChange = (text) => {
    console.log('📝 [MetricInput] Input changed:', { 
      metric: metric.id, 
      value: text,
      debouncing: true 
    });
    
    setInputValue(text); // ✅ Update UI immediately
    
    // ✅ CRITICAL FIX: Debounce the onChange call to prevent race conditions
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      console.log('⏱️ [MetricInput] Cleared previous debounce timer');
    }
    
    debounceTimerRef.current = setTimeout(() => {
      console.log('💾 [MetricInput] Debounce timer expired - saving value:', {
        metric: metric.id,
        value: text
      });
      onChange(text); // ✅ Only save after 300ms of no typing
    }, 300); // 300ms debounce delay
  };

  const handleFillPrevious = () => {
    if (previousValue) {
      setInputValue(previousValue);
      onChange(previousValue);
    }
  };

  // Numeric Input (height, weight, distance, etc.)
  const renderNumericInput = () => {
    return (
      <View style={styles.inputWrapper}>
        <View style={styles.numericInputContainer}>
          <TextInput
            style={[
              styles.numericInput,
              isFocused && styles.inputFocused,
            ]}
            value={inputValue}
            onChangeText={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            keyboardType="numeric"
            placeholder={`Enter ${metric.name.toLowerCase()}`}
            placeholderTextColor={COLORS.textSecondary}
          />
          {metric.unit && (
            <View style={styles.unitBadge}>
              <Text style={styles.unitText}>{metric.unit}</Text>
            </View>
          )}
        </View>

        {showPrevious && previousValue && (
          <TouchableOpacity 
            style={styles.fillButton}
            onPress={handleFillPrevious}
          >
            <Ionicons name="arrow-down-circle" size={16} color={COLORS.primary} />
            <Text style={styles.fillButtonText}>Use last: {previousValue}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Rating Input (1-10 scale with slider)
  const renderRatingInput = () => {
    const rating = Number(inputValue) || 0;

    return (
      <View style={styles.ratingContainer}>
        {/* Rating Buttons */}
        <View style={styles.ratingButtons}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.ratingButton,
                rating === num && styles.ratingButtonActive,
              ]}
              onPress={() => {
                setInputValue(String(num));
                onChange(String(num));
              }}
            >
              <Text style={[
                styles.ratingButtonText,
                rating === num && styles.ratingButtonTextActive,
              ]}>
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rating Label */}
        <View style={styles.ratingLabelContainer}>
          <Text style={styles.ratingLabel}>
            {rating === 0 ? 'Not rated' : getRatingLabel(rating)}
          </Text>
          {showPrevious && previousValue && (
            <TouchableOpacity onPress={handleFillPrevious}>
              <Text style={styles.previousRatingText}>
                Last: {previousValue}/10
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Timed Input (sprint times, Cooper run, etc.)
  const renderTimedInput = () => {
    return (
      <View style={styles.inputWrapper}>
        <View style={styles.timedInputContainer}>
          {/* Minutes */}
          <View style={styles.timeUnitContainer}>
            <Text style={styles.timeLabel}>Minutes</Text>
            <TextInput
              style={[styles.timeInput, isFocused && styles.inputFocused]}
              value={inputValue.split(':')[0] || ''}
              onChangeText={(text) => {
                const mins = text;
                const secs = inputValue.split(':')[1] || '00';
                const newTime = `${mins.padStart(2, '0')}:${secs}`;
                handleChange(newTime);
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="00"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <Text style={styles.timeSeparator}>:</Text>

          {/* Seconds */}
          <View style={styles.timeUnitContainer}>
            <Text style={styles.timeLabel}>Seconds</Text>
            <TextInput
              style={[styles.timeInput, isFocused && styles.inputFocused]}
              value={inputValue.split(':')[1] || ''}
              onChangeText={(text) => {
                const mins = inputValue.split(':')[0] || '00';
                const secs = text;
                const newTime = `${mins}:${secs.padStart(2, '0')}`;
                handleChange(newTime);
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="00"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          {metric.unit && (
            <View style={styles.unitBadge}>
              <Text style={styles.unitText}>{metric.unit}</Text>
            </View>
          )}
        </View>

        {showPrevious && previousValue && (
          <TouchableOpacity 
            style={styles.fillButton}
            onPress={handleFillPrevious}
          >
            <Ionicons name="arrow-down-circle" size={16} color={COLORS.primary} />
            <Text style={styles.fillButtonText}>Use last: {previousValue}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Counted Reps Input (push-ups, sit-ups, etc.)
  const renderCountedInput = () => {
    const count = Number(inputValue) || 0;

    return (
      <View style={styles.countedContainer}>
        {/* Counter Display */}
        <View style={styles.counterDisplay}>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={() => {
              const newCount = Math.max(0, count - 1);
              setInputValue(String(newCount));
              onChange(String(newCount));
            }}
          >
            <Ionicons name="remove-circle" size={40} color={COLORS.error} />
          </TouchableOpacity>

          <View style={styles.counterValueContainer}>
            <Text style={styles.counterValue}>{count}</Text>
            <Text style={styles.counterUnit}>reps</Text>
          </View>

          <TouchableOpacity
            style={styles.counterButton}
            onPress={() => {
              const newCount = count + 1;
              setInputValue(String(newCount));
              onChange(String(newCount));
            }}
          >
            <Ionicons name="add-circle" size={40} color={COLORS.success} />
          </TouchableOpacity>
        </View>

        {/* Manual Input */}
        <TextInput
          style={styles.manualCountInput}
          value={inputValue}
          onChangeText={handleChange}
          keyboardType="number-pad"
          placeholder="Or type manually"
          placeholderTextColor={COLORS.textSecondary}
        />

        {showPrevious && previousValue && (
          <TouchableOpacity 
            style={styles.fillButton}
            onPress={handleFillPrevious}
          >
            <Ionicons name="arrow-down-circle" size={16} color={COLORS.primary} />
            <Text style={styles.fillButtonText}>Use last: {previousValue} reps</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Beep Test Input (special input for beep test levels with shuttle)
  const renderBeepTestInput = () => {
    // Parse level.shuttle format (e.g., "5.3" = Level 5, Shuttle 3)
    const parts = String(inputValue).split('.');
    const level = Number(parts[0]) || 1;
    const shuttle = Number(parts[1]) || 1;
    const maxShuttles = [7,8,8,9,9,10,10,11,11,11,12,12,13,13,13,14,14,15,15,16,16][level - 1] || 7;

    return (
      <View style={styles.beepTestContainer}>
        <Text style={styles.beepTestLabel}>Select Level Reached</Text>
        
        <View style={styles.beepTestLevels}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((lvl) => (
            <TouchableOpacity
              key={lvl}
              style={[
                styles.beepTestButton,
                level === lvl && styles.beepTestButtonActive,
              ]}
              onPress={() => {
                const newValue = `${lvl}.1`;
                setInputValue(newValue);
                onChange(newValue);
              }}
            >
              <Text style={[
                styles.beepTestButtonText,
                level === lvl && styles.beepTestButtonTextActive,
              ]}>
                {lvl}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {showPrevious && previousValue && (
          <TouchableOpacity 
            style={styles.fillButton}
            onPress={handleFillPrevious}
          >
            <Ionicons name="arrow-down-circle" size={16} color={COLORS.primary} />
            <Text style={styles.fillButtonText}>Use last: Level {previousValue}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Default Text Input
  const renderDefaultInput = () => {
    return (
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.defaultInput,
            isFocused && styles.inputFocused,
          ]}
          value={inputValue}
          onChangeText={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={`Enter ${metric.name.toLowerCase()}`}
          placeholderTextColor={COLORS.textSecondary}
        />

        {/* Shuttle Selection for selected level */}
        {level > 0 && (
          <View style={styles.shuttleSection}>
            <Text style={styles.shuttleSectionTitle}>
              Select Shuttle (1-{maxShuttles})
            </Text>
            <View style={styles.shuttleButtons}>
              {Array.from({ length: maxShuttles }, (_, i) => i + 1).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.shuttleButton,
                    shuttle === s && styles.shuttleButtonActive,
                  ]}
                  onPress={() => {
                    const newValue = `${level}.${s}`;
                    setInputValue(newValue);
                    onChange(newValue);
                  }}
                >
                  <Text style={[
                    styles.shuttleButtonText,
                    shuttle === s && styles.shuttleButtonTextActive,
                  ]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {showPrevious && previousValue && (
          <TouchableOpacity 
            style={styles.fillButton}
            onPress={handleFillPrevious}
          >
            <Ionicons name="arrow-down-circle" size={16} color={COLORS.primary} />
            <Text style={styles.fillButtonText}>Use last: {previousValue}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Main Render
  const renderInput = () => {
    switch (metric.type) {
      case 'numeric':
        return renderNumericInput();
      case 'rating':
        return renderRatingInput();
      case 'timed':
        return renderTimedInput();
      case 'timer':
        // Use TimerAssessmentInput component instead
        return null; // Will be handled by parent component
      case 'counted':
        return renderCountedInput();
      case 'beep_test':
        return renderBeepTestInput();
      case 'cooper_test':
        return renderNumericInput(); // Simple numeric input for distance in meters
      default:
        return renderDefaultInput();
    }
  };

  return (
    <View style={styles.container}>
      {renderInput()}
    </View>
  );
};

// Helper Functions
const getRatingLabel = (rating) => {
  if (rating <= 2) return 'Poor';
  if (rating <= 4) return 'Below Average';
  if (rating <= 6) return 'Average';
  if (rating <= 8) return 'Good';
  return 'Excellent';
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  inputWrapper: {
    gap: 12,
  },
  
  // Numeric Input
  numericInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  numericInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: COLORS.white,
    color: COLORS.text,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight + '10',
  },
  unitBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  
  // Fill Button
  fillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },
  fillButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  
  // Rating Input
  ratingContainer: {
    gap: 12,
  },
  ratingButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingButton: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  ratingButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  ratingButtonTextActive: {
    color: COLORS.white,
  },
  ratingLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  previousRatingText: {
    fontSize: 12,
    color: COLORS.primary,
  },
  
  // Timed Input
  timedInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  timeUnitContainer: {
    flex: 1,
    gap: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  timeInput: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: 'bold',
    backgroundColor: COLORS.white,
    color: COLORS.text,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  
  // Counted Input
  countedContainer: {
    gap: 12,
  },
  counterDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 16,
  },
  counterButton: {
    padding: 4,
  },
  counterValueContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  counterValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  counterUnit: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  manualCountInput: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    textAlign: 'center',
  },
  
  // Beep Test Input
  beepTestContainer: {
    gap: 12,
  },
  beepTestLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  beepTestLevels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  beepTestButton: {
    width: 55,
    height: 55,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  beepTestButtonActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  beepTestButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  beepTestButtonTextActive: {
    color: COLORS.white,
  },
  
  // Default Input
  defaultInput: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: COLORS.white,
    color: COLORS.text,
  },

  beepTestButtonTextActive: {
    color: COLORS.white,
  },
  
  // Shuttle Section Styles
  shuttleSection: {
    marginTop: 16,
  },
  shuttleSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  shuttleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shuttleButton: {
    width: 45,
    height: 45,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shuttleButtonActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  shuttleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  shuttleButtonTextActive: {
    color: COLORS.white,
  },
});

export default MetricInput;