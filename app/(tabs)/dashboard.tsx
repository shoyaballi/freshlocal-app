import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/layout';
import { Card, Button, StatusBadge } from '@/components/ui';
import { MealCardCompact } from '@/components/meals';
import { AddMealSheet } from '@/components/vendor';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';
import { useVendorOrders, useMeals, useVendorOrderSubscription } from '@/hooks';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Order, Vendor } from '@/types';

type DashboardTab = 'orders' | 'menu' | 'earnings';

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('orders');
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
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
  const { orders, isLoading: ordersLoading, refetch, updateOrderStatus } = useVendorOrders();

  // Fetch vendor meals
  const { meals: vendorMeals, isLoading: mealsLoading, refetch: refetchMeals } = useMeals({
    vendorId: vendorId || undefined,
  });

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

  const weeklyGross = weeklyOrders.reduce((sum, order) => sum + order.total, 0);
  const weeklyNet = weeklyGross - (weeklyGross * 0.12) - (weeklyGross > 0 ? (weeklyGross * 0.014) + 0.20 : 0);

  const handleMarkReady = async (orderId: string) => {
    const success = await updateOrderStatus(orderId, 'ready');
    if (!success) {
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const renderOrders = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.tabContent}
    >
      <Text style={styles.sectionTitle}>Live Orders</Text>

      {ordersLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
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
    >
      <View style={styles.menuHeader}>
        <Text style={styles.sectionTitle}>Your Meals</Text>
        <Button size="sm" variant="outline" onPress={() => setIsAddMealOpen(true)}>
          + Add Meal
        </Button>
      </View>

      {mealsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
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
            <MealCardCompact meal={meal} onPress={() => console.log('Edit meal')} />
            <View style={styles.menuItemMeta}>
              <Text style={[
                styles.menuItemStock,
                meal.stock <= 3 && meal.stock > 0 && styles.menuItemStockLow,
                meal.stock === 0 && styles.menuItemStockOut,
              ]}>
                {meal.stock === 0 ? 'Sold out' : `${meal.stock}/${meal.maxStock} left`}
              </Text>
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
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartPlaceholderText}>📊</Text>
          <Text style={styles.chartPlaceholderLabel}>Weekly earnings chart</Text>
        </View>

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

      {/* Add Meal Sheet */}
      {vendorId && (
        <AddMealSheet
          isOpen={isAddMealOpen}
          onClose={() => setIsAddMealOpen(false)}
          vendorId={vendorId}
          onMealAdded={refetchMeals}
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
  menuItemMeta: {
    paddingLeft: spacing['3xl'],
    marginTop: spacing.xs,
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
  chartPlaceholder: {
    height: 150,
    backgroundColor: colors.grey100,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  chartPlaceholderText: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  chartPlaceholderLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
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
