import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes, spacing } from '@/constants/theme';

interface PriceBreakdownProps {
  mealName: string;
  quantity: number;
  subtotal: number;
  serviceFee: number;
  deliveryFee: number;
  discountAmount?: number;
  total: number;
}

export function PriceBreakdown({
  mealName,
  quantity,
  subtotal,
  serviceFee,
  deliveryFee,
  discountAmount,
  total,
}: PriceBreakdownProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.itemLabel}>
          {mealName} × {quantity}
        </Text>
        <Text style={styles.itemValue}>£{subtotal.toFixed(2)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.feeLabel}>Subtotal</Text>
        <Text style={styles.feeValue}>£{subtotal.toFixed(2)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.feeLabel}>Service Fee (5%)</Text>
        <Text style={styles.feeValue}>£{serviceFee.toFixed(2)}</Text>
      </View>

      {deliveryFee > 0 && (
        <View style={styles.row}>
          <Text style={styles.feeLabel}>Delivery Fee</Text>
          <Text style={styles.feeValue}>£{deliveryFee.toFixed(2)}</Text>
        </View>
      )}

      {discountAmount !== undefined && discountAmount > 0 && (
        <View style={styles.row}>
          <Text style={styles.discountLabel}>Promo Discount</Text>
          <Text style={styles.discountValue}>-£{discountAmount.toFixed(2)}</Text>
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>£{total.toFixed(2)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.grey100,
    borderRadius: 12,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.grey200,
    marginVertical: spacing.sm,
  },
  itemLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  itemValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  feeLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  feeValue: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  totalLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
  },
  totalValue: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xl,
    color: colors.primary,
  },
  discountLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.success,
  },
  discountValue: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.success,
  },
});

export default PriceBreakdown;
