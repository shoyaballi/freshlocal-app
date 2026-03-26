import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
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
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing['3xl'],
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
    marginBottom: spacing.lg,
  },
  continueButton: {
    marginTop: spacing.lg,
  },
});

export default TimeSlotStep;
