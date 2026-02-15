import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';
import type { Order, OrderStatus } from '@/types';

interface OrderTrackingProps {
  order: Order;
}

const STEPS: { status: OrderStatus; label: string; emoji: string }[] = [
  { status: 'confirmed', label: 'Order Confirmed', emoji: '✓' },
  { status: 'preparing', label: 'Preparing', emoji: '👨‍🍳' },
  { status: 'ready', label: 'Ready', emoji: '🔔' },
  { status: 'collected', label: 'Collected', emoji: '🎉' },
];

const DELIVERY_STEPS: { status: OrderStatus; label: string; emoji: string }[] = [
  { status: 'confirmed', label: 'Order Confirmed', emoji: '✓' },
  { status: 'preparing', label: 'Preparing', emoji: '👨‍🍳' },
  { status: 'ready', label: 'Out for Delivery', emoji: '🚗' },
  { status: 'delivered', label: 'Delivered', emoji: '🎉' },
];

export function OrderTracking({ order }: OrderTrackingProps) {
  const steps = order.fulfilmentType === 'delivery' ? DELIVERY_STEPS : STEPS;

  const getCurrentStepIndex = () => {
    const index = steps.findIndex((step) => step.status === order.status);
    return index === -1 ? 0 : index;
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Order Status</Text>

      <View style={styles.timeline}>
        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <View key={step.status} style={styles.stepContainer}>
              <View style={styles.stepLeft}>
                <View
                  style={[
                    styles.dot,
                    isCompleted && styles.dotCompleted,
                    isCurrent && styles.dotCurrent,
                  ]}
                >
                  {isCompleted && (
                    <Text style={styles.dotEmoji}>{step.emoji}</Text>
                  )}
                </View>
                {index < steps.length - 1 && (
                  <View
                    style={[
                      styles.line,
                      index < currentIndex && styles.lineCompleted,
                    ]}
                  />
                )}
              </View>

              <View style={styles.stepContent}>
                <Text
                  style={[
                    styles.stepLabel,
                    isCompleted && styles.stepLabelCompleted,
                    isCurrent && styles.stepLabelCurrent,
                  ]}
                >
                  {step.label}
                </Text>
                {isCurrent && order.status === 'preparing' && (
                  <Text style={styles.stepHint}>
                    Your order is being prepared
                  </Text>
                )}
                {isCurrent && order.status === 'ready' && (
                  <Text style={styles.stepHint}>
                    {order.fulfilmentType === 'delivery'
                      ? 'Your order is on its way!'
                      : 'Your order is ready for collection'}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {order.collectionTime && order.fulfilmentType === 'collection' && (
        <View style={styles.collectionInfo}>
          <Text style={styles.collectionLabel}>Collection Time</Text>
          <Text style={styles.collectionTime}>
            {new Date(order.collectionTime).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  timeline: {
    gap: spacing.xs,
  },
  stepContainer: {
    flexDirection: 'row',
    minHeight: 60,
  },
  stepLeft: {
    width: 40,
    alignItems: 'center',
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.grey200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCompleted: {
    backgroundColor: colors.successPale,
  },
  dotCurrent: {
    backgroundColor: colors.primary,
  },
  dotEmoji: {
    fontSize: 14,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.grey200,
    marginVertical: spacing.xs,
  },
  lineCompleted: {
    backgroundColor: colors.success,
  },
  stepContent: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingTop: spacing.xs,
  },
  stepLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.grey400,
  },
  stepLabelCompleted: {
    color: colors.textPrimary,
  },
  stepLabelCurrent: {
    fontFamily: fonts.bodySemiBold,
    color: colors.primary,
  },
  stepHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  collectionInfo: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.accentPale,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  collectionLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  collectionTime: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xl,
    color: colors.primary,
    marginTop: spacing.xs,
  },
});

export default OrderTracking;
