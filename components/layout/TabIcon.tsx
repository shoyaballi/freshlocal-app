import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes, spacing } from '@/constants/theme';

interface TabIconProps {
  emoji: string;
  label: string;
  focused: boolean;
  badge?: number;
}

export function TabIcon({ emoji, label, focused, badge }: TabIconProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={[styles.emoji, focused && styles.emojiActive]}>
          {emoji}
        </Text>
        {badge !== undefined && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.label, focused && styles.labelActive]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xs,
  },
  iconContainer: {
    position: 'relative',
  },
  emoji: {
    fontSize: 22,
    opacity: 0.6,
  },
  emojiActive: {
    opacity: 1,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.grey400,
    marginTop: spacing.xs,
  },
  labelActive: {
    fontFamily: fonts.bodyMedium,
    color: colors.primary,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: colors.backgroundWhite,
  },
});

export default TabIcon;
