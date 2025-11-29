// Location: /apps/assessment/src/screens/Reports/ReportsScreen.js
// Export Data Screen - Flexible filtering and data export

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/common/Header';
import SearchBar from '../../components/common/SearchBar';
import Dropdown from '../../components/common/Dropdown';
import { COLORS, AGE_GROUPS, EXPORT_FORMATS, ASSESSMENT_TERMS } from '../../utils/constants';
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
  }, [searchQuery, selectedYear, selectedTerm, selectedSport, selectedAgeGroup, kids, assessments]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load kids
      const allKids = await getAllKids();
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

      // Load assessments (last 2 years)
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear - 2}-01-01`;
      const endDate = `${currentYear + 1}-12-31`;
      const allAssessments = await getAssessmentsByDateRange(startDate, endDate);
      setAssessments(allAssessments);

      // Generate year options (academic years)
      const years = [];
      for (let i = 0; i < 5; i++) {
        const year = currentYear - i;
        years.push({ value: `${year}/${year + 1}`, label: `${year}/${year + 1}` });
      }
      setYearOptions([{ value: 'all', label: 'All Years' }, ...years]);

    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
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

    // Combine kids with their filtered assessments
    const dataWithAssessments = filtered.map(kid => {
      const kidAssessments = relevantAssessments.filter(a => a.kid_id === kid.id);
      return {
        ...kid,
        assessments: kidAssessments,
      };
    }).filter(kid => kid.assessments.length > 0); // Only show kids with matching assessments

    setFilteredData(dataWithAssessments);
  };

  const handleExport = () => {
    if (filteredData.length === 0) {
      Alert.alert('No Data', 'No data matches your filter criteria');
      return;
    }

    Alert.alert(
      'Export Data',
      `Export ${filteredData.length} records as ${selectedFormat.toUpperCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => performExport(),
        },
      ]
    );
  };

  const performExport = () => {
    // TODO: Implement actual export logic based on format
    Alert.alert(
      'Export Complete',
      `Exported ${filteredData.length} records as ${selectedFormat.toUpperCase()}`
    );
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

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Export Data"
          leftIcon="←"
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Export Data"
        subtitle={`${filteredData.length} records found`}
        leftIcon="←"
        onLeftPress={() => navigation.goBack()}
      />

      <View style={styles.contentWrapper}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by kid name..."
          />
        </View>

        {/* Filter Dropdowns */}
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Filter Data</Text>

          <Dropdown
            label="Academic Year"
            options={yearOptions}
            value={selectedYear}
            onSelect={setSelectedYear}
          />

          <Dropdown
            label="Term"
            options={termOptions}
            value={selectedTerm}
            onSelect={setSelectedTerm}
          />

          <Dropdown
            label="Sport"
            options={sportOptions}
            value={selectedSport}
            onSelect={setSelectedSport}
          />

          <Dropdown
            label="Age Group"
            options={ageGroupOptions}
            value={selectedAgeGroup}
            onSelect={setSelectedAgeGroup}
          />

          <Dropdown
            label="Export Format"
            options={formatOptions}
            value={selectedFormat}
            onSelect={setSelectedFormat}
          />
        </View>

        {/* Data Preview Table */}
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Data Preview</Text>
          
          {filteredData.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>No data matches your filters</Text>
              <Text style={styles.emptyHint}>Try adjusting your filter criteria</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                {/* Table Header */}
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.tableHeader, styles.nameColumn]}>
                    Name
                  </Text>
                  <Text style={[styles.tableCell, styles.tableHeader, styles.ageColumn]}>
                    Age
                  </Text>
                  <Text style={[styles.tableCell, styles.tableHeader, styles.sportColumn]}>
                    Sport
                  </Text>
                  <Text style={[styles.tableCell, styles.tableHeader, styles.termColumn]}>
                    Term
                  </Text>
                  <Text style={[styles.tableCell, styles.tableHeader, styles.assessmentsColumn]}>
                    Assessments
                  </Text>
                </View>

                {/* Table Rows */}
                {filteredData.map((kid, index) => (
                  <View
                    key={kid.id}
                    style={[
                      styles.tableRow,
                      index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                    ]}
                  >
                    <Text style={[styles.tableCell, styles.nameColumn]}>
                      {kid.name}
                    </Text>
                    <Text style={[styles.tableCell, styles.ageColumn]}>
                      {kid.age}
                    </Text>
                    <Text style={[styles.tableCell, styles.sportColumn]}>
                      {kid.assessments.length > 0
                        ? sports.find(s => s.id === kid.assessments[0].sport_id)?.name || 'Multiple'
                        : 'N/A'}
                    </Text>
                    <Text style={[styles.tableCell, styles.termColumn]}>
                      {kid.assessments.length > 0
                        ? kid.assessments[0].term
                        : 'N/A'}
                    </Text>
                    <Text style={[styles.tableCell, styles.assessmentsColumn]}>
                      {kid.assessments.length}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* Export Button */}
        <TouchableOpacity
          style={[
            styles.exportButton,
            filteredData.length === 0 && styles.exportButtonDisabled,
          ]}
          onPress={handleExport}
          disabled={filteredData.length === 0}
        >
          <Ionicons
            name="download-outline"
            size={20}
            color={filteredData.length === 0 ? COLORS.textSecondary : COLORS.white}
          />
          <Text
            style={[
              styles.exportButtonText,
              filteredData.length === 0 && styles.exportButtonTextDisabled,
            ]}
          >
            Export as {selectedFormat.toUpperCase()}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
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
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
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
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginVertical: 24,
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
  exportButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  bottomPadding: {
    height: 32,
  },
});