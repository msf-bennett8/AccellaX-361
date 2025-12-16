#!/usr/bin/env node

/**
 * Add Test Assessments with Improvements
 * 
 * This script adds baseline assessments (any date you choose)
 * and improved assessments (yesterday) for testing the improvement tracking.
 */

const admin = require('firebase-admin');
const path = require('path');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function addTestAssessments() {
  try {
    log('\n' + '='.repeat(60), 'cyan');
    log('📝 ADD TEST ASSESSMENTS WITH IMPROVEMENTS', 'bright');
    log('='.repeat(60), 'cyan');

    // Initialize Firebase
    const possibleKeyPaths = [
      path.join(process.cwd(), 'firebase-admin-key.json'),
      path.join(process.cwd(), '..', 'firebase-admin-key.json'),
      path.join(process.cwd(), '..', '..', 'firebase-admin-key.json'),
      path.join(process.cwd(), '..', '..', '..', 'firebase-admin-key.json'),
    ];

    let serviceAccount = null;
    for (const keyPath of possibleKeyPaths) {
      try {
        const fs = require('fs');
        if (fs.existsSync(keyPath)) {
          serviceAccount = require(keyPath);
          break;
        }
      } catch (err) {}
    }

    if (!serviceAccount) {
      log('❌ Firebase service account key not found!', 'red');
      process.exit(1);
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    const db = admin.firestore();
    const ACADEMY_ID = 'academy_accellax361_main';

    log('\n✅ Connected to Firebase!', 'green');

    // Test kids with their correct IDs
    const testKids = [
      { id: '1764027323770_zsofb670t', name: 'Shiri Update' },
      { id: '1764243401381_h6apf423p', name: 'NEw sport kid' },
      { id: '1764019727509_m87vyuqja', name: 'Hope Raymond Ndambuki' },
      { id: '1764019731959_soqf8mmd2', name: 'Loick Mburu' },
      { id: '1765687517270_uttgsuysr', name: 'McKenna Mungiri' },
    ];

    // Dates
    const baselineDate = '2025-11-20'; // 3 weeks ago
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    log(`\n📅 Creating assessments:`, 'yellow');
    log(`   Baseline: ${baselineDate}`, 'white');
    log(`   Improved: ${yesterdayStr}`, 'white');

    const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let count = 0;

    for (const kid of testKids) {
      log(`\n👤 Processing: ${kid.name}`, 'cyan');

      // BASELINE ASSESSMENT (swimming)
      const baselineId = generateId();
      const baselineAssessment = {
        id: baselineId,
        kid_id: kid.id,
        sport_id: 'swimming',
        assessment_date: baselineDate,
        year: '2024/2025',
        term: 'Q4',
        assessment_type: 'baseline',
        week_number: 4,
        location: 'Main Pool',
        assessor_name: 'Coach Test',
        general_notes: 'Baseline assessment for improvement tracking',
        assessed_by: 'test_user',
        status: 'completed',
        created_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now(),
        synced_at: admin.firestore.Timestamp.now(),
        results: [
          { metric_id: 'swimming_body_positioning', value: '5' },
          { metric_id: 'swimming_breathing', value: '4' },
          { metric_id: 'swimming_arm_recovery', value: '5' },
          { metric_id: 'swimming_underwater_catch', value: '6' },
          { metric_id: 'swimming_kicking', value: '5' },
          { metric_id: 'swimming_iq', value: '5' },
        ]
      };

      await db.collection(`academies/${ACADEMY_ID}/assessments`).doc(baselineId).set(baselineAssessment);
      log(`   ✅ Added baseline assessment (${baselineDate})`, 'green');

      // IMPROVED ASSESSMENT (yesterday)
      const improvedId = generateId();
      const improvedAssessment = {
        id: improvedId,
        kid_id: kid.id,
        sport_id: 'swimming',
        assessment_date: yesterdayStr,
        year: '2024/2025',
        term: 'Q4',
        assessment_type: 'mid_term',
        week_number: 8,
        location: 'Main Pool',
        assessor_name: 'Coach Test',
        general_notes: 'Improved assessment - significant progress!',
        assessed_by: 'test_user',
        status: 'completed',
        created_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now(),
        synced_at: admin.firestore.Timestamp.now(),
        results: [
          { metric_id: 'swimming_body_positioning', value: '8' },  // +60%
          { metric_id: 'swimming_breathing', value: '7' },         // +75%
          { metric_id: 'swimming_arm_recovery', value: '8' },      // +60%
          { metric_id: 'swimming_underwater_catch', value: '9' },  // +50%
          { metric_id: 'swimming_kicking', value: '8' },           // +60%
          { metric_id: 'swimming_iq', value: '8' },                // +60%
        ]
      };

      await db.collection(`academies/${ACADEMY_ID}/assessments`).doc(improvedId).set(improvedAssessment);
      log(`   ✅ Added improved assessment (${yesterdayStr})`, 'green');

      count += 2;

      // Add a small delay to avoid Firebase rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    log('\n' + '='.repeat(60), 'cyan');
    log(`✅ SUCCESSFULLY ADDED ${count} ASSESSMENTS!`, 'bright');
    log('='.repeat(60), 'cyan');
    
    log('\n📊 Summary:', 'yellow');
    log(`   Kids tested: ${testKids.length}`, 'white');
    log(`   Baseline date: ${baselineDate}`, 'white');
    log(`   Improved date: ${yesterdayStr}`, 'white');
    log(`   Total assessments: ${count}`, 'white');
    
    log('\n🎯 Expected improvements:', 'yellow');
    log('   All 5 kids should show ~60% improvement in swimming!', 'white');
    log('   Average score improvement: 5.0 → 8.0 (60% gain)\n', 'white');

    process.exit(0);

  } catch (error) {
    log('\n❌ ERROR:', 'red');
    log(error.message, 'red');
    if (error.stack) {
      log(error.stack, 'yellow');
    }
    process.exit(1);
  }
}

// Run the script
addTestAssessments();