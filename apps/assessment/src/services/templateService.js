// Location: /apps/assessment/src/services/templateService.js
// Assessment Template Service - Save and load test combinations

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from '../database/db';
import { db } from '../config/firebase';
import { collection, doc, setDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';

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
      assessment_templates: [] // ✅ Add templates array
    };
  }
  const parsed = JSON.parse(data);
  // Ensure templates array exists
  if (!parsed.assessment_templates) {
    parsed.assessment_templates = [];
  }
  return parsed;
};

const saveWebDB = async (webDB) => {
  await AsyncStorage.setItem('assessmentWebDB', JSON.stringify(webDB));
};

/**
 * Create a new assessment template
 * @param {string} name - Template name
 * @param {string} sportId - Sport ID
 * @param {Array<string>} metricIds - Array of metric IDs
 * @param {string} description - Template description
 * @param {string} createdBy - User ID who created the template
 * @param {boolean} isDefault - Whether this is a default template
 * @returns {Object} Created template
 */
export const createTemplate = async (name, sportId, metricIds, description = '', createdBy = 'current_user', isDefault = false) => {
  console.log('📋 Creating template:', { name, sportId, metricsCount: metricIds.length });
  
  if (!name || !sportId || !metricIds || metricIds.length === 0) {
    throw new Error('Missing required fields: name, sportId, and metricIds');
  }

  const template = {
    id: generateId(),
    name,
    sport_id: sportId,
    description,
    metric_ids: JSON.stringify(metricIds), // Store as JSON string
    created_by: createdBy,
    is_default: isDefault ? 1 : 0,
    created_at: new Date().toISOString(),
  };

  if (isWeb) {
    const webDB = await getWebDB();
    webDB.assessment_templates = [...(webDB.assessment_templates || []), template];
    await saveWebDB(webDB);
    console.log('✅ Template created (web):', template.id);
    return template;
  }

  // SQLite
  const database = getDatabase();
  try {
    await database.runAsync(
      `INSERT INTO assessment_templates 
       (id, name, sport_id, description, metric_ids, created_by, is_default, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [template.id, name, sportId, description, template.metric_ids, createdBy, template.is_default, template.created_at]
    );
    console.log('✅ Template created (SQLite):', template.id);
    return template;
  } catch (error) {
    console.error('❌ Error creating template:', error);
    throw error;
  }
};

/**
 * Get all templates for a sport
 * @param {string} sportId - Sport ID (optional, returns all if not provided)
 * @returns {Array<Object>} List of templates
 */
export const getTemplates = async (sportId = null) => {
  console.log('📋 Getting templates for sport:', sportId || 'all');

  if (isWeb) {
    const webDB = await getWebDB();
    let templates = webDB.assessment_templates || [];
    
    if (sportId) {
      templates = templates.filter(t => t.sport_id === sportId);
    }
    
    // Parse metric_ids from JSON string
    templates = templates.map(t => ({
      ...t,
      metric_ids: typeof t.metric_ids === 'string' ? JSON.parse(t.metric_ids) : t.metric_ids,
    }));
    
    console.log('✅ Found templates (web):', templates.length);
    return templates;
  }

  // SQLite
  const database = getDatabase();
  try {
    let templates;
    if (sportId) {
      templates = await database.getAllAsync(
        'SELECT * FROM assessment_templates WHERE sport_id = ? ORDER BY is_default DESC, created_at DESC',
        [sportId]
      );
    } else {
      templates = await database.getAllAsync(
        'SELECT * FROM assessment_templates ORDER BY is_default DESC, created_at DESC'
      );
    }
    
    // Parse metric_ids from JSON string
    templates = templates.map(t => ({
      ...t,
      metric_ids: JSON.parse(t.metric_ids),
    }));
    
    console.log('✅ Found templates (SQLite):', templates.length);
    return templates;
  } catch (error) {
    console.error('❌ Error getting templates:', error);
    return [];
  }
};

/**
 * Get a single template by ID
 * @param {string} templateId - Template ID
 * @returns {Object|null} Template object or null
 */
export const getTemplateById = async (templateId) => {
  console.log('🔍 Getting template:', templateId);

  if (isWeb) {
    const webDB = await getWebDB();
    const template = webDB.assessment_templates?.find(t => t.id === templateId);
    
    if (!template) {
      console.log('❌ Template not found (web)');
      return null;
    }
    
    return {
      ...template,
      metric_ids: typeof template.metric_ids === 'string' ? JSON.parse(template.metric_ids) : template.metric_ids,
    };
  }

  // SQLite
  const database = getDatabase();
  try {
    const template = await database.getFirstAsync(
      'SELECT * FROM assessment_templates WHERE id = ?',
      [templateId]
    );
    
    if (!template) {
      console.log('❌ Template not found (SQLite)');
      return null;
    }
    
    return {
      ...template,
      metric_ids: JSON.parse(template.metric_ids),
    };
  } catch (error) {
    console.error('❌ Error getting template:', error);
    return null;
  }
};

/**
 * Delete a template
 * @param {string} templateId - Template ID
 * @returns {boolean} Success status
 */
export const deleteTemplate = async (templateId) => {
  console.log('🗑️ Deleting template:', templateId);

  if (isWeb) {
    const webDB = await getWebDB();
    webDB.assessment_templates = webDB.assessment_templates?.filter(t => t.id !== templateId) || [];
    await saveWebDB(webDB);
    console.log('✅ Template deleted (web)');
    return true;
  }

  // SQLite
  const database = getDatabase();
  try {
    await database.runAsync('DELETE FROM assessment_templates WHERE id = ?', [templateId]);
    console.log('✅ Template deleted (SQLite)');
    return true;
  } catch (error) {
    console.error('❌ Error deleting template:', error);
    throw error;
  }
};

/**
 * Update a template
 * @param {string} templateId - Template ID
 * @param {Object} updates - Fields to update
 * @returns {boolean} Success status
 */
export const updateTemplate = async (templateId, updates) => {
  console.log('📝 Updating template:', templateId, updates);

  const allowedFields = ['name', 'description', 'metric_ids', 'is_default'];
  const updateData = {};
  
  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      updateData[key] = key === 'metric_ids' ? JSON.stringify(updates[key]) : updates[key];
    }
  });

  if (Object.keys(updateData).length === 0) {
    throw new Error('No valid fields to update');
  }

  if (isWeb) {
    const webDB = await getWebDB();
    const templateIndex = webDB.assessment_templates?.findIndex(t => t.id === templateId) ?? -1;
    
    if (templateIndex === -1) {
      throw new Error('Template not found');
    }
    
    webDB.assessment_templates[templateIndex] = {
      ...webDB.assessment_templates[templateIndex],
      ...updateData,
    };
    
    await saveWebDB(webDB);
    console.log('✅ Template updated (web)');
    return true;
  }

  // SQLite
  const database = getDatabase();
  try {
    const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), templateId];
    
    await database.runAsync(
      `UPDATE assessment_templates SET ${setClause} WHERE id = ?`,
      values
    );
    
    console.log('✅ Template updated (SQLite)');
    return true;
  } catch (error) {
    console.error('❌ Error updating template:', error);
    throw error;
  }
};

/**
 * Sync templates to Firebase
 * @returns {Object} Sync result
 */
export const syncTemplatesToFirebase = async () => {
  console.log('☁️ Syncing templates to Firebase...');

  try {
    let templates = [];
    
    if (isWeb) {
      const webDB = await getWebDB();
      templates = webDB.assessment_templates || [];
    } else {
      const database = getDatabase();
      templates = await database.getAllAsync('SELECT * FROM assessment_templates');
    }

    let syncedCount = 0;
    
    for (const template of templates) {
      await setDoc(doc(db, `academies/${ACADEMY_ID}/assessment_templates`, template.id), {
        ...template,
        synced_at: new Date().toISOString(),
      });
      syncedCount++;
    }

    console.log(`✅ Synced ${syncedCount} templates to Firebase`);
    return { success: true, count: syncedCount };
  } catch (error) {
    console.error('❌ Error syncing templates:', error);
    throw error;
  }
};

/**
 * Sync templates FROM Firebase
 * @returns {Object} Sync result
 */
export const syncTemplatesFromFirebase = async () => {
  console.log('⬇️ Syncing templates from Firebase...');

  try {
    const templatesRef = collection(db, `academies/${ACADEMY_ID}/assessment_templates`);
    const snapshot = await getDocs(templatesRef);
    
    let syncedCount = 0;

    if (isWeb) {
      const webDB = await getWebDB();
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const existingIndex = webDB.assessment_templates?.findIndex(t => t.id === docSnap.id) ?? -1;
        
        if (existingIndex >= 0) {
          webDB.assessment_templates[existingIndex] = data;
        } else {
          webDB.assessment_templates = [...(webDB.assessment_templates || []), data];
        }
        syncedCount++;
      });
      
      await saveWebDB(webDB);
    } else {
      const database = getDatabase();
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        const existing = await database.getFirstAsync(
          'SELECT * FROM assessment_templates WHERE id = ?',
          [docSnap.id]
        );
        
        if (existing) {
          await database.runAsync(
            `UPDATE assessment_templates 
             SET name = ?, sport_id = ?, description = ?, metric_ids = ?, is_default = ? 
             WHERE id = ?`,
            [data.name, data.sport_id, data.description, data.metric_ids, data.is_default, docSnap.id]
          );
        } else {
          await database.runAsync(
            `INSERT INTO assessment_templates 
             (id, name, sport_id, description, metric_ids, created_by, is_default, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [docSnap.id, data.name, data.sport_id, data.description, data.metric_ids, data.created_by, data.is_default, data.created_at]
          );
        }
        syncedCount++;
      }
    }

    console.log(`✅ Synced ${syncedCount} templates from Firebase`);
    return { success: true, count: syncedCount };
  } catch (error) {
    console.error('❌ Error syncing templates from Firebase:', error);
    throw error;
  }
};

export default {
  createTemplate,
  getTemplates,
  getTemplateById,
  deleteTemplate,
  updateTemplate,
  syncTemplatesToFirebase,
  syncTemplatesFromFirebase,
};