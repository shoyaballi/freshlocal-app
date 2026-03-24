-- Fix valid_total constraint to account for discount_amount from promo codes
ALTER TABLE orders DROP CONSTRAINT valid_total;
ALTER TABLE orders ADD CONSTRAINT valid_total CHECK (
  total = subtotal + service_fee + COALESCE(delivery_fee, 0) - COALESCE(discount_amount, 0)
);
