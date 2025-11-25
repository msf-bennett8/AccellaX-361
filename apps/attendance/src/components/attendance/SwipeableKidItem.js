// src/components/attendance/SwipeableKidItem.js

import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { COLORS } from '../../utils/constants';

const SwipeableKidItem = ({ 
  kid, 
  index, 
  onMarkPresent, 
  onMarkAbsent,
  disabled = false,
  markedInfo = null // {status, markedBy, markedAt} or null
}) => {
  
  // Helper function to format timestamp in 12-hour format
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    return `${hours}:${minutes} ${ampm}`;
  };
  const swipeableRef = useRef(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRemoving) {
      // Start fade out and slide animation (faster)
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200, // Reduced from 300ms
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 200, // Reduced from 300ms
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isRemoving]);

  const handleMarkPresent = () => {
    if (disabled || isRemoving) return; // Prevent double-swipe
    
    setIsRemoving(true);
    
    // Haptic feedback (works on mobile)
    if (Platform.OS !== 'web') {
      try {
        const { trigger } = require('expo-haptics');
        trigger('impactLight');
      } catch (e) {
        // Haptics not available
      }
    }

    // Immediately call the callback
    onMarkPresent(kid.id);
    
    // Close swipeable immediately
    swipeableRef.current?.close();
  };

  const handleMarkAbsent = () => {
    if (disabled || isRemoving) return; // Prevent double-swipe
    
    setIsRemoving(true);
    
    // Haptic feedback
    if (Platform.OS !== 'web') {
      try {
        const { trigger } = require('expo-haptics');
        trigger('impactLight');
      } catch (e) {
        // Haptics not available
      }
    }

    // Immediately call the callback
    onMarkAbsent(kid.id);
    
    // Close swipeable immediately
    swipeableRef.current?.close();
  };

  const renderRightActions = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.rightAction, { transform: [{ scale }] }]}>
        <View style={styles.actionContent}>
          <Text style={styles.actionIcon}>✓</Text>
          <Text style={styles.actionText}>Present</Text>
        </View>
      </Animated.View>
    );
  };

  const renderLeftActions = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.leftAction, { transform: [{ scale }] }]}>
        <View style={styles.actionContent}>
          <Text style={styles.actionIcon}>✗</Text>
          <Text style={styles.actionText}>Absent</Text>
        </View>
      </Animated.View>
    );
  };

  if (disabled) {
    // Suspended kids - not swipeable
    return (
      <View style={[styles.container, styles.disabledContainer]}>
        <View style={styles.numberBadge}>
          <Text style={[styles.numberText, styles.disabledText]}>{index}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={[styles.name, styles.disabledText]}>{kid.name}</Text>
          <Text style={styles.suspendedLabel}>(Suspended)</Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
      }}
    >
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        renderLeftActions={renderLeftActions}
        onSwipeableRightOpen={handleMarkPresent}
        onSwipeableLeftOpen={handleMarkAbsent}
        overshootRight={false}
        overshootLeft={false}
        friction={2}
        rightThreshold={40}
        leftThreshold={40}
      >
        <View style={[
          styles.container,
          isRemoving && styles.removingContainer,
          markedInfo?.status === 'present' && styles.presentContainer,
          markedInfo?.status === 'absent' && styles.absentContainer
        ]}>
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>{index}</Text>
          </View>
          <View style={styles.infoContainer}>
            <View style={styles.topRow}>
              <Text style={styles.name}>{kid.name}</Text>
              {!markedInfo && (
                <Text style={styles.swipeHintText}>← Swipe →</Text>
              )}
            </View>
            <View style={styles.bottomRow}>
              <View style={styles.leftInfo}>
                {kid.age && (
                  <Text style={styles.details}>
                    {kid.age} yrs {kid.gender ? `• ${kid.gender}` : ''}
                  </Text>
                )}
              </View>
              <View style={styles.rightInfo}>
                {markedInfo && (
                  <Text style={styles.markedInfo}>
                    {markedInfo.markedBy || 'Unknown'} • {formatTime(markedInfo.markedAt)}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </Swipeable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  disabledContainer: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    opacity: 0.6,
  },
  removingContainer: {
    backgroundColor: '#F9F9F9',
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledText: {
    color: COLORS.textSecondary,
  },
  infoContainer: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0,
  },
  leftInfo: {
    flex: 1,
  },
  rightInfo: {
    alignItems: 'flex-end',
  },
  details: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
    suspendedLabel: {
      fontSize: 12,
      color: COLORS.suspended,
    fontStyle: 'italic',
    marginTop: 2,
  },
  swipeHintText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  rightAction: {
    backgroundColor: COLORS.present,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: 100,
  },
  leftAction: {
    backgroundColor: COLORS.absent,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 20,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: 100,
  },
  actionContent: {
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    color: COLORS.white,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  presentContainer: {
    backgroundColor: '#E8F5E9',
    borderColor: COLORS.present,
    borderWidth: 2,
  },
  absentContainer: {
  backgroundColor: '#FFEBEE',
  borderColor: COLORS.absent,
  borderWidth: 2,
},
markedInfo: {
  fontSize: 11,
  color: COLORS.textSecondary,
  fontStyle: 'italic',
},

});

export default SwipeableKidItem;