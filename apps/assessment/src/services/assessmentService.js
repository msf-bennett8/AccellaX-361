// Location: /apps/assessment/src/services/assessmentService.js
// Complete Assessment Service - CRUD operations and Firebase sync

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from '../database/db';
import { db } from '../config/firebase';
import { collection, doc, setDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';

const isWeb = Platform.OS === 'web';
const ACADEMY_ID = 'academy_accellax361_main';

// ========== HELPER FUNCTIONS ==========

const getWebDB = async () => {
  const data = await AsyncStorage.getItem('assessmentWebDB');
  if (!data) {
    return { 
      users: [],
      kids: [],
      sports: [],
      metrics: [],
      assessments: [], 
      assessment_results: [],
      benchmarks: [],
      goals: [],
      notes: []
    };
  }
  return JSON.parse(data);
};

const saveWebDB = async (webDB) => {
  await AsyncStorage.setItem('assessmentWebDB', JSON.stringify(webDB));
};

const generateId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ========== SAVE ASSESSMENT RESULT (AUTO-SAVE) ==========

/**
 * Save single assessment result (called on each metric entry)
 * @param {Object} resultData - { kid_id, sport_id, metric_id, value, assessment_date, metadata }
 * @param {Object} metadata - { year, term, assessmentType, weekNumber, location, assessorName, generalNotes }
 */
export const saveAssessmentResult = async (resultData) => {
  const { kid_id, sport_id, metric_id, value, assessment_date, metadata } = resultData;
  
  console.log('💾 Saving assessment result:', { 
    kid_id, 
    sport_id, 
    metric_id, 
    value,
    metadata 
  });
  
  if (isWeb) {
    const webDB = await getWebDB();
    
    // Find or create assessment for today
    let assessment = webDB.assessments?.find(a => 
      a.kid_id === kid_id && 
      a.sport_id === sport_id && 
      a.assessment_date === assessment_date.split('T')[0]
    );
    
    
    if (!assessment) {
      console.log('🔍 Creating NEW assessment with metadata:', metadata);
      
      assessment = {
        id: generateId(),
        kid_id,
        sport_id,
        assessment_date: assessment_date.split('T')[0],
        // ✅ Metadata fields
        year: metadata?.year || null,
        term: metadata?.term || null,
        assessment_type: metadata?.assessmentType || null,
        week_number: metadata?.weekNumber || null,
        location: metadata?.location || null,
        assessor_name: metadata?.assessorName || 'Coach',
        general_notes: metadata?.generalNotes || null,
        // Original fields
        assessed_by: 'current_user', // TODO: Replace with actual user ID
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        firebase_synced: 0,
      };
      webDB.assessments = [...(webDB.assessments || []), assessment];
    } else {
      assessment.updated_at = new Date().toISOString();
    }
    
    // Add or update result
    const existingResultIndex = webDB.assessment_results?.findIndex(r =>
      r.assessment_id === assessment.id && r.metric_id === metric_id
    ) ?? -1;
    
    const result = {
      id: existingResultIndex >= 0 ? webDB.assessment_results[existingResultIndex].id : generateId(),
      assessment_id: assessment.id,
      metric_id,
      value: String(value),
      created_at: new Date().toISOString(),
    };
    
    if (existingResultIndex >= 0) {
      webDB.assessment_results[existingResultIndex] = result;
    } else {
      webDB.assessment_results = [...(webDB.assessment_results || []), result];
    }
    
    await saveWebDB(webDB);
    console.log('✅ Result saved to web storage');
    return { success: true, result };
  }
  
  // SQLite implementation
  const database = getDatabase();
  
  try {
    // Find or create assessment
    const existingAssessment = await database.getFirstAsync(
      'SELECT * FROM assessments WHERE kid_id = ? AND sport_id = ? AND assessment_date = ?',
      [kid_id, sport_id, assessment_date.split('T')[0]]
    );
    
    let assessmentId = existingAssessment?.id;
    
    if (!existingAssessment) {
      const newId = generateId();
      await database.runAsync(
        'INSERT INTO assessments (id, kid_id, sport_id, assessment_date, year, term, assessment_type, week_number, location, assessor_name, general_notes, assessed_by, status, created_at, updated_at, firebase_synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          newId, 
          kid_id, 
          sport_id, 
          assessment_date.split('T')[0], 
          metadata?.year || null,
          metadata?.term || null,
          metadata?.assessmentType || null,
          metadata?.weekNumber || null,
          metadata?.location || null,
          metadata?.assessorName || 'Coach',
          metadata?.generalNotes || null,
          'current_user', 
          'completed',
          new Date().toISOString(), 
          new Date().toISOString(), 
          0
        ]
      );
      assessmentId = newId;
    } else {
      await database.runAsync(
        'UPDATE assessments SET updated_at = ? WHERE id = ?',
        [new Date().toISOString(), assessmentId]
      );
    }
    
    // Insert or update result
    const existingResult = await database.getFirstAsync(
      'SELECT * FROM assessment_results WHERE assessment_id = ? AND metric_id = ?',
      [assessmentId, metric_id]
    );
    
    if (existingResult) {
      await database.runAsync(
        'UPDATE assessment_results SET value = ?, updated_at = ? WHERE id = ?',
        [String(value), new Date().toISOString(), existingResult.id]
      );
    } else {
      await database.runAsync(
        'INSERT INTO assessment_results (id, assessment_id, metric_id, value, created_at) VALUES (?, ?, ?, ?, ?)',
        [generateId(), assessmentId, metric_id, String(value), new Date().toISOString()]
      );
    }
    
    console.log('✅ Result saved to SQLite');
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving result:', error);
    throw error;
  }
};

// ========== GET LAST ASSESSMENT FOR KID ==========

/**
 * Get kid's most recent assessment with results
 * @param {string} kidId - Kid ID
 * @param {string} sportId - Sport ID
 */
export const getLastAssessmentForKid = async (kidId, sportId) => {
  console.log('🔍 Getting last assessment for kid:', kidId, sportId);
  
  if (isWeb) {
    const webDB = await getWebDB();
    const assessments = webDB.assessments?.filter(a => 
      a.kid_id === kidId && a.sport_id === sportId
    ) || [];
    
    if (assessments.length === 0) return null;
    
    const latestAssessment = assessments.sort((a, b) => 
      new Date(b.assessment_date) - new Date(a.assessment_date)
    )[0];
    
    const results = webDB.assessment_results?.filter(r => 
      r.assessment_id === latestAssessment.id
    ) || [];
    
    console.log('✅ Found last assessment:', latestAssessment.id, 'with', results.length, 'results');
    return { ...latestAssessment, results };
  }
  
  const database = getDatabase();
  
  try {
    const assessment = await database.getFirstAsync(
      'SELECT * FROM assessments WHERE kid_id = ? AND sport_id = ? ORDER BY assessment_date DESC LIMIT 1',
      [kidId, sportId]
    );
    
    if (!assessment) {
      console.log('ℹ️ No previous assessment found');
      return null;
    }
    
    const results = await database.getAllAsync(
      'SELECT * FROM assessment_results WHERE assessment_id = ?',
      [assessment.id]
    );
    
    console.log('✅ Found last assessment:', assessment.id, 'with', results.length, 'results');
    return { ...assessment, results };
  } catch (error) {
    console.error('❌ Error getting last assessment:', error);
    return null;
  }
};

// ========== GET ALL ASSESSMENTS ==========

/**
 * Get all assessments (with optional filters)
 */
export const getAllAssessments = async (filters = {}) => {
  console.log('📋 Getting all assessments with filters:', filters);
  
  if (isWeb) {
    const webDB = await getWebDB();
    let assessments = webDB.assessments || [];
    
    if (filters.sport_id) {
      assessments = assessments.filter(a => a.sport_id === filters.sport_id);
    }
    if (filters.kid_id) {
      assessments = assessments.filter(a => a.kid_id === filters.kid_id);
    }
    if (filters.date_from) {
      assessments = assessments.filter(a => a.assessment_date >= filters.date_from);
    }
    if (filters.date_to) {
      assessments = assessments.filter(a => a.assessment_date <= filters.date_to);
    }
    
    // Attach results to each assessment
    assessments = assessments.map(assessment => ({
      ...assessment,
      results: webDB.assessment_results?.filter(r => r.assessment_id === assessment.id) || []
    }));
    
    return assessments;
  }
  
  const database = getDatabase();
  
  try {
    let query = 'SELECT * FROM assessments WHERE 1=1';
    const params = [];
    
    if (filters.sport_id) {
      query += ' AND sport_id = ?';
      params.push(filters.sport_id);
    }
    if (filters.kid_id) {
      query += ' AND kid_id = ?';
      params.push(filters.kid_id);
    }
    if (filters.date_from) {
      query += ' AND assessment_date >= ?';
      params.push(filters.date_from);
    }
    if (filters.date_to) {
      query += ' AND assessment_date <= ?';
      params.push(filters.date_to);
    }
    
    query += ' ORDER BY assessment_date DESC';
    
    const assessments = await database.getAllAsync(query, params);
    
    // Attach results to each assessment
    for (const assessment of assessments) {
      assessment.results = await database.getAllAsync(
        'SELECT * FROM assessment_results WHERE assessment_id = ?',
        [assessment.id]
      );
    }
    
    return assessments;
  } catch (error) {
    console.error('❌ Error getting assessments:', error);
    return [];
  }
};

// ========== DELETE ASSESSMENT ==========

/**
 * Delete an assessment and its results
 */
export const deleteAssessment = async (assessmentId) => {
  console.log('🗑️ Deleting assessment:', assessmentId);
  
  if (isWeb) {
    const webDB = await getWebDB();
    webDB.assessments = webDB.assessments?.filter(a => a.id !== assessmentId) || [];
    webDB.assessment_results = webDB.assessment_results?.filter(r => r.assessment_id !== assessmentId) || [];
    await saveWebDB(webDB);
    console.log('✅ Assessment deleted from web storage');
    return { success: true };
  }
  
  const database = getDatabase();
  
  try {
    await database.runAsync('DELETE FROM assessment_results WHERE assessment_id = ?', [assessmentId]);
    await database.runAsync('DELETE FROM assessments WHERE id = ?', [assessmentId]);
    console.log('✅ Assessment deleted from SQLite');
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting assessment:', error);
    throw error;
  }
};

// ========== FIREBASE SYNC ==========

/**
 * Sync all unsynced assessments to Firebase
 */
export const syncAssessmentsToFirebase = async () => {
  console.log('☁️ Starting Firebase sync...');
  
  try {
    let unsyncedAssessments = [];
    
    if (isWeb) {
      const webDB = await getWebDB();
      unsyncedAssessments = webDB.assessments?.filter(a => a.firebase_synced === 0) || [];
      
      for (const assessment of unsyncedAssessments) {
        const results = webDB.assessment_results?.filter(r => r.assessment_id === assessment.id) || [];
        
        // Save to Firebase
        await setDoc(doc(db, `academies/${ACADEMY_ID}/assessments`, assessment.id), {
          ...assessment,
          results,
          synced_at: Timestamp.now(),
        });
        
        // Mark as synced
        assessment.firebase_synced = 1;
        assessment.synced_at = new Date().toISOString();
      }
      
      await saveWebDB(webDB);
    } else {
      const database = getDatabase();
      unsyncedAssessments = await database.getAllAsync(
        'SELECT * FROM assessments WHERE firebase_synced = 0'
      );
      
      for (const assessment of unsyncedAssessments) {
        const results = await database.getAllAsync(
          'SELECT * FROM assessment_results WHERE assessment_id = ?',
          [assessment.id]
        );
        
        // Save to Firebase
        await setDoc(doc(db, `academies/${ACADEMY_ID}/assessments`, assessment.id), {
          ...assessment,
          results,
          synced_at: Timestamp.now(),
        });
        
        // Mark as synced
        await database.runAsync(
          'UPDATE assessments SET firebase_synced = 1, synced_at = ? WHERE id = ?',
          [new Date().toISOString(), assessment.id]
        );
      }
    }
    
    console.log(`✅ Synced ${unsyncedAssessments.length} assessments to Firebase`);
    return { success: true, count: unsyncedAssessments.length };
  } catch (error) {
    console.error('❌ Firebase sync error:', error);
    throw error;
  }
};

/**
 * Sync assessments FROM Firebase to local database
 */
export const syncFromFirebase = async () => {
  console.log('⬇️ Syncing from Firebase...');
  
  try {
    const assessmentsRef = collection(db, `academies/${ACADEMY_ID}/assessments`);
    const snapshot = await getDocs(assessmentsRef);
    
    let syncedCount = 0;
    
    if (isWeb) {
      const webDB = await getWebDB();
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const existingIndex = webDB.assessments?.findIndex(a => a.id === docSnap.id) ?? -1;
        
        // Convert Firebase Timestamps to ISO strings
        const processedData = {
          ...data,
          created_at: data.created_at?.toDate?.() ? data.created_at.toDate().toISOString() : data.created_at,
          updated_at: data.updated_at?.toDate?.() ? data.updated_at.toDate().toISOString() : data.updated_at,
          synced_at: data.synced_at?.toDate?.() ? data.synced_at.toDate().toISOString() : data.synced_at,
          firebase_synced: 1,
        };
        
        if (existingIndex >= 0) {
          // Only update if Firebase version is newer
          const localUpdatedAt = new Date(webDB.assessments[existingIndex].updated_at);
          const firebaseUpdatedAt = new Date(processedData.updated_at);
          
          if (firebaseUpdatedAt > localUpdatedAt) {
            webDB.assessments[existingIndex] = processedData;
            console.log('✅ Updated assessment from Firebase:', docSnap.id);
          } else {
            console.log('ℹ️ Local assessment is newer, keeping local:', docSnap.id);
          }
        } else {
          webDB.assessments = [...(webDB.assessments || []), processedData];
          console.log('✅ Added new assessment from Firebase:', docSnap.id);
        }
        
        // Sync results
        if (data.results) {
          data.results.forEach(result => {
            const resultIndex = webDB.assessment_results?.findIndex(r => r.id === result.id) ?? -1;
            if (resultIndex >= 0) {
              webDB.assessment_results[resultIndex] = result;
            } else {
              webDB.assessment_results = [...(webDB.assessment_results || []), result];
            }
          });
        }
        
        syncedCount++;
      });
      
      await saveWebDB(webDB);
    } else {
      const database = getDatabase();
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        const existing = await database.getFirstAsync(
          'SELECT * FROM assessments WHERE id = ?',
          [docSnap.id]
        );
        
        if (existing) {
          await database.runAsync(
            'UPDATE assessments SET kid_id = ?, sport_id = ?, assessment_date = ?, assessed_by = ?, updated_at = ?, firebase_synced = 1 WHERE id = ?',
            [data.kid_id, data.sport_id, data.assessment_date, data.assessed_by, data.updated_at, docSnap.id]
          );
        } else {
          await database.runAsync(
            'INSERT INTO assessments (id, kid_id, sport_id, assessment_date, assessed_by, created_at, updated_at, firebase_synced) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
            [docSnap.id, data.kid_id, data.sport_id, data.assessment_date, data.assessed_by, data.created_at, data.updated_at]
          );
        }
        
        // Sync results
        if (data.results) {
          for (const result of data.results) {
            const existingResult = await database.getFirstAsync(
              'SELECT * FROM assessment_results WHERE id = ?',
              [result.id]
            );
            
            if (existingResult) {
              await database.runAsync(
                'UPDATE assessment_results SET value = ? WHERE id = ?',
                [result.value, result.id]
              );
            } else {
              await database.runAsync(
                'INSERT INTO assessment_results (id, assessment_id, metric_id, value, created_at) VALUES (?, ?, ?, ?, ?)',
                [result.id, result.assessment_id, result.metric_id, result.value, result.created_at]
              );
            }
          }
        }
        
        syncedCount++;
      }
    }
    
    console.log(`✅ Synced ${syncedCount} assessments from Firebase`);
    return { success: true, count: syncedCount };
  } catch (error) {
    console.error('❌ Error syncing from Firebase:', error);
    throw error;
  }
};

// ========== STATISTICS ==========

/**
 * Get assessment statistics
 */
export const getAssessmentStats = async () => {
  console.log('📊 Getting assessment stats...');
  
  if (isWeb) {
    const webDB = await getWebDB();
    const assessments = webDB.assessments || [];
    
    const uniqueKids = new Set(assessments.map(a => a.kid_id)).size;
    const uniqueSports = new Set(assessments.map(a => a.sport_id)).size;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentAssessments = assessments.filter(a => 
      new Date(a.assessment_date) >= oneWeekAgo
    ).length;
    
    const lastAssessment = assessments.sort((a, b) => 
      new Date(b.assessment_date) - new Date(a.assessment_date)
    )[0];
    
    return {
      totalAssessments: assessments.length,
      totalKids: uniqueKids,
      activeSports: uniqueSports,
      recentAssessments,
      lastAssessmentDate: lastAssessment?.assessment_date || null,
    };
  }
  
  const database = getDatabase();
  
  try {
    const totalResult = await database.getFirstAsync('SELECT COUNT(*) as count FROM assessments');
    const kidsResult = await database.getFirstAsync('SELECT COUNT(DISTINCT kid_id) as count FROM assessments');
    const sportsResult = await database.getFirstAsync('SELECT COUNT(DISTINCT sport_id) as count FROM assessments');
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentResult = await database.getFirstAsync(
      'SELECT COUNT(*) as count FROM assessments WHERE assessment_date >= ?',
      [oneWeekAgo.toISOString().split('T')[0]]
    );
    
    const lastResult = await database.getFirstAsync(
      'SELECT assessment_date FROM assessments ORDER BY assessment_date DESC LIMIT 1'
    );
    
    return {
      totalAssessments: totalResult?.count || 0,
      totalKids: kidsResult?.count || 0,
      activeSports: sportsResult?.count || 0,
      recentAssessments: recentResult?.count || 0,
      lastAssessmentDate: lastResult?.assessment_date || null,
    };
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    return {
      totalAssessments: 0,
      totalKids: 0,
      activeSports: 6,
      recentAssessments: 0,
      lastAssessmentDate: null,
    };
  }
};

export default {
  saveAssessmentResult,
  getLastAssessmentForKid,
  getAllAssessments,
  deleteAssessment,
  syncAssessmentsToFirebase,
  syncFromFirebase,
  getAssessmentStats,
};