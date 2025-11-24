// cleanup-firebase-duplicates.mjs
// Run with: node cleanup-firebase-duplicates.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAXUvlKBO7_-EQKuFw9rLW8UpsqWDkoM9E",
  authDomain: "accellax-361.firebaseapp.com",
  projectId: "accellax-361",
  storageBucket: "accellax-361.firebasestorage.app",
  messagingSenderId: "354831496530",
  appId: "1:354831496530:web:f2d7c7ab5f74b9b9fbb68b",
  measurementId: "G-53YMY2QP9J"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupDuplicateKids() {
  console.log('🔍 Starting Firebase duplicate cleanup...\n');
  
  const ACADEMY_ID = 'academy_accellax361_main';
  const kidsRef = collection(db, `academies/${ACADEMY_ID}/kids`);
  
  try {
    const snapshot = await getDocs(kidsRef);
    console.log(`📊 Total kids in Firebase: ${snapshot.size}\n`);
    
    // Group by name, keep oldest (by created_at)
    const kidsByName = new Map();
    const toDelete = [];
    
    snapshot.forEach(docSnap => {
      const kid = docSnap.data();
      const name = kid.name;
      
      if (!name) {
        console.warn(`⚠️  Skipping kid with no name: ${docSnap.id}`);
        return;
      }
      
      if (kidsByName.has(name)) {
        // Duplicate found!
        const existing = kidsByName.get(name);
        const existingTime = existing.kid.created_at?.toMillis?.() || existing.kid.created_at || 0;
        const currentTime = kid.created_at?.toMillis?.() || kid.created_at || 0;
        
        if (currentTime < existingTime) {
          // Current is older - keep it, delete existing
          toDelete.push({
            docId: existing.docId,
            name: existing.kid.name,
            id: existing.kid.id,
            createdAt: new Date(existingTime).toISOString()
          });
          kidsByName.set(name, { docId: docSnap.id, kid: kid });
        } else {
          // Existing is older - keep it, delete current
          toDelete.push({
            docId: docSnap.id,
            name: kid.name,
            id: kid.id,
            createdAt: new Date(currentTime).toISOString()
          });
        }
      } else {
        // First occurrence
        kidsByName.set(name, { docId: docSnap.id, kid: kid });
      }
    });
    
    console.log(`✅ Unique kids found: ${kidsByName.size}`);
    console.log(`🗑️  Duplicates to delete: ${toDelete.length}\n`);
    
    if (toDelete.length === 0) {
      console.log('🎉 No duplicates found! Firebase is clean.\n');
      return;
    }
    
    // Show duplicates grouped by name
    const duplicatesByName = new Map();
    toDelete.forEach(dup => {
      if (!duplicatesByName.has(dup.name)) {
        duplicatesByName.set(dup.name, []);
      }
      duplicatesByName.get(dup.name).push(dup);
    });
    
    console.log('📋 Duplicates by name:\n');
    duplicatesByName.forEach((dups, name) => {
      console.log(`  ${name} (${dups.length} duplicates)`);
      dups.forEach((dup, i) => {
        console.log(`    ${i + 1}. ID: ${dup.id}, Created: ${dup.createdAt}`);
      });
    });
    
    // Confirm before deletion
    console.log('\n⚠️  WARNING: This will permanently delete duplicates from Firebase!\n');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🧹 Starting deletion...\n');
    
    // Delete duplicates
    let deleted = 0;
    let failed = 0;
    
    for (const dup of toDelete) {
      try {
        await deleteDoc(doc(db, `academies/${ACADEMY_ID}/kids`, dup.docId));
        deleted++;
        console.log(`✅ [${deleted}/${toDelete.length}] Deleted: ${dup.name} (${dup.id})`);
      } catch (error) {
        failed++;
        console.error(`❌ Failed to delete ${dup.name}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Cleanup complete!`);
    console.log(`   ✅ Deleted: ${deleted}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📊 Remaining unique kids: ${kidsByName.size}\n`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
  
  process.exit(0);
}

cleanupDuplicateKids();