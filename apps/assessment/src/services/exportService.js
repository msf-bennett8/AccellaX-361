// Location: /apps/assessment/src/services/exportService.js
// Export assessment data to CSV, PDF, Excel formats

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * Export assessments to CSV format
 * @param {Array} assessments - Array of assessment objects with kid and metric data
 * @param {Array} metrics - Array of metric definitions
 * @param {Object} filters - Applied filters (year, term, sport, ageGroup)
 * @returns {Promise<string>} File path or sharing result
 */
export const exportToCSV = async (assessments, metrics, filters = {}) => {
  try {
    console.log('📤 Exporting to CSV:', assessments.length, 'assessments');

    // Build CSV header
    const headers = [
      'Kid Name',
      'Age',
      'Age Group',
      'Assessment Date',
      'Year',
      'Term',
      'Sport',
      ...metrics.map(m => `${m.name} (${m.unit || ''})`),
    ];

    // Build CSV rows
    const rows = assessments.map(assessment => {
      const row = [
        assessment.kidName || assessment.kid?.name || 'Unknown',
        assessment.kidAge || assessment.kid?.age || 'N/A',
        assessment.kidAgeGroup || assessment.kid?.age_group || 'N/A',
        assessment.assessment_date || 'N/A',
        assessment.year || 'N/A',
        assessment.term || 'N/A',
        assessment.sportName || assessment.sport?.name || 'N/A',
      ];

      // Add metric values
      metrics.forEach(metric => {
        const result = assessment.results?.find(r => r.metric_id === metric.id);
        row.push(result?.value || '—');
      });

      return row;
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filterText = filters.sport !== 'all' ? `_${filters.sport}` : '';
    const filename = `assessment_export_${timestamp}${filterText}.csv`;

    if (Platform.OS === 'web') {
      // Web: Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      console.log('✅ CSV downloaded:', filename);
      return 'downloaded';
    } else {
      // Mobile: Save and share file
      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
        console.log('✅ CSV shared:', filename);
        return fileUri;
      } else {
        console.log('✅ CSV saved:', fileUri);
        return fileUri;
      }
    }
  } catch (error) {
    console.error('❌ Error exporting CSV:', error);
    throw error;
  }
};

/**
 * Export assessments to Excel format (XLSX)
 * @param {Array} assessments - Array of assessment objects
 * @param {Array} metrics - Array of metric definitions
 * @param {Object} filters - Applied filters
 * @returns {Promise<string>} File path or sharing result
 */
export const exportToExcel = async (assessments, metrics, filters = {}) => {
  try {
    console.log('📤 Exporting to Excel:', assessments.length, 'assessments');

    // For now, use CSV format with .xlsx extension
    // TODO: Implement proper XLSX format using a library like 'xlsx'
    const csvContent = await exportToCSV(assessments, metrics, filters);
    
    console.log('✅ Excel export completed (CSV format)');
    return csvContent;
  } catch (error) {
    console.error('❌ Error exporting Excel:', error);
    throw error;
  }
};

/**
 * Export assessments to PDF format
 * @param {Array} assessments - Array of assessment objects
 * @param {Array} metrics - Array of metric definitions
 * @param {Object} filters - Applied filters
 * @returns {Promise<string>} File path or sharing result
 */
export const exportToPDF = async (assessments, metrics, filters = {}) => {
  try {
    console.log('📤 Exporting to PDF:', assessments.length, 'assessments');

    // TODO: Implement PDF generation using a library like 'react-native-html-to-pdf'
    // For now, alert that PDF export is coming soon
    throw new Error('PDF export is not yet implemented. Please use CSV or Excel format.');
  } catch (error) {
    console.error('❌ Error exporting PDF:', error);
    throw error;
  }
};

/**
 * Export data based on selected format
 * @param {String} format - 'csv', 'excel', or 'pdf'
 * @param {Array} assessments - Array of assessment objects
 * @param {Array} metrics - Array of metric definitions
 * @param {Object} filters - Applied filters
 * @returns {Promise<string>} Export result
 */
export const exportData = async (format, assessments, metrics, filters = {}) => {
  switch (format) {
    case 'csv':
      return await exportToCSV(assessments, metrics, filters);
    case 'excel':
      return await exportToExcel(assessments, metrics, filters);
    case 'pdf':
      return await exportToPDF(assessments, metrics, filters);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};

/**
 * Generate summary statistics for export
 * @param {Array} assessments - Array of assessment objects
 * @returns {Object} Summary statistics
 */
export const generateSummaryStats = (assessments) => {
  const uniqueKids = new Set(assessments.map(a => a.kid_id || a.kidId)).size;
  const uniqueSports = new Set(assessments.map(a => a.sport_id || a.sportId)).size;
  const totalMetrics = assessments.reduce((sum, a) => sum + (a.results?.length || 0), 0);
  const avgMetricsPerAssessment = assessments.length > 0 ? Math.round(totalMetrics / assessments.length) : 0;

  // Date range
  const dates = assessments.map(a => new Date(a.assessment_date)).sort((a, b) => a - b);
  const firstDate = dates[0] ? dates[0].toISOString().split('T')[0] : 'N/A';
  const lastDate = dates[dates.length - 1] ? dates[dates.length - 1].toISOString().split('T')[0] : 'N/A';

  return {
    totalAssessments: assessments.length,
    uniqueKids,
    uniqueSports,
    totalMetrics,
    avgMetricsPerAssessment,
    dateRange: {
      start: firstDate,
      end: lastDate,
    },
  };
};

/**
 * Export kid progress to CSV
 * @param {string} kidId - Kid ID
 * @param {Array} assessments - Kid's assessments
 * @returns {string} CSV string
 */
export const exportKidProgressToCSV = async (kidId, assessments) => {
  if (!assessments || assessments.length === 0) {
    throw new Error('No assessments found for this kid');
  }

  const headers = ['Assessment Date', 'Sport', 'Metric', 'Value', 'Percentile'];
  let csv = headers.join(',') + '\n';

  assessments.forEach(assessment => {
    assessment.results?.forEach(result => {
      const row = [
        assessment.assessment_date,
        assessment.sportName || 'Unknown',
        result.metric_name || result.metric_id,
        result.value,
        result.percentile || 'N/A',
      ];
      csv += row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',') + '\n';
    });
  });

  return csv;
};

/**
 * Export metric comparison to CSV
 * @param {string} metricId - Metric ID
 * @param {Array} assessments - Assessments to compare
 * @returns {string} CSV string
 */
export const exportMetricComparisonToCSV = async (metricId, assessments) => {
  if (!assessments || assessments.length === 0) {
    throw new Error('No assessments found');
  }

  const headers = ['Kid Name', 'Age Group', 'Assessment Date', 'Value', 'Percentile'];
  let csv = headers.join(',') + '\n';

  assessments.forEach(assessment => {
    const result = assessment.results?.find(r => r.metric_id === metricId);
    if (result) {
      const row = [
        assessment.kidName || 'Unknown',
        assessment.kidAgeGroup || 'N/A',
        assessment.assessment_date,
        result.value,
        result.percentile || 'N/A',
      ];
      csv += row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',') + '\n';
    }
  });

  return csv;
};

export default {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  exportData,
  generateSummaryStats,
  exportKidProgressToCSV,
  exportMetricComparisonToCSV,
};