// Location: /apps/assessment/src/screens/Reports/ReportsScreen.js
// Export Data Screen - Flexible filtering and data export

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SearchBar from '../../components/common/SearchBar';
import { COLORS, AGE_GROUPS, ASSESSMENT_TERMS } from '../../utils/constants';
import { getAllKids } from '../../database/db';
import { getAssessmentsByDateRange } from '../../database/queries';

export default function ReportsScreen() {
  const navigation = useNavigation();

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [selectedFormat, setSelectedFormat] = useState('csv');
  
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showTermDropdown, setShowTermDropdown] = useState(false);
  const [showSportDropdown, setShowSportDropdown] = useState(false);
  const [showAgeDropdown, setShowAgeDropdown] = useState(false);
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [selectedSort, setSelectedSort] = useState('none');
  
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [showFilters, setShowFilters] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  const [showExportModal, setShowExportModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [showFilterSummaryModal, setShowFilterSummaryModal] = useState(false);

  // Data State
  const [loading, setLoading] = useState(true);
  const [kids, setKids] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [sports, setSports] = useState([]);

  // Options
  const [yearOptions, setYearOptions] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedYear, selectedTerm, selectedSport, selectedAgeGroup, selectedSort, kids, assessments]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔄 REPORTS: Starting data load...');
      
      // Load kids
      const allKids = await getAllKids();
      console.log('✅ REPORTS: Kids loaded:', allKids.length);
      setKids(allKids.filter(k => k.status === 'active'));

      // Load sports (from constants for now - can be fetched from DB)
      const sportsData = [
        { id: 'general', name: 'General Fitness' },
        { id: 'football', name: 'Football' },
        { id: 'athletics', name: 'Athletics' },
        { id: 'rugby', name: 'Rugby' },
        { id: 'swimming', name: 'Swimming' },
        { id: 'tennis', name: 'Tennis' },
        { id: 'basketball', name: 'Basketball' },
      ];
      setSports(sportsData);
      console.log('✅ REPORTS: Sports loaded:', sportsData.length);

      // Load assessments (last 2 years)
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear - 2}-01-01`;
      const endDate = `${currentYear + 1}-12-31`;
      console.log('🔄 REPORTS: Loading assessments from', startDate, 'to', endDate);
      const allAssessments = await getAssessmentsByDateRange(startDate, endDate);
      console.log('✅ REPORTS: Assessments loaded:', allAssessments.length);
      
      setAssessments(allAssessments);

      // Generate year options dynamically from actual assessment data
      const assessmentYears = new Set();
      allAssessments.forEach(a => {
        if (a.year && a.year !== 'null' && a.year !== null) {
          assessmentYears.add(a.year);
        } else {
          const assessmentYear = new Date(a.assessment_date).getFullYear();
          assessmentYears.add(`${assessmentYear}/${assessmentYear + 1}`);
        }
      });
      
      const sortedYears = Array.from(assessmentYears).sort((a, b) => {
        const yearA = parseInt(a.split('/')[0]);
        const yearB = parseInt(b.split('/')[0]);
        return yearB - yearA;
      });
      
      const dynamicYearOptions = sortedYears.map(year => ({
        value: year,
        label: year
      }));
      
      setYearOptions([{ value: 'all', label: 'All Years' }, ...dynamicYearOptions]);
      console.log('✅ REPORTS: Data load complete');

    } catch (error) {
      console.error('❌ REPORTS: Error loading data:', error);
      Alert.alert('Error', 'Failed to load data: ' + error.message);
    } finally {
      console.log('🏁 REPORTS: Setting loading to false');
      setLoading(false);
    }
  };

  const toggleRecordSelection = (kidId) => {
    setSelectedRecords(prev => 
      prev.includes(kidId) 
        ? prev.filter(id => id !== kidId)
        : [...prev, kidId]
    );
  };

  const selectAll = () => {
    const allKids = filteredData.kids || [];
    setSelectedRecords(selectedRecords.length === allKids.length ? [] : allKids.map(k => k.id));
  };

  const applyFilters = async () => {
    let filtered = [...kids];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(kid =>
        kid.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Age group filter
    if (selectedAgeGroup !== 'all') {
      filtered = filtered.filter(kid => kid.age_group === selectedAgeGroup);
    }

    // Get assessments for filtered kids
    let relevantAssessments = assessments.filter(a =>
      filtered.some(k => k.id === a.kid_id)
    );

    // Year filter
    if (selectedYear !== 'all') {
      relevantAssessments = relevantAssessments.filter(a => {
        if (a.year && a.year !== 'null' && a.year !== null) {
          return a.year === selectedYear;
        }
        const assessmentYear = new Date(a.assessment_date).getFullYear();
        const [startYear] = selectedYear.split('/');
        return assessmentYear.toString() === startYear;
      });
    }

    // Term filter
    if (selectedTerm !== 'all') {
      relevantAssessments = relevantAssessments.filter(a => a.term === selectedTerm);
    }

    // Sport filter
    if (selectedSport !== 'all') {
      relevantAssessments = relevantAssessments.filter(a => a.sport_id === selectedSport);
    }

    // Get metrics for the selected sport
    const { getMetricsBySport } = await import('../../config/metrics');
    const sportMetrics = selectedSport !== 'all' 
      ? getMetricsBySport(selectedSport)
      : [];

    // Combine kids with their LATEST assessment per kid
    const dataWithLatestValues = filtered.map(kid => {
      const kidAssessments = relevantAssessments.filter(a => a.kid_id === kid.id);
      
      if (kidAssessments.length === 0) {
        return null;
      }

      // Get the most recent assessment
      const latestAssessment = kidAssessments.sort((a, b) => 
        new Date(b.assessment_date) - new Date(a.assessment_date)
      )[0];

      // Extract metric values from latest assessment
      const metricValues = {};
      if (latestAssessment.results) {
        latestAssessment.results.forEach(result => {
          metricValues[result.metric_id] = result.value;
        });
      }

      return {
        ...kid,
        latestAssessment,
        metricValues,
      };
    }).filter(Boolean);

    // Apply sorting
    let sortedData = dataWithLatestValues;
    if (selectedSort !== 'none') {
      sortedData = applySorting(dataWithLatestValues, selectedSort);
    }

    setFilteredData({ kids: sortedData, metrics: sportMetrics });
  };

  const applySorting = (data, sortType) => {
    const sorted = [...data];
    
    switch (sortType) {
      case 'a_z':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'z_a':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'high_performer':
        return sorted.sort((a, b) => {
          const avgA = calculateAverage(a.metricValues);
          const avgB = calculateAverage(b.metricValues);
          return avgB - avgA;
        });
      case 'low_performer':
        return sorted.sort((a, b) => {
          const avgA = calculateAverage(a.metricValues);
          const avgB = calculateAverage(b.metricValues);
          return avgA - avgB;
        });
      default:
        return sorted;
    }
  };

  const calculateAverage = (metricValues) => {
    const values = Object.values(metricValues || {}).filter(v => v != null);
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + parseFloat(val || 0), 0);
    return sum / values.length;
  };

  const handleExport = () => {
    if (filteredData.length === 0) {
      return;
    }
    setShowExportModal(true);
  };

  const confirmExport = () => {
    setShowExportModal(false);
    performExport();
  };

  const performExport = () => {
    const kidsToExport = selectedRecords.length > 0 
      ? filteredData.kids.filter(k => selectedRecords.includes(k.id))
      : filteredData.kids;
    
    const exportPayload = kidsToExport.map(kid => ({
      ...kid,
      assessments: [kid.latestAssessment],
      metricValues: kid.metricValues,
    }));
    
    console.log('✅ Navigating to ExportDetailScreen with:', exportPayload.length, 'records');
    
    navigation.navigate('ExportDetail', {
      filteredData: exportPayload,
      filters: {
        year: selectedYear,
        term: selectedTerm,
        sport: selectedSport,
        ageGroup: selectedAgeGroup,
      },
      format: selectedFormat,
      sports: sports,
      metrics: filteredData.metrics || [],
    });
  };

  const getExportCount = () => {
    return selectedRecords.length > 0 ? selectedRecords.length : (filteredData.kids?.length || 0);
  };

  const getExportMessage = () => {
    const count = filteredData.kids?.length || 0;
    return selectedRecords.length > 0 
      ? `${selectedRecords.length} selected records`
      : `all ${count} filtered records`;
  };

  const sportOptions = [
    { value: 'all', label: 'All Sports' },
    ...sports.map(s => ({ value: s.id, label: s.name })),
  ];

  const termOptions = [
    { value: 'all', label: 'All Terms' },
    ...ASSESSMENT_TERMS.map(t => ({ value: t, label: t })),
  ];

  const ageGroupOptions = [
    { value: 'all', label: 'All Age Groups' },
    ...AGE_GROUPS.map(ag => ({ value: ag, label: `${ag} years` })),
  ];

  const formatOptions = [
    { value: 'csv', label: 'CSV Spreadsheet' },
    { value: 'pdf', label: 'PDF Document' },
    { value: 'excel', label: 'Excel Spreadsheet' },
  ];

  const sortOptions = [
    { value: 'none', label: 'No Sort' },
    { value: 'high_performer', label: 'High Performer' },
    { value: 'low_performer', label: 'Low Performer' },
    { value: 'a_z', label: 'A-Z' },
    { value: 'z_a', label: 'Z-A' },
  ];

  return (
    <View style={styles.container}>
      <Header
        title="Export Data"
        subtitle={`${filteredData.kids?.length || 0} records found`}
        leftIcon="☰"
        onLeftPress={() => navigation.openDrawer()}
      />

      <View style={styles.contentWrapper}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            const currentScrollY = e.nativeEvent.contentOffset.y;
            const scrollDifference = currentScrollY - scrollY;
            
            setScrollY(currentScrollY);
            
            if (Math.abs(scrollDifference) > 30) {
              if (scrollDifference > 0 && currentScrollY > 50) {
                setShowFilters(false);
              } else if (scrollDifference < 0) {
                setShowFilters(true);
              }
            }
          }}
          scrollEventThrottle={16}
        >
        {/* Search Bar */}
        {showFilters && (
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by kid name..."
            showClearButton={true}
            showSearchIcon={false}
            containerStyle={styles.searchBarContainer}
          />
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => console.log('Search triggered:', searchQuery)}
            activeOpacity={0.7}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
        )}

        {/* Filter Chips - Horizontal Scroll */}
        <View style={styles.filtersContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsContainer}
          >
            {/* Academic Year Dropdown */}
            <TouchableOpacity 
              style={styles.filterChip}
              onPress={() => setShowYearDropdown(!showYearDropdown)}
            >
              <Text style={styles.filterChipText}>
                {selectedYear === 'all' ? 'Academic Year' : yearOptions.find(y => y.value === selectedYear)?.label}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.white} />
            </TouchableOpacity>

            {/* Term Dropdown */}
            <TouchableOpacity 
              style={styles.filterChip}
              onPress={() => setShowTermDropdown(!showTermDropdown)}
            >
              <Text style={styles.filterChipText}>
                {selectedTerm === 'all' ? 'Term' : selectedTerm}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.white} />
            </TouchableOpacity>

            {/* Sport Dropdown */}
            <TouchableOpacity 
              style={styles.filterChip}
              onPress={() => setShowSportDropdown(!showSportDropdown)}
            >
              <Text style={styles.filterChipText}>
                {selectedSport === 'all' ? 'Sport' : sportOptions.find(s => s.value === selectedSport)?.label}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.white} />
            </TouchableOpacity>

            {/* Age Group Dropdown */}
            <TouchableOpacity 
              style={styles.filterChip}
              onPress={() => setShowAgeDropdown(!showAgeDropdown)}
            >
              <Text style={styles.filterChipText}>
                {selectedAgeGroup === 'all' ? 'Age Group' : `${selectedAgeGroup} years`}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.white} />
            </TouchableOpacity>

            {/* Export Format Dropdown */}
            <TouchableOpacity 
              style={styles.filterChip}
              onPress={() => setShowFormatDropdown(!showFormatDropdown)}
            >
              <Text style={styles.filterChipText}>
                {formatOptions.find(f => f.value === selectedFormat)?.label}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.white} />
            </TouchableOpacity>

            {/* Sort/Performance Dropdown */}
            <TouchableOpacity 
              style={styles.filterChip}
              onPress={() => setShowSortDropdown(!showSortDropdown)}
            >
              <Text style={styles.filterChipText}>
                {selectedSort === 'none' ? 'Sort By' : sortOptions.find(s => s.value === selectedSort)?.label}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </ScrollView>

          {/* Dropdown Menus */}
          {showYearDropdown && (
            <View style={styles.dropdownMenu}>
              {yearOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.dropdownItem, selectedYear === option.value && styles.dropdownItemActive]}
                  onPress={() => {
                    setSelectedYear(option.value);
                    setShowYearDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, selectedYear === option.value && styles.dropdownItemTextActive]}>
                    {option.label}
                  </Text>
                  {selectedYear === option.value && <Ionicons name="checkmark" size={20} color="#2196F3" />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {showTermDropdown && (
            <View style={styles.dropdownMenu}>
              {termOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.dropdownItem, selectedTerm === option.value && styles.dropdownItemActive]}
                  onPress={() => {
                    setSelectedTerm(option.value);
                    setShowTermDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, selectedTerm === option.value && styles.dropdownItemTextActive]}>
                    {option.label}
                  </Text>
                  {selectedTerm === option.value && <Ionicons name="checkmark" size={20} color="#2196F3" />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {showSportDropdown && (
            <View style={styles.dropdownMenu}>
              {sportOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.dropdownItem, selectedSport === option.value && styles.dropdownItemActive]}
                  onPress={() => {
                    setSelectedSport(option.value);
                    setShowSportDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, selectedSport === option.value && styles.dropdownItemTextActive]}>
                    {option.label}
                  </Text>
                  {selectedSport === option.value && <Ionicons name="checkmark" size={20} color="#2196F3" />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {showAgeDropdown && (
            <View style={styles.dropdownMenu}>
              {ageGroupOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.dropdownItem, selectedAgeGroup === option.value && styles.dropdownItemActive]}
                  onPress={() => {
                    setSelectedAgeGroup(option.value);
                    setShowAgeDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, selectedAgeGroup === option.value && styles.dropdownItemTextActive]}>
                    {option.label}
                  </Text>
                  {selectedAgeGroup === option.value && <Ionicons name="checkmark" size={20} color="#2196F3" />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {showFormatDropdown && (
            <View style={styles.dropdownMenu}>
              {formatOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.dropdownItem, selectedFormat === option.value && styles.dropdownItemActive]}
                  onPress={() => {
                    setSelectedFormat(option.value);
                    setShowFormatDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, selectedFormat === option.value && styles.dropdownItemTextActive]}>
                    {option.label}
                  </Text>
                  {selectedFormat === option.value && <Ionicons name="checkmark" size={20} color="#2196F3" />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {showSortDropdown && (
            <View style={styles.dropdownMenu}>
              {sortOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.dropdownItem, selectedSort === option.value && styles.dropdownItemActive]}
                  onPress={() => {
                    setSelectedSort(option.value);
                    setShowSortDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, selectedSort === option.value && styles.dropdownItemTextActive]}>
                    {option.label}
                  </Text>
                  {selectedSort === option.value && <Ionicons name="checkmark" size={20} color="#2196F3" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Select Mode / Filter Summary Controls */}
        {showFilters && filteredData.kids && filteredData.kids.length > 0 && (
          <View style={styles.selectAllContainer}>
            {!isSelectMode ? (
              <>
                <TouchableOpacity 
                  onPress={() => setIsSelectMode(true)} 
                  style={styles.selectModeButton}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#2196F3" />
                  <Text style={styles.selectModeText}>Select</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => setShowFilterSummaryModal(true)} 
                  style={styles.filterSummaryButton}
                >
                  <Ionicons name="list-outline" size={20} color="#2196F3" />
                  <Text style={styles.filterSummaryText}>Export Fields</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={selectAll} style={styles.selectAllButton}>
                  <Text style={styles.selectAllText}>
                    {selectedRecords.length === filteredData.kids.length ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.selectedCount}>
                  {selectedRecords.length} of {filteredData.kids.length} selected
                </Text>
                <TouchableOpacity 
                  onPress={() => {
                    setIsSelectMode(false);
                    setSelectedRecords([]);
                  }} 
                  style={styles.cancelSelectButton}
                >
                  <Ionicons name="close-circle" size={20} color="#FF5252" />
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Data Preview Table */}
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Data Preview</Text>
          
          {!filteredData.kids || filteredData.kids.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>No data matches your filters</Text>
              <Text style={styles.emptyHint}>
                {selectedSport === 'all' 
                  ? 'Select a specific sport to view metric columns'
                  : 'Try adjusting your filter criteria'}
              </Text>
            </View>
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View>
                  {/* Table Header */}
                  <View style={styles.tableRow}>
                    {isSelectMode && (
                      <View style={[styles.tableCell, styles.tableHeader, styles.checkboxColumn]}>
                        <Text style={styles.tableHeaderText}>Select</Text>
                      </View>
                    )}
                    <Text style={[styles.tableCell, styles.tableHeader, styles.nameColumn]}>
                      Name
                    </Text>
                    <Text style={[styles.tableCell, styles.tableHeader, styles.ageColumn]}>
                      Age
                    </Text>
                    
                    {/* DYNAMIC METRIC COLUMNS */}
                    {selectedSport !== 'all' && filteredData.metrics && filteredData.metrics.length > 0 ? (
                      filteredData.metrics.slice(0, 8).map((metric) => (
                        <View key={metric.id} style={[styles.tableCell, styles.tableHeader, styles.metricColumn]}>
                          <Text style={styles.tableHeaderText} numberOfLines={2}>
                            {metric.name}
                          </Text>
                          {metric.unit && (
                            <Text style={styles.headerSubtext}>{metric.unit}</Text>
                          )}
                        </View>
                      ))
                    ) : (
                      <>
                        <Text style={[styles.tableCell, styles.tableHeader, styles.sportColumn]}>
                          Sport
                        </Text>
                        <Text style={[styles.tableCell, styles.tableHeader, styles.termColumn]}>
                          Term
                        </Text>
                        <Text style={[styles.tableCell, styles.tableHeader, styles.assessmentsColumn]}>
                          Last Assessment
                        </Text>
                      </>
                    )}
                  </View>

                  {/* Table Rows */}
                  {filteredData.kids.map((kid, index) => {
                    const isSelected = selectedRecords.includes(kid.id);
                    
                    const formatMetricValue = (metric, value) => {
                      if (!value) return '--';
                      
                      switch (metric.type) {
                        case 'numeric':
                          return `${parseFloat(value).toFixed(1)}${metric.unit || ''}`;
                        case 'rating':
                          return `${value}/10`;
                        case 'timed':
                          return `${parseFloat(value).toFixed(2)}s`;
                        case 'counted':
                          return `${value}`;
                        default:
                          return value.toString();
                      }
                    };

                    return (
                      <TouchableOpacity
                        key={kid.id}
                        style={[
                          styles.tableRow,
                          index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                          isSelected && styles.tableRowSelected,
                        ]}
                        onPress={() => isSelectMode && toggleRecordSelection(kid.id)}
                        disabled={!isSelectMode}
                      >
                        {isSelectMode && (
                          <View style={[styles.tableCell, styles.checkboxColumn]}>
                            <View style={styles.checkbox}>
                              {isSelected && <View style={styles.checkmark} />}
                            </View>
                          </View>
                        )}
                        <Text style={[styles.tableCell, styles.nameColumn]}>
                          {kid.name}
                        </Text>
                        <Text style={[styles.tableCell, styles.ageColumn]}>
                          {kid.age}
                        </Text>
                        
                        {/* DYNAMIC METRIC VALUES */}
                        {selectedSport !== 'all' && filteredData.metrics && filteredData.metrics.length > 0 ? (
                          filteredData.metrics.slice(0, 8).map((metric) => (
                            <Text key={metric.id} style={[styles.tableCell, styles.metricColumn]}>
                              {formatMetricValue(metric, kid.metricValues[metric.id])}
                            </Text>
                          ))
                        ) : (
                          <>
                            <Text style={[styles.tableCell, styles.sportColumn]}>
                              {kid.latestAssessment?.sport_id || 'N/A'}
                            </Text>
                            <Text style={[styles.tableCell, styles.termColumn]}>
                              {kid.latestAssessment?.term || 'N/A'}
                            </Text>
                            <Text style={[styles.tableCell, styles.assessmentsColumn]}>
                              {kid.latestAssessment?.assessment_date || 'N/A'}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Metrics Note */}
              {selectedSport !== 'all' && filteredData.metrics && filteredData.metrics.length > 8 && (
                <View style={styles.metricsNote}>
                  <Ionicons name="information-circle" size={16} color="#FF9800" />
                  <Text style={styles.metricsNoteText}>
                    Showing first 8 of {filteredData.metrics.length} metrics. Full data available in export.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
        
        <View style={styles.bottomPadding} />
        </ScrollView>
      </View>

      {/* Floating Action Button */}
      {filteredData.kids && filteredData.kids.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleExport}
          activeOpacity={0.8}
        >
          <Ionicons name="share-outline" size={28} color={COLORS.white} />
          {getExportCount() > 0 && (
            <View style={styles.fabBadge}>
              <Text style={styles.fabBadgeText}>{getExportCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Export Confirmation Modal */}
      {showExportModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons name="download-outline" size={48} color="#2196F3" />
              <Text style={styles.modalTitle}>Export Data</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              Export {getExportMessage()} as {selectedFormat.toUpperCase()}?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowExportModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmExport}
              >
                <Text style={styles.modalButtonTextConfirm}>Export</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Filter Summary Modal */}
      {showFilterSummaryModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons name="list-outline" size={48} color="#2196F3" />
              <Text style={styles.modalTitle}>Export Fields Summary</Text>
            </View>
            
            <View style={styles.filterSummaryContent}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Academic Year:</Text>
                <Text style={styles.summaryValue}>
                  {selectedYear === 'all' ? 'All Years' : yearOptions.find(y => y.value === selectedYear)?.label}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Term:</Text>
                <Text style={styles.summaryValue}>
                  {selectedTerm === 'all' ? 'All Terms' : selectedTerm}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sport:</Text>
                <Text style={styles.summaryValue}>
                  {selectedSport === 'all' ? 'All Sports' : sportOptions.find(s => s.value === selectedSport)?.label}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Age Group:</Text>
                <Text style={styles.summaryValue}>
                  {selectedAgeGroup === 'all' ? 'All Age Groups' : `${selectedAgeGroup} years`}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Export Format:</Text>
                <Text style={styles.summaryValue}>
                  {formatOptions.find(f => f.value === selectedFormat)?.label}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sort By:</Text>
                <Text style={styles.summaryValue}>
                  {selectedSort === 'none' ? 'No Sort' : sortOptions.find(s => s.value === selectedSort)?.label}
                </Text>
              </View>
              
              <View style={[styles.summaryRow, styles.summaryRowHighlight]}>
                <Text style={styles.summaryLabel}>Total Records:</Text>
                <Text style={styles.summaryValueHighlight}>{filteredData.kids.length}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonConfirm, { marginTop: 16 }]}
              onPress={() => setShowFilterSummaryModal(false)}
            >
              <Text style={styles.modalButtonTextConfirm}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
              <Text style={styles.modalTitle}>Export Complete</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              Successfully exported {getExportCount()} records as {selectedFormat.toUpperCase()}
            </Text>
          </View>
        </View>
      )}

      {/* Loading Overlay - Shows on top of content */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner 
            text="Loading data..." 
            color="#1565C0"
          />
        </View>
      )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    gap: 8,
  },
  searchBarContainer: {
    flex: 1,
    marginHorizontal: 0,
  },
  searchButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  searchButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  filtersContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 1000,
  },
  filterChipsContainer: {
    gap: 8,
    paddingRight: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    gap: 8,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 55,
    left: 16,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    zIndex: 99999,
    minWidth: 200,
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemActive: {
    backgroundColor: '#E3F2FD',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  dropdownItemTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  previewContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptyHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
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
    fontSize: 14,
    color: COLORS.text,
  },
  tableHeader: {
    fontWeight: 'bold',
    backgroundColor: COLORS.primary,
    color: COLORS.white,
  },
  nameColumn: {
    width: 150,
  },
  ageColumn: {
    width: 60,
  },
  sportColumn: {
    width: 120,
  },
  termColumn: {
    width: 80,
  },
  assessmentsColumn: {
    width: 100,
  },
  bottomPadding: {
    height: 32,
  },
  selectAllContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectAllButton: {
    padding: 8,
  },
  selectAllText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  selectedCount: {
    fontSize: 14,
    color: '#666',
  },
  checkboxColumn: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#2196F3',
  },
  tableRowSelected: {
    backgroundColor: '#E3F2FD',
  },
  tableHeaderText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: COLORS.border,
  },
  modalButtonConfirm: {
    backgroundColor: '#2196F3',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  selectModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 6,
  },
  selectModeText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  filterSummaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 6,
    marginLeft: 'auto',
  },
  filterSummaryText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  cancelSelectButton: {
    padding: 8,
    marginLeft: 8,
  },
  filterSummaryContent: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryRowHighlight: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderBottomWidth: 0,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryValueHighlight: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  metricColumn: {
    width: 110,
  },
  headerSubtext: {
    fontSize: 10,
    color: '#E3F2FD',
    marginTop: 2,
  },
  metricsNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  metricsNoteText: {
    fontSize: 13,
    color: '#F57C00',
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
});