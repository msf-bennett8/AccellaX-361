// Location: /apps/assessment/src/components/metrics/GroupTestTracker.js
// Track multiple kids during group tests (Cooper run, beep test, etc.)

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * GroupTestTracker Component
 * Progressive marking for group tests where kids drop out at different times
 * 
 * @param {Object} props
 * @param {Array} props.kids - Array of kid objects
 * @param {string} props.metricId - Metric being tested
 * @param {string} props.metricName - Name of the metric
 * @param {string} props.metricType - 'timed' or 'distance'
 * @param {Function} props.onSave - Callback with results
 * @param {boolean} props.disabled - Disable input
 */
const GroupTestTracker = ({
  kids = [],
  metricId,
  metricName = 'Group Test',
  metricType = 'timed', // 'timed' or 'distance'
  onSave,
  disabled = false,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [kidResults, setKidResults] = useState({});
  const [activeKids, setActiveKids] = useState(kids.map((k) => k.id));
  const [selectedKid, setSelectedKid] = useState(null);
  const intervalRef = useRef(null);

  // Initialize kid results
  useEffect(() => {
    const initialResults = {};
    kids.forEach((kid) => {
      initialResults[kid.id] = {
        kidId: kid.id,
        kidName: kid.name,
        value: null,
        status: 'active', // 'active', 'completed', 'dropped'
        timestamp: null,
      };
    });
    setKidResults(initialResults);
  }, [kids]);

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 0.1);
      }, 100);
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
  }, [isRunning]);

  // Start test
  const handleStart = () => {
    if (disabled) return;
    setIsRunning(true);
    setElapsedTime(0);
  };

  // Stop test
  const handleStop = () => {
    setIsRunning(false);
  };

  // Mark kid as dropped (record their time/distance)
  const handleKidDrop = (kidId) => {
    if (!isRunning) return;

    setKidResults((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        value: metricType === 'timed' ? parseFloat(elapsedTime.toFixed(1)) : 0,
        status: 'completed',
        timestamp: new Date().toISOString(),
      },
    }));

    setActiveKids((prev) => prev.filter((id) => id !== kidId));

    // Auto-stop if all kids finished
    if (activeKids.length === 1) {
      setIsRunning(false);
    }
  };

  // Manual entry for kid
  const handleManualEntry = (kidId, value) => {
    setKidResults((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        value: parseFloat(value) || 0,
        status: 'completed',
        timestamp: new Date().toISOString(),
      },
    }));
  };

  // Mark kid as didn't attempt
  const handleKidAbsent = (kidId) => {
    setKidResults((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        status: 'dropped',
      },
    }));
    setActiveKids((prev) => prev.filter((id) => id !== kidId));
  };

  // Reset kid
  const handleKidReset = (kidId) => {
    setKidResults((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        value: null,
        status: 'active',
        timestamp: null,
      },
    }));
    if (!activeKids.includes(kidId)) {
      setActiveKids((prev) => [...prev, kidId]);
    }
  };

  // Save all results
  const handleSaveAll = () => {
    const results = Object.values(kidResults).filter((r) => r.status === 'completed');
    onSave(results);
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  // Calculate stats
  const stats = {
    total: kids.length,
    completed: Object.values(kidResults).filter((r) => r.status === 'completed').length,
    active: activeKids.length,
    dropped: Object.values(kidResults).filter((r) => r.status === 'dropped').length,
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{metricName}</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.statText}>
            {stats.completed}/{stats.total} completed
          </Text>
        </View>
      </View>

      {/* Timer Display */}
      <View style={styles.timerContainer}>
        <Text style={[styles.timerText, isRunning && styles.timerRunning]}>
          {formatTime(elapsedTime)}
        </Text>
        {isRunning && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Recording</Text>
          </View>
        )}
      </View>

      {/* Control Buttons */}
      <View style={styles.controls}>
        {!isRunning && elapsedTime === 0 && (
          <TouchableOpacity
            style={[styles.button, styles.startButton, disabled && styles.buttonDisabled]}
            onPress={handleStart}
            disabled={disabled}
          >
            <Ionicons name="play" size={24} color="#FFF" />
            <Text style={styles.buttonText}>Start Test</Text>
          </TouchableOpacity>
        )}

        {isRunning && (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={handleStop}
          >
            <Ionicons name="stop" size={24} color="#FFF" />
            <Text style={styles.buttonText}>Stop Test</Text>
          </TouchableOpacity>
        )}

        {!isRunning && elapsedTime > 0 && stats.completed > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSaveAll}
          >
            <Ionicons name="checkmark-circle" size={24} color="#FFF" />
            <Text style={styles.buttonText}>Save Results ({stats.completed})</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Kids List */}
      <ScrollView style={styles.kidsList} showsVerticalScrollIndicator={false}>
        {kids.map((kid) => {
          const result = kidResults[kid.id];
          if (!result) return null;

          const isActive = activeKids.includes(kid.id);
          const isCompleted = result.status === 'completed';
          const isDropped = result.status === 'dropped';

          return (
            <View
              key={kid.id}
              style={[
                styles.kidCard,
                isCompleted && styles.kidCardCompleted,
                isDropped && styles.kidCardDropped,
              ]}
            >
              {/* Kid Info */}
              <View style={styles.kidInfo}>
                <Text style={[styles.kidName, isDropped && styles.kidNameDropped]}>
                  {kid.name}
                </Text>
                {result.value !== null && (
                  <Text style={styles.kidValue}>
                    {metricType === 'timed'
                      ? formatTime(result.value)
                      : `${result.value}m`}
                  </Text>
                )}
                {isDropped && <Text style={styles.droppedText}>Did not attempt</Text>}
              </View>

              {/* Action Buttons */}
              <View style={styles.kidActions}>
                {isActive && isRunning && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.dropButton]}
                    onPress={() => handleKidDrop(kid.id)}
                  >
                    <Ionicons name="stop-circle" size={20} color="#F44336" />
                    <Text style={styles.actionButtonText}>Drop</Text>
                  </TouchableOpacity>
                )}

                {isActive && !isRunning && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.absentButton]}
                    onPress={() => handleKidAbsent(kid.id)}
                  >
                    <Ionicons name="close-circle" size={20} color="#999" />
                    <Text style={styles.actionButtonText}>Absent</Text>
                  </TouchableOpacity>
                )}

                {isCompleted && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.resetButton]}
                    onPress={() => handleKidReset(kid.id)}
                  >
                    <Ionicons name="refresh" size={20} color="#2196F3" />
                    <Text style={styles.actionButtonText}>Reset</Text>
                  </TouchableOpacity>
                )}

                {isDropped && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.resetButton]}
                    onPress={() => handleKidReset(kid.id)}
                  >
                    <Ionicons name="refresh" size={20} color="#2196F3" />
                    <Text style={styles.actionButtonText}>Undo</Text>
                  </TouchableOpacity>
                )}

                {/* Status Indicator */}
                {isCompleted && (
                  <View style={styles.statusBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Info */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={16} color="#666" />
        <Text style={styles.infoText}>
          Tap "Drop" when each kid finishes to record their time. Tap "Absent" for kids not
          participating.
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
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statsContainer: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196F3',
  },
  timerContainer: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 20,
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
  controls: {
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  saveButton: {
    backgroundColor: '#2196F3',
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
  kidsList: {
    maxHeight: 400,
  },
  kidCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  kidCardCompleted: {
    backgroundColor: '#E8F5E9',
    borderLeftColor: '#4CAF50',
  },
  kidCardDropped: {
    backgroundColor: '#F5F5F5',
    borderLeftColor: '#999',
    opacity: 0.6,
  },
  kidInfo: {
    flex: 1,
  },
  kidName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  kidNameDropped: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  kidValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  droppedText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  kidActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#FFF',
  },
  dropButton: {
    borderWidth: 1,
    borderColor: '#F44336',
  },
  absentButton: {
    borderWidth: 1,
    borderColor: '#999',
  },
  resetButton: {
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  actionButtonText: {
    fontSize: 12,
    marginLeft: 4,
  },
  statusBadge: {
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    lineHeight: 18,
  },
});

export default GroupTestTracker;