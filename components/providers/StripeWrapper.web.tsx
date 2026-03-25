import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { WebPaymentModal } from '@/components/payments/WebPaymentModal';

const stripePromise = loadStripe(
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface StripeWrapperProps {
  children: React.ReactNode;
}

export function StripeWrapper({ children }: StripeWrapperProps) {
  return (
    <>
      {children}
      <WebPaymentModal stripePromise={stripePromise} />
    </>
  );
}

export default StripeWrapper;
