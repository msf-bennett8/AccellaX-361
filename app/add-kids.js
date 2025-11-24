const admin = require('firebase-admin');
const serviceAccount = require('./firebase-admin-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const kids = [
  {name:'Hope Raymond Ndambuki',age:15,gender:'Male',area_of_residence:'Kibera',age_group:'13+',sponsorshipType:'SC',programType:'ELT'},
  {name:'Loick Mburu',age:8,gender:'Male',area_of_residence:'Kibera',age_group:'7-9',sponsorshipType:'SC',programType:'ELT'},
  {name:'Hilda Wathanu Githua',age:9,gender:'Female',area_of_residence:'Kibera',age_group:'7-9',sponsorshipType:'SC',programType:'ELT'},
  {name:'Denique Wanjiku Ndambuki',age:12,gender:'Female',area_of_residence:'Kibera',age_group:'10-13',sponsorshipType:'SC',programType:'ELT'},
  {name:'Rosel Kavata Ndambuki',age:8,gender:'Female',area_of_residence:'Kibera',age_group:'7-9',sponsorshipType:'SC',programType:'ELT'},
  {name:'Joshua Odhiambo',age:13,gender:'Male',area_of_residence:'Kenyatta Estate',age_group:'10-13',sponsorshipType:'SC',programType:'ELT'},
  {name:'Samuel Makio',age:11,gender:'Male',area_of_residence:'Mashimoni',age_group:'10-13',sponsorshipType:'SC',programType:'ELT'},
  {name:'Daville David',age:13,gender:'Male',area_of_residence:'Kawangware',age_group:'10-13',sponsorshipType:'SC',programType:'ELT'},
  {name:'Samuel Kimani',age:9,gender:'Male',area_of_residence:'Kibera',age_group:'7-9',sponsorshipType:'SC',programType:'ELT'},
  {name:'Baraka Ichiuli',age:13,gender:'Male',area_of_residence:'Kibera',age_group:'10-13',sponsorshipType:'SC',programType:'ELT'},
  {name:'Brighton Likuyani',age:11,gender:'Male',area_of_residence:'Kibera',age_group:'10-13',sponsorshipType:'SC',programType:'ELT'},
  {name:'Victor Juma',age:11,gender:'Male',area_of_residence:'Kibera',age_group:'10-13',sponsorshipType:'SC',programType:'ELT'},
  {name:'Caleb Njuguna',age:10,gender:'Male',area_of_residence:'Kibera',age_group:'10-13',sponsorshipType:'SC',programType:'ELT'},
  {name:'Maxwel Amutsa',age:10,gender:'Male',area_of_residence:'Kibera',age_group:'10-13',sponsorshipType:'SC',programType:'ELT'},
  {name:'Alvin Nyaberi',age:12,gender:'Male',area_of_residence:'Kibera',age_group:'10-13',sponsorshipType:'SC',programType:'ELT'},
  {name:'Sean Crown Nyapole',age:10,gender:'Male',area_of_residence:'Kibera',age_group:'10-13',sponsorshipType:'SC',programType:'ELT'},
  {name:'Ritah Mwanzu Peter',age:8,gender:'Female',area_of_residence:'Kibera',age_group:'7-9',sponsorshipType:'SC',programType:'ELT'},
  {name:'Abigael Ndanu',age:7,gender:'Female',area_of_residence:'Kibera',age_group:'7-9',sponsorshipType:'SC',programType:'ELT'},
  {name:'Patrick Gaku Gathungu',age:9,gender:'Male',area_of_residence:'Kibera',age_group:'7-9',sponsorshipType:'SC',programType:'ELT'},
  {name:'Demetrius Mwangia Mutinda',age:9,gender:'Male',area_of_residence:'Kibera',age_group:'7-9',sponsorshipType:'SC',programType:'ELT'},
  {name:'Jayson Anyula Kennedy',age:14,gender:'Male',area_of_residence:'Kibera',age_group:'13+',sponsorshipType:'SC',programType:'ELT'},
  {name:'Biron Omondi',age:9,gender:'Male',area_of_residence:'Kibera',age_group:'7-9',sponsorshipType:'SC',programType:'ELT'},
  {name:'Blessing Mwangi Karubu',age:7,gender:'Female',area_of_residence:'Kibera',age_group:'7-9',sponsorshipType:'SC',programType:'ELT'},
  {name:'Alfron Kipchumna',age:11,gender:'Male',area_of_residence:'Kibera',age_group:'10-13',sponsorshipType:'SC',programType:'ELT'},
  {name:'Jeremy Waithaka',age:8,gender:'Male',area_of_residence:'Kibera',age_group:'7-9',sponsorshipType:'SC',programType:'ELT'},
  {name:'James Onyango',age:13,gender:'Male',area_of_residence:'Kibera',age_group:'10-13',sponsorshipType:'SC',programType:'ELT'},
  {name:'Damian Muthuku',age:9,gender:'Male',area_of_residence:'Kibera',age_group:'7-9',sponsorshipType:'SC',programType:'ELT'}
];

const academyId = 'academy_accellax361_main';
const userId = '2LmAHqdDAOZpUTrCTT0IFEKOV663';

async function addKids() {
  console.log('🚀 Starting to add 27 kids to Firebase...\n');
  
  for (const kid of kids) {
    const id = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    
    await db.collection('academies').doc(academyId).collection('kids').doc(id).set({
      ...kid,
      id,
      created_by: userId,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      synced_at: admin.firestore.FieldValue.serverTimestamp(),
      firebase_synced: 1,
      status: 'active',
      programTypeOther: null,
      trialNotes: null
    });
    
    console.log('✅ Added:', kid.name);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n🎉 All 27 kids added successfully to Firebase!');
  process.exit(0);
}

addKids().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
