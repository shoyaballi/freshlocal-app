import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  withRepeat,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';
import type { OrderStatus, FulfilmentType } from '@/types';

interface TimelineStep {
  status: OrderStatus;
  label: string;
  emoji: string;
}

interface AnimatedTimelineProps {
  currentStatus: OrderStatus;
  fulfilmentType: FulfilmentType;
  collectionTime?: string;
}

const COLLECTION_STEPS: TimelineStep[] = [
  { status: 'confirmed', label: 'Order Confirmed', emoji: '✓' },
  { status: 'preparing', label: 'Preparing', emoji: '👨‍🍳' },
  { status: 'ready', label: 'Ready for Collection', emoji: '🔔' },
  { status: 'collected', label: 'Collected', emoji: '🎉' },
];

const DELIVERY_STEPS: TimelineStep[] = [
  { status: 'confirmed', label: 'Order Confirmed', emoji: '✓' },
  { status: 'preparing', label: 'Preparing', emoji: '👨‍🍳' },
  { status: 'ready', label: 'Out for Delivery', emoji: '🚗' },
  { status: 'delivered', label: 'Delivered', emoji: '🎉' },
];

interface AnimatedStepProps {
  step: TimelineStep;
  index: number;
  isCompleted: boolean;
  isCurrent: boolean;
  isLast: boolean;
}

function getStatusHint(status: OrderStatus, fulfilmentType: FulfilmentType): string {
  switch (status) {
    case 'confirmed':
      return 'Your order has been confirmed by the vendor';
    case 'preparing':
      return 'Your order is being prepared with care';
    case 'ready':
      return fulfilmentType === 'delivery'
        ? 'Your order is on its way!'
        : 'Your order is ready for collection';
    case 'collected':
    case 'delivered':
      return 'Enjoy your meal!';
    default:
      return '';
  }
}

function AnimatedStep({
  step,
  index,
  isCompleted,
  isCurrent,
  isLast,
}: AnimatedStepProps) {
  const dotScale = useSharedValue(0.8);
  const pulseScale = useSharedValue(1);
  const lineHeight = useSharedValue(0);

  useEffect(() => {
    if (isCurrent) {
      // Entrance animation
      dotScale.value = withSpring(1, { damping: 8, stiffness: 100 });

      // Pulse animation for current step
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        false
      );
    } else if (isCompleted) {
      dotScale.value = withSpring(1, { damping: 12 });
      lineHeight.value = withDelay(index * 100, withTiming(1, { duration: 400 }));
    } else {
      dotScale.value = 0.8;
    }
  }, [isCompleted, isCurrent, index, dotScale, pulseScale, lineHeight]);

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value * pulseScale.value }],
    backgroundColor: isCurrent
      ? colors.primary
      : isCompleted
      ? colors.successPale
      : colors.grey200,
  }));

  const lineAnimatedStyle = useAnimatedStyle(() => ({
    height: `${lineHeight.value * 100}%`,
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 100).springify()}
      style={styles.stepContainer}
    >
      <View style={styles.stepLeft}>
        <Animated.View style={[styles.dot, dotAnimatedStyle]}>
          {(isCompleted || isCurrent) && (
            <Animated.Text entering={FadeIn.delay(150)} style={styles.dotEmoji}>
              {step.emoji}
            </Animated.Text>
          )}
        </Animated.View>

        {!isLast && (
          <View style={styles.lineContainer}>
            <View style={styles.lineBackground} />
            {isCompleted && (
              <Animated.View style={[styles.lineFill, lineAnimatedStyle]} />
            )}
          </View>
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
      </View>
    </Animated.View>
  );
}

export function AnimatedTimeline({
  currentStatus,
  fulfilmentType,
  collectionTime,
}: AnimatedTimelineProps) {
  const steps =
    fulfilmentType === 'delivery' || fulfilmentType === 'both'
      ? DELIVERY_STEPS
      : COLLECTION_STEPS;

  const getCurrentStepIndex = () => {
    const index = steps.findIndex((step) => step.status === currentStatus);
    return index === -1 ? 0 : index;
  };

  const currentIndex = getCurrentStepIndex();
  const hint = getStatusHint(currentStatus, fulfilmentType);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Status</Text>

      <View style={styles.timeline}>
        {steps.map((step, index) => (
          <AnimatedStep
            key={step.status}
            step={step}
            index={index}
            isCompleted={index < currentIndex}
            isCurrent={index === currentIndex}
            isLast={index === steps.length - 1}
          />
        ))}
      </View>

      {hint && (
        <Animated.View entering={FadeInUp.delay(400)} style={styles.hintContainer}>
          <Text style={styles.hintText}>{hint}</Text>
        </Animated.View>
      )}

      {collectionTime && fulfilmentType === 'collection' && (
        <Animated.View entering={FadeInUp.delay(500)} style={styles.collectionInfo}>
          <Text style={styles.collectionLabel}>Collection Time</Text>
          <Text style={styles.collectionTime}>
            {new Date(collectionTime).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
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
    width: 44,
    alignItems: 'center',
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  dotEmoji: {
    fontSize: 16,
  },
  lineContainer: {
    flex: 1,
    width: 3,
    marginVertical: spacing.xs,
    position: 'relative',
  },
  lineBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.grey200,
    borderRadius: 1.5,
  },
  lineFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.success,
    borderRadius: 1.5,
  },
  stepContent: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingTop: spacing.sm,
    justifyContent: 'center',
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
  hintContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  hintText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
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

export default AnimatedTimeline;
