// src/components/kids/KidModal.js

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
} from 'react-native';
import { COLORS } from '../../utils/constants';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const KidModal = ({
  visible,
  kid,
  onClose,
  onEdit,
  onSuspend,
  onActivate,
  onDelete,
  showAttendanceOption = false,
  onViewAttendance,
}) => {
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Slide up and fade in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide down and fade out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleDelete = () => {
    handleClose();
    setTimeout(() => {
      Alert.alert(
        'Delete Kid',
        `Are you sure you want to delete ${kid?.name}? This action cannot be undone and will remove all attendance records for this kid.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => onDelete(kid),
          },
        ]
      );
    }, 300);
  };

  const handleSuspendToggle = () => {
    const isSuspended = kid?.status === 'suspended';
    handleClose();
    setTimeout(() => {
      Alert.alert(
        isSuspended ? 'Activate Kid' : 'Suspend Kid',
        isSuspended
          ? `Reactivate ${kid?.name}? They will appear in attendance lists again.`
          : `Suspend ${kid?.name}? They will be hidden from attendance marking but their records will be preserved.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: isSuspended ? 'Activate' : 'Suspend',
            onPress: () => {
              if (isSuspended) {
                onActivate(kid);
              } else {
                onSuspend(kid);
              }
            },
          },
        ]
      );
    }, 300);
  };

  const handleEdit = () => {
    handleClose();
    setTimeout(() => {
      onEdit(kid);
    }, 300);
  };

  const handleViewAttendance = () => {
    handleClose();
    setTimeout(() => {
      onViewAttendance(kid);
    }, 300);
  };

  if (!kid) return null;

  const isSuspended = kid.status === 'suspended';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Handle Bar */}
              <View style={styles.handleBar} />

              {/* Kid Info Header */}
              <View style={styles.header}>
                <View style={styles.avatarLarge}>
                  <Text style={styles.avatarTextLarge}>
                    {kid.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.headerInfo}>
                  <Text style={styles.kidName}>{kid.name}</Text>
                  <View style={styles.headerDetails}>
                    {kid.age && (
                      <Text style={styles.headerDetailText}>
                        {kid.age} years old
                      </Text>
                    )}
                    {kid.gender && (
                      <>
                        <Text style={styles.headerDetailDivider}>•</Text>
                        <Text style={styles.headerDetailText}>{kid.gender}</Text>
                      </>
                    )}
                  </View>
                  {kid.age_group && (
                    <View style={styles.ageGroupBadge}>
                      <Text style={styles.ageGroupText}>
                        {kid.age_group} years group
                      </Text>
                    </View>
                  )}
                  {kid.area_of_residence && (
                    <Text style={styles.areaText}>📍 {kid.area_of_residence}</Text>
                  )}
                </View>
              </View>

              {/* Status Badge */}
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusBadgeLarge,
                    {
                      backgroundColor: isSuspended
                        ? '#FFF3E0'
                        : '#E8F5E9',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusTextLarge,
                      {
                        color: isSuspended ? COLORS.warning : COLORS.present,
                      },
                    ]}
                  >
                    {isSuspended ? '⏸️ Suspended' : '✓ Active'}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Action Options */}
              <ScrollView style={styles.optionsContainer}>
                {/* View Attendance */}
                {showAttendanceOption && onViewAttendance && (
                  <TouchableOpacity
                    style={styles.option}
                    onPress={handleViewAttendance}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: '#E3F2FD' }]}>
                      <Text style={styles.optionIconText}>📊</Text>
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>View Attendance</Text>
                      <Text style={styles.optionDescription}>
                        See attendance history and statistics
                      </Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                )}

                {/* Edit */}
                <TouchableOpacity
                  style={styles.option}
                  onPress={handleEdit}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionIcon, { backgroundColor: '#E8F5E9' }]}>
                    <Text style={styles.optionIconText}>✏️</Text>
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>Edit Details</Text>
                    <Text style={styles.optionDescription}>
                      Update name, age, gender, or area
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>

                {/* Suspend/Activate */}
                <TouchableOpacity
                  style={styles.option}
                  onPress={handleSuspendToggle}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.optionIcon,
                      {
                        backgroundColor: isSuspended ? '#E8F5E9' : '#FFF3E0',
                      },
                    ]}
                  >
                    <Text style={styles.optionIconText}>
                      {isSuspended ? '▶️' : '⏸️'}
                    </Text>
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>
                      {isSuspended ? 'Activate' : 'Suspend'}
                    </Text>
                    <Text style={styles.optionDescription}>
                      {isSuspended
                        ? 'Restore kid to active attendance'
                        : 'Temporarily remove from attendance lists'}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>

                 {/* Mark as Inactive */}
                {kid.status === 'active' && (
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => {
                      handleClose();
                      setTimeout(() => {
                        Alert.alert(
                          'Mark as Inactive',
                          `Mark ${kid?.name} as inactive? They stopped attending but might return later.`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Mark Inactive',
                              onPress: () => onActivate ? onActivate({ ...kid, status: 'inactive' }) : null,
                            },
                          ]
                        );
                      }, 300);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: '#FFF9C4' }]}>
                      <Text style={styles.optionIconText}>⏸️</Text>
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>Mark as Inactive</Text>
                      <Text style={styles.optionDescription}>
                        Kid stopped attending but might return
                      </Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                )}

                {/* Mark as Discontinued */}
                {(kid.status === 'active' || kid.status === 'inactive') && (
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => {
                      handleClose();
                      setTimeout(() => {
                        Alert.alert(
                          'Mark as Discontinued',
                          `Mark ${kid?.name} as discontinued? This is for kids who permanently left (expelled/moved away).`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Mark Discontinued',
                              style: 'destructive',
                              onPress: () => onActivate ? onActivate({ ...kid, status: 'discontinued' }) : null,
                            },
                          ]
                        );
                      }, 300);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: '#FFEBEE' }]}>
                      <Text style={styles.optionIconText}>🚫</Text>
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={[styles.optionTitle, { color: COLORS.error }]}>
                        Mark as Discontinued
                      </Text>
                      <Text style={styles.optionDescription}>
                        Kid permanently left (expelled/moved)
                      </Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                )}

                {/* Delete */}
                <TouchableOpacity
                  style={[styles.option, styles.deleteOption]}
                  onPress={handleDelete}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionIcon, { backgroundColor: '#FFEBEE' }]}>
                    <Text style={styles.optionIconText}>🗑️</Text>
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionTitle, styles.deleteText]}>
                      Delete Kid
                    </Text>
                    <Text style={styles.optionDescription}>
                      Permanently remove kid and all records
                    </Text>
                  </View>
                  <Text style={[styles.chevron, styles.deleteText]}>›</Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -4px 8px rgba(0,0,0,0.15)',
      },
    }),
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarTextLarge: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  kidName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  headerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerDetailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  headerDetailDivider: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginHorizontal: 6,
  },
  ageGroupBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  ageGroupText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  areaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statusBadgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusTextLarge: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  deleteOption: {
    borderBottomWidth: 0,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionIconText: {
    fontSize: 20,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  chevron: {
    fontSize: 24,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  deleteText: {
    color: COLORS.absent,
  },
  cancelButton: {
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default KidModal;