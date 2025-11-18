// src/screens/Summary/SummaryScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SCREEN_NAMES, AGE_GROUPS } from '../../utils/constants';
import {
  getSessionAttendance,
  getKidsByAgeGroup,
  updateSessionNotes,
  getSessionById,
  updateSessionStatus,
} from '../../database/db';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import FAB from '../../components/common/FAB';

const SummaryScreen = ({ route, navigation }) => {
  const { sessionId, sessionDate, sessionTime, dayOfWeek } = route.params;

  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0 });
  const [groupBreakdown, setGroupBreakdown] = useState([]);
  const [sessionNotes, setSessionNotes] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showNotesSuccessModal, setShowNotesSuccessModal] = useState(false);
  const [showNotesErrorModal, setShowNotesErrorModal] = useState(false);
  const [notesInput, setNotesInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummaryData();
  }, []);

  const loadSummaryData = async () => {
    try {
      setLoading(true);

      // Get session data
      const session = await getSessionById(sessionId);
      setSessionNotes(session?.general_notes || '');
      setNotesInput(session?.general_notes || '');

      // Get attendance data
      const attendanceData = await getSessionAttendance(sessionId);
      setAttendance(attendanceData);

      // Calculate overall stats
      const present = attendanceData.filter((a) => a.status === 'present').length;
      const absent = attendanceData.filter((a) => a.status === 'absent').length;
      const total = present + absent;

      setStats({ total, present, absent });

      // Calculate breakdown by age group
      const breakdown = [];
      for (const ageGroup of AGE_GROUPS) {
        const kids = await getKidsByAgeGroup(ageGroup);
        const groupAttendance = attendanceData.filter((a) =>
          kids.some((k) => k.id === a.kid_id)
        );
        const groupPresent = groupAttendance.filter((a) => a.status === 'present').length;
        const groupTotal = groupAttendance.length;

        if (groupTotal > 0) {
          breakdown.push({
            ageGroup,
            present: groupPresent,
            absent: groupTotal - groupPresent,
            total: groupTotal,
            percentage: Math.round((groupPresent / groupTotal) * 100),
          });
        }
      }

      setGroupBreakdown(breakdown);
    } catch (error) {
      console.error('Error loading summary:', error);
      // Could show error modal here if needed
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      await updateSessionNotes(sessionId, notesInput.trim());
      setSessionNotes(notesInput.trim());
      setShowNotesModal(false);
      setShowNotesSuccessModal(true);
    } catch (error) {
      console.error('Error saving notes:', error);
      setShowNotesModal(false);
      setShowNotesErrorModal(true);
    }
  };

  const handleFinishConfirm = async () => {
    setShowFinishModal(false);
    
    // Mark session as completed
    try {
      const { getCurrentUserId } = await import('../../utils/auth');
      const userId = await getCurrentUserId();
      await updateSessionStatus(sessionId, 'completed', userId);
      console.log('✅ Session marked as completed');
    } catch (error) {
      console.error('Error updating session status:', error);
    }
    
    // Reset navigation stack to Home screen
    navigation.reset({
      index: 0,
      routes: [{ name: SCREEN_NAMES.HOME }],
    });
  };

  const handleViewDetails = () => {
    navigation.navigate(SCREEN_NAMES.SESSION_DETAIL, {
      sessionId,
      sessionDate,
      sessionTime,
      dayOfWeek,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading summary...</Text>
      </View>
    );
  }

  const attendanceRate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  return (
    <View style={styles.container}>
      <Header 
        title="Session Complete" 
        subtitle={`${sessionDate} • ${sessionTime}`}
        leftText="Back"
        onLeftPress={() => navigation.goBack()}
      />

      <View style={styles.scrollViewContainer}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Success Message */}
          <View style={styles.successBanner}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successText}>Attendance Recorded</Text>
          </View>

          {/* Overall Stats Card */}
          <Card style={styles.statsCard}>
            <Text style={styles.cardTitle}>Attendance Summary</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total Kids</Text>
              </View>
              <View style={[styles.statItem, styles.statItemBorder]}>
                <Text style={[styles.statNumber, { color: COLORS.success }]}>
                  {stats.present}
                </Text>
                <Text style={styles.statLabel}>Present</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: COLORS.error }]}>
                  {stats.absent}
                </Text>
                <Text style={styles.statLabel}>Absent</Text>
              </View>
            </View>

            <View style={styles.attendanceRate}>
              <Text style={styles.attendanceRateLabel}>Attendance Rate</Text>
              <Text style={styles.attendanceRateValue}>{attendanceRate}%</Text>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${attendanceRate}%` },
                ]}
              />
            </View>
          </Card>

          {/* Breakdown by Age Group */}
          <Card style={styles.breakdownCard}>
            <Text style={styles.cardTitle}>Breakdown by Age Group</Text>

            {groupBreakdown.map((group) => (
              <View key={group.ageGroup} style={styles.groupRow}>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupLabel}>{group.ageGroup} years</Text>
                  <Text style={styles.groupStats}>
                    {group.present}/{group.total} present
                  </Text>
                </View>
                <View style={styles.groupPercentage}>
                  <Text
                    style={[
                      styles.percentageText,
                      { color: group.percentage >= 75 ? COLORS.success : COLORS.warning },
                    ]}
                  >
                    {group.percentage}%
                  </Text>
                </View>
              </View>
            ))}
          </Card>

          {/* Session Notes Card */}
          <Card style={styles.notesCard}>
            <Text style={styles.cardTitle}>Session Notes</Text>
            {sessionNotes ? (
              <Text style={styles.notesText}>{sessionNotes}</Text>
            ) : (
              <Text style={styles.noNotesText}>No notes added</Text>
            )}
          </Card>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.viewDetailsButton} onPress={handleViewDetails}>
              <Text style={styles.viewDetailsButtonText}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.finishButton} 
              onPress={() => setShowFinishModal(true)}
            >
              <Text style={styles.finishButtonText}>Finish</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* FAB for adding notes */}
      <FAB icon="📝" onPress={() => setShowNotesModal(true)} />

      {/* Notes Modal */}
      <Modal
        visible={showNotesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Session Notes</Text>

            <TextInput
              style={styles.notesTextInput}
              placeholder="Add notes about today's session..."
              value={notesInput}
              onChangeText={setNotesInput}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setNotesInput(sessionNotes);
                  setShowNotesModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveNotes}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Finish Confirmation Modal */}
      <Modal
        visible={showFinishModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFinishModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContainer}>
            <View style={styles.successModalIcon}>
              <Text style={styles.successModalIconText}>🎉</Text>
            </View>
            
            <View style={styles.successModalBody}>
              <Text style={styles.successModalTitle}>Session Complete!</Text>
              <Text style={styles.successModalMessage}>
                Great work! Session attendance has been recorded successfully.
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.successModalButton}
              onPress={handleFinishConfirm}
            >
              <Text style={styles.successModalButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notes Success Modal */}
      <Modal
        visible={showNotesSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNotesSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertModalContainer}>
            <View style={styles.alertModalIcon}>
              <Text style={styles.alertSuccessIconText}>✓</Text>
            </View>
            
            <Text style={styles.alertModalTitle}>Success</Text>
            <Text style={styles.alertModalMessage}>
              Notes saved successfully
            </Text>
            
            <TouchableOpacity
              style={styles.alertModalButton}
              onPress={() => setShowNotesSuccessModal(false)}
            >
              <Text style={styles.alertModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notes Error Modal */}
      <Modal
        visible={showNotesErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNotesErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertModalContainer}>
            <View style={[styles.alertModalIcon, { backgroundColor: '#FFEBEE' }]}>
              <Text style={styles.alertErrorIconText}>✗</Text>
            </View>
            
            <Text style={styles.alertModalTitle}>Error</Text>
            <Text style={styles.alertModalMessage}>
              Failed to save notes. Please try again.
            </Text>
            
            <TouchableOpacity
              style={[styles.alertModalButton, { backgroundColor: COLORS.error }]}
              onPress={() => setShowNotesErrorModal(false)}
            >
              <Text style={styles.alertModalButtonText}>OK</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  scrollViewContainer: {
    height: 0,
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  successBanner: {
    backgroundColor: COLORS.success,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  successText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  statsCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statItemBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E0E0E0',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  attendanceRate: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  attendanceRateLabel: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  attendanceRateValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 6,
  },
  breakdownCard: {
    marginBottom: 16,
  },
  groupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  groupInfo: {
    flex: 1,
  },
  groupLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  groupStats: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  groupPercentage: {
    marginLeft: 16,
  },
  percentageText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  notesCard: {
    marginBottom: 16,
  },
  notesText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  noNotesText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  viewDetailsButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  viewDetailsButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  finishButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  finishButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  notesTextInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 150,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Success Modal (Finish)
  successModalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successModalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successModalIconText: {
    fontSize: 48,
  },
  successModalBody: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  successModalMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  successModalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
  },
  successModalButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Alert Modals (Success/Error)
  alertModalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  alertModalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertSuccessIconText: {
    fontSize: 32,
    color: COLORS.success,
    fontWeight: 'bold',
  },
  alertErrorIconText: {
    fontSize: 32,
    color: COLORS.error,
    fontWeight: 'bold',
  },
  alertModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  alertModalMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  alertModalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
    width: '100%',
  },
  alertModalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SummaryScreen;