import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Vendor, FoodTag } from '@/types';

interface UseVendorsOptions {
  tags?: FoodTag[];
  searchQuery?: string;
}

interface UseVendorsResult {
  vendors: Vendor[];
  vendorsMap: Record<string, Vendor>;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useVendors(options: UseVendorsOptions = {}): UseVendorsResult {
  const { tags, searchQuery } = options;
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchVendors = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      // Filter by tags if provided
      if (tags && tags.length > 0) {
        query = query.contains('tags', tags);
      }

      // Search by business name if provided
      if (searchQuery) {
        query = query.ilike('business_name', `%${searchQuery}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform snake_case to camelCase
      const transformedVendors: Vendor[] = (data || []).map((vendor: any) => ({
        id: vendor.id,
        userId: vendor.user_id,
        businessName: vendor.business_name,
        handle: vendor.handle,
        description: vendor.description,
        businessType: vendor.business_type,
        avatar: vendor.avatar,
        coverImage: vendor.cover_image,
        tags: vendor.tags,
        phone: vendor.phone,
        postcode: vendor.postcode,
        rating: parseFloat(vendor.rating),
        reviewCount: vendor.review_count,
        isVerified: vendor.is_verified,
        isActive: vendor.is_active,
        createdAt: vendor.created_at,
        updatedAt: vendor.updated_at,
      }));

      setVendors(transformedVendors);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch vendors'));
    } finally {
      setIsLoading(false);
    }
  }, [tags, searchQuery]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Create a map of vendors by ID for easy lookup
  const vendorsMap = vendors.reduce((acc, vendor) => {
    acc[vendor.id] = vendor;
    return acc;
  }, {} as Record<string, Vendor>);

  return { vendors, vendorsMap, isLoading, error, refetch: fetchVendors };
}

export default useVendors;
