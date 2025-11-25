//src/utils/imageUtils.js
// src/utils/imageUtils.js
// Image utilities for avatar upload and processing

import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// ========== CONFIGURATION ==========

const IMAGE_CONFIG = {
  maxWidth: 400,
  maxHeight: 400,
  quality: 0.8,
  format: SaveFormat.JPEG,
  maxSizeKB: 500, // Max 500KB
};

// ========== PERMISSIONS ==========

/**
 * Request camera permissions
 */
export const requestCameraPermissions = async () => {
  try {
    if (Platform.OS === 'web') {
      return { granted: true };
    }
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return { granted: status === 'granted' };
  } catch (error) {
    console.error('Error requesting camera permissions:', error);
    return { granted: false, error: error.message };
  }
};

/**
 * Request media library permissions
 */
export const requestMediaLibraryPermissions = async () => {
  try {
    if (Platform.OS === 'web') {
      return { granted: true };
    }
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return { granted: status === 'granted' };
  } catch (error) {
    console.error('Error requesting media library permissions:', error);
    return { granted: false, error: error.message };
  }
};

// ========== IMAGE PICKING ==========

/**
 * Pick image from gallery
 */
export const pickImageFromGallery = async () => {
  try {
    // Request permissions
    const permission = await requestMediaLibraryPermissions();
    if (!permission.granted) {
      return { 
        success: false, 
        error: 'Permission to access media library denied' 
      };
    }
    
    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square crop
      quality: 1,
    });
    
    if (result.canceled) {
      return { success: false, canceled: true };
    }
    
    return { 
      success: true, 
      uri: result.assets[0].uri,
      width: result.assets[0].width,
      height: result.assets[0].height,
    };
    
  } catch (error) {
    console.error('Error picking image:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Take photo with camera
 */
export const takePictureWithCamera = async () => {
  try {
    // Request permissions
    const permission = await requestCameraPermissions();
    if (!permission.granted) {
      return { 
        success: false, 
        error: 'Permission to access camera denied' 
      };
    }
    
    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1], // Square crop
      quality: 1,
    });
    
    if (result.canceled) {
      return { success: false, canceled: true };
    }
    
    return { 
      success: true, 
      uri: result.assets[0].uri,
      width: result.assets[0].width,
      height: result.assets[0].height,
    };
    
  } catch (error) {
    console.error('Error taking picture:', error);
    return { success: false, error: error.message };
  }
};

// ========== IMAGE PROCESSING ==========

/**
 * Compress and resize image
 */
export const compressImage = async (imageUri) => {
  try {
    const manipResult = await manipulateAsync(
      imageUri,
      [
        { resize: { width: IMAGE_CONFIG.maxWidth, height: IMAGE_CONFIG.maxHeight } },
      ],
      {
        compress: IMAGE_CONFIG.quality,
        format: IMAGE_CONFIG.format,
      }
    );
    
    return { 
      success: true, 
      uri: manipResult.uri,
      width: manipResult.width,
      height: manipResult.height,
    };
    
  } catch (error) {
    console.error('Error compressing image:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Convert image to base64
 */
export const imageToBase64 = async (imageUri) => {
  try {
    if (Platform.OS === 'web') {
      // For web, use fetch and FileReader
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
          resolve({ success: true, base64 });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      // For mobile, use expo-file-system
      const FileSystem = require('expo-file-system');
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      return { success: true, base64 };
    }
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get base64 with data URI prefix
 */
export const getBase64DataUri = (base64String) => {
  if (base64String.startsWith('data:')) {
    return base64String;
  }
  return `data:image/jpeg;base64,${base64String}`;
};

/**
 * Check if image size is within limit
 */
export const checkImageSize = (base64String) => {
  // Calculate size in KB
  const sizeInBytes = (base64String.length * 3) / 4;
  const sizeInKB = sizeInBytes / 1024;
  
  return {
    sizeKB: Math.round(sizeInKB),
    isWithinLimit: sizeInKB <= IMAGE_CONFIG.maxSizeKB,
  };
};

// ========== AVATAR PROCESSING PIPELINE ==========

/**
 * Complete avatar processing pipeline:
 * 1. Pick/capture image
 * 2. Compress and resize
 * 3. Convert to base64
 * 4. Validate size
 */
export const processAvatarImage = async (imageUri) => {
  try {
    console.log('📸 Processing avatar image...');
    
    // Step 1: Compress image
    const compressResult = await compressImage(imageUri);
    if (!compressResult.success) {
      return compressResult;
    }
    
    console.log('✅ Image compressed');
    
    // Step 2: Convert to base64
    const base64Result = await imageToBase64(compressResult.uri);
    if (!base64Result.success) {
      return base64Result;
    }
    
    console.log('✅ Image converted to base64');
    
    // Step 3: Check size
    const sizeCheck = checkImageSize(base64Result.base64);
    console.log(`📊 Image size: ${sizeCheck.sizeKB}KB`);
    
    if (!sizeCheck.isWithinLimit) {
      return {
        success: false,
        error: `Image too large (${sizeCheck.sizeKB}KB). Maximum allowed: ${IMAGE_CONFIG.maxSizeKB}KB`,
      };
    }
    
    return {
      success: true,
      base64: base64Result.base64,
      dataUri: getBase64DataUri(base64Result.base64),
      sizeKB: sizeCheck.sizeKB,
    };
    
  } catch (error) {
    console.error('Error processing avatar:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Upload avatar from gallery
 */
export const uploadAvatarFromGallery = async () => {
  const pickResult = await pickImageFromGallery();
  
  if (!pickResult.success) {
    return pickResult;
  }
  
  return await processAvatarImage(pickResult.uri);
};

/**
 * Upload avatar from camera
 */
export const uploadAvatarFromCamera = async () => {
  const cameraResult = await takePictureWithCamera();
  
  if (!cameraResult.success) {
    return cameraResult;
  }
  
  return await processAvatarImage(cameraResult.uri);
};

// ========== AVATAR INITIALS ==========

/**
 * Generate initials from full name
 * Example: "Fibonacci Benn" -> "FB"
 */
export const generateInitials = (fullName) => {
  if (!fullName) return '?';
  
  const names = fullName.trim().split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

/**
 * Generate avatar placeholder color based on name
 */
export const getAvatarColor = (name) => {
  if (!name) return '#9E9E9E';
  
  const colors = [
    '#E91E63', // Pink
    '#9C27B0', // Purple
    '#673AB7', // Deep Purple
    '#3F51B5', // Indigo
    '#2196F3', // Blue
    '#00BCD4', // Cyan
    '#009688', // Teal
    '#4CAF50', // Green
    '#FF9800', // Orange
    '#FF5722', // Deep Orange
  ];
  
  // Use first character to determine color
  const charCode = name.charCodeAt(0);
  const index = charCode % colors.length;
  
  return colors[index];
};

// ========== DELETE AVATAR ==========

/**
 * Delete avatar (returns null for base64)
 */
export const deleteAvatar = () => {
  return { success: true, base64: null };
};

// ========== EXPORTS ==========

export default {
  pickImageFromGallery,
  takePictureWithCamera,
  compressImage,
  imageToBase64,
  getBase64DataUri,
  checkImageSize,
  processAvatarImage,
  uploadAvatarFromGallery,
  uploadAvatarFromCamera,
  generateInitials,
  getAvatarColor,
  deleteAvatar,
  IMAGE_CONFIG,
};