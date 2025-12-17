// Location: /apps/assessment/scripts/fix-kid-enrollments.js
// Standalone Node.js script to fix kid enrollments

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Try multiple possible locations for the service account key
const possibleKeyPaths = [
  path.join(__dirname, '..', 'firebase-admin-key.json'),
  path.join(__dirname, '..', '..', 'firebase-admin-key.json'),
  path.join(__dirname, '..', '..', 'attendance', 'firebase-admin-key.json'),
];

let serviceAccount = null;
for (const keyPath of possibleKeyPaths) {
  if (fs.existsSync(keyPath)) {
    console.log(`✅ Found Firebase key at: ${keyPath}\n`);
    serviceAccount = require(keyPath);
    break;
  }
}

if (!serviceAccount) {
  console.error('❌ ERROR: Cannot find firebase-admin-key.json');
  console.error('Searched in:');
  possibleKeyPaths.forEach(p => console.error(`  - ${p}`));
  console.error('\nPlease ensure the Firebase Admin SDK key file exists.');
  console.error('You can download it from Firebase Console > Project Settings > Service Accounts\n');
  process.exit(1);
}

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized\n');
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error.message);
  process.exit(1);
}

const db = admin.firestore();
const FIXED_ACADEMY_ID = 'academy_accellax361_main';
const ALL_SPORTS = ['football', 'athletics', 'rugby', 'swimming', 'tennis', 'basketball'];

async function diagnoseEnrollments() {
  console.log('🔍 ===== DIAGNOSING KID ENROLLMENTS =====\n');
  
  try {
    const kidsRef = db.collection(`academies/${FIXED_ACADEMY_ID}/kids`);
    const snapshot = await kidsRef.get();
    
    console.log(`📊 Total kids in Firebase: ${snapshot.size}\n`);
    
    if (snapshot.empty) {
      console.log('❌ No kids found in database!\n');
      return { total: 0, withEnrollment: 0, withoutEnrollment: 0 };
    }
    
    // Sample first 3 kids
    let sampleCount = 0;
    console.log('🔬 Sample kid data:\n');
    
    snapshot.forEach(doc => {
      if (sampleCount < 3) {
        const kid = doc.data();
        console.log(`Kid ${sampleCount + 1}: ${kid.name}`);
        console.log(`  sports_enrolled: ${kid.sports_enrolled || 'NULL'}`);
        console.log(`  primary_sport: ${kid.primary_sport || 'NULL'}\n`);
        sampleCount++;
      }
    });
    
    // Count enrollments
    let withEnrollment = 0;
    let withoutEnrollment = 0;
    const sportCounts = {};
    
    snapshot.forEach(doc => {
      const kid = doc.data();
      
      if (kid.sports_enrolled) {
        withEnrollment++;
        
        try {
          const sports = typeof kid.sports_enrolled === 'string'
            ? JSON.parse(kid.sports_enrolled)
            : kid.sports_enrolled;
          
          if (Array.isArray(sports)) {
            sports.forEach(sportId => {
              sportCounts[sportId] = (sportCounts[sportId] || 0) + 1;
            });
          }
        } catch (e) {
          // Ignore parse errors
        }
      } else {
        withoutEnrollment++;
      }
    });
    
    console.log(`📈 Enrollment Status:`);
    console.log(`  ✅ With sports_enrolled: ${withEnrollment}`);
    console.log(`  ❌ Without sports_enrolled: ${withoutEnrollment}\n`);
    
    if (Object.keys(sportCounts).length > 0) {
      console.log(`⚽ Kids per Sport:`);
      Object.entries(sportCounts).forEach(([sportId, count]) => {
        console.log(`  - ${sportId}: ${count} kids`);
      });
      console.log('');
    }
    
    return { 
      total: snapshot.size, 
      withEnrollment, 
      withoutEnrollment,
      sportCounts 
    };
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    throw error;
  }
}

async function enrollAllKids() {
  console.log('🔧 ===== ENROLLING ALL KIDS IN ALL SPORTS =====\n');
  
  try {
    const kidsRef = db.collection(`academies/${FIXED_ACADEMY_ID}/kids`);
    const snapshot = await kidsRef.get();
    
    if (snapshot.empty) {
      console.log('❌ No kids to enroll!\n');
      return 0;
    }
    
    console.log(`📋 Sports: ${ALL_SPORTS.join(', ')}`);
    console.log(`👥 Processing ${snapshot.size} kids...\n`);
    
    const batch = db.batch();
    let count = 0;
    
    snapshot.forEach(doc => {
      const kid = doc.data();
      
      batch.update(doc.ref, {
        sports_enrolled: JSON.stringify(ALL_SPORTS),
        primary_sport: kid.primary_sport || 'football',
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ ${kid.name} - Queued for enrollment`);
      count++;
    });
    
    console.log('\n💾 Committing batch update...');
    await batch.commit();
    console.log(`✅ Successfully enrolled ${count} kids!\n`);
    
    return count;
    
  } catch (error) {
    console.error('❌ Enrollment failed:', error.message);
    throw error;
  }
}

async function main() {
  console.log('\n🚀 ===== KID ENROLLMENT FIX SCRIPT =====\n');
  
  try {
    // Step 1: Diagnose
    console.log('STEP 1: Diagnosing current state...\n');
    const before = await diagnoseEnrollments();
    
    if (before.total === 0) {
      console.log('❌ No kids found. Nothing to do.\n');
      process.exit(0);
    }
    
    if (before.withoutEnrollment === 0) {
      console.log('✅ All kids are already enrolled! Nothing to do.\n');
      process.exit(0);
    }
    
    // Step 2: Fix
    console.log('STEP 2: Enrolling kids...\n');
    await enrollAllKids();
    
    // Step 3: Verify
    console.log('STEP 3: Verifying changes...\n');
    await diagnoseEnrollments();
    
    console.log('🎉 ===== SCRIPT COMPLETE ===== 🎉\n');
    console.log('✅ All kids are now enrolled in all sports!');
    console.log('🔄 Refresh your app to see the changes.\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ SCRIPT FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();