// Location: /apps/assessment/src/services/sportService.js
// Sport Management Service with Debug Logging

import { getAllSports, getSportById, insertSport, updateSport, deleteSport } from '../database/db';
import { DEFAULT_SPORTS } from '../config/sports';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEBUG = true; // Set to false to disable debug logs

const log = (message, data = null) => {
  if (DEBUG) {
    console.log(`🏃 [SportService] ${message}`, data || '');
  }
};

/**
 * Get all active sports
 */
export const getActiveSports = async () => {
  try {
    log('Fetching active sports...');
    const sports = await getAllSports();
    const active = sports.filter(s => s.is_active === 1 || s.is_active === true);
    log(`Found ${active.length} active sports`, active.map(s => s.name));
    return active;
  } catch (error) {
    console.error('❌ Error getting active sports:', error);
    return [];
  }
};

/**
 * Get sport by ID with special handling for 'fitness'
 */
export const getSport = async (sportId) => {
  try {
    log(`Fetching sport: ${sportId}`);
    
    // Special case: 'fitness' is a virtual module
    if (sportId === 'fitness' || sportId === 'general') {
      log('Returning virtual Fitness module');
      return {
        id: 'fitness',
        name: 'Fitness',
        icon: 'heart-pulse',
        color: '#E74C3C',
        description: 'General fitness assessments',
        isDefault: true,
        isActive: true,
        is_active: 1,
        categories: ['general_fitness'],
      };
    }
    
    const sport = await getSportById(sportId);
    log(`Retrieved sport:`, sport);
    return sport;
  } catch (error) {
    console.error(`❌ Error getting sport ${sportId}:`, error);
    return null;
  }
};

/**
 * Get all sports including virtual Fitness module
 * CRITICAL: This adds Fitness ONCE at the beginning
 */
export const getAllSportsWithFitness = async () => {
  try {
    log('Fetching all sports with Fitness module...');
    
    // Get regular sports from database
    const dbSports = await getAllSports();
    log(`Database returned ${dbSports.length} sports:`, dbSports.map(s => s.name));
    
    // Filter out any existing 'fitness' entries (safety check)
    const cleanedSports = dbSports.filter(s => 
      s.id !== 'fitness' && 
      s.id !== 'general' && 
      s.name.toLowerCase() !== 'fitness' &&
      s.name.toLowerCase() !== 'general fitness'
    );
    
    // Create virtual Fitness module
    const fitnessModule = {
      id: 'fitness',
      name: 'Fitness',
      icon: 'heart-pulse',
      color: '#E74C3C',
      description: 'General fitness assessments',
      isDefault: true,
      isActive: true,
      is_active: 1,
      categories: ['general_fitness'],
    };
    
    const allSports = [fitnessModule, ...cleanedSports];
    log(`Returning ${allSports.length} total sports:`, allSports.map(s => s.name));
    
    return allSports;
  } catch (error) {
    console.error('❌ Error getting all sports with fitness:', error);
    return [];
  }
};

/**
 * Create a new custom sport
 */
export const createSport = async (sportData, userId) => {
  try {
    log('Creating new sport:', sportData.name);
    const sport = await insertSport(sportData, userId);
    log('✅ Sport created successfully:', sport.name);
    return sport;
  } catch (error) {
    console.error('❌ Error creating sport:', error);
    throw error;
  }
};

/**
 * Update existing sport
 */
export const modifySport = async (sportId, updates) => {
  try {
    log(`Updating sport: ${sportId}`);
    await updateSport(sportId, updates);
    log('✅ Sport updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error updating sport:', error);
    throw error;
  }
};

/**
 * Delete (deactivate) a sport
 */
export const removeSport = async (sportId) => {
  try {
    log(`Deleting sport: ${sportId}`);
    await deleteSport(sportId);
    log('✅ Sport deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Error deleting sport:', error);
    throw error;
  }
};

/**
 * Get sport statistics
 */
export const getSportStats = async (sportId) => {
  try {
    log(`Fetching stats for sport: ${sportId}`);
    
    const { getAssessmentsByDateRange } = await import('./assessmentService');
    const { getKidsBySport } = await import('./kidService');
    
    const startDate = '2020-01-01';
    const endDate = new Date().toISOString().split('T')[0];
    const assessments = await getAssessmentsByDateRange(startDate, endDate, sportId);
    
    const kids = await getKidsBySport(sportId);
    
    const stats = {
      totalAssessments: assessments.length,
      totalKids: kids.length,
      lastAssessmentDate: assessments[0]?.assessment_date || null,
    };
    
    log(`Stats for ${sportId}:`, stats);
    return stats;
  } catch (error) {
    console.error(`❌ Error getting stats for sport ${sportId}:`, error);
    return {
      totalAssessments: 0,
      totalKids: 0,
      lastAssessmentDate: null,
    };
  }
};

/**
 * Get sport color
 */
export const getSportColor = (sportId) => {
  const colorMap = {
    fitness: '#E74C3C',
    general: '#E74C3C',
    football: '#4CAF50',
    athletics: '#FF9800',
    rugby: '#795548',
    swimming: '#2196F3',
    tennis: '#FFEB3B',
    basketball: '#FF5722',
  };
  
  return colorMap[sportId] || '#9E9E9E';
};

/**
 * Get sport icon name for MaterialCommunityIcons
 */
export const getSportIcon = (sportId) => {
  const iconMap = {
    fitness: 'heart-pulse',
    general: 'heart-pulse',
    football: 'soccer',
    athletics: 'run-fast',
    rugby: 'rugby',
    swimming: 'swim',
    tennis: 'tennis',
    basketball: 'basketball',
  };
  
  return iconMap[sportId] || 'trophy';
};

/**
 * Check if Basketball is in database, if not add it
 */
export const ensureBasketballExists = async (userId) => {
  try {
    log('Checking if Basketball exists...');
    
    const allSports = await getAllSports();
    const basketballExists = allSports.some(s => s.id === 'basketball');
    
    if (!basketballExists) {
      log('Basketball not found, creating it...');
      
      await createSport({
        id: 'basketball',
        name: 'Basketball',
        icon: '🏀',
        color: '#FF5722',
        isDefault: true,
      }, userId);
      
      log('✅ Basketball created successfully');
    } else {
      log('✅ Basketball already exists');
    }
  } catch (error) {
    console.error('❌ Error ensuring Basketball exists:', error);
  }
};

export default {
  getActiveSports,
  getSport,
  getAllSportsWithFitness,
  createSport,
  modifySport,
  removeSport,
  getSportStats,
  getSportColor,
  getSportIcon,
  ensureBasketballExists,
};