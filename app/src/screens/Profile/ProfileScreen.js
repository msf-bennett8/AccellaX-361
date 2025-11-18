// src/screens/Profile/ProfileScreen.js
// User profile screen - view/edit profile and avatar

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { COLORS, SCREEN_NAMES } from '../../utils/constants';
import Header from '../../components/common/Header';
import {
  getCurrentUser,
  updateUserProfile,
  logoutUser,
} from '../../utils/auth';
import {
  uploadAvatarFromGallery,
  uploadAvatarFromCamera,
  generateInitials,
  getAvatarColor,
  getBase64DataUri,
  deleteAvatar,
} from '../../utils/imageUtils';
import AdminElevationModal from '../../components/modals/AdminElevationModal';
import SuccessModal from '../../components/modals/SuccessModal';
import ProgressToast from '../../components/common/ProgressToast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';

const ProfileScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // User data
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [user, setUser] = useState(null); // Store full user object for role display

  // Original data (for cancel functionality)
  const [originalData, setOriginalData] = useState({});
  
  // Admin elevation states
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showProgressToast, setShowProgressToast] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [stepsRemaining, setStepsRemaining] = useState(0);
  const [isElevating, setIsElevating] = useState(false);
  
  // Logout modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      const userProfile = await getCurrentUser();
      
      if (userProfile) {
        setUser(userProfile); // Store full user object
        
        const data = {
          fullName: userProfile.fullName || '',
          email: userProfile.email || '',
          username: userProfile.username || '',
          phone: userProfile.phone || '',
          avatar: userProfile.avatarBase64 || null,
        };
        
        setFullName(data.fullName);
        setEmail(data.email);
        setUsername(data.username);
        setPhone(data.phone);
        setAvatar(data.avatar);
        setOriginalData(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - restore original data
      setFullName(originalData.fullName);
      setEmail(originalData.email);
      setUsername(originalData.username);
      setPhone(originalData.phone);
      setAvatar(originalData.avatar);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    // Validate
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateUserProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        username: username.trim(),
        phone: phone.trim(),
        avatarBase64: avatar,
      });

      if (result.success) {
        // Update original data
        setOriginalData({
          fullName,
          email,
          username,
          phone,
          avatar,
        });
        
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChoice = () => {
    Alert.alert(
      'Change Avatar',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: handleTakePhoto,
        },
        {
          text: 'Choose from Gallery',
          onPress: handleChooseFromGallery,
        },
        {
          text: 'Remove Avatar',
          onPress: handleRemoveAvatar,
          style: 'destructive',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleTakePhoto = async () => {
    const result = await uploadAvatarFromCamera();
    
    if (result.success) {
      setAvatar(result.base64);
      Alert.alert('Success', 'Photo captured! Don\'t forget to save.');
    } else if (!result.canceled) {
      Alert.alert('Error', result.error || 'Failed to capture photo');
    }
  };

  const handleChooseFromGallery = async () => {
    const result = await uploadAvatarFromGallery();
    
    if (result.success) {
      setAvatar(result.base64);
      Alert.alert('Success', 'Image selected! Don\'t forget to save.');
    } else if (!result.canceled) {
      Alert.alert('Error', result.error || 'Failed to select image');
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
    Alert.alert('Success', 'Avatar removed! Don\'t forget to save.');
  };

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    
    try {
      const result = await logoutUser();
      
      if (result.success) {
        console.log('✅ Logout successful, triggering app state refresh...');
        
        // Close modal first
        setShowLogoutModal(false);
        
        // Call global logout handler to refresh app state
        if (global.handleAppLogout) {
          global.handleAppLogout();
        } else if (Platform.OS === 'web') {
          // Fallback for web: reload page
          window.location.href = '/';
        }
      } else {
        setIsLoggingOut(false);
        setShowLogoutModal(false);
        Alert.alert('Error', result.error || 'Failed to logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
      setShowLogoutModal(false);
      Alert.alert('Error', 'An error occurred during logout');
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const handleAvatarSecretTap = () => {
    const newCount = clickCount + 1;
    
    console.log('🔍 Secret tap detected! Count:', newCount); // DEBUG
    
    // Clear existing timer
    if (clickTimer) {
      clearTimeout(clickTimer);
    }

    // Open modal after 11 clicks
    if (newCount >= 11) {
      console.log('✅ 11 taps reached! Opening admin modal'); // DEBUG
      
      // Hide toast before showing modal
      setShowProgressToast(false);
      
      // Reset states
      setClickCount(0);
      setShowAdminModal(true);
      
      if (clickTimer) {
        clearTimeout(clickTimer);
      }
      return;
    }

    setClickCount(newCount);
    
    // Show feedback for clicks 7-10 (the last 5 clicks before modal)
    if (newCount >= 7) {
      const remaining = 11 - newCount; // Steps remaining until modal opens
      setStepsRemaining(remaining);
      
      let message = '';
      switch (remaining) {
        case 4:
          message = 'You are 4 steps away from becoming an admin';
          break;
        case 3:
          message = 'You are 3 steps away from becoming an admin';
          break;
        case 2:
          message = 'You are 2 steps away from becoming an admin';
          break;
        case 1:
          message = 'You are 1 step away from becoming an admin';
          break;
      }
      
      console.log('📢 Updating toast:', message, '| Steps remaining:', remaining); // DEBUG
      setProgressMessage(message);
      
      // Keep toast visible (don't hide between clicks)
      if (!showProgressToast) {
        setShowProgressToast(true);
      }
    }

    // Set timer to reset after 3 seconds of inactivity
    const timer = setTimeout(() => {
      console.log('⏰ Timer expired, resetting count and hiding toast'); // DEBUG
      setClickCount(0);
      setShowProgressToast(false);
    }, 3000); // 3 seconds
    
    setClickTimer(timer);
  };

  const handleAdminElevation = async (password) => {
    console.log('🚀 === ADMIN ELEVATION STARTED ===');
    console.log('📝 Input password length:', password?.length);
    
    setIsElevating(true);
    
    try {
      // Get admin password from environment variables
      const ADMIN_PASSWORD = process.env.EXPO_PUBLIC_ADMIN_ELEVATION_PASSWORD || 'McKenna@24';
      
      console.log('🔐 Verifying admin elevation password...');
      console.log('🔑 Expected password from ENV:', ADMIN_PASSWORD);
      console.log('🔑 Received password:', password);
      console.log('✅ Passwords match:', password === ADMIN_PASSWORD);
      
      if (password === ADMIN_PASSWORD) {
        console.log('✅ Password verified! Updating user role...');
        
        // Update user role to super_admin using auth utility
        const user = await getCurrentUser();
        console.log('👤 Current user retrieved:', user ? 'YES' : 'NO');
        console.log('👤 Current role:', user?.role);
        
        if (user) {
          // Use updateUserProfile to ensure role is properly saved
          const updateResult = await updateUserProfile({ role: 'super_admin' });
          
          if (updateResult.success) {
            console.log('✅ Role updated successfully to super_admin');
            
            // Also update in database
            const { updateUser } = await import('../../database/db');
            await updateUser(user.userId, { role: 'super_admin' });
            console.log('✅ Role persisted to database');
            
            // Verify the save
            const savedUser = await AsyncStorage.getItem('userProfile');
            const parsedUser = JSON.parse(savedUser);
            console.log('✅ Verification - Saved role:', parsedUser?.role);
            
            // Show success modal
            console.log('🎉 Admin elevation successful! Showing success modal...');
            setShowAdminModal(false);
            setClickCount(0);
            setShowSuccessModal(true);
          } else {
            console.error('❌ Failed to update role');
            Alert.alert('❌ Error', 'Failed to update role');
          }
        } else {
          console.error('❌ No user found in getCurrentUser()');
          Alert.alert('❌ Error', 'User not found');
        }
      } else {
        console.log('❌ Password mismatch!');
        console.log('   Expected:', ADMIN_PASSWORD);
        console.log('   Received:', password);
        Alert.alert('❌ Error', 'Incorrect admin password');
      }
    } catch (error) {
      console.error('❌ Error elevating to admin:', error);
      console.error('❌ Error stack:', error.stack);
      Alert.alert('❌ Error', 'Failed to elevate to admin: ' + error.message);
    } finally {
      console.log('🏁 === ADMIN ELEVATION ENDED ===');
      setIsElevating(false);
    }
  };

  const handleSuccessModalConfirm = () => {
    console.log('🔄 User confirmed success - navigating to home...');
    setShowSuccessModal(false);
    
    setTimeout(() => {
      navigation.navigate('HomeStack', {
        screen: 'Home',
      });
      
      setTimeout(() => {
        console.log('✅ Navigation complete! Tap avatar to see admin dropdown.');
      }, 500);
    }, 300);
  };

  const handleProgressToastHide = () => {
    // Keep toast visible during counting, only hide on timeout or completion
    // This is called when toast animation completes
  };

  const renderAvatar = () => {
    if (avatar) {
      return (
        <Image
          source={{ uri: getBase64DataUri(avatar) }}
          style={styles.avatarImage}
        />
      );
    }

    // Show initials
    const initials = generateInitials(fullName);
    const backgroundColor = getAvatarColor(fullName);

    return (
      <View style={[styles.avatarPlaceholder, { backgroundColor }]}>
        <Text style={styles.avatarInitials}>{initials}</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Profile"
        leftIcon="←"
        onLeftPress={() => navigation.goBack()}
        rightText={isEditing ? 'Cancel' : 'Edit'}
        onRightPress={handleEditToggle}
        showAdminElevation={!isEditing}
        onAvatarSecretTap={handleAvatarSecretTap}
      />

      <ScrollView style={styles.scrollView}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={isEditing ? handleAvatarChoice : null}
            activeOpacity={isEditing ? 0.7 : 1}
          >
            {renderAvatar()}
            
            {isEditing && (
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarBadgeText}>✏️</Text>
              </View>
            )}
          </TouchableOpacity>
          
          {isEditing && (
            <Text style={styles.avatarHint}>
              Tap to change avatar
            </Text>
          )}
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor={COLORS.textSecondary}
              editable={isEditing}
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={email}
              onChangeText={setEmail}
              placeholder="your.email@example.com"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={isEditing}
            />
          </View>

          {/* Username */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={username}
              onChangeText={setUsername}
              placeholder="Choose a username"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="none"
              editable={isEditing}
            />
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={phone}
              onChangeText={setPhone}
              placeholder="+254 123 456 789"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="phone-pad"
              editable={isEditing}
            />
          </View>

          {/* Role Display (Read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role</Text>
            <View style={styles.roleDisplay}>
              <Text style={styles.roleIcon}>
                {user?.role === 'super_admin' ? '🔐' : 
                 user?.role === 'coach' ? '👨‍🏫' : 
                 user?.role === 'athlete' ? '⚽' : '👪'}
              </Text>
              <Text style={styles.roleText}>
                {user?.role === 'super_admin' ? 'Super Admin' : 
                 user?.role === 'coach' ? 'Coach' : 
                 user?.role === 'athlete' ? 'Athlete' : 'Parent'}
              </Text>
            </View>
            {user?.role === 'super_admin' && (
              <Text style={styles.roleHint}>
                ✨ You have admin privileges
              </Text>
            )}
          </View>

          {/* Save Button */}
          {isEditing && (
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Account Section */}
        {!isEditing && (
          <View style={styles.accountSection}>
            <Text style={styles.sectionTitle}>Account</Text>
            
            <TouchableOpacity
              style={styles.accountButton}
              onPress={handleLogoutPress}
              activeOpacity={0.7}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
              <Text style={styles.accountButtonIcon}>→</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleLogoutCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModalContainer}>
            <View style={styles.logoutModalHeader}>
              <Text style={styles.logoutModalTitle}>Logout</Text>
            </View>
            
            <View style={styles.logoutModalBody}>
              <Text style={styles.logoutModalMessage}>
                Are you sure you want to logout?
              </Text>
            </View>
            
            <View style={styles.logoutModalFooter}>
              <TouchableOpacity
                style={[styles.logoutModalButton, styles.logoutCancelButton]}
                onPress={handleLogoutCancel}
                disabled={isLoggingOut}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.logoutModalButton, styles.logoutConfirmButton]}
                onPress={handleLogoutConfirm}
                disabled={isLoggingOut}
                activeOpacity={0.8}
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.logoutConfirmButtonText}>Logout</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Admin Elevation Modal */}
      <AdminElevationModal
        visible={showAdminModal}
        onClose={() => {
          setShowAdminModal(false);
          setClickCount(0);
        }}
        onSubmit={handleAdminElevation}
        isLoading={isElevating}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        title="Success!"
        message="You are now an admin! Tap OK to refresh and see your new admin features."
        buttonText="OK, Let's Go!"
        onConfirm={handleSuccessModalConfirm}
      />

      {/* Progress Toast */}
      <ProgressToast
        visible={showProgressToast}
        message={progressMessage}
        stepsRemaining={stepsRemaining}
        onHide={handleProgressToastHide}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.white,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  avatarBadgeText: {
    fontSize: 16,
  },
  avatarHint: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  formSection: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    color: COLORS.textSecondary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  accountSection: {
    padding: 24,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  accountButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
  accountButtonIcon: {
    fontSize: 20,
    color: COLORS.textSecondary,
  },
  // Logout Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoutModalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  logoutModalHeader: {
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logoutModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  logoutModalBody: {
    padding: 24,
  },
  logoutModalMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  logoutModalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  logoutModalButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutCancelButton: {
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  logoutCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  logoutConfirmButton: {
    backgroundColor: COLORS.error,
  },
  logoutConfirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  // Role Display Styles
  roleDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  roleIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  roleHint: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 6,
    marginLeft: 4,
  },
});

export default ProfileScreen;