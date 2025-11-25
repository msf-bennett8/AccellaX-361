//src/components/common/SearchBar.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../utils/constants';

const SearchBar = ({
  value,
  onChangeText,
  onClear,
  onFocus,
  onBlur,
  onSubmit,
  placeholder = 'Search...',
  autoFocus = false,
  editable = true,
  variant = 'default', // 'default', 'rounded', 'minimal', 'boxed'
  showClearButton = true,
  showSearchIcon = true,
  showCancelButton = false,
  cancelButtonText = 'Cancel',
  backgroundColor = COLORS.white,
  borderColor = COLORS.border,
  textColor = COLORS.text,
  placeholderColor = COLORS.textSecondary,
  iconColor = COLORS.textSecondary,
  style,
  containerStyle,
  inputStyle,
  debounceDelay = 0,
  loading = false,
  leftIcon = '🔍',
  rightIcon,
  onRightIconPress,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(value || '');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cancelAnim = useRef(new Animated.Value(0)).current;
  const debounceTimer = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  useEffect(() => {
    // Animate clear button
    Animated.timing(fadeAnim, {
      toValue: internalValue.length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [internalValue]);

  useEffect(() => {
    // Animate cancel button
    Animated.timing(cancelAnim, {
      toValue: isFocused && showCancelButton ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isFocused, showCancelButton]);

  const handleChangeText = (text) => {
    setInternalValue(text);

    if (debounceDelay > 0) {
      // Clear existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Set new timer
      debounceTimer.current = setTimeout(() => {
        onChangeText && onChangeText(text);
      }, debounceDelay);
    } else {
      onChangeText && onChangeText(text);
    }
  };

  const handleClear = () => {
    setInternalValue('');
    onChangeText && onChangeText('');
    onClear && onClear();
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus && onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur && onBlur();
  };

  const handleCancel = () => {
    handleClear();
    inputRef.current?.blur();
  };

  const handleSubmit = () => {
    onSubmit && onSubmit(internalValue);
    inputRef.current?.blur();
  };

  const getContainerStyle = () => {
    const baseStyle = [styles.container];

    switch (variant) {
      case 'rounded':
        baseStyle.push(styles.containerRounded);
        break;
      case 'minimal':
        baseStyle.push(styles.containerMinimal);
        break;
      case 'boxed':
        baseStyle.push(styles.containerBoxed);
        break;
      default:
        baseStyle.push(styles.containerDefault);
    }

    if (isFocused) {
      baseStyle.push(styles.containerFocused);
    }

    return baseStyle;
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <View
        style={[
          ...getContainerStyle(),
          { backgroundColor, borderColor },
          style,
        ]}
      >
        {/* Search Icon */}
        {showSearchIcon && (
          <View style={styles.iconContainer}>
            <Text style={[styles.iconText, { color: iconColor }]}>
              {leftIcon}
            </Text>
          </View>
        )}

        {/* Input Field */}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            { color: textColor },
            !showSearchIcon && styles.inputNoIcon,
            inputStyle,
          ]}
          value={internalValue}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmit}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          autoFocus={autoFocus}
          editable={editable}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="never" // We handle clear button ourselves
        />

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        )}

        {/* Clear Button */}
        {showClearButton && internalValue.length > 0 && !loading && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity
              onPress={handleClear}
              style={styles.clearButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.6}
            >
              <Text style={[styles.clearIcon, { color: iconColor }]}>✕</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Right Icon */}
        {rightIcon && !loading && internalValue.length === 0 && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <Text style={[styles.iconText, { color: iconColor }]}>
              {rightIcon}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cancel Button */}
      {showCancelButton && (
        <Animated.View
          style={[
            styles.cancelButtonContainer,
            {
              opacity: cancelAnim,
              transform: [
                {
                  translateX: cancelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents={isFocused ? 'auto' : 'none'}
        >
          <TouchableOpacity onPress={handleCancel} activeOpacity={0.6}>
            <Text style={styles.cancelButtonText}>{cancelButtonText}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

// Text component for icons (avoiding import issues)
const Text = ({ children, style }) => {
  return (
    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
      <TextInput
        editable={false}
        value={children}
        style={[{ textAlign: 'center' }, style]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  containerDefault: {
    borderRadius: 8,
    height: 48,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  containerRounded: {
    borderRadius: 24,
    height: 48,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  containerMinimal: {
    borderRadius: 0,
    height: 44,
    borderWidth: 0,
    borderBottomWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
  },
  containerBoxed: {
    borderRadius: 4,
    height: 52,
    borderWidth: 2,
    elevation: 0,
    shadowOpacity: 0,
  },
  containerFocused: {
    borderColor: COLORS.primary,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  iconContainer: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  inputNoIcon: {
    marginLeft: 4,
  },
  loadingContainer: {
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  rightIconButton: {
    padding: 4,
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonContainer: {
    marginLeft: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default SearchBar;