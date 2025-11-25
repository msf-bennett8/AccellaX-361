//app/src/screens/Notes/AddEditNoteScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { COLORS } from '../../utils/constants';
import Header from '../../components/common/Header';
import Dropdown from '../../components/common/Dropdown';
import { getCurrentUserId } from '../../utils/auth';
import { insertNote, updateNote, getAllKids, getAllSessions } from '../../database/db';

const AddEditNoteScreen = ({ route, navigation }) => {
  const { note } = route.params || {};
  const isEditing = !!note;

  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [noteType, setNoteType] = useState(note?.note_type || 'general');
  const [relatedId, setRelatedId] = useState(note?.related_id || null);
  const [relatedName, setRelatedName] = useState(note?.related_name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerData, setPickerData] = useState([]);

  const NOTE_TYPES = [
    { label: 'General Note', value: 'general' },
    { label: 'Session Note', value: 'session' },
    { label: 'Kid Note', value: 'kid' },
  ];

  useEffect(() => {
    if (noteType !== 'general' && !relatedId) {
      loadPickerData();
    }
  }, [noteType]);

  const loadPickerData = async () => {
    try {
      if (noteType === 'session') {
        const sessions = await getAllSessions();
        setPickerData(
          sessions.map(s => ({
            id: s.id,
            name: `${s.session_date} - ${s.session_time}`,
          }))
        );
      } else if (noteType === 'kid') {
        const kids = await getAllKids();
        setPickerData(
          kids.map(k => ({
            id: k.id,
            name: k.name,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading picker data:', error);
    }
  };

  const handleNoteTypeChange = (value) => {
    setNoteType(value);
    setRelatedId(null);
    setRelatedName('');
    if (value !== 'general') {
      loadPickerData();
    }
  };

  const handleSelectRelated = (item) => {
    setRelatedId(item.id);
    setRelatedName(item.name);
    setShowPicker(false);
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title');
      return false;
    }
    if (!content.trim()) {
      Alert.alert('Validation Error', 'Please enter note content');
      return false;
    }
    if (noteType !== 'general' && !relatedId) {
      Alert.alert(
        'Validation Error',
        `Please select a ${noteType === 'session' ? 'session' : 'kid'}`
      );
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      const userId = await getCurrentUserId();

      const noteData = {
        title: title.trim(),
        content: content.trim(),
        note_type: noteType,
        related_id: noteType === 'general' ? null : relatedId,
        related_name: noteType === 'general' ? null : relatedName,
      };

      if (isEditing) {
        await updateNote(note.id, noteData);
        Alert.alert('Success', 'Note updated successfully');
      } else {
        await insertNote(userId, noteData);
        Alert.alert('Success', 'Note created successfully');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={isEditing ? 'Edit Note' : 'New Note'}
        leftIcon="←"
        onLeftPress={() => navigation.goBack()}
        rightIcon="✓"
        onRightPress={handleSave}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Note Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Note Type</Text>
          <Dropdown
            options={NOTE_TYPES}
            value={noteType}
            onSelect={handleNoteTypeChange}
            placeholder="Select note type"
          />
        </View>

        {/* Related Entity Picker */}
        {noteType !== 'general' && (
          <View style={styles.section}>
            <Text style={styles.label}>
              {noteType === 'session' ? 'Select Session' : 'Select Kid'}
            </Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowPicker(true)}
            >
              <Text style={relatedName ? styles.pickerText : styles.pickerPlaceholder}>
                {relatedName || `Select ${noteType === 'session' ? 'session' : 'kid'}`}
              </Text>
              <Text style={styles.pickerIcon}>▼</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter note title"
            placeholderTextColor={COLORS.textSecondary}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Content */}
        <View style={styles.section}>
          <Text style={styles.label}>Content *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Write your note here..."
            placeholderTextColor={COLORS.textSecondary}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : isEditing ? 'Update Note' : 'Create Note'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Picker Modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {noteType === 'session' ? 'Session' : 'Kid'}
              </Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={pickerData}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => handleSelectRelated(item)}
                >
                  <Text style={styles.pickerItemText}>{item.name}</Text>
                  {relatedId === item.id && (
                    <Text style={styles.pickerItemCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
    padding: 16,
  },
  section: {
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
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 150,
    paddingTop: 12,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pickerText: {
    fontSize: 16,
    color: COLORS.text,
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  pickerIcon: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalClose: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pickerItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  pickerItemCheck: {
    fontSize: 20,
    color: COLORS.primary,
  },
});

export default AddEditNoteScreen;