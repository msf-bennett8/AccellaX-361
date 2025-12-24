// Location: /apps/assessment/src/components/metrics/ReactionGoNoGoInput.js
// Test 5: Go/No-Go Inhibition Test - FIXED: Red circle timeout + tap counting

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

const ReactionGoNoGoInput = ({ value, onChange, metric }) => {
  const [testState, setTestState] = useState('ready');
  const [attempts, setAttempts] = useState([]);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [averageTime, setAverageTime] = useState(value || null);
  const [currentSignal, setCurrentSignal] = useState(null);
  
  // ✅ NEW: Track NO-GO tap count
  const [noGoTapCount, setNoGoTapCount] = useState(0);
  const [showWrongTapFeedback, setShowWrongTapFeedback] = useState(false);
  
  const startTimeRef = useRef(null);
  const timeoutRef = useRef(null);
  const responseTimeoutRef = useRef(null);
  const soundRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // ✅ Generate random test sequence each time
  const [testSequence, setTestSequence] = useState([]);

  useEffect(() => {
    generateTestSequence();
  }, []);

  const generateTestSequence = () => {
    const noGoPosition = Math.floor(Math.random() * 4);
    const sequence = [0, 1, 2, 3].map(i => i === noGoPosition ? 'nogo' : 'go');
    setTestSequence(sequence);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (testState === 'responding') {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [testState]);

  const playBeepAndVibrate = async (isGoSignal) => {
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
          
          // Different frequency for GO vs NO-GO
          oscillator.frequency.value = isGoSignal ? 800 : 400;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        }
      }
      
      if (Platform.OS !== 'web') {
        // Different vibration pattern for GO vs NO-GO
        Vibration.vibrate(isGoSignal ? [0, 100] : [0, 200, 100, 200]);
      }
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
    if (testSequence.length === 0) return;
    
    const signal = testSequence[currentAttempt];
    setCurrentSignal(signal);
    setTestState('waiting');
    setShowWrongTapFeedback(false);
    
    const delay = 1000 + Math.random() * 2000;
    
    timeoutRef.current = setTimeout(() => {
      setTestState('responding');
      startTimeRef.current = Date.now();
      playBeepAndVibrate(signal === 'go'); // ✅ Play beep/vibrate when signal appears
      
      if (signal === 'go') {
        // ✅ GO signal: 2 second timeout for miss
        responseTimeoutRef.current = setTimeout(() => {
          if (testState === 'responding') {
            handleMiss();
          }
        }, 2000);
      } else {
        // ✅ NO-GO signal: 1.5 second timeout - then auto-advance
        responseTimeoutRef.current = setTimeout(() => {
          handleNoGoSuccess();
        }, 1500);
      }
    }, delay);
  };

  const handleScreenTap = () => {
    if (testState !== 'responding') return;

    const reactionTime = Date.now() - startTimeRef.current;

    if (currentSignal === 'go') {
      // ✅ Correct - tapped on GREEN
      clearTimeout(responseTimeoutRef.current);
      
      // ✅ Success feedback (subtle reinforcement)
      if (Platform.OS !== 'web') {
        Vibration.vibrate(100);
      }
      
      const newAttempts = [...attempts, reactionTime];
      setAttempts(newAttempts);
      setCurrentAttempt(prev => prev + 1);

      if (currentAttempt + 1 >= 4) {
        calculateAverage(newAttempts);
      } else {
        setTestState('ready');
      }
    } else {
      // ❌ Wrong - tapped on RED (NO-GO)
      setNoGoTapCount(prev => prev + 1);
      setShowWrongTapFeedback(true);
      
      // ✅ Error feedback
      playErrorFeedback();
      
      // ✅ Shake animation
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      
      // ✅ Don't advance - let timeout handle it
      // User can tap multiple times (each counts as error)
    }
  };

  const handleMiss = () => {
    // ✅ Missed GO signal - heavy penalty
    clearTimeout(responseTimeoutRef.current);
    
    const newAttempts = [...attempts, 3000];
    setAttempts(newAttempts);
    setCurrentAttempt(prev => prev + 1);
    setTestState('ready');

    if (currentAttempt + 1 >= 4) {
      calculateAverage(newAttempts);
    }
  };

  const handleNoGoSuccess = () => {
    // ✅ NO-GO timeout reached - advance to next trial
    clearTimeout(responseTimeoutRef.current);
    setCurrentAttempt(prev => prev + 1);
    setTestState('ready');

    if (currentAttempt + 1 >= 4) {
      calculateAverage(attempts);
    }
  };

  const calculateAverage = (finalAttempts) => {
    if (finalAttempts.length === 0) {
      setAverageTime(3000);
      onChange('3000');
    } else {
      let avg = Math.round(finalAttempts.reduce((a, b) => a + b, 0) / finalAttempts.length);
      
      // ✅ Penalty based on number of NO-GO taps
      if (noGoTapCount > 0) {
        const penaltyMultiplier = 1 + (noGoTapCount * 0.3); // 30% penalty per tap
        avg = Math.round(avg * penaltyMultiplier);
      }
      
      setAverageTime(avg);
      onChange(String(avg));
    }
    setTestState('complete');
    
    // ✅ Completion feedback
    playCompletionFeedback();
  };

  const resetTest = () => {
    setTestState('ready');
    setAttempts([]);
    setCurrentAttempt(0);
    setAverageTime(null);
    setCurrentSignal(null);
    setNoGoTapCount(0);
    setShowWrongTapFeedback(false);
    onChange('');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
    
    // ✅ Generate new random sequence
    generateTestSequence();
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
        <Ionicons name="hand-right" size={24} color="#2196F3" />
        <Text style={styles.title}>Go/No-Go Inhibition Test</Text>
      </View>

      <Text style={styles.description}>
        Tap only on GREEN circles. Do NOT tap on RED circles!
      </Text>

      {testState !== 'complete' && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Trial {currentAttempt + 1} / 4</Text>
          <View style={styles.progressBar}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i < currentAttempt && styles.progressDotComplete,
                  i === currentAttempt && styles.progressDotActive,
                ]}
              />
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.testArea}
        onPress={handleScreenTap}
        disabled={testState !== 'responding'}
        activeOpacity={1}
      >
        {testState === 'ready' && (
          <View style={styles.statusContainer}>
            <Ionicons name="ellipse-outline" size={64} color="#666" />
            <Text style={styles.statusText}>Ready for Trial {currentAttempt + 1}</Text>
            <Text style={styles.statusSubtext}>Focus and get ready...</Text>
          </View>
        )}

        {testState === 'waiting' && (
          <View style={styles.statusContainer}>
            <Ionicons name="hourglass" size={64} color="#FF9800" />
            <Text style={styles.statusText}>Watch carefully...</Text>
          </View>
        )}

        {testState === 'responding' && (
          <View style={styles.respondingContainer}>
            <Animated.View style={{
              transform: [
                { scale: scaleAnim },
                { translateX: shakeAnim }
              ]
            }}>
              <View
                style={[
                  styles.signalCircle,
                  currentSignal === 'go' ? styles.goCircle : styles.nogoCircle,
                ]}
              >
                <Text style={styles.signalText}>
                  {currentSignal === 'go' ? 'GO' : 'NO-GO'}
                </Text>
              </View>
            </Animated.View>
            
            {/* ✅ Wrong tap feedback */}
            {showWrongTapFeedback && (
              <View style={styles.wrongTapFeedback}>
                <Ionicons name="close-circle" size={32} color="#F44336" />
                <Text style={styles.wrongTapText}>Don't tap RED!</Text>
              </View>
            )}
          </View>
        )}

        {testState === 'complete' && (
          <View style={styles.statusContainer}>
            <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            <Text style={styles.statusText}>Test Complete!</Text>
            {noGoTapCount > 0 && (
              <Text style={styles.penaltyText}>
                ⚠️ {noGoTapCount} NO-GO error{noGoTapCount > 1 ? 's' : ''} detected
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>

      {testState === 'ready' && (
        <TouchableOpacity style={styles.startButton} onPress={startTest}>
          <Ionicons name="play" size={24} color="#FFF" />
          <Text style={styles.startButtonText}>
            Start Trial {currentAttempt + 1}
          </Text>
        </TouchableOpacity>
      )}

      {testState === 'complete' && (
        <TouchableOpacity style={styles.resetButton} onPress={resetTest}>
          <Ionicons name="refresh" size={20} color="#666" />
          <Text style={styles.resetButtonText}>Reset Test</Text>
        </TouchableOpacity>
      )}

      {testState === 'complete' && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Results</Text>
          
          {attempts.length > 0 && (
            <View style={styles.goTrialsContainer}>
              <Text style={styles.goTrialsTitle}>GO Trials:</Text>
              <View style={styles.goTrialsGrid}>
                {attempts.map((time, index) => (
                  <View key={index} style={styles.goTrialCard}>
                    <Text style={styles.goTrialLabel}>GO {index + 1}</Text>
                    <Text style={[styles.goTrialTime, { color: time >= 3000 ? '#F44336' : getRatingColor(time) }]}>
                      {time >= 3000 ? 'Miss' : `${time}ms`}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ✅ Enhanced NO-GO Result */}
          <View style={styles.nogoResultCard}>
            <View style={styles.nogoResultHeader}>
              <Text style={styles.nogoResultLabel}>NO-GO Trial:</Text>
              <View style={[
                styles.nogoStatusBadge,
                { backgroundColor: noGoTapCount > 0 ? '#FFEBEE' : '#E8F5E9' }
              ]}>
                <Ionicons
                  name={noGoTapCount > 0 ? 'close-circle' : 'checkmark-circle'}
                  size={16}
                  color={noGoTapCount > 0 ? '#F44336' : '#4CAF50'}
                />
                <Text style={[
                  styles.nogoStatusText,
                  { color: noGoTapCount > 0 ? '#F44336' : '#4CAF50' }
                ]}>
                  {noGoTapCount > 0 ? `Failed (${noGoTapCount} tap${noGoTapCount > 1 ? 's' : ''})` : 'Success'}
                </Text>
              </View>
            </View>
            <Text style={styles.nogoResultDescription}>
              {noGoTapCount > 0
                ? `You tapped the RED circle ${noGoTapCount} time${noGoTapCount > 1 ? 's' : ''} - impulse control needs work`
                : 'You successfully inhibited the response!'
              }
            </Text>
          </View>

          <View style={styles.averageCard}>
            <View style={styles.averageHeader}>
              <Text style={styles.averageLabel}>Overall Score</Text>
              <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(averageTime) + '20' }]}>
                <Text style={[styles.ratingText, { color: getRatingColor(averageTime) }]}>
                  {getRatingLabel(averageTime)}
                </Text>
              </View>
            </View>
            <Text style={[styles.averageValue, { color: getRatingColor(averageTime) }]}>
              {averageTime} ms
            </Text>
            {noGoTapCount > 0 && (
              <Text style={styles.penaltyNote}>
                * Includes {noGoTapCount * 30}% penalty for NO-GO error{noGoTapCount > 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.instructions}>
        <Ionicons name="information-circle-outline" size={18} color="#666" />
        <Text style={styles.instructionsText}>
          You'll complete 4 trials: 3 will show GREEN circles (tap immediately), and 1 will show a RED circle (do NOT tap). The RED circle will disappear after 1.5 seconds. Tests impulse control and focus.
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
  progressContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  progressDotComplete: {
    backgroundColor: '#4CAF50',
  },
  progressDotActive: {
    backgroundColor: '#2196F3',
  },
  testArea: {
    minHeight: 300,
    borderRadius: 16,
    borderWidth: 3,
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
  respondingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  signalCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  goCircle: {
    backgroundColor: '#4CAF50',
  },
  nogoCircle: {
    backgroundColor: '#F44336',
  },
  signalText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  wrongTapFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  wrongTapText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
  },
  penaltyText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '600',
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
  goTrialsContainer: {
    marginBottom: 16,
  },
  goTrialsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  goTrialsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goTrialCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    minWidth: '30%',
  },
  goTrialLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  goTrialTime: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  nogoResultCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  nogoResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nogoResultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  nogoStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nogoStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  nogoResultDescription: {
    fontSize: 13,
    color: '#666',
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
  penaltyNote: {
    fontSize: 11,
    color: '#F44336',
    marginTop: 4,
    fontStyle: 'italic',
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

export default ReactionGoNoGoInput;