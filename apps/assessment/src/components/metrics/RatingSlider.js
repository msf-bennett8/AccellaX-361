// Location: /apps/assessment/src/components/metrics/RatingSlider.js
// 1-10 Rating Slider with Visual Feedback

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const RatingSlider = ({ value, onChange, previousValue, showPrevious }) => {
  const ratings = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const getRatingColor = (rating) => {
    if (rating <= 3) return '#F44336'; // Poor - Red
    if (rating <= 5) return '#FF9800'; // Fair - Orange
    if (rating <= 7) return '#2196F3'; // Good - Blue
    return '#4CAF50'; // Excellent - Green
  };

  const getRatingLabel = (rating) => {
    if (rating <= 3) return 'Poor';
    if (rating <= 5) return 'Fair';
    if (rating <= 7) return 'Good';
    return 'Excellent';
  };

  return (
    <View style={styles.container}>
      <View style={styles.ratingsContainer}>
        {ratings.map((rating) => (
          <TouchableOpacity
            key={rating}
            style={[
              styles.ratingButton,
              value === rating && styles.selectedRating,
              { borderColor: value === rating ? getRatingColor(rating) : '#E0E0E0' },
            ]}
            onPress={() => onChange(rating)}
          >
            <Text style={[
              styles.ratingText,
              value === rating && { color: getRatingColor(rating), fontWeight: 'bold' },
            ]}>
              {rating}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {value > 0 && (
        <View style={styles.feedbackContainer}>
          <View style={[styles.feedbackDot, { backgroundColor: getRatingColor(value) }]} />
          <Text style={[styles.feedbackText, { color: getRatingColor(value) }]}>
            {getRatingLabel(value)}
          </Text>
        </View>
      )}

      {showPrevious && previousValue && (
        <View style={styles.previousContainer}>
          <Text style={styles.previousText}>Last: {previousValue}/10</Text>
          <TouchableOpacity onPress={() => onChange(previousValue)} style={styles.usePreviousButton}>
            <Text style={styles.usePreviousText}>Use Previous</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  ratingsContainer: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  ratingButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 8, backgroundColor: '#FFF' },
  selectedRating: { backgroundColor: '#F5F5F5' },
  ratingText: { fontSize: 16, color: '#666' },
  feedbackContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, padding: 12, backgroundColor: '#F5F5F5', borderRadius: 8 },
  feedbackDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  feedbackText: { fontSize: 16, fontWeight: '600' },
  previousContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, padding: 12, backgroundColor: '#E3F2FD', borderRadius: 8 },
  previousText: { fontSize: 14, color: '#1976D2' },
  usePreviousButton: { backgroundColor: '#1976D2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  usePreviousText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
});

export default RatingSlider;