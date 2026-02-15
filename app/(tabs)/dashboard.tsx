import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/layout';
import { Card, Button, StatusBadge } from '@/components/ui';
import { MealCardCompact } from '@/components/meals';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';
import { MOCK_ORDERS, MOCK_MEALS, MOCK_VENDORS } from '@/constants/mockData';

type DashboardTab = 'orders' | 'menu' | 'earnings';

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('orders');

  const vendorOrders = MOCK_ORDERS.slice(0, 5);
  const vendorMeals = MOCK_MEALS.filter((meal) => meal.vendorId === 'vendor-1');

  // Commission model calculations
  const grossToday = 89.50;
  const platformFee = grossToday * 0.12; // 12%
  const stripeFee = (grossToday * 0.014) + 0.20; // 1.4% + 20p
  const netPayout = grossToday - platformFee - stripeFee;

  const renderOrders = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.tabContent}
    >
      <Text style={styles.sectionTitle}>Live Orders</Text>

      {vendorOrders.map((order) => (
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

          <View style={styles.orderFooter}>
            <Text style={styles.orderTotal}>£{order.total.toFixed(2)}</Text>
            {order.status === 'preparing' && (
              <Button size="sm" onPress={() => console.log('Mark ready')}>
                Mark Ready
              </Button>
            )}
          </View>
        </Card>
      ))}
    </ScrollView>
  );

  const renderMenu = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.tabContent}
    >
      <View style={styles.menuHeader}>
        <Text style={styles.sectionTitle}>This Week's Meals</Text>
        <Button size="sm" variant="outline" onPress={() => console.log('Add meal')}>
          + Add Meal
        </Button>
      </View>

      {vendorMeals.map((meal) => (
        <View key={meal.id} style={styles.menuItem}>
          <MealCardCompact meal={meal} onPress={() => console.log('Edit meal')} />
          <View style={styles.menuItemMeta}>
            <Text style={styles.menuItemStock}>
              {meal.stock}/{meal.maxStock} left
            </Text>
          </View>
        </View>
      ))}

      {vendorMeals.length === 0 && (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={styles.emptyTitle}>No meals scheduled</Text>
          <Text style={styles.emptyText}>
            Add your first meal to start receiving orders.
          </Text>
          <Button onPress={() => console.log('Add meal')} style={styles.addButton}>
            Add Your First Meal
          </Button>
        </Card>
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
            <Text style={styles.weeklyStatValue}>£432.50</Text>
            <Text style={styles.weeklyStatLabel}>Gross</Text>
          </View>
          <View style={styles.weeklyStat}>
            <Text style={styles.weeklyStatValue}>28</Text>
            <Text style={styles.weeklyStatLabel}>Orders</Text>
          </View>
          <View style={styles.weeklyStat}>
            <Text style={styles.weeklyStatValue}>£367.63</Text>
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
        subtitle={MOCK_VENDORS[0].businessName}
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
    marginBottom: spacing.md,
  },
  orderItemText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
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
