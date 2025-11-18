// src/components/common/Button.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, Platform } from 'react-native';
import { COLORS } from '../../utils/constants';

const Button = ({
  title,
  onPress,
  variant = 'solid', // 'solid', 'outline', 'text', 'ghost'
  color = 'primary', // 'primary', 'secondary', 'success', 'error', 'warning', 'info'
  size = 'medium', // 'small', 'medium', 'large', 'xl'
  disabled = false,
  loading = false,
  fullWidth = false,
  icon = null, // React element for icon
  iconPosition = 'left', // 'left', 'right'
  style,
  textStyle,
  testID,
  accessibilityLabel,
  hapticFeedback = true, // Enable haptic feedback on press
}) => {
  // Color mapping for different button types
  const getColor = () => {
    const colorMap = {
      primary: COLORS.primary,
      secondary: COLORS.secondary,
      success: COLORS.success,
      error: COLORS.error,
      warning: COLORS.warning,
      info: COLORS.info || '#2196F3',
    };
    return colorMap[color] || COLORS.primary;
  };

  const buttonColor = getColor();

  // Get button styles based on variant and state
  const getButtonStyle = () => {
    const styles = [baseStyles.button];

    // Size styles
    switch (size) {
      case 'small':
        styles.push(baseStyles.buttonSmall);
        break;
      case 'large':
        styles.push(baseStyles.buttonLarge);
        break;
      case 'xl':
        styles.push(baseStyles.buttonXL);
        break;
      default:
        styles.push(baseStyles.buttonMedium);
    }

    // Variant styles
    switch (variant) {
      case 'solid':
        styles.push({
          backgroundColor: buttonColor,
          shadowColor: buttonColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 3,
        });
        break;
      case 'outline':
        styles.push({
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: buttonColor,
        });
        break;
      case 'text':
        styles.push({
          backgroundColor: 'transparent',
          paddingHorizontal: 8,
        });
        break;
      case 'ghost':
        styles.push({
          backgroundColor: `${buttonColor}15`, // 15% opacity
          borderWidth: 0,
        });
        break;
    }

    // Disabled/Loading state
    if (disabled || loading) {
      styles.push(baseStyles.buttonDisabled);
    }

    // Full width
    if (fullWidth) {
      styles.push(baseStyles.buttonFullWidth);
    }

    return styles;
  };

  // Get text styles based on variant and state
  const getTextStyle = () => {
    const styles = [baseStyles.buttonText];

    // Size-specific text styles
    switch (size) {
      case 'small':
        styles.push(baseStyles.buttonTextSmall);
        break;
      case 'large':
        styles.push(baseStyles.buttonTextLarge);
        break;
      case 'xl':
        styles.push(baseStyles.buttonTextXL);
        break;
      default:
        styles.push(baseStyles.buttonTextMedium);
    }

    // Variant-specific text colors
    if (variant === 'solid') {
      styles.push({ color: COLORS.white });
    } else {
      styles.push({ color: buttonColor });
    }

    // Disabled text color
    if (disabled || loading) {
      styles.push(baseStyles.buttonTextDisabled);
    }

    return styles;
  };

  // Handle press with optional haptic feedback
  const handlePress = () => {
    if (hapticFeedback && Platform.OS !== 'web') {
      // Add haptic feedback for native platforms
      // Note: You'd need expo-haptics for this
      // import * as Haptics from 'expo-haptics';
      // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onPress) {
      onPress();
    }
  };

  // Render button content (text + icon + loading)
  const renderContent = () => {
    if (loading) {
      return (
        <View style={baseStyles.loadingContainer}>
          <ActivityIndicator
            color={variant === 'solid' ? COLORS.white : buttonColor}
            size={size === 'small' ? 'small' : 'large'}
          />
          {title && (
            <Text style={[...getTextStyle(), baseStyles.loadingText, textStyle]}>
              {title}
            </Text>
          )}
        </View>
      );
    }

    // Button with icon
    if (icon) {
      return (
        <View style={baseStyles.contentContainer}>
          {iconPosition === 'left' && (
            <View style={baseStyles.iconLeft}>{icon}</View>
          )}
          <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
          {iconPosition === 'right' && (
            <View style={baseStyles.iconRight}>{icon}</View>
          )}
        </View>
      );
    }

    // Text only
    return <Text style={[...getTextStyle(), textStyle]}>{title}</Text>;
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      testID={testID}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const baseStyles = StyleSheet.create({
  // Base button styles
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },

  // Size variants
  buttonSmall: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    minHeight: 32,
    borderRadius: 6,
  },
  buttonMedium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 48,
  },
  buttonLarge: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minHeight: 56,
  },
  buttonXL: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    minHeight: 64,
    borderRadius: 12,
  },

  // State variants
  buttonDisabled: {
    backgroundColor: COLORS.border,
    borderColor: COLORS.border,
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonFullWidth: {
    width: '100%',
  },

  // Text styles
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  buttonTextSmall: {
    fontSize: 13,
    fontWeight: '500',
  },
  buttonTextMedium: {
    fontSize: 16,
  },
  buttonTextLarge: {
    fontSize: 18,
  },
  buttonTextXL: {
    fontSize: 20,
    fontWeight: '700',
  },
  buttonTextDisabled: {
    color: COLORS.textSecondary,
    opacity: 0.6,
  },

  // Content layout
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconLeft: {
    marginRight: 4,
  },
  iconRight: {
    marginLeft: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    marginLeft: 8,
  },
});

export default Button;