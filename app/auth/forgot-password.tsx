import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, Input } from '@/components/ui';
import { colors, fonts, fontSizes, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSendResetLink = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${Platform.OS === 'web' ? window.location.origin : ''}/auth/reset-password`,
      });

      if (resetError) {
        setError('Failed to send reset link. Please try again.');
      } else {
        setIsSent(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.logo}>FreshLocal</Text>
            <Text style={styles.tagline}>Halal</Text>
          </View>

          <Text style={styles.title}>Forgot password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password
          </Text>

          {isSent ? (
            <View style={styles.successContainer}>
              <Text style={styles.successTitle}>Check your email</Text>
              <Text style={styles.successMessage}>
                We've sent a password reset link to{' '}
                <Text style={styles.emailHighlight}>{email}</Text>.
                Please check your inbox and follow the instructions.
              </Text>
              <Text style={styles.successHint}>
                If you don't see the email, check your spam folder.
              </Text>

              <Button
                onPress={() => router.replace('/auth/login')}
                fullWidth
                style={styles.backToLoginButton}
              >
                Back to Sign In
              </Button>
            </View>
          ) : (
            <View style={styles.form}>
              <Input
                label="Email"
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={error || undefined}
              />

              <Button
                onPress={handleSendResetLink}
                loading={isLoading}
                fullWidth
              >
                Send Reset Link
              </Button>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Remember your password?</Text>
            <Pressable onPress={() => router.replace('/auth/login')}>
              <Text style={styles.footerLink}>Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  backText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
    marginBottom: spacing['2xl'],
  },
  logo: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['3xl'],
    color: colors.primary,
  },
  tagline: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.accent,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
    lineHeight: 24,
  },
  form: {
    gap: spacing.md,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  successTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.xl,
    color: colors.success,
    marginBottom: spacing.md,
  },
  successMessage: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  emailHighlight: {
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },
  successHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing['2xl'],
  },
  backToLoginButton: {
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 'auto',
    paddingTop: spacing['2xl'],
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  footerLink: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
});
