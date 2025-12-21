// Location: /apps/assessment/src/config/sports.js
// Default Sports Configuration for AccellaX 361° Assessment App

/**
 * DEFAULT SPORTS
 * These 6 sports are pre-loaded on app initialization.
 * Admins can add custom sports via Settings.
 */

export const DEFAULT_SPORTS = [
  {
    id: 'fitness',
    name: 'Fitness',
    icon: '💪',
    description: 'General Fitness Tests',
    isDefault: true,
    isActive: true,
    color: '#E74C3C', // Red/Orange
    categories: ['general_fitness'],
  },
  {
    id: 'football',
    name: 'Football',
    icon: '⚽',
    description: 'Association Football (Soccer)',
    isDefault: true,
    isActive: true,
    color: '#4CAF50', // Green
    categories: ['general_fitness', 'sport_specific', 'iq'],
  },
  {
    id: 'athletics',
    name: 'Athletics',
    icon: '🏃',
    description: 'Track & Field Events',
    isDefault: true,
    isActive: true,
    color: '#FF9800', // Orange
    categories: ['general_fitness', 'sport_specific', 'iq'],
  },
  {
    id: 'rugby',
    name: 'Rugby',
    icon: '🏉',
    description: 'Rugby Union',
    isDefault: true,
    isActive: true,
    color: '#795548', // Brown
    categories: ['general_fitness', 'sport_specific', 'iq'],
  },
  {
    id: 'swimming',
    name: 'Swimming',
    icon: '🏊',
    description: 'Competitive Swimming',
    isDefault: true,
    isActive: true,
    color: '#2196F3', // Blue
    categories: ['general_fitness', 'sport_specific', 'iq'],
  },
  {
    id: 'tennis',
    name: 'Tennis',
    icon: '🎾',
    description: 'Lawn Tennis',
    isDefault: true,
    isActive: true,
    color: '#FFEB3B', // Yellow
    categories: ['general_fitness', 'sport_specific', 'iq'],
  },
  {
    id: 'basketball',
    name: 'Basketball',
    icon: '🏀',
    description: 'Basketball',
    isDefault: true,
    isActive: true,
    color: '#FF5722', // Deep Orange
    categories: ['general_fitness', 'sport_specific', 'iq'],
  },
];

/**
 * SPORT METADATA
 * Additional information per sport for UI/UX
 */
export const SPORT_METADATA = {
  football: {
    fullName: 'Association Football (Soccer)',
    aliases: ['Soccer', 'Football'],
    popularIn: ['Global'],
    equipmentNeeded: ['Ball', 'Goals', 'Cones'],
    playerCount: 11,
    ageGroupRecommendation: ['4-6', '7-9', '10-13', '13+'],
  },
  athletics: {
    fullName: 'Track & Field Athletics',
    aliases: ['Track', 'Field', 'T&F'],
    popularIn: ['Global'],
    equipmentNeeded: ['Track', 'Field Equipment', 'Timing System'],
    playerCount: 1,
    ageGroupRecommendation: ['7-9', '10-13', '13+'],
  },
  rugby: {
    fullName: 'Rugby Union',
    aliases: ['Rugby', 'Rugby Union'],
    popularIn: ['UK', 'NZ', 'SA', 'AUS'],
    equipmentNeeded: ['Ball', 'Posts', 'Pads (Optional)'],
    playerCount: 15,
    ageGroupRecommendation: ['7-9', '10-13', '13+'],
  },
  swimming: {
    fullName: 'Competitive Swimming',
    aliases: ['Swimming', 'Aquatics'],
    popularIn: ['Global'],
    equipmentNeeded: ['Pool', 'Lane Ropes', 'Timing System'],
    playerCount: 1,
    ageGroupRecommendation: ['4-6', '7-9', '10-13', '13+'],
  },
  tennis: {
    fullName: 'Lawn Tennis',
    aliases: ['Tennis'],
    popularIn: ['Global'],
    equipmentNeeded: ['Court', 'Net', 'Rackets', 'Balls'],
    playerCount: 2,
    ageGroupRecommendation: ['7-9', '10-13', '13+'],
  },
  basketball: {
    fullName: 'Basketball',
    aliases: ['Basketball', 'Hoops'],
    popularIn: ['USA', 'Europe', 'Asia'],
    equipmentNeeded: ['Court', 'Hoops', 'Ball'],
    playerCount: 5,
    ageGroupRecommendation: ['7-9', '10-13', '13+'],
  },
};

/**
 * SPORT ICONS (Emoji fallback for missing icons)
 */
export const SPORT_ICONS = {
  football: '⚽',
  athletics: '🏃',
  rugby: '🏉',
  swimming: '🏊',
  tennis: '🎾',
  basketball: '🏀',
  // Generic fallback
  default: '🏅',
};

/**
 * SPORT COLORS (For UI theming)
 */
export const SPORT_COLORS = {
  football: '#4CAF50',
  athletics: '#FF9800',
  rugby: '#795548',
  swimming: '#2196F3',
  tennis: '#FFEB3B',
  basketball: '#FF5722',
  default: '#9E9E9E',
};

/**
 * Helper: Get sport by ID
 */
export const getSportById = (sportId) => {
  return DEFAULT_SPORTS.find(s => s.id === sportId) || null;
};

/**
 * Helper: Get sport name
 */
export const getSportName = (sportId) => {
  const sport = getSportById(sportId);
  return sport ? sport.name : 'Unknown Sport';
};

/**
 * Helper: Get sport icon
 */
export const getSportIcon = (sportId) => {
  return SPORT_ICONS[sportId] || SPORT_ICONS.default;
};

/**
 * Helper: Get sport color
 */
export const getSportColor = (sportId) => {
  return SPORT_COLORS[sportId] || SPORT_COLORS.default;
};

/**
 * Helper: Validate sport ID
 */
export const isValidSport = (sportId) => {
  return DEFAULT_SPORTS.some(s => s.id === sportId);
};

/**
 * Helper: Get active sports only
 */
export const getActiveSports = () => {
  return DEFAULT_SPORTS.filter(s => s.isActive);
};

export default {
  DEFAULT_SPORTS,
  SPORT_METADATA,
  SPORT_ICONS,
  SPORT_COLORS,
  getSportById,
  getSportName,
  getSportIcon,
  getSportColor,
  isValidSport,
  getActiveSports,
};