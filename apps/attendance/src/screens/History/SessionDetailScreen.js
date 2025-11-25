// src/screens/History/SessionDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Clipboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, AGE_GROUPS, FILTER_LABELS } from '../../utils/constants';
import FilterBar from '../../components/common/FilterBar';
import { formatDate, formatDateLong } from '../../utils/dateUtils';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import {
  getSessionById,
  getSessionAttendance,
  getKidsByAgeGroup,
  getFilteredSessionAttendance,
} from '../../database/db';
import { exportSessionAttendance } from '../../utils/exportUtils';

const SessionDetailScreen = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const [session, setSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [academyName, setAcademyName] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [filterCounts, setFilterCounts] = useState({
    all: 0,
    SC: 0,
    SP: 0,
    ELT: 0,
    WW: 0,
  });
  
  useEffect(() => {
    loadSessionDetails();
    loadAcademyName();
  }, [sessionId]);

  const loadAcademyName = async () => {
    const name = await AsyncStorage.getItem('academyName');
    setAcademyName(name || 'Academy');
  };

  const loadSessionDetails = async () => {
    try {
      setLoading(true);
      const sessionData = await getSessionById(sessionId);
      const attendanceData = await getSessionAttendance(sessionId);
      
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
      
      // Auto-expand all groups
      const expanded = {};
      AGE_GROUPS.forEach(group => {
        expanded[group] = true;
      });
      setExpandedGroups(expanded);
    } catch (error) {
      console.error('Error loading session details:', error);
      Alert.alert('Error', 'Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (filterType) => {
    setActiveFilter(filterType);
    
    try {
      const filtered = await getFilteredSessionAttendance(sessionId, filterType);
      setFilteredAttendance(filtered);
    } catch (error) {
      console.error('Error filtering attendance:', error);
    }
  };

  const toggleGroup = (ageGroup) => {
    setExpandedGroups(prev => ({
      ...prev,
      [ageGroup]: !prev[ageGroup]
    }));
  };

  const getAttendanceByAgeGroup = (ageGroup) => {
    return filteredAttendance.filter(a => a.age_group === ageGroup);
  };

  const getPresentCount = (ageGroup) => {
    return getAttendanceByAgeGroup(ageGroup).filter(a => a.status === 'present').length;
  };

  const getTotalCount = (ageGroup) => {
    return getAttendanceByAgeGroup(ageGroup).length;
  };

  const getAttendanceRate = (present, total) => {
    return total > 0 ? Math.round((present / total) * 100) : 0;
  };

  const exportAsText = async () => {
    if (!session) return;

    const presentCount = attendance.filter(a => a.status === 'present').length;
    const absentCount = attendance.filter(a => a.status === 'absent').length;
    const totalCount = attendance.length;
    const rate = getAttendanceRate(presentCount, totalCount);

    let text = `AccellaX 361° - Session Report\n`;
    text += `${'='.repeat(40)}\n\n`;
    text += `Academy: ${academyName}\n`;
    text += `Date: ${formatDateLong(new Date(session.session_date))}\n`;
    text += `Day: ${session.day_of_week}\n`;
    text += `Time: ${session.session_time}\n\n`;
    
    text += `ATTENDANCE SUMMARY\n`;
    text += `${'-'.repeat(40)}\n`;
    text += `Total Kids: ${totalCount}\n`;
    text += `Present: ${presentCount}\n`;
    text += `Absent: ${absentCount}\n`;
    text += `Attendance Rate: ${rate}%\n\n`;

    text += `BREAKDOWN BY AGE GROUP\n`;
    text += `${'-'.repeat(40)}\n`;
    
    AGE_GROUPS.forEach(group => {
      const groupAttendance = getAttendanceByAgeGroup(group);
      if (groupAttendance.length === 0) return;
      
      const present = getPresentCount(group);
      const total = getTotalCount(group);
      
      text += `\n${group} years (${present}/${total})\n`;
      
      // Present kids
      const presentKids = groupAttendance.filter(a => a.status === 'present');
      if (presentKids.length > 0) {
        text += `  ✓ Present:\n`;
        presentKids.forEach(kid => {
          text += `    • ${kid.name}\n`;
        });
      }
      
      // Absent kids
      const absentKids = groupAttendance.filter(a => a.status === 'absent');
      if (absentKids.length > 0) {
        text += `  ✗ Absent:\n`;
        absentKids.forEach(kid => {
          text += `    • ${kid.name}\n`;
        });
      }
    });

    if (session.general_notes) {
      text += `\n\nSESSION NOTES\n`;
      text += `${'-'.repeat(40)}\n`;
      text += `${session.general_notes}\n`;
    }

    text += `\n\n${'='.repeat(40)}\n`;
    text += `Generated by AccellaX 361°\n`;

    return text;
  };

  const handleExport = async () => {
    const attendanceToExport = activeFilter === 'all' ? attendance : filteredAttendance;
    
    Alert.alert(
      'Export Options',
      `Export ${FILTER_LABELS[activeFilter]} attendance report`,
      [
        {
          text: 'Copy to Clipboard',
          onPress: async () => {
            const result = await exportSessionAttendance(
              { session, academyName },
              attendanceToExport,
              activeFilter
            );
            
            if (result.success) {
              Alert.alert('Success', 'Report copied to clipboard!');
            } else {
              Alert.alert('Error', 'Failed to copy report');
            }
          }
        },
        {
          text: 'Share',
          onPress: async () => {
            const result = await exportSessionAttendance(
              { session, academyName },
              attendanceToExport,
              activeFilter
            );
            
            if (!result.success) {
              Alert.alert('Error', 'Failed to share report');
            }
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const renderSessionInfo = () => {
    if (!session) return null;

    return (
      <Card style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <View style={styles.dateBox}>
            <Text style={styles.dateDay}>
              {new Date(session.session_date).getDate()}
            </Text>
            <Text style={styles.dateMonth}>
              {new Date(session.session_date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{session.day_of_week} Training</Text>
            <Text style={styles.infoSubtitle}>{session.session_time}</Text>
            <Text style={styles.infoDate}>
              {formatDateLong(new Date(session.session_date))}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderSummary = () => {
    const presentCount = filteredAttendance.filter(a => a.status === 'present').length;
    const absentCount = filteredAttendance.filter(a => a.status === 'absent').length;
    const totalCount = filteredAttendance.length;
    const rate = getAttendanceRate(presentCount, totalCount);

    return (
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Attendance Summary</Text>
        
        <View style={styles.summaryStats}>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: COLORS.text }]}>{totalCount}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: COLORS.present }]}>{presentCount}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: COLORS.absent }]}>{absentCount}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
        </View>

        <View style={styles.rateContainer}>
          <View style={[
            styles.rateCircle,
            { backgroundColor: rate >= 75 ? COLORS.present : COLORS.warning }
          ]}>
            <Text style={styles.rateText}>{rate}%</Text>
          </View>
          <Text style={styles.rateLabel}>Attendance Rate</Text>
        </View>
      </Card>
    );
  };

  const renderAgeGroupSection = (ageGroup) => {
    const groupAttendance = getAttendanceByAgeGroup(ageGroup);
    if (groupAttendance.length === 0) return null;

    const presentCount = getPresentCount(ageGroup);
    const totalCount = getTotalCount(ageGroup);
    const isExpanded = expandedGroups[ageGroup];
    const presentKids = groupAttendance.filter(a => a.status === 'present');
    const absentKids = groupAttendance.filter(a => a.status === 'absent');

    return (
      <Card key={ageGroup} style={styles.ageGroupCard}>
        <TouchableOpacity
          onPress={() => toggleGroup(ageGroup)}
          activeOpacity={0.7}
        >
          <View style={styles.ageGroupHeader}>
            <View style={styles.ageGroupTitleContainer}>
              <Text style={styles.ageGroupTitle}>{ageGroup} years</Text>
              <Text style={styles.ageGroupCount}>
                {presentCount}/{totalCount} present
              </Text>
            </View>
            
            <View style={styles.ageGroupRight}>
              <View style={[
                styles.ageGroupBadge,
                { backgroundColor: getAttendanceRate(presentCount, totalCount) >= 75 ? COLORS.present : COLORS.warning }
              ]}>
                <Text style={styles.ageGroupRate}>
                  {getAttendanceRate(presentCount, totalCount)}%
                </Text>
              </View>
              <Text style={styles.expandIcon}>
                {isExpanded ? '▼' : '▶'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.kidsList}>
            {presentKids.length > 0 && (
              <View style={styles.statusSection}>
                <View style={styles.statusHeader}>
                  <View style={styles.statusIndicator} />
                  <Text style={styles.statusTitle}>Present ({presentKids.length})</Text>
                </View>
                {presentKids.map((kid, index) => (
                  <View key={kid.kid_id} style={styles.kidItem}>
                    <Text style={styles.kidNumber}>{index + 1}</Text>
                    <Text style={styles.kidName}>{kid.name}</Text>
                    <View style={styles.presentBadge}>
                      <Text style={styles.badgeText}>✓</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {absentKids.length > 0 && (
              <View style={[styles.statusSection, { marginTop: 16 }]}>
                <View style={styles.statusHeader}>
                  <View style={[styles.statusIndicator, { backgroundColor: COLORS.absent }]} />
                  <Text style={styles.statusTitle}>Absent ({absentKids.length})</Text>
                </View>
                {absentKids.map((kid, index) => (
                  <View key={kid.kid_id} style={styles.kidItem}>
                    <Text style={styles.kidNumber}>{index + 1}</Text>
                    <Text style={[styles.kidName, { color: COLORS.textSecondary }]}>{kid.name}</Text>
                    <View style={styles.absentBadge}>
                      <Text style={styles.badgeText}>✗</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </Card>
    );
  };

  const renderNotes = () => {
    if (!session?.general_notes) return null;

    return (
      <Card style={styles.notesCard}>
        <View style={styles.notesHeader}>
          <Text style={styles.notesIcon}>📝</Text>
          <Text style={styles.notesTitle}>Session Notes</Text>
        </View>
        <Text style={styles.notesContent}>{session.general_notes}</Text>
      </Card>
    );
  };

  const renderDetailedView = () => {
    if (!showDetailedView) return null;

    const presentKids = filteredAttendance.filter(a => a.status === 'present');
    const absentKids = filteredAttendance.filter(a => a.status === 'absent');

    return (
      <Card style={styles.detailedViewCard}>
        <View style={styles.detailedViewHeader}>
          <Text style={styles.detailedViewTitle}>📋 Detailed Attendance List</Text>
          <TouchableOpacity onPress={() => setShowDetailedView(false)}>
            <Text style={styles.collapseText}>Hide ▲</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Bar */}
        <View style={{ marginTop: 12, marginBottom: 16 }}>
          <FilterBar
            filters={['all', 'SC', 'SP', 'ELT', 'WW']}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            counts={filterCounts}
          />
        </View>

        {/* Present Kids Section */}
        {presentKids.length > 0 && (
          <View style={styles.detailedSection}>
            <View style={styles.detailedSectionHeader}>
              <View style={[styles.detailedIndicator, { backgroundColor: COLORS.present }]} />
              <Text style={styles.detailedSectionTitle}>
                ✓ Present ({presentKids.length})
              </Text>
            </View>
            
            <View style={styles.detailedKidsList}>
              {presentKids.map((kid, index) => (
                <View key={kid.kid_id} style={styles.detailedKidItem}>
                  <View style={styles.detailedKidInfo}>
                    <Text style={styles.detailedKidNumber}>{index + 1}.</Text>
                    <View style={styles.detailedKidDetails}>
                      <Text style={styles.detailedKidName}>{kid.name}</Text>
                      <Text style={styles.detailedKidMeta}>
                        {kid.age_group} • {kid.sponsorshipType} • {kid.programType}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailedPresentBadge}>
                    <Text style={styles.detailedBadgeText}>✓</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Absent Kids Section */}
        {absentKids.length > 0 && (
          <View style={[styles.detailedSection, { marginTop: 20 }]}>
            <View style={styles.detailedSectionHeader}>
              <View style={[styles.detailedIndicator, { backgroundColor: COLORS.absent }]} />
              <Text style={styles.detailedSectionTitle}>
                ✗ Absent ({absentKids.length})
              </Text>
            </View>
            
            <View style={styles.detailedKidsList}>
              {absentKids.map((kid, index) => (
                <View key={kid.kid_id} style={[styles.detailedKidItem, styles.detailedKidItemAbsent]}>
                  <View style={styles.detailedKidInfo}>
                    <Text style={[styles.detailedKidNumber, { color: COLORS.textSecondary }]}>
                      {index + 1}.
                    </Text>
                    <View style={styles.detailedKidDetails}>
                      <Text style={[styles.detailedKidName, { color: COLORS.textSecondary }]}>
                        {kid.name}
                      </Text>
                      <Text style={styles.detailedKidMeta}>
                        {kid.age_group} • {kid.sponsorshipType} • {kid.programType}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailedAbsentBadge}>
                    <Text style={styles.detailedBadgeText}>✗</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {presentKids.length === 0 && absentKids.length === 0 && (
          <View style={styles.detailedEmptyState}>
            <Text style={styles.detailedEmptyText}>
              No attendance records for selected filter
            </Text>
          </View>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Session Details"
          leftIcon="←"
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading session...</Text>
        </View>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <Header
          title="Session Details"
          leftIcon="←"
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>❌</Text>
          <Text style={styles.emptyText}>Session not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Session Details"
        leftIcon="←"
        onLeftPress={() => navigation.goBack()}
        rightIcon="📤"
        onRightPress={handleExport}
      />
      
      <View style={styles.scrollViewContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderSessionInfo()}
      
        {/* FilterBar */}
        <View style={{ marginBottom: 16 }}>
          <FilterBar
            filters={['all', 'SC', 'SP', 'ELT', 'WW']}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            counts={filterCounts}
          />
        </View>
        
        {renderSummary()}
        
        <View style={styles.breakdownHeader}>
          <Text style={styles.breakdownTitle}>Breakdown by Age Group</Text>
          <TouchableOpacity
            onPress={() => {
              const allExpanded = Object.values(expandedGroups).every(v => v);
              const newState = {};
              AGE_GROUPS.forEach(group => {
                newState[group] = !allExpanded;
              });
              setExpandedGroups(newState);
            }}
          >
            <Text style={styles.expandAllText}>
              {Object.values(expandedGroups).every(v => v) ? 'Collapse All' : 'Expand All'}
            </Text>
          </TouchableOpacity>
        </View>

        {AGE_GROUPS.map(renderAgeGroupSection)}
        
        {renderNotes()}

        <View style={styles.footer}>
          {/* View Details Button */}
          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={() => navigation.navigate('AttendanceDetail', { sessionId })}
          >
            <Text style={styles.viewDetailsButtonText}>
              👁️ View Details
            </Text>
          </TouchableOpacity>
          
          {/* Export Report Button */}
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExport}
          >
            <Text style={styles.exportButtonText}>📤 Export Report</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },

  // Session Info Card
  infoCard: {
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBox: {
    width: 70,
    height: 70,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  dateDay: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  dateMonth: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  infoDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Summary Card
  summaryCard: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.textSecondary + '30',
  },
  rateContainer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
  },
  rateCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  rateText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  rateLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Breakdown Section
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  expandAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Age Group Card
  ageGroupCard: {
    marginBottom: 12,
  },
  ageGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ageGroupTitleContainer: {
    flex: 1,
  },
  ageGroupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  ageGroupCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  ageGroupRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ageGroupBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 12,
  },
  ageGroupRate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  expandIcon: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },

  // Kids List
  kidsList: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
  },
  statusSection: {
    marginBottom: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.present,
    marginRight: 8,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  kidItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: 8,
  },
  kidNumber: {
    width: 30,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  kidName: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  presentBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.present,
    alignItems: 'center',
    justifyContent: 'center',
  },
  absentBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.absent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: 'bold',
  },

  // Notes Card
  notesCard: {
    marginTop: 8,
    marginBottom: 16,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  notesIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  notesContent: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  // Footer
  footer: {
    marginTop: 8,
    gap: 12,
  },
  viewDetailsButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  viewDetailsButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  exportButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },

  // Detailed View Styles
  detailedViewCard: {
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: COLORS.white,
  },
  detailedViewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailedViewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  collapseText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  detailedSection: {
    marginBottom: 12,
  },
  detailedSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  detailedIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  detailedSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  detailedKidsList: {
    gap: 8,
  },
  detailedKidItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.present,
  },
  detailedKidItemAbsent: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: COLORS.absent,
  },
  detailedKidInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailedKidNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: 12,
    width: 30,
  },
  detailedKidDetails: {
    flex: 1,
  },
  detailedKidName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  detailedKidMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  detailedPresentBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.present,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailedAbsentBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.absent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailedBadgeText: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  detailedEmptyState: {
    padding: 40,
    alignItems: 'center',
  },
  detailedEmptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default SessionDetailScreen;