// Location: /apps/assessment/scripts/viewKidsForBalancing.js
// Script to view all kids from Firebase and analyze distribution for house team balancing

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

async function viewKidsForBalancing() {
  try {
    console.log('📊 Fetching all kids from Firebase...\n');

    const kidsRef = db.collection(`academies/${ACADEMY_ID}/kids`);
    const snapshot = await kidsRef.where('status', '==', 'active').get();

    if (snapshot.empty) {
      console.log('⚠️ No active kids found in Firebase');
      return;
    }

    const kids = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      kids.push({
        id: data.id,
        name: data.name,
        age: data.age,
        age_group: data.age_group,
        gender: data.gender,
        primary_sport: data.primary_sport || 'None',
        house_team: data.house_team || null,
        sponsorshipType: data.sponsorshipType || 'SP',
        programType: data.programType || 'ELT',
      });
    });

    console.log(`✅ Found ${kids.length} active kids\n`);

    // Separate kids with and without house teams
    const kidsWithTeams = kids.filter(k => k.house_team);
    const kidsWithoutTeams = kids.filter(k => !k.house_team);

    console.log(`🏠 Kids WITH house teams: ${kidsWithTeams.length}`);
    console.log(`❌ Kids WITHOUT house teams: ${kidsWithoutTeams.length}\n`);

    if (kidsWithTeams.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🏠 KIDS ALREADY ASSIGNED TO TEAMS:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      kidsWithTeams.forEach(kid => {
        console.log(`✅ ${kid.name.padEnd(25)} | Team: ${kid.house_team.padEnd(8)} | Age: ${kid.age_group.padEnd(8)} | Gender: ${kid.gender || 'N/A'} | Sport: ${kid.primary_sport}`);
      });
      console.log('\n');
    }

    if (kidsWithoutTeams.length === 0) {
      console.log('✅ All kids already have house teams assigned!\n');
      
      // Show distribution analysis
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 CURRENT TEAM DISTRIBUTION:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      analyzeTeamDistribution(kidsWithTeams);
      return;
    }

    // Analyze kids without teams
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`❌ ${kidsWithoutTeams.length} KIDS NEED HOUSE TEAM ASSIGNMENT:`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Group by age group
    const byAgeGroup = {
      '4-6': [],
      '7-9': [],
      '10-13': [],
      '13+': [],
    };

    kidsWithoutTeams.forEach(kid => {
      if (byAgeGroup[kid.age_group]) {
        byAgeGroup[kid.age_group].push(kid);
      }
    });

    // Display kids grouped by age
    Object.entries(byAgeGroup).forEach(([ageGroup, groupKids]) => {
      if (groupKids.length > 0) {
        console.log(`\n📌 AGE GROUP ${ageGroup} (${groupKids.length} kids):`);
        console.log('─'.repeat(80));
        
        groupKids.forEach((kid, index) => {
          const genderIcon = kid.gender === 'Male' ? '♂️' : kid.gender === 'Female' ? '♀️' : '⚧';
          console.log(`${(index + 1).toString().padStart(3)}. ${kid.name.padEnd(25)} ${genderIcon} | Age: ${kid.age.toString().padStart(2)} | Sport: ${kid.primary_sport || 'None'}`);
        });
      }
    });

    // Show statistics
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DISTRIBUTION ANALYSIS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Age distribution
    console.log('🎂 BY AGE GROUP:');
    Object.entries(byAgeGroup).forEach(([ageGroup, groupKids]) => {
      const males = groupKids.filter(k => k.gender === 'Male').length;
      const females = groupKids.filter(k => k.gender === 'Female').length;
      const others = groupKids.length - males - females;
      
      console.log(`   ${ageGroup.padEnd(8)}: ${groupKids.length.toString().padStart(2)} kids (${males}M, ${females}F${others > 0 ? `, ${others}O` : ''})`);
    });

    // Gender distribution
    const maleCount = kidsWithoutTeams.filter(k => k.gender === 'Male').length;
    const femaleCount = kidsWithoutTeams.filter(k => k.gender === 'Female').length;
    const otherCount = kidsWithoutTeams.length - maleCount - femaleCount;

    console.log('\n👥 BY GENDER:');
    console.log(`   Male:   ${maleCount.toString().padStart(2)} (${Math.round(maleCount / kidsWithoutTeams.length * 100)}%)`);
    console.log(`   Female: ${femaleCount.toString().padStart(2)} (${Math.round(femaleCount / kidsWithoutTeams.length * 100)}%)`);
    if (otherCount > 0) {
      console.log(`   Other:  ${otherCount.toString().padStart(2)} (${Math.round(otherCount / kidsWithoutTeams.length * 100)}%)`);
    }

    // Sport distribution
    const bySport = {};
    kidsWithoutTeams.forEach(kid => {
      const sport = kid.primary_sport || 'None';
      bySport[sport] = (bySport[sport] || 0) + 1;
    });

    console.log('\n⚽ BY PRIMARY SPORT:');
    Object.entries(bySport)
      .sort((a, b) => b[1] - a[1])
      .forEach(([sport, count]) => {
        console.log(`   ${sport.padEnd(15)}: ${count.toString().padStart(2)} kids`);
      });

    // Calculate ideal distribution
    const totalKids = kidsWithoutTeams.length;
    const idealPerTeam = Math.floor(totalKids / 5);
    const remainder = totalKids % 5;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 BALANCED ASSIGNMENT PLAN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`Total kids to assign: ${totalKids}`);
    console.log(`Teams: 5 (Fire, Ice, Water, Wind, Earth)`);
    console.log(`Ideal per team: ${idealPerTeam} kids`);
    if (remainder > 0) {
      console.log(`Remainder: ${remainder} kids (will be distributed to first ${remainder} teams)`);
    }

    console.log('\n🏠 EXPECTED DISTRIBUTION:');
    ['Fire', 'Ice', 'Water', 'Wind', 'Earth'].forEach((team, index) => {
      const teamSize = idealPerTeam + (index < remainder ? 1 : 0);
      console.log(`   🔥 ${team.padEnd(8)}: ${teamSize} kids`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Ready to run assignment script!');
    console.log('   Run: node scripts/assignHouseTeamsBalanced.js\n');

  } catch (error) {
    console.error('❌ Error fetching kids:', error);
  } finally {
    process.exit(0);
  }
}

function analyzeTeamDistribution(kids) {
  const teams = {
    fire: [],
    ice: [],
    water: [],
    wind: [],
    earth: [],
  };

  kids.forEach(kid => {
    if (teams[kid.house_team]) {
      teams[kid.house_team].push(kid);
    }
  });

  console.log('🏠 TEAM SIZES:');
  Object.entries(teams).forEach(([team, members]) => {
    const teamName = team.charAt(0).toUpperCase() + team.slice(1);
    console.log(`   ${teamName.padEnd(8)}: ${members.length.toString().padStart(2)} kids`);
  });

  console.log('\n📊 DETAILED BREAKDOWN:\n');

  Object.entries(teams).forEach(([team, members]) => {
    if (members.length === 0) return;

    const teamName = team.charAt(0).toUpperCase() + team.slice(1);
    console.log(`🔥 ${teamName.toUpperCase()} TEAM (${members.length} kids):`);
    console.log('─'.repeat(80));

    // By age group
    const ageGroups = { '4-6': [], '7-9': [], '10-13': [], '13+': [] };
    members.forEach(kid => {
      if (ageGroups[kid.age_group]) {
        ageGroups[kid.age_group].push(kid);
      }
    });

    Object.entries(ageGroups).forEach(([age, kids]) => {
      if (kids.length > 0) {
        const males = kids.filter(k => k.gender === 'Male').length;
        const females = kids.filter(k => k.gender === 'Female').length;
        console.log(`   ${age.padEnd(8)}: ${kids.length} kids (${males}M, ${females}F)`);
      }
    });

    console.log('');
  });
}

viewKidsForBalancing();
