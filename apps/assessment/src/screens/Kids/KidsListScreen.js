// Location: /apps/assessment/src/screens/Kids/KidsListScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getKidsWithSports, getKidsWithoutSports } from '../../services/kidService';
import { getKidsPaginated } from '../../database/queries';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SearchBar from '../../components/common/SearchBar';
import FilterBar from '../../components/common/FilterBar';
import Badge from '../../components/common/Badge';
import FAB from '../../components/common/FAB';
import EmptyState from '../../components/common/EmptyState';
import testFirebaseConnection from '../../utils/diagnostics';

const SPORTS_CONFIG = {
  football: { name: 'Football', icon: '⚽', color: '#4CAF50' },
  athletics: { name: 'Athletics', icon: '🏃', color: '#2196F3' },
  rugby: { name: 'Rugby', icon: '🏉', color: '#FF9800' },
  swimming: { name: 'Swimming', icon: '🏊', color: '#00BCD4' },
  tennis: { name: 'Tennis', icon: '🎾', color: '#9C27B0' },
  basketball: { name: 'Basketball', icon: '🏀', color: '#FF5722' },
};

const KidsListScreen = () => {
  const navigation = useNavigation();
  const [kids, setKids] = useState([]);
  const [filteredKids, setFilteredKids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // PHASE 5: Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cachedPages, setCachedPages] = useState({}); // PHASE 5.2: Cache loaded pages
  const PAGE_SIZE = 20;
  // PHASE 5: Load kids with pagination
  const loadKids = async (page = 1, useCache = true) => {
    try {
      // Check cache first (PHASE 5.2)
      if (useCache && cachedPages[page]) {
        console.log(`✅ Using cached page ${page}`);
        if (page === 1) {
          setKids(cachedPages[page]);
          setFilteredKids(cachedPages[page]);
        } else {
          setKids(prev => [...prev, ...cachedPages[page]]);
          setFilteredKids(prev => [...prev, ...cachedPages[page]]);
        }
        return;
      }
      
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      console.log(`📋 Loading kids page ${page}...`);
      
      // PHASE 5: Use paginated query
      const result = await getKidsPaginated(page, PAGE_SIZE);
      
      console.log(`📊 Loaded page ${page}:`, result.kids.length, 'kids');
      
      // Enrich with sports data
      const enrichedKids = await Promise.all(
        result.kids.map(async (kid) => {
          // Parse sports_enrolled if it's a string
          let sportsEnrolled = kid.sports_enrolled;
          if (typeof sportsEnrolled === 'string') {
            try {
              sportsEnrolled = JSON.parse(sportsEnrolled);
              if (typeof sportsEnrolled === 'string') {
                sportsEnrolled = JSON.parse(sportsEnrolled);
              }
            } catch (e) {
              console.warn('Failed to parse sports_enrolled:', e);
              sportsEnrolled = null;
            }
          }
          
          return {
            ...kid,
            sports_enrolled: sportsEnrolled || null,
          };
        })
      );
      
      // Cache this page (PHASE 5.2)
      setCachedPages(prev => ({
        ...prev,
        [page]: enrichedKids
      }));
      
      // Append or replace based on page
      if (page === 1) {
        setKids(enrichedKids);
        setFilteredKids(enrichedKids);
      } else {
        setKids(prev => [...prev, ...enrichedKids]);
        setFilteredKids(prev => [...prev, ...enrichedKids]);
      }
      
      // Update pagination state
      setCurrentPage(page);
      setTotalCount(result.total);
      setTotalPages(Math.ceil(result.total / PAGE_SIZE));
      
      setLoading(false);
      setLoadingMore(false);
      
    } catch (error) {
      console.error('❌ Error loading kids:', error);
      setErrorMessage('Failed to load kids. Please try again.');
      setShowErrorModal(true);
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // PHASE 5: Load more kids
  const loadMoreKids = () => {
    if (!loadingMore && currentPage < totalPages) {
      loadKids(currentPage + 1);
    }
  };

  // Diagnostic on mount
  useEffect(() => {
    console.log('🚀 KidsListScreen mounted');
    testFirebaseConnection();
  }, []);

  // Reload kids when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadKids();
    }, [])
  );

  // PHASE 5: Handle refresh (clear cache and reload page 1)
  const onRefresh = async () => {
    setRefreshing(true);
    setCachedPages({}); // Clear cache
    setCurrentPage(1);
    await loadKids(1, false); // Don't use cache
    setRefreshing(false);
  };

  // Filter kids based on search and filter type
  useEffect(() => {
    let result = [...kids];

    // Apply search filter
    if (searchQuery) {
      result = result.filter(kid =>
        kid.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sport filter
    if (filterType !== 'all') {
      result = result.filter(kid => {
        if (filterType === 'no_sports') {
          return !kid.sports_enrolled || kid.sports_enrolled.length === 0;
        }
        return kid.sports_enrolled && kid.sports_enrolled.includes(filterType);
      });
    }

    setFilteredKids(result);
  }, [searchQuery, filterType, kids]);

  // Get filter options (all sports + "no sports" option)
  const getFilterOptions = () => {
    const options = [
      { value: 'all', label: 'All Kids' },
      { value: 'no_sports', label: 'No Sports Assigned' },
    ];

    Object.keys(SPORTS_CONFIG).forEach(sportId => {
      options.push({
        value: sportId,
        label: SPORTS_CONFIG[sportId].name,
        icon: SPORTS_CONFIG[sportId].icon,
      });
    });

    return options;
  };

  // Navigate to add/edit screen
  const handleKidPress = (kid) => {
    navigation.navigate('AddEditKid', { kid });
  };

  const handleAddKid = () => {
    navigation.navigate('AddEditKid', { kid: null });
  };

  // Render individual kid card
  const renderKidCard = ({ item: kid }) => {
    const hasSports = kid.sports_enrolled && kid.sports_enrolled.length > 0;

    return (
      <TouchableOpacity
        style={styles.kidCard}
        onPress={() => handleKidPress(kid)}
        activeOpacity={0.7}
      >
        <View style={styles.kidHeader}>
          <View style={styles.kidInfo}>
            <Text style={styles.kidName}>{kid.name}</Text>
            <Text style={styles.kidDetails}>
              {kid.age} years • {kid.age_group} • {kid.gender || 'N/A'}
            </Text>
          </View>

          {!hasSports && (
            <Badge
              text="No Sports"
              backgroundColor="#FF9800"
              textColor="#FFFFFF"
            />
          )}
        </View>

        {hasSports && (
          <View style={styles.sportsContainer}>
            <Text style={styles.sportsLabel}>Sports:</Text>
            <View style={styles.sportsBadges}>
              {(kid.sports_enrolled || []).map(sportId => {
                const sport = SPORTS_CONFIG[sportId];
                if (!sport) return null;

                const isPrimary = kid.primary_sport === sportId;

                return (
                  <View key={sportId} style={styles.sportBadgeWrapper}>
                    <Badge
                      text={`${sport.icon} ${sport.name}`}
                      backgroundColor={sport.color}
                      textColor="#FFFFFF"
                    />
                    {isPrimary && (
                      <Text style={styles.primaryLabel}>Primary</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.kidFooter}>
          <Text style={styles.kidMetadata}>
            {kid.sponsorshipType === 'SC' ? '🎓 Scholarship' : '💰 Self-Sponsored'}
          </Text>
          <Text style={styles.kidMetadata}>
            {kid.programType === 'ELT' ? '⭐ Elite' : kid.programType === 'WW' ? '🏃 Weekend' : kid.programType}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // PHASE 5: Render header with stats and pagination info
  const renderHeader = () => {
    const kidsWithoutSports = kids.filter(k => !k.sports_enrolled || k.sports_enrolled.length === 0).length;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalCount}</Text>
          <Text style={styles.statLabel}>Total Kids</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{kids.length - kidsWithoutSports}</Text>
          <Text style={styles.statLabel}>Assigned Sports</Text>
        </View>
        <View style={[styles.statCard, kidsWithoutSports > 0 && styles.statCardWarning]}>
          <Text style={[styles.statValue, kidsWithoutSports > 0 && styles.statValueWarning]}>
            {kidsWithoutSports}
          </Text>
          <Text style={styles.statLabel}>Need Assignment</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <LoadingSpinner 
        overlay 
        text="Loading kids..." 
        color="#1565C0"
      />
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Kids Management"
        leftIcon="☰"
        onLeftPress={() => navigation.openDrawer()}
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
          onPress={() => {
            console.log('Search triggered:', searchQuery);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Bar */}
      <FilterBar
        options={getFilterOptions()}
        selectedValue={filterType}
        onSelect={setFilterType}
      />

      {/* Kids List */}
      <FlatList
        data={filteredKids}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderKidCard}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={() => (
          currentPage < totalPages && !loading ? (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={loadMoreKids}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <Text style={styles.loadMoreText}>Loading...</Text>
              ) : (
                <>
                  <Text style={styles.loadMoreText}>
                    Load More ({kids.length} of {totalCount})
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#2196F3" />
                </>
              )}
            </TouchableOpacity>
          ) : null
        )}
        ListEmptyComponent={
          <EmptyState
            icon="👶"
            title="No Kids Found"
            message={
              searchQuery || filterType !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add your first kid to get started'
            }
            actionLabel={searchQuery || filterType !== 'all' ? 'Clear Filters' : 'Add Kid'}
            onAction={() => {
              if (searchQuery || filterType !== 'all') {
                setSearchQuery('');
                setFilterType('all');
              } else {
                handleAddKid();
              }
            }}
          />
        }
        contentContainerStyle={filteredKids.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
          />
        }
      />

      {/* Error Modal */}
      <Modal visible={showErrorModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="alert-circle" size={48} color="#F44336" />
            </View>
            <Text style={styles.modalTitle}>Error</Text>
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

      {/* Floating Action Button */}
      <FAB
        icon="+"
        onPress={handleAddKid}
        backgroundColor="#2196F3"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statCardWarning: {
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  statValueWarning: {
    color: '#FF9800',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
  },
  kidCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  kidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  kidInfo: {
    flex: 1,
  },
  kidName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  kidDetails: {
    fontSize: 14,
    color: '#757575',
  },
  sportsContainer: {
    marginBottom: 12,
  },
  sportsLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 8,
    fontWeight: '600',
  },
  sportsBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportBadgeWrapper: {
    alignItems: 'center',
  },
  primaryLabel: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 2,
  },
  kidFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  kidMetadata: {
    fontSize: 12,
    color: '#757575',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
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
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  searchButtonText: {
    color: '#FFFFFF',
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
  modalContent: {
    backgroundColor: '#FFFFFF',
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
    color: '#212121',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#2196F3',
  },
  modalButtonFull: {
    width: '100%',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2196F3',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
});

export default KidsListScreen;
