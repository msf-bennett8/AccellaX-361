// Location: /apps/assessment/src/screens/SelectKids/SelectKidsScreen.js
// FIXED: Navigate to SelectTests in kid-by-kid mode

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import { COLORS } from '../../utils/constants';
import { getKidsBySport } from '../../services/kidService';
import { getAssessmentProgress } from '../../database/queries';

const SelectKidsScreen = ({ route, navigation }) => {
  const { sport, assessmentMode, selectedTests = [], kidCount } = route.params || {};
  
  const [kids, setKids] = useState([]);
  const [selectedKids, setSelectedKids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({});

  // Determine if we're in test-by-test or kid-by-kid mode
  const isTestByTestMode = assessmentMode === 'test_by_test';
  const isKidByKidMode = assessmentMode === 'kid_by_kid';

  useEffect(() => {
    loadKids();
  }, [sport]);

  const loadKids = async () => {
    try {
      setLoading(true);
      
      if (!sport || !sport.id) {
        console.error('❌ Sport object is invalid:', sport);
        Alert.alert('Error', 'Invalid sport selection');
        setKids([]);
        setLoading(false);
        return;
      }
      
      console.log('🔄 Loading kids for sport:', sport.id);
      const kidsData = await getKidsBySport(sport.id);
      
      const validKidsData = Array.isArray(kidsData) ? kidsData : [];
      console.log('✅ Loaded kids:', validKidsData.length);
      
      setKids(validKidsData);
      
      // Only fetch progress if we have tests selected (test-by-test mode)
      if (validKidsData.length > 0 && selectedTests && selectedTests.length > 0) {
        const metricIds = selectedTests.map(t => t.id);
        const kidIds = validKidsData.map(k => k.id);
        const progressData = await getAssessmentProgress(kidIds, metricIds, sport.id);
        setProgress(progressData || {});
      }
    } catch (error) {
      console.error('❌ Error loading kids:', error);
      Alert.alert('Error', 'Failed to load kids: ' + error.message);
      setKids([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleKidSelection = (kidId) => {
    setSelectedKids(prev => 
      prev.includes(kidId) 
        ? prev.filter(id => id !== kidId)
        : [...prev, kidId]
    );
  };

  const selectAll = () => {
    setSelectedKids(selectedKids.length === kids.length ? [] : kids.map(k => k.id));
  };

  const handleContinue = () => {
    if (selectedKids.length === 0) {
      Alert.alert('No Kids Selected', 'Please select at least one kid to assess');
      return;
    }

    const selectedKidsData = kids.filter(k => selectedKids.includes(k.id));

    console.log('🎯 Kids selected:', {
      sport: sport?.name,
      mode: assessmentMode,
      kidsCount: selectedKidsData.length,
      hasTests: selectedTests.length > 0
    });

    // CRITICAL FIX: Different navigation based on mode
    if (isKidByKidMode) {
      // Kid-by-Kid: Navigate to SelectTests to choose tests
      console.log('➡️ Navigating to SelectTests (kid-by-kid mode)');
      navigation.navigate('SelectTests', {
        sport,
        assessmentMode,
        selectedKids: selectedKidsData,
        kidCount: selectedKidsData.length
      });
    } else {
      // Test-by-Test: Tests already selected, go directly to AssessmentEntry
      console.log('➡️ Navigating to AssessmentEntry (test-by-test mode)');
      navigation.navigate('AssessmentEntry', {
        sport,
        kids: selectedKidsData,
        mode: assessmentMode,
        selectedTests,
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'in_progress': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const renderKidItem = ({ item }) => {
    const isSelected = selectedKids.includes(item.id);
    const kidProgress = progress[item.id];

    return (
      <TouchableOpacity
        style={[styles.kidCard, isSelected && styles.selectedKidCard]}
        onPress={() => toggleKidSelection(item.id)}
      >
        <View style={styles.checkbox}>
          {isSelected && <View style={styles.checkmark} />}
        </View>
        
        <View style={styles.kidInfo}>
          <Text style={styles.kidName}>{item.name}</Text>
          <Text style={styles.kidDetails}>
            Age: {item.age} • {item.age_group} • {item.gender}
          </Text>
          
          {kidProgress && (
            <View style={styles.progressContainer}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(kidProgress.status) }]} />
              <Text style={styles.progressText}>
                {kidProgress.completed}/{kidProgress.total} ({kidProgress.percentage}%)
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Select Kids"
          leftIcon="←"
          onLeftPress={() => navigation.goBack()}
          showAvatar={false}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading kids...</Text>
        </View>
      </View>
    );
  }

  if (!loading && kids.length === 0) {
    return (
      <View style={styles.container}>
        <Header
          title="Select Kids"
          subtitle={sport?.name ? `${sport.name}` : 'Loading...'}
          leftIcon="←"
          onLeftPress={() => navigation.goBack()}
          showAvatar={false}
        />
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No kids enrolled in {sport?.name || 'this sport'}</Text>
          <Text style={styles.emptySubtext}>Kids need to be assigned to this sport first</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Select Kids"
        subtitle={`${sport?.name || 'Sport'} • ${isKidByKidMode ? 'Kid-by-Kid' : 'Test-by-Test'}`}
        leftIcon="←"
        onLeftPress={() => navigation.goBack()}
        showAvatar={false}
      />

      <View style={styles.controls}>
        <TouchableOpacity onPress={selectAll} style={styles.selectAllButton}>
          <Text style={styles.selectAllText}>
            {selectedKids.length === kids.length ? 'Deselect All' : 'Select All'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.selectedCount}>{selectedKids.length} of {kids.length} selected</Text>
      </View>

      <View style={styles.content}>
        <FlatList
          data={kids}
          renderItem={renderKidItem}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.startButton, selectedKids.length === 0 && styles.disabledButton]}
          onPress={handleContinue}
          disabled={selectedKids.length === 0}
        >
          <Text style={styles.startButtonText}>
            {isKidByKidMode 
              ? `Continue with ${selectedKids.length} kid${selectedKids.length !== 1 ? 's' : ''}`
              : `Start Assessment (${selectedKids.length} kids)`
            }
          </Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: {
    position: 'absolute',
    top: 165,
    left: 0,
    right: 0,
    bottom: 80,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 16, marginBottom: 8, textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: '#666', textAlign: 'center' },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  selectAllButton: { padding: 8 },
  selectAllText: { fontSize: 16, color: '#4CAF50', fontWeight: '600' },
  selectedCount: { fontSize: 14, color: '#666' },
  listContainer: { padding: 16 },
  kidCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 8, marginBottom: 12, borderWidth: 2, borderColor: '#E0E0E0' },
  selectedKidCard: { borderColor: '#4CAF50', backgroundColor: '#F1F8F4' },
  checkbox: { width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: '#4CAF50', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkmark: { width: 14, height: 14, borderRadius: 2, backgroundColor: '#4CAF50' },
  kidInfo: { flex: 1 },
  kidName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  kidDetails: { fontSize: 14, color: '#666', marginBottom: 8 },
  progressContainer: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  progressText: { fontSize: 12, color: '#666' },
  bottomContainer: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16, 
    backgroundColor: '#FFF', 
    borderTopWidth: 1, 
    borderTopColor: '#E0E0E0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  startButton: { 
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50', 
    padding: 16, 
    borderRadius: 8, 
    gap: 8
  },
  disabledButton: { backgroundColor: '#BDBDBD' },
  startButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default SelectKidsScreen;