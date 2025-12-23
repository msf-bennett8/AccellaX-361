// Location: /apps/assessment/src/hooks/useAssessmentCount.js
// Centralized assessment count management

import { useState, useEffect } from 'react';
import { getAllAssessments } from '../services/assessmentService';
import { invalidateCache } from '../services/assessmentService';

let assessmentCountListeners = [];
let cachedCount = null;
let lastUpdateTime = 0;
const CACHE_DURATION = 5000; // 5 seconds

/**
 * Subscribe to assessment count updates
 */
export const subscribeToAssessmentCount = (callback) => {
  assessmentCountListeners.push(callback);
  
  // Return unsubscribe function
  return () => {
    assessmentCountListeners = assessmentCountListeners.filter(cb => cb !== callback);
  };
};

/**
 * Notify all listeners of count update
 */
const notifyListeners = (count, stats) => {
  console.log(`📢 Notifying ${assessmentCountListeners.length} listeners of count update:`, count);
  assessmentCountListeners.forEach(callback => {
    try {
      callback(count, stats);
    } catch (error) {
      console.error('Error in assessment count listener:', error);
    }
  });
};

/**
 * Force refresh assessment count from source
 */
export const refreshAssessmentCount = async (forceRefresh = false) => {
  try {
    const now = Date.now();
    
    // Use cached count if fresh and not forcing refresh
    if (!forceRefresh && cachedCount !== null && (now - lastUpdateTime) < CACHE_DURATION) {
      console.log(`📦 Using cached assessment count: ${cachedCount.total}`);
      return cachedCount;
    }
    
    console.log('🔄 Fetching fresh assessment count...');
    
    // Force cache invalidation
    invalidateCache();
    
    // Get fresh data
    const assessments = await getAllAssessments();
    const totalCount = assessments.length;
    
    // Calculate this week count
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeekCount = assessments.filter(a => 
      new Date(a.assessment_date) >= oneWeekAgo
    ).length;
    
    // Calculate today count
    const today = new Date().toISOString().split('T')[0];
    const todayCount = assessments.filter(a => 
      a.assessment_date.split('T')[0] === today
    ).length;
    
    const stats = {
      total: totalCount,
      thisWeek: thisWeekCount,
      today: todayCount,
    };
    
    // Update cache
    cachedCount = stats;
    lastUpdateTime = now;
    
    console.log('✅ Assessment count updated:', stats);
    
    // Notify all listeners
    notifyListeners(totalCount, stats);
    
    return stats;
  } catch (error) {
    console.error('❌ Error refreshing assessment count:', error);
    return cachedCount || { total: 0, thisWeek: 0, today: 0 };
  }
};

/**
 * Hook to use assessment count in components
 */
export const useAssessmentCount = () => {
  const [count, setCount] = useState(cachedCount?.total || 0);
  const [stats, setStats] = useState(cachedCount || { total: 0, thisWeek: 0, today: 0 });
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Initial load
    const loadCount = async () => {
      setLoading(true);
      const freshStats = await refreshAssessmentCount();
      setCount(freshStats.total);
      setStats(freshStats);
      setLoading(false);
    };
    
    loadCount();
    
    // Subscribe to updates
    const unsubscribe = subscribeToAssessmentCount((newCount, newStats) => {
      console.log('🔔 useAssessmentCount received update:', newCount);
      setCount(newCount);
      setStats(newStats);
    });
    
    return unsubscribe;
  }, []);
  
  const refresh = async () => {
    setLoading(true);
    const freshStats = await refreshAssessmentCount(true);
    setCount(freshStats.total);
    setStats(freshStats);
    setLoading(false);
  };
  
  return { count, stats, loading, refresh };
};

/**
 * Trigger update when new assessment is saved
 */
export const notifyAssessmentSaved = async () => {
  console.log('💾 Assessment saved - triggering count update...');
  await refreshAssessmentCount(true);
};

export default {
  useAssessmentCount,
  refreshAssessmentCount,
  subscribeToAssessmentCount,
  notifyAssessmentSaved,
};