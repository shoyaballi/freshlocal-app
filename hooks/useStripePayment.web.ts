import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { webPaymentStore } from '@/lib/webPaymentStore';

interface UseStripePaymentReturn {
  isLoading: boolean;
  error: string | null;
  initializePayment: (orderId: string, userId: string) => Promise<boolean>;
  presentPaymentSheet: () => Promise<{ success: boolean; error?: string }>;
}

export function useStripePayment(): UseStripePaymentReturn {
  // Dev test mode — simulate payment on web
  if (__DEV__) {
    const testOrderIdRef = useRef('');
    return {
      isLoading: false,
      error: null,
      initializePayment: async (orderId: string) => {
        testOrderIdRef.current = orderId;
        console.log('[Test Mode] Payment initialised for order:', orderId);
        return true;
      },
      presentPaymentSheet: async () => {
        await supabase
          .from('orders')
          .update({ status: 'confirmed', payment_status: 'paid' })
          .eq('id', testOrderIdRef.current);
        Alert.alert('Test Mode', 'Payment simulated successfully.');
        return { success: true };
      },
    };
  }

  // Production — real Stripe.js flow
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientSecretRef = useRef<string | null>(null);

  const initializePayment = useCallback(
    async (orderId: string, userId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          'stripe-create-payment-intent',
          { body: { orderId, userId } }
        );

        if (fnError) throw new Error(fnError.message);
        if (data.error) throw new Error(data.error);

        clientSecretRef.current = data.paymentIntent;
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to initialise payment';
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const presentPaymentSheet = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!clientSecretRef.current) {
      return { success: false, error: 'Payment not initialised' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await webPaymentStore.startPayment(
        clientSecretRef.current
      );
      clientSecretRef.current = null;

      if (!result.success) {
        setError(result.error || 'Payment failed');
      }
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Payment failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    initializePayment,
    presentPaymentSheet,
  };
}
