// src/components/common/LoadingSpinner.js
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

const LoadingSpinner = ({
  size = 'large',
  color = '#2196F3',
  text,
  overlay = false,
  style,
}) => {
  if (overlay) {
    return (
      <View style={[styles.overlayContainer, style]}>
        <View style={styles.overlayContent}>
          <ActivityIndicator size={size} color={color} />
          {text && <Text style={styles.overlayText}>{text}</Text>}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
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
    marginTop: 12,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  overlayContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  overlayText: {
    marginTop: 12,
    fontSize: 14,
    color: '#212121',
    textAlign: 'center',
  },
});

export default LoadingSpinner;