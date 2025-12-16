#!/usr/bin/env node

/**
 * Assessment Improvements Diagnostic Tool (Firebase Version)
 * 
 * This script connects to Firebase and checks for improvements
 * by analyzing assessment data stored in Firestore.
 * 
 * Usage: node check-improvements-firebase.js
 */

// Import Firebase Admin SDK
const admin = require('firebase-admin');
const path = require('path');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Calculate composite score (simplified version)
function calculateCompositeScore(results) {
  if (!results || results.length === 0) {
    return { totalScore: 0 };
  }

  const total = results.reduce((sum, r) => sum + parseFloat(r.value || 0), 0);
  const average = total / results.length;
  const normalized = Math.min(Math.max(average, 0), 100);
  
  return { totalScore: Math.round(normalized) };
}

async function checkImprovements() {
  try {
    log('\n' + '='.repeat(60), 'cyan');
    log('🔍 FIREBASE ASSESSMENT IMPROVEMENTS DIAGNOSTIC', 'bright');
    log('='.repeat(60), 'cyan');

    // Initialize Firebase Admin
    log('\n🔥 Connecting to Firebase...', 'yellow');
    
    // Try to find service account key
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
          log(`✅ Found Firebase key at: ${keyPath}`, 'green');
          break;
        }
      } catch (err) {
        // Continue searching
      }
    }

    if (!serviceAccount) {
      log('❌ Firebase service account key not found!', 'red');
      log('\n📋 Please create firebase-admin-key.json with your credentials', 'yellow');
      log('   Or run from a directory that has the key file.\n', 'yellow');
      process.exit(1);
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    const db = admin.firestore();
    const ACADEMY_ID = 'academy_accellax361_main';

    log('✅ Connected to Firebase!', 'green');

    // Fetch assessments
    log('\n📥 Fetching assessments from Firebase...', 'yellow');
    const assessmentsSnapshot = await db.collection(`academies/${ACADEMY_ID}/assessments`).get();
    
    const assessments = [];
    assessmentsSnapshot.forEach(doc => {
      const data = doc.data();
      assessments.push({
        id: doc.id,
        kid_id: data.kid_id,
        sport_id: data.sport_id,
        assessment_date: data.assessment_date,
        results: data.results || [],
        term: data.term,
        year: data.year,
      });
    });

    log(`✅ Loaded ${assessments.length} assessments`, 'green');

    // Fetch kids
    log('📥 Fetching kids from Firebase...', 'yellow');
    const kidsSnapshot = await db.collection(`academies/${ACADEMY_ID}/kids`).get();
    
    const kids = [];
    kidsSnapshot.forEach(doc => {
      const data = doc.data();
      // Use data.id if it exists, otherwise use doc.id
      const kidId = data.id || doc.id;
      kids.push({
        id: kidId,
        docId: doc.id,
        name: data.name,
        age: data.age,
        age_group: data.age_group,
        gender: data.gender,
      });
    });

    log(`✅ Loaded ${kids.length} kids`, 'green');
    
    // Show sample kid IDs
    log('\n🔍 SAMPLE KID IDs IN DATABASE:', 'yellow');
    kids.slice(0, 5).forEach(kid => {
      log(`   DocID: ${kid.docId} | DataID: ${kid.id} → ${kid.name}`, 'white');
    });
    
    // Show sample assessment kid IDs
    log('\n🔍 SAMPLE KID IDs IN ASSESSMENTS:', 'yellow');
    const uniqueKidIds = [...new Set(assessments.map(a => a.kid_id))];
    uniqueKidIds.slice(0, 5).forEach(kidId => {
      const matchingKid = kids.find(k => k.id === kidId || k.docId === kidId);
      log(`   ${kidId} → ${matchingKid ? matchingKid.name : 'NOT FOUND'}`, matchingKid ? 'green' : 'red');
    });

    if (assessments.length === 0) {
      log('\n❌ No assessments found in Firebase!', 'red');
      log('   Please do some assessments first.\n', 'yellow');
      process.exit(0);
    }

    // Show ALL assessments in detail
    log('\n📋 ALL ASSESSMENTS (DETAILED):', 'bright');
    log('━'.repeat(60), 'cyan');
    
    assessments.forEach((assessment, index) => {
      log(`\n   ${index + 1}. Assessment ID: ${assessment.id}`, 'cyan');
      log(`      Kid ID: ${assessment.kid_id}`, 'white');
      log(`      Sport: ${assessment.sport_id}`, 'white');
      log(`      Date: ${assessment.assessment_date}`, 'white');
      log(`      Term: ${assessment.term || 'N/A'}`, 'white');
      log(`      Year: ${assessment.year || 'N/A'}`, 'white');
      log(`      Results: ${assessment.results ? assessment.results.length : 0} metrics`, 'white');
      
      if (assessment.results && assessment.results.length > 0) {
        log(`      Metrics:`, 'yellow');
        assessment.results.forEach(result => {
          log(`        - ${result.metric_id}: ${result.value}`, 'white');
        });
      }
    });
    
    // Analyze assessment dates
    log('\n📅 ASSESSMENT DATES ANALYSIS:', 'bright');
    log('━'.repeat(60), 'cyan');
    
    const dateCount = {};
    assessments.forEach(a => {
      const date = a.assessment_date;
      dateCount[date] = (dateCount[date] || 0) + 1;
    });

    const sortedDates = Object.keys(dateCount).sort();
    log(`   Date Range: ${sortedDates[0]} → ${sortedDates[sortedDates.length - 1]}`, 'white');
    log(`   Unique Dates: ${sortedDates.length}`, 'white');
    log('\n   Assessments per Date:', 'yellow');
    
    sortedDates.forEach(date => {
      const today = new Date().toISOString().split('T')[0];
      const isToday = date === today;
      log(`     ${date}: ${dateCount[date]} assessment${dateCount[date] !== 1 ? 's' : ''}${isToday ? ' 📍 (TODAY)' : ''}`, 'white');
    });

    // Group assessments by kid + sport
    log('\n👥 GROUPING BY KID + SPORT:', 'bright');
    log('━'.repeat(60), 'cyan');

    const kidSportMap = {};
    assessments.forEach(assessment => {
      const key = `${assessment.kid_id}_${assessment.sport_id}`;
      if (!kidSportMap[key]) {
        kidSportMap[key] = [];
      }
      kidSportMap[key].push(assessment);
    });

    log(`   Total Kid-Sport Combinations: ${Object.keys(kidSportMap).length}`, 'white');

    // Calculate improvements
    log('\n📈 CALCULATING IMPROVEMENTS:', 'bright');
    log('━'.repeat(60), 'cyan');

    const improvements = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // Last 30 days

    Object.entries(kidSportMap).forEach(([key, kidSportAssessments]) => {
      const lastUnderscoreIndex = key.lastIndexOf('_');
        const kidId = key.substring(0, lastUnderscoreIndex);
        const sportId = key.substring(lastUnderscoreIndex + 1);
      const kid = kids.find(k => k.id === kidId || k.docId === kidId);
      
      if (!kid) {
        log(`   ⚠️  Kid not found: ${kidId}`, 'yellow');
        return;
      }

      if (kidSportAssessments.length < 2) {
        log(`   ⏭️  ${kid.name} (${sportId}): Only ${kidSportAssessments.length} assessment`, 'yellow');
        return;
      }

      // Sort by date
      kidSportAssessments.sort((a, b) => 
        new Date(a.assessment_date) - new Date(b.assessment_date)
      );

      const latestAssessment = kidSportAssessments[kidSportAssessments.length - 1];
      const previousAssessment = kidSportAssessments[kidSportAssessments.length - 2];

      const latestDate = new Date(latestAssessment.assessment_date);
      const previousDate = new Date(previousAssessment.assessment_date);

      log(`\n   👤 ${kid.name} (${sportId}):`, 'cyan');
      log(`      Assessments: ${kidSportAssessments.length}`, 'white');
      log(`      Dates: ${kidSportAssessments.map(a => a.assessment_date).join(', ')}`, 'white');
      log(`      Latest: ${latestDate.toISOString().split('T')[0]}`, 'white');
      log(`      Previous: ${previousDate.toISOString().split('T')[0]}`, 'white');
      log(`      Within 30 days? ${latestDate >= cutoffDate ? '✅ YES' : '❌ NO'}`, latestDate >= cutoffDate ? 'green' : 'red');

      if (latestDate < cutoffDate) {
        log(`      ⏭️  Skipping (too old)`, 'yellow');
        return;
      }

      const latestResults = latestAssessment.results || [];
      const previousResults = previousAssessment.results || [];

      log(`      Latest Results: ${latestResults.length}`, 'white');
      log(`      Previous Results: ${previousResults.length}`, 'white');

      if (latestResults.length === 0 || previousResults.length === 0) {
        log(`      ⚠️  Missing results`, 'yellow');
        return;
      }

      // Calculate scores
      const latestScore = calculateCompositeScore(latestResults).totalScore;
      const previousScore = calculateCompositeScore(previousResults).totalScore;

      const absoluteImprovement = latestScore - previousScore;
      const relativeImprovement = previousScore > 0
        ? Math.round((absoluteImprovement / previousScore) * 100)
        : 0;

      log(`      Previous Score: ${previousScore}%`, 'white');
      log(`      Latest Score: ${latestScore}%`, 'white');
      log(`      Improvement: ${relativeImprovement > 0 ? '+' : ''}${relativeImprovement}%`, relativeImprovement > 0 ? 'green' : 'red');

      if (relativeImprovement > 0) {
        improvements.push({
          name: kid.name,
          sport: sportId,
          improvement: relativeImprovement,
          previousScore,
          currentScore: latestScore,
          dates: `${previousDate.toISOString().split('T')[0]} → ${latestDate.toISOString().split('T')[0]}`
        });
        log(`      ✅ IMPROVEMENT FOUND!`, 'green');
      } else {
        log(`      ❌ No improvement`, 'red');
      }
    });

    // Summary
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 FINAL RESULTS:', 'bright');
    log('='.repeat(60), 'cyan');

    if (improvements.length === 0) {
      log('\n❌ NO IMPROVEMENTS FOUND', 'red');
      log('\nPossible reasons:', 'yellow');
      log('  1. All assessments have the same date', 'yellow');
      log('  2. Latest assessment is older than 30 days', 'yellow');
      log('  3. Kids need at least 2 assessments to compare', 'yellow');
      log('  4. No positive improvements in performance\n', 'yellow');
    } else {
      log(`\n✅ FOUND ${improvements.length} IMPROVEMENT${improvements.length !== 1 ? 'S' : ''}!`, 'green');
      
      improvements.sort((a, b) => b.improvement - a.improvement);
      
      log('\n🏆 TOP IMPROVEMENTS:', 'bright');
      improvements.slice(0, 10).forEach((imp, index) => {
        log(`\n   ${index + 1}. ${imp.name} - ${imp.sport}`, 'cyan');
        log(`      Improvement: +${imp.improvement}%`, 'green');
        log(`      Score: ${imp.previousScore}% → ${imp.currentScore}%`, 'white');
        log(`      Dates: ${imp.dates}`, 'white');
      });
      log('');
    }

    log('\n' + '='.repeat(60), 'cyan');
    log('✨ DIAGNOSTIC COMPLETE', 'bright');
    log('='.repeat(60) + '\n', 'cyan');

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

// Run the diagnostic
checkImprovements();