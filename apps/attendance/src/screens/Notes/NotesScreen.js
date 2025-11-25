//app/src/screens/Notes/NotesScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SCREEN_NAMES } from '../../utils/constants';
import Header from '../../components/common/Header';
import FAB from '../../components/common/FAB';
import NoteListItem from '../../components/notes/NoteListItem';
import { getCurrentUserId } from '../../utils/auth';
import { getAllNotes, deleteNote } from '../../database/db';

const NotesScreen = ({ navigation }) => {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('all'); // all, session, kid, general

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [])
  );

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      const userId = await getCurrentUserId();
      
      if (!userId) {
        console.warn('⚠️ No user ID found');
        setNotes([]);
        setFilteredNotes([]);
        setIsLoading(false);
        return;
      }

      const allNotes = await getAllNotes();
      console.log(`📝 Loaded ${allNotes.length} notes`);
      
      setNotes(allNotes);
      applyFilters(allNotes, filterType, searchQuery);
    } catch (error) {
      console.error('❌ Error loading notes:', error);
      Alert.alert('Error', 'Failed to load notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = (notesData, type, query) => {
    let filtered = notesData;

    // Filter by type
    if (type !== 'all') {
      filtered = filtered.filter(n => n.note_type === type);
    }

    // Search filter
    if (query.trim() !== '') {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(lowerQuery) ||
        n.content.toLowerCase().includes(lowerQuery) ||
        (n.related_name && n.related_name.toLowerCase().includes(lowerQuery))
      );
    }

    setFilteredNotes(filtered);
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    applyFilters(notes, type, searchQuery);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    applyFilters(notes, filterType, query);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  };

  const handleDeleteNote = (noteId, noteTitle) => {
    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${noteTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNote(noteId);
              Alert.alert('Success', 'Note deleted successfully');
              loadNotes();
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={styles.emptyTitle}>No Notes Yet</Text>
      <Text style={styles.emptySubtitle}>
        Tap the + button to create your first note
      </Text>
    </View>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading notes...</Text>
        </View>
      );
    }

    if (notes.length === 0) {
      return renderEmptyState();
    }

    if (filteredNotes.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No Results Found</Text>
          <Text style={styles.emptySubtitle}>
            Try adjusting your search or filters
          </Text>
        </View>
      );
    }

    return filteredNotes.map((note) => (
      <NoteListItem
        key={note.id}
        note={note}
        onPress={() =>
          navigation.navigate('AddEditNote', { note })
        }
        onDelete={() => handleDeleteNote(note.id, note.title)}
      />
    ));
  };

  return (
    <View style={styles.container}>
      <Header
        title="Notes"
        leftIcon="☰"
        onLeftPress={() => navigation.openDrawer()}
        rightIcon="+"
        onRightPress={() => navigation.navigate('AddEditNote')}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => handleSearch('')}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        {notes.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScrollView}
            contentContainerStyle={styles.filterContainer}
          >
            {['all', 'session', 'kid', 'general'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterChip,
                  filterType === type && styles.filterChipActive,
                ]}
                onPress={() => handleFilterChange(type)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterType === type && styles.filterChipTextActive,
                  ]}
                >
                  {type === 'all' ? 'All Notes' : 
                   type === 'session' ? 'Session Notes' :
                   type === 'kid' ? 'Kid Notes' : 'General Notes'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Stats Summary */}
        {notes.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{notes.length}</Text>
              <Text style={styles.statLabel}>Total Notes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {notes.filter(n => n.note_type === 'session').length}
              </Text>
              <Text style={styles.statLabel}>Session</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {notes.filter(n => n.note_type === 'kid').length}
              </Text>
              <Text style={styles.statLabel}>Kid</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {notes.filter(n => n.note_type === 'general').length}
              </Text>
              <Text style={styles.statLabel}>General</Text>
            </View>
          </View>
        )}

        {/* Notes List */}
        <View style={styles.notesList}>{renderContent()}</View>
      </ScrollView>

      <FAB
        icon="+"
        onPress={() => navigation.navigate('AddEditNote')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  filterScrollView: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  notesList: {
    paddingHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 400,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});

export default NotesScreen;