// Location: /apps/assessment/src/utils/legalTracker.js
// Legal Document Acceptance Tracker with Version Control + GitHub Sync

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Timestamp } from 'firebase/firestore';

// GitHub configuration for legal documents
const GITHUB_CONFIG = {
  owner: 'msf-bennett8',
  repo: 'AccellaX-361',
  branch: 'main',
  path: 'apps/assessment/legal-docs',
  baseUrl: 'https://raw.githubusercontent.com',
};

// Build GitHub URLs
const getGitHubUrl = (filename) => 
  `${GITHUB_CONFIG.baseUrl}/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${GITHUB_CONFIG.path}/${filename}`;

// GitHub file URLs
const GITHUB_URLS = {
  TERMS: getGitHubUrl('TERMS_OF_SERVICE.md'),
  PRIVACY: getGitHubUrl('PRIVACY_POLICY.md'),
  VERSION: getGitHubUrl('VERSION.txt'),
};

// Current versions of legal documents (fallback - will be synced from GitHub)
export const LEGAL_VERSIONS = {
  TERMS_OF_SERVICE: '1.0.1',
  PRIVACY_POLICY: '1.0.1',
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

/**
 * Fetch legal documents from GitHub
 */
export const fetchLegalDocumentsFromGitHub = async () => {
  try {
    console.log('📡 Fetching legal documents from GitHub...');
    
    // Fetch version file
    const versionResponse = await fetch(GITHUB_URLS.VERSION);
    if (!versionResponse.ok) {
      throw new Error('Failed to fetch version from GitHub');
    }
    const versionText = await versionResponse.text();
    const [termsVersion, privacyVersion] = versionText.trim().split('\n');
    
    // Fetch terms
    const termsResponse = await fetch(GITHUB_URLS.TERMS);
    if (!termsResponse.ok) {
      throw new Error('Failed to fetch terms from GitHub');
    }
    const termsText = await termsResponse.text();
    
    // Fetch privacy
    const privacyResponse = await fetch(GITHUB_URLS.PRIVACY);
    if (!privacyResponse.ok) {
      throw new Error('Failed to fetch privacy from GitHub');
    }
    const privacyText = await privacyResponse.text();
    
    // Cache in AsyncStorage
    await AsyncStorage.setItem('legal_terms_content', termsText);
    await AsyncStorage.setItem('legal_privacy_content', privacyText);
    await AsyncStorage.setItem('legal_terms_version_github', termsVersion);
    await AsyncStorage.setItem('legal_privacy_version_github', privacyVersion);
    await AsyncStorage.setItem('legal_last_sync', new Date().toISOString());
    
    console.log('✅ Legal documents synced from GitHub');
    console.log(`   Terms: v${termsVersion}`);
    console.log(`   Privacy: v${privacyVersion}`);
    
    return {
      success: true,
      versions: {
        terms: termsVersion,
        privacy: privacyVersion,
      },
      content: {
        terms: termsText,
        privacy: privacyText,
      },
    };
  } catch (error) {
    console.error('❌ Failed to fetch from GitHub:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get legal document content (GitHub cache or fallback to local)
 */
export const getLegalDocumentContent = async (type) => {
  try {
    // Try cached GitHub version first
    const key = type === 'terms' ? 'legal_terms_content' : 'legal_privacy_content';
    const cachedContent = await AsyncStorage.getItem(key);
    
    if (cachedContent) {
      console.log(`✅ Using cached ${type} from GitHub`);
      return cachedContent;
    }
    
    // Fallback to embedded local files
    console.log(`⚠️  No cached ${type}, using local fallback`);
    const localContent = type === 'terms'
      ? (await import('../constants/TERMS_OF_SERVICE')).TERMS_OF_SERVICE
      : (await import('../constants/PRIVACY_POLICY')).PRIVACY_POLICY;
    
    return localContent;
  } catch (error) {
    console.error(`Error getting ${type} content:`, error);
    return null;
  }
};

/**
 * Check if GitHub has newer versions
 */
export const checkGitHubForUpdates = async () => {
  try {
    const syncResult = await fetchLegalDocumentsFromGitHub();
    
    if (!syncResult.success) {
      return { hasUpdates: false, offline: true };
    }
    
    // Compare with current accepted versions
    const acceptance = await getLegalAcceptance();
    
    if (!acceptance) {
      return { hasUpdates: true, reason: 'No prior acceptance' };
    }
    
    const termsUpdated = acceptance.termsVersion !== syncResult.versions.terms;
    const privacyUpdated = acceptance.privacyVersion !== syncResult.versions.privacy;
    
    return {
      hasUpdates: termsUpdated || privacyUpdated,
      versions: syncResult.versions,
      updatedDocuments: {
        terms: termsUpdated,
        privacy: privacyUpdated,
      },
    };
  } catch (error) {
    console.error('Error checking GitHub for updates:', error);
    return { hasUpdates: false, error: error.message };
  }
};

export default {
  LEGAL_VERSIONS,
  LEGAL_EVENTS,
  GITHUB_URLS,
  fetchLegalDocumentsFromGitHub,
  getLegalDocumentContent,
  checkGitHubForUpdates,
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