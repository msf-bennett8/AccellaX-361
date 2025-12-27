// Location: /apps/assessment/src/components/metrics/ReactionAuditoryInput.js
// Test 1: Auditory Reaction Time - Tap on beep + vibration (2 attempts)

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

const ReactionAuditoryInput = ({ value, onChange, metric }) => {
  const [testState, setTestState] = useState('ready'); // ready, waiting, listening, complete
  const [attempts, setAttempts] = useState([]);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [averageTime, setAverageTime] = useState(value || null);
  const [errorMessage, setErrorMessage] = useState('');
  
  const startTimeRef = useRef(null);
  const timeoutRef = useRef(null);
  const soundRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Pulse animation when listening
  useEffect(() => {
    if (testState === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [testState]);

  //Option 1 load beeb from assests audion
  /*
  const playBeepAndVibrate = async () => {
    try {
      // Play beep sound
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/beep.mp3')
      );
      soundRef.current = sound;
      await sound.playAsync();
      
      // Vibrate (pattern: [wait, vibrate, wait, vibrate])
      if (Platform.OS !== 'web') {
        Vibration.vibrate([0, 200, 100, 200]);
      }
    } catch (error) {
      console.warn('Audio/Vibration error:', error);
      // Fallback to just vibration
      if (Platform.OS !== 'web') {
        Vibration.vibrate(400);
      }
    }
  };

  */

  //First tries to load beep.mp3 from assets folder
  //If file doesn't exist, generates a beep using Web Audio API (web only, vibrate on mobile)
  const playBeepAndVibrate = async () => {
    try {
      // ✅ Set audio mode for native platforms FIRST
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      }
      
      // Method 1: Try to load beep.mp3 if it exists
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/beep.mp3')
        );
        soundRef.current = sound;
        await sound.playAsync();
      } catch (fileError) {
        // Method 2: Fallback to Web Audio API beep generation (web only)
        if (Platform.OS === 'web') {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800; // 800 Hz beep
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
          
          console.log('✅ Generated beep using Web Audio API');
        } else {
          console.warn('⚠️ Beep file not found and Web Audio API not available on mobile');
        }
      }
      
      // Vibrate (works on mobile, ignored on web)
      if (Platform.OS !== 'web') {
        Vibration.vibrate([0, 200, 100, 200]);
      }
    } catch (error) {
      console.warn('Audio/Vibration error:', error);
      // Fallback to just vibration
      if (Platform.OS !== 'web') {
        Vibration.vibrate(400);
      }
    }
  };

  const startTest = () => {
    setTestState('waiting');
    
    // Random delay between 2-5 seconds
    const delay = 2000 + Math.random() * 3000;
    
    timeoutRef.current = setTimeout(() => {
      setTestState('listening');
      startTimeRef.current = Date.now();
      playBeepAndVibrate();
    }, delay);
  };

  const handleTap = () => {
    if (testState === 'waiting') {
      // Too early - restart
      clearTimeout(timeoutRef.current);
      setTestState('ready');
      setErrorMessage('Too early! Wait for the beep and vibration.');
      setTimeout(() => setErrorMessage(''), 2000);
      return;
    }

    if (testState === 'listening') {
      const reactionTime = Date.now() - startTimeRef.current;
      const newAttempts = [...attempts, reactionTime];
      setAttempts(newAttempts);
      setCurrentAttempt(prev => prev + 1);

      if (newAttempts.length >= 2) {
        // Test complete - calculate average
        const avg = Math.round(newAttempts.reduce((a, b) => a + b, 0) / newAttempts.length);
        setAverageTime(avg);
        onChange(String(avg));
        setTestState('complete');
      } else {
        // Next attempt
        setTestState('ready');
      }
    }
  };

  const resetTest = () => {
    setTestState('ready');
    setAttempts([]);
    setCurrentAttempt(0);
    setAverageTime(null);
    onChange('');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const getRatingColor = (time) => {
    if (time < 250) return '#4CAF50'; // Excellent
    if (time < 300) return '#2196F3'; // Good
    if (time < 350) return '#FF9800'; // Fair
    return '#F44336'; // Poor
  };

  const getRatingLabel = (time) => {
    if (time < 250) return 'Excellent';
    if (time < 300) return 'Good';
    if (time < 350) return 'Fair';
    return 'Needs Work';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="volume-high" size={24} color="#2196F3" />
        <Text style={styles.title}>Auditory Reaction Test</Text>
      </View>

      <Text style={styles.description}>
        Tap the screen as soon as you hear the beep and feel the vibration
      </Text>

      {/* Test Area */}
      <TouchableOpacity
        style={[
          styles.testArea,
          testState === 'waiting' && styles.testAreaWaiting,
          testState === 'listening' && styles.testAreaListening,
        ]}
        onPress={handleTap}
        disabled={testState === 'ready' || testState === 'complete'}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          {testState === 'ready' && (
            <View style={styles.statusContainer}>
              <Ionicons name="ear" size={64} color="#666" />
              <Text style={styles.statusText}>Ready for Attempt {currentAttempt + 1}/2</Text>
            </View>
          )}

          {testState === 'waiting' && (
            <View style={styles.statusContainer}>
              <Ionicons name="hourglass" size={64} color="#FF9800" />
              <Text style={styles.statusText}>Get Ready...</Text>
              <Text style={styles.statusSubtext}>Wait for beep + vibration</Text>
            </View>
          )}

          {testState === 'listening' && (
            <View style={styles.statusContainer}>
              <Ionicons name="hand-left" size={64} color="#FFF" />
              <Text style={[styles.statusText, { color: '#FFF' }]}>TAP NOW!</Text>
            </View>
          )}

          {testState === 'complete' && (
            <View style={styles.statusContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
              <Text style={styles.statusText}>Test Complete!</Text>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>

      {/* Error Message */}
      {errorMessage && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={20} color="#F44336" />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* Start/Reset Button */}
      {testState === 'ready' && (
        <TouchableOpacity style={styles.startButton} onPress={startTest}>
          <Ionicons name="play" size={24} color="#FFF" />
          <Text style={styles.startButtonText}>
            Start Attempt {currentAttempt + 1}
          </Text>
        </TouchableOpacity>
      )}

      {testState === 'complete' && (
        <TouchableOpacity style={styles.resetButton} onPress={resetTest}>
          <Ionicons name="refresh" size={20} color="#666" />
          <Text style={styles.resetButtonText}>Reset Test</Text>
        </TouchableOpacity>
      )}

      {/* Results */}
      {attempts.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Results</Text>
          
          {/* Individual Attempts */}
          <View style={styles.attemptsGrid}>
            {attempts.map((time, index) => (
              <View key={index} style={styles.attemptCard}>
                <Text style={styles.attemptLabel}>Attempt {index + 1}</Text>
                <Text style={[styles.attemptTime, { color: getRatingColor(time) }]}>
                  {time}ms
                </Text>
              </View>
            ))}
          </View>

          {/* Average */}
          {averageTime && (
            <View style={styles.averageCard}>
              <View style={styles.averageHeader}>
                <Text style={styles.averageLabel}>Average Reaction Time</Text>
                <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(averageTime) + '20' }]}>
                  <Text style={[styles.ratingText, { color: getRatingColor(averageTime) }]}>
                    {getRatingLabel(averageTime)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.averageValue, { color: getRatingColor(averageTime) }]}>
                {averageTime} ms
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructions}>
        <Ionicons name="information-circle-outline" size={18} color="#666" />
        <Text style={styles.instructionsText}>
          You'll take 2 attempts. Tap immediately when you hear the beep and feel the vibration. Your average time will be recorded.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  testArea: {
    minHeight: 250,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  testAreaWaiting: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  testAreaListening: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  statusContainer: {
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  statusSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 6,
    marginBottom: 16,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  resultsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  attemptsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  attemptCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  attemptLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  attemptTime: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  averageCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  averageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  averageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  ratingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  averageValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  instructions: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  instructionsText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
  },
});

export default ReactionAuditoryInput;
