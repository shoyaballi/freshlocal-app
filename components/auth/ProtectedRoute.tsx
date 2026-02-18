import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useSegments, useRootNavigationState } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/constants/theme';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasOnboarded } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Wait for navigation to be ready
    if (!navigationState?.key) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';

    if (isLoading) return;

    if (!isAuthenticated && !inAuthGroup && !inOnboarding) {
      // User is not authenticated and not on auth/onboarding screens
      // Show onboarding first if they haven't seen it
      if (!hasOnboarded) {
        router.replace('/onboarding');
      }
      // Don't redirect to login - let them browse as guest
    } else if (isAuthenticated && inAuthGroup) {
      // User is authenticated but on auth screen, redirect to home
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, navigationState?.key, hasOnboarded]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

export default ProtectedRoute;
