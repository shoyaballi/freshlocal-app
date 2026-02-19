import { useState, useCallback } from 'react';
import { useStripe } from '@stripe/stripe-react-native';
import { supabase } from '@/lib/supabase';

interface PaymentSheetParams {
  paymentIntent: string;
  ephemeralKey: string;
  customer: string;
}

interface UseStripePaymentReturn {
  isLoading: boolean;
  error: string | null;
  initializePayment: (orderId: string, userId: string) => Promise<boolean>;
  presentPaymentSheet: () => Promise<{ success: boolean; error?: string }>;
}

export function useStripePayment(): UseStripePaymentReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSheetReady, setPaymentSheetReady] = useState(false);

  const { initPaymentSheet, presentPaymentSheet: stripePresent } = useStripe();

  const initializePayment = useCallback(async (
    orderId: string,
    userId: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setPaymentSheetReady(false);

    try {
      // Get payment intent from Edge Function
      const { data, error: fnError } = await supabase.functions.invoke(
        'stripe-create-payment-intent',
        {
          body: { orderId, userId },
        }
      );

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const { paymentIntent, ephemeralKey, customer } = data as PaymentSheetParams;

      // Initialize Payment Sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'FreshLocal',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: {
          address: {
            country: 'GB',
          },
        },
        appearance: {
          colors: {
            primary: '#2D5A27',
            background: '#FFFFFF',
            componentBackground: '#F8F9FA',
            componentBorder: '#E5E7EB',
            componentDivider: '#E5E7EB',
            primaryText: '#1A1A1A',
            secondaryText: '#6B7280',
            componentText: '#1A1A1A',
            placeholderText: '#9CA3AF',
          },
          shapes: {
            borderRadius: 12,
            borderWidth: 1,
          },
        },
      });

      if (initError) {
        throw new Error(initError.message);
      }

      setPaymentSheetReady(true);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize payment';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [initPaymentSheet]);

  const presentPaymentSheet = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!paymentSheetReady) {
      return { success: false, error: 'Payment sheet not ready' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: presentError } = await stripePresent();

      if (presentError) {
        // User cancelled or payment failed
        if (presentError.code === 'Canceled') {
          return { success: false, error: 'Payment cancelled' };
        }
        throw new Error(presentError.message);
      }

      // Payment successful
      // Webhook will update order status
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
      setPaymentSheetReady(false);
    }
  }, [paymentSheetReady, stripePresent]);

  return {
    isLoading,
    error,
    initializePayment,
    presentPaymentSheet,
  };
}
