import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, StatusBadge, Button } from '@/components/ui';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';
import type { Order } from '@/types';

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
  onMarkReady?: () => void;
  showActions?: boolean;
  isVendorView?: boolean;
}

export function OrderCard({
  order,
  onPress,
  onMarkReady,
  showActions = false,
  isVendorView = false,
}: OrderCardProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
          <Text style={styles.orderTime}>
            {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
          </Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      <View style={styles.items}>
        {order.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemQuantity}>{item.quantity}x</Text>
            <Text style={styles.itemName}>{item.mealName}</Text>
            <Text style={styles.itemPrice}>£{item.totalPrice.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>£{order.total.toFixed(2)}</Text>
        </View>

        <View style={styles.fulfilmentRow}>
          <Text style={styles.fulfilmentText}>
            {order.fulfilmentType === 'collection'
              ? `📍 Collection ${order.collectionTime ? `at ${formatTime(order.collectionTime)}` : ''}`
              : `🚗 Delivery`}
          </Text>
        </View>

        {showActions && isVendorView && order.status === 'preparing' && (
          <Button
            size="sm"
            onPress={onMarkReady}
            style={styles.actionButton}
          >
            Mark Ready
          </Button>
        )}
      </View>
    </Card>
  );
}

interface OrderCardCompactProps {
  order: Order;
  onPress?: () => void;
}

export function OrderCardCompact({ order, onPress }: OrderCardCompactProps) {
  return (
    <Card style={styles.compactCard} onPress={onPress} padding="md">
      <View style={styles.compactHeader}>
        <Text style={styles.compactVendor}>
          {order.vendor?.businessName || 'Vendor'}
        </Text>
        <StatusBadge status={order.status} size="sm" />
      </View>
      <Text style={styles.compactItems}>
        {order.items.length} item{order.items.length !== 1 ? 's' : ''} • £
        {order.total.toFixed(2)}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  orderInfo: {
    flex: 1,
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
    marginTop: spacing.xs,
  },
  items: {
    gap: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemQuantity: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.primary,
    width: 30,
  },
  itemName: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  itemPrice: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  footer: {
    gap: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  totalAmount: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.primary,
  },
  fulfilmentRow: {
    marginTop: spacing.xs,
  },
  fulfilmentText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  actionButton: {
    marginTop: spacing.sm,
  },

  // Compact styles
  compactCard: {
    marginBottom: spacing.sm,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  compactVendor: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  compactItems: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
});

export default OrderCard;
