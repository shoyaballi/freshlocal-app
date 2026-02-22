import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Meal, Vendor, DietaryBadge } from '@/types';

interface MealWithVendor extends Meal {
  vendor: Vendor;
}

interface UseMealsOptions {
  date?: string;
  dietary?: DietaryBadge[];
  vendorId?: string;
}

interface UseMealsResult {
  meals: MealWithVendor[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useMeals(options: UseMealsOptions = {}): UseMealsResult {
  const { date, vendorId } = options;
  // Stabilize dietary array by serializing — prevents infinite re-fetch loop
  const dietaryKey = options.dietary ? options.dietary.sort().join(',') : '';
  const [meals, setMeals] = useState<MealWithVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasFetchedOnce = useRef(false);

  const fetchMeals = useCallback(async () => {
    try {
      // Only show full loading on initial fetch, not on filter changes
      if (!hasFetchedOnce.current) {
        setIsLoading(true);
      }
      setError(null);
      const dietary = dietaryKey ? dietaryKey.split(',') as DietaryBadge[] : undefined;

      let query = supabase
        .from('meals')
        .select(`
          *,
          vendor:vendors (
            id,
            user_id,
            business_name,
            handle,
            description,
            business_type,
            avatar,
            cover_image,
            tags,
            phone,
            postcode,
            rating,
            review_count,
            is_verified,
            is_active,
            created_at,
            updated_at
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Filter by date if provided
      if (date) {
        query = query.eq('available_date', date);
      }

      // Filter by vendor if provided
      if (vendorId) {
        query = query.eq('vendor_id', vendorId);
      }

      // Filter by dietary requirements if provided
      if (dietary && dietary.length > 0) {
        query = query.contains('dietary', dietary);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform snake_case to camelCase
      const transformedMeals: MealWithVendor[] = (data || []).map((meal: any) => ({
        id: meal.id,
        vendorId: meal.vendor_id,
        name: meal.name,
        description: meal.description,
        emoji: meal.emoji,
        imageUrl: meal.image_url,
        price: meal.price / 100, // Convert pence to pounds
        originalPrice: meal.original_price ? meal.original_price / 100 : undefined,
        dietary: meal.dietary,
        spiceLevel: parseInt(meal.spice_level) as 0 | 1 | 2 | 3,
        stock: meal.stock,
        maxStock: meal.max_stock,
        fulfilmentType: meal.fulfilment_type,
        prepTime: meal.prep_time,
        availableDate: meal.available_date,
        availableFrom: meal.available_from,
        availableTo: meal.available_to,
        isActive: meal.is_active,
        createdAt: meal.created_at,
        updatedAt: meal.updated_at,
        vendor: meal.vendor ? {
          id: meal.vendor.id,
          userId: meal.vendor.user_id,
          businessName: meal.vendor.business_name,
          handle: meal.vendor.handle,
          description: meal.vendor.description,
          businessType: meal.vendor.business_type,
          avatar: meal.vendor.avatar,
          coverImage: meal.vendor.cover_image,
          tags: meal.vendor.tags,
          phone: meal.vendor.phone,
          postcode: meal.vendor.postcode,
          rating: parseFloat(meal.vendor.rating),
          reviewCount: meal.vendor.review_count,
          isVerified: meal.vendor.is_verified,
          isActive: meal.vendor.is_active,
          createdAt: meal.vendor.created_at,
          updatedAt: meal.vendor.updated_at,
        } : undefined,
      }));

      setMeals(transformedMeals);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch meals'));
    } finally {
      setIsLoading(false);
      hasFetchedOnce.current = true;
    }
  }, [date, dietaryKey, vendorId]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  return { meals, isLoading, error, refetch: fetchMeals };
}

export default useMeals;
