import { Alert } from 'react-native';

interface UseStripePaymentReturn {
  isLoading: boolean;
  error: string | null;
  initializePayment: (orderId: string, userId: string) => Promise<boolean>;
  presentPaymentSheet: () => Promise<{ success: boolean; error?: string }>;
}

// Web stub — Stripe native SDK is not available on web
export function useStripePayment(): UseStripePaymentReturn {
  return {
    isLoading: false,
    error: null,
    initializePayment: async () => {
      Alert.alert('Payments Unavailable', 'Native payments are not available on web. Please use the mobile app.');
      return false;
    },
    presentPaymentSheet: async () => ({
      success: false,
      error: 'Stripe native SDK not available on web',
    }),
  };
}
