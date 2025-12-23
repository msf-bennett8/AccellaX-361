const admin = require('firebase-admin');
const serviceAccount = require('../../../firebase-admin-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const ACADEMY_ID = 'academy_accellax361_main';

async function checkKids() {
  console.log('\n🔍 Checking kids in Firebase...\n');
  
  const kidsRef = db.collection(`academies/${ACADEMY_ID}/kids`);
  const snapshot = await kidsRef.limit(10).get();
  
  console.log(`Total kids: ${snapshot.size}\n`);
  
  snapshot.forEach(doc => {
    const kid = doc.data();
    console.log(`\n👤 ${kid.name}`);
    console.log(`   ID: ${kid.id}`);
    console.log(`   Sports enrolled: ${JSON.stringify(kid.sports_enrolled)}`);
    console.log(`   Type: ${typeof kid.sports_enrolled}`);
    console.log(`   Primary sport: ${kid.primary_sport}`);
    console.log(`   ---`);
  });
  
  process.exit(0);
}

checkKids();
