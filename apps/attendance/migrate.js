// migrate.js
// Run migration script from command line

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDocs, Timestamp } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ACADEMY_ID = 'academy_accellax361_main';
const USER_ID = '03iULf3KtzdU40RHe1vCC5p01Df2';

// Kids data from localStorage
const kids = [
  {
    id: "1763230686770.4192",
    name: "Accella X",
    age: 13,
    gender: "Male",
    area_of_residence: "Kasarani Seasons",
    age_group: "10-13",
    sponsorshipType: "SP",
    programType: "ELT",
    status: "active",
    created_at: "2025-11-15T18:18:06.770Z"
  },
  {
    id: "1763230750007.0928",
    name: "Allecca BX",
    age: 17,
    gender: "Female",
    area_of_residence: "Soweto",
    age_group: "13+",
    sponsorshipType: "SC",
    programType: "WW",
    status: "active",
    created_at: "2025-11-15T18:19:10.007Z"
  }
];

async function migrateKids() {
  console.log('🔄 Starting migration to academy-wide structure...');
  console.log('👤 User ID:', USER_ID);
  console.log('🏫 Academy ID:', ACADEMY_ID);
  console.log(`📦 Migrating ${kids.length} kids...\n`);
  
  let migratedCount = 0;
  
  for (const kid of kids) {
    try {
      console.log(`📤 Migrating: ${kid.name}...`);
      
      const kidRef = doc(db, `academies/${ACADEMY_ID}/kids`, kid.id.toString());
      
      const kidData = {
        id: kid.id.toString(),
        name: kid.name,
        age: kid.age,
        gender: kid.gender,
        area_of_residence: kid.area_of_residence,
        age_group: kid.age_group,
        sponsorshipType: kid.sponsorshipType,
        programType: kid.programType,
        status: kid.status,
        created_at: Timestamp.fromDate(new Date(kid.created_at)),
        created_by: USER_ID,
        updated_at: Timestamp.now(),
        synced_at: Timestamp.now(),
      };
      
      await setDoc(kidRef, kidData);
      
      console.log(`✅ Migrated: ${kid.name} (${kid.age_group}, ${kid.sponsorshipType}/${kid.programType})`);
      migratedCount++;
      
    } catch (error) {
      console.error(`❌ Failed to migrate ${kid.name}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Migration complete!`);
  console.log(`✅ Successfully migrated: ${migratedCount}/${kids.length} kids`);
  
  // Verify migration
  console.log('\n🔍 Verifying migration...');
  await checkAcademyKids();
}

async function checkAcademyKids() {
  try {
    const kidsRef = collection(db, `academies/${ACADEMY_ID}/kids`);
    const snapshot = await getDocs(kidsRef);
    
    console.log(`📊 Found ${snapshot.size} kids in academy structure:`);
    
    snapshot.forEach(docSnap => {
      const kid = docSnap.data();
      console.log(`  ✅ ${kid.name} (${kid.age_group}, ${kid.sponsorshipType}/${kid.programType})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking academy kids:', error.message);
  }
}

// Run migration
migrateKids()
  .then(() => {
    console.log('\n✅ Migration script completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });