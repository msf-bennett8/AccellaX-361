import { getAllKids, deleteKid } from '../database/db';
import { getDatabaseStats, removeTestData } from './dataCleanup';

export const debugCleanup = async () => {
  console.log('=== CLEANUP DEBUG START ===');
  
  // Get all kids
  const kids = await getAllKids();
  console.log('Total kids:', kids.length);
  console.log('Kids list:', kids);
  
  // Check for test data
  const testKids = kids.filter(k => k.name.toLowerCase().includes('test'));
  console.log('Test kids found:', testKids.length);
  console.log('Test kids:', testKids);
  
  // Get stats
  const stats = await getDatabaseStats();
  console.log('Database stats:', stats);
  
  console.log('=== CLEANUP DEBUG END ===');
  
  return {
    totalKids: kids.length,
    testKids: testKids.length,
    stats,
  };
};

export const testDeleteOne = async () => {
  console.log('=== TEST DELETE ONE ===');
  
  const kids = await getAllKids();
  const testKids = kids.filter(k => k.name.toLowerCase().includes('test'));
  
  if (testKids.length > 0) {
    const firstTestKid = testKids[0];
    console.log('Attempting to delete:', firstTestKid);
    
    await deleteKid(firstTestKid.id);
    console.log('Delete command executed');
    
    // Check if it's actually gone
    const kidsAfter = await getAllKids();
    const testKidsAfter = kidsAfter.filter(k => k.name.toLowerCase().includes('test'));
    
    console.log('Kids before:', kids.length);
    console.log('Kids after:', kidsAfter.length);
    console.log('Test kids before:', testKids.length);
    console.log('Test kids after:', testKidsAfter.length);
    
    return {
      success: testKidsAfter.length < testKids.length,
      before: testKids.length,
      after: testKidsAfter.length,
    };
  }
  
  return { success: false, message: 'No test kids found' };
};