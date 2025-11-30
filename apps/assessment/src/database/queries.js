// Location: /apps/assessment/src/database/queries.js
// Complex reusable queries for AccellaX 361° Assessment App

import { getDatabase } from './db';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWeb = Platform.OS === 'web';
const FIXED_ACADEMY_ID = 'academy_accellax361_main';

// ========== HELPER: Get Web Database ==========

const getWebDB = async () => {
  const data = await AsyncStorage.getItem('assessmentWebDB');
  return data ? JSON.parse(data) : {
    users: [],
    kids: [],
    sports: [],
    metrics: [],
    assessments: [],
    assessment_results: [],
    benchmarks: [],
    goals: [],
    notes: [],
  };
};

// ========== ASSESSMENT QUERIES ==========

/**
 * Get full assessment data with all relationships
 * @param {string} assessmentId - Assessment ID
 * @returns {Object} Assessment with kid, sport, results, and metrics
 */
export const getFullAssessmentData = async (assessmentId) => {
  if (isWeb) {
    const webDB = await getWebDB();
    
    const assessment = webDB.assessments?.find(a => a.id === assessmentId);
    if (!assessment) return null;
    
    const kid = webDB.kids?.find(k => k.id === assessment.kid_id);
    const sport = webDB.sports?.find(s => s.id === assessment.sport_id);
    const results = webDB.assessment_results?.filter(r => r.assessment_id === assessmentId) || [];
    
    const resultsWithMetrics = results.map(result => {
      const metric = webDB.metrics?.find(m => m.id === result.metric_id);
      return { ...result, metric };
    });
    
    return {
      ...assessment,
      kid,
      sport,
      results: resultsWithMetrics,
    };
  }
  
  const db = getDatabase();
  
  const assessment = await db.getFirstAsync(
    'SELECT * FROM assessments WHERE id = ?',
    [assessmentId]
  );
  
  if (!assessment) return null;
  
  const kid = await db.getFirstAsync(
    'SELECT * FROM kids WHERE id = ?',
    [assessment.kid_id]
  );
  
  const sport = await db.getFirstAsync(
    'SELECT * FROM sports WHERE id = ?',
    [assessment.sport_id]
  );
  
  const results = await db.getAllAsync(
    `SELECT ar.*, 
            m.name as metric_name, 
            m.category, 
            m.type, 
            m.unit,
            m.display_order
     FROM assessment_results ar
     JOIN metrics m ON ar.metric_id = m.id
     WHERE ar.assessment_id = ?
     ORDER BY m.category, m.display_order`,
    [assessmentId]
  );
  
  return {
    ...assessment,
    kid,
    sport,
    results,
  };
};

/**
 * Get kid's assessment history
 * @param {string} kidId - Kid ID
 * @param {string} sportId - Optional sport filter
 * @returns {Array} List of assessments with summary data
 */
export const getKidAssessmentHistory = async (kidId, sportId = null) => {
  if (isWeb) {
    const webDB = await getWebDB();
    
    let assessments = webDB.assessments?.filter(a => a.kid_id === kidId) || [];
    
    if (sportId) {
      assessments = assessments.filter(a => a.sport_id === sportId);
    }
    
    assessments.sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date));
    
    return assessments.map(assessment => {
      const sport = webDB.sports?.find(s => s.id === assessment.sport_id);
      const resultCount = webDB.assessment_results?.filter(r => r.assessment_id === assessment.id).length || 0;
      
      return {
        ...assessment,
        sport,
        resultCount,
      };
    });
  }
  
  const db = getDatabase();
  
  const query = sportId
    ? `SELECT a.*, 
              s.name as sport_name, 
              s.icon as sport_icon,
              COUNT(ar.id) as result_count
       FROM assessments a
       JOIN sports s ON a.sport_id = s.id
       LEFT JOIN assessment_results ar ON a.id = ar.assessment_id
       WHERE a.kid_id = ? AND a.sport_id = ?
       GROUP BY a.id
       ORDER BY a.assessment_date DESC`
    : `SELECT a.*, 
              s.name as sport_name, 
              s.icon as sport_icon,
              COUNT(ar.id) as result_count
       FROM assessments a
       JOIN sports s ON a.sport_id = s.id
       LEFT JOIN assessment_results ar ON a.id = ar.assessment_id
       WHERE a.kid_id = ?
       GROUP BY a.id
       ORDER BY a.assessment_date DESC`;
  
  const params = sportId ? [kidId, sportId] : [kidId];
  
  return await db.getAllAsync(query, params);
};

/**
 * Detect red flags (performance drops > 15%)
 * @param {string} kidId - Kid ID
 * @param {string} sportId - Optional sport filter
 * @returns {Array} Metrics with significant performance drops
 */
export const getRedFlags = async (kidId, sportId = null) => {
  if (isWeb) {
    const webDB = await getWebDB();
    
    const redFlags = [];
    
    let assessments = webDB.assessments?.filter(a => a.kid_id === kidId) || [];
    
    if (sportId) {
      assessments = assessments.filter(a => a.sport_id === sportId);
    }
    
    assessments.sort((a, b) => new Date(a.assessment_date) - new Date(b.assessment_date));
    
    if (assessments.length < 2) {
      return []; // Need at least 2 assessments to compare
    }
    
    const latestAssessment = assessments[assessments.length - 1];
    const previousAssessment = assessments[assessments.length - 2];
    
    const latestResults = webDB.assessment_results?.filter(r => 
      r.assessment_id === latestAssessment.id
    ) || [];
    
    const previousResults = webDB.assessment_results?.filter(r => 
      r.assessment_id === previousAssessment.id
    ) || [];
    
    for (const latestResult of latestResults) {
      const previousResult = previousResults.find(r => r.metric_id === latestResult.metric_id);
      
      if (previousResult) {
        const percentageChange = ((latestResult.value - previousResult.value) / previousResult.value) * 100;
        
        // Flag if drop is > 15%
        if (percentageChange < -15) {
          const metric = webDB.metrics?.find(m => m.id === latestResult.metric_id);
          
          redFlags.push({
            metric_id: latestResult.metric_id,
            metric_name: metric?.name,
            metric_unit: metric?.unit,
            previous_value: previousResult.value,
            latest_value: latestResult.value,
            percentage_change: percentageChange.toFixed(1),
            previous_date: previousAssessment.assessment_date,
            latest_date: latestAssessment.assessment_date,
          });
        }
      }
    }
    
    return redFlags;
  }
  
  const db = getDatabase();
  
  const query = sportId
    ? `WITH latest_two AS (
         SELECT a.id, a.assessment_date, a.sport_id
         FROM assessments a
         WHERE a.kid_id = ? AND a.sport_id = ?
         ORDER BY a.assessment_date DESC
         LIMIT 2
       ),
       latest AS (SELECT * FROM latest_two ORDER BY assessment_date DESC LIMIT 1),
       previous AS (SELECT * FROM latest_two ORDER BY assessment_date ASC LIMIT 1)
       SELECT 
         m.id as metric_id,
         m.name as metric_name,
         m.unit as metric_unit,
         ar_prev.value as previous_value,
         ar_latest.value as latest_value,
         ((ar_latest.value - ar_prev.value) / ar_prev.value * 100) as percentage_change,
         prev.assessment_date as previous_date,
         latest.assessment_date as latest_date
       FROM metrics m
       JOIN assessment_results ar_prev ON m.id = ar_prev.metric_id
       JOIN assessment_results ar_latest ON m.id = ar_latest.metric_id
       JOIN previous prev ON ar_prev.assessment_id = prev.id
       JOIN latest ON ar_latest.assessment_id = latest.id
       WHERE ((ar_latest.value - ar_prev.value) / ar_prev.value * 100) < -15
       ORDER BY percentage_change ASC`
    : `WITH latest_two AS (
         SELECT a.id, a.assessment_date
         FROM assessments a
         WHERE a.kid_id = ?
         ORDER BY a.assessment_date DESC
         LIMIT 2
       ),
       latest AS (SELECT * FROM latest_two ORDER BY assessment_date DESC LIMIT 1),
       previous AS (SELECT * FROM latest_two ORDER BY assessment_date ASC LIMIT 1)
       SELECT 
         m.id as metric_id,
         m.name as metric_name,
         m.unit as metric_unit,
         ar_prev.value as previous_value,
         ar_latest.value as latest_value,
         ((ar_latest.value - ar_prev.value) / ar_prev.value * 100) as percentage_change,
         prev.assessment_date as previous_date,
         latest.assessment_date as latest_date
       FROM metrics m
       JOIN assessment_results ar_prev ON m.id = ar_prev.metric_id
       JOIN assessment_results ar_latest ON m.id = ar_latest.metric_id
       JOIN previous prev ON ar_prev.assessment_id = prev.id
       JOIN latest ON ar_latest.assessment_id = latest.id
       WHERE ((ar_latest.value - ar_prev.value) / ar_prev.value * 100) < -15
       ORDER BY percentage_change ASC`;
  
  const params = sportId ? [kidId, sportId] : [kidId];
  
  return await db.getAllAsync(query, params);
};

/**
 * Get team leaderboard with filters
 * @param {string} metricId - Metric ID
 * @param {string} ageGroup - Optional age group filter
 * @param {string} filterType - Optional kid type filter (SC, SP, ELT, WW)
 * @param {number} limit - Number of top performers (default 10)
 * @returns {Array} Top performers with filters applied
 */
export const getTeamLeaderboard = async (metricId, ageGroup = null, filterType = 'all', limit = 10) => {
  if (isWeb) {
    const webDB = await getWebDB();
    
    let kids = webDB.kids?.filter(k => k.status === 'active') || [];
    
    // Apply age group filter
    if (ageGroup) {
      kids = kids.filter(k => k.age_group === ageGroup);
    }
    
    // Apply kid type filter
    if (filterType !== 'all') {
      if (filterType === 'SC' || filterType === 'SP') {
        kids = kids.filter(k => k.sponsorshipType === filterType);
      } else if (filterType === 'ELT' || filterType === 'WW') {
        kids = kids.filter(k => k.programType === filterType);
      }
    }
    
    const leaderboard = [];
    
    for (const kid of kids) {
      const assessments = webDB.assessments?.filter(a => a.kid_id === kid.id) || [];
      const latestAssessment = assessments.sort((a, b) => 
        new Date(b.assessment_date) - new Date(a.assessment_date)
      )[0];
      
      if (latestAssessment) {
        const result = webDB.assessment_results?.find(r => 
          r.assessment_id === latestAssessment.id && r.metric_id === metricId
        );
        
        if (result) {
          leaderboard.push({
            kid_id: kid.id,
            kid_name: kid.name,
            age: kid.age,
            age_group: kid.age_group,
            sponsorshipType: kid.sponsorshipType,
            programType: kid.programType,
            value: result.value,
            percentile: result.percentile,
            assessment_date: latestAssessment.assessment_date,
          });
        }
      }
    }
    
    leaderboard.sort((a, b) => b.value - a.value);
    
    return leaderboard.slice(0, limit);
  }
  
  const db = getDatabase();
  
  let query = `SELECT k.id as kid_id,
                      k.name as kid_name,
                      k.age,
                      k.age_group,
                      k.sponsorshipType,
                      k.programType,
                      ar.value,
                      ar.percentile,
                      a.assessment_date
               FROM kids k
               JOIN assessments a ON k.id = a.kid_id
               JOIN assessment_results ar ON a.id = ar.assessment_id
               WHERE k.status = 'active'
               AND ar.metric_id = ?`;
  
  const params = [metricId];
  
  if (ageGroup) {
    query += ` AND k.age_group = ?`;
    params.push(ageGroup);
  }
  
  if (filterType !== 'all') {
    if (filterType === 'SC' || filterType === 'SP') {
      query += ` AND k.sponsorshipType = ?`;
      params.push(filterType);
    } else if (filterType === 'ELT' || filterType === 'WW') {
      query += ` AND k.programType = ?`;
      params.push(filterType);
    }
  }
  
  query += ` AND a.assessment_date = (
               SELECT MAX(a2.assessment_date)
               FROM assessments a2
               WHERE a2.kid_id = k.id
             )
             ORDER BY ar.value DESC
             LIMIT ?`;
  
  params.push(limit);
  
  return await db.getAllAsync(query, params);
};

/**
 * Get most improved kids for a metric
 * @param {string} metricId - Metric ID
 * @param {string} ageGroup - Optional age group filter
 * @param {number} limit - Number of top improved kids (default 10)
 * @returns {Array} Most improved kids
 */
export const getMostImprovedKids = async (metricId, ageGroup = null, limit = 10) => {
  if (isWeb) {
    const webDB = await getWebDB();
    
    let kids = webDB.kids?.filter(k => k.status === 'active') || [];
    
    if (ageGroup) {
      kids = kids.filter(k => k.age_group === ageGroup);
    }
    
    const improvements = [];
    
    for (const kid of kids) {
      const progress = await getKidMetricProgress(kid.id, metricId);
      
      if (progress.length >= 2) {
        const first = progress[0].value;
        const last = progress[progress.length - 1].value;
        const improvementValue = last - first;
        const improvementPercentage = ((improvementValue / first) * 100).toFixed(1);
        
        if (improvementValue > 0) {
          improvements.push({
            kid_id: kid.id,
            kid_name: kid.name,
            age_group: kid.age_group,
            first_value: first,
            latest_value: last,
            improvement: improvementValue,
            improvement_percentage: parseFloat(improvementPercentage),
            assessments_count: progress.length,
          });
        }
      }
    }
    
    improvements.sort((a, b) => b.improvement_percentage - a.improvement_percentage);
    
    return improvements.slice(0, limit);
  }
  
  const db = getDatabase();
  
  const query = ageGroup
    ? `WITH kid_progress AS (
         SELECT 
           k.id as kid_id,
           k.name as kid_name,
           k.age_group,
           MIN(ar.value) as first_value,
           MAX(ar.value) as latest_value,
           COUNT(DISTINCT a.id) as assessments_count
         FROM kids k
         JOIN assessments a ON k.id = a.kid_id
         JOIN assessment_results ar ON a.id = ar.assessment_id
         WHERE k.status = 'active'
         AND k.age_group = ?
         AND ar.metric_id = ?
         GROUP BY k.id
         HAVING assessments_count >= 2
       )
       SELECT 
         *,
         (latest_value - first_value) as improvement,
         ((latest_value - first_value) / first_value * 100) as improvement_percentage
       FROM kid_progress
       WHERE improvement > 0
       ORDER BY improvement_percentage DESC
       LIMIT ?`
    : `WITH kid_progress AS (
         SELECT 
           k.id as kid_id,
           k.name as kid_name,
           k.age_group,
           MIN(ar.value) as first_value,
           MAX(ar.value) as latest_value,
           COUNT(DISTINCT a.id) as assessments_count
         FROM kids k
         JOIN assessments a ON k.id = a.kid_id
         JOIN assessment_results ar ON a.id = ar.assessment_id
         WHERE k.status = 'active'
         AND ar.metric_id = ?
         GROUP BY k.id
         HAVING assessments_count >= 2
       )
       SELECT 
         *,
         (latest_value - first_value) as improvement,
         ((latest_value - first_value) / first_value * 100) as improvement_percentage
       FROM kid_progress
       WHERE improvement > 0
       ORDER BY improvement_percentage DESC
       LIMIT ?`;
  
  const params = ageGroup ? [ageGroup, metricId, limit] : [metricId, limit];
  
  return await db.getAllAsync(query, params);
};

/**
 * Get assessments by date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {string} sportId - Optional sport filter
 * @returns {Array} List of assessments in date range
 */
export const getAssessmentsByDateRange = async (startDate, endDate, sportId = null) => {
  if (isWeb) {
    const webDB = await getWebDB();
    
    let assessments = webDB.assessments?.filter(a => 
      a.assessment_date >= startDate && a.assessment_date <= endDate
    ) || [];
    
    if (sportId) {
      assessments = assessments.filter(a => a.sport_id === sportId);
    }
    
    return assessments.map(assessment => {
      const kid = webDB.kids?.find(k => k.id === assessment.kid_id);
      const sport = webDB.sports?.find(s => s.id === assessment.sport_id);
      
      // ✅ CRITICAL FIX: Include results from assessment_results table
      const results = webDB.assessment_results?.filter(r => r.assessment_id === assessment.id) || [];
      
      console.log(`📊 Assessment ${assessment.id} - Found ${results.length} results`);
      
      return {
        ...assessment,
        kid,
        sport,
        results, // ✅ Add results array
      };
    }).sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date));
  }
  
    const db = getDatabase();
  
  const query = sportId
    ? `SELECT a.*, 
              k.name as kid_name, 
              k.age_group,
              s.name as sport_name, 
              s.icon as sport_icon
       FROM assessments a
       JOIN kids k ON a.kid_id = k.id
       JOIN sports s ON a.sport_id = s.id
       WHERE a.assessment_date >= ? AND a.assessment_date <= ? AND a.sport_id = ?
       ORDER BY a.assessment_date DESC`
    : `SELECT a.*, 
              k.name as kid_name, 
              k.age_group,
              s.name as sport_name, 
              s.icon as sport_icon
       FROM assessments a
       JOIN kids k ON a.kid_id = k.id
       JOIN sports s ON a.sport_id = s.id
       WHERE a.assessment_date >= ? AND a.assessment_date <= ?
       ORDER BY a.assessment_date DESC`;
  
  const params = sportId ? [startDate, endDate, sportId] : [startDate, endDate];
  
  const assessments = await db.getAllAsync(query, params);
  
  // ✅ CRITICAL FIX: Load results for each assessment
  for (const assessment of assessments) {
    const results = await db.getAllAsync(
      'SELECT * FROM assessment_results WHERE assessment_id = ?',
      [assessment.id]
    );
    assessment.results = results;
    console.log(`📊 Assessment ${assessment.id} - Found ${results.length} results`);
  }
  
  return assessments;
};

/**
 * Get assessments filtered by kid type (sponsorship/program)
 * @param {string} term - Term (Q1, Q2, Q3, Q4)
 * @param {string} filterType - Filter type (SC, SP, ELT, WW, etc.)
 * @param {string} sportId - Optional sport filter
 * @returns {Array} Filtered assessments
 */
export const getAssessmentsByKidType = async (term, filterType, sportId = null) => {
  if (isWeb) {
    const webDB = await getWebDB();
    
    let assessments = webDB.assessments?.filter(a => a.term === term) || [];
    
    if (sportId) {
      assessments = assessments.filter(a => a.sport_id === sportId);
    }
    
    return assessments.map(assessment => {
      const kid = webDB.kids?.find(k => k.id === assessment.kid_id);
      const sport = webDB.sports?.find(s => s.id === assessment.sport_id);
      
      // Apply kid type filter
      if (filterType !== 'all') {
        if (filterType === 'SC' || filterType === 'SP') {
          if (kid?.sponsorshipType !== filterType) return null;
        } else if (filterType === 'ELT' || filterType === 'WW') {
          if (kid?.programType !== filterType) return null;
        }
      }
      
      return {
        ...assessment,
        kid,
        sport,
      };
    }).filter(Boolean);
  }
  
  const db = getDatabase();
  
  let query = `SELECT a.*, 
                      k.name as kid_name, 
                      k.age_group,
                      k.sponsorshipType,
                      k.programType,
                      s.name as sport_name, 
                      s.icon as sport_icon
               FROM assessments a
               JOIN kids k ON a.kid_id = k.id
               JOIN sports s ON a.sport_id = s.id
               WHERE a.term = ?`;
  
  const params = [term];
  
  if (sportId) {
    query += ` AND a.sport_id = ?`;
    params.push(sportId);
  }
  
  if (filterType !== 'all') {
    if (filterType === 'SC' || filterType === 'SP') {
      query += ` AND k.sponsorshipType = ?`;
      params.push(filterType);
    } else if (filterType === 'ELT' || filterType === 'WW') {
      query += ` AND k.programType = ?`;
      params.push(filterType);
    }
  }
  
  query += ` ORDER BY a.assessment_date DESC`;
  
  return await db.getAllAsync(query, params);
};

/**
 * Get assessments for a specific term
 * @param {string} term - Term (Q1, Q2, Q3, Q4)
 * @param {string} sportId - Optional sport filter
 * @returns {Array} List of assessments
 */
export const getAssessmentsByTerm = async (term, sportId = null) => {
  if (isWeb) {
    const webDB = await getWebDB();
    
    let assessments = webDB.assessments?.filter(a => a.term === term) || [];
    
    if (sportId) {
      assessments = assessments.filter(a => a.sport_id === sportId);
    }
    
    return assessments.map(assessment => {
      const kid = webDB.kids?.find(k => k.id === assessment.kid_id);
      const sport = webDB.sports?.find(s => s.id === assessment.sport_id);
      
      return {
        ...assessment,
        kid,
        sport,
      };
    });
  }
  
  const db = getDatabase();
  
  const query = sportId
    ? `SELECT a.*, 
              k.name as kid_name, 
              k.age_group,
              s.name as sport_name, 
              s.icon as sport_icon
       FROM assessments a
       JOIN kids k ON a.kid_id = k.id
       JOIN sports s ON a.sport_id = s.id
       WHERE a.term = ? AND a.sport_id = ?
       ORDER BY a.assessment_date DESC`
    : `SELECT a.*, 
              k.name as kid_name, 
              k.age_group,
              s.name as sport_name, 
              s.icon as sport_icon
       FROM assessments a
       JOIN kids k ON a.kid_id = k.id
       JOIN sports s ON a.sport_id = s.id
       WHERE a.term = ?
       ORDER BY a.assessment_date DESC`;
  
  const params = sportId ? [term, sportId] : [term];
  
  return await db.getAllAsync(query, params);
};

// ========== METRICS & PROGRESS QUERIES ==========

/**
 * Get kid's progress for a specific metric over time
 * @param {string} kidId - Kid ID
 * @param {string} metricId - Metric ID
 * @returns {Array} Progress data points
 */
export const getKidMetricProgress = async (kidId, metricId) => {
  if (isWeb) {
    const webDB = await getWebDB();
    
    const assessments = webDB.assessments?.filter(a => a.kid_id === kidId) || [];
    const progress = [];
    
    for (const assessment of assessments) {
      const result = webDB.assessment_results?.find(r => 
        r.assessment_id === assessment.id && r.metric_id === metricId
      );
      
      if (result) {
        progress.push({
          assessment_date: assessment.assessment_date,
          term: assessment.term,
          value: result.value,
          percentile: result.percentile,
          notes: result.notes,
        });
      }
    }
    
    progress.sort((a, b) => new Date(a.assessment_date) - new Date(b.assessment_date));
    
    return progress;
  }
  
  const db = getDatabase();
  
  return await db.getAllAsync(
    `SELECT a.assessment_date,
            a.term,
            ar.value,
            ar.percentile,
            ar.notes
     FROM assessments a
     JOIN assessment_results ar ON a.id = ar.assessment_id
     WHERE a.kid_id = ? AND ar.metric_id = ?
     ORDER BY a.assessment_date ASC`,
    [kidId, metricId]
  );
};

/**
 * Get all metrics for a sport with their latest values for a kid
 * @param {string} sportId - Sport ID
 * @param {string} kidId - Kid ID
 * @returns {Array} Metrics with latest values
 */
export const getMetricsWithLatestValues = async (sportId, kidId) => {
  if (isWeb) {
    const webDB = await getWebDB();
    
    const metrics = webDB.metrics?.filter(m => m.sport_id === sportId) || [];
    const assessments = webDB.assessments?.filter(a => 
      a.kid_id === kidId && a.sport_id === sportId
    ).sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date));
    
    const latestAssessment = assessments[0];
    
    return metrics.map(metric => {
      let latestValue = null;
      
      if (latestAssessment) {
        const result = webDB.assessment_results?.find(r => 
          r.assessment_id === latestAssessment.id && r.metric_id === metric.id
        );
        
        if (result) {
          latestValue = {
            value: result.value,
            percentile: result.percentile,
            assessment_date: latestAssessment.assessment_date,
          };
        }
      }
      
      return {
        ...metric,
        latest: latestValue,
      };
    }).sort((a, b) => a.display_order - b.display_order);
  }
  
  const db = getDatabase();
  
  return await db.getAllAsync(
    `SELECT m.*,
            ar.value as latest_value,
            ar.percentile as latest_percentile,
            a.assessment_date as latest_date
     FROM metrics m
     LEFT JOIN (
       SELECT ar2.*
       FROM assessment_results ar2
       JOIN assessments a2 ON ar2.assessment_id = a2.id
       WHERE a2.kid_id = ? AND a2.sport_id = ?
       AND a2.assessment_date = (
         SELECT MAX(a3.assessment_date)
         FROM assessments a3
         WHERE a3.kid_id = ? AND a3.sport_id = ?
       )
     ) ar ON m.id = ar.metric_id
     LEFT JOIN assessments a ON ar.assessment_id = a.id
     WHERE m.sport_id = ?
     ORDER BY m.category, m.display_order`,
    [kidId, sportId, kidId, sportId, sportId]
  );
};

/**
 * Get metric comparison across age group
 * @param {string} metricId - Metric ID
 * @param {string} ageGroup - Age group
 * @returns {Object} Statistics for age group
 */
export const getMetricAgeGroupStats = async (metricId, ageGroup) => {
  if (isWeb) {
    const webDB = await getWebDB();
    
    const kids = webDB.kids?.filter(k => k.age_group === ageGroup && k.status === 'active') || [];
    const kidIds = kids.map(k => k.id);
    
    const values = [];
    
    for (const kidId of kidIds) {
      const assessments = webDB.assessments?.filter(a => a.kid_id === kidId) || [];
      const latestAssessment = assessments.sort((a, b) => 
        new Date(b.assessment_date) - new Date(a.assessment_date)
      )[0];
      
      if (latestAssessment) {
        const result = webDB.assessment_results?.find(r => 
          r.assessment_id === latestAssessment.id && r.metric_id === metricId
        );
        
        if (result) {
          values.push(result.value);
        }
      }
    }
    
    if (values.length === 0) {
      return null;
    }
    
    values.sort((a, b) => a - b);
    
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const median = values[Math.floor(values.length / 2)];
    const min = values[0];
    const max = values[values.length - 1];
    
    return {
      average: avg,
      median,
      min,
      max,
      count: values.length,
    };
  }
  
  const db = getDatabase();
  
  return await db.getFirstAsync(
    `SELECT 
       AVG(ar.value) as average,
       MIN(ar.value) as min,
       MAX(ar.value) as max,
       COUNT(DISTINCT a.kid_id) as count
     FROM assessment_results ar
     JOIN assessments a ON ar.assessment_id = a.id
     JOIN kids k ON a.kid_id = k.id
     WHERE ar.metric_id = ? 
     AND k.age_group = ? 
     AND k.status = 'active'
     AND a.assessment_date = (
       SELECT MAX(a2.assessment_date)
       FROM assessments a2
       WHERE a2.kid_id = a.kid_id
     )`,
    [metricId, ageGroup]
  );
};

// ========== TEAM & COMPARISON QUERIES ==========

/**
 * Get top performers for a metric
 * @param {string} metricId - Metric ID
 * @param {string} ageGroup - Optional age group filter
 * @param {number} limit - Number of top performers (default 10)
 * @returns {Array} Top performers
 */
export const getTopPerformers = async (metricId, ageGroup = null, limit = 10) => {
  if (isWeb) {
    const webDB = await getWebDB();
    
    let kids = webDB.kids?.filter(k => k.status === 'active') || [];
    
    if (ageGroup) {
      kids = kids.filter(k => k.age_group === ageGroup);
    }
    
    const performers = [];
    
    for (const kid of kids) {
      const assessments = webDB.assessments?.filter(a => a.kid_id === kid.id) || [];
      const latestAssessment = assessments.sort((a, b) => 
        new Date(b.assessment_date) - new Date(a.assessment_date)
      )[0];
      
      if (latestAssessment) {
        const result = webDB.assessment_results?.find(r => 
          r.assessment_id === latestAssessment.id && r.metric_id === metricId
        );
        
        if (result) {
          performers.push({
            kid_id: kid.id,
            kid_name: kid.name,
            age: kid.age,
            age_group: kid.age_group,
            value: result.value,
            percentile: result.percentile,
            assessment_date: latestAssessment.assessment_date,
          });
        }
      }
    }
    
    performers.sort((a, b) => b.value - a.value);
    
    return performers.slice(0, limit);
  }
  
  const db = getDatabase();
  
  const query = ageGroup
    ? `SELECT k.id as kid_id,
              k.name as kid_name,
              k.age,
              k.age_group,
              ar.value,
              ar.percentile,
              a.assessment_date
       FROM kids k
       JOIN assessments a ON k.id = a.kid_id
       JOIN assessment_results ar ON a.id = ar.assessment_id
       WHERE k.status = 'active'
       AND k.age_group = ?
       AND ar.metric_id = ?
       AND a.assessment_date = (
         SELECT MAX(a2.assessment_date)
         FROM assessments a2
         WHERE a2.kid_id = k.id
       )
       ORDER BY ar.value DESC
       LIMIT ?`
    : `SELECT k.id as kid_id,
              k.name as kid_name,
              k.age,
              k.age_group,
              ar.value,
              ar.percentile,
              a.assessment_date
       FROM kids k
       JOIN assessments a ON k.id = a.kid_id
       JOIN assessment_results ar ON a.id = ar.assessment_id
       WHERE k.status = 'active'
       AND ar.metric_id = ?
       AND a.assessment_date = (
         SELECT MAX(a2.assessment_date)
         FROM assessments a2
         WHERE a2.kid_id = k.id
       )
       ORDER BY ar.value DESC
       LIMIT ?`;
  
  const params = ageGroup ? [ageGroup, metricId, limit] : [metricId, limit];
  
  return await db.getAllAsync(query, params);
};

/**
 * Get team improvement rate for a metric
 * @param {string} metricId - Metric ID
 * @param {string} ageGroup - Age group
 * @returns {Object} Improvement statistics
 */
export const getTeamImprovementRate = async (metricId, ageGroup) => {
  if (isWeb) {
    const webDB = await getWebDB();
    
    const kids = webDB.kids?.filter(k => k.age_group === ageGroup && k.status === 'active') || [];
    const improvements = [];
    
    for (const kid of kids) {
      const progress = await getKidMetricProgress(kid.id, metricId);
      
      if (progress.length >= 2) {
        const first = progress[0].value;
        const last = progress[progress.length - 1].value;
        const improvement = ((last - first) / first) * 100;
        
        improvements.push(improvement);
      }
    }
    
    if (improvements.length === 0) {
      return null;
    }
    
    const avgImprovement = improvements.reduce((sum, v) => sum + v, 0) / improvements.length;
    
    return {
      average_improvement_percentage: avgImprovement,
      kids_tracked: improvements.length,
    };
  }
  
  const db = getDatabase();
  
  // This is a complex query - simplified version
  return await db.getFirstAsync(
    `SELECT 
       COUNT(DISTINCT k.id) as kids_tracked
     FROM kids k
     WHERE k.age_group = ? AND k.status = 'active'`,
    [ageGroup]
  );
};

// ========== GOALS QUERIES ==========

/**
 * Get kid's active goals with progress
 * @param {string} kidId - Kid ID
 * @returns {Array} Active goals with current progress
 */
export const getKidActiveGoals = async (kidId) => {
  if (isWeb) {
    const webDB = await getWebDB();
    
    const goals = webDB.goals?.filter(g => 
      g.kid_id === kidId && g.status === 'active'
    ) || [];
    
    return goals.map(goal => {
      const metric = webDB.metrics?.find(m => m.id === goal.metric_id);
      
      // Get latest value
      const assessments = webDB.assessments?.filter(a => a.kid_id === kidId) || [];
      const latestAssessment = assessments.sort((a, b) => 
        new Date(b.assessment_date) - new Date(a.assessment_date)
      )[0];
      
      let currentValue = null;
      
      if (latestAssessment) {
        const result = webDB.assessment_results?.find(r => 
          r.assessment_id === latestAssessment.id && r.metric_id === goal.metric_id
        );
        
        if (result) {
          currentValue = result.value;
        }
      }
      
      const progress = currentValue 
        ? ((currentValue / goal.target_value) * 100).toFixed(1)
        : 0;
      
      return {
        ...goal,
        metric,
        current_value: currentValue,
        progress_percentage: parseFloat(progress),
      };
    });
  }
  
  const db = getDatabase();
  
  return await db.getAllAsync(
    `SELECT g.*,
            m.name as metric_name,
            m.unit as metric_unit,
            (
              SELECT ar.value
              FROM assessment_results ar
              JOIN assessments a ON ar.assessment_id = a.id
              WHERE a.kid_id = g.kid_id
              AND ar.metric_id = g.metric_id
              ORDER BY a.assessment_date DESC
              LIMIT 1
            ) as current_value
     FROM goals g
     JOIN metrics m ON g.metric_id = m.id
     WHERE g.kid_id = ? AND g.status = 'active'
     ORDER BY g.target_date ASC`,
    [kidId]
  );
};

// ========== ASSESSMENT PROGRESS QUERIES ==========

/**
 * Get assessment completion status for kids
 * @param {Array} kidIds - Array of kid IDs
 * @param {Array} metricIds - Array of metric IDs to assess
 * @param {string} sportId - Sport ID
 * @returns {Object} Completion status per kid
 */
export const getAssessmentProgress = async (kidIds, metricIds, sportId) => {
  if (isWeb) {
    const webDB = await getWebDB();

    const progress = {};
    
    for (const kidId of kidIds) {
      const assessments = webDB.assessments?.filter(a => 
        a.kid_id === kidId && a.sport_id === sportId
      ) || [];
      
      const latestAssessment = assessments.sort((a, b) => 
        new Date(b.assessment_date) - new Date(a.assessment_date)
      )[0];
      
      if (!latestAssessment) {
        progress[kidId] = {
          status: 'not_started',
          completed: 0,
          total: metricIds.length,
          percentage: 0,
        };
        continue;
      }
      
      const results = webDB.assessment_results?.filter(r => 
        r.assessment_id === latestAssessment.id && metricIds.includes(r.metric_id)
      ) || [];
      
      const completedCount = results.length;
      const percentage = (completedCount / metricIds.length) * 100;
      
      progress[kidId] = {
        status: completedCount === 0 ? 'not_started' : 
                completedCount === metricIds.length ? 'completed' : 'in_progress',
        completed: completedCount,
        total: metricIds.length,
        percentage: Math.round(percentage),
        lastAssessmentDate: latestAssessment.assessment_date,
      };
    }
    
    return progress;
  }
  
  const db = getDatabase();
  const progress = {};
  
  for (const kidId of kidIds) {
    const result = await db.getFirstAsync(
      `SELECT 
         COUNT(DISTINCT ar.metric_id) as completed_count,
         MAX(a.assessment_date) as last_date
       FROM assessments a
       LEFT JOIN assessment_results ar ON a.id = ar.assessment_id AND ar.metric_id IN (${metricIds.map(() => '?').join(',')})
       WHERE a.kid_id = ? AND a.sport_id = ?`,
      [...metricIds, kidId, sportId]
    );
    
    const completedCount = result?.completed_count || 0;
    const percentage = (completedCount / metricIds.length) * 100;
    
    progress[kidId] = {
      status: completedCount === 0 ? 'not_started' : 
              completedCount === metricIds.length ? 'completed' : 'in_progress',
      completed: completedCount,
      total: metricIds.length,
      percentage: Math.round(percentage),
      lastAssessmentDate: result?.last_date || null,
    };
  }
  
  return progress;
};

// ========== DASHBOARD QUERIES ==========

/**
 * Get dashboard statistics for a coach
 * @param {string} academyId - Academy ID
 * @returns {Object} Dashboard stats
 */
export const getDashboardStats = async (academyId) => {
  if (isWeb) {
    const webDB = await getWebDB();
    
    const totalKids = webDB.kids?.filter(k => k.status === 'active').length || 0;
    const totalSports = webDB.sports?.filter(s => s.is_active === 1).length || 0;
    const totalAssessments = webDB.assessments?.length || 0;
    
    // Recent assessments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentAssessments = webDB.assessments?.filter(a => 
      new Date(a.assessment_date) >= thirtyDaysAgo
    ).length || 0;
    
    return {
      total_kids: totalKids,
      total_sports: totalSports,
      total_assessments: totalAssessments,
      recent_assessments: recentAssessments,
    };
  }
  
  const db = getDatabase();
  
  const stats = await db.getFirstAsync(
    `SELECT 
       (SELECT COUNT(*) FROM kids WHERE status = 'active') as total_kids,
       (SELECT COUNT(*) FROM sports WHERE is_active = 1) as total_sports,
       (SELECT COUNT(*) FROM assessments) as total_assessments,
       (SELECT COUNT(*) FROM assessments WHERE assessment_date >= date('now', '-30 days')) as recent_assessments`
  );
  
  return stats;
};

/**
 * Get recent assessments with kid and sport details
 * @param {number} limit - Number of recent assessments (default 10)
 * @returns {Array} Recent assessments
 */
export const getRecentAssessments = async (limit = 10) => {
  if (isWeb) {
    const webDB = await getWebDB();
    
    const assessments = webDB.assessments || [];
    
    const withDetails = assessments.map(assessment => {
      const kid = webDB.kids?.find(k => k.id === assessment.kid_id);
      const sport = webDB.sports?.find(s => s.id === assessment.sport_id);
      
      return {
        ...assessment,
        kid,
        sport,
      };
    });
    
    withDetails.sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date));
    
    return withDetails.slice(0, limit);
  }
  
  const db = getDatabase();
  
  return await db.getAllAsync(
    `SELECT a.*,
            k.name as kid_name,
            k.age_group,
            s.name as sport_name,
            s.icon as sport_icon
     FROM assessments a
     JOIN kids k ON a.kid_id = k.id
     JOIN sports s ON a.sport_id = s.id
     ORDER BY a.assessment_date DESC
     LIMIT ?`,
    [limit]
  );
};

// ========== EXPORT ALL QUERIES ==========

export default {
  getFullAssessmentData,
  getKidAssessmentHistory,
  getAssessmentsByTerm,
  getAssessmentsByDateRange,
  getAssessmentsByKidType,
  getKidMetricProgress,
  getMetricsWithLatestValues,
  getMetricAgeGroupStats,
  getTopPerformers,
  getTeamImprovementRate,
  getRedFlags,
  getTeamLeaderboard,
  getMostImprovedKids,
  getKidActiveGoals,
  getDashboardStats,
  getRecentAssessments,
  getAssessmentProgress,
};