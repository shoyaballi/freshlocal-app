-- FreshLocal Seed Data
-- Run this in the Supabase SQL Editor to populate sample data

-- Note: This script creates test users and data for development purposes.
-- In production, users would sign up through the app.

-- =============================================================================
-- CREATE TEST USERS (via auth.users - requires service role or dashboard)
-- =============================================================================

-- First, we'll create profiles directly (normally created by trigger on signup)
-- These UUIDs are fixed for predictable testing

-- Test customer user
INSERT INTO profiles (id, email, phone, name, postcode, is_vendor, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'customer@freshlocal.test',
  '+447700900000',
  'Aisha Khan',
  'BB1 1AA',
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Vendor user 1 - Ammi's Kitchen
INSERT INTO profiles (id, email, phone, name, postcode, is_vendor, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000011',
  'ammis@freshlocal.test',
  '+447700900001',
  'Fatima Begum',
  'BB1 2AB',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Vendor user 2 - Dhaka Delights
INSERT INTO profiles (id, email, phone, name, postcode, is_vendor, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000012',
  'dhaka@freshlocal.test',
  '+447700900002',
  'Rahim Ahmed',
  'BB1 3CD',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Vendor user 3 - Grill Master
INSERT INTO profiles (id, email, phone, name, postcode, is_vendor, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000013',
  'grill@freshlocal.test',
  '+447700900003',
  'Hassan Ali',
  'BB1 4EF',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Vendor user 4 - Falafel House
INSERT INTO profiles (id, email, phone, name, postcode, is_vendor, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000014',
  'falafel@freshlocal.test',
  '+447700900004',
  'Omar Khalil',
  'BB1 5GH',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Vendor user 5 - Naan Stop Bakery
INSERT INTO profiles (id, email, phone, name, postcode, is_vendor, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000015',
  'naan@freshlocal.test',
  '+447700900005',
  'Priya Sharma',
  'BB1 6IJ',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- VENDORS
-- =============================================================================

INSERT INTO vendors (id, user_id, business_name, handle, description, business_type, avatar, tags, phone, postcode, rating, review_count, is_verified, is_active)
VALUES
  (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000011',
    'Ammi''s Kitchen',
    'ammiskitchen',
    'Authentic Pakistani home cooking, just like your ammi makes. Fresh biryani and curries daily.',
    'home_kitchen',
    '👩‍🍳',
    ARRAY['halal', 'pakistani', 'indian']::food_tag[],
    '+447700900001',
    'BB1 2AB',
    4.9,
    124,
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000012',
    'Dhaka Delights',
    'dhakadelights',
    'Traditional Bangladeshi street food favourites. Biryanis, kebabs and more!',
    'home_kitchen',
    '🍛',
    ARRAY['halal', 'bangladeshi', 'street_food']::food_tag[],
    '+447700900002',
    'BB1 3CD',
    4.7,
    89,
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000013',
    'Grill Master',
    'grillmaster',
    'Premium halal grills and BBQ. Burgers, steaks, and loaded fries.',
    'shop',
    '🔥',
    ARRAY['halal', 'grill', 'street_food']::food_tag[],
    '+447700900003',
    'BB1 4EF',
    4.8,
    156,
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000104',
    '00000000-0000-0000-0000-000000000014',
    'Falafel House',
    'falafelhouse',
    'Fresh Middle Eastern cuisine. Falafel wraps, hummus plates, and shawarma.',
    'popup',
    '🧆',
    ARRAY['halal', 'vegetarian', 'middle_eastern']::food_tag[],
    '+447700900004',
    'BB1 5GH',
    4.6,
    67,
    false,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000105',
    '00000000-0000-0000-0000-000000000015',
    'Naan Stop Bakery',
    'naanstop',
    'Fresh naans, rotis, parathas baked daily. Plus samosas and pakoras!',
    'home_kitchen',
    '🫓',
    ARRAY['halal', 'vegetarian', 'bakery', 'indian']::food_tag[],
    '+447700900005',
    'BB1 6IJ',
    4.9,
    203,
    true,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  description = EXCLUDED.description,
  rating = EXCLUDED.rating,
  review_count = EXCLUDED.review_count;

-- =============================================================================
-- MEALS
-- =============================================================================

-- Get today's and tomorrow's dates for availability
DO $$
DECLARE
  today DATE := CURRENT_DATE;
  tomorrow DATE := CURRENT_DATE + INTERVAL '1 day';
BEGIN

-- Clear existing meals to avoid duplicates
DELETE FROM meals WHERE vendor_id IN (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000103',
  '00000000-0000-0000-0000-000000000104',
  '00000000-0000-0000-0000-000000000105'
);

-- Ammi's Kitchen meals
INSERT INTO meals (vendor_id, name, description, emoji, price, dietary, spice_level, stock, max_stock, fulfilment_type, prep_time, available_date, is_active)
VALUES
  (
    '00000000-0000-0000-0000-000000000101',
    'Chicken Biryani',
    'Fragrant basmati rice with tender chicken, aromatic spices, and crispy onions. Served with raita.',
    '🍚',
    899, -- £8.99 in pence
    ARRAY['halal']::dietary_badge[],
    '2',
    12,
    20,
    'both',
    30,
    today,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000101',
    'Lamb Karahi',
    'Tender lamb cooked in a wok with tomatoes, green chilies, and fresh ginger. Served with naan.',
    '🍖',
    1099,
    ARRAY['halal']::dietary_badge[],
    '3',
    8,
    15,
    'collection',
    45,
    today,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000101',
    'Nihari Special',
    'Slow-cooked beef shank in rich spiced gravy. Traditional Sunday special.',
    '🥣',
    1299,
    ARRAY['halal']::dietary_badge[],
    '2',
    10,
    15,
    'collection',
    35,
    tomorrow,
    true
  );

-- Dhaka Delights meals
INSERT INTO meals (vendor_id, name, description, emoji, price, dietary, spice_level, stock, max_stock, fulfilment_type, prep_time, available_date, is_active)
VALUES
  (
    '00000000-0000-0000-0000-000000000102',
    'Kacchi Biryani',
    'Traditional Dhaka-style dum biryani with marinated mutton and potatoes.',
    '🥘',
    1199,
    ARRAY['halal']::dietary_badge[],
    '2',
    6,
    10,
    'both',
    40,
    today,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'Fish Curry',
    'Fresh rohu fish in Bengali mustard curry with steamed rice.',
    '🐟',
    999,
    ARRAY['halal']::dietary_badge[],
    '2',
    8,
    12,
    'both',
    30,
    tomorrow,
    true
  );

-- Grill Master meals
INSERT INTO meals (vendor_id, name, description, emoji, price, dietary, spice_level, stock, max_stock, fulfilment_type, prep_time, available_date, is_active)
VALUES
  (
    '00000000-0000-0000-0000-000000000103',
    'Smash Burger Meal',
    'Double smashed beef patties, American cheese, special sauce. With loaded fries.',
    '🍔',
    999,
    ARRAY['halal']::dietary_badge[],
    '0',
    15,
    25,
    'both',
    20,
    today,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    'Chicken Wings (10)',
    'Crispy fried wings with your choice of sauce: Buffalo, BBQ, or Peri Peri.',
    '🍗',
    849,
    ARRAY['halal']::dietary_badge[],
    '2',
    3,
    20,
    'both',
    25,
    today,
    true
  );

-- Falafel House meals
INSERT INTO meals (vendor_id, name, description, emoji, price, dietary, spice_level, stock, max_stock, fulfilment_type, prep_time, available_date, is_active)
VALUES
  (
    '00000000-0000-0000-0000-000000000104',
    'Falafel Wrap',
    'Crispy falafel, fresh salad, pickles, and tahini in warm pita bread.',
    '🌯',
    749,
    ARRAY['halal', 'vegetarian', 'vegan']::dietary_badge[],
    '1',
    20,
    30,
    'both',
    15,
    today,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000104',
    'Mezze Platter',
    'Hummus, baba ganoush, muhammara, with warm pita and olives. Serves 2.',
    '🫒',
    1299,
    ARRAY['halal', 'vegetarian', 'vegan']::dietary_badge[],
    '0',
    10,
    15,
    'both',
    20,
    tomorrow,
    true
  );

-- Naan Stop Bakery meals
INSERT INTO meals (vendor_id, name, description, emoji, price, dietary, spice_level, stock, max_stock, fulfilment_type, prep_time, available_date, is_active)
VALUES
  (
    '00000000-0000-0000-0000-000000000105',
    'Samosa Pack (6)',
    'Crispy vegetable samosas with mint chutney and tamarind sauce.',
    '🥟',
    499,
    ARRAY['halal', 'vegetarian']::dietary_badge[],
    '1',
    25,
    40,
    'collection',
    10,
    today,
    true
  );

END $$;

-- =============================================================================
-- SAVED ADDRESSES (for test customer)
-- =============================================================================

INSERT INTO saved_addresses (user_id, label, line1, line2, city, postcode, is_default)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Home',
    '123 Test Street',
    'Flat 4B',
    'Blackburn',
    'BB1 1AA',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Work',
    '456 Office Road',
    NULL,
    'Blackburn',
    'BB1 2BB',
    false
  )
ON CONFLICT DO NOTHING;

-- =============================================================================
-- FAVOURITES (customer favourites some vendors)
-- =============================================================================

INSERT INTO favourites (user_id, vendor_id)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000103')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Show what was created
SELECT 'Profiles created:' AS info, COUNT(*) AS count FROM profiles;
SELECT 'Vendors created:' AS info, COUNT(*) AS count FROM vendors;
SELECT 'Meals created:' AS info, COUNT(*) AS count FROM meals;
SELECT 'Addresses created:' AS info, COUNT(*) AS count FROM saved_addresses;
SELECT 'Favourites created:' AS info, COUNT(*) AS count FROM favourites;

-- Show today's meals
SELECT
  m.name AS meal,
  m.price / 100.0 AS price_gbp,
  v.business_name AS vendor,
  m.available_date
FROM meals m
JOIN vendors v ON v.id = m.vendor_id
WHERE m.available_date = CURRENT_DATE
ORDER BY v.business_name, m.name;
