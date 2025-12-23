// Location: /apps/assessment/src/components/metrics/CooperTestLiveTracker.js
// Live Cooper Test Tracker with 12-minute countdown and lap tracking

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-audio';
import { COLORS } from '../../utils/constants';

const CooperTestLiveTracker = ({ kids = [], onSave, onCancel }) => {
  // Track configuration
  const [trackDistance, setTrackDistance] = useState('400'); // Full lap distance in meters
  const [showTrackSetup, setShowTrackSetup] = useState(true);
  const [markers, setMarkers] = useState([
    { id: 1, distance: 50 },
    { id: 2, distance: 100 },
    { id: 3, distance: 150 },
    { id: 4, distance: 200 },
    { id: 5, distance: 250 },
    { id: 6, distance: 300 },
    { id: 7, distance: 350 },
  ]); // Marker distances around the track
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(12 * 60); // 12 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  // Kid results
  const [kidResults, setKidResults] = useState({});
  const [selectedKid, setSelectedKid] = useState(null);
  const [showLapModal, setShowLapModal] = useState(false);
  
  const intervalRef = useRef(null);
  const [sound, setSound] = useState(null);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [showInvalidTrackModal, setShowInvalidTrackModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showNoResultsModal, setShowNoResultsModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Initialize kid results
  useEffect(() => {
    const initialResults = {};
    kids.forEach((kid) => {
      initialResults[kid.id] = {
        kidId: kid.id,
        kidName: kid.name,
        completedLaps: 0,
        markerPosition: 0, // Which marker they stopped at (0 = no partial lap)
        totalDistance: 0,
        status: 'active',
      };
    });
    setKidResults(initialResults);
  }, [kids]);

  // Load countdown sound
  useEffect(() => {
    loadSound();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const loadSound = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      
      const { sound: beepSound } = await Audio.Sound.createAsync(
        require('../../../assets/sounds/beep.mp3'),
        { shouldPlay: false }
      );
      setSound(beepSound);
    } catch (error) {
      console.error('Error loading sound:', error);
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

  // Timer countdown
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          
          // Play beep at 3, 2, 1 seconds
          if (prev <= 3) {
            playBeep();
          }
          
          return prev - 1;
        });
      }, 1000);
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
  }, [isRunning, timeRemaining]);

  const handleTimeUp = () => {
    setIsRunning(false);
    setIsComplete(true);
    playBeep();
    setShowTimeUpModal(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTest = () => {
    if (!trackDistance || parseFloat(trackDistance) <= 0) {
      setShowInvalidTrackModal(true);
      return;
    }
    
    setShowTrackSetup(false);
    setIsRunning(true);
    setTimeRemaining(12 * 60);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleResume = () => {
    if (timeRemaining > 0) {
      setIsRunning(true);
    }
  };

  const handleReset = () => {
    setShowResetModal(true);
  };

  const confirmReset = () => {
    setIsRunning(false);
    setIsComplete(false);
    setTimeRemaining(12 * 60);
    
    const resetResults = {};
    kids.forEach((kid) => {
      resetResults[kid.id] = {
        kidId: kid.id,
        kidName: kid.name,
        completedLaps: 0,
        markerPosition: 0,
        totalDistance: 0,
        status: 'active',
      };
    });
    setKidResults(resetResults);
    setShowResetModal(false);
  };

  const handleKidSelect = (kid) => {
    setSelectedKid(kid);
    setShowLapModal(true);
  };

  const calculateDistance = (completedLaps, markerPosition) => {
    const fullLapDistance = parseFloat(trackDistance);
    const fullLapsDistance = completedLaps * fullLapDistance;
    
    const marker = markers.find(m => m.id === markerPosition);
    const partialDistance = marker ? marker.distance : 0;
    
    return fullLapsDistance + partialDistance;
  };

  const handleSaveLaps = (completedLaps, markerPosition) => {
    if (selectedKid) {
      const totalDistance = calculateDistance(completedLaps, markerPosition);
      
      setKidResults((prev) => ({
        ...prev,
        [selectedKid.id]: {
          ...prev[selectedKid.id],
          completedLaps,
          markerPosition,
          totalDistance,
          status: 'completed',
        },
      }));
      
      setShowLapModal(false);
      setSelectedKid(null);
    }
  };

  const handleSaveAll = () => {
    const completedResults = Object.values(kidResults).filter(
      (r) => r.status === 'completed' && r.totalDistance > 0
    );
    
    console.log('💾 [CooperTest] handleSaveAll called with results:', completedResults);
    
    if (completedResults.length === 0) {
      console.warn('⚠️ [CooperTest] No completed results to save');
      setShowNoResultsModal(true);
      return;
    }
    
    setShowSaveModal(true);
  };

  const confirmSave = () => {
    const completedResults = Object.values(kidResults).filter(
      (r) => r.status === 'completed' && r.totalDistance > 0
    );
    
    console.log('✅ [CooperTest] Confirming save with results:', completedResults);
    setShowSaveModal(false);
    
    // Format results properly for onSave callback
    const formattedResults = completedResults.map(result => ({
      kidId: result.kidId,
      kidName: result.kidName,
      value: result.totalDistance.toString(),
      totalDistance: result.totalDistance,
      completedLaps: result.completedLaps,
      markerPosition: result.markerPosition,
      status: result.status,
    }));
    
    console.log('✅ [CooperTest] Calling onSave with formatted results:', formattedResults);
    onSave(formattedResults);
  };

  const handleAddMarker = () => {
    const newMarkerId = markers.length + 1;
    setMarkers([...markers, { id: newMarkerId, distance: 0 }]);
  };

  const handleUpdateMarker = (markerId, distance) => {
    setMarkers(markers.map(m => 
      m.id === markerId ? { ...m, distance: parseFloat(distance) || 0 } : m
    ));
  };

  const handleRemoveMarker = (markerId) => {
    setMarkers(markers.filter(m => m.id !== markerId));
  };

  // Group kids by team
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

  const completedCount = Object.values(kidResults).filter(r => r.status === 'completed').length;
  const kidsByTeam = getKidsByTeam();

  return (
    <View style={styles.container}>
      {/* Track Setup Modal */}
      <Modal
        visible={showTrackSetup}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Track Setup</Text>
            <Text style={styles.modalSubtitle}>Configure your track measurements</Text>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Track Distance */}
            <View style={styles.setupSection}>
              <Text style={styles.setupLabel}>Full Lap Distance (meters)</Text>
              <TextInput
                style={styles.setupInput}
                value={trackDistance}
                onChangeText={setTrackDistance}
                keyboardType="numeric"
                placeholder="400"
              />
              <Text style={styles.setupHint}>
                Standard track: 400m | Modified field: measure and enter
              </Text>
            </View>

            {/* Markers */}
            <View style={styles.setupSection}>
              <View style={styles.setupHeaderRow}>
                <Text style={styles.setupLabel}>Distance Markers</Text>
                <TouchableOpacity onPress={handleAddMarker} style={styles.addMarkerButton}>
                  <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                  <Text style={styles.addMarkerText}>Add</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.setupHint}>
                Place cones/markers around the track to help measure partial laps
              </Text>
              
              {markers.map((marker, index) => (
                <View key={marker.id} style={styles.markerRow}>
                  <Text style={styles.markerLabel}>Marker {marker.id}:</Text>
                  <TextInput
                    style={styles.markerInput}
                    value={String(marker.distance)}
                    onChangeText={(text) => handleUpdateMarker(marker.id, text)}
                    keyboardType="numeric"
                    placeholder="Distance"
                  />
                  <Text style={styles.markerUnit}>m</Text>
                  {markers.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveMarker(marker.id)}
                      style={styles.removeMarkerButton}
                    >
                      <Ionicons name="close-circle" size={24} color={COLORS.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleStartTest}
            >
              <Text style={styles.modalButtonText}>Start Test</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Lap Entry Modal */}
      <Modal
        visible={showLapModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.lapModalOverlay}>
          <LapEntryModal
            kid={selectedKid}
            trackDistance={parseFloat(trackDistance)}
            markers={markers}
            onSave={handleSaveLaps}
            onCancel={() => {
              setShowLapModal(false);
              setSelectedKid(null);
            }}
          />
        </View>
      </Modal>

      {/* Main Content */}
      {!showTrackSetup && (
        <>
          {/* Fixed Header - Outside ScrollView */}
          <View style={styles.header}>
            <Text style={styles.title}>Cooper Test (12-min run)</Text>
            <TouchableOpacity
              style={styles.editTrackButton}
              onPress={() => setShowTrackSetup(true)}
            >
              <Ionicons name="settings-outline" size={20} color={COLORS.primary} />
              <Text style={styles.editTrackText}>Edit Track</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Content Area */}
          <View style={styles.scrollableContent}>
            <ScrollView 
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
            >

          {/* Timer Display */}
          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>TIME REMAINING</Text>
            <Text style={[
              styles.timerText,
              isRunning && styles.timerTextActive,
              timeRemaining <= 10 && styles.timerTextWarning
            ]}>
              {formatTime(timeRemaining)}
            </Text>
            <Text style={styles.timerSubtext}>
              Track: {trackDistance}m per lap
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            {!isRunning && !isComplete && (
              <TouchableOpacity
                style={[styles.button, styles.startButton]}
                onPress={handleResume}
              >
                <Ionicons name="play" size={24} color={COLORS.white} />
                <Text style={styles.buttonText}>
                  {timeRemaining === 12 * 60 ? 'Start' : 'Resume'}
                </Text>
              </TouchableOpacity>
            )}

            {isRunning && (
              <TouchableOpacity
                style={[styles.button, styles.pauseButton]}
                onPress={handlePause}
              >
                <Ionicons name="pause" size={24} color={COLORS.white} />
                <Text style={styles.buttonText}>Pause</Text>
              </TouchableOpacity>
            )}

            {(isComplete || timeRemaining < 12 * 60) && (
              <View style={styles.controlRow}>
                {!isRunning && !isComplete && (
                  <TouchableOpacity
                    style={[styles.button, styles.resumeButton]}
                    onPress={handleResume}
                  >
                    <Ionicons name="play" size={20} color={COLORS.white} />
                    <Text style={styles.buttonText}>Resume</Text>
                  </TouchableOpacity>
                )}
                
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
          {(isRunning || isComplete) && (
            <View style={styles.instructionBanner}>
              <Ionicons name="information-circle" size={20} color={COLORS.primary} />
              <Text style={styles.instructionText}>
                {isComplete 
                  ? 'Time up! Tap each kid to record their final laps and marker position'
                  : 'Tap on a kid to record their laps at any time'
                }
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
                  
                  {teamKids.map(kid => {
                    const result = kidResults[kid.id];
                    const isCompleted = result?.status === 'completed';
                    
                    return (
                      <TouchableOpacity
                        key={kid.id}
                        style={[
                          styles.kidCard,
                          isCompleted && styles.kidCardCompleted,
                        ]}
                        onPress={() => handleKidSelect(kid)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.kidCardLeft}>
                          <Text style={styles.kidCardName}>{kid.name}</Text>
                          {isCompleted && result.totalDistance > 0 ? (
                            <Text style={styles.kidCardResult}>
                              {result.totalDistance}m ({result.completedLaps} laps
                              {result.markerPosition > 0 && ` + marker ${result.markerPosition}`})
                            </Text>
                          ) : (
                            <Text style={styles.kidCardHint}>Tap to record laps</Text>
                          )}
                        </View>
                        
                        <View style={styles.kidCardRight}>
                          {isCompleted ? (
                            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                          ) : (
                            <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>
            </ScrollView>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          {/* Time Up Modal */}
          <Modal visible={showTimeUpModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Ionicons name="alarm" size={48} color={COLORS.error} />
                </View>
                <Text style={styles.modalTitle}>Time Up! ⏰</Text>
                <Text style={styles.modalMessage}>
                  12 minutes complete. Record final positions for all participants.
                </Text>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonFull]}
                  onPress={() => setShowTimeUpModal(false)}
                >
                  <Text style={styles.modalButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Invalid Track Modal */}
          <Modal visible={showInvalidTrackModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Ionicons name="alert-circle" size={48} color={COLORS.warning} />
                </View>
                <Text style={styles.modalTitle}>Invalid Track Distance</Text>
                <Text style={styles.modalMessage}>
                  Please set a valid track distance first.
                </Text>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonFull]}
                  onPress={() => setShowInvalidTrackModal(false)}
                >
                  <Text style={styles.modalButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Reset Modal */}
          <Modal visible={showResetModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Ionicons name="refresh-circle" size={48} color={COLORS.warning} />
                </View>
                <Text style={styles.modalTitle}>Reset Test?</Text>
                <Text style={styles.modalMessage}>
                  This will clear all recorded laps and reset the timer.
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
                  No distance has been recorded yet.
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
                  Save Cooper test results for {Object.values(kidResults).filter(r => r.status === 'completed' && r.totalDistance > 0).length} kid(s)?
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
        </>
      )}
    </View>
  );
};

// Lap Entry Modal Component
const LapEntryModal = ({ kid, trackDistance, markers, onSave, onCancel }) => {
  const [completedLaps, setCompletedLaps] = useState('0');
  const [selectedMarker, setSelectedMarker] = useState(0);

  const calculateTotalDistance = () => {
    const laps = parseInt(completedLaps) || 0;
    const marker = markers.find(m => m.id === selectedMarker);
    const markerDistance = marker ? marker.distance : 0;
    return (laps * trackDistance) + markerDistance;
  };

  const [showInvalidEntryModal, setShowInvalidEntryModal] = useState(false);

  const handleSave = () => {
    const laps = parseInt(completedLaps) || 0;
    if (laps === 0 && selectedMarker === 0) {
      setShowInvalidEntryModal(true);
      return;
    }
    
    onSave(laps, selectedMarker);
  };

  return (
    <View style={styles.lapModal}>
      <View style={styles.lapModalHeader}>
        <Text style={styles.lapModalTitle}>{kid?.name}</Text>
        <Text style={styles.lapModalSubtitle}>Record distance covered</Text>
      </View>

      <View style={styles.lapModalContent}>
        {/* Completed Laps */}
        <View style={styles.lapSection}>
          <Text style={styles.lapLabel}>Completed Laps</Text>
          <View style={styles.lapInputContainer}>
            <TouchableOpacity
              style={styles.lapButton}
              onPress={() => setCompletedLaps(String(Math.max(0, parseInt(completedLaps || '0') - 1)))}
            >
              <Ionicons name="remove" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            
            <TextInput
              style={styles.lapInput}
              value={completedLaps}
              onChangeText={setCompletedLaps}
              keyboardType="number-pad"
            />
            
            <TouchableOpacity
              style={styles.lapButton}
              onPress={() => setCompletedLaps(String(parseInt(completedLaps || '0') + 1))}
            >
              <Ionicons name="add" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Marker Selection */}
        <View style={styles.lapSection}>
          <Text style={styles.lapLabel}>Partial Lap (optional)</Text>
          <Text style={styles.lapHint}>Select marker where they stopped</Text>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.markerScroll}
          >
            <TouchableOpacity
              style={[
                styles.markerChip,
                selectedMarker === 0 && styles.markerChipActive,
              ]}
              onPress={() => setSelectedMarker(0)}
            >
              <Text style={[
                styles.markerChipText,
                selectedMarker === 0 && styles.markerChipTextActive,
              ]}>
                None
              </Text>
            </TouchableOpacity>
            
            {markers.map(marker => (
              <TouchableOpacity
                key={marker.id}
                style={[
                  styles.markerChip,
                  selectedMarker === marker.id && styles.markerChipActive,
                ]}
                onPress={() => setSelectedMarker(marker.id)}
              >
                <Text style={[
                  styles.markerChipText,
                  selectedMarker === marker.id && styles.markerChipTextActive,
                ]}>
                  M{marker.id}: {marker.distance}m
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Total Distance Display */}
        <View style={styles.totalDistanceCard}>
          <Text style={styles.totalDistanceLabel}>Total Distance</Text>
          <Text style={styles.totalDistanceValue}>
            {calculateTotalDistance()} meters
          </Text>
        </View>
      </View>

      {/* Invalid Entry Modal */}
      <Modal visible={showInvalidEntryModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.lapModalInner}>
            <View style={styles.modalHeader}>
              <Ionicons name="alert-circle" size={48} color={COLORS.warning} />
            </View>
            <Text style={styles.modalTitle}>Invalid Entry</Text>
            <Text style={styles.modalMessage}>
              Please enter at least 1 lap or select a marker.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonFull]}
              onPress={() => setShowInvalidEntryModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.lapModalFooter}>
        <TouchableOpacity
          style={[styles.lapModalButton, styles.lapModalButtonCancel]}
          onPress={onCancel}
        >
          <Text style={styles.lapModalButtonTextCancel}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.lapModalButton, styles.lapModalButtonSave]}
          onPress={handleSave}
        >
          <Text style={styles.lapModalButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 10,
  },
  scrollableContent: {
    position: 'absolute',
    top: 89, // Header height
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  
  // Modal Container
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    backgroundColor: COLORS.primary,
    padding: 20,
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  setupSection: {
    marginBottom: 24,
  },
  setupLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  setupInput: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: COLORS.white,
    marginBottom: 8,
  },
  setupHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  setupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addMarkerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addMarkerText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  markerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  markerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    width: 80,
  },
  markerInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  markerUnit: {
    fontSize: 14,
    color: COLORS.textSecondary,
    width: 20,
  },
  removeMarkerButton: {
    padding: 4,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  editTrackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editTrackText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  
  // Timer
  timerContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  timerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  timerText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  timerTextActive: {
    color: COLORS.primary,
  },
  timerTextWarning: {
    color: COLORS.error,
  },
  timerSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  
  // Controls (same as BeepTest)
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
  pauseButton: {
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
    color:COLORS.primary,
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
kidCardLeft: {
flex: 1,
},
kidCardName: {
fontSize: 16,
fontWeight: '600',
color: COLORS.text,
marginBottom: 4,
},
kidCardResult: {
fontSize: 14,
fontWeight: 'bold',
color: COLORS.success,
},
kidCardHint: {
fontSize: 12,
color: COLORS.textSecondary,
fontStyle: 'italic',
},
kidCardRight: {
alignItems: 'flex-end',
},
// Lap Modal
lapModalOverlay: {
flex: 1,
backgroundColor: 'rgba(0,0,0,0.5)',
justifyContent: 'flex-end',
},
lapModal: {
backgroundColor: COLORS.white,
borderTopLeftRadius: 24,
borderTopRightRadius: 24,
paddingBottom: 20,
maxHeight: '80%',
},
lapModalHeader: {
padding: 20,
borderBottomWidth: 1,
borderBottomColor: COLORS.border,
},
lapModalTitle: {
fontSize: 20,
fontWeight: 'bold',
color: COLORS.text,
marginBottom: 4,
},
lapModalSubtitle: {
fontSize: 14,
color: COLORS.textSecondary,
},
lapModalContent: {
padding: 20,
},
lapSection: {
marginBottom: 24,
},
lapLabel: {
fontSize: 16,
fontWeight: '600',
color: COLORS.text,
marginBottom: 12,
},
lapHint: {
fontSize: 12,
color: COLORS.textSecondary,
marginBottom: 12,
},
lapInputContainer: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'center',
gap: 16,
},
lapButton: {
width: 48,
height: 48,
borderRadius: 24,
backgroundColor: COLORS.primaryLight + '20',
justifyContent: 'center',
alignItems: 'center',
},
lapInput: {
width: 100,
height: 60,
borderWidth: 2,
borderColor: COLORS.border,
borderRadius: 12,
fontSize: 32,
fontWeight: 'bold',
textAlign: 'center',
color: COLORS.text,
},
markerScroll: {
gap: 8,
},
markerChip: {
paddingHorizontal: 16,
paddingVertical: 10,
borderRadius: 20,
backgroundColor: COLORS.backgroundDark,
borderWidth: 2,
borderColor: 'transparent',
},
markerChipActive: {
backgroundColor: COLORS.primary,
borderColor: COLORS.primary,
},
markerChipText: {
fontSize: 14,
fontWeight: '600',
color: COLORS.text,
},
markerChipTextActive: {
color: COLORS.white,
},
totalDistanceCard: {
backgroundColor: COLORS.primary + '10',
padding: 20,
borderRadius: 12,
alignItems: 'center',
},
totalDistanceLabel: {
fontSize: 14,
color: COLORS.textSecondary,
marginBottom: 8,
},
totalDistanceValue: {
fontSize: 36,
fontWeight: 'bold',
color: COLORS.primary,
},
lapModalFooter: {
flexDirection: 'row',
paddingHorizontal: 20,
gap: 12,
},
lapModalButton: {
flex: 1,
paddingVertical: 14,
borderRadius: 12,
alignItems: 'center',
},
lapModalButtonCancel: {
backgroundColor: COLORS.backgroundDark,
},
lapModalButtonSave: {
backgroundColor: COLORS.primary,
},
lapModalButtonTextCancel: {
fontSize: 16,
fontWeight: '600',
color: COLORS.text,
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
lapModalInner: {
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
export default CooperTestLiveTracker;