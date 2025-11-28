// Location: /apps/assessment/src/screens/AssessmentSummary/AssessmentSummaryScreen.js
// FIXED: Complete Assessment Summary with Custom Modals

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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import { COLORS } from '../../utils/constants';
import { syncAssessmentsToFirebase } from '../../services/assessmentService';

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
  const { assessmentData = {}, sport = {}, kids = [], selectedTests = [] } = route.params || {};
  
  const [syncing, setSyncing] = useState(false);
  const [groupedData, setGroupedData] = useState({});
  const [totalEntries, setTotalEntries] = useState(0);
  const [completedEntries, setCompletedEntries] = useState(0);

  // Modal States
  const [syncCompleteModal, setSyncCompleteModal] = useState(false);
  const [syncErrorModal, setSyncErrorModal] = useState(false);
  const [editConfirmModal, setEditConfirmModal] = useState({ visible: false, kidId: null, testId: null });
  const [doneConfirmModal, setDoneConfirmModal] = useState(false);

  useEffect(() => {
    processAssessmentData();
  }, [assessmentData]);

  const processAssessmentData = () => {
    const grouped = {};
    let total = 0;
    let completed = 0;

    kids.forEach(kid => {
      const results = selectedTests.map(test => {
        const testId = typeof test === 'string' ? test : test.id;
        const key = `${kid.id}_${testId}`;
        const value = assessmentData[key];
        total++;
        if (value !== undefined && value !== null && value !== '') {
          completed++;
        }
        return {
          test: typeof test === 'string' ? { id: test, name: test, type: 'numeric' } : test,
          value: value || null,
          key,
        };
      });

      grouped[kid.id] = {
        kid,
        results,
        completionRate: Math.round((results.filter(r => r.value).length / results.length) * 100),
      };
    });

    setGroupedData(grouped);
    setTotalEntries(total);
    setCompletedEntries(completed);
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      
      const result = await syncAssessmentsToFirebase();
      
      setSyncing(false);
      setSyncCompleteModal(true);
    } catch (error) {
      console.error('❌ Sync error:', error);
      setSyncing(false);
      setSyncErrorModal(true);
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

      {/* Scrollable Content */}
      <View style={styles.contentWrapper}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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
              <ActivityIndicator color={COLORS.white} size="small" />
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
            onPress: () => {
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
            onPress: () => {
              setDoneConfirmModal(false);
              handleSync();
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
});

export default AssessmentSummaryScreen;