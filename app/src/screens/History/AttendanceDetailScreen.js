// src/screens/History/AttendanceDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../../utils/constants';
import FilterBar from '../../components/common/FilterBar';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import {
  getSessionById,
  getFilteredSessionAttendance,
} from '../../database/db';

const AttendanceDetailScreen = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const [session, setSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState('all'); // New: for Total/Present/Absent filter
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({}); // New: for collapsible age groups
  const [filterCounts, setFilterCounts] = useState({
    all: 0,
    SC: 0,
    SP: 0,
    ELT: 0,
    WW: 0,
  });

  useEffect(() => {
    loadAttendanceDetails();
  }, [sessionId]);

  const loadAttendanceDetails = async () => {
    try {
      setLoading(true);
      const sessionData = await getSessionById(sessionId);
      // Use getFilteredSessionAttendance to get attendance WITH kid details
      const attendanceData = await getFilteredSessionAttendance(sessionId, 'all');
      
      console.log('📊 Loaded attendance data:', attendanceData);
      
      // Calculate filter counts
      const counts = {
        all: attendanceData.length,
        SC: attendanceData.filter(a => a.sponsorshipType === 'SC').length,
        SP: attendanceData.filter(a => a.sponsorshipType === 'SP').length,
        ELT: attendanceData.filter(a => a.programType === 'ELT').length,
        WW: attendanceData.filter(a => a.programType === 'WW').length,
      };
      setFilterCounts(counts);
      
      setSession(sessionData);
      setAttendance(attendanceData);
      setFilteredAttendance(attendanceData);
      
      // Auto-expand all groups initially
      const ageGroups = [...new Set(attendanceData.map(a => a.age_group))];
      const expanded = {};
      ageGroups.forEach(group => {
        expanded[group] = true;
      });
      setExpandedGroups(expanded);
    } catch (error) {
      console.error('Error loading attendance details:', error);
      Alert.alert('Error', 'Failed to load attendance details');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (filterType) => {
    setActiveFilter(filterType);
    
    try {
      const filtered = await getFilteredSessionAttendance(sessionId, filterType);
      setFilteredAttendance(applyStatusFilter(filtered, activeStatusFilter));
    } catch (error) {
      console.error('Error filtering attendance:', error);
    }
  };

  const handleStatusFilterChange = (statusFilter) => {
    setActiveStatusFilter(statusFilter);
    setFilteredAttendance(applyStatusFilter(attendance, statusFilter));
  };

  const applyStatusFilter = (data, statusFilter) => {
    if (statusFilter === 'all') {
      return data;
    } else if (statusFilter === 'present') {
      return data.filter(a => a.status === 'present');
    } else if (statusFilter === 'absent') {
      return data.filter(a => a.status === 'absent');
    }
    return data;
  };

  const toggleAgeGroup = (ageGroup) => {
    setExpandedGroups(prev => ({
      ...prev,
      [ageGroup]: !prev[ageGroup]
    }));
  };

  const groupByAgeGroup = (kids) => {
    const grouped = {};
    kids.forEach(kid => {
      const ageGroup = kid.age_group || 'Unknown';
      if (!grouped[ageGroup]) {
        grouped[ageGroup] = [];
      }
      grouped[ageGroup].push(kid);
    });
    return grouped;
  };

  const renderAgeGroupSection = (ageGroup, kids, status) => {
    const isExpanded = expandedGroups[ageGroup];
    const bgColor = status === 'present' ? '#E8F5E9' : '#FFEBEE';
    const borderColor = status === 'present' ? COLORS.present : COLORS.absent;

    return (
      <View key={`${status}-${ageGroup}`} style={styles.ageGroupSection}>
        <TouchableOpacity
          style={[styles.ageGroupHeader, { backgroundColor: bgColor }]}
          onPress={() => toggleAgeGroup(ageGroup)}
          activeOpacity={0.7}
        >
          <View style={styles.ageGroupHeaderLeft}>
            <Text style={styles.expandIcon}>
              {isExpanded ? '▼' : '▶'}
            </Text>
            <Text style={styles.ageGroupTitle}>{ageGroup} years</Text>
            <Text style={styles.ageGroupCount}>({kids.length})</Text>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.ageGroupContent}>
            {kids.map((kid, index) => (
              <View
                key={kid.kid_id || kid.id}
                style={[
                  styles.kidCard,
                  status === 'absent' && styles.kidCardAbsent
                ]}
              >
                <View style={styles.kidInfo}>
                  <Text style={[
                    styles.kidNumber,
                    status === 'absent' && { color: COLORS.textSecondary }
                  ]}>
                    {index + 1}.
                  </Text>
                  <View style={styles.kidDetails}>
                    <Text style={[
                      styles.kidName,
                      status === 'absent' && { color: COLORS.textSecondary }
                    ]}>
                      {kid.name}
                    </Text>
                    <Text style={styles.kidMeta}>
                      {kid.age_group} • {kid.sponsorshipType} • {kid.programType}
                    </Text>
                  </View>
                </View>
                <View style={styles.rightSection}>
                  {kid.marked_at && (
                    <Text style={styles.kidMarkedInfo}>
                      {kid.marked_by || 'Admin'} • {new Date(kid.marked_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </Text>
                  )}
                  <View style={status === 'present' ? styles.presentBadge : styles.absentBadge}>
                    <Text style={styles.badgeText}>{status === 'present' ? '✓' : '✗'}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Attendance Details"
          leftIcon="←"
          onLeftPress={() => navigation.goBack()}
          showAvatar={false}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const presentKids = filteredAttendance.filter(a => a.status === 'present');
  const absentKids = filteredAttendance.filter(a => a.status === 'absent');
  
  const presentByAgeGroup = groupByAgeGroup(presentKids);
  const absentByAgeGroup = groupByAgeGroup(absentKids);

  return (
    <View style={styles.container}>
      <Header
        title="Attendance Details"
        subtitle={session?.day_of_week}
        leftIcon="←"
        onLeftPress={() => navigation.goBack()}
        showAvatar={false}
      />
      
      <View style={styles.scrollViewContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Filter Bar */}
          <View style={styles.filterContainer}>
            <FilterBar
              filters={['all', 'SC', 'SP', 'ELT', 'WW']}
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
              counts={filterCounts}
            />
          </View>

          {/* Summary Stats */}
          <Card style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <TouchableOpacity
                style={[
                  styles.summaryItem,
                  activeStatusFilter === 'all' && styles.summaryItemActive
                ]}
                onPress={() => handleStatusFilterChange('all')}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.summaryNumber,
                  activeStatusFilter === 'all' && styles.summaryNumberActive
                ]}>
                  {filteredAttendance.length}
                </Text>
                <Text style={[
                  styles.summaryLabel,
                  activeStatusFilter === 'all' && styles.summaryLabelActive
                ]}>
                  Total
                </Text>
              </TouchableOpacity>
              <View style={styles.summaryDivider} />
              <TouchableOpacity
                style={[
                  styles.summaryItem,
                  activeStatusFilter === 'present' && styles.summaryItemActive
                ]}
                onPress={() => handleStatusFilterChange('present')}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.summaryNumber,
                  { color: COLORS.present },
                  activeStatusFilter === 'present' && styles.summaryNumberActive
                ]}>
                  {presentKids.length}
                </Text>
                <Text style={[
                  styles.summaryLabel,
                  activeStatusFilter === 'present' && styles.summaryLabelActive
                ]}>
                  Present
                </Text>
              </TouchableOpacity>
              <View style={styles.summaryDivider} />
              <TouchableOpacity
                style={[
                  styles.summaryItem,
                  activeStatusFilter === 'absent' && styles.summaryItemActive
                ]}
                onPress={() => handleStatusFilterChange('absent')}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.summaryNumber,
                  { color: COLORS.absent },
                  activeStatusFilter === 'absent' && styles.summaryNumberActive
                ]}>
                  {absentKids.length}
                </Text>
                <Text style={[
                  styles.summaryLabel,
                  activeStatusFilter === 'absent' && styles.summaryLabelActive
                ]}>
                  Absent
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Present Kids Section */}
          {presentKids.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.indicator, { backgroundColor: COLORS.present }]} />
                <Text style={styles.sectionTitle}>✓ Present ({presentKids.length})</Text>
              </View>
              
              <View style={styles.kidsList}>
                {Object.keys(presentByAgeGroup).sort().map(ageGroup => 
                  renderAgeGroupSection(ageGroup, presentByAgeGroup[ageGroup], 'present')
                )}
              </View>
            </View>
          )}

          {/* Absent Kids Section */}
          {absentKids.length > 0 && (
            <View style={[styles.section, { marginTop: 24 }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.indicator, { backgroundColor: COLORS.absent }]} />
                <Text style={styles.sectionTitle}>✗ Absent ({absentKids.length})</Text>
              </View>
              
              <View style={styles.kidsList}>
                {Object.keys(absentByAgeGroup).sort().map(ageGroup => 
                  renderAgeGroupSection(ageGroup, absentByAgeGroup[ageGroup], 'absent')
                )}
              </View>
            </View>
          )}

          {/* Empty State */}
          {presentKids.length === 0 && absentKids.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No attendance records for selected filter</Text>
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollViewContainer: {
    height: 0,
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  filterContainer: {
    marginBottom: 16,
  },
  summaryCard: {
    marginBottom: 24,
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  summaryItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  summaryNumberActive: {
    color: COLORS.primary,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  summaryLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 8,
  },
  indicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  kidsList: {
    gap: 10,
  },
  ageGroupSection: {
    marginBottom: 12,
  },
  ageGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  ageGroupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandIcon: {
    fontSize: 14,
    color: COLORS.text,
    marginRight: 10,
    width: 16,
  },
  ageGroupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: 6,
  },
  ageGroupCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  ageGroupContent: {
    gap: 8,
  },
  kidCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.present,
  },
  kidCardAbsent: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: COLORS.absent,
  },
  kidInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  kidNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: 12,
    width: 30,
  },
  kidDetails: {
    flex: 1,
  },
  kidName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  kidMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8,
  },
  kidMarkedInfo: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  presentBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.present,
    alignItems: 'center',
    justifyContent: 'center',
  },
  absentBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.absent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 20,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default AttendanceDetailScreen;