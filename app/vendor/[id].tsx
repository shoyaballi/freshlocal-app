import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Card, Badge } from '@/components/ui';
import { MealCard } from '@/components/meals';
import { OrderBottomSheet } from '@/components/order-flow';
import { StarRating, ReviewCard } from '@/components/reviews';
import { useMeals } from '@/hooks';
import { useReviews } from '@/hooks/useReviews';
import { supabase } from '@/lib/supabase';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '@/constants/theme';
import type { Meal, Vendor, FoodTag } from '@/types';

// ---------------------------------------------------------------------------
// Tag label map
// ---------------------------------------------------------------------------

const TAG_LABELS: Record<FoodTag, string> = {
  halal: 'Halal',
  vegetarian: 'Vegetarian',
  pakistani: 'Pakistani',
  bangladeshi: 'Bangladeshi',
  indian: 'Indian',
  middle_eastern: 'Middle Eastern',
  grill: 'Grill',
  street_food: 'Street Food',
  bakery: 'Bakery',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Helpers have been moved to shared components (StarRating, ReviewCard)

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function VendorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // ---- Vendor state (fetch single vendor by id) ----
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [vendorLoading, setVendorLoading] = useState(true);

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        setVendorLoading(true);
        const { data, error } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) return;

        const transformed: Vendor = {
          id: data.id,
          userId: data.user_id,
          businessName: data.business_name,
          handle: data.handle,
          description: data.description,
          businessType: data.business_type,
          avatar: data.avatar,
          coverImage: data.cover_image,
          tags: data.tags,
          phone: data.phone,
          postcode: data.postcode,
          rating: parseFloat(data.rating),
          reviewCount: data.review_count,
          isVerified: data.is_verified,
          isActive: data.is_active,
          stripeAccountId: data.stripe_account_id,
          stripeChargesEnabled: data.stripe_charges_enabled,
          stripePayoutsEnabled: data.stripe_payouts_enabled,
          stripeOnboardingComplete: data.stripe_onboarding_complete,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        setVendor(transformed);
      } catch {
        // Vendor fetch failed
      } finally {
        setVendorLoading(false);
      }
    };

    if (id) fetchVendor();
  }, [id]);

  // ---- Meals for this vendor ----
  const { meals, isLoading: mealsLoading } = useMeals({ vendorId: id });

  // ---- Reviews ----
  const { reviews, isLoading: reviewsLoading } = useReviews({ vendorId: id! });

  // ---- Order bottom sheet state ----
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isOrderSheetVisible, setIsOrderSheetVisible] = useState(false);

  const handleMealPress = (meal: Meal) => {
    setSelectedMeal(meal);
    setIsOrderSheetVisible(true);
  };

  const handleCloseOrderSheet = () => {
    setIsOrderSheetVisible(false);
    setSelectedMeal(null);
  };

  // ---- Loading state ----
  if (vendorLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Vendor',
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { fontFamily: fonts.bodySemiBold },
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading vendor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ---- Not found ----
  if (!vendor) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Vendor',
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { fontFamily: fonts.bodySemiBold },
          }}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>😕</Text>
          <Text style={styles.emptyTitle}>Vendor not found</Text>
          <Text style={styles.emptyText}>
            This vendor may no longer be available.
          </Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ---- Main render ----
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: vendor.businessName,
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { fontFamily: fonts.bodySemiBold },
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* -------- Vendor info section -------- */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.vendorInfoSection}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>{vendor.avatar || '🍽️'}</Text>
          </View>

          {/* Business name + verified */}
          <View style={styles.nameRow}>
            <Text style={styles.businessName}>{vendor.businessName}</Text>
            {vendor.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
              </View>
            )}
          </View>

          {/* Handle */}
          <Text style={styles.handle}>@{vendor.handle}</Text>

          {/* Rating + review count */}
          <View style={styles.ratingRow}>
            <StarRating rating={vendor.rating} size={fontSizes.md} showValue />
            <Text style={styles.reviewCountText}>
              ({vendor.reviewCount} {vendor.reviewCount === 1 ? 'review' : 'reviews'})
            </Text>
          </View>

          {/* Description */}
          {vendor.description ? (
            <Text style={styles.description}>{vendor.description}</Text>
          ) : null}

          {/* Food tags */}
          {vendor.tags && vendor.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {vendor.tags.map((tag) => (
                <Badge key={tag} variant="default" size="sm" style={styles.tagBadge}>
                  {TAG_LABELS[tag] || tag}
                </Badge>
              ))}
            </View>
          )}
        </Animated.View>

        {/* -------- Available Meals -------- */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Meals</Text>
          </View>

          {mealsLoading ? (
            <View style={styles.sectionLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : meals.length === 0 ? (
            <View style={styles.sectionEmpty}>
              <Text style={styles.sectionEmptyEmoji}>🍃</Text>
              <Text style={styles.sectionEmptyText}>
                No meals available right now. Check back soon!
              </Text>
            </View>
          ) : (
            <View style={styles.mealsGrid}>
              {meals.map((meal, index) => (
                <Animated.View
                  key={meal.id}
                  entering={FadeInDown.delay(200 + index * 80).duration(350)}
                  style={styles.mealGridItem}
                >
                  <MealCard
                    meal={meal}
                    showVendor={false}
                    onPress={() => handleMealPress(meal)}
                    fullWidth
                  />
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* -------- Reviews -------- */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {reviews.length > 0 && (
              <Text style={styles.reviewCountLabel}>
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </Text>
            )}
          </View>

          {reviewsLoading ? (
            <View style={styles.sectionLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : reviews.length === 0 ? (
            <View style={styles.sectionEmpty}>
              <Text style={styles.sectionEmptyEmoji}>💬</Text>
              <Text style={styles.sectionEmptyText}>
                No reviews yet. Be the first to leave one!
              </Text>
            </View>
          ) : (
            <View style={styles.reviewsList}>
              {reviews.map((review, index) => (
                <Animated.View
                  key={review.id}
                  entering={FadeInDown.delay(350 + index * 80).duration(350)}
                >
                  <ReviewCard review={review} />
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* -------- Order Bottom Sheet -------- */}
      <OrderBottomSheet
        isVisible={isOrderSheetVisible}
        onClose={handleCloseOrderSheet}
        meal={selectedMeal}
        vendor={vendor}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing['4xl'],
  },

  // ---- Loading / empty states ----
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
    borderRadius: borderRadius.md,
  },
  backButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.backgroundWhite,
  },

  // ---- Vendor info section ----
  vendorInfoSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  avatarEmoji: {
    fontSize: 44,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  businessName: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
  },
  verifiedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedIcon: {
    fontSize: 13,
    color: colors.backgroundWhite,
    fontFamily: fonts.bodyBold,
  },
  handle: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  reviewCountText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  tagBadge: {
    backgroundColor: colors.accentPale,
  },

  // ---- Section shared styles ----
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
  },
  sectionLoading: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
  },
  sectionEmpty: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  sectionEmptyEmoji: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  sectionEmptyText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // ---- Meals grid ----
  mealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  mealGridItem: {
    width: '47%',
    flexGrow: 1,
  },

  // ---- Reviews ----
  reviewCountLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  reviewsList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
