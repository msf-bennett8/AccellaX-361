// Location: /apps/assessment/src/screens/History/HistoryScreen.js
// Hybrid assessment history with list/calendar views and advanced filters

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SearchBar from '../../components/common/SearchBar';
import { COLORS } from '../../utils/constants';
import { getRecentAssessments } from '../../database/queries';
import { getKidByIdFromFirebase } from '../../services/kidService';
import { getKidById, getSportById, getAllSports } from '../../database/db';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export default function HistoryScreen() {
  const navigation = useNavigation();

  // State
  const [assessments, setAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  
  // Scroll behavior
  const [showControls, setShowControls] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  
  // Filter dropdowns
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showTermDropdown, setShowTermDropdown] = useState(false);
  const [showSportDropdown, setShowSportDropdown] = useState(false);
  const [showAgeDropdown, setShowAgeDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterChips, setShowFilterChips] = useState(false);
  
  // Filters
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [selectedSort, setSelectedSort] = useState('none');
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

  // Filter options
  const [yearOptions, setYearOptions] = useState([
    { value: 'all', label: 'All Years' },
  ]);

  const termOptions = [
    { value: 'all', label: 'All Terms' },
    { value: 'Q1', label: 'Q1' },
    { value: 'Q2', label: 'Q2' },
    { value: 'Q3', label: 'Q3' },
    { value: 'Q4', label: 'Q4' },
  ];

  const [sportOptions, setSportOptions] = useState([
    { value: 'all', label: 'All Sports' },
  ]);

  const ageGroupOptions = [
    { value: 'all', label: 'All Age Groups' },
    { value: '4-6', label: '4-6 years' },
    { value: '7-9', label: '7-9 years' },
    { value: '10-13', label: '10-13 years' },
    { value: '13+', label: '13+ years' },
  ];

  const sortOptions = [
    { value: 'none', label: 'No Sort' },
    { value: 'recent', label: 'Most Recent' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'a_z', label: 'A-Z' },
    { value: 'z_a', label: 'Z-A' },
  ];

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
  }, [assessments, filters, searchQuery, selectedYear, selectedTerm, selectedSport, selectedAgeGroup, selectedSort]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      
      console.log('📋 Loading assessment history...');
      
      // Use queries.js which properly handles the assessmentWebDB storage
      const allAssessments = await getRecentAssessments(100); // Get last 100 assessments
      
      console.log('📊 Loaded assessments from queries:', allAssessments.length);
      
      // Enrich with kid and sport details
      // queries.js already provides kid_name and sport_name from the JOIN
      const enrichedAssessments = await Promise.all(
        allAssessments.map(async (assessment) => {
          // Try to get full kid object for additional details
          let kid = null;
          try {
            kid = await getKidByIdFromFirebase(assessment.kid_id);
          } catch (error) {
            console.warn('⚠️ Could not fetch kid details:', error);
          }
          
          // Get sport details
          const sport = await getSportById(assessment.sport_id);
          
          return {
            ...assessment, // ✅ This preserves year, term, etc.
            kidName: assessment.kid_name || kid?.name || 'Unknown',
            sportName: assessment.sport_name || sport?.name || 'Unknown',
            sportColor: sport?.color || COLORS.primary,
            kidDetails: kid,
            sportDetails: sport,
            // ✅ Ensure metadata fields are accessible
            year: assessment.year || null,
            term: assessment.term || null,
            age_group: kid?.age_group || null,
          };
        })
      );
      
      console.log('✅ Enriched assessments:', enrichedAssessments.length);
      console.log('🔍 Sample assessment with metadata:', enrichedAssessments[0]); 
      setAssessments(enrichedAssessments);
      calculateStats(enrichedAssessments);

      // Generate year options dynamically from actual assessment data
      const assessmentYears = new Set();
      enrichedAssessments.forEach(a => {
        // Use the saved year field if available, otherwise derive from assessment_date
        if (a.year && a.year !== 'null' && a.year !== null) {
          assessmentYears.add(a.year);
        } else {
          // Fallback: generate from assessment_date
          const assessmentYear = new Date(a.assessment_date).getFullYear();
          assessmentYears.add(`${assessmentYear}/${assessmentYear + 1}`);
        }
      });
      
      // Sort years in descending order (most recent first)
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

      setLoading(false);

      // Load sports for filter
      const allSports = await getAllSports();
      const sportsFilterOptions = [
        { value: 'all', label: 'All Sports' },
        ...allSports.map(s => ({ value: s.id, label: s.name }))
      ];
      setSportOptions(sportsFilterOptions);

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

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(a =>
        a.kidName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.sportName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 🔍 DEBUG: Check year values
console.log('🔍 Year filter debug:', {
  selectedYear,
  totalAssessments: filtered.length,
  sampleAssessments: filtered.slice(0, 3).map(a => ({
    id: a.id,
    kidName: a.kidName,
    date: a.assessment_date,
    year: a.year,
    term: a.term,
    assessmentType: a.assessment_type,
    weekNumber: a.week_number,
  }))
});

    // Year filter - Use saved year field (prioritize metadata over date calculation)
    if (selectedYear !== 'all') {
      filtered = filtered.filter(a => {
        // Use the saved year field if available
        if (a.year && a.year !== 'null' && a.year !== null) {
          return a.year === selectedYear;
        }
        
        // Fallback: Use calendar year matching if no year field exists
        const assessmentYear = new Date(a.assessment_date).getFullYear();
        const [startYear] = selectedYear.split('/');
        return assessmentYear.toString() === startYear;
      });
    }
    


    // Term filter
    if (selectedTerm !== 'all') {
      filtered = filtered.filter(a => a.term === selectedTerm);
    }

    // Sport filter
    if (selectedSport !== 'all') {
      filtered = filtered.filter(a => a.sport_id === selectedSport);
    }

    // Age group filter
    if (selectedAgeGroup !== 'all') {
      filtered = filtered.filter(a => {
        const kidAgeGroup = a.kidDetails?.age_group || a.age_group;
        return kidAgeGroup === selectedAgeGroup;
      });
    }

    // Sort
    if (selectedSort !== 'none') {
      switch (selectedSort) {
        case 'recent':
          filtered.sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date));
          break;
        case 'oldest':
          filtered.sort((a, b) => new Date(a.assessment_date) - new Date(b.assessment_date));
          break;
        case 'a_z':
          filtered.sort((a, b) => a.kidName.localeCompare(b.kidName));
          break;
        case 'z_a':
          filtered.sort((a, b) => b.kidName.localeCompare(a.kidName));
          break;
      }
    }

    // Sport filter (old modal)
    if (filters.sport) {
      filtered = filtered.filter(a => a.sport_id === filters.sport);
    }

    // Kid filter (old modal)
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
        <LoadingSpinner 
          overlay 
          text="Loading history..." 
          color="#1565C0"
        />
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

      <View style={styles.contentWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            const currentScrollY = e.nativeEvent.contentOffset.y;
            const scrollDifference = currentScrollY - scrollY;
            
            setScrollY(currentScrollY);
            
            if (Math.abs(scrollDifference) > 30) {
              if (scrollDifference > 0 && currentScrollY > 50) {
                // Scrolling down - hide controls
                setShowControls(false);
              } else if (scrollDifference < 0) {
                // Scrolling up - show controls
                setShowControls(true);
              }
            }
          }}
          scrollEventThrottle={16}
        >
        {/* Stats Cards - Horizontal Scroll */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScrollContainer}
          style={styles.statsContainer}
        >
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
        </ScrollView>

        {/* Search Bar */}
        {showControls && (
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by kid or sport..."
            showClearButton={true}
            showSearchIcon={false}
            containerStyle={styles.searchBarContainer}
          />
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => console.log('Search triggered:', searchQuery)}
            activeOpacity={0.7}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
        )}

        {/* Controls Row: Grid/List + View Full Report + Filters */}
        {showControls && (
          <View style={styles.controlsContainer}>
            {/* Grid/List Toggle */}
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
                  name="grid" 
                  size={20} 
                  color={viewMode === 'calendar' ? COLORS.white : COLORS.textSecondary} 
                />
              </TouchableOpacity>
            </View>

            {/* View Full Report Button */}
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => navigation.navigate('Reports', { screen: 'ReportsMain' })}
            >
              <Ionicons name="stats-chart-outline" size={18} color="#2196F3" />
              <Text style={styles.reportButtonText}>View Full Report</Text>
            </TouchableOpacity>

            {/* Filters Button */}
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilterChips(!showFilterChips)}
            >
              <Ionicons name="filter" size={20} color="#2196F3" />
            </TouchableOpacity>
          </View>
        )}

        {/* Filter Chips - Horizontal Scroll */}
        {showControls && showFilterChips && (
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

              {/* Sport Dropdown */}
              <TouchableOpacity 
                style={styles.filterChip}
                onPress={() => setShowSportDropdown(!showSportDropdown)}
              >
                <Text style={styles.filterChipText}>
                  {selectedSport === 'all' ? 'Sport' : sportOptions.find(s => s.value === selectedSport)?.label}
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

              {/* Sort Dropdown */}
              <TouchableOpacity 
                style={styles.filterChip}
                onPress={() => setShowSortDropdown(!showSortDropdown)}
              >
                <Text style={styles.filterChipText}>
                  {selectedSort === 'none' ? 'Sort By' : sortOptions.find(s => s.value === selectedSort)?.label}
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

            {showSportDropdown && (
              <View style={styles.dropdownMenu}>
                {sportOptions.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.dropdownItem, selectedSport === option.value && styles.dropdownItemActive]}
                    onPress={() => {
                      setSelectedSport(option.value);
                      setShowSportDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, selectedSport === option.value && styles.dropdownItemTextActive]}>
                      {option.label}
                    </Text>
                    {selectedSport === option.value && <Ionicons name="checkmark" size={20} color="#2196F3" />}
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

            {showSortDropdown && (
              <View style={styles.dropdownMenu}>
                {sortOptions.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.dropdownItem, selectedSort === option.value && styles.dropdownItemActive]}
                    onPress={() => {
                      setSelectedSort(option.value);
                      setShowSortDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, selectedSort === option.value && styles.dropdownItemTextActive]}>
                      {option.label}
                    </Text>
                    {selectedSort === option.value && <Ionicons name="checkmark" size={20} color="#2196F3" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

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
      </View>

      {/* Floating Action Button - Export */}
      {filteredAssessments.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('Reports', { screen: 'ReportsMain' })}
          activeOpacity={0.8}
        >
          <Ionicons name="share-outline" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}

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
  contentWrapper: {
    position: 'absolute',
    top: 116,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.textSecondary },
  
  statsContainer: { paddingHorizontal: 12, paddingVertical: 16 },
  statsScrollContainer: { gap: 12, paddingHorizontal: 8 },
  statCard: { 
    width: 120,
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
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    gap: 8,
  },
  searchBarContainer: {
    flex: 1,
    marginHorizontal: 0,
  },
  searchButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  searchButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  controlsContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
    paddingHorizontal: 20, 
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    gap: 8,
  },
  viewToggle: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.backgroundDark, 
    borderRadius: 8, 
    padding: 4 
  },
  viewButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  activeViewButton: { backgroundColor: '#2196F3' },
  reportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  reportButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2196F3',
  },
  
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
  filtersContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    left: 16,
    right: 16,
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
    minWidth: 200,
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
});
