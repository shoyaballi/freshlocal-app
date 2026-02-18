import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Order, OrderItem, FulfilmentType } from '@/types';

interface OrderItemInput {
  mealId: string;
  mealName: string;
  quantity: number;
  unitPrice: number; // In pence
}

interface CreateOrderInput {
  vendorId: string;
  items: OrderItemInput[];
  fulfilmentType: FulfilmentType;
  collectionTime?: string;
  deliveryAddress?: {
    label: string;
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
  };
  notes?: string;
}

interface UseCreateOrderResult {
  createOrder: (input: CreateOrderInput) => Promise<Order>;
  isLoading: boolean;
  error: Error | null;
}

const DELIVERY_FEE_PENCE = 250; // £2.50
const SERVICE_FEE_RATE = 0.05; // 5%

export function useCreateOrder(): UseCreateOrderResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createOrder = useCallback(async (input: CreateOrderInput): Promise<Order> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('You must be signed in to place an order');
      }

      // Calculate totals (all in pence)
      const subtotal = input.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      );
      const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
      const deliveryFee = input.fulfilmentType === 'delivery' ? DELIVERY_FEE_PENCE : null;
      const total = subtotal + serviceFee + (deliveryFee || 0);

      // Insert order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          vendor_id: input.vendorId,
          status: 'pending',
          fulfilment_type: input.fulfilmentType === 'both' ? 'collection' : input.fulfilmentType,
          subtotal,
          service_fee: serviceFee,
          delivery_fee: deliveryFee,
          total,
          collection_time: input.collectionTime,
          delivery_address: input.deliveryAddress,
          notes: input.notes,
        })
        .select()
        .single();

      if (orderError) {
        throw new Error(orderError.message);
      }

      // Insert order items
      const orderItems = input.items.map((item) => ({
        order_id: orderData.id,
        meal_id: item.mealId,
        meal_name: item.mealName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.unitPrice * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        // If items fail, try to clean up the order
        await supabase.from('orders').delete().eq('id', orderData.id);

        if (itemsError.message.includes('Insufficient stock')) {
          throw new Error('Sorry, this meal is no longer available in the requested quantity');
        }
        throw new Error(itemsError.message);
      }

      // Transform to application format
      const transformedOrder: Order = {
        id: orderData.id,
        userId: orderData.user_id,
        vendorId: orderData.vendor_id,
        status: orderData.status,
        fulfilmentType: orderData.fulfilment_type,
        items: input.items.map((item, index) => ({
          id: `temp-${index}`, // Will be replaced if we fetch again
          orderId: orderData.id,
          mealId: item.mealId,
          mealName: item.mealName,
          quantity: item.quantity,
          unitPrice: item.unitPrice / 100, // Convert to pounds
          totalPrice: (item.unitPrice * item.quantity) / 100,
        })),
        subtotal: subtotal / 100,
        serviceFee: serviceFee / 100,
        deliveryFee: deliveryFee ? deliveryFee / 100 : undefined,
        total: total / 100,
        collectionTime: orderData.collection_time,
        deliveryAddress: orderData.delivery_address
          ? JSON.stringify(orderData.delivery_address)
          : undefined,
        notes: orderData.notes,
        createdAt: orderData.created_at,
        updatedAt: orderData.updated_at,
      };

      return transformedOrder;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create order');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { createOrder, isLoading, error };
}

export default useCreateOrder;
