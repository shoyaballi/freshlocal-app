import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { Card, Badge } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';
import type { Vendor, FoodTag } from '@/types';

interface VendorCardProps {
  vendor: Vendor;
  onPress?: () => void;
  distance?: string;
  upcomingMeals?: number;
  isFavourite?: boolean;
  onFavouriteToggle?: (vendorId: string) => void;
}

const TAG_LABELS: Record<FoodTag, string> = {
  halal: 'Halal',
  vegetarian: 'Vegetarian',
  pakistani: 'Pakistani',
  bangladeshi: 'Bangladeshi',
  indian: 'Indian',
  middle_eastern: 'Middle Eastern',
  grill: 'Grill',
  street_food: 'Street Food',
  bakery: 'Bakery',
};

export function VendorCard({
  vendor,
  onPress,
  distance,
  upcomingMeals,
  isFavourite = false,
  onFavouriteToggle,
}: VendorCardProps) {
  const heartScale = useSharedValue(1);
  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handleHeartPress = () => {
    haptic.light();
    heartScale.value = withSequence(
      withSpring(1.3, { damping: 4, stiffness: 300 }),
      withSpring(1, { damping: 6, stiffness: 200 })
    );
    onFavouriteToggle?.(vendor.id);
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>{vendor.avatar}</Text>
        </View>
        <View style={styles.headerContent}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{vendor.businessName}</Text>
            {vendor.isVerified && <Text style={styles.verified}>✓</Text>}
          </View>
          <Text style={styles.handle}>@{vendor.handle}</Text>
        </View>
        {onFavouriteToggle && (
          <Pressable onPress={handleHeartPress} hitSlop={8}>
            <Animated.Text style={[styles.heartIcon, heartAnimatedStyle]}>
              {isFavourite ? '❤️' : '🤍'}
            </Animated.Text>
          </Pressable>
        )}
      </View>

      <View style={styles.tagRow}>
        {vendor.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="default" size="sm">
            {TAG_LABELS[tag]}
          </Badge>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.rating}>
          <Text style={styles.ratingText}>⭐ {vendor.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({vendor.reviewCount})</Text>
        </View>

        <View style={styles.meta}>
          {distance && <Text style={styles.metaText}>📍 {distance}</Text>}
          {upcomingMeals !== undefined && (
            <Text style={styles.metaText}>
              🍽️ {upcomingMeals} meal{upcomingMeals !== 1 ? 's' : ''} this week
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
}

interface VendorCardCompactProps {
  vendor: Vendor;
  onPress?: () => void;
}

export function VendorCardCompact({ vendor, onPress }: VendorCardCompactProps) {
  return (
    <Pressable onPress={onPress} style={styles.compactCard}>
      <Text style={styles.compactAvatar}>{vendor.avatar}</Text>
      <View style={styles.compactContent}>
        <Text style={styles.compactName}>{vendor.businessName}</Text>
        <Text style={styles.compactRating}>⭐ {vendor.rating.toFixed(1)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accentPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatar: {
    fontSize: 28,
  },
  headerContent: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
  },
  verified: {
    fontSize: fontSizes.sm,
    color: colors.success,
  },
  handle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  reviewCount: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  meta: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  heartIcon: {
    fontSize: 24,
  },

  // Compact styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  compactAvatar: {
    fontSize: 32,
  },
  compactContent: {
    flex: 1,
  },
  compactName: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  compactRating: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
});

export default VendorCard;
