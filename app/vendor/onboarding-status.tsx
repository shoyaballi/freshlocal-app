import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, Card } from '@/components/ui';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';
import { useAuth, useStripeConnect } from '@/hooks';
import { supabase } from '@/lib/supabase';

interface VendorStatus {
  id: string;
  businessName: string;
  stripeAccountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onboardingComplete: boolean;
}

export default function OnboardingStatusScreen() {
  const { user } = useAuth();
  const { openOnboarding, isLoading: stripeLoading } = useStripeConnect();
  const [vendorStatus, setVendorStatus] = useState<VendorStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchVendorStatus = useCallback(async () => {
    if (!user) return;

    try {
      const { data: vendor, error } = await supabase
        .from('vendors')
        .select(`
          id,
          business_name,
          stripe_account_id,
          stripe_charges_enabled,
          stripe_payouts_enabled,
          stripe_onboarding_complete
        `)
        .eq('user_id', user.id)
        .single();

      if (error || !vendor) {
        // No vendor found, redirect to signup
        router.replace('/vendor/signup');
        return;
      }

      setVendorStatus({
        id: vendor.id,
        businessName: vendor.business_name,
        stripeAccountId: vendor.stripe_account_id,
        chargesEnabled: vendor.stripe_charges_enabled,
        payoutsEnabled: vendor.stripe_payouts_enabled,
        onboardingComplete: vendor.stripe_onboarding_complete,
      });
    } catch (error) {
      console.error('Error fetching vendor status:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchVendorStatus();
  }, [fetchVendorStatus]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchVendorStatus();
  }, [fetchVendorStatus]);

  const handleContinueOnboarding = async () => {
    if (vendorStatus?.id) {
      await openOnboarding(vendorStatus.id);
      // After returning from browser, refresh status
      fetchVendorStatus();
    }
  };

  const handleGoToDashboard = () => {
    router.replace('/dashboard');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Checking your status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isFullySetup = vendorStatus?.chargesEnabled && vendorStatus?.payoutsEnabled;
  const needsOnboarding = vendorStatus?.stripeAccountId && !vendorStatus?.onboardingComplete;
  const pendingVerification = vendorStatus?.onboardingComplete && !isFullySetup;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.logo}>FreshLocal</Text>
          <Text style={styles.title}>Payment Setup</Text>
        </View>

        <Card style={styles.statusCard}>
          <Text style={styles.businessName}>{vendorStatus?.businessName}</Text>

          {isFullySetup ? (
            <>
              <View style={styles.statusIcon}>
                <Text style={styles.statusEmoji}>✅</Text>
              </View>
              <Text style={styles.statusTitle}>You're all set!</Text>
              <Text style={styles.statusText}>
                Your payment account is fully configured. You can now accept orders and receive payouts.
              </Text>
              <View style={styles.statusDetails}>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Accept payments</Text>
                  <Text style={styles.statusValue}>Enabled</Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Receive payouts</Text>
                  <Text style={styles.statusValue}>Enabled</Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Payout schedule</Text>
                  <Text style={styles.statusValue}>Every Tuesday</Text>
                </View>
              </View>
            </>
          ) : pendingVerification ? (
            <>
              <View style={styles.statusIcon}>
                <Text style={styles.statusEmoji}>⏳</Text>
              </View>
              <Text style={styles.statusTitle}>Verification pending</Text>
              <Text style={styles.statusText}>
                Your details are being reviewed by Stripe. This usually completes within a few minutes.
              </Text>
              <Text style={styles.hintText}>
                Pull down to refresh your status.
              </Text>
            </>
          ) : needsOnboarding ? (
            <>
              <View style={styles.statusIcon}>
                <Text style={styles.statusEmoji}>📝</Text>
              </View>
              <Text style={styles.statusTitle}>Complete your setup</Text>
              <Text style={styles.statusText}>
                You need to provide some additional information to start accepting payments.
              </Text>
            </>
          ) : (
            <>
              <View style={styles.statusIcon}>
                <Text style={styles.statusEmoji}>⚠️</Text>
              </View>
              <Text style={styles.statusTitle}>Setup required</Text>
              <Text style={styles.statusText}>
                Your payment account needs to be configured before you can accept orders.
              </Text>
            </>
          )}
        </Card>

        <View style={styles.actions}>
          {isFullySetup ? (
            <Button onPress={handleGoToDashboard} fullWidth size="lg">
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button
                onPress={handleContinueOnboarding}
                fullWidth
                size="lg"
                disabled={stripeLoading || pendingVerification}
              >
                {stripeLoading ? (
                  <ActivityIndicator color={colors.backgroundWhite} size="small" />
                ) : pendingVerification ? (
                  'Waiting for verification...'
                ) : (
                  'Continue Setup'
                )}
              </Button>
              <Button
                variant="outline"
                onPress={handleGoToDashboard}
                fullWidth
                style={styles.secondaryButton}
              >
                Set up later
              </Button>
            </>
          )}
        </View>

        <Text style={styles.footerText}>
          Payments are processed securely by Stripe. Your payout will be deposited to your bank account every Tuesday.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  logo: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['2xl'],
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
  },
  statusCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  businessName: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  statusIcon: {
    marginBottom: spacing.md,
  },
  statusEmoji: {
    fontSize: 48,
  },
  statusTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  statusText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  hintText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.primary,
    marginTop: spacing.md,
  },
  statusDetails: {
    width: '100%',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  statusLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  statusValue: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.success,
  },
  actions: {
    marginTop: spacing['2xl'],
    gap: spacing.md,
  },
  secondaryButton: {
    marginTop: spacing.sm,
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 18,
  },
});
