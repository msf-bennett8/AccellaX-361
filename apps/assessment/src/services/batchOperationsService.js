// Location: /apps/assessment/src/services/batchOperationsService.js
// Batch Operations Service - Copy, import, export assessments

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from '../database/db';
import { getLastAssessmentForKid, saveAssessmentResult } from './assessmentService';

const isWeb = Platform.OS === 'web';
const ACADEMY_ID = 'academy_accellax361_main';

const generateId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

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
      notes: [],
      assessment_templates: []
    };
  }
  return JSON.parse(data);
};

const saveWebDB = async (webDB) => {
  await AsyncStorage.setItem('assessmentWebDB', JSON.stringify(webDB));
};

/**
 * Copy last assessment results to a new date
 * @param {string} kidId - Kid ID
 * @param {string} sportId - Sport ID
 * @param {string} newDate - New assessment date (YYYY-MM-DD)
 * @param {Object} metadata - Assessment metadata (year, term, etc.)
 * @returns {Object} Result with new assessment ID
 */
export const copyLastAssessment = async (kidId, sportId, newDate, metadata = {}) => {
  console.log('📋 Copying last assessment:', { kidId, sportId, newDate });

  try {
    // Get last assessment
    const lastAssessment = await getLastAssessmentForKid(kidId, sportId);
    
    if (!lastAssessment) {
      throw new Error('No previous assessment found to copy');
    }

    if (!lastAssessment.results || lastAssessment.results.length === 0) {
      throw new Error('Previous assessment has no results to copy');
    }

    // Create new assessment with copied results
    const newAssessmentId = generateId();
    const newAssessment = {
      id: newAssessmentId,
      academy_id: ACADEMY_ID,
      kid_id: kidId,
      sport_id: sportId,
      assessment_date: newDate,
      year: metadata.year || lastAssessment.year,
      term: metadata.term || lastAssessment.term,
      assessment_type: metadata.assessmentType || lastAssessment.assessment_type,
      week_number: metadata.weekNumber || lastAssessment.week_number,
      location: metadata.location || lastAssessment.location,
      assessor_name: metadata.assessorName || lastAssessment.assessor_name,
      general_notes: metadata.generalNotes || null,
      assessed_by: metadata.assessedBy || lastAssessment.assessed_by,
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      firebase_synced: 0,
    };

    // Copy results
    const newResults = lastAssessment.results.map(result => ({
      id: generateId(),
      assessment_id: newAssessmentId,
      metric_id: result.metric_id,
      value: result.value,
      notes: null,
      firebase_synced: 0,
    }));

    // Save to database
    if (isWeb) {
      const webDB = await getWebDB();
      webDB.assessments = [...(webDB.assessments || []), newAssessment];
      webDB.assessment_results = [...(webDB.assessment_results || []), ...newResults];
      await saveWebDB(webDB);
    } else {
      const database = getDatabase();
      
      // Insert assessment
      await database.runAsync(
        `INSERT INTO assessments 
         (id, academy_id, kid_id, sport_id, assessment_date, year, term, assessment_type, 
          week_number, location, assessor_name, general_notes, assessed_by, status, 
          created_at, updated_at, firebase_synced) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newAssessment.id, newAssessment.academy_id, newAssessment.kid_id, 
          newAssessment.sport_id, newAssessment.assessment_date, newAssessment.year, 
          newAssessment.term, newAssessment.assessment_type, newAssessment.week_number, 
          newAssessment.location, newAssessment.assessor_name, newAssessment.general_notes, 
          newAssessment.assessed_by, newAssessment.status, newAssessment.created_at, 
          newAssessment.updated_at, newAssessment.firebase_synced
        ]
      );

      // Insert results
      for (const result of newResults) {
        await database.runAsync(
          `INSERT INTO assessment_results 
           (id, assessment_id, metric_id, value, notes, firebase_synced) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [result.id, result.assessment_id, result.metric_id, result.value, result.notes, result.firebase_synced]
        );
      }
    }

    console.log('✅ Assessment copied:', newAssessmentId);
    return { success: true, assessmentId: newAssessmentId, resultsCount: newResults.length };
  } catch (error) {
    console.error('❌ Error copying assessment:', error);
    throw error;
  }
};

/**
 * Bulk copy assessments for multiple kids
 * @param {Array<string>} kidIds - Array of kid IDs
 * @param {string} sportId - Sport ID
 * @param {string} sourceDate - Source assessment date
 * @param {string} targetDate - Target assessment date
 * @param {Object} metadata - Assessment metadata
 * @returns {Object} Result with counts
 */
export const bulkCopyAssessments = async (kidIds, sportId, sourceDate, targetDate, metadata = {}) => {
  console.log('📋 Bulk copying assessments:', { kidsCount: kidIds.length, sportId, sourceDate, targetDate });

  const results = {
    total: kidIds.length,
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const kidId of kidIds) {
    try {
      await copyLastAssessment(kidId, sportId, targetDate, metadata);
      results.success++;
    } catch (error) {
      console.error(`❌ Failed to copy assessment for kid ${kidId}:`, error);
      results.failed++;
      results.errors.push({ kidId, error: error.message });
    }
  }

  console.log('✅ Bulk copy complete:', results);
  return results;
};

/**
 * Export assessments to CSV format
 * @param {Array<string>} assessmentIds - Array of assessment IDs (optional - exports all if not provided)
 * @returns {string} CSV string
 */
export const exportToCSV = async (assessmentIds = null) => {
  console.log('📤 Exporting assessments to CSV:', assessmentIds ? `${assessmentIds.length} selected` : 'all');

  try {
    let assessments = [];

    if (isWeb) {
      const webDB = await getWebDB();
      assessments = webDB.assessments || [];
      
      if (assessmentIds) {
        assessments = assessments.filter(a => assessmentIds.includes(a.id));
      }

      // Attach results
      assessments = assessments.map(assessment => ({
        ...assessment,
        results: webDB.assessment_results?.filter(r => r.assessment_id === assessment.id) || []
      }));
    } else {
      const database = getDatabase();
      
      if (assessmentIds) {
        const placeholders = assessmentIds.map(() => '?').join(',');
        assessments = await database.getAllAsync(
          `SELECT * FROM assessments WHERE id IN (${placeholders})`,
          assessmentIds
        );
      } else {
        assessments = await database.getAllAsync('SELECT * FROM assessments');
      }

      // Attach results
      for (const assessment of assessments) {
        assessment.results = await database.getAllAsync(
          'SELECT * FROM assessment_results WHERE assessment_id = ?',
          [assessment.id]
        );
      }
    }

    // Build CSV
    const headers = [
      'Assessment ID',
      'Kid ID',
      'Sport ID',
      'Assessment Date',
      'Year',
      'Term',
      'Assessment Type',
      'Week Number',
      'Location',
      'Assessor Name',
      'Status',
      'Metric ID',
      'Value',
      'Notes',
    ];

    let csv = headers.join(',') + '\n';

    for (const assessment of assessments) {
      for (const result of assessment.results) {
        const row = [
          assessment.id,
          assessment.kid_id,
          assessment.sport_id,
          assessment.assessment_date,
          assessment.year || '',
          assessment.term || '',
          assessment.assessment_type || '',
          assessment.week_number || '',
          assessment.location || '',
          assessment.assessor_name || '',
          assessment.status,
          result.metric_id,
          result.value,
          result.notes || '',
        ];
        
        csv += row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',') + '\n';
      }
    }

    console.log('✅ CSV export complete:', csv.split('\n').length - 1, 'rows');
    return csv;
  } catch (error) {
    console.error('❌ Error exporting to CSV:', error);
    throw error;
  }
};

/**
 * Import assessments from CSV
 * @param {string} csvData - CSV string
 * @returns {Object} Import result with counts
 */
export const importFromCSV = async (csvData) => {
  console.log('📥 Importing assessments from CSV');

  const results = {
    total: 0,
    success: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Parse CSV
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    // Group by assessment ID
    const assessmentGroups = {};
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g).map(v => v.replace(/^"|"$/g, '').trim());
      
      const assessmentId = values[0];
      
      if (!assessmentGroups[assessmentId]) {
        assessmentGroups[assessmentId] = {
          assessment: {
            id: assessmentId,
            kid_id: values[1],
            sport_id: values[2],
            assessment_date: values[3],
            year: values[4],
            term: values[5],
            assessment_type: values[6],
            week_number: parseInt(values[7]) || null,
            location: values[8],
            assessor_name: values[9],
            status: values[10],
          },
          results: []
        };
      }
      
      assessmentGroups[assessmentId].results.push({
        metric_id: values[11],
        value: values[12],
        notes: values[13],
      });
    }

    // Import each assessment
    for (const [assessmentId, data] of Object.entries(assessmentGroups)) {
      try {
        results.total++;
        
        // Save assessment
        const metadata = {
          year: data.assessment.year,
          term: data.assessment.term,
          assessmentType: data.assessment.assessment_type,
          weekNumber: data.assessment.week_number,
          location: data.assessment.location,
          assessorName: data.assessment.assessor_name,
          assessedBy: 'import',
        };

        // Save each result
        for (const result of data.results) {
          await saveAssessmentResult({
            kid_id: data.assessment.kid_id,
            sport_id: data.assessment.sport_id,
            metric_id: result.metric_id,
            value: result.value,
            assessment_date: data.assessment.assessment_date,
            metadata,
          });
        }

        results.success++;
      } catch (error) {
        console.error(`❌ Failed to import assessment ${assessmentId}:`, error);
        results.failed++;
        results.errors.push({ assessmentId, error: error.message });
      }
    }

    console.log('✅ CSV import complete:', results);
    return results;
  } catch (error) {
    console.error('❌ Error importing CSV:', error);
    throw error;
  }
};

/**
 * Download CSV file (web only)
 * @param {string} csvData - CSV string
 * @param {string} filename - Filename
 */
export const downloadCSV = (csvData, filename = 'assessments_export.csv') => {
  if (!isWeb) {
    console.warn('⚠️ Download CSV is only available on web');
    return;
  }

  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log('✅ CSV downloaded:', filename);
};

export default {
  copyLastAssessment,
  bulkCopyAssessments,
  exportToCSV,
  importFromCSV,
  downloadCSV,
};