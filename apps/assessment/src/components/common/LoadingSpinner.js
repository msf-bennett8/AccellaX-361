// src/components/common/LoadingSpinner.js
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../../utils/constants';

const LoadingSpinner = ({
  size = 'large',
  color = COLORS.primary,
  text,
  overlay = false,
  style,
}) => {
  // Animation for 12-blade spinner
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start continuous rotation - THIS IS THE KEY FIX
    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,  // 1 second per rotation
        useNativeDriver: true,
      })
    );
    
    animation.start();

    // Cleanup: stop animation when component unmounts
    return () => animation.stop();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Determine spinner size
  const spinnerSize = size === 'large' ? 70 : size === 'small' ? 40 : 50;
  const bladeWidth = size === 'large' ? 5 : size === 'small' ? 3 : 3.5;
  const bladeHeight = size === 'large' ? 14 : size === 'small' ? 8 : 10;
  const bladeOffset = size === 'large' ? -28 : size === 'small' ? -17 : -21;

  const renderSpinner = () => (
    <Animated.View 
      style={[
        styles.spinner12Blades,
        { 
          width: spinnerSize,
          height: spinnerSize,
          transform: [{ rotate: spin }] 
        }
      ]}
    >
      {/* 12 Blades at 30° intervals */}
      {[...Array(12)].map((_, index) => (
        <View
          key={index}
          style={[
            styles.blade,
            {
              width: bladeWidth,
              height: bladeHeight,
              backgroundColor: color,
              transform: [
                { rotate: `${index * 30}deg` },
                { translateY: bladeOffset }
              ],
              opacity: 1 - (index * 0.08)  // Fade effect like iOS
            }
          ]}
        />
      ))}
    </Animated.View>
  );

  if (overlay) {
    return (
      <View style={[styles.overlayContainer, style]}>
        <View style={styles.overlayContent}>
          {renderSpinner()}
          {text && <Text style={styles.overlayText}>{text}</Text>}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {renderSpinner()}
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 16,
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  overlayContent: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    marginTop: 20,
    fontSize: 16,
    color: '#1565C0',
    textAlign: 'center',
    fontWeight: '700',
  },
  spinner12Blades: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blade: {
    position: 'absolute',
    borderRadius: 2,
  },
});

export default LoadingSpinner;