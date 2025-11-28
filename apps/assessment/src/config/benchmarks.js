// Location: /apps/assessment/src/config/benchmarks.js
// Performance Benchmarks for AccellaX 361° Assessment App
// Based on: FIFA 11+, Cooper Test, Beep Test, General Youth Fitness Standards

/**
 * BENCHMARK STRUCTURE:
 * - metricId: References metric from metrics.js
 * - ageGroup: '4-6', '7-9', '10-13', '13+'
 * - gender: 'male' | 'female' | null (null = applies to both)
 * - excellent: Top 25% (75th+ percentile)
 * - good: Middle-upper 25% (50-74th percentile)
 * - fair: Middle-lower 25% (25-49th percentile)
 * - poor: Bottom 25% (<25th percentile)
 * - source: Reference standard
 */

// ========== GENERAL FITNESS BENCHMARKS ==========

export const BEEP_TEST_BENCHMARKS = [
  // Age 4-6
  { metricId: 'beep_test', ageGroup: '4-6', gender: null, excellent: 4, good: 3, fair: 2, poor: 1, source: 'Youth Fitness Standard' },
  
  // Age 7-9
  { metricId: 'beep_test', ageGroup: '7-9', gender: 'male', excellent: 6, good: 5, fair: 4, poor: 3, source: 'Beep Test Standard' },
  { metricId: 'beep_test', ageGroup: '7-9', gender: 'female', excellent: 5, good: 4, fair: 3, poor: 2, source: 'Beep Test Standard' },
  
  // Age 10-13
  { metricId: 'beep_test', ageGroup: '10-13', gender: 'male', excellent: 9, good: 7, fair: 6, poor: 5, source: 'Beep Test Standard' },
  { metricId: 'beep_test', ageGroup: '10-13', gender: 'female', excellent: 7, good: 6, fair: 5, poor: 4, source: 'Beep Test Standard' },
  
  // Age 13+
  { metricId: 'beep_test', ageGroup: '13+', gender: 'male', excellent: 11, good: 9, fair: 8, poor: 7, source: 'Beep Test Standard' },
  { metricId: 'beep_test', ageGroup: '13+', gender: 'female', excellent: 9, good: 7, fair: 6, poor: 5, source: 'Beep Test Standard' },
];

export const COOPER_TEST_BENCHMARKS = [
  // Age 7-9 (meters in 12 min)
  { metricId: 'cooper_test', ageGroup: '7-9', gender: 'male', excellent: 2000, good: 1700, fair: 1500, poor: 1300, source: 'Cooper Test' },
  { metricId: 'cooper_test', ageGroup: '7-9', gender: 'female', excellent: 1800, good: 1600, fair: 1400, poor: 1200, source: 'Cooper Test' },
  
  // Age 10-13
  { metricId: 'cooper_test', ageGroup: '10-13', gender: 'male', excellent: 2400, good: 2100, fair: 1900, poor: 1700, source: 'Cooper Test' },
  { metricId: 'cooper_test', ageGroup: '10-13', gender: 'female', excellent: 2200, good: 1900, fair: 1700, poor: 1500, source: 'Cooper Test' },
  
  // Age 13+
  { metricId: 'cooper_test', ageGroup: '13+', gender: 'male', excellent: 2700, good: 2400, fair: 2200, poor: 2000, source: 'Cooper Test' },
  { metricId: 'cooper_test', ageGroup: '13+', gender: 'female', excellent: 2400, good: 2100, fair: 1900, poor: 1700, source: 'Cooper Test' },
];

export const SPRINT_100M_BENCHMARKS = [
  // Age 7-9 (seconds)
  { metricId: 'sprint_100m', ageGroup: '7-9', gender: 'male', excellent: 17, good: 19, fair: 21, poor: 23, source: 'Youth Athletics' },
  { metricId: 'sprint_100m', ageGroup: '7-9', gender: 'female', excellent: 18, good: 20, fair: 22, poor: 24, source: 'Youth Athletics' },
  
  // Age 10-13
  { metricId: 'sprint_100m', ageGroup: '10-13', gender: 'male', excellent: 14, good: 16, fair: 18, poor: 20, source: 'Youth Athletics' },
  { metricId: 'sprint_100m', ageGroup: '10-13', gender: 'female', excellent: 15, good: 17, fair: 19, poor: 21, source: 'Youth Athletics' },
  
  // Age 13+
  { metricId: 'sprint_100m', ageGroup: '13+', gender: 'male', excellent: 12, good: 13.5, fair: 15, poor: 16.5, source: 'Youth Athletics' },
  { metricId: 'sprint_100m', ageGroup: '13+', gender: 'female', excellent: 13, good: 14.5, fair: 16, poor: 17.5, source: 'Youth Athletics' },
];

export const PUSHUP_BENCHMARKS = [
  // Age 7-9 (reps in 1 min)
  { metricId: 'pushups_1min', ageGroup: '7-9', gender: 'male', excellent: 25, good: 20, fair: 15, poor: 10, source: 'Youth Fitness' },
  { metricId: 'pushups_1min', ageGroup: '7-9', gender: 'female', excellent: 20, good: 15, fair: 12, poor: 8, source: 'Youth Fitness' },
  
  // Age 10-13
  { metricId: 'pushups_1min', ageGroup: '10-13', gender: 'male', excellent: 35, good: 28, fair: 22, poor: 15, source: 'Youth Fitness' },
  { metricId: 'pushups_1min', ageGroup: '10-13', gender: 'female', excellent: 28, good: 22, fair: 17, poor: 12, source: 'Youth Fitness' },
  
  // Age 13+
  { metricId: 'pushups_1min', ageGroup: '13+', gender: 'male', excellent: 45, good: 35, fair: 28, poor: 20, source: 'Youth Fitness' },
  { metricId: 'pushups_1min', ageGroup: '13+', gender: 'female', excellent: 35, good: 28, fair: 22, poor: 15, source: 'Youth Fitness' },
];

export const SITUP_BENCHMARKS = [
  // Age 7-9 (reps in 1 min)
  { metricId: 'situps_1min', ageGroup: '7-9', gender: 'male', excellent: 30, good: 25, fair: 20, poor: 15, source: 'Youth Fitness' },
  { metricId: 'situps_1min', ageGroup: '7-9', gender: 'female', excellent: 28, good: 23, fair: 18, poor: 13, source: 'Youth Fitness' },
  
  // Age 10-13
  { metricId: 'situps_1min', ageGroup: '10-13', gender: 'male', excellent: 42, good: 35, fair: 28, poor: 22, source: 'Youth Fitness' },
  { metricId: 'situps_1min', ageGroup: '10-13', gender: 'female', excellent: 38, good: 32, fair: 26, poor: 20, source: 'Youth Fitness' },
  
  // Age 13+
  { metricId: 'situps_1min', ageGroup: '13+', gender: 'male', excellent: 50, good: 42, fair: 35, poor: 28, source: 'Youth Fitness' },
  { metricId: 'situps_1min', ageGroup: '13+', gender: 'female', excellent: 45, good: 38, fair: 32, poor: 25, source: 'Youth Fitness' },
];

export const FLEXIBILITY_BENCHMARKS = [
  // Age 7-9 (cm, sit-and-reach)
  { metricId: 'flexibility', ageGroup: '7-9', gender: null, excellent: 15, good: 10, fair: 5, poor: 0, source: 'Youth Fitness' },
  
  // Age 10-13
  { metricId: 'flexibility', ageGroup: '10-13', gender: null, excellent: 20, good: 15, fair: 10, poor: 5, source: 'Youth Fitness' },
  
  // Age 13+
  { metricId: 'flexibility', ageGroup: '13+', gender: null, excellent: 25, good: 18, fair: 12, poor: 6, source: 'Youth Fitness' },
];

export const AGILITY_TTEST_BENCHMARKS = [
  // Age 10-13 (seconds)
  { metricId: 'agility_ttest', ageGroup: '10-13', gender: 'male', excellent: 11, good: 12, fair: 13, poor: 14, source: 'T-Test Standard' },
  { metricId: 'agility_ttest', ageGroup: '10-13', gender: 'female', excellent: 12, good: 13, fair: 14, poor: 15, source: 'T-Test Standard' },
  
  // Age 13+
  { metricId: 'agility_ttest', ageGroup: '13+', gender: 'male', excellent: 9.5, good: 10.5, fair: 11.5, poor: 12.5, source: 'T-Test Standard' },
  { metricId: 'agility_ttest', ageGroup: '13+', gender: 'female', excellent: 10.5, good: 11.5, fair: 12.5, poor: 13.5, source: 'T-Test Standard' },
];

export const VERTICAL_JUMP_BENCHMARKS = [
  // Age 7-9 (cm)
  { metricId: 'vertical_jump', ageGroup: '7-9', gender: 'male', excellent: 35, good: 30, fair: 25, poor: 20, source: 'Youth Power Test' },
  { metricId: 'vertical_jump', ageGroup: '7-9', gender: 'female', excellent: 32, good: 27, fair: 22, poor: 18, source: 'Youth Power Test' },
  
  // Age 10-13
  { metricId: 'vertical_jump', ageGroup: '10-13', gender: 'male', excellent: 50, good: 43, fair: 37, poor: 30, source: 'Youth Power Test' },
  { metricId: 'vertical_jump', ageGroup: '10-13', gender: 'female', excellent: 45, good: 38, fair: 32, poor: 26, source: 'Youth Power Test' },
  
  // Age 13+
  { metricId: 'vertical_jump', ageGroup: '13+', gender: 'male', excellent: 60, good: 52, fair: 45, poor: 38, source: 'Youth Power Test' },
  { metricId: 'vertical_jump', ageGroup: '13+', gender: 'female', excellent: 52, good: 45, fair: 38, poor: 32, source: 'Youth Power Test' },
];

// ========== RATING BENCHMARKS (1-10 scale for sport-specific skills) ==========

export const RATING_BENCHMARKS = [
  // All age groups, all sports (1-10 rating scale)
  { category: 'rating', ageGroup: 'all', gender: null, excellent: 8, good: 6, fair: 4, poor: 2, source: 'AccellaX Standard' },
];

// ========== COMBINED BENCHMARKS ==========

export const ALL_BENCHMARKS = [
  ...BEEP_TEST_BENCHMARKS,
  ...COOPER_TEST_BENCHMARKS,
  ...SPRINT_100M_BENCHMARKS,
  ...PUSHUP_BENCHMARKS,
  ...SITUP_BENCHMARKS,
  ...FLEXIBILITY_BENCHMARKS,
  ...AGILITY_TTEST_BENCHMARKS,
  ...VERTICAL_JUMP_BENCHMARKS,
  ...RATING_BENCHMARKS,
];

// ========== HELPER FUNCTIONS ==========

/**
 * Get benchmark for a specific metric, age group, and gender
 */
export const getBenchmark = (metricId, ageGroup, gender = null) => {
  // Try exact match first (metric + age + gender)
  let benchmark = ALL_BENCHMARKS.find(b => 
    b.metricId === metricId && 
    b.ageGroup === ageGroup && 
    (b.gender === gender || b.gender === null)
  );
  
  // Fallback to gender-neutral benchmark
  if (!benchmark) {
    benchmark = ALL_BENCHMARKS.find(b => 
      b.metricId === metricId && 
      b.ageGroup === ageGroup && 
      b.gender === null
    );
  }
  
  // Fallback for rating metrics
  if (!benchmark && metricId.includes('_iq') || metricId.includes('rating')) {
    benchmark = RATING_BENCHMARKS[0];
  }
  
  return benchmark;
};

/**
 * Calculate performance rating based on value
 */
export const getPerformanceRating = (metricId, ageGroup, gender, value) => {
  const benchmark = getBenchmark(metricId, ageGroup, gender);
  
  if (!benchmark) {
    return { rating: 'unknown', color: '#9E9E9E', percentile: null };
  }
  
  // For metrics where LOWER is better (timed tests)
  const isLowerBetter = metricId.includes('sprint') || metricId.includes('agility') || metricId.includes('ttest');
  
  let rating, color, percentile;
  
  if (isLowerBetter) {
    if (value <= benchmark.excellent) {
      rating = 'excellent';
      color = '#4CAF50';
      percentile = 90;
    } else if (value <= benchmark.good) {
      rating = 'good';
      color = '#2196F3';
      percentile = 70;
    } else if (value <= benchmark.fair) {
      rating = 'fair';
      color = '#FF9800';
      percentile = 40;
    } else {
      rating = 'poor';
      color = '#F44336';
      percentile = 15;
    }
  } else {
    // Higher is better (most metrics)
    if (value >= benchmark.excellent) {
      rating = 'excellent';
      color = '#4CAF50';
      percentile = 90;
    } else if (value >= benchmark.good) {
      rating = 'good';
      color = '#2196F3';
      percentile = 70;
    } else if (value >= benchmark.fair) {
      rating = 'fair';
      color = '#FF9800';
      percentile = 40;
    } else {
      rating = 'poor';
      color = '#F44336';
      percentile = 15;
    }
  }
  
  return { rating, color, percentile };
};

/**
 * Get all benchmarks for an age group
 */
export const getBenchmarksByAgeGroup = (ageGroup) => {
  return ALL_BENCHMARKS.filter(b => b.ageGroup === ageGroup || b.ageGroup === 'all');
};

/**
 * Get benchmarks by metric
 */
export const getBenchmarksByMetric = (metricId) => {
  return ALL_BENCHMARKS.filter(b => b.metricId === metricId);
};

/**
 * Format benchmark for display
 */
export const formatBenchmark = (benchmark) => {
  if (!benchmark) return 'No benchmark';
  
  return {
    excellent: `${benchmark.excellent}+`,
    good: `${benchmark.good}-${benchmark.excellent}`,
    fair: `${benchmark.fair}-${benchmark.good}`,
    poor: `<${benchmark.fair}`,
  };
};

export default {
  ALL_BENCHMARKS,
  BEEP_TEST_BENCHMARKS,
  COOPER_TEST_BENCHMARKS,
  SPRINT_100M_BENCHMARKS,
  PUSHUP_BENCHMARKS,
  SITUP_BENCHMARKS,
  FLEXIBILITY_BENCHMARKS,
  AGILITY_TTEST_BENCHMARKS,
  VERTICAL_JUMP_BENCHMARKS,
  RATING_BENCHMARKS,
  getBenchmark,
  getPerformanceRating,
  getBenchmarksByAgeGroup,
  getBenchmarksByMetric,
  formatBenchmark,
};