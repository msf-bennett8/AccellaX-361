import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, AGE_GROUPS, SCREEN_NAMES, FILTER_TYPES } from '../../utils/constants';
import FilterBar from '../../components/common/FilterBar';
import Header from '../../components/common/Header';
import FAB from '../../components/common/FAB';
import KidListItem from '../../components/kids/KidListItem';

import { groupBy, filterBySearch } from '../../utils/helpers';
import { getCurrentUserId } from '../../utils/auth';
import { getAllKids, updateKidStatus, deleteKid } from '../../database/db';

const MyKidsScreen = ({ navigation }) => {
  const [kids, setKids] = useState([]);
  const [filteredKids, setFilteredKids] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedKid, setSelectedKid] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({
    '4-6': true,
    '7-9': true,
    '10-13': true,
    '13+': true,
  });
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active', 'suspended'
  const [sponsorProgramFilter, setSponsorProgramFilter] = useState('all'); // 'all', 'SC', 'SP', 'ELT', 'WW', 'HP', 'TS', 'Trial', 'Other'
  const [filterCounts, setFilterCounts] = useState({
    all: 0,
    SC: 0,
    SP: 0,
    ELT: 0,
    WW: 0,
    HP: 0,
    TS: 0,
    Trial: 0,
    Other: 0,
  });

  // Load kids when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadKids();
    }, [])
  );

  const loadKids = async () => {
    try {
      setIsLoading(true);
      
      const userId = await getCurrentUserId();
      if (!userId) {
        console.warn('⚠️ No user ID found');
        setKids([]);
        setFilteredKids([]);
        setIsLoading(false);
        return;
      }
      
      console.log(`📊 Loading kids from academy collection...`);
      
      // Load kids from Firebase academy collection (single source of truth)
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('../../config/firebase');
      
      const academyId = (await AsyncStorage.default.getItem('academyId')) || 'academy_accellax361_main';
      const kidsRef = collection(db, `academies/${academyId}/kids`);
      const snapshot = await getDocs(kidsRef);
      
      const academyKids = [];
      snapshot.forEach(doc => {
        const kid = doc.data();
        academyKids.push({
          id: parseInt(kid.id) || kid.id, // Convert to number if needed
          user_id: userId, // Add user_id for compatibility
          name: kid.name,
          age: kid.age,
          gender: kid.gender,
          area_of_residence: kid.area_of_residence,
          age_group: kid.age_group,
          sponsorshipType: kid.sponsorshipType,
          programType: kid.programType,
          status: kid.status || 'active',
          created_at: kid.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
      });
      
      console.log(`📊 Loaded ${academyKids.length} kids from academy`);
      
      // Calculate filter counts (show counts for all statuses)
      const counts = {
        all: academyKids.length,
        active: academyKids.filter(k => k.status === 'active' || !k.status).length,
        suspended: academyKids.filter(k => k.status === 'suspended').length,
        inactive: academyKids.filter(k => k.status === 'inactive').length,
        discontinued: academyKids.filter(k => k.status === 'discontinued').length,
        trial: academyKids.filter(k => k.status === 'trial').length,
        SC: academyKids.filter(k => k.sponsorshipType === 'SC').length,
        SP: academyKids.filter(k => k.sponsorshipType === 'SP').length,
        ELT: academyKids.filter(k => k.programType === 'ELT').length,
        WW: academyKids.filter(k => k.programType === 'WW').length,
        HP: academyKids.filter(k => k.programType === 'HP').length,
        TS: academyKids.filter(k => k.programType === 'TS').length,
        Trial: academyKids.filter(k => k.programType === 'Trial').length,
        Other: academyKids.filter(k => k.programType === 'Other').length,
      };
      setFilterCounts(counts);
      
      setKids(academyKids);
      applyFilters(academyKids, activeFilter, sponsorProgramFilter);
      
    } catch (error) {
      console.error('❌ Error loading kids:', error);
      Alert.alert('Error', 'Failed to load kids. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = (kidsData, statusFilter, sponsorFilter) => {
    let filtered = kidsData;
    
    // Apply status filter (all/active/suspended/inactive/discontinued/trial)
    if (statusFilter === 'active') {
      filtered = filtered.filter(k => k.status === 'active' || !k.status);
    } else if (statusFilter === 'suspended') {
      filtered = filtered.filter(k => k.status === 'suspended');
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(k => k.status === 'inactive');
    } else if (statusFilter === 'discontinued') {
      filtered = filtered.filter(k => k.status === 'discontinued');
    } else if (statusFilter === 'trial') {
      filtered = filtered.filter(k => k.status === 'trial');
    }
    // 'all' shows all kids regardless of status
    
    // Apply sponsor/program filter
    if (sponsorFilter !== 'all') {
      if (sponsorFilter === 'SC' || sponsorFilter === 'SP') {
        // Sponsorship filter
        filtered = filtered.filter(k => k.sponsorshipType === sponsorFilter);
      } else if (['ELT', 'WW', 'HP', 'TS', 'Trial', 'Other'].includes(sponsorFilter)) {
        // Program type filter
        filtered = filtered.filter(k => k.programType === sponsorFilter);
      }
    }
    
    setFilteredKids(filtered);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    applyFilters(kids, filter, sponsorProgramFilter);
  };

  const handleSponsorProgramFilterChange = (filter) => {
    setSponsorProgramFilter(filter);
    applyFilters(kids, activeFilter, filter);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadKids();
    setRefreshing(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    // Apply all filters
    let baseKids = kids;
    
    // Status filter
    if (activeFilter === 'active') {
      baseKids = baseKids.filter(k => k.status === 'active');
    } else if (activeFilter === 'suspended') {
      baseKids = baseKids.filter(k => k.status === 'suspended');
    }
    
    // Sponsor/program filter
    if (sponsorProgramFilter !== 'all') {
      if (sponsorProgramFilter === 'SC' || sponsorProgramFilter === 'SP') {
        baseKids = baseKids.filter(k => k.sponsorshipType === sponsorProgramFilter);
      } else if (['ELT', 'WW', 'HP', 'TS', 'Trial', 'Other'].includes(sponsorProgramFilter)) {
        baseKids = baseKids.filter(k => k.programType === sponsorProgramFilter);
      }
    }
    
    // Search filter
    if (query.trim() === '') {
      setFilteredKids(baseKids);
    } else {
      const filtered = filterBySearch(baseKids, query, ['name', 'area_of_residence']);
      setFilteredKids(filtered);
    }
  };

  const handleLongPress = (kid) => {
    setSelectedKid(kid);
    setModalVisible(true);
  };

  const handleEdit = () => {
    setModalVisible(false);
    navigation.navigate(SCREEN_NAMES.ADD_EDIT_KID, { kid: selectedKid });
  };

  // handleToggleStatus removed - now using inline status handlers in modal

  const handleDelete = () => {
    setModalVisible(false);
    Alert.alert(
      'Delete Kid',
      `Are you sure you want to permanently delete ${selectedKid.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteKid(selectedKid.id);
              Alert.alert('Success', `${selectedKid.name} has been deleted.`);
              loadKids();
            } catch (error) {
              console.error('Error deleting kid:', error);
              Alert.alert('Error', 'Failed to delete kid. Please try again.');
            }
          },
        },
      ]
    );
  };

  const toggleGroupExpanded = (ageGroup) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [ageGroup]: !prev[ageGroup],
    }));
  };

  const renderAgeGroupSection = (ageGroup) => {
    const groupKids = filteredKids.filter((kid) => kid.age_group === ageGroup);
    
    if (groupKids.length === 0) return null;

    const isExpanded = expandedGroups[ageGroup];

    return (
      <View key={ageGroup} style={styles.groupSection}>
        <TouchableOpacity
          style={styles.groupHeader}
          onPress={() => toggleGroupExpanded(ageGroup)}
          activeOpacity={0.7}
        >
          <Text style={styles.groupTitle}>
            {ageGroup} years ({groupKids.length} kids)
          </Text>
          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        {isExpanded && (
          <View>
            {groupKids.map((kid) => (
              <KidListItem
                key={kid.id}
                kid={kid}
                onLongPress={() => handleLongPress(kid)}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>👦👧</Text>
      <Text style={styles.emptyTitle}>No Kids Added Yet</Text>
      <Text style={styles.emptySubtitle}>
        Add your first kid to start tracking attendance
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate(SCREEN_NAMES.ADD_EDIT_KID)}
      >
        <Text style={styles.emptyButtonText}>+ Add Your First Kid</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading kids...</Text>
        </View>
      );
    }

    if (kids.length === 0) {
      console.log('📭 Showing empty state');
      return renderEmptyState();
    }

    if (filteredKids.length === 0) {
      console.log('🔍 Showing no results state');
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No Results Found</Text>
          <Text style={styles.emptySubtitle}>
            No kids match "{searchQuery}"
          </Text>
        </View>
      );
    }

    return AGE_GROUPS.map((ageGroup) => renderAgeGroupSection(ageGroup));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <Header
          title="My Kids"
          leftIcon="☰"
          onLeftPress={() => navigation.openDrawer()}
          rightIcon="+"
          onRightPress={() => navigation.navigate(SCREEN_NAMES.ADD_EDIT_KID)}
        />
      </View>

      <View style={styles.scrollViewContainer}>
        <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={true}
      >
        {/* Search Bar */}
        {kids.length > 0 && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or area..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => handleSearch('')}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ADD THIS NEW SECTION */}
        {/* FilterBar */}
        {kids.length > 0 && (
          <FilterBar
            filters={['all', 'SC', 'SP', 'ELT', 'WW', 'HP', 'TS', 'Trial', 'Other']}
            activeFilter={sponsorProgramFilter}
            onFilterChange={handleSponsorProgramFilterChange}
            counts={filterCounts}
          />
        )}

        {/* Stats Summary */}
        {kids.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.statsScrollView}
            contentContainerStyle={styles.statsContainer}
          >
            <TouchableOpacity
              style={[
                styles.statCard,
                activeFilter === 'all' && styles.statCardActive
              ]}
              onPress={() => handleFilterChange('all')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.statValue,
                activeFilter === 'all' && styles.statValueActive
              ]}>
                {kids.length}
              </Text>
              <Text style={[
                styles.statLabel,
                activeFilter === 'all' && styles.statLabelActive
              ]}>
                Total Kids
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statCard,
                activeFilter === 'active' && styles.statCardActive
              ]}
              onPress={() => handleFilterChange('active')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.statValue,
                activeFilter === 'active' && styles.statValueActive
              ]}>
                {kids.filter((k) => k.status === 'active').length}
              </Text>
              <Text style={[
                styles.statLabel,
                activeFilter === 'active' && styles.statLabelActive
              ]}>
                Active
              </Text>
            </TouchableOpacity>

             <TouchableOpacity
              style={[
                styles.statCard,
                activeFilter === 'suspended' && styles.statCardActive
              ]}
              onPress={() => handleFilterChange('suspended')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.statValue,
                activeFilter === 'suspended' && styles.statValueActive
              ]}>
                {kids.filter((k) => k.status === 'suspended').length}
              </Text>
              <Text style={[
                styles.statLabel,
                activeFilter === 'suspended' && styles.statLabelActive
              ]}>
                Suspended
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statCard,
                activeFilter === 'inactive' && styles.statCardActive
              ]}
              onPress={() => handleFilterChange('inactive')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.statValue,
                activeFilter === 'inactive' && styles.statValueActive
              ]}>
                {kids.filter((k) => k.status === 'inactive').length}
              </Text>
              <Text style={[
                styles.statLabel,
                activeFilter === 'inactive' && styles.statLabelActive
              ]}>
                Inactive
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statCard,
                activeFilter === 'discontinued' && styles.statCardActive
              ]}
              onPress={() => handleFilterChange('discontinued')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.statValue,
                activeFilter === 'discontinued' && styles.statValueActive
              ]}>
                {kids.filter((k) => k.status === 'discontinued').length}
              </Text>
              <Text style={[
                styles.statLabel,
                activeFilter === 'discontinued' && styles.statLabelActive
              ]}>
                Discontinued
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statCard,
                activeFilter === 'trial' && styles.statCardActive
              ]}
              onPress={() => handleFilterChange('trial')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.statValue,
                activeFilter === 'trial' && styles.statValueActive
              ]}>
                {kids.filter((k) => k.status === 'trial').length}
              </Text>
              <Text style={[
                styles.statLabel,
                activeFilter === 'trial' && styles.statLabelActive
              ]}>
                Trial
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Content */}
        <View style={styles.listContent}>
          {renderContent()}
        </View>

        </ScrollView>
      </View>

      {/* FAB */}
      {kids.length > 0 && (
        <FAB
          icon="+"
          onPress={() => navigation.navigate(SCREEN_NAMES.ADD_EDIT_KID)}
        />
      )}

      {/* Action Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedKid?.name}
            </Text>

            <TouchableOpacity style={styles.modalOption} onPress={handleEdit}>
              <Text style={styles.modalOptionIcon}>✏️</Text>
              <Text style={styles.modalOptionText}>Edit</Text>
            </TouchableOpacity>

            {/* Dynamic Status Options based on current status */}
            {selectedKid?.status === 'active' && (
              <>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={async () => {
                    try {
                      await updateKidStatus(selectedKid.id, 'suspended');
                      setModalVisible(false);
                      Alert.alert('Success', `${selectedKid.name} has been suspended.`);
                      loadKids();
                    } catch (error) {
                      console.error('Error updating kid status:', error);
                      Alert.alert('Error', 'Failed to update status. Please try again.');
                    }
                  }}
                >
                  <Text style={styles.modalOptionIcon}>⏸</Text>
                  <Text style={styles.modalOptionText}>Suspend</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={async () => {
                    try {
                      await updateKidStatus(selectedKid.id, 'inactive');
                      setModalVisible(false);
                      Alert.alert('Success', `${selectedKid.name} has been marked as inactive.`);
                      loadKids();
                    } catch (error) {
                      console.error('Error updating kid status:', error);
                      Alert.alert('Error', 'Failed to update status. Please try again.');
                    }
                  }}
                >
                  <Text style={styles.modalOptionIcon}>💤</Text>
                  <Text style={styles.modalOptionText}>Mark as Inactive</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={async () => {
                    Alert.alert(
                      'Mark as Discontinued',
                      `Mark ${selectedKid.name} as discontinued? This is for kids who permanently left.`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Mark Discontinued',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              await updateKidStatus(selectedKid.id, 'discontinued');
                              setModalVisible(false);
                              Alert.alert('Success', `${selectedKid.name} has been marked as discontinued.`);
                              loadKids();
                            } catch (error) {
                              console.error('Error updating kid status:', error);
                              Alert.alert('Error', 'Failed to update status. Please try again.');
                            }
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Text style={styles.modalOptionIcon}>🚫</Text>
                  <Text style={[styles.modalOptionText, { color: COLORS.error }]}>
                    Mark as Discontinued
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {selectedKid?.status === 'suspended' && (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={async () => {
                  try {
                    await updateKidStatus(selectedKid.id, 'active');
                    setModalVisible(false);
                    Alert.alert('Success', `${selectedKid.name} has been activated.`);
                    loadKids();
                  } catch (error) {
                    console.error('Error updating kid status:', error);
                    Alert.alert('Error', 'Failed to update status. Please try again.');
                  }
                }}
              >
                <Text style={styles.modalOptionIcon}>✓</Text>
                <Text style={styles.modalOptionText}>Activate</Text>
              </TouchableOpacity>
            )}

            {selectedKid?.status === 'inactive' && (
              <>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={async () => {
                    try {
                      await updateKidStatus(selectedKid.id, 'active');
                      setModalVisible(false);
                      Alert.alert('Success', `${selectedKid.name} has been activated.`);
                      loadKids();
                    } catch (error) {
                      console.error('Error updating kid status:', error);
                      Alert.alert('Error', 'Failed to update status. Please try again.');
                    }
                  }}
                >
                  <Text style={styles.modalOptionIcon}>✓</Text>
                  <Text style={styles.modalOptionText}>Activate</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={async () => {
                    Alert.alert(
                      'Mark as Discontinued',
                      `Mark ${selectedKid.name} as discontinued? This is for kids who permanently left.`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Mark Discontinued',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              await updateKidStatus(selectedKid.id, 'discontinued');
                              setModalVisible(false);
                              Alert.alert('Success', `${selectedKid.name} has been marked as discontinued.`);
                              loadKids();
                            } catch (error) {
                              console.error('Error updating kid status:', error);
                              Alert.alert('Error', 'Failed to update status. Please try again.');
                            }
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Text style={styles.modalOptionIcon}>🚫</Text>
                  <Text style={[styles.modalOptionText, { color: COLORS.error }]}>
                    Mark as Discontinued
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {selectedKid?.status === 'discontinued' && (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={async () => {
                  try {
                    await updateKidStatus(selectedKid.id, 'active');
                    setModalVisible(false);
                    Alert.alert('Success', `${selectedKid.name} has been activated.`);
                    loadKids();
                  } catch (error) {
                    console.error('Error updating kid status:', error);
                    Alert.alert('Error', 'Failed to update status. Please try again.');
                  }
                }}
              >
                <Text style={styles.modalOptionIcon}>✓</Text>
                <Text style={styles.modalOptionText}>Activate</Text>
              </TouchableOpacity>
            )}

            {selectedKid?.status === 'trial' && (
              <>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={async () => {
                    try {
                      await updateKidStatus(selectedKid.id, 'active');
                      setModalVisible(false);
                      Alert.alert('Success', `${selectedKid.name} has been activated (trial ended).`);
                      loadKids();
                    } catch (error) {
                      console.error('Error updating kid status:', error);
                      Alert.alert('Error', 'Failed to update status. Please try again.');
                    }
                  }}
                >
                  <Text style={styles.modalOptionIcon}>✓</Text>
                  <Text style={styles.modalOptionText}>Activate (End Trial)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={async () => {
                    Alert.alert(
                      'Mark as Discontinued',
                      `Mark ${selectedKid.name} as discontinued? Trial did not convert.`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Mark Discontinued',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              await updateKidStatus(selectedKid.id, 'discontinued');
                              setModalVisible(false);
                              Alert.alert('Success', `${selectedKid.name} has been marked as discontinued.`);
                              loadKids();
                            } catch (error) {
                              console.error('Error updating kid status:', error);
                              Alert.alert('Error', 'Failed to update status. Please try again.');
                            }
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Text style={styles.modalOptionIcon}>🚫</Text>
                  <Text style={[styles.modalOptionText, { color: COLORS.error }]}>
                    Mark as Discontinued
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerWrapper: {
    // Header stays fixed at top
  },
  scrollViewContainer: {
    height: 0, // Forces flex to calculate actual height
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  statsScrollView: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16, // Extra padding at the end
  },
  statCard: {
    minWidth: 100, // Fixed width for horizontal scroll
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
  },
  statCardActive: {
    backgroundColor: '#E3F2FD',
    borderColor: COLORS.primary,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statValueActive: {
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  statLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  groupSection: {
    marginBottom: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  expandIcon: {
    fontSize: 14,
    color: COLORS.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 400,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: COLORS.background,
  },
  modalOptionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  modalOptionText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  modalOptionDanger: {
    backgroundColor: COLORS.error + '20',
  },
  modalOptionTextDanger: {
    color: COLORS.error,
  },
  modalCancel: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});

export default MyKidsScreen;