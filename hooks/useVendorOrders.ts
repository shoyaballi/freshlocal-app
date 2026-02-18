import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Order, OrderItem, User, OrderStatus } from '@/types';

interface VendorOrderWithDetails extends Order {
  user: Pick<User, 'id' | 'name' | 'phone'>;
}

interface UseVendorOrdersOptions {
  status?: OrderStatus | OrderStatus[];
}

interface UseVendorOrdersResult {
  orders: VendorOrderWithDetails[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
}

export function useVendorOrders(options: UseVendorOrdersOptions = {}): UseVendorOrdersResult {
  const { status } = options;
  const [orders, setOrders] = useState<VendorOrderWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setOrders([]);
        setIsLoading(false);
        return;
      }

      // First get the vendor for this user
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (vendorError || !vendorData) {
        setOrders([]);
        setIsLoading(false);
        return;
      }

      let query = supabase
        .from('orders')
        .select(`
          *,
          user:profiles (
            id,
            name,
            phone
          ),
          items:order_items (
            id,
            order_id,
            meal_id,
            meal_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: false });

      // Filter by status if provided
      if (status) {
        if (Array.isArray(status)) {
          query = query.in('status', status);
        } else {
          query = query.eq('status', status);
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform snake_case to camelCase
      const transformedOrders: VendorOrderWithDetails[] = (data || []).map((order: any) => ({
        id: order.id,
        userId: order.user_id,
        vendorId: order.vendor_id,
        status: order.status,
        fulfilmentType: order.fulfilment_type,
        subtotal: order.subtotal / 100,
        serviceFee: order.service_fee / 100,
        deliveryFee: order.delivery_fee ? order.delivery_fee / 100 : undefined,
        total: order.total / 100,
        collectionTime: order.collection_time,
        deliveryAddress: order.delivery_address,
        notes: order.notes,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        items: (order.items || []).map((item: any): OrderItem => ({
          id: item.id,
          orderId: item.order_id,
          mealId: item.meal_id,
          mealName: item.meal_name,
          quantity: item.quantity,
          unitPrice: item.unit_price / 100,
          totalPrice: item.total_price / 100,
        })),
        user: order.user ? {
          id: order.user.id,
          name: order.user.name,
          phone: order.user.phone,
        } : undefined,
      }));

      setOrders(transformedOrders);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch vendor orders'));
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Update local state
      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update order status');
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, isLoading, error, refetch: fetchOrders, updateOrderStatus };
}

export default useVendorOrders;
