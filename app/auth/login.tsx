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
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';

type AuthMethod = 'phone' | 'email';

export default function LoginScreen() {
  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signInWithEmail, signInWithPhone, isLoading } = useAuth();

  const handlePhoneLogin = async () => {
    if (!phone) {
      setError('Please enter your phone number');
      return;
    }

    setError('');
    const { error: signInError } = await signInWithPhone(phone);

    if (signInError) {
      setError('Failed to send OTP. Please try again.');
    } else {
      router.push({ pathname: '/auth/verify', params: { phone } });
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    setError('');
    const { error: signInError } = await signInWithEmail(email, password);

    if (signInError) {
      setError('Invalid email or password');
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleClose = () => {
    router.back();
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
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.logo}>FreshLocal</Text>
            <Text style={styles.tagline}>Halal</Text>
          </View>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Sign in to continue ordering delicious homemade meals
          </Text>

          <View style={styles.methodToggle}>
            <Pressable
              onPress={() => setAuthMethod('phone')}
              style={[
                styles.methodButton,
                authMethod === 'phone' && styles.methodButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.methodText,
                  authMethod === 'phone' && styles.methodTextActive,
                ]}
              >
                Phone
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setAuthMethod('email')}
              style={[
                styles.methodButton,
                authMethod === 'email' && styles.methodButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.methodText,
                  authMethod === 'email' && styles.methodTextActive,
                ]}
              >
                Email
              </Text>
            </Pressable>
          </View>

          {authMethod === 'phone' ? (
            <View style={styles.form}>
              <Input
                label="Phone Number"
                placeholder="+44 7700 900000"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
                error={error && authMethod === 'phone' ? error : undefined}
              />

              <Button
                onPress={handlePhoneLogin}
                loading={isLoading}
                fullWidth
              >
                Send OTP
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
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                error={error && authMethod === 'email' ? error : undefined}
              />

              <Button
                onPress={handleEmailLogin}
                loading={isLoading}
                fullWidth
              >
                Sign In
              </Button>

              <Pressable style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <Pressable onPress={() => router.push('/auth/signup')}>
              <Text style={styles.footerLink}>Create one</Text>
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
  closeButton: {
    alignSelf: 'flex-end',
    padding: spacing.sm,
  },
  closeText: {
    fontSize: fontSizes.xl,
    color: colors.grey400,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing['2xl'],
    marginBottom: spacing['3xl'],
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
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: colors.grey100,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.xl,
  },
  methodButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  methodButtonActive: {
    backgroundColor: colors.cardBackground,
  },
  methodText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  methodTextActive: {
    color: colors.primary,
  },
  form: {
    gap: spacing.md,
  },
  forgotPassword: {
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  forgotPasswordText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.primary,
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
