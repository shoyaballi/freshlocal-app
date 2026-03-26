-- Add refund-related columns to orders table
-- payment_status tracks the Stripe payment lifecycle
-- refund_reason and refunded_at record refund details

-- Add payment_status column (may already exist from webhook usage, so use IF NOT EXISTS)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';

-- Add refund columns
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS refund_reason TEXT;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS refunded_by UUID REFERENCES profiles(id);

-- Index for quick lookups of refunded orders
CREATE INDEX IF NOT EXISTS idx_orders_payment_status
ON orders(payment_status);

COMMENT ON COLUMN orders.payment_status IS 'Payment lifecycle: pending, paid, refunded, failed';
COMMENT ON COLUMN orders.refund_reason IS 'Admin-provided reason for refund';
COMMENT ON COLUMN orders.refunded_at IS 'Timestamp when refund was processed';
COMMENT ON COLUMN orders.refunded_by IS 'Admin user who initiated the refund';
