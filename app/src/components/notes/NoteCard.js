//app/src/components/notes/NoteCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { COLORS } from '../../utils/constants';

const NoteCard = ({ note, onPress, compact = false }) => {
  const getTypeColor = (type) => {
    switch (type) {
      case 'session':
        return '#2196F3';
      case 'kid':
        return '#4CAF50';
      case 'general':
        return '#FF9800';
      default:
        return COLORS.textSecondary;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'session':
        return '📅';
      case 'kid':
        return '👶';
      case 'general':
        return '📝';
      default:
        return '📝';
    }
  };

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactContainer} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactIcon}>{getTypeIcon(note.note_type)}</Text>
          <Text style={styles.compactTitle} numberOfLines={1}>
            {note.title}
          </Text>
        </View>
        <Text style={styles.compactContent} numberOfLines={2}>
          {note.content}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.typeBadge, { backgroundColor: getTypeColor(note.note_type) + '20' }]}>
        <Text style={styles.typeIcon}>{getTypeIcon(note.note_type)}</Text>
        <Text style={[styles.typeBadgeText, { color: getTypeColor(note.note_type) }]}>
          {note.note_type}
        </Text>
      </View>

      <Text style={styles.title}>{note.title}</Text>

      {note.related_name && (
        <Text style={styles.relatedText}>
          📎 {note.related_name}
        </Text>
      )}

      <Text style={styles.content} numberOfLines={4}>
        {note.content}
      </Text>

      <Text style={styles.date}>
        {new Date(note.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  typeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  relatedText: {
    fontSize: 13,
    color: COLORS.primary,
    marginBottom: 8,
  },
  content: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  date: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  // Compact styles
  compactContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  compactIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  compactTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  compactContent: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
});

export default NoteCard;