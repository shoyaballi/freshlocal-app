import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
}: QuantitySelectorProps) {
  const canDecrease = value > min;
  const canIncrease = value < max;

  const decrease = () => {
    if (canDecrease) {
      onChange(value - 1);
    }
  };

  const increase = () => {
    if (canIncrease) {
      onChange(value + 1);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={decrease}
        style={[styles.button, !canDecrease && styles.buttonDisabled]}
        disabled={!canDecrease}
      >
        <Text style={[styles.buttonText, !canDecrease && styles.buttonTextDisabled]}>
          −
        </Text>
      </Pressable>

      <View style={styles.valueContainer}>
        <Text style={styles.value}>{value}</Text>
      </View>

      <Pressable
        onPress={increase}
        style={[styles.button, !canIncrease && styles.buttonDisabled]}
        disabled={!canIncrease}
      >
        <Text style={[styles.buttonText, !canIncrease && styles.buttonTextDisabled]}>
          +
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.grey200,
  },
  buttonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes['2xl'],
    color: colors.backgroundWhite,
    lineHeight: 28,
  },
  buttonTextDisabled: {
    color: colors.grey400,
  },
  valueContainer: {
    minWidth: 48,
    alignItems: 'center',
  },
  value: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
  },
});

export default QuantitySelector;
