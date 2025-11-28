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
import { getKidById, getKidsBySport } from '../../services/kidService';
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
      const kidData = await getKidById(kidId);
      const sportData = await getSportById(sportId);
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
      // Get latest assessments for all selected kids
      const kidsData = [mainKid, ...selectedKids];
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

  const renderKidSelector = () => (
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

          <FlatList
            data={allKids}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.kidOption}
                onPress={() => toggleKidSelection(item.id)}
              >
                <Text style={styles.kidOptionText}>{item.name}</Text>
                {selectedKids.find(k => k.id === item.id) && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            )}
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Comparison Mode Selector */}
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

        {/* Selected Kids Display */}
        <View style={styles.selectedKidsContainer}>
          <Text style={styles.selectedKidsLabel}>Comparing with:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedKidsScroll}>
            <View style={[styles.kidChip, styles.mainKidChip]}>
              <Text style={styles.kidChipText}>{mainKid?.name} (You)</Text>
            </View>
            {selectedKids.map(kid => (
              <View key={kid.id} style={styles.kidChip}>
                <Text style={styles.kidChipText}>{kid.name}</Text>
                <TouchableOpacity onPress={() => toggleKidSelection(kid.id)}>
                  <Ionicons name="close-circle" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity 
            style={styles.addKidButton}
            onPress={() => setKidSelectorVisible(true)}
          >
            <Ionicons name="add-circle" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Metric Selector */}
        <View style={styles.metricSelector}>
          <Text style={styles.metricLabel}>Select Metric:</Text>
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
            <HeatmapChart
              data={heatmapData}
              title="Team Skills Heatmap"
            />
          </View>
        )}

        {/* Empty State */}
        {comparisonData.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No comparison data available</Text>
            <Text style={styles.emptySubtext}>Select kids to compare</Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Kid Selector Modal */}
      {renderKidSelector()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.textSecondary },

  modeContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  activeModeButton: { backgroundColor: COLORS.primary },
  modeText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  activeModeText: { color: COLORS.white },

  selectedKidsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
  },
  selectedKidsLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginRight: 8 },
  selectedKidsScroll: { flex: 1 },
  kidChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    gap: 6,
  },
  mainKidChip: { backgroundColor: COLORS.primary },
  kidChipText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  addKidButton: { marginLeft: 8 },

  metricSelector: { marginHorizontal: 20, marginBottom: 20 },
  metricLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
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
  kidOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  kidOptionText: { fontSize: 16, color: COLORS.text },
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