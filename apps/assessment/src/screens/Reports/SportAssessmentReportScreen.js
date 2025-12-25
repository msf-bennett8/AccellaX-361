// Location: /apps/assessment/src/screens/Reports/SportAssessmentReportScreen.js
// Sport-specific assessment report with filters and export

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SearchBar from '../../components/common/SearchBar';
import { COLORS, AGE_GROUPS, ASSESSMENT_TERMS } from '../../utils/constants';
import { getAssessmentsByDateRange } from '../../database/queries';
import { getSportById, getAllKids } from '../../database/db';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

export default function SportAssessmentReportScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get sport from navigation params
  const { sportId, sportName } = route.params || {};

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showTermDropdown, setShowTermDropdown] = useState(false);
  const [showAgeDropdown, setShowAgeDropdown] = useState(false);
  
  // Data
  const [sport, setSport] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [yearOptions, setYearOptions] = useState([{ value: 'all', label: 'All Years' }]);
  
  // Stats
  const [stats, setStats] = useState({
    totalAssessments: 0,
    totalKids: 0,
    avgMetrics: 0,
    lastAssessmentDate: null,
  });

  const [showNoDataModal, setShowNoDataModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadData();
  }, [sportId]);

  useEffect(() => {
    applyFilters();
  }, [assessments, searchQuery, selectedYear, selectedTerm, selectedAgeGroup]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading sport report for:', sportId);

      // Load sport details
      const sportData = await getSportById(sportId);
      setSport(sportData);

      // Load all assessments for this sport (last 2 years)
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear - 2}-01-01`;
      const endDate = `${currentYear + 1}-12-31`;
      
      const allAssessments = await getAssessmentsByDateRange(startDate, endDate);
      // Filter to only this sport
      const sportAssessments = allAssessments.filter(a => a.sport_id === sportId);
      console.log('✅ Loaded assessments for sport:', sportAssessments.length);

      // Enrich with kid details
      const kids = await getAllKids();
      const enrichedAssessments = sportAssessments.map(assessment => {
        const kid = kids.find(k => k.id === assessment.kid_id);
        return {
          ...assessment,
          kidName: kid?.name || 'Unknown',
          kidAgeGroup: kid?.age_group || 'Unknown',
          kidAge: kid?.age || 0,
        };
      });

      setAssessments(enrichedAssessments);

      // Generate year options
      const assessmentYears = new Set();
      enrichedAssessments.forEach(a => {
        if (a.year && a.year !== 'null' && a.year !== null) {
          assessmentYears.add(a.year);
        } else {
          const assessmentYear = new Date(a.assessment_date).getFullYear();
          assessmentYears.add(`${assessmentYear}/${assessmentYear + 1}`);
        }
      });

      const sortedYears = Array.from(assessmentYears).sort((a, b) => {
        const yearA = parseInt(a.split('/')[0]);
        const yearB = parseInt(b.split('/')[0]);
        return yearB - yearA;
      });

      const dynamicYearOptions = sortedYears.map(year => ({
        value: year,
        label: year
      }));

      setYearOptions([{ value: 'all', label: 'All Years' }, ...dynamicYearOptions]);

      // Calculate stats
      calculateStats(enrichedAssessments);

      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading sport report:', error);
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const uniqueKids = new Set(data.map(a => a.kid_id)).size;
    const totalMetrics = data.reduce((sum, a) => sum + (a.results?.length || 0), 0);
    const avgMetrics = data.length > 0 ? Math.round(totalMetrics / data.length) : 0;
    const lastDate = data.length > 0 
      ? data.sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date))[0].assessment_date 
      : null;

    setStats({
      totalAssessments: data.length,
      totalKids: uniqueKids,
      avgMetrics,
      lastAssessmentDate: lastDate,
    });
  };

  const applyFilters = () => {
    let filtered = [...assessments];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(a =>
        a.kidName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Year filter
    if (selectedYear !== 'all') {
      filtered = filtered.filter(a => {
        if (a.year && a.year !== 'null' && a.year !== null) {
          return a.year === selectedYear;
        }
        const assessmentYear = new Date(a.assessment_date).getFullYear();
        const [startYear] = selectedYear.split('/');
        return assessmentYear.toString() === startYear;
      });
    }

    // Term filter
    if (selectedTerm !== 'all') {
      filtered = filtered.filter(a => a.term === selectedTerm);
    }

    // Age group filter
    if (selectedAgeGroup !== 'all') {
      filtered = filtered.filter(a => a.kidAgeGroup === selectedAgeGroup);
    }

    setFilteredAssessments(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // handleShare function removed - export functionality moved to HistoryReport screen
const handleViewFullHistory = () => {
  navigation.navigate('History', {
    screen: 'HistoryReport',
    params: {
      filteredAssessments,
      filters: {
        sport: sportId,
        sportName: sport?.name || sportName,
        year: selectedYear,
        term: selectedTerm,
        ageGroup: selectedAgeGroup,
      },
    },
  });
};

  const renderAssessmentCard = (assessment) => (
    <TouchableOpacity
      key={assessment.id}
      style={styles.assessmentCard}
      onPress={() => {
        navigation.navigate('History', {
          screen: 'AssessmentDetail',
          params: { 
            assessmentId: assessment.id,
            kidId: assessment.kid_id, 
            sportId: assessment.sport_id 
          }
        });
      }}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.kidName}>{assessment.kidName}</Text>
          <Text style={styles.assessmentDate}>
            {format(new Date(assessment.assessment_date), 'MMM dd, yyyy')}
          </Text>
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="school-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{assessment.kidAgeGroup} years</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{assessment.term || 'N/A'}</Text>
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

  const termOptions = [
    { value: 'all', label: 'All Terms' },
    ...ASSESSMENT_TERMS.map(t => ({ value: t, label: t })),
  ];

  const ageGroupOptions = [
    { value: 'all', label: 'All Age Groups' },
    ...AGE_GROUPS.map(ag => ({ value: ag, label: `${ag} years` })),
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title={sportName || 'Sport Report'}
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
        />
        <LoadingSpinner overlay text="Loading report..." color="#1565C0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={sport?.name || sportName || 'Sport Report'}
        subtitle={`${filteredAssessments.length} assessments`}
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        showBackButton={true}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="clipboard-check" size={28} color={COLORS.primary} />
            <Text style={styles.statNumber}>{stats.totalAssessments}</Text>
            <Text style={styles.statLabel}>Assessments</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="people" size={28} color={COLORS.success} />
            <Text style={styles.statNumber}>{stats.totalKids}</Text>
            <Text style={styles.statLabel}>Athletes</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons name="chart-line" size={28} color="#FF9800" />
            <Text style={styles.statNumber}>{stats.avgMetrics}</Text>
            <Text style={styles.statLabel}>Avg Metrics</Text>
          </View>
        </View>

        {/* Last Assessment Info */}
        {stats.lastAssessmentDate && (
          <View style={styles.infoCard}>
            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Last assessment: {format(new Date(stats.lastAssessmentDate), 'MMM dd, yyyy')}
            </Text>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by athlete name..."
            showClearButton={true}
            showSearchIcon={false}
            containerStyle={styles.searchBarContainer}
          />
        </View>

        {/* Filter Chips */}
        <View style={styles.filtersContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsContainer}
          >
            {/* Academic Year Dropdown */}
            <TouchableOpacity 
              style={styles.filterChip}
              onPress={() => setShowYearDropdown(!showYearDropdown)}
            >
              <Text style={styles.filterChipText}>
                {selectedYear === 'all' ? 'Academic Year' : yearOptions.find(y => y.value === selectedYear)?.label}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.white} />
            </TouchableOpacity>

            {/* Term Dropdown */}
            <TouchableOpacity 
              style={styles.filterChip}
              onPress={() => setShowTermDropdown(!showTermDropdown)}
            >
              <Text style={styles.filterChipText}>
                {selectedTerm === 'all' ? 'Term' : selectedTerm}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.white} />
            </TouchableOpacity>

            {/* Age Group Dropdown */}
            <TouchableOpacity 
              style={styles.filterChip}
              onPress={() => setShowAgeDropdown(!showAgeDropdown)}
            >
              <Text style={styles.filterChipText}>
                {selectedAgeGroup === 'all' ? 'Age Group' : `${selectedAgeGroup} years`}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </ScrollView>

          {/* Dropdown Menus */}
          {showYearDropdown && (
            <View style={styles.dropdownMenu}>
              {yearOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.dropdownItem, selectedYear === option.value && styles.dropdownItemActive]}
                  onPress={() => {
                    setSelectedYear(option.value);
                    setShowYearDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, selectedYear === option.value && styles.dropdownItemTextActive]}>
                    {option.label}
                  </Text>
                  {selectedYear === option.value && <Ionicons name="checkmark" size={20} color="#2196F3" />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {showTermDropdown && (
            <View style={styles.dropdownMenu}>
              {termOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.dropdownItem, selectedTerm === option.value && styles.dropdownItemActive]}
                  onPress={() => {
                    setSelectedTerm(option.value);
                    setShowTermDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, selectedTerm === option.value && styles.dropdownItemTextActive]}>
                    {option.label}
                  </Text>
                  {selectedTerm === option.value && <Ionicons name="checkmark" size={20} color="#2196F3" />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {showAgeDropdown && (
            <View style={styles.dropdownMenu}>
              {ageGroupOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.dropdownItem, selectedAgeGroup === option.value && styles.dropdownItemActive]}
                  onPress={() => {
                    setSelectedAgeGroup(option.value);
                    setShowAgeDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, selectedAgeGroup === option.value && styles.dropdownItemTextActive]}>
                    {option.label}
                  </Text>
                  {selectedAgeGroup === option.value && <Ionicons name="checkmark" size={20} color="#2196F3" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Assessments List */}
        <View style={styles.assessmentsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Assessment Records</Text>
            <Text style={styles.sectionCount}>{filteredAssessments.length}</Text>
          </View>

          {filteredAssessments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>No assessments found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery.trim() ? 'Try adjusting your search or filters' : 'No assessments for this sport yet'}
              </Text>
            </View>
          ) : (
            filteredAssessments.map(renderAssessmentCard)
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      {filteredAssessments.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, styles.fabHistory]}
          onPress={handleViewFullHistory}
          activeOpacity={0.8}
        >
          <Ionicons name="list-outline" size={24} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* No Data Modal */}
      <Modal visible={showNoDataModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="alert-circle" size={48} color="#FF9800" />
            </View>
            <Text style={styles.modalTitle}>No Data</Text>
            <Text style={styles.modalMessage}>No assessments available to share</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonFull]}
              onPress={() => setShowNoDataModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
            </View>
            <Text style={styles.modalTitle}>Success</Text>
            <Text style={styles.modalMessage}>Report exported successfully!</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonFull]}
              onPress={() => setShowSuccessModal(false)}
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
              <Ionicons name="close-circle" size={48} color={COLORS.error} />
            </View>
            <Text style={styles.modalTitle}>Export Failed</Text>
            <Text style={styles.modalMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonFull]}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Stats Cards
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
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
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight + '20',
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.primary,
    flex: 1,
  },

  // Search
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  searchBarContainer: {
    marginHorizontal: 0,
  },

  // Filters
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    position: 'relative',
    zIndex: 1000,
  },
  filterChipsContainer: {
    gap: 8,
    paddingRight: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    gap: 8,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 55,
    left: 20,
    right: 20,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    zIndex: 99999,
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemActive: {
    backgroundColor: '#E3F2FD',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  dropdownItemTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },

  // Assessments Section
  assessmentsSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sectionCount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
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
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kidName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  assessmentDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },

    // FAB
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabHistory: {
    bottom: 24,
    backgroundColor: '#FF9800',
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
    backgroundColor: COLORS.white,
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
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  modalButtonFull: {
    width: '100%',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});