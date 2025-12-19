// Location: /apps/assessment/src/screens/CooperTest/CooperTestLiveTrackerScreen.js
// Screen wrapper for Cooper Test Live Tracker

import React, { useState } from 'react';
import { View, StyleSheet, Modal, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CooperTestLiveTracker from '../../components/metrics/CooperTestLiveTracker';
import Header from '../../components/common/Header';
import { COLORS } from '../../utils/constants';
import { saveAssessmentResult } from '../../services/assessmentService';

const CooperTestLiveTrackerScreen = ({ route }) => {
  const navigation = useNavigation();
  const { sport, kids, metric, assessmentMetadata, onComplete } = route.params || {};
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [savedResultsCount, setSavedResultsCount] = useState(0);

  const handleSave = async (results) => {
    try {
      console.log('💾 Saving Cooper test results:', results.length);
      
      // Save each kid's result
      for (const result of results) {
        await saveAssessmentResult({
          kid_id: result.kidId,
          sport_id: sport.id,
          metric_id: metric.id,
          value: result.totalDistance,
          assessment_date: assessmentMetadata?.assessmentDate || new Date().toISOString().split('T')[0],
          metadata: assessmentMetadata,
        });
      }
      
      console.log('✅ All Cooper test results saved');
      setSavedResultsCount(results.length);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('❌ Error saving Cooper test results:', error);
      setErrorMessage(error.message);
      setShowErrorModal(true);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    if (onComplete) {
      const results = [];
      onComplete(results);
    }
    navigation.goBack();
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
        title="Cooper Test"
        subtitle={sport?.name}
        leftIcon="close"
        onLeftPress={handleCancel}
        showAvatar={false}
      />
      <CooperTestLiveTracker
        kids={kids}
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
            <Text style={styles.modalTitle}>Results Saved!</Text>
            <Text style={styles.modalMessage}>
              Cooper test results saved for {savedResultsCount} kid(s)
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
            <Text style={styles.modalTitle}>Cancel Test?</Text>
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
                <Text style={styles.modalButtonText}>Cancel Test</Text>
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

export default CooperTestLiveTrackerScreen;