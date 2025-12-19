// Location: /apps/assessment/src/components/metrics/BeepTestLiveTracker.js
// Live Beep Test Tracker with audio beeps and real-time kid tracking

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { COLORS } from '../../utils/constants';

// Beep Test Protocol - Official Multi-Stage Fitness Test
const BEEP_TEST_LEVELS = [
  { level: 1, shuttles: 7, speed: 8.5, interval: 9.0 },
  { level: 2, shuttles: 8, speed: 9.0, interval: 8.0 },
  { level: 3, shuttles: 8, speed: 9.5, interval: 7.58 },
  { level: 4, shuttles: 9, speed: 10.0, interval: 7.2 },
  { level: 5, shuttles: 9, speed: 10.5, interval: 6.86 },
  { level: 6, shuttles: 10, speed: 11.0, interval: 6.55 },
  { level: 7, shuttles: 10, speed: 11.5, interval: 6.26 },
  { level: 8, shuttles: 11, speed: 12.0, interval: 6.0 },
  { level: 9, shuttles: 11, speed: 12.5, interval: 5.76 },
  { level: 10, shuttles: 11, speed: 13.0, interval: 5.54 },
  { level: 11, shuttles: 12, speed: 13.5, interval: 5.33 },
  { level: 12, shuttles: 12, speed: 14.0, interval: 5.14 },
  { level: 13, shuttles: 13, speed: 14.5, interval: 4.97 },
  { level: 14, shuttles: 13, speed: 15.0, interval: 4.8 },
  { level: 15, shuttles: 13, speed: 15.5, interval: 4.65 },
  { level: 16, shuttles: 14, speed: 16.0, interval: 4.5 },
  { level: 17, shuttles: 14, speed: 16.5, interval: 4.36 },
  { level: 18, shuttles: 15, speed: 17.0, interval: 4.24 },
  { level: 19, shuttles: 15, speed: 17.5, interval: 4.11 },
  { level: 20, shuttles: 16, speed: 18.0, interval: 4.0 },
  { level: 21, shuttles: 16, speed: 18.5, interval: 3.89 },
];

const BeepTestLiveTracker = ({ kids = [], onSave, onCancel }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentShuttle, setCurrentShuttle] = useState(1);
  const [kidResults, setKidResults] = useState({});
  const [activeKids, setActiveKids] = useState([]);
  const [sound, setSound] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showNoResultsModal, setShowNoResultsModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  const intervalRef = useRef(null);
  const levelData = BEEP_TEST_LEVELS[currentLevel - 1];

  // Initialize kid results
  useEffect(() => {
    const initialResults = {};
    const initialActive = [];
    
    kids.forEach((kid) => {
      initialResults[kid.id] = {
        kidId: kid.id,
        kidName: kid.name,
        level: null,
        shuttle: null,
        status: 'active',
        timestamp: null,
      };
      initialActive.push(kid.id);
    });
    
    setKidResults(initialResults);
    setActiveKids(initialActive);
  }, [kids]);

  // Load beep sound
  useEffect(() => {
    loadBeepSound();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const loadBeepSound = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      
      // Use a simple beep tone (you can replace with actual beep test audio file)
      const { sound: beepSound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/beep.mp3'), // You'll need to add this file
        { shouldPlay: false }
      );
      setSound(beepSound);
    } catch (error) {
      console.error('Error loading beep sound:', error);
    }
  };

  const playBeep = async () => {
    if (sound) {
      try {
        await sound.replayAsync();
      } catch (error) {
        console.error('Error playing beep:', error);
      }
    }
  };

  // Start the test
  const handleStart = () => {
    setIsRunning(true);
    setCurrentLevel(1);
    setCurrentShuttle(1);
    startBeepInterval();
  };

  // Stop the test
  const handleStop = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // Reset the test
  const handleReset = () => {
    setShowResetModal(true);
  };

  const confirmReset = () => {
    handleStop();
    setCurrentLevel(1);
    setCurrentShuttle(1);
    
    const resetResults = {};
    const resetActive = [];
    kids.forEach((kid) => {
      resetResults[kid.id] = {
        kidId: kid.id,
        kidName: kid.name,
        level: null,
        shuttle: null,
        status: 'active',
        timestamp: null,
      };
      resetActive.push(kid.id);
    });
    setKidResults(resetResults);
    setActiveKids(resetActive);
    setShowResetModal(false);
  };

  // Beep interval logic
  const startBeepInterval = () => {
    const levelInfo = BEEP_TEST_LEVELS[0];
    const interval = levelInfo.interval * 1000; // Convert to milliseconds
    
    playBeep();
    
    intervalRef.current = setInterval(() => {
      playBeep();
      
      setCurrentShuttle((prevShuttle) => {
        const currentLevelInfo = BEEP_TEST_LEVELS[currentLevel - 1];
        
        if (prevShuttle >= currentLevelInfo.shuttles) {
          // Move to next level
          setCurrentLevel((prevLevel) => {
            const nextLevel = prevLevel + 1;
            
            if (nextLevel > BEEP_TEST_LEVELS.length) {
              // Test complete
              handleStop();
              return prevLevel;
            }
            
            // Update interval for new level
            clearInterval(intervalRef.current);
            const newLevelInfo = BEEP_TEST_LEVELS[nextLevel - 1];
            const newInterval = newLevelInfo.interval * 1000;
            
            intervalRef.current = setInterval(() => {
              playBeep();
              setCurrentShuttle((s) => s + 1);
            }, newInterval);
            
            return nextLevel;
          });
          
          return 1; // Reset shuttle count
        }
        
        return prevShuttle + 1;
      });
    }, interval);
  };

  // Mark kid as dropped out
  const handleKidDrop = (kidId) => {
    setKidResults((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        level: currentLevel,
        shuttle: currentShuttle,
        status: 'completed',
        timestamp: new Date().toISOString(),
      },
    }));
    
    setActiveKids((prev) => prev.filter((id) => id !== kidId));
    
    // Auto-stop if all kids are done
    if (activeKids.length === 1) {
      handleStop();
    }
  };

  // Reset a kid
  const handleKidReset = (kidId) => {
    setKidResults((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        level: null,
        shuttle: null,
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
    const completedResults = Object.values(kidResults).filter(
      (r) => r.status === 'completed'
    );
    
    if (completedResults.length === 0) {
      setShowNoResultsModal(true);
      return;
    }
    
    setShowSaveModal(true);
  };

  const confirmSave = () => {
    const completedResults = Object.values(kidResults).filter(
      (r) => r.status === 'completed'
    );
    setShowSaveModal(false);
    onSave(completedResults);
  };

  // Filter kids by team
  const getKidsByTeam = () => {
    const TEAMS = ['fire', 'ice', 'water', 'wind', 'earth'];
    const grouped = {};
    
    TEAMS.forEach(team => {
      grouped[team] = kids.filter(kid => kid.house_team === team);
    });
    
    grouped['no_team'] = kids.filter(kid => !kid.house_team);
    
    return grouped;
  };

  const teamColors = {
    fire: '#FF5722',
    ice: '#2196F3',
    water: '#00BCD4',
    wind: '#9E9E9E',
    earth: '#8BC34A',
  };

  const teamIcons = {
    fire: 'flame',
    ice: 'snow',
    water: 'water',
    wind: 'cloud',
    earth: 'leaf',
  };

  const renderKidCard = (kid) => {
    const result = kidResults[kid.id];
    if (!result) return null;
    
    const isActive = activeKids.includes(kid.id);
    const isCompleted = result.status === 'completed';
    
    return (
      <TouchableOpacity
        key={kid.id}
        style={[
          styles.kidCard,
          isCompleted && styles.kidCardCompleted,
          !isActive && !isCompleted && styles.kidCardInactive,
        ]}
        onPress={() => {
          if (isRunning && isActive) {
            handleKidDrop(kid.id);
          }
        }}
        activeOpacity={isRunning && isActive ? 0.7 : 1}
      >
        <View style={styles.kidCardLeft}>
          <Text style={[styles.kidCardName, !isActive && styles.kidCardNameInactive]}>
            {kid.name}
          </Text>
          {isCompleted && result.level && (
            <Text style={styles.kidCardResult}>
              Level {result.level}.{result.shuttle}
            </Text>
          )}
          {!isActive && !isCompleted && (
            <Text style={styles.kidCardInactiveText}>Not participating</Text>
          )}
        </View>
        
        <View style={styles.kidCardRight}>
          {isActive && isRunning && (
            <View style={styles.activeIndicator}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Active</Text>
            </View>
          )}
          
          {isCompleted && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => handleKidReset(kid.id)}
            >
              <Ionicons name="refresh" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const kidsByTeam = getKidsByTeam();
  const completedCount = Object.values(kidResults).filter(r => r.status === 'completed').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Beep Test - Live Tracker</Text>
        <Text style={styles.subtitle}>
          {kids.length} participant{kids.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Current Level Display */}
      <View style={styles.levelDisplay}>
        <View style={styles.levelMainContainer}>
          <Text style={styles.levelLabel}>LEVEL</Text>
          <Text style={[styles.levelNumber, isRunning && styles.levelNumberActive]}>
            {currentLevel}
          </Text>
          <Text style={styles.levelSpeed}>{levelData?.speed} km/h</Text>
        </View>
        
        <View style={styles.levelDivider} />
        
        <View style={styles.levelMainContainer}>
          <Text style={styles.levelLabel}>SHUTTLE</Text>
          <Text style={[styles.levelNumber, isRunning && styles.levelNumberActive]}>
            {currentShuttle}
          </Text>
          <Text style={styles.levelSpeed}>of {levelData?.shuttles}</Text>
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.controls}>
        {!isRunning && currentLevel === 1 && currentShuttle === 1 && (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={handleStart}
          >
            <Ionicons name="play" size={24} color={COLORS.white} />
            <Text style={styles.buttonText}>Start Test</Text>
          </TouchableOpacity>
        )}

        {isRunning && (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={handleStop}
          >
            <Ionicons name="pause" size={24} color={COLORS.white} />
            <Text style={styles.buttonText}>Pause Test</Text>
          </TouchableOpacity>
        )}

        {!isRunning && (currentLevel > 1 || currentShuttle > 1 || completedCount > 0) && (
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={[styles.button, styles.resumeButton]}
              onPress={handleStart}
            >
              <Ionicons name="play" size={20} color={COLORS.white} />
              <Text style={styles.buttonText}>Resume</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={handleReset}
            >
              <Ionicons name="refresh" size={20} color={COLORS.white} />
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        )}

        {completedCount > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSaveAll}
          >
            <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
            <Text style={styles.buttonText}>
              Save Results ({completedCount})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Instructions */}
      {isRunning && (
        <View style={styles.instructionBanner}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.instructionText}>
            Tap on a kid's name when they drop out to record their level
          </Text>
        </View>
      )}

      {/* Kids List by Team */}
      <ScrollView style={styles.kidsList} showsVerticalScrollIndicator={false}>
        {Object.keys(kidsByTeam).map(teamId => {
          const teamKids = kidsByTeam[teamId];
          if (teamKids.length === 0) return null;
          
          const teamName = teamId === 'no_team' ? 'No Team' : `${teamId.charAt(0).toUpperCase() + teamId.slice(1)} Team`;
          const teamColor = teamColors[teamId] || '#9E9E9E';
          const teamIcon = teamIcons[teamId] || 'people';
          
          return (
            <View key={teamId} style={styles.teamSection}>
              <View style={[styles.teamHeader, { backgroundColor: teamColor + '20' }]}>
                <View style={styles.teamHeaderLeft}>
                  <Ionicons name={teamIcon} size={20} color={teamColor} />
                  <Text style={[styles.teamHeaderText, { color: teamColor }]}>
                    {teamName}
                  </Text>
                </View>
                <Text style={styles.teamHeaderCount}>{teamKids.length}</Text>
              </View>
              
              {teamKids.map(kid => renderKidCard(kid))}
            </View>
          );
        })}
      </ScrollView>

      {/* Cancel Button */}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onCancel}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>

      {/* Reset Modal */}
      <Modal visible={showResetModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="refresh-circle" size={48} color={COLORS.warning} />
            </View>
            <Text style={styles.modalTitle}>Reset Test?</Text>
            <Text style={styles.modalMessage}>
              This will clear all recorded results. Continue?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowResetModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDestructive]}
                onPress={confirmReset}
              >
                <Text style={styles.modalButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* No Results Modal */}
      <Modal visible={showNoResultsModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="alert-circle" size={48} color={COLORS.warning} />
            </View>
            <Text style={styles.modalTitle}>No Results</Text>
            <Text style={styles.modalMessage}>
              No kids have been marked as dropped out yet.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonFull]}
              onPress={() => setShowNoResultsModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Save Confirmation Modal */}
      <Modal visible={showSaveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
            </View>
            <Text style={styles.modalTitle}>Save Results?</Text>
            <Text style={styles.modalMessage}>
              Save beep test results for {Object.values(kidResults).filter(r => r.status === 'completed').length} kid(s)?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowSaveModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton]}
                onPress={confirmSave}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  
  // Level Display
  levelDisplay: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  levelMainContainer: {
    flex: 1,
    alignItems: 'center',
  },
  levelLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  levelNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  levelNumberActive: {
    color: COLORS.primary,
  },
  levelSpeed: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  levelDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 20,
  },
  
  // Controls
  controls: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  startButton: {
    backgroundColor: COLORS.success,
  },
  stopButton: {
    backgroundColor: COLORS.error,
  },
  resumeButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  resetButton: {
    flex: 1,
    backgroundColor: COLORS.textSecondary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  controlRow: {
    flexDirection: 'row',
    gap: 8,
  },
  
  // Instructions
  instructionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight + '20',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primary,
    lineHeight: 18,
  },
  
  // Kids List
  kidsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  teamSection: {
    marginBottom: 16,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  teamHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamHeaderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  teamHeaderCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  
  // Kid Cards
  kidCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  kidCardCompleted: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + '10',
  },
  kidCardInactive: {
    opacity: 0.5,
  },
  kidCardLeft: {
    flex: 1,
  },
  kidCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  kidCardNameInactive: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  kidCardResult: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  kidCardInactiveText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  kidCardRight: {
    alignItems: 'flex-end',
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  activeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },
  
  // Cancel Button
  cancelButton: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
    textAlign: 'center',
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
    backgroundColor: COLORS.primary,
  },
  modalButtonSecondary: {
    backgroundColor: COLORS.backgroundDark,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  modalButtonDestructive: {
    backgroundColor: COLORS.error,
  },
  modalButtonFull: {
    width: '100%',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default BeepTestLiveTracker;