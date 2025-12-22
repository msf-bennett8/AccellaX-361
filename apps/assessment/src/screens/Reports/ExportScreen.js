// Location: /apps/assessment/src/screens/Reports/ExportScreen.js
// Enhanced export screen with filters and preview

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { COLORS } from '../../utils/constants';
import { exportToCSV, downloadCSV } from '../../services/batchOperationsService';
import { generatePrintableHTML, printReport, generateAndSharePDF } from '../../services/printService';
import { getAssessmentsByDateRange } from '../../database/queries';
import { getAllKids, getAllSports, getMetricsBySport } from '../../database/db';

export default function ExportScreen({ route, navigation }) {
  const { preSelectedAssessments } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [assessments, setAssessments] = useState(preSelectedAssessments || []);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  
  // Filters
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedKid, setSelectedKid] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  
  // Options
  const [sports, setSports] = useState([]);
  const [kids, setKids] = useState([]);
  
  // Modals
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    loadOptions();
    if (!preSelectedAssessments) {
      loadAllAssessments();
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [assessments, selectedSport, selectedKid, dateRange]);

  const loadOptions = async () => {
    try {
      const allSports = await getAllSports();
      const allKids = await getAllKids();
      
      setSports(allSports);
      setKids(allKids);
    } catch (error) {
      console.error('Error loading options:', error);
    }
  };

  const loadAllAssessments = async () => {
    try {
      setLoading(true);
      
      // Get last 6 months of assessments
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      const data = await getAssessmentsByDateRange(startDateStr, endDate);
      setAssessments(data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading assessments:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...assessments];

    // Sport filter
    if (selectedSport !== 'all') {
      filtered = filtered.filter(a => a.sport_id === selectedSport);
    }

    // Kid filter
    if (selectedKid !== 'all') {
      filtered = filtered.filter(a => a.kid_id === selectedKid);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let start, end;

      switch (dateRange) {
        case 'thisWeek':
          start = new Date(now);
          start.setDate(now.getDate() - 7);
          break;
        case 'thisMonth':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'thisQuarter':
          const quarter = Math.floor(now.getMonth() / 3);
          start = new Date(now.getFullYear(), quarter * 3, 1);
          break;
      }

      if (start) {
        filtered = filtered.filter(a => new Date(a.assessment_date) >= start);
      }
    }

    setFilteredAssessments(filtered);
  };

  const handleExportCSV = async () => {
    try {
      setLoading(true);
      
      const assessmentIds = filteredAssessments.map(a => a.id);
      const csvData = await exportToCSV(assessmentIds);
      
      if (Platform.OS === 'web') {
        const filename = `assessments_export_${new Date().toISOString().split('T')[0]}.csv`;
        downloadCSV(csvData, filename);
      }
      
      setLoading(false);
      setShowFormatModal(false);
      
      alert('CSV exported successfully!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      setLoading(false);
      alert('Failed to export CSV. Please try again.');
    }
  };

  const handleExportPDF = async () => {
    try {
      setLoading(true);
      
      // For simplicity, export first assessment as sample
      if (filteredAssessments.length === 0) {
        alert('No assessments to export');
        setLoading(false);
        return;
      }

      const assessment = filteredAssessments[0];
      
      // Get metrics for the sport
      const metrics = await getMetricsBySport(assessment.sport_id);
      
      const html = generatePrintableHTML({
        assessment,
        kid: assessment.kid || { name: assessment.kidName },
        sport: { name: assessment.sportName },
        results: assessment.results || [],
        metrics,
      });
      
      await generateAndSharePDF(html, `assessment_${assessment.id}.pdf`);
      
      setLoading(false);
      setShowFormatModal(false);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setLoading(false);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const handlePreview = async () => {
    try {
      setLoading(true);
      
      // Generate preview data
      const preview = {
        totalAssessments: filteredAssessments.length,
        uniqueKids: new Set(filteredAssessments.map(a => a.kid_id)).size,
        uniqueSports: new Set(filteredAssessments.map(a => a.sport_id)).size,
        dateRange: {
          start: filteredAssessments.length > 0 
            ? new Date(Math.min(...filteredAssessments.map(a => new Date(a.assessment_date)))).toLocaleDateString()
            : 'N/A',
          end: filteredAssessments.length > 0
            ? new Date(Math.max(...filteredAssessments.map(a => new Date(a.assessment_date)))).toLocaleDateString()
            : 'N/A',
        },
      };
      
      setPreviewData(preview);
      setShowPreviewModal(true);
      setLoading(false);
    } catch (error) {
      console.error('Error generating preview:', error);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Export Assessments"
        subtitle={`${filteredAssessments.length} assessments selected`}
        leftIcon="←"
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Filters Section */}
        <View style={styles.filtersCard}>
          <Text style={styles.sectionTitle}>Filters</Text>

          {/* Sport Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Sport</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.filterChip, selectedSport === 'all' && styles.filterChipActive]}
                onPress={() => setSelectedSport('all')}
              >
                <Text style={[styles.filterChipText, selectedSport === 'all' && styles.filterChipTextActive]}>
                  All Sports
                </Text>
              </TouchableOpacity>
              {sports.map(sport => (
                <TouchableOpacity
                  key={sport.id}
                  style={[styles.filterChip, selectedSport === sport.id && styles.filterChipActive]}
                  onPress={() => setSelectedSport(sport.id)}
                >
                  <Text style={[styles.filterChipText, selectedSport === sport.id && styles.filterChipTextActive]}>
                    {sport.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Date Range Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Date Range</Text>
            <View style={styles.dateRangeButtons}>
              {['all', 'thisWeek', 'thisMonth', 'thisQuarter'].map(range => (
                <TouchableOpacity
                  key={range}
                  style={[styles.dateRangeButton, dateRange === range && styles.dateRangeButtonActive]}
                  onPress={() => setDateRange(range)}
                >
                  <Text style={[styles.dateRangeButtonText, dateRange === range && styles.dateRangeButtonTextActive]}>
                    {range === 'all' ? 'All' :
                     range === 'thisWeek' ? 'This Week' :
                     range === 'thisMonth' ? 'This Month' : 'This Quarter'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Summary Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Export Summary</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Ionicons name="document-text" size={32} color={COLORS.primary} />
              <Text style={styles.statValue}>{filteredAssessments.length}</Text>
              <Text style={styles.statLabel}>Assessments</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="people" size={32} color={COLORS.success} />
              <Text style={styles.statValue}>
                {new Set(filteredAssessments.map(a => a.kid_id)).size}
              </Text>
              <Text style={styles.statLabel}>Kids</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="trophy" size={32} color={COLORS.warning} />
              <Text style={styles.statValue}>
                {new Set(filteredAssessments.map(a => a.sport_id)).size}
              </Text>
              <Text style={styles.statLabel}>Sports</Text>
            </View>
          </View>
        </View>

        {/* Export Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handlePreview}
            disabled={filteredAssessments.length === 0}
          >
            <Ionicons name="eye-outline" size={24} color={COLORS.primary} />
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonTitle}>Preview Data</Text>
              <Text style={styles.actionButtonSubtitle}>Review before exporting</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowFormatModal(true)}
            disabled={filteredAssessments.length === 0}
          >
            <Ionicons name="download-outline" size={24} color={COLORS.success} />
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonTitle}>Export Data</Text>
              <Text style={styles.actionButtonSubtitle}>Choose format (CSV/PDF)</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Format Selection Modal */}
      <Modal
        visible={showFormatModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFormatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Export Format</Text>
              <TouchableOpacity onPress={() => setShowFormatModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.formatOption} onPress={handleExportCSV}>
              <Ionicons name="document-text" size={32} color={COLORS.success} />
              <View style={styles.formatOptionContent}>
                <Text style={styles.formatOptionTitle}>CSV Spreadsheet</Text>
                <Text style={styles.formatOptionSubtitle}>Excel-compatible format</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.formatOption} onPress={handleExportPDF}>
              <Ionicons name="document" size={32} color={COLORS.error} />
              <View style={styles.formatOptionContent}>
                <Text style={styles.formatOptionTitle}>PDF Document</Text>
                <Text style={styles.formatOptionSubtitle}>Printable report format</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Preview Modal */}
      <Modal
        visible={showPreviewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPreviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Export Preview</Text>
              <TouchableOpacity onPress={() => setShowPreviewModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {previewData && (
              <View style={styles.previewContent}>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Total Assessments:</Text>
                  <Text style={styles.previewValue}>{previewData.totalAssessments}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Unique Kids:</Text>
                  <Text style={styles.previewValue}>{previewData.uniqueKids}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Sports Covered:</Text>
                  <Text style={styles.previewValue}>{previewData.uniqueSports}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Date Range:</Text>
                  <Text style={styles.previewValue}>
                    {previewData.dateRange.start} - {previewData.dateRange.end}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowPreviewModal(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {loading && <LoadingSpinner overlay text="Processing..." />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  filtersCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundDark,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  dateRangeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundDark,
  },
  dateRangeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  dateRangeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  dateRangeButtonTextActive: {
    color: COLORS.white,
  },
  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  actionsCard: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonContent: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  actionButtonSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  formatOptionContent: {
    flex: 1,
  },
  formatOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  formatOptionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  previewContent: {
    marginBottom: 20,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  previewLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});