// Location: /apps/assessment/src/screens/AssessmentEntry/AssessmentEntryScreen.js
// FIXED: Use Previous now saves values + proper navigation

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { saveAssessmentResult, getLastAssessmentForKid } from '../../services/assessmentService';
import MetricInput from '../../components/metrics/MetricInput';
import Header from '../../components/common/Header';
import { COLORS } from '../../utils/constants';

// Custom Modal Component
const CustomModal = ({ visible, title, message, buttons, icon, iconColor }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {icon && (
            <View style={[styles.modalIconContainer, { backgroundColor: iconColor + '20' }]}>
              <Ionicons name={icon} size={48} color={iconColor} />
            </View>
          )}
          <Text style={styles.modalTitle}>{title}</Text>
          {message && <Text style={styles.modalMessage}>{message}</Text>}
          <View style={styles.modalButtons}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.modalButton,
                  button.style === 'cancel' && styles.modalButtonSecondary,
                  button.style === 'destructive' && styles.modalButtonDestructive,
                  buttons.length === 1 && styles.modalButtonFull
                ]}
                onPress={button.onPress}
              >
                <Text style={[
                  styles.modalButtonText,
                  button.style === 'cancel' && styles.modalButtonTextSecondary,
                  button.style === 'destructive' && styles.modalButtonTextDestructive
                ]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const AssessmentEntryScreen = ({ route, navigation }) => {
  const { 
    sport, 
    kids = [], 
    mode,
    selectedTests = [] 
  } = route?.params || {};
  
  const [currentKidIndex, setCurrentKidIndex] = useState(0);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [assessmentData, setAssessmentData] = useState({});
  const [prefillEnabled, setPrefillEnabled] = useState(false);
  const [lastValues, setLastValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal States
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const [exitModal, setExitModal] = useState(false);
  const [missingValueModal, setMissingValueModal] = useState(false);
  const [completeModal, setCompleteModal] = useState(false);
  const [saveErrorModal, setSaveErrorModal] = useState(false);

  const isBatchMode = mode === 'test-by-test';

  // Validate data on mount
  useEffect(() => {
    console.log('📊 AssessmentEntry params:', { 
      sport: sport?.name, 
      kidsCount: kids?.length, 
      testsCount: selectedTests?.length,
      mode 
    });

    if (!kids || kids.length === 0) {
      setErrorModal({
        visible: true,
        title: 'Error',
        message: 'No kids selected'
      });
      return;
    }
    
    if (!selectedTests || selectedTests.length === 0) {
      setErrorModal({
        visible: true,
        title: 'Error',
        message: 'No tests selected'
      });
      return;
    }
    
    if (!sport || !sport.id) {
      setErrorModal({
        visible: true,
        title: 'Error',
        message: 'Invalid sport'
      });
      return;
    }
  }, []);

  const currentKid = kids[currentKidIndex];
  const currentTest = selectedTests[currentTestIndex];
  
  const currentMetric = typeof currentTest === 'string' 
    ? { id: currentTest, name: currentTest, type: 'numeric' } 
    : currentTest;

  const isLastKid = currentKidIndex === kids.length - 1;
  const isLastTest = currentTestIndex === selectedTests.length - 1;

  useEffect(() => {
    if (currentKid?.id && currentMetric?.id) {
      loadPreviousData();
    }
  }, [currentKid?.id, currentMetric?.id]);

  const loadPreviousData = async () => {
    try {
      if (!currentKid?.id || !sport?.id) return;
      
      setLoading(true);
      const lastAssessment = await getLastAssessmentForKid(currentKid.id, sport.id);
      
      if (lastAssessment?.results) {
        const previousValues = {};
        lastAssessment.results.forEach(result => {
          previousValues[result.metric_id] = result.value;
        });
        setLastValues(previousValues);
      }
    } catch (error) {
      console.error('Error loading previous data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentValue = () => {
    if (!currentKid?.id || !currentMetric?.id) return '';
    
    const key = `${currentKid.id}_${currentMetric.id}`;
    return assessmentData[key] || '';
  };

  const saveCurrentValue = async (value) => {
    if (!currentKid?.id || !currentMetric?.id || !sport?.id) return;
    
    const key = `${currentKid.id}_${currentMetric.id}`;
    const newData = { ...assessmentData, [key]: value };
    setAssessmentData(newData);

    try {
      setSaving(true);
      await saveAssessmentResult({
        kid_id: currentKid.id,
        sport_id: sport.id,
        metric_id: currentMetric.id,
        value: value,
        assessment_date: new Date().toISOString(),
      });
      console.log('✅ Auto-saved:', { kid: currentKid.name, metric: currentMetric.name, value });
    } catch (error) {
      console.error('❌ Error auto-saving:', error);
      setSaveErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  // CRITICAL FIX: Handle prefill toggle - auto-save previous values when enabled
  const handlePrefillToggle = async () => {
    const newPrefillState = !prefillEnabled;
    setPrefillEnabled(newPrefillState);
    
    // If enabling prefill and there's a previous value, save it immediately
    if (newPrefillState && lastValues[currentMetric.id]) {
      await saveCurrentValue(lastValues[currentMetric.id]);
    }
  };

  const handleNext = async () => {
    const currentValue = getCurrentValue();
    
    if (!currentValue || currentValue === '') {
      setMissingValueModal(true);
      return;
    }

    if (isBatchMode) {
      if (isLastKid) {
        if (isLastTest) {
          handleComplete();
        } else {
          setCurrentTestIndex(prev => prev + 1);
          setCurrentKidIndex(0);
        }
      } else {
        setCurrentKidIndex(prev => prev + 1);
      }
    } else {
      if (isLastTest) {
        if (isLastKid) {
          handleComplete();
        } else {
          setCurrentKidIndex(prev => prev + 1);
          setCurrentTestIndex(0);
        }
      } else {
        setCurrentTestIndex(prev => prev + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (isBatchMode) {
      if (currentKidIndex > 0) {
        setCurrentKidIndex(prev => prev - 1);
      } else if (currentTestIndex > 0) {
        setCurrentTestIndex(prev => prev - 1);
        setCurrentKidIndex(kids.length - 1);
      }
    } else {
      if (currentTestIndex > 0) {
        setCurrentTestIndex(prev => prev - 1);
      } else if (currentKidIndex > 0) {
        setCurrentKidIndex(prev => prev - 1);
        setCurrentTestIndex(selectedTests.length - 1);
      }
    }
  };

  const handleComplete = () => {
    setCompleteModal(true);
  };

  const calculateProgress = () => {
    const totalItems = kids.length * selectedTests.length;
    const completed = Object.keys(assessmentData).length;
    return totalItems > 0 ? Math.round((completed / totalItems) * 100) : 0;
  };

  const canGoNext = () => {
    const value = getCurrentValue();
    return value !== undefined && value !== '' && value !== null;
  };

  // Show error if data is invalid
  if (!currentKid || !currentMetric) {
    return (
      <View style={styles.container}>
        <Header
          title="Assessment"
          leftIcon="←"
          onLeftPress={() => navigation.goBack()}
          showAvatar={false}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={COLORS.error} />
          <Text style={styles.errorTitle}>Invalid Assessment Data</Text>
          <Text style={styles.errorText}>
            Kids: {kids?.length || 0}, Tests: {selectedTests?.length || 0}
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>

        {/* Error Modal */}
        <CustomModal
          visible={errorModal.visible}
          title={errorModal.title}
          message={errorModal.message}
          icon="alert-circle"
          iconColor={COLORS.error}
          buttons={[
            { 
              text: 'OK', 
              onPress: () => {
                setErrorModal({ visible: false, title: '', message: '' });
                navigation.goBack();
              }
            }
          ]}
        />
      </View>
    );
  }

  const totalItems = kids.length * selectedTests.length;
  const completedItems = Object.keys(assessmentData).length;

  return (
    <View style={styles.container}>
      <Header
        title="Assessment"
        subtitle={`${sport?.name || 'Sport'} • ${isBatchMode ? 'Test-by-Test' : 'Kid-by-Kid'}`}
        leftIcon="←"
        onLeftPress={() => setExitModal(true)}
        showAvatar={false}
      />

      {/* Progress Header */}
      <View style={styles.progressHeader}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {isBatchMode 
              ? `${currentMetric.name} • Kid ${currentKidIndex + 1}/${kids.length}`
              : `${currentKid.name} • Test ${currentTestIndex + 1}/${selectedTests.length}`
            }
          </Text>
          <View style={styles.progressBadge}>
            <Ionicons name="checkmark-done" size={14} color={COLORS.primary} />
            <Text style={styles.progressPercentage}>{calculateProgress()}%</Text>
          </View>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${calculateProgress()}%` }]} />
        </View>
      </View>

      {/* Prefill Toggle - FIXED */}
      <View style={styles.prefillContainer}>
        <TouchableOpacity
          style={styles.prefillToggle}
          onPress={handlePrefillToggle}
        >
          <View style={[styles.toggleCircle, prefillEnabled && styles.toggleActive]}>
            {prefillEnabled && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
          </View>
          <Text style={styles.prefillText}>Use Previous Values</Text>
        </TouchableOpacity>
        {saving && (
          <View style={styles.savingBadge}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.savingText}>Saving...</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Kid Info Card */}
        <View style={styles.kidInfoCard}>
          <View style={styles.kidInfoHeader}>
            <Ionicons name="person-circle" size={40} color={COLORS.primary} />
            <View style={styles.kidInfoText}>
              <Text style={styles.kidName}>{currentKid.name}</Text>
              <Text style={styles.kidDetails}>
                Age {currentKid.age} • {currentKid.age_group} • {currentKid.gender}
              </Text>
            </View>
          </View>
        </View>

        {/* Test Info Card */}
        <View style={styles.testInfoCard}>
          <View style={styles.testHeader}>
            <View style={styles.testIconContainer}>
              <Ionicons name="clipboard" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.testInfo}>
              <Text style={styles.testName}>{currentMetric.name}</Text>
              <Text style={styles.testMeta}>
                {currentMetric.type} {currentMetric.unit && `• ${currentMetric.unit}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Metric Input */}
        <MetricInput
          metric={currentMetric}
          value={getCurrentValue()}
          onChange={saveCurrentValue}
          previousValue={lastValues[currentMetric.id]}
          showPrevious={prefillEnabled}
        />

        {/* Previous Value Reference */}
        {lastValues[currentMetric.id] && !prefillEnabled && (
          <View style={styles.previousValueCard}>
            <Ionicons name="time-outline" size={18} color={COLORS.primary} />
            <View style={styles.previousValueContent}>
              <Text style={styles.previousLabel}>Last Assessment:</Text>
              <Text style={styles.previousValue}>
                {lastValues[currentMetric.id]} {currentMetric.unit || ''}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[
            styles.navButton, 
            styles.previousButton,
            (currentKidIndex === 0 && currentTestIndex === 0) && styles.disabledButton
          ]}
          onPress={handlePrevious}
          disabled={currentKidIndex === 0 && currentTestIndex === 0}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.white} />
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton, 
            styles.nextButton,
            !canGoNext() && styles.disabledButton
          ]}
          onPress={handleNext}
          disabled={!canGoNext()}
        >
          <Text style={styles.navButtonText}>
            {isLastKid && isLastTest ? 'Complete' : 'Next'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Exit Confirmation Modal */}
      <CustomModal
        visible={exitModal}
        title="Exit Assessment?"
        message="Progress is auto-saved. You can resume later."
        icon="exit-outline"
        iconColor={COLORS.warning}
        buttons={[
          { 
            text: 'Continue', 
            style: 'cancel',
            onPress: () => setExitModal(false)
          },
          { 
            text: 'Exit', 
            onPress: () => {
              setExitModal(false);
              navigation.goBack();
            }
          }
        ]}
      />

      {/* Missing Value Modal */}
      <CustomModal
        visible={missingValueModal}
        title="Missing Value"
        message="Please enter a value before proceeding"
        icon="warning"
        iconColor={COLORS.warning}
        buttons={[
          { 
            text: 'OK', 
            onPress: () => setMissingValueModal(false)
          }
        ]}
      />

      {/* Save Error Modal */}
      <CustomModal
        visible={saveErrorModal}
        title="Warning"
        message="Failed to save result. Data is stored locally."
        icon="cloud-offline"
        iconColor={COLORS.warning}
        buttons={[
          { 
            text: 'OK', 
            onPress: () => setSaveErrorModal(false)
          }
        ]}
      />

      {/* Complete Modal */}
      <CustomModal
        visible={completeModal}
        title="Assessment Complete! 🎉"
        message={`Saved ${completedItems} of ${totalItems} results.\n\nAll data has been saved locally and will sync to cloud.`}
        icon="checkmark-circle"
        iconColor={COLORS.success}
        buttons={[
          { 
            text: 'Done', 
            style: 'cancel',
            onPress: () => {
              setCompleteModal(false);
              navigation.navigate('Home');
            }
          },
          { 
            text: 'View Summary', 
            onPress: () => {
              setCompleteModal(false);
              navigation.navigate('AssessmentSummary', { 
                assessmentData, 
                sport, 
                kids, 
                selectedTests 
              });
            }
          }
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: COLORS.backgroundDark,
  },
  modalButtonDestructive: {
    backgroundColor: COLORS.error,
  },
  modalButtonFull: {
    flex: 1,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  modalButtonTextSecondary: {
    color: COLORS.text,
  },
  modalButtonTextDestructive: {
    color: COLORS.white,
  },
  
  // Error State
  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 32 
  },
  errorTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: COLORS.text, 
    marginTop: 16, 
    marginBottom: 8 
  },
  errorText: { 
    fontSize: 14, 
    color: COLORS.textSecondary, 
    marginBottom: 24, 
    textAlign: 'center' 
  },
  errorButton: { 
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 32, 
    paddingVertical: 12, 
    borderRadius: 8 
  },
  errorButtonText: { 
    color: COLORS.white, 
    fontSize: 16, 
    fontWeight: '600' 
  },
  
  // Progress Header
  progressHeader: { 
    backgroundColor: COLORS.white, 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border 
  },
  progressInfo: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  progressText: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: COLORS.text, 
    flex: 1 
  },
  progressBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.primaryLight, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8, 
    gap: 4 
  },
  progressPercentage: { 
    fontSize: 13, 
    fontWeight: 'bold', 
    color: COLORS.primary 
  },
  progressBarContainer: { 
    height: 6, 
    backgroundColor: COLORS.backgroundDark, 
    borderRadius: 3, 
    overflow: 'hidden' 
  },
  progressBarFill: { 
    height: '100%', 
    backgroundColor: COLORS.primary, 
    borderRadius: 3 
  },
  
  // Prefill Toggle
  prefillContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: COLORS.white, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border 
  },
  prefillToggle: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  toggleCircle: { 
    width: 24, 
    height: 24, 
    borderRadius: 4, 
    borderWidth: 2, 
    borderColor: COLORS.primary, 
    marginRight: 8, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  toggleActive: { 
    backgroundColor: COLORS.primary 
  },
  prefillText: { 
    fontSize: 14, 
    color: COLORS.text, 
    fontWeight: '500' 
  },
  savingBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  savingText: { 
    fontSize: 12, 
    color: COLORS.textSecondary 
  },
  
  // Content
  content: { flex: 1 },
  contentContainer: { padding: 16 },
  
  // Kid Info
  kidInfoCard: { 
    backgroundColor: COLORS.white, 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12, 
    elevation: 2, 
    shadowColor: COLORS.shadow, 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4 
  },
  kidInfoHeader: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  kidInfoText: { 
    flex: 1, 
    marginLeft: 12 
  },
  kidName: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: COLORS.text, 
    marginBottom: 4 
  },
  kidDetails: { 
    fontSize: 14, 
    color: COLORS.textSecondary 
  },
  
  // Test Info
  testInfoCard: { 
    backgroundColor: COLORS.white, 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 16, 
    elevation: 2, 
    shadowColor: COLORS.shadow, 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4 
  },
  testHeader: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  testIconContainer: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: COLORS.primaryLight, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  testInfo: { flex: 1 },
  testName: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: COLORS.text, 
    marginBottom: 4 
  },
  testMeta: { 
    fontSize: 13, 
    color: COLORS.textSecondary 
  },
  
  // Previous Value
  previousValueCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.primaryLight + '20', 
    padding: 12, 
    borderRadius: 8, 
    marginTop: 16, 
    gap: 8 
  },
  previousValueContent: { flex: 1 },
  previousLabel: { 
    fontSize: 12, 
    color: COLORS.textSecondary, 
    marginBottom: 2 
  },
  previousValue: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: COLORS.primary 
  },
  
  // Navigation
  navigationContainer: { 
    flexDirection: 'row', 
    padding: 16, 
    backgroundColor: COLORS.white, 
    borderTopWidth: 1, 
    borderTopColor: COLORS.border, 
    gap: 12 
  },
  navButton: { 
    flex: 1, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 14, 
    borderRadius: 8, 
    gap: 6 
  },
  previousButton: { 
    backgroundColor: COLORS.textSecondary 
  },
  nextButton: { 
    backgroundColor: COLORS.primary 
  },
  disabledButton: { 
    backgroundColor: COLORS.border 
  },
  navButtonText: { 
    color: COLORS.white, 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});

export default AssessmentEntryScreen;