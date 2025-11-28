// Location: /apps/assessment/src/screens/KidProgress/KidProgressScreen.js
// Individual kid's progress tracking with charts and comparisons

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import LineChart from '../../components/charts/LineChart';
import RadarChart from '../../components/charts/RadarChart';
import PercentileChart from '../../components/charts/PercentileChart';
import ProgressChart from '../../components/charts/ProgressChart';
import { COLORS } from '../../utils/constants';
import { getKidByIdFromFirebase } from '../../services/kidService';
import { getSportById } from '../../database/db';
import { getAllAssessments } from '../../services/assessmentService';
import { getPerformanceRating } from '../../config/benchmarks';
import { format, parseISO } from 'date-fns';

const { width } = Dimensions.get('window');
const SMALL_SCREEN = width < 400;

export default function KidProgressScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { kidId, sportId } = route.params || {};

  // State
  const [kid, setKid] = useState(null);
  const [sport, setSport] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [viewMode, setViewMode] = useState('charts'); // 'charts' or 'table'

  // Modal states
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [menuModalVisible, setMenuModalVisible] = useState(false);

  // Processed data
  const [progressData, setProgressData] = useState({});
  const [radarData, setRadarData] = useState([]);
  const [redFlags, setRedFlags] = useState([]);
  const [improvements, setImprovements] = useState([]);

  useEffect(() => {
    loadKidProgress();
  }, [kidId, sportId]);

  const loadKidProgress = async () => {
    try {
      setLoading(true);

      // Load kid and sport info
      const kidData = await getKidByIdFromFirebase(kidId);
      const sportData = await getSportById(sportId);
      setKid(kidData);
      setSport(sportData);

      // Load assessments for this kid and sport
      const allAssessments = await getAllAssessments({ kid_id: kidId, sport_id: sportId });
      const sortedAssessments = allAssessments.sort((a, b) => 
        new Date(a.assessment_date) - new Date(b.assessment_date)
      );
      setAssessments(sortedAssessments);

      // Process data for charts
      processProgressData(sortedAssessments, kidData);
      detectRedFlags(sortedAssessments);

      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading kid progress:', error);
      setLoading(false);
      setErrorMessage('Failed to load progress data');
      setErrorModalVisible(true);
    }
  };

  const processProgressData = (assessments, kidData) => {
    if (!assessments || assessments.length === 0) return;

    // Group results by metric
    const metricGroups = {};
    const radarMetrics = [];

    assessments.forEach(assessment => {
      assessment.results?.forEach(result => {
        if (!metricGroups[result.metric_id]) {
          metricGroups[result.metric_id] = [];
        }
        metricGroups[result.metric_id].push({
          date: assessment.assessment_date,
          label: format(parseISO(assessment.assessment_date), 'MMM dd'),
          value: parseFloat(result.value),
        });
      });
    });

    setProgressData(metricGroups);

    // Prepare radar data (latest assessment, sport-specific skills only)
    const latestAssessment = assessments[assessments.length - 1];
    if (latestAssessment && latestAssessment.results) {
      const sportSkills = latestAssessment.results
        .filter(r => !['height', 'weight', 'beep_test', 'cooper_test'].includes(r.metric_id))
        .slice(0, 8) // Max 8 skills for readability
        .map(r => ({
          skill: r.metric_id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: parseFloat(r.value),
          fullMark: 10,
        }));
      setRadarData(sportSkills);
    }

    // Set default selected metric (first one with data)
    if (Object.keys(metricGroups).length > 0) {
      setSelectedMetric(Object.keys(metricGroups)[0]);
    }
  };

  const detectRedFlags = (assessments) => {
    if (assessments.length < 2) return;

    const flags = [];
    const improvements = [];
    const latest = assessments[assessments.length - 1];
    const previous = assessments[assessments.length - 2];

    latest.results?.forEach(latestResult => {
      const prevResult = previous.results?.find(r => r.metric_id === latestResult.metric_id);
      if (prevResult) {
        const latestValue = parseFloat(latestResult.value);
        const prevValue = parseFloat(prevResult.value);
        const change = ((latestValue - prevValue) / prevValue) * 100;

        if (change <= -15) {
          flags.push({
            metric: latestResult.metric_id,
            change: change.toFixed(1),
            from: prevValue,
            to: latestValue,
          });
        } else if (change >= 15) {
          improvements.push({
            metric: latestResult.metric_id,
            change: change.toFixed(1),
            from: prevValue,
            to: latestValue,
          });
        }
      }
    });

    setRedFlags(flags);
    setImprovements(improvements);
  };

  const getLatestValue = (metricId) => {
    if (!assessments || assessments.length === 0) return null;
    const latest = assessments[assessments.length - 1];
    const result = latest.results?.find(r => r.metric_id === metricId);
    return result ? result.value : null;
  };

  const getTrend = (metricId) => {
    const data = progressData[metricId];
    if (!data || data.length < 2) return 'neutral';
    const latest = data[data.length - 1].value;
    const previous = data[data.length - 2].value;
    return latest > previous ? 'up' : latest < previous ? 'down' : 'neutral';
  };

  const handleExport = (format) => {
    setExportModalVisible(false);
    setMenuModalVisible(false);
    // TODO: Implement actual export functionality
    console.log(`Exporting as ${format}...`);
  };

  const handleShare = () => {
    setMenuModalVisible(false);
    setExportModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Kid Progress"
          leftIcon="←"
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading progress...</Text>
        </View>
      </View>
    );
  }

  if (!kid || !sport) {
    return (
      <View style={styles.container}>
        <Header
          title="Kid Progress"
          leftIcon="←"
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>Kid or Sport not found</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Progress Tracking"
        subtitle={`${kid.name} • ${sport.name}`}
        leftIcon="←"
        onLeftPress={() => navigation.goBack()}
        rightIcon={SMALL_SCREEN ? "ellipsis-vertical" : "share-social"}
        onRightPress={SMALL_SCREEN ? () => setMenuModalVisible(true) : handleShare}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Kid Info Card */}
        <View style={styles.kidInfoCard}>
          <View style={styles.kidInfoHeader}>
            <View style={[styles.sportBadge, { backgroundColor: sport.color || COLORS.primary }]}>
              <MaterialCommunityIcons name="trophy" size={24} color={COLORS.white} />
            </View>
            <View style={styles.kidInfoText}>
              <Text style={styles.kidName}>{kid.name}</Text>
              <Text style={styles.kidDetails}>
                Age {kid.age} • {kid.age_group} • {kid.gender}
              </Text>
            </View>
          </View>
          <View style={styles.assessmentCount}>
            <Text style={styles.assessmentCountNumber}>{assessments.length}</Text>
            <Text style={styles.assessmentCountLabel}>Assessments</Text>
          </View>
        </View>

        {/* Red Flags Alert */}
        {redFlags.length > 0 && (
          <View style={styles.redFlagsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="warning" size={20} color={COLORS.error} />
              <Text style={styles.sectionTitle}>Performance Alerts</Text>
            </View>
            {redFlags.map((flag, index) => (
              <View key={index} style={styles.redFlagCard}>
                <View style={styles.redFlagIcon}>
                  <Ionicons name="trending-down" size={20} color={COLORS.error} />
                </View>
                <View style={styles.redFlagContent}>
                  <Text style={styles.redFlagMetric}>
                    {flag.metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                  <Text style={styles.redFlagChange}>
                    Decreased by {Math.abs(flag.change)}% ({flag.from} → {flag.to})
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Improvements */}
        {improvements.length > 0 && (
          <View style={styles.improvementsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy" size={20} color={COLORS.success} />
              <Text style={styles.sectionTitle}>Improvements</Text>
            </View>
            {improvements.map((imp, index) => (
              <View key={index} style={styles.improvementCard}>
                <View style={styles.improvementIcon}>
                  <Ionicons name="trending-up" size={20} color={COLORS.success} />
                </View>
                <View style={styles.improvementContent}>
                  <Text style={styles.improvementMetric}>
                    {imp.metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                  <Text style={styles.improvementChange}>
                    Improved by {imp.change}% ({imp.from} → {imp.to})
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* View Mode Toggle */}
        <View style={styles.viewModeContainer}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'charts' && styles.activeViewMode]}
            onPress={() => setViewMode('charts')}
          >
            <Ionicons 
              name="bar-chart" 
              size={18} 
              color={viewMode === 'charts' ? COLORS.white : COLORS.textSecondary} 
            />
            <Text style={[
              styles.viewModeText,
              viewMode === 'charts' && styles.activeViewModeText
            ]}>
              Charts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'table' && styles.activeViewMode]}
            onPress={() => setViewMode('table')}
          >
            <Ionicons 
              name="list" 
              size={18} 
              color={viewMode === 'table' ? COLORS.white : COLORS.textSecondary} 
            />
            <Text style={[
              styles.viewModeText,
              viewMode === 'table' && styles.activeViewModeText
            ]}>
              Table
            </Text>
          </TouchableOpacity>
        </View>

        {/* Charts View */}
        {viewMode === 'charts' && (
          <>
            {/* Progress Charts Grid */}
            <View style={styles.chartsSection}>
              <Text style={styles.sectionTitle}>Performance Metrics</Text>
              {Object.entries(progressData).slice(0, 4).map(([metricId, data]) => (
                <ProgressChart
                  key={metricId}
                  data={data}
                  label={metricId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  currentValue={getLatestValue(metricId)}
                  trend={getTrend(metricId)}
                />
              ))}
            </View>

            {/* Detailed Line Chart */}
            {selectedMetric && progressData[selectedMetric] && (
              <View style={styles.detailedChartSection}>
                <Text style={styles.sectionTitle}>Detailed Progress</Text>
                <LineChart
                  data={progressData[selectedMetric]}
                  metricName={selectedMetric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  height={280}
                  showGrid={true}
                />
              </View>
            )}

            {/* Skills Radar Chart */}
            {radarData.length > 0 && (
              <View style={styles.radarSection}>
                <RadarChart
                  data={radarData}
                  title="Skills Profile"
                  height={320}
                />
              </View>
            )}

            {/* Percentile Chart (Example for one metric) */}
            {assessments.length > 0 && (
              <View style={styles.percentileSection}>
                <PercentileChart
                  percentile={72}
                  metricName="Speed"
                  kidValue={getLatestValue('speed') || '—'}
                  unit="seconds"
                  ageGroup={kid.age_group}
                />
              </View>
            )}
          </>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <View style={styles.tableSection}>
            <Text style={styles.sectionTitle}>Assessment History</Text>
            {assessments.slice().reverse().map((assessment, index) => (
              <View key={assessment.id} style={styles.tableCard}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableDate}>
                    {format(parseISO(assessment.assessment_date), 'MMM dd, yyyy')}
                  </Text>
                  <Text style={styles.tableMetricsCount}>
                    {assessment.results?.length || 0} metrics
                  </Text>
                </View>
                <View style={styles.tableMetrics}>
                  {assessment.results?.slice(0, 5).map((result, idx) => (
                    <View key={idx} style={styles.tableMetricRow}>
                      <Text style={styles.tableMetricName}>
                        {result.metric_id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Text>
                      <Text style={styles.tableMetricValue}>{result.value}</Text>
                    </View>
                  ))}
                  {assessment.results?.length > 5 && (
                    <Text style={styles.tableMoreText}>
                      +{assessment.results.length - 5} more metrics
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {assessments.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No assessments yet</Text>
            <Text style={styles.emptySubtext}>Start by creating an assessment</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('Assessment')}
            >
              <Text style={styles.emptyButtonText}>Create Assessment</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Action Button - Compare */}
      {assessments.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('Comparison', { kidId, sportId })}
        >
          <Ionicons name="stats-chart" size={24} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* Error Modal */}
      <Modal
        visible={errorModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons name="alert-circle" size={32} color={COLORS.error} />
              <Text style={styles.modalTitle}>Error</Text>
            </View>
            <Text style={styles.modalMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Export Modal */}
      <Modal
        visible={exportModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setExportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons name="share-social" size={32} color={COLORS.primary} />
              <Text style={styles.modalTitle}>Export Progress Report</Text>
            </View>
            <Text style={styles.modalMessage}>Choose export format:</Text>
            
            <TouchableOpacity
              style={styles.exportOption}
              onPress={() => handleExport('PDF')}
            >
              <Ionicons name="document-text" size={24} color={COLORS.primary} />
              <View style={styles.exportOptionText}>
                <Text style={styles.exportOptionTitle}>PDF</Text>
                <Text style={styles.exportOptionDescription}>Portable Document Format</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportOption}
              onPress={() => handleExport('Excel')}
            >
              <Ionicons name="grid" size={24} color={COLORS.success} />
              <View style={styles.exportOptionText}>
                <Text style={styles.exportOptionTitle}>Excel</Text>
                <Text style={styles.exportOptionDescription}>Spreadsheet with detailed data</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setExportModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Menu Modal (Small Screen) */}
      <Modal
        visible={menuModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMenuModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuModalVisible(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuOption}
              onPress={handleShare}
            >
              <Ionicons name="share-social" size={24} color={COLORS.primary} />
              <Text style={styles.menuOptionText}>Share Report</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => {
                setMenuModalVisible(false);
                navigation.navigate('Comparison', { kidId, sportId });
              }}
            >
              <Ionicons name="stats-chart" size={24} color={COLORS.primary} />
              <Text style={styles.menuOptionText}>Compare</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => setMenuModalVisible(false)}
            >
              <Text style={styles.menuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.textSecondary },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { marginTop: 16, fontSize: 18, color: COLORS.text, textAlign: 'center' },
  errorButton: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },

  kidInfoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    margin: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  kidInfoHeader: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  sportBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  kidInfoText: { flex: 1 },
  kidName: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  kidDetails: { fontSize: 14, color: COLORS.textSecondary },
  assessmentCount: { alignItems: 'center' },
  assessmentCountNumber: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary },
  assessmentCountLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },

  redFlagsSection: { marginHorizontal: 20, marginBottom: 20 },
  improvementsSection: { marginHorizontal: 20, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },

  redFlagCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  redFlagIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  redFlagContent: { flex: 1 },
  redFlagMetric: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  redFlagChange: { fontSize: 13, color: COLORS.error },

  improvementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8F4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  improvementIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  improvementContent: { flex: 1 },
  improvementMetric: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  improvementChange: { fontSize: 13, color: COLORS.success },

  viewModeContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  activeViewMode: { backgroundColor: COLORS.primary },
  viewModeText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  activeViewModeText: { color: COLORS.white },

  chartsSection: { marginHorizontal: 20, marginBottom: 20 },
  detailedChartSection: { marginHorizontal: 20, marginBottom: 20 },
  radarSection: { marginHorizontal: 20, marginBottom: 20 },
  percentileSection: { marginHorizontal: 20, marginBottom: 20 },

  tableSection: { marginHorizontal: 20, marginBottom: 20 },
  tableCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tableHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  tableDate: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  tableMetricsCount: { fontSize: 13, color: COLORS.textSecondary },
  tableMetrics: { gap: 8 },
  tableMetricRow: { flexDirection: 'row', justifyContent: 'space-between' },
  tableMetricName: { fontSize: 14, color: COLORS.text },
  tableMetricValue: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  tableMoreText: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic', marginTop: 4 },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8, marginBottom: 24 },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  bottomPadding: { height: 100 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    marginTop: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Export Modal Styles
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    marginBottom: 12,
  },
  exportOptionText: {
    flex: 1,
    marginLeft: 12,
  },
  exportOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  exportOptionDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // Menu Modal Styles (Small Screen)
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 16,
  },
  menuOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  menuCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
    textAlign: 'center',
  },
});