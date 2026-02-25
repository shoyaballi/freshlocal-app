import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Header } from '@/components/layout';
import { Card, ErrorState } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TimePeriod = '7d' | '30d' | 'all';

interface AnalyticsData {
  totalGMV: number;
  revenue: number;
  totalOrders: number;
  avgOrderValue: number;
  topVendors: { name: string; revenue: number }[];
  topMeals: { name: string; orderCount: number }[];
}

interface TimePeriodOption {
  value: TimePeriod;
  label: string;
}

const TIME_PERIODS: TimePeriodOption[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'all', label: 'All time' },
];

const COMMISSION_RATE = 0.12;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return `\u00A3${amount.toFixed(2)}`;
}

function getStartDate(period: TimePeriod): string | null {
  if (period === 'all') return null;

  const now = new Date();
  const days = period === '7d' ? 7 : 30;
  now.setDate(now.getDate() - days);
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

// ---------------------------------------------------------------------------
// Analytics Screen
// ---------------------------------------------------------------------------

export default function AnalyticsScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<TimePeriod>('7d');
  const [data, setData] = useState<AnalyticsData>({
    totalGMV: 0,
    revenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    topVendors: [],
    topMeals: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (selectedPeriod: TimePeriod) => {
    try {
      setLoading(true);
      setError(null);

      const startDate = getStartDate(selectedPeriod);

      // Fetch orders for the period
      let ordersQuery = supabase
        .from('orders')
        .select('id, total, vendor_id, created_at');

      if (startDate) {
        ordersQuery = ordersQuery.gte('created_at', startDate);
      }

      const { data: orders, error: ordersErr } = await ordersQuery;
      if (ordersErr) throw ordersErr;

      const ordersList = orders ?? [];
      const totalGMV = ordersList.reduce((sum, o) => sum + (o.total || 0), 0);
      const totalOrders = ordersList.length;
      const avgOrderValue = totalOrders > 0 ? totalGMV / totalOrders : 0;
      const revenue = totalGMV * COMMISSION_RATE;

      // Aggregate revenue by vendor
      const vendorRevenue: Record<string, number> = {};
      ordersList.forEach((order) => {
        if (order.vendor_id) {
          vendorRevenue[order.vendor_id] =
            (vendorRevenue[order.vendor_id] || 0) + (order.total || 0);
        }
      });

      // Fetch vendor names for top vendors
      const vendorIds = Object.keys(vendorRevenue);
      let topVendors: { name: string; revenue: number }[] = [];

      if (vendorIds.length > 0) {
        const { data: vendors, error: vendorsErr } = await supabase
          .from('vendors')
          .select('id, business_name')
          .in('id', vendorIds);

        if (vendorsErr) throw vendorsErr;

        const vendorNameMap: Record<string, string> = {};
        (vendors ?? []).forEach((v) => {
          vendorNameMap[v.id] = v.business_name;
        });

        topVendors = Object.entries(vendorRevenue)
          .map(([id, rev]) => ({
            name: vendorNameMap[id] || 'Unknown Vendor',
            revenue: rev,
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);
      }

      // Fetch order items for top meals
      const orderIds = ordersList.map((o) => o.id);
      let topMeals: { name: string; orderCount: number }[] = [];

      if (orderIds.length > 0) {
        // Fetch in batches to avoid URL length limits
        const batchSize = 100;
        const allItems: any[] = [];

        for (let i = 0; i < orderIds.length; i += batchSize) {
          const batchIds = orderIds.slice(i, i + batchSize);
          const { data: items, error: itemsErr } = await supabase
            .from('order_items')
            .select('meal_id, quantity, meal_name')
            .in('order_id', batchIds);

          if (itemsErr) throw itemsErr;
          if (items) allItems.push(...items);
        }

        // Aggregate by meal
        const mealCounts: Record<string, { name: string; count: number }> = {};
        allItems.forEach((item) => {
          const key = item.meal_id || item.meal_name || 'unknown';
          if (!mealCounts[key]) {
            mealCounts[key] = {
              name: item.meal_name || 'Unknown Meal',
              count: 0,
            };
          }
          mealCounts[key].count += item.quantity || 1;
        });

        topMeals = Object.values(mealCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map((m) => ({ name: m.name, orderCount: m.count }));
      }

      setData({
        totalGMV,
        revenue,
        totalOrders,
        avgOrderValue,
        topVendors,
        topMeals,
      });
    } catch (err: any) {
      console.error('Analytics fetch error:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(period);
  }, [period, fetchAnalytics]);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header
          title="Analytics"
          leftIcon={<Text style={styles.backArrow}>{'<'}</Text>}
          onLeftPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Crunching the numbers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header
          title="Analytics"
          leftIcon={<Text style={styles.backArrow}>{'<'}</Text>}
          onLeftPress={() => router.back()}
        />
        <ErrorState
          emoji="📊"
          title="Failed to load analytics"
          message={error}
          onRetry={() => fetchAnalytics(period)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Analytics"
        leftIcon={<Text style={styles.backArrow}>{'<'}</Text>}
        onLeftPress={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Time Period Selector */}
        <View style={styles.periodContainer}>
          {TIME_PERIODS.map((opt) => {
            const isActive = period === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setPeriod(opt.value)}
                style={[styles.periodChip, isActive && styles.periodChipActive]}
              >
                <Text
                  style={[
                    styles.periodChipText,
                    isActive && styles.periodChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Stat Cards */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Total GMV</Text>
            <Text style={styles.statValue}>{formatCurrency(data.totalGMV)}</Text>
          </Card>

          <Card style={[styles.statCard, styles.statCardHighlight]}>
            <Text style={styles.statLabel}>Revenue (12%)</Text>
            <Text style={[styles.statValue, styles.statValueHighlight]}>
              {formatCurrency(data.revenue)}
            </Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Total Orders</Text>
            <Text style={styles.statValue}>{data.totalOrders}</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Avg Order Value</Text>
            <Text style={styles.statValue}>{formatCurrency(data.avgOrderValue)}</Text>
          </Card>
        </View>

        {/* Top 5 Vendors */}
        <Text style={styles.sectionTitle}>Top 5 Vendors by Revenue</Text>
        <Card style={styles.listCard}>
          {data.topVendors.length === 0 ? (
            <Text style={styles.noDataText}>No vendor data available yet.</Text>
          ) : (
            data.topVendors.map((vendor, index) => (
              <View
                key={`${vendor.name}-${index}`}
                style={[
                  styles.listItem,
                  index < data.topVendors.length - 1 && styles.listItemBorder,
                ]}
              >
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <Text style={styles.listItemName} numberOfLines={1}>
                  {vendor.name}
                </Text>
                <Text style={styles.listItemValue}>
                  {formatCurrency(vendor.revenue)}
                </Text>
              </View>
            ))
          )}
        </Card>

        {/* Top 5 Meals */}
        <Text style={styles.sectionTitle}>Top 5 Meals by Orders</Text>
        <Card style={styles.listCard}>
          {data.topMeals.length === 0 ? (
            <Text style={styles.noDataText}>No meal data available yet.</Text>
          ) : (
            data.topMeals.map((meal, index) => (
              <View
                key={`${meal.name}-${index}`}
                style={[
                  styles.listItem,
                  index < data.topMeals.length - 1 && styles.listItemBorder,
                ]}
              >
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <Text style={styles.listItemName} numberOfLines={1}>
                  {meal.name}
                </Text>
                <Text style={styles.listItemValue}>
                  {meal.orderCount} order{meal.orderCount !== 1 ? 's' : ''}
                </Text>
              </View>
            ))
          )}
        </Card>

        {/* Info Note */}
        <View style={styles.infoCard}>
          <Text style={styles.infoEmoji}>💡</Text>
          <Text style={styles.infoText}>
            Revenue is calculated as 12% platform commission on total GMV. Actual
            revenue may vary after refunds and chargebacks.
          </Text>
        </View>
      </ScrollView>
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
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  backArrow: {
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    fontFamily: fonts.bodySemiBold,
  },

  // Period Selector
  periodContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  periodChip: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  periodChipTextActive: {
    color: '#fffdf9',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  statCard: {
    width: '47%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  statCardHighlight: {
    backgroundColor: colors.successPale,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  statValue: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
  },
  statValueHighlight: {
    color: colors.success,
  },

  // Section Title
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  // List Card
  listCard: {
    marginBottom: spacing['2xl'],
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rankText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  listItemName: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginRight: spacing.md,
  },
  listItemValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  noDataText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.accentPale,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  infoEmoji: {
    fontSize: 20,
    marginRight: spacing.md,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
