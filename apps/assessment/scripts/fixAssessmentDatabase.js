// Location: /apps/assessment/scripts/fixAssessmentDatabase.js
// Comprehensive database fix script - Seeds benchmarks, fixes sport IDs, validates data

const admin = require('firebase-admin');
const serviceAccount = require('../../../firebase-admin-key.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const ACADEMY_ID = 'academy_accellax361_main';

// ========== BENCHMARKS DATA (from benchmarks.js) ==========

const ALL_BENCHMARKS = [
  // Beep Test (7 benchmarks)
  { metricId: 'beep_test', ageGroup: '4-6', gender: null, excellent: 4, good: 3, fair: 2, poor: 1, source: 'Youth Fitness Standard' },
  { metricId: 'beep_test', ageGroup: '7-9', gender: 'male', excellent: 6, good: 5, fair: 4, poor: 3, source: 'Beep Test Standard' },
  { metricId: 'beep_test', ageGroup: '7-9', gender: 'female', excellent: 5, good: 4, fair: 3, poor: 2, source: 'Beep Test Standard' },
  { metricId: 'beep_test', ageGroup: '10-13', gender: 'male', excellent: 9, good: 7, fair: 6, poor: 5, source: 'Beep Test Standard' },
  { metricId: 'beep_test', ageGroup: '10-13', gender: 'female', excellent: 7, good: 6, fair: 5, poor: 4, source: 'Beep Test Standard' },
  { metricId: 'beep_test', ageGroup: '13+', gender: 'male', excellent: 11, good: 9, fair: 8, poor: 7, source: 'Beep Test Standard' },
  { metricId: 'beep_test', ageGroup: '13+', gender: 'female', excellent: 9, good: 7, fair: 6, poor: 5, source: 'Beep Test Standard' },
  
  // Cooper Test (6 benchmarks)
  { metricId: 'cooper_test', ageGroup: '7-9', gender: 'male', excellent: 2000, good: 1700, fair: 1500, poor: 1300, source: 'Cooper Test' },
  { metricId: 'cooper_test', ageGroup: '7-9', gender: 'female', excellent: 1800, good: 1600, fair: 1400, poor: 1200, source: 'Cooper Test' },
  { metricId: 'cooper_test', ageGroup: '10-13', gender: 'male', excellent: 2400, good: 2100, fair: 1900, poor: 1700, source: 'Cooper Test' },
  { metricId: 'cooper_test', ageGroup: '10-13', gender: 'female', excellent: 2200, good: 1900, fair: 1700, poor: 1500, source: 'Cooper Test' },
  { metricId: 'cooper_test', ageGroup: '13+', gender: 'male', excellent: 2700, good: 2400, fair: 2200, poor: 2000, source: 'Cooper Test' },
  { metricId: 'cooper_test', ageGroup: '13+', gender: 'female', excellent: 2400, good: 2100, fair: 1900, poor: 1700, source: 'Cooper Test' },
  
  // Sprint 100m (6 benchmarks)
  { metricId: 'sprint_100m', ageGroup: '7-9', gender: 'male', excellent: 17, good: 19, fair: 21, poor: 23, source: 'Youth Athletics' },
  { metricId: 'sprint_100m', ageGroup: '7-9', gender: 'female', excellent: 18, good: 20, fair: 22, poor: 24, source: 'Youth Athletics' },
  { metricId: 'sprint_100m', ageGroup: '10-13', gender: 'male', excellent: 14, good: 16, fair: 18, poor: 20, source: 'Youth Athletics' },
  { metricId: 'sprint_100m', ageGroup: '10-13', gender: 'female', excellent: 15, good: 17, fair: 19, poor: 21, source: 'Youth Athletics' },
  { metricId: 'sprint_100m', ageGroup: '13+', gender: 'male', excellent: 12, good: 13.5, fair: 15, poor: 16.5, source: 'Youth Athletics' },
  { metricId: 'sprint_100m', ageGroup: '13+', gender: 'female', excellent: 13, good: 14.5, fair: 16, poor: 17.5, source: 'Youth Athletics' },
  
  // Push-ups (6 benchmarks)
  { metricId: 'pushups_1min', ageGroup: '7-9', gender: 'male', excellent: 25, good: 20, fair: 15, poor: 10, source: 'Youth Fitness' },
  { metricId: 'pushups_1min', ageGroup: '7-9', gender: 'female', excellent: 20, good: 15, fair: 12, poor: 8, source: 'Youth Fitness' },
  { metricId: 'pushups_1min', ageGroup: '10-13', gender: 'male', excellent: 35, good: 28, fair: 22, poor: 15, source: 'Youth Fitness' },
  { metricId: 'pushups_1min', ageGroup: '10-13', gender: 'female', excellent: 28, good: 22, fair: 17, poor: 12, source: 'Youth Fitness' },
  { metricId: 'pushups_1min', ageGroup: '13+', gender: 'male', excellent: 45, good: 35, fair: 28, poor: 20, source: 'Youth Fitness' },
  { metricId: 'pushups_1min', ageGroup: '13+', gender: 'female', excellent: 35, good: 28, fair: 22, poor: 15, source: 'Youth Fitness' },
  
  // Sit-ups (6 benchmarks)
  { metricId: 'situps_1min', ageGroup: '7-9', gender: 'male', excellent: 30, good: 25, fair: 20, poor: 15, source: 'Youth Fitness' },
  { metricId: 'situps_1min', ageGroup: '7-9', gender: 'female', excellent: 28, good: 23, fair: 18, poor: 13, source: 'Youth Fitness' },
  { metricId: 'situps_1min', ageGroup: '10-13', gender: 'male', excellent: 42, good: 35, fair: 28, poor: 22, source: 'Youth Fitness' },
  { metricId: 'situps_1min', ageGroup: '10-13', gender: 'female', excellent: 38, good: 32, fair: 26, poor: 20, source: 'Youth Fitness' },
  { metricId: 'situps_1min', ageGroup: '13+', gender: 'male', excellent: 50, good: 42, fair: 35, poor: 28, source: 'Youth Fitness' },
  { metricId: 'situps_1min', ageGroup: '13+', gender: 'female', excellent: 45, good: 38, fair: 32, poor: 25, source: 'Youth Fitness' },
  
  // Flexibility (3 benchmarks - gender neutral)
  { metricId: 'flexibility', ageGroup: '7-9', gender: null, excellent: 15, good: 10, fair: 5, poor: 0, source: 'Youth Fitness' },
  { metricId: 'flexibility', ageGroup: '10-13', gender: null, excellent: 20, good: 15, fair: 10, poor: 5, source: 'Youth Fitness' },
  { metricId: 'flexibility', ageGroup: '13+', gender: null, excellent: 25, good: 18, fair: 12, poor: 6, source: 'Youth Fitness' },
  
  // Agility T-Test (4 benchmarks)
  { metricId: 'agility_ttest', ageGroup: '10-13', gender: 'male', excellent: 11, good: 12, fair: 13, poor: 14, source: 'T-Test Standard' },
  { metricId: 'agility_ttest', ageGroup: '10-13', gender: 'female', excellent: 12, good: 13, fair: 14, poor: 15, source: 'T-Test Standard' },
  { metricId: 'agility_ttest', ageGroup: '13+', gender: 'male', excellent: 9.5, good: 10.5, fair: 11.5, poor: 12.5, source: 'T-Test Standard' },
  { metricId: 'agility_ttest', ageGroup: '13+', gender: 'female', excellent: 10.5, good: 11.5, fair: 12.5, poor: 13.5, source: 'T-Test Standard' },
  
  // Vertical Jump (6 benchmarks)
  { metricId: 'vertical_jump', ageGroup: '7-9', gender: 'male', excellent: 35, good: 30, fair: 25, poor: 20, source: 'Youth Power Test' },
  { metricId: 'vertical_jump', ageGroup: '7-9', gender: 'female', excellent: 32, good: 27, fair: 22, poor: 18, source: 'Youth Power Test' },
  { metricId: 'vertical_jump', ageGroup: '10-13', gender: 'male', excellent: 50, good: 43, fair: 37, poor: 30, source: 'Youth Power Test' },
  { metricId: 'vertical_jump', ageGroup: '10-13', gender: 'female', excellent: 45, good: 38, fair: 32, poor: 26, source: 'Youth Power Test' },
  { metricId: 'vertical_jump', ageGroup: '13+', gender: 'male', excellent: 60, good: 52, fair: 45, poor: 38, source: 'Youth Power Test' },
  { metricId: 'vertical_jump', ageGroup: '13+', gender: 'female', excellent: 52, good: 45, fair: 38, poor: 32, source: 'Youth Power Test' },
  
  // Rating benchmarks (for all sports' rating metrics)
  { metricId: 'rating_general', ageGroup: '4-6', gender: null, excellent: 8, good: 6, fair: 4, poor: 2, source: 'AccellaX Standard' },
  { metricId: 'rating_general', ageGroup: '7-9', gender: null, excellent: 8, good: 6, fair: 4, poor: 2, source: 'AccellaX Standard' },
  { metricId: 'rating_general', ageGroup: '10-13', gender: null, excellent: 8, good: 6, fair: 4, poor: 2, source: 'AccellaX Standard' },
  { metricId: 'rating_general', ageGroup: '13+', gender: null, excellent: 8, good: 6, fair: 4, poor: 2, source: 'AccellaX Standard' },
];

// ========== DEFAULT SPORTS ==========

const DEFAULT_SPORTS = [
  { id: 'fitness', name: 'Fitness', icon: '💪' },
  { id: 'football', name: 'Football', icon: '⚽' },
  { id: 'athletics', name: 'Athletics', icon: '🏃' },
  { id: 'rugby', name: 'Rugby', icon: '🏉' },
  { id: 'swimming', name: 'Swimming', icon: '🏊' },
  { id: 'tennis', name: 'Tennis', icon: '🎾' },
  { id: 'basketball', name: 'Basketball', icon: '🏀' },
];

// ========== DEFAULT METRICS ==========

const ALL_METRICS = [
  // General Fitness Metrics (13 metrics) - NOW LINKED TO 'fitness' SPORT
  { id: 'height', name: 'Height', category: 'general_fitness', type: 'numeric', unit: 'cm', sportId: 'fitness', displayOrder: 1 },
  { id: 'weight', name: 'Weight', category: 'general_fitness', type: 'numeric', unit: 'kg', sportId: 'fitness', displayOrder: 2 },
  { id: 'beep_test', name: 'Beep Test (Endurance)', category: 'general_fitness', type: 'beep_test', unit: 'level', sportId: 'fitness', displayOrder: 3 },
  { id: 'cooper_test', name: 'Cooper Test (12-min run)', category: 'general_fitness', type: 'cooper_test', unit: 'meters', sportId: 'fitness', displayOrder: 4 },
  { id: 'sprint_100m', name: '100m Sprint (Speed)', category: 'general_fitness', type: 'timer', unit: 'seconds', sportId: 'fitness', displayOrder: 5 },
  { id: 'sprint_40m', name: '40m Sprint (Speed)', category: 'general_fitness', type: 'timer', unit: 'seconds', sportId: 'fitness', displayOrder: 6 },
  { id: 'sprint_20m', name: '20m Sprint (Speed)', category: 'general_fitness', type: 'timer', unit: 'seconds', sportId: 'fitness', displayOrder: 7 },
  { id: 'pushups_1min', name: 'Push-ups (Strength)', category: 'general_fitness', type: 'counted', unit: 'reps', sportId: 'fitness', displayOrder: 8 },
  { id: 'situps_1min', name: 'Sit-ups (Core)', category: 'general_fitness', type: 'counted', unit: 'reps', sportId: 'fitness', displayOrder: 9 },
  { id: 'flexibility', name: 'Sit-and-Reach (Flexibility)', category: 'general_fitness', type: 'numeric', unit: 'cm', sportId: 'fitness', displayOrder: 10 },
  { id: 'agility_ttest', name: 'T-Test (Agility)', category: 'general_fitness', type: 'timer', unit: 'seconds', sportId: 'fitness', displayOrder: 11 },
  { id: 'vertical_jump', name: 'Vertical Jump (Power)', category: 'general_fitness', type: 'numeric', unit: 'cm', sportId: 'fitness', displayOrder: 12 },
  { id: 'standing_broad_jump', name: 'Standing Broad Jump (Power)', category: 'general_fitness', type: 'numeric', unit: 'cm', sportId: 'fitness', displayOrder: 13 },
  
  // Football Metrics (6 metrics)
  { id: 'football_passing', name: 'Passing', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'football', displayOrder: 1 },
  { id: 'football_receiving', name: 'Receiving the Ball', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'football', displayOrder: 2 },
  { id: 'football_dribbling', name: 'Dribbling', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'football', displayOrder: 3 },
  { id: 'football_shooting', name: 'Shooting', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'football', displayOrder: 4 },
  { id: 'football_defending', name: 'Defending', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'football', displayOrder: 5 },
  { id: 'football_iq', name: 'Football IQ', category: 'iq', type: 'rating', unit: '/10', sportId: 'football', displayOrder: 6 },
  
  // Athletics Metrics (6 metrics)
  { id: 'athletics_body_alignment', name: 'Body Alignment', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'athletics', displayOrder: 1 },
  { id: 'athletics_arm_action', name: 'Arm Action', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'athletics', displayOrder: 2 },
  { id: 'athletics_knee_drive', name: 'Knee Drive', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'athletics', displayOrder: 3 },
  { id: 'athletics_foot_landing', name: 'Foot Landing Position', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'athletics', displayOrder: 4 },
  { id: 'athletics_coordination', name: 'Coordination', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'athletics', displayOrder: 5 },
  { id: 'athletics_iq', name: 'Athletics IQ', category: 'iq', type: 'rating', unit: '/10', sportId: 'athletics', displayOrder: 6 },
  
  // Rugby Metrics (6 metrics)
  { id: 'rugby_passing', name: 'Passing', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'rugby', displayOrder: 1 },
  { id: 'rugby_receiving', name: 'Receiving the Ball', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'rugby', displayOrder: 2 },
  { id: 'rugby_running', name: 'Running with the Ball', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'rugby', displayOrder: 3 },
  { id: 'rugby_defending', name: 'Defending (Tackling)', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'rugby', displayOrder: 4 },
  { id: 'rugby_kicking', name: 'Kicking', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'rugby', displayOrder: 5 },
  { id: 'rugby_iq', name: 'Rugby IQ', category: 'iq', type: 'rating', unit: '/10', sportId: 'rugby', displayOrder: 6 },
  
  // Swimming Metrics (6 metrics)
  { id: 'swimming_body_positioning', name: 'Body Positioning', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'swimming', displayOrder: 1 },
  { id: 'swimming_breathing', name: 'Breathing', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'swimming', displayOrder: 2 },
  { id: 'swimming_arm_recovery', name: 'Arm Recovery', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'swimming', displayOrder: 3 },
  { id: 'swimming_underwater_catch', name: 'Underwater Catch', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'swimming', displayOrder: 4 },
  { id: 'swimming_kicking', name: 'Kicking', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'swimming', displayOrder: 5 },
  { id: 'swimming_iq', name: 'Swimming IQ', category: 'iq', type: 'rating', unit: '/10', sportId: 'swimming', displayOrder: 6 },
  
  // Tennis Metrics (6 metrics)
  { id: 'tennis_serve', name: 'Serve', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'tennis', displayOrder: 1 },
  { id: 'tennis_forehand', name: 'Forehand', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'tennis', displayOrder: 2 },
  { id: 'tennis_backhand', name: 'Backhand', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'tennis', displayOrder: 3 },
  { id: 'tennis_volley', name: 'Volley', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'tennis', displayOrder: 4 },
  { id: 'tennis_footwork', name: 'Footwork', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'tennis', displayOrder: 5 },
  { id: 'tennis_iq', name: 'Tennis IQ', category: 'iq', type: 'rating', unit: '/10', sportId: 'tennis', displayOrder: 6 },
  
  // Basketball Metrics (7 metrics)
  { id: 'basketball_passing', name: 'Passing', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'basketball', displayOrder: 1 },
  { id: 'basketball_receiving', name: 'Receiving/Catching', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'basketball', displayOrder: 2 },
  { id: 'basketball_shooting', name: 'Shooting', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'basketball', displayOrder: 3 },
  { id: 'basketball_layup', name: 'Layup', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'basketball', displayOrder: 4 },
  { id: 'basketball_dribbling', name: 'Dribbling/Ball Control', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'basketball', displayOrder: 5 },
  { id: 'basketball_defending', name: 'Defending', category: 'sport_specific', type: 'rating', unit: '/10', sportId: 'basketball', displayOrder: 6 },
  { id: 'basketball_iq', name: 'Basketball IQ', category: 'iq', type: 'rating', unit: '/10', sportId: 'basketball', displayOrder: 7 },
];

// ========== FIX FUNCTIONS ==========

/**
 * 2. Seed metrics to Firebase
 */
async function seedMetrics() {
  console.log('\n🌱 SEEDING METRICS TO FIREBASE...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const metric of ALL_METRICS) {
    try {
      const metricRef = db.doc(`academies/${ACADEMY_ID}/metrics/${metric.id}`);
      
      await metricRef.set({
        id: metric.id,
        academy_id: ACADEMY_ID,
        sport_id: metric.sportId,
        name: metric.name,
        category: metric.category,
        type: metric.type,
        unit: metric.unit || null,
        min_value: null,
        max_value: null,
        is_default: 1,
        display_order: metric.displayOrder,
        created_by: 'system',
        created_at: admin.firestore.Timestamp.now(),
        firebase_synced: 1,
      });
      
      successCount++;
      console.log(`  ✅ Seeded: ${metric.name} (${metric.category})`);
      
    } catch (error) {
      errorCount++;
      console.error(`  ❌ Error seeding metric ${metric.name}:`, error.message);
    }
  }
  
  console.log(`\n✅ Metrics seeded: ${successCount}/${ALL_METRICS.length}`);
  if (errorCount > 0) {
    console.log(`⚠️  Errors: ${errorCount}`);
  }
  
  return { success: successCount, errors: errorCount };
}

/**
 * 3. Seed benchmarks to Firebase
 */
async function seedBenchmarks() {
  console.log('\n🌱 SEEDING BENCHMARKS TO FIREBASE...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const benchmark of ALL_BENCHMARKS) {
    try {
      // Create unique ID for benchmark
      const benchmarkId = `${benchmark.metricId}_${benchmark.ageGroup}_${benchmark.gender || 'all'}`;
      
      const benchmarkRef = db.doc(`academies/${ACADEMY_ID}/benchmarks/${benchmarkId}`);
      
      await benchmarkRef.set({
        id: benchmarkId,
        metric_id: benchmark.metricId,
        age_group: benchmark.ageGroup,
        gender: benchmark.gender,
        excellent_min: benchmark.excellent,
        good_min: benchmark.good,
        fair_min: benchmark.fair,
        poor_max: benchmark.poor,
        source: benchmark.source,
        created_at: admin.firestore.Timestamp.now(),
      });
      
      successCount++;
      console.log(`  ✅ Seeded: ${benchmarkId}`);
      
    } catch (error) {
      errorCount++;
      console.error(`  ❌ Error seeding benchmark:`, error.message);
    }
  }
  
  console.log(`\n✅ Benchmarks seeded: ${successCount}/${ALL_BENCHMARKS.length}`);
  if (errorCount > 0) {
    console.log(`⚠️  Errors: ${errorCount}`);
  }
  
  return { success: successCount, errors: errorCount };
}

/**
 * 2. Fix sport IDs in assessments (map unknown sports to correct IDs)
 */
async function fixSportIds() {
  console.log('\n🔧 FIXING SPORT IDs IN ASSESSMENTS...\n');
  
  const assessmentsRef = db.collection(`academies/${ACADEMY_ID}/assessments`);
  const snapshot = await assessmentsRef.get();
  
  let fixedCount = 0;
  let unknownCount = 0;
  
  for (const doc of snapshot.docs) {
    const assessment = doc.data();
    
    // Check if sport_id is valid
    const sportExists = DEFAULT_SPORTS.find(s => s.id === assessment.sport_id);
    
    if (!sportExists) {
      unknownCount++;
      console.log(`  ⚠️  Assessment ${doc.id} has unknown sport_id: "${assessment.sport_id}"`);
      
      // Try to infer sport from metrics
      if (assessment.results && assessment.results.length > 0) {
        const firstMetric = assessment.results[0].metric_id;
        
        // Map metric prefixes to sports
        let inferredSport = null;
        if (firstMetric?.includes('football')) inferredSport = 'football';
        else if (firstMetric?.includes('athletics')) inferredSport = 'athletics';
        else if (firstMetric?.includes('rugby')) inferredSport = 'rugby';
        else if (firstMetric?.includes('swimming')) inferredSport = 'swimming';
        else if (firstMetric?.includes('tennis')) inferredSport = 'tennis';
        else if (firstMetric?.includes('basketball')) inferredSport = 'basketball';
        
        if (inferredSport) {
          console.log(`     → Inferred sport: ${inferredSport} (from metric: ${firstMetric})`);
          console.log(`     → Updating assessment...`);
          
          await doc.ref.update({
            sport_id: inferredSport,
            updated_at: admin.firestore.Timestamp.now(),
            fixed_by_script: true,
          });
          
          fixedCount++;
          console.log(`     ✅ Fixed!`);
        } else {
          console.log(`     ❌ Could not infer sport from metrics`);
        }
      } else {
        console.log(`     ❌ No results to infer sport from`);
      }
    }
  }
  
  console.log(`\n✅ Fixed ${fixedCount} assessments with unknown sport IDs`);
  console.log(`⚠️  ${unknownCount - fixedCount} assessments still have issues`);
  
  return { fixed: fixedCount, remaining: unknownCount - fixedCount };
}

/**
 * 3. Verify sports exist in Firebase
 */
async function verifySports() {
  console.log('\n🔍 VERIFYING SPORTS IN FIREBASE...\n');
  
  const sportsRef = db.collection(`academies/${ACADEMY_ID}/sports`);
  const snapshot = await sportsRef.get();
  
  const existingSports = [];
  snapshot.forEach(doc => {
    const sport = doc.data();
    existingSports.push(sport.id);
    console.log(`  ✅ Found: ${sport.name} (${sport.id})`);
  });
  
  // Check for missing sports
  const missingSports = DEFAULT_SPORTS.filter(s => !existingSports.includes(s.id));
  
  if (missingSports.length > 0) {
    console.log(`\n⚠️  Missing ${missingSports.length} sports. Adding them now...`);
    
    for (const sport of missingSports) {
      const sportRef = db.doc(`academies/${ACADEMY_ID}/sports/${sport.id}`);
      await sportRef.set({
        id: sport.id,
        academy_id: ACADEMY_ID,
        name: sport.name,
        icon: sport.icon,
        is_default: 1,
        is_active: 1,
        created_by: 'system',
        created_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now(),
        firebase_synced: 1,
      });
      console.log(`  ✅ Added: ${sport.name}`);
    }
  } else {
    console.log(`\n✅ All default sports exist in Firebase`);
  }
  
  return { existing: existingSports.length, added: missingSports.length };
}

/**
 * 4. Validate assessment data integrity
 */
async function validateAssessments() {
  console.log('\n🔍 VALIDATING ASSESSMENT DATA INTEGRITY...\n');
  
  const assessmentsRef = db.collection(`academies/${ACADEMY_ID}/assessments`);
  const snapshot = await assessmentsRef.get();
  
  let totalAssessments = 0;
  let assessmentsWithResults = 0;
  let assessmentsWithoutResults = 0;
  let totalResults = 0;
  
  const issues = [];
  
  for (const doc of snapshot.docs) {
    totalAssessments++;
    const assessment = doc.data();
    
    if (!assessment.results || assessment.results.length === 0) {
      assessmentsWithoutResults++;
      issues.push({
        id: doc.id,
        issue: 'No results',
        kid_id: assessment.kid_id,
        sport_id: assessment.sport_id,
        date: assessment.assessment_date,
      });
    } else {
      assessmentsWithResults++;
      totalResults += assessment.results.length;
    }
    
    // Check for missing required fields
    if (!assessment.kid_id) {
      issues.push({ id: doc.id, issue: 'Missing kid_id' });
    }
    if (!assessment.sport_id) {
      issues.push({ id: doc.id, issue: 'Missing sport_id' });
    }
    if (!assessment.assessment_date) {
      issues.push({ id: doc.id, issue: 'Missing assessment_date' });
    }
  }
  
  console.log(`📊 VALIDATION SUMMARY:`);
  console.log(`   Total Assessments: ${totalAssessments}`);
  console.log(`   With Results: ${assessmentsWithResults}`);
  console.log(`   Without Results: ${assessmentsWithoutResults}`);
  console.log(`   Total Results: ${totalResults}`);
  console.log(`   Average Results per Assessment: ${Math.round(totalResults / totalAssessments * 10) / 10}`);
  
  if (issues.length > 0) {
    console.log(`\n⚠️  Found ${issues.length} issues:`);
    issues.forEach(issue => {
      console.log(`   - Assessment ${issue.id}: ${issue.issue}`);
    });
  } else {
    console.log(`\n✅ No data integrity issues found!`);
  }
  
  return { total: totalAssessments, issues: issues.length };
}

/**
 * 5. Generate detailed report
 */
async function generateReport() {
  console.log('\n📊 GENERATING DATABASE HEALTH REPORT...\n');
  
  // Count collections
  const kidsSnapshot = await db.collection(`academies/${ACADEMY_ID}/kids`).where('status', '==', 'active').get();
  const sportsSnapshot = await db.collection(`academies/${ACADEMY_ID}/sports`).where('is_active', '==', 1).get();
  const metricsSnapshot = await db.collection(`academies/${ACADEMY_ID}/metrics`).get();
  const benchmarksSnapshot = await db.collection(`academies/${ACADEMY_ID}/benchmarks`).get();
  const assessmentsSnapshot = await db.collection(`academies/${ACADEMY_ID}/assessments`).get();
  
  console.log(`${'═'.repeat(80)}`);
  console.log(`DATABASE HEALTH REPORT - ${new Date().toLocaleString()}`);
  console.log(`${'═'.repeat(80)}`);
  console.log(`\n📈 COLLECTION COUNTS:`);
  console.log(`   Kids (Active):        ${kidsSnapshot.size}`);
  console.log(`   Sports (Active):      ${sportsSnapshot.size}`);
  console.log(`   Metrics:              ${metricsSnapshot.size}`);
  console.log(`   Benchmarks:           ${benchmarksSnapshot.size}`);
  console.log(`   Assessments:          ${assessmentsSnapshot.size}`);
  
  // Calculate total results
  let totalResults = 0;
  assessmentsSnapshot.forEach(doc => {
    const assessment = doc.data();
    if (assessment.results) {
      totalResults += assessment.results.length;
    }
  });
  console.log(`   Assessment Results:   ${totalResults}`);
  
  console.log(`\n${'═'.repeat(80)}`);
  
  return {
    kids: kidsSnapshot.size,
    sports: sportsSnapshot.size,
    metrics: metricsSnapshot.size,
    benchmarks: benchmarksSnapshot.size,
    assessments: assessmentsSnapshot.size,
    results: totalResults,
  };
}

// ========== MAIN EXECUTION ==========

async function fixDatabase() {
  try {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║         🔧 ACCELLAX 361° ASSESSMENT DATABASE FIX SCRIPT 🔧                    ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════════╝');
    console.log('\n');
    
    // Step 1: Generate initial report
    console.log('📊 Step 1/6: Initial Database Health Check');
    await generateReport();
    
    // Step 2: Verify and add missing sports
    console.log('\n📊 Step 2/6: Verify Sports');
    await verifySports();
    
    // Step 3: Seed metrics
    console.log('\n📊 Step 3/6: Seed Metrics');
    await seedMetrics();
    
    // Step 4: Seed benchmarks
    console.log('\n📊 Step 4/6: Seed Benchmarks');
    await seedBenchmarks();
    
    // Step 5: Fix sport IDs in assessments
    console.log('\n📊 Step 5/6: Fix Assessment Sport IDs');
    await fixSportIds();
    
    // Step 6: Validate data integrity
    console.log('\n📊 Step 6/6: Validate Data Integrity');
    await validateAssessments();
    
    // Final report
    console.log('\n\n');
    console.log('╔════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                     ✅ DATABASE FIX COMPLETE ✅                                ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════════╝');
    
    await generateReport();
    
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Run: node scripts/listAssessments.js');
    console.log('   2. Verify benchmarks are now loaded');
    console.log('   3. Check that "Unknown Sport" issues are resolved');
    console.log('   4. Review performance levels in detailed assessments\n');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error);
    console.error('\nPlease check:');
    console.error('  1. Firebase credentials are correct');
    console.error('  2. Network connection is stable');
    console.error('  3. Firebase permissions allow write access\n');
  } finally {
    process.exit(0);
  }
}

// Run the fix
fixDatabase();