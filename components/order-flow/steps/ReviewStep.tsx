import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { Button, Input } from '@/components/ui';
import { PriceBreakdown } from '../components';
import { useOrderFlow } from '../OrderFlowContext';
import { useAuth } from '@/hooks/useAuth';
import { useCreateOrder, useStripePayment, usePromoCodes } from '@/hooks';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';

export function ReviewStep() {
  const { state, computed, dispatch } = useOrderFlow();
  const { user, isAuthenticated } = useAuth();
  const { createOrder, isLoading: isCreatingOrder } = useCreateOrder();
  const { initializePayment, presentPaymentSheet, isLoading: isPaymentLoading } = useStripePayment();
  const { isValidating, appliedPromo, validateCode, calculateDiscount, applyCode, removeCode } = usePromoCodes();
  const [paymentStep, setPaymentStep] = useState<'idle' | 'creating' | 'paying'>('idle');
  const [promoInput, setPromoInput] = useState('');

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

  const { subtotal, serviceFee, deliveryFee, discountAmount, total } = computed;

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

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    const result = await validateCode(promoInput, subtotal);
    if (result.valid && result.promoCode) {
      const discount = calculateDiscount(result.promoCode, subtotal);
      applyCode(result.promoCode);
      dispatch({
        type: 'SET_PROMO',
        payload: { promoCodeId: result.promoCode.id, discountAmount: discount },
      });
      setPromoInput('');
    } else {
      Alert.alert('Invalid Code', result.error || 'This promo code is not valid.');
    }
  };

  const handleRemovePromo = () => {
    removeCode();
    dispatch({ type: 'REMOVE_PROMO' });
  };

  const handlePayment = async () => {
    // Check authentication
    if (!isAuthenticated || !user) {
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
    setPaymentStep('creating');

    try {
      // 1. Create order in 'pending' status
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
        promoCodeId: state.promoCodeId || undefined,
        discountAmount: state.discountAmount || undefined,
      });

      setPaymentStep('paying');

      // 2. Initialize Payment Sheet
      const paymentInitialized = await initializePayment(order.id, user.id);

      if (!paymentInitialized) {
        throw new Error('Failed to initialize payment');
      }

      // 3. Present Payment Sheet
      const { success, error: paymentError } = await presentPaymentSheet();

      if (!success) {
        if (paymentError === 'Payment cancelled') {
          // User cancelled - keep order pending, they can retry
          dispatch({ type: 'SUBMIT_ERROR', payload: 'Payment cancelled. Your order is saved.' });
          setPaymentStep('idle');
          return;
        }
        throw new Error(paymentError || 'Payment failed');
      }

      // 4. Payment successful - webhook will confirm order
      // Show success immediately (optimistic)
      dispatch({ type: 'SUBMIT_SUCCESS', payload: order });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete payment';
      dispatch({ type: 'SUBMIT_ERROR', payload: errorMessage });
    } finally {
      setPaymentStep('idle');
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
          discountAmount={discountAmount}
          total={total}
        />
      </View>

      {/* Promo Code */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Promo code</Text>
        {appliedPromo ? (
          <View style={styles.promoApplied}>
            <View style={styles.promoAppliedInfo}>
              <Text style={styles.promoAppliedCode}>{appliedPromo.code}</Text>
              <Text style={styles.promoAppliedDiscount}>
                {appliedPromo.discountType === 'percentage'
                  ? `${appliedPromo.discountValue}% off`
                  : `£${appliedPromo.discountValue.toFixed(2)} off`}
              </Text>
            </View>
            <Pressable onPress={handleRemovePromo}>
              <Text style={styles.promoRemove}>Remove</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.promoInputRow}>
            <View style={styles.promoInputWrapper}>
              <Input
                placeholder="Enter code"
                value={promoInput}
                onChangeText={setPromoInput}
                autoCapitalize="characters"
              />
            </View>
            <Button
              size="sm"
              variant="outline"
              onPress={handleApplyPromo}
              loading={isValidating}
              disabled={!promoInput.trim()}
              style={styles.promoApplyButton}
            >
              Apply
            </Button>
          </View>
        )}
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
        loading={isSubmitting || isCreatingOrder || isPaymentLoading}
        fullWidth
        style={styles.payButton}
      >
        {paymentStep === 'creating'
          ? 'Creating order...'
          : paymentStep === 'paying'
          ? 'Opening payment...'
          : `Pay £${total.toFixed(2)}`}
      </Button>

      <Text style={styles.paymentNote}>
        Payments are processed securely by Stripe.
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
  promoInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  promoInputWrapper: {
    flex: 1,
  },
  promoApplyButton: {
    marginTop: spacing.xs,
  },
  promoApplied: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.successPale,
    borderRadius: borderRadius.md,
  },
  promoAppliedInfo: {
    flex: 1,
  },
  promoAppliedCode: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.success,
  },
  promoAppliedDiscount: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  promoRemove: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.error,
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
