import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';
import type { DietaryBadge as DietaryBadgeType } from '@/types';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'dietary';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const DIETARY_CONFIG: Record<DietaryBadgeType, { emoji: string; label: string; color: string }> = {
  halal: { emoji: '☪', label: 'Halal', color: colors.primary },
  vegetarian: { emoji: '🌿', label: 'Veg', color: colors.success },
  vegan: { emoji: '🌱', label: 'Vegan', color: colors.success },
  gluten_free: { emoji: 'GF', label: 'GF', color: colors.accent },
};

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  style,
}: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant], styles[size], style]}>
      <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`]]}>
        {children}
      </Text>
    </View>
  );
}

interface DietaryBadgeProps {
  type: DietaryBadgeType;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function DietaryBadge({
  type,
  showLabel = true,
  size = 'sm',
  style,
}: DietaryBadgeProps) {
  const config = DIETARY_CONFIG[type];

  return (
    <View style={[styles.dietaryBadge, styles[size], style]}>
      <Text style={[styles.dietaryEmoji, styles[`${size}Text`]]}>
        {config.emoji}
      </Text>
      {showLabel && (
        <Text style={[styles.dietaryLabel, styles[`${size}Text`], { color: config.color }]}>
          {config.label}
        </Text>
      )}
    </View>
  );
}

interface SpiceBadgeProps {
  level: 0 | 1 | 2 | 3;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function SpiceBadge({ level, size = 'sm', style }: SpiceBadgeProps) {
  if (level === 0) return null;

  const peppers = '🌶️'.repeat(level);

  return (
    <View style={[styles.spiceBadge, styles[size], style]}>
      <Text style={styles[`${size}Text`]}>{peppers}</Text>
    </View>
  );
}

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: colors.accentPale, text: colors.accent },
  confirmed: { bg: colors.accentPale, text: colors.accent },
  preparing: { bg: colors.accentPale, text: colors.accent },
  ready: { bg: colors.successPale, text: colors.success },
  collected: { bg: colors.successPale, text: colors.success },
  delivered: { bg: colors.successPale, text: colors.success },
  cancelled: { bg: '#fee2e2', text: colors.error },
};

export function StatusBadge({ status, size = 'sm', style }: StatusBadgeProps) {
  const colorConfig = STATUS_COLORS[status] || STATUS_COLORS.pending;

  return (
    <View
      style={[
        styles.badge,
        styles[size],
        { backgroundColor: colorConfig.bg },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          styles[`${size}Text`],
          { color: colorConfig.text },
        ]}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
  },

  // Sizes
  sm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  md: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  smText: {
    fontSize: fontSizes.xs,
  },
  mdText: {
    fontSize: fontSizes.sm,
  },

  // Variants
  default: {
    backgroundColor: colors.grey100,
  },
  success: {
    backgroundColor: colors.successPale,
  },
  warning: {
    backgroundColor: colors.accentPale,
  },
  error: {
    backgroundColor: '#fee2e2',
  },
  dietary: {
    backgroundColor: colors.grey100,
  },

  text: {
    fontFamily: fonts.bodyMedium,
  },
  defaultText: {
    color: colors.grey600,
  },
  successText: {
    color: colors.success,
  },
  warningText: {
    color: colors.accent,
  },
  errorText: {
    color: colors.error,
  },
  dietaryText: {
    color: colors.textPrimary,
  },

  // Dietary badge
  dietaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.grey100,
    borderRadius: borderRadius.full,
  },
  dietaryEmoji: {
    fontFamily: fonts.body,
  },
  dietaryLabel: {
    fontFamily: fonts.bodyMedium,
  },

  // Spice badge
  spiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default Badge;
