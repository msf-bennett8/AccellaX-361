// Location: /apps/assessment/src/components/cards/LeaderboardCard.js
// Reusable card component for leaderboards and rankings

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

export default function LeaderboardCard({
  rank,
  title,
  subtitle,
  score,
  icon,
  iconColor,
  badges = [],
  onPress,
  showTrend = false,
  trendValue = 0,
}) {
  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return COLORS.primary;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return COLORS.primary;
    if (score >= 40) return COLORS.warning;
    return COLORS.error;
  };

  const getTrendIcon = (value) => {
    if (value > 0) return 'trending-up';
    if (value < 0) return 'trending-down';
    return 'minus';
  };

  const getTrendColor = (value) => {
    if (value > 0) return COLORS.success;
    if (value < 0) return COLORS.error;
    return COLORS.textSecondary;
  };

  const CardContent = (
    <>
      {/* Rank Badge */}
      <View style={[styles.rankBadge, { backgroundColor: getRankColor(rank) + '20' }]}>
        <Text style={[styles.rankNumber, { color: getRankColor(rank) }]}>
          {rank}
        </Text>
      </View>

      {/* Card Info */}
      <View style={styles.cardInfo}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
          {showTrend && trendValue !== 0 && (
            <View style={[styles.trendBadge, { backgroundColor: getTrendColor(trendValue) + '20' }]}>
              <Ionicons
                name={getTrendIcon(trendValue)}
                size={12}
                color={getTrendColor(trendValue)}
              />
              <Text style={[styles.trendText, { color: getTrendColor(trendValue) }]}>
                {Math.abs(trendValue)}
              </Text>
            </View>
          )}
        </View>

        {subtitle && (
          <Text style={styles.cardSubtitle} numberOfLines={1}>{subtitle}</Text>
        )}

        {badges.length > 0 && (
          <View style={styles.badgesContainer}>
            {badges.map((badge, index) => (
              <View key={index} style={[styles.badge, { backgroundColor: badge.color + '20' }]}>
                {badge.icon && (
                  <MaterialCommunityIcons name={badge.icon} size={12} color={badge.color} />
                )}
                <Text style={[styles.badgeText, { color: badge.color }]}>
                  {badge.text}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Score Badge */}
      <View style={styles.scoreContainer}>
        <View
          style={[
            styles.scoreBadge,
            { backgroundColor: getScoreColor(score) + '20' }
          ]}
        >
          <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>
            {score}
          </Text>
        </View>
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={16}
            color={iconColor || COLORS.textSecondary}
            style={styles.scoreIcon}
          />
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
        {CardContent}
      </TouchableOpacity>
    );
  }

  return <View style={styles.card}>{CardContent}</View>;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardInfo: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    marginLeft: 8,
  },
  trendText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scoreContainer: {
    alignItems: 'center',
    marginLeft: 12,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreIcon: {
    marginTop: 4,
  },
});