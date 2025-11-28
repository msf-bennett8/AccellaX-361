// src/components/common/ProgressBar.js
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const ProgressBar = ({
  progress = 0,
  height = 8,
  backgroundColor = '#E0E0E0',
  progressColor = '#2196F3',
  showLabel = false,
  labelPosition = 'right',
  animated = true,
  style,
}) => {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const progressWidth = `${clampedProgress}%`;
  const progressLabel = `${Math.round(clampedProgress)}%`;

  const ProgressComponent = animated ? Animated.View : View;

  const renderLabel = () => {
    if (!showLabel) return null;

    return (
      <Text style={styles.label}>
        {progressLabel}
      </Text>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {labelPosition === 'left' && renderLabel()}
      
      <View
        style={[
          styles.track,
          { height, backgroundColor },
          labelPosition !== 'center' && styles.flexTrack,
        ]}
      >
        <ProgressComponent
          style={[
            styles.progress,
            {
              width: progressWidth,
              backgroundColor: progressColor,
              height: height,
            },
          ]}
        />
        
        {labelPosition === 'center' && showLabel && (
          <View style={styles.centerLabelContainer}>
            <Text style={styles.centerLabel}>{progressLabel}</Text>
          </View>
        )}
      </View>

      {labelPosition === 'right' && renderLabel()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  track: {
    borderRadius: 100,
    overflow: 'hidden',
    position: 'relative',
  },
  flexTrack: {
    flex: 1,
  },
  progress: {
    borderRadius: 100,
  },
  label: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '600',
    marginHorizontal: 8,
    minWidth: 40,
    textAlign: 'right',
  },
  centerLabelContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default ProgressBar;