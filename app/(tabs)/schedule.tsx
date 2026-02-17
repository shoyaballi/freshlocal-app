import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/layout';
import { MealGrid } from '@/components/meals';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';
import { MOCK_MEALS, VENDORS_MAP } from '@/constants/mockData';
import type { ScheduleDay } from '@/types';

function generateScheduleDays(days: number = 14): ScheduleDay[] {
  const schedule: ScheduleDay[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dateString = date.toISOString().split('T')[0];
    const mealsOnDay = MOCK_MEALS.filter((meal) => meal.availableDate === dateString);

    schedule.push({
      date: dateString,
      dayName: date.toLocaleDateString('en-GB', { weekday: 'short' }),
      dayNumber: date.getDate(),
      isToday: i === 0,
      hasMeals: mealsOnDay.length > 0,
      mealCount: mealsOnDay.length,
    });
  }

  return schedule;
}

export default function ScheduleScreen() {
  const scheduleDays = useMemo(() => generateScheduleDays(), []);
  const [selectedDate, setSelectedDate] = useState(scheduleDays[0].date);

  const selectedDayMeals = MOCK_MEALS.filter(
    (meal) => meal.availableDate === selectedDate
  );

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
              {day.hasMeals && (
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
        {selectedDayMeals.length > 0 ? (
          <MealGrid
            meals={selectedDayMeals}
            vendors={VENDORS_MAP}
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
