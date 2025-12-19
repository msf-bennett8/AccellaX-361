// Location: /apps/assessment/src/components/metrics/TimerAssessmentInput.js
// Timer-based assessment for timed tests (sprints, agility tests, etc.)

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

const TimerAssessmentInput = ({
  metric,
  value,
  onChange,
  previousValue,
  showPrevious,
  kidName,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0); // Time in milliseconds
  const [savedTime, setSavedTime] = useState(value ? parseFloat(value) * 1000 : 0);
  const [showRetestModal, setShowRetestModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (value && !isRunning) {
      setSavedTime(parseFloat(value) * 1000);
    }
  }, [value]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prev => prev + 10); // Update every 10ms
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
  }, [isRunning]);

  const handleStart = () => {
    setTime(0);
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleRecord = () => {
    const timeInSeconds = time / 1000;
    setSavedTime(time);
    onChange(timeInSeconds.toFixed(3));
    setShowRecordModal(true);
    
    // Auto-hide success modal after 2 seconds
    setTimeout(() => {
      setShowRecordModal(false);
    }, 2000);
  };

  const handleRetest = () => {
    setShowRetestModal(true);
  };

  const confirmRetest = () => {
    setTime(0);
    setSavedTime(0);
    setIsRunning(false);
    onChange('');
    setShowRetestModal(false);
  };

  const handleUsePrevious = () => {
    if (previousValue) {
      const timeInMs = parseFloat(previousValue) * 1000;
      setTime(timeInMs);
      setSavedTime(timeInMs);
      onChange(previousValue);
    }
  };

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (savedTime > 0) return COLORS.success;
    if (isRunning) return COLORS.error;
    return COLORS.text;
  };

  const displayTime = savedTime > 0 ? savedTime : time;

  return (
    <View style={styles.container}>
      {/* Test Info */}
      <View style={styles.testInfo}>
        <View style={styles.testIconContainer}>
          <Ionicons name="timer-outline" size={32} color={COLORS.primary} />
        </View>
        <View style={styles.testDetails}>
          <Text style={styles.testName}>{metric.name}</Text>
          <Text style={styles.testKid}>{kidName}</Text>
        </View>
      </View>

      {/* Timer Display */}
      <View style={[
        styles.timerDisplay,
        isRunning && styles.timerDisplayActive,
        savedTime > 0 && styles.timerDisplaySaved,
      ]}>
        {isRunning && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>RECORDING</Text>
          </View>
        )}
        
        <Text style={[styles.timerText, { color: getTimerColor() }]}>
          {formatTime(displayTime)}
        </Text>
        
        {savedTime > 0 && (
          <View style={styles.savedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.savedText}>Recorded</Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {!isRunning && savedTime === 0 && time === 0 && (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={handleStart}
          >
            <Ionicons name="play" size={24} color={COLORS.white} />
            <Text style={styles.buttonText}>Start Timer</Text>
          </TouchableOpacity>
        )}

        {isRunning && (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={handleStop}
          >
            <Ionicons name="stop" size={24} color={COLORS.white} />
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>
        )}

        {!isRunning && time > 0 && savedTime === 0 && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.recordButton]}
              onPress={handleRecord}
            >
              <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
              <Text style={styles.buttonText}>Record Time</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.retestButton]}
              onPress={handleRetest}
            >
              <Ionicons name="refresh" size={24} color={COLORS.white} />
              <Text style={styles.buttonText}>Retest</Text>
            </TouchableOpacity>
          </View>
        )}

        {savedTime > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.retestButton]}
            onPress={handleRetest}
          >
            <Ionicons name="refresh" size={24} color={COLORS.white} />
            <Text style={styles.buttonText}>Retest</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Previous Value Reference */}
      {showPrevious && previousValue && savedTime === 0 && (
        <View style={styles.previousCard}>
          <View style={styles.previousLeft}>
            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            <View style={styles.previousContent}>
              <Text style={styles.previousLabel}>Previous Assessment:</Text>
              <Text style={styles.previousValue}>
                {formatTime(parseFloat(previousValue) * 1000)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.usePreviousButton}
            onPress={handleUsePrevious}
          >
            <Ionicons name="arrow-down-circle" size={20} color={COLORS.primary} />
            <Text style={styles.usePreviousText}>Use</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Retest Confirmation Modal */}
      <Modal
        visible={showRetestModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRetestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="refresh-circle" size={48} color={COLORS.warning} />
            </View>
            
            <Text style={styles.modalTitle}>Retest?</Text>
            <Text style={styles.modalMessage}>
              Start a new attempt? Previous time will be replaced if you record.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowRetestModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmRetest}
              >
                <Text style={styles.modalButtonText}>Retest</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Record Success Modal */}
      <Modal
        visible={showRecordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRecordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
            </View>
            
            <Text style={styles.modalTitle}>Time Recorded!</Text>
            <Text style={styles.modalMessage}>
              {formatTime(savedTime)} recorded for {kidName}
            </Text>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonConfirm, { width: '100%' }]}
              onPress={() => setShowRecordModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Instructions */}
      <View style={styles.instructionBox}>
        <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
        <Text style={styles.instructionText}>
          {isRunning 
            ? 'Tap Stop when the kid completes the test'
            : savedTime > 0
              ? 'Time recorded. Tap Retest to measure again.'
              : 'Tap Start Timer when the kid begins the test'
          }
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  // Test Info
  testInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  testIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  testDetails: {
    flex: 1,
  },
  testName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  testKid: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  
  // Timer Display
  timerDisplay: {
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  timerDisplayActive: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.error + '10',
  },
  timerDisplaySaved: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + '10',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.error,
  },
  recordingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.error,
    letterSpacing: 1,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
    gap: 6,
  },
  savedText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },
  
  // Controls
  controls: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  startButton: {
    backgroundColor: COLORS.success,
  },
  stopButton: {
    backgroundColor: COLORS.error,
  },
  recordButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  retestButton: {
    flex: 1,
    backgroundColor: COLORS.warning,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  
  // Previous Value
  previousCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight + '20',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  previousLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  previousContent: {
    flex: 1,
  },
  previousLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  previousValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  usePreviousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  usePreviousText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  
  // Instructions
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  instructionText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: COLORS.backgroundDark,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  modalButtonConfirm: {
    backgroundColor: COLORS.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default TimerAssessmentInput;
