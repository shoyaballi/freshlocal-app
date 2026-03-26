-- =============================================================================
-- Order Email Trigger
-- Fires on order status UPDATE and calls the send-order-email edge function
-- via pg_net (Supabase HTTP extension for async requests from Postgres).
-- =============================================================================

-- Enable the pg_net extension (available on all Supabase projects)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- Helper: map order status to email type
-- Returns NULL if no email should be sent for that status transition.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_email_type_for_status(new_status TEXT, old_status TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Only send emails for meaningful transitions
  CASE new_status
    WHEN 'confirmed' THEN
      -- Only send confirmation if coming from pending (payment just went through)
      IF old_status = 'pending' THEN
        RETURN 'confirmation';
      END IF;
    WHEN 'preparing' THEN
      RETURN 'preparing';
    WHEN 'ready' THEN
      RETURN 'ready';
    WHEN 'delivered' THEN
      RETURN 'delivered';
    WHEN 'collected' THEN
      -- Treat 'collected' the same as 'delivered' for email purposes
      RETURN 'delivered';
    WHEN 'cancelled' THEN
      -- Only send cancellation email if the order was previously active
      IF old_status IN ('pending', 'confirmed', 'preparing', 'ready') THEN
        RETURN 'cancelled';
      END IF;
    ELSE
      RETURN NULL;
  END CASE;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ---------------------------------------------------------------------------
-- Trigger function: fires the edge function when order status changes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
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
  email_type := get_email_type_for_status(NEW.status::TEXT, OLD.status::TEXT);

  -- No email needed for this transition
  IF email_type IS NULL THEN
    RETURN NEW;
  END IF;

  -- Build the edge function URL
  -- current_setting('app.settings.supabase_url') may not be available,
  -- so we use the project-specific URL directly via a config variable,
  -- or fall back to constructing it from the project ref.
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
  -- pg_net.http_post returns a request ID; the call is non-blocking.
  PERFORM net.http_post(
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- Attach the trigger to the orders table
-- Fires AFTER UPDATE so the status change is already committed.
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_order_status_change_email ON orders;

CREATE TRIGGER on_order_status_change_email
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_order_status_change();

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------
COMMENT ON FUNCTION get_email_type_for_status(TEXT, TEXT) IS
  'Maps order status transitions to email types for the notification system.';

COMMENT ON FUNCTION notify_order_status_change() IS
  'Trigger function that calls the send-order-email edge function via pg_net when an order status changes.';
