// Location: /apps/assessment/scripts/assignHouseTeamsBalanced.js
// Script to assign house teams to kids in a balanced way across all ages

const admin = require('firebase-admin');
const serviceAccount = require('../../../firebase-admin-key.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const ACADEMY_ID = 'academy_accellax361_main';

// House teams configuration
const HOUSE_TEAMS = ['fire', 'ice', 'water', 'wind', 'earth'];

async function assignHouseTeamsBalanced() {
  try {
    console.log('🏠 Starting Balanced House Team Assignment...\n');

    // Fetch all active kids without house teams
    const kidsRef = db.collection(`academies/${ACADEMY_ID}/kids`);
    const snapshot = await kidsRef.where('status', '==', 'active').get();

    if (snapshot.empty) {
      console.log('⚠️ No active kids found in Firebase');
      return;
    }

    const allKids = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      allKids.push({
        id: data.id,
        name: data.name,
        age: data.age,
        age_group: data.age_group,
        gender: data.gender,
        primary_sport: data.primary_sport || 'None',
        house_team: data.house_team || null,
      });
    });

    // Filter kids without house teams
    const kidsToAssign = allKids.filter(k => !k.house_team);

    if (kidsToAssign.length === 0) {
      console.log('✅ All kids already have house teams assigned!\n');
      return;
    }

    console.log(`📊 Total kids: ${allKids.length}`);
    console.log(`🏠 Kids with teams: ${allKids.length - kidsToAssign.length}`);
    console.log(`❌ Kids to assign: ${kidsToAssign.length}\n`);

    // Balanced assignment algorithm
    console.log('🔄 Running balanced assignment algorithm...\n');

    // Step 1: Group kids by age group for better distribution
    const ageGroups = {
      '4-6': [],
      '7-9': [],
      '10-13': [],
      '13+': [],
    };

    kidsToAssign.forEach(kid => {
      if (ageGroups[kid.age_group]) {
        ageGroups[kid.age_group].push(kid);
      }
    });

    // Step 2: Further group by gender within each age group
    Object.keys(ageGroups).forEach(ageGroup => {
      ageGroups[ageGroup] = {
        males: ageGroups[ageGroup].filter(k => k.gender === 'Male'),
        females: ageGroups[ageGroup].filter(k => k.gender === 'Female'),
        others: ageGroups[ageGroup].filter(k => k.gender !== 'Male' && k.gender !== 'Female'),
      };
    });

    // Step 3: Initialize team assignments
    const teamAssignments = {
      fire: [],
      ice: [],
      water: [],
      wind: [],
      earth: [],
    };

    // Step 4: Distribute kids in round-robin fashion
    // This ensures even distribution across teams
    let teamIndex = 0;

    // Process each age group
    Object.entries(ageGroups).forEach(([ageGroup, genderGroups]) => {
      console.log(`📌 Assigning ${ageGroup} age group...`);

      // Assign males
      genderGroups.males.forEach(kid => {
        const team = HOUSE_TEAMS[teamIndex % HOUSE_TEAMS.length];
        teamAssignments[team].push(kid);
        console.log(`   ✅ ${kid.name.padEnd(30)} → ${team.toUpperCase()}`);
        teamIndex++;
      });

      // Assign females
      genderGroups.females.forEach(kid => {
        const team = HOUSE_TEAMS[teamIndex % HOUSE_TEAMS.length];
        teamAssignments[team].push(kid);
        console.log(`   ✅ ${kid.name.padEnd(30)} → ${team.toUpperCase()}`);
        teamIndex++;
      });

      // Assign others
      genderGroups.others.forEach(kid => {
        const team = HOUSE_TEAMS[teamIndex % HOUSE_TEAMS.length];
        teamAssignments[team].push(kid);
        console.log(`   ✅ ${kid.name.padEnd(30)} → ${team.toUpperCase()}`);
        teamIndex++;
      });

      console.log('');
    });

    // Step 5: Display final distribution
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 FINAL TEAM DISTRIBUTION:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    Object.entries(teamAssignments).forEach(([team, kids]) => {
      const teamName = team.charAt(0).toUpperCase() + team.slice(1);
      console.log(`🔥 ${teamName.toUpperCase()} TEAM (${kids.length} kids):`);
      
      // Age distribution
      const ageDistribution = {
        '4-6': kids.filter(k => k.age_group === '4-6').length,
        '7-9': kids.filter(k => k.age_group === '7-9').length,
        '10-13': kids.filter(k => k.age_group === '10-13').length,
        '13+': kids.filter(k => k.age_group === '13+').length,
      };

      // Gender distribution
      const males = kids.filter(k => k.gender === 'Male').length;
      const females = kids.filter(k => k.gender === 'Female').length;

      console.log(`   Ages: 4-6(${ageDistribution['4-6']}), 7-9(${ageDistribution['7-9']}), 10-13(${ageDistribution['10-13']}), 13+(${ageDistribution['13+']})`);
      console.log(`   Gender: ${males}M, ${females}F`);
      console.log('');
    });

    // Step 6: Confirm before updating
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠️  WARNING: This will update Firebase with house team assignments!\n');
    console.log('   This action cannot be undone automatically.');
    console.log('   Review the distribution above carefully.\n');

    // Wait for user confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('Type "CONFIRM" to proceed with assignment: ', async (answer) => {
      if (answer.trim().toUpperCase() !== 'CONFIRM') {
        console.log('\n❌ Assignment cancelled by user.\n');
        rl.close();
        process.exit(0);
        return;
      }

      console.log('\n🔄 Updating Firebase...\n');

      // Step 7: Update Firebase
      const batch = db.batch();
      let updateCount = 0;

      Object.entries(teamAssignments).forEach(([team, kids]) => {
        kids.forEach(kid => {
          const kidRef = db.doc(`academies/${ACADEMY_ID}/kids/${kid.id}`);
          batch.update(kidRef, {
            house_team: team,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          });
          updateCount++;
        });
      });

      try {
        await batch.commit();
        console.log(`✅ Successfully updated ${updateCount} kids in Firebase!\n`);

        // Display summary
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 ASSIGNMENT COMPLETE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('📊 Summary:');
        Object.entries(teamAssignments).forEach(([team, kids]) => {
          const teamName = team.charAt(0).toUpperCase() + team.slice(1);
          console.log(`   ${teamName.padEnd(8)}: ${kids.length} kids`);
        });

        console.log('\n✅ All kids have been assigned to house teams!');
        console.log('   Refresh your app to see the updated team rankings.\n');

      } catch (error) {
        console.error('❌ Error updating Firebase:', error);
      } finally {
        rl.close();
        process.exit(0);
      }
    });

  } catch (error) {
    console.error('❌ Error in assignment script:', error);
    process.exit(1);
  }
}

assignHouseTeamsBalanced();