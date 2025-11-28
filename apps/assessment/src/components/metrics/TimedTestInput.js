// Location: /apps/assessment/src/components/metrics/TimedTestInput.js
// Stopwatch component for timed tests (sprints, runs, etc.)

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * TimedTestInput Component
 * Stopwatch for timed assessments (100m sprint, shuttle run, etc.)
 * 
 * @param {Object} props
 * @param {string} props.metricName - Name of the metric (e.g., "100m Sprint")
 * @param {string} props.unit - Time unit (default: "seconds")
 * @param {number} props.value - Current time value in seconds
 * @param {Function} props.onChange - Callback with time in seconds
 * @param {number} props.maxTime - Maximum allowed time (default: 300s = 5 min)
 * @param {boolean} props.disabled - Disable input
 * @param {string} props.previousValue - Previous assessment value for reference
 */
const TimedTestInput = ({
  metricName = 'Timed Test',
  unit = 'seconds',
  value = 0,
  onChange,
  maxTime = 300,
  disabled = false,
  previousValue = null,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(value || 0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Start pulse animation when running
  useEffect(() => {
    if (isRunning && !isPaused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRunning, isPaused]);

  // Timer logic
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime + 0.01; // 10ms precision
          if (newTime >= maxTime) {
            handleStop();
            return maxTime;
          }
          return newTime;
        });
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);

  // Start/Resume timer
  const handleStart = () => {
    if (disabled) return;
    setIsRunning(true);
    setIsPaused(false);
  };

  // Pause timer
  const handlePause = () => {
    setIsPaused(true);
  };

  // Stop timer and save value
  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    onChange(parseFloat(time.toFixed(2)));
  };

  // Reset timer
  const handleReset = () => {
    if (disabled) return;
    setIsRunning(false);
    setIsPaused(false);
    setTime(0);
    onChange(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // Format time as MM:SS.ms
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Calculate improvement
  const getImprovement = () => {
    if (!previousValue || previousValue === 0 || time === 0) return null;
    const diff = previousValue - time;
    const percentChange = (diff / previousValue) * 100;
    return {
      diff: Math.abs(diff).toFixed(2),
      percent: Math.abs(percentChange).toFixed(1),
      improved: diff > 0, // Lower time = better
    };
  };

  const improvement = getImprovement();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.metricName}>{metricName}</Text>
        {previousValue && (
          <View style={styles.previousBadge}>
            <Ionicons name="time-outline" size={12} color="#666" />
            <Text style={styles.previousText}>
              Previous: {formatTime(previousValue)}
            </Text>
          </View>
        )}
      </View>

      {/* Timer Display */}
      <Animated.View
        style={[
          styles.timerDisplay,
          isRunning && !isPaused && { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <Text style={[styles.timerText, isRunning && styles.timerRunning]}>
          {formatTime(time)}
        </Text>
        {isRunning && !isPaused && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Recording</Text>
          </View>
        )}
        {isPaused && (
          <Text style={styles.pausedText}>PAUSED</Text>
        )}
      </Animated.View>

      {/* Improvement Indicator */}
      {improvement && !isRunning && time > 0 && (
        <View
          style={[
            styles.improvementBadge,
            { backgroundColor: improvement.improved ? '#E8F5E9' : '#FFEBEE' },
          ]}
        >
          <Ionicons
            name={improvement.improved ? 'trending-down' : 'trending-up'}
            size={16}
            color={improvement.improved ? '#4CAF50' : '#F44336'}
          />
          <Text
            style={[
              styles.improvementText,
              { color: improvement.improved ? '#4CAF50' : '#F44336' },
            ]}
          >
            {improvement.improved ? '↓' : '↑'} {improvement.diff}s ({improvement.percent}%)
          </Text>
        </View>
      )}

      {/* Control Buttons */}
      <View style={styles.controls}>
        {!isRunning && time === 0 && (
          <TouchableOpacity
            style={[styles.button, styles.startButton, disabled && styles.buttonDisabled]}
            onPress={handleStart}
            disabled={disabled}
          >
            <Ionicons name="play" size={24} color="#FFF" />
            <Text style={styles.buttonText}>Start</Text>
          </TouchableOpacity>
        )}

        {isRunning && !isPaused && (
          <>
            <TouchableOpacity
              style={[styles.button, styles.pauseButton]}
              onPress={handlePause}
            >
              <Ionicons name="pause" size={24} color="#FFF" />
              <Text style={styles.buttonText}>Pause</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={handleStop}
            >
              <Ionicons name="stop" size={24} color="#FFF" />
              <Text style={styles.buttonText}>Stop</Text>
            </TouchableOpacity>
          </>
        )}

        {isPaused && (
          <>
            <TouchableOpacity
              style={[styles.button, styles.resumeButton]}
              onPress={handleStart}
            >
              <Ionicons name="play" size={24} color="#FFF" />
              <Text style={styles.buttonText}>Resume</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={handleStop}
            >
              <Ionicons name="stop" size={24} color="#FFF" />
              <Text style={styles.buttonText}>Stop</Text>
            </TouchableOpacity>
          </>
        )}

        {!isRunning && time > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.resetButton, disabled && styles.buttonDisabled]}
            onPress={handleReset}
            disabled={disabled}
          >
            <Ionicons name="refresh" size={24} color="#666" />
            <Text style={[styles.buttonText, { color: '#666' }]}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Result Display */}
      {!isRunning && time > 0 && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Final Time:</Text>
          <Text style={styles.resultValue}>
            {time.toFixed(2)} {unit}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  previousBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previousText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  timerDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingVertical: 32,
    marginBottom: 16,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    fontVariant: ['tabular-nums'],
  },
  timerRunning: {
    color: '#2196F3',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F44336',
    marginRight: 6,
  },
  recordingText: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '600',
  },
  pausedText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
    marginTop: 8,
  },
  improvementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  improvementText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  pauseButton: {
    backgroundColor: '#FF9800',
  },
  resumeButton: {
    backgroundColor: '#2196F3',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  resetButton: {
    backgroundColor: '#E0E0E0',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  resultContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
});

export default TimedTestInput;