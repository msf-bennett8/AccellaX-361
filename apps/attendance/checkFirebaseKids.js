// checkFirebaseKids.js - Check what kids exist in Firebase

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAXUvlKBO7_-EQKuFw9rLW8UpsqWDkoM9E",
  authDomain: "accellax-361.firebaseapp.com",
  projectId: "accellax-361",
  storageBucket: "accellax-361.firebasestorage.app",
  messagingSenderId: "354831496530",
  appId: "1:354831496530:web:f2d7c7ab5f74b9b9fbb68b",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ACADEMY_ID = 'academy_accellax361_main';

async function checkKids() {
  console.log('🔍 Checking Firebase academy kids...');
  
  try {
    const kidsRef = collection(db, `academies/${ACADEMY_ID}/kids`);
    const snapshot = await getDocs(kidsRef);
    
    console.log(`📊 Found ${snapshot.size} kids in Firebase`);
    
    if (snapshot.size === 0) {
      console.log('⚠️ No kids found in Firebase academy collection!');
      console.log('💡 Did you delete all kids? You need to add new ones as admin.');
    } else {
      console.log('\n📋 Kids list:');
      snapshot.forEach(doc => {
        const kid = doc.data();
        console.log(`  - ${kid.name} (${kid.age_group}, ${kid.sponsorshipType}/${kid.programType})`);
        console.log(`    ID: ${kid.id}`);
        console.log(`    Status: ${kid.status}`);
        console.log(`    Firebase Synced: ${kid.firebase_synced}`);
        console.log('');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkKids();
