import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/layout';
import { Card, Button, StatusBadge, ErrorState, OrderListSkeleton, MealGridSkeleton } from '@/components/ui';
import { MealCardCompact } from '@/components/meals';
import { AddMealSheet } from '@/components/vendor';
import { haptic } from '@/lib/haptics';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';
import { useVendorOrders, useMeals, useVendorOrderSubscription } from '@/hooks';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Order, Vendor, Meal } from '@/types';

type DashboardTab = 'orders' | 'menu' | 'earnings';

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('orders');
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const { user } = useAuth();

  // Fetch vendor info for the current user
  useEffect(() => {
    async function fetchVendor() {
      if (!user) return;

      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setVendorId(data.id);
        setVendor({
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
          rating: data.rating,
          reviewCount: data.review_count,
          isVerified: data.is_verified,
          isActive: data.is_active,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      }
    }
    fetchVendor();
  }, [user]);

  // Fetch vendor orders
  const { orders, isLoading: ordersLoading, error: ordersError, refetch, updateOrderStatus } = useVendorOrders();

  // Fetch vendor meals
  const { meals: vendorMeals, isLoading: mealsLoading, error: mealsError, refetch: refetchMeals } = useMeals({
    vendorId: vendorId || undefined,
  });

  const [refreshing, setRefreshing] = useState(false);
  const handleRefreshOrders = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);
  const handleRefreshMeals = useCallback(async () => {
    setRefreshing(true);
    await refetchMeals();
    setRefreshing(false);
  }, [refetchMeals]);
  const handleRefreshEarnings = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Real-time subscription for new orders
  const handleNewOrder = useCallback((newOrder: Order) => {
    refetch();
    Alert.alert(
      'New Order!',
      `Order #${newOrder.id.slice(0, 8).toUpperCase()} - £${newOrder.total.toFixed(2)}`,
      [{ text: 'OK' }]
    );
  }, [refetch]);

  const handleOrderUpdate = useCallback(() => {
    refetch();
  }, [refetch]);

  useVendorOrderSubscription({
    vendorId,
    onNewOrder: handleNewOrder,
    onOrderUpdate: handleOrderUpdate,
  });

  // Calculate earnings from today's orders
  const todaysOrders = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return orders.filter((order) => new Date(order.createdAt) >= todayStart);
  }, [orders]);

  const grossToday = useMemo(() => {
    return todaysOrders.reduce((sum, order) => sum + order.total, 0);
  }, [todaysOrders]);

  const platformFee = grossToday * 0.12; // 12%
  const stripeFee = grossToday > 0 ? (grossToday * 0.014) + 0.20 : 0; // 1.4% + 20p
  const netPayout = grossToday - platformFee - stripeFee;

  // Weekly stats
  const weeklyOrders = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return orders.filter((order) => new Date(order.createdAt) >= weekAgo);
  }, [orders]);

  // Best sellers from weekly orders
  const bestSellers = useMemo(() => {
    const counts: Record<string, number> = {};
    weeklyOrders.forEach((order) => {
      order.items.forEach((item) => {
        counts[item.mealName] = (counts[item.mealName] || 0) + item.quantity;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [weeklyOrders]);

  // Peak order times
  const peakTimes = useMemo(() => {
    const hourCounts: Record<number, number> = {};
    weeklyOrders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const maxCount = Math.max(...Object.values(hourCounts), 1);
    return Object.entries(hourCounts)
      .map(([h, count]) => ({
        hour: `${String(h).padStart(2, '0')}:00`,
        count,
        pct: Math.round((count / maxCount) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [weeklyOrders]);

  // Customer insights
  const { uniqueCustomers, repeatCustomers } = useMemo(() => {
    const customerCounts: Record<string, number> = {};
    weeklyOrders.forEach((order) => {
      customerCounts[order.userId] = (customerCounts[order.userId] || 0) + 1;
    });
    const unique = Object.keys(customerCounts).length;
    const repeat = Object.values(customerCounts).filter((c) => c > 1).length;
    return { uniqueCustomers: unique, repeatCustomers: repeat };
  }, [weeklyOrders]);

  const weeklyGross = weeklyOrders.reduce((sum, order) => sum + order.total, 0);
  const weeklyNet = weeklyGross - (weeklyGross * 0.12) - (weeklyGross > 0 ? (weeklyGross * 0.014) + 0.20 : 0);

  const handleMarkReady = async (orderId: string) => {
    haptic.medium();
    const success = await updateOrderStatus(orderId, 'ready');
    if (!success) {
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const renderOrders = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefreshOrders} tintColor={colors.primary} />
      }
    >
      <Text style={styles.sectionTitle}>Live Orders</Text>

      {ordersLoading ? (
        <OrderListSkeleton count={3} />
      ) : ordersError ? (
        <ErrorState title="Couldn't load orders" message="Pull down to retry." onRetry={handleRefreshOrders} />
      ) : orders.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptyText}>
            Orders will appear here when customers place them.
          </Text>
        </Card>
      ) : (
        orders.map((order) => (
          <Card key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderId}>
                  #{order.id.slice(0, 8).toUpperCase()}
                </Text>
                <Text style={styles.orderTime}>
                  {new Date(order.createdAt).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <StatusBadge status={order.status} />
            </View>

            <View style={styles.orderItems}>
              {order.items.map((item) => (
                <Text key={item.id} style={styles.orderItemText}>
                  {item.quantity}x {item.mealName}
                </Text>
              ))}
            </View>

            <View style={styles.fulfilmentInfo}>
              <Text style={styles.fulfilmentText}>
                {order.fulfilmentType === 'collection' ? '📍 Collection' : '🚗 Delivery'}
                {order.collectionTime && (
                  ` at ${new Date(order.collectionTime).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                )}
              </Text>
            </View>

            <View style={styles.orderFooter}>
              <Text style={styles.orderTotal}>£{order.total.toFixed(2)}</Text>
              {order.status === 'pending' && (
                <Button size="sm" onPress={() => updateOrderStatus(order.id, 'confirmed')}>
                  Confirm
                </Button>
              )}
              {order.status === 'confirmed' && (
                <Button size="sm" onPress={() => updateOrderStatus(order.id, 'preparing')}>
                  Start Preparing
                </Button>
              )}
              {order.status === 'preparing' && (
                <Button size="sm" onPress={() => handleMarkReady(order.id)}>
                  Mark Ready
                </Button>
              )}
              {order.status === 'ready' && order.fulfilmentType === 'collection' && (
                <Button size="sm" onPress={() => updateOrderStatus(order.id, 'collected')}>
                  Collected
                </Button>
              )}
              {order.status === 'ready' && order.fulfilmentType === 'delivery' && (
                <Button size="sm" onPress={() => updateOrderStatus(order.id, 'delivered')}>
                  Delivered
                </Button>
              )}
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );

  const renderMenu = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefreshMeals} tintColor={colors.primary} />
      }
    >
      <View style={styles.menuHeader}>
        <Text style={styles.sectionTitle}>Your Meals</Text>
        <Button size="sm" variant="outline" onPress={() => setIsAddMealOpen(true)}>
          + Add Meal
        </Button>
      </View>

      {mealsLoading ? (
        <MealGridSkeleton count={4} />
      ) : mealsError ? (
        <ErrorState title="Couldn't load meals" message="Pull down to retry." onRetry={handleRefreshMeals} />
      ) : vendorMeals.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={styles.emptyTitle}>No meals scheduled</Text>
          <Text style={styles.emptyText}>
            Add your first meal to start receiving orders.
          </Text>
          <Button onPress={() => setIsAddMealOpen(true)} style={styles.addButton}>
            Add Your First Meal
          </Button>
        </Card>
      ) : (
        vendorMeals.map((meal) => (
          <View key={meal.id} style={styles.menuItem}>
            <MealCardCompact meal={meal} onPress={() => {
              setEditingMeal(meal);
              setIsAddMealOpen(true);
            }} />
            <View style={styles.menuItemActions}>
              <Text style={[
                styles.menuItemStock,
                meal.stock <= 3 && meal.stock > 0 && styles.menuItemStockLow,
                meal.stock === 0 && styles.menuItemStockOut,
              ]}>
                {meal.stock === 0 ? 'Sold out' : `${meal.stock}/${meal.maxStock} left`}
              </Text>
              <View style={styles.menuItemButtons}>
                <Pressable
                  onPress={() => {
                    setEditingMeal(meal);
                    setIsAddMealOpen(true);
                  }}
                  style={styles.menuActionButton}
                >
                  <Text style={styles.menuActionEdit}>Edit</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderEarnings = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefreshEarnings} tintColor={colors.primary} />
      }
    >
      <Text style={styles.sectionTitle}>Today's Breakdown</Text>

      <Card style={styles.earningsCard}>
        <View style={styles.earningsRow}>
          <Text style={styles.earningsLabel}>Gross Sales</Text>
          <Text style={styles.earningsValue}>£{grossToday.toFixed(2)}</Text>
        </View>

        <View style={styles.earningsDivider} />

        <View style={styles.earningsRow}>
          <Text style={styles.earningsLabelSmall}>Platform Fee (12%)</Text>
          <Text style={styles.earningsValueSmall}>-£{platformFee.toFixed(2)}</Text>
        </View>

        <View style={styles.earningsRow}>
          <Text style={styles.earningsLabelSmall}>Stripe Fee (1.4% + 20p)</Text>
          <Text style={styles.earningsValueSmall}>-£{stripeFee.toFixed(2)}</Text>
        </View>

        <View style={styles.earningsDivider} />

        <View style={styles.earningsRow}>
          <Text style={styles.earningsLabelBold}>Net Payout</Text>
          <Text style={styles.earningsValueBold}>£{netPayout.toFixed(2)}</Text>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>This Week</Text>

      <Card style={styles.chartCard}>
        <View style={styles.weeklyStats}>
          <View style={styles.weeklyStat}>
            <Text style={styles.weeklyStatValue}>£{weeklyGross.toFixed(2)}</Text>
            <Text style={styles.weeklyStatLabel}>Gross</Text>
          </View>
          <View style={styles.weeklyStat}>
            <Text style={styles.weeklyStatValue}>{weeklyOrders.length}</Text>
            <Text style={styles.weeklyStatLabel}>Orders</Text>
          </View>
          <View style={styles.weeklyStat}>
            <Text style={styles.weeklyStatValue}>£{weeklyNet.toFixed(2)}</Text>
            <Text style={styles.weeklyStatLabel}>Net</Text>
          </View>
        </View>
      </Card>

      {/* Best Sellers */}
      <Text style={styles.sectionTitle}>Top Sellers</Text>
      <Card style={styles.analyticsCard}>
        {bestSellers.length === 0 ? (
          <Text style={styles.analyticsEmpty}>No orders yet this week</Text>
        ) : (
          bestSellers.map((item, index) => (
            <View key={item.name} style={[styles.rankRow, index < bestSellers.length - 1 && styles.rankRowBorder]}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <Text style={styles.rankName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.rankValue}>{item.count} sold</Text>
            </View>
          ))
        )}
      </Card>

      {/* Peak Times */}
      <Text style={styles.sectionTitle}>Peak Order Times</Text>
      <Card style={styles.analyticsCard}>
        {peakTimes.length === 0 ? (
          <Text style={styles.analyticsEmpty}>No orders yet this week</Text>
        ) : (
          peakTimes.map((item, index) => (
            <View key={item.hour} style={[styles.rankRow, index < peakTimes.length - 1 && styles.rankRowBorder]}>
              <Text style={styles.peakTimeLabel}>{item.hour}</Text>
              <View style={styles.peakBar}>
                <View style={[styles.peakBarFill, { width: `${item.pct}%` }]} />
              </View>
              <Text style={styles.rankValue}>{item.count}</Text>
            </View>
          ))
        )}
      </Card>

      {/* Repeat Customer Rate */}
      <Text style={styles.sectionTitle}>Customer Insights</Text>
      <Card style={styles.analyticsCard}>
        <View style={styles.insightRow}>
          <Text style={styles.insightLabel}>Unique Customers (7d)</Text>
          <Text style={styles.insightValue}>{uniqueCustomers}</Text>
        </View>
        <View style={[styles.insightRow, styles.rankRowBorder, { paddingTop: spacing.sm }]}>
          <Text style={styles.insightLabel}>Repeat Customers</Text>
          <Text style={[styles.insightValue, { color: colors.success }]}>{repeatCustomers}</Text>
        </View>
      </Card>

      <Card style={styles.infoCard}>
        <Text style={styles.infoEmoji}>💡</Text>
        <Text style={styles.infoText}>
          Payouts are processed every Tuesday to your connected bank account via Stripe.
        </Text>
      </Card>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Vendor Dashboard"
        subtitle={vendor?.businessName || 'Loading...'}
      />

      <View style={styles.tabBar}>
        {(['orders', 'menu', 'earnings'] as DashboardTab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text
              style={[styles.tabText, activeTab === tab && styles.tabTextActive]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'orders' && renderOrders()}
      {activeTab === 'menu' && renderMenu()}
      {activeTab === 'earnings' && renderEarnings()}

      {/* Add/Edit Meal Sheet */}
      {vendorId && (
        <AddMealSheet
          isOpen={isAddMealOpen}
          onClose={() => {
            setIsAddMealOpen(false);
            setEditingMeal(null);
          }}
          vendorId={vendorId}
          onMealAdded={refetchMeals}
          meal={editingMeal}
          onMealDeleted={refetchMeals}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.cardBackground,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.backgroundWhite,
  },
  tabContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
  },

  // Orders
  orderCard: {
    marginBottom: spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  orderId: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  orderTime: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  orderItems: {
    marginBottom: spacing.sm,
  },
  orderItemText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  fulfilmentInfo: {
    marginBottom: spacing.md,
  },
  fulfilmentText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.primary,
  },

  // Menu
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  menuItem: {
    marginBottom: spacing.sm,
  },
  menuItemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: spacing['3xl'],
    marginTop: spacing.xs,
  },
  menuItemButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  menuActionButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  menuActionEdit: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  menuItemStock: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  menuItemStockLow: {
    color: colors.accent,
  },
  menuItemStockOut: {
    color: colors.error,
    fontFamily: fonts.bodySemiBold,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
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
    marginBottom: spacing.lg,
  },
  addButton: {
    width: '100%',
  },

  // Earnings
  earningsCard: {
    marginBottom: spacing.xl,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  earningsLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  earningsValue: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  earningsLabelSmall: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  earningsValueSmall: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.error,
  },
  earningsLabelBold: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  earningsValueBold: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xl,
    color: colors.success,
  },
  earningsDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  chartCard: {
    marginBottom: spacing.lg,
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weeklyStat: {
    alignItems: 'center',
  },
  weeklyStatValue: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.primary,
  },
  weeklyStatLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  analyticsCard: {
    marginBottom: spacing.lg,
  },
  analyticsEmpty: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  rankRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  rankName: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  rankValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  peakTimeLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    width: 48,
  },
  peakBar: {
    flex: 1,
    height: 12,
    backgroundColor: colors.grey100,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  peakBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  insightLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  insightValue: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentPale,
  },
  infoEmoji: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  infoText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
