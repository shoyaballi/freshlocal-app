import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/layout';
import { SearchInput } from '@/components/ui';
import { VendorCard } from '@/components/vendors';
import { colors, fonts, fontSizes, spacing } from '@/constants/theme';
import { useVendors } from '@/hooks';
import type { Vendor } from '@/types';

export default function VendorsScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch vendors
  const { vendors, isLoading, error } = useVendors();

  // Filter vendors by search query locally for instant feedback
  const filteredVendors = useMemo(() => {
    if (!searchQuery) return vendors;
    const query = searchQuery.toLowerCase();
    return vendors.filter(
      (vendor) =>
        vendor.businessName.toLowerCase().includes(query) ||
        vendor.handle.toLowerCase().includes(query) ||
        vendor.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [vendors, searchQuery]);

  const getVendorDistance = (_vendorId: string) => {
    // Mock distance calculation - in production, calculate from user location
    const distances = ['0.3 mi', '0.5 mi', '0.8 mi', '1.2 mi', '1.5 mi'];
    return distances[Math.floor(Math.random() * distances.length)];
  };

  const handleVendorPress = (vendor: Vendor) => {
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
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading vendors...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>⚠️</Text>
            <Text style={styles.emptyTitle}>Something went wrong</Text>
            <Text style={styles.emptyText}>
              Unable to load vendors. Please try again later.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsText}>
              {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''} near you
            </Text>

            {filteredVendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                onPress={() => handleVendorPress(vendor)}
                distance={getVendorDistance(vendor.id)}
                upcomingMeals={0} // TODO: Fetch upcoming meal count
              />
            ))}

            {filteredVendors.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>👨‍🍳</Text>
                <Text style={styles.emptyTitle}>No vendors found</Text>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? 'Try a different search term.'
                    : 'Check back later for new vendors in your area.'}
                </Text>
              </View>
            )}
          </>
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
  loadingContainer: {
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
