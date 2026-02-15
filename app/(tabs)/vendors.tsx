import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/layout';
import { SearchInput } from '@/components/ui';
import { VendorCard } from '@/components/vendors';
import { colors, fonts, fontSizes, spacing } from '@/constants/theme';
import { MOCK_VENDORS, MOCK_MEALS } from '@/constants/mockData';

export default function VendorsScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVendors = MOCK_VENDORS.filter((vendor) => {
    if (searchQuery === '') return true;
    return (
      vendor.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  });

  const getVendorMealCount = (vendorId: string) => {
    const today = new Date();
    const weekFromNow = new Date(today);
    weekFromNow.setDate(today.getDate() + 7);

    return MOCK_MEALS.filter((meal) => {
      const mealDate = new Date(meal.availableDate);
      return meal.vendorId === vendorId && mealDate >= today && mealDate <= weekFromNow;
    }).length;
  };

  const getVendorDistance = (_vendorId: string) => {
    // Mock distance calculation
    const distances = ['0.3 mi', '0.5 mi', '0.8 mi', '1.2 mi', '1.5 mi'];
    return distances[Math.floor(Math.random() * distances.length)];
  };

  const handleVendorPress = (vendor: typeof MOCK_VENDORS[0]) => {
    // TODO: Navigate to vendor profile
    console.log('Vendor pressed:', vendor.businessName);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Vendors" subtitle="Discover local food makers" />

      <View style={styles.searchContainer}>
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="Search vendors, cuisines..."
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.resultsText}>
          {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''} near you
        </Text>

        {filteredVendors.map((vendor) => (
          <VendorCard
            key={vendor.id}
            vendor={vendor}
            onPress={() => handleVendorPress(vendor)}
            distance={getVendorDistance(vendor.id)}
            upcomingMeals={getVendorMealCount(vendor.id)}
          />
        ))}

        {filteredVendors.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👨‍🍳</Text>
            <Text style={styles.emptyTitle}>No vendors found</Text>
            <Text style={styles.emptyText}>
              Try a different search term or check back later.
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
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  resultsText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['4xl'],
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
