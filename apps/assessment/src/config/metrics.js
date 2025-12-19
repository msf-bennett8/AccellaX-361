// Location: /apps/assessment/src/config/metrics.js
// Default Metrics Configuration for AccellaX 361° Assessment App

/**
 * METRIC STRUCTURE:
 * - id: Unique identifier
 * - name: Display name
 * - category: 'general_fitness' | 'sport_specific' | 'iq'
 * - type: 'numeric' | 'rating' | 'timed' | 'counted'
 * - unit: cm, kg, seconds, /10, reps, etc.
 * - minValue / maxValue: Validation range
 * - displayOrder: Sort order in UI
 * - isDefault: Pre-loaded metric
 */

// ========== GENERAL FITNESS METRICS (Universal across all sports) ==========

export const GENERAL_FITNESS_METRICS = [
  {
    id: 'height',
    name: 'Height',
    category: 'general_fitness',
    type: 'numeric',
    unit: 'cm',
    minValue: 50,
    maxValue: 250,
    displayOrder: 1,
    isDefault: true,
    description: 'Standing height measurement',
  },
  {
    id: 'weight',
    name: 'Weight',
    category: 'general_fitness',
    type: 'numeric',
    unit: 'kg',
    minValue: 10,
    maxValue: 150,
    displayOrder: 2,
    isDefault: true,
    description: 'Body weight',
  },
  {
    id: 'beep_test',
    name: 'Beep Test (Endurance)',
    category: 'general_fitness',
    type: 'beep_test', // Special type for live tracker
    unit: 'level',
    minValue: 1,
    maxValue: 21,
    displayOrder: 3,
    isDefault: true,
    description: '20m shuttle run test level reached',
    requiresLiveTracking: true, // Flag for group test
  },
  {
    id: 'cooper_test',
    name: 'Cooper Test (12-min run)',
    category: 'general_fitness',
    type: 'cooper_test', // Special type for live tracker
    unit: 'meters',
    minValue: 500,
    maxValue: 4000,
    displayOrder: 4,
    isDefault: true,
    description: 'Distance covered in 12 minutes',
    requiresLiveTracking: true, // Flag for group test
  },
  {
    id: 'sprint_100m',
    name: '100m Sprint (Speed)',
    category: 'general_fitness',
    type: 'timer',
    unit: 'seconds',
    minValue: 10,
    maxValue: 30,
    displayOrder: 5,
    isDefault: true,
    description: '100-meter sprint time',
  },
  {
    id: 'sprint_40m',
    name: '40m Sprint (Speed)',
    category: 'general_fitness',
    type: 'timer',
    unit: 'seconds',
    minValue: 5,
    maxValue: 15,
    displayOrder: 6,
    isDefault: true,
    description: '40-meter sprint time - suitable for younger athletes',
  },
  {
    id: 'sprint_20m',
    name: '20m Sprint (Speed)',
    category: 'general_fitness',
    type: 'timer',
    unit: 'seconds',
    minValue: 3,
    maxValue: 10,
    displayOrder: 7,
    isDefault: true,
    description: '20-meter sprint time - ideal for 4-9 age group',
  },
  {
    id: 'pushups_1min',
    name: 'Push-ups (Strength)',
    category: 'general_fitness',
    type: 'counted',
    unit: 'reps',
    minValue: 0,
    maxValue: 100,
    displayOrder: 8,
    isDefault: true,
    description: 'Push-ups in 1 minute',
  },
  {
    id: 'situps_1min',
    name: 'Sit-ups (Core)',
    category: 'general_fitness',
    type: 'counted',
    unit: 'reps',
    minValue: 0,
    maxValue: 100,
    displayOrder: 9,
    isDefault: true,
    description: 'Sit-ups in 1 minute',
  },
  {
    id: 'flexibility',
    name: 'Sit-and-Reach (Flexibility)',
    category: 'general_fitness',
    type: 'numeric',
    unit: 'cm',
    minValue: -20,
    maxValue: 50,
    displayOrder: 10,
    isDefault: true,
    description: 'Sit-and-reach test',
  },
  {
    id: 'agility_ttest',
    name: 'T-Test (Agility)',
    category: 'general_fitness',
    type: 'timer', // Use timer component
    unit: 'seconds',
    minValue: 8,
    maxValue: 20,
    displayOrder: 11,
    isDefault: true,
    description: 'T-Test agility drill',
  },
  {
    id: 'vertical_jump',
    name: 'Vertical Jump (Power)',
    category: 'general_fitness',
    type: 'numeric',
    unit: 'cm',
    minValue: 10,
    maxValue: 80,
    displayOrder: 12,
    isDefault: true,
    description: 'Maximum vertical jump height',
  },
  {
    id: 'standing_broad_jump',
    name: 'Standing Broad Jump (Power)',
    category: 'general_fitness',
    type: 'numeric',
    unit: 'cm',
    minValue: 50,
    maxValue: 300,
    displayOrder: 13,
    isDefault: true,
    description: 'Maximum horizontal jump distance from standing position',
  },
];

// ========== FOOTBALL-SPECIFIC METRICS ==========

export const FOOTBALL_METRICS = [
  {
    id: 'football_passing',
    sportId: 'football',
    name: 'Passing',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 1,
    isDefault: true,
    pairedWith: 'football_receiving', // Links to receiving
    pairRole: 'passer', // Role in the pair
  },
  {
    id: 'football_receiving',
    sportId: 'football',
    name: 'Receiving the Ball',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 2,
    isDefault: true,
    pairedWith: 'football_passing', // Links to passing
    pairRole: 'receiver', // Role in the pair
  },
  {
    id: 'football_dribbling',
    sportId: 'football',
    name: 'Dribbling',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 3,
    isDefault: true,
  },
  {
    id: 'football_shooting',
    sportId: 'football',
    name: 'Shooting',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 4,
    isDefault: true,
  },
  {
    id: 'football_defending',
    sportId: 'football',
    name: 'Defending',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 5,
    isDefault: true,
  },
  {
    id: 'football_iq',
    sportId: 'football',
    name: 'Football IQ',
    category: 'iq',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 6,
    isDefault: true,
    description: 'Game awareness, positioning, decision-making',
  },
];

// ========== ATHLETICS METRICS ==========

export const ATHLETICS_METRICS = [
  {
    id: 'athletics_body_alignment',
    sportId: 'athletics',
    name: 'Body Alignment',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 1,
    isDefault: true,
  },
  {
    id: 'athletics_arm_action',
    sportId: 'athletics',
    name: 'Arm Action',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 2,
    isDefault: true,
  },
  {
    id: 'athletics_knee_drive',
    sportId: 'athletics',
    name: 'Knee Drive',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 3,
    isDefault: true,
  },
  {
    id: 'athletics_foot_landing',
    sportId: 'athletics',
    name: 'Foot Landing Position',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 4,
    isDefault: true,
  },
  {
    id: 'athletics_coordination',
    sportId: 'athletics',
    name: 'Coordination',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 5,
    isDefault: true,
  },
  {
    id: 'athletics_iq',
    sportId: 'athletics',
    name: 'Athletics IQ',
    category: 'iq',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 6,
    isDefault: true,
    description: 'Race strategy, pacing, technique awareness',
  },
];

// ========== RUGBY METRICS ==========

export const RUGBY_METRICS = [
  {
    id: 'rugby_passing',
    sportId: 'rugby',
    name: 'Passing',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 1,
    isDefault: true,
    pairedWith: 'rugby_receiving',
    pairRole: 'passer',
  },
  {
    id: 'rugby_receiving',
    sportId: 'rugby',
    name: 'Receiving the Ball',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 2,
    isDefault: true,
    pairedWith: 'rugby_passing',
    pairRole: 'receiver',
  },
  {
    id: 'rugby_running',
    sportId: 'rugby',
    name: 'Running with the Ball',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 3,
    isDefault: true,
  },
  {
    id: 'rugby_defending',
    sportId: 'rugby',
    name: 'Defending (Tackling)',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 4,
    isDefault: true,
  },
  {
    id: 'rugby_kicking',
    sportId: 'rugby',
    name: 'Kicking',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 5,
    isDefault: true,
  },
  {
    id: 'rugby_iq',
    sportId: 'rugby',
    name: 'Rugby IQ',
    category: 'iq',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 6,
    isDefault: true,
    description: 'Game reading, positioning, decision-making',
  },
];

// ========== SWIMMING METRICS ==========

export const SWIMMING_METRICS = [
  {
    id: 'swimming_body_positioning',
    sportId: 'swimming',
    name: 'Body Positioning',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 1,
    isDefault: true,
  },
  {
    id: 'swimming_breathing',
    sportId: 'swimming',
    name: 'Breathing',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 2,
    isDefault: true,
  },
  {
    id: 'swimming_arm_recovery',
    sportId: 'swimming',
    name: 'Arm Recovery',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 3,
    isDefault: true,
  },
  {
    id: 'swimming_underwater_catch',
    sportId: 'swimming',
    name: 'Underwater Catch',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 4,
    isDefault: true,
  },
  {
    id: 'swimming_kicking',
    sportId: 'swimming',
    name: 'Kicking',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 5,
    isDefault: true,
  },
  {
    id: 'swimming_iq',
    sportId: 'swimming',
    name: 'Swimming IQ',
    category: 'iq',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 6,
    isDefault: true,
    description: 'Race strategy, turn efficiency, pacing',
  },
];

// ========== TENNIS METRICS ==========

export const TENNIS_METRICS = [
  {
    id: 'tennis_serve',
    sportId: 'tennis',
    name: 'Serve',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 1,
    isDefault: true,
  },
  {
    id: 'tennis_forehand',
    sportId: 'tennis',
    name: 'Forehand',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 2,
    isDefault: true,
  },
  {
    id: 'tennis_backhand',
    sportId: 'tennis',
    name: 'Backhand',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 3,
    isDefault: true,
  },
  {
    id: 'tennis_volley',
    sportId: 'tennis',
    name: 'Volley',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 4,
    isDefault: true,
  },
  {
    id: 'tennis_footwork',
    sportId: 'tennis',
    name: 'Footwork',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 5,
    isDefault: true,
  },
  {
    id: 'tennis_iq',
    sportId: 'tennis',
    name: 'Tennis IQ',
    category: 'iq',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 6,
    isDefault: true,
    description: 'Court positioning, shot selection, strategy',
  },
];

// ========== BASKETBALL METRICS ==========

export const BASKETBALL_METRICS = [
  {
    id: 'basketball_passing',
    sportId: 'basketball',
    name: 'Passing',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 1,
    isDefault: true,
    pairedWith: 'basketball_receiving',
    pairRole: 'passer',
  },
  {
    id: 'basketball_receiving',
    sportId: 'basketball',
    name: 'Receiving/Catching',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 2,
    isDefault: true,
    pairedWith: 'basketball_passing',
    pairRole: 'receiver',
  },
  {
    id: 'basketball_shooting',
    sportId: 'basketball',
    name: 'Shooting',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 2,
    isDefault: true,
  },
  {
    id: 'basketball_layup',
    sportId: 'basketball',
    name: 'Layup',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 3,
    isDefault: true,
  },
  {
    id: 'basketball_dribbling',
    sportId: 'basketball',
    name: 'Dribbling/Ball Control',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 4,
    isDefault: true,
  },
  {
    id: 'basketball_defending',
    sportId: 'basketball',
    name: 'Defending',
    category: 'sport_specific',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 5,
    isDefault: true,
  },
  {
    id: 'basketball_iq',
    sportId: 'basketball',
    name: 'Basketball IQ',
    category: 'iq',
    type: 'rating',
    unit: '/10',
    minValue: 1,
    maxValue: 10,
    displayOrder: 6,
    isDefault: true,
    description: 'Court awareness, decision-making, positioning',
  },
];

// ========== COMBINED METRICS MAP ==========

export const SPORT_METRICS_MAP = {
  football: FOOTBALL_METRICS,
  athletics: ATHLETICS_METRICS,
  rugby: RUGBY_METRICS,
  swimming: SWIMMING_METRICS,
  tennis: TENNIS_METRICS,
  basketball: BASKETBALL_METRICS,
};

// ========== ALL DEFAULT METRICS (for seeding) ==========

export const ALL_DEFAULT_METRICS = [
  ...GENERAL_FITNESS_METRICS,
  ...FOOTBALL_METRICS,
  ...ATHLETICS_METRICS,
  ...RUGBY_METRICS,
  ...SWIMMING_METRICS,
  ...TENNIS_METRICS,
  ...BASKETBALL_METRICS,
];

// ========== HELPER FUNCTIONS ==========

/**
 * Get all metrics for a specific sport
 * - If sportId is 'fitness' or 'general', return ONLY general fitness metrics
 * - For other sports, return ONLY sport-specific and IQ metrics (exclude fitness)
 */
export const getMetricsBySport = (sportId) => {
  // Special case: Fitness module returns ONLY general fitness tests
  if (sportId === 'fitness' || sportId === 'general') {
    return GENERAL_FITNESS_METRICS;
  }
  
  // For other sports: Return ONLY sport-specific and IQ metrics (NO fitness tests)
  const sportSpecific = SPORT_METRICS_MAP[sportId] || [];
  return sportSpecific;
};

/**
 * Get metrics by category for a sport
 */
export const getMetricsByCategory = (sportId, category) => {
  const allMetrics = getMetricsBySport(sportId);
  return allMetrics.filter(m => m.category === category);
};

/**
 * Get metric by ID
 */
export const getMetricById = (metricId) => {
  return ALL_DEFAULT_METRICS.find(m => m.id === metricId) || null;
};

/**
 * Validate metric value
 */
export const validateMetricValue = (metric, value) => {
  if (metric.minValue !== undefined && value < metric.minValue) {
    return { valid: false, error: `Value must be at least ${metric.minValue}` };
  }
  if (metric.maxValue !== undefined && value > metric.maxValue) {
    return { valid: false, error: `Value must be at most ${metric.maxValue}` };
  }
  return { valid: true };
};

export default {
  GENERAL_FITNESS_METRICS,
  FOOTBALL_METRICS,
  ATHLETICS_METRICS,
  RUGBY_METRICS,
  SWIMMING_METRICS,
  TENNIS_METRICS,
  BASKETBALL_METRICS,
  SPORT_METRICS_MAP,
  ALL_DEFAULT_METRICS,
  getMetricsBySport,
  getMetricsByCategory,
  getMetricById,
  validateMetricValue,
};