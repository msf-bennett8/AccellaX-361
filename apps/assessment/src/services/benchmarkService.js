// Location: /apps/assessment/src/services/benchmarkService.js
// Service for retrieving and managing benchmarks

import { 
  getBenchmark, 
  getPerformanceRating, 
  getBenchmarksByAgeGroup,
  getBenchmarksByMetric,
  ALL_BENCHMARKS 
} from '../config/benchmarks';

/**
 * Get benchmark for a specific metric, age group, and gender
 * @param {string} metricId - Metric ID
 * @param {string} ageGroup - Age group
 * @param {string} gender - Gender ('male', 'female', or null)
 * @returns {Object|null} Benchmark object
 */
export const getBenchmarkForMetric = (metricId, ageGroup, gender = null) => {
  return getBenchmark(metricId, ageGroup, gender);
};

/**
 * Get performance rating and color for a metric value
 * @param {string} metricId - Metric ID
 * @param {string} ageGroup - Age group
 * @param {string} gender - Gender
 * @param {number} value - Measured value
 * @returns {Object} { rating, color, percentile }
 */
export const getMetricPerformanceRating = (metricId, ageGroup, gender, value) => {
  return getPerformanceRating(metricId, ageGroup, gender, value);
};

/**
 * Get all benchmarks for an age group
 * @param {string} ageGroup - Age group
 * @returns {Array} Array of benchmarks
 */
export const getAgeGroupBenchmarks = (ageGroup) => {
  return getBenchmarksByAgeGroup(ageGroup);
};

/**
 * Get all benchmarks for a specific metric
 * @param {string} metricId - Metric ID
 * @returns {Array} Array of benchmarks for all age groups
 */
export const getMetricBenchmarks = (metricId) => {
  return getBenchmarksByMetric(metricId);
};

/**
 * Check if a kid's performance meets or exceeds benchmark
 * @param {string} metricId - Metric ID
 * @param {string} ageGroup - Age group
 * @param {string} gender - Gender
 * @param {number} value - Measured value
 * @param {string} threshold - 'excellent', 'good', 'fair', or 'poor'
 * @returns {boolean} True if meets/exceeds threshold
 */
export const meetsThreshold = (metricId, ageGroup, gender, value, threshold = 'good') => {
  const benchmark = getBenchmark(metricId, ageGroup, gender);
  if (!benchmark) return false;

  const isLowerBetter = metricId.includes('sprint') || 
                        metricId.includes('agility') || 
                        metricId.includes('ttest');

  const thresholdValue = benchmark[threshold];
  if (thresholdValue === undefined) return false;

  if (isLowerBetter) {
    return value <= thresholdValue;
  }
  return value >= thresholdValue;
};

/**
 * Get benchmark suggestions for improvement
 * @param {string} metricId - Metric ID
 * @param {string} ageGroup - Age group
 * @param {string} gender - Gender
 * @param {number} currentValue - Current measured value
 * @returns {Object} Suggestions for next tier
 */
export const getImprovementTarget = (metricId, ageGroup, gender, currentValue) => {
  const benchmark = getBenchmark(metricId, ageGroup, gender);
  if (!benchmark) return null;

  const rating = getPerformanceRating(metricId, ageGroup, gender, currentValue);
  
  const isLowerBetter = metricId.includes('sprint') || 
                        metricId.includes('agility') || 
                        metricId.includes('ttest');

  let nextTier = null;
  let targetValue = null;
  let improvement = null;

  if (rating.rating === 'poor') {
    nextTier = 'fair';
    targetValue = benchmark.fair;
  } else if (rating.rating === 'fair') {
    nextTier = 'good';
    targetValue = benchmark.good;
  } else if (rating.rating === 'good') {
    nextTier = 'excellent';
    targetValue = benchmark.excellent;
  } else {
    return { message: 'Already at excellent level!', currentValue };
  }

  if (isLowerBetter) {
    improvement = currentValue - targetValue;
  } else {
    improvement = targetValue - currentValue;
  }

  return {
    currentValue,
    currentTier: rating.rating,
    nextTier,
    targetValue,
    improvement,
    isLowerBetter,
    percentageImprovement: Math.abs(Math.round((improvement / currentValue) * 100)),
  };
};

/**
 * Get all available benchmarks
 * @returns {Array} All benchmarks
 */
export const getAllBenchmarks = () => {
  return ALL_BENCHMARKS;
};

/**
 * Format benchmark for display in UI
 * @param {Object} benchmark - Benchmark object
 * @returns {Object} Formatted benchmark
 */
export const formatBenchmarkForDisplay = (benchmark) => {
  if (!benchmark) return null;

  return {
    metricId: benchmark.metricId,
    ageGroup: benchmark.ageGroup,
    gender: benchmark.gender || 'All',
    thresholds: {
      excellent: `${benchmark.excellent}+`,
      good: `${benchmark.good} - ${benchmark.excellent}`,
      fair: `${benchmark.fair} - ${benchmark.good}`,
      poor: `< ${benchmark.fair}`,
    },
    source: benchmark.source,
  };
};

export default {
  getBenchmarkForMetric,
  getMetricPerformanceRating,
  getAgeGroupBenchmarks,
  getMetricBenchmarks,
  meetsThreshold,
  getImprovementTarget,
  getAllBenchmarks,
  formatBenchmarkForDisplay,
};