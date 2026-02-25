import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/appStore';
import { useAuth } from './useAuth';

export function useFavourites() {
  const { user } = useAuth();
  const { favourites, addFavourite, removeFavourite } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  // Sync favourites from Supabase on mount
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    async function syncFavourites() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('favourites')
          .select('vendor_id')
          .eq('user_id', user!.id);

        if (data && !error) {
          const serverFavs = data.map((f: any) => f.vendor_id);
          useAppStore.setState({ favourites: serverFavs });
        }
      } catch (err) {
        console.error('Failed to sync favourites:', err);
      } finally {
        setIsLoading(false);
      }
    }

    syncFavourites();
  }, [user]);

  const toggleFavourite = useCallback(async (vendorId: string) => {
    if (!user) return;

    const isFav = favourites.includes(vendorId);

    // Optimistic update
    if (isFav) {
      removeFavourite(vendorId);
    } else {
      addFavourite(vendorId);
    }

    try {
      if (isFav) {
        await supabase
          .from('favourites')
          .delete()
          .eq('user_id', user.id)
          .eq('vendor_id', vendorId);
      } else {
        await supabase
          .from('favourites')
          .insert({ user_id: user.id, vendor_id: vendorId });
      }
    } catch (err) {
      // Revert optimistic update on failure
      if (isFav) {
        addFavourite(vendorId);
      } else {
        removeFavourite(vendorId);
      }
      console.error('Failed to toggle favourite:', err);
    }
  }, [user, favourites, addFavourite, removeFavourite]);

  const isFavourite = useCallback((vendorId: string) => {
    return favourites.includes(vendorId);
  }, [favourites]);

  return { favourites, toggleFavourite, isFavourite, isLoading };
}

export default useFavourites;
