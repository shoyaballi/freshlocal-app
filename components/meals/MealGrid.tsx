import React from 'react';
import { View, ScrollView, Text, StyleSheet, Platform } from 'react-native';
import { MealCard } from './MealCard';
import { colors, fonts, fontSizes, spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';
import type { Meal, Vendor } from '@/types';

interface MealGridProps {
  meals: Meal[];
  vendors?: Record<string, Vendor>;
  title?: string;
  onMealPress?: (meal: Meal) => void;
  horizontal?: boolean;
  emptyMessage?: string;
}

function getGridItemWidth(isDesktop: boolean, isTablet: boolean): string {
  if (isDesktop) return '23%'; // ~4 columns
  if (isTablet) return '31%';  // ~3 columns
  return '47%';                // 2 columns
}

export function MealGrid({
  meals,
  vendors = {},
  title,
  onMealPress,
  horizontal = true,
  emptyMessage = 'No meals available',
}: MealGridProps) {
  const { isDesktop, isTablet } = useResponsive();

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

  const gridItemWidth = getGridItemWidth(isDesktop, isTablet);

  return (
    <View>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={[
        styles.gridContainer,
        Platform.OS === 'web' && isDesktop && styles.gridContainerDesktop,
      ]}>
        {meals.map((meal) => (
          <View key={meal.id} style={{ width: gridItemWidth as any }}>
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
  gridContainerDesktop: {
    maxWidth: 1200,
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
