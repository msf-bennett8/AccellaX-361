// Location: /apps/assessment/src/components/metrics/ReactionColorChoiceInput.js
// Test 3: Color Choice Reaction - Find and tap specific color (2 attempts, randomized)

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
import { Audio } from 'expo-audio';

const ReactionColorChoiceInput = ({ value, onChange, metric }) => {
  const [testState, setTestState] = useState('ready'); // ready, waiting, searching, complete
  const [attempts, setAttempts] = useState([]);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [averageTime, setAverageTime] = useState(value || null);
  const [targetColor, setTargetColor] = useState(null);
  const [colorOptions, setColorOptions] = useState([]);
  
  const startTimeRef = useRef(null);
  const timeoutRef = useRef(null);
  const soundRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const colors = [
    { name: 'Red', hex: '#F44336', textColor: '#FFF' },
    { name: 'Blue', hex: '#2196F3', textColor: '#FFF' },
    { name: 'Green', hex: '#4CAF50', textColor: '#FFF' },
    { name: 'Yellow', hex: '#FFEB3B', textColor: '#333' },
    { name: 'Purple', hex: '#9C27B0', textColor: '#FFF' },
    { name: 'Orange', hex: '#FF9800', textColor: '#FFF' },
  ];

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Pulse animation when searching
  useEffect(() => {
    if (testState === 'searching') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [testState]);

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const playBeepAndVibrate = async () => {
    try {
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

  const playErrorFeedback = async () => {
    try {
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
          
          oscillator.frequency.value = 600; // Low buzz for error
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.4);
        }
      }
      
      // Error vibration (400ms)
      if (Platform.OS !== 'web') {
        Vibration.vibrate(400);
      }
    } catch (error) {
      console.warn('Error feedback error:', error);
    }
  };

  const playCompletionFeedback = async () => {
    try {
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
    // Randomly select target color
    const target = colors[Math.floor(Math.random() * colors.length)];
    setTargetColor(target);
    
    // Create 6 color options (5 random + 1 target) and shuffle
    const otherColors = colors.filter(c => c.name !== target.name);
    const shuffledOthers = shuffleArray(otherColors).slice(0, 5);
    const allOptions = shuffleArray([...shuffledOthers, target]);
    setColorOptions(allOptions);
    
    setTestState('waiting');
    
    // Random delay between 1-3 seconds
    const delay = 1000 + Math.random() * 2000;
    
    timeoutRef.current = setTimeout(() => {
      setTestState('searching');
      startTimeRef.current = Date.now();
      playBeepAndVibrate();
    }, delay);
  };

  const handleColorTap = (selectedColor) => {
    if (testState !== 'searching') return;

    const reactionTime = Date.now() - startTimeRef.current;
    
    if (selectedColor.name === targetColor.name) {
      // Correct!
      const newAttempts = [...attempts, reactionTime];
      setAttempts(newAttempts);
      setCurrentAttempt(prev => prev + 1);

      if (newAttempts.length >= 2) {
        // Test complete
        const avg = Math.round(newAttempts.reduce((a, b) => a + b, 0) / newAttempts.length);
        setAverageTime(avg);
        onChange(String(avg));
        setTestState('complete');
        
        // ✅ Completion feedback
        playCompletionFeedback();
      } else {
        // Next attempt
        setTestState('ready');
      }
    } else {
      // Wrong color - keep timer running
      playErrorFeedback();
      // Visual feedback already provided by error sound/vibration
    }
  };

  const resetTest = () => {
    setTestState('ready');
    setAttempts([]);
    setCurrentAttempt(0);
    setAverageTime(null);
    setTargetColor(null);
    setColorOptions([]);
    onChange('');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const getRatingColor = (time) => {
    if (time < 500) return '#4CAF50';
    if (time < 600) return '#2196F3';
    if (time < 700) return '#FF9800';
    return '#F44336';
  };

  const getRatingLabel = (time) => {
    if (time < 500) return 'Excellent';
    if (time < 600) return 'Good';
    if (time < 700) return 'Fair';
    return 'Needs Work';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="color-palette" size={24} color="#2196F3" />
        <Text style={styles.title}>Color Choice Reaction Test</Text>
      </View>

      <Text style={styles.description}>
        Find and tap the color shown at the bottom as quickly as possible
      </Text>

      {/* Target Color Display */}
      {testState === 'searching' && targetColor && (
        <Animated.View style={[styles.targetContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.targetLabel}>Find this color:</Text>
          <View style={[styles.targetColor, { backgroundColor: targetColor.hex }]}>
            <Text style={[styles.targetColorText, { color: targetColor.textColor }]}>
              {targetColor.name}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Color Grid */}
      {testState === 'waiting' || testState === 'searching' ? (
        <View style={styles.colorGrid}>
          {colorOptions.map((color, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.colorBox, { backgroundColor: color.hex }]}
              onPress={() => handleColorTap(color)}
              disabled={testState === 'waiting'}
              activeOpacity={0.7}
            />
          ))}
        </View>
      ) : (
        <View style={styles.placeholderArea}>
          {testState === 'ready' && (
            <View style={styles.statusContainer}>
              <Ionicons name="grid-outline" size={64} color="#666" />
              <Text style={styles.statusText}>
                Ready for Attempt {currentAttempt + 1}/2
              </Text>
              <Text style={styles.statusSubtext}>
                Get ready to find the color!
              </Text>
            </View>
          )}

          {testState === 'complete' && (
            <View style={styles.statusContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
              <Text style={styles.statusText}>Test Complete!</Text>
            </View>
          )}
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
          You'll take 2 attempts with randomized colors. Find and tap the target color as quickly as possible. If you tap wrong, keep looking!
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
  targetContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  targetLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 12,
  },
  targetColor: {
    width: 120,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  targetColorText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  colorBox: {
    width: '31%',
    height: 100,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  placeholderArea: {
    minHeight: 280,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusContainer: {
    alignItems: 'center',
    gap: 12,
    padding: 20,
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
});

export default ReactionColorChoiceInput;