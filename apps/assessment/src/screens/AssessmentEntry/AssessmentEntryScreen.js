// Location: /apps/assessment/src/screens/AssessmentEntry/AssessmentEntryScreen.js
// FIXED: Use Previous now saves values + proper navigation

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { saveAssessmentResult, getLastAssessmentForKid } from '../../services/assessmentService';
import { useUndo } from '../../contexts/UndoContext';
import { predictNextValue, suggestBenchmarkTarget } from '../../services/suggestionService';
import { useAuth } from '../../contexts/AuthContext';
import { triggerSyncOnChange } from '../../services/autoSyncTrigger';
import MetricInput from '../../components/metrics/MetricInput';
import TimerAssessmentInput from '../../components/metrics/TimerAssessmentInput';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
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
    selectedTests = [],
    assessmentMetadata, // ✅ Receive metadata
    initialKidIndex = 0,
    initialTestIndex = 0,
    existingAssessmentData = {}
  } = route?.params || {};
  
  // Generate unique assessment session ID
  const sessionId = React.useRef(
    route.params?.sessionId || `assessment_${Date.now()}`
  ).current;
  
  console.log('🔍 AssessmentEntry - Received metadata:', assessmentMetadata);
  
  const [currentKidIndex, setCurrentKidIndex] = useState(initialKidIndex);
  const [currentTestIndex, setCurrentTestIndex] = useState(initialTestIndex);
  // Undo functionality
  const { recordAction, undo, canUndo, getLastActionDescription } = useUndo();
  
  // Smart suggestions
  const { user } = useAuth();
  const [suggestion, setSuggestion] = useState(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  
  const [assessmentData, setAssessmentData] = useState(existingAssessmentData);
  const [prefillEnabled, setPrefillEnabled] = useState(false);
  const [lastValues, setLastValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shouldSkip, setShouldSkip] = useState(false);

  // Modal States
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const [exitModal, setExitModal] = useState(false);
  const [missingValueModal, setMissingValueModal] = useState(false);
  const [completeModal, setCompleteModal] = useState(false);
  const [saveErrorModal, setSaveErrorModal] = useState(false);
  const [pairedMetricErrorModal, setPairedMetricErrorModal] = useState(false);

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
  
  const isBeepTest = currentMetric.id === 'beep_test' || 
                      currentMetric.name.toLowerCase().includes('beep test');
  const isCooperTest = currentMetric.id === 'cooper_test' || 
                        currentMetric.name.toLowerCase().includes('cooper test');
  const isPairedTest = currentMetric.pairedWith !== undefined;
  const isTimerTest = currentMetric.type === 'timer';

  const isLastKid = currentKidIndex === kids.length - 1;
  const isLastTest = currentTestIndex === selectedTests.length - 1;

  const loadSmartSuggestion = async () => {
    if (!currentKid?.id || !currentMetric?.id) return;
    
    try {
      setLoadingSuggestion(true);
      
      // Try prediction based on history
      const prediction = await predictNextValue(currentKid.id, currentMetric.id);
      
      if (prediction) {
        setSuggestion({
          type: 'prediction',
          value: prediction.value,
          reason: prediction.reason,
          confidence: prediction.confidence,
        });
      } else {
        // Try benchmark-based suggestion
        const benchmarkTarget = suggestBenchmarkTarget(
          currentMetric.id,
          currentKid.age_group,
          currentKid.gender,
          0 // No current value yet
        );
        
        if (benchmarkTarget && benchmarkTarget.targetValue) {
          setSuggestion({
            type: 'benchmark',
            value: benchmarkTarget.targetValue,
            reason: benchmarkTarget.suggestion,
            confidence: 'low',
          });
        } else {
          setSuggestion(null);
        }
      }
    } catch (error) {
      console.error('Error loading suggestion:', error);
      setSuggestion(null);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  useEffect(() => {
    if (currentKid?.id && currentMetric?.id) {
      // Check if this is a paired metric that's already assessed
      if (isPairedTest && !isBatchMode) {
        const currentValue = getCurrentValue();
        if (currentValue && currentValue !== '' && currentValue !== null) {
          console.log('✅ [AssessmentEntry] Paired metric already assessed:', {
            kid: currentKid.name,
            metric: currentMetric.name,
            value: currentValue,
          });
          setShouldSkip(true);
          return; // Don't load previous data or do anything else
        }
      }
      
      // Load smart suggestion
      loadSmartSuggestion();
      setShouldSkip(false);
      loadPreviousData();
      
      // Auto-fill field if prefill is enabled and value exists
      const currentValue = getCurrentValue();
      if (prefillEnabled && !currentValue && lastValues[currentMetric.id]) {
        saveCurrentValue(lastValues[currentMetric.id]);
      }
      
      // SPECIAL: If Beep Test detected in test-by-test mode, navigate to live tracker
      if (isBeepTest && isBatchMode && currentKidIndex === 0 && currentTestIndex === 0) {
        handleBeepTestLaunch();
      }
      
      // SPECIAL: If Cooper Test detected in test-by-test mode, navigate to live tracker
      if (isCooperTest && isBatchMode && currentKidIndex === 0 && currentTestIndex === 0) {
        handleCooperTestLaunch();
      }
      
      // SPECIAL: If Paired Test detected in test-by-test mode, navigate to paired tracker
      if (isPairedTest && isBatchMode && currentKidIndex === 0) {
        const pairedMetricIndex = selectedTests.findIndex(t => t.id === currentMetric.pairedWith);
        const shouldLaunch = pairedMetricIndex > currentTestIndex || pairedMetricIndex === -1;
        
        if (shouldLaunch) {
          handlePairedTestLaunch();
        }
      }
    }
  }, [currentKid?.id, currentMetric?.id]);

  // NEW: Auto-fill when entering the screen if there's existing data OR previous data with prefill enabled
  useEffect(() => {
    if (currentKid?.id && currentMetric?.id) {
      const currentValue = getCurrentValue();
      const previousValue = lastValues[currentMetric.id];
      
      // If prefill is enabled and field is empty but previous value exists, auto-fill
      if (prefillEnabled && !currentValue && previousValue) {
        saveCurrentValue(previousValue);
      }
    }
  }, [prefillEnabled, lastValues]);

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
      
      // Validate value before saving
      const { validateMetricValue } = await import('../../utils/validators');
      const validation = validateMetricValue(value, currentMetric);
      
      if (!validation.isValid) {
        const { showUserFriendlyError } = await import('../../utils/errorHandlers');
        showUserFriendlyError(new Error(validation.error));
        return;
      }
      
      // Save to local database
      await saveAssessmentResult({
        kid_id: currentKid.id,
        sport_id: sport.id,
        metric_id: currentMetric.id,
        value: value,
        assessment_date: assessmentMetadata?.assessmentDate || new Date().toISOString().split('T')[0],
        metadata: assessmentMetadata,
      });
      
      // Save session state to AsyncStorage for recovery
      const sessionState = {
        sessionId,
        sport,
        kids,
        mode,
        selectedTests,
        assessmentMetadata,
        assessmentData: newData,
        currentKidIndex,
        currentTestIndex,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(`assessment_session_${sessionId}`, JSON.stringify(sessionState));
      
      console.log('✅ Auto-saved:', { kid: currentKid.name, metric: currentMetric.name, value });
      
      // Trigger background sync after saving
      await triggerSyncOnChange('assessment_result_saved');

      // Record action for undo
      const previousValue = assessmentData[key];
      recordAction({
        type: 'metric_change',
        description: `${currentKid.name}: ${currentMetric.name} = ${value}`,
        data: { key, previousValue, newValue: value },
        undo: async () => {
          // Restore previous value
          const restored = { ...assessmentData, [key]: previousValue || '' };
          setAssessmentData(restored);
          
          // Save to database
          if (previousValue) {
            await saveAssessmentResult({
              kid_id: currentKid.id,
              sport_id: sport.id,
              metric_id: currentMetric.id,
              value: previousValue,
              assessment_date: assessmentMetadata?.assessmentDate || new Date().toISOString().split('T')[0],
              metadata: assessmentMetadata,
            });
          }
        },
      });
      
    } catch (error) {
      console.error('❌ Error auto-saving:', error);
      
      // Log error with context
      const { logErrorWithContext } = await import('../../utils/errorHandlers');
      logErrorWithContext(error, {
        operation: 'save_assessment_result',
        kidId: currentKid.id,
        metricId: currentMetric.id,
        value
      });
      
      setSaveErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  // CRITICAL FIX: Handle prefill toggle - auto-save previous values when enabled
  const handlePrefillToggle = async () => {
    const newPrefillState = !prefillEnabled;
    setPrefillEnabled(newPrefillState);
    
    // If enabling prefill and there's a previous value AND current field is empty, save it immediately
    const currentValue = getCurrentValue();
    if (newPrefillState && lastValues[currentMetric.id] && (!currentValue || currentValue === '')) {
      await saveCurrentValue(lastValues[currentMetric.id]);
    }
  };

  const handleBeepTestLaunch = () => {
    console.log('🚀 [AssessmentEntry] Launching Beep Test tracker');
    
    navigation.navigate('BeepTestLiveTracker', {
      sport,
      kids,
      metric: currentMetric,
      assessmentMetadata,
      onComplete: (results) => {
        console.log('✅ [AssessmentEntry] Beep Test onComplete called with results:', results);
        
        if (!results || results.length === 0) {
          console.warn('⚠️ [AssessmentEntry] No results returned from Beep Test');
          navigation.goBack();
          return;
        }
        
        // ✅ Update state using functional setter
        setAssessmentData(prevData => {
          const newAssessmentData = { ...prevData };
          
          results.forEach(result => {
            const key = `${result.kidId}_${currentMetric.id}`;
            const value = result.value || `${result.level}.${result.shuttle}`;
            newAssessmentData[key] = value;
            console.log(`📝 [AssessmentEntry] Saved Beep Test: ${key} = ${value}`);
          });
          
          console.log('📊 [AssessmentEntry] Updated assessment data:', {
            totalKeys: Object.keys(newAssessmentData).length,
            newResults: results.length,
          });
          
          // ✅ Determine navigation INSIDE state update
          setTimeout(() => {
            const nextTestIndex = currentTestIndex + 1;
            const isComplete = nextTestIndex >= selectedTests.length;
            
            console.log('➡️ [AssessmentEntry] Beep Test navigation decision:', {
              currentTestIndex,
              nextTestIndex,
              totalTests: selectedTests.length,
              isComplete,
            });
            
            if (isComplete) {
              console.log('✅ [AssessmentEntry] All tests complete, navigating to summary');
              console.log('📊 [AssessmentEntry] Final assessment data keys:', Object.keys(newAssessmentData));
              
              navigation.replace('AssessmentSummary', { 
                assessmentData: newAssessmentData,
                sport, 
                kids, 
                selectedTests,
                assessmentMetadata,
                sessionId,
              });
            } else {
              console.log(`➡️ [AssessmentEntry] Moving to test ${nextTestIndex + 1}/${selectedTests.length}`);
              setCurrentTestIndex(nextTestIndex);
              setCurrentKidIndex(0);
              navigation.goBack();
            }
          }, 150);
          
          return newAssessmentData;
        });
      }
    });
  };

  const handleCooperTestLaunch = () => {
    console.log('🚀 [AssessmentEntry] Launching Cooper Test tracker');
    
    navigation.navigate('CooperTestLiveTracker', {
      sport,
      kids,
      metric: currentMetric,
      assessmentMetadata,
      onComplete: (results) => {
        console.log('✅ [AssessmentEntry] Cooper Test onComplete called with results:', results);
        
        if (!results || results.length === 0) {
          console.warn('⚠️ [AssessmentEntry] No results returned from Cooper Test');
          navigation.goBack();
          return;
        }
        
        // ✅ Update state using functional setter
        setAssessmentData(prevData => {
          const newAssessmentData = { ...prevData };
          
          results.forEach(result => {
            const key = `${result.kidId}_${currentMetric.id}`;
            const value = result.value || result.totalDistance.toString();
            newAssessmentData[key] = value;
            console.log(`📝 [AssessmentEntry] Saved Cooper Test: ${key} = ${value}`);
          });
          
          console.log('📊 [AssessmentEntry] Updated assessment data:', {
            totalKeys: Object.keys(newAssessmentData).length,
            newResults: results.length,
          });
          
          // ✅ Determine navigation INSIDE state update
          setTimeout(() => {
            const nextTestIndex = currentTestIndex + 1;
            const isComplete = nextTestIndex >= selectedTests.length;
            
            console.log('➡️ [AssessmentEntry] Cooper Test navigation decision:', {
              currentTestIndex,
              nextTestIndex,
              totalTests: selectedTests.length,
              isComplete,
            });
            
            if (isComplete) {
              console.log('✅ [AssessmentEntry] All tests complete, navigating to summary');
              console.log('📊 [AssessmentEntry] Final assessment data keys:', Object.keys(newAssessmentData));
              
              navigation.replace('AssessmentSummary', { 
                assessmentData: newAssessmentData,
                sport, 
                kids, 
                selectedTests,
                assessmentMetadata,
                sessionId,
              });
            } else {
              console.log(`➡️ [AssessmentEntry] Moving to test ${nextTestIndex + 1}/${selectedTests.length}`);
              setCurrentTestIndex(nextTestIndex);
              setCurrentKidIndex(0);
              navigation.goBack();
            }
          }, 150);
          
          return newAssessmentData;
        });
      }
    });
  };

const handlePairedTestLaunch = () => {
    const pairedMetric = selectedTests.find(t => t.id === currentMetric.pairedWith);
    
    if (!pairedMetric) {
      console.error('❌ [AssessmentEntry] Paired metric not found:', currentMetric.pairedWith);
      setPairedMetricErrorModal(true);
      return;
    }

    console.log('🚀 [AssessmentEntry] Launching paired tracker:', {
      metric1: currentMetric.name,
      metric2: pairedMetric.name,
      kids: kids.length,
      currentKidIndex,
      currentTestIndex,
      totalTests: selectedTests.length,
      mode,
    });

    navigation.navigate('PairedAssessmentTracker', {
      sport,
      kids,
      metric1: currentMetric,
      metric2: pairedMetric,
      assessmentMetadata,
      onComplete: (results) => {
        console.log('✅ [AssessmentEntry] Paired test onComplete called with results:', results);
        
        if (!results || results.length === 0) {
          console.warn('⚠️ [AssessmentEntry] No results returned from paired tracker');
          navigation.goBack();
          return;
        }
        
        // ✅ CRITICAL FIX: Update state using functional setter to get latest state
        setAssessmentData(prevData => {
          const newAssessmentData = { ...prevData };
          
          results.forEach(result => {
            const key = `${result.kidId}_${result.metricId}`;
            newAssessmentData[key] = result.value;
            console.log(`📝 [AssessmentEntry] Saved paired result: ${key} = ${result.value}`);
          });
          
          console.log('📊 [AssessmentEntry] Updated assessment data:', {
            totalKeys: Object.keys(newAssessmentData).length,
            newResults: results.length,
          });
          
          // ✅ FIX: Determine next action based on mode
          setTimeout(() => {
            if (mode === 'kid-by-kid') {
              // ✅ Kid-by-Kid: Find indices of BOTH paired metrics
              const pairedMetric1Index = selectedTests.findIndex(t => t.id === currentMetric.id);
              const pairedMetric2Index = selectedTests.findIndex(t => t.id === pairedMetric.id);
              const maxPairedIndex = Math.max(pairedMetric1Index, pairedMetric2Index);
              
              // ✅ Find NEXT UNPAIRED metric (skip any remaining paired metrics)
              let nextTestIndex = maxPairedIndex + 1;
              
              // Skip any other paired metrics that might be in the list
              while (nextTestIndex < selectedTests.length) {
                const nextTest = selectedTests[nextTestIndex];
                const isPaired = nextTest.pairedWith !== undefined;
                
                if (isPaired) {
                  // Check if this paired metric was already handled
                  const pairKey1 = `${currentKid.id}_${nextTest.id}`;
                  const pairKey2 = nextTest.pairedWith ? `${currentKid.id}_${nextTest.pairedWith}` : null;
                  
                  if (newAssessmentData[pairKey1] || (pairKey2 && newAssessmentData[pairKey2])) {
                    // Already assessed, skip it
                    console.log(`⏭️ Skipping already-assessed paired metric: ${nextTest.name}`);
                    nextTestIndex++;
                    continue;
                  }
                }
                
                // Found unpaired or unassessed metric
                break;
              }
              
              console.log('➡️ [Kid-by-Kid] Navigation after paired assessment:', {
                currentKid: kids[currentKidIndex].name,
                pairedMetric1Index,
                pairedMetric2Index,
                maxPairedIndex,
                nextTestIndex,
                nextTestName: nextTestIndex < selectedTests.length ? selectedTests[nextTestIndex].name : 'COMPLETE',
                totalTests: selectedTests.length,
              });
              
              // Check if current kid has more tests
              if (nextTestIndex >= selectedTests.length) {
                // Move to next kid, start from first test
                const nextKidIndex = currentKidIndex + 1;
                
                if (nextKidIndex >= kids.length) {
                  // All kids done - go to summary
                  console.log('✅ [Kid-by-Kid] All kids complete, navigating to summary');
                  navigation.replace('AssessmentSummary', { 
                    assessmentData: newAssessmentData,
                    sport, 
                    kids, 
                    selectedTests,
                    assessmentMetadata,
                    sessionId,
                  });
                } else {
                  // ✅ CRITICAL: For next kid, check if first metric is paired and already assessed
                  let startTestIndex = 0;
                  const firstTest = selectedTests[0];
                  
                  if (firstTest.pairedWith !== undefined) {
                    const nextKid = kids[nextKidIndex];
                    const key1 = `${nextKid.id}_${firstTest.id}`;
                    const key2 = `${nextKid.id}_${firstTest.pairedWith}`;
                    
                    if (newAssessmentData[key1] || newAssessmentData[key2]) {
                      // First metric is paired and already done, skip to next unpaired
                      const pairedIdx1 = 0;
                      const pairedIdx2 = selectedTests.findIndex(t => t.id === firstTest.pairedWith);
                      startTestIndex = Math.max(pairedIdx1, pairedIdx2) + 1;
                      
                      console.log(`⏭️ Next kid's first metric already assessed, starting at index ${startTestIndex}`);
                    }
                  }
                  
                  console.log(`➡️ [Kid-by-Kid] Moving to next kid: ${kids[nextKidIndex].name}, starting at test ${startTestIndex + 1}`);
                  setCurrentKidIndex(nextKidIndex);
                  setCurrentTestIndex(startTestIndex);
                  navigation.goBack();
                }
              } else {
                // Continue with next test for same kid
                console.log(`➡️ [Kid-by-Kid] Next test for ${kids[currentKidIndex].name}: ${selectedTests[nextTestIndex].name}`);
                setCurrentTestIndex(nextTestIndex);
                navigation.goBack();
              }
            } else {
              // ✅ Test-by-Test: Skip BOTH paired metrics, move to next test with all kids
              const pairedMetric1Index = selectedTests.findIndex(t => t.id === currentMetric.id);
              const pairedMetric2Index = selectedTests.findIndex(t => t.id === pairedMetric.id);
              const nextTestIndex = Math.max(pairedMetric1Index, pairedMetric2Index) + 1;
              
              console.log('➡️ [Test-by-Test] Navigation decision:', { 
                pairedMetric1Index,
                pairedMetric2Index,
                nextTestIndex,
                totalTests: selectedTests.length,
                isComplete: nextTestIndex >= selectedTests.length,
              });
              
              if (nextTestIndex >= selectedTests.length) {
                console.log('✅ [Test-by-Test] All tests complete, navigating to summary');
                navigation.replace('AssessmentSummary', { 
                  assessmentData: newAssessmentData,
                  sport, 
                  kids, 
                  selectedTests,
                  assessmentMetadata,
                  sessionId,
                });
              } else {
                console.log(`➡️ [Test-by-Test] Moving to next test: ${nextTestIndex + 1}/${selectedTests.length}`);
                setCurrentTestIndex(nextTestIndex);
                setCurrentKidIndex(0);
                navigation.goBack();
              }
            }
          }, 150);
          
          return newAssessmentData;
        });
      }
    });
  };

  const handleNext = async () => {
    const currentValue = getCurrentValue();
    
    // ✅ Allow skipping if already assessed (for auto-skip logic)
    const isAlreadyAssessed = currentValue !== '' && currentValue !== null && currentValue !== undefined;
    
    if (!isAlreadyAssessed) {
      setMissingValueModal(true);
      return;
    }

    // Determine next indices
    let nextKidIndex = currentKidIndex;
    let nextTestIndex = currentTestIndex;
    let isComplete = false;

    if (isBatchMode) {
      if (isLastKid) {
        if (isLastTest) {
          isComplete = true;
        } else {
          nextTestIndex = currentTestIndex + 1;
          nextKidIndex = 0;
        }
      } else {
        nextKidIndex = currentKidIndex + 1;
      }
    } else {
      // ✅ Kid-by-Kid mode
      if (isLastTest) {
        if (isLastKid) {
          isComplete = true;
        } else {
          nextKidIndex = currentKidIndex + 1;
          nextTestIndex = 0;
        }
      } else {
        nextTestIndex = currentTestIndex + 1;
      }
    }

    if (isComplete) {
      // Clear session state
      await AsyncStorage.removeItem(`assessment_session_${sessionId}`);
      handleComplete();
    } else {
      // Update indices and save state
      setCurrentKidIndex(nextKidIndex);
      setCurrentTestIndex(nextTestIndex);
      
      // Save updated session state
      const sessionState = {
        sessionId,
        sport,
        kids,
        mode,
        selectedTests,
        assessmentMetadata,
        assessmentData,
        currentKidIndex: nextKidIndex,
        currentTestIndex: nextTestIndex,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(`assessment_session_${sessionId}`, JSON.stringify(sessionState));
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

  // ✅ Show already-assessed indicator if this metric was completed in paired tracker
  if (shouldSkip) {
    return (
      <View style={styles.container}>
        <Header
          title="Assessment"
          subtitle={`${sport?.name || 'Sport'} • ${isBatchMode ? 'Test-by-Test' : 'Kid-by-Kid'}`}
          leftIcon="←"
          onLeftPress={handlePrevious}
          showAvatar={false}
        />
        
        <View style={styles.scrollableContent}>
          <View style={styles.alreadyAssessedContainer}>
            <View style={styles.alreadyAssessedIcon}>
              <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
            </View>
            <Text style={styles.alreadyAssessedTitle}>Already Assessed</Text>
            <Text style={styles.alreadyAssessedText}>
              {currentKid.name}'s {currentMetric.name} was completed in the paired assessment.
            </Text>
            <View style={styles.alreadyAssessedValue}>
              <Text style={styles.alreadyAssessedLabel}>Score:</Text>
              <Text style={styles.alreadyAssessedScore}>{getCurrentValue()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, styles.previousButton]}
            onPress={handlePrevious}
            disabled={currentKidIndex === 0 && currentTestIndex === 0}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.white} />
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, styles.nextButton, styles.nextButtonEnabled]}
            onPress={handleNext}
          >
            <Text style={styles.navButtonText}>
              {isLastKid && isLastTest ? 'Complete' : 'Skip to Next'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Assessment"
        subtitle={`${sport?.name || 'Sport'} • ${isBatchMode ? 'Test-by-Test' : 'Kid-by-Kid'}`}
        leftIcon="←"
        onLeftPress={() => setExitModal(true)}
        showAvatar={false}
      />

      {/* Scrollable Content Area - Everything scrolls together */}
      <View style={styles.scrollableContent}>
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={true}
        >
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

          {/* Prefill Toggle */}
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
                <LoadingSpinner size="small" color={COLORS.primary} />
                <Text style={styles.savingText}>Saving...</Text>
              </View>
            )}
          </View>
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

        {/* Metric Input or Group/Timer Test */}
        {isTimerTest ? (
          <TimerAssessmentInput
            metric={currentMetric}
            value={getCurrentValue()}
            onChange={saveCurrentValue}
            previousValue={lastValues[currentMetric.id]}
            showPrevious={prefillEnabled}
            kidName={currentKid.name}
            key={`${currentKid.id}_${currentMetric.id}`}
          />
        ) : isPairedTest && !isBatchMode ? (
          <View style={styles.beepTestCard}>
            <View style={styles.beepTestIconContainer}>
              <Ionicons name="people" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.beepTestTitle}>Paired Assessment</Text>
            <Text style={styles.beepTestDescription}>
              {currentMetric.name} & {selectedTests.find(t => t.id === currentMetric.pairedWith)?.name || 'Paired Skill'} - assess both skills simultaneously with pairs of kids
            </Text>
            <TouchableOpacity
              style={styles.beepTestButton}
              onPress={handlePairedTestLaunch}
            >
              <Ionicons name="people-circle" size={24} color={COLORS.white} />
              <Text style={styles.beepTestButtonText}>Launch Paired Tracker</Text>
            </TouchableOpacity>
            
            <View style={styles.beepTestDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <Text style={styles.manualEntryLabel}>Enter score manually if already assessed:</Text>
            <MetricInput
              metric={currentMetric}
              value={getCurrentValue()}
              onChange={saveCurrentValue}
              previousValue={lastValues[currentMetric.id]}
              showPrevious={prefillEnabled}
            />
          </View>
        ) : isCooperTest && !isBatchMode ? (
          <View style={styles.beepTestCard}>
            <View style={styles.beepTestIconContainer}>
              <Ionicons name="timer-outline" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.beepTestTitle}>Group Cooper Test</Text>
            <Text style={styles.beepTestDescription}>
              12-minute run test with lap tracking - best conducted with all kids at once
            </Text>
            <TouchableOpacity
              style={styles.beepTestButton}
              onPress={handleCooperTestLaunch}
            >
              <Ionicons name="play-circle" size={24} color={COLORS.white} />
              <Text style={styles.beepTestButtonText}>Launch Live Tracker</Text>
            </TouchableOpacity>
            
            <View style={styles.beepTestDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <Text style={styles.manualEntryLabel}>Enter distance manually if already completed:</Text>
            <MetricInput
              metric={currentMetric}
              value={getCurrentValue()}
              onChange={saveCurrentValue}
              previousValue={lastValues[currentMetric.id]}
              showPrevious={prefillEnabled}
            />
          </View>
        ) : isBeepTest && !isBatchMode ? (
          <View style={styles.beepTestCard}>
            <View style={styles.beepTestIconContainer}>
              <Ionicons name="fitness" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.beepTestTitle}>Group Beep Test</Text>
            <Text style={styles.beepTestDescription}>
              This test is best conducted with all kids at once using the live tracker
            </Text>
            <TouchableOpacity
              style={styles.beepTestButton}
              onPress={handleBeepTestLaunch}
            >
              <Ionicons name="play-circle" size={24} color={COLORS.white} />
              <Text style={styles.beepTestButtonText}>Launch Live Tracker</Text>
            </TouchableOpacity>
            
            <View style={styles.beepTestDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <Text style={styles.manualEntryLabel}>Enter manually if already completed:</Text>
            <MetricInput
              metric={currentMetric}
              value={getCurrentValue()}
              onChange={saveCurrentValue}
              previousValue={lastValues[currentMetric.id]}
              showPrevious={prefillEnabled}
            />
          </View>
        ) : (
          <MetricInput
            metric={currentMetric}
            value={getCurrentValue()}
            onChange={saveCurrentValue}
            previousValue={lastValues[currentMetric.id]}
            showPrevious={prefillEnabled}
          />
        )}

        {/* Smart Suggestion */}
        {suggestion && !getCurrentValue() && (
          <TouchableOpacity
            style={styles.suggestionCard}
            onPress={() => saveCurrentValue(suggestion.value)}
          >
            <View style={styles.suggestionHeader}>
              <Ionicons 
                name={suggestion.confidence === 'high' ? 'bulb' : 'bulb-outline'} 
                size={20} 
                color={COLORS.primary} 
              />
              <Text style={styles.suggestionTitle}>
                {suggestion.type === 'prediction' ? 'Predicted Value' : 'Suggested Target'}
              </Text>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>{suggestion.confidence}</Text>
              </View>
            </View>
            <Text style={styles.suggestionValue}>
              {suggestion.value} {currentMetric.unit || ''}
            </Text>
            <Text style={styles.suggestionReason}>{suggestion.reason}</Text>
            <Text style={styles.suggestionAction}>Tap to use this value</Text>
          </TouchableOpacity>
        )}

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
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {/* Undo Button */}
        {canUndo() && (
          <TouchableOpacity
            style={styles.undoButton}
            onPress={async () => {
              await undo();
              // Show toast
              const description = getLastActionDescription();
              console.log('↩️ Undone:', description);
            }}
          >
            <Ionicons name="arrow-undo" size={20} color={COLORS.white} />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.navButton, 
            styles.previousButton,
            // ✅ Only disable at the very first screen
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
        message={`Progress saved: ${Object.keys(assessmentData).length} of ${kids.length * selectedTests.length} tests completed.\n\nYou can resume from where you left off.`}
        icon="exit-outline"
        iconColor={COLORS.warning}
        buttons={[
          { 
            text: 'Continue', 
            style: 'cancel',
            onPress: () => setExitModal(false)
          },
          { 
            text: 'Save & Exit', 
            onPress: async () => {
              // Save current session state before exiting
              const sessionState = {
                sessionId,
                sport,
                kids,
                mode,
                selectedTests,
                assessmentMetadata,
                assessmentData,
                currentKidIndex,
                currentTestIndex,
                lastUpdated: new Date().toISOString(),
              };
              await AsyncStorage.setItem(`assessment_session_${sessionId}`, JSON.stringify(sessionState));
              setExitModal(false);
              navigation.navigate('Home');
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
            onPress: async () => {
              // Clear session state
              await AsyncStorage.removeItem(`assessment_session_${sessionId}`);
              setCompleteModal(false);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            }
          },
          { 
            text: 'View Summary', 
            onPress: async () => {
              // Clear session state
              await AsyncStorage.removeItem(`assessment_session_${sessionId}`);
              setCompleteModal(false);
              // Use replace to swap current screen with summary
              navigation.replace('AssessmentSummary', { 
                assessmentData, 
                sport, 
                kids, 
                selectedTests,
                assessmentMetadata: assessmentMetadata,
                sessionId, // Pass sessionId for tracking
              });
            }
          }
        ]}
      />

      {/* Paired Metric Error Modal */}
      <CustomModal
        visible={pairedMetricErrorModal}
        title="Error"
        message="Paired metric not found in selected tests"
        icon="alert-circle"
        iconColor={COLORS.error}
        buttons={[
          { 
            text: 'OK', 
            onPress: () => setPairedMetricErrorModal(false)
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
    marginBottom: 0,
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
    marginBottom: 16,
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
  
  // Scrollable Content Area
  scrollableContent: {
    position: 'absolute',
    top: 126, // Header height (~88-90px)
    left: 0,
    right: 0,
    bottom: 82, // Navigation container height (81px) + border (1px)
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: { 
    paddingBottom: 20,
  },
  
  // Kid Info
  kidInfoCard: { 
    backgroundColor: COLORS.white, 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12,
    marginHorizontal: 16,
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
    marginHorizontal: 16,
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
    marginHorizontal: 16,
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row', 
    padding: 16, 
    backgroundColor: COLORS.white, 
    borderTopWidth: 1, 
    borderTopColor: COLORS.border, 
    gap: 12,
    elevation: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    backgroundColor: COLORS.success  // ✅ Green background
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
  
  // Beep Test Styles
  beepTestCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  beepTestIconContainer: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  beepTestTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  beepTestDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  beepTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  beepTestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  beepTestDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  manualEntryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  // Already Assessed Styles
  alreadyAssessedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  alreadyAssessedIcon: {
    marginBottom: 24,
  },
  alreadyAssessedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  alreadyAssessedText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  alreadyAssessedValue: {
    backgroundColor: COLORS.successLight || COLORS.success + '20',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alreadyAssessedLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  alreadyAssessedScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  
  // Undo Button
  undoButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.warning,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  
  // Smart Suggestion Styles
  suggestionCard: {
    backgroundColor: COLORS.primaryLight + '20',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
    borderStyle: 'dashed',
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  suggestionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  suggestionReason: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  suggestionAction: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default AssessmentEntryScreen;