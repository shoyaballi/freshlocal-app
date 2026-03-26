import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StarRating } from './StarRating';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '@/constants/theme';
import type { Review } from '@/types';

interface ReviewCardProps {
  review: Review;
}

/** Return a human-friendly relative-time string. */
function formatRelativeDate(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffMonths / 12)}y ago`;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const userName = review.user?.name || 'Anonymous';
  const initial = userName.charAt(0).toUpperCase();

  return (
    <View style={styles.card}>
      {/* User avatar + name */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.date}>{formatRelativeDate(review.createdAt)}</Text>
        </View>
      </View>

      {/* Stars */}
      <StarRating rating={review.rating} size={fontSizes.sm} style={styles.stars} />

      {/* Comment */}
      {review.comment ? (
        <Text style={styles.comment}>{review.comment}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  meta: {
    flex: 1,
  },
  userName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  date: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textLight,
  },
  stars: {
    marginBottom: spacing.sm,
  },
  comment: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default ReviewCard;
