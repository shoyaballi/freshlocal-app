import React, { useSyncExternalStore } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { webPaymentStore } from '@/lib/webPaymentStore';
import { colors, fonts, fontSizes, borderRadius, spacing } from '@/constants/theme';

interface WebPaymentModalProps {
  stripePromise: Promise<Stripe | null>;
}

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;

    setLoading(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message || 'Payment failed');
      setLoading(false);
    } else {
      webPaymentStore.completePayment({ success: true });
    }
  };

  const handleCancel = () => {
    webPaymentStore.completePayment({
      success: false,
      error: 'Payment cancelled',
    });
  };

  return (
    <View style={styles.formContainer}>
      <Text style={styles.title}>Complete Payment</Text>

      <View style={styles.elementWrapper}>
        <PaymentElement />
      </View>

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      <Pressable
        style={[styles.payButton, loading && styles.payButtonDisabled]}
        onPress={handlePay}
        disabled={loading || !stripe || !elements}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.payButtonText}>Pay</Text>
        )}
      </Pressable>

      <Pressable
        style={styles.cancelButton}
        onPress={handleCancel}
        disabled={loading}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

export function WebPaymentModal({ stripePromise }: WebPaymentModalProps) {
  const clientSecret = useSyncExternalStore(
    webPaymentStore.subscribe,
    webPaymentStore.getClientSecret,
    webPaymentStore.getClientSecret
  );

  if (!clientSecret) return null;

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: colors.primary,
                  borderRadius: `${borderRadius.md}px`,
                  fontFamily:
                    '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
                },
              },
            }}
          >
            <PaymentForm />
          </Elements>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    width: '90%',
    maxWidth: 460,
  },
  formContainer: {
    gap: spacing.lg,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  elementWrapper: {
    minHeight: 200,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.error,
    textAlign: 'center',
  },
  payButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: '#fff',
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
});
