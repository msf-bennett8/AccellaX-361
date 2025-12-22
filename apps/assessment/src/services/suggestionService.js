// Location: /apps/assessment/src/services/suggestionService.js
// Smart Suggestions Service - Phase 6.3
// Predicts next values based on growth curves, benchmarks, and historical data

import { getKidMetricProgress } from '../database/queries';
import { getBenchmark } from '../config/benchmarks';
import { calculateAge, getAgeGroup } from '../utils/dateUtils';

/**
 * Predict next value for a metric based on kid's history
 * @param {string} kidId - Kid ID
 * @param {string} metricId - Metric ID
 * @returns {Object|null} Prediction with value, confidence, and reason
 */
export const predictNextValue = async (kidId, metricId) => {
  try {
    // Get kid's historical data for this metric
    const progress = await getKidMetricProgress(kidId, metricId);

    if (!progress || progress.length === 0) {
      return null; // No history to base prediction on
    }

    // If only 1 assessment, suggest same value
    if (progress.length === 1) {
      return {
        value: progress[0].value,
        confidence: 'low',
        reason: 'Based on previous value (no trend data)',
        source: 'last_value',
      };
    }

    // Calculate trend from last 3 assessments (or all if less than 3)
    const recentProgress = progress.slice(-3);
    const values = recentProgress.map(p => parseFloat(p.value));
    
    // Calculate average improvement rate
    let totalChange = 0;
    for (let i = 1; i < values.length; i++) {
      totalChange += values[i] - values[i - 1];
    }
    const avgChange = totalChange / (values.length - 1);

    // Predict next value
    const lastValue = values[values.length - 1];
    const predictedValue = lastValue + avgChange;

    // Calculate confidence based on consistency of improvements
    const improvements = [];
    for (let i = 1; i < values.length; i++) {
      improvements.push(values[i] - values[i - 1]);
    }
    
    // Standard deviation of improvements
    const mean = improvements.reduce((sum, val) => sum + val, 0) / improvements.length;
    const variance = improvements.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / improvements.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation = higher confidence
    const confidence = stdDev < Math.abs(avgChange) * 0.3 ? 'high' : 
                      stdDev < Math.abs(avgChange) * 0.7 ? 'medium' : 'low';

    // Format prediction
    const improvementPercent = lastValue !== 0 ? Math.round((avgChange / lastValue) * 100) : 0;
    const reason = avgChange > 0 
      ? `Expected ${improvementPercent}% improvement based on trend`
      : avgChange < 0
      ? `Expected ${Math.abs(improvementPercent)}% decline based on trend`
      : 'Stable performance expected';

    return {
      value: Math.round(predictedValue * 10) / 10, // Round to 1 decimal
      confidence,
      reason,
      source: 'growth_curve',
      historicalData: {
        assessmentCount: progress.length,
        recentValues: values,
        avgChange,
        improvementPercent,
      },
    };
  } catch (error) {
    console.error('Error predicting next value:', error);
    return null;
  }
};

/**
 * Suggest weak areas for a kid based on benchmark comparison
 * @param {string} kidId - Kid ID
 * @param {string} sportId - Sport ID
 * @param {string} ageGroup - Kid's age group
 * @param {string} gender - Kid's gender
 * @returns {Array} List of weak metrics with suggestions
 */
export const suggestWeakAreas = async (kidId, sportId, ageGroup, gender) => {
  try {
    // This would need getLastAssessmentForKid from assessmentService
    const assessmentService = await import('./assessmentService');
    const lastAssessment = await assessmentService.getLastAssessmentForKid(kidId, sportId);

    if (!lastAssessment || !lastAssessment.results) {
      return [];
    }

    const weakAreas = [];

    for (const result of lastAssessment.results) {
      const benchmark = getBenchmark(result.metric_id, ageGroup, gender);
      
      if (!benchmark) continue;

      const value = parseFloat(result.value);
      
      // Check if performance is below "good" threshold
      const isLowerBetter = result.metric_id.includes('sprint') || 
                           result.metric_id.includes('agility') || 
                           result.metric_id.includes('ttest');

      let isBelowGood = false;
      if (isLowerBetter) {
        isBelowGood = value > benchmark.good;
      } else {
        isBelowGood = value < benchmark.good;
      }

      if (isBelowGood) {
        // Calculate how much improvement needed
        const targetValue = benchmark.good;
        const improvement = isLowerBetter 
          ? value - targetValue 
          : targetValue - value;
        
        const improvementPercent = Math.abs(Math.round((improvement / value) * 100));

        weakAreas.push({
          metricId: result.metric_id,
          metricName: result.metric_name || result.metric_id,
          currentValue: value,
          targetValue,
          improvement: Math.abs(improvement),
          improvementPercent,
          priority: improvementPercent > 20 ? 'high' : improvementPercent > 10 ? 'medium' : 'low',
          suggestion: `Need ${improvementPercent}% improvement to reach good level`,
        });
      }
    }

    // Sort by priority (high first)
    weakAreas.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return weakAreas;
  } catch (error) {
    console.error('Error suggesting weak areas:', error);
    return [];
  }
};

/**
 * Recommend which tests to assess next based on completeness and priorities
 * @param {string} kidId - Kid ID
 * @param {string} sportId - Sport ID
 * @returns {Array} List of recommended metrics
 */
export const recommendTests = async (kidId, sportId) => {
  try {
    const assessmentService = await import('./assessmentService');
    const metricService = await import('./metricService');
    
    // Get all metrics for sport
    const allMetrics = await metricService.getAllMetricsForSport(sportId);
    
    // Get last assessment
    const lastAssessment = await assessmentService.getLastAssessmentForKid(kidId, sportId);
    
    const assessedMetricIds = lastAssessment?.results?.map(r => r.metric_id) || [];
    
    // Find missing metrics
    const missingMetrics = allMetrics.filter(m => !assessedMetricIds.includes(m.id));

    // Prioritize missing metrics
    const recommendations = missingMetrics.map(metric => ({
      metricId: metric.id,
      metricName: metric.name,
      category: metric.category,
      priority: metric.category === 'general_fitness' ? 'high' : 
               metric.category === 'sport_specific' ? 'medium' : 'low',
      reason: 'Not yet assessed',
    }));

    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    return recommendations;
  } catch (error) {
    console.error('Error recommending tests:', error);
    return [];
  }
};

/**
 * Get benchmark-based target value for improvement
 * @param {string} metricId - Metric ID
 * @param {number} currentValue - Current value
 * @param {string} ageGroup - Age group
 * @param {string} gender - Gender
 * @returns {Object|null} Target suggestion
 */
export const suggestBenchmarkTarget = (metricId, currentValue, ageGroup, gender) => {
  try {
    const benchmark = getBenchmark(metricId, ageGroup, gender);
    
    if (!benchmark) return null;

    const isLowerBetter = metricId.includes('sprint') || 
                         metricId.includes('agility') || 
                         metricId.includes('ttest');

    // Determine current level
    let currentLevel = 'poor';
    if (isLowerBetter) {
      if (currentValue <= benchmark.excellent) currentLevel = 'excellent';
      else if (currentValue <= benchmark.good) currentLevel = 'good';
      else if (currentValue <= benchmark.fair) currentLevel = 'fair';
    } else {
      if (currentValue >= benchmark.excellent) currentLevel = 'excellent';
      else if (currentValue >= benchmark.good) currentLevel = 'good';
      else if (currentValue >= benchmark.fair) currentLevel = 'fair';
    }

    // Suggest next tier target
    let targetLevel = null;
    let targetValue = null;

    if (currentLevel === 'poor') {
      targetLevel = 'fair';
      targetValue = benchmark.fair;
    } else if (currentLevel === 'fair') {
      targetLevel = 'good';
      targetValue = benchmark.good;
    } else if (currentLevel === 'good') {
      targetLevel = 'excellent';
      targetValue = benchmark.excellent;
    }

    if (!targetLevel) {
      return {
        message: 'Already at excellent level!',
        currentLevel: 'excellent',
      };
    }

    const improvement = isLowerBetter 
      ? currentValue - targetValue 
      : targetValue - currentValue;
    
    const improvementPercent = Math.abs(Math.round((improvement / currentValue) * 100));

    return {
      currentValue,
      currentLevel,
      targetLevel,
      targetValue,
      improvement: Math.abs(improvement),
      improvementPercent,
      suggestion: `Aim for ${targetValue} to reach ${targetLevel} level (${improvementPercent}% improvement)`,
    };
  } catch (error) {
    console.error('Error suggesting benchmark target:', error);
    return null;
  }
};

/**
 * Generate smart suggestion text for display in UI
 * @param {Object} prediction - Prediction object from predictNextValue
 * @returns {string} Display text
 */
export const formatSuggestionText = (prediction) => {
  if (!prediction) return '';
  
  const confidenceIcon = 
    prediction.confidence === 'high' ? '🎯' :
    prediction.confidence === 'medium' ? '📊' : '💡';
  
  return `${confidenceIcon} ${prediction.reason}`;
};

export default {
  predictNextValue,
  suggestWeakAreas,
  recommendTests,
  suggestBenchmarkTarget,
  formatSuggestionText,
};