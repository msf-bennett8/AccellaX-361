// Location: /apps/assessment/src/screens/AssessmentSummary/AssessmentSummaryScreen.js
// FIXED: Complete Assessment Summary with Custom Modals

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { COLORS } from '../../utils/constants';
import { syncAssessmentsToFirebase } from '../../services/assessmentService';
import { 
  copyLastAssessment, 
  bulkCopyAssessments, 
  exportToCSV, 
  downloadCSV 
} from '../../services/batchOperationsService';

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

const AssessmentSummaryScreen = ({ route, navigation }) => {
  const { assessmentData = {}, sport = {}, kids = [], selectedTests = [], assessmentMetadata } = route.params || {};
  
  const [syncing, setSyncing] = useState(false);
  const [groupedData, setGroupedData] = useState({});
  const [totalEntries, setTotalEntries] = useState(0);
  const [completedEntries, setCompletedEntries] = useState(0);

  // Modal States
  const [syncCompleteModal, setSyncCompleteModal] = useState(false);
  const [syncErrorModal, setSyncErrorModal] = useState(false);
  const [editConfirmModal, setEditConfirmModal] = useState({ visible: false, kidId: null, testId: null });
  const [doneConfirmModal, setDoneConfirmModal] = useState(false);
  const [copyModal, setCopyModal] = useState(false);
  const [exportModal, setExportModal] = useState(false);
  const [batchProgressModal, setBatchProgressModal] = useState({ visible: false, message: '', progress: 0 });
  
  // ✅ ADD: Generic modal config for error handling
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info', // 'success', 'error', 'warning', 'info'
    showCancel: false,
    confirmText: 'OK',
    cancelText: 'Cancel',
    onConfirm: () => {},
    onCancel: () => {},
  });
  
  // Quick Filters
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    processAssessmentData();
  }, []);

  const processAssessmentData = async () => {
    const grouped = {};
    let total = 0;
    let completed = 0;

    // ✅ Import the service at the top of the file
    // import { getAssessmentsByDateRange } from '../../database/queries';
    
    // ✅ Load actual data from database instead of relying on assessmentData state
    const assessmentDate = assessmentMetadata?.assessmentDate || new Date().toISOString().split('T')[0];
    
    // Query database for today's assessments
    const { default: queries } = await import('../../database/queries');
    const todaysAssessments = await queries.getAssessmentsByDateRange(
      assessmentDate,
      assessmentDate,
      sport.id
    );

    kids.forEach(kid => {
      const results = selectedTests.map(test => {
        const testId = typeof test === 'string' ? test : test.id;
        
        // ✅ Find actual result from database instead of assessmentData state
        const kidAssessment = todaysAssessments.find(a => a.kid_id === kid.id);
        const result = kidAssessment?.results?.find(r => r.metric_id === testId);
        const value = result?.value || assessmentData[`${kid.id}_${testId}`];
        
        total++;
        if (value !== undefined && value !== null && value !== '') {
          completed++;
        }
        
        console.log(`📊 [Summary] ${kid.name} - ${test.name}:`, value || 'NOT FOUND');
        
        return {
          test: typeof test === 'string' ? { id: test, name: test, type: 'numeric' } : test,
          value: value || null,
          key: `${kid.id}_${testId}`,
        };
      });

      grouped[kid.id] = {
        kid,
        results,
        completionRate: Math.round((results.filter(r => r.value).length / results.length) * 100),
      };
    });

    // Apply active filter
    let filteredGrouped = { ...grouped };
    
    if (activeFilter === 'completed') {
      filteredGrouped = Object.fromEntries(
        Object.entries(grouped).filter(([kidId, data]) => data.completionRate === 100)
      );
    } else if (activeFilter === 'missing') {
      filteredGrouped = Object.fromEntries(
        Object.entries(grouped).filter(([kidId, data]) => data.completionRate < 100)
      );
    } else if (activeFilter === 'below_average') {
      // Filter kids with any metric below benchmark "good" level
      filteredGrouped = Object.fromEntries(
        Object.entries(grouped).filter(([kidId, data]) => {
          return data.results.some(r => {
            if (!r.value) return false;
            // Simple heuristic: check if any numeric value is below expected
            return parseFloat(r.value) < 50; // Adjust based on actual benchmark logic
          });
        })
      );
    }

    setGroupedData(grouped);
    setTotalEntries(total);
    setCompletedEntries(completed);
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      
      const result = await syncAssessmentsToFirebase();
      
      if (result.conflicts && result.conflicts > 0) {
        // Show conflict warning modal
        setModalConfig({
          visible: true,
          title: 'Sync Conflicts Detected',
          message: `${result.conflicts} conflict(s) detected. Some assessments require manual resolution. Go to Settings > Sync Conflicts to resolve them.`,
          type: 'warning',
          showCancel: true,
          confirmText: 'Resolve Now',
          cancelText: 'Later',
          onConfirm: () => {
            setModalConfig({ ...modalConfig, visible: false });
            navigation.navigate('Settings', { screen: 'ConflictResolution' });
          },
          onCancel: () => setModalConfig({ ...modalConfig, visible: false }),
        });
      } else {
        setSyncCompleteModal(true);
      }
      
      setSyncing(false);
    } catch (error) {
      console.error('❌ Sync error:', error);
      
      // Log error with context
      try {
        const { logErrorWithContext } = await import('../../utils/errorHandler');
        logErrorWithContext(error, {
          operation: 'sync_assessments_to_firebase',
          assessmentCount: completedEntries
        });
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
      
      setSyncing(false);
      setSyncErrorModal(true);
    }
  };

  const handleCopyToNewDate = async () => {
    setCopyModal(true);
  };

  const handleExportCSV = async () => {
    try {
      // ✅ Validate Platform import
      if (!Platform) {
        throw new Error('Platform module not available');
      }
      
      const assessmentIds = Object.keys(groupedData)
        .map(kidId => groupedData[kidId].assessment?.id)
        .filter(Boolean);
      
      const csvData = await exportToCSV(assessmentIds);
      
      if (Platform.OS === 'web') {
        downloadCSV(csvData, `assessments_${new Date().toISOString().split('T')[0]}.csv`);
      }
      
      setModalConfig({
        visible: true,
        title: 'Export Complete',
        message: 'Assessment data exported successfully!',
        type: 'success',
        onConfirm: () => setModalConfig({ ...modalConfig, visible: false }),
      });
    } catch (error) {
      console.error('❌ Export error:', error);
      
      // ✅ User-friendly error handling
      setModalConfig({
        visible: true,
        title: 'Export Failed',
        message: error.message || 'Failed to export assessments. Please try again.',
        type: 'error',
        onConfirm: () => setModalConfig({ ...modalConfig, visible: false }),
      });
    }
  };

  const confirmCopyToNewDate = async (newDate) => {
    try {
      setBatchProgressModal({ visible: true, message: 'Copying assessments...', progress: 0 });
      
      const results = await bulkCopyAssessments(
        kids.map(k => k.id),
        sport.id,
        assessmentMetadata?.assessmentDate || new Date().toISOString().split('T')[0],
        newDate,
        assessmentMetadata
      );
      
      setBatchProgressModal({ visible: false, message: '', progress: 0 });
      
      setModalConfig({
        visible: true,
        title: 'Copy Complete',
        message: `Successfully copied ${results.success} of ${results.total} assessments.${results.failed > 0 ? `\n\n${results.failed} failed.` : ''}`,
        type: results.failed > 0 ? 'warning' : 'success',
        onConfirm: () => {
          setModalConfig({ ...modalConfig, visible: false });
          setCopyModal(false);
        },
      });
    } catch (error) {
      console.error('❌ Copy error:', error);
      
      // ✅ Log error with context
      try {
        const { logErrorWithContext } = await import('../../utils/errorHandlers');
        logErrorWithContext(error, {
          operation: 'bulk_copy_assessments',
          kidCount: kids.length,
          newDate
        });
      } catch (logError) {
        console.warn('Failed to log error:', logError);
      }
      
      setBatchProgressModal({ visible: false, message: '', progress: 0 });
      setModalConfig({
        visible: true,
        title: 'Copy Failed',
        message: error.message || 'Failed to copy assessments. Please try again.',
        type: 'error',
        onConfirm: () => setModalConfig({ ...modalConfig, visible: false }),
      });
    }
  };

  const handleEdit = (kidId, testId) => {
    setEditConfirmModal({ visible: true, kidId, testId });
  };

  const confirmEdit = (editScope) => {
    const { kidId, testId } = editConfirmModal;
    setEditConfirmModal({ visible: false, kidId: null, testId: null });
    
    // Find the kid and test indices
    const kidIndex = kids.findIndex(k => k.id === kidId);
    const testIndex = selectedTests.findIndex(t => 
      (typeof t === 'string' ? t : t.id) === testId
    );

    let dataToPass = assessmentData;
    
    // Handle different edit scopes
    if (editScope === 'discard') {
      // Discard everything - start fresh
      dataToPass = {};
    } else if (editScope === 'selected') {
      // Keep all data except the selected field
      const key = `${kidId}_${testId}`;
      const newData = { ...assessmentData };
      delete newData[key];
      dataToPass = newData;
    } else if (editScope === 'test') {
      // Keep all data except all entries for this test across all kids
      const newData = { ...assessmentData };
      kids.forEach(kid => {
        const key = `${kid.id}_${testId}`;
        delete newData[key];
      });
      dataToPass = newData;
    } else if (editScope === 'kid') {
      // Keep all data except all entries for this kid across all tests
      const newData = { ...assessmentData };
      selectedTests.forEach(test => {
        const tId = typeof test === 'string' ? test : test.id;
        const key = `${kidId}_${tId}`;
        delete newData[key];
      });
      dataToPass = newData;
    }
    
    // Navigate back to entry screen with focus AND filtered data
    navigation.navigate('AssessmentEntry', {
      sport,
      kids,
      mode: 'kid-by-kid',
      selectedTests,
      initialKidIndex: kidIndex >= 0 ? kidIndex : 0,
      initialTestIndex: testIndex >= 0 ? testIndex : 0,
      existingAssessmentData: dataToPass,
    });
  };

  const handleDone = () => {
    setDoneConfirmModal(true);
  };

  const getCompletionColor = (rate) => {
    if (rate === 100) return COLORS.success;
    if (rate >= 75) return '#4CAF50';
    if (rate >= 50) return '#FF9800';
    return COLORS.error;
  };

  const formatValue = (value, test) => {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    
    if (test.type === 'rating') {
      return `${value}/10`;
    }
    
    if (test.unit) {
      return `${value} ${test.unit}`;
    }
    
    return String(value);
  };

  const overallCompletion = totalEntries > 0 
    ? Math.round((completedEntries / totalEntries) * 100) 
    : 0;

  if (!sport.name || kids.length === 0 || selectedTests.length === 0) {
    return (
      <View style={styles.container}>
        <Header
          title="Assessment Summary"
          leftIcon="←"
          onLeftPress={() => navigation.goBack()}
          showAvatar={false}
        />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>Invalid assessment data</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.errorButtonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Assessment Summary"
        subtitle={`${sport.name} • ${kids.length} Kids • ${selectedTests.length} Tests`}
        leftIcon="←"
        onLeftPress={() => navigation.goBack()}
        showAvatar={false}
      />

      {/* Overall Progress Header */}
      <View style={styles.progressHeader}>
        <View style={styles.progressStats}>
          <View style={styles.progressStatItem}>
            <Text style={styles.progressStatNumber}>{completedEntries}</Text>
            <Text style={styles.progressStatLabel}>Completed</Text>
          </View>
          <View style={styles.progressStatDivider} />
          <View style={styles.progressStatItem}>
            <Text style={styles.progressStatNumber}>{totalEntries - completedEntries}</Text>
            <Text style={styles.progressStatLabel}>Missing</Text>
          </View>
          <View style={styles.progressStatDivider} />
          <View style={styles.progressStatItem}>
            <Text style={[styles.progressStatNumber, { color: getCompletionColor(overallCompletion) }]}>
              {overallCompletion}%
            </Text>
            <Text style={styles.progressStatLabel}>Complete</Text>
          </View>
        </View>

        <View style={styles.overallProgressBar}>
          <View 
            style={[
              styles.overallProgressFill, 
              { 
                width: `${overallCompletion}%`,
                backgroundColor: getCompletionColor(overallCompletion),
              }
            ]} 
          />
        </View>
      </View>

      {/* Quick Filter Chips */}
      <View style={styles.filterChipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'completed', 'missing', 'below_average', 'above_average'].map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                activeFilter === filter && styles.filterChipActive
              ]}
              onPress={() => {
                setActiveFilter(filter);
                processAssessmentData(); // Re-process with new filter
              }}
            >
              <Text style={[
                styles.filterChipText,
                activeFilter === filter && styles.filterChipTextActive
              ]}>
                {filter === 'all' ? 'All Kids' :
                 filter === 'completed' ? 'Completed' :
                 filter === 'missing' ? 'Missing Values' :
                 filter === 'below_average' ? 'Below Average' :
                 'Above Average'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Scrollable Content */}
      <View style={styles.contentWrapper}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Assessment Metadata Card */}
        {assessmentMetadata && (
          <View style={styles.metadataCard}>
            <View style={styles.metadataHeader}>
              <Ionicons name="information-circle" size={20} color={COLORS.primary} />
              <Text style={styles.metadataTitle}>Assessment Context</Text>
            </View>
            
            <View style={styles.metadataGrid}>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Academic Year</Text>
                <Text style={styles.metadataValue}>{assessmentMetadata.year || 'N/A'}</Text>
              </View>
              
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Term</Text>
                <Text style={styles.metadataValue}>{assessmentMetadata.term || 'N/A'}</Text>
              </View>
              
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Type</Text>
                <Text style={styles.metadataValue}>
                  {assessmentMetadata.assessmentType === 'baseline' ? 'Baseline' :
                   assessmentMetadata.assessmentType === 'mid_term' ? 'Mid-Term' :
                   assessmentMetadata.assessmentType === 'final' ? 'Final' : 'Ad-hoc'}
                </Text>
              </View>
              
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Week</Text>
                <Text style={styles.metadataValue}>Week {assessmentMetadata.weekNumber || 'N/A'}</Text>
              </View>
              
              {assessmentMetadata.location && (
                <View style={[styles.metadataItem, styles.metadataItemFull]}>
                  <Text style={styles.metadataLabel}>Location</Text>
                  <Text style={styles.metadataValue}>{assessmentMetadata.location}</Text>
                </View>
              )}
              
              <View style={[styles.metadataItem, styles.metadataItemFull]}>
                <Text style={styles.metadataLabel}>Assessor</Text>
                <Text style={styles.metadataValue}>{assessmentMetadata.assessorName || 'N/A'}</Text>
              </View>
              
              {assessmentMetadata.generalNotes && (
                <View style={[styles.metadataItem, styles.metadataItemFull]}>
                  <Text style={styles.metadataLabel}>Notes</Text>
                  <Text style={styles.metadataValueNotes}>{assessmentMetadata.generalNotes}</Text>
                </View>
              )}
            </View>
          </View>
        )}
        
        {Object.values(groupedData).map(({ kid, results, completionRate }) => (
          <View key={kid.id} style={styles.kidCard}>
            {/* Kid Header */}
            <View style={styles.kidHeader}>
              <View style={styles.kidInfoRow}>
                <View style={styles.kidAvatar}>
                  <Ionicons name="person" size={24} color={COLORS.white} />
                </View>
                <View style={styles.kidInfo}>
                  <Text style={styles.kidName}>{kid.name}</Text>
                  <Text style={styles.kidDetails}>
                    Age: {kid.age || 'N/A'} • {kid.age_group} • {kid.gender}
                  </Text>
                </View>
              </View>

              <View style={[
                styles.completionBadge,
                { backgroundColor: getCompletionColor(completionRate) + '20' }
              ]}>
                <Text style={[
                  styles.completionBadgeText,
                  { color: getCompletionColor(completionRate) }
                ]}>
                  {completionRate}%
                </Text>
              </View>
            </View>

            {/* Kid's Progress Bar */}
            <View style={styles.kidProgressBar}>
              <View 
                style={[
                  styles.kidProgressFill, 
                  { 
                    width: `${completionRate}%`,
                    backgroundColor: getCompletionColor(completionRate),
                  }
                ]} 
              />
            </View>

            {/* Results List */}
            <View style={styles.resultsContainer}>
              {results.map(({ test, value, key }) => {
                const isEmpty = value === null || value === undefined || value === '';
                
                return (
                  <View key={key} style={styles.resultRow}>
                    <View style={styles.resultInfo}>
                      <Text style={styles.testName}>{test.name}</Text>
                      <Text style={[
                        styles.testValue,
                        isEmpty && styles.missingValue
                      ]}>
                        {isEmpty ? 'Not entered' : formatValue(value, test)}
                      </Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={[
                        styles.editButton,
                        isEmpty && styles.editButtonEmpty
                      ]}
                      onPress={() => handleEdit(kid.id, test.id)}
                    >
                      <Ionicons 
                        name={isEmpty ? "add-circle-outline" : "create-outline"} 
                        size={16} 
                        color={isEmpty ? COLORS.error : COLORS.primary} 
                      />
                      <Text style={[
                        styles.editButtonText,
                        isEmpty && styles.editButtonTextEmpty
                      ]}>
                        {isEmpty ? 'Add' : 'Edit'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            All data is saved locally. Tap "Sync to Cloud" to backup to Firebase.
          </Text>
        </View>

        <View style={styles.bottomPadding} />
        </ScrollView>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.syncButton, syncing && styles.disabledButton]}
          onPress={handleSync}
          disabled={syncing}
        >
          {syncing ? (
            <>
              <LoadingSpinner size="small" color={COLORS.white} />
              <Text style={styles.syncButtonText}>Syncing...</Text>
            </>
          ) : (
            <>
              <Ionicons name="cloud-upload" size={20} color={COLORS.white} />
              <Text style={styles.syncButtonText}>Sync to Cloud</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCopyToNewDate}
        >
          <Ionicons name="copy-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleExportCSV}
        >
          <Ionicons name="download-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleDone}
        >
          <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Sync Complete Modal */}
      <CustomModal
        visible={syncCompleteModal}
        title="✅ Sync Complete!"
        message={`${completedEntries} assessment${completedEntries !== 1 ? 's' : ''} synced to cloud successfully!`}
        icon="cloud-done"
        iconColor={COLORS.success}
        buttons={[
          { 
            text: 'Back to Home', 
            style: 'cancel',
            onPress: () => {
              setSyncCompleteModal(false);
              navigation.navigate('Home');
            }
          },
          { 
            text: 'View History', 
            onPress: () => {
              setSyncCompleteModal(false);
              navigation.navigate('History');
            }
          }
        ]}
      />

      {/* Sync Error Modal */}
      <CustomModal
        visible={syncErrorModal}
        title="⚠️ Sync Issue"
        message="Assessments are saved locally. They will sync automatically when you have internet connection."
        icon="cloud-offline"
        iconColor={COLORS.warning}
        buttons={[
          { 
            text: 'OK', 
            onPress: () => {
              setSyncErrorModal(false);
              navigation.navigate('Home');
            }
          }
        ]}
      />

      {/* ✅ ADD: Generic Modal for Error Handling */}
      <CustomModal
        visible={modalConfig.visible}
        title={modalConfig.title}
        message={modalConfig.message}
        icon={
          modalConfig.type === 'success' ? 'checkmark-circle' :
          modalConfig.type === 'error' ? 'alert-circle' :
          modalConfig.type === 'warning' ? 'warning' :
          'information-circle'
        }
        iconColor={
          modalConfig.type === 'success' ? COLORS.success :
          modalConfig.type === 'error' ? COLORS.error :
          modalConfig.type === 'warning' ? COLORS.warning :
          COLORS.primary
        }
        buttons={
          modalConfig.showCancel
            ? [
                { 
                  text: modalConfig.cancelText, 
                  style: 'cancel',
                  onPress: () => {
                    modalConfig.onCancel();
                    setModalConfig({ ...modalConfig, visible: false });
                  }
                },
                { 
                  text: modalConfig.confirmText,
                  onPress: () => {
                    modalConfig.onConfirm();
                    setModalConfig({ ...modalConfig, visible: false });
                  }
                }
              ]
            : [
                { 
                  text: modalConfig.confirmText,
                  onPress: () => {
                    modalConfig.onConfirm();
                    setModalConfig({ ...modalConfig, visible: false });
                  }
                }
              ]
        }
      />

      {/* Edit Confirmation Modal */}
      <Modal
        visible={editConfirmModal.visible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalIconContainer, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="create-outline" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.modalTitle}>Edit Options</Text>
            <Text style={styles.modalMessage}>Choose what you want to edit:</Text>
            
            <View style={styles.editOptionsContainer}>
              <TouchableOpacity
                style={styles.editOptionButton}
                onPress={() => confirmEdit('selected')}
              >
                <Ionicons name="create-outline" size={20} color={COLORS.primary} />
                <Text style={styles.editOptionText}>Edit Selected Field Only</Text>
                <Text style={styles.editOptionSubtext}>Keep all other data</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editOptionButton}
                onPress={() => confirmEdit('test')}
              >
                <Ionicons name="clipboard-outline" size={20} color={COLORS.warning} />
                <Text style={styles.editOptionText}>Edit This Test (All Kids)</Text>
                <Text style={styles.editOptionSubtext}>Clear this test for everyone</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editOptionButton}
                onPress={() => confirmEdit('kid')}
              >
                <Ionicons name="person-outline" size={20} color={COLORS.warning} />
                <Text style={styles.editOptionText}>Edit This Kid (All Tests)</Text>
                <Text style={styles.editOptionSubtext}>Clear all tests for this kid</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.editOptionButton, styles.editOptionDanger]}
                onPress={() => confirmEdit('discard')}
              >
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                <Text style={[styles.editOptionText, styles.editOptionDangerText]}>Discard & Start Fresh</Text>
                <Text style={[styles.editOptionSubtext, styles.editOptionDangerText]}>Delete all assessments</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setEditConfirmModal({ visible: false, kidId: null, testId: null })}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Copy to New Date Modal */}
      <Modal visible={copyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Copy to New Date</Text>
            <Text style={styles.modalMessage}>
              This will duplicate all {kids.length} assessments to a new date.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setCopyModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton]}
                onPress={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  confirmCopyToNewDate(tomorrow.toISOString().split('T')[0]);
                }}
              >
                <Text style={styles.modalButtonText}>Copy to Tomorrow</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Export Success Modal */}
      <CustomModal
        visible={exportModal}
        title="Export Complete"
        message="Assessment data exported successfully!"
        icon="download-outline"
        iconColor={COLORS.success}
        buttons={[
          {
            text: 'OK',
            onPress: () => setExportModal(false)
          }
        ]}
      />

      {/* Batch Progress Modal */}
      <Modal visible={batchProgressModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LoadingSpinner size="large" color={COLORS.primary} />
            <Text style={styles.modalTitle}>{batchProgressModal.message}</Text>
          </View>
        </View>
      </Modal>

      {/* Done Confirmation Modal */}
      <CustomModal
        visible={doneConfirmModal}
        title="Save & Exit"
        message="All data is saved locally. Sync to cloud now or sync later?"
        icon="save-outline"
        iconColor={COLORS.primary}
        buttons={[
          { 
            text: 'Exit Without Sync', 
            style: 'destructive',
            onPress: async () => {
              // Clear any remaining session state
              const sessionId = route.params?.sessionId;
              if (sessionId) {
                await AsyncStorage.removeItem(`assessment_session_${sessionId}`);
              }
              setDoneConfirmModal(false);
              navigation.navigate('Home');
            }
          },
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => setDoneConfirmModal(false)
          },
          { 
            text: 'Sync Now', 
            onPress: async () => {
              setDoneConfirmModal(false);
              await handleSync();
              // Clear session state after sync
              const sessionId = route.params?.sessionId;
              if (sessionId) {
                await AsyncStorage.removeItem(`assessment_session_${sessionId}`);
              }
            }
          }
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentWrapper: {
    position: 'absolute',
    top: 200,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  
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
    flexWrap: 'wrap',
  },
  modalButton: {
    flex: 1,
    minWidth: '45%',
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
    minWidth: '100%',
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
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Progress Header
  progressHeader: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  progressStatItem: {
    alignItems: 'center',
  },
  progressStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  progressStatLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  progressStatDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  overallProgressBar: {
    height: 8,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 4,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  
  // Kid Card
  kidCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  kidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kidInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  kidAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  kidInfo: {
    flex: 1,
  },
  kidName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  kidDetails: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  completionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  completionBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  kidProgressBar: {
    height: 6,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  kidProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  
  // Results
  resultsContainer: {
    gap: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 8,
  },
  resultInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  testValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  missingValue: {
    color: COLORS.error,
    fontStyle: 'italic',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  editButtonEmpty: {
    backgroundColor: COLORS.error + '20',
  },
  editButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  editButtonTextEmpty: {
    color: COLORS.error,
  },
  
  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight + '40',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.primary,
    lineHeight: 16,
  },
  
  // Bottom Actions
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    elevation: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    flexDirection: 'row',
    gap: 8,
  },
  syncButton: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.6,
  },
  syncButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  doneButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  doneButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  
  bottomPadding: {
    height: 16,
  },
  
  // Edit Options Modal Styles
  editOptionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  editOptionButton: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: COLORS.backgroundDark,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  editOptionDanger: {
    backgroundColor: COLORS.error + '10',
    borderColor: COLORS.error + '30',
  },
  editOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 4,
  },
  editOptionDangerText: {
    color: COLORS.error,
  },
  editOptionSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  modalCancelButton: {
    backgroundColor: COLORS.backgroundDark,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  
  // Metadata Card Styles
  metadataCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metadataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  metadataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  metadataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metadataItem: {
    width: '48%',
    backgroundColor: COLORS.backgroundDark,
    padding: 12,
    borderRadius: 8,
  },
  metadataItemFull: {
    width: '100%',
  },
  metadataLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  metadataValueNotes: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  
  // Filter Chips
  filterChipsContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundDark,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
});

export default AssessmentSummaryScreen;