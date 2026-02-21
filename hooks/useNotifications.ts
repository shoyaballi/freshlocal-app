import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { notificationService } from '@/services/notificationService';
import { useAppStore } from '@/stores/appStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types';

interface UseNotificationsResult {
  isInitialized: boolean;
  hasPermission: boolean;
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const router = useRouter();
  const { user } = useAuth();
  const { setNotificationCount, setPushToken } = useAppStore();

  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Initialize notifications on mount
  useEffect(() => {
    const initialize = async () => {
      const token = await notificationService.initialize();
      setHasPermission(!!token);

      if (token) {
        setPushToken(token);
        if (user?.id) {
          await notificationService.savePushToken(user.id);
        }
      }

      setIsInitialized(true);
    };

    initialize();
  }, [user?.id, setPushToken]);

  // Handle notification responses (taps)
  useEffect(() => {
    const subscription = notificationService.addNotificationResponseListener(
      (response) => {
        const data = response.notification.request.content.data as {
          screen?: string;
          orderId?: string;
        };

        if (data?.screen) {
          router.push(data.screen as any);
        } else if (data?.orderId) {
          router.push(`/order/${data.orderId}` as any);
        }
      }
    );

    return () => subscription.remove();
  }, [router]);

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to fetch notifications:', error);
      return;
    }

    const transformed: Notification[] = (data || []).map((n: any) => ({
      id: n.id,
      userId: n.user_id,
      title: n.title,
      body: n.body,
      type: n.type,
      isRead: n.is_read,
      data: n.data,
      createdAt: n.created_at,
    }));

    setNotifications(transformed);

    const unreadCount = transformed.filter((n) => !n.isRead).length;
    setNotificationCount(unreadCount);
    await notificationService.setBadgeCount(unreadCount);
  }, [user?.id, setNotificationCount]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark single notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (!error) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        const newUnreadCount = notifications.filter(
          (n) => !n.isRead && n.id !== notificationId
        ).length;
        setNotificationCount(newUnreadCount);
        await notificationService.setBadgeCount(newUnreadCount);
      }
    },
    [notifications, setNotificationCount]
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setNotificationCount(0);
      await notificationService.setBadgeCount(0);
    }
  }, [user?.id, setNotificationCount]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    isInitialized,
    hasPermission,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}

export default useNotifications;
