// Location: /apps/assessment/src/screens/SelectKids/SelectKidsScreen.js
// FIXED: Navigate to SelectTests in kid-by-kid mode

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
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

// Team configuration with icons and colors
const TEAMS = [
  { id: 'fire', name: 'Fire Team', icon: 'flame', color: '#FF5722' },
  { id: 'ice', name: 'Ice Team', icon: 'snow', color: '#2196F3' },
  { id: 'water', name: 'Water Team', icon: 'water', color: '#00BCD4' },
  { id: 'wind', name: 'Wind Team', icon: 'fitness', color: '#9E9E9E' },
  { id: 'earth', name: 'Earth Team', icon: 'leaf', color: '#8BC34A' },
];

const SelectKidsScreen = ({ route, navigation }) => {
  const { sport, assessmentMode, selectedTests = [], kidCount, assessmentMetadata } = route.params || {};
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
  const [collapsedTeams, setCollapsedTeams] = useState({});
  const [groupByTeam, setGroupByTeam] = useState(true);
  const [showInvalidSportModal, setShowInvalidSportModal] = useState(false);
  const [showLoadErrorModal, setShowLoadErrorModal] = useState(false);
  const [showNoKidsModal, setShowNoKidsModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
        setShowInvalidSportModal(true);
        setKids([]);
        setLoading(false);
        return;
      }
      
      const kidsData = await getKidsBySport(sport.id);
      
      const validKidsData = Array.isArray(kidsData) ? kidsData : [];
      
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
      setErrorMessage(error.message);
      setShowLoadErrorModal(true);
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

    // Apply age group filter (works with team grouping)
    if (selectedAgeFilter) {
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

  // Group kids by team
  const getKidsByTeam = () => {
    const grouped = {};
    
    TEAMS.forEach(team => {
      grouped[team.id] = filteredKids.filter(kid => kid.house_team === team.id);
    });
    
    // Kids without team assignment
    grouped['no_team'] = filteredKids.filter(kid => !kid.house_team);
    
    return grouped;
  };

  // Toggle team collapse
  const toggleTeamCollapse = (teamId) => {
    setCollapsedTeams(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }));
  };

  // Select/deselect all kids in a team
  const toggleTeamSelection = (teamId) => {
    const teamKids = getKidsByTeam()[teamId] || [];
    const teamKidIds = teamKids.map(k => k.id);
    const allSelected = teamKidIds.every(id => selectedKids.includes(id));
    
    if (allSelected) {
      // Deselect all team members
      setSelectedKids(prev => prev.filter(id => !teamKidIds.includes(id)));
    } else {
      // Select all team members
      setSelectedKids(prev => {
        const newSelected = [...prev];
        teamKidIds.forEach(id => {
          if (!newSelected.includes(id)) {
            newSelected.push(id);
          }
        });
        return newSelected;
      });
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
    setSelectedKids(selectedKids.length === filteredKids.length ? [] : filteredKids.map(k => k.id));
  };

  const handleContinue = () => {
    if (selectedKids.length === 0) {
      setShowNoKidsModal(true);
      return;
    }

    const selectedKidsData = filteredKids.filter(k => selectedKids.includes(k.id));

    // CRITICAL FIX: Different navigation based on mode
    if (isKidByKidMode) {
      // Kid-by-Kid: Navigate to SelectTests to choose tests
      console.log('➡️ Navigating to SelectTests (kid-by-kid mode)');
      navigation.navigate('SelectTests', {
        sport,
        assessmentMode,
        selectedKids: selectedKidsData,
        kidCount: selectedKidsData.length,
        assessmentMetadata: assessmentMetadata, // Pass metadata forward
      });
    } else {
      // Test-by-Test: Tests already selected, go directly to AssessmentEntry
      navigation.navigate('AssessmentEntry', {
        sport,
        kids: selectedKidsData,
        mode: assessmentMode,
        selectedTests,
        assessmentMetadata: assessmentMetadata, // Pass metadata forward
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

  // Render team section with header
  const renderTeamSection = (team) => {
    const teamKids = getKidsByTeam()[team.id] || [];
    
    if (teamKids.length === 0) return null;
    
    const isCollapsed = collapsedTeams[team.id];
    const teamKidIds = teamKids.map(k => k.id);
    const selectedCount = teamKidIds.filter(id => selectedKids.includes(id)).length;
    const allSelected = teamKidIds.length > 0 && teamKidIds.every(id => selectedKids.includes(id));
    
    return (
      <View key={team.id} style={styles.teamSection}>
        {/* Team Header */}
        <TouchableOpacity
          style={[styles.teamHeader, allSelected && styles.teamHeaderSelected]}
          onPress={() => toggleTeamSelection(team.id)}
          activeOpacity={0.7}
        >
          <View style={styles.teamHeaderLeft}>
            <TouchableOpacity
              onPress={() => toggleTeamCollapse(team.id)}
              style={styles.collapseButton}
            >
              <Ionicons 
                name={isCollapsed ? 'chevron-forward' : 'chevron-down'} 
                size={20} 
                color={COLORS.text} 
              />
            </TouchableOpacity>
            
            <View style={[styles.teamIconContainer, { backgroundColor: team.color + '20' }]}>
              <Ionicons name={team.icon} size={20} color={team.color} />
            </View>
            
            <View style={styles.teamInfo}>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.teamCount}>
                {selectedCount}/{teamKids.length} selected
              </Text>
            </View>
          </View>
          
          <View style={[styles.teamCheckbox, allSelected && styles.teamCheckboxSelected]}>
            {allSelected && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
          </View>
        </TouchableOpacity>
        
        {/* Team Kids */}
        {!isCollapsed && (
          <View style={styles.teamKids}>
            {teamKids.map(kid => (
              <View key={kid.id}>
                {renderKidItem({ item: kid })}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Render kids without teams
  const renderNoTeamSection = () => {
    const noTeamKids = getKidsByTeam()['no_team'] || [];
    
    if (noTeamKids.length === 0) return null;
    
    return (
      <View style={styles.teamSection}>
        <View style={styles.teamHeader}>
          <View style={styles.teamHeaderLeft}>
            <View style={[styles.teamIconContainer, { backgroundColor: '#9E9E9E20' }]}>
              <Ionicons name="people-outline" size={20} color="#9E9E9E" />
            </View>
            <View style={styles.teamInfo}>
              <Text style={styles.teamName}>No Team Assigned</Text>
              <Text style={styles.teamCount}>{noTeamKids.length} kids</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.teamKids}>
          {noTeamKids.map(kid => (
            <View key={kid.id}>
              {renderKidItem({ item: kid })}
            </View>
          ))}
        </View>
      </View>
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
        <LoadingSpinner 
          overlay 
          text="Loading kids..." 
          color="#1565C0"
        />
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
                  <TouchableOpacity
                    key={sportId}
                    style={[
                      styles.sportFilterChip,
                      selectedSportFilter === sportId && styles.sportFilterChipActive
                    ]}
                    onPress={() => setSelectedSportFilter(selectedSportFilter === sportId ? null : sportId)}
                  >
                    <Text style={[
                      styles.sportFilterText,
                      selectedSportFilter === sportId && styles.sportFilterTextActive
                    ]}>
                      {SPORTS_CONFIG[sportId].name}
                    </Text>
                  </TouchableOpacity>
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
                  <TouchableOpacity
                    key={group.value}
                    style={[
                      styles.ageFilterChip,
                      selectedAgeFilter === group.value && styles.ageFilterChipActive
                    ]}
                    onPress={() => setSelectedAgeFilter(selectedAgeFilter === group.value ? null : group.value)}
                  >
                    <Text style={[
                      styles.ageFilterText,
                      selectedAgeFilter === group.value && styles.ageFilterTextActive
                    ]}>
                      {group.label}
                    </Text>
                  </TouchableOpacity>
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
        <ScrollView
          contentContainerStyle={styles.listContainer}
          onScroll={(e) => {
            const currentScrollY = e.nativeEvent.contentOffset.y;
            if (currentScrollY > scrollY && currentScrollY > 50) {
              setShowFilters(false);
            } else if (currentScrollY < scrollY) {
              setShowFilters(true);
            }
            setScrollY(currentScrollY);
          }}
          scrollEventThrottle={16}
        >
          {filteredKids.length === 0 ? (
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
          ) : groupByTeam ? (
            <>
              {TEAMS.map(team => renderTeamSection(team))}
              {renderNoTeamSection()}
            </>
          ) : (
            filteredKids.map(kid => (
              <View key={kid.id}>
                {renderKidItem({ item: kid })}
              </View>
            ))
          )}
        </ScrollView>
      </View>
      
      {/* Invalid Sport Modal */}
      <Modal visible={showInvalidSportModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="alert-circle" size={48} color={COLORS.error} />
            </View>
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalMessage}>Invalid sport selection</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonFull]}
              onPress={() => {
                setShowInvalidSportModal(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Load Error Modal */}
      <Modal visible={showLoadErrorModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="alert-circle" size={48} color={COLORS.error} />
            </View>
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalMessage}>Failed to load kids: {errorMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonFull]}
              onPress={() => setShowLoadErrorModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* No Kids Selected Modal */}
      <Modal visible={showNoKidsModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="alert-circle" size={48} color={COLORS.warning} />
            </View>
            <Text style={styles.modalTitle}>No Kids Selected</Text>
            <Text style={styles.modalMessage}>Please select at least one kid to assess</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonFull]}
              onPress={() => setShowNoKidsModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  
  // Team Section Styles
  teamSection: { marginBottom: 16 },
  teamHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  teamHeaderSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8F4',
  },
  teamHeaderLeft: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flex: 1,
  },
  collapseButton: {
    padding: 4,
    marginRight: 8,
  },
  teamIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamInfo: { flex: 1 },
  teamName: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#333',
    marginBottom: 2,
  },
  teamCount: { 
    fontSize: 12, 
    color: '#666',
  },
  teamCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamCheckboxSelected: {
    backgroundColor: '#4CAF50',
  },
  teamKids: { 
    paddingLeft: 12,
  },
  
  // Age Group Filter Chip Styles
  ageFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 8,
  },
  ageFilterChipActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  ageFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  ageFilterTextActive: {
    color: '#FFF',
  },
  
  // Sport Filter Chip Styles
  sportFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 8,
  },
  sportFilterChipActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  sportFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  sportFilterTextActive: {
    color: '#FFF',
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
    flex: 1,
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

export default SelectKidsScreen;