// Location: /apps/assessment/src/utils/calculations.js
// Core calculation logic for rankings, scores, and performance analysis

import { getMetricById, getMetricsByCategory } from '../config/metrics';
import { getBenchmark, getPerformanceRating } from '../config/benchmarks';

/**
 * Calculate composite score for a single assessment
 * @param {Array} results - Array of assessment_results: [{ metric_id, value }, ...]
 * @param {string} sportId - Sport ID (e.g., 'football')
 * @param {string} ageGroup - Kid's age group
 * @param {string} gender - Kid's gender
 * @returns {Object} { totalScore (0-100%), breakdown, percentile }
 */
export const calculateCompositeScore = (results, sportId, ageGroup, gender = null) => {
  if (!results || results.length === 0) {
    return { totalScore: 0, breakdown: {}, percentile: null, metricCount: 0 };
  }

  // Separate results by category
  const sportSpecificResults = [];
  const generalFitnessResults = [];
  let iqValue = null;

  results.forEach(result => {
    const metric = getMetricById(result.metric_id);
    if (!metric) return;

    // 🔧 FIX: Normalize values to 0-10 scale if they're stored as percentages
    let normalizedValue = parseFloat(result.value);
    
    // If value is greater than 10, assume it's stored as percentage (0-100)
    if (normalizedValue > 10) {
      normalizedValue = normalizedValue / 10; // Convert 0-100 to 0-10
    }

    if (metric.category === 'sport_specific') {
      sportSpecificResults.push({ ...result, metric, normalizedValue });
    } else if (metric.category === 'general_fitness') {
      generalFitnessResults.push({ ...result, metric, normalizedValue });
    } else if (metric.category === 'iq') {
      iqValue = normalizedValue;
    }
  });

  // Calculate averages (0-10 scale)
  const sportSpecificAvg = sportSpecificResults.length > 0
    ? sportSpecificResults.reduce((sum, r) => sum + r.normalizedValue, 0) / sportSpecificResults.length
    : 0;

  const generalFitnessAvg = generalFitnessResults.length > 0
    ? calculateGeneralFitnessAverage(generalFitnessResults, ageGroup, gender)
    : 0;

  const iqScore = iqValue || 0;

  // 🔍 DEBUG: Check what values we're getting
  console.log('🔍 SCORE DEBUG:', {
    sportSpecificAvg,
    generalFitnessAvg,
    iqScore,
    sampleSportValue: sportSpecificResults[0]?.value,
    sampleFitnessValue: generalFitnessResults[0]?.value,
  });

  // Calculate weighted score (0-10 scale)
  let weightedScore = 0;
  let totalAvailableWeight = 0;

  if (sportSpecificResults.length > 0) {
    weightedScore += sportSpecificAvg * 0.6;
    totalAvailableWeight += 0.6;
  }

  if (generalFitnessResults.length > 0) {
    weightedScore += generalFitnessAvg * 0.3;
    totalAvailableWeight += 0.3;
  }

  if (iqValue !== null) {
    weightedScore += iqScore * 0.1;
    totalAvailableWeight += 0.1;
  }

  // If not all categories assessed, normalize to full 0-10 scale
  let finalScore = 0;
  if (totalAvailableWeight > 0) {
    if (totalAvailableWeight < 1.0) {
      // Scale up partial score to full range
      finalScore = weightedScore / totalAvailableWeight;
    } else {
      // All categories assessed, use weighted score as-is
      finalScore = weightedScore;
    }
  }

  // Convert to percentage (0-100%)
  let totalScore = Math.round(finalScore * 10);

  // Safety cap at 100%
  totalScore = Math.min(Math.max(totalScore, 0), 100);

  const percentile = scoreToPercentile(totalScore);

  return {
    totalScore, // 0-100 (percentage)
    breakdown: {
      sportSpecific: Math.round(sportSpecificAvg * 10) / 10,
      generalFitness: Math.round(generalFitnessAvg * 10) / 10,
      iq: iqScore,
      sportSpecificCount: sportSpecificResults.length,
      generalFitnessCount: generalFitnessResults.length,
      hasIQ: iqValue !== null,
    },
    percentile,
    metricCount: results.length,
  };
};

/**
 * Calculate general fitness average with normalization
 * (Different metrics have different scales - normalize to 0-10)
 */
const calculateGeneralFitnessAverage = (fitnessResults, ageGroup, gender) => {
  if (fitnessResults.length === 0) return 0;

  let normalizedSum = 0;

  fitnessResults.forEach(result => {
    const { metric, normalizedValue } = result;
    const numericValue = normalizedValue || parseFloat(result.value);

    // Get benchmark for this metric
    const benchmark = getBenchmark(metric.id, ageGroup, gender);

    if (!benchmark) {
      // No benchmark - use normalized value (already 0-10 for ratings)
      normalizedSum += numericValue;
      return;
    }

    // Normalize based on benchmark (convert to 0-10 scale)
    let normalized = 0;

    // Check if lower is better (timed tests)
    const isLowerBetter = metric.id.includes('sprint') || 
                          metric.id.includes('agility') || 
                          metric.id.includes('ttest');

    if (isLowerBetter) {
      // Lower time = better score
      if (numericValue <= benchmark.excellent) {
        normalized = 10;
      } else if (numericValue <= benchmark.good) {
        normalized = 8;
      } else if (numericValue <= benchmark.fair) {
        normalized = 6;
      } else if (numericValue <= benchmark.poor) {
        normalized = 4;
      } else {
        normalized = 2;
      }
    } else {
      // Higher value = better score
      if (numericValue >= benchmark.excellent) {
        normalized = 10;
      } else if (numericValue >= benchmark.good) {
        normalized = 8;
      } else if (numericValue >= benchmark.fair) {
        normalized = 6;
      } else if (numericValue >= benchmark.poor) {
        normalized = 4;
      } else {
        normalized = 2;
      }
    }

    normalizedSum += normalized;
  });

  return normalizedSum / fitnessResults.length;
};

/**
 * Get kid's best sport score (for multi-sport kids)
 * @param {Array} assessments - All assessments for a kid
 * @returns {Object} { bestSport, bestScore, breakdown }
 */
export const getBestSportScore = (assessments, kidData) => {
  if (!assessments || assessments.length === 0) {
    return { bestSport: null, bestScore: 0, breakdown: [] };
  }

  const sportScores = [];

  assessments.forEach(assessment => {
    const score = calculateCompositeScore(
      assessment.results,
      assessment.sport_id,
      kidData.age_group,
      kidData.gender
    );

    sportScores.push({
      sportId: assessment.sport_id,
      score: score.totalScore,
      breakdown: score.breakdown,
      assessmentDate: assessment.assessment_date,
    });
  });

  // Sort by score (highest first)
  sportScores.sort((a, b) => b.score - a.score);

  return {
    bestSport: sportScores[0]?.sportId || null,
    bestScore: sportScores[0]?.score || 0,
    breakdown: sportScores,
  };
};

/**
 * Calculate improvement between two assessments
 * @param {Object} currentAssessment - Latest assessment
 * @param {Object} previousAssessment - Previous assessment
 * @returns {Object} { improvement, percentage, details }
 */
export const calculateImprovement = (currentAssessment, previousAssessment, kidData) => {
  if (!currentAssessment || !previousAssessment) {
    return { improvement: 0, percentage: 0, details: [] };
  }

  const currentScore = calculateCompositeScore(
    currentAssessment.results,
    currentAssessment.sport_id,
    kidData.age_group,
    kidData.gender
  );

  const previousScore = calculateCompositeScore(
    previousAssessment.results,
    previousAssessment.sport_id,
    kidData.age_group,
    kidData.gender
  );

  const improvement = currentScore.totalScore - previousScore.totalScore;
  const percentage = previousScore.totalScore > 0
    ? Math.round((improvement / previousScore.totalScore) * 100)
    : 0;

  // Calculate per-metric improvements
  const details = [];
  currentAssessment.results.forEach(currentResult => {
    const previousResult = previousAssessment.results.find(
      r => r.metric_id === currentResult.metric_id
    );

    if (previousResult) {
      const diff = parseFloat(currentResult.value) - parseFloat(previousResult.value);
      const metric = getMetricById(currentResult.metric_id);

      details.push({
        metricId: currentResult.metric_id,
        metricName: metric?.name || currentResult.metric_id,
        current: parseFloat(currentResult.value),
        previous: parseFloat(previousResult.value),
        change: diff,
        percentageChange: previousResult.value > 0
          ? Math.round((diff / parseFloat(previousResult.value)) * 100)
          : 0,
      });
    }
  });

  return {
    improvement,
    percentage,
    currentScore: currentScore.totalScore,
    previousScore: previousScore.totalScore,
    details,
  };
};

/**
 * Convert score (0-100) to approximate percentile
 */
const scoreToPercentile = (score) => {
  if (score >= 90) return 95;
  if (score >= 80) return 85;
  if (score >= 70) return 75;
  if (score >= 60) return 60;
  if (score >= 50) return 50;
  if (score >= 40) return 35;
  if (score >= 30) return 20;
  return 10;
};

/**
 * Compare kid to age group average
 * @param {number} kidScore - Kid's score
 * @param {Array} ageGroupScores - All scores in age group
 * @returns {Object} { percentile, rank, totalInGroup }
 */
export const compareToAgeGroup = (kidScore, ageGroupScores) => {
  if (!ageGroupScores || ageGroupScores.length === 0) {
    return { percentile: null, rank: null, totalInGroup: 0 };
  }

  // Sort scores descending
  const sorted = [...ageGroupScores].sort((a, b) => b - a);
  const rank = sorted.findIndex(s => s <= kidScore) + 1;
  const percentile = Math.round(((sorted.length - rank + 1) / sorted.length) * 100);

  return {
    percentile,
    rank,
    totalInGroup: sorted.length,
    average: Math.round(sorted.reduce((sum, s) => sum + s, 0) / sorted.length),
  };
};

/**
 * Calculate team/group statistics
 */
export const calculateTeamStats = (assessments, kidsData) => {
  if (!assessments || assessments.length === 0) {
    return {
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      totalKids: 0,
      distribution: {},
    };
  }

  const scores = assessments.map(assessment => {
    const kid = kidsData.find(k => k.id === assessment.kid_id);
    return calculateCompositeScore(
      assessment.results,
      assessment.sport_id,
      kid?.age_group || '10-13',
      kid?.gender
    ).totalScore;
  });

  const averageScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);

  // Score distribution
  const distribution = {
    excellent: scores.filter(s => s >= 80).length,
    good: scores.filter(s => s >= 60 && s < 80).length,
    fair: scores.filter(s => s >= 40 && s < 60).length,
    needsWork: scores.filter(s => s < 40).length,
  };

  return {
    averageScore,
    highestScore,
    lowestScore,
    totalKids: scores.length,
    distribution,
  };
};

export default {
  calculateCompositeScore,
  getBestSportScore,
  calculateImprovement,
  compareToAgeGroup,
  calculateTeamStats,
};