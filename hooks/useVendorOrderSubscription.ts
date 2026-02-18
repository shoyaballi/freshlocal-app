import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Order, OrderItem, OrderStatus } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseVendorOrderSubscriptionOptions {
  vendorId: string | null;
  onNewOrder?: (order: Order) => void;
  onOrderUpdate?: (order: Order) => void;
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
    user: raw.user
      ? {
          id: raw.user.id,
          email: raw.user.email || '',
          name: raw.user.name || 'Customer',
          phone: raw.user.phone,
          isVendor: false,
          createdAt: raw.user.created_at,
          updatedAt: raw.user.updated_at || raw.user.created_at,
        }
      : undefined,
  };
}

export function useVendorOrderSubscription({
  vendorId,
  onNewOrder,
  onOrderUpdate,
}: UseVendorOrderSubscriptionOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch full order details
  const fetchOrderDetails = useCallback(async (orderId: string): Promise<Order | null> => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        user:profiles (id, name, phone, email),
        items:order_items (*)
      `)
      .eq('id', orderId)
      .single();

    if (error || !data) {
      console.error('Failed to fetch order details:', error);
      return null;
    }

    return transformOrder(data);
  }, []);

  useEffect(() => {
    if (!vendorId) return;

    // Create subscription channel
    const channel = supabase
      .channel(`vendor-orders-${vendorId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `vendor_id=eq.${vendorId}`,
        },
        async (payload) => {
          if (onNewOrder) {
            const fullOrder = await fetchOrderDetails(payload.new.id);
            if (fullOrder) {
              onNewOrder(fullOrder);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `vendor_id=eq.${vendorId}`,
        },
        async (payload) => {
          if (onOrderUpdate) {
            const fullOrder = await fetchOrderDetails(payload.new.id);
            if (fullOrder) {
              onOrderUpdate(fullOrder);
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [vendorId, onNewOrder, onOrderUpdate, fetchOrderDetails]);
}

export default useVendorOrderSubscription;
