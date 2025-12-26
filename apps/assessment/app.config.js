const fs = require('fs');
const path = require('path');

// Write google-services.json from environment variable if it exists
if (process.env.GOOGLE_SERVICES_JSON && process.env.EAS_BUILD) {
  console.log('========================================');
  console.log('Processing GOOGLE_SERVICES_JSON...');
  
  let content = process.env.GOOGLE_SERVICES_JSON;
  
  try {
    // Try to parse as JSON to validate
    const parsed = JSON.parse(content);
    console.log('✓ Valid JSON');
    console.log('Project ID:', parsed.project_info?.project_id);
    
    // Re-stringify to ensure clean formatting
    content = JSON.stringify(parsed, null, 2);
    console.log('✓ Cleaned and formatted JSON');
    
  } catch (e) {
    console.error('ERROR: Invalid JSON in GOOGLE_SERVICES_JSON:', e.message);
    throw e;
  }
  
  // Write to project root
  fs.writeFileSync('./google-services.json', content);
  console.log('✓ Wrote to project root');
  
  // Also write to android/app directory for gradle
  const androidAppDir = path.join(__dirname, 'android', 'app');
  if (fs.existsSync(androidAppDir)) {
    fs.writeFileSync(
      path.join(androidAppDir, 'google-services.json'),
      content
    );
    console.log('✓ Wrote to android/app directory');
  }
  
  console.log('========================================');
}

module.exports = require('./app.json').expo;
