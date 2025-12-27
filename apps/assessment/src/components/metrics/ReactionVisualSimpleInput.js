// Location: /apps/assessment/src/components/metrics/ReactionVisualSimpleInput.js
// Test 2: Simple Visual Reaction - Tap on screen color change (2 attempts)

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

const ReactionVisualSimpleInput = ({ value, onChange, metric }) => {
  const [testState, setTestState] = useState('ready'); // ready, waiting, reacting, complete
  const [attempts, setAttempts] = useState([]);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [averageTime, setAverageTime] = useState(value || null);
  const [currentColor, setCurrentColor] = useState('#E0E0E0');
  const [errorMessage, setErrorMessage] = useState('');
  
  const startTimeRef = useRef(null);
  const timeoutRef = useRef(null);
  const soundRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Color pairs for the test (first attempt, second attempt)
  const colorPairs = [
    { from: '#F44336', to: '#4CAF50', label: 'Red → Green' },
    { from: '#FFEB3B', to: '#FF9800', label: 'Yellow → Orange' },
  ];

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Fade animation when color changes
  useEffect(() => {
    if (testState === 'reacting') {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [testState]);

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
      
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/beep.mp3')
        );
        soundRef.current = sound;
        await sound.playAsync();
      } catch (fileError) {
        if (Platform.OS === 'web') {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        }
      }
      
      // No vibration during stimulus - pure visual test
    } catch (error) {
      console.warn('Audio/Vibration error:', error);
    }
  };

  const playCompletionFeedback = async () => {
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
      
      // Play ding sound
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/ding.mp3')
        );
        await sound.playAsync();
        sound.unloadAsync();
      } catch (fileError) {
        // Fallback to Web Audio API (web only)
        if (Platform.OS === 'web') {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 1200; // High ding
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
        }
      }
      
      // Completion vibration (200ms)
      if (Platform.OS !== 'web') {
        Vibration.vibrate(200);
      }
    } catch (error) {
      console.warn('Completion feedback error:', error);
    }
  };

  const startTest = () => {
    const colorPair = colorPairs[currentAttempt];
    setCurrentColor(colorPair.from);
    setTestState('waiting');
    
    // Random delay between 2-5 seconds
    const delay = 2000 + Math.random() * 3000;
    
    timeoutRef.current = setTimeout(() => {
      setCurrentColor(colorPair.to);
      setTestState('reacting');
      startTimeRef.current = Date.now();
      playBeepAndVibrate();
    }, delay);
  };

  const handleTap = () => {
    if (testState === 'waiting') {
      // Too early - restart
      clearTimeout(timeoutRef.current);
      setTestState('ready');
      setCurrentColor('#E0E0E0');
      setErrorMessage('Too early! Wait for the color to change.');
      setTimeout(() => setErrorMessage(''), 2000);
      return;
    }

    if (testState === 'reacting') {
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
        
        // ✅ Completion feedback
        playCompletionFeedback();
      } else {
        // Next attempt
        setTestState('ready');
        setCurrentColor('#E0E0E0');
      }
    }
  };

  const resetTest = () => {
    setTestState('ready');
    setAttempts([]);
    setCurrentAttempt(0);
    setAverageTime(null);
    setCurrentColor('#E0E0E0');
    onChange('');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const getRatingColor = (time) => {
    if (time < 280) return '#4CAF50';
    if (time < 330) return '#2196F3';
    if (time < 380) return '#FF9800';
    return '#F44336';
  };

  const getRatingLabel = (time) => {
    if (time < 280) return 'Excellent';
    if (time < 330) return 'Good';
    if (time < 380) return 'Fair';
    return 'Needs Work';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="eye" size={24} color="#2196F3" />
        <Text style={styles.title}>Simple Visual Reaction Test</Text>
      </View>

      <Text style={styles.description}>
        Tap the screen as soon as the color changes
      </Text>

      {/* Current Test Info */}
      {testState !== 'complete' && currentAttempt < 2 && (
        <View style={styles.testInfo}>
          <Text style={styles.testInfoLabel}>
            Attempt {currentAttempt + 1}/2: {colorPairs[currentAttempt].label}
          </Text>
        </View>
      )}

      {/* Test Area */}
      <TouchableOpacity
        style={[
          styles.testArea,
          { backgroundColor: currentColor },
        ]}
        onPress={handleTap}
        disabled={testState === 'ready' || testState === 'complete'}
        activeOpacity={0.9}
      >
        <Animated.View style={{ opacity: testState === 'reacting' ? fadeAnim : 1 }}>
          {testState === 'ready' && (
            <View style={styles.statusContainer}>
              <Ionicons name="eye-outline" size={64} color="#666" />
              <Text style={styles.statusText}>Ready</Text>
            </View>
          )}

          {testState === 'waiting' && (
            <View style={styles.statusContainer}>
              <Ionicons name="hourglass" size={64} color="#666" />
              <Text style={styles.statusText}>Watch carefully...</Text>
            </View>
          )}

          {testState === 'reacting' && (
            <View style={styles.statusContainer}>
              <Ionicons name="hand-left" size={64} color="#FFF" />
              <Text style={[styles.statusText, { color: '#FFF', fontSize: 32 }]}>
                TAP NOW!
              </Text>
            </View>
          )}

          {testState === 'complete' && (
            <View style={styles.statusContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
              <Text style={styles.statusText}>Complete!</Text>
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
                <Text style={styles.attemptLabel}>
                  {colorPairs[index].label}
                </Text>
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
          You'll take 2 attempts with different color changes. Tap immediately when the screen color changes.
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
    marginBottom: 12,
  },
  testInfo: {
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  testInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    textAlign: 'center',
  },
  testArea: {
    minHeight: 300,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
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

export default ReactionVisualSimpleInput;