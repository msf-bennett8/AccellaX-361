// Location: /apps/assessment/src/services/kidService.js
// Kid Management Service for Assessment App

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';
import { doc, updateDoc, Timestamp, collection, getDocs, query, where } from 'firebase/firestore';
import {
  getAllKids,
  getKidById,
  updateKid,
  insertKid,
  getDatabase,
} from '../database/db';

const isWeb = Platform.OS === 'web';
const FIXED_ACADEMY_ID = 'academy_accellax361_main';

/**
 * Assign sports to a kid (Assessment app "owns" this field)
 * 
 */
export const assignSportsToKid = async (kidId, sportsArray, primarySport) => {
  console.log('🔄 Assigning sports to kid:', { kidId, sportsArray, primarySport });
  
  try {
    // Validate inputs
    if (!kidId || !sportsArray || sportsArray.length === 0) {
      throw new Error('Kid ID and at least one sport required');
    }
    
    if (!primarySport || !sportsArray.includes(primarySport)) {
      throw new Error('Primary sport must be in sports array');
    }
    
    // Create sport history entry
    const sportHistory = sportsArray.map(sportId => ({
      sport_id: sportId,
      enrolled_date: new Date().toISOString().split('T')[0],
      status: sportId === primarySport ? 'primary' : 'active'
    }));
    
    // Update Firebase FIRST (source of truth)
    console.log('🔄 Updating sports in Firebase...');
    const kidRef = doc(db, `academies/${FIXED_ACADEMY_ID}/kids`, kidId.toString());
    
    await updateDoc(kidRef, {
      sports_enrolled: sportsArray,
      primary_sport: primarySport,
      sport_history: sportHistory,
      updated_at: Timestamp.now(),
    });
    
    console.log('✅ Sports assigned to kid in Firebase');
    
    // OPTIONAL: Update local DB if kid exists there
    try {
      if (isWeb) {
        const webDB = JSON.parse(await AsyncStorage.getItem('assessmentWebDB') || '{}');
        const kid = webDB.kids?.find(k => k.id === kidId);
        
        if (kid) {
          kid.sports_enrolled = JSON.stringify(sportsArray);
          kid.primary_sport = primarySport;
          kid.sport_history = JSON.stringify(sportHistory);
          kid.updated_at = new Date().toISOString();
          kid.firebase_synced = 1;
          
          await AsyncStorage.setItem('assessmentWebDB', JSON.stringify(webDB));
          console.log('✅ Sports also updated in local DB (web)');
        } else {
          console.log('ℹ️ Kid not in local DB yet (will sync later)');
        }
      } else {
        // Mobile SQLite
        const db = getDatabase();
        const result = await db.runAsync(
          'UPDATE kids SET sports_enrolled = ?, primary_sport = ?, updated_at = CURRENT_TIMESTAMP, firebase_synced = 1 WHERE id = ?',
          [JSON.stringify(sportsArray), primarySport, kidId]
        );
        
        if (result.changes > 0) {
          console.log('✅ Sports also updated in local DB (mobile)');
        } else {
          console.log('ℹ️ Kid not in local DB yet (will sync later)');
        }
      }
    } catch (localError) {
      console.warn('⚠️ Failed to update local DB (non-critical):', localError.message);
      // Don't fail the whole operation - Firebase update succeeded
    }
    
    return { success: true, kidId, sportsArray, primarySport };
    
  } catch (error) {
    console.error('❌ Error assigning sports to kid:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get kids with their sports assignments (FROM FIREBASE)
 */
export const getKidsWithSports = async () => {
  try {
    console.log('🔄 Fetching kids from Firebase...');
    
    const kidsRef = collection(db, `academies/${FIXED_ACADEMY_ID}/kids`);
    const snapshot = await getDocs(kidsRef);
    
    console.log(`✅ Fetched ${snapshot.size} kids from Firebase`);
    
    if (snapshot.empty) {
      console.warn('⚠️ No kids found in Firebase');
      return [];
    }
    
    const kids = [];
    snapshot.forEach(doc => {
      const kidData = doc.data();
      kids.push({
        ...kidData,
        // Ensure sports_enrolled is array (handle old data without sports)
        sports_enrolled: kidData.sports_enrolled || null,
        primary_sport: kidData.primary_sport || null,
        sport_history: kidData.sport_history || null,
      });
    });
    
    console.log('📊 Kids loaded:', kids.length);
    return kids;
    
  } catch (error) {
    console.error('❌ Error getting kids from Firebase:', error);
    return [];
  }
};

/**
 * Get kids enrolled in a specific sport
 */
export const getKidsBySport = async (sportId) => {
  try {
    const kidsWithSports = await getKidsWithSports();
    
    return kidsWithSports.filter(kid => 
      kid.sports_enrolled && kid.sports_enrolled.includes(sportId)
    );
  } catch (error) {
    console.error('❌ Error getting kids by sport:', error);
    return [];
  }
};

/**
 * Get kids without any sports assigned (need assignment)
 */
export const getKidsWithoutSports = async () => {
  try {
    const kidsWithSports = await getKidsWithSports();
    
    return kidsWithSports.filter(kid => 
      !kid.sports_enrolled || kid.sports_enrolled.length === 0
    );
  } catch (error) {
    console.error('❌ Error getting kids without sports:', error);
    return [];
  }
};

/**
 * Update kid's primary sport
 */
export const updatePrimarySport = async (kidId, newPrimarySport) => {
  try {
    const kid = await getKidById(kidId);
    
    if (!kid) {
      throw new Error('Kid not found');
    }
    
    const sportsEnrolled = kid.sports_enrolled 
      ? (typeof kid.sports_enrolled === 'string' ? JSON.parse(kid.sports_enrolled) : kid.sports_enrolled)
      : [];
    
    if (!sportsEnrolled.includes(newPrimarySport)) {
      throw new Error('New primary sport must be in enrolled sports');
    }
    
    await updateKid(kidId, { primary_sport: newPrimarySport });
    
    // Update in Firebase
    const kidRef = doc(db, `academies/${FIXED_ACADEMY_ID}/kids`, kidId.toString());
    await updateDoc(kidRef, {
      primary_sport: newPrimarySport,
      updated_at: Timestamp.now(),
    });
    
    console.log('✅ Primary sport updated');
    return { success: true, kidId, newPrimarySport };
    
  } catch (error) {
    console.error('❌ Error updating primary sport:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove a sport from kid's enrollment
 */
export const removeSportFromKid = async (kidId, sportId) => {
  try {
    const kid = await getKidById(kidId);
    
    if (!kid) {
      throw new Error('Kid not found');
    }
    
    const sportsEnrolled = kid.sports_enrolled 
      ? (typeof kid.sports_enrolled === 'string' ? JSON.parse(kid.sports_enrolled) : kid.sports_enrolled)
      : [];
    
    const updatedSports = sportsEnrolled.filter(s => s !== sportId);
    
    // If removing primary sport, assign new primary
    let newPrimarySport = kid.primary_sport;
    if (kid.primary_sport === sportId) {
      newPrimarySport = updatedSports[0] || null;
    }
    
    // Update sport history
    const sportHistory = kid.sport_history
      ? (typeof kid.sport_history === 'string' ? JSON.parse(kid.sport_history) : kid.sport_history)
      : [];
    
    const historyEntry = sportHistory.find(h => h.sport_id === sportId);
    if (historyEntry) {
      historyEntry.status = 'inactive';
      historyEntry.ended_date = new Date().toISOString().split('T')[0];
    }
    
    // Update locally
    if (isWeb) {
      const webDB = JSON.parse(await AsyncStorage.getItem('assessmentWebDB') || '{}');
      const kidIndex = webDB.kids?.findIndex(k => k.id === kidId);
      
      if (kidIndex !== -1) {
        webDB.kids[kidIndex].sports_enrolled = JSON.stringify(updatedSports);
        webDB.kids[kidIndex].primary_sport = newPrimarySport;
        webDB.kids[kidIndex].sport_history = JSON.stringify(sportHistory);
        webDB.kids[kidIndex].firebase_synced = 0;
        
        await AsyncStorage.setItem('assessmentWebDB', JSON.stringify(webDB));
      }
    } else {
      const db = getDatabase();
      await db.runAsync(
        'UPDATE kids SET sports_enrolled = ?, primary_sport = ?, firebase_synced = 0 WHERE id = ?',
        [JSON.stringify(updatedSports), newPrimarySport, kidId]
      );
    }
    
    // Update Firebase
    const kidRef = doc(db, `academies/${FIXED_ACADEMY_ID}/kids`, kidId.toString());
    await updateDoc(kidRef, {
      sports_enrolled: updatedSports,
      primary_sport: newPrimarySport,
      sport_history: sportHistory,
      updated_at: Timestamp.now(),
    });
    
    console.log('✅ Sport removed from kid');
    return { success: true, kidId, removedSport: sportId, newPrimarySport };
    
  } catch (error) {
    console.error('❌ Error removing sport from kid:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get kid by ID (from Firebase)
 */
export const getKidByIdFromFirebase = async (kidId) => {
  try {
    console.log('🔍 Getting kid by ID from Firebase:', kidId);
    
    const { doc, getDoc } = await import('firebase/firestore');
    const kidRef = doc(db, `academies/${FIXED_ACADEMY_ID}/kids`, kidId);
    const kidDoc = await getDoc(kidRef);
    
    if (kidDoc.exists()) {
      return { id: kidDoc.id, ...kidDoc.data() };
    }
    
    console.log('❌ Kid not found in Firebase:', kidId);
    return null;
  } catch (error) {
    console.error('❌ Error getting kid from Firebase:', error);
    return null;
  }
};

export default {
  assignSportsToKid,
  getKidsWithSports,
  getKidsBySport,
  getKidsWithoutSports,
  updatePrimarySport,
  removeSportFromKid,
  getKidByIdFromFirebase,
};