// Location: /apps/assessment/src/components/metrics/ReactionDirectionChoiceInput.js
// Test 4: Direction Choice Reaction - TRULY RANDOM (can repeat directions)

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

const ReactionDirectionChoiceInput = ({ value, onChange, metric }) => {
  const [testState, setTestState] = useState('ready');
  const [attempts, setAttempts] = useState([]);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [averageTime, setAverageTime] = useState(value || null);
  const [targetDirection, setTargetDirection] = useState(null);
  const [showArrows, setShowArrows] = useState(false);
  
  // ✅ NEW: Store completely random directions (can repeat!)
  const [testDirections, setTestDirections] = useState([]);
  
  const startTimeRef = useRef(null);
  const wrongPressTimeRef = useRef(null);
  const timeoutRef = useRef(null);
  const blinkAnim = useRef(new Animated.Value(1)).current;

  // ✅ Generate 2 COMPLETELY RANDOM directions (can be same direction twice!)
  const generateRandomDirections = () => {
    const directions = [];
    for (let i = 0; i < 2; i++) {
      directions.push(Math.random() < 0.5 ? 'left' : 'right');
    }
    return directions;
  };

  useEffect(() => {
    setTestDirections(generateRandomDirections());
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (showArrows) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      blinkAnim.setValue(1);
    }
  }, [showArrows]);

  const playBeepAndVibrate = async () => {
    try {
      // Generate beep using Web Audio API (web only)
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
      }
      
      // No vibration during stimulus - pure cognitive test
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
      
      // Error vibration (400ms, continues until correct)
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
    if (testDirections.length === 0) return;
    
    const direction = testDirections[currentAttempt];
    setTargetDirection(direction);
    setShowArrows(true);
    setTestState('waiting');
    
    // Random delay between 1-3 seconds
    const delay = 1000 + Math.random() * 2000;
    
    timeoutRef.current = setTimeout(() => {
      setTestState('choosing');
      startTimeRef.current = Date.now();
      playBeepAndVibrate(); // ✅ Play beep and vibrate when instruction appears
    }, delay);
  };

  const handleDirectionTap = (selectedDirection) => {
    if (testState !== 'choosing') return;

    const currentTime = Date.now();
    
    if (selectedDirection === targetDirection) {
      // Correct!
      const reactionTime = wrongPressTimeRef.current 
        ? currentTime - wrongPressTimeRef.current
        : currentTime - startTimeRef.current;
      
      const newAttempts = [...attempts, { direction: targetDirection, time: reactionTime }];
      setAttempts(newAttempts);
      setCurrentAttempt(prev => prev + 1);
      setShowArrows(false);
      wrongPressTimeRef.current = null;

      if (newAttempts.length >= 2) {
        const avg = Math.round(newAttempts.reduce((sum, a) => sum + a.time, 0) / newAttempts.length);
        setAverageTime(avg);
        onChange(String(avg));
        setTestState('complete');
        
        // ✅ Completion feedback
        playCompletionFeedback();
      } else {
        setTestState('ready');
      }
    } else {
      // Wrong direction - restart timer from wrong press
      if (!wrongPressTimeRef.current) {
        wrongPressTimeRef.current = currentTime;
      }
      
      // ✅ Error feedback (continues until correct)
      playErrorFeedback();
    }
  };

  const resetTest = () => {
    setTestState('ready');
    setAttempts([]);
    setCurrentAttempt(0);
    setAverageTime(null);
    setTargetDirection(null);
    setShowArrows(false);
    wrongPressTimeRef.current = null;
    onChange('');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // ✅ Generate NEW completely random directions
    setTestDirections(generateRandomDirections());
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
      <View style={styles.header}>
        <Ionicons name="swap-horizontal" size={24} color="#2196F3" />
        <Text style={styles.title}>Direction Choice Reaction Test</Text>
      </View>

      <Text style={styles.description}>
        Tap the correct side when the instruction appears
      </Text>

      {/* Instruction Banner */}
      {testState === 'choosing' && (
        <View style={styles.instructionBanner}>
          <Text style={styles.instructionText}>
            TAP: {targetDirection === 'left' ? '← LEFT' : 'RIGHT →'}
          </Text>
        </View>
      )}

      {/* Full-screen LEFT/RIGHT touch areas */}
      <View style={styles.testArea}>
        {showArrows ? (
          <View style={styles.splitContainer}>
            {/* LEFT SIDE - Full half-screen tappable */}
            <TouchableOpacity
              style={[
                styles.halfScreen, 
                styles.leftSide,
                testState === 'waiting' && { backgroundColor: '#E3F2FD' }
              ]}
              onPress={() => handleDirectionTap('left')}
              disabled={testState === 'waiting'}
              activeOpacity={0.7}
            >
              {testState === 'waiting' ? (
                <Animated.View style={{ opacity: blinkAnim }}>
                  <Ionicons name="arrow-back" size={100} color="#2196F3" />
                </Animated.View>
              ) : (
                targetDirection === 'left' && (
                  <Animated.View style={[
                    styles.activeArrowContainer,
                    { opacity: blinkAnim }
                  ]}>
                    <Ionicons name="arrow-back" size={100} color="#FFF" />
                  </Animated.View>
                )
              )}
            </TouchableOpacity>
            
            {/* RIGHT SIDE - Full half-screen tappable */}
            <TouchableOpacity
              style={[
                styles.halfScreen, 
                styles.rightSide,
                testState === 'waiting' && { backgroundColor: '#E3F2FD' }
              ]}
              onPress={() => handleDirectionTap('right')}
              disabled={testState === 'waiting'}
              activeOpacity={0.7}
            >
              {testState === 'waiting' ? (
                <Animated.View style={{ opacity: blinkAnim }}>
                  <Ionicons name="arrow-forward" size={100} color="#2196F3" />
                </Animated.View>
              ) : (
                targetDirection === 'right' && (
                  <Animated.View style={[
                    styles.activeArrowContainer,
                    { opacity: blinkAnim }
                  ]}>
                    <Ionicons name="arrow-forward" size={100} color="#FFF" />
                  </Animated.View>
                )
              )}
            </TouchableOpacity>
          </View>
        ) : (
            <View style={styles.statusContainer}>
              {testState === 'ready' && (
              <>
                <Ionicons name="compass-outline" size={64} color="#666" />
                <Text style={styles.statusText}>
                  Ready for Attempt {currentAttempt + 1}/2
                </Text>
                <Text style={styles.statusSubtext}>
                  Wait for instruction...
                </Text>
              </>
            )}

            {testState === 'complete' && (
              <>
                <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
                <Text style={styles.statusText}>Test Complete!</Text>
              </>
            )}
            </View>
        )}

        {testState === 'waiting' && (
          <View style={styles.waitingOverlay}>
            <Text style={styles.waitingText}>Wait for instruction...</Text>
          </View>
        )}
      </View>

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

      {attempts.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Results</Text>
          
          <View style={styles.attemptsGrid}>
            {attempts.map((attempt, index) => (
              <View key={index} style={styles.attemptCard}>
                <Text style={styles.attemptLabel}>
                  Attempt {index + 1}: {attempt.direction.toUpperCase()}
                </Text>
                <Text style={[styles.attemptTime, { color: getRatingColor(attempt.time) }]}>
                  {attempt.time}ms
                </Text>
              </View>
            ))}
          </View>

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

      <View style={styles.instructions}>
        <Ionicons name="information-circle-outline" size={18} color="#666" />
        <Text style={styles.instructionsText}>
          You'll do 2 random attempts. Each can be LEFT or RIGHT (completely unpredictable). Both arrows will blink, then instruction appears. Tap the correct side. Timer continues until correct side is tapped.
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
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  statusContainer: {
    alignItems: 'center',
    padding: 20,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 12,
  },
  statusSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  instructionBanner: {
    backgroundColor: '#F44336',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 2,
  },
  testArea: {
    height: 320,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  splitContainer: {
    flexDirection: 'row',
    width: '100%',
    minHeight: 300,
    flex: 1,
  },
  halfScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  leftSide: {
    borderRightWidth: 2,
    borderRightColor: '#E0E0E0',
  },
  rightSide: {
    borderLeftWidth: 2,
    borderLeftColor: '#E0E0E0',
  },
  activeArrowContainer: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    padding: 30,
    elevation: 8,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  waitingOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 8,
    zIndex: 10,
  },
  waitingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
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
    marginBottom: 16,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
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
    justifyContent: 'space-between',
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
    fontWeight: '600',
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
  },
  instructionsText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginLeft: 8,
  },
});

export default ReactionDirectionChoiceInput;