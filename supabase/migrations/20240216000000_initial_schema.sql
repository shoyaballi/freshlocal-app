-- FreshLocal Database Schema
-- Initial migration with all tables, RLS policies, and indexes

-- =============================================================================
-- EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CUSTOM TYPES (ENUMS)
-- =============================================================================

-- Business types for vendors
CREATE TYPE business_type AS ENUM ('home_kitchen', 'shop', 'popup');

-- Food tags for categorization
CREATE TYPE food_tag AS ENUM (
  'halal', 'vegetarian', 'pakistani', 'bangladeshi',
  'indian', 'middle_eastern', 'grill', 'street_food', 'bakery'
);

-- Dietary badges for meals
CREATE TYPE dietary_badge AS ENUM ('halal', 'vegetarian', 'vegan', 'gluten_free');

-- Spice levels (0-3)
CREATE TYPE spice_level AS ENUM ('0', '1', '2', '3');

-- Fulfilment types
CREATE TYPE fulfilment_type AS ENUM ('collection', 'delivery', 'both');

-- Order statuses
CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'preparing', 'ready',
  'collected', 'delivered', 'cancelled'
);

-- Notification types
CREATE TYPE notification_type AS ENUM ('order', 'promo', 'system');

-- =============================================================================
-- TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PROFILES (extends auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  name TEXT NOT NULL DEFAULT '',
  avatar TEXT,
  postcode TEXT,
  is_vendor BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users';

-- -----------------------------------------------------------------------------
-- VENDORS
-- -----------------------------------------------------------------------------
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  handle TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  business_type business_type NOT NULL DEFAULT 'home_kitchen',
  avatar TEXT,
  cover_image TEXT,
  tags food_tag[] NOT NULL DEFAULT '{}',
  phone TEXT NOT NULL,
  postcode TEXT NOT NULL,
  rating DECIMAL(2, 1) NOT NULL DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  stripe_account_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT handle_format CHECK (handle ~ '^[a-z0-9_]{3,30}$')
);

COMMENT ON TABLE vendors IS 'Vendor businesses linked to user profiles';
COMMENT ON COLUMN vendors.handle IS 'Unique URL-friendly handle (lowercase, alphanumeric, underscores)';
COMMENT ON COLUMN vendors.stripe_account_id IS 'Stripe Connect account ID for payouts';

-- -----------------------------------------------------------------------------
-- MEALS
-- -----------------------------------------------------------------------------
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '🍽️',
  price INTEGER NOT NULL CHECK (price > 0), -- Price in pence
  original_price INTEGER CHECK (original_price IS NULL OR original_price > price),
  dietary dietary_badge[] NOT NULL DEFAULT '{}',
  spice_level spice_level NOT NULL DEFAULT '0',
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  max_stock INTEGER NOT NULL DEFAULT 10 CHECK (max_stock > 0),
  fulfilment_type fulfilment_type NOT NULL DEFAULT 'collection',
  prep_time INTEGER NOT NULL DEFAULT 30 CHECK (prep_time > 0), -- Minutes
  available_date DATE NOT NULL,
  available_from TIME,
  available_to TIME,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_time_range CHECK (
    available_from IS NULL OR available_to IS NULL OR available_from < available_to
  ),
  CONSTRAINT valid_stock CHECK (stock <= max_stock)
);

COMMENT ON TABLE meals IS 'Meals offered by vendors on specific dates';
COMMENT ON COLUMN meals.price IS 'Price in pence (e.g., 850 = £8.50)';
COMMENT ON COLUMN meals.prep_time IS 'Preparation time in minutes';

-- -----------------------------------------------------------------------------
-- ORDERS
-- -----------------------------------------------------------------------------
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  status order_status NOT NULL DEFAULT 'pending',
  fulfilment_type fulfilment_type NOT NULL,
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0), -- Pence
  service_fee INTEGER NOT NULL DEFAULT 0 CHECK (service_fee >= 0), -- Pence (5%)
  delivery_fee INTEGER CHECK (delivery_fee IS NULL OR delivery_fee >= 0), -- Pence
  total INTEGER NOT NULL CHECK (total >= 0), -- Pence
  collection_time TIMESTAMPTZ,
  delivery_address JSONB,
  notes TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_total CHECK (
    total = subtotal + service_fee + COALESCE(delivery_fee, 0)
  )
);

COMMENT ON TABLE orders IS 'Customer orders to vendors';
COMMENT ON COLUMN orders.subtotal IS 'Sum of order items in pence';
COMMENT ON COLUMN orders.service_fee IS '5% customer service fee in pence';
COMMENT ON COLUMN orders.delivery_address IS 'JSON object with address details for delivery orders';

-- -----------------------------------------------------------------------------
-- ORDER ITEMS
-- -----------------------------------------------------------------------------
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE RESTRICT,
  meal_name TEXT NOT NULL, -- Snapshot at time of order
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL CHECK (unit_price > 0), -- Pence (snapshot)
  total_price INTEGER NOT NULL CHECK (total_price > 0), -- Pence
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_item_total CHECK (total_price = unit_price * quantity)
);

COMMENT ON TABLE order_items IS 'Individual items within an order';
COMMENT ON COLUMN order_items.meal_name IS 'Meal name snapshot at order time';
COMMENT ON COLUMN order_items.unit_price IS 'Price per unit snapshot in pence';

-- -----------------------------------------------------------------------------
-- NOTIFICATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'system',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'Push/in-app notifications for users';
COMMENT ON COLUMN notifications.data IS 'Additional context data (order_id, etc.)';

-- -----------------------------------------------------------------------------
-- SAVED ADDRESSES
-- -----------------------------------------------------------------------------
CREATE TABLE saved_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  postcode TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE saved_addresses IS 'Saved delivery addresses for users';

-- -----------------------------------------------------------------------------
-- FAVOURITES (User -> Vendor)
-- -----------------------------------------------------------------------------
CREATE TABLE favourites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, vendor_id)
);

COMMENT ON TABLE favourites IS 'User favourite vendors';

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Profiles
CREATE INDEX idx_profiles_postcode ON profiles(postcode) WHERE postcode IS NOT NULL;
CREATE INDEX idx_profiles_is_vendor ON profiles(is_vendor) WHERE is_vendor = TRUE;

-- Vendors
CREATE INDEX idx_vendors_user_id ON vendors(user_id);
CREATE INDEX idx_vendors_postcode ON vendors(postcode);
CREATE INDEX idx_vendors_is_active ON vendors(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_vendors_tags ON vendors USING GIN(tags);
CREATE INDEX idx_vendors_rating ON vendors(rating DESC) WHERE is_active = TRUE;

-- Meals
CREATE INDEX idx_meals_vendor_id ON meals(vendor_id);
CREATE INDEX idx_meals_available_date ON meals(available_date);
CREATE INDEX idx_meals_vendor_date ON meals(vendor_id, available_date);
CREATE INDEX idx_meals_active_date ON meals(available_date) WHERE is_active = TRUE;
CREATE INDEX idx_meals_dietary ON meals USING GIN(dietary);
CREATE INDEX idx_meals_fulfilment ON meals(fulfilment_type);

-- Orders
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_vendor_id ON orders(vendor_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_vendor_status ON orders(vendor_id, status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Order Items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_meal_id ON order_items(meal_id);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Saved Addresses
CREATE INDEX idx_saved_addresses_user_id ON saved_addresses(user_id);
CREATE INDEX idx_saved_addresses_user_default ON saved_addresses(user_id) WHERE is_default = TRUE;

-- Favourites
CREATE INDEX idx_favourites_user_id ON favourites(user_id);
CREATE INDEX idx_favourites_vendor_id ON favourites(vendor_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE favourites ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- PROFILES POLICIES
-- -----------------------------------------------------------------------------

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- New users can insert their profile (on signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- VENDORS POLICIES
-- -----------------------------------------------------------------------------

-- Anyone can view active vendors
CREATE POLICY "Anyone can view active vendors"
  ON vendors FOR SELECT
  USING (is_active = TRUE);

-- Vendor owners can view their own vendor (even if inactive)
CREATE POLICY "Owners can view own vendor"
  ON vendors FOR SELECT
  USING (auth.uid() = user_id);

-- Vendor owners can update their own vendor
CREATE POLICY "Owners can update own vendor"
  ON vendors FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can create a vendor for themselves
CREATE POLICY "Users can create own vendor"
  ON vendors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- MEALS POLICIES
-- -----------------------------------------------------------------------------

-- Anyone can view active meals from active vendors
CREATE POLICY "Anyone can view active meals"
  ON meals FOR SELECT
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = meals.vendor_id
      AND vendors.is_active = TRUE
    )
  );

-- Vendor owners can view all their meals
CREATE POLICY "Vendors can view own meals"
  ON meals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = meals.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Vendor owners can create meals
CREATE POLICY "Vendors can create meals"
  ON meals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = meals.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Vendor owners can update their meals
CREATE POLICY "Vendors can update own meals"
  ON meals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = meals.vendor_id
      AND vendors.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = meals.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Vendor owners can delete their meals
CREATE POLICY "Vendors can delete own meals"
  ON meals FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = meals.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- ORDERS POLICIES
-- -----------------------------------------------------------------------------

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Vendors can view orders for their business
CREATE POLICY "Vendors can view their orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = orders.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Users can create orders
CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their pending orders (cancel)
CREATE POLICY "Users can update pending orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- Vendors can update order status
CREATE POLICY "Vendors can update order status"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = orders.vendor_id
      AND vendors.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = orders.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- ORDER ITEMS POLICIES
-- -----------------------------------------------------------------------------

-- Users can view items for their orders
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Vendors can view items for their orders
CREATE POLICY "Vendors can view their order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN vendors ON vendors.id = orders.vendor_id
      WHERE orders.id = order_items.order_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Users can create order items (when creating order)
CREATE POLICY "Users can create order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- NOTIFICATIONS POLICIES
-- -----------------------------------------------------------------------------

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- System can insert notifications (via service role)
-- Note: This will be handled by backend/edge functions with service role

-- -----------------------------------------------------------------------------
-- SAVED ADDRESSES POLICIES
-- -----------------------------------------------------------------------------

-- Users can view their own addresses
CREATE POLICY "Users can view own addresses"
  ON saved_addresses FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create addresses
CREATE POLICY "Users can create addresses"
  ON saved_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their addresses
CREATE POLICY "Users can update own addresses"
  ON saved_addresses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their addresses
CREATE POLICY "Users can delete own addresses"
  ON saved_addresses FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- FAVOURITES POLICIES
-- -----------------------------------------------------------------------------

-- Users can view their own favourites
CREATE POLICY "Users can view own favourites"
  ON favourites FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add favourites
CREATE POLICY "Users can add favourites"
  ON favourites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove favourites
CREATE POLICY "Users can remove favourites"
  ON favourites FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_meals_updated_at
  BEFORE UPDATE ON meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_saved_addresses_updated_at
  BEFORE UPDATE ON saved_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to set is_vendor flag when vendor is created
CREATE OR REPLACE FUNCTION handle_vendor_created()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET is_vendor = TRUE WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update is_vendor on vendor creation
CREATE TRIGGER on_vendor_created
  AFTER INSERT ON vendors
  FOR EACH ROW EXECUTE FUNCTION handle_vendor_created();

-- Function to ensure only one default address per user
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE saved_addresses
    SET is_default = FALSE
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_address_trigger
  AFTER INSERT OR UPDATE ON saved_addresses
  FOR EACH ROW
  WHEN (NEW.is_default = TRUE)
  EXECUTE FUNCTION ensure_single_default_address();

-- Function to decrement meal stock on order
CREATE OR REPLACE FUNCTION decrement_meal_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE meals
  SET stock = stock - NEW.quantity
  WHERE id = NEW.meal_id AND stock >= NEW.quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for meal %', NEW.meal_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_item_created
  AFTER INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION decrement_meal_stock();

-- =============================================================================
-- SAMPLE HELPER VIEWS
-- =============================================================================

-- View for meals with vendor info (commonly needed)
CREATE OR REPLACE VIEW meals_with_vendor AS
SELECT
  m.*,
  v.business_name AS vendor_name,
  v.handle AS vendor_handle,
  v.avatar AS vendor_avatar,
  v.rating AS vendor_rating,
  v.postcode AS vendor_postcode
FROM meals m
JOIN vendors v ON v.id = m.vendor_id
WHERE m.is_active = TRUE AND v.is_active = TRUE;

-- Grant access to the view
GRANT SELECT ON meals_with_vendor TO authenticated;
GRANT SELECT ON meals_with_vendor TO anon;
