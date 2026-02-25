import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNotifications } from '@/hooks/useNotifications';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';
import type { Notification } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOTIFICATION_ICONS: Record<Notification['type'], string> = {
  order: '\u{1F4E6}',  // 📦
  promo: '\u{1F389}',  // 🎉
  system: '\u{1F514}', // 🔔
};

function formatTimeAgo(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffSeconds = Math.floor((now - date) / 1000);

  if (diffSeconds < 60) return 'just now';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w ago`;

  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

// ---------------------------------------------------------------------------
// NotificationItem
// ---------------------------------------------------------------------------

interface NotificationItemProps {
  notification: Notification;
  index: number;
  onPress: (notification: Notification) => void;
}

function NotificationItem({ notification, index, onPress }: NotificationItemProps) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300).springify()}>
      <Pressable
        onPress={() => onPress(notification)}
        style={({ pressed }) => [
          styles.notificationItem,
          !notification.isRead && styles.notificationItemUnread,
          pressed && styles.notificationItemPressed,
        ]}
      >
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            !notification.isRead && styles.iconContainerUnread,
          ]}
        >
          <Text style={styles.iconText}>
            {NOTIFICATION_ICONS[notification.type]}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text
              style={[
                styles.notificationTitle,
                !notification.isRead && styles.notificationTitleUnread,
              ]}
              numberOfLines={1}
            >
              {notification.title}
            </Text>
            <Text style={styles.notificationTime}>
              {formatTimeAgo(notification.createdAt)}
            </Text>
          </View>
          <Text style={styles.notificationBody} numberOfLines={2}>
            {notification.body}
          </Text>
        </View>

        {/* Unread dot */}
        {!notification.isRead && <View style={styles.unreadDot} />}
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      style={styles.emptyContainer}
    >
      <Text style={styles.emptyIcon}>{'\u{1F514}'}</Text>
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptyText}>
        When you receive order updates, promotions, or system messages they will
        appear here.
      </Text>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// NotificationsScreen
// ---------------------------------------------------------------------------

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch,
    isInitialized,
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleNotificationPress = useCallback(
    async (notification: Notification) => {
      // 1. Mark as read
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }

      // 2. Navigate based on data payload
      if (notification.data?.orderId) {
        router.push(`/order/${notification.data.orderId}` as any);
      } else if (notification.data?.screen) {
        router.push(notification.data.screen as any);
      }
    },
    [markAsRead, router],
  );

  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  // Loading state
  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Notifications',
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { fontFamily: fonts.bodySemiBold },
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notifications',
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { fontFamily: fonts.bodySemiBold },
          headerRight: () =>
            unreadCount > 0 ? (
              <Pressable
                onPress={handleMarkAllRead}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.markAllButton,
                  pressed && styles.markAllButtonPressed,
                ]}
              >
                <Text style={styles.markAllText}>Mark all read</Text>
              </Pressable>
            ) : null,
        }}
      />

      {notifications.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyScrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          <EmptyState />
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Unread count summary */}
          {unreadCount > 0 && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <View style={styles.summaryBar}>
                <View style={styles.summaryDot} />
                <Text style={styles.summaryText}>
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Notification list */}
          {notifications.map((notification, index) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              index={index}
              onPress={handleNotificationPress}
            />
          ))}
        </ScrollView>
      )}
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing['4xl'],
  },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
  },

  // Mark all read button
  markAllButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  markAllButtonPressed: {
    opacity: 0.6,
  },
  markAllText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },

  // Summary bar
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  summaryText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },

  // Notification item
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  notificationItemUnread: {
    backgroundColor: colors.primaryPale,
    borderColor: colors.border,
  },
  notificationItemPressed: {
    opacity: 0.7,
  },

  // Icon
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconContainerUnread: {
    backgroundColor: colors.backgroundWhite,
  },
  iconText: {
    fontSize: fontSizes.xl,
  },

  // Content
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  notificationTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  notificationTitleUnread: {
    fontFamily: fonts.bodySemiBold,
  },
  notificationTime: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textLight,
  },
  notificationBody: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Unread dot
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
