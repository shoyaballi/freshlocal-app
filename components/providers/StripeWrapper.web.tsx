import React from 'react';

interface StripeWrapperProps {
  children: React.ReactNode;
}

// Web: Stripe native SDK not supported — render children directly
export function StripeWrapper({ children }: StripeWrapperProps) {
  return <>{children}</>;
}

export default StripeWrapper;
