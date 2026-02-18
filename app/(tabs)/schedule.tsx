import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/layout';
import { MealGrid } from '@/components/meals';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';
import { useMeals, useVendors } from '@/hooks';
import type { ScheduleDay } from '@/types';

function generateScheduleDays(days: number = 14): ScheduleDay[] {
  const schedule: ScheduleDay[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dateString = date.toISOString().split('T')[0];

    schedule.push({
      date: dateString,
      dayName: date.toLocaleDateString('en-GB', { weekday: 'short' }),
      dayNumber: date.getDate(),
      isToday: i === 0,
      hasMeals: false, // Will be updated from actual data
      mealCount: 0,
    });
  }

  return schedule;
}

export default function ScheduleScreen() {
  const scheduleDays = useMemo(() => generateScheduleDays(), []);
  const [selectedDate, setSelectedDate] = useState(scheduleDays[0].date);

  // Fetch meals for selected date
  const { meals: selectedDayMeals, isLoading: mealsLoading } = useMeals({
    date: selectedDate,
  });

  // Fetch vendors for the map
  const { vendorsMap } = useVendors();

  // Update schedule days with meal counts from fetched data
  // For a production app, you'd want to fetch meal counts for all dates
  const selectedDay = scheduleDays.find((day) => day.date === selectedDate);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Schedule" subtitle="Plan your meals for the next 2 weeks" />

      <View style={styles.dateStripWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateStrip}
        >
          {scheduleDays.map((day) => (
            <Pressable
              key={day.date}
              onPress={() => setSelectedDate(day.date)}
              style={[
                styles.dateCard,
                selectedDate === day.date && styles.dateCardActive,
              ]}
            >
              <Text
                style={[
                  styles.dayName,
                  selectedDate === day.date && styles.dayNameActive,
                ]}
              >
                {day.dayName}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  selectedDate === day.date && styles.dayNumberActive,
                ]}
              >
                {day.dayNumber}
              </Text>
              {day.isToday && (
                <View
                  style={[
                    styles.mealDot,
                    selectedDate === day.date && styles.mealDotActive,
                  ]}
                />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.dateHeader}>
        {selectedDay?.isToday
          ? 'Today'
          : new Date(selectedDate).toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
      </Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {mealsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : selectedDayMeals.length > 0 ? (
          <MealGrid
            meals={selectedDayMeals}
            vendors={vendorsMap}
            horizontal={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyTitle}>No meals scheduled</Text>
            <Text style={styles.emptyText}>
              Check back later - vendors are always adding new dishes!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  dateStripWrapper: {
    height: 100,
  },
  dateStrip: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  dateCard: {
    width: 52,
    height: 68,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  dayNameActive: {
    color: colors.accentLight,
  },
  dayNumber: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  dayNumberActive: {
    color: colors.backgroundWhite,
  },
  mealDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 4,
    position: 'absolute',
    bottom: 8,
  },
  mealDotActive: {
    backgroundColor: colors.accentLight,
  },
  content: {
    paddingBottom: spacing['4xl'],
    flexGrow: 1,
  },
  dateHeader: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
