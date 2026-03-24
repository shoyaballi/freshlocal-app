import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, fonts, fontSizes, spacing, shadows } from '@/constants/theme';

interface HeaderProps {
  title?: string;
  showLogo?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  subtitle?: string;
}

export function Header({
  title,
  showLogo = false,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  subtitle,
}: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {leftIcon && (
          <Pressable onPress={onLeftPress} style={styles.iconButton}>
            {leftIcon}
          </Pressable>
        )}
      </View>

      <View style={styles.centerSection}>
        {showLogo ? (
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>FreshLocal</Text>
            <Text style={styles.tagline}>Halal</Text>
          </View>
        ) : (
          <>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </>
        )}
      </View>

      <View style={styles.rightSection}>
        {rightIcon && (
          <Pressable onPress={onRightPress} style={styles.iconButton}>
            {rightIcon}
          </Pressable>
        )}
      </View>
    </View>
  );
}

interface LocationHeaderProps {
  location: string;
  onLocationPress?: () => void;
}

export function LocationHeader({ location, onLocationPress }: LocationHeaderProps) {
  return (
    <View style={styles.locationContainer}>
      {/* Top row: Logo */}
      <View style={styles.locationTopRow}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>FreshLocal</Text>
          <Text style={styles.tagline}>Halal</Text>
        </View>
      </View>

      {/* Location row */}
      <Pressable
        onPress={onLocationPress}
        style={({ pressed }) => [
          styles.locationButton,
          pressed && styles.locationButtonPressed,
        ]}
      >
        <View style={styles.locationRow}>
          <Text style={styles.locationPin}>📍</Text>
          <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
          <Text style={styles.chevron}>&#9662;</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  leftSection: {
    width: 40,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 40,
    alignItems: 'flex-end',
  },
  iconButton: {
    padding: spacing.xs,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  logo: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['2xl'],
    color: colors.primary,
  },
  tagline: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.accent,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },

  // Location header — Uber Eats style
  locationContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  locationTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  locationButton: {
    flexDirection: 'column',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  locationButtonPressed: {
    backgroundColor: colors.primaryPale,
  },
  deliverToLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.accent,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  locationPin: {
    fontSize: fontSizes.md,
  },
  locationText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    flex: 1,
  },
  chevron: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default Header;
