// Location: /apps/assessment/src/components/metrics/PairedAssessmentTracker.js
// Paired Assessment Tracker for complementary skills (passing/receiving)

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import MetricInput from './MetricInput';

const PairedAssessmentTracker = ({
  kids = [],
  metric1, // e.g., Passing
  metric2, // e.g., Receiving
  onSave,
  onCancel,
}) => {

  // ✅ DEBUG: Verify metrics are different
  console.log('🔍 [PairedTracker] Initialized with metrics:', {
    metric1: { id: metric1?.id, name: metric1?.name },
    metric2: { id: metric2?.id, name: metric2?.name },
    areSame: metric1?.id === metric2?.id,
  });

  const [pairs, setPairs] = useState([]);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [pairResults, setPairResults] = useState({});
  const [showNextPair, setShowNextPair] = useState(false);
  const [assessedKids, setAssessedKids] = useState(new Set());
  
  const [selectedKid, setSelectedKid] = useState(null);
  const [showLapModal, setShowLapModal] = useState(false);
  const [showMissingScoresModal, setShowMissingScoresModal] = useState(false);
  const [showSkipPairModal, setShowSkipPairModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showPairedBothModal, setShowPairedBothModal] = useState(false);
  const [showPairedDeselect, setShowPairedDeselect] = useState(false);
  const [tempMetric, setTempMetric] = useState(null);
  const [tempAction, setTempAction] = useState(null);
  
  const intervalRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Generate pairs on mount
  useEffect(() => {
    generatePairs();
  }, [kids]);

  const generatePairs = () => {
    const availableKids = [...kids];
    const generatedPairs = [];
    const assessed = new Set();

    // ✅ Create pairs where EACH PLAYER does BOTH METRICS
    while (availableKids.length >= 2) {
      const player1 = availableKids.shift();
      const player2 = availableKids.shift();
      
      // First rotation: player1 does metric1, player2 does metric2
      generatedPairs.push({
        id: `pair_${generatedPairs.length}_rotation1`,
        player1: player1,
        player2: player2,
        rotation: 1,
      });
      
      // Second rotation: SAME PAIR, but player1 does metric2, player2 does metric1
      generatedPairs.push({
        id: `pair_${generatedPairs.length}_rotation2`,
        player1: player1,
        player2: player2,
        rotation: 2,
        note: `Rotation 2: Swapped skills`,
      });
      
      assessed.add(player1.id);
      assessed.add(player2.id);
    }

    // Handle odd player - pair with first assessed player (2 rotations)
    if (availableKids.length === 1) {
      const oddPlayer = availableKids[0];
      const firstAssessedPlayer = kids.find(k => k.id !== oddPlayer.id);
      
      if (firstAssessedPlayer) {
        // First rotation
        generatedPairs.push({
          id: `pair_${generatedPairs.length}_rotation1`,
          player1: oddPlayer,
          player2: firstAssessedPlayer,
          rotation: 1,
          note: `${firstAssessedPlayer.name} partnering again`,
        });
        
        // Second rotation
        generatedPairs.push({
          id: `pair_${generatedPairs.length}_rotation2`,
          player1: oddPlayer,
          player2: firstAssessedPlayer,
          rotation: 2,
          note: `${firstAssessedPlayer.name} partnering again - Rotation 2`,
        });
        
        assessed.add(oddPlayer.id);
      }
    }

    console.log('🔄 [PairedTracker] Generated pairs with rotations:', {
      totalPairs: generatedPairs.length,
      playersCount: kids.length,
      rotationsPerPhysicalPair: 2,
    });

    setPairs(generatedPairs);
    setAssessedKids(assessed);
  };
  
  const currentPair = pairs[currentPairIndex];
  
  // ✅ Map kid1/kid2 to metric1/metric2 based on rotation
  // Rotation 1: kid1 does metric1, kid2 does metric2
  // Rotation 2: kid1 does metric2, kid2 does metric1
  const isLastPair = currentPairIndex === pairs.length - 1;

  // Show next pair notification
  const showNextPairNotification = () => {
    setShowNextPair(true);
    
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2500),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowNextPair(false);
    });
  };

  const handleSavePair = (player1Score, player2Score) => {
    if (!player1Score || !player2Score) {
      setShowMissingScoresModal(true);
      return;
    }

    // ✅ CRITICAL FIX: Determine which metric each player is doing in THIS rotation
    let player1MetricId, player2MetricId;
    
    if (currentPair.rotation === 1) {
      // ✅ Rotation 1: player1 does metric1 (Passing), player2 does metric2 (Receiving)
      player1MetricId = metric1.id;
      player2MetricId = metric2.id;
    } else {
      // ✅ Rotation 2: player1 does metric2 (Receiving), player2 does metric1 (Passing)
      // SWAP: player1 now does what player2 did, player2 now does what player1 did
      player1MetricId = metric2.id;
      player2MetricId = metric1.id;
    }
    
    // ✅ CRITICAL: Save results with correct metric assignments
    const newResults = {
      ...pairResults,
      [`${currentPair.player1.id}_${player1MetricId}`]: player1Score,
      [`${currentPair.player2.id}_${player2MetricId}`]: player2Score,
    };
    
    setPairResults(newResults);
    
    console.log('📊 [PairedTracker] Saved pair:', {
      pairIndex: currentPairIndex + 1,
      totalPairs: pairs.length,
      rotation: currentPair.rotation,
      player1: {
        name: currentPair.player1.name,
        metric: player1MetricId === metric1.id ? metric1.name : metric2.name,
        metricId: player1MetricId,
        score: player1Score,
      },
      player2: {
        name: currentPair.player2.name,
        metric: player2MetricId === metric1.id ? metric1.name : metric2.name,
        metricId: player2MetricId,
        score: player2Score,
      },
      savedKeys: Object.keys(newResults),
      isLastPair,
    });

    // Move to next pair or complete
    if (isLastPair) {
      console.log('✅ [PairedTracker] Last pair completed, calling handleComplete');
      console.log('📦 [PairedTracker] Final results object:', newResults);
      handleComplete(newResults);
    } else {
      const nextIndex = currentPairIndex + 1;
      console.log('➡️ [PairedTracker] Moving to next pair:', nextIndex + 1);
      setCurrentPairIndex(nextIndex);
      // Show notification AFTER state update so it displays the NEW current pair
      setTimeout(() => {
        showNextPairNotification();
      }, 100);
    }
  };

  const handlePrevious = () => {
    if (currentPairIndex > 0) {
      setCurrentPairIndex(currentPairIndex - 1);
    }
  };

  const handleSkipPair = () => {
    setShowSkipPairModal(true);
  };

  const confirmSkipPair = () => {
    console.log('⏭️ [PairedTracker] Skipping pair:', currentPairIndex + 1);
    setShowSkipPairModal(false);
    
    if (isLastPair) {
      console.log('✅ [PairedTracker] Last pair (skipped), calling handleComplete');
      handleComplete(pairResults);
    } else {
      console.log('➡️ [PairedTracker] Moving to next pair after skip');
      setCurrentPairIndex(currentPairIndex + 1);
      showNextPairNotification();
    }
  };

  const handleComplete = (results) => {
    const resultArray = Object.entries(results).map(([key, value]) => {
      // ✅ Key format: "kidId_withSuffix_football_metricname"
      // Example: "1764019736553_3upzonrn9_football_passing"
      // We need: kidId = "1764019736553_3upzonrn9", metricId = "football_passing"
      
      const parts = key.split('_');
      
      // Find where "football" starts (this is the beginning of the metric ID)
      const footballIndex = parts.findIndex(p => p === 'football');
      
      if (footballIndex >= 0) {
        // Everything BEFORE "football" is the kid ID (including any underscores in the kid ID)
        const kidIdParts = parts.slice(0, footballIndex);
        const kidId = kidIdParts.join('_'); // Rejoin to preserve kid ID format
        
        // Everything FROM "football" onwards is the metric ID
        const metricId = parts.slice(footballIndex).join('_');
        
        return { kidId, metricId, value };
      } else {
        // Fallback: assume last 2 parts are metric ID
        const kidId = parts.slice(0, -2).join('_');
        const metricId = parts.slice(-2).join('_');
        return { kidId, metricId, value };
      }
    });
    
    console.log('🎯 [PairedTracker] Completing with results:', {
      rawResults: results,
      resultArray,
      count: resultArray.length,
      mappedResults: resultArray.map(r => `${r.kidId} → ${r.metricId} = ${r.value}`),
    });
    
    setShowCompleteModal(true);
    window.completedResults = resultArray;
  };

  const confirmComplete = () => {
    const resultsToSave = window.completedResults || [];
    console.log('✅ [PairedTracker] Confirming save with:', resultsToSave);
    setShowCompleteModal(false);
    
    // Clean up global variable
    delete window.completedResults;
    
    // ✅ CRITICAL: Call onSave callback with proper format
    if (resultsToSave.length > 0) {
      console.log('📤 [PairedTracker] Calling onSave with results:', resultsToSave);
      onSave(resultsToSave);
    } else {
      console.error('❌ [PairedTracker] No results to save!');
      // Still call onSave with empty array so parent can handle it
      onSave([]);
    }
  };

  if (!currentPair) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No pairs to assess</Text>
        </View>
      </View>
    );
  }

  // ✅ Determine which metric each player is doing based on rotation
  const player1MetricId = currentPair.rotation === 1 ? metric1.id : metric2.id;
  const player2MetricId = currentPair.rotation === 1 ? metric2.id : metric1.id;
  
  const player1Key = `${currentPair.player1.id}_${player1MetricId}`;
  const player2Key = `${currentPair.player2.id}_${player2MetricId}`;
  
  // ✅ Get metric names for display
  const player1MetricName = currentPair.rotation === 1 ? metric1.name : metric2.name;
  const player2MetricName = currentPair.rotation === 1 ? metric2.name : metric1.name;

  return (
    <View style={styles.container}>
      {/* Next Pair Notification */}
      {showNextPair && currentPairIndex < pairs.length && (
        <Animated.View
          style={[
            styles.nextPairNotification,
            { opacity: fadeAnim },
          ]}
        >
          <View style={styles.notificationContent}>
            <Ionicons name="arrow-forward-circle" size={24} color={COLORS.white} />
            <View style={styles.notificationText}>
              <Text style={styles.notificationTitle}>Next Assessment</Text>
              <Text style={styles.notificationSubtitle}>
                {pairs[currentPairIndex]?.player1.name} & {pairs[currentPairIndex]?.player2.name}
                {pairs[currentPairIndex]?.rotation && ` (Rotation ${pairs[currentPairIndex].rotation})`}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Scrollable Content Area */}
      <View style={styles.scrollableContent}>
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Progress Header */}
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              Assessment {currentPairIndex + 1} of {pairs.length}
              {currentPair?.rotation && ` (Rotation ${currentPair.rotation})`}
            </Text>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${((currentPairIndex + 1) / pairs.length) * 100}%` },
                ]}
              />
            </View>
          </View>
        {/* Pair Info Card */}
        <View style={styles.pairCard}>
          <Text style={styles.pairTitle}>Current Pair</Text>
          
          <View style={styles.pairLayout}>
            {/* Player 1 */}
            <View style={styles.kidBox}>
              <View style={[styles.roleBadge, styles.player1Badge]}>
                <Ionicons name="person" size={16} color={COLORS.white} />
                <Text style={styles.roleBadgeText}>PASSER</Text>
              </View>
              <View style={styles.kidAvatar}>
                <Ionicons name="person" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.kidBoxName}>{currentPair.player1.name}</Text>
              <Text style={styles.kidBoxDetails}>
                {currentPair.player1.age} yrs • {currentPair.player1.age_group}
              </Text>
            </View>

            <View style={styles.pairDivider}>
              <Ionicons name="swap-horizontal" size={32} color={COLORS.primary} />
            </View>

            {/* Player 2 */}
            <View style={styles.kidBox}>
              <View style={[styles.roleBadge, styles.player2Badge]}>
                <Ionicons name="football" size={16} color={COLORS.white} />
                <Text style={styles.roleBadgeText}>RECEIVER</Text>
              </View>
              <View style={styles.kidAvatar}>
                <Ionicons name="person" size={32} color={COLORS.success} />
              </View>
              <Text style={styles.kidBoxName}>{currentPair.player2.name}</Text>
              <Text style={styles.kidBoxDetails}>
                {currentPair.player2.age} yrs • {currentPair.player2.age_group}
              </Text>
            </View>
          </View>

          {currentPair.note && (
            <View style={styles.pairNote}>
              <Ionicons name="information-circle" size={16} color={COLORS.warning} />
              <Text style={styles.pairNoteText}>{currentPair.note}</Text>
            </View>
          )}
        </View>

        {/* Player 1 Assessment */}
        <View style={styles.assessmentCard}>
          <View style={styles.assessmentHeader}>
            <View style={styles.assessmentHeaderLeft}>
              <View style={[styles.assessmentIcon, { backgroundColor: COLORS.primary + '20' }]}>
                <Ionicons name="person" size={24} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.assessmentTitle}>{player1MetricName}</Text>
                <Text style={styles.assessmentSubtitle}>{currentPair.player1.name}</Text>
              </View>
            </View>
          </View>
          
          <MetricInput
            metric={currentPair.rotation === 1 ? metric1 : metric2}
            value={pairResults[player1Key] || ''}
            onChange={(value) => {
              setPairResults({
                ...pairResults,
                [player1Key]: value,
              });
            }}
          />
        </View>

        {/* Player 2 Assessment */}
        <View style={styles.assessmentCard}>
          <View style={styles.assessmentHeader}>
            <View style={styles.assessmentHeaderLeft}>
              <View style={[styles.assessmentIcon, { backgroundColor: COLORS.success + '20' }]}>
                <Ionicons name="people" size={24} color={COLORS.success} />
              </View>
              <View>
                <Text style={styles.assessmentTitle}>{player2MetricName}</Text>
                <Text style={styles.assessmentSubtitle}>{currentPair.player2.name}</Text>
              </View>
            </View>
          </View>
          
          <MetricInput
            metric={currentPair.rotation === 1 ? metric2 : metric1}
            value={pairResults[player2Key] || ''}
            onChange={(value) => {
              setPairResults({
                ...pairResults,
                [player2Key]: value,
              });
            }}
          />
        </View>

        {/* Remaining Pairs Preview */}
        {!isLastPair && (
          <View style={styles.upcomingCard}>
            <Text style={styles.upcomingTitle}>Upcoming Pairs</Text>
            {pairs.slice(currentPairIndex + 1, currentPairIndex + 4).map((pair, index) => (
              <View key={pair.id} style={styles.upcomingPair}>
                <Text style={styles.upcomingPairNumber}>#{currentPairIndex + index + 2}</Text>
                <Text style={styles.upcomingPairText}>
                  {pair.player1.name} ↔ {pair.player2.name}
                </Text>
              </View>
            ))}
          </View>
        )}
        </ScrollView>
      </View>

      {/* Navigation Controls */}
      <View style={styles.navigationContainer}>
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.previousButton,
              currentPairIndex === 0 && styles.disabledButton,
            ]}
            onPress={handlePrevious}
            disabled={currentPairIndex === 0}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.white} />
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, styles.skipButton]}
            onPress={handleSkipPair}
          >
            <Text style={styles.navButtonText}>Skip Pair</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            (pairResults[player1Key] && pairResults[player2Key]) && styles.nextButtonEnabled,
            (!pairResults[player1Key] || !pairResults[player2Key]) && styles.nextButtonDisabled,
          ]}
          onPress={() => handleSavePair(pairResults[player1Key], pairResults[player2Key])}
          disabled={!pairResults[player1Key] || !pairResults[player2Key]}
        >
          <Text style={styles.navButtonText}>
            {isLastPair ? 'Complete Assessment' : 'Next Pair'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Cancel Button */}
      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <Text style={styles.cancelButtonText}>Cancel Assessment</Text>
      </TouchableOpacity>

      {/* Missing Scores Modal */}
      <Modal visible={showMissingScoresModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="alert-circle" size={48} color={COLORS.warning} />
            </View>
            <Text style={styles.modalTitle}>Missing Scores</Text>
            <Text style={styles.modalMessage}>
              Please enter scores for both kids
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonFull]}
              onPress={() => setShowMissingScoresModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Skip Pair Modal */}
      <Modal visible={showSkipPairModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={48} color={COLORS.warning} />
            </View>
            <Text style={styles.modalTitle}>Skip Pair?</Text>
            <Text style={styles.modalMessage}>
              Results for this pair will not be saved.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowSkipPairModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDestructive]}
                onPress={confirmSkipPair}
              >
                <Text style={styles.modalButtonText}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Complete Modal */}
      <Modal visible={showCompleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
            </View>
            <Text style={styles.modalTitle}>Paired Assessment Complete</Text>
            <Text style={styles.modalMessage}>
              Recorded {Object.keys(pairResults).length} results across {pairs.length / 2} pair(s) with role rotations
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonFull]}
              onPress={confirmComplete}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
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
  progressHeader: {
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 0,
  },
  scrollableContent: {
    position: 'absolute',
    top: 8, // Just Header (89px)
    left: 0,
    right: 0,
    bottom: 179, // Navigation container (~130px) + Cancel button (~49px) = 179px
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  
  // Next Pair Notification
  nextPairNotification: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
  },
  
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  
  // Pair Card
  pairCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pairTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  pairLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kidBox: {
    flex: 1,
    alignItems: 'center',
  },
  roleadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
    gap: 4,
  },
  player1Badge: {
    backgroundColor: COLORS.primary,
  },
  player2Badge: {
    backgroundColor: COLORS.success,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  kidAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  kidBoxName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  kidBoxDetails: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  pairDivider: {
    paddingHorizontal: 12,
  },
  pairNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  pairNoteText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.warning,
    lineHeight: 18,
  },
  
  // Assessment Cards
  assessmentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  assessmentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  assessmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assessmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  assessmentSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  
  // Upcoming Pairs
  upcomingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  upcomingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  upcomingPair: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  upcomingPairNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    width: 32,
  },
  upcomingPairText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  
  // Navigation
  navigationContainer: {
    position: 'absolute',
    bottom: 49, // Cancel button height
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
    elevation: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  navRow: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  previousButton: {
    flex: 1,
    backgroundColor: COLORS.textSecondary,
  },
  skipButton: {
    flex: 1,
    backgroundColor: COLORS.warning,
  },
  nextButton: {
    backgroundColor: COLORS.primary, // Blue by default
  },
  nextButtonEnabled: {
    backgroundColor: COLORS.success, // Green when both scores entered
  },
  nextButtonDisabled: {
    backgroundColor: COLORS.primary,
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  
  // Cancel Button
  cancelButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 2,
    borderTopColor: COLORS.error + '30',
    padding: 16,
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.error,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
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

export default PairedAssessmentTracker;
