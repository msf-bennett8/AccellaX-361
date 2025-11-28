// Location: /apps/assessment/src/screens/History/HistoryScreen.js
// Hybrid assessment history with list/calendar views and advanced filters

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import { COLORS } from '../../utils/constants';
import { getAllAssessments } from '../../services/assessmentService';
import { getKidByIdFromFirebase } from '../../services/kidService';
import { getSportById } from '../../database/db';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export default function HistoryScreen() {
  const navigation = useNavigation();

  // State
  const [assessments, setAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  
  // Filters
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    sport: null,
    kid: null,
    dateRange: 'all', // 'all', 'thisWeek', 'thisMonth', 'thisQuarter', 'thisYear', 'custom'
    term: null, // 'Q1', 'Q2', 'Q3', 'Q4'
    performance: 'all', // 'all', 'excellent', 'good', 'needsWork'
    customStartDate: null,
    customEndDate: null,
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    thisWeek: 0,
    thisMonth: 0,
    lastAssessmentDate: null,
  });

  useEffect(() => {
    loadHistory();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadHistory();
    }, [])
  );

  useEffect(() => {
    applyFilters();
  }, [assessments, filters]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const allAssessments = await getAllAssessments();
      
      // Enrich with kid and sport names
      const enrichedAssessments = await Promise.all(
        allAssessments.map(async (assessment) => {
          const kid = await getKidByIdFromFirebase(assessment.kid_id);
          const sport = await getSportById(assessment.sport_id);
          return {
            ...assessment,
            kidName: kid?.name || 'Unknown',
            sportName: sport?.name || 'Unknown',
            sportColor: sport?.color || COLORS.primary,
          };
        })
      );

      setAssessments(enrichedAssessments);
      calculateStats(enrichedAssessments);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading history:', error);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const calculateStats = (data) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = startOfMonth(now);

    const thisWeek = data.filter(a => new Date(a.assessment_date) >= oneWeekAgo).length;
    const thisMonth = data.filter(a => new Date(a.assessment_date) >= oneMonthAgo).length;
    const lastDate = data.length > 0 ? data.sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date))[0].assessment_date : null;

    setStats({
      total: data.length,
      thisWeek,
      thisMonth,
      lastAssessmentDate: lastDate,
    });
  };

  const applyFilters = () => {
    let filtered = [...assessments];

    // Sport filter
    if (filters.sport) {
      filtered = filtered.filter(a => a.sport_id === filters.sport);
    }

    // Kid filter
    if (filters.kid) {
      filtered = filtered.filter(a => a.kid_id === filters.kid);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let startDate, endDate;

      switch (filters.dateRange) {
        case 'thisWeek':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = now;
          break;
        case 'thisMonth':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'thisQuarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
          break;
        case 'thisYear':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        case 'custom':
          startDate = filters.customStartDate ? new Date(filters.customStartDate) : null;
          endDate = filters.customEndDate ? new Date(filters.customEndDate) : null;
          break;
      }

      if (startDate && endDate) {
        filtered = filtered.filter(a => {
          const assessmentDate = new Date(a.assessment_date);
          return isWithinInterval(assessmentDate, { start: startDate, end: endDate });
        });
      }
    }

    setFilteredAssessments(filtered);
  };

  const clearFilters = () => {
    setFilters({
      sport: null,
      kid: null,
      dateRange: 'all',
      term: null,
      performance: 'all',
      customStartDate: null,
      customEndDate: null,
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.sport) count++;
    if (filters.kid) count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.term) count++;
    if (filters.performance !== 'all') count++;
    return count;
  };

  const renderAssessmentCard = (assessment) => (
    <TouchableOpacity
      key={assessment.id}
      style={styles.assessmentCard}
      onPress={() => navigation.navigate('KidProgress', { 
        kidId: assessment.kid_id, 
        sportId: assessment.sport_id 
      })}
      activeOpacity={0.7}
    >
      <View style={[styles.sportIndicator, { backgroundColor: assessment.sportColor }]} />
      
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.kidName}>{assessment.kidName}</Text>
          <Text style={styles.assessmentDate}>
            {format(parseISO(assessment.assessment_date), 'MMM dd, yyyy')}
          </Text>
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="trophy" size={16} color={assessment.sportColor} />
            <Text style={styles.metaText}>{assessment.sportName}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="clipboard-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{assessment.results?.length || 0} metrics</Text>
          </View>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Assessment History"
          leftIcon="☰"
          onLeftPress={() => navigation.openDrawer()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Assessment History"
        subtitle={`${filteredAssessments.length} assessments`}
        leftIcon="☰"
        onLeftPress={() => navigation.openDrawer()}
      />

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color={COLORS.primary} />
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={24} color={COLORS.success} />
            <Text style={styles.statNumber}>{stats.thisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="calendar-month" size={24} color="#2196F3" />
            <Text style={styles.statNumber}>{stats.thisMonth}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>

        {/* View Mode Toggle & Filters */}
        <View style={styles.controlsContainer}>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'list' && styles.activeViewButton]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons 
                name="list" 
                size={20} 
                color={viewMode === 'list' ? COLORS.white : COLORS.textSecondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'calendar' && styles.activeViewButton]}
              onPress={() => setViewMode('calendar')}
            >
              <Ionicons 
                name="calendar" 
                size={20} 
                color={viewMode === 'calendar' ? COLORS.white : COLORS.textSecondary} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="filter" size={20} color={COLORS.primary} />
            <Text style={styles.filterText}>Filters</Text>
            {getActiveFilterCount() > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Active Filters Display */}
        {getActiveFilterCount() > 0 && (
          <View style={styles.activeFiltersContainer}>
            <Text style={styles.activeFiltersLabel}>Active Filters:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
              {filters.sport && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>Sport</Text>
                  <TouchableOpacity onPress={() => setFilters({...filters, sport: null})}>
                    <Ionicons name="close-circle" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              )}
              {filters.dateRange !== 'all' && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{filters.dateRange}</Text>
                  <TouchableOpacity onPress={() => setFilters({...filters, dateRange: 'all'})}>
                    <Ionicons name="close-circle" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Assessment List */}
        {filteredAssessments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No assessments found</Text>
            <Text style={styles.emptySubtext}>
              {getActiveFilterCount() > 0 ? 'Try adjusting your filters' : 'Start by creating an assessment'}
            </Text>
          </View>
        ) : (
          <View style={styles.assessmentsList}>
            {filteredAssessments.map(renderAssessmentCard)}
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Assessments</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.filterSectionTitle}>Date Range</Text>
              {['all', 'thisWeek', 'thisMonth', 'thisQuarter', 'thisYear'].map((range) => (
                <TouchableOpacity
                  key={range}
                  style={styles.filterOption}
                  onPress={() => setFilters({...filters, dateRange: range})}
                >
                  <Text style={styles.filterOptionText}>
                    {range === 'all' ? 'All Time' : 
                     range === 'thisWeek' ? 'This Week' :
                     range === 'thisMonth' ? 'This Month' :
                     range === 'thisQuarter' ? 'This Quarter' : 'This Year'}
                  </Text>
                  {filters.dateRange === range && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={clearFilters}
              >
                <Text style={styles.modalButtonTextSecondary}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.textSecondary },
  
  statsContainer: { flexDirection: 'row', padding: 20, gap: 12 },
  statCard: { 
    flex: 1, 
    backgroundColor: COLORS.white, 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginVertical: 8 },
  statLabel: { fontSize: 12, color: COLORS.textSecondary },
  
  controlsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    marginBottom: 16 
  },
  viewToggle: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 8, padding: 4 },
  viewButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  activeViewButton: { backgroundColor: COLORS.primary },
  
  filterButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.white, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 8, 
    gap: 6 
  },
  filterText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  filterBadge: { 
    backgroundColor: COLORS.error, 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: 4 
  },
  filterBadgeText: { fontSize: 11, fontWeight: 'bold', color: COLORS.white },
  
  activeFiltersContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginBottom: 16 
  },
  activeFiltersLabel: { fontSize: 13, color: COLORS.textSecondary, marginRight: 8 },
  filterChips: { flex: 1, marginRight: 12 },
  filterChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.primaryLight, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16, 
    marginRight: 8, 
    gap: 6 
  },
  filterChipText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  clearFiltersText: { fontSize: 13, fontWeight: '600', color: COLORS.error },
  
  assessmentsList: { paddingHorizontal: 20, paddingBottom: 20 },
  assessmentCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.white, 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sportIndicator: { width: 4, height: 40, borderRadius: 2, marginRight: 12 },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  kidName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  assessmentDate: { fontSize: 13, color: COLORS.textSecondary },
  cardMeta: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: COLORS.textSecondary },
  
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },
  
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end' 
  },
  modalContainer: { 
    backgroundColor: COLORS.white, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    maxHeight: '80%' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border 
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  modalContent: { padding: 20 },
  filterSectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  filterOption: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border 
  },
  filterOptionText: { fontSize: 15, color: COLORS.text },
  modalFooter: { 
    flexDirection: 'row', 
    padding: 20, 
    borderTopWidth: 1, 
    borderTopColor: COLORS.border, 
    gap: 12 
  },
  modalButton: { 
    flex: 1, 
    paddingVertical: 14, 
    borderRadius: 8, 
    alignItems: 'center', 
    backgroundColor: COLORS.backgroundDark 
  },
  modalButtonPrimary: { backgroundColor: COLORS.primary },
  modalButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
  modalButtonTextSecondary: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
});
