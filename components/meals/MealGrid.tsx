import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { MealCard } from './MealCard';
import { colors, fonts, fontSizes, spacing } from '@/constants/theme';
import type { Meal, Vendor } from '@/types';

interface MealGridProps {
  meals: Meal[];
  vendors?: Record<string, Vendor>;
  title?: string;
  onMealPress?: (meal: Meal) => void;
  horizontal?: boolean;
  emptyMessage?: string;
}

export function MealGrid({
  meals,
  vendors = {},
  title,
  onMealPress,
  horizontal = true,
  emptyMessage = 'No meals available',
}: MealGridProps) {
  if (meals.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  if (horizontal) {
    return (
      <View>
        {title && <Text style={styles.title}>{title}</Text>}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalContainer}
        >
          {meals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              vendorName={vendors[meal.vendorId]?.businessName}
              onPress={() => onMealPress?.(meal)}
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.gridContainer}>
        {meals.map((meal) => (
          <View key={meal.id} style={styles.gridItem}>
            <MealCard
              meal={meal}
              vendorName={vendors[meal.vendorId]?.businessName}
              onPress={() => onMealPress?.(meal)}
              fullWidth
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  horizontalContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  gridItem: {
    width: '47%',
  },
  emptyContainer: {
    padding: spacing['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default MealGrid;
