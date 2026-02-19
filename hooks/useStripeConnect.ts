import { useState, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

interface StripeConnectStatus {
  stripeAccountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onboardingComplete: boolean;
}

interface UseStripeConnectReturn {
  isLoading: boolean;
  error: string | null;
  createConnectAccount: (vendorId: string, businessName: string, email: string) => Promise<string | null>;
  getOnboardingLink: (vendorId: string) => Promise<string | null>;
  openOnboarding: (vendorId: string) => Promise<void>;
  checkStatus: (vendorId: string) => Promise<StripeConnectStatus | null>;
  refreshStatus: (vendorId: string) => Promise<StripeConnectStatus | null>;
}

export function useStripeConnect(): UseStripeConnectReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createConnectAccount = useCallback(async (
    vendorId: string,
    businessName: string,
    email: string
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'stripe-create-connect-account',
        {
          body: { vendorId, businessName, email },
        }
      );

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data.accountId;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create Stripe account';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getOnboardingLink = useCallback(async (vendorId: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'stripe-create-account-link',
        {
          body: { vendorId },
        }
      );

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get onboarding link';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openOnboarding = useCallback(async (vendorId: string): Promise<void> => {
    const url = await getOnboardingLink(vendorId);
    if (url) {
      await WebBrowser.openBrowserAsync(url);
    }
  }, [getOnboardingLink]);

  const checkStatus = useCallback(async (vendorId: string): Promise<StripeConnectStatus | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('vendors')
        .select('stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_onboarding_complete')
        .eq('id', vendorId)
        .single();

      if (queryError) {
        throw new Error(queryError.message);
      }

      return {
        stripeAccountId: data.stripe_account_id,
        chargesEnabled: data.stripe_charges_enabled,
        payoutsEnabled: data.stripe_payouts_enabled,
        onboardingComplete: data.stripe_onboarding_complete,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check Stripe status';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshStatus = useCallback(async (vendorId: string): Promise<StripeConnectStatus | null> => {
    // This forces a fresh check from the database
    // The webhook should have updated the status by now
    return checkStatus(vendorId);
  }, [checkStatus]);

  return {
    isLoading,
    error,
    createConnectAccount,
    getOnboardingLink,
    openOnboarding,
    checkStatus,
    refreshStatus,
  };
}
