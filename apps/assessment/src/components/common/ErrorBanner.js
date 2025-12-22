// Location: /apps/assessment/src/components/common/ErrorBanner.js
// Persistent error banner component

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useError } from '../../contexts/ErrorContext';
import { ErrorSeverity } from '../../utils/errorHandler';
import { COLORS } from '../../utils/constants';

const ErrorBanner = () => {
  const { currentError, dismissError } = useError();
  const [slideAnim] = React.useState(new Animated.Value(-100));

  React.useEffect(() => {
    if (currentError) {
      // Slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8
      }).start();
    } else {
      // Slide out
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [currentError]);

  if (!currentError) return null;

  const getIconAndColor = (severity) => {
    switch (severity) {
      case ErrorSeverity.INFO:
        return { icon: 'information-circle', color: COLORS.primary };
      case ErrorSeverity.WARNING:
        return { icon: 'warning', color: COLORS.warning };
      case ErrorSeverity.ERROR:
        return { icon: 'alert-circle', color: COLORS.error };
      case ErrorSeverity.CRITICAL:
        return { icon: 'alert', color: COLORS.error };
      default:
        return { icon: 'information-circle', color: COLORS.primary };
    }
  };

  const { icon, color } = getIconAndColor(currentError.severity);

  return (
    <Animated.View
      style={[
        styles.container,
        { 
          backgroundColor: color + '20',
          borderLeftColor: color,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={icon} size={24} color={color} style={styles.icon} />
        <Text style={[styles.message, { color }]} numberOfLines={2}>
          {currentError.message}
        </Text>
      </View>

      {currentError.severity !== ErrorSeverity.CRITICAL && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={() => dismissError(currentError.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color={color} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderLeftWidth: 4,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 9999,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  dismissButton: {
    marginLeft: 12,
    padding: 4,
  },
});

export default ErrorBanner;