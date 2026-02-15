import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, fonts, fontSizes, spacing } from '@/constants/theme';

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
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>FreshLocal</Text>
        <Text style={styles.tagline}>Halal</Text>
      </View>

      <Pressable onPress={onLocationPress} style={styles.locationButton}>
        <Text style={styles.locationIcon}>📍</Text>
        <Text style={styles.locationText}>{location}</Text>
        <Text style={styles.chevron}>▼</Text>
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

  // Location header
  locationContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    gap: spacing.xs,
  },
  locationIcon: {
    fontSize: fontSizes.sm,
  },
  locationText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  chevron: {
    fontSize: 8,
    color: colors.textSecondary,
  },
});

export default Header;
