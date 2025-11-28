// src/components/common/Avatar.js
import React from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';

const Avatar = ({
  source,
  name,
  size = 40,
  backgroundColor = '#2196F3',
  textColor = '#FFFFFF',
  style,
}) => {
  // Get initials from name
  const getInitials = (fullName) => {
    if (!fullName) return '?';
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const textStyle = {
    fontSize: size * 0.4,
    color: textColor,
  };

  // If image source is provided, show image
  if (source) {
    return (
      <View style={[styles.container, avatarStyle, style]}>
        <Image
          source={typeof source === 'string' ? { uri: source } : source}
          style={[styles.image, avatarStyle]}
          resizeMode="cover"
        />
      </View>
    );
  }

  // Otherwise show initials
  return (
    <View
      style={[
        styles.container,
        styles.initialsContainer,
        avatarStyle,
        { backgroundColor },
        style,
      ]}
    >
      <Text style={[styles.initials, textStyle]}>{getInitials(name)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initialsContainer: {
    backgroundColor: '#2196F3',
  },
  initials: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default Avatar;