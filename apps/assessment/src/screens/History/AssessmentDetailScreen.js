// Location: /apps/assessment/src/screens/History/AssessmentDetailScreen.js
// Comprehensive assessment detail view with table layout

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { COLORS } from '../../utils/constants';
import { getFullAssessmentData } from '../../database/queries';
import { format, parseISO } from 'date-fns';

export default function AssessmentDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { assessmentId, kidId, sportId } = route.params || {};

  // State
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groupedResults, setGroupedResults] = useState({});
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  useEffect(() => {
    loadAssessmentDetails();
  }, [assessmentId]);

  const loadAssessmentDetails = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading assessment details:', assessmentId);

      const data = await getFullAssessmentData(assessmentId);
      
      if (!data) {
        throw new Error('Assessment not found');
      }

      setAssessment(data);
      
      // Group results by category
      const grouped = {
        general_fitness: [],
        sport_specific: [],
        iq: [],
      };

      data.results?.forEach(result => {
        const category = result.metric?.category || result.category || 'general_fitness';
        if (grouped[category]) {
          grouped[category].push(result);
        }
      });

      // Sort by display order
      Object.keys(grouped).forEach(category => {
        grouped[category].sort((a, b) => 
          (a.metric?.display_order || 0) - (b.metric?.display_order || 0)
        );
      });

      setGroupedResults(grouped);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading assessment details:', error);
      setLoading(false);
    }
  };

  const formatValue = (result) => {
    const value = result.value;
    const unit = result.metric?.unit || result.unit || '';
    
    if (!value && value !== 0) return '—';
    
    // Format based on type
    if (result.metric?.type === 'rating' || result.type === 'rating') {
      return `${value}/10`;
    }
    
    if (result.metric?.type === 'timer' || result.type === 'timer') {
      return `${value}s`;
    }
    
    return `${value}${unit ? ' ' + unit : ''}`;
  };

  const getPerformanceColor = (percentile) => {
    if (!percentile) return COLORS.textSecondary;
    if (percentile >= 75) return COLORS.success;
    if (percentile >= 50) return '#2196F3';
    if (percentile >= 25) return COLORS.warning;
    return COLORS.error;
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'general_fitness': return 'fitness';
      case 'sport_specific': return 'football';
      case 'iq': return 'bulb';
      default: return 'clipboard';
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'general_fitness': return 'General Fitness';
      case 'sport_specific': return 'Sport-Specific Skills';
      case 'iq': return 'Sport IQ';
      default: return category;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Assessment Details"
          leftIcon="←"
          onLeftPress={() => navigation.goBack()}
        />
        <LoadingSpinner overlay text="Loading details..." color={COLORS.primary} />
      </View>
    );
  }

  if (!assessment) {
    return (
      <View style={styles.container}>
        <Header
          title="Assessment Details"
          leftIcon="←"
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>Assessment not found</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const totalMetrics = assessment.results?.length || 0;
  const hasGeneralFitness = groupedResults.general_fitness?.length > 0;
  const hasSportSpecific = groupedResults.sport_specific?.length > 0;
  const hasIQ = groupedResults.iq?.length > 0;

  return (
    <View style={styles.container}>
      <Header
        title="Assessment Details"
        subtitle={assessment.kid?.name || 'Unknown Kid'}
        leftIcon="←"
        onLeftPress={() => {
          // Clear any modals before going back
          setShowOptionsModal(false);
          setShowAlertModal(false);
          navigation.goBack();
        }}
        rightIcon="ellipsis-vertical"
        onRightPress={() => setShowOptionsModal(true)}
        showAvatar={true}
      />

      <View style={styles.contentWrapper}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Card */}
          <View style={styles.headerCard}>
            <View style={styles.headerRow}>
              <View style={styles.headerInfo}>
                <Text style={styles.kidName}>{assessment.kid?.name || 'Unknown'}</Text>
                <Text style={styles.kidMeta}>
                  Age {assessment.kid?.age || 'N/A'} • {assessment.kid?.age_group || 'N/A'} • {assessment.kid?.gender || 'N/A'}
                </Text>
              </View>
              <View style={[styles.sportBadge, { backgroundColor: assessment.sport?.color || COLORS.primary }]}>
                <MaterialCommunityIcons name="trophy" size={24} color={COLORS.white} />
              </View>
            </View>

            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar" size={14} color={COLORS.primary} />
                <Text style={styles.metaLabel}>Date</Text>
                <Text style={styles.metaValue}>
                  {assessment.assessment_date 
                    ? format(parseISO(assessment.assessment_date), 'MMM dd, yyyy')
                    : 'N/A'}
                </Text>
              </View>

              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="trophy" size={14} color={COLORS.primary} />
                <Text style={styles.metaLabel}>Sport</Text>
                <Text style={styles.metaValue}>{assessment.sport?.name || 'N/A'}</Text>
              </View>

              <View style={styles.metaItem}>
                <Ionicons name="clipboard" size={14} color={COLORS.primary} />
                <Text style={styles.metaLabel}>Metrics</Text>
                <Text style={styles.metaValue}>{totalMetrics}</Text>
              </View>

              {assessment.year && (
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.metaLabel}>Year</Text>
                  <Text style={styles.metaValue}>{assessment.year}</Text>
                </View>
              )}

              {assessment.term && (
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons name="calendar-range" size={14} color={COLORS.primary} />
                  <Text style={styles.metaLabel}>Term</Text>
                  <Text style={styles.metaValue}>{assessment.term}</Text>
                </View>
              )}

              {assessment.assessment_type && (
                <View style={styles.metaItem}>
                  <Ionicons name="ribbon" size={14} color={COLORS.primary} />
                  <Text style={styles.metaLabel}>Type</Text>
                  <Text style={styles.metaValue}>
                    {assessment.assessment_type === 'baseline' ? 'Baseline' :
                     assessment.assessment_type === 'mid_term' ? 'Mid-Term' :
                     assessment.assessment_type === 'final' ? 'Final' : 'Ad-hoc'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* General Fitness Table */}
          {hasGeneralFitness && (
            <View style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Ionicons name={getCategoryIcon('general_fitness')} size={20} color={COLORS.primary} />
                <Text style={styles.categoryTitle}>{getCategoryLabel('general_fitness')}</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{groupedResults.general_fitness.length}</Text>
                </View>
              </View>

              <View style={styles.table}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, styles.metricNameHeader]}>Metric</Text>
                  <Text style={[styles.tableHeaderCell, styles.valueHeader]}>Value</Text>
                  <Text style={[styles.tableHeaderCell, styles.percentileHeader]}>Rank</Text>
                </View>

                {/* Table Rows */}
                {groupedResults.general_fitness.map((result, index) => (
                  <View 
                    key={result.id || index} 
                    style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
                  >
                    <Text style={[styles.tableCell, styles.metricNameCell]}>
                      {result.metric?.name || result.metric_name || 'Unknown Metric'}
                    </Text>
                    <Text style={[styles.tableCell, styles.valueCell]}>
                      {formatValue(result)}
                    </Text>
                    <View style={[styles.tableCell, styles.percentileCell]}>
                      {result.percentile ? (
                        <View style={[styles.percentileBadge, { backgroundColor: getPerformanceColor(result.percentile) + '20' }]}>
                          <Text style={[styles.percentileText, { color: getPerformanceColor(result.percentile) }]}>
                            {result.percentile}%
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.naText}>—</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Sport-Specific Skills Table */}
          {hasSportSpecific && (
            <View style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Ionicons name={getCategoryIcon('sport_specific')} size={20} color={COLORS.primary} />
                <Text style={styles.categoryTitle}>{getCategoryLabel('sport_specific')}</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{groupedResults.sport_specific.length}</Text>
                </View>
              </View>

              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, styles.metricNameHeader]}>Skill</Text>
                  <Text style={[styles.tableHeaderCell, styles.valueHeader]}>Rating</Text>
                  <Text style={[styles.tableHeaderCell, styles.percentileHeader]}>Rank</Text>
                </View>

                {groupedResults.sport_specific.map((result, index) => (
                  <View 
                    key={result.id || index} 
                    style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
                  >
                    <Text style={[styles.tableCell, styles.metricNameCell]}>
                      {result.metric?.name || result.metric_name || 'Unknown Skill'}
                    </Text>
                    <Text style={[styles.tableCell, styles.valueCell]}>
                      {formatValue(result)}
                    </Text>
                    <View style={[styles.tableCell, styles.percentileCell]}>
                      {result.percentile ? (
                        <View style={[styles.percentileBadge, { backgroundColor: getPerformanceColor(result.percentile) + '20' }]}>
                          <Text style={[styles.percentileText, { color: getPerformanceColor(result.percentile) }]}>
                            {result.percentile}%
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.naText}>—</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Sport IQ Table */}
          {hasIQ && (
            <View style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Ionicons name={getCategoryIcon('iq')} size={20} color={COLORS.primary} />
                <Text style={styles.categoryTitle}>{getCategoryLabel('iq')}</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{groupedResults.iq.length}</Text>
                </View>
              </View>

              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, styles.metricNameHeader]}>Assessment</Text>
                  <Text style={[styles.tableHeaderCell, styles.valueHeader]}>Rating</Text>
                  <Text style={[styles.tableHeaderCell, styles.percentileHeader]}>Rank</Text>
                </View>

                {groupedResults.iq.map((result, index) => (
                  <View 
                    key={result.id || index} 
                    style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
                  >
                    <Text style={[styles.tableCell, styles.metricNameCell]}>
                      {result.metric?.name || result.metric_name || 'Sport IQ'}
                    </Text>
                    <Text style={[styles.tableCell, styles.valueCell]}>
                      {formatValue(result)}
                    </Text>
                    <View style={[styles.tableCell, styles.percentileCell]}>
                      {result.percentile ? (
                        <View style={[styles.percentileBadge, { backgroundColor: getPerformanceColor(result.percentile) + '20' }]}>
                          <Text style={[styles.percentileText, { color: getPerformanceColor(result.percentile) }]}>
                            {result.percentile}%
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.naText}>—</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Notes Section */}
          {assessment.notes && (
            <View style={styles.notesSection}>
              <View style={styles.notesHeader}>
                <Ionicons name="document-text" size={20} color={COLORS.primary} />
                <Text style={styles.notesTitle}>Notes</Text>
              </View>
              <Text style={styles.notesText}>{assessment.notes}</Text>
            </View>
          )}

          {/* Empty State */}
          {totalMetrics === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="clipboard-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>No metrics recorded</Text>
              <Text style={styles.emptySubtext}>This assessment has no data</Text>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>

      {/* Action Button */}
      {assessment.kid?.id && assessment.sport?.id && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('KidProgress', {
            kidId: assessment.kid.id,
            sportId: assessment.sport.id,
          })}
        >
          <Ionicons name="stats-chart" size={24} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={styles.optionsModal}>
            <View style={styles.optionsHeader}>
              <Text style={styles.optionsTitle}>Options</Text>
              <TouchableOpacity onPress={() => setShowOptionsModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setShowOptionsModal(false);
                setAlertConfig({ 
                  title: 'Share Assessment', 
                  message: 'Share feature coming soon!' 
                });
                setShowAlertModal(true);
              }}
            >
              <Ionicons name="share-social-outline" size={24} color={COLORS.primary} />
              <Text style={styles.optionText}>Share Assessment</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setShowOptionsModal(false);
                setAlertConfig({ 
                  title: 'Export PDF', 
                  message: 'Export feature coming soon!' 
                });
                setShowAlertModal(true);
              }}
            >
              <Ionicons name="download-outline" size={24} color={COLORS.primary} />
              <Text style={styles.optionText}>Export as PDF</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setShowOptionsModal(false);
                setAlertConfig({ 
                  title: 'Print Report', 
                  message: 'Print feature coming soon!' 
                });
                setShowAlertModal(true);
              }}
            >
              <Ionicons name="print-outline" size={24} color={COLORS.primary} />
              <Text style={styles.optionText}>Print Report</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <View style={styles.optionsDivider} />

            <TouchableOpacity
              style={[styles.optionItem, styles.optionItemDanger]}
              onPress={() => {
                setShowOptionsModal(false);
                setAlertConfig({ 
                  title: 'Delete Assessment', 
                  message: 'Delete feature coming soon!' 
                });
                setShowAlertModal(true);
              }}
            >
              <Ionicons name="trash-outline" size={24} color={COLORS.error} />
              <Text style={[styles.optionText, styles.optionTextDanger]}>Delete Assessment</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Alert Modal */}
      <Modal visible={showAlertModal} transparent animationType="fade">
        <View style={styles.alertModalOverlay}>
          <View style={styles.alertModalContent}>
            <View style={styles.alertModalHeader}>
              <Ionicons name="information-circle" size={48} color="#2196F3" />
            </View>
            <Text style={styles.alertModalTitle}>{alertConfig.title}</Text>
            <Text style={styles.alertModalMessage}>{alertConfig.message}</Text>
            <TouchableOpacity
              style={styles.alertModalButton}
              onPress={() => setShowAlertModal(false)}
            >
              <Text style={styles.alertModalButtonText}>OK</Text>
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
    flex: 1,
    marginTop: 0,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Header Card
  headerCard: {
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerInfo: {
    flex: 1,
  },
  kidName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  kidMeta: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  sportBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaItem: {
    width: '31%',
    backgroundColor: COLORS.backgroundDark,
    padding: 8,
    borderRadius: 8,
    gap: 3,
  },
  metaLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Category Section
  categorySection: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.primaryLight + '40',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    gap: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },

  // Table Styles
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  metricNameHeader: {
    flex: 2,
    textAlign: 'left',
  },
  valueHeader: {
    flex: 1,
  },
  percentileHeader: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableRowAlt: {
    backgroundColor: COLORS.backgroundDark,
  },
  tableCell: {
    fontSize: 14,
    color: COLORS.text,
    justifyContent: 'center',
  },
  metricNameCell: {
    flex: 2,
    fontWeight: '500',
  },
  valueCell: {
    flex: 1,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },
  percentileCell: {
    flex: 1,
    alignItems: 'center',
  },
  percentileBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentileText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  naText: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },

  // Notes Section
  notesSection: {
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
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  notesText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },

  // Empty State
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
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  bottomPadding: {
    height: 20,
  },

  // Options Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  optionsModal: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  optionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  optionItemDanger: {
    borderBottomWidth: 0,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  optionTextDanger: {
    color: COLORS.error,
  },
  optionsDivider: {
    height: 8,
    backgroundColor: COLORS.background,
  },

  // Alert Modal Styles
  alertModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 350,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  alertModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  alertModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  alertModalMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  alertModalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    width: '100%',
  },
  alertModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});