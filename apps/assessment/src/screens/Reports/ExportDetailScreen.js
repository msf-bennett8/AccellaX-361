// Location: /apps/assessment/src/screens/Reports/ExportDetailScreen.js
// Export Detail Screen - Preview and export assessment data

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Header from '../../components/common/Header';
import { COLORS } from '../../utils/constants';
import { getAssessmentResults } from '../../database/db';

export default function ExportDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    filteredData = [],
    filters = {},
    format = 'csv',
    sports = [],
  } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [exportData, setExportData] = useState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    prepareExportData();
  }, []);

  const prepareExportData = async () => {
    setLoading(true);
    try {
      // Fetch detailed assessment data for each kid
      const detailedData = [];

      for (const kid of filteredData) {
        for (const assessment of kid.assessments) {
          // Get assessment results (metrics)
          const results = await getAssessmentResults(assessment.id);

          detailedData.push({
            kidId: kid.id,
            kidName: kid.name,
            age: kid.age,
            ageGroup: kid.age_group,
            gender: kid.gender || 'N/A',
            sponsorship: kid.sponsorshipType === 'SC' ? 'Scholarship' : 'Self-Sponsored',
            program: kid.programType === 'ELT' ? 'Elite' : 'Weekend Warrior',
            sport: sports.find(s => s.id === assessment.sport_id)?.name || 'Unknown',
            assessmentId: assessment.id,
            assessmentDate: assessment.assessment_date,
            term: assessment.term,
            year: assessment.year || 'N/A',
            assessmentType: assessment.assessment_type || 'N/A',
            weekNumber: assessment.week_number || 'N/A',
            location: assessment.location || 'N/A',
            assessorName: assessment.assessor_name || 'Coach',
            generalNotes: assessment.general_notes || '',
            results: results,
          });
        }
      }

      setExportData(detailedData);
    } catch (error) {
      console.error('Error preparing export data:', error);
      Alert.alert('Error', 'Failed to prepare export data');
    } finally {
      setLoading(false);
    }
  };

  const generateCSV = () => {
    // CSV Header
    let csv = 'Name,Age,Age Group,Gender,Sponsorship,Program,Sport,Assessment Date,Term,Year,Week,Location,Assessor,Metric,Value,Unit,Percentile,Notes\n';

    // CSV Rows
    exportData.forEach(record => {
      if (record.results.length === 0) {
        // Kid with no metrics
        csv += `"${record.kidName}",${record.age},"${record.ageGroup}","${record.gender}","${record.sponsorship}","${record.program}","${record.sport}","${record.assessmentDate}","${record.term}","${record.year}","${record.weekNumber}","${record.location}","${record.assessorName}","No metrics","N/A","N/A","N/A","${record.generalNotes}"\n`;
      } else {
        // Kid with metrics
        record.results.forEach(result => {
          csv += `"${record.kidName}",${record.age},"${record.ageGroup}","${record.gender}","${record.sponsorship}","${record.program}","${record.sport}","${record.assessmentDate}","${record.term}","${record.year}","${record.weekNumber}","${record.location}","${record.assessorName}","${result.metric_name || 'Unknown'}","${result.value}","${result.unit || 'N/A'}","${result.percentile || 'N/A'}","${result.notes || ''}"\n`;
        });
      }
    });

    return csv;
  };

  const generatePDFText = () => {
    // Simplified PDF text format (actual PDF would need proper library)
    let text = `AccellaX 361° - Assessment Export Report\n`;
    text += `${'='.repeat(60)}\n\n`;
    text += `Generated: ${new Date().toLocaleString()}\n`;
    text += `Format: ${format.toUpperCase()}\n`;
    text += `Total Records: ${exportData.length}\n\n`;

    if (filters.year && filters.year !== 'all') {
      text += `Year Filter: ${filters.year}\n`;
    }
    if (filters.term && filters.term !== 'all') {
      text += `Term Filter: ${filters.term}\n`;
    }
    if (filters.sport && filters.sport !== 'all') {
      text += `Sport Filter: ${filters.sport}\n`;
    }
    if (filters.ageGroup && filters.ageGroup !== 'all') {
      text += `Age Group Filter: ${filters.ageGroup}\n`;
    }

    text += `\n${'='.repeat(60)}\n\n`;

    exportData.forEach((record, index) => {
      text += `${index + 1}. ${record.kidName}\n`;
      text += `   Age: ${record.age} | Age Group: ${record.ageGroup}\n`;
      text += `   Sport: ${record.sport} | Term: ${record.term}\n`;
      text += `   Assessment Date: ${record.assessmentDate}\n`;
      text += `   Assessor: ${record.assessorName}\n`;

      if (record.results.length > 0) {
        text += `   Metrics:\n`;
        record.results.forEach(result => {
          text += `      - ${result.metric_name || 'Unknown'}: ${result.value} ${result.unit || ''}\n`;
        });
      } else {
        text += `   No metrics recorded\n`;
      }

      text += `\n`;
    });

    text += `${'='.repeat(60)}\n`;
    text += `End of Report\n`;

    return text;
  };

  const handleExport = async () => {
    if (exportData.length === 0) {
      Alert.alert('No Data', 'No data available to export');
      return;
    }

    setExporting(true);

    try {
      let content = '';
      let filename = '';
      let mimeType = '';

      if (format === 'csv') {
        content = generateCSV();
        filename = `assessment_export_${Date.now()}.csv`;
        mimeType = 'text/csv';
      } else if (format === 'pdf' || format === 'excel') {
        // For now, export as text (PDF/Excel would need proper libraries)
        content = generatePDFText();
        filename = `assessment_export_${Date.now()}.txt`;
        mimeType = 'text/plain';
      }

      if (Platform.OS === 'web') {
        // Web: Copy to clipboard
        await Clipboard.setStringAsync(content);
        Alert.alert('Success', 'Data copied to clipboard!');
      } else {
        // Mobile: Save and share file
        const fileUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, content, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Success', `File saved to: ${fileUri}`);
        }
      }

      // Navigate back after successful export
      setTimeout(() => {
        navigation.goBack();
      }, 1000);

    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    if (exportData.length === 0) {
      Alert.alert('No Data', 'No data available to share');
      return;
    }

    try {
      const content = format === 'csv' ? generateCSV() : generatePDFText();
      
      await Share.share({
        message: content,
        title: `Assessment Export - ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share data');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Export Preview"
          leftIcon="←"
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Preparing export...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Export Preview"
        subtitle={`${exportData.length} records • ${format.toUpperCase()}`}
        leftIcon="←"
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Export Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="information-circle" size={24} color={COLORS.primary} />
            <Text style={styles.summaryTitle}>Export Summary</Text>
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Records</Text>
              <Text style={styles.summaryValue}>{exportData.length}</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Format</Text>
              <Text style={styles.summaryValue}>{format.toUpperCase()}</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Kids</Text>
              <Text style={styles.summaryValue}>
                {new Set(exportData.map(r => r.kidId)).size}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Assessments</Text>
              <Text style={styles.summaryValue}>
                {new Set(exportData.map(r => r.assessmentId)).size}
              </Text>
            </View>
          </View>

          {/* Active Filters */}
          {Object.keys(filters).some(key => filters[key] !== 'all') && (
            <View style={styles.filtersSection}>
              <Text style={styles.filtersLabel}>Active Filters:</Text>
              <View style={styles.filterChips}>
                {filters.year && filters.year !== 'all' && (
                  <View style={styles.filterChip}>
                    <Text style={styles.filterChipText}>Year: {filters.year}</Text>
                  </View>
                )}
                {filters.term && filters.term !== 'all' && (
                  <View style={styles.filterChip}>
                    <Text style={styles.filterChipText}>Term: {filters.term}</Text>
                  </View>
                )}
                {filters.sport && filters.sport !== 'all' && (
                  <View style={styles.filterChip}>
                    <Text style={styles.filterChipText}>
                      Sport: {sports.find(s => s.id === filters.sport)?.name || filters.sport}
                    </Text>
                  </View>
                )}
                {filters.ageGroup && filters.ageGroup !== 'all' && (
                  <View style={styles.filterChip}>
                    <Text style={styles.filterChipText}>Age: {filters.ageGroup}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Data Preview */}
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Data Preview (First 5 Records)</Text>

          {exportData.slice(0, 5).map((record, index) => (
            <View key={index} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <Text style={styles.recordName}>{record.kidName}</Text>
                <View style={styles.recordBadge}>
                  <Text style={styles.recordBadgeText}>{record.sport}</Text>
                </View>
              </View>

              <View style={styles.recordDetails}>
                <Text style={styles.recordDetail}>
                  Age: {record.age} | {record.ageGroup}
                </Text>
                <Text style={styles.recordDetail}>
                  {record.term} • {record.assessmentDate}
                </Text>
                <Text style={styles.recordDetail}>
                  Assessor: {record.assessorName}
                </Text>
                {record.results.length > 0 && (
                  <Text style={styles.recordDetail}>
                    Metrics: {record.results.length}
                  </Text>
                )}
              </View>
            </View>
          ))}

          {exportData.length > 5 && (
            <Text style={styles.moreRecords}>
              + {exportData.length - 5} more records...
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            disabled={exporting}
          >
            <Ionicons name="share-outline" size={20} color={COLORS.primary} />
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
            onPress={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="download" size={20} color={COLORS.white} />
            )}
            <Text style={styles.exportButtonText}>
              {exporting ? 'Exporting...' : 'Export Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 20,
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
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    width: '48%',
    backgroundColor: COLORS.backgroundDark,
    padding: 12,
    borderRadius: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  filtersSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  filtersLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterChipText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  previewCard: {
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
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  recordCard: {
    backgroundColor: COLORS.backgroundDark,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  recordBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recordBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  recordDetails: {
    gap: 4,
  },
  recordDetail: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  moreRecords: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginVertical: 24,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  exportButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});