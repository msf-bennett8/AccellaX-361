// Location: /apps/assessment/scripts/listAssessments.js
// Comprehensive script to list all assessments from Firebase with detailed analysis

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

// ========== HELPER FUNCTIONS ==========

/**
 * Format date to readable string
 */
function formatDate(date) {
  if (!date) return 'N/A';
  if (date.toDate) date = date.toDate();
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format value with unit
 */
function formatValue(value, unit) {
  if (value === null || value === undefined) return 'N/A';
  return unit ? `${value} ${unit}` : value.toString();
}

/**
 * Get performance level based on value and benchmarks
 */
function getPerformanceLevel(value, benchmarks) {
  if (!benchmarks || value === null) return 'N/A';
  
  if (benchmarks.excellent_min && value >= benchmarks.excellent_min) return '🌟 Excellent';
  if (benchmarks.good_min && value >= benchmarks.good_min) return '✅ Good';
  if (benchmarks.fair_min && value >= benchmarks.fair_min) return '⚠️  Fair';
  if (benchmarks.poor_max && value <= benchmarks.poor_max) return '❌ Needs Work';
  return '📊 Average';
}

/**
 * Calculate statistics for a metric across all assessments
 */
function calculateMetricStats(values) {
  if (values.length === 0) return null;
  
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  
  return {
    count: values.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: Math.round(avg * 100) / 100,
    median: sorted[Math.floor(sorted.length / 2)]
  };
}

// ========== DATA FETCHING ==========

/**
 * Fetch all kids from Firebase
 */
async function fetchKids() {
  console.log('📥 Fetching kids from Firebase...');
  
  const kidsRef = db.collection(`academies/${ACADEMY_ID}/kids`);
  const snapshot = await kidsRef.where('status', '==', 'active').get();
  
  const kids = {};
  snapshot.forEach(doc => {
    const data = doc.data();
    kids[data.id] = {
      id: data.id,
      name: data.name,
      age: data.age,
      age_group: data.age_group,
      gender: data.gender,
      house_team: data.house_team || 'None',
      primary_sport: data.primary_sport || 'None'
    };
  });
  
  console.log(`✅ Loaded ${Object.keys(kids).length} kids\n`);
  return kids;
}

/**
 * Fetch all sports from Firebase
 */
async function fetchSports() {
  console.log('📥 Fetching sports from Firebase...');
  
  const sportsRef = db.collection(`academies/${ACADEMY_ID}/sports`);
  const snapshot = await sportsRef.where('is_active', '==', 1).get();
  
  const sports = {};
  snapshot.forEach(doc => {
    const data = doc.data();
    sports[data.id] = {
      id: data.id,
      name: data.name,
      icon: data.icon || '🏃'
    };
  });
  
  console.log(`✅ Loaded ${Object.keys(sports).length} sports\n`);
  return sports;
}

/**
 * Fetch all metrics from Firebase
 */
async function fetchMetrics() {
  console.log('📥 Fetching metrics from Firebase...');
  
  const metricsRef = db.collection(`academies/${ACADEMY_ID}/metrics`);
  const snapshot = await metricsRef.get();
  
  const metrics = {};
  snapshot.forEach(doc => {
    const data = doc.data();
    metrics[data.id] = {
      id: data.id,
      name: data.name,
      category: data.category,
      type: data.type,
      unit: data.unit || '',
      sport_id: data.sport_id
    };
  });
  
  console.log(`✅ Loaded ${Object.keys(metrics).length} metrics\n`);
  return metrics;
}

/**
 * Fetch all benchmarks from Firebase
 */
async function fetchBenchmarks() {
  console.log('📥 Fetching benchmarks from Firebase...');
  
  const benchmarksRef = db.collection(`academies/${ACADEMY_ID}/benchmarks`);
  const snapshot = await benchmarksRef.get();
  
  const benchmarks = {};
  snapshot.forEach(doc => {
    const data = doc.data();
    const key = `${data.metric_id}_${data.age_group}_${data.gender || 'all'}`;
    benchmarks[key] = data;
  });
  
  console.log(`✅ Loaded ${Object.keys(benchmarks).length} benchmarks\n`);
  return benchmarks;
}

/**
 * Fetch all assessments from Firebase
 */
async function fetchAssessments() {
  console.log('📥 Fetching assessments from Firebase...');
  
  const assessmentsRef = db.collection(`academies/${ACADEMY_ID}/assessments`);
  const snapshot = await assessmentsRef.orderBy('assessment_date', 'desc').get();
  
  const assessments = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    assessments.push({
      id: data.id,
      kid_id: data.kid_id,
      sport_id: data.sport_id,
      assessment_date: data.assessment_date,
      year: data.year || 'N/A',
      term: data.term || 'N/A',
      assessment_type: data.assessment_type || 'Regular',
      week_number: data.week_number || 'N/A',
      location: data.location || 'N/A',
      assessor_name: data.assessor_name || 'Coach',
      general_notes: data.general_notes || data.notes || '',
      assessed_by: data.assessed_by,
      status: data.status || 'completed',
      results: data.results || [],
      created_at: data.created_at,
      updated_at: data.updated_at
    });
  });
  
  console.log(`✅ Loaded ${assessments.length} assessments\n`);
  return assessments;
}

// ========== DISPLAY FUNCTIONS ==========

/**
 * Display single assessment in detail
 */
function displayAssessment(assessment, kids, sports, metrics, benchmarks, index) {
  const kid = kids[assessment.kid_id] || { name: 'Unknown Kid', age_group: 'N/A', gender: 'N/A' };
  const sport = sports[assessment.sport_id] || { name: 'Unknown Sport', icon: '❓' };
  
  console.log(`\n${'═'.repeat(100)}`);
  console.log(`📋 ASSESSMENT #${index + 1} - ${assessment.id}`);
  console.log(`${'═'.repeat(100)}`);
  
  // Basic Info
  console.log(`\n👤 ATHLETE INFORMATION:`);
  console.log(`   Name:          ${kid.name}`);
  console.log(`   Age Group:     ${kid.age_group}`);
  console.log(`   Gender:        ${kid.gender}`);
  console.log(`   House Team:    ${kid.house_team}`);
  console.log(`   Primary Sport: ${kid.primary_sport}`);
  
  // Assessment Info
  console.log(`\n${sport.icon} ASSESSMENT DETAILS:`);
  console.log(`   Sport:         ${sport.name}`);
  console.log(`   Date:          ${formatDate(assessment.assessment_date)}`);
  console.log(`   Year:          ${assessment.year}`);
  console.log(`   Term:          ${assessment.term}`);
  console.log(`   Type:          ${assessment.assessment_type}`);
  console.log(`   Week #:        ${assessment.week_number}`);
  console.log(`   Location:      ${assessment.location}`);
  console.log(`   Assessor:      ${assessment.assessor_name}`);
  console.log(`   Status:        ${assessment.status.toUpperCase()}`);
  
  if (assessment.general_notes) {
    console.log(`\n📝 GENERAL NOTES:`);
    console.log(`   ${assessment.general_notes}`);
  }
  
  // Results
  if (assessment.results && assessment.results.length > 0) {
    console.log(`\n📊 PERFORMANCE RESULTS (${assessment.results.length} metrics):`);
    console.log(`   ${'─'.repeat(96)}`);
    console.log(`   ${'Metric'.padEnd(30)} | ${'Value'.padEnd(15)} | ${'Category'.padEnd(20)} | ${'Level'.padEnd(20)}`);
    console.log(`   ${'─'.repeat(96)}`);
    
    // Group results by category
    const categories = {
      general_fitness: [],
      sport_specific: [],
      iq: []
    };
    
    assessment.results.forEach(result => {
      const metric = metrics[result.metric_id];
      if (metric) {
        categories[metric.category].push({ result, metric });
      }
    });
    
    // Display by category
    ['general_fitness', 'sport_specific', 'iq'].forEach(category => {
      if (categories[category].length > 0) {
        const categoryName = category.replace('_', ' ').toUpperCase();
        console.log(`\n   🏆 ${categoryName}:`);
        
        categories[category].forEach(({ result, metric }) => {
          const benchmarkKey = `${metric.id}_${kid.age_group}_${kid.gender || 'all'}`;
          const benchmark = benchmarks[benchmarkKey] || benchmarks[`${metric.id}_${kid.age_group}_all`];
          const level = getPerformanceLevel(parseFloat(result.value), benchmark);
          
          const metricName = metric.name.padEnd(30);
          const value = formatValue(result.value, metric.unit).padEnd(15);
          const cat = metric.category.padEnd(20);
          
          console.log(`   ${metricName} | ${value} | ${cat} | ${level}`);
          
          if (result.notes) {
            console.log(`      └─ Note: ${result.notes}`);
          }
        });
      }
    });
  } else {
    console.log(`\n⚠️  NO RESULTS RECORDED`);
  }
  
  // Metadata
  console.log(`\n🕐 TIMESTAMPS:`);
  console.log(`   Created:  ${formatDate(assessment.created_at)}`);
  console.log(`   Modified: ${formatDate(assessment.updated_at)}`);
}

/**
 * Display assessments summary table
 */
function displaySummaryTable(assessments, kids, sports) {
  console.log(`\n${'═'.repeat(120)}`);
  console.log(`📊 ASSESSMENTS SUMMARY TABLE`);
  console.log(`${'═'.repeat(120)}`);
  console.log(`${'#'.padStart(4)} | ${'Kid Name'.padEnd(25)} | ${'Sport'.padEnd(15)} | ${'Date'.padEnd(12)} | ${'Term'.padEnd(6)} | ${'Type'.padEnd(12)} | ${'Results'.padEnd(8)} | ${'Status'.padEnd(10)}`);
  console.log(`${'─'.repeat(120)}`);
  
  assessments.forEach((assessment, index) => {
    const kid = kids[assessment.kid_id] || { name: 'Unknown' };
    const sport = sports[assessment.sport_id] || { name: 'Unknown' };
    
    const num = (index + 1).toString().padStart(4);
    const name = kid.name.substring(0, 25).padEnd(25);
    const sportName = sport.name.substring(0, 15).padEnd(15);
    const date = formatDate(assessment.assessment_date).padEnd(12);
    const term = (assessment.term || 'N/A').padEnd(6);
    const type = (assessment.assessment_type || 'Regular').substring(0, 12).padEnd(12);
    const resultCount = (assessment.results?.length || 0).toString().padEnd(8);
    const status = assessment.status.toUpperCase().padEnd(10);
    
    console.log(`${num} | ${name} | ${sportName} | ${date} | ${term} | ${type} | ${resultCount} | ${status}`);
  });
}

/**
 * Display statistics and analytics
 */
function displayStatistics(assessments, kids, sports, metrics) {
  console.log(`\n${'═'.repeat(100)}`);
  console.log(`📈 ASSESSMENT STATISTICS & ANALYTICS`);
  console.log(`${'═'.repeat(100)}`);
  
  // Overall Stats
  console.log(`\n📊 OVERALL STATISTICS:`);
  console.log(`   Total Assessments:        ${assessments.length}`);
  console.log(`   Unique Kids Assessed:     ${new Set(assessments.map(a => a.kid_id)).size}`);
  console.log(`   Sports Covered:           ${new Set(assessments.map(a => a.sport_id)).size}`);
  console.log(`   Total Metric Results:     ${assessments.reduce((sum, a) => sum + (a.results?.length || 0), 0)}`);
  
  // Date Range
  if (assessments.length > 0) {
    const dates = assessments.map(a => new Date(a.assessment_date)).sort((a, b) => a - b);
    console.log(`   Date Range:               ${formatDate(dates[0])} → ${formatDate(dates[dates.length - 1])}`);
  }
  
  // By Sport
  console.log(`\n🏃 ASSESSMENTS BY SPORT:`);
  const bySport = {};
  assessments.forEach(a => {
    const sport = sports[a.sport_id] || { name: 'Unknown', icon: '❓' };
    const key = sport.name;
    bySport[key] = (bySport[key] || 0) + 1;
  });
  Object.entries(bySport)
    .sort((a, b) => b[1] - a[1])
    .forEach(([sport, count]) => {
      const sportObj = Object.values(sports).find(s => s.name === sport) || { icon: '❓' };
      console.log(`   ${sportObj.icon} ${sport.padEnd(20)}: ${count} assessments`);
    });
  
  // By Term
  console.log(`\n📅 ASSESSMENTS BY TERM:`);
  const byTerm = {};
  assessments.forEach(a => {
    const term = a.term || 'Unknown';
    byTerm[term] = (byTerm[term] || 0) + 1;
  });
  ['Q1', 'Q2', 'Q3', 'Q4', 'Unknown'].forEach(term => {
    if (byTerm[term]) {
      console.log(`   ${term.padEnd(10)}: ${byTerm[term]} assessments`);
    }
  });
  
  // By Age Group
  console.log(`\n👥 ASSESSMENTS BY AGE GROUP:`);
  const byAge = {};
  assessments.forEach(a => {
    const kid = kids[a.kid_id];
    if (kid) {
      const age = kid.age_group;
      byAge[age] = (byAge[age] || 0) + 1;
    }
  });
  ['4-6', '7-9', '10-13', '13+'].forEach(age => {
    if (byAge[age]) {
      console.log(`   ${age.padEnd(10)}: ${byAge[age]} assessments`);
    }
  });
  
  // Assessment Types
  console.log(`\n📋 ASSESSMENT TYPES:`);
  const byType = {};
  assessments.forEach(a => {
    const type = a.assessment_type || 'Regular';
    byType[type] = (byType[type] || 0) + 1;
  });
  Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`   ${type.padEnd(20)}: ${count} assessments`);
    });
  
  // Most Assessed Metrics
  console.log(`\n🎯 TOP 10 MOST ASSESSED METRICS:`);
  const metricCounts = {};
  assessments.forEach(a => {
    a.results?.forEach(r => {
      const metric = metrics[r.metric_id];
      if (metric) {
        const key = metric.name;
        metricCounts[key] = (metricCounts[key] || 0) + 1;
      }
    });
  });
  Object.entries(metricCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([metric, count], index) => {
      console.log(`   ${(index + 1).toString().padStart(2)}. ${metric.padEnd(35)}: ${count} times`);
    });
  
  // Recent Activity
  console.log(`\n🕐 RECENT ACTIVITY (Last 30 Days):`);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentAssessments = assessments.filter(a => 
    new Date(a.assessment_date) >= thirtyDaysAgo
  );
  console.log(`   Recent Assessments:       ${recentAssessments.length}`);
  console.log(`   Average per Day:          ${Math.round(recentAssessments.length / 30 * 10) / 10}`);
  
  if (recentAssessments.length > 0) {
    const recentKids = new Set(recentAssessments.map(a => a.kid_id));
    console.log(`   Kids Assessed Recently:   ${recentKids.size}`);
  }
}

/**
 * Display top performers analysis
 */
function displayTopPerformers(assessments, kids, sports, metrics, benchmarks) {
  console.log(`\n${'═'.repeat(100)}`);
  console.log(`🏆 TOP PERFORMERS ANALYSIS`);
  console.log(`${'═'.repeat(100)}`);
  
  // Track excellent performances
  const excellentPerformances = {};
  
  assessments.forEach(a => {
    const kid = kids[a.kid_id];
    if (!kid) return;
    
    a.results?.forEach(r => {
      const metric = metrics[r.metric_id];
      if (!metric) return;
      
      const benchmarkKey = `${metric.id}_${kid.age_group}_${kid.gender || 'all'}`;
      const benchmark = benchmarks[benchmarkKey] || benchmarks[`${metric.id}_${kid.age_group}_all`];
      
      if (benchmark && benchmark.excellent_min && parseFloat(r.value) >= benchmark.excellent_min) {
        if (!excellentPerformances[kid.id]) {
          excellentPerformances[kid.id] = {
            name: kid.name,
            count: 0,
            metrics: []
          };
        }
        excellentPerformances[kid.id].count++;
        excellentPerformances[kid.id].metrics.push(metric.name);
      }
    });
  });
  
  const topPerformers = Object.values(excellentPerformances)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  if (topPerformers.length > 0) {
    console.log(`\n🌟 TOP 10 PERFORMERS (Most Excellent Ratings):`);
    console.log(`   ${'─'.repeat(96)}`);
    
    topPerformers.forEach((performer, index) => {
      console.log(`   ${(index + 1).toString().padStart(2)}. ${performer.name.padEnd(30)} - ${performer.count} excellent performances`);
      console.log(`      Best in: ${performer.metrics.slice(0, 3).join(', ')}${performer.metrics.length > 3 ? '...' : ''}`);
    });
  } else {
    console.log(`\n   No excellent performances recorded yet.`);
  }
}

// ========== MAIN FUNCTION ==========

async function listAllAssessments() {
  try {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                        📊 ACCELLAX 361° ASSESSMENT DATABASE VIEWER                            ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════════════════════════╝');
    console.log('\n');
    
    // Fetch all data
    const [kids, sports, metrics, benchmarks, assessments] = await Promise.all([
      fetchKids(),
      fetchSports(),
      fetchMetrics(),
      fetchBenchmarks(),
      fetchAssessments()
    ]);
    
    if (assessments.length === 0) {
      console.log('⚠️  NO ASSESSMENTS FOUND IN DATABASE\n');
      console.log('The database is empty. Please ensure:');
      console.log('  1. Kids have been added to the system');
      console.log('  2. Assessments have been recorded');
      console.log('  3. Firebase sync is working correctly\n');
      return;
    }
    
    // Display options
    console.log('═'.repeat(100));
    console.log('📋 DISPLAY OPTIONS:');
    console.log('═'.repeat(100));
    console.log('   1. Summary Table (Quick overview)');
    console.log('   2. Detailed View (Full assessment details)');
    console.log('   3. Statistics & Analytics');
    console.log('   4. Top Performers');
    console.log('   5. All of the Above (Comprehensive Report)');
    console.log('═'.repeat(100));
    
    // For script execution, show all
    const choice = process.argv[2] || '5';
    
    switch(choice) {
      case '1':
        displaySummaryTable(assessments, kids, sports);
        break;
      case '2':
        assessments.forEach((assessment, index) => {
          displayAssessment(assessment, kids, sports, metrics, benchmarks, index);
        });
        break;
      case '3':
        displayStatistics(assessments, kids, sports, metrics);
        break;
      case '4':
        displayTopPerformers(assessments, kids, sports, metrics, benchmarks);
        break;
      case '5':
      default:
        // Show everything
        displaySummaryTable(assessments, kids, sports);
        displayStatistics(assessments, kids, sports, metrics);
        displayTopPerformers(assessments, kids, sports, metrics, benchmarks);
        
        console.log(`\n\n${'═'.repeat(100)}`);
        console.log('📋 DETAILED ASSESSMENTS');
        console.log(`${'═'.repeat(100)}`);
        
        assessments.forEach((assessment, index) => {
          displayAssessment(assessment, kids, sports, metrics, benchmarks, index);
        });
        break;
    }
    
    // Footer
    console.log(`\n\n${'═'.repeat(100)}`);
    console.log('✅ REPORT GENERATION COMPLETE');
    console.log(`${'═'.repeat(100)}`);
    console.log(`   Total Assessments Displayed: ${assessments.length}`);
    console.log(`   Report Generated: ${new Date().toLocaleString()}`);
    console.log(`   Academy ID: ${ACADEMY_ID}`);
    console.log(`${'═'.repeat(100)}\n`);
    
  } catch (error) {
    console.error('\n❌ ERROR GENERATING ASSESSMENT REPORT:\n');
    console.error(error);
    console.error('\nPlease check:');
    console.error('  1. Firebase credentials are correct');
    console.error('  2. Network connection is stable');
    console.error('  3. Firebase permissions are properly set\n');
  } finally {
    process.exit(0);
  }
}

// Run the script
listAllAssessments();