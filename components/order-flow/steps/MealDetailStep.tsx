import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Button, DietaryBadge, SpiceBadge } from '@/components/ui';
import { QuantitySelector, FulfilmentToggle } from '../components';
import { useOrderFlow } from '../OrderFlowContext';
import { colors, fonts, fontSizes, spacing } from '@/constants/theme';

export function MealDetailStep() {
  const { state, dispatch } = useOrderFlow();
  const { meal, vendor, fulfilmentType, quantity } = state;

  if (!meal || !vendor) return null;

  const canSelectFulfilment = meal.fulfilmentType === 'both';
  const maxQuantity = meal.stock;
  const isLowStock = meal.stock <= 3 && meal.stock > 0;
  const isSoldOut = meal.stock === 0;

  const handleContinue = () => {
    if (!fulfilmentType) {
      // If "both", user must select one
      return;
    }
    dispatch({ type: 'NEXT_STEP' });
  };

  const canContinue = fulfilmentType !== null && quantity > 0 && !isSoldOut;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {/* Emoji Header */}
      <View style={styles.emojiContainer}>
        <Text style={styles.emoji}>{meal.emoji}</Text>
      </View>

      {/* Meal Info */}
      <Text style={styles.mealName}>{meal.name}</Text>
      <Text style={styles.vendorName}>{vendor.businessName}</Text>
      <Text style={styles.description}>{meal.description}</Text>

      {/* Badges */}
      <View style={styles.badgeRow}>
        {meal.dietary.map((badge) => (
          <DietaryBadge key={badge} type={badge} />
        ))}
        <SpiceBadge level={meal.spiceLevel} />
      </View>

      {/* Price */}
      <View style={styles.priceRow}>
        <Text style={styles.price}>£{meal.price.toFixed(2)}</Text>
        {meal.originalPrice && (
          <Text style={styles.originalPrice}>£{meal.originalPrice.toFixed(2)}</Text>
        )}
      </View>

      {/* Stock indicator */}
      {isSoldOut ? (
        <View style={styles.soldOutBanner}>
          <Text style={styles.soldOutText}>Sold Out</Text>
        </View>
      ) : isLowStock ? (
        <Text style={styles.lowStock}>Only {meal.stock} left!</Text>
      ) : (
        <Text style={styles.stock}>{meal.stock} available</Text>
      )}

      {/* Fulfilment Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fulfilment</Text>
        {canSelectFulfilment ? (
          <FulfilmentToggle
            value={fulfilmentType}
            onChange={(type) => dispatch({ type: 'SET_FULFILMENT_TYPE', payload: type })}
          />
        ) : (
          <View style={styles.fulfilmentFixed}>
            <Text style={styles.fulfilmentEmoji}>
              {meal.fulfilmentType === 'collection' ? '📍' : '🚗'}
            </Text>
            <Text style={styles.fulfilmentLabel}>
              {meal.fulfilmentType === 'collection' ? 'Collection only' : 'Delivery only'}
            </Text>
          </View>
        )}
      </View>

      {/* Quantity Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quantity</Text>
        <View style={styles.quantityRow}>
          <QuantitySelector
            value={quantity}
            onChange={(val) => dispatch({ type: 'SET_QUANTITY', payload: val })}
            min={1}
            max={maxQuantity}
          />
          <Text style={styles.quantityHint}>Max {maxQuantity}</Text>
        </View>
      </View>

      {/* Continue Button */}
      <Button
        onPress={handleContinue}
        disabled={!canContinue}
        fullWidth
        style={styles.continueButton}
      >
        Continue
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing['3xl'],
  },
  emojiContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.accentPale,
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.lg,
    marginBottom: spacing.lg,
  },
  emoji: {
    fontSize: 80,
  },
  mealName: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  vendorName: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  price: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes['3xl'],
    color: colors.primary,
  },
  originalPrice: {
    fontFamily: fonts.body,
    fontSize: fontSizes.lg,
    color: colors.grey400,
    textDecorationLine: 'line-through',
  },
  stock: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  lowStock: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  soldOutBanner: {
    backgroundColor: colors.error,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  soldOutText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.backgroundWhite,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  fulfilmentFixed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.grey100,
    borderRadius: 12,
  },
  fulfilmentEmoji: {
    fontSize: 20,
  },
  fulfilmentLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  continueButton: {
    marginTop: spacing.lg,
  },
});

export default MealDetailStep;
