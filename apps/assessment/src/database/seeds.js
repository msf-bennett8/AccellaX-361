// Location: /apps/assessment/src/database/seeds.js
// Seed data for default sports, metrics, and benchmarks

import { insertSport, insertMetric, insertBenchmark } from './db';

const FIXED_ACADEMY_ID = 'academy_accellax361_main';

// ========== DEFAULT SPORTS ==========

export const DEFAULT_SPORTS = [
  {
    id: 'football',
    name: 'Football',
    icon: '⚽',
    isDefault: true,
  },
  {
    id: 'athletics',
    name: 'Athletics',
    icon: '🏃',
    isDefault: true,
  },
  {
    id: 'rugby',
    name: 'Rugby',
    icon: '🏉',
    isDefault: true,
  },
  {
    id: 'swimming',
    name: 'Swimming',
    icon: '🏊',
    isDefault: true,
  },
  {
    id: 'tennis',
    name: 'Tennis',
    icon: '🎾',
    isDefault: true,
  },
  {
    id: 'basketball',
    name: 'Basketball',
    icon: '🏀',
    isDefault: true,
  },
];

// ========== DEFAULT METRICS PER SPORT ==========

export const DEFAULT_METRICS = {
  // ===== GENERAL FITNESS (ALL SPORTS) =====
  general: [
    {
      id: 'gen_height',
      name: 'Height',
      category: 'general_fitness',
      type: 'numeric',
      unit: 'cm',
      minValue: 50,
      maxValue: 250,
      displayOrder: 1,
    },
    {
      id: 'gen_weight',
      name: 'Weight',
      category: 'general_fitness',
      type: 'numeric',
      unit: 'kg',
      minValue: 10,
      maxValue: 150,
      displayOrder: 2,
    },
    {
      id: 'gen_endurance',
      name: 'Endurance (12-min run)',
      category: 'general_fitness',
      type: 'numeric',
      unit: 'meters',
      minValue: 0,
      maxValue: 4000,
      displayOrder: 3,
    },
    {
      id: 'gen_strength',
      name: 'Strength (Push-ups in 1 min)',
      category: 'general_fitness',
      type: 'counted',
      unit: 'reps',
      minValue: 0,
      maxValue: 100,
      displayOrder: 4,
    },
    {
      id: 'gen_flexibility',
      name: 'Flexibility (Sit & Reach)',
      category: 'general_fitness',
      type: 'numeric',
      unit: 'cm',
      minValue: -20,
      maxValue: 50,
      displayOrder: 5,
    },
    {
      id: 'gen_agility',
      name: 'Agility (T-Test)',
      category: 'general_fitness',
      type: 'timed',
      unit: 'seconds',
      minValue: 5,
      maxValue: 30,
      displayOrder: 6,
    },
    {
      id: 'gen_speed',
      name: 'Speed (100m Sprint)',
      category: 'general_fitness',
      type: 'timed',
      unit: 'seconds',
      minValue: 10,
      maxValue: 30,
      displayOrder: 7,
    },
    {
      id: 'gen_power',
      name: 'Power (Vertical Jump)',
      category: 'general_fitness',
      type: 'numeric',
      unit: 'cm',
      minValue: 0,
      maxValue: 100,
      displayOrder: 8,
    },
  ],

  // ===== FOOTBALL =====
  football: [
    {
      id: 'fb_passing',
      name: 'Passing',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 1,
    },
    {
      id: 'fb_receiving',
      name: 'Receiving the Ball',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 2,
    },
    {
      id: 'fb_dribbling',
      name: 'Dribbling',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 3,
    },
    {
      id: 'fb_shooting',
      name: 'Shooting',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 4,
    },
    {
      id: 'fb_defending',
      name: 'Defending',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 5,
    },
    {
      id: 'fb_iq',
      name: 'Soccer IQ',
      category: 'iq',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 6,
    },
  ],

  // ===== ATHLETICS =====
  athletics: [
    {
      id: 'ath_body_alignment',
      name: 'Body Alignment',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 1,
    },
    {
      id: 'ath_arm_action',
      name: 'Arm Action',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 2,
    },
    {
      id: 'ath_knee_drive',
      name: 'Knee Drive',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 3,
    },
    {
      id: 'ath_foot_landing',
      name: 'Foot Landing Position',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 4,
    },
    {
      id: 'ath_coordination',
      name: 'Coordination',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 5,
    },
    {
      id: 'ath_iq',
      name: 'Athletics IQ',
      category: 'iq',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 6,
    },
  ],

  // ===== RUGBY =====
  rugby: [
    {
      id: 'rg_passing',
      name: 'Passing',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 1,
    },
    {
      id: 'rg_receiving',
      name: 'Receiving the Ball',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 2,
    },
    {
      id: 'rg_running',
      name: 'Running with the Ball',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 3,
    },
    {
      id: 'rg_defending',
      name: 'Defending',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 4,
    },
    {
      id: 'rg_kicking',
      name: 'Kicking',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 5,
    },
    {
      id: 'rg_iq',
      name: 'Rugby IQ',
      category: 'iq',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 6,
    },
  ],

  // ===== SWIMMING =====
  swimming: [
    {
      id: 'sw_body_position',
      name: 'Body Positioning',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 1,
    },
    {
      id: 'sw_breathing',
      name: 'Breathing',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 2,
    },
    {
      id: 'sw_arm_recovery',
      name: 'Arm Recovery',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 3,
    },
    {
      id: 'sw_underwater_catch',
      name: 'Underwater Catch',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 4,
    },
    {
      id: 'sw_kicking',
      name: 'Kicking',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 5,
    },
    {
      id: 'sw_iq',
      name: 'Swimming IQ',
      category: 'iq',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 6,
    },
  ],

  // ===== TENNIS =====
  tennis: [
    {
      id: 'tn_serve',
      name: 'Serve',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 1,
    },
    {
      id: 'tn_forehand',
      name: 'Forehand',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 2,
    },
    {
      id: 'tn_backhand',
      name: 'Backhand',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 3,
    },
    {
      id: 'tn_volley',
      name: 'Volley',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 4,
    },
    {
      id: 'tn_footwork',
      name: 'Footwork',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 5,
    },
    {
      id: 'tn_iq',
      name: 'Tennis IQ',
      category: 'iq',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 6,
    },
  ],

  // ===== BASKETBALL =====
  basketball: [
    {
      id: 'bb_passing',
      name: 'Passing',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 1,
    },
    {
      id: 'bb_shooting',
      name: 'Shooting',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 2,
    },
    {
      id: 'bb_layup',
      name: 'Layup',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 3,
    },
    {
      id: 'bb_dribbling',
      name: 'Dribbling/Ball Control',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 4,
    },
    {
      id: 'bb_defending',
      name: 'Defending',
      category: 'sport_specific',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 5,
    },
    {
      id: 'bb_iq',
      name: 'Basketball IQ',
      category: 'iq',
      type: 'rating',
      unit: '/10',
      minValue: 1,
      maxValue: 10,
      displayOrder: 6,
    },
  ],
};

// ========== DEFAULT BENCHMARKS (Sample for U10 Endurance) ==========

export const DEFAULT_BENCHMARKS = [
  // U10 Endurance (12-min run) - based on Cooper Test
  {
    metricId: 'gen_endurance',
    ageGroup: '10-13',
    gender: 'male',
    excellentMin: 2400,
    goodMin: 2000,
    fairMin: 1600,
    poorMax: 1599,
    source: 'Cooper Test',
  },
  {
    metricId: 'gen_endurance',
    ageGroup: '10-13',
    gender: 'female',
    excellentMin: 2200,
    goodMin: 1800,
    fairMin: 1400,
    poorMax: 1399,
    source: 'Cooper Test',
  },
  // U7-9 Endurance
  {
    metricId: 'gen_endurance',
    ageGroup: '7-9',
    gender: 'male',
    excellentMin: 2000,
    goodMin: 1600,
    fairMin: 1200,
    poorMax: 1199,
    source: 'Cooper Test (Modified)',
  },
  {
    metricId: 'gen_endurance',
    ageGroup: '7-9',
    gender: 'female',
    excellentMin: 1800,
    goodMin: 1400,
    fairMin: 1000,
    poorMax: 999,
    source: 'Cooper Test (Modified)',
  },
];

// ========== SEED FUNCTIONS ==========

/**
 * Seed default sports into the database
 */
export const seedSports = async (userId) => {
  console.log('🌱 Seeding default sports...');
  
  try {
    let successCount = 0;
    
    for (const sport of DEFAULT_SPORTS) {
      try {
        await insertSport(sport, userId);
        successCount++;
        console.log(`✅ Seeded sport: ${sport.name}`);
      } catch (error) {
        // Sport might already exist, skip error
        console.log(`⏭️ Sport already exists: ${sport.name}`);
      }
    }
    
    console.log(`✅ Seeded ${successCount}/${DEFAULT_SPORTS.length} sports`);
    return { success: true, count: successCount };
    
  } catch (error) {
    console.error('❌ Error seeding sports:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Seed default metrics for a specific sport
 */
export const seedMetricsForSport = async (sportId, userId) => {
  console.log(`🌱 Seeding metrics for ${sportId}...`);
  
  try {
    const sportMetrics = DEFAULT_METRICS[sportId];
    if (!sportMetrics) {
      console.log(`⚠️ No default metrics found for ${sportId}`);
      return { success: true, count: 0 };
    }
    
    let successCount = 0;
    
    // Seed general fitness metrics (shared across all sports)
    for (const metric of DEFAULT_METRICS.general) {
      try {
        await insertMetric({
          id: `${sportId}_${metric.id}`,
          sportId,
          name: metric.name,
          category: metric.category,
          type: metric.type,
          unit: metric.unit,
          minValue: metric.minValue,
          maxValue: metric.maxValue,
          isDefault: true,
          displayOrder: metric.displayOrder,
        }, userId);
        successCount++;
      } catch (error) {
        // Metric might already exist
      }
    }
    
    // Seed sport-specific metrics
    for (const metric of sportMetrics) {
      try {
        await insertMetric({
          id: `${sportId}_${metric.id}`,
          sportId,
          name: metric.name,
          category: metric.category,
          type: metric.type,
          unit: metric.unit,
          minValue: metric.minValue,
          maxValue: metric.maxValue,
          isDefault: true,
          displayOrder: metric.displayOrder + 100, // Place after general fitness
        }, userId);
        successCount++;
      } catch (error) {
        // Metric might already exist
      }
    }
    
    console.log(`✅ Seeded ${successCount} metrics for ${sportId}`);
    return { success: true, count: successCount };
    
  } catch (error) {
    console.error(`❌ Error seeding metrics for ${sportId}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Seed all default metrics for all sports
 */
export const seedAllMetrics = async (userId) => {
  console.log('🌱 Seeding all default metrics...');
  
  try {
    let totalCount = 0;
    
    for (const sport of DEFAULT_SPORTS) {
      const result = await seedMetricsForSport(sport.id, userId);
      totalCount += result.count || 0;
    }
    
    console.log(`✅ Seeded ${totalCount} total metrics across all sports`);
    return { success: true, count: totalCount };
    
  } catch (error) {
    console.error('❌ Error seeding all metrics:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Seed default benchmarks
 */
export const seedBenchmarks = async () => {
  console.log('🌱 Seeding default benchmarks...');
  
  try {
    let successCount = 0;
    
    for (const benchmark of DEFAULT_BENCHMARKS) {
      try {
        await insertBenchmark(benchmark);
        successCount++;
      } catch (error) {
        // Benchmark might already exist
      }
    }
    
    console.log(`✅ Seeded ${successCount}/${DEFAULT_BENCHMARKS.length} benchmarks`);
    return { success: true, count: successCount };
    
  } catch (error) {
    console.error('❌ Error seeding benchmarks:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Seed all default data (sports, metrics, benchmarks)
 */
export const seedAllDefaultData = async (userId) => {
  console.log('🌱 ========== SEEDING ALL DEFAULT DATA ==========');
  
  try {
    const results = {
      sports: 0,
      metrics: 0,
      benchmarks: 0,
    };
    
    // Step 1: Seed sports
    const sportsResult = await seedSports(userId);
    results.sports = sportsResult.count || 0;
    
    // Step 2: Seed metrics
    const metricsResult = await seedAllMetrics(userId);
    results.metrics = metricsResult.count || 0;
    
    // Step 3: Seed benchmarks
    const benchmarksResult = await seedBenchmarks();
    results.benchmarks = benchmarksResult.count || 0;
    
    console.log('✅ ========== SEEDING COMPLETE ==========');
    console.log(`   Sports: ${results.sports}`);
    console.log(`   Metrics: ${results.metrics}`);
    console.log(`   Benchmarks: ${results.benchmarks}`);
    
    return { success: true, results };
    
  } catch (error) {
    console.error('❌ Error seeding all default data:', error);
    return { success: false, error: error.message };
  }
};

export default {
  DEFAULT_SPORTS,
  DEFAULT_METRICS,
  DEFAULT_BENCHMARKS,
  seedSports,
  seedMetricsForSport,
  seedAllMetrics,
  seedBenchmarks,
  seedAllDefaultData,
};