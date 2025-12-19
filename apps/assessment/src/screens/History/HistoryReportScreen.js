// Location: /apps/assessment/src/screens/History/HistoryReportScreen.js
// Full report view for filtered history assessments with export

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { COLORS } from '../../utils/constants';
import { format, parseISO } from 'date-fns';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function HistoryReportScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  const { filteredAssessments = [], filters = {} } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [showNoDataModal, setShowNoDataModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  useEffect(() => {
    console.log('📊 HistoryReportScreen loaded with:', filteredAssessments.length, 'assessments');
  }, []);

  const formatOptions = [
    { value: 'csv', label: 'CSV Spreadsheet', icon: 'document-text' },
    { value: 'pdf', label: 'PDF Document', icon: 'document' },
    { value: 'excel', label: 'Excel Spreadsheet', icon: 'grid' },
  ];

  const handleExport = async () => {
    if (filteredAssessments.length === 0) {
      setShowNoDataModal(true);
      return;
    }

    try {
      setLoading(true);
      
      if (exportFormat === 'csv') {
        await exportToCSV();
      } else if (exportFormat === 'pdf') {
        setComingSoonFeature('PDF export');
        setShowComingSoonModal(true);
      } else if (exportFormat === 'excel') {
        setComingSoonFeature('Excel export');
        setShowComingSoonModal(true);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Export error:', error);
      setErrorMessage(error.message);
      setShowErrorModal(true);
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (filteredAssessments.length === 0) {
      setShowNoDataModal(true);
      return;
    }

    try {
      setLoading(true);
      await exportToCSV();
      setLoading(false);
    } catch (error) {
      console.error('Share error:', error);
      setErrorMessage(error.message);
      setShowErrorModal(true);
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    if (!filteredAssessments || filteredAssessments.length === 0) {
      throw new Error('No data available to export');
    }

    // Get all unique metrics from assessments
    const allMetrics = new Set();
    filteredAssessments.forEach(a => {
      if (a.results) {
        a.results.forEach(r => allMetrics.add(r.metric_id));
      }
    });
    const metricIds = Array.from(allMetrics);

    // Generate CSV content with metrics as columns
    const headers = [
      'Kid Name',
      'Sport', 
      'Date',
      'Year',
      'Term',
      'Age Group',
      ...metricIds.map(m => m.replace('_', ' ').toUpperCase()),
    ];

    const rows = filteredAssessments.map(a => {
      const metricValues = {};
      if (a.results) {
        a.results.forEach(r => {
          metricValues[r.metric_id] = r.value;
        });
      }

      return [
        a.kidName || 'Unknown',
        a.sportName || a.sport?.name || 'Unknown',
        format(parseISO(a.assessment_date), 'yyyy-MM-dd'),
        a.year || 'N/A',
        a.term || 'N/A',
        a.kidAgeGroup || a.age_group || 'N/A',
        ...metricIds.map(m => metricValues[m] || '—'),
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // Save to file
    const fileName = `assessment_report_${Date.now()}.csv`;
    const fileUri = FileSystem.documentDirectory + fileName;
    
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Share file
    console.log('📤 Sharing CSV file:', fileUri);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Assessment Report',
        UTI: 'public.comma-separated-values-text',
      });
      console.log('✅ CSV file shared successfully');
    } else {
      setSuccessMessage(`Report saved to ${fileUri}`);
      setShowSuccessModal(true);
    }
  };

  const handleCopyData = () => {
    setComingSoonFeature('Copy functionality');
    setShowComingSoonModal(true);
  };

  const getFilterSummary = () => {
    const parts = [];
    if (filters.year && filters.year !== 'all') parts.push(filters.year);
    if (filters.term && filters.term !== 'all') parts.push(filters.term);
    if (filters.sport && filters.sport !== 'all') parts.push(filters.sport);
    if (filters.ageGroup && filters.ageGroup !== 'all') parts.push(`${filters.ageGroup} years`);
    return parts.length > 0 ? parts.join(' • ') : 'All Assessments';
  };

  return (
    <View style={styles.container}>
      <Header
        title="Full Report"
        subtitle={`${filteredAssessments.length} assessments`}
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        showBackButton={true}
      />

      <View style={styles.contentWrapper}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Filter Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="filter" size={20} color={COLORS.primary} />
              <Text style={styles.summaryTitle}>Applied Filters</Text>
            </View>
            <Text style={styles.summaryText}>{getFilterSummary()}</Text>
          </View>

          {/* Export Format Selector */}
          <View style={styles.formatCard}>
            <Text style={styles.formatLabel}>Export Format:</Text>
            <View style={styles.formatOptions}>
              {formatOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.formatOption,
                    exportFormat === option.value && styles.formatOptionActive,
                  ]}
                  onPress={() => setExportFormat(option.value)}
                >
                  <Ionicons 
                    name={option.icon} 
                    size={20} 
                    color={exportFormat === option.value ? COLORS.white : COLORS.primary} 
                  />
                  <Text style={[
                    styles.formatOptionText,
                    exportFormat === option.value && styles.formatOptionTextActive,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Data Table Preview */}
          <View style={styles.tableCard}>
            <Text style={styles.tableTitle}>Data Preview</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                {/* Table Header */}
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.tableHeader, styles.nameColumn]}>Kid Name</Text>
                  <Text style={[styles.tableCell, styles.tableHeader, styles.sportColumn]}>Sport</Text>
                  <Text style={[styles.tableCell, styles.tableHeader, styles.dateColumn]}>Date</Text>
                  <Text style={[styles.tableCell, styles.tableHeader, styles.yearColumn]}>Year</Text>
                  <Text style={[styles.tableCell, styles.tableHeader, styles.termColumn]}>Term</Text>
                  <Text style={[styles.tableCell, styles.tableHeader, styles.metricsColumn]}>Metrics</Text>
                </View>

                {/* Table Rows */}
                {filteredAssessments.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="document-outline" size={48} color={COLORS.textSecondary} />
                    <Text style={styles.emptyText}>No assessments to display</Text>
                  </View>
                ) : (
                  filteredAssessments.slice(0, 20).map((assessment, index) => (
                    <View
                      key={assessment.id}
                      style={[
                        styles.tableRow,
                        index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                      ]}
                    >
                      <Text style={[styles.tableCell, styles.nameColumn]}>
                        {assessment.kidName}
                      </Text>
                      <Text style={[styles.tableCell, styles.sportColumn]}>
                        {assessment.sportName}
                      </Text>
                      <Text style={[styles.tableCell, styles.dateColumn]}>
                        {format(parseISO(assessment.assessment_date), 'MMM dd, yyyy')}
                      </Text>
                      <Text style={[styles.tableCell, styles.yearColumn]}>
                        {assessment.year || 'N/A'}
                      </Text>
                      <Text style={[styles.tableCell, styles.termColumn]}>
                        {assessment.term || 'N/A'}
                      </Text>
                      <Text style={[styles.tableCell, styles.metricsColumn]}>
                        {assessment.results?.length || 0}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>

            {filteredAssessments.length > 20 && (
              <View style={styles.previewNote}>
                <Ionicons name="information-circle" size={16} color="#FF9800" />
                <Text style={styles.previewNoteText}>
                  Showing first 20 of {filteredAssessments.length} records. Full data in export.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>

      {/* Floating Action Buttons */}
      {filteredAssessments.length > 0 && (
        <>
          <TouchableOpacity
            style={[styles.fab, styles.fabShare]}
            onPress={handleShare}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Ionicons name="share-outline" size={24} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fab, styles.fabDownload]}
            onPress={handleExport}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <LoadingSpinner size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="download" size={24} color={COLORS.white} />
                <View style={styles.fabBadge}>
                  <Text style={styles.fabBadgeText}>{filteredAssessments.length}</Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        </>
      )}

      {/* No Data Modal */}
      <Modal visible={showNoDataModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="alert-circle" size={48} color="#FF9800" />
            </View>
            <Text style={styles.modalTitle}>No Data</Text>
            <Text style={styles.modalMessage}>No assessments available to export</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonFull]}
              onPress={() => setShowNoDataModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Coming Soon Modal */}
      <Modal visible={showComingSoonModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="information-circle" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.modalTitle}>Coming Soon</Text>
            <Text style={styles.modalMessage}>{comingSoonFeature} will be available soon</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonFull]}
              onPress={() => setShowComingSoonModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal visible={showErrorModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="close-circle" size={48} color={COLORS.error} />
            </View>
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonFull]}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
            </View>
            <Text style={styles.modalTitle}>Success</Text>
            <Text style={styles.modalMessage}>{successMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonFull]}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentWrapper: {
    position: 'absolute',
    top: 116,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  summaryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  formatCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formatLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  formatOptions: {
    gap: 8,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    gap: 12,
  },
  formatOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  formatOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  formatOptionTextActive: {
    color: COLORS.white,
  },
  tableCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableRowEven: {
    backgroundColor: COLORS.white,
  },
  tableRowOdd: {
    backgroundColor: COLORS.backgroundDark,
  },
  tableCell: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 13,
    color: COLORS.text,
  },
  tableHeader: {
    fontWeight: 'bold',
    backgroundColor: COLORS.primary,
    color: COLORS.white,
  },
  nameColumn: { width: 150 },
  sportColumn: { width: 120 },
  dateColumn: { width: 120 },
  yearColumn: { width: 100 },
  termColumn: { width: 80 },
  metricsColumn: { width: 80 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  previewNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  previewNoteText: {
    fontSize: 13,
    color: '#F57C00',
    flex: 1,
  },
  bottomPadding: {
    height: 32,
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 1000,
  },
  fabShare: {
    bottom: 104,
    backgroundColor: '#4CAF50',
  },
  fabDownload: {
    bottom: 24,
    backgroundColor: '#2196F3',
  },
  fabBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF5252',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  fabBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  modalButtonFull: {
    width: '100%',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});