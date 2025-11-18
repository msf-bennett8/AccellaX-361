//src/utils/testDatabase.js
import { 
  initDatabase, 
  insertKid, 
  getAllKids, 
  createSession, 
  markAttendance,
  getSessionAttendance 
} from '../database/db';

export const testDatabaseOperations = async () => {
  console.log('🧪 Starting Database Tests...');
  
  try {
    // Test 1: Initialize
    console.log('1️⃣ Testing database initialization...');
    await initDatabase();
    console.log('✅ Database initialized');

    // Test 2: Insert a test kid
    console.log('2️⃣ Testing kid insertion...');
    const testKid = await insertKid('Test Kid', 8, 'Male', 'Nairobi', '7-9');
    console.log('✅ Kid inserted:', testKid);

    // Test 3: Retrieve all kids
    console.log('3️⃣ Testing get all kids...');
    const kids = await getAllKids();
    console.log('✅ Kids retrieved:', kids.length, 'kids found');
    console.log('Kids:', kids);

    // Test 4: Create a session
    console.log('4️⃣ Testing session creation...');
    const session = await createSession('2024-11-14', '4-6 PM', 'Thursday');
    console.log('✅ Session created:', session);

    // Test 5: Mark attendance
    if (kids.length > 0 && session) {
      console.log('5️⃣ Testing mark attendance...');
      const sessionId = session.id || session.lastInsertRowId;
      const kidId = kids[0].id;
      await markAttendance(sessionId, kidId, 'present');
      console.log('✅ Attendance marked');

      // Test 6: Get attendance
      console.log('6️⃣ Testing get attendance...');
      const attendance = await getSessionAttendance(sessionId);
      console.log('✅ Attendance retrieved:', attendance);
    }

    console.log('🎉 All database tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return false;
  }
};