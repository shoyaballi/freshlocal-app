import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LocationHeader } from '@/components/layout';
import { SearchInput } from '@/components/ui';
import { MealGrid } from '@/components/meals';
import { VendorCardCompact } from '@/components/vendors';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';
import { MOCK_MEALS, MOCK_VENDORS, VENDORS_MAP, DIETARY_FILTERS } from '@/constants/mockData';
import { useAppStore } from '@/stores/appStore';
import type { DietaryBadge } from '@/types';

export default function TodayScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | DietaryBadge>('all');
  const { postcode } = useAppStore();

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const todayMeals = MOCK_MEALS.filter((meal) => {
    const matchesDate = meal.availableDate === today;
    const matchesSearch =
      searchQuery === '' ||
      meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meal.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === 'all' || meal.dietary.includes(activeFilter as DietaryBadge);

    return matchesDate && matchesSearch && matchesFilter;
  });

  const tomorrowMeals = MOCK_MEALS.filter((meal) => meal.availableDate === tomorrow).slice(0, 4);

  const handleMealPress = (meal: typeof MOCK_MEALS[0]) => {
    // TODO: Navigate to meal detail
    console.log('Meal pressed:', meal.name);
  };

  const handleVendorPress = (vendor: typeof MOCK_VENDORS[0]) => {
    // TODO: Navigate to vendor profile
    console.log('Vendor pressed:', vendor.businessName);
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

        <MealGrid
          title="Available Now"
          meals={todayMeals}
          vendors={VENDORS_MAP}
          onMealPress={handleMealPress}
          horizontal
          emptyMessage="No meals available with current filters"
        />

        {tomorrowMeals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tomorrow</Text>
              <Pressable onPress={() => router.push('/schedule')}>
                <Text style={styles.seeAllText}>See all →</Text>
              </Pressable>
            </View>
            <MealGrid
              meals={tomorrowMeals}
              vendors={VENDORS_MAP}
              onMealPress={handleMealPress}
              horizontal
            />
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Local Vendors</Text>
            <Pressable onPress={() => router.push('/vendors')}>
              <Text style={styles.seeAllText}>See all →</Text>
            </Pressable>
          </View>
          <View style={styles.vendorList}>
            {MOCK_VENDORS.slice(0, 3).map((vendor) => (
              <VendorCardCompact
                key={vendor.id}
                vendor={vendor}
                onPress={() => handleVendorPress(vendor)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
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
});
