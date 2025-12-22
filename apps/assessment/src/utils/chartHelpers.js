// Location: /apps/assessment/src/utils/chartHelpers.js
// Chart data formatting and visualization helpers

import { CHART_COLORS, COLORS } from './constants';

/**
 * Format data for line chart (kid progress over time)
 * @param {Array} assessments - Array of assessments sorted by date
 * @param {string} metricId - Metric ID to track
 * @returns {Object} Chart data for react-native-chart-kit
 */
export const formatDataForLineChart = (assessments, metricId) => {
  if (!assessments || assessments.length === 0) {
    return {
      labels: [],
      datasets: [{ data: [] }],
    };
  }

  const labels = [];
  const data = [];

  assessments.forEach(assessment => {
    const result = assessment.results?.find(r => r.metric_id === metricId);
    
    if (result && result.value) {
      // Format date as "MMM DD"
      const date = new Date(assessment.assessment_date);
      const label = `${date.toLocaleDateString('en-US', { month: 'short' })} ${date.getDate()}`;
      
      labels.push(label);
      data.push(parseFloat(result.value));
    }
  });

  return {
    labels,
    datasets: [
      {
        data,
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, // Blue
        strokeWidth: 3,
      },
    ],
  };
};

/**
 * Format data for bar chart (comparison across kids)
 * @param {Array} assessments - Array of assessments with kid info
 * @param {string} metricId - Metric ID to compare
 * @returns {Object} Chart data
 */
export const formatDataForBarChart = (assessments, metricId) => {
  if (!assessments || assessments.length === 0) {
    return {
      labels: [],
      datasets: [{ data: [] }],
    };
  }

  const labels = [];
  const data = [];

  assessments.forEach(assessment => {
    const result = assessment.results?.find(r => r.metric_id === metricId);
    
    if (result && result.value) {
      // Use kid's first name only
      const kidName = assessment.kidName?.split(' ')[0] || 'Unknown';
      labels.push(kidName);
      data.push(parseFloat(result.value));
    }
  });

  return {
    labels,
    datasets: [
      {
        data,
      },
    ],
  };
};

/**
 * Format data for radar chart (multi-metric profile for one kid)
 * @param {Array} results - Assessment results for one kid
 * @param {Array} metrics - Metric definitions
 * @returns {Object} Radar chart data
 */
export const formatDataForRadarChart = (results, metrics) => {
  if (!results || results.length === 0 || !metrics || metrics.length === 0) {
    return {
      labels: [],
      datasets: [{ data: [] }],
    };
  }

  const labels = [];
  const data = [];

  metrics.forEach(metric => {
    const result = results.find(r => r.metric_id === metric.id);
    
    if (result && result.value) {
      labels.push(metric.name);
      
      // Normalize value to 0-100 scale for radar chart
      let normalizedValue = parseFloat(result.value);
      
      if (metric.type === 'rating') {
        // Rating is already 1-10, scale to 0-100
        normalizedValue = normalizedValue * 10;
      } else if (metric.max_value) {
        // Normalize based on max value
        normalizedValue = (normalizedValue / metric.max_value) * 100;
      }
      
      data.push(Math.min(normalizedValue, 100)); // Cap at 100
    }
  });

  return {
    labels,
    datasets: [
      {
        data,
      },
    ],
  };
};

/**
 * Calculate chart colors based on performance values
 * @param {Array} values - Array of numeric values
 * @returns {Array} Array of color strings
 */
export const calculateChartColors = (values) => {
  if (!values || values.length === 0) {
    return [];
  }

  // Calculate percentiles
  const sorted = [...values].sort((a, b) => a - b);
  const p25 = sorted[Math.floor(sorted.length * 0.25)];
  const p50 = sorted[Math.floor(sorted.length * 0.50)];
  const p75 = sorted[Math.floor(sorted.length * 0.75)];

  return values.map(value => {
    if (value >= p75) return COLORS.success;     // Green - Top 25%
    if (value >= p50) return COLORS.info;        // Blue - Above median
    if (value >= p25) return COLORS.warning;     // Orange - Below median
    return COLORS.error;                         // Red - Bottom 25%
  });
};

/**
 * Get chart color by index (for multiple datasets)
 * @param {number} index - Dataset index
 * @returns {string} Color string
 */
export const getChartColor = (index) => {
  return CHART_COLORS[index % CHART_COLORS.length];
};

/**
 * Format data for progress pie chart (completion percentage)
 * @param {number} completed - Number of completed items
 * @param {number} total - Total number of items
 * @returns {Array} Pie chart data
 */
export const formatDataForPieChart = (completed, total) => {
  const remaining = total - completed;
  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return [
    {
      name: `Completed (${completionPercentage}%)`,
      value: completed,
      color: COLORS.success,
      legendFontColor: COLORS.text,
      legendFontSize: 14,
    },
    {
      name: `Remaining (${100 - completionPercentage}%)`,
      value: remaining,
      color: COLORS.backgroundDark,
      legendFontColor: COLORS.textSecondary,
      legendFontSize: 14,
    },
  ];
};

/**
 * Calculate trend line data points
 * @param {Array} values - Y values
 * @returns {Array} Trend line Y values
 */
export const calculateTrendLine = (values) => {
  if (!values || values.length < 2) {
    return values;
  }

  const n = values.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return values.map((_, i) => slope * i + intercept);
};

/**
 * Get performance color based on percentile
 * @param {number} percentile - Percentile value (0-100)
 * @returns {string} Color string
 */
export const getPerformanceColor = (percentile) => {
  if (percentile >= 75) return COLORS.success;
  if (percentile >= 50) return COLORS.info;
  if (percentile >= 25) return COLORS.warning;
  return COLORS.error;
};

/**
 * Format large numbers for display on charts
 * @param {number} value - Numeric value
 * @returns {string} Formatted string
 */
export const formatChartValue = (value) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(1);
};

/**
 * Calculate Y-axis domain (min/max) with padding
 * @param {Array} values - Array of values
 * @param {number} paddingPercent - Padding as percentage (default 10%)
 * @returns {Object} { min, max }
 */
export const calculateYAxisDomain = (values, paddingPercent = 10) => {
  if (!values || values.length === 0) {
    return { min: 0, max: 100 };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const padding = range * (paddingPercent / 100);

  return {
    min: Math.floor(min - padding),
    max: Math.ceil(max + padding),
  };
};

export default {
  formatDataForLineChart,
  formatDataForBarChart,
  formatDataForRadarChart,
  calculateChartColors,
  getChartColor,
  formatDataForPieChart,
  calculateTrendLine,
  getPerformanceColor,
  formatChartValue,
  calculateYAxisDomain,
};