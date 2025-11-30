#!/usr/bin/env node
// Location: /apps/assessment/scripts/backfillYears.js
// Standalone script to backfill missing year values
// Run with: node scripts/backfillYears.js

const fs = require('fs');
const path = require('path');

/**
 * Calculate academic year from assessment date
 * Academic year runs from September to August
 * Example: 2024-09-01 to 2025-08-31 = "2024/2025"
 */
const getAcademicYearFromDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  
  // If September or later, academic year is current/next
  // If before September, academic year is previous/current
  if (month >= 9) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
};

/**
 * Find the assessmentWebDB file in user's browser storage
 * This varies by browser and OS
 */
const findWebDBFile = () => {
  const homeDir = require('os').homedir();
  
  // Common paths for different browsers
  const possiblePaths = [
    // Chrome/Chromium on Linux
    path.join(homeDir, '.config', 'google-chrome', 'Default', 'Local Storage', 'leveldb'),
    path.join(homeDir, '.config', 'chromium', 'Default', 'Local Storage', 'leveldb'),
    
    // Chrome on macOS
    path.join(homeDir, 'Library', 'Application Support', 'Google', 'Chrome', 'Default', 'Local Storage', 'leveldb'),
    
    // Chrome on Windows
    path.join(homeDir, 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'Local Storage', 'leveldb'),
    
    // Firefox uses different storage, this is just for Chrome-based browsers
  ];
  
  console.log('🔍 Searching for browser storage in common locations...');
  for (const dbPath of possiblePaths) {
    if (fs.existsSync(dbPath)) {
      console.log(`✅ Found browser storage at: ${dbPath}`);
      return dbPath;
    }
  }
  
  console.log('⚠️  Could not find browser storage automatically.');
  console.log('💡 You can manually provide the path to your assessmentWebDB backup.');
  return null;
};

/**
 * Backfill years from a JSON backup file
 */
const backfillFromBackupFile = (backupPath) => {
  console.log('📂 Reading backup file:', backupPath);
  
  if (!fs.existsSync(backupPath)) {
    console.error('❌ Backup file not found:', backupPath);
    process.exit(1);
  }
  
  const fileContent = fs.readFileSync(backupPath, 'utf8');
  const webDB = JSON.parse(fileContent);
  
  if (!webDB.assessments || !Array.isArray(webDB.assessments)) {
    console.error('❌ Invalid backup file format. Expected { assessments: [...] }');
    process.exit(1);
  }
  
  console.log(`📊 Found ${webDB.assessments.length} assessments`);
  
  let updatedCount = 0;
  const updatedAssessments = webDB.assessments.map(assessment => {
    if (!assessment.year || assessment.year === 'null' || assessment.year === null) {
      const academicYear = getAcademicYearFromDate(assessment.assessment_date);
      console.log(`✅ Backfilling year for assessment ${assessment.id}: ${academicYear} (date: ${assessment.assessment_date})`);
      updatedCount++;
      
      return {
        ...assessment,
        year: academicYear,
        updated_at: new Date().toISOString(),
      };
    }
    return assessment;
  });
  
  webDB.assessments = updatedAssessments;
  
  // Save to new file
  const outputPath = backupPath.replace('.json', '_with_years.json');
  fs.writeFileSync(outputPath, JSON.stringify(webDB, null, 2));
  
  console.log(`\n✅ Migration completed!`);
  console.log(`📊 Updated ${updatedCount} assessments`);
  console.log(`💾 Output saved to: ${outputPath}`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Open your browser's DevTools (F12)`);
  console.log(`   2. Go to Application tab → Local Storage`);
  console.log(`   3. Find "assessmentWebDB" key`);
  console.log(`   4. Replace its value with the contents of: ${outputPath}`);
  console.log(`   5. Refresh the app\n`);
  
  return { success: true, updated: updatedCount };
};

/**
 * Export current database to backup file
 */
const exportDatabaseInstructions = () => {
  console.log('\n📖 HOW TO EXPORT YOUR DATABASE:\n');
  console.log('1. Open your Assessment App in the browser');
  console.log('2. Press F12 to open DevTools');
  console.log('3. Go to the "Application" tab (or "Storage" in Firefox)');
  console.log('4. In the left sidebar, expand "Local Storage"');
  console.log('5. Click on your app\'s URL (e.g., http://localhost:19006)');
  console.log('6. Find the key "assessmentWebDB"');
  console.log('7. Right-click the value → Copy');
  console.log('8. Paste into a new file called "assessmentWebDB_backup.json"');
  console.log('9. Save the file in this directory:');
  console.log(`   ${process.cwd()}\n`);
  console.log('10. Run this script again:\n');
  console.log('    node scripts/backfillYears.js assessmentWebDB_backup.json\n');
};

/**
 * Main execution
 */
const main = () => {
  console.log('🚀 AccellaX Assessment Year Backfill Tool\n');
  console.log('=' .repeat(60));
  console.log('\n');
  
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // No arguments - show instructions
    exportDatabaseInstructions();
    process.exit(0);
  }
  
  const backupPath = args[0];
  
  if (backupPath === '--help' || backupPath === '-h') {
    exportDatabaseInstructions();
    process.exit(0);
  }
  
  // Resolve relative path
  const fullPath = path.resolve(backupPath);
  
  try {
    const result = backfillFromBackupFile(fullPath);
    
    if (result.success) {
      console.log('✅ Done!\n');
      process.exit(0);
    } else {
      console.error('❌ Migration failed\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Make sure the backup file is valid JSON\n');
    process.exit(1);
  }
};

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  getAcademicYearFromDate,
  backfillFromBackupFile,
};