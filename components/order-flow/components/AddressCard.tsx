import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';
import type { Address } from '@/types';

interface AddressCardProps {
  address: Address;
  selected?: boolean;
  onPress?: () => void;
}

export function AddressCard({ address, selected = false, onPress }: AddressCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, selected && styles.containerSelected]}
    >
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{address.label}</Text>
          {address.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
        {selected && <Text style={styles.checkmark}>✓</Text>}
      </View>

      <Text style={styles.addressLine}>{address.line1}</Text>
      {address.line2 && <Text style={styles.addressLine}>{address.line2}</Text>}
      <Text style={styles.addressLine}>
        {address.city}, {address.postcode}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.grey200,
    backgroundColor: colors.backgroundWhite,
  },
  containerSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryPale,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  defaultBadge: {
    backgroundColor: colors.accentPale,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  defaultText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.accent,
  },
  checkmark: {
    fontSize: 20,
    color: colors.primary,
  },
  addressLine: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default AddressCard;
