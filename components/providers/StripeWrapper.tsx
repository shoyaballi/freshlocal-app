import React from 'react';

const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

// Native: load Stripe SDK conditionally (doesn't work in Expo Go)
let StripeProvider: React.ComponentType<any> | null = null;
try {
  StripeProvider = require('@stripe/stripe-react-native').StripeProvider;
} catch {
  // Stripe native SDK not available (Expo Go) — payments disabled
}

interface StripeWrapperProps {
  children: React.ReactNode;
}

export function StripeWrapper({ children }: StripeWrapperProps) {
  if (StripeProvider) {
    return (
      <StripeProvider
        publishableKey={stripePublishableKey}
        merchantIdentifier="merchant.com.freshlocal.app"
      >
        {children}
      </StripeProvider>
    );
  }
  return <>{children}</>;
}

export default StripeWrapper;
