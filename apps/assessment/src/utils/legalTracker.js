// Location: /apps/assessment/src/utils/legalTracker.js
// Legal Document Acceptance Tracker with Version Control

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Timestamp } from 'firebase/firestore';

// Current versions of legal documents
export const LEGAL_VERSIONS = {
  TERMS_OF_SERVICE: '1.0.0',
  PRIVACY_POLICY: '1.0.0',
};

// Legal acceptance events
export const LEGAL_EVENTS = {
  TERMS_OPENED: 'terms_opened',
  PRIVACY_OPENED: 'privacy_opened',
  TERMS_SCROLLED: 'terms_scrolled_to_bottom',
  PRIVACY_SCROLLED: 'privacy_scrolled_to_bottom',
  BOTH_ACCEPTED: 'both_documents_accepted',
};

/**
 * Track when a legal document is opened
 */
export const trackDocumentOpened = async (documentType) => {
  try {
    const timestamp = new Date().toISOString();
    const key = `legal_${documentType}_opened_at`;
    await AsyncStorage.setItem(key, timestamp);
    
    console.log(`✅ Tracked: ${documentType} opened at ${timestamp}`);
    return { success: true, timestamp };
  } catch (error) {
    console.error('Error tracking document opened:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Track when a legal document is scrolled to bottom
 */
export const trackDocumentScrolledToBottom = async (documentType) => {
  try {
    const timestamp = new Date().toISOString();
    const key = `legal_${documentType}_scrolled_at`;
    await AsyncStorage.setItem(key, timestamp);
    
    console.log(`✅ Tracked: ${documentType} scrolled to bottom at ${timestamp}`);
    return { success: true, timestamp };
  } catch (error) {
    console.error('Error tracking document scrolled:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Record legal acceptance (both documents)
 */
export const recordLegalAcceptance = async (userId, userEmail) => {
  try {
    const acceptanceData = {
      userId,
      userEmail,
      termsVersion: LEGAL_VERSIONS.TERMS_OF_SERVICE,
      privacyVersion: LEGAL_VERSIONS.PRIVACY_POLICY,
      acceptedAt: new Date().toISOString(),
      termsOpenedAt: await AsyncStorage.getItem('legal_terms_opened_at'),
      privacyOpenedAt: await AsyncStorage.getItem('legal_privacy_opened_at'),
      termsScrolledAt: await AsyncStorage.getItem('legal_terms_scrolled_at'),
      privacyScrolledAt: await AsyncStorage.getItem('legal_privacy_scrolled_at'),
    };
    
    // Save to AsyncStorage
    await AsyncStorage.setItem('legal_acceptance', JSON.stringify(acceptanceData));
    await AsyncStorage.setItem('legal_acceptance_version', LEGAL_VERSIONS.TERMS_OF_SERVICE);
    
    console.log('✅ Legal acceptance recorded:', acceptanceData);
    
    // Clear tracking data after acceptance
    await clearLegalTracking();
    
    return { success: true, data: acceptanceData };
  } catch (error) {
    console.error('Error recording legal acceptance:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Save legal acceptance to database
 */
export const saveLegalAcceptanceToDatabase = async (userId, acceptanceData) => {
  try {
    const { updateUser } = await import('../database/db');
    
    await updateUser(userId, {
      agreed_to_terms_version: acceptanceData.termsVersion,
      agreed_to_terms_at: acceptanceData.acceptedAt,
      agreed_to_privacy_version: acceptanceData.privacyVersion,
      agreed_to_privacy_at: acceptanceData.acceptedAt,
    });
    
    console.log('✅ Legal acceptance saved to database');
    return { success: true };
  } catch (error) {
    console.error('Error saving legal acceptance to database:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if user has accepted current versions
 */
export const hasAcceptedCurrentVersion = async () => {
  try {
    const acceptanceJson = await AsyncStorage.getItem('legal_acceptance');
    
    if (!acceptanceJson) {
      return false;
    }
    
    const acceptance = JSON.parse(acceptanceJson);
    
    const hasAcceptedTerms = acceptance.termsVersion === LEGAL_VERSIONS.TERMS_OF_SERVICE;
    const hasAcceptedPrivacy = acceptance.privacyVersion === LEGAL_VERSIONS.PRIVACY_POLICY;
    
    return hasAcceptedTerms && hasAcceptedPrivacy;
  } catch (error) {
    console.error('Error checking legal acceptance:', error);
    return false;
  }
};

/**
 * Get legal acceptance data
 */
export const getLegalAcceptance = async () => {
  try {
    const acceptanceJson = await AsyncStorage.getItem('legal_acceptance');
    
    if (!acceptanceJson) {
      return null;
    }
    
    return JSON.parse(acceptanceJson);
  } catch (error) {
    console.error('Error getting legal acceptance:', error);
    return null;
  }
};

/**
 * Check if both documents have been read (scrolled to bottom)
 */
export const haveBothDocumentsBeenRead = async () => {
  try {
    const termsScrolled = await AsyncStorage.getItem('legal_terms_scrolled_at');
    const privacyScrolled = await AsyncStorage.getItem('legal_privacy_scrolled_at');
    
    return termsScrolled !== null && privacyScrolled !== null;
  } catch (error) {
    console.error('Error checking if documents read:', error);
    return false;
  }
};

/**
 * Clear legal tracking data (after acceptance)
 */
export const clearLegalTracking = async () => {
  try {
    await AsyncStorage.multiRemove([
      'legal_terms_opened_at',
      'legal_privacy_opened_at',
      'legal_terms_scrolled_at',
      'legal_privacy_scrolled_at',
    ]);
    
    console.log('✅ Legal tracking data cleared');
  } catch (error) {
    console.error('Error clearing legal tracking:', error);
  }
};

/**
 * Force re-acceptance if versions changed
 */
export const checkForVersionUpdate = async () => {
  try {
    const acceptanceJson = await AsyncStorage.getItem('legal_acceptance');
    
    if (!acceptanceJson) {
      return { needsReAcceptance: true, reason: 'No prior acceptance' };
    }
    
    const acceptance = JSON.parse(acceptanceJson);
    
    const termsUpdated = acceptance.termsVersion !== LEGAL_VERSIONS.TERMS_OF_SERVICE;
    const privacyUpdated = acceptance.privacyVersion !== LEGAL_VERSIONS.PRIVACY_POLICY;
    
    if (termsUpdated || privacyUpdated) {
      return {
        needsReAcceptance: true,
        reason: 'Legal documents updated',
        updatedDocuments: {
          terms: termsUpdated,
          privacy: privacyUpdated,
        },
      };
    }
    
    return { needsReAcceptance: false };
  } catch (error) {
    console.error('Error checking version update:', error);
    return { needsReAcceptance: true, reason: 'Error checking versions' };
  }
};

/**
 * Export legal acceptance history (for debugging/auditing)
 */
export const exportLegalHistory = async () => {
  try {
    const acceptance = await getLegalAcceptance();
    
    const history = {
      currentVersions: LEGAL_VERSIONS,
      acceptance,
      exportedAt: new Date().toISOString(),
    };
    
    console.log('📄 Legal Acceptance History:', JSON.stringify(history, null, 2));
    
    return history;
  } catch (error) {
    console.error('Error exporting legal history:', error);
    return null;
  }
};

export default {
  LEGAL_VERSIONS,
  LEGAL_EVENTS,
  trackDocumentOpened,
  trackDocumentScrolledToBottom,
  recordLegalAcceptance,
  saveLegalAcceptanceToDatabase,
  hasAcceptedCurrentVersion,
  getLegalAcceptance,
  haveBothDocumentsBeenRead,
  clearLegalTracking,
  checkForVersionUpdate,
  exportLegalHistory,
};