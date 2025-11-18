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
  const [sponsorProgramFilter, setSponsorProgramFilter] = useState('all'); // 'all', 'SC', 'SP', 'ELT', 'WW'
  const [filterCounts, setFilterCounts] = useState({
    all: 0,
    SC: 0,
    SP: 0,
    ELT: 0,
    WW: 0,
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
      
      // Calculate filter counts
      const counts = {
        all: academyKids.length,
        SC: academyKids.filter(k => k.sponsorshipType === 'SC').length,
        SP: academyKids.filter(k => k.sponsorshipType === 'SP').length,
        ELT: academyKids.filter(k => k.programType === 'ELT').length,
        WW: academyKids.filter(k => k.programType === 'WW').length,
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
    
    // Apply status filter (all/active/suspended)
    if (statusFilter === 'active') {
      filtered = filtered.filter(k => k.status === 'active');
    } else if (statusFilter === 'suspended') {
      filtered = filtered.filter(k => k.status === 'suspended');
    }
    
    // Apply sponsor/program filter
    if (sponsorFilter !== 'all') {
      if (sponsorFilter === 'SC' || sponsorFilter === 'SP') {
        filtered = filtered.filter(k => k.sponsorshipType === sponsorFilter);
      } else if (sponsorFilter === 'ELT' || sponsorFilter === 'WW') {
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
      } else if (sponsorProgramFilter === 'ELT' || sponsorProgramFilter === 'WW') {
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

  const handleToggleStatus = async () => {
    try {
      const newStatus = selectedKid.status === 'active' ? 'suspended' : 'active';
      await updateKidStatus(selectedKid.id, newStatus);
      setModalVisible(false);
      Alert.alert(
        'Success',
        `${selectedKid.name} has been ${newStatus === 'suspended' ? 'suspended' : 'activated'}.`
      );
      loadKids();
    } catch (error) {
      console.error('Error updating kid status:', error);
      Alert.alert('Error', 'Failed to update status. Please try again.');
    }
  };

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
            filters={['all', 'SC', 'SP', 'ELT', 'WW']}
            activeFilter={sponsorProgramFilter}
            onFilterChange={handleSponsorProgramFilterChange}
            counts={filterCounts}
          />
        )}

        {/* Stats Summary */}
        {kids.length > 0 && (
          <View style={styles.statsContainer}>
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
          </View>
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

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleToggleStatus}
            >
              <Text style={styles.modalOptionIcon}>
                {selectedKid?.status === 'suspended' ? '✓' : '⏸'}
              </Text>
              <Text style={styles.modalOptionText}>
                {selectedKid?.status === 'suspended' ? 'Activate' : 'Suspend'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, styles.modalOptionDanger]}
              onPress={handleDelete}
            >
              <Text style={styles.modalOptionIcon}>🗑️</Text>
              <Text style={[styles.modalOptionText, styles.modalOptionTextDanger]}>
                Delete
              </Text>
            </TouchableOpacity>

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
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
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