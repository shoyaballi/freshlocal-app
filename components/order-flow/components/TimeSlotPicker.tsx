import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';

interface TimeSlot {
  value: string; // ISO timestamp
  label: string; // Display format "HH:MM"
  disabled?: boolean;
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedSlot: string | null;
  onSelect: (slot: string) => void;
}

export function TimeSlotPicker({ slots, selectedSlot, onSelect }: TimeSlotPickerProps) {
  if (slots.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No time slots available for today. Please try again tomorrow.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {slots.map((slot) => {
        const isSelected = selectedSlot === slot.value;
        return (
          <Pressable
            key={slot.value}
            onPress={() => !slot.disabled && onSelect(slot.value)}
            style={[
              styles.slot,
              isSelected && styles.slotSelected,
              slot.disabled && styles.slotDisabled,
            ]}
            disabled={slot.disabled}
          >
            <Text
              style={[
                styles.slotText,
                isSelected && styles.slotTextSelected,
                slot.disabled && styles.slotTextDisabled,
              ]}
            >
              {slot.label}
            </Text>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// Helper to generate time slots
export function generateTimeSlots(prepTimeMinutes: number): TimeSlot[] {
  const now = new Date();
  const start = new Date(now.getTime() + prepTimeMinutes * 60000);

  // Round up to next 30-minute interval
  const minutes = start.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 30) * 30;
  start.setMinutes(roundedMinutes, 0, 0);

  // End at 9 PM
  const endOfDay = new Date(now);
  endOfDay.setHours(21, 0, 0, 0);

  const slots: TimeSlot[] = [];
  const current = new Date(start);

  while (current < endOfDay) {
    const hours = current.getHours();
    const mins = current.getMinutes();
    const label = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

    slots.push({
      value: current.toISOString(),
      label,
      disabled: false,
    });

    current.setTime(current.getTime() + 30 * 60000);
  }

  return slots;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.grey200,
    backgroundColor: colors.backgroundWhite,
  },
  slotSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryPale,
  },
  slotDisabled: {
    opacity: 0.5,
    backgroundColor: colors.grey100,
  },
  slotText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
  },
  slotTextSelected: {
    color: colors.primary,
  },
  slotTextDisabled: {
    color: colors.grey400,
  },
  checkmark: {
    fontSize: 20,
    color: colors.primary,
  },
});

export default TimeSlotPicker;
