import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Modal, 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TRAINING_SCHEDULE, TRAINING_DAYS, NON_TRAINING_DAYS, SCREEN_NAMES } from '../../utils/constants';
import { formatDate, getCurrentDay, isTrainingDay } from '../../utils/dateUtils';
import { createSession, createOrGetSession, getAllKids } from '../../database/db';
import { getCurrentUserId } from '../../utils/auth';
import Header from '../../components/common/Header';

// Helper function to get date for a specific day of week
const getDateForDay = (dayName) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison
  
  const currentDayIndex = today.getDay();
  const targetDayIndex = days.indexOf(dayName);
  
  // Calculate days difference (positive = future, negative = past, 0 = today)
  let daysDiff = targetDayIndex - currentDayIndex;
  
  // DON'T adjust negative days - we want to show the most recent occurrence
  // Example: Today is Monday (1), looking for Sunday (0):
  // daysDiff = 0 - 1 = -1 (yesterday) ✅
  
  // Create date for target day
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysDiff);
  
  return {
    date: targetDate.toISOString().split('T')[0],
    isFuture: daysDiff > 0,
    isPast: daysDiff < 0,
    daysFromNow: daysDiff,
  };
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const [academyName, setAcademyName] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentDay, setCurrentDay] = useState('');
  const [totalKids, setTotalKids] = useState(0);
  const [thisWeekSessions, setThisWeekSessions] = useState(0);
  const [avgAttendance, setAvgAttendance] = useState(0);
  
  // Future session modal state
  const [showFutureModal, setShowFutureModal] = useState(false);
  const [futureSessionInfo, setFutureSessionInfo] = useState(null);
  const [showNoKidsModal, setShowNoKidsModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [showExistingSessionModal, setShowExistingSessionModal] = useState(false);
  const [existingSessionData, setExistingSessionData] = useState(null);
  // showQuickNoteModal state removed - navigates directly to notes screen

  useEffect(() => {
    loadAcademyName();
    loadStats();
    updateDateTime();
    const interval = setInterval(updateDateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const loadAcademyName = async () => {
    try {
      const name = await AsyncStorage.getItem('academyName');
      setAcademyName(name || 'My Academy');
    } catch (error) {
      console.error('Error loading academy name:', error);
    }
  };

  const loadStats = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        console.warn('⚠️ No user ID found');
        return;
      }
      
      // Load kids from Firebase (academy-wide)
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const academyId = (await AsyncStorage.default.getItem('academyId')) || 'academy_accellax361_main';
      
      const { collection, getDocs } = await import('firebase/firestore');
      const { db: firebaseDb } = await import('../../config/firebase');
      
      const kidsRef = collection(firebaseDb, `academies/${academyId}/kids`);
      const snapshot = await getDocs(kidsRef);
      
      const activeKids = [];
      snapshot.forEach(doc => {
        const kid = doc.data();
        if (kid.status === 'active' || !kid.status) {
          activeKids.push(kid);
        }
      });
      
      console.log(`📊 Loaded ${activeKids.length} active kids from academy`);
      setTotalKids(activeKids.length);
      
      // Load this week's sessions
      const { getThisWeekSessions, getOverallAttendancePercentage } = await import('../../database/db');
      const weekSessions = await getThisWeekSessions();
      setThisWeekSessions(weekSessions.length);
      
      // Load overall attendance percentage
      const avgAttendance = await getOverallAttendancePercentage();
      setAvgAttendance(avgAttendance);
      
      console.log('📊 Stats loaded:', {
        totalKids: activeKids.length,
        thisWeek: weekSessions.length,
        avgAttendance: avgAttendance
      });
      
    } catch (error) {
      console.error('Error loading stats:', error);
      // Set defaults on error
      setTotalKids(0);
      setThisWeekSessions(0);
      setAvgAttendance(0);
    }
  };

  const updateDateTime = () => {
    const now = new Date();
    setCurrentDate(now);
    setCurrentDay(getCurrentDay());
  };

  const handleSessionStart = async (day, timeSlot) => {
    try {
      console.log('Starting session for:', day);
      
      const userId = await getCurrentUserId();
      if (!userId) {
        Alert.alert('Error', 'User not found. Please log in again.');
        return;
      }
      
      // Get the actual date for the clicked day
      const dateInfo = getDateForDay(day);
      
      // Handle future dates - show future modal
      if (dateInfo.isFuture) {
        setFutureSessionInfo({
          day,
          date: new Date(dateInfo.date).toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          }),
          time: timeSlot.display,
          isPast: false,
        });
        setShowFutureModal(true);
        return;
      }
      
      // Handle past dates (NOT today) - show past modal with edit option
      if (dateInfo.daysFromNow < 0) {
        setFutureSessionInfo({
          day,
          date: new Date(dateInfo.date).toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          }),
          time: timeSlot.display,
          isPast: true,
        });
        setShowFutureModal(true);
        return;
      }
      
      // Use TODAY's date for today in local timezone
      const sessionDate = dateInfo.daysFromNow === 0 
        ? new Date().toLocaleDateString('en-CA')  // ✅ Use local date (YYYY-MM-DD format)
        : dateInfo.date;  // Use calculated date for past/future
      const session = await createOrGetSession(userId, sessionDate, timeSlot.display, day);
      
      // Check if this is an existing session
      const isExisting = session.created_at && 
        new Date(session.created_at).getTime() < Date.now() - 5000;
      
      console.log('Session created:', session);
      console.log('Navigating to:', SCREEN_NAMES.AGE_GROUP);
      
      // Navigate to Age Group Selection
      navigation.navigate(SCREEN_NAMES.AGE_GROUP, {
        sessionId: session.id,
        sessionDate,
        sessionTime: timeSlot.display,
        dayOfWeek: day,
        isExistingSession: isExisting,
      });
    } catch (error) {
      console.error('Error creating session:', error);
      setErrorMessage('Failed to start session. Please try again.');
      setShowErrorModal(true);
    }
  };

  const handleAddActivity = () => {
    setShowAddActivityModal(true);
  };

  const handleAddActivityConfirm = async () => {
    setShowAddActivityModal(false);
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        setErrorMessage('User not found. Please log in again.');
        setShowErrorModal(true);
        return;
      }
      
      const sessionDate = currentDate.toISOString().split('T')[0];
      const timeSlot = { display: 'Special Event' };
      const session = await createSession(userId, sessionDate, timeSlot.display, currentDay);
      
      navigation.navigate(SCREEN_NAMES.AGE_GROUP, {
        sessionId: session.id,
        sessionDate,
        sessionTime: 'Special Event',
        dayOfWeek: currentDay,
      });
    } catch (error) {
      console.error('Error creating special session:', error);
      setErrorMessage('Failed to start session. Please try again.');
      setShowErrorModal(true);
    }
  };


const handleTakeAttendance = async () => {
  try {
    console.log('Take Attendance clicked');
    
    const userId = await getCurrentUserId();
    if (!userId) {
      setErrorMessage('User not found. Please log in again.');
      setShowErrorModal(true);
      return;
    }
    
    // Check if there are any kids in the academy
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    const academyId = (await AsyncStorage.default.getItem('academyId')) || 'academy_accellax361_main';
    
    const { collection, getDocs } = await import('firebase/firestore');
    const { db: firebaseDb } = await import('../../config/firebase');
    
    const kidsRef = collection(firebaseDb, `academies/${academyId}/kids`);
    const snapshot = await getDocs(kidsRef);
    
    const activeKids = [];
    snapshot.forEach(doc => {
      const kid = doc.data();
      if (kid.status === 'active' || !kid.status) {
        activeKids.push(kid);
      }
    });
    
    if (activeKids.length === 0) {
      setShowNoKidsModal(true);
      return;
    }

    // Create session - use local date to avoid timezone issues
    const sessionDate = currentDate.toLocaleDateString('en-CA');  // ✅ YYYY-MM-DD in local timezone
    const timeSlot = isTrainingDay(currentDay) 
      ? TRAINING_SCHEDULE[currentDay] 
      : { display: 'Special Event' };
    
    console.log('Checking for existing session...', { sessionDate, timeSlot, currentDay });
    
    const session = await createOrGetSession(userId, sessionDate, timeSlot.display, currentDay);
    
    console.log('Session ready:', session);
    
    // Check if this is an existing session
    const isExisting = session.created_at && 
      new Date(session.created_at).getTime() < Date.now() - 5000;
    
    if (isExisting) {
      // Show modal for existing session
      setExistingSessionData({
        sessionId: session.id,
        sessionDate,
        sessionTime: timeSlot.display,
        dayOfWeek: currentDay,
      });
      setShowExistingSessionModal(true);
    } else {
      // Navigate directly for new session
      navigation.navigate(SCREEN_NAMES.AGE_GROUP, {
        sessionId: session.id,
        sessionDate,
        sessionTime: timeSlot.display,
        dayOfWeek: currentDay,
        isExistingSession: false,
      });
    }
  } catch (error) {
    console.error('Error in handleTakeAttendance:', error);
    setErrorMessage('Failed to start attendance. Please try again.');
    setShowErrorModal(true);
  }
};

  const handleQuickNote = () => {
    navigation.navigate('NotesStack', {
      screen: 'AddEditNote',
    });
  };

  const handleAddNewKid = () => {
    navigation.navigate('MyKidsStack', {
      screen: 'AddEditKid',
      params: { mode: 'add' },
    });
  };

  const renderTrainingDayCard = (day) => {
    const timeSlot = TRAINING_SCHEDULE[day];
    const isToday = day === currentDay;
    const dateInfo = getDateForDay(day);
    const isFuture = dateInfo.isFuture;
    const isPast = dateInfo.isPast; // Use dateInfo.isPast instead of calculating again

    return (
      <TouchableOpacity
        key={day}
        style={[
          styles.dayCard, 
          isToday && styles.todayCard,
          isFuture && styles.futureCard,
          isPast && styles.pastCard
        ]}
        onPress={() => handleSessionStart(day, timeSlot)}
        activeOpacity={0.7}
      >
        <View style={styles.dayCardHeader}>
          <Text style={[styles.dayName, isToday && styles.todayText]}>{day}</Text>
          {isToday && <View style={styles.todayBadge}><Text style={styles.todayBadgeText}>TODAY</Text></View>}
        </View>
        <Text style={styles.timeText}>{timeSlot.display}</Text>
        <View style={[
          styles.startButton,
          isPast && styles.editButton,
          isFuture && styles.viewButton
        ]}>
          <Text style={styles.startButtonText}>
            {isPast ? 'Edit Session →' : isFuture ? 'View Session →' : 'Start Session →'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderNonTrainingDay = () => {
    return (
      <View style={styles.noTrainingContainer}>
        <Text style={styles.noTrainingIcon}>💎</Text>
        <Text style={styles.noTrainingText}>No training scheduled today</Text>
        <Text style={styles.noTrainingSubtext}>Rest day - Next training: {getNextTrainingDay()}</Text>
        <TouchableOpacity
          style={styles.addActivityButton}
          onPress={handleAddActivity}
          activeOpacity={0.7}
        >
          <Text style={styles.addActivityButtonText}>+ Add Activity Today</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const getNextTrainingDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentIndex = days.indexOf(currentDay);
    
    for (let i = 1; i <= 7; i++) {
      const nextIndex = (currentIndex + i) % 7;
      const nextDay = days[nextIndex];
      if (TRAINING_DAYS.includes(nextDay)) {
        return nextDay;
      }
    }
    return 'Sunday';
  };

  const renderPastSessionModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showFutureModal && futureSessionInfo?.isPast === true}
      onRequestClose={() => setShowFutureModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { borderTopWidth: 4, borderTopColor: COLORS.secondary }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalIcon}>📅</Text>
            <Text style={styles.modalTitle}>Past Session</Text>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              This session was on:
            </Text>
            <Text style={styles.modalDateText}>
              {futureSessionInfo?.day}
            </Text>
            <Text style={styles.modalDateText}>
              {futureSessionInfo?.date}
            </Text>
            <Text style={styles.modalTimeText}>
              {futureSessionInfo?.time}
            </Text>
            <Text style={[styles.modalWarning, { color: COLORS.secondary }]}>
              You can still edit past attendance.
            </Text>
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCloseButton]}
              onPress={() => setShowFutureModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalEditButton]}
              onPress={async () => {
                setShowFutureModal(false);
                const userId = await getCurrentUserId();
                const dateInfo = getDateForDay(futureSessionInfo.day);
                const session = await createOrGetSession(userId, dateInfo.date, futureSessionInfo.time, futureSessionInfo.day);
                navigation.navigate(SCREEN_NAMES.AGE_GROUP, {
                  sessionId: session.id,
                  sessionDate: dateInfo.date,
                  sessionTime: futureSessionInfo.time,
                  dayOfWeek: futureSessionInfo.day,
                  isExistingSession: true,
                });
              }}
            >
              <Text style={styles.modalEditButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderFutureSessionModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showFutureModal && futureSessionInfo?.isPast === false}
      onRequestClose={() => setShowFutureModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalIcon}>📅</Text>
            <Text style={styles.modalTitle}>Future Session</Text>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              This session is scheduled for:
            </Text>
            <Text style={styles.modalDateText}>
              {futureSessionInfo?.day}
            </Text>
            <Text style={styles.modalDateText}>
              {futureSessionInfo?.date}
            </Text>
            <Text style={styles.modalTimeText}>
              {futureSessionInfo?.time}
            </Text>
            <Text style={styles.modalWarning}>
              You cannot mark attendance for future sessions.
            </Text>
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCloseButton]}
              onPress={() => setShowFutureModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => {
                setShowFutureModal(false);
                console.log('Cancel session - coming soon');
              }}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderErrorModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showErrorModal}
      onRequestClose={() => setShowErrorModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalIcon}>⚠️</Text>
            <Text style={styles.modalTitle}>Error</Text>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              {errorMessage}
            </Text>
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCloseButton]}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderAddActivityModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showAddActivityModal}
      onRequestClose={() => setShowAddActivityModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalIcon}>⚽</Text>
            <Text style={styles.modalTitle}>Add Special Activity</Text>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              Start a special session for today?
            </Text>
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCloseButton]}
              onPress={() => setShowAddActivityModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalEditButton]}
              onPress={handleAddActivityConfirm}
            >
              <Text style={styles.modalEditButtonText}>Start Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderExistingSessionModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showExistingSessionModal}
      onRequestClose={() => setShowExistingSessionModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalIcon}>📋</Text>
            <Text style={styles.modalTitle}>Existing Session Found</Text>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              A session already exists for today. Do you want to edit the existing attendance?
            </Text>
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCloseButton]}
              onPress={() => setShowExistingSessionModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalEditButton]}
              onPress={() => {
                setShowExistingSessionModal(false);
                navigation.navigate(SCREEN_NAMES.AGE_GROUP, {
                  sessionId: existingSessionData.sessionId,
                  sessionDate: existingSessionData.sessionDate,
                  sessionTime: existingSessionData.sessionTime,
                  dayOfWeek: existingSessionData.dayOfWeek,
                  isExistingSession: true,
                });
              }}
            >
              <Text style={styles.modalEditButtonText}>Edit Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // renderQuickNoteModal - REMOVED (no longer needed, navigates directly to notes)

  const renderNoKidsModal = () => (
  <Modal
    animationType="fade"
    transparent={true}
    visible={showNoKidsModal}
    onRequestClose={() => setShowNoKidsModal(false)}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalIcon}>👥</Text>
          <Text style={styles.modalTitle}>No Kids Found</Text>
        </View>
        
        <View style={styles.modalContent}>
          <Text style={styles.modalText}>
            Please add kids before taking attendance.
          </Text>
          <Text style={[styles.modalWarning, { color: COLORS.primary }]}>
            You need to register players first to start a session.
          </Text>
        </View>
        
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, styles.modalCloseButton]}
            onPress={() => setShowNoKidsModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.modalEditButton]}
            onPress={() => {
              setShowNoKidsModal(false);
              navigation.navigate('MyKidsStack');
            }}
          >
            <Text style={styles.modalEditButtonText}>Add Kids</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <Header
        title="AccellaX 361°"
        subtitle={academyName}
        leftIcon="☰"
        onLeftPress={() => navigation.openDrawer()}
        showAvatar={true}
      />

      <View style={styles.scrollViewContainer}>
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Date Display */}
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
          <Text style={styles.dayText}>{currentDay}</Text>
        </View>

        {/* Training Schedule */}
        <View style={styles.scheduleContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Training Schedule</Text>
            <TouchableOpacity
              style={styles.viewAllChip}
              onPress={() => navigation.navigate('HistoryStack', { screen: 'History' })}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {isTrainingDay(currentDay) ? (
            <View style={styles.trainingDaysGrid}>
              {TRAINING_DAYS.map((day) => renderTrainingDayCard(day))}
            </View>
          ) : (
            renderNonTrainingDay()
          )}

          {isTrainingDay(currentDay) && (
            <View style={styles.allSessionsContainer}>
              <Text style={styles.allSessionsTitle}>All Training Days</Text>
              <View style={styles.allSessionsList}>
                {TRAINING_DAYS.map((day) => {
                  const timeSlot = TRAINING_SCHEDULE[day];
                  return (
                    <View key={day} style={styles.sessionRow}>
                      <Text style={styles.sessionDay}>{day}</Text>
                      <Text style={styles.sessionTime}>{timeSlot.display}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalKids}</Text>
              <Text style={styles.statLabel}>Total Kids</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{thisWeekSessions}</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{avgAttendance}%</Text>
              <Text style={styles.statLabel}>Avg Attendance</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {/* Take Attendance */}
            <TouchableOpacity
              style={[styles.actionCard, styles.attendanceCard]}
              onPress={handleTakeAttendance}
              activeOpacity={0.8}
            >
              <Text style={styles.actionTitle}>Take Attendance</Text>
              <Text style={styles.actionDescription}>
                Mark today's attendance
              </Text>
            </TouchableOpacity>

            {/* Take Note */}
            <TouchableOpacity
              style={[styles.actionCard, styles.noteCard]}
              onPress={handleQuickNote}
              activeOpacity={0.8}
            >
              <Text style={styles.actionTitle}>Take Note</Text>
              <Text style={styles.actionDescription}>
                Add session notes
              </Text>
            </TouchableOpacity>

            {/* Add New Kid */}
            <TouchableOpacity
              style={[styles.actionCard, styles.addKidCard]}
              onPress={handleAddNewKid}
              activeOpacity={0.8}
            >
              <Text style={styles.actionTitle}>Add New Kid</Text>
              <Text style={styles.actionDescription}>
                Register new player
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 24 }} />
        </ScrollView>
      </View>
      
      {/* Modals */}
      {futureSessionInfo?.isPast ? renderPastSessionModal() : renderFutureSessionModal()}
      {renderNoKidsModal()}
      {renderErrorModal()}
      {renderAddActivityModal()}
      {renderExistingSessionModal()}
          </View>
        );
      };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollViewContainer: {
    height: 0,
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollViewContainer: {
    height: 0,
    flexGrow: 1,
    flexShrink: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  dateContainer: {
    backgroundColor: COLORS.white,
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dateText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  dayText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  scheduleContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  trainingDaysGrid: {
    gap: 12,
  },
  dayCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  todayCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  futureCard: {
    opacity: 0.6,
    borderColor: COLORS.textSecondary,
    borderStyle: 'dashed',
  },
  pastCard: {
    borderColor: COLORS.secondary,
    backgroundColor: '#E8F5E9',
  },
  dayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  todayText: {
    color: COLORS.primary,
  },
  todayBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  todayBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  startButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#388E3C', // Darker green for past sessions
  },
  viewButton: {
    backgroundColor: COLORS.textSecondary, // Gray for future sessions
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  noTrainingContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
  },
  noTrainingIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  noTrainingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  noTrainingSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  addActivityButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addActivityButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  allSessionsContainer: {
    marginTop: 24,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  allSessionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  allSessionsList: {
    gap: 8,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sessionDay: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  sessionTime: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    minHeight: 80,
    maxHeight: 100,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  actionsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendanceCard: {
    backgroundColor: '#E8F5E9',
    borderTopWidth: 3,
    borderTopColor: COLORS.secondary,
  },
  noteCard: {
    backgroundColor: '#FFF3E0',
    borderTopWidth: 3,
    borderTopColor: COLORS.warning,
  },
  addKidCard: {
    backgroundColor: '#E3F2FD',
    borderTopWidth: 3,
    borderTopColor: COLORS.primary,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    elevation: 1,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  
  // Future Session Modal Styles
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalContent: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  modalDateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  modalTimeText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  modalWarning: {
    fontSize: 14,
    color: COLORS.warning,
    textAlign: 'center',
    fontStyle: 'italic',
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
  modalCloseButton: {
    backgroundColor: COLORS.primary,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  modalCancelButton: {
    backgroundColor: COLORS.secondary,
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  modalEditButton: {
    backgroundColor: COLORS.secondary,
  },
  modalEditButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default HomeScreen;