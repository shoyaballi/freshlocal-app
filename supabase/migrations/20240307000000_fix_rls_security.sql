-- =============================================================================
-- Fix Critical RLS Security Gaps
-- =============================================================================
-- This migration addresses three categories of security issues:
-- 1. Vendors can update protected fields on their own record
-- 2. Users can modify total/subtotal on pending orders
-- 3. SECURITY DEFINER functions missing SET search_path = ''
-- =============================================================================

-- =============================================================================
-- 1. PROTECT VENDOR FIELDS FROM SELF-MODIFICATION
-- =============================================================================
-- Vendors can currently update is_verified, is_active, rating, review_count,
-- stripe_account_id, and stripe_onboarding_complete on their own record via
-- the "Owners can update own vendor" RLS policy. This trigger ensures those
-- protected fields can only be changed by the service_role (admin/backend).
-- =============================================================================

CREATE OR REPLACE FUNCTION protect_vendor_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow changes to these protected fields via service role (admin)
  -- Regular users (vendors) cannot change them
  IF current_setting('role') != 'service_role' THEN
    NEW.is_verified := OLD.is_verified;
    NEW.is_active := OLD.is_active;
    NEW.rating := OLD.rating;
    NEW.review_count := OLD.review_count;
    NEW.stripe_account_id := OLD.stripe_account_id;
    NEW.stripe_onboarding_complete := OLD.stripe_onboarding_complete;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER protect_vendor_fields_trigger
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION protect_vendor_fields();


-- =============================================================================
-- 2. RESTRICT USERS TO ONLY CANCELLING PENDING ORDERS
-- =============================================================================
-- The existing "Users can update pending orders" policy allows users to modify
-- any field (total, subtotal, service_fee, etc.) on pending orders. Replace it
-- with a policy that only allows setting status to 'cancelled'.
-- =============================================================================

DROP POLICY IF EXISTS "Users can update pending orders" ON orders;

CREATE POLICY "Users can cancel pending orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');


-- =============================================================================
-- 3. ADD search_path TO ALL SECURITY DEFINER FUNCTIONS MISSING IT
-- =============================================================================
-- Functions declared as SECURITY DEFINER run with the privileges of the
-- function owner (typically the superuser). Without an explicit search_path,
-- a malicious user could manipulate the search_path to hijack function calls.
-- See: https://www.postgresql.org/docs/current/sql-createfunction.html
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 3a. handle_new_user (from initial_schema)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 3b. handle_vendor_created (from initial_schema)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_vendor_created()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles SET is_vendor = TRUE WHERE id = NEW.user_id;

  -- Send notification to admins about new vendor application
  INSERT INTO public.notifications (user_id, type, title, body, data)
  SELECT p.id, 'system', 'New Vendor Application',
    'A new vendor "' || NEW.business_name || '" has applied.',
    jsonb_build_object('vendor_id', NEW.id, 'business_name', NEW.business_name)
  FROM public.profiles p
  WHERE p.role = 'admin';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 3c. update_vendor_rating (from add_reviews)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id UUID;
  avg_rating DECIMAL(2,1);
  total_reviews INTEGER;
BEGIN
  -- Get the vendor_id from the affected row
  IF TG_OP = 'DELETE' THEN
    v_id := OLD.vendor_id;
  ELSE
    v_id := NEW.vendor_id;
  END IF;

  -- Calculate new average
  SELECT COALESCE(AVG(rating)::DECIMAL(2,1), 0.0), COUNT(*)
  INTO avg_rating, total_reviews
  FROM public.reviews
  WHERE vendor_id = v_id;

  -- Update vendor
  UPDATE public.vendors
  SET rating = avg_rating, review_count = total_reviews
  WHERE id = v_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 3d. notify_order_status_change (from order_email_trigger)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  email_type TEXT;
  edge_function_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Only proceed if the status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Determine which email type to send (if any)
  email_type := public.get_email_type_for_status(NEW.status::TEXT, OLD.status::TEXT);

  -- No email needed for this transition
  IF email_type IS NULL THEN
    RETURN NEW;
  END IF;

  -- Build the edge function URL
  edge_function_url := COALESCE(
    current_setting('app.settings.edge_function_url', true),
    'https://sylmtrlrhrguslokzmfn.supabase.co/functions/v1/send-order-email'
  );

  -- Get the service role key for auth
  service_role_key := COALESCE(
    current_setting('app.settings.service_role_key', true),
    ''
  );

  -- Make async HTTP POST via pg_net
  PERFORM extensions.net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'orderId', NEW.id::TEXT,
      'emailType', email_type
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but never block the order status update
    RAISE WARNING 'order_email_trigger failed for order %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
