// src/screens/Attendance/AttendanceScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { COLORS, SCREEN_NAMES } from '../../utils/constants';
import { getKidsByAgeGroup, markAttendance, deleteAttendanceForAgeGroup, getSessionAttendance } from '../../database/db';
import Header from '../../components/common/Header';
import SwipeableKidItem from '../../components/attendance/SwipeableKidItem';
import AttendanceCounter from '../../components/attendance/AttendanceCounter';
import { getCurrentUserId } from '../../utils/auth';

const AttendanceScreen = ({ route, navigation }) => {
  const { sessionId, sessionDate, sessionTime, dayOfWeek, ageGroup, isExistingSession } = route.params;
  
  const [kids, setKids] = useState([]);
  const [filteredKids, setFilteredKids] = useState([]);
  const [markedKids, setMarkedKids] = useState(new Map());
  const [initialMarkedKids, setInitialMarkedKids] = useState(new Map()); // Track original state
  const [hasChanges, setHasChanges] = useState(false); // Track if any changes made
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [removingKids, setRemovingKids] = useState(new Set());
  const [allKidsData, setAllKidsData] = useState([]);
  const [attendanceFilter, setAttendanceFilter] = useState('unmarked'); // Will be set based on mode
  const [showRedoModal, setShowRedoModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showMarkAllModal, setShowMarkAllModal] = useState(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const scrollViewRef = useRef(null);

  useEffect(() => {
    loadKids();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = filteredKids.filter((kid) =>
        kid.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredKids(filtered);
    } else {
      applyAttendanceFilter(allKidsData, markedKids, attendanceFilter);
    }
  }, [searchQuery]);

  const loadKids = async () => {
    try {
      setLoading(true);
      
      console.log(`📊 Loading kids for age group: ${ageGroup}`);
      console.log('📍 Session ID:', sessionId);
      console.log('📍 Session Date:', sessionDate);
      
      const allKidsData = await getKidsByAgeGroup(ageGroup);
      console.log(`📊 Loaded ${allKidsData.length} kids for attendance`);
      
      if (allKidsData.length === 0) {
        console.warn(`⚠️ No kids found in ${ageGroup} age group`);
      } else {
        console.log('📋 Kid names:', allKidsData.map(k => k.name).join(', '));
      }
      
      // Load existing attendance records for this session and age group
      const existingAttendance = await getSessionAttendance(sessionId);
      const ageGroupKidIds = allKidsData.map(k => k.id);
      
      // Filter attendance for only kids in this age group
      const ageGroupAttendance = existingAttendance.filter(a => 
        ageGroupKidIds.includes(a.kid_id)
      );
      
      // Pre-fill markedKids with existing attendance
      const preFilledMarked = new Map();
      ageGroupAttendance.forEach(record => {
        preFilledMarked.set(record.kid_id, {
          status: record.status,
          markedBy: record.marked_by || 'Admin',
          markedAt: record.marked_at,
        });
      });
      
      console.log(`📋 Pre-filled ${preFilledMarked.size} existing attendance records`);
      
      setMarkedKids(preFilledMarked);
      setInitialMarkedKids(new Map(preFilledMarked)); // Save original state
      setKids(allKidsData);
      setAllKidsData(allKidsData);
      
      // Set initial filter based on whether there's existing attendance
      // (Edit mode will have preFilledMarked.size > 0)
      if (preFilledMarked.size > 0) {
        // Edit mode: show marked kids first
        console.log('📝 Edit mode: Showing marked kids first');
        setAttendanceFilter('marked');
        applyAttendanceFilter(allKidsData, preFilledMarked, 'marked');
      } else {
        // New session: show all unmarked kids
        console.log('✨ New session: Showing all unmarked kids');
        setAttendanceFilter('unmarked');
        applyAttendanceFilter(allKidsData, preFilledMarked, 'unmarked');
      }
    } catch (error) {
      console.error('Error loading kids:', error);
      setErrorMessage('Failed to load kids list');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const applyAttendanceFilter = (kidsData, marked, filter) => {
    let filtered = [];
    
    switch (filter) {
      case 'unmarked':
        filtered = kidsData.filter(k => !marked.has(k.id));
        break;
      case 'marked':
        filtered = kidsData.filter(k => marked.has(k.id));
        break;
      case 'present':
        filtered = kidsData.filter(k => marked.get(k.id)?.status === 'present');
        break;
      case 'absent':
        filtered = kidsData.filter(k => marked.get(k.id)?.status === 'absent');
        break;
      case 'all':
        filtered = kidsData;
        break;
      default:
        filtered = kidsData.filter(k => !marked.has(k.id));
    }
    
    setFilteredKids(filtered);
  };

  const handleFilterChange = (filter) => {
    setAttendanceFilter(filter);
    setSearchQuery('');
    applyAttendanceFilter(allKidsData, markedKids, filter);
  };

  const handleSwipe = async (kid, status) => {
    // Prevent re-swiping while animation is happening
    if (removingKids.has(kid.id)) {
      return; // Already processing
    }
    
    // Allow re-swiping already marked kids (for editing)
    const currentStatus = markedKids.get(kid.id)?.status;
    if (currentStatus === status) {
      return; // Same status, no need to re-mark
    }
    
    try {
      const markedBy = 'Admin';
      const markedAt = new Date().toISOString();
      
      // Immediately update marked kids to prevent re-swiping
      const updatedMarked = new Map(markedKids).set(kid.id, {
        status,
        markedBy,
        markedAt,
      });
      setMarkedKids(updatedMarked);
      
      // Check if ANY kid's status differs from initial state
      let changesDetected = false;
      updatedMarked.forEach((value, kidId) => {
        const initialStatus = initialMarkedKids.get(kidId)?.status;
        if (initialStatus !== value.status) {
          changesDetected = true;
        }
      });
      
      // Also check if kids were unmarked (exist in initial but not in updated)
      initialMarkedKids.forEach((value, kidId) => {
        if (!updatedMarked.has(kidId)) {
          changesDetected = true;
        }
      });
      
      setHasChanges(changesDetected);
      
      // Add to removing set for animation
      setRemovingKids((prev) => new Set([...prev, kid.id]));
      
      // Mark attendance in database
      await markAttendance(sessionId, kid.id, status, markedBy);

      // Quick animation then remove
      setTimeout(() => {
        setRemovingKids((prev) => {
          const updated = new Set(prev);
          updated.delete(kid.id);
          return updated;
        });
        
        // Reapply filter with updated marked kids
        applyAttendanceFilter(allKidsData, updatedMarked, attendanceFilter);
      }, 500); // Reduced from 3000ms to 500ms
    } catch (error) {
      console.error('Error marking attendance:', error);
      setErrorMessage('Failed to mark attendance');
      setShowErrorModal(true);
      
      // Revert on error
      setMarkedKids((prev) => {
        const reverted = new Map(prev);
        reverted.delete(kid.id);
        return reverted;
      });
      setRemovingKids((prev) => {
        const updated = new Set(prev);
        updated.delete(kid.id);
        return updated;
      });
    }
  };

  const handleMarkAllPresent = () => {
    setShowMarkAllModal(true);
  };

  const handleMarkAllConfirm = async () => {
    setShowMarkAllModal(false);
    try {
      const markedBy = 'Admin';
      
      for (const kid of filteredKids) {
        if (!markedKids.has(kid.id)) {
          await markAttendance(sessionId, kid.id, 'present', markedBy);
          setMarkedKids((prev) => new Map(prev).set(kid.id, {
            status: 'present',
            markedBy,
            markedAt: new Date().toISOString(),
          }));
        }
      }
      
      setTimeout(() => {
        setKids([]);
        setFilteredKids([]);
      }, 500);
      
      setSuccessMessage('All kids marked as present!');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error marking all present:', error);
      setErrorMessage('Failed to mark all present');
      setShowErrorModal(true);
    }
  };

  const handleRedoConfirm = async () => {
    setShowRedoModal(false);
    
    try {
      console.log('🗑️ Deleting attendance records...');
      
      await deleteAttendanceForAgeGroup(sessionId, ageGroup);
      
      console.log('✅ Database records deleted');
      
      // Clear ALL state completely
      const emptyMarked = new Map();
      setMarkedKids(emptyMarked);
      setInitialMarkedKids(new Map());
      setHasChanges(false);
      setRemovingKids(new Set());
      
      // Reset to unmarked filter (show all kids again)
      setAttendanceFilter('unmarked');
      
      // CRITICAL: Clear search query to prevent filtering issues
      setSearchQuery('');
      
      // Reload kids with empty marked state
      const kidsData = await getKidsByAgeGroup(ageGroup);
      setKids(kidsData);
      setAllKidsData(kidsData);
      
      // Apply filter with the empty marked map - show all kids unmarked
      setAttendanceFilter('unmarked');
      applyAttendanceFilter(kidsData, emptyMarked, 'unmarked');
      
      console.log('✅ Reset complete - showing all unmarked kids');
      
      // Show success message
      setSuccessMessage('Attendance has been reset. All kids are now unmarked.');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('❌ Error resetting attendance:', error);
      setErrorMessage('Failed to reset attendance. Please try again.');
      setShowErrorModal(true);
    }
  };

  const handleDone = () => {
    if (!hasChanges) {
      if (isExistingSession && markedKids.size > 0) {
        navigation.goBack();
      } else {
        setShowDiscardModal(true);
      }
      return;
    }
    
    const unmarkedCount = allKidsData.length - markedKids.size;
    
    if (unmarkedCount > 0) {
      setShowIncompleteModal(true);
    } else {
      // ✅ All marked and changes made - show success modal
      setSuccessMessage(`✓ Attendance complete! All ${markedKids.size} kids marked.`);
      setShowSuccessModal(true);
      
      // Navigate back after showing success
      setTimeout(() => {
        setShowSuccessModal(false);
        navigation.goBack();
      }, 2000);
    }
  };

  const visibleKids = filteredKids.filter((kid) => !removingKids.has(kid.id));

  const totalKids = allKidsData.length;
  const presentCount = Array.from(markedKids.values()).filter(m => m.status === 'present').length;
  const absentCount = Array.from(markedKids.values()).filter(m => m.status === 'absent').length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading kids...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={`${ageGroup} years`}
        subtitle={`${sessionDate} • ${sessionTime}`}
        leftText="Back"
        onLeftPress={() => navigation.goBack()}
      />

      {/* Search and Actions Header */}
      <View style={styles.actionsHeader}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search kids..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={handleMarkAllPresent}
          disabled={visibleKids.length === 0}
        >
          <Text style={styles.markAllButtonText}>Mark All Present</Text>
        </TouchableOpacity>
      </View>

      {/* Attendance Counter */}
      <View style={styles.counterContainer}>
        <AttendanceCounter
          total={totalKids}
          marked={markedKids.size}
          present={presentCount}
          absent={absentCount}
          onFilterChange={handleFilterChange}
          activeFilter={attendanceFilter}
        />
      </View>

      {/* Kids List */}
      <View style={styles.scrollViewContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {visibleKids.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {visibleKids.length === 0 && markedKids.size > 0 && attendanceFilter === 'marked'
                  ? '✓ All kids in this filter marked!'
                  : visibleKids.length === 0 && attendanceFilter !== 'all'
                  ? 'No kids in this filter'
                  : kids.length === 0
                  ? 'No kids in this age group'
                  : 'No kids match your search'}
              </Text>
              
              {/* Show button to view unmarked kids */}
              {visibleKids.length === 0 && markedKids.size > 0 && markedKids.size < allKidsData.length && attendanceFilter === 'marked' && (
                <TouchableOpacity
                  style={styles.showUnmarkedButton}
                  onPress={() => handleFilterChange('unmarked')}
                >
                  <Text style={styles.showUnmarkedButtonText}>
                    Tap to show unmarked kids
                  </Text>
                </TouchableOpacity>
              )}
              {kids.length === 0 && markedKids.size === 0 && (
                <TouchableOpacity
                  style={styles.addKidsButton}
                  onPress={() => navigation.navigate('MyKidsStack')}
                >
                  <Text style={styles.addKidsButtonText}>Add Kids</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            visibleKids.map((kid, index) => (
              <SwipeableKidItem
                key={kid.id}
                kid={kid}
                index={index + 1}
                onMarkPresent={() => handleSwipe(kid, 'present')}
                onMarkAbsent={() => handleSwipe(kid, 'absent')}
                disabled={kid.status === 'suspended'}
                markedInfo={markedKids.get(kid.id)}
              />
            ))
          )}
        </ScrollView>
      </View>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerButton, styles.redoButton]}
          onPress={() => setShowRedoModal(true)}
        >
          <Text style={styles.redoButtonText}>Redo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.footerButton, 
            hasChanges ? styles.doneButton : styles.discardButton
          ]}
          onPress={handleDone}
        >
          <Text style={hasChanges ? styles.doneButtonText : styles.discardButtonText}>
            {hasChanges ? 'Done' : 'Discard'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚠️ Error</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>
                {errorMessage}
              </Text>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={() => setShowErrorModal(false)}
              >
                <Text style={styles.modalConfirmText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✓ Success</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>
                {successMessage}
              </Text>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={() => setShowSuccessModal(false)}
              >
                <Text style={styles.modalConfirmText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Mark All Present Modal */}
      <Modal
        visible={showMarkAllModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMarkAllModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mark All Present</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>
                Mark all {filteredKids.length} kids as present?
              </Text>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowMarkAllModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleMarkAllConfirm}
              >
                <Text style={styles.modalConfirmText}>Mark All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Incomplete Attendance Modal */}
      <Modal
        visible={showIncompleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowIncompleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Incomplete Attendance</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>
                {allKidsData.length - markedKids.size} kid(s) not marked. Mark remaining as absent?
              </Text>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowIncompleteModal(false)}
              >
                <Text style={styles.modalCancelText}>Go Back</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={async () => {
                  setShowIncompleteModal(false);
                  try {
                    const markedBy = 'Admin';
                    
                    for (const kid of allKidsData) {
                      if (!markedKids.has(kid.id)) {
                        await markAttendance(sessionId, kid.id, 'absent', markedBy);
                      }
                    }
                    
                    navigation.goBack();
                  } catch (error) {
                    console.error('Error marking remaining absent:', error);
                    setErrorMessage('Failed to mark remaining kids');
                    setShowErrorModal(true);
                  }
                }}
              >
                <Text style={styles.modalConfirmText}>Mark Absent & Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Discard Modal */}
      <Modal
        visible={showDiscardModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDiscardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Discard Attendance?</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>
                No changes were made. Do you want to go back?
              </Text>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowDiscardModal(false)}
              >
                <Text style={styles.modalCancelText}>Stay</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={() => {
                  setShowDiscardModal(false);
                  navigation.goBack();
                }}
              >
                <Text style={styles.modalConfirmText}>Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Redo Confirmation Modal */}
      <Modal
        visible={showRedoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRedoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Attendance</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>
                This will delete all attendance records for this age group.
              </Text>
              <Text style={styles.modalSubmessage}>
                {markedKids.size > 0 
                  ? `${markedKids.size} kid(s) will be unmarked.`
                  : 'No records to delete.'
                }
              </Text>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowRedoModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleRedoConfirm}
              >
                <Text style={styles.modalConfirmText}>Reset</Text>
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
  actionsHeader: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
    gap: 8,
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  markAllButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  markAllButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  counterContainer: {
    padding: 16,
    paddingBottom: 8,
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
    paddingTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  addKidsButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addKidsButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  redoButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  redoButtonText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: 'bold',
  },
  doneButton: {
    backgroundColor: COLORS.success, // Green for Done
  },
  doneButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  discardButton: {
    backgroundColor: COLORS.primary, // Blue for Discard
  },
  discardButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  showUnmarkedButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  showUnmarkedButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
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
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalMessage: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  modalSubmessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalCancelText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    backgroundColor: COLORS.error,
  },
  modalConfirmText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AttendanceScreen;