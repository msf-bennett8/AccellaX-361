// Location: /apps/assessment/src/utils/diagnostics.js
// Temporary Firebase Diagnostic Tool

import { db } from '../config/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';

const FIXED_ACADEMY_ID = 'academy_accellax361_main';

export const testFirebaseConnection = async () => {
  console.log('🔍 ===== FIREBASE DIAGNOSTICS START =====');
  
  try {
    // Test 1: Firebase initialized?
    console.log('✅ Step 1: Firebase db object exists:', !!db);
    
    // Test 2: Can we access the kids collection path?
    const kidsCollectionPath = `academies/${FIXED_ACADEMY_ID}/kids`;
    console.log('📂 Step 2: Kids collection path:', kidsCollectionPath);
    
    // Test 3: Try to read kids collection
    console.log('🔄 Step 3: Attempting to read kids collection...');
    const kidsRef = collection(db, kidsCollectionPath);
    const testQuery = query(kidsRef, limit(5)); // Only get 5 kids for testing
    const snapshot = await getDocs(testQuery);
    
    console.log('✅ Step 4: Query successful!');
    console.log('📊 Total kids found:', snapshot.size);
    
    // Test 4: Log first kid structure
    if (snapshot.size > 0) {
      const firstKid = snapshot.docs[0].data();
      console.log('👤 Sample kid data:', {
        id: firstKid.id,
        name: firstKid.name,
        age: firstKid.age,
        sports_enrolled: firstKid.sports_enrolled,
        primary_sport: firstKid.primary_sport,
        allFields: Object.keys(firstKid)
      });
    } else {
      console.warn('⚠️ No kids found in Firebase collection');
    }
    
    console.log('🔍 ===== FIREBASE DIAGNOSTICS END =====');
    return { success: true, kidsCount: snapshot.size };
    
  } catch (error) {
    console.error('❌ FIREBASE DIAGNOSTIC FAILED:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.log('🔍 ===== FIREBASE DIAGNOSTICS END (WITH ERRORS) =====');
    return { success: false, error: error.message };
  }
};

export default testFirebaseConnection;
