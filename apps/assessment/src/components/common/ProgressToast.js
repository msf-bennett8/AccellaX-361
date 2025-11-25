// src/components/common/ProgressToast.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { COLORS } from '../../utils/constants';

const ProgressToast = ({ visible, message, stepsRemaining, onHide }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const scaleRef = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Slide in on first show
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out when hidden
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -20,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onHide) onHide();
      });
    }
  }, [visible]);

  // Pulse animation when steps change
  useEffect(() => {
    if (visible && stepsRemaining > 0) {
      Animated.sequence([
        Animated.spring(scaleRef, {
          toValue: 1.08,
          tension: 100,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(scaleRef, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [stepsRemaining, message]);

  const getBackgroundColor = () => {
    switch (stepsRemaining) {
      case 4:
        return '#FF9500'; // Orange
      case 3:
        return '#FFCC00'; // Yellow
      case 2:
        return '#34C759'; // Green
      case 1:
        return '#007AFF'; // Blue
      default:
        return COLORS.primary;
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: getBackgroundColor(),
            opacity,
            transform: [{ translateY }, { scale: scaleRef }],
          },
        ]}
      >
        <Text style={styles.emoji}>🔓</Text>
        <View style={styles.textContainer}>
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.steps}>
            {stepsRemaining} {stepsRemaining === 1 ? 'step' : 'steps'} remaining
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 90,
    right: 12,
    left: 12,
    alignItems: 'flex-end',
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    maxWidth: 280,
    minWidth: 240,
  },
  emoji: {
    fontSize: 22,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 3,
    lineHeight: 16,
  },
  steps: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
  },
});

export default ProgressToast;