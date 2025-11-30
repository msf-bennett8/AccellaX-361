// Location: /apps/assessment/src/screens/Reports/ExportDetailScreen.js
// Export Detail Screen - Interactive preview with dynamic sport-specific columns

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
import * as Print from 'expo-print';
import * as IntentLauncher from 'expo-intent-launcher';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Header from '../../components/common/Header';
import SearchBar from '../../components/common/SearchBar';
import { COLORS, AGE_GROUPS, ASSESSMENT_TERMS } from '../../utils/constants';

export default function ExportDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    filteredData: initialData = [],
    filters = {},
    format = 'csv',
    sports = [],
    metrics: initialMetrics = [],
  } = route.params || {};

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [allKidsData, setAllKidsData] = useState(initialData); // Store all kids
  const [filteredData, setFilteredData] = useState({ kids: initialData, metrics: initialMetrics });
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filter state
  const [selectedYear, setSelectedYear] = useState(filters.year || 'all');
  const [selectedTerm, setSelectedTerm] = useState(filters.term || 'all');
  const [selectedSport, setSelectedSport] = useState(filters.sport || 'all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(filters.ageGroup || 'all');
  const [selectedFormat, setSelectedFormat] = useState(format || 'csv');
  const [selectedSort, setSelectedSort] = useState('none');

  // Options
  const [yearOptions, setYearOptions] = useState([]);
  const [termOptions, setTermOptions] = useState([]);
  const [ageGroupOptions, setAgeGroupOptions] = useState([]);

  // Dropdown visibility state
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showTermDropdown, setShowTermDropdown] = useState(false);
  const [showSportDropdown, setShowSportDropdown] = useState(false);
  const [showAgeDropdown, setShowAgeDropdown] = useState(false);
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Initialize data and calculate dynamic options
  useEffect(() => {
    console.log('🔄 ExportDetailScreen - Initializing with data:', initialData.length, 'kids');
    setAllKidsData(initialData);
    
    // Calculate year options from actual data
    const years = new Set();
    initialData.forEach(kid => {
      const assessment = kid.assessments?.[0] || kid.latestAssessment;
      if (assessment?.year && assessment.year !== 'null' && assessment.year !== null) {
        years.add(assessment.year);
      }
    });
    
    const sortedYears = Array.from(years).sort((a, b) => {
      const yearA = parseInt(a.split('/')[0]);
      const yearB = parseInt(b.split('/')[0]);
      return yearB - yearA;
    });
    
    setYearOptions([
      { value: 'all', label: 'All Years' },
      ...sortedYears.map(y => ({ value: y, label: y }))
    ]);
    
    console.log('📅 Year options calculated:', sortedYears);

    // Calculate term options from data
    const terms = new Set();
    initialData.forEach(kid => {
      const assessment = kid.assessments?.[0] || kid.latestAssessment;
      if (assessment?.term) {
        terms.add(assessment.term);
      }
    });
    
    setTermOptions([
      { value: 'all', label: 'All Terms' },
      ...Array.from(terms).sort().map(t => ({ value: t, label: t }))
    ]);

    // Calculate age group options from data
    const ageGroups = new Set();
    initialData.forEach(kid => {
      if (kid.age_group) {
        ageGroups.add(kid.age_group);
      }
    });
    
    setAgeGroupOptions([
      { value: 'all', label: 'All Age Groups' },
      ...Array.from(ageGroups).sort().map(ag => ({ value: ag, label: `${ag} years` }))
    ]);

    // Initial filter application
    applyFilters();
  }, []);

  // Re-apply filters when any filter changes
  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedYear, selectedTerm, selectedSport, selectedAgeGroup, selectedSort]);

  // Apply all filters
  const applyFilters = async () => {
    console.log('🔍 ExportDetailScreen - Applying filters...');
    console.log('📊 Filters:', { selectedYear, selectedTerm, selectedSport, selectedAgeGroup, selectedSort });
    
    let filtered = [...allKidsData];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(kid =>
        kid.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log('🔎 After search:', filtered.length);
    }

    // Year filter
    if (selectedYear !== 'all') {
      filtered = filtered.filter(kid => {
        const assessment = kid.assessments?.[0] || kid.latestAssessment;
        return assessment?.year === selectedYear;
      });
      console.log('📅 After year filter:', filtered.length);
    }

    // Term filter
    if (selectedTerm !== 'all') {
      filtered = filtered.filter(kid => {
        const assessment = kid.assessments?.[0] || kid.latestAssessment;
        return assessment?.term === selectedTerm;
      });
      console.log('📆 After term filter:', filtered.length);
    }

    // Sport filter
    if (selectedSport !== 'all') {
      filtered = filtered.filter(kid => {
        const assessment = kid.assessments?.[0] || kid.latestAssessment;
        return assessment?.sport_id === selectedSport;
      });
      console.log('⚽ After sport filter:', filtered.length);
    }

    // Age group filter
    if (selectedAgeGroup !== 'all') {
      filtered = filtered.filter(kid => kid.age_group === selectedAgeGroup);
      console.log('👶 After age group filter:', filtered.length);
    }

    // Get metrics for selected sport
    const { getMetricsBySport } = await import('../../config/metrics');
    const sportMetrics = selectedSport !== 'all' 
      ? getMetricsBySport(selectedSport)
      : [];
    
    console.log('📊 Loaded metrics for sport:', sportMetrics.length);

    // Apply sorting
    if (selectedSort !== 'none') {
      filtered = applySorting(filtered, selectedSort);
      console.log('🔀 After sorting:', selectedSort);
    }

    console.log('✅ Final filtered data:', filtered.length, 'kids');
    setFilteredData({ kids: filtered, metrics: sportMetrics });
  };

  // Apply sorting logic
  const applySorting = (data, sortType) => {
    const sorted = [...data];
    
    switch (sortType) {
      case 'a_z':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'z_a':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'high_performer':
        // Sort by average metric values (descending)
        return sorted.sort((a, b) => {
          const avgA = calculateAverageMetric(a);
          const avgB = calculateAverageMetric(b);
          return avgB - avgA;
        });
      case 'low_performer':
        // Sort by average metric values (ascending)
        return sorted.sort((a, b) => {
          const avgA = calculateAverageMetric(a);
          const avgB = calculateAverageMetric(b);
          return avgA - avgB;
        });
      default:
        return sorted;
    }
  };

  // Calculate average metric value for sorting
  const calculateAverageMetric = (kid) => {
    const values = Object.values(kid.metricValues || {}).filter(v => v != null);
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + parseFloat(val || 0), 0);
    return sum / values.length;
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
    setSelectedRecords(
      selectedRecords.length === allKids.length
        ? []
        : allKids.map(k => k.id)
    );
  };

  // Format metric value for display
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

  // Format metric value for CSV export
  const formatMetricValueForCSV = (metric, value) => {
    if (!value) return '--';

    switch (metric.type) {
      case 'numeric':
        return `${parseFloat(value).toFixed(1)}`;
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

  // Generate CSV with dynamic sport-specific columns
  const generateCSV = () => {
    const dataToExport = selectedRecords.length > 0
      ? filteredData.kids.filter(k => selectedRecords.includes(k.id))
      : filteredData.kids;

    const metrics = filteredData.metrics || [];

    // CSV Header - Dynamic metric columns
    let csv = 'Name,Age,Age Group,Gender,Sponsorship,Program,Sport,Assessment Date,Term,Year';

    // Add metric columns
    metrics.forEach(metric => {
      csv += `,${metric.name}${metric.unit ? ' (' + metric.unit + ')' : ''}`;
    });

    csv += '\n';

    // CSV Rows - One row per kid with all metric values
    dataToExport.forEach(kid => {
      const assessment = kid.assessments?.[0] || kid.latestAssessment || {};

      // Basic info
      csv += `"${kid.name}",${kid.age},"${kid.age_group || 'N/A'}","${kid.gender || 'N/A'}","${kid.sponsorshipType === 'SC' ? 'Scholarship' : 'Self-Sponsored'}","${kid.programType === 'ELT' ? 'Elite' : 'Weekend Warrior'}","${selectedSport || 'N/A'}","${assessment.assessment_date || 'N/A'}","${assessment.term || 'N/A'}","${assessment.year || 'N/A'}"`;

      // Add metric values in order
      metrics.forEach(metric => {
        const value = kid.metricValues?.[metric.id];
        const formattedValue = formatMetricValueForCSV(metric, value);
        csv += `,${formattedValue}`;
      });

      csv += '\n';
    });

    return csv;
  };

  // Generate Real Excel .xlsx File
  const generateExcel = async () => {
    const dataToExport = selectedRecords.length > 0
      ? filteredData.kids.filter(k => selectedRecords.includes(k.id))
      : filteredData.kids;

    const metrics = filteredData.metrics || [];

    // Prepare headers
    const headers = ['Name', 'Age', 'Age Group', 'Gender', 'Sponsorship', 'Program', 'Sport', 'Assessment Date', 'Term', 'Year'];
    metrics.forEach(metric => {
      headers.push(`${metric.name}${metric.unit ? ' (' + metric.unit + ')' : ''}`);
    });

    // Prepare rows
    const rows = dataToExport.map(kid => {
      const assessment = kid.assessments?.[0] || kid.latestAssessment || {};
      
      const row = [
        kid.name,
        kid.age,
        kid.age_group || 'N/A',
        kid.gender || 'N/A',
        kid.sponsorshipType === 'SC' ? 'Scholarship' : 'Self-Sponsored',
        kid.programType === 'ELT' ? 'Elite' : 'Weekend Warrior',
        selectedSport || 'N/A',
        assessment.assessment_date || 'N/A',
        assessment.term || 'N/A',
        assessment.year || 'N/A',
      ];

      // Add metric values
      metrics.forEach(metric => {
        const value = kid.metricValues?.[metric.id];
        row.push(formatMetricValueForCSV(metric, value));
      });

      return row;
    });

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // Name
      { wch: 6 },  // Age
      { wch: 12 }, // Age Group
      { wch: 10 }, // Gender
      { wch: 15 }, // Sponsorship
      { wch: 15 }, // Program
      { wch: 15 }, // Sport
      { wch: 15 }, // Assessment Date
      { wch: 8 },  // Term
      { wch: 12 }, // Year
      ...metrics.map(() => ({ wch: 12 })), // Metric columns
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Assessments');

    // Generate binary Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    return excelBuffer;
  };

  // Generate Real PDF File using jsPDF (No HTML rendering)
  const generatePDF = async () => {
    if (Platform.OS === 'web') {
      // Web: Use jsPDF
      const dataToExport = selectedRecords.length > 0
        ? filteredData.kids.filter(k => selectedRecords.includes(k.id))
        : filteredData.kids;

      const metrics = filteredData.metrics || [];

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Header
      doc.setFontSize(18);
      doc.setTextColor(33, 150, 243);
      doc.text('AccellaX 361° - Assessment Export Report', 148, 15, { align: 'center' });

      // Info Section
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      let yPos = 25;
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPos);
      yPos += 5;
      doc.text(`Total Records: ${dataToExport.length}`, 14, yPos);
      yPos += 5;
      
      if (selectedYear !== 'all') {
        doc.text(`Year: ${selectedYear}`, 14, yPos);
        yPos += 5;
      }
      if (selectedTerm !== 'all') {
        doc.text(`Term: ${selectedTerm}`, 14, yPos);
        yPos += 5;
      }
      if (selectedSport !== 'all') {
        doc.text(`Sport: ${sports.find(s => s.id === selectedSport)?.name || selectedSport}`, 14, yPos);
        yPos += 5;
      }

      // Table Headers
      const headers = [
        'Name', 'Age', 'Age Group', 'Gender', 'Sponsorship', 'Program',
        ...metrics.slice(0, 8).map(m => `${m.name}${m.unit ? `\n(${m.unit})` : ''}`)
      ];

      // Table Rows
      const rows = dataToExport.map(kid => {
        return [
          kid.name,
          kid.age,
          kid.age_group || 'N/A',
          kid.gender || 'N/A',
          kid.sponsorshipType === 'SC' ? 'Scholarship' : 'Self-Spon.',
          kid.programType === 'ELT' ? 'Elite' : 'Weekend',
          ...metrics.slice(0, 8).map(m => formatMetricValue(m, kid.metricValues?.[m.id]))
        ];
      });

      // Generate Table
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: yPos + 5,
        theme: 'striped',
        headStyles: {
          fillColor: [33, 150, 243],
          textColor: 255,
          fontSize: 8,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 7,
          textColor: 50
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { top: 10, left: 14, right: 14 },
        styles: {
          cellPadding: 2,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        columnStyles: {
          0: { cellWidth: 30 }, // Name
          1: { cellWidth: 12 }, // Age
          2: { cellWidth: 18 }, // Age Group
          3: { cellWidth: 15 }, // Gender
          4: { cellWidth: 20 }, // Sponsorship
          5: { cellWidth: 18 }, // Program
        }
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          'AccellaX 361° Sports Academy - Confidential',
          148,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      return doc;
    } else {
      // Mobile: Use expo-print with HTML
      const dataToExport = selectedRecords.length > 0
        ? filteredData.kids.filter(k => selectedRecords.includes(k.id))
        : filteredData.kids;

      const metrics = filteredData.metrics || [];

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              @page { size: A4 landscape; margin: 10mm; }
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, sans-serif; padding: 20px; background: white; }
              h1 { color: #2196F3; font-size: 18px; text-align: center; margin-bottom: 15px; }
              .info { font-size: 9px; color: #666; margin-bottom: 15px; }
              .info p { margin: 3px 0; }
              table { width: 100%; border-collapse: collapse; font-size: 8px; }
              th { background: #2196F3; color: white; padding: 8px 4px; text-align: left; font-weight: bold; }
              td { padding: 6px 4px; border-bottom: 1px solid #ddd; }
              tr:nth-child(even) { background: #f9f9f9; }
              .footer { text-align: center; font-size: 8px; color: #999; margin-top: 15px; }
            </style>
          </head>
          <body>
            <h1>AccellaX 361° - Assessment Export Report</h1>
            <div class="info">
              <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Total Records:</strong> ${dataToExport.length}</p>
              ${selectedYear !== 'all' ? `<p><strong>Year:</strong> ${selectedYear}</p>` : ''}
              ${selectedTerm !== 'all' ? `<p><strong>Term:</strong> ${selectedTerm}</p>` : ''}
              ${selectedSport !== 'all' ? `<p><strong>Sport:</strong> ${sports.find(s => s.id === selectedSport)?.name || selectedSport}</p>` : ''}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Age</th><th>Age Group</th><th>Gender</th><th>Sponsor</th><th>Program</th>
                  ${metrics.slice(0, 8).map(m => `<th>${m.name}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${dataToExport.map(kid => `
                  <tr>
                    <td>${kid.name}</td>
                    <td>${kid.age}</td>
                    <td>${kid.age_group || 'N/A'}</td>
                    <td>${kid.gender || 'N/A'}</td>
                    <td>${kid.sponsorshipType === 'SC' ? 'Schol.' : 'Self'}</td>
                    <td>${kid.programType === 'ELT' ? 'Elite' : 'WW'}</td>
                    ${metrics.slice(0, 8).map(m => `<td>${formatMetricValue(m, kid.metricValues?.[m.id])}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="footer">AccellaX 361° Sports Academy - Confidential</div>
          </body>
        </html>
      `;

      return html;
    }
  };

  // Generate PDF/Excel (simplified text format)
  const generatePDFText = () => {
    const dataToExport = selectedRecords.length > 0
      ? filteredData.kids.filter(k => selectedRecords.includes(k.id))
      : filteredData.kids;

    const metrics = filteredData.metrics || [];

    let text = `AccellaX 361° - Assessment Export Report\n`;
    text += `${'='.repeat(60)}\n\n`;
    text += `Generated: ${new Date().toLocaleString()}\n`;
    text += `Format: ${selectedFormat.toUpperCase()}\n`;
    text += `Total Records: ${dataToExport.length}\n\n`;

    if (selectedYear && selectedYear !== 'all') {
      text += `Year Filter: ${selectedYear}\n`;
    }
    if (selectedTerm && selectedTerm !== 'all') {
      text += `Term Filter: ${selectedTerm}\n`;
    }
    if (selectedSport && selectedSport !== 'all') {
      text += `Sport Filter: ${sports.find(s => s.id === selectedSport)?.name || selectedSport}\n`;
    }
    if (selectedAgeGroup && selectedAgeGroup !== 'all') {
      text += `Age Group Filter: ${selectedAgeGroup}\n`;
    }

    text += `\n${'='.repeat(60)}\n\n`;

    dataToExport.forEach((kid, index) => {
      text += `${index + 1}. ${kid.name}\n`;
      text += `   Age: ${kid.age} | Age Group: ${kid.age_group || 'N/A'}\n`;
      text += `   Sport: ${selectedSport || 'N/A'}\n`;

      if (metrics.length > 0) {
        text += `   Metrics:\n`;
        metrics.forEach(metric => {
          const value = kid.metricValues?.[metric.id];
          const formatted = formatMetricValue(metric, value);
          text += `      - ${metric.name}: ${formatted}\n`;
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

  // State for modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle Export (Download File + Open in External App)
  const handleExport = async () => {
    if (!filteredData.kids || filteredData.kids.length === 0) {
      setErrorMessage('No data available to export');
      setShowErrorModal(true);
      return;
    }

    setExporting(true);

    try {
      let fileUri = '';
      let filename = '';
      let mimeType = '';

      if (selectedFormat === 'csv') {
        // CSV Export
        const csvContent = generateCSV();
        filename = `AccellaX_Export_${Date.now()}.csv`;
        mimeType = 'text/csv';

        if (Platform.OS === 'web') {
          const blob = new Blob([csvContent], { type: mimeType });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          fileUri = `${FileSystem.documentDirectory}${filename}`;
          await FileSystem.writeAsStringAsync(fileUri, csvContent, {
            encoding: FileSystem.EncodingType.UTF8,
          });
        }

      } else if (selectedFormat === 'excel') {
        // Real Excel Export
        const excelBase64 = await generateExcel();
        filename = `AccellaX_Export_${Date.now()}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        if (Platform.OS === 'web') {
          const link = document.createElement('a');
          link.href = `data:${mimeType};base64,${excelBase64}`;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          fileUri = `${FileSystem.documentDirectory}${filename}`;
          await FileSystem.writeAsStringAsync(fileUri, excelBase64, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }

      } else if (selectedFormat === 'pdf') {
        // Real PDF Export
        filename = `AccellaX_Export_${Date.now()}.pdf`;
        mimeType = 'application/pdf';

        if (Platform.OS === 'web') {
          // Web: Use jsPDF (returns doc object)
          const pdfDoc = await generatePDF();
          pdfDoc.save(filename);
          // No need for fileUri on web
        } else {
          // Mobile: Use expo-print (returns HTML)
          const htmlContent = await generatePDF();
          const printResult = await Print.printToFileAsync({ html: htmlContent });
          if (printResult && printResult.uri) {
            fileUri = `${FileSystem.documentDirectory}${filename}`;
            await FileSystem.moveAsync({
              from: printResult.uri,
              to: fileUri,
            });
          } else {
            throw new Error('PDF generation failed');
          }
        }
      }

      // ✅ Mobile: Open file in external app
      if (Platform.OS !== 'web' && fileUri) {
        if (Platform.OS === 'android') {
          const contentUri = await FileSystem.getContentUriAsync(fileUri);
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1,
            type: mimeType,
          });
        } else {
          // iOS: Use Sharing
          await Sharing.shareAsync(fileUri, {
            mimeType: mimeType,
            dialogTitle: 'Open with...',
          });
        }
      }

      setSuccessMessage(`File saved and opened: ${filename}`);
      setShowSuccessModal(true);

    } catch (error) {
      console.error('Export error:', error);
      setErrorMessage(`Failed to export: ${error.message}`);
      setShowErrorModal(true);
    } finally {
      setExporting(false);
    }
  };

  // Handle Share (Native Share Sheet with Actual Files)
  const handleShare = async () => {
    if (!filteredData.kids || filteredData.kids.length === 0) {
      setErrorMessage('No data available to share');
      setShowErrorModal(true);
      return;
    }

    try {
      let fileUri = '';
      let filename = '';
      let mimeType = '';

      if (selectedFormat === 'csv') {
        const csvContent = generateCSV();
        filename = `AccellaX_Export_${Date.now()}.csv`;
        mimeType = 'text/csv';
        fileUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, csvContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });

      } else if (selectedFormat === 'excel') {
        const excelBase64 = await generateExcel();
        filename = `AccellaX_Export_${Date.now()}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, excelBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });

      } else if (selectedFormat === 'pdf') {
        filename = `AccellaX_Export_${Date.now()}.pdf`;
        mimeType = 'application/pdf';
        
        // Mobile always uses expo-print
        const htmlContent = await generatePDF();
        const printResult = await Print.printToFileAsync({ html: htmlContent });
        if (printResult && printResult.uri) {
          fileUri = `${FileSystem.documentDirectory}${filename}`;
          await FileSystem.moveAsync({
            from: printResult.uri,
            to: fileUri,
          });
        } else {
          throw new Error('PDF generation failed');
        }
      }

      if (Platform.OS === 'web') {
        // Web: Trigger download
        if (selectedFormat === 'csv') {
          const csvContent = generateCSV();
          const blob = new Blob([csvContent], { type: mimeType });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else if (selectedFormat === 'excel') {
          const excelBase64 = await generateExcel();
          const link = document.createElement('a');
          link.href = `data:${mimeType};base64,${excelBase64}`;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          // Web PDF: Use jsPDF
          const pdfDoc = await generatePDF();
          pdfDoc.save(filename);
        }
        setSuccessMessage('File downloaded successfully!');
        setShowSuccessModal(true);
      } else {
        // Mobile: Open native share sheet with actual file
        await Sharing.shareAsync(fileUri, {
          mimeType: mimeType,
          dialogTitle: `Share ${selectedFormat.toUpperCase()} File`,
          UTI: mimeType,
        });
        setSuccessMessage('File shared successfully!');
        setShowSuccessModal(true);
      }

    } catch (error) {
      console.error('Share error:', error);
      setErrorMessage(`Failed to share: ${error.message}`);
      setShowErrorModal(true);
    }
  };

  // Copy to Clipboard
  const handleCopyToClipboard = async () => {
    try {
      const content = selectedFormat === 'csv' ? generateCSV() : generatePDFText();
      await Clipboard.setStringAsync(content);
      setSuccessMessage('Data copied to clipboard!');
      setShowSuccessModal(true);
    } catch (error) {
      setErrorMessage('Failed to copy to clipboard');
      setShowErrorModal(true);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Export Data"
        subtitle={`${filteredData.kids?.length || 0} records • ${selectedFormat.toUpperCase()}`}
        leftIcon="←"
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
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

        {/* Filter Chips - Horizontal Scroll */}
        <View style={styles.filtersContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsScrollContainer}
          >
            {/* Academic Year Dropdown */}
            <TouchableOpacity 
              style={styles.filterChipButton}
              onPress={() => setShowYearDropdown(!showYearDropdown)}
            >
              <Text style={styles.filterChipButtonText}>
                {selectedYear === 'all' ? 'Academic Year' : selectedYear}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.white} />
            </TouchableOpacity>

            {/* Term Dropdown */}
            <TouchableOpacity 
              style={styles.filterChipButton}
              onPress={() => setShowTermDropdown(!showTermDropdown)}
            >
              <Text style={styles.filterChipButtonText}>
                {selectedTerm === 'all' ? 'Term' : selectedTerm}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.white} />
            </TouchableOpacity>

            {/* Sport Dropdown */}
            <TouchableOpacity 
              style={styles.filterChipButton}
              onPress={() => setShowSportDropdown(!showSportDropdown)}
            >
              <Text style={styles.filterChipButtonText}>
                {selectedSport === 'all' ? 'Sport' : sports.find(s => s.id === selectedSport)?.name || selectedSport}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.white} />
            </TouchableOpacity>

            {/* Age Group Dropdown */}
            <TouchableOpacity 
              style={styles.filterChipButton}
              onPress={() => setShowAgeDropdown(!showAgeDropdown)}
            >
              <Text style={styles.filterChipButtonText}>
                {selectedAgeGroup === 'all' ? 'Age Group' : `${selectedAgeGroup} years`}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.white} />
            </TouchableOpacity>

            {/* Export Format Dropdown */}
            <TouchableOpacity 
              style={styles.filterChipButton}
              onPress={() => setShowFormatDropdown(!showFormatDropdown)}
            >
              <Text style={styles.filterChipButtonText}>
                {selectedFormat.toUpperCase()}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.white} />
            </TouchableOpacity>

            {/* Sort Dropdown */}
            <TouchableOpacity 
              style={styles.filterChipButton}
              onPress={() => setShowSortDropdown(!showSortDropdown)}
            >
              <Text style={styles.filterChipButtonText}>
                {selectedSort === 'none' ? 'Sort By' : selectedSort}
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
              {[
                { value: 'all', label: 'All Sports' },
                ...sports.map(s => ({ value: s.id, label: s.name })),
              ].map(option => (
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
              {[
                { value: 'csv', label: 'CSV Spreadsheet' },
                { value: 'pdf', label: 'PDF Document' },
                { value: 'excel', label: 'Excel Spreadsheet' },
              ].map(option => (
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
              {[
                { value: 'none', label: 'No Sort' },
                { value: 'high_performer', label: 'High Performer' },
                { value: 'low_performer', label: 'Low Performer' },
                { value: 'a_z', label: 'A-Z' },
                { value: 'z_a', label: 'Z-A' },
              ].map(option => (
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

        {/* Active Filters Summary */}
        <View style={styles.filtersSection}>
          <Text style={styles.filtersLabel}>Active Filters:</Text>
          <View style={styles.filterChips}>
            {selectedSport && selectedSport !== 'all' && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>
                  Sport: {sports.find(s => s.id === selectedSport)?.name || selectedSport}
                </Text>
              </View>
            )}
            {selectedYear && selectedYear !== 'all' && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>Year: {selectedYear}</Text>
              </View>
            )}
            {selectedTerm && selectedTerm !== 'all' && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>Term: {selectedTerm}</Text>
              </View>
            )}
            {selectedAgeGroup && selectedAgeGroup !== 'all' && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>Age: {selectedAgeGroup}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Select Mode Controls */}
        <View style={styles.selectAllContainer}>
          {!isSelectMode ? (
            <TouchableOpacity
              onPress={() => setIsSelectMode(true)}
              style={styles.selectModeButton}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#2196F3" />
              <Text style={styles.selectModeText}>Select</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity onPress={selectAll} style={styles.selectAllButton}>
                <Text style={styles.selectAllText}>
                  {selectedRecords.length === filteredData.kids?.length ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.selectedCount}>
                {selectedRecords.length} of {filteredData.kids?.length || 0} selected
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

        {/* Data Preview Table */}
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Data Preview</Text>

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

                {/* Dynamic Metric Columns */}
                {(filteredData.metrics || []).slice(0, 8).map((metric) => (
                  <View key={metric.id} style={[styles.tableCell, styles.tableHeader, styles.metricColumn]}>
                    <Text style={styles.tableHeaderText} numberOfLines={2}>
                      {metric.name}
                    </Text>
                    {metric.unit && (
                      <Text style={styles.headerSubtext}>{metric.unit}</Text>
                    )}
                  </View>
                ))}
              </View>

              {/* Table Rows */}
              {(filteredData.kids || []).map((kid, index) => {
                const isSelected = selectedRecords.includes(kid.id);

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

                    {/* Dynamic Metric Values */}
                    {(filteredData.metrics || []).slice(0, 8).map((metric) => (
                      <Text key={metric.id} style={[styles.tableCell, styles.metricColumn]}>
                        {formatMetricValue(metric, kid.metricValues?.[metric.id])}
                      </Text>
                    ))}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Metrics Note */}
          {(filteredData.metrics || []).length > 8 && (
            <View style={styles.metricsNote}>
              <Ionicons name="information-circle" size={16} color="#FF9800" />
              <Text style={styles.metricsNoteText}>
                Showing first 8 of {filteredData.metrics.length} metrics. Full data available in export.
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopyToClipboard}
            disabled={exporting}
          >
            <Ionicons name="copy" size={22} color="#4CAF50" />
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            disabled={exporting}
          >
            <Ionicons name="share-social" size={22} color="#2196F3" />
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Download FAB */}
        <TouchableOpacity
          style={[styles.fab, exporting && styles.fabDisabled]}
          onPress={handleExport}
          disabled={exporting}
          activeOpacity={0.8}
        >
          {exporting ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons name="cloud-download" size={32} color={COLORS.white} />
          )}
        </TouchableOpacity>

        {/* Success Modal */}
        {showSuccessModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
                <Text style={styles.modalTitle}>Success!</Text>
              </View>

              <Text style={styles.modalMessage}>{successMessage}</Text>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowSuccessModal(false)}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Error Modal */}
        {showErrorModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Ionicons name="close-circle" size={64} color="#FF5252" />
                <Text style={styles.modalTitle}>Error</Text>
              </View>

              <Text style={styles.modalMessage}>{errorMessage}</Text>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonError]}
                onPress={() => setShowErrorModal(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
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
  content: {
    flex: 1,
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
  filterChipsScrollContainer: {
    gap: 8,
    paddingRight: 16,
  },
  filterChipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    gap: 8,
  },
  filterChipButtonText: {
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
  filtersSection: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterChipText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
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
  cancelSelectButton: {
    padding: 8,
    marginLeft: 8,
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
  metricColumn: {
    width: 110,
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
    borderColor: '#2196F3',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
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
  copyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
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
  fabDisabled: {
    backgroundColor: COLORS.border,
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
  modalButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonError: {
    backgroundColor: '#FF5252',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});