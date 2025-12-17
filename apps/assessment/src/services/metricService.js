// Location: /apps/assessment/src/services/metricService.js
// Metric Management Service for AccellaX 361° Assessment App

import {
  getMetricsBySport,
  getMetricsByCategory,
  insertMetric,
  updateMetric,
  deleteMetric,
} from '../database/db';
import {
  GENERAL_FITNESS_METRICS,
  SPORT_METRICS_MAP,
  getMetricById,
  validateMetricValue,
} from '../config/metrics';

/**
 * Get all metrics for a sport (including general fitness)
 * @param {string} sportId - Sport ID
 * @returns {Array} All metrics for sport
 */
export const getAllMetricsForSport = async (sportId) => {
  try {
    // Special handling for 'fitness' - return only general fitness metrics
    if (sportId === 'fitness' || sportId === 'general') {
      return GENERAL_FITNESS_METRICS.map(m => ({
        ...m,
        sport_id: 'fitness',
      }));
    }
    
    // Get sport-specific metrics from database
    const sportMetrics = await getMetricsBySport(sportId);
    
    // Add general fitness metrics
    const generalMetrics = GENERAL_FITNESS_METRICS.map(m => ({
      ...m,
      sport_id: sportId,
    }));
    
    return [...generalMetrics, ...sportMetrics];
  } catch (error) {
    console.error(`Error getting metrics for sport ${sportId}:`, error);
    return [];
  }
};

/**
 * Get metrics by category for a sport
 * @param {string} sportId - Sport ID
 * @param {string} category - Category ('general_fitness', 'sport_specific', 'iq')
 * @returns {Array} Filtered metrics
 */
export const getMetricsByType = async (sportId, category) => {
  try {
    if (sportId === 'fitness' || sportId === 'general') {
      return GENERAL_FITNESS_METRICS.filter(m => m.category === category);
    }
    
    if (category === 'general_fitness') {
      return GENERAL_FITNESS_METRICS;
    }
    
    return await getMetricsByCategory(sportId, category);
  } catch (error) {
    console.error(`Error getting metrics by category ${category}:`, error);
    return [];
  }
};

/**
 * Get general fitness metrics (universal across all sports)
 * @returns {Array} General fitness metrics
 */
export const getGeneralFitnessMetrics = () => {
  return GENERAL_FITNESS_METRICS;
};

/**
 * Get sport-specific metrics only
 * @param {string} sportId - Sport ID
 * @returns {Array} Sport-specific metrics
 */
export const getSportSpecificMetrics = async (sportId) => {
  try {
    if (sportId === 'fitness' || sportId === 'general') {
      return []; // No sport-specific metrics for general fitness
    }
    
    return await getMetricsByCategory(sportId, 'sport_specific');
  } catch (error) {
    console.error(`Error getting sport-specific metrics for ${sportId}:`, error);
    return [];
  }
};

/**
 * Get IQ metrics for a sport
 * @param {string} sportId - Sport ID
 * @returns {Array} IQ metrics
 */
export const getIQMetrics = async (sportId) => {
  try {
    if (sportId === 'fitness' || sportId === 'general') {
      return []; // No IQ metrics for general fitness
    }
    
    return await getMetricsByCategory(sportId, 'iq');
  } catch (error) {
    console.error(`Error getting IQ metrics for ${sportId}:`, error);
    return [];
  }
};

/**
 * Get metric details by ID
 * @param {string} metricId - Metric ID
 * @returns {Object|null} Metric details
 */
export const getMetricDetails = (metricId) => {
  return getMetricById(metricId);
};

/**
 * Validate a metric value
 * @param {string} metricId - Metric ID
 * @param {number} value - Value to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validateValue = (metricId, value) => {
  const metric = getMetricById(metricId);
  if (!metric) {
    return { valid: false, error: 'Metric not found' };
  }
  
  return validateMetricValue(metric, value);
};

/**
 * Create a custom metric
 * @param {Object} metricData - Metric data
 * @param {string} userId - User ID
 * @returns {Object} Created metric
 */
export const createCustomMetric = async (metricData, userId) => {
  try {
    const metric = await insertMetric(metricData, userId);
    console.log('✅ Custom metric created:', metric.name);
    return metric;
  } catch (error) {
    console.error('Error creating custom metric:', error);
    throw error;
  }
};

/**
 * Update an existing metric
 * @param {string} metricId - Metric ID
 * @param {Object} updates - Updates to apply
 * @returns {boolean} Success status
 */
export const modifyMetric = async (metricId, updates) => {
  try {
    await updateMetric(metricId, updates);
    console.log('✅ Metric updated:', metricId);
    return true;
  } catch (error) {
    console.error('Error updating metric:', error);
    throw error;
  }
};

/**
 * Delete a custom metric
 * @param {string} metricId - Metric ID
 * @returns {boolean} Success status
 */
export const removeMetric = async (metricId) => {
  try {
    await deleteMetric(metricId);
    console.log('✅ Metric deleted:', metricId);
    return true;
  } catch (error) {
    console.error('Error deleting metric:', error);
    throw error;
  }
};

/**
 * Format metric value for display
 * @param {Object} metric - Metric object
 * @param {number} value - Value
 * @returns {string} Formatted value string
 */
export const formatMetricValue = (metric, value) => {
  if (!metric || value === null || value === undefined) {
    return 'N/A';
  }
  
  const formattedValue = typeof value === 'number' ? value.toFixed(1) : value;
  
  if (metric.unit) {
    return `${formattedValue} ${metric.unit}`;
  }
  
  return formattedValue.toString();
};

/**
 * Get metric input type for UI
 * @param {Object} metric - Metric object
 * @returns {string} Input type ('numeric', 'rating', 'timed', 'counted')
 */
export const getMetricInputType = (metric) => {
  return metric?.type || 'numeric';
};

/**
 * Get metric unit
 * @param {string} metricId - Metric ID
 * @returns {string|null} Unit string
 */
export const getMetricUnit = (metricId) => {
  const metric = getMetricById(metricId);
  return metric?.unit || null;
};

/**
 * Check if metric is a default metric
 * @param {string} metricId - Metric ID
 * @returns {boolean} Is default metric
 */
export const isDefaultMetric = (metricId) => {
  const metric = getMetricById(metricId);
  return metric?.isDefault === true;
};

/**
 * Get metric category label
 * @param {string} category - Category ID
 * @returns {string} Human-readable category label
 */
export const getCategoryLabel = (category) => {
  const labels = {
    general_fitness: 'General Fitness',
    sport_specific: 'Sport-Specific Skills',
    iq: 'Game Intelligence',
  };
  
  return labels[category] || category;
};

/**
 * Group metrics by category
 * @param {Array} metrics - Array of metrics
 * @returns {Object} Metrics grouped by category
 */
export const groupMetricsByCategory = (metrics) => {
  return metrics.reduce((grouped, metric) => {
    const category = metric.category || 'other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(metric);
    return grouped;
  }, {});
};

/**
 * Sort metrics by display order
 * @param {Array} metrics - Array of metrics
 * @returns {Array} Sorted metrics
 */
export const sortMetricsByOrder = (metrics) => {
  return [...metrics].sort((a, b) => {
    const orderA = a.display_order || 0;
    const orderB = b.display_order || 0;
    return orderA - orderB;
  });
};

export default {
  getAllMetricsForSport,
  getMetricsByType,
  getGeneralFitnessMetrics,
  getSportSpecificMetrics,
  getIQMetrics,
  getMetricDetails,
  validateValue,
  createCustomMetric,
  modifyMetric,
  removeMetric,
  formatMetricValue,
  getMetricInputType,
  getMetricUnit,
  isDefaultMetric,
  getCategoryLabel,
  groupMetricsByCategory,
  sortMetricsByOrder,
};