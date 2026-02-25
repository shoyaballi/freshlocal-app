import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { colors, borderRadius, spacing, shadows } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Base skeleton primitives
// ---------------------------------------------------------------------------

interface SkeletonBoxProps {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({ width = '100%', height = 16, radius = borderRadius.sm, style }: SkeletonBoxProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius,
          backgroundColor: colors.grey200,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonText({ width = '100%', height = 14, style }: SkeletonBoxProps) {
  return <SkeletonBox width={width} height={height} radius={4} style={style} />;
}

export function SkeletonCircle({ size = 48, style }: { size?: number; style?: ViewStyle }) {
  return <SkeletonBox width={size} height={size} radius={size / 2} style={style} />;
}

// ---------------------------------------------------------------------------
// Skeleton variants matching real components
// ---------------------------------------------------------------------------

export function MealCardSkeleton() {
  return (
    <View style={skeletonStyles.mealCard}>
      <SkeletonBox height={100} radius={borderRadius.md} />
      <View style={skeletonStyles.mealCardContent}>
        <SkeletonText width="70%" height={14} />
        <SkeletonText width="50%" height={12} style={{ marginTop: 6 }} />
        <View style={skeletonStyles.mealCardFooter}>
          <SkeletonBox width={50} height={12} radius={4} />
          <SkeletonBox width={40} height={16} radius={4} />
        </View>
      </View>
    </View>
  );
}

export function VendorCardSkeleton() {
  return (
    <View style={skeletonStyles.vendorCard}>
      <View style={skeletonStyles.vendorCardRow}>
        <SkeletonCircle size={56} />
        <View style={skeletonStyles.vendorCardInfo}>
          <SkeletonText width="60%" height={16} />
          <SkeletonText width="40%" height={12} style={{ marginTop: 6 }} />
          <View style={skeletonStyles.tagsRow}>
            <SkeletonBox width={60} height={20} radius={10} />
            <SkeletonBox width={50} height={20} radius={10} />
            <SkeletonBox width={70} height={20} radius={10} />
          </View>
        </View>
      </View>
    </View>
  );
}

export function OrderCardSkeleton() {
  return (
    <View style={skeletonStyles.orderCard}>
      <View style={skeletonStyles.orderCardHeader}>
        <SkeletonBox width={80} height={20} radius={10} />
        <SkeletonText width={60} height={12} />
      </View>
      <SkeletonText width="80%" height={14} style={{ marginTop: 8 }} />
      <SkeletonText width="50%" height={12} style={{ marginTop: 6 }} />
      <View style={skeletonStyles.orderCardFooter}>
        <SkeletonText width={60} height={14} />
        <SkeletonBox width={80} height={32} radius={borderRadius.sm} />
      </View>
    </View>
  );
}

export function StatCardSkeleton() {
  return (
    <View style={skeletonStyles.statCard}>
      <SkeletonBox width={40} height={24} radius={4} />
      <SkeletonText width={60} height={12} style={{ marginTop: 4 }} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Skeleton screen sections
// ---------------------------------------------------------------------------

export function MealGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={skeletonStyles.mealGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={skeletonStyles.mealGridItem}>
          <MealCardSkeleton />
        </View>
      ))}
    </View>
  );
}

export function VendorListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={skeletonStyles.vendorList}>
      {Array.from({ length: count }).map((_, i) => (
        <VendorCardSkeleton key={i} />
      ))}
    </View>
  );
}

export function OrderListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={skeletonStyles.orderList}>
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const skeletonStyles = StyleSheet.create({
  mealCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  mealCardContent: {
    padding: spacing.md,
  },
  mealCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },

  vendorCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  vendorCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  vendorCardInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 8,
  },

  orderCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },

  statCard: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },

  mealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  mealGridItem: {
    width: '47%',
    flexGrow: 1,
  },

  vendorList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },

  orderList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
