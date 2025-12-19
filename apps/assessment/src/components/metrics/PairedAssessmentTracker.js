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

    // Create pairs from available kids
    while (availableKids.length >= 2) {
      const kid1 = availableKids.shift();
      const kid2 = availableKids.shift();
      
      generatedPairs.push({
        id: `pair_${generatedPairs.length}`,
        passer: kid1,
        receiver: kid2,
      });
      
      assessed.add(kid1.id);
      assessed.add(kid2.id);
    }

    // Handle odd kid - pair with first assessed kid
    if (availableKids.length === 1) {
      const oddKid = availableKids[0];
      const firstAssessedKid = kids.find(k => k.id !== oddKid.id);
      
      if (firstAssessedKid) {
        generatedPairs.push({
          id: `pair_${generatedPairs.length}`,
          passer: oddKid,
          receiver: firstAssessedKid,
          note: `${firstAssessedKid.name} partnering again`,
        });
        assessed.add(oddKid.id);
      }
    }

    setPairs(generatedPairs);
    setAssessedKids(assessed);
  };
  
  const currentPair = pairs[currentPairIndex];
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

  const handleSavePair = (passerScore, receiverScore) => {
    if (!passerScore || !receiverScore) {
      setShowMissingScoresModal(true);
      return;
    }

    // Save results for both kids
    const newResults = {
      ...pairResults,
      [`${currentPair.passer.id}_${metric1.id}`]: passerScore,
      [`${currentPair.receiver.id}_${metric2.id}`]: receiverScore,
    };
    
    setPairResults(newResults);

    // Move to next pair or complete
    if (isLastPair) {
      handleComplete(newResults);
    } else {
      setCurrentPairIndex(currentPairIndex + 1);
      showNextPairNotification();
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
    setShowSkipPairModal(false);
    if (isLastPair) {
      handleComplete(pairResults);
    } else {
      setCurrentPairIndex(currentPairIndex + 1);
      showNextPairNotification();
    }
  };

  const handleComplete = (results) => {
    const resultArray = Object.entries(results).map(([key, value]) => {
      const [kidId, metricId] = key.split('_');
      return { kidId, metricId, value };
    });

    setShowCompleteModal(true);
    // Store results for later
    window.completedResults = resultArray;
  };

  const confirmComplete = () => {
    setShowCompleteModal(false);
    onSave(window.completedResults);
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

  const passerKey = `${currentPair.passer.id}_${metric1.id}`;
  const receiverKey = `${currentPair.receiver.id}_${metric2.id}`;

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
              <Text style={styles.notificationTitle}>Next Pair</Text>
              <Text style={styles.notificationSubtitle}>
                {pairs[currentPairIndex]?.passer.name} & {pairs[currentPairIndex]?.receiver.name}
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
              Pair {currentPairIndex + 1} of {pairs.length}
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
            {/* Passer */}
            <View style={styles.kidBox}>
              <View style={[styles.roleBadge, styles.passerBadge]}>
                <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                <Text style={styles.roleBadgeText}>PASSER</Text>
              </View>
              <View style={styles.kidAvatar}>
                <Ionicons name="person" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.kidBoxName}>{currentPair.passer.name}</Text>
              <Text style={styles.kidBoxDetails}>
                {currentPair.passer.age} yrs • {currentPair.passer.age_group}
              </Text>
            </View>

            <View style={styles.pairDivider}>
              <Ionicons name="swap-horizontal" size={32} color={COLORS.primary} />
            </View>

            {/* Receiver */}
            <View style={styles.kidBox}>
              <View style={[styles.roleBadge, styles.receiverBadge]}>
                <Ionicons name="hand-left" size={16} color={COLORS.white} />
                <Text style={styles.roleBadgeText}>RECEIVER</Text>
              </View>
              <View style={styles.kidAvatar}>
                <Ionicons name="person" size={32} color={COLORS.success} />
              </View>
              <Text style={styles.kidBoxName}>{currentPair.receiver.name}</Text>
              <Text style={styles.kidBoxDetails}>
                {currentPair.receiver.age} yrs • {currentPair.receiver.age_group}
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

        {/* Passer Assessment */}
        <View style={styles.assessmentCard}>
          <View style={styles.assessmentHeader}>
            <View style={styles.assessmentHeaderLeft}>
              <View style={[styles.assessmentIcon, { backgroundColor: COLORS.primary + '20' }]}>
                <Ionicons name="arrow-forward" size={24} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.assessmentTitle}>{metric1.name}</Text>
                <Text style={styles.assessmentSubtitle}>{currentPair.passer.name}</Text>
              </View>
            </View>
          </View>
          
          <MetricInput
            metric={metric1}
            value={pairResults[passerKey] || ''}
            onChange={(value) => {
              setPairResults({
                ...pairResults,
                [passerKey]: value,
              });
            }}
          />
        </View>

        {/* Receiver Assessment */}
        <View style={styles.assessmentCard}>
          <View style={styles.assessmentHeader}>
            <View style={styles.assessmentHeaderLeft}>
              <View style={[styles.assessmentIcon, { backgroundColor: COLORS.success + '20' }]}>
                <Ionicons name="hand-left" size={24} color={COLORS.success} />
              </View>
              <View>
                <Text style={styles.assessmentTitle}>{metric2.name}</Text>
                <Text style={styles.assessmentSubtitle}>{currentPair.receiver.name}</Text>
              </View>
            </View>
          </View>
          
          <MetricInput
            metric={metric2}
            value={pairResults[receiverKey] || ''}
            onChange={(value) => {
              setPairResults({
                ...pairResults,
                [receiverKey]: value,
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
                  {pair.passer.name} ↔ {pair.receiver.name}
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
            (pairResults[passerKey] && pairResults[receiverKey]) && styles.nextButtonEnabled,
            (!pairResults[passerKey] || !pairResults[receiverKey]) && styles.nextButtonDisabled,
          ]}
          onPress={() => handleSavePair(pairResults[passerKey], pairResults[receiverKey])}
          disabled={!pairResults[passerKey] || !pairResults[receiverKey]}
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
            <Text style={styles.modalTitle}>Assessment Complete</Text>
            <Text style={styles.modalMessage}>
              Recorded results for {pairs.length} pair(s)
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
  passerBadge: {
    backgroundColor: COLORS.primary,
  },
  receiverBadge: {
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
