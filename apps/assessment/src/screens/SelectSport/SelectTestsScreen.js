// Location: /apps/assessment/src/screens/SelectSport/SelectTestsScreen.js
// FIXED: Handle both test-by-test and kid-by-kid modes

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { COLORS } from '../../utils/constants';
import { getMetricsBySport } from '../../config/metrics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getTemplates, 
  createTemplate, 
  deleteTemplate 
} from '../../services/templateService';

export default function SelectTestsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  const { sport, assessmentMode, selectedKids = [], kidCount, assessmentMetadata } = route.params || {};
  
  const [metrics, setMetrics] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [filterBy, setFilterBy] = useState('all');
  const [showPairedDeselectModal, setShowPairedDeselectModal] = useState(false);
  const [showPairedSelectModal, setShowPairedSelectModal] = useState(false);
  const [showNoTestsModal, setShowNoTestsModal] = useState(false);
  const [pendingMetric, setPendingMetric] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [modalConfig, setModalConfig] = useState({ visible: false, title: '', message: '', type: 'success' });
  // Determine mode
  const isTestByTestMode = assessmentMode === 'test_by_test';
  const isKidByKidMode = assessmentMode === 'kid_by_kid';

  useEffect(() => {
    loadMetrics();
    loadTemplates();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      //console.log('📊 Loading metrics for sport:', sport?.id);
      const sportMetrics = getMetricsBySport(sport.id);
      //console.log('✅ Loaded metrics:', sportMetrics.length, '| Sport:', sport?.name);
      
      // Log what type of metrics were loaded
      if (sport?.id === 'fitness' || sport?.id === 'general') {
        //console.log('🏃 Loaded ONLY fitness tests (no sport-specific)');
      } else {
        console.log('⚽ Loaded sport-specific + IQ tests (fitness excluded)');
      }
      
      setMetrics(sportMetrics);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading metrics:', error);
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const sportTemplates = await getTemplates(sport.id);
      setTemplates(sportTemplates);
      //console.log('✅ Loaded templates:', sportTemplates.length);
    } catch (error) {
      console.error('❌ Error loading templates:', error);
    }
  };

  const toggleTest = (metricId) => {
    const metric = metrics.find(m => m.id === metricId);
    
    if (selectedTests.includes(metricId)) {
      // Deselecting - also deselect paired metric if selected
      let newSelected = selectedTests.filter(id => id !== metricId);
      
      if (metric?.pairedWith && selectedTests.includes(metric.pairedWith)) {
        setPendingMetric(metric);
        setPendingAction('deselect');
        setShowPairedDeselectModal(true);
      } else {
        setSelectedTests(newSelected);
      }
    } else {
      // Selecting - also select paired metric if not selected
      let newSelected = [...selectedTests, metricId];
      
      if (metric?.pairedWith && !selectedTests.includes(metric.pairedWith)) {
        const pairedMetric = metrics.find(m => m.id === metric.pairedWith);
        setPendingMetric(metric);
        setPendingAction('select');
        setShowPairedSelectModal(true);
      } else {
        setSelectedTests(newSelected);
      }
    }
  };

  const selectAll = () => {
    const filteredMetricIds = getFilteredMetrics().map(m => m.id);
    setSelectedTests(filteredMetricIds);
  };

  const deselectAll = () => {
    setSelectedTests([]);
  };

  const handleLoadTemplate = (template) => {
    setSelectedTests(template.metric_ids);
    setShowTemplateModal(false);
    console.log('✅ Loaded template:', template.name);
  };

  const handleSaveAsTemplate = () => {
    if (selectedTests.length === 0) {
      setShowNoTestsModal(true);
      return;
    }
    setShowSaveTemplateModal(true);
  };

  const confirmSaveTemplate = async () => {
    try {
      if (!templateName.trim()) {
        return;
      }

      // Get current user from AsyncStorage
      let userId = 'system';
      try {
        const userStr = await AsyncStorage.getItem('currentUser');
        if (userStr) {
          const user = JSON.parse(userStr);
          userId = user.id || 'system';
        }
      } catch (err) {
        console.warn('Could not get current user:', err);
      }

      await createTemplate(
        templateName,
        sport.id,
        selectedTests,
        templateDescription,
        userId,
        false
      );

      await loadTemplates();
      setShowSaveTemplateModal(false);
      setTemplateName('');
      setTemplateDescription('');

      setModalConfig({
        visible: true,
        title: 'Template Saved',
        message: `"${templateName}" has been saved successfully!`,
        type: 'success',
        onConfirm: () => setModalConfig({ ...modalConfig, visible: false }),
      });
    } catch (error) {
      console.error('❌ Error saving template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      await deleteTemplate(templateId);
      await loadTemplates();
    } catch (error) {
      console.error('❌ Error deleting template:', error);
    }
  };

  const handleContinue = () => {
    if (selectedTests.length === 0) {
      setShowNoTestsModal(true);
      return;
    }

    // Convert selected metric IDs to full metric objects
    const selectedMetrics = metrics.filter(m => selectedTests.includes(m.id));

    // CRITICAL FIX: Different navigation based on mode
    if (isKidByKidMode) {
      // Kid-by-Kid: Kids already selected, go to AssessmentEntry
      console.log('➡️ Navigating to AssessmentEntry (kid-by-kid mode)');
      navigation.navigate('AssessmentEntry', {
        sport,
        kids: selectedKids,
        mode: assessmentMode,
        selectedTests: selectedMetrics,
        assessmentMetadata: assessmentMetadata, // Pass metadata forward
      });
    } else {
      // Test-by-Test: Navigate to SelectKids
      //console.log('➡️ Navigating to SelectKids (test-by-test mode)');
      navigation.navigate('SelectKids', {
        sport,
        assessmentMode,
        selectedTests: selectedMetrics,
        kidCount,
        assessmentMetadata: assessmentMetadata, // Pass metadata forward
      });
    }
  };

  const getFilteredMetrics = () => {
    if (filter === 'all') return metrics;
    return metrics.filter(m => m.category === filter);
  };

  const getCategoryCount = (category) => {
    return metrics.filter(m => m.category === category).length;
  };

  const getCategoryIconName = (category) => {
    switch (category) {
      case 'general_fitness': return 'heart-pulse';
      case 'sport_specific': return 'soccer';
      case 'iq': return 'brain';
      default: return 'chart-bar';
    }
  };

  const getMetricSpecificIcon = (metric) => {
    const name = metric.name.toLowerCase();
    
    if (name.includes('height')) return 'human-male-height';
    if (name.includes('weight')) return 'scale-bathroom';
    if (name.includes('beep') || name.includes('shuttle')) return 'run';
    if (name.includes('cooper')) return 'timer-outline';
    if (name.includes('endurance')) return 'heart-pulse';
    if (name.includes('sprint') || name.includes('speed')) return 'speedometer';
    if (name.includes('40m') || name.includes('100m')) return 'lightning-bolt';
    if (name.includes('push-up') || name.includes('pushup')) return 'plus-circle-multiple';
    if (name.includes('sit-up') || name.includes('situp')) return 'alpha-s-circle';
    if (name.includes('pull-up') || name.includes('pullup')) return 'pull';
    if (name.includes('plank')) return 'timer-sand';
    if (name.includes('jump') || name.includes('vertical')) return 'arrow-up-thick';
    if (name.includes('flexibility') || name.includes('sit') && name.includes('reach')) return 'human-greeting-proximity';
    if (name.includes('stretch')) return 'human-handsup';
    if (name.includes('dribbl')) return 'soccer';
    if (name.includes('pass')) return 'basketball-hoop-outline';
    if (name.includes('shoot')) return 'target';
    if (name.includes('receiv')) return 'hand-front-right';
    if (name.includes('defend')) return 'shield-account';
    
    return getCategoryIconName(metric.category);
  };

  const getCategoryIconColor = (category) => {
    switch (category) {
      case 'general_fitness': return '#FF6B35';
      case 'sport_specific': return '#4ECDC4';
      case 'iq': return '#9B59B6';
      default: return COLORS.primary;
    }
  };

  const filteredMetrics = getFilteredMetrics();

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Select Tests"
          leftIcon="←"
          onLeftPress={() => navigation.goBack()}
          showAvatar={false}
        />
        <LoadingSpinner 
          overlay 
          text="Loading tests..." 
          color="#1565C0"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Select Tests"
        subtitle={`${sport?.name} • ${isKidByKidMode ? `${selectedKids.length} kids selected` : 'Choose metrics'}`}
        leftIcon="←"
        onLeftPress={() => navigation.goBack()}
        showAvatar={false}
      />

      {/* Selection Summary */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryLeft}>
          <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
          <Text style={styles.summaryText}>
            {selectedTests.length} test{selectedTests.length !== 1 ? 's' : ''} selected
          </Text>
        </View>
        <View style={styles.summaryActions}>
          <TouchableOpacity onPress={selectAll} style={styles.summaryButton}>
            <Ionicons name="checkbox-outline" size={16} color={COLORS.primary} />
            <Text style={styles.summaryButtonText}>Select All</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={deselectAll} style={styles.summaryButton}>
            <Ionicons name="close-circle-outline" size={16} color={COLORS.error} />
            <Text style={[styles.summaryButtonText, { color: COLORS.error }]}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Combined Filter + Template Section - Single Horizontal Row */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {/* All Filter */}
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
          >
            <Ionicons 
              name="apps" 
              size={16} 
              color={filter === 'all' ? COLORS.white : COLORS.text} 
              style={styles.filterIconImg}
            />
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All ({metrics.length})
            </Text>
          </TouchableOpacity>

          {/* Load Template Button */}
          {templates.length > 0 && (
            <TouchableOpacity
              style={styles.templateChip}
              onPress={() => setShowTemplateModal(true)}
            >
              <Ionicons name="folder-open-outline" size={16} color={COLORS.primary} />
              <Text style={styles.templateChipText}>Load Template</Text>
            </TouchableOpacity>
          )}

          {/* Save Template Button */}
          {selectedTests.length > 0 && (
            <TouchableOpacity
              style={styles.templateChipSave}
              onPress={handleSaveAsTemplate}
            >
              <Ionicons name="save-outline" size={16} color={COLORS.success} />
              <Text style={styles.templateChipTextSave}>Save as Template</Text>
            </TouchableOpacity>
          )}

          {/* Fitness filter - ONLY for Fitness sport */}
          {(sport.id === 'fitness' || sport.id === 'general') && (
            <TouchableOpacity
              style={[styles.filterChip, filter === 'general_fitness' && styles.filterChipActive]}
              onPress={() => setFilter('general_fitness')}
            >
              <MaterialCommunityIcons 
                name="run-fast" 
                size={16} 
                color={filter === 'general_fitness' ? COLORS.white : '#FF6B35'} 
                style={styles.filterIconImg}
              />
              <Text style={[styles.filterText, filter === 'general_fitness' && styles.filterTextActive]}>
                Fitness ({getCategoryCount('general_fitness')})
              </Text>
            </TouchableOpacity>
          )}

          {/* Skills + Cognitive filters - ONLY for non-Fitness sports */}
          {sport.id !== 'fitness' && sport.id !== 'general' && (
            <>
              <TouchableOpacity
                style={[styles.filterChip, filter === 'sport_specific' && styles.filterChipActive]}
                onPress={() => setFilter('sport_specific')}
              >
                <MaterialCommunityIcons 
                  name="soccer" 
                  size={16} 
                  color={filter === 'sport_specific' ? COLORS.white : '#4ECDC4'} 
                  style={styles.filterIconImg}
                />
                <Text style={[styles.filterText, filter === 'sport_specific' && styles.filterTextActive]}>
                  Skills ({getCategoryCount('sport_specific')})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, filter === 'iq' && styles.filterChipActive]}
                onPress={() => setFilter('iq')}
              >
                <MaterialCommunityIcons 
                  name="brain" 
                  size={16} 
                  color={filter === 'iq' ? COLORS.white : '#9B59B6'} 
                  style={styles.filterIconImg}
                />
                <Text style={[styles.filterText, filter === 'iq' && styles.filterTextActive]}>
                  Cognitive ({getCategoryCount('iq')})
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Metrics List */}
        <View style={styles.metricsContainer}>
          {filteredMetrics.map((metric) => {
            const isSelected = selectedTests.includes(metric.id);
            
            return (
              <TouchableOpacity
                key={metric.id}
                style={[styles.metricCard, isSelected && styles.metricCardSelected]}
                onPress={() => toggleTest(metric.id)}
                activeOpacity={0.7}
              >
                <View style={styles.metricHeader}>
                  <View style={styles.metricInfo}>
                    <View style={[
                      styles.categoryIconContainer,
                      { backgroundColor: getCategoryIconColor(metric.category) + '15' }
                    ]}>
                      <MaterialCommunityIcons 
                        name={getMetricSpecificIcon(metric)} 
                        size={24} 
                        color={getCategoryIconColor(metric.category)}
                      />
                    </View>
                    <View style={styles.metricTextContainer}>
                      <Text style={styles.metricName}>{metric.name}</Text>
                      <Text style={styles.metricMeta}>
                        {metric.type} {metric.unit && `• ${metric.unit}`}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={[
                    styles.checkbox,
                    isSelected && styles.checkboxSelected
                  ]}>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color={COLORS.white} />
                    )}
                  </View>
                </View>

                {metric.description && (
                  <Text style={styles.metricDescription}>{metric.description}</Text>
                )}
                
                {metric.pairedWith && (
                  <View style={styles.pairedBadge}>
                    <Ionicons name="link" size={12} color={COLORS.primary} />
                    <Text style={styles.pairedBadgeText}>
                      Paired with {metrics.find(m => m.id === metric.pairedWith)?.name || 'another test'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Empty State */}
        {filteredMetrics.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyStateText}>No tests in this category</Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Paired Deselect Modal */}
      <Modal visible={showPairedDeselectModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="link" size={48} color={COLORS.warning} />
            </View>
            <Text style={styles.modalTitle}>Paired Test</Text>
            <Text style={styles.modalMessage}>
              {pendingMetric?.name} is paired with {metrics.find(m => m.id === pendingMetric?.pairedWith)?.name}. Deselect both?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowPairedDeselectModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDestructive]}
                onPress={() => {
                  const newSelected = selectedTests.filter(id => id !== pendingMetric.id);
                  setSelectedTests(newSelected.filter(id => id !== pendingMetric.pairedWith));
                  setShowPairedDeselectModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Deselect Both</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Paired Select Modal */}
      <Modal visible={showPairedSelectModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="link" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.modalTitle}>Paired Test</Text>
            <Text style={styles.modalMessage}>
              {pendingMetric?.name} is best assessed together with {metrics.find(m => m.id === pendingMetric?.pairedWith)?.name}. Select both?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setSelectedTests([...selectedTests, pendingMetric.id]);
                  setShowPairedSelectModal(false);
                }}
              >
                <Text style={styles.modalButtonTextSecondary}>Only This Test</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton]}
                onPress={() => {
                  setSelectedTests([...selectedTests, pendingMetric.id, pendingMetric.pairedWith]);
                  setShowPairedSelectModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Select Both</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Load Template Modal */}
      <Modal visible={showTemplateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.templateModalContent}>
            <View style={styles.templateModalHeader}>
              <Text style={styles.modalTitle}>Load Template</Text>
              <TouchableOpacity onPress={() => setShowTemplateModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.templateList}>
              {templates.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={styles.templateItem}
                  onPress={() => handleLoadTemplate(template)}
                >
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateItemName}>{template.name}</Text>
                    {template.description && (
                      <Text style={styles.templateItemDescription}>{template.description}</Text>
                    )}
                    <Text style={styles.templateItemMeta}>
                      {template.metric_ids.length} tests
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteTemplate(template.id);
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Save Template Modal */}
      <Modal visible={showSaveTemplateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.templateModalContent}>
            <Text style={styles.modalTitle}>Save as Template</Text>
            <TextInput
              style={styles.templateInput}
              placeholder="Template Name"
              value={templateName}
              onChangeText={setTemplateName}
            />
            <TextInput
              style={[styles.templateInput, styles.templateInputMultiline]}
              placeholder="Description (optional)"
              value={templateDescription}
              onChangeText={setTemplateDescription}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setShowSaveTemplateModal(false);
                  setTemplateName('');
                  setTemplateDescription('');
                }}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton]}
                onPress={confirmSaveTemplate}
                disabled={!templateName.trim()}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* No Tests Selected Modal */}
      <Modal visible={showNoTestsModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="alert-circle" size={48} color={COLORS.warning} />
            </View>
            <Text style={styles.modalTitle}>No Tests Selected</Text>
            <Text style={styles.modalMessage}>
              Please select at least one test
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonFull]}
              onPress={() => setShowNoTestsModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Continue Button */}
      {selectedTests.length > 0 && (
        <View style={styles.continueContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>
              {isKidByKidMode 
                ? `Start Assessment (${selectedTests.length} tests)`
                : `Continue with ${selectedTests.length} test${selectedTests.length !== 1 ? 's' : ''}`
              }
            </Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { position: 'absolute', top: 220, left: 0, right: 0, bottom: 0 },
  scrollContent: { paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.textSecondary },
  summaryBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  summaryLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryText: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  summaryActions: { flexDirection: 'row', gap: 8 },
  summaryButton: { flexDirection: 'row', alignItems: 'center', marginLeft: 8, gap: 4 },
  summaryButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  filterSection: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: 12 },
  filterContent: { paddingHorizontal: 20, gap: 10 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: COLORS.backgroundDark, marginRight: 10, borderWidth: 2, borderColor: 'transparent' },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primaryDark },
  filterIconImg: { marginRight: 6 },
  filterText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  filterTextActive: { color: COLORS.white },
  metricsContainer: { paddingHorizontal: 20, paddingTop: 16 },
  metricCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: COLORS.border },
  metricCardSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight + '10' },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  categoryIconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  metricTextContainer: { flex: 1 },
  metricName: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  metricMeta: { fontSize: 12, color: COLORS.textSecondary },
  metricDescription: { fontSize: 13, color: COLORS.textSecondary, marginTop: 8, marginLeft: 52, lineHeight: 18 },
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  checkboxSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyStateText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 12 },
  continueContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border, elevation: 8, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  continueButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, gap: 8 },
  continueButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
  bottomPadding: { height: 16 },
  
  // Paired Test Badge
  pairedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  pairedBadgeText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
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
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  modalButtonSecondary: {
    backgroundColor: COLORS.backgroundDark,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  modalButtonDestructive: {
    backgroundColor: COLORS.error,
  },
  modalButtonFull: {
    width: '100%',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
    // Template chips (integrated into filter row)
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight + '20',
    marginRight: 10,
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
    gap: 6,
  },
  templateChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  templateChipSave: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.success + '10',
    marginRight: 10,
    borderWidth: 2,
    borderColor: COLORS.success + '30',
    gap: 6,
  },
  templateChipTextSave: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.success,
  },
  templateList: {
    maxHeight: 400,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  templateInfo: {
    flex: 1,
  },
  templateItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  templateItemDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  templateItemMeta: {
    fontSize: 12,
    color: COLORS.primary,
  },
  templateInput: {
    backgroundColor: COLORS.backgroundDark,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  templateInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  templateModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  templateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
});