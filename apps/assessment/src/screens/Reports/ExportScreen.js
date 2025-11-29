// Location: /apps/assessment/src/screens/Reports/ExportDetailScreen.js
// Export preview screen (optional - shows data before export)

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import { COLORS } from '../../utils/constants';

export default function ExportDetailScreen({ route, navigation }) {
  const { exportData, filters, format } = route.params || {};

  return (
    <View style={styles.container}>
      <Header
        title="Export Preview"
        subtitle={`${exportData?.length || 0} records • ${format}`}
        leftIcon="←"
        onLeftPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content}>
        <Text style={styles.previewText}>
          Preview of {exportData?.length || 0} records in {format} format
        </Text>
        
        <TouchableOpacity
          style={styles.exportButton}
          onPress={() => {
            // TODO: Implement actual export logic
            alert(`Exporting ${exportData?.length} records as ${format}`);
            navigation.goBack();
          }}
        >
          <Ionicons name="download" size={20} color={COLORS.white} />
          <Text style={styles.exportButtonText}>Export Now</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: 20 },
  previewText: { fontSize: 16, color: COLORS.text, marginBottom: 20 },
  exportButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  exportButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
});