import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Address } from '@/types';

interface CreateAddressInput {
  label: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  isDefault: boolean;
}

interface UseAddressesResult {
  addresses: Address[];
  isLoading: boolean;
  error: Error | null;
  createAddress: (input: CreateAddressInput) => Promise<Address | null>;
  deleteAddress: (id: string) => Promise<boolean>;
  setDefaultAddress: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useAddresses(): UseAddressesResult {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAddresses = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAddresses([]);
        setIsLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const transformedAddresses: Address[] = (data || []).map((addr) => ({
        id: addr.id,
        userId: addr.user_id,
        label: addr.label,
        line1: addr.line1,
        line2: addr.line2,
        city: addr.city,
        postcode: addr.postcode,
        isDefault: addr.is_default,
        createdAt: addr.created_at,
      }));

      setAddresses(transformedAddresses);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch addresses'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const createAddress = useCallback(async (input: CreateAddressInput): Promise<Address | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be signed in to save an address');
      }

      // If setting as default, unset other defaults first
      if (input.isDefault) {
        await supabase
          .from('saved_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error: insertError } = await supabase
        .from('saved_addresses')
        .insert({
          user_id: user.id,
          label: input.label,
          line1: input.line1,
          line2: input.line2 || null,
          city: input.city,
          postcode: input.postcode,
          is_default: input.isDefault,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      const newAddress: Address = {
        id: data.id,
        userId: data.user_id,
        label: data.label,
        line1: data.line1,
        line2: data.line2,
        city: data.city,
        postcode: data.postcode,
        isDefault: data.is_default,
        createdAt: data.created_at,
      };

      setAddresses((prev) => [newAddress, ...prev]);
      return newAddress;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create address'));
      return null;
    }
  }, []);

  const deleteAddress = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('saved_addresses')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setAddresses((prev) => prev.filter((addr) => addr.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete address'));
      return false;
    }
  }, []);

  const setDefaultAddress = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be signed in');
      }

      // Unset all defaults first
      await supabase
        .from('saved_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set the new default
      const { error: updateError } = await supabase
        .from('saved_addresses')
        .update({ is_default: true })
        .eq('id', id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          isDefault: addr.id === id,
        }))
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to set default address'));
      return false;
    }
  }, []);

  return {
    addresses,
    isLoading,
    error,
    createAddress,
    deleteAddress,
    setDefaultAddress,
    refetch: fetchAddresses,
  };
}

export default useAddresses;
