// Location: src/screens/Debug/SQLiteDiagnosticScreen.js
// Comprehensive SQLite Database Diagnostic Tool
// Features: Full database inspection, copy to clipboard, export functionality, schema analysis

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Share,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/common/Header';
import { COLORS } from '../../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import database functions
import { getDatabase } from '../../database/db';

const isWeb = Platform.OS === 'web';

export default function SQLiteDiagnosticScreen() {
  const navigation = useNavigation();
  const [results, setResults] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalKids: 0,
    totalAssessments: 0,
    truncatedIds: 0,
    validIds: 0,
    unsyncedKids: 0,
    unsyncedAssessments: 0,
  });

  useEffect(() => {
    loadQuickStats();
  }, []);

  const loadQuickStats = async () => {
    try {
      if (isWeb) {
        const webDB = JSON.parse(await AsyncStorage.getItem('assessmentWebDB') || '{}');
        
        const kids = webDB.kids || [];
        const assessments = webDB.assessments || [];
        
        const truncated = assessments.filter(a => !a.kid_id?.includes('_')).length;
        const valid = assessments.filter(a => a.kid_id?.includes('_')).length;
        const unsyncedKids = kids.filter(k => k.firebase_synced !== 1).length;
        const unsyncedAssessments = assessments.filter(a => a.firebase_synced !== 1).length;
        
        setStats({
          totalKids: kids.length,
          totalAssessments: assessments.length,
          truncatedIds: truncated,
          validIds: valid,
          unsyncedKids,
          unsyncedAssessments,
        });
      } else {
        const db = getDatabase();
        
        const kidsCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM kids');
        const assessmentsCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM assessments');
        const truncated = await db.getFirstAsync(
          `SELECT COUNT(*) as count FROM assessments WHERE kid_id NOT LIKE '%_%'`
        );
        const valid = await db.getFirstAsync(
          `SELECT COUNT(*) as count FROM assessments WHERE kid_id LIKE '%_%'`
        );
        const unsyncedKids = await db.getFirstAsync(
          'SELECT COUNT(*) as count FROM kids WHERE firebase_synced = 0'
        );
        const unsyncedAssessments = await db.getFirstAsync(
          'SELECT COUNT(*) as count FROM assessments WHERE firebase_synced = 0'
        );
        
        setStats({
          totalKids: kidsCount?.count || 0,
          totalAssessments: assessmentsCount?.count || 0,
          truncatedIds: truncated?.count || 0,
          validIds: valid?.count || 0,
          unsyncedKids: unsyncedKids?.count || 0,
          unsyncedAssessments: unsyncedAssessments?.count || 0,
        });
      }
    } catch (error) {
      console.error('Error loading quick stats:', error);
    }
  };

  const runFullDiagnostics = async () => {
    setLoading(true);
    let output = '';
    
    try {
      output += '╔══════════════════════════════════════════════════════════════════╗\n';
      output += '║        SQLITE DATABASE DIAGNOSTIC REPORT                        ║\n';
      output += '║        AccellaX 361° Assessment App                             ║\n';
      output += '╚══════════════════════════════════════════════════════════════════╝\n\n';
      
      output += `📅 Report Generated: ${new Date().toLocaleString()}\n`;
      output += `📱 Platform: ${Platform.OS}\n`;
      output += `🔧 Mode: ${isWeb ? 'Web (AsyncStorage)' : 'Mobile (SQLite)'}\n\n`;
      
      output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      output += '📊 QUICK STATISTICS\n';
      output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
      
      output += `👶 Total Kids:              ${stats.totalKids}\n`;
      output += `📝 Total Assessments:       ${stats.totalAssessments}\n`;
      output += `✅ Valid kid_ids:           ${stats.validIds}\n`;
      output += `❌ Truncated kid_ids:       ${stats.truncatedIds}\n`;
      output += `🔄 Unsynced Kids:           ${stats.unsyncedKids}\n`;
      output += `🔄 Unsynced Assessments:    ${stats.unsyncedAssessments}\n\n`;
      
      if (stats.truncatedIds > 0) {
        output += '⚠️  WARNING: TRUNCATED IDS DETECTED!\n';
        output += `   ${stats.truncatedIds} assessments have incomplete kid_id values.\n`;
        output += '   This will cause kid lookup failures.\n\n';
      }
      
      // Section 1: Kids Table Analysis
      output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      output += '👶 KIDS TABLE ANALYSIS (First 10)\n';
      output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
      
      const kids = await getKidsData(10);
      kids.forEach((kid, i) => {
        output += `${String(i + 1).padStart(2)}. ${kid.name.padEnd(25)}\n`;
        output += `    ID: ${kid.id}\n`;
        output += `    Length: ${kid.id?.length || 0} chars\n`;
        output += `    Format: ${kid.id?.includes('_') ? '✅ VALID (has suffix)' : '❌ INVALID (missing suffix)'}\n`;
        output += `    Age Group: ${kid.age_group || 'N/A'}\n`;
        output += `    Status: ${kid.status || 'active'}\n`;
        output += `    Synced: ${kid.firebase_synced === 1 ? '✅ Yes' : '❌ No'}\n\n`;
      });
      
      // Section 2: Assessments Table Analysis
      output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      output += '📝 ASSESSMENTS TABLE ANALYSIS (First 10)\n';
      output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
      
      const assessments = await getAssessmentsData(10);
      assessments.forEach((a, i) => {
        const kidIdValid = a.kid_id?.includes('_');
        output += `${String(i + 1).padStart(2)}. Assessment: ${a.id}\n`;
        output += `    kid_id: ${a.kid_id}\n`;
        output += `    Length: ${a.kid_id?.length || 0} chars\n`;
        output += `    Format: ${kidIdValid ? '✅ VALID' : '❌ TRUNCATED!'}\n`;
        output += `    Sport: ${a.sport_id || 'N/A'}\n`;
        output += `    Date: ${a.assessment_date || 'N/A'}\n`;
        output += `    Synced: ${a.firebase_synced === 1 ? '✅ Yes' : '❌ No'}\n\n`;
      });
      
      // Section 3: Truncated IDs Detail
      if (stats.truncatedIds > 0) {
        output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        output += '❌ TRUNCATED kid_ids (CRITICAL ISSUE)\n';
        output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        
        output += `Found ${stats.truncatedIds} assessments with truncated kid_ids\n\n`;
        
        const truncatedAssessments = await getTruncatedAssessments(10);
        truncatedAssessments.forEach((a, i) => {
          output += `${String(i + 1).padStart(2)}. Assessment: ${a.id}\n`;
          output += `    ❌ kid_id: ${a.kid_id} (TRUNCATED - missing suffix)\n`;
          output += `    Expected format: ${a.kid_id}_xxxxxxxxx\n`;
          output += `    Date: ${a.assessment_date}\n`;
          output += `    Sport: ${a.sport_id}\n\n`;
        });
        
        if (stats.truncatedIds > 10) {
          output += `... and ${stats.truncatedIds - 10} more\n\n`;
        }
      }
      
      // Section 4: Database Schema
      output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      output += '🏗️  DATABASE SCHEMA\n';
      output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
      
      const schema = await getTableSchemas();
      output += schema;
      
      // Section 5: Sync Status
      output += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      output += '🔄 FIREBASE SYNC STATUS\n';
      output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
      
      output += `Kids to Sync:        ${stats.unsyncedKids}\n`;
      output += `Assessments to Sync: ${stats.unsyncedAssessments}\n\n`;
      
      if (stats.unsyncedKids > 0 || stats.unsyncedAssessments > 0) {
        output += '⚠️  Pending sync operations detected.\n';
        output += '   Run manual sync from Settings to upload data to Firebase.\n\n';
      } else {
        output += '✅ All data is synced with Firebase.\n\n';
      }
      
      // Section 6: Recommendations
      output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      output += '💡 RECOMMENDATIONS\n';
      output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
      
      if (stats.truncatedIds > 0) {
        output += '🔴 CRITICAL: Fix truncated kid_ids immediately!\n';
        output += '   1. Identify where kid_ids are being truncated in your code\n';
        output += '   2. Check assessmentService.js saveAssessmentResult function\n';
        output += '   3. Check sync.js uploadAssessmentsToFirebase function\n';
        output += '   4. Ensure kid_id validation is in place\n\n';
      }
      
      if (stats.unsyncedKids > 0 || stats.unsyncedAssessments > 0) {
        output += '🟡 Unsynced data detected:\n';
        output += '   - Go to Settings → Sync Now to upload to Firebase\n\n';
      }
      
      if (stats.truncatedIds === 0 && stats.unsyncedKids === 0 && stats.unsyncedAssessments === 0) {
        output += '✅ Database is healthy! No critical issues detected.\n\n';
      }
      
      output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      output += 'END OF REPORT\n';
      output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      
    } catch (error) {
      output += `\n❌ ERROR DURING DIAGNOSTICS:\n`;
      output += `${error.message}\n\n`;
      output += `Stack trace:\n${error.stack}\n`;
    }
    
    setResults(output);
    setLoading(false);
  };

  const getKidsData = async (limit = 10) => {
    if (isWeb) {
      const webDB = JSON.parse(await AsyncStorage.getItem('assessmentWebDB') || '{}');
      return (webDB.kids || []).slice(0, limit);
    } else {
      const db = getDatabase();
      return await db.getAllAsync(`SELECT * FROM kids LIMIT ?`, [limit]);
    }
  };

  const getAssessmentsData = async (limit = 10) => {
    if (isWeb) {
      const webDB = JSON.parse(await AsyncStorage.getItem('assessmentWebDB') || '{}');
      return (webDB.assessments || []).slice(0, limit);
    } else {
      const db = getDatabase();
      return await db.getAllAsync(`SELECT * FROM assessments LIMIT ?`, [limit]);
    }
  };

  const getTruncatedAssessments = async (limit = 10) => {
    if (isWeb) {
      const webDB = JSON.parse(await AsyncStorage.getItem('assessmentWebDB') || '{}');
      return (webDB.assessments || [])
        .filter(a => !a.kid_id?.includes('_'))
        .slice(0, limit);
    } else {
      const db = getDatabase();
      return await db.getAllAsync(
        `SELECT * FROM assessments WHERE kid_id NOT LIKE '%_%' LIMIT ?`,
        [limit]
      );
    }
  };

  const getTableSchemas = async () => {
    let output = '';
    
    if (isWeb) {
      output += '📱 Web Mode: Using AsyncStorage\n';
      output += '   No SQL schema available for web storage.\n';
      output += '   Data stored as JSON in AsyncStorage.\n';
    } else {
      try {
        const db = getDatabase();
        
        // Kids table schema
        const kidsSchema = await db.getAllAsync(
          `SELECT sql FROM sqlite_master WHERE type='table' AND name='kids'`
        );
        if (kidsSchema.length > 0) {
          output += '🗂️  KIDS TABLE:\n';
          output += kidsSchema[0].sql + '\n\n';
        }
        
        // Assessments table schema
        const assessmentsSchema = await db.getAllAsync(
          `SELECT sql FROM sqlite_master WHERE type='table' AND name='assessments'`
        );
        if (assessmentsSchema.length > 0) {
          output += '🗂️  ASSESSMENTS TABLE:\n';
          output += assessmentsSchema[0].sql + '\n\n';
        }
        
        // Assessment results table schema
        const resultsSchema = await db.getAllAsync(
          `SELECT sql FROM sqlite_master WHERE type='table' AND name='assessment_results'`
        );
        if (resultsSchema.length > 0) {
          output += '🗂️  ASSESSMENT_RESULTS TABLE:\n';
          output += resultsSchema[0].sql + '\n\n';
        }
      } catch (error) {
        output += `❌ Error fetching schema: ${error.message}\n`;
      }
    }
    
    return output;
  };

  const copyToClipboard = async () => {
    if (!results) {
      if (Platform.OS === 'web') {
        alert('Please run diagnostics first.');
      } else {
        Alert.alert('No Results', 'Please run diagnostics first.');
      }
      return;
    }
    
    try {
      await Clipboard.setStringAsync(results);
      console.log('✅ Diagnostic report copied to clipboard');
    } catch (error) {
      console.error('Copy error:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('❌ Error', 'Failed to copy to clipboard.');
      }
    }
  };

  const exportToFile = async () => {
    if (!results) {
      Alert.alert('No Results', 'Please run diagnostics first.');
      return;
    }
    
    try {
      const fileName = `sqlite-diagnostic-${Date.now()}.txt`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, results, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      if (Platform.OS === 'web') {
        // Web: Trigger download
        const blob = new Blob([results], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        
        Alert.alert('✅ Downloaded!', `File saved as ${fileName}`);
      } else {
        // Mobile: Share file
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('✅ Saved!', `File saved to: ${fileUri}`);
        }
      }
    } catch (error) {
      Alert.alert('❌ Error', 'Failed to export file.');
      console.error('Export error:', error);
    }
  };

  const shareReport = async () => {
    if (!results) {
      Alert.alert('No Results', 'Please run diagnostics first.');
      return;
    }
    
    try {
      await Share.share({
        message: results,
        title: 'SQLite Diagnostic Report',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const clearResults = () => {
    setResults('');
  };

  const refreshStats = async () => {
    setLoading(true);
    await loadQuickStats();
    setLoading(false);
    console.log('✅ Statistics refreshed');
  };

  const renderStatCard = (icon, label, value, color = COLORS.primary) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      <View style={styles.statTextContainer}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        title="SQLite Diagnostic"
        onLeftPress={() => navigation.openDrawer()}
      />
      
      {/* Stats Overview */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          {renderStatCard('account-group', 'Total Kids', stats.totalKids, COLORS.primary)}
          {renderStatCard('clipboard-text', 'Assessments', stats.totalAssessments, COLORS.secondary)}
          {renderStatCard('check-circle', 'Valid IDs', stats.validIds, COLORS.success)}
          {renderStatCard('alert-circle', 'Truncated IDs', stats.truncatedIds, 
            stats.truncatedIds > 0 ? COLORS.error : COLORS.success)}
        </View>
        
        {stats.truncatedIds > 0 && (
          <View style={styles.warningBanner}>
            <MaterialCommunityIcons name="alert" size={24} color={COLORS.error} />
            <View style={styles.warningTextContainer}>
              <Text style={styles.warningTitle}>⚠️ Data Integrity Issue</Text>
              <Text style={styles.warningText}>
                {stats.truncatedIds} assessments have incomplete kid_id values. This will cause lookup failures.
              </Text>
            </View>
          </View>
        )}
        
        {/* Action Buttons */}
        <View style={styles.buttonGrid}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={runFullDiagnostics}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <MaterialCommunityIcons name="magnify" size={20} color={COLORS.white} />
                <Text style={styles.buttonText}>Run Full Diagnostics</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={refreshStats}
            disabled={loading}
          >
            <Ionicons name="refresh" size={20} color={COLORS.primary} />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Refresh Stats</Text>
          </TouchableOpacity>
        </View>
        
        {/* Results Display */}
        {results && (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>📊 Diagnostic Report</Text>
              <View style={styles.resultsActions}>
                <TouchableOpacity style={styles.iconButton} onPress={copyToClipboard}>
                  <Ionicons name="copy" size={20} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={exportToFile}>
                  <Ionicons name="download" size={20} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={shareReport}>
                  <Ionicons name="share-social" size={20} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={clearResults}>
                  <Ionicons name="close" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView 
              style={styles.resultsContainer}
              nestedScrollEnabled={true}
            >
              <Text style={styles.resultsText}>{results}</Text>
            </ScrollView>
          </>
        )}
        
        {!results && !loading && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="database-search" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyStateTitle}>No Diagnostics Run</Text>
            <Text style={styles.emptyStateText}>
              Tap "Run Full Diagnostics" to analyze your database
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  
  // Warning Banner
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.error + '15',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  warningTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  
  // Buttons
  buttonGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  secondaryButtonText: {
    color: COLORS.primary,
  },
  
  // Results
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 8,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  resultsActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    maxHeight: 600,
    elevation: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  resultsText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: COLORS.text,
    lineHeight: 16,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
