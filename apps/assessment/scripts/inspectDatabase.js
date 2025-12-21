// Location: /apps/assessment/scripts/inspectDatabase.js
// Database Inspection Script - View sports, metrics, and benchmarks

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

// ========== INSPECTION FUNCTIONS ==========

async function inspectSports() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║           SPORTS INSPECTION             ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  try {
    const sportsRef = db.collection(`academies/${ACADEMY_ID}/sports`);
    const snapshot = await sportsRef.get(); // ✅ Use .get() not getDocs()
    
    if (snapshot.empty) {
      console.log('❌ No sports found in Firebase');
      return [];
    }
    
    const sports = [];
    snapshot.forEach(doc => {
      const sport = doc.data();
      sports.push(sport);
      console.log(`✅ ${sport.name.padEnd(15)} (${sport.id})`);
    });
    
    console.log(`\n📊 Total: ${sports.length} sports\n`);
    return sports;
    
  } catch (error) {
    console.error('❌ Error inspecting sports:', error);
    return [];
  }
}

async function inspectMetrics() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║          METRICS INSPECTION             ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  try {
    const metricsRef = db.collection(`academies/${ACADEMY_ID}/metrics`);
    const snapshot = await metricsRef.get(); // ✅ Use .get() not getDocs()
    
    if (snapshot.empty) {
      console.log('❌ No metrics found in Firebase');
      return [];
    }
    
    const metrics = [];
    const bySport = {};
    
    snapshot.forEach(doc => {
      const metric = doc.data();
      metrics.push(metric);
      
      if (!bySport[metric.sport_id]) {
        bySport[metric.sport_id] = [];
      }
      bySport[metric.sport_id].push(metric);
    });
    
    // Display by sport
    for (const [sportId, sportMetrics] of Object.entries(bySport)) {
      console.log(`\n📊 ${sportId.toUpperCase()} (${sportMetrics.length} metrics):`);
      console.log('─'.repeat(60));
      
      sportMetrics
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        .forEach((metric, index) => {
          console.log(`  ${(index + 1).toString().padStart(2)}. ${metric.name.padEnd(35)} [${metric.type}] ${metric.unit || ''}`);
        });
    }
    
    console.log(`\n📊 Total: ${metrics.length} metrics across ${Object.keys(bySport).length} sports\n`);
    return metrics;
    
  } catch (error) {
    console.error('❌ Error inspecting metrics:', error);
    return [];
  }
}

async function inspectBenchmarks() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║        BENCHMARKS INSPECTION            ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  try {
    const benchmarksRef = db.collection(`academies/${ACADEMY_ID}/benchmarks`);
    const snapshot = await benchmarksRef.get(); // ✅ Use .get() not getDocs()
    
    if (snapshot.empty) {
      console.log('❌ No benchmarks found in Firebase');
      return { valid: 0, invalid: 0, total: 0 };
    }
    
    const benchmarks = [];
    const byMetric = {};
    const invalid = [];
    
    snapshot.forEach(doc => {
      const benchmark = doc.data();
      benchmarks.push(benchmark);
      
      // Check for invalid benchmarks
      if (!benchmark.metric_id) {
        invalid.push({ id: doc.id, ...benchmark });
        return;
      }
      
      if (!byMetric[benchmark.metric_id]) {
        byMetric[benchmark.metric_id] = [];
      }
      byMetric[benchmark.metric_id].push(benchmark);
    });
    
    // Display invalid benchmarks first
    if (invalid.length > 0) {
      console.log('⚠️  INVALID BENCHMARKS (missing metric_id):');
      console.log('─'.repeat(60));
      invalid.forEach(b => {
        console.log(`  ❌ ID: ${b.id}`);
        console.log(`     Age Group: ${b.age_group || 'N/A'}`);
        console.log(`     Gender: ${b.gender || 'all'}`);
        console.log(`     Values: Excellent=${b.excellent_min}, Good=${b.good_min}, Fair=${b.fair_min}, Poor=${b.poor_max}`);
        console.log('');
      });
    }
    
    // Display by metric
    console.log('✅ VALID BENCHMARKS BY METRIC:');
    console.log('─'.repeat(60));
    
    for (const [metricId, metricBenchmarks] of Object.entries(byMetric)) {
      console.log(`\n📊 ${metricId} (${metricBenchmarks.length} benchmarks):`);
      
      metricBenchmarks
        .sort((a, b) => {
          const ageOrder = ['4-6', '7-9', '10-13', '13+'];
          const aIndex = ageOrder.indexOf(a.age_group);
          const bIndex = ageOrder.indexOf(b.age_group);
          if (aIndex !== bIndex) return aIndex - bIndex;
          return (a.gender || '').localeCompare(b.gender || '');
        })
        .forEach(b => {
          const genderLabel = b.gender ? ` (${b.gender})` : ' (all)';
          console.log(`  • ${b.age_group}${genderLabel.padEnd(10)} → Excellent: ${b.excellent_min}, Good: ${b.good_min}, Fair: ${b.fair_min}, Poor: ${b.poor_max}`);
        });
    }
    
    console.log(`\n📊 Total: ${benchmarks.length} benchmarks`);
    console.log(`✅ Valid: ${benchmarks.length - invalid.length}`);
    console.log(`❌ Invalid: ${invalid.length}\n`);
    
    return { valid: benchmarks.length - invalid.length, invalid: invalid.length, total: benchmarks.length };
    
  } catch (error) {
    console.error('❌ Error inspecting benchmarks:', error);
    return { valid: 0, invalid: 0, total: 0 };
  }
}

async function validateDataIntegrity() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║      DATA INTEGRITY VALIDATION          ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  try {
    const metricsRef = db.collection(`academies/${ACADEMY_ID}/metrics`);
    const benchmarksRef = db.collection(`academies/${ACADEMY_ID}/benchmarks`);
    
    const metricsSnapshot = await metricsRef.get(); // ✅ Use .get()
    const benchmarksSnapshot = await benchmarksRef.get(); // ✅ Use .get()
    
    const metricIds = new Set();
    metricsSnapshot.forEach(doc => metricIds.add(doc.data().metric_id || doc.data().id));
    
    const orphanedBenchmarks = [];
    benchmarksSnapshot.forEach(doc => {
      const benchmark = doc.data();
      if (benchmark.metric_id && !metricIds.has(benchmark.metric_id)) {
        orphanedBenchmarks.push({
          id: doc.id,
          metricId: benchmark.metric_id,
          ageGroup: benchmark.age_group,
        });
      }
    });
    
    if (orphanedBenchmarks.length > 0) {
      console.log('⚠️  ORPHANED BENCHMARKS (metric does not exist):');
      console.log('─'.repeat(60));
      orphanedBenchmarks.forEach(b => {
        console.log(`  ❌ ${b.id} → metric_id: ${b.metricId} (age: ${b.ageGroup})`);
      });
      console.log('');
    } else {
      console.log('✅ No orphaned benchmarks found\n');
    }
    
    return orphanedBenchmarks.length === 0;
    
  } catch (error) {
    console.error('❌ Error validating data integrity:', error);
    return false;
  }
}

// ========== MAIN EXECUTION ==========

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       ACCELLAX 361° DATABASE INSPECTION TOOL              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  try {
    const sports = await inspectSports();
    const metrics = await inspectMetrics();
    const benchmarkStats = await inspectBenchmarks();
    const isValid = await validateDataIntegrity();
    
    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                     SUMMARY REPORT                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`  Sports:           ${sports.length}`);
    console.log(`  Metrics:          ${metrics.length}`);
    console.log(`  Benchmarks:       ${benchmarkStats.total}`);
    console.log(`    ├─ Valid:       ${benchmarkStats.valid}`);
    console.log(`    └─ Invalid:     ${benchmarkStats.invalid}`);
    console.log(`  Data Integrity:   ${isValid ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Inspection failed:', error);
  } finally {
    process.exit(0);
  }
}

main();