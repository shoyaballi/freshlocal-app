import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui';
import { useOrderFlow } from '../OrderFlowContext';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';

interface ConfirmationStepProps {
  onClose: () => void;
}

export function ConfirmationStep({ onClose }: ConfirmationStepProps) {
  const { state } = useOrderFlow();
  const { createdOrder, vendor, fulfilmentType, selectedTimeSlot } = state;

  if (!createdOrder || !vendor) return null;

  const orderCode = createdOrder.id.slice(0, 8).toUpperCase();

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleTrackOrder = () => {
    onClose();
    router.push(`/order/${createdOrder.id}`);
  };

  const handleViewOrders = () => {
    onClose();
    router.push('/(tabs)/profile');
  };

  return (
    <View style={styles.container}>
      {/* Success Icon */}
      <View style={styles.successIcon}>
        <Text style={styles.checkmark}>✓</Text>
      </View>

      <Text style={styles.title}>Order confirmed!</Text>
      <Text style={styles.subtitle}>
        Your order has been placed successfully
      </Text>

      {/* Order Code */}
      <View style={styles.codeContainer}>
        <Text style={styles.codeLabel}>Order Code</Text>
        <Text style={styles.code}>{orderCode}</Text>
      </View>

      {/* Order Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Vendor</Text>
          <Text style={styles.summaryValue}>{vendor.businessName}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            {fulfilmentType === 'collection' ? 'Collection' : 'Delivery'}
          </Text>
          <Text style={styles.summaryValue}>
            {selectedTimeSlot ? formatTime(selectedTimeSlot) : 'TBD'}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>
            £{createdOrder.total.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Status Note */}
      <View style={styles.noteContainer}>
        <Text style={styles.noteText}>
          {fulfilmentType === 'collection'
            ? `Show this code when you collect your order from ${vendor.businessName}. Track your order for live updates!`
            : `Track your order for live updates when it's on its way!`}
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <Button onPress={handleTrackOrder} fullWidth>
          Track Order
        </Button>

        <Button onPress={handleViewOrders} fullWidth variant="outline">
          View My Orders
        </Button>

        <Button onPress={onClose} fullWidth variant="ghost" style={styles.doneButton}>
          Done
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing['2xl'],
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  checkmark: {
    fontSize: 40,
    color: colors.backgroundWhite,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  codeContainer: {
    backgroundColor: colors.accentPale,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  codeLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  code: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['3xl'],
    color: colors.accent,
    letterSpacing: 2,
  },
  summaryContainer: {
    width: '100%',
    backgroundColor: colors.grey100,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  summaryLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  noteContainer: {
    backgroundColor: colors.primaryPale,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
  },
  noteText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
    marginTop: 'auto',
  },
  doneButton: {
    marginBottom: spacing.lg,
  },
});

export default ConfirmationStep;
