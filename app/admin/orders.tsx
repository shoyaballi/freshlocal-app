import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Header } from '@/components/layout';
import { Card, StatusBadge, Button, ErrorState } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrderRow {
  id: string;
  user_id: string;
  vendor_id: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  customer_name: string;
  vendor_name: string;
  stripe_payment_intent_id: string | null;
  refund_reason: string | null;
  refunded_at: string | null;
}

type FilterStatus =
  | 'all'
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

const FILTER_OPTIONS: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Preparing', value: 'preparing' },
  { label: 'Ready', value: 'ready' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format pence amount to currency string (amounts stored in pence in DB) */
function formatPence(pence: number): string {
  return `\u00A3${(pence / 100).toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shortId(id: string): string {
  return id.slice(-8).toUpperCase();
}

function canRefund(order: OrderRow): boolean {
  return (
    order.payment_status === 'paid' &&
    order.status !== 'cancelled' &&
    !!order.stripe_payment_intent_id
  );
}

function isRefunded(order: OrderRow): boolean {
  return order.payment_status === 'refunded';
}

// ---------------------------------------------------------------------------
// Refund Confirmation Modal
// ---------------------------------------------------------------------------

interface RefundModalProps {
  visible: boolean;
  order: OrderRow | null;
  onClose: () => void;
  onConfirm: (orderId: string, reason: string) => void;
  isProcessing: boolean;
}

function RefundModal({
  visible,
  order,
  onClose,
  onConfirm,
  isProcessing,
}: RefundModalProps) {
  const [reason, setReason] = useState('');

  // Reset reason when modal opens with a new order
  useEffect(() => {
    if (visible) setReason('');
  }, [visible]);

  if (!order) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={() => {}}>
          <Text style={styles.modalTitle}>Confirm Refund</Text>

          <View style={styles.modalDivider} />

          <View style={styles.modalOrderInfo}>
            <View style={styles.modalInfoRow}>
              <Text style={styles.modalInfoLabel}>Order</Text>
              <Text style={styles.modalInfoValue}>#{shortId(order.id)}</Text>
            </View>
            <View style={styles.modalInfoRow}>
              <Text style={styles.modalInfoLabel}>Customer</Text>
              <Text style={styles.modalInfoValue}>{order.customer_name}</Text>
            </View>
            <View style={styles.modalInfoRow}>
              <Text style={styles.modalInfoLabel}>Vendor</Text>
              <Text style={styles.modalInfoValue}>{order.vendor_name}</Text>
            </View>
            <View style={styles.modalInfoRow}>
              <Text style={styles.modalInfoLabel}>Refund Amount</Text>
              <Text style={styles.modalRefundAmount}>
                {formatPence(order.total)}
              </Text>
            </View>
          </View>

          <View style={styles.modalDivider} />

          <Text style={styles.modalFieldLabel}>Reason (optional)</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="e.g. Customer complaint, wrong order..."
            placeholderTextColor={colors.textLight}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!isProcessing}
          />

          <Text style={styles.modalWarning}>
            This will issue a full refund via Stripe and cancel the order. This
            action cannot be undone.
          </Text>

          <View style={styles.modalActions}>
            <Button
              variant="outline"
              size="md"
              onPress={onClose}
              disabled={isProcessing}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onPress={() => onConfirm(order.id, reason)}
              loading={isProcessing}
              disabled={isProcessing}
              style={styles.refundConfirmButton}
            >
              Refund {formatPence(order.total)}
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Order Management Screen
// ---------------------------------------------------------------------------

export default function OrderManagementScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Refund modal state
  const [refundOrder, setRefundOrder] = useState<OrderRow | null>(null);
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          vendor_id,
          status,
          payment_status,
          total,
          created_at,
          stripe_payment_intent_id,
          refund_reason,
          refunded_at,
          profiles!orders_user_id_fkey ( name ),
          vendors!orders_vendor_id_fkey ( business_name )
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (fetchErr) throw fetchErr;

      const mapped: OrderRow[] = (data ?? []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        vendor_id: row.vendor_id,
        status: row.status,
        payment_status: row.payment_status || 'pending',
        total: row.total || 0,
        created_at: row.created_at,
        customer_name: row.profiles?.name || 'Unknown Customer',
        vendor_name: row.vendors?.business_name || 'Unknown Vendor',
        stripe_payment_intent_id: row.stripe_payment_intent_id,
        refund_reason: row.refund_reason,
        refunded_at: row.refunded_at,
      }));

      setOrders(mapped);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders =
    filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  // -----------------------------------
  // Refund handlers
  // -----------------------------------

  const openRefundModal = useCallback((order: OrderRow) => {
    setRefundOrder(order);
    setRefundModalVisible(true);
  }, []);

  const closeRefundModal = useCallback(() => {
    if (!isRefunding) {
      setRefundModalVisible(false);
      setRefundOrder(null);
    }
  }, [isRefunding]);

  const handleRefund = useCallback(
    async (orderId: string, reason: string) => {
      setIsRefunding(true);

      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          'stripe-refund',
          {
            body: { orderId, reason: reason || undefined },
          }
        );

        if (fnError) throw new Error(fnError.message);

        if (data?.error) {
          throw new Error(data.error);
        }

        // Update the local order state so the UI reflects the refund immediately
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  payment_status: 'refunded',
                  status: 'cancelled',
                  refund_reason: reason || null,
                  refunded_at: new Date().toISOString(),
                }
              : o
          )
        );

        setRefundModalVisible(false);
        setRefundOrder(null);

        // Show success feedback
        if (Platform.OS === 'web') {
          window.alert('Refund processed successfully.');
        } else {
          Alert.alert('Refund Processed', 'The refund has been issued successfully.');
        }
      } catch (err: any) {
        const message = err.message || 'Failed to process refund';
        if (Platform.OS === 'web') {
          window.alert(`Refund failed: ${message}`);
        } else {
          Alert.alert('Refund Failed', message);
        }
      } finally {
        setIsRefunding(false);
      }
    },
    []
  );

  // -----------------------------------
  // Expand/collapse order detail
  // -----------------------------------

  const toggleExpand = useCallback((orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  }, []);

  // -----------------------------------
  // Render
  // -----------------------------------

  const renderOrderItem = useCallback(
    ({ item }: { item: OrderRow }) => {
      const isExpanded = expandedOrderId === item.id;
      const refundable = canRefund(item);
      const refunded = isRefunded(item);

      return (
        <Pressable onPress={() => toggleExpand(item.id)}>
          <Card style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View style={styles.orderIdSection}>
                <Text style={styles.orderId}>#{shortId(item.id)}</Text>
                <Text style={styles.orderDate}>
                  {formatDate(item.created_at)}
                </Text>
              </View>
              <View style={styles.badgeRow}>
                <StatusBadge status={item.status} />
                {refunded && (
                  <View style={styles.refundedBadge}>
                    <Text style={styles.refundedBadgeText}>Refunded</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.orderDetails}>
              <View style={styles.orderDetailRow}>
                <Text style={styles.orderDetailLabel}>Customer</Text>
                <Text style={styles.orderDetailValue}>
                  {item.customer_name}
                </Text>
              </View>
              <View style={styles.orderDetailRow}>
                <Text style={styles.orderDetailLabel}>Vendor</Text>
                <Text style={styles.orderDetailValue}>
                  {item.vendor_name}
                </Text>
              </View>
              <View style={styles.orderDetailRow}>
                <Text style={styles.orderDetailLabel}>Payment</Text>
                <Text
                  style={[
                    styles.orderDetailValue,
                    item.payment_status === 'paid' && styles.paymentPaid,
                    item.payment_status === 'refunded' && styles.paymentRefunded,
                    item.payment_status === 'failed' && styles.paymentFailed,
                  ]}
                >
                  {item.payment_status.charAt(0).toUpperCase() +
                    item.payment_status.slice(1)}
                </Text>
              </View>
            </View>

            {/* Expanded section */}
            {isExpanded && (
              <View style={styles.expandedSection}>
                <View style={styles.expandedDivider} />

                {item.refund_reason ? (
                  <View style={styles.refundInfoSection}>
                    <Text style={styles.refundInfoLabel}>Refund Reason</Text>
                    <Text style={styles.refundInfoValue}>
                      {item.refund_reason}
                    </Text>
                  </View>
                ) : null}

                {item.refunded_at ? (
                  <View style={styles.refundInfoSection}>
                    <Text style={styles.refundInfoLabel}>Refunded At</Text>
                    <Text style={styles.refundInfoValue}>
                      {formatDate(item.refunded_at)}
                    </Text>
                  </View>
                ) : null}

                {item.stripe_payment_intent_id ? (
                  <View style={styles.refundInfoSection}>
                    <Text style={styles.refundInfoLabel}>Payment Intent</Text>
                    <Text
                      style={[styles.refundInfoValue, styles.monoText]}
                      numberOfLines={1}
                    >
                      {item.stripe_payment_intent_id}
                    </Text>
                  </View>
                ) : null}

                {/* Refund button */}
                {refundable && (
                  <Button
                    variant="primary"
                    size="sm"
                    onPress={() => openRefundModal(item)}
                    style={styles.refundButton}
                    textStyle={styles.refundButtonText}
                  >
                    Refund {formatPence(item.total)}
                  </Button>
                )}

                {refunded && (
                  <View style={styles.refundedNotice}>
                    <Text style={styles.refundedNoticeText}>
                      This order has been refunded
                    </Text>
                  </View>
                )}

                {!refundable && !refunded && (
                  <View style={styles.refundedNotice}>
                    <Text style={styles.cannotRefundText}>
                      {!item.stripe_payment_intent_id
                        ? 'No payment intent on record'
                        : item.payment_status === 'pending'
                        ? 'Payment not yet completed'
                        : `Payment status: ${item.payment_status}`}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.orderFooter}>
              <Text style={styles.expandHint}>
                {isExpanded ? 'Tap to collapse' : 'Tap for details'}
              </Text>
              <Text style={styles.orderTotal}>
                {formatPence(item.total)}
              </Text>
            </View>
          </Card>
        </Pressable>
      );
    },
    [expandedOrderId, toggleExpand, openRefundModal]
  );

  const keyExtractor = useCallback((item: OrderRow) => item.id, []);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header
          title="Order Management"
          leftIcon={<Text style={styles.backArrow}>{'<'}</Text>}
          onLeftPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header
          title="Order Management"
          leftIcon={<Text style={styles.backArrow}>{'<'}</Text>}
          onLeftPress={() => router.back()}
        />
        <ErrorState
          emoji="📋"
          title="Failed to load orders"
          message={error}
          onRetry={fetchOrders}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Order Management"
        subtitle={`${orders.length} total orders`}
        leftIcon={<Text style={styles.backArrow}>{'<'}</Text>}
        onLeftPress={() => router.back()}
      />

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {FILTER_OPTIONS.map((opt) => {
          const isActive = filter === opt.value;
          const count =
            opt.value === 'all'
              ? orders.length
              : orders.filter((o) => o.status === opt.value).length;

          return (
            <Pressable
              key={opt.value}
              onPress={() => setFilter(opt.value)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {opt.label} ({count})
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>No orders found</Text>
          <Text style={styles.emptyText}>
            {filter === 'all'
              ? 'No orders have been placed yet.'
              : `No ${filter} orders at the moment.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          extraData={expandedOrderId}
        />
      )}

      {/* Refund Confirmation Modal */}
      <RefundModal
        visible={refundModalVisible}
        order={refundOrder}
        onClose={closeRefundModal}
        onConfirm={handleRefund}
        isProcessing={isRefunding}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    fontFamily: fonts.bodySemiBold,
  },

  // Filters
  filterContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#fffdf9',
  },

  // List
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },

  // Order Card
  orderCard: {
    marginBottom: spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  orderIdSection: {
    flex: 1,
  },
  orderId: {
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  refundedBadge: {
    backgroundColor: '#fee2e2',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  refundedBadgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.error,
  },
  orderDetails: {
    marginBottom: spacing.md,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  orderDetailLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  orderDetailValue: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.md,
  },
  paymentPaid: {
    color: colors.success,
  },
  paymentRefunded: {
    color: colors.error,
  },
  paymentFailed: {
    color: colors.error,
  },

  // Expanded section
  expandedSection: {
    marginBottom: spacing.md,
  },
  expandedDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  refundInfoSection: {
    marginBottom: spacing.sm,
  },
  refundInfoLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  refundInfoValue: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  monoText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  refundButton: {
    backgroundColor: colors.error,
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  refundButtonText: {
    color: '#ffffff',
  },
  refundedNotice: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.grey100,
    borderRadius: borderRadius.sm,
  },
  refundedNoticeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.error,
  },
  cannotRefundText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },

  // Footer
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  expandHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textLight,
  },
  orderTotal: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.primary,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
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
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    width: '100%',
    maxWidth: 420,
  },
  modalTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  modalDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  modalOrderInfo: {
    gap: spacing.sm,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalInfoLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  modalInfoValue: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  modalRefundAmount: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.error,
  },
  modalFieldLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    minHeight: 80,
    marginBottom: spacing.md,
  },
  modalWarning: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.error,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
  refundConfirmButton: {
    flex: 1,
    backgroundColor: '#c45e5e',
  },
});
