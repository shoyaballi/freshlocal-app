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
import { MealCard, MealGrid } from '@/components/meals';
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

  const isSearching = searchQuery.trim().length > 0;

  // Filter meals and vendors by search query
  const searchResults = useMemo(() => {
    if (!isSearching) return null;
    const query = searchQuery.toLowerCase();

    const allMeals = [...todayMealsRaw, ...tomorrowMealsRaw];
    const matchedMeals = allMeals.filter(
      (meal) =>
        meal.name.toLowerCase().includes(query) ||
        meal.description.toLowerCase().includes(query) ||
        meal.vendor?.businessName?.toLowerCase().includes(query)
    );

    const matchedVendors = vendors.filter(
      (vendor) =>
        vendor.businessName.toLowerCase().includes(query) ||
        vendor.description.toLowerCase().includes(query) ||
        vendor.tags.some((tag) => tag.toLowerCase().includes(query))
    );

    return { meals: matchedMeals, vendors: matchedVendors };
  }, [searchQuery, isSearching, todayMealsRaw, tomorrowMealsRaw, vendors]);

  // Filter today's meals by dietary filter (non-search view)
  const todayMeals = useMemo(() => {
    return todayMealsRaw;
  }, [todayMealsRaw]);

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

  const renderSearchResults = () => {
    if (!searchResults) return null;
    const { meals, vendors: matchedVendors } = searchResults;
    const hasResults = meals.length > 0 || matchedVendors.length > 0;

    if (!hasResults) {
      return (
        <View style={styles.searchEmptyContainer}>
          <Text style={styles.searchEmptyEmoji}>🔍</Text>
          <Text style={styles.searchEmptyTitle}>No results found</Text>
          <Text style={styles.searchEmptyText}>
            Try searching for a meal name, vendor, or cuisine type
          </Text>
        </View>
      );
    }

    return (
      <>
        {meals.length > 0 && (
          <View style={styles.searchSection}>
            <Text style={styles.searchSectionTitle}>
              Meals ({meals.length})
            </Text>
            <View style={styles.searchMealGrid}>
              {meals.map((meal) => (
                <View key={meal.id} style={styles.searchMealItem}>
                  <MealCard
                    meal={meal}
                    vendorName={meal.vendor?.businessName || vendorsMap[meal.vendorId]?.businessName}
                    onPress={() => handleMealPress(meal)}
                    fullWidth
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {matchedVendors.length > 0 && (
          <View style={styles.searchSection}>
            <Text style={styles.searchSectionTitle}>
              Vendors ({matchedVendors.length})
            </Text>
            <View style={styles.vendorList}>
              {matchedVendors.map((vendor) => (
                <VendorCardCompact
                  key={vendor.id}
                  vendor={vendor}
                  onPress={() => handleVendorPress(vendor)}
                />
              ))}
            </View>
          </View>
        )}
      </>
    );
  };

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

        {isSearching ? (
          // Search results view
          renderSearchResults()
        ) : (
          <>
            {/* Dietary filter chips */}
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

  // Search results styles
  searchSection: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  searchSectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  searchMealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  searchMealItem: {
    width: '47%',
  },
  searchEmptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.xl,
  },
  searchEmptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  searchEmptyTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  searchEmptyText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
