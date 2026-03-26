import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, StatusBadge, ErrorState, OrderListSkeleton } from '@/components/ui';
import { useOrders } from '@/hooks/useOrders';
import { formatDate, formatTime } from '@/lib/formatters';
import {
  colors,
  fonts,
  fontSizes,
  spacing,
  borderRadius,
} from '@/constants/theme';
import type { Order, OrderStatus } from '@/types';

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

interface OrderWithDetails extends Order {
  vendor: NonNullable<Order['vendor']>;
}

/** Group orders by a readable date label (Today / Yesterday / or "Mon 3 Mar"). */
function groupOrdersByDate(orders: OrderWithDetails[]) {
  const groups: { title: string; data: OrderWithDetails[] }[] = [];
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  for (const order of orders) {
    const orderDate = new Date(order.createdAt);
    const dateStr = orderDate.toDateString();
    let label: string;

    if (dateStr === todayStr) {
      label = 'Today';
    } else if (dateStr === yesterdayStr) {
      label = 'Yesterday';
    } else {
      label = orderDate.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }

    const existingGroup = groups.find((g) => g.title === label);
    if (existingGroup) {
      existingGroup.data.push(order);
    } else {
      groups.push({ title: label, data: [order] });
    }
  }

  return groups;
}

/** Items summary, e.g. "Biryani x2, Naan x1" */
function itemsSummary(items: Order['items'], max = 3): string {
  const visible = items.slice(0, max);
  const parts = visible.map(
    (item) => `${item.mealName}${item.quantity > 1 ? ` x${item.quantity}` : ''}`
  );
  const remaining = items.length - max;
  if (remaining > 0) {
    parts.push(`+${remaining} more`);
  }
  return parts.join(', ');
}

// -----------------------------------------------------------------------
// Filter tabs
// -----------------------------------------------------------------------

type FilterKey = 'all' | 'active' | 'completed' | 'cancelled';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready'];
const COMPLETED_STATUSES: OrderStatus[] = ['collected', 'delivered'];

// -----------------------------------------------------------------------
// Order card
// -----------------------------------------------------------------------

function OrderCard({
  order,
  index,
}: {
  order: OrderWithDetails;
  index: number;
}) {
  const handlePress = () => {
    router.push(`/order/${order.id}`);
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Card onPress={handlePress} style={styles.orderCard}>
        {/* Header row: vendor name + status badge */}
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <View style={styles.vendorAvatar}>
              <Text style={styles.vendorAvatarText}>
                {order.vendor?.businessName?.charAt(0) || '?'}
              </Text>
            </View>
            <View style={styles.vendorInfo}>
              <Text style={styles.vendorName} numberOfLines={1}>
                {order.vendor?.businessName || 'Vendor'}
              </Text>
              <Text style={styles.orderDate}>
                {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
              </Text>
            </View>
          </View>
          <StatusBadge status={order.status} size="sm" />
        </View>

        {/* Items summary */}
        <Text style={styles.itemsSummary} numberOfLines={1}>
          {itemsSummary(order.items)}
        </Text>

        {/* Footer: total + fulfilment type */}
        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>
            {'\u00A3'}{order.total.toFixed(2)}
          </Text>
          <Text style={styles.fulfilmentType}>
            {order.fulfilmentType === 'collection' ? 'Collection' : 'Delivery'}
          </Text>
        </View>
      </Card>
    </Animated.View>
  );
}

// -----------------------------------------------------------------------
// Main screen
// -----------------------------------------------------------------------

export default function OrderHistoryScreen() {
  const { orders, isLoading, error, refetch } = useOrders();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filteredOrders = useMemo(() => {
    switch (filter) {
      case 'active':
        return orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
      case 'completed':
        return orders.filter((o) => COMPLETED_STATUSES.includes(o.status));
      case 'cancelled':
        return orders.filter((o) => o.status === 'cancelled');
      default:
        return orders;
    }
  }, [orders, filter]);

  const groupedOrders = useMemo(
    () => groupOrdersByDate(filteredOrders as OrderWithDetails[]),
    [filteredOrders]
  );

  // Flatten groups into a list with section headers for FlatList
  const flatData = useMemo(() => {
    const items: ({ type: 'header'; title: string } | { type: 'order'; order: OrderWithDetails; index: number })[] = [];
    let orderIndex = 0;
    for (const group of groupedOrders) {
      items.push({ type: 'header', title: group.title });
      for (const order of group.data) {
        items.push({ type: 'order', order, index: orderIndex });
        orderIndex++;
      }
    }
    return items;
  }, [groupedOrders]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const renderItem = useCallback(
    ({ item }: { item: (typeof flatData)[number] }) => {
      if (item.type === 'header') {
        return (
          <Text style={styles.sectionHeader}>{item.title}</Text>
        );
      }
      return <OrderCard order={item.order} index={item.index} />;
    },
    []
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>
          {filter === 'all' ? '🛒' : filter === 'active' ? '⏳' : filter === 'cancelled' ? '❌' : '✅'}
        </Text>
        <Text style={styles.emptyTitle}>
          {filter === 'all'
            ? 'No orders yet'
            : filter === 'active'
            ? 'No active orders'
            : filter === 'cancelled'
            ? 'No cancelled orders'
            : 'No completed orders'}
        </Text>
        <Text style={styles.emptyText}>
          {filter === 'all'
            ? 'Your order history will appear here once you place your first order.'
            : `You don\u2019t have any ${filter} orders at the moment.`}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'My Orders',
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: {
            fontFamily: fonts.bodySemiBold,
            fontSize: fontSizes.lg,
            color: colors.textPrimary,
          },
        }}
      />

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  isActive && styles.filterTabTextActive,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Error state */}
      {error && !isLoading && (
        <ErrorState
          title="Couldn't load orders"
          message="Please check your connection and try again."
          onRetry={refetch}
        />
      )}

      {/* Loading skeleton */}
      {isLoading && !refreshing && (
        <View style={styles.skeletonContainer}>
          <OrderListSkeleton count={4} />
        </View>
      )}

      {/* Order list */}
      {!isLoading && !error && (
        <FlatList
          data={flatData}
          renderItem={renderItem}
          keyExtractor={(item) =>
            item.type === 'header' ? `header-${item.title}` : item.order.id
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

// -----------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
    flexGrow: 1,
  },
  skeletonContainer: {
    flex: 1,
    paddingTop: spacing.lg,
  },

  // Filter tabs
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: colors.backgroundWhite,
  },

  // Section headers
  sectionHeader: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  // Order card
  orderCard: {
    marginBottom: spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  vendorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  vendorAvatarText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.backgroundWhite,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  orderDate: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Items summary
  itemsSummary: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.md,
    lineHeight: 20,
  },

  // Footer
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  orderTotal: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
  fulfilmentType: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textLight,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
    paddingTop: spacing['4xl'],
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
