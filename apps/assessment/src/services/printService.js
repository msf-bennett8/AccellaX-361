// Location: /apps/assessment/src/services/printService.js
// Generate printable HTML and PDF reports

import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatMetricValue, formatPercentage } from '../utils/helpers';
import { COLORS } from '../utils/constants';

/**
 * Generate printable HTML for assessment report
 * @param {Object} assessmentData - Assessment with kid, sport, results, metrics
 * @returns {string} HTML string
 */
export const generatePrintableHTML = (assessmentData) => {
  const { kid, sport, results, assessment, metrics } = assessmentData;

  // Group results by category
  const categorizedResults = {};
  results.forEach(result => {
    const metric = metrics?.find(m => m.id === result.metric_id);
    if (metric) {
      const category = metric.category || 'Other';
      if (!categorizedResults[category]) {
        categorizedResults[category] = [];
      }
      categorizedResults[category].push({ ...result, metric });
    }
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Assessment Report - ${kid?.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #212121;
      background: white;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      .no-print {
        display: none !important;
      }
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid ${COLORS.primary};
    }
    
    .header h1 {
      font-size: 28px;
      color: ${COLORS.primary};
      margin-bottom: 10px;
    }
    
    .header .subtitle {
      font-size: 16px;
      color: #757575;
    }
    
    .kid-info {
      background: #F5F5F5;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .kid-info h2 {
      font-size: 24px;
      color: #212121;
      margin-bottom: 15px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
    }
    
    .info-label {
      font-size: 12px;
      color: #757575;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .info-value {
      font-size: 16px;
      font-weight: 600;
      color: #212121;
    }
    
    .results-section {
      margin-bottom: 30px;
    }
    
    .category-title {
      font-size: 20px;
      font-weight: bold;
      color: ${COLORS.primary};
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #E0E0E0;
    }
    
    .results-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    .results-table th {
      background: #F5F5F5;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
      color: #757575;
      border-bottom: 2px solid #E0E0E0;
    }
    
    .results-table td {
      padding: 12px;
      border-bottom: 1px solid #E0E0E0;
      font-size: 15px;
    }
    
    .results-table tr:last-child td {
      border-bottom: none;
    }
    
    .value-cell {
      font-weight: 600;
      color: ${COLORS.primary};
    }
    
    .percentile-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
    }
    
    .percentile-excellent {
      background: #E8F5E9;
      color: #4CAF50;
    }
    
    .percentile-good {
      background: #E3F2FD;
      color: #2196F3;
    }
    
    .percentile-fair {
      background: #FFF3E0;
      color: #FF9800;
    }
    
    .percentile-poor {
      background: #FFEBEE;
      color: #F44336;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #E0E0E0;
      text-align: center;
      color: #757575;
      font-size: 12px;
    }
    
    .qr-code {
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>AccellaX 361° Assessment Report</h1>
    <div class="subtitle">${sport?.name || 'Assessment'} • ${new Date(assessment?.assessment_date || Date.now()).toLocaleDateString()}</div>
  </div>
  
  <div class="kid-info">
    <h2>${kid?.name || 'Athlete'}</h2>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Age</span>
        <span class="info-value">${kid?.age || 'N/A'} years</span>
      </div>
      <div class="info-item">
        <span class="info-label">Age Group</span>
        <span class="info-value">${kid?.age_group || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Sport</span>
        <span class="info-value">${sport?.name || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Assessment Date</span>
        <span class="info-value">${new Date(assessment?.assessment_date || Date.now()).toLocaleDateString()}</span>
      </div>
      ${assessment?.term ? `
      <div class="info-item">
        <span class="info-label">Term</span>
        <span class="info-value">${assessment.term}</span>
      </div>
      ` : ''}
      ${assessment?.assessor_name ? `
      <div class="info-item">
        <span class="info-label">Assessed By</span>
        <span class="info-value">${assessment.assessor_name}</span>
      </div>
      ` : ''}
    </div>
  </div>
  
  ${Object.entries(categorizedResults).map(([category, categoryResults]) => `
    <div class="results-section">
      <h3 class="category-title">${category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
      <table class="results-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
            <th>Percentile</th>
          </tr>
        </thead>
        <tbody>
          ${categoryResults.map(result => {
            const percentile = result.percentile || 0;
            const percentileClass = 
              percentile >= 75 ? 'percentile-excellent' :
              percentile >= 50 ? 'percentile-good' :
              percentile >= 25 ? 'percentile-fair' : 'percentile-poor';
            
            return `
              <tr>
                <td>${result.metric?.name || 'Unknown'}</td>
                <td class="value-cell">${formatMetricValue(result.value, result.metric?.type, result.metric?.unit)}</td>
                <td>
                  <span class="percentile-badge ${percentileClass}">
                    ${percentile > 0 ? `${percentile}th` : 'N/A'}
                  </span>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `).join('')}
  
  ${assessment?.general_notes ? `
    <div class="results-section">
      <h3 class="category-title">Notes</h3>
      <p style="padding: 15px; background: #F5F5F5; border-radius: 8px; line-height: 1.8;">
        ${assessment.general_notes}
      </p>
    </div>
  ` : ''}
  
  <div class="footer">
    <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    <p>AccellaX 361° • Sports Academy Assessment System</p>
  </div>
</body>
</html>
  `;

  return html;
};

/**
 * Generate progress card HTML (single-page summary)
 * @param {string} kidId - Kid ID
 * @param {Array} assessments - Kid's assessments
 * @returns {string} HTML string
 */
export const generateProgressCard = async (kidId, assessments) => {
  if (!assessments || assessments.length === 0) {
    throw new Error('No assessments found for this kid');
  }

  const latestAssessment = assessments[0]; // Assume sorted by date desc
  const kid = latestAssessment.kid || latestAssessment.kidDetails;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Progress Card - ${kid?.name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      padding: 20px;
      background: white;
    }
    
    .card {
      max-width: 400px;
      margin: 0 auto;
      border: 2px solid ${COLORS.primary};
      border-radius: 12px;
      padding: 20px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .header h1 {
      font-size: 22px;
      color: ${COLORS.primary};
      margin-bottom: 5px;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-top: 20px;
    }
    
    .stat-box {
      background: #F5F5F5;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    
    .stat-label {
      font-size: 12px;
      color: #757575;
      margin-bottom: 5px;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: ${COLORS.primary};
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>${kid?.name}</h1>
      <p>${kid?.age_group} • ${latestAssessment.sportName}</p>
    </div>
    
    <div class="stats">
      <div class="stat-box">
        <div class="stat-label">Total Assessments</div>
        <div class="stat-value">${assessments.length}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Latest</div>
        <div class="stat-value">${new Date(latestAssessment.assessment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return html;
};

/**
 * Print report (mobile/web)
 * @param {string} html - HTML content
 * @returns {Promise<void>}
 */
export const printReport = async (html) => {
  try {
    if (Platform.OS === 'web') {
      // Web: Open print dialog
      const printWindow = window.open('', '_blank');
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      
      console.log('✅ Print dialog opened (web)');
    } else {
      // Mobile: Use expo-print
      await Print.printAsync({ html });
      
      console.log('✅ Print completed (mobile)');
    }
  } catch (error) {
    console.error('❌ Error printing:', error);
    throw error;
  }
};

/**
 * Generate and share PDF
 * @param {string} html - HTML content
 * @param {string} filename - PDF filename
 * @returns {Promise<string>} PDF file URI
 */
export const generateAndSharePDF = async (html, filename = 'assessment_report.pdf') => {
  try {
    if (Platform.OS === 'web') {
      // Web: Use browser print to PDF
      console.log('💡 Web: Use browser Print > Save as PDF');
      await printReport(html);
      return 'printed';
    }
    
    // Mobile: Generate PDF using expo-print
    const { uri } = await Print.printToFileAsync({ html });
    
    console.log('✅ PDF generated:', uri);
    
    // Share PDF
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Assessment Report',
        UTI: 'com.adobe.pdf',
      });
      
      console.log('✅ PDF shared');
    }
    
    return uri;
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    throw error;
  }
};

export default {
  generatePrintableHTML,
  generateProgressCard,
  printReport,
  generateAndSharePDF,
};