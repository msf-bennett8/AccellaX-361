// Location: /apps/assessment/src/screens/Comparison/ComparisonScreen.js
// Multi-kid comparison with peer/team/self analysis

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import ComparisonChart from '../../components/charts/ComparisonChart';
import SpiderChart from '../../components/charts/SpiderChart';
import HeatmapChart from '../../components/charts/HeatmapChart';
import { COLORS } from '../../utils/constants';
import { getKidByIdFromFirebase, getKidsBySport } from '../../services/kidService';
import { getSportById } from '../../database/db';
import { getAllAssessments } from '../../services/assessmentService';

export default function ComparisonScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { kidId, sportId } = route.params || {};

  // State
  const [mainKid, setMainKid] = useState(null);
  const [sport, setSport] = useState(null);
  const [allKids, setAllKids] = useState([]);
  const [selectedKids, setSelectedKids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comparisonMode, setComparisonMode] = useState('self'); // 'self', 'peers', 'team'
  const [selectedMetric, setSelectedMetric] = useState('speed');
  const [kidSelectorVisible, setKidSelectorVisible] = useState(false);

  // Processed data
  const [comparisonData, setComparisonData] = useState([]);
  const [spiderData, setSpiderData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [ageGroupAverage, setAgeGroupAverage] = useState(null);

  useEffect(() => {
    loadComparisonData();
  }, [kidId, sportId]);

  useEffect(() => {
    if (mainKid && selectedKids.length > 0) {
      processComparisonData();
    }
  }, [mainKid, selectedKids, selectedMetric, comparisonMode]);

  const loadComparisonData = async () => {
    try {
      setLoading(true);

      // Load main kid and sport
      const kidData = await getKidByIdFromFirebase(kidId);  // ✅ Use correct function
      const sportData = await getSportById(sportId);
      
      // Safety check: ensure kid and sport exist
      if (!kidData || !sportData) {
        console.error('❌ Kid or sport not found');
        Alert.alert('Error', 'Unable to load comparison data');
        navigation.goBack();
        return;
      }
      setMainKid(kidData);
      setSport(sportData);

      // Load all kids in this sport
      const sportsKids = await getKidsBySport(sportId);
      setAllKids(sportsKids.filter(k => k.id !== kidId));

      // Default: compare with age group peers (top 5)
      const ageGroupPeers = sportsKids
        .filter(k => k.age_group === kidData.age_group && k.id !== kidId)
        .slice(0, 5);
      setSelectedKids(ageGroupPeers);

      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading comparison data:', error);
      setLoading(false);
    }
  };

  const processComparisonData = async () => {
    try {
      // Get latest assessments for all selected kids (filter out nulls)
      const kidsData = [mainKid, ...selectedKids].filter(kid => kid !== null && kid !== undefined);
      
      // Safety check: ensure we have kids to compare
      if (kidsData.length === 0) {
        console.log('⚠️ No valid kids to compare');
        return;
      }
      
      const assessmentsPromises = kidsData.map(kid =>
        getAllAssessments({ kid_id: kid.id, sport_id: sportId })
      );
      const allAssessments = await Promise.all(assessmentsPromises);

      // Bar chart data (for selected metric)
      const barData = [];
      kidsData.forEach((kid, index) => {
        const assessments = allAssessments[index];
        if (assessments.length > 0) {
          const latest = assessments[assessments.length - 1];
          const result = latest.results?.find(r => r.metric_id === selectedMetric);
          if (result) {
            barData.push({
              name: kid.name,
              value: parseFloat(result.value),
              color: kid.id === mainKid.id ? COLORS.primary : '#2196F3',
            });
          }
        }
      });
      setComparisonData(barData);

      // Spider chart data (kid vs average)
      if (allAssessments[0]?.length > 0) {
        const mainKidLatest = allAssessments[0][allAssessments[0].length - 1];
        const spiderMetrics = [];

        // Calculate averages
        const metricAverages = {};
        allAssessments.forEach((kidAssessments, index) => {
          if (kidAssessments.length > 0) {
            const latest = kidAssessments[kidAssessments.length - 1];
            latest.results?.forEach(result => {
              if (!metricAverages[result.metric_id]) {
                metricAverages[result.metric_id] = [];
              }
              metricAverages[result.metric_id].push(parseFloat(result.value));
            });
          }
        });

        // Build spider data
        mainKidLatest.results?.slice(0, 8).forEach(result => {
          const metricId = result.metric_id;
          const kidValue = parseFloat(result.value);
          const avgValue = metricAverages[metricId]
            ? metricAverages[metricId].reduce((a, b) => a + b) / metricAverages[metricId].length
            : kidValue;

          spiderMetrics.push({
            skill: metricId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            kidValue: Math.min(kidValue, 10),
            avgValue: Math.min(avgValue, 10),
          });
        });

        setSpiderData(spiderMetrics);
      }

      // Heatmap data
      const heatmapKids = [];
      for (let i = 0; i < Math.min(kidsData.length, 10); i++) {
        const kid = kidsData[i];
        const assessments = allAssessments[i];
        if (assessments.length > 0) {
          const latest = assessments[assessments.length - 1];
          const metrics = latest.results?.map(r => ({
            name: r.metric_id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: parseFloat(r.value),
          })) || [];
          heatmapKids.push({ name: kid.name, metrics });
        }
      }
      setHeatmapData(heatmapKids);

    } catch (error) {
      console.error('❌ Error processing comparison data:', error);
    }
  };

  const toggleKidSelection = (kidId) => {
    setSelectedKids(prev =>
      prev.find(k => k.id === kidId)
        ? prev.filter(k => k.id !== kidId)
        : [...prev, allKids.find(k => k.id === kidId)]
    );
  };

  // Age group filter state
  const [selectedAgeFilter, setSelectedAgeFilter] = React.useState('all');

  const renderKidSelector = () => {
    // Filter kids by age group
    const filteredKids = allKids.filter(kid => {
      if (selectedAgeFilter === 'all') return true;
      if (selectedAgeFilter === '4-6') return kid.age >= 4 && kid.age <= 6;
      if (selectedAgeFilter === '7-9') return kid.age >= 7 && kid.age <= 9;
      if (selectedAgeFilter === '10-13') return kid.age >= 10 && kid.age <= 13;
      if (selectedAgeFilter === '13+') return kid.age >= 13;
      return true;
    });

    return (
      <Modal
        visible={kidSelectorVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setKidSelectorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Kids to Compare</Text>
              <TouchableOpacity onPress={() => setKidSelectorVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Age Group Filters */}
            <View style={styles.ageFilterContainer}>
              <Text style={styles.ageFilterLabel}>Age Group:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['all', '4-6', '7-9', '10-13', '13+'].map(age => (
                  <TouchableOpacity
                    key={age}
                    style={[
                      styles.ageFilterChip,
                      selectedAgeFilter === age && styles.activeAgeFilterChip
                    ]}
                    onPress={() => setSelectedAgeFilter(age)}
                  >
                    <Text style={[
                      styles.ageFilterText,
                      selectedAgeFilter === age && styles.activeAgeFilterText
                    ]}>
                      {age === 'all' ? 'All Ages' : `${age} years`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <FlatList
              data={filteredKids}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.kidOption}
                  onPress={() => toggleKidSelection(item.id)}
                >
                  <View>
                    <Text style={styles.kidOptionText}>{item.name}</Text>
                    <Text style={styles.kidOptionAge}>Age: {item.age}</Text>
                  </View>
                  {selectedKids.find(k => k.id === item.id) && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyFilterState}>
                  <Text style={styles.emptyFilterText}>No kids in this age group</Text>
                </View>
              }
            />

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setKidSelectorVisible(false);
                processComparisonData();
              }}
            >
              <Text style={styles.modalButtonText}>
                Compare ({selectedKids.length} kids selected)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Comparison"
          leftIcon="←"
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading comparison...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Performance Comparison"
        subtitle={`${mainKid?.name} vs Others`}
        leftIcon="←"
        onLeftPress={() => navigation.goBack()}
      />

      <View style={styles.contentWrapper}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Comparison Mode Selector */}
        <View style={styles.modeOuterContainer}>
          <View style={styles.modeContainer}>
            <TouchableOpacity
              style={[styles.modeButton, comparisonMode === 'self' && styles.activeModeButton]}
              onPress={() => setComparisonMode('self')}
            >
              <Ionicons 
                name="person" 
                size={18} 
                color={comparisonMode === 'self' ? COLORS.white : COLORS.textSecondary} 
              />
              <Text style={[styles.modeText, comparisonMode === 'self' && styles.activeModeText]}>
                Self Progress
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, comparisonMode === 'peers' && styles.activeModeButton]}
              onPress={() => setComparisonMode('peers')}
            >
              <Ionicons 
                name="people" 
                size={18} 
                color={comparisonMode === 'peers' ? COLORS.white : COLORS.textSecondary} 
              />
              <Text style={[styles.modeText, comparisonMode === 'peers' && styles.activeModeText]}>
                Age Group
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, comparisonMode === 'team' && styles.activeModeButton]}
              onPress={() => setComparisonMode('team')}
            >
              <MaterialCommunityIcons 
                name="trophy" 
                size={18} 
                color={comparisonMode === 'team' ? COLORS.white : COLORS.textSecondary} 
              />
              <Text style={[styles.modeText, comparisonMode === 'team' && styles.activeModeText]}>
                Team Best
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Kid Display */}
        <View style={styles.mainKidContainer}>
          <View style={styles.mainKidRow}>
            <View style={styles.mainKidChip}>
              <Ionicons name="person" size={18} color={COLORS.primary} />
              <Text style={styles.mainKidChipText}>{mainKid?.name}</Text>
            </View>
            <View style={styles.ageChip}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
              <Text style={styles.ageChipText}>
                {mainKid?.age} years | {
                  mainKid?.age >= 4 && mainKid?.age <= 6 ? '4-6' :
                  mainKid?.age >= 7 && mainKid?.age <= 9 ? '7-9' :
                  mainKid?.age >= 10 && mainKid?.age <= 13 ? '10-13' :
                  '13+'
                } age group
              </Text>
            </View>
          </View>
        </View>

        {/* Comparing With Section */}
        <View style={styles.comparingWithContainer}>
          <View style={styles.comparingWithHeader}>
            <View style={styles.comparingWithTitleRow}>
              <Text style={styles.comparingWithLabel}>Comparing with:</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.textSecondary} style={{ marginLeft: 6 }} />
            </View>
            <TouchableOpacity 
              style={styles.addKidButtonVisible}
              onPress={() => setKidSelectorVisible(true)}
            >
              <Ionicons name="add" size={16} color={COLORS.white} />
              <Text style={styles.addKidButtonText}>Add Kid</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Comparison Kids - Light Blue Background */}
          {selectedKids.length > 0 ? (
            <View style={styles.comparisonKidsWrapper}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.selectedKidsScroll}
                contentContainerStyle={styles.selectedKidsContent}
              >
                {selectedKids.map(kid => (
                  <View key={kid.id} style={styles.comparisonKidChip}>
                    <View style={styles.comparisonKidInfo}>
                      <Text style={styles.comparisonKidChipText}>{kid.name}</Text>
                      <Text style={styles.comparisonKidAge}>{kid.age} yrs</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => toggleKidSelection(kid.id)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close" size={16} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.scrollIndicatorRight}>
                <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
              </View>
            </View>
          ) : (
            <View style={styles.emptyComparisonState}>
              <Text style={styles.emptyComparisonText}>No kids selected for comparison</Text>
            </View>
          )}
        </View>

        {/* Metric Selector */}
        <View style={styles.metricSelector}>
          <View style={styles.metricSelectorHeader}>
            <Text style={styles.metricLabel}>Select Metric:</Text>
            <Ionicons name="arrow-forward" size={14} color={COLORS.textSecondary} style={{ marginLeft: 6 }} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['speed', 'strength', 'endurance', 'agility', 'passing', 'shooting'].map(metric => (
              <TouchableOpacity
                key={metric}
                style={[styles.metricChip, selectedMetric === metric && styles.activeMetricChip]}
                onPress={() => setSelectedMetric(metric)}
              >
                <Text style={[
                  styles.metricChipText,
                  selectedMetric === metric && styles.activeMetricChipText
                ]}>
                  {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Charts */}
        {comparisonData.length > 0 && (
          <View style={styles.chartSection}>
            <ComparisonChart
              data={comparisonData}
              title={`${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Comparison`}
              metricName={selectedMetric}
              unit=""
              height={320}
              averageLine={
                comparisonData.reduce((sum, item) => sum + item.value, 0) / comparisonData.length
              }
            />
          </View>
        )}

        {spiderData.length > 0 && (
          <View style={styles.chartSection}>
            <SpiderChart
              data={spiderData}
              title={`${mainKid?.name} vs Age Group Average`}
              kidName={mainKid?.name}
              height={340}
            />
          </View>
        )}

        {heatmapData.length > 0 && (
          <View style={styles.chartSection}>
            <View style={styles.chartTitleRow}>
              <Text style={styles.chartTitle}>Team Skills Heatmap</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.textSecondary} style={{ marginLeft: 6 }} />
            </View>
            <HeatmapChart
              data={heatmapData}
              title=""
            />
          </View>
        )}

        {/* Empty State */}
        {comparisonData.length === 0 && spiderData.length === 0 && heatmapData.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No comparison data available</Text>
            <Text style={styles.emptySubtext}>Select kids to compare</Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
        </ScrollView>
      </View>

      {/* Kid Selector Modal */}
      {renderKidSelector()}
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
    paddingBottom: 40,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.textSecondary },

  modeOuterContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 6,
  },
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 6,
    gap: 8,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    backgroundColor: COLORS.primaryLight,
  },
  activeModeButton: { 
    backgroundColor: COLORS.primary,
  },
  modeText: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: COLORS.primary,
  },
  activeModeText: { 
    color: COLORS.white,
  },

  mainKidContainer: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
  },
  mainKidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mainKidChip: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
  },
  mainKidChipText: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: COLORS.primary,
  },
  ageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    flex: 1,
  },
  ageChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  comparingWithContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
  },
  comparingWithHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  comparingWithTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparingWithLabel: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: COLORS.text,
  },
  addKidButton: { 
    padding: 4,
  },
  addKidButtonVisible: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 5,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addKidButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },

  comparisonKidsWrapper: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedKidsScroll: { 
    flex: 1,
  },
  selectedKidsContent: {
    alignItems: 'center',
  },
  comparisonKidChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    gap: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  comparisonKidInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  comparisonKidChipText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: COLORS.text,
  },
  comparisonKidAge: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  removeButton: {
    padding: 2,
  },
  scrollIndicatorRight: {
    paddingLeft: 8,
  },
  emptyComparisonState: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  emptyComparisonText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  selectedKidsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedKidsLabel: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: COLORS.text,
  },
  addKidButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addKidText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  mainKidChipContainer: {
    marginBottom: 12,
  },
  mainKidChip: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    alignSelf: 'flex-start',
  },
  mainKidChipText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: COLORS.primary,
  },
  comparisonKidsContainer: {
    position: 'relative',
  },
  selectedKidsScroll: { 
    flexDirection: 'row',
  },
  kidChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 8,
    gap: 8,
  },
  kidChipText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: COLORS.white,
  },
  scrollIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  metricSelector: { 
    marginHorizontal: 20, 
    marginBottom: 20,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
  },
  metricSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricLabel: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: COLORS.text,
  },

  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  metricChip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  activeMetricChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  metricChipText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  activeMetricChipText: { color: COLORS.white },

  chartSection: { marginHorizontal: 20, marginBottom: 20 },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  ageFilterContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  ageFilterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  ageFilterChip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  activeAgeFilterChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  ageFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  activeAgeFilterText: {
    color: COLORS.white,
  },
  kidOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  kidOptionText: { fontSize: 16, color: COLORS.text, fontWeight: '600' },
  kidOptionAge: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  emptyFilterState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyFilterText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    margin: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },

  bottomPadding: { height: 40 },
});