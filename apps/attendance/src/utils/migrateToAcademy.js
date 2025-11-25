// src/utils/migrateToAcademy.js
// One-time migration: Move kids from user-specific to academy-wide structure

import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getAllKids } from '../database/db';

const ACADEMY_ID = 'academy_accellax361_main';

export const migrateToAcademyStructure = async (userId) => {
  console.log('🔄 Starting migration to academy-wide structure...');
  console.log('👤 User ID:', userId);
  console.log('🏫 Academy ID:', ACADEMY_ID);
  
  try {
    // Get all kids from local database
    const localKids = await getAllKids();
    console.log(`📦 Found ${localKids.length} kids in local database`);
    
    if (localKids.length === 0) {
      console.log('⚠️ No kids to migrate');
      return { success: true, count: 0 };
    }
    
    // Show kids to be migrated
    localKids.forEach(kid => {
      console.log(`  - ${kid.name} (${kid.age_group}, ${kid.sponsorshipType}/${kid.programType})`);
    });
    
    let migratedCount = 0;
    const errors = [];
    
    // Migrate each kid to academy structure
    for (const kid of localKids) {
      try {
        console.log(`📤 Migrating: ${kid.name}...`);
        
        const kidRef = doc(db, `academies/${ACADEMY_ID}/kids`, kid.id.toString());
        
        const kidData = {
          id: kid.id.toString(),
          name: kid.name,
          age: kid.age,
          gender: kid.gender || '',
          area_of_residence: kid.area_of_residence || '',
          age_group: kid.age_group,
          sponsorshipType: kid.sponsorshipType || 'SP',
          programType: kid.programType || 'ELT',
          status: kid.status || 'active',
          created_at: Timestamp.fromDate(new Date(kid.created_at)),
          created_by: userId,
          updated_at: Timestamp.now(),
          synced_at: Timestamp.now(),
        };
        
        await setDoc(kidRef, kidData);
        
        console.log(`✅ Migrated: ${kid.name}`);
        migratedCount++;
        
      } catch (kidError) {
        console.error(`❌ Failed to migrate ${kid.name}:`, kidError);
        errors.push({ kid: kid.name, error: kidError.message });
      }
    }
    
    // Store academy ID in local storage
    await AsyncStorage.setItem('academyId', ACADEMY_ID);
    console.log('💾 Academy ID stored in local storage');
    
    // Mark migration as complete
    await AsyncStorage.setItem('migrationCompleted', 'true');
    await AsyncStorage.setItem('migrationDate', new Date().toISOString());
    
    console.log(`🎉 Migration complete!`);
    console.log(`✅ Successfully migrated: ${migratedCount}/${localKids.length} kids`);
    
    if (errors.length > 0) {
      console.log(`⚠️ Errors encountered: ${errors.length}`);
      errors.forEach(err => {
        console.log(`  - ${err.kid}: ${err.error}`);
      });
    }
    
    return { 
      success: true, 
      count: migratedCount,
      total: localKids.length,
      errors: errors,
      academyId: ACADEMY_ID 
    };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return { success: false, error: error.message };
  }
};

export const checkAcademyKids = async () => {
  console.log('🔍 Checking kids in academy structure...');
  console.log('🏫 Academy ID:', ACADEMY_ID);
  
  try {
    const kidsRef = collection(db, `academies/${ACADEMY_ID}/kids`);
    const snapshot = await getDocs(kidsRef);
    
    console.log(`📊 Found ${snapshot.size} kids in academy structure:`);
    
    const kids = [];
    snapshot.forEach(docSnap => {
      const kid = docSnap.data();
      kids.push(kid);
      console.log(`  ✅ ${kid.name} (${kid.age_group}, ${kid.sponsorshipType}/${kid.programType})`);
    });
    
    return { 
      success: true, 
      count: snapshot.size,
      kids: kids 
    };
    
  } catch (error) {
    console.error('❌ Error checking academy kids:', error);
    return { success: false, error: error.message };
  }
};

export const getMigrationStatus = async () => {
  try {
    const completed = await AsyncStorage.getItem('migrationCompleted');
    const date = await AsyncStorage.getItem('migrationDate');
    const academyId = await AsyncStorage.getItem('academyId');
    
    return {
      completed: completed === 'true',
      date: date,
      academyId: academyId
    };
  } catch (error) {
    return {
      completed: false,
      error: error.message
    };
  }
};