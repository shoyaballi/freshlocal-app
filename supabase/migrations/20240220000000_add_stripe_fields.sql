-- Add Stripe-related columns to vendors table
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE;

-- Add Stripe customer ID to profiles for saved payment methods
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create index for webhook lookups on vendors
CREATE INDEX IF NOT EXISTS idx_vendors_stripe_account_id
ON vendors(stripe_account_id) WHERE stripe_account_id IS NOT NULL;

-- Create index for webhook lookups on orders
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent_id
ON orders(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- Create index for customer lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
ON profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
