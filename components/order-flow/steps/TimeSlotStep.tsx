import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Button } from '@/components/ui';
import { TimeSlotPicker, generateTimeSlots } from '../components';
import { useOrderFlow } from '../OrderFlowContext';
import { colors, fonts, fontSizes, spacing } from '@/constants/theme';

export function TimeSlotStep() {
  const { state, dispatch } = useOrderFlow();
  const { meal, fulfilmentType, selectedTimeSlot } = state;

  const prepTime = meal?.prepTime ?? 30;

  const timeSlots = useMemo(() => {
    return generateTimeSlots(prepTime);
  }, [prepTime]);

  const handleSelectSlot = (slot: string) => {
    dispatch({ type: 'SET_TIME_SLOT', payload: slot });
  };

  const handleContinue = () => {
    dispatch({ type: 'NEXT_STEP' });
  };

  const handleBack = () => {
    dispatch({ type: 'PREV_STEP' });
  };

  const canContinue = selectedTimeSlot !== null;

  const fulfilmentLabel = fulfilmentType === 'collection' ? 'collection' : 'delivery';

  return (
    <View style={styles.container}>
      <Pressable onPress={handleBack} style={styles.backLink}>
        <Text style={styles.backLinkText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Select {fulfilmentLabel} time</Text>
      <Text style={styles.subtitle}>
        Choose when you'd like to {fulfilmentType === 'collection' ? 'pick up' : 'receive'} your order
      </Text>

      <View style={styles.slotContainer}>
        <TimeSlotPicker
          slots={timeSlots}
          selectedSlot={selectedTimeSlot}
          onSelect={handleSelectSlot}
        />
      </View>

      <Button
        onPress={handleContinue}
        disabled={!canContinue}
        fullWidth
        style={styles.continueButton}
      >
        Continue
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backLink: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  backLinkText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  slotContainer: {
    flex: 1,
    marginBottom: spacing.lg,
  },
  continueButton: {
    marginTop: 'auto',
  },
});

export default TimeSlotStep;
