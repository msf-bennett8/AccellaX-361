// Location: /apps/assessment/src/components/common/SyncIndicator.js
// Floating Sync Status Indicator - Phase 3.2

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../utils/constants';
import { useSyncContext } from '../../contexts/SyncContext';

export default function SyncIndicator() {
  const navigation = useNavigation();
  const { isSyncing, syncProgress, lastSyncTime, pendingItemsCount } = useSyncContext();
  
  const [showIndicator, setShowIndicator] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Show indicator if syncing or have pending items
    if (isSyncing || pendingItemsCount > 0) {
      setShowIndicator(true);
      fadeIn();
    } else {
      fadeOut();
    }
  }, [isSyncing, pendingItemsCount]);

  useEffect(() => {
    if (isSyncing) {
      startRotation();
    } else {
      stopRotation();
    }
  }, [isSyncing]);

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const fadeOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowIndicator(false));
  };

  const startRotation = () => {
    rotateAnim.setValue(0);
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopRotation = () => {
    rotateAnim.stopAnimation();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const formatLastSyncTime = () => {
    if (!lastSyncTime) return 'Never synced';

    const now = Date.now();
    const diff = now - lastSyncTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handlePress = () => {
    navigation.navigate('SyncHistory');
  };

  if (!showIndicator) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.indicator}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          {isSyncing ? (
            <Animated.View style={{ transform: [{ rotate }] }}>
              <Ionicons name="cloud-upload" size={20} color={COLORS.primary} />
            </Animated.View>
          ) : pendingItemsCount > 0 ? (
            <View>
              <Ionicons name="cloud-offline" size={20} color={COLORS.warning} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {pendingItemsCount > 9 ? '9+' : pendingItemsCount}
                </Text>
              </View>
            </View>
          ) : (
            <Ionicons name="cloud-done" size={20} color={COLORS.success} />
          )}
        </View>

        <View style={styles.textContainer}>
          {isSyncing ? (
            <>
              <Text style={styles.statusText}>Syncing...</Text>
              {syncProgress > 0 && (
                <Text style={styles.progressText}>{syncProgress}%</Text>
              )}
            </>
          ) : pendingItemsCount > 0 ? (
            <>
              <Text style={styles.statusText}>Pending Sync</Text>
              <Text style={styles.subtitleText}>
                {pendingItemsCount} item{pendingItemsCount > 1 ? 's' : ''}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.statusText}>Synced</Text>
              <Text style={styles.subtitleText}>{formatLastSyncTime()}</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 80,
    right: 20,
    zIndex: 1000,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      },
    }),
  },
  iconContainer: {
    marginRight: 10,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  textContainer: {
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
