import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Order, OrderItem, Vendor, OrderStatus } from '@/types';

interface OrderWithDetails extends Order {
  vendor: Vendor;
}

interface UseOrdersOptions {
  status?: OrderStatus | OrderStatus[];
}

interface UseOrdersResult {
  orders: OrderWithDetails[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useOrders(options: UseOrdersOptions = {}): UseOrdersResult {
  const { status } = options;
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
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

      let query = supabase
        .from('orders')
        .select(`
          *,
          vendor:vendors (
            id,
            user_id,
            business_name,
            handle,
            avatar,
            phone,
            postcode,
            rating
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
        .eq('user_id', user.id)
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
      const transformedOrders: OrderWithDetails[] = (data || []).map((order: any) => ({
        id: order.id,
        userId: order.user_id,
        vendorId: order.vendor_id,
        status: order.status,
        fulfilmentType: order.fulfilment_type,
        subtotal: order.subtotal / 100, // Convert pence to pounds
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
        vendor: order.vendor ? {
          id: order.vendor.id,
          userId: order.vendor.user_id,
          businessName: order.vendor.business_name,
          handle: order.vendor.handle,
          description: '',
          businessType: 'home_kitchen',
          avatar: order.vendor.avatar,
          tags: [],
          phone: order.vendor.phone,
          postcode: order.vendor.postcode,
          rating: parseFloat(order.vendor.rating),
          reviewCount: 0,
          isVerified: false,
          isActive: true,
          createdAt: '',
          updatedAt: '',
        } : undefined,
      }));

      setOrders(transformedOrders);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch orders'));
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, isLoading, error, refetch: fetchOrders };
}

export default useOrders;
