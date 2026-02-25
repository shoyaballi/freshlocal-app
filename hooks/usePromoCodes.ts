import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { PromoCode } from '@/types';

interface PromoValidationResult {
  valid: boolean;
  promoCode?: PromoCode;
  error?: string;
}

export function usePromoCodes() {
  const [isValidating, setIsValidating] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);

  const validateCode = useCallback(
    async (code: string, orderSubtotal: number): Promise<PromoValidationResult> => {
      setIsValidating(true);
      try {
        const { data, error } = await supabase
          .from('promo_codes')
          .select('*')
          .eq('code', code.toUpperCase().trim())
          .eq('is_active', true)
          .single();

        if (error || !data) {
          return { valid: false, error: 'Invalid promo code' };
        }

        const promo: PromoCode = {
          id: data.id,
          code: data.code,
          discountType: data.discount_type,
          discountValue: data.discount_value,
          minOrder: data.min_order,
          maxUses: data.max_uses,
          usedCount: data.used_count,
          expiresAt: data.expires_at,
          isActive: data.is_active,
          createdAt: data.created_at,
        };

        if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
          return { valid: false, error: 'This promo code has expired' };
        }

        if (promo.maxUses && promo.usedCount >= promo.maxUses) {
          return { valid: false, error: 'This promo code has reached its usage limit' };
        }

        if (orderSubtotal < promo.minOrder) {
          return {
            valid: false,
            error: `Minimum order of £${promo.minOrder.toFixed(2)} required`,
          };
        }

        return { valid: true, promoCode: promo };
      } catch {
        return { valid: false, error: 'Failed to validate code' };
      } finally {
        setIsValidating(false);
      }
    },
    []
  );

  const calculateDiscount = useCallback(
    (promo: PromoCode, subtotal: number): number => {
      if (promo.discountType === 'percentage') {
        return Math.round((subtotal * promo.discountValue) / 100 * 100) / 100;
      }
      return Math.min(promo.discountValue, subtotal);
    },
    []
  );

  const applyCode = useCallback((promo: PromoCode) => {
    setAppliedPromo(promo);
  }, []);

  const removeCode = useCallback(() => {
    setAppliedPromo(null);
  }, []);

  return { isValidating, appliedPromo, validateCode, calculateDiscount, applyCode, removeCode };
}

export default usePromoCodes;
