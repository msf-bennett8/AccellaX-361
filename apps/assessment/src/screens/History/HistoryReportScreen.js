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
          {/* Filter summary removed - clean data view */}

          {/* Assessment Data Table */}
          <View style={styles.tableContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Assessment Records</Text>
              <Text style={styles.sectionCount}>{filteredAssessments.length}</Text>
            </View>

            {filteredAssessments.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={64} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>No assessments found</Text>
                <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={styles.table}>
                  {/* Table Header - Dynamic based on metrics */}
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.tableHeaderCell, styles.nameColumn]}>Kid Name</Text>
                    <Text style={[styles.tableHeaderCell, styles.dateColumn]}>Date</Text>
                    <Text style={[styles.tableHeaderCell, styles.yearColumn]}>Year</Text>
                    <Text style={[styles.tableHeaderCell, styles.termColumn]}>Term</Text>
                    <Text style={[styles.tableHeaderCell, styles.ageColumn]}>Age</Text>
                    
                    {/* Dynamic Metric Columns with Units */}
                    {(() => {
                      // Get all unique metric IDs from assessments
                      const metricMap = new Map();
                      filteredAssessments.forEach(a => {
                        if (a.results) {
                          a.results.forEach(r => {
                            if (!metricMap.has(r.metric_id)) {
                              metricMap.set(r.metric_id, {
                                id: r.metric_id,
                                name: r.metric_name || r.metric_id.replace(/_/g, ' '),
                                type: r.metric?.type || r.type,
                                unit: r.metric?.unit || r.unit,
                              });
                            }
                          });
                        }
                      });
                      
                      const metrics = Array.from(metricMap.values());
                      
                      return metrics.map(metric => (
                        <View key={metric.id} style={[styles.tableHeaderCell, styles.metricColumn]}>
                          <Text style={styles.tableHeaderText} numberOfLines={2}>
                            {metric.name.toUpperCase()}
                          </Text>
                          {(metric.unit || metric.type) && (
                            <Text style={styles.headerSubtext}>
                              {metric.type === 'rating' ? '/10' : 
                               metric.type === 'timed' ? 'sec' :
                               metric.type === 'counted' ? 'reps' :
                               metric.unit || ''}
                            </Text>
                          )}
                        </View>
                      ));
                    })()}
                  </View>

                  {/* Table Rows - Dynamic metric values */}
                  {filteredAssessments.map((assessment, index) => {
                    // Get all unique metric IDs from all assessments
                    const metricMap = new Map();
                    filteredAssessments.forEach(a => {
                      if (a.results) {
                        a.results.forEach(r => {
                          if (!metricMap.has(r.metric_id)) {
                            metricMap.set(r.metric_id, {
                              id: r.metric_id,
                              type: r.metric?.type || r.type,
                            });
                          }
                        });
                      }
                    });
                    const metrics = Array.from(metricMap.values());
                    
                    // Build metric values map for this assessment
                    const metricValues = {};
                    if (assessment.results) {
                      assessment.results.forEach(r => {
                        metricValues[r.metric_id] = r.value;
                      });
                    }
                    
                    return (
                      <TouchableOpacity
                        key={assessment.id}
                        style={[
                          styles.tableRow,
                          index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                        ]}
                        onPress={() => {
                          navigation.navigate('History', {
                            screen: 'AssessmentDetail',
                            params: { 
                              assessmentId: assessment.id,
                              kidId: assessment.kid_id, 
                              sportId: assessment.sport_id 
                            }
                          });
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.tableCell, styles.nameColumn]}>{assessment.kidName || 'Unknown'}</Text>
                        <Text style={[styles.tableCell, styles.dateColumn]}>
                          {format(parseISO(assessment.assessment_date), 'MMM dd, yyyy')}
                        </Text>
                        <Text style={[styles.tableCell, styles.yearColumn]}>{assessment.year || 'N/A'}</Text>
                        <Text style={[styles.tableCell, styles.termColumn]}>{assessment.term || 'N/A'}</Text>
                        <Text style={[styles.tableCell, styles.ageColumn]}>
                          {assessment.kidAgeGroup || assessment.age_group || 'N/A'}
                        </Text>
                        
                        {/* Dynamic Metric Value Columns */}
                        {metrics.map(metric => (
                          <Text key={metric.id} style={[styles.tableCell, styles.metricColumn]}>
                            {(() => {
                              const value = metricValues[metric.id];
                              if (!value) return '—';
                              
                              // Format based on metric type
                              switch (metric.type) {
                                case 'rating':
                                  return `${value}/10`;
                                case 'timed':
                                  return `${parseFloat(value).toFixed(2)}s`;
                                case 'counted':
                                  return `${value} reps`;
                                default:
                                  return value;
                              }
                            })()}
                          </Text>
                        ))}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>

      {/* Feedback FAB */}
      <TouchableOpacity
        style={styles.feedbackFab}
        onPress={() => setShowComingSoonModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>

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

      {/* Feedback Modal */}
      <Modal visible={showComingSoonModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
            </View>
            <Text style={styles.modalTitle}>Satisfied?</Text>
            <Text style={styles.modalMessage}>
              Contact support if you need additional features.{'\n\n'}
              You can download or view full history on the History screen.
            </Text>
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
  // Summary card styles removed - clean view
  // Format selector styles removed
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  bottomPadding: {
    height: 32,
  },
  feedbackFab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 1000,
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
  
  // Table Styles
  tableContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sectionCount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  table: {
    width: '100%',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  tableHeaderText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 13,
  },
  headerSubtext: {
    fontSize: 10,
    color: '#E3F2FD',
    marginTop: 2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableRowEven: {
    backgroundColor: COLORS.white,
  },
  tableRowOdd: {
    backgroundColor: '#F5F5F5',
  },
  tableCell: {
    fontSize: 13,
    color: COLORS.text,
    textAlign: 'center',
  },
  nameColumn: {
    width: 150,
    textAlign: 'left',
  },
  dateColumn: {
    width: 110,
  },
  yearColumn: {
    width: 90,
  },
  termColumn: {
    width: 70,
  },
  ageColumn: {
    width: 60,
  },
  metricColumn: {
    width: 100,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});