// Location: /apps/assessment/src/screens/SelectSport/SelectSportScreen.js
// Sport Selection Screen for Assessment Flow

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { COLORS, APP_NAME } from '../../utils/constants';
import { getAllSportsWithFitness } from '../../services/sportService';
import { getKidsBySport } from '../../services/kidService';

const { width } = Dimensions.get('window');

// Preload icons to prevent loading delay
MaterialCommunityIcons.loadFont();
Ionicons.loadFont();

export default function SelectSportScreen({ route }) {
  const navigation = useNavigation();
  
  // Get metadata from AssessmentSetup screen
  const assessmentMetadata = route.params?.assessmentMetadata || null;
  
  const [sports, setSports] = useState([]);
  const [sportKidCounts, setSportKidCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSportsWithCounts();
  }, []);

  const loadSportsWithCounts = async () => {
    try {
      setLoading(true);
      
      console.log('🏃 [SelectSport] Loading sports...');
      
      // Get all active sports (includes Fitness)
      const allSports = await getAllSportsWithFitness();
      console.log('📊 [SelectSport] Loaded sports:', allSports.map(s => s.name).join(', '));

      const activeSports = allSports.filter(s => s.is_active === 1 || s.isActive);
      console.log('✅ [SelectSport] Active sports:', activeSports.length);
      
      // Get kid counts per sport
      const counts = {};
      for (const sport of activeSports) {
        // For 'fitness', count all kids
        if (sport.id === 'fitness') {
          const { getAllKids } = await import('../../database/db');
          const allKids = await getAllKids();
          counts[sport.id] = allKids.length;
          console.log(`👥 [SelectSport] Fitness: ${allKids.length} kids (all)`);
        } else {
          const kids = await getKidsBySport(sport.id);
          counts[sport.id] = kids.length;
          console.log(`👥 [SelectSport] ${sport.name}: ${kids.length} kids`);
        }
      }
      
      setSports(activeSports);
      setSportKidCounts(counts);
      setLoading(false);
      
      console.log('✅ [SelectSport] Sports loaded successfully');
    } catch (error) {
      console.error('❌ [SelectSport] Error loading sports:', error);
      setLoading(false);
    }
  };

  const handleSportSelect = (sport) => {
    const kidCount = sportKidCounts[sport.id] || 0;
    
    console.log('🎯 [SelectSport] Sport selected:', sport.name, '| ID:', sport.id, '| Kids:', kidCount);
    
    if (kidCount === 0) {
      alert(`No kids enrolled in ${sport.name}. Please assign kids to this sport first.`);
      return;
    }
    
    console.log('🔍 [SelectSport] Passing metadata to AssessmentMode:', assessmentMetadata);
    
    // Navigate to Assessment Mode selection
    navigation.navigate('AssessmentMode', { 
      sport: sport,
      kidCount: kidCount,
      assessmentMetadata: assessmentMetadata,
    });
  };

  // Map sport IDs to icon names
  const getSportIconName = (sportId) => {
    const iconMap = {
      'fitness': 'heart-pulse',
      'football': 'soccer',
      'basketball': 'basketball',
      'tennis': 'tennis',
      'baseball': 'baseball',
      'volleyball': 'volleyball',
      'swimming': 'swim',
      'athletics': 'run-fast',
      'rugby': 'rugby',
      'cricket': 'cricket',
      'badminton': 'badminton',
      'boxing': 'boxing-glove',
      'gymnastics': 'gymnastics',
      'default': 'trophy'
    };
    
    return iconMap[sportId] || iconMap['default'];
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Select Sport"
          leftIcon="←"
          onLeftPress={() => navigation.goBack()}
        />
        <LoadingSpinner 
          overlay 
          text="Loading sports..." 
          color="#1565C0"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Select Sport"
        subtitle="Choose sport to assess"
        leftIcon="←"
        onLeftPress={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <View style={styles.instructionsIconContainer}>
              <Ionicons name="information-circle" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.instructionsText}>
              Select a sport to begin assessment. You'll be able to choose specific tests and kids next.
            </Text>
          </View>

          {/* Sports Grid */}
          <View style={styles.sportsGrid}>
            {sports.map((sport) => {
              const kidCount = sportKidCounts[sport.id] || 0;
              const hasKids = kidCount > 0;
              const iconName = getSportIconName(sport.id);
              const sportColor = sport.color || COLORS.primary;
              
              return (
                <TouchableOpacity
                  key={sport.id}
                  style={[
                    styles.sportCard,
                    !hasKids && styles.sportCardDisabled
                  ]}
                  onPress={() => handleSportSelect(sport)}
                  activeOpacity={hasKids ? 0.7 : 1}
                  disabled={!hasKids}
                >
                  {/* Sport Icon */}
                  <View style={[
                    styles.sportIconContainer,
                    { backgroundColor: sportColor + '20' }
                  ]}>
                    <MaterialCommunityIcons 
                      name={iconName} 
                      size={40} 
                      color={sportColor} 
                    />
                  </View>

                  {/* Sport Name */}
                  <Text style={styles.sportName}>{sport.name}</Text>

                  {/* Kid Count */}
                  <View style={[
                    styles.kidCountBadge,
                    !hasKids && styles.kidCountBadgeEmpty
                  ]}>
                    <Ionicons 
                      name="people" 
                      size={14} 
                      color={hasKids ? COLORS.primary : COLORS.textSecondary} 
                      style={styles.kidCountIcon}
                    />
                    <Text style={[
                      styles.kidCountText,
                      !hasKids && styles.kidCountTextEmpty
                    ]}>
                      {sport.id === 'fitness' 
                        ? 'All kids' 
                        : `${kidCount} ${kidCount === 1 ? 'kid' : 'kids'}`
                      }
                    </Text>
                  </View>

                  {/* Status Badge */}
                  {hasKids && (
                    <View style={styles.activeBadge}>
                      <Ionicons name="checkmark-circle" size={12} color={COLORS.white} />
                      <Text style={styles.activeBadgeText}>Ready</Text>
                    </View>
                  )}
                  
                  {!hasKids && (
                    <View style={styles.emptyBadge}>
                      <Ionicons name="alert-circle" size={12} color={COLORS.error} />
                      <Text style={styles.emptyBadgeText}>No Kids</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Add Sport Card */}
            <TouchableOpacity
              style={[styles.sportCard, styles.addSportCard]}
              onPress={() => {
                alert('Add new sport - Coming soon!');
              }}
              activeOpacity={0.7}
            >
              {/* Add Icon */}
              <View style={[
                styles.sportIconContainer,
                styles.addSportIconContainer
              ]}>
                <Ionicons 
                  name="add" 
                  size={40} 
                  color={COLORS.primary} 
                />
              </View>

              {/* Sport Name */}
              <Text style={styles.sportName}>Add Sport</Text>

              {/* New Badge */}
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>New</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Empty State */}
          {sports.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons 
                name="trophy-outline" 
                size={80} 
                color={COLORS.textSecondary} 
              />
              <Text style={styles.emptyStateTitle}>No Sports Available</Text>
              <Text style={styles.emptyStateText}>
                Sports will appear here once configured.
              </Text>
            </View>
          )}

          {/* Bottom Padding */}
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
  content: {
    position: 'absolute',
    top: 116,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  
  // Instructions
  instructionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight + '40',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  instructionsIconContainer: {
    marginRight: 12,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.primary,
    lineHeight: 20,
  },
  
  // Sports Grid
  sportsGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  sportCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sportCardDisabled: {
    opacity: 0.5,
  },
  sportIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  sportName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  kidCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  kidCountBadgeEmpty: {
    backgroundColor: COLORS.backgroundDark,
  },
  kidCountIcon: {
    marginRight: 4,
  },
  kidCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  kidCountTextEmpty: {
    color: COLORS.textSecondary,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  emptyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  emptyBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.error,
  },
  addSportCard: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'solid',
    backgroundColor: COLORS.primaryLight + '20',
  },
  addSportIconContainer: {
    backgroundColor: COLORS.primaryLight + '40',
  },
  newBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  
  bottomPadding: {
    height: 32,
  },
});