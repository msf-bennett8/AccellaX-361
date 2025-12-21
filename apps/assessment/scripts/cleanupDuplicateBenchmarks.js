// Location: /apps/assessment/scripts/cleanupDuplicateBenchmarks.js
// Script to delete duplicate benchmarks (capitalized gender values)

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

// ========== CLEANUP FUNCTION ==========

async function cleanupDuplicates() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║       CLEANUP DUPLICATE BENCHMARKS SCRIPT                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  try {
    const benchmarksRef = db.collection(`academies/${ACADEMY_ID}/benchmarks`);
    const snapshot = await benchmarksRef.get();
    
    console.log(`📊 Total benchmarks found: ${snapshot.size}\n`);
    
    const toDelete = [];
    const toKeep = [];
    
    // Identify duplicates (capitalized gender values)
    snapshot.forEach(doc => {
      const benchmark = doc.data();
      const id = doc.id;
      
      // Check if gender is capitalized (Male/Female)
      if (benchmark.gender && benchmark.gender.match(/^[A-Z]/)) {
        toDelete.push({ id, ...benchmark });
        console.log(`❌ Will DELETE: ${id} (gender: ${benchmark.gender})`);
      } else {
        toKeep.push({ id, ...benchmark });
      }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   To Keep:   ${toKeep.length} (lowercase or null gender)`);
    console.log(`   To Delete: ${toDelete.length} (capitalized gender)`);
    
    if (toDelete.length === 0) {
      console.log('\n✅ No duplicates found! Database is clean.\n');
      return;
    }
    
    // Confirm deletion
    console.log(`\n⚠️  About to delete ${toDelete.length} duplicate benchmarks.`);
    console.log('   This action cannot be undone.');
    
    // Delete duplicates
    console.log('\n🗑️  Deleting duplicates...\n');
    
    let deletedCount = 0;
    for (const benchmark of toDelete) {
      try {
        await db.doc(`academies/${ACADEMY_ID}/benchmarks/${benchmark.id}`).delete();
        deletedCount++;
        console.log(`  ✅ Deleted: ${benchmark.id}`);
      } catch (error) {
        console.error(`  ❌ Failed to delete ${benchmark.id}:`, error.message);
      }
    }
    
    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Deleted: ${deletedCount}/${toDelete.length}`);
    console.log(`   Remaining: ${toKeep.length}\n`);
    
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run cleanup
cleanupDuplicates();