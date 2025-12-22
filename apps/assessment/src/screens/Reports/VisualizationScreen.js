// Location: /apps/assessment/src/screens/Reports/VisualizationScreen.js
// Data visualization dashboard with charts

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { COLORS } from '../../utils/constants';
import {
  formatDataForLineChart,
  formatDataForBarChart,
  formatDataForPieChart,
  getPerformanceColor,
} from '../../utils/chartHelpers';
import { getKidMetricProgress, getMetricAgeGroupStats } from '../../database/queries';

const screenWidth = Dimensions.get('window').width;

export default function VisualizationScreen({ route, navigation }) {
  const { kidId, metricId, sportId, assessments } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('line'); // 'line', 'bar', 'pie'
  const [progressData, setProgressData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [completionData, setCompletionData] = useState(null);

  useEffect(() => {
    loadChartData();
  }, [kidId, metricId]);

  const loadChartData = async () => {
    try {
      setLoading(true);

      // Load kid's progress over time
      if (kidId && metricId) {
        const progress = await getKidMetricProgress(kidId, metricId);
        const lineChartData = formatDataForLineChart(progress, metricId);
        setProgressData(lineChartData);
      }

      // Load comparison data (if assessments provided)
      if (assessments && metricId) {
        const barChartData = formatDataForBarChart(assessments, metricId);
        setComparisonData(barChartData);
      }

      // Load completion pie chart
      if (assessments) {
        const completed = assessments.filter(a => 
          a.results && a.results.length > 0
        ).length;
        const pieData = formatDataForPieChart(completed, assessments.length);
        setCompletionData(pieData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading chart data:', error);
      setLoading(false);
    }
  };

  const chartConfig = {
    backgroundGradientFrom: COLORS.white,
    backgroundGradientTo: COLORS.white,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    strokeWidth: 3,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 1,
    propsForLabels: {
      fontSize: 12,
      fontWeight: '600',
    },
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Data Visualization"
          leftIcon="←"
          onLeftPress={() => navigation.goBack()}
        />
        <LoadingSpinner overlay text="Loading charts..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Data Visualization"
        subtitle="Charts & Analytics"
        leftIcon="←"
        onLeftPress={() => navigation.goBack()}
      />

      {/* Chart Type Selector */}
      <View style={styles.chartTypeSelector}>
        <TouchableOpacity
          style={[styles.chartTypeButton, chartType === 'line' && styles.chartTypeButtonActive]}
          onPress={() => setChartType('line')}
        >
          <Ionicons name="trending-up" size={20} color={chartType === 'line' ? COLORS.white : COLORS.primary} />
          <Text style={[styles.chartTypeText, chartType === 'line' && styles.chartTypeTextActive]}>
            Progress
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chartTypeButton, chartType === 'bar' && styles.chartTypeButtonActive]}
          onPress={() => setChartType('bar')}
        >
          <Ionicons name="bar-chart" size={20} color={chartType === 'bar' ? COLORS.white : COLORS.primary} />
          <Text style={[styles.chartTypeText, chartType === 'bar' && styles.chartTypeTextActive]}>
            Compare
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chartTypeButton, chartType === 'pie' && styles.chartTypeButtonActive]}
          onPress={() => setChartType('pie')}
        >
          <Ionicons name="pie-chart" size={20} color={chartType === 'pie' ? COLORS.white : COLORS.primary} />
          <Text style={[styles.chartTypeText, chartType === 'pie' && styles.chartTypeTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Line Chart - Progress Over Time */}
        {chartType === 'line' && progressData && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Progress Over Time</Text>
            <Text style={styles.chartSubtitle}>Kid performance trend</Text>
            
            {progressData.labels.length > 0 ? (
              <LineChart
                data={progressData}
                width={screenWidth - 40}
                height={250}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withDots={true}
                withInnerLines={true}
                withOuterLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
              />
            ) : (
              <View style={styles.emptyChart}>
                <Ionicons name="analytics-outline" size={48} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>No progress data available</Text>
              </View>
            )}
          </View>
        )}

        {/* Bar Chart - Kid Comparison */}
        {chartType === 'bar' && comparisonData && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Kid Comparison</Text>
            <Text style={styles.chartSubtitle}>Performance across kids</Text>
            
            {comparisonData.labels.length > 0 ? (
              <BarChart
                data={comparisonData}
                width={screenWidth - 40}
                height={250}
                chartConfig={chartConfig}
                style={styles.chart}
                showValuesOnTopOfBars={true}
                fromZero={true}
              />
            ) : (
              <View style={styles.emptyChart}>
                <Ionicons name="people-outline" size={48} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>No comparison data available</Text>
              </View>
            )}
          </View>
        )}

        {/* Pie Chart - Completion Overview */}
        {chartType === 'pie' && completionData && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Completion Overview</Text>
            <Text style={styles.chartSubtitle}>Assessment progress</Text>
            
            <PieChart
              data={completionData}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}

        {/* Statistics Summary */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Statistics Summary</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Ionicons name="trophy" size={24} color={COLORS.success} />
              <Text style={styles.statValue}>8.5</Text>
              <Text style={styles.statLabel}>Average</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="trending-up" size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>+12%</Text>
              <Text style={styles.statLabel}>Improvement</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="medal" size={24} color={COLORS.warning} />
              <Text style={styles.statValue}>75th</Text>
              <Text style={styles.statLabel}>Percentile</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="calendar" size={24} color={COLORS.info} />
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Assessments</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  chartTypeSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chartTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  chartTypeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  chartTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  chartTypeTextActive: {
    color: COLORS.white,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  emptyChart: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 8,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.backgroundDark,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});