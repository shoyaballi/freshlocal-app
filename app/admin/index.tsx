import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardStats {
  todayOrders: number;
  todayGMV: number;
  activeVendors: number;
  pendingApprovals: number;
}

interface DayData {
  date: string;
  label: string;
  count: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return `\u00A3${amount.toFixed(2)}`;
}

function getLastSevenDays(): { start: string; dates: string[] } {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return { start: dates[0], dates };
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'short' });
}

// ---------------------------------------------------------------------------
// Admin Dashboard Screen
// ---------------------------------------------------------------------------

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    todayGMV: 0,
    activeVendors: 0,
    pendingApprovals: 0,
  });
  const [weeklyData, setWeeklyData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayISO = todayStart.toISOString();

      // Fetch today's orders
      const { data: todayOrders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total')
        .gte('created_at', todayISO);

      if (ordersError) throw ordersError;

      const todayCount = todayOrders?.length ?? 0;
      const todayGMV = todayOrders?.reduce((sum, o) => sum + (o.total || 0), 0) ?? 0;

      // Fetch active vendors count
      const { count: activeCount, error: activeError } = await supabase
        .from('vendors')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      if (activeError) throw activeError;

      // Fetch pending vendor approvals
      const { count: pendingCount, error: pendingError } = await supabase
        .from('vendors')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', false);

      if (pendingError) throw pendingError;

      setStats({
        todayOrders: todayCount,
        todayGMV: todayGMV,
        activeVendors: activeCount ?? 0,
        pendingApprovals: pendingCount ?? 0,
      });

      // Fetch weekly order data for chart
      const { start, dates } = getLastSevenDays();
      const { data: weekOrders, error: weekError } = await supabase
        .from('orders')
        .select('created_at')
        .gte('created_at', start + 'T00:00:00.000Z');

      if (weekError) throw weekError;

      // Group orders by date
      const countByDate: Record<string, number> = {};
      dates.forEach((d) => (countByDate[d] = 0));

      (weekOrders ?? []).forEach((order) => {
        const dateKey = new Date(order.created_at).toISOString().split('T')[0];
        if (countByDate[dateKey] !== undefined) {
          countByDate[dateKey]++;
        }
      });

      const chartData: DayData[] = dates.map((d) => ({
        date: d,
        label: getDayLabel(d),
        count: countByDate[d] || 0,
      }));

      setWeeklyData(chartData);
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const maxBarValue = useMemo(() => {
    const max = Math.max(...weeklyData.map((d) => d.count), 1);
    return max;
  }, [weeklyData]);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header
          title="Admin Panel"
          subtitle="Dashboard"
          leftIcon={<Text style={styles.backArrow}>{'<'}</Text>}
          onLeftPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header
          title="Admin Panel"
          subtitle="Dashboard"
          leftIcon={<Text style={styles.backArrow}>{'<'}</Text>}
          onLeftPress={() => router.back()}
        />
        <ErrorState
          emoji="📊"
          title="Failed to load dashboard"
          message={error}
          onRetry={fetchDashboardData}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Admin Panel"
        subtitle="Dashboard"
        leftIcon={<Text style={styles.backArrow}>{'<'}</Text>}
        onLeftPress={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stat Cards - 2x2 Grid */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statEmoji}>📦</Text>
            <Text style={styles.statValue}>{stats.todayOrders}</Text>
            <Text style={styles.statLabel}>Today's Orders</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statEmoji}>💷</Text>
            <Text style={styles.statValue}>{formatCurrency(stats.todayGMV)}</Text>
            <Text style={styles.statLabel}>Today's GMV</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statEmoji}>👨‍🍳</Text>
            <Text style={styles.statValue}>{stats.activeVendors}</Text>
            <Text style={styles.statLabel}>Active Vendors</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statEmoji}>⏳</Text>
            <Text style={styles.statValue}>{stats.pendingApprovals}</Text>
            <Text style={styles.statLabel}>Pending Approvals</Text>
          </Card>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => router.push('/admin/vendors')}
          >
            <Text style={styles.actionEmoji}>👨‍🍳</Text>
            <Text style={styles.actionText}>Manage Vendors</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => router.push('/admin/orders')}
          >
            <Text style={styles.actionEmoji}>📋</Text>
            <Text style={styles.actionText}>View Orders</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => router.push('/admin/notify')}
          >
            <Text style={styles.actionEmoji}>📣</Text>
            <Text style={styles.actionText}>Send Notification</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => router.push('/admin/analytics')}
          >
            <Text style={styles.actionEmoji}>📊</Text>
            <Text style={styles.actionText}>Analytics</Text>
          </Pressable>
        </View>

        {/* Weekly Bar Chart */}
        <Text style={styles.sectionTitle}>Orders This Week</Text>
        <Card style={styles.chartCard}>
          <View style={styles.chartContainer}>
            {weeklyData.map((day) => {
              const barHeight = maxBarValue > 0
                ? Math.max((day.count / maxBarValue) * 120, day.count > 0 ? 8 : 2)
                : 2;

              return (
                <View key={day.date} style={styles.barColumn}>
                  <Text style={styles.barCount}>
                    {day.count > 0 ? day.count : ''}
                  </Text>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor:
                            day.count > 0 ? colors.primary : colors.grey200,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{day.label}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.chartSummary}>
            <Text style={styles.chartSummaryText}>
              Total:{' '}
              {weeklyData.reduce((sum, d) => sum + d.count, 0)} orders this week
            </Text>
          </View>
        </Card>
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
  statEmoji: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  statValue: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Section Title
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  // Quick Actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  actionButton: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  actionButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  actionEmoji: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  actionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    textAlign: 'center',
  },

  // Chart
  chartCard: {
    marginBottom: spacing.lg,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 170,
    paddingTop: spacing.lg,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barCount: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    minHeight: 16,
  },
  barWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
  },
  bar: {
    width: 24,
    borderRadius: borderRadius.sm,
    minHeight: 2,
  },
  barLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  chartSummary: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  chartSummaryText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
});
