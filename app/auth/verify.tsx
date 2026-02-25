import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, OTPInput } from '@/components/ui';
import { colors, fonts, fontSizes, spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';

export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const { verifyOtp, signInWithPhone, isLoading, getPostAuthRedirect } = useAuth();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setError('');
    const { error: verifyError } = await verifyOtp(phone || '', code);

    if (verifyError) {
      setError('Invalid code. Please try again.');
    } else {
      // Redirect based on onboarding status
      const redirectPath = getPostAuthRedirect();
      router.replace(redirectPath as any);
    }
  };

  const handleResend = async () => {
    if (!canResend || !phone) return;

    setCanResend(false);
    setCountdown(60);
    setError('');
    setCode('');

    const { error: resendError } = await signInWithPhone(phone);
    if (resendError) {
      setError('Failed to resend code. Please try again.');
      setCanResend(true);
    }
  };

  const formatPhone = (phoneNumber: string) => {
    if (!phoneNumber) return '';
    // Simple masking for privacy
    if (phoneNumber.length > 4) {
      return phoneNumber.slice(0, -4).replace(/./g, '*') + phoneNumber.slice(-4);
    }
    return phoneNumber;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.emoji}>🔐</Text>
          <Text style={styles.title}>Enter verification code</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.phone}>{formatPhone(phone || '')}</Text>
          </Text>
        </View>

        <View style={styles.otpContainer}>
          <OTPInput
            value={code}
            onChange={setCode}
            error={error}
          />
        </View>

        <Button
          onPress={handleVerify}
          loading={isLoading}
          disabled={code.length !== 6}
          fullWidth
          style={styles.verifyButton}
        >
          Verify
        </Button>

        <View style={styles.resendContainer}>
          {canResend ? (
            <Pressable onPress={handleResend}>
              <Text style={styles.resendLink}>Resend code</Text>
            </Pressable>
          ) : (
            <Text style={styles.resendText}>
              Resend code in {countdown}s
            </Text>
          )}
        </View>

        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            Didn't receive the code? Make sure you entered the correct phone
            number or try again.
          </Text>
        </View>
      </View>
      </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
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
    alignItems: 'center',
    marginTop: spacing['3xl'],
    marginBottom: spacing['3xl'],
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  phone: {
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },
  otpContainer: {
    marginBottom: spacing['2xl'],
  },
  verifyButton: {
    marginBottom: spacing.lg,
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  resendLink: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
  helpContainer: {
    marginTop: 'auto',
    paddingTop: spacing['2xl'],
  },
  helpText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});
