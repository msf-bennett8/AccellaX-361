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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import SearchBar from '../../components/common/SearchBar';
import FilterChip from '../../components/common/FilterChip';
import { COLORS } from '../../utils/constants';
import { getKidsBySport } from '../../services/kidService';
import { getAssessmentProgress } from '../../database/queries';

const SPORTS_CONFIG = {
  football: { name: 'Football', icon: 'football', color: '#4CAF50' },
  athletics: { name: 'Athletics', icon: 'walk', color: '#2196F3' },
  rugby: { name: 'Rugby', icon: 'american-football', color: '#FF9800' },
  swimming: { name: 'Swimming', icon: 'water', color: '#00BCD4' },
  tennis: { name: 'Tennis', icon: 'tennisball', color: '#9C27B0' },
  basketball: { name: 'Basketball', icon: 'basketball', color: '#FF5722' },
};

const AGE_GROUPS = [
  { value: '4-6', label: '4-6 yrs' },
  { value: '7-9', label: '7-9 yrs' },
  { value: '10-13', label: '10-13 yrs' },
  { value: '13+', label: '13+ yrs' },
];

const SelectKidsScreen = ({ route, navigation }) => {
  const { sport, assessmentMode, selectedTests = [], kidCount } = route.params || {};
  
  const [kids, setKids] = useState([]);
  const [filteredKids, setFilteredKids] = useState([]);
  const [selectedKids, setSelectedKids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [selectedSportFilter, setSelectedSportFilter] = useState(null);
  const [selectedAgeFilter, setSelectedAgeFilter] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

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

  // Filter kids based on search and filter selections
  useEffect(() => {
    let result = [...kids];

    // Apply search filter
    if (searchQuery) {
      result = result.filter(kid =>
        kid.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sport filter
    if (filterBy === 'sport' && selectedSportFilter) {
      result = result.filter(kid =>
        kid.sports_enrolled && kid.sports_enrolled.includes(selectedSportFilter)
      );
    }

    // Apply age group filter
    if (filterBy === 'age_group' && selectedAgeFilter) {
      result = result.filter(kid => {
        if (selectedAgeFilter === '4-6') return kid.age >= 4 && kid.age <= 6;
        if (selectedAgeFilter === '7-9') return kid.age >= 7 && kid.age <= 9;
        if (selectedAgeFilter === '10-13') return kid.age >= 10 && kid.age <= 13;
        if (selectedAgeFilter === '13+') return kid.age >= 13;
        return true;
      });
    }

    setFilteredKids(result);
  }, [searchQuery, filterBy, selectedSportFilter, selectedAgeFilter, kids]);

  const toggleKidSelection = (kidId) => {
    setSelectedKids(prev => 
      prev.includes(kidId) 
        ? prev.filter(id => id !== kidId)
        : [...prev, kidId]
    );
  };

  const selectAll = () => {
    setSelectedKids(selectedKids.length === filteredKids.length ? [] : filteredKids.map(k => k.id));
  };

  const handleContinue = () => {
    if (selectedKids.length === 0) {
      Alert.alert('No Kids Selected', 'Please select at least one kid to assess');
      return;
    }

    const selectedKidsData = filteredKids.filter(k => selectedKids.includes(k.id));

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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search kids by name..."
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

      {/* Filter Dropdown with Chips */}
      <View style={styles.filterMainContainer}>
        {showFilters && (
          <>
            <View style={styles.filterTopRow}>
            {/* Dropdown Button */}
            <TouchableOpacity 
              style={styles.filterDropdown}
              onPress={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <Text style={styles.filterDropdownText}>
                {filterBy === 'all' ? 'All' : filterBy === 'sport' ? 'Sport' : 'Age Group'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.text} />
            </TouchableOpacity>

            {/* Horizontal Filter Chips */}
            {filterBy === 'sport' && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.horizontalFilterChips}
                style={styles.horizontalFilterScroll}
              >
                {Object.keys(SPORTS_CONFIG).map(sportId => (
                  <FilterChip
                    key={sportId}
                    label={SPORTS_CONFIG[sportId].name}
                    selected={selectedSportFilter === sportId}
                    onPress={() => setSelectedSportFilter(selectedSportFilter === sportId ? null : sportId)}
                    backgroundColor="#4CAF50"
                  />
                ))}
              </ScrollView>
            )}

            {filterBy === 'age_group' && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.horizontalFilterChips}
                style={styles.horizontalFilterScroll}
              >
                {AGE_GROUPS.map(group => (
                  <FilterChip
                    key={group.value}
                    label={group.label}
                    selected={selectedAgeFilter === group.value}
                    onPress={() => setSelectedAgeFilter(selectedAgeFilter === group.value ? null : group.value)}
                    backgroundColor="#4CAF50"
                  />
                ))}
              </ScrollView>
            )}

            {/* Select All on same line when "All" is selected */}
            {filterBy === 'all' && (
              <View style={styles.selectAllInline}>
                <TouchableOpacity onPress={selectAll} style={styles.selectAllButton}>
                  <Text style={styles.selectAllText}>
                    {selectedKids.length === filteredKids.length ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.selectedCount}>{selectedKids.length} of {filteredKids.length} selected</Text>
              </View>
            )}
          </View>

            {/* Select All on new line when Sport/Age Group is selected */}
            {(filterBy === 'sport' || filterBy === 'age_group') && (
              <View style={styles.selectAllRow}>
                <TouchableOpacity onPress={selectAll} style={styles.selectAllButton}>
                  <Text style={styles.selectAllText}>
                    {selectedKids.length === filteredKids.length ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.selectedCount}>{selectedKids.length} of {filteredKids.length} selected</Text>
              </View>
            )}
          </>
        )}

        {/* Show Select All when filters are hidden (on scroll) */}
        {!showFilters && (
          <View style={styles.selectAllRow}>
            <TouchableOpacity onPress={selectAll} style={styles.selectAllButton}>
              <Text style={styles.selectAllText}>
                {selectedKids.length === filteredKids.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.selectedCount}>{selectedKids.length} of {filteredKids.length} selected</Text>
          </View>
        )}

        {/* Dropdown Menu */}
        {showFilterDropdown && (
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={[styles.dropdownItem, filterBy === 'all' && styles.dropdownItemActive]}
              onPress={() => {
                setFilterBy('all');
                setSelectedSportFilter(null);
                setSelectedAgeFilter(null);
                setShowFilterDropdown(false);
              }}
            >
              <Text style={[styles.dropdownItemText, filterBy === 'all' && styles.dropdownItemTextActive]}>
                All
              </Text>
              {filterBy === 'all' && <Ionicons name="checkmark" size={20} color="#4CAF50" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dropdownItem, filterBy === 'sport' && styles.dropdownItemActive]}
              onPress={() => {
                setFilterBy('sport');
                setSelectedAgeFilter(null);
                setShowFilterDropdown(false);
              }}
            >
              <Text style={[styles.dropdownItemText, filterBy === 'sport' && styles.dropdownItemTextActive]}>
                Sport
              </Text>
              {filterBy === 'sport' && <Ionicons name="checkmark" size={20} color="#4CAF50" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dropdownItem, filterBy === 'age_group' && styles.dropdownItemActive]}
              onPress={() => {
                setFilterBy('age_group');
                setSelectedSportFilter(null);
                setShowFilterDropdown(false);
              }}
            >
              <Text style={[styles.dropdownItemText, filterBy === 'age_group' && styles.dropdownItemTextActive]}>
                Age Group
              </Text>
              {filterBy === 'age_group' && <Ionicons name="checkmark" size={20} color="#4CAF50" />}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={[styles.content, { 
        top: showFilters ? (filterBy === 'sport' || filterBy === 'age_group' ? 280 : 230) : 180
      }]}>
        <FlatList
          data={filteredKids}
          renderItem={renderKidItem}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          onScroll={(e) => {
            const currentScrollY = e.nativeEvent.contentOffset.y;
            if (currentScrollY > scrollY && currentScrollY > 50) {
              // Scrolling down
              setShowFilters(false);
            } else if (currentScrollY < scrollY) {
              // Scrolling up
              setShowFilters(true);
            }
            setScrollY(currentScrollY);
          }}
          scrollEventThrottle={16}
          ListEmptyComponent={
            <View style={styles.emptyFilterState}>
              <Ionicons name="search-outline" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyFilterText}>No kids found</Text>
              <Text style={styles.emptyFilterSubtext}>
                {searchQuery || filterBy !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'No kids available for this sport'
                }
              </Text>
            </View>
          }
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
    backgroundColor: '#4CAF50',
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
  filterMainContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 1000,
  },
  filterTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    gap: 8,
  },
  filterDropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  horizontalFilterScroll: {
    flex: 1,
  },
  horizontalFilterChips: {
    gap: 8,
    paddingRight: 16,
  },
  selectAllInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    justifyContent: 'flex-end',
  },
  selectAllRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    zIndex: 9999,
    minWidth: 150,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemActive: {
    backgroundColor: '#F1F8F4',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  dropdownItemTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  content: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 80,
  },
  emptyFilterState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyFilterText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptyFilterSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 16, marginBottom: 8, textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: '#666', textAlign: 'center' },
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