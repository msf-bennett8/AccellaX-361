// Location: /apps/assessment/src/screens/Kids/KidsListScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getKidsWithSports, getKidsWithoutSports } from '../../services/kidService';
import Header from '../../components/common/Header';
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

  // Load kids from database
  const loadKids = async () => {
    try {
      setLoading(true);
      const allKids = await getKidsWithSports();
      
      console.log('📊 Loaded kids:', allKids.length);
      setKids(allKids);
      setFilteredKids(allKids);
    } catch (error) {
      console.error('❌ Error loading kids:', error);
      Alert.alert('Error', 'Failed to load kids. Please try again.');
    } finally {
      setLoading(false);
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

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadKids();
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

  // Render header with stats
  const renderHeader = () => {
    const kidsWithoutSports = kids.filter(k => !k.sports_enrolled || k.sports_enrolled.length === 0).length;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{kids.length}</Text>
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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading kids...</Text>
      </View>
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
});

export default KidsListScreen;