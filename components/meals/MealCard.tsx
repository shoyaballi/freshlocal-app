import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Card, DietaryBadge, SpiceBadge, OptimizedImage } from '@/components/ui';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';
import type { Meal } from '@/types';

interface MealCardProps {
  meal: Meal;
  onPress?: () => void;
  showVendor?: boolean;
  vendorName?: string;
}

export function MealCard({ meal, onPress, showVendor = true, vendorName }: MealCardProps) {
  const fulfilmentLabel = meal.fulfilmentType === 'collection'
    ? '📍 Collection'
    : meal.fulfilmentType === 'delivery'
    ? '🚗 Delivery'
    : '📍 Both';

  const isLowStock = meal.stock <= 3 && meal.stock > 0;
  const isSoldOut = meal.stock === 0;

  return (
    <Card style={styles.card} onPress={onPress} noPadding>
      <View style={styles.imageContainer}>
        <OptimizedImage
          uri={meal.imageUrl}
          fallbackEmoji={meal.emoji}
          size="card"
          borderRadiusSize="none"
        />
        {isSoldOut && (
          <View style={styles.soldOutOverlay}>
            <Text style={styles.soldOutText}>Sold Out</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        {showVendor && vendorName && (
          <Text style={styles.vendorName}>{vendorName}</Text>
        )}
        <Text style={styles.mealName} numberOfLines={1}>
          {meal.name}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {meal.description}
        </Text>

        <View style={styles.badgeRow}>
          {meal.dietary.map((badge) => (
            <DietaryBadge key={badge} type={badge} showLabel={false} />
          ))}
          <SpiceBadge level={meal.spiceLevel} />
        </View>

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>£{meal.price.toFixed(2)}</Text>
            {meal.originalPrice && (
              <Text style={styles.originalPrice}>
                £{meal.originalPrice.toFixed(2)}
              </Text>
            )}
          </View>

          <View style={styles.metaContainer}>
            {isLowStock && (
              <Text style={styles.lowStock}>Only {meal.stock} left!</Text>
            )}
            <Text style={styles.fulfilment}>{fulfilmentLabel}</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

interface MealCardCompactProps {
  meal: Meal;
  onPress?: () => void;
}

export function MealCardCompact({ meal, onPress }: MealCardCompactProps) {
  return (
    <Pressable onPress={onPress} style={styles.compactCard}>
      <View style={styles.compactImageContainer}>
        <OptimizedImage
          uri={meal.imageUrl}
          fallbackEmoji={meal.emoji}
          size="thumbnail"
          borderRadiusSize="sm"
        />
      </View>
      <View style={styles.compactContent}>
        <Text style={styles.compactName} numberOfLines={1}>
          {meal.name}
        </Text>
        <Text style={styles.compactPrice}>£{meal.price.toFixed(2)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 180,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 100,
    position: 'relative',
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOutText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.backgroundWhite,
  },
  content: {
    padding: spacing.md,
  },
  vendorName: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  mealName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  price: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.primary,
  },
  originalPrice: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.grey400,
    textDecorationLine: 'line-through',
  },
  metaContainer: {
    alignItems: 'flex-end',
  },
  lowStock: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.error,
  },
  fulfilment: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },

  // Compact styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  compactImageContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  compactContent: {
    flex: 1,
  },
  compactName: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  compactPrice: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
});

export default MealCard;
