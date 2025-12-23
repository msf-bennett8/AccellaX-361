// Location: /apps/assessment/src/services/kidService.js
// Kid Management Service for Assessment App

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, Timestamp, collection, getDocs, query, where } from 'firebase/firestore';
import {
  getAllKids,
  getKidsByAgeGroup,
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
          kid.sports_enrolled = sportsArray;
          kid.primary_sport = primarySport;
          kid.sport_history = sportHistory;
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
    // ✅ OFFLINE-FIRST: Try local database first
    console.log('🔄 Fetching kids (offline-first)...');
    const localKids = await getAllKids();
    
    if (localKids.length > 0) {
      console.log(`✅ Loaded ${localKids.length} kids from local database`);
      return localKids;
    }
    
    // ✅ If no local kids, try Firebase (but check auth first)
    const { auth } = await import('../config/firebase');
    if (!auth.currentUser) {
      console.log('⚠️ No local kids and user not authenticated - returning empty');
      return [];
    }
    
    console.log('🔄 No local kids, fetching from Firebase...');
    const kidsRef = collection(db, `academies/${FIXED_ACADEMY_ID}/kids`);
    const snapshot = await getDocs(kidsRef);
    
    //console.log(`✅ Fetched ${snapshot.size} kids from Firebase`);
    
    if (snapshot.empty) {
      console.warn('⚠️ No kids found in Firebase');
      return [];
    }
    
    const kids = [];
    snapshot.forEach(doc => {
      const kidData = doc.data();
      
      // Parse sports_enrolled if it's a string
      let sportsEnrolled = kidData.sports_enrolled;
      if (typeof sportsEnrolled === 'string') {
        try {
          sportsEnrolled = JSON.parse(sportsEnrolled);
          // Handle double-stringified data
          if (typeof sportsEnrolled === 'string') {
            sportsEnrolled = JSON.parse(sportsEnrolled);
          }
        } catch (e) {
          console.warn('Failed to parse sports_enrolled:', e);
          sportsEnrolled = null;
        }
      }
      
      kids.push({
        ...kidData,
        sports_enrolled: sportsEnrolled || null,
        primary_sport: kidData.primary_sport || null,
        sport_history: kidData.sport_history || null,
      });
    });
    
    //console.log('📊 Kids loaded:', kids.length);
    return kids;
    
  } catch (error) {
    console.error('❌ Error getting kids from Firebase:', error);
    return [];
  }
};

// REPLACE the getKidsBySport function in kidService.js with this:

/**
 * Get kids enrolled in a specific sport
 * SPECIAL CASE: 'fitness' returns ALL active kids
 */
export const getKidsBySport = async (sportId) => {
  try {
    //console.log(`👥 [KidService] Getting kids for sport: ${sportId}`);
    
    // SPECIAL CASE: Fitness = general fitness testing for ALL kids
    if (sportId === 'fitness' || sportId === 'general') {
      //console.log('🏃 [KidService] Fitness selected - returning ALL active kids');
      const allKids = await getAllKids();
      const activeKids = allKids.filter(k => k.status === 'active' || !k.status);
      //console.log(`✅ [KidService] Fitness: ${activeKids.length} active kids (all)`);
      return activeKids;
    }
    
    // Regular sport: Get kids enrolled in this specific sport
    const allKids = await getAllKids();
   //console.log(`📊 [KidService] Total kids loaded: ${allKids.length}`);
    
    const enrolledKids = allKids.filter(kid => {
      // Skip inactive kids
      if (kid.status !== 'active' && kid.status) {
        return false;
      }
      
      // ✅ Robust sports_enrolled checking
      let sports = kid.sports_enrolled;
      
      // Handle null/undefined
      if (!sports) {
        // Fallback: Check if primary sport matches
        return kid.primary_sport === sportId;
      }
      
      try {
        // Case 1: Already an array
        if (Array.isArray(sports)) {
          return sports.includes(sportId);
        }
        
        // Case 2: String that needs parsing
        if (typeof sports === 'string') {
          sports = JSON.parse(sports);
          
          // Handle double-stringified data
          if (typeof sports === 'string') {
            sports = JSON.parse(sports);
          }
          
          if (Array.isArray(sports)) {
            return sports.includes(sportId);
          }
        }
        
        // Fallback: Check primary sport
        return kid.primary_sport === sportId;
        
      } catch (e) {
        console.error(`❌ Error parsing sports for ${kid.name}:`, e.message);
        // Fallback: Check primary sport
        return kid.primary_sport === sportId;
      }
    });
    
    //console.log(`✅ [KidService] ${sportId}: ${enrolledKids.length} enrolled kids`);
    
    // Show which kids are enrolled (first 5)
    if (enrolledKids.length > 0) {
      //console.log(`📋 [KidService] Enrolled kids (first 5):`);
      enrolledKids.slice(0, 5).forEach(kid => {
        //console.log(`  - ${kid.name}`);
      });
    }
    
    return enrolledKids;
  } catch (error) {
    console.error(`❌ [KidService] Error getting kids for sport ${sportId}:`, error);
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
    
    // First try local DB (faster)
    const localKid = await getKidById(kidId);
    if (localKid) {
      console.log('✅ Kid found in local DB:', kidId);
      return localKid;
    }
    
    // If not in local DB, try Firebase
    console.log('🔍 Kid not in local DB, checking Firebase...');
    const { doc, getDoc } = await import('firebase/firestore');
    const kidRef = doc(db, `academies/${FIXED_ACADEMY_ID}/kids`, kidId.toString());
    const kidDoc = await getDoc(kidRef);
    
    if (kidDoc.exists()) {
      console.log('✅ Kid found in Firebase:', kidId);
      return { id: kidDoc.id, ...kidDoc.data() };
    }
    
    console.log('❌ Kid not found in Firebase or local DB:', kidId);
    return null;
  } catch (error) {
    console.error('❌ Error getting kid from Firebase:', error);
    
    // Fallback to local DB in case of Firebase error
    try {
      const localKid = await getKidById(kidId);
      if (localKid) {
        console.log('✅ Fallback: Kid found in local DB:', kidId);
        return localKid;
      }
    } catch (localError) {
      console.error('❌ Also failed to get from local DB:', localError);
    }
    
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