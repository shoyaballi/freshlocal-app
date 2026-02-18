import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';
import type { FulfilmentType } from '@/types';

interface FulfilmentToggleProps {
  value: FulfilmentType | null;
  onChange: (value: FulfilmentType) => void;
  disabled?: boolean;
}

export function FulfilmentToggle({
  value,
  onChange,
  disabled = false,
}: FulfilmentToggleProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onChange('collection')}
        style={[
          styles.option,
          value === 'collection' && styles.optionActive,
          disabled && styles.optionDisabled,
        ]}
        disabled={disabled}
      >
        <Text style={styles.emoji}>📍</Text>
        <Text
          style={[
            styles.label,
            value === 'collection' && styles.labelActive,
          ]}
        >
          Collection
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onChange('delivery')}
        style={[
          styles.option,
          value === 'delivery' && styles.optionActive,
          disabled && styles.optionDisabled,
        ]}
        disabled={disabled}
      >
        <Text style={styles.emoji}>🚗</Text>
        <Text
          style={[
            styles.label,
            value === 'delivery' && styles.labelActive,
          ]}
        >
          Delivery
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.grey200,
    backgroundColor: colors.backgroundWhite,
  },
  optionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryPale,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  emoji: {
    fontSize: 20,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.primary,
  },
});

export default FulfilmentToggle;
