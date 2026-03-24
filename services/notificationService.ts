import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import type { OrderStatus, NotificationPayload } from '@/types';

// Conditionally import native notification modules
let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;

if (Platform.OS !== 'web') {
  Notifications = require('expo-notifications');
  Device = require('expo-device');

  // Configure notification behavior (native only)
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// Status-specific notification messages
const STATUS_MESSAGES: Record<OrderStatus, { title: string; body: string }> = {
  pending: {
    title: 'Order Received',
    body: 'Your order has been received and is awaiting confirmation.',
  },
  confirmed: {
    title: 'Order Confirmed! ✓',
    body: 'The vendor has confirmed your order.',
  },
  preparing: {
    title: 'Now Preparing 👨‍🍳',
    body: 'Your order is being prepared with care.',
  },
  ready: {
    title: 'Order Ready! 🔔',
    body: 'Your order is ready for collection!',
  },
  collected: {
    title: 'Collected 🎉',
    body: 'You have collected your order. Enjoy!',
  },
  delivered: {
    title: 'Delivered 🎉',
    body: 'Your order has been delivered. Enjoy!',
  },
  cancelled: {
    title: 'Order Cancelled',
    body: 'Your order has been cancelled.',
  },
};

class NotificationService {
  private expoPushToken: string | null = null;

  async initialize(): Promise<string | null> {
    // Push notifications not supported on web
    if (Platform.OS === 'web' || !Notifications || !Device) {
      return null;
    }

    if (!Device.isDevice) {
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    try {
      // Get Expo push token — projectId is required for Expo Go
      const Constants = require('expo-constants').default;
      const projectId = Constants.expoConfig?.extra?.eas?.projectId
        ?? Constants.expoConfig?.extra?.projectId;

      if (!projectId) {
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = tokenData.data;

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('orders', {
          name: 'Order Updates',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3d4a2a',
          sound: 'default',
        });
      }

      return this.expoPushToken;
    } catch {
      return null;
    }
  }

  async savePushToken(userId: string): Promise<void> {
    if (!this.expoPushToken) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        push_token: this.expoPushToken,
        push_token_updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      // Push token save failed — non-critical
    }
  }

  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    if (!Notifications) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        sound: 'default',
      },
      trigger: null, // Immediate
    });
  }

  async showOrderStatusNotification(
    status: OrderStatus,
    orderId: string,
    vendorName?: string
  ): Promise<void> {
    const message = STATUS_MESSAGES[status];
    if (!message) return;

    const body = vendorName ? `${vendorName}: ${message.body}` : message.body;

    await this.showLocalNotification({
      title: message.title,
      body,
      data: {
        type: 'order_update',
        orderId,
        screen: `/order/${orderId}`,
      },
    });
  }

  getToken(): string | null {
    return this.expoPushToken;
  }

  // Add notification listeners
  addNotificationReceivedListener(
    callback: (notification: any) => void
  ) {
    if (!Notifications) return { remove: () => {} };
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseListener(
    callback: (response: any) => void
  ) {
    if (!Notifications) return { remove: () => {} };
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  async getBadgeCount(): Promise<number> {
    if (!Notifications) return 0;
    return await Notifications.getBadgeCountAsync();
  }

  async setBadgeCount(count: number): Promise<void> {
    if (!Notifications) return;
    await Notifications.setBadgeCountAsync(count);
  }
}

export const notificationService = new NotificationService();
export default notificationService;
