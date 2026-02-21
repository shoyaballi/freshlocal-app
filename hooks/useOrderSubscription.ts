import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { notificationService } from '@/services/notificationService';
import type { Order, OrderItem, OrderStatus, Vendor } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseOrderSubscriptionOptions {
  orderId: string | null;
  onStatusChange?: (order: Order, previousStatus: OrderStatus) => void;
  showNotifications?: boolean;
}

interface UseOrderSubscriptionResult {
  isConnected: boolean;
  order: Order | null;
  isLoading: boolean;
}

// Transform raw database order to application format
function transformOrder(raw: any): Order {
  return {
    id: raw.id,
    userId: raw.user_id,
    vendorId: raw.vendor_id,
    status: raw.status as OrderStatus,
    fulfilmentType: raw.fulfilment_type,
    items: (raw.items || []).map((item: any): OrderItem => ({
      id: item.id,
      orderId: item.order_id,
      mealId: item.meal_id,
      mealName: item.meal_name,
      quantity: item.quantity,
      unitPrice: item.unit_price / 100,
      totalPrice: item.total_price / 100,
    })),
    subtotal: raw.subtotal / 100,
    serviceFee: raw.service_fee / 100,
    deliveryFee: raw.delivery_fee ? raw.delivery_fee / 100 : undefined,
    total: raw.total / 100,
    collectionTime: raw.collection_time,
    deliveryAddress: raw.delivery_address
      ? typeof raw.delivery_address === 'string'
        ? raw.delivery_address
        : JSON.stringify(raw.delivery_address)
      : undefined,
    notes: raw.notes,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    vendor: raw.vendor
      ? {
          id: raw.vendor.id,
          userId: raw.vendor.user_id,
          businessName: raw.vendor.business_name,
          handle: raw.vendor.handle,
          description: '',
          businessType: 'home_kitchen',
          avatar: raw.vendor.avatar,
          tags: [],
          phone: raw.vendor.phone,
          postcode: raw.vendor.postcode,
          rating: parseFloat(raw.vendor.rating) || 0,
          reviewCount: 0,
          isVerified: false,
          isActive: true,
          createdAt: '',
          updatedAt: '',
        }
      : undefined,
  };
}

export function useOrderSubscription({
  orderId,
  onStatusChange,
  showNotifications = true,
}: UseOrderSubscriptionOptions): UseOrderSubscriptionResult {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const previousStatusRef = useRef<OrderStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch full order details
  const fetchOrderDetails = useCallback(async (id: string): Promise<Order | null> => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        vendor:vendors (id, user_id, business_name, handle, avatar, phone, postcode, rating),
        items:order_items (*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Failed to fetch order details:', error);
      return null;
    }

    return transformOrder(data);
  }, []);

  // Initial fetch
  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    const loadOrder = async () => {
      setIsLoading(true);
      const fetchedOrder = await fetchOrderDetails(orderId);
      if (fetchedOrder) {
        setOrder(fetchedOrder);
        previousStatusRef.current = fetchedOrder.status;
      }
      setIsLoading(false);
    };

    loadOrder();
  }, [orderId, fetchOrderDetails]);

  // Real-time subscription
  useEffect(() => {
    if (!orderId) return;

    // Create subscription channel
    const channel = supabase
      .channel(`customer-order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        async (payload) => {
          const newStatus = payload.new.status as OrderStatus;
          const previousStatus = previousStatusRef.current;

          // Fetch full order details
          const fullOrder = await fetchOrderDetails(orderId);

          if (fullOrder) {
            setOrder(fullOrder);

            // Only process if status actually changed
            if (previousStatus && newStatus !== previousStatus) {
              // Show local notification
              if (showNotifications) {
                await notificationService.showOrderStatusNotification(
                  newStatus,
                  orderId,
                  fullOrder.vendor?.businessName
                );
              }

              // Call status change callback
              if (onStatusChange) {
                onStatusChange(fullOrder, previousStatus);
              }
            }

            // Update previous status ref
            previousStatusRef.current = newStatus;
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
      }
    };
  }, [orderId, onStatusChange, showNotifications, fetchOrderDetails]);

  return { isConnected, order, isLoading };
}

export default useOrderSubscription;
