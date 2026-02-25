import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Linking,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Card, Button } from '@/components/ui';
import { AnimatedTimeline } from '@/components/orders/AnimatedTimeline';
import { useOrderSubscription } from '@/hooks/useOrderSubscription';
import { supabase } from '@/lib/supabase';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '@/constants/theme';
import type { OrderStatus } from '@/types';

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Real-time subscription with built-in order fetching
  const { isConnected, order, isLoading } = useOrderSubscription({
    orderId: id || null,
    onStatusChange: (updatedOrder, previousStatus) => {
      // Could add haptic feedback here
      console.log(`Order status changed: ${previousStatus} → ${updatedOrder.status}`);
    },
    showNotifications: true,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelOrder = useCallback(() => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This cannot be undone.',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsCancelling(true);
              const { error: cancelError } = await supabase
                .from('orders')
                .update({ status: 'cancelled' })
                .eq('id', id)
                .eq('status', 'pending');

              if (cancelError) {
                Alert.alert('Error', 'Failed to cancel order. Please try again.');
              }
            } catch {
              Alert.alert('Error', 'Something went wrong. Please try again.');
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  }, [id]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // The subscription will automatically update, just simulate refresh
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  const handleCallVendor = useCallback(() => {
    if (order?.vendor?.phone) {
      Linking.openURL(`tel:${order.vendor.phone}`);
    }
  }, [order?.vendor?.phone]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Order Tracking',
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { fontFamily: fonts.bodySemiBold },
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading order...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Order Tracking',
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { fontFamily: fonts.bodySemiBold },
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorTitle}>Order Not Found</Text>
          <Text style={styles.errorText}>Unable to load order details</Text>
          <Button onPress={() => router.back()} style={styles.errorButton}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const isActiveOrder = !['collected', 'delivered', 'cancelled'].includes(order.status);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Order Tracking',
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { fontFamily: fonts.bodySemiBold },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Connection Status Indicator */}
        {isActiveOrder && (
          <Animated.View entering={FadeIn} style={styles.connectionBadge}>
            <View
              style={[
                styles.connectionDot,
                { backgroundColor: isConnected ? colors.success : colors.accent },
              ]}
            />
            <Text style={styles.connectionText}>
              {isConnected ? 'Live updates' : 'Connecting...'}
            </Text>
          </Animated.View>
        )}

        {/* Animated Timeline */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <AnimatedTimeline
            currentStatus={order.status}
            fulfilmentType={order.fulfilmentType}
            collectionTime={order.collectionTime}
          />
        </Animated.View>

        {/* Vendor Info */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Card style={styles.vendorCard}>
            <View style={styles.vendorHeader}>
              <View style={styles.vendorAvatar}>
                <Text style={styles.vendorAvatarText}>
                  {order.vendor?.businessName?.charAt(0) || '?'}
                </Text>
              </View>
              <View style={styles.vendorInfo}>
                <Text style={styles.vendorName}>
                  {order.vendor?.businessName || 'Vendor'}
                </Text>
                <Text style={styles.vendorHandle}>
                  @{order.vendor?.handle || 'vendor'}
                </Text>
              </View>
            </View>

            {order.vendor?.phone && isActiveOrder && (
              <Button
                variant="outline"
                size="sm"
                onPress={handleCallVendor}
                style={styles.callButton}
              >
                📞 Call Vendor
              </Button>
            )}
          </Card>
        </Animated.View>

        {/* Order Details */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Card style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Order Details</Text>

            <View style={styles.orderMeta}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Order ID</Text>
                <Text style={styles.metaValue}>
                  #{order.id.slice(0, 8).toUpperCase()}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Placed</Text>
                <Text style={styles.metaValue}>
                  {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Type</Text>
                <Text style={styles.metaValue}>
                  {order.fulfilmentType === 'collection' ? '📍 Collection' : '🚗 Delivery'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Items */}
            <Text style={styles.itemsTitle}>Items</Text>
            {order.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                <Text style={styles.itemName}>{item.mealName}</Text>
                <Text style={styles.itemPrice}>£{item.totalPrice.toFixed(2)}</Text>
              </View>
            ))}

            <View style={styles.divider} />

            {/* Pricing */}
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Subtotal</Text>
              <Text style={styles.pricingValue}>£{order.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Service Fee</Text>
              <Text style={styles.pricingValue}>£{order.serviceFee.toFixed(2)}</Text>
            </View>
            {order.deliveryFee && (
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Delivery Fee</Text>
                <Text style={styles.pricingValue}>£{order.deliveryFee.toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.pricingRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>£{order.total.toFixed(2)}</Text>
            </View>
          </Card>
        </Animated.View>

        {/* Notes */}
        {order.notes && (
          <Animated.View entering={FadeInDown.delay(400)}>
            <Card style={styles.notesCard}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{order.notes}</Text>
            </Card>
          </Animated.View>
        )}

        {/* Cancel Order Button - only for pending orders */}
        {order.status === 'pending' && (
          <Animated.View entering={FadeInDown.delay(500)}>
            <Button
              variant="outline"
              onPress={handleCancelOrder}
              loading={isCancelling}
              style={styles.cancelButton}
              textStyle={styles.cancelButtonText}
            >
              Cancel Order
            </Button>
          </Animated.View>
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  errorButton: {
    minWidth: 120,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.cardBackground,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  connectionText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  vendorCard: {
    marginTop: spacing.md,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  vendorAvatarText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
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
  vendorHandle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  callButton: {
    marginTop: spacing.md,
  },
  detailsCard: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  orderMeta: {
    gap: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  metaValue: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  itemsTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
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
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  pricingLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  pricingValue: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  totalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  totalValue: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.primary,
  },
  notesCard: {
    marginTop: spacing.md,
  },
  notesText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  cancelButton: {
    marginTop: spacing.xl,
    borderColor: colors.error,
  },
  cancelButtonText: {
    color: colors.error,
  },
});
