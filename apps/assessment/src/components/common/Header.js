//src/components/common/Header.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform, Image, Modal, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, APP_NAME } from '../../utils/constants';
import { getCurrentUser } from '../../utils/auth';
import { generateInitials, getAvatarColor, getBase64DataUri } from '../../utils/imageUtils';

// Screen breakpoints for responsive title
const SCREEN_SIZES = {
  SMALL: 600,
  MEDIUM: 900,
};

// Helper function to get responsive title
const getResponsiveTitle = (fullTitle, screenWidth) => {
  if (screenWidth < SCREEN_SIZES.SMALL) {
    return 'AccellaX 361°';
  } else if (screenWidth < SCREEN_SIZES.MEDIUM) {
    return 'AccellaX 361° | Assessment';
  } else {
    return fullTitle;
  }
};

const Header = ({
  title = APP_NAME,
  subtitle,
  leftIcon = '☰', // Default to hamburger menu
  rightIcon,
  onLeftPress,
  onRightPress,
  style,
  backgroundColor = COLORS.primary,
  titleColor = COLORS.white,
  subtitleColor = COLORS.primaryLight,
  iconColor = COLORS.white,
  showStatusBar = true,
  statusBarStyle = 'light-content',
  centerTitle = true,
  leftText,
  rightText,
  textStyle,
  variant = 'default',
  showAvatar = true,
  onAvatarSecretTap,
  showAdminElevation = false,
  userProfile: propUserProfile,
  showBackButton = false, // New prop for showing back button instead of hamburger
}) => {
  const navigation = useNavigation();
  const [userProfile, setUserProfile] = useState(propUserProfile || null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });

    loadUserProfile();

    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {

    // Add focus listener to reload profile when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      //console.log('🔄 Screen focused - reloading user profile');
      loadUserProfile();
    });

    return unsubscribe;
  }, [navigation]);

  // Watch for prop changes
  useEffect(() => {
    console.log('🔔 propUserProfile changed:', propUserProfile ? {
      fullName: propUserProfile.fullName,
      role: propUserProfile.role,
    } : 'NULL');
    
    if (propUserProfile) {
      setUserProfile(propUserProfile);
      const adminStatus = ['admin', 'super_admin', 'owner'].includes(propUserProfile?.role);
      setIsAdmin(adminStatus);
      console.log('✅ Updated from prop - isAdmin:', adminStatus);
    }
  }, [propUserProfile]);

  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState(null);

  const loadUserProfile = async () => {
  //console.log('🔄 loadUserProfile called, propUserProfile:', propUserProfile ? 'EXISTS' : 'NULL');
  
  // If userProfile was passed as prop, use it
  if (propUserProfile) {
    console.log('✅ Using prop userProfile:', {
      fullName: propUserProfile.fullName,
      role: propUserProfile.role,
      email: propUserProfile.email,
    });
    setUserProfile(propUserProfile);
    const adminStatus = ['admin', 'super_admin', 'owner'].includes(propUserProfile?.role);
    setIsAdmin(adminStatus);
    console.log('👤 Header: Using prop userProfile, isAdmin:', adminStatus, 'Role:', propUserProfile?.role);
    return;
  }
  
  // Otherwise, load from storage
  try {
    const profile = await getCurrentUser();
    if (profile) {
      setUserProfile(profile);
      const adminStatus = ['admin', 'super_admin', 'owner'].includes(profile?.role);
      setIsAdmin(adminStatus);
      console.log('👤 Header: User loaded from storage, isAdmin:', adminStatus, 'Role:', profile?.role);
    }
  } catch (error) {
    console.error('❌ Error loading user profile:', error);
  }
};

  const handleAvatarPress = () => {
  console.log('👆 Avatar pressed!');
  console.log('   - isAdmin:', isAdmin);
  console.log('   - userProfile.role:', userProfile?.role);
  console.log('   - showAdminElevation:', showAdminElevation);
  console.log('   - onAvatarSecretTap exists:', !!onAvatarSecretTap);
  
  // If on ProfileScreen and admin elevation enabled, handle secret taps
  if (showAdminElevation && onAvatarSecretTap) {
    console.log('🔓 Triggering admin elevation tap');
    onAvatarSecretTap();
    return;
  }
  
  if (isAdmin) {
    // Admin: Toggle dropdown menu
    console.log('📋 Toggling admin dropdown (current state:', showDropdown, ')');
    setShowDropdown(!showDropdown);
    return;
  }
  
  // Regular user: Navigate to profile
  console.log('👤 Regular user - navigating to profile');
    navigation.navigate('Profile');
  };

    const handleDropdownClose = () => {
      setShowDropdown(false);
    };

    const handleNavigateToProfile = () => {
    setShowDropdown(false);
    navigation.navigate('Profile');
  };

  const handleNavigateToAdminDashboard = () => {
    setShowDropdown(false);
    setAlertConfig({ title: 'Admin Dashboard', message: 'Admin dashboard coming soon!' });
    setShowAlertModal(true);
  };

  const renderAvatar = () => {
    if (!userProfile) return null;

    const initials = generateInitials(userProfile.fullName);
    const avatarColor = getAvatarColor(userProfile.fullName);

    if (userProfile.avatarBase64) {
      // Show actual avatar image
      return (
        <Image
          source={{ uri: getBase64DataUri(userProfile.avatarBase64) }}
          style={styles.avatarImage}
        />
      );
    } else {
      // Show initials placeholder
      return (
        <View style={[styles.avatarPlaceholder, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
      );
    }
  };

  const renderAdminDropdown = () => {
    if (!showDropdown || !isAdmin) return null;

    return (
      <>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.dropdownBackdrop}
          activeOpacity={1}
          onPress={handleDropdownClose}
        />
        
        {/* Dropdown Menu */}
        <View style={styles.dropdown}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>Admin Menu</Text>
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>👑 ADMIN</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={handleNavigateToProfile}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownIcon}>👤</Text>
            <Text style={styles.dropdownItemText}>My Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={handleNavigateToAdminDashboard}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownIcon}>👤</Text>
            <Text style={styles.dropdownItemText}>Admin Dashboard</Text>
          </TouchableOpacity>

          <View style={styles.dropdownDivider} />

          <View style={styles.dropdownFooter}>
            <Text style={styles.dropdownFooterText}>
              Signed in as {userProfile.fullName}
            </Text>
          </View>
        </View>
      </>
    );
  };

  // Determine header height based on variant
  const getHeaderStyle = () => {
    switch (variant) {
      case 'large':
        return styles.headerLarge;
      case 'compact':
        return styles.headerCompact;
      case 'transparent':
        return styles.headerTransparent;
      default:
        return styles.header;
    }
  };

  return (
    <>
      {showStatusBar && (
        <StatusBar
          barStyle={statusBarStyle}
          backgroundColor={variant === 'transparent' ? 'transparent' : backgroundColor}
          translucent={variant === 'transparent'}
        />
      )}
      <View style={[getHeaderStyle(), { backgroundColor }, style]}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          {showBackButton ? (
            // Show back button if specified
            <TouchableOpacity
              onPress={onLeftPress}
              style={styles.iconButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.iconText, { color: iconColor }]}>←</Text>
            </TouchableOpacity>
          ) : leftText ? (
            // Show text button if provided
            <TouchableOpacity
              onPress={onLeftPress}
              style={styles.textButton}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: iconColor }, textStyle]}>
                {leftText}
              </Text>
            </TouchableOpacity>
          ) : (
            // Always show hamburger menu by default
            <TouchableOpacity
              onPress={onLeftPress || (() => navigation.openDrawer?.())}
              style={styles.iconButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {leftIcon === '☰' ? (
                <View style={styles.hamburgerMenu}>
                  <View style={[styles.hamburgerLine, { backgroundColor: iconColor }]} />
                  <View style={[styles.hamburgerLine, { backgroundColor: iconColor }]} />
                  <View style={[styles.hamburgerLine, { backgroundColor: iconColor }]} />
                </View>
              ) : (
                <Text style={[styles.iconText, { color: iconColor }]}>
                  {leftIcon}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Center Section */}
        <View style={[styles.centerSection, !centerTitle && styles.centerSectionLeft]}>
          <Text
            style={[
              variant === 'large' ? styles.titleLarge : styles.title,
              { color: titleColor },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {getResponsiveTitle(title, screenWidth)}
          </Text>
          {subtitle && (
            <Text
              style={[styles.subtitle, { color: subtitleColor }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          {rightText && (
            <TouchableOpacity
              onPress={onRightPress}
              style={styles.textButton}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: iconColor }, textStyle]}>
                {rightText}
              </Text>
            </TouchableOpacity>
          )}
          {rightIcon && (
            <TouchableOpacity
              onPress={onRightPress}
              style={styles.iconButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name={rightIcon} size={24} color={iconColor} />
            </TouchableOpacity>
          )}
          {showAvatar && userProfile && (
            <TouchableOpacity
              onPress={handleAvatarPress}
              style={styles.avatarButton}
              activeOpacity={0.8}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {renderAvatar()}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Admin Dropdown Menu */}
      {renderAdminDropdown()}

      {/* Alert Modal */}
      <Modal visible={showAlertModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="information-circle" size={48} color="#2196F3" />
            </View>
            <Text style={styles.modalTitle}>{alertConfig.title}</Text>
            <Text style={styles.modalMessage}>{alertConfig.message}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonFull]}
              onPress={() => setShowAlertModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 50,
    paddingBottom: 16,
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    minHeight: Platform.OS === 'ios' ? 88 : 88,
  },
  headerLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 50,
    paddingBottom: 24,
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    minHeight: Platform.OS === 'ios' ? 100 : 100,
  },
  headerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 44,
    paddingBottom: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minHeight: Platform.OS === 'ios' ? 70 : 70,
  },
  headerTransparent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 50,
    paddingBottom: 16,
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    minHeight: Platform.OS === 'ios' ? 88 : 88,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  centerSection: {
    flex: 3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  centerSectionLeft: {
    alignItems: 'flex-start',
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  titleLarge: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  iconButton: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  hamburgerMenu: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: '100%',
    height: 3,
    borderRadius: 2,
  },
  textButton: {
    padding: 8,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
    buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  avatarButton: {
    marginLeft: 12,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  // Admin Dropdown Styles
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 998,
  },
  dropdown: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 95 : 95,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    minWidth: 250,
    elevation: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 999,
    overflow: 'hidden',
  },
  dropdownHeader: {
    padding: 16,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  adminBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  dropdownFooter: {
    padding: 12,
    backgroundColor: COLORS.background,
  },
  dropdownFooterText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  modalButtonFull: {
    width: '100%',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default Header;