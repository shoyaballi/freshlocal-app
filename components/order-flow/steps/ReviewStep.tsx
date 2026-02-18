import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { Button, Input } from '@/components/ui';
import { PriceBreakdown } from '../components';
import { useOrderFlow } from '../OrderFlowContext';
import { useAuth } from '@/hooks/useAuth';
import { useCreateOrder } from '@/hooks';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';

export function ReviewStep() {
  const { state, computed, dispatch } = useOrderFlow();
  const { isAuthenticated } = useAuth();
  const { createOrder, isLoading: isCreatingOrder } = useCreateOrder();

  const {
    meal,
    vendor,
    fulfilmentType,
    quantity,
    selectedAddress,
    selectedTimeSlot,
    notes,
    isSubmitting,
    error,
  } = state;

  const { subtotal, serviceFee, deliveryFee, total } = computed;

  if (!meal || !vendor || !fulfilmentType) return null;

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBack = () => {
    dispatch({ type: 'PREV_STEP' });
  };

  const handlePayment = async () => {
    // Check authentication
    if (!isAuthenticated) {
      Alert.alert(
        'Sign in required',
        'Please sign in to complete your order.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign In',
            onPress: () => router.push('/auth/login'),
          },
        ]
      );
      return;
    }

    dispatch({ type: 'SUBMIT_START' });

    try {
      const order = await createOrder({
        vendorId: vendor.id,
        items: [
          {
            mealId: meal.id,
            mealName: meal.name,
            quantity,
            unitPrice: Math.round(meal.price * 100), // Convert to pence
          },
        ],
        fulfilmentType: fulfilmentType === 'both' ? 'collection' : fulfilmentType,
        collectionTime: selectedTimeSlot || undefined,
        deliveryAddress: selectedAddress
          ? {
              label: selectedAddress.label,
              line1: selectedAddress.line1,
              line2: selectedAddress.line2,
              city: selectedAddress.city,
              postcode: selectedAddress.postcode,
            }
          : undefined,
        notes: notes || undefined,
      });

      dispatch({ type: 'SUBMIT_SUCCESS', payload: order });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create order';
      dispatch({ type: 'SUBMIT_ERROR', payload: errorMessage });
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <Pressable onPress={handleBack} style={styles.backLink}>
        <Text style={styles.backLinkText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Review your order</Text>

      {/* Order Summary */}
      <View style={styles.section}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryEmoji}>{meal.emoji}</Text>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryMeal}>{meal.name}</Text>
            <Text style={styles.summaryVendor}>{vendor.businessName}</Text>
          </View>
        </View>
      </View>

      {/* Fulfilment Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {fulfilmentType === 'collection' ? 'Collection' : 'Delivery'} details
        </Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Time</Text>
          <Text style={styles.detailValue}>
            {selectedTimeSlot ? formatTime(selectedTimeSlot) : 'Not selected'}
          </Text>
        </View>

        {fulfilmentType === 'delivery' && selectedAddress && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Address</Text>
            <Text style={styles.detailValue}>
              {selectedAddress.line1}, {selectedAddress.postcode}
            </Text>
          </View>
        )}

        {fulfilmentType === 'collection' && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{vendor.postcode}</Text>
          </View>
        )}
      </View>

      {/* Price Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Price breakdown</Text>
        <PriceBreakdown
          mealName={meal.name}
          quantity={quantity}
          subtotal={subtotal}
          serviceFee={serviceFee}
          deliveryFee={deliveryFee}
          total={total}
        />
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Input
          label="Order notes (optional)"
          placeholder="Any special requests?"
          value={notes}
          onChangeText={(text) => dispatch({ type: 'SET_NOTES', payload: text })}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Payment Button */}
      <Button
        onPress={handlePayment}
        loading={isSubmitting || isCreatingOrder}
        fullWidth
        style={styles.payButton}
      >
        Pay £{total.toFixed(2)}
      </Button>

      <Text style={styles.paymentNote}>
        Payment processing coming soon. Orders are confirmed immediately.
      </Text>
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
  backLink: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  backLinkText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
    marginBottom: spacing.xl,
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
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.grey100,
    borderRadius: borderRadius.lg,
  },
  summaryEmoji: {
    fontSize: 40,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryMeal: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
  },
  summaryVendor: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey200,
  },
  detailLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  detailValue: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.error,
    textAlign: 'center',
  },
  payButton: {
    marginTop: spacing.md,
  },
  paymentNote: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default ReviewStep;
