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
// Format: level, shuttlesInLevel, cumulativeShuttles, speed
const BEEP_TEST_LEVELS = [
  { level: 1, shuttlesInLevel: 7, cumulativeShuttles: 7, speed: 8.5 },
  { level: 2, shuttlesInLevel: 8, cumulativeShuttles: 15, speed: 9.0 },
  { level: 3, shuttlesInLevel: 8, cumulativeShuttles: 23, speed: 9.5 },
  { level: 4, shuttlesInLevel: 9, cumulativeShuttles: 32, speed: 10.0 },
  { level: 5, shuttlesInLevel: 9, cumulativeShuttles: 41, speed: 10.5 },
  { level: 6, shuttlesInLevel: 10, cumulativeShuttles: 51, speed: 11.0 },
  { level: 7, shuttlesInLevel: 10, cumulativeShuttles: 61, speed: 11.5 },
  { level: 8, shuttlesInLevel: 11, cumulativeShuttles: 72, speed: 12.0 },
  { level: 9, shuttlesInLevel: 11, cumulativeShuttles: 83, speed: 12.5 },
  { level: 10, shuttlesInLevel: 11, cumulativeShuttles: 94, speed: 13.0 },
  { level: 11, shuttlesInLevel: 12, cumulativeShuttles: 106, speed: 13.5 },
  { level: 12, shuttlesInLevel: 12, cumulativeShuttles: 118, speed: 14.0 },
  { level: 13, shuttlesInLevel: 13, cumulativeShuttles: 131, speed: 14.5 },
  { level: 14, shuttlesInLevel: 13, cumulativeShuttles: 144, speed: 15.0 },
  { level: 15, shuttlesInLevel: 13, cumulativeShuttles: 157, speed: 15.5 },
  { level: 16, shuttlesInLevel: 14, cumulativeShuttles: 171, speed: 16.0 },
  { level: 17, shuttlesInLevel: 14, cumulativeShuttles: 185, speed: 16.5 },
  { level: 18, shuttlesInLevel: 15, cumulativeShuttles: 200, speed: 17.0 },
  { level: 19, shuttlesInLevel: 15, cumulativeShuttles: 215, speed: 17.5 },
  { level: 20, shuttlesInLevel: 16, cumulativeShuttles: 231, speed: 18.0 },
  { level: 21, shuttlesInLevel: 16, cumulativeShuttles: 247, speed: 18.5 },
];

const BeepTestLiveTracker = ({ kids = [], onSave, onCancel }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isCountdown, setIsCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(10);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentShuttle, setCurrentShuttle] = useState(1);
  const [audioStartDelay, setAudioStartDelay] = useState(0); // Adjustable delay in milliseconds
  const [kidResults, setKidResults] = useState({});
  const [activeKids, setActiveKids] = useState([]);
  const [sound, setSound] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showNoResultsModal, setShowNoResultsModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);
  
  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        if (Platform.OS === 'web') {
          // Web: HTML5 Audio cleanup
          sound.pause();
          sound.currentTime = 0;
        } else {
          // Native: expo-av cleanup
          sound.stopAsync().catch(() => {});
          sound.unloadAsync().catch(() => {});
        }
      }
    };
  }, [sound]);
  
  // Recalculate on every render when level/shuttle changes
  const levelData = BEEP_TEST_LEVELS[currentLevel - 1] || BEEP_TEST_LEVELS[0];
  
  // Calculate cumulative shuttle count
  const getCumulativeShuttle = (level, shuttle) => {
    if (level === 1) {
      return shuttle;
    }
    const previousLevels = BEEP_TEST_LEVELS.slice(0, level - 1);
    const cumulativeFromPrevious = previousLevels.reduce((sum, lvl) => sum + lvl.shuttlesInLevel, 0);
    return cumulativeFromPrevious + shuttle;
  };
  
  const cumulativeShuttle = getCumulativeShuttle(currentLevel, currentShuttle);

  // Auto-advance levels and shuttles based on beep test timing
  useEffect(() => {
    if (!isRunning) return;

    const currentLevelData = BEEP_TEST_LEVELS[currentLevel - 1];
    if (!currentLevelData) return;

    // Calculate interval for current level (time between beeps in seconds)
    const getIntervalForLevel = (level) => {
      const speed = BEEP_TEST_LEVELS[level - 1].speed;
      // 20m distance, speed in km/h -> convert to seconds
      // time = distance / speed = 20m / (speed * 1000/3600) = 72 / speed
      return (72 / speed) * 1000; // Convert to milliseconds
    };

    const interval = getIntervalForLevel(currentLevel);
    
    const autoAdvanceTimer = setTimeout(() => {
      handleManualLevelAdvance();
    }, interval);

    return () => clearTimeout(autoAdvanceTimer);
  }, [isRunning, currentLevel, currentShuttle]);

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

  // Load official beep test audio
  useEffect(() => {
    loadBeepTestAudio();
    return () => {
      // Clean up audio on unmount
      if (sound) {
        if (Platform.OS === 'web') {
          // Web: HTML5 Audio cleanup
          sound.pause();
          sound.currentTime = 0;
          console.log('🧹 Web audio cleaned up');
        } else {
          // Native: expo-av cleanup
          sound.stopAsync().then(() => {
            sound.unloadAsync();
            console.log('🧹 Native audio cleaned up');
          }).catch(err => {
            console.error('Error cleaning up audio:', err);
          });
        }
      }
    };
  }, []);

  const loadBeepTestAudio = async () => {
    try {
      // Check if we're on web or native
      if (Platform.OS === 'web') {
        // Web: Use HTML5 Audio
        console.log('🌐 Loading audio for web (HTML5)');
        const audio = new window.Audio();
        audio.src = require('../../../assets/sounds/beep.mp3');
        audio.preload = 'auto';
        setSound(audio);
        console.log('✅ Web audio loaded');
      } else {
        // Native: Use expo-audio
        console.log('📱 Loading audio for native (expo-audio)');
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        
        const { sound: beepTestSound } = await Audio.Sound.createAsync(
          require('../../../assets/sounds/beep.mp3'),
          { shouldPlay: false }
        );
        setSound(beepTestSound);
        console.log('✅ Native audio loaded');
      }
    } catch (error) {
      console.error('❌ Error loading beep test audio:', error);
    }
  };

  const playBeepTestAudio = async (startPosition = 0) => {
    if (sound) {
      try {
        if (Platform.OS === 'web') {
          sound.currentTime = (startPosition + audioStartDelay) / 1000;
          sound.play();
        } else {
          await sound.setPositionAsync(startPosition + audioStartDelay);
          await sound.playAsync();
        }
      } catch (error) {
        console.error('Error playing beep test audio:', error);
      }
    }
  };

  const pauseBeepTestAudio = async () => {
    if (sound) {
      try {
        if (Platform.OS === 'web') {
          sound.pause();
        } else {
          await sound.pauseAsync();
        }
      } catch (error) {
        console.error('Error pausing beep test audio:', error);
      }
    }
  };

  const stopBeepTestAudio = async () => {
    if (sound) {
      try {
        if (Platform.OS === 'web') {
          sound.pause();
          sound.currentTime = 0;
        } else {
          await sound.pauseAsync();
          await sound.setPositionAsync(0);
        }
      } catch (error) {
        console.error('Error stopping beep test audio:', error);
      }
    }
  };

  const resumeBeepTestAudio = async () => {
    if (sound) {
      try {
        if (Platform.OS === 'web') {
          sound.play();
        } else {
          await sound.playAsync();
        }
      } catch (error) {
        console.error('Error resuming beep test audio:', error);
      }
    }
  };

  // Start the test with countdown
  const handleStart = () => {
    setIsCountdown(true);
    setCountdownValue(10);
    
    // Start audio immediately - it has built-in introduction
    playBeepTestAudio();
    // Audio started
    
    // Start countdown from 10 to 1 (syncs with audio)
    countdownRef.current = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          // Don't clear yet - let it count down to 0
          return prev - 1;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Transition to test mode at exactly 12 seconds (12000ms)
    // First beep is at 12.35s, so we transition at 12s
    setTimeout(() => {
      clearInterval(countdownRef.current);
      
      // Flicker "START" at 11 seconds (between 11.00 and 11.99)
      setCountdownValue('START');
      
      // Then switch to Level 1 display at 12 seconds (when first beep hits)
      setTimeout(() => {
        setIsCountdown(false);
        setIsRunning(true);
        setCurrentLevel(1);
        setCurrentShuttle(1);
        // Test started
      }, 1000); // 1 second after "START" flicker
      
    }, 11000); // 11 seconds from start
  };

  // Stop/Pause the test
  const handleStop = () => {
    setIsRunning(false);
    setIsCountdown(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    
    // Pause audio (can be resumed)
    pauseBeepTestAudio();
  };

  // Reset the test
  const handleReset = () => {
    setShowResetModal(true);
  };

  const confirmReset = () => {
    setIsRunning(false);
    setIsCountdown(false);
    setCountdownValue(10);
    setCurrentLevel(1);
    setCurrentShuttle(1);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    
    // Fully stop and reset audio
    stopBeepTestAudio();
    
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

  // Audio will handle all timing - we just track manually or via audio position
  // Coach manually advances levels/shuttles or we sync with audio position
  
  // Resume the test
  const handleResume = () => {
    setIsRunning(true);
    resumeBeepTestAudio();
  };

  const handleManualLevelAdvance = () => {
    const currentLevelData = BEEP_TEST_LEVELS[currentLevel - 1];
    
    // Advancing level/shuttle
    
    if (currentShuttle >= currentLevelData.shuttlesInLevel) {
      // Move to next level
      if (currentLevel < BEEP_TEST_LEVELS.length) {
        const newLevel = currentLevel + 1;
        setCurrentLevel(newLevel);
        setCurrentShuttle(1);
        // Advanced to next level
      } else {
        // Test complete
        handleStop();
        // Test complete
      }
    } else {
      setCurrentShuttle(prev => prev + 1);
      // Advanced to next shuttle
    }
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
    
    const updatedActiveKids = activeKids.filter((id) => id !== kidId);
    setActiveKids(updatedActiveKids);
    
    // Auto-stop if all kids are done
    if (updatedActiveKids.length === 0) {
      handleStop();
      // All participants completed
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

  // Sort kids: Active first, completed last
  const getSortedKids = (teamKids) => {
    return teamKids.sort((a, b) => {
      const aResult = kidResults[a.id];
      const bResult = kidResults[b.id];
      const aActive = activeKids.includes(a.id);
      const bActive = activeKids.includes(b.id);
      
      // Active kids first
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      
      // Within same status, maintain original order
      return 0;
    });
  };

  const renderKidCard = (kid, index, sortedKids) => {
    const result = kidResults[kid.id];
    if (!result) return null;
    
    const isActive = activeKids.includes(kid.id);
    const isCompleted = result.status === 'completed';
    
    // Check if this is the first completed kid (add separator)
    const isFirstCompleted = isCompleted && 
      (index === 0 || activeKids.includes(sortedKids[index - 1].id));
    
    return (
      <React.Fragment key={kid.id}>
        {isFirstCompleted && (
          <View style={styles.completedSeparator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>COMPLETED</Text>
            <View style={styles.separatorLine} />
          </View>
        )}
        <TouchableOpacity
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
      </React.Fragment>
    );
  };

  const kidsByTeam = getKidsByTeam();
  const completedCount = Object.values(kidResults).filter(r => r.status === 'completed').length;

  return (
    <View style={styles.container}>
      {/* Fixed Header - Outside ScrollView */}
      <View 
        style={styles.header}
      >
        <Text style={styles.title}>Beep Test - Live Tracker</Text>
        <Text style={styles.subtitle}>
          {kids.length} participant{kids.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Scrollable Content Area - Absolutely Positioned */}
      <View style={styles.scrollableContent}>
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          onLayout={(event) => {
            const { height, width } = event.nativeEvent.layout;
            console.log('🔍 [SCROLL] ScrollView Layout:', { height, width });
          }}
          onContentSizeChange={(width, height) => {
            console.log('🔍 [SCROLL] Content Size Changed:', { width, height });
          }}
          onScroll={(event) => {
            const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
            console.log('🔍 [SCROLL] Scroll Event:', {
              scrollY: contentOffset.y.toFixed(2),
              contentHeight: contentSize.height.toFixed(2),
              viewportHeight: layoutMeasurement.height.toFixed(2),
              scrollableDistance: (contentSize.height - layoutMeasurement.height).toFixed(2),
              canScroll: contentSize.height > layoutMeasurement.height,
            });
          }}
          scrollEventThrottle={100}
        >

      {/* Countdown or Level Display */}
      {isCountdown ? (
        <View 
          style={styles.countdownDisplay}
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            console.log('📐 [BeepTestLiveTracker] Countdown display height:', height);
          }}
        >
          <View style={styles.audioPlayingBadge}>
            <Ionicons name="volume-high" size={16} color={COLORS.white} />
            <Text style={styles.audioPlayingText}>AUDIO PLAYING</Text>
          </View>
          <Text style={styles.countdownLabel}>
            {countdownValue === 'START' ? 'GET READY!' : 'TEST STARTING IN'}
          </Text>
          <Text style={[
            styles.countdownNumber,
            countdownValue === 'START' && styles.countdownStart
          ]}>
            {countdownValue}
          </Text>
          <Text style={styles.countdownHint}>
            {countdownValue === 'START' ? 'First beep coming...' : 'Listen to instructions...'}
          </Text>
        </View>
      ) : (
        <View 
          style={styles.levelDisplay}
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            console.log('📐 [BeepTestLiveTracker] Level display height:', height);
          }}
        >
          {/* Level */}
          <View style={styles.levelMainContainer}>
            <Text style={styles.levelLabel}>LEVEL</Text>
            <Text style={[styles.levelNumber, isRunning && styles.levelNumberActive]}>
              {currentLevel}
            </Text>
            <Text style={styles.levelSpeed}>{levelData?.speed} km/h</Text>
          </View>
        
          <View style={styles.levelDivider} />
        
          {/* Shuttle in Level */}
          <View style={styles.levelMainContainer}>
            <Text style={styles.levelLabel}>SHUTTLE</Text>
            <Text style={[styles.levelNumber, isRunning && styles.levelNumberActive]}>
              {currentShuttle}
            </Text>
            <Text style={styles.levelSpeed}>of {levelData?.shuttlesInLevel}</Text>
          </View>
          
          <View style={styles.levelDivider} />
          
          {/* Cumulative Shuttles */}
          <View style={styles.levelMainContainer}>
            <Text style={styles.levelLabel}>TOTAL</Text>
            <Text style={[styles.levelNumberSmall, isRunning && styles.levelNumberActive]}>
              {cumulativeShuttle}
            </Text>
            <Text style={styles.levelSpeed}>shuttles</Text>
          </View>
        </View>
      )}

      {/* Control Buttons */}
      <View 
        style={styles.controls}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          console.log('📐 [BeepTestLiveTracker] Controls height:', height);
        }}
      >
        {isCountdown && (
          <View style={styles.countdownInfo}>
            <Ionicons name="headset" size={24} color={COLORS.primary} />
            <Text style={styles.countdownInfoText}>
              Listen carefully - audio contains instructions and countdown
            </Text>
          </View>
        )}
        
        {!isRunning && !isCountdown && currentLevel === 1 && currentShuttle === 1 && (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={handleStart}
          >
            <Ionicons name="play" size={24} color={COLORS.white} />
            <Text style={styles.buttonText}>Start Test & Audio</Text>
          </TouchableOpacity>
        )}

        {isRunning && (
          <>
            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={handleStop}
            >
              <Ionicons name="pause" size={24} color={COLORS.white} />
              <Text style={styles.buttonText}>Stop Test</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.advanceButton]}
              onPress={handleManualLevelAdvance}
            >
              <Ionicons name="skip-forward" size={20} color={COLORS.white} />
              <Text style={styles.buttonText}>Skip to Next</Text>
            </TouchableOpacity>
          </>
        )}

        {!isRunning && !isCountdown && (currentLevel > 1 || currentShuttle > 1 || completedCount > 0) && (
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={[styles.button, styles.resumeButton]}
              onPress={handleResume}
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
          <View style={styles.audioIndicator}>
            <Ionicons name="volume-high" size={16} color={COLORS.success} />
            <View style={styles.audioWave} />
          </View>
          <Text style={styles.instructionText}>
            Auto-tracking • Tap kids when they drop out
          </Text>
        </View>
      )}
      
      {/* Audio Timing Adjustment - Only show when not running */}
      {!isRunning && !isCountdown && (
        <View style={styles.timingAdjustment}>
          <View style={styles.timingHeader}>
            <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.timingTitle}>Audio Timing Adjustment</Text>
          </View>
          <Text style={styles.timingDescription}>
            Fine-tune if audio and countdown are not synced
          </Text>
          <View style={styles.timingControls}>
            <TouchableOpacity
              style={styles.timingButton}
              onPress={() => setAudioStartDelay(Math.max(0, audioStartDelay - 100))}
            >
              <Ionicons name="remove" size={20} color={COLORS.primary} />
              <Text style={styles.timingButtonText}>-100ms</Text>
            </TouchableOpacity>
            
            <View style={styles.timingDisplay}>
              <Text style={styles.timingValue}>{audioStartDelay}ms</Text>
              <Text style={styles.timingLabel}>offset</Text>
            </View>
            
            <TouchableOpacity
              style={styles.timingButton}
              onPress={() => setAudioStartDelay(audioStartDelay + 100)}
            >
              <Ionicons name="add" size={20} color={COLORS.primary} />
              <Text style={styles.timingButtonText}>+100ms</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.resetTimingButton}
            onPress={() => setAudioStartDelay(0)}
          >
            <Text style={styles.resetTimingText}>Reset to 0ms</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {!isRunning && !isCountdown && (
        <>
          <View style={styles.infoBanner}>
            <Ionicons name="fitness" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>
              Score format: Level.Shuttle (e.g., 10.4 = Level 10, Shuttle 4)
            </Text>
          </View>
          <View style={styles.infoBanner}>
            <Ionicons name="sync" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Levels/shuttles auto-advance with audio • Just tap kids when they drop out
            </Text>
          </View>
        </>
      )}

      {/* Kids List by Team */}
      <View 
        style={styles.kidsList}
        onLayout={(event) => {
          const { height, width } = event.nativeEvent.layout;
          console.log('📐 [BeepTestLiveTracker] Kids list View layout:', { height, width });
        }}
      >
        {Object.keys(kidsByTeam).map(teamId => {
          const teamKids = kidsByTeam[teamId];
          if (teamKids.length === 0) return null;
          
          const sortedKids = getSortedKids(teamKids);
          const activeCount = sortedKids.filter(kid => activeKids.includes(kid.id)).length;
          const completedCount = sortedKids.filter(kid => kidResults[kid.id]?.status === 'completed').length;
          
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
                <View style={styles.teamHeaderRight}>
                  <Text style={styles.teamHeaderActive}>{activeCount} active</Text>
                  {completedCount > 0 && (
                    <Text style={styles.teamHeaderCompleted}> • {completedCount} out</Text>
                  )}
                </View>
              </View>
              
              {sortedKids.map((kid, index) => renderKidCard(kid, index, sortedKids))}
            </View>
          );
        })}
      </View>

      {/* Cancel Button */}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onCancel}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          console.log('📐 [BeepTestLiveTracker] Cancel button height:', height);
        }}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
        </ScrollView>
      </View>

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
  levelNumberSmall: {
    fontSize: 36,
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
  
  // Countdown Display
  countdownDisplay: {
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    borderRadius: 16,
    paddingVertical: 32,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 3,
    borderColor: COLORS.warning,
  },
  countdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.warning,
    marginBottom: 12,
    letterSpacing: 1,
  },
  countdownNumber: {
    fontSize: 72,
    fontWeight: 'bold',
    color: COLORS.warning,
    fontVariant: ['tabular-nums'],
  },
  countdownStart: {
    color: COLORS.success,
    fontSize: 56,
  },
  countdownHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  audioPlayingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
    gap: 6,
  },
  audioPlayingText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  countdownInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  countdownInfoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  advanceButton: {
    backgroundColor: COLORS.warning,
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
  audioIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    gap: 4,
  },
  audioWave: {
    width: 3,
    height: 12,
    backgroundColor: COLORS.success,
    borderRadius: 2,
  },
  
  // Timing Adjustment
  timingAdjustment: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  timingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  timingDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 16,
  },
  timingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight + '20',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  timingButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  timingDisplay: {
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  timingValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  timingLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  resetTimingButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  resetTimingText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  
  // Kids List
  // Kids List
  kidsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
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
  teamHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamHeaderActive: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.success,
  },
  teamHeaderCompleted: {
    fontSize: 13,
    fontWeight: '600',
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
  
  // Completed Separator
  completedSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    marginHorizontal: 8,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  separatorText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginHorizontal: 12,
    letterSpacing: 1,
  },
  
  // Cancel Button
  cancelButton: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 16,
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
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
