const fs = require('fs');
const path = require('path');

// Write google-services.json from environment variable if it exists
if (process.env.GOOGLE_SERVICES_JSON && process.env.EAS_BUILD) {
  console.log('========================================');
  console.log('Processing GOOGLE_SERVICES_JSON...');
  
  let content = process.env.GOOGLE_SERVICES_JSON;
  
  // Check if it's a file path
  if (content.startsWith('/')) {
    console.log('Environment variable is a file path:', content);
    try {
      content = fs.readFileSync(content, 'utf-8');
      console.log('✓ Read file successfully');
      console.log('File size:', content.length, 'bytes');
      
      // Verify it's valid JSON
      const parsed = JSON.parse(content);
      console.log('✓ Valid JSON');
      console.log('Project ID:', parsed.project_info?.project_id);
    } catch (e) {
      console.error('ERROR reading file:', e.message);
      throw e;
    }
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
