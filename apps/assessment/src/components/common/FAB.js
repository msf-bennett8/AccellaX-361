//src/components/common/FAB.js
import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
  Platform,
} from 'react-native';
import { COLORS } from '../../utils/constants';

const FAB = ({
  icon = '+',
  onPress,
  position = 'bottom-right', // 'bottom-right', 'bottom-left', 'bottom-center', 'top-right', 'top-left'
  size = 'default', // 'small', 'default', 'large'
  backgroundColor = COLORS.secondary,
  iconColor = COLORS.white,
  label,
  labelPosition = 'left', // 'left', 'right', 'top', 'bottom'
  labelStyle,
  style,
  disabled = false,
  loading = false,
  extended = false, // Extended FAB with label
  visible = true,
  animate = true,
  elevation = 6,
  iconSize,
  variant = 'default', // 'default', 'rounded', 'square'
  badge,
  badgeColor = COLORS.error,
  onLongPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animate) {
      Animated.spring(scaleAnim, {
        toValue: visible ? 1 : 0,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(visible ? 1 : 0);
    }
  }, [visible, animate]);

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [loading]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: 40,
          height: 40,
          borderRadius: variant === 'square' ? 8 : 20,
        };
      case 'large':
        return {
          width: 72,
          height: 72,
          borderRadius: variant === 'square' ? 12 : 36,
        };
      default:
        return {
          width: 56,
          height: 56,
          borderRadius: variant === 'square' ? 10 : 28,
        };
    }
  };

  const getIconSize = () => {
    if (iconSize) return iconSize;
    switch (size) {
      case 'small':
        return 20;
      case 'large':
        return 36;
      default:
        return 28;
    }
  };

  const getPositionStyles = () => {
    const offset = 20;
    switch (position) {
      case 'bottom-left':
        return { bottom: offset, left: offset };
      case 'bottom-center':
        return { bottom: offset, alignSelf: 'center' };
      case 'top-right':
        return { top: offset, right: offset };
      case 'top-left':
        return { top: offset, left: offset };
      case 'bottom-right':
      default:
        return { bottom: offset, right: offset };
    }
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      // Rotate animation on press
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      onPress && onPress();
    }
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const renderLabel = () => {
    if (!label && !extended) return null;

    return (
      <View
        style={[
          styles.labelContainer,
          labelPosition === 'left' && styles.labelLeft,
          labelPosition === 'right' && styles.labelRight,
          labelPosition === 'top' && styles.labelTop,
          labelPosition === 'bottom' && styles.labelBottom,
        ]}
      >
        <Text style={[styles.labelText, labelStyle]}>{label}</Text>
      </View>
    );
  };

  const renderBadge = () => {
    if (!badge) return null;

    return (
      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    );
  };

  if (!visible && !animate) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        getPositionStyles(),
        extended && styles.containerExtended,
        {
          transform: [{ scale: scaleAnim }],
          opacity: scaleAnim,
        },
      ]}
    >
      {!extended && labelPosition === 'left' && renderLabel()}
      {!extended && labelPosition === 'top' && renderLabel()}

      <TouchableOpacity
        style={[
          styles.fab,
          getSizeStyles(),
          {
            backgroundColor: disabled ? COLORS.disabled : backgroundColor,
            elevation,
            shadowColor: COLORS.shadow,
            shadowOffset: { width: 0, height: elevation / 2 },
            shadowOpacity: 0.3,
            shadowRadius: elevation,
          },
          extended && styles.fabExtended,
          variant === 'rounded' && styles.fabFullRounded,
          style,
        ]}
        onPress={handlePress}
        onLongPress={onLongPress}
        activeOpacity={0.8}
        disabled={disabled || loading}
      >
        <Animated.View
          style={{
            transform: loading ? [{ rotate: spin }] : [{ rotate }],
          }}
        >
          <Text
            style={[
              styles.icon,
              {
                color: disabled ? COLORS.textSecondary : iconColor,
                fontSize: getIconSize(),
              },
            ]}
          >
            {loading ? '⟳' : icon}
          </Text>
        </Animated.View>

        {extended && (
          <Text
            style={[
              styles.extendedLabel,
              { color: iconColor },
              labelStyle,
            ]}
          >
            {label}
          </Text>
        )}

        {renderBadge()}
      </TouchableOpacity>

      {!extended && labelPosition === 'right' && renderLabel()}
      {!extended && labelPosition === 'bottom' && renderLabel()}
    </Animated.View>
  );
};

// Mini FAB Component (for FAB groups)
export const MiniFAB = ({
  icon,
  onPress,
  backgroundColor = COLORS.white,
  iconColor = COLORS.primary,
  label,
  style,
}) => {
  return (
    <View style={styles.miniFabContainer}>
      {label && (
        <View style={styles.miniLabel}>
          <Text style={styles.miniLabelText}>{label}</Text>
        </View>
      )}
      <TouchableOpacity
        style={[
          styles.miniFab,
          { backgroundColor },
          style,
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={[styles.miniFabIcon, { color: iconColor }]}>{icon}</Text>
      </TouchableOpacity>
    </View>
  );
};

// FAB Group Component
export const FABGroup = ({
  icon = '+',
  openIcon = '✕',
  actions = [],
  onStateChange,
  backgroundColor = COLORS.secondary,
  iconColor = COLORS.white,
  position = 'bottom-right',
  visible = true,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const animatedValues = useRef(
    actions.map(() => new Animated.Value(0))
  ).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onStateChange && onStateChange(newState);

    // Animate main FAB rotation
    Animated.timing(rotateAnim, {
      toValue: newState ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Animate mini FABs
    if (newState) {
      Animated.stagger(
        50,
        animatedValues.map((anim) =>
          Animated.spring(anim, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
          })
        )
      ).start();
    } else {
      Animated.parallel(
        animatedValues.map((anim) =>
          Animated.timing(anim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          })
        )
      ).start();
    }
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={[styles.fabGroup, position === 'bottom-right' && styles.fabGroupBottomRight]}>
      {/* Backdrop */}
      {isOpen && (
        <TouchableOpacity
          style={styles.backdrop}
          onPress={toggleOpen}
          activeOpacity={1}
        />
      )}

      {/* Mini FABs */}
      <View style={styles.miniFabsContainer}>
        {actions.map((action, index) => {
          const animValue = animatedValues[index];
          const translateY = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -(60 * (actions.length - index))],
          });

          return (
            <Animated.View
              key={index}
              style={{
                transform: [{ translateY }],
                opacity: animValue,
              }}
            >
              <MiniFAB
                icon={action.icon}
                label={action.label}
                onPress={() => {
                  action.onPress();
                  toggleOpen();
                }}
                backgroundColor={action.backgroundColor}
                iconColor={action.iconColor}
              />
            </Animated.View>
          );
        })}
      </View>

      {/* Main FAB */}
      <FAB
        icon={isOpen ? openIcon : icon}
        onPress={toggleOpen}
        backgroundColor={backgroundColor}
        iconColor={iconColor}
        visible={visible}
        style={{
          transform: [{ rotate }],
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  containerExtended: {
    flexDirection: 'row',
  },
  fab: {
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      android: {
        elevation: 6,
      },
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      web: {
        cursor: 'pointer',
        boxShadow: '0 3px 5px rgba(0,0,0,0.3)',
      },
    }),
  },
  fabExtended: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderRadius: 28,
    minWidth: 120,
  },
  fabFullRounded: {
    borderRadius: 100,
  },
  icon: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  extendedLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  labelContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  labelLeft: {
    marginRight: 12,
  },
  labelRight: {
    marginLeft: 12,
  },
  labelTop: {
    marginBottom: 12,
  },
  labelBottom: {
    marginTop: 12,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  // Mini FAB styles
  miniFabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  miniLabel: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  miniLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  miniFab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  miniFabIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  // FAB Group styles
  fabGroup: {
    position: 'absolute',
    zIndex: 1000,
  },
  fabGroupBottomRight: {
    bottom: 20,
    right: 20,
  },
  backdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  miniFabsContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});

export default FAB;