// Location: /apps/assessment/src/screens/PairedAssessment/PairedAssessmentTrackerScreen.js
// Screen wrapper for Paired Assessment Tracker

import React, { useState } from 'react';
import { View, StyleSheet, Modal, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PairedAssessmentTracker from '../../components/metrics/PairedAssessmentTracker';
import Header from '../../components/common/Header';
import { COLORS } from '../../utils/constants';
import { saveAssessmentResult } from '../../services/assessmentService';

const PairedAssessmentTrackerScreen = ({ route }) => {
  const navigation = useNavigation();
  const { sport, kids, metric1, metric2, assessmentMetadata, onComplete } = route.params || {};
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [savedPairsCount, setSavedPairsCount] = useState(0);
  const [savedResults, setSavedResults] = useState([]); // ✅ Store results

  const handleSave = async (results) => {
    try {
      console.log('💾 [PairedScreen] handleSave called with results:', results);
      console.log('📊 [PairedScreen] Assessment metadata:', assessmentMetadata);
      console.log('⚽ [PairedScreen] Sport ID:', sport?.id);
      
      if (!results || results.length === 0) {
        console.error('❌ [PairedScreen] No results to save!');
        setErrorMessage('No results to save');
        setShowErrorModal(true);
        return;
      }
      
      // ✅ Validate sport ID
      if (!sport || !sport.id) {
        console.error('❌ [PairedScreen] Invalid sport data!', sport);
        setErrorMessage('Invalid sport data');
        setShowErrorModal(true);
        return;
      }
      
      // Save each result with detailed logging
      const savedResults = [];
      for (const result of results) {
        console.log('💾 [PairedScreen] Saving result:', {
          kid_id: result.kidId,
          sport_id: sport.id,
          metric_id: result.metricId,
          value: result.value,
          date: assessmentMetadata?.assessmentDate || new Date().toISOString().split('T')[0],
        });
        
        const saveResult = await saveAssessmentResult({
          kid_id: result.kidId,
          sport_id: sport.id,
          metric_id: result.metricId,
          value: result.value,
          assessment_date: assessmentMetadata?.assessmentDate || new Date().toISOString().split('T')[0],
          metadata: assessmentMetadata,
        });
        
        console.log('✅ [PairedScreen] Save result response:', saveResult);
        savedResults.push(result);
      }
      
      console.log('✅ [PairedScreen] All results saved successfully:', savedResults.length);
      setSavedResults(savedResults); // ✅ Store for onComplete
      setSavedPairsCount(Math.floor(savedResults.length / 2));
      setShowSuccessModal(true);
    } catch (error) {
      console.error('❌ [PairedScreen] Error saving paired assessment results:', error);
      console.error('❌ [PairedScreen] Error stack:', error.stack);
      setErrorMessage(error.message || 'Unknown error occurred');
      setShowErrorModal(true);
    }
  };

  const handleSuccessClose = () => {
    console.log('✅ [PairedScreen] Success modal closed, calling onComplete with results:', savedResults);
    setShowSuccessModal(false);
    
    // ✅ CRITICAL: Call onComplete to save results, then let callback handle navigation
    if (onComplete) {
      console.log('✅ [PairedScreen] Calling onComplete with formatted results:', savedResults);
      
      try {
        onComplete(savedResults);
        console.log('✅ [PairedScreen] onComplete called successfully');
        // ✅ Don't navigate here - let the callback in AssessmentEntryScreen handle it
      } catch (error) {
        console.error('❌ [PairedScreen] Error calling onComplete:', error);
        // Fallback: go back if there's an error
        navigation.goBack();
      }
    } else {
      console.warn('⚠️ [PairedScreen] No onComplete callback provided, navigating back');
      navigation.goBack();
    }
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    setShowCancelModal(false);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Header
        title={`${metric1.name} & ${metric2.name}`}
        subtitle={sport?.name}
        leftIcon="close"
        onLeftPress={handleCancel}
        showAvatar={false}
      />
      <PairedAssessmentTracker
        kids={kids}
        metric1={metric1}
        metric2={metric2}
        onSave={handleSave}
        onCancel={handleCancel}
      />

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
            </View>
            <Text style={styles.modalTitle}>Paired Tests Saved!</Text>
            <Text style={styles.modalMessage}>
              Successfully saved {savedPairsCount} pair(s) for {metric1?.name} and {metric2?.name}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonFull]}
              onPress={handleSuccessClose}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal visible={showErrorModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="close-circle" size={48} color="#F44336" />
            </View>
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalMessage}>
              Failed to save results: {errorMessage}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonFull]}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal visible={showCancelModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={48} color="#FF9800" />
            </View>
            <Text style={styles.modalTitle}>Cancel Assessment?</Text>
            <Text style={styles.modalMessage}>
              Any unsaved results will be lost. Continue?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Stay</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDestructive]}
                onPress={confirmCancel}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
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
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
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
    color: '#212121',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: '#757575',
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
    backgroundColor: '#1565C0',
  },
  modalButtonSecondary: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  modalButtonDestructive: {
    backgroundColor: '#F44336',
  },
  modalButtonFull: {
    width: '100%',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
});

export default PairedAssessmentTrackerScreen;