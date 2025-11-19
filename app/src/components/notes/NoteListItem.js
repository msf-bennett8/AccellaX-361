//app/src/components/notes/NoteListItem.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { COLORS } from '../../utils/constants';

const NoteListItem = ({ note, onPress, onDelete }) => {
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

  const getTypeLabel = (type) => {
    switch (type) {
      case 'session':
        return 'Session Note';
      case 'kid':
        return 'Kid Note';
      case 'general':
        return 'General Note';
      default:
        return 'Note';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <Text style={styles.typeIcon}>{getTypeIcon(note.note_type)}</Text>
          <Text style={styles.typeLabel}>{getTypeLabel(note.note_type)}</Text>
        </View>
        <Text style={styles.dateText}>{formatDate(note.created_at)}</Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {note.title}
      </Text>

      {note.related_name && (
        <View style={styles.relatedContainer}>
          <Text style={styles.relatedLabel}>Related to:</Text>
          <Text style={styles.relatedName}>{note.related_name}</Text>
        </View>
      )}

      <Text style={styles.content} numberOfLines={3}>
        {note.content}
      </Text>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
        </TouchableOpacity>
        <Text style={styles.tapHint}>Tap to edit</Text>
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  relatedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  relatedLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  relatedName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  content: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteButtonText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '600',
  },
  tapHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});

export default NoteListItem;