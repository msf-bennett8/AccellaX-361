// Location: /apps/assessment/scripts/force-enroll-all-sports.js
// FORCE update all kids to be enrolled in ALL sports

const admin = require('firebase-admin');
const path = require('path');

// Use the key from attendance folder
const serviceAccount = require('../../attendance/firebase-admin-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const FIXED_ACADEMY_ID = 'academy_accellax361_main';
const ALL_SPORTS = ['football', 'athletics', 'rugby', 'swimming', 'tennis', 'basketball'];

async function forceEnrollAllKids() {
  console.log('\n🔧 ===== FORCE ENROLLING ALL KIDS IN ALL SPORTS =====\n');
  
  try {
    const kidsRef = db.collection(`academies/${FIXED_ACADEMY_ID}/kids`);
    const snapshot = await kidsRef.get();
    
    console.log(`📊 Total kids: ${snapshot.size}`);
    console.log(`📋 Sports to enroll: ${ALL_SPORTS.join(', ')}\n`);
    
    // Show what they currently have
    console.log('Current enrollments (first 5):');
    let count = 0;
    snapshot.forEach(doc => {
      if (count < 5) {
        const kid = doc.data();
        console.log(`  ${kid.name}: ${kid.sports_enrolled}`);
        count++;
      }
    });
    console.log('');
    
    // Update ALL kids
    const batch = db.batch();
    let updateCount = 0;
    
    snapshot.forEach(doc => {
      const kid = doc.data();
      
      batch.update(doc.ref, {
        sports_enrolled: JSON.stringify(ALL_SPORTS),
        primary_sport: kid.primary_sport || 'football',
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ ${kid.name} - Updating to all sports`);
      updateCount++;
    });
    
    console.log('\n💾 Committing batch update to Firebase...');
    await batch.commit();
    console.log(`✅ Successfully updated ${updateCount} kids!\n`);
    
    // Verify
    console.log('🔍 Verifying updates...\n');
    const verifySnapshot = await kidsRef.limit(5).get();
    
    console.log('New enrollments (first 5):');
    verifySnapshot.forEach(doc => {
      const kid = doc.data();
      console.log(`  ${kid.name}: ${kid.sports_enrolled}`);
    });
    
    console.log('\n🎉 ===== UPDATE COMPLETE ===== 🎉\n');
    console.log('✅ All kids are now enrolled in all 6 sports!');
    console.log('🔄 Refresh your app to see the changes.\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Update failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run immediately
forceEnrollAllKids();