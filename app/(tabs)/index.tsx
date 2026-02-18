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
import { router } from 'expo-router';
import { LocationHeader } from '@/components/layout';
import { SearchInput } from '@/components/ui';
import { MealGrid } from '@/components/meals';
import { VendorCardCompact } from '@/components/vendors';
import { OrderBottomSheet } from '@/components/order-flow';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';
import { DIETARY_FILTERS } from '@/constants/mockData';
import { useAppStore } from '@/stores/appStore';
import { useMeals, useVendors } from '@/hooks';
import type { DietaryBadge, Meal, Vendor } from '@/types';

export default function TodayScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | DietaryBadge>('all');
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isOrderSheetVisible, setIsOrderSheetVisible] = useState(false);
  const { postcode } = useAppStore();

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Fetch meals for today
  const dietaryFilter = activeFilter === 'all' ? undefined : [activeFilter as DietaryBadge];
  const { meals: todayMealsRaw, isLoading: mealsLoading } = useMeals({
    date: today,
    dietary: dietaryFilter,
  });

  // Fetch meals for tomorrow
  const { meals: tomorrowMealsRaw } = useMeals({ date: tomorrow });

  // Fetch vendors
  const { vendors, vendorsMap, isLoading: vendorsLoading } = useVendors();

  // Filter meals by search query
  const todayMeals = useMemo(() => {
    if (!searchQuery) return todayMealsRaw;
    const query = searchQuery.toLowerCase();
    return todayMealsRaw.filter(
      (meal) =>
        meal.name.toLowerCase().includes(query) ||
        meal.description.toLowerCase().includes(query)
    );
  }, [todayMealsRaw, searchQuery]);

  const tomorrowMeals = tomorrowMealsRaw.slice(0, 4);

  const handleMealPress = (meal: Meal) => {
    setSelectedMeal(meal);
    setIsOrderSheetVisible(true);
  };

  const handleCloseOrderSheet = () => {
    setIsOrderSheetVisible(false);
    setSelectedMeal(null);
  };

  // Get the vendor for the selected meal
  const selectedVendor = selectedMeal ? vendorsMap[selectedMeal.vendorId] : null;

  const handleVendorPress = (vendor: Vendor) => {
    // TODO: Navigate to vendor profile
    console.log('Vendor pressed:', vendor.businessName);
  };

  const isLoading = mealsLoading || vendorsLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <LocationHeader
          location={postcode || 'Blackburn BB1'}
          onLocationPress={() => {
            // TODO: Open location picker
          }}
        />

        <View style={styles.searchContainer}>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {DIETARY_FILTERS.map((filter) => (
            <Pressable
              key={filter.key}
              onPress={() => setActiveFilter(filter.key as 'all' | DietaryBadge)}
              style={[
                styles.filterChip,
                activeFilter === filter.key && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter.key && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading meals...</Text>
          </View>
        ) : (
          <>
            <MealGrid
              title="Available Now"
              meals={todayMeals}
              vendors={vendorsMap}
              onMealPress={handleMealPress}
              horizontal
              emptyMessage="No meals available with current filters"
            />

            {tomorrowMeals.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Tomorrow</Text>
                  <Pressable onPress={() => router.push('/schedule')}>
                    <Text style={styles.seeAllText}>See all</Text>
                  </Pressable>
                </View>
                <MealGrid
                  meals={tomorrowMeals}
                  vendors={vendorsMap}
                  onMealPress={handleMealPress}
                  horizontal
                />
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Local Vendors</Text>
                <Pressable onPress={() => router.push('/vendors')}>
                  <Text style={styles.seeAllText}>See all</Text>
                </Pressable>
              </View>
              <View style={styles.vendorList}>
                {vendors.slice(0, 3).map((vendor) => (
                  <VendorCardCompact
                    key={vendor.id}
                    vendor={vendor}
                    onPress={() => handleVendorPress(vendor)}
                  />
                ))}
                {vendors.length === 0 && (
                  <Text style={styles.emptyText}>No vendors available yet</Text>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <OrderBottomSheet
        isVisible={isOrderSheetVisible}
        onClose={handleCloseOrderSheet}
        meal={selectedMeal}
        vendor={selectedVendor || null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing['4xl'],
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  filterContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  filterChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  filterTextActive: {
    color: colors.backgroundWhite,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
  },
  seeAllText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  vendorList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
