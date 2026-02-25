import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Review } from '@/types';

interface UseReviewsOptions {
  vendorId: string;
}

interface CreateReviewInput {
  vendorId: string;
  orderId: string;
  rating: number;
  comment?: string;
}

interface UseReviewsResult {
  reviews: Review[];
  isLoading: boolean;
  error: Error | null;
  createReview: (input: CreateReviewInput) => Promise<void>;
  hasReviewed: (orderId: string) => boolean;
  refetch: () => Promise<void>;
}

export function useReviews({ vendorId }: UseReviewsOptions): UseReviewsResult {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('reviews')
        .select(`
          *,
          user:profiles (
            id,
            name,
            avatar
          )
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Transform snake_case to camelCase
      const transformedReviews: Review[] = (data || []).map((review: any) => ({
        id: review.id,
        userId: review.user_id,
        vendorId: review.vendor_id,
        orderId: review.order_id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
        user: review.user ? {
          id: review.user.id,
          name: review.user.name,
          avatar: review.user.avatar,
        } : undefined,
      }));

      setReviews(transformedReviews);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch reviews'));
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const createReview = useCallback(async ({ vendorId, orderId, rating, comment }: CreateReviewInput) => {
    try {
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to leave a review');
      }

      const { error: insertError } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          vendor_id: vendorId,
          order_id: orderId,
          rating,
          comment,
        });

      if (insertError) throw insertError;

      // Refetch reviews to include the new one
      await fetchReviews();
    } catch (err) {
      const reviewError = err instanceof Error ? err : new Error('Failed to create review');
      setError(reviewError);
      throw reviewError;
    }
  }, [fetchReviews]);

  const hasReviewed = useCallback((orderId: string): boolean => {
    return reviews.some((review) => review.orderId === orderId);
  }, [reviews]);

  return { reviews, isLoading, error, createReview, hasReviewed, refetch: fetchReviews };
}

export default useReviews;
