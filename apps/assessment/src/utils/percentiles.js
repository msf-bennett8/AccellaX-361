// Location: /apps/assessment/src/utils/percentiles.js
// Percentile calculations and age group comparisons

/**
 * Calculate percentile rank within a dataset
 * @param {number} value - Kid's value
 * @param {Array} dataset - All values in comparison group
 * @param {boolean} higherIsBetter - If true, higher values = higher percentile
 * @returns {number} Percentile (0-100)
 */
export const calculatePercentile = (value, dataset, higherIsBetter = true) => {
  if (!dataset || dataset.length === 0) return null;
  if (value === null || value === undefined) return null;

  const sorted = [...dataset].sort((a, b) => higherIsBetter ? a - b : b - a);
  const rank = sorted.filter(v => v < value).length;
  const percentile = Math.round((rank / sorted.length) * 100);

  return Math.min(100, Math.max(0, percentile));
};

/**
 * Get percentile rank for a kid's score within their age group
 * @param {number} kidScore - Kid's composite score
 * @param {string} ageGroup - Age group (e.g., '10-13')
 * @param {Array} allScores - All scores with age_group property
 * @returns {number} Percentile rank
 */
export const getAgeGroupPercentile = (kidScore, ageGroup, allScores) => {
  if (!allScores || allScores.length === 0) return null;

  // Filter scores for same age group
  const ageGroupScores = allScores
    .filter(score => score.age_group === ageGroup)
    .map(score => score.totalScore);

  return calculatePercentile(kidScore, ageGroupScores, true);
};

/**
 * Get percentile rank for a specific metric
 * @param {number} metricValue - Kid's metric value
 * @param {string} metricId - Metric ID
 * @param {string} ageGroup - Age group
 * @param {Array} allMetricValues - All values for this metric in age group
 * @returns {number} Percentile rank
 */
export const getMetricPercentile = (metricValue, metricId, ageGroup, allMetricValues) => {
  if (!allMetricValues || allMetricValues.length === 0) return null;

  // Determine if higher is better
  const isLowerBetter = metricId.includes('sprint') || 
                        metricId.includes('agility') || 
                        metricId.includes('ttest');

  return calculatePercentile(metricValue, allMetricValues, !isLowerBetter);
};

/**
 * Get percentile category label
 * @param {number} percentile - Percentile value (0-100)
 * @returns {Object} { label, color, description }
 */
export const getPercentileCategory = (percentile) => {
  if (percentile === null || percentile === undefined) {
    return { label: 'Unknown', color: '#9E9E9E', description: 'No data available' };
  }

  if (percentile >= 90) {
    return { label: 'Elite', color: '#FFD700', description: 'Top 10%' };
  }
  if (percentile >= 75) {
    return { label: 'Excellent', color: '#4CAF50', description: 'Top 25%' };
  }
  if (percentile >= 50) {
    return { label: 'Good', color: '#2196F3', description: 'Above Average' };
  }
  if (percentile >= 25) {
    return { label: 'Fair', color: '#FF9800', description: 'Below Average' };
  }
  return { label: 'Needs Work', color: '#F44336', description: 'Bottom 25%' };
};

/**
 * Calculate z-score (standard deviations from mean)
 * @param {number} value - Kid's value
 * @param {number} mean - Group mean
 * @param {number} stdDev - Standard deviation
 * @returns {number} Z-score
 */
export const calculateZScore = (value, mean, stdDev) => {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
};

/**
 * Calculate mean and standard deviation of dataset
 * @param {Array} dataset - Array of numbers
 * @returns {Object} { mean, stdDev }
 */
export const calculateStats = (dataset) => {
  if (!dataset || dataset.length === 0) {
    return { mean: 0, stdDev: 0 };
  }

  const mean = dataset.reduce((sum, val) => sum + val, 0) / dataset.length;
  const variance = dataset.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dataset.length;
  const stdDev = Math.sqrt(variance);

  return {
    mean: Math.round(mean * 10) / 10,
    stdDev: Math.round(stdDev * 10) / 10,
    min: Math.min(...dataset),
    max: Math.max(...dataset),
    median: calculateMedian(dataset),
  };
};

/**
 * Calculate median of dataset
 */
const calculateMedian = (dataset) => {
  const sorted = [...dataset].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

/**
 * Get age group distribution
 * @param {Array} scores - All scores with age_group
 * @returns {Object} Distribution by age group
 */
export const getAgeGroupDistribution = (scores) => {
  const distribution = {
    '4-6': [],
    '7-9': [],
    '10-13': [],
    '13+': [],
  };

  scores.forEach(score => {
    if (distribution[score.age_group]) {
      distribution[score.age_group].push(score.totalScore);
    }
  });

  // Calculate stats for each age group
  const stats = {};
  Object.keys(distribution).forEach(ageGroup => {
    stats[ageGroup] = calculateStats(distribution[ageGroup]);
  });

  return stats;
};

/**
 * Compare kid to peers (same age group, same sport)
 * @param {Object} kidData - Kid's score data
 * @param {Array} peerData - All peer scores
 * @returns {Object} Comparison results
 */
export const compareToPeers = (kidData, peerData) => {
  if (!peerData || peerData.length === 0) {
    return {
      percentile: null,
      rank: null,
      totalPeers: 0,
      betterThan: 0,
      worseThan: 0,
    };
  }

  const percentile = calculatePercentile(kidData.score, peerData.map(p => p.score), true);
  const rank = peerData.filter(p => p.score > kidData.score).length + 1;
  const betterThan = peerData.filter(p => p.score < kidData.score).length;
  const worseThan = peerData.length - betterThan - 1; // Exclude self

  return {
    percentile,
    rank,
    totalPeers: peerData.length,
    betterThan,
    worseThan,
    percentageBetter: Math.round((betterThan / peerData.length) * 100),
  };
};

export default {
  calculatePercentile,
  getAgeGroupPercentile,
  getMetricPercentile,
  getPercentileCategory,
  calculateZScore,
  calculateStats,
  getAgeGroupDistribution,
  compareToPeers,
};