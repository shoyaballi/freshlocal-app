-- FreshLocal Seed Data
-- Run this in the Supabase SQL Editor to populate sample data
-- This script is idempotent — safe to run multiple times

-- =============================================================================
-- CREATE TEST USERS IN auth.users (required for FK to profiles)
-- =============================================================================
-- Password for all test accounts: 'testpass123'
-- bcrypt hash of 'testpass123'

INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'customer@freshlocal.test', crypt('testpass123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Aisha Khan"}', NOW(), NOW(), 'authenticated', 'authenticated', ''),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'ammis@freshlocal.test', crypt('testpass123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Fatima Begum"}', NOW(), NOW(), 'authenticated', 'authenticated', ''),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000', 'dhaka@freshlocal.test', crypt('testpass123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Rahim Ahmed"}', NOW(), NOW(), 'authenticated', 'authenticated', ''),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000000', 'grill@freshlocal.test', crypt('testpass123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Hassan Ali"}', NOW(), NOW(), 'authenticated', 'authenticated', ''),
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000000', 'falafel@freshlocal.test', crypt('testpass123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Omar Khalil"}', NOW(), NOW(), 'authenticated', 'authenticated', ''),
  ('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000000', 'naan@freshlocal.test', crypt('testpass123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Priya Sharma"}', NOW(), NOW(), 'authenticated', 'authenticated', '')
ON CONFLICT (id) DO NOTHING;

-- Also insert into auth.identities (required by Supabase Auth)
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '{"sub":"00000000-0000-0000-0000-000000000001","email":"customer@freshlocal.test"}', 'email', NOW(), NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011', '{"sub":"00000000-0000-0000-0000-000000000011","email":"ammis@freshlocal.test"}', 'email', NOW(), NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000012', '{"sub":"00000000-0000-0000-0000-000000000012","email":"dhaka@freshlocal.test"}', 'email', NOW(), NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000013', '{"sub":"00000000-0000-0000-0000-000000000013","email":"grill@freshlocal.test"}', 'email', NOW(), NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000014', '{"sub":"00000000-0000-0000-0000-000000000014","email":"falafel@freshlocal.test"}', 'email', NOW(), NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000015', '{"sub":"00000000-0000-0000-0000-000000000015","email":"naan@freshlocal.test"}', 'email', NOW(), NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =============================================================================
-- PROFILES (the trigger should create these, but insert explicitly as backup)
-- =============================================================================

INSERT INTO profiles (id, email, phone, name, postcode, is_vendor, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'customer@freshlocal.test', '+447700900000', 'Aisha Khan', 'BB1 1AA', false, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000011', 'ammis@freshlocal.test', '+447700900001', 'Fatima Begum', 'BB1 2AB', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000012', 'dhaka@freshlocal.test', '+447700900002', 'Rahim Ahmed', 'BB1 3CD', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000013', 'grill@freshlocal.test', '+447700900003', 'Hassan Ali', 'BB1 4EF', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000014', 'falafel@freshlocal.test', '+447700900004', 'Omar Khalil', 'BB1 5GH', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000015', 'naan@freshlocal.test', '+447700900005', 'Priya Sharma', 'BB1 6IJ', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  phone = EXCLUDED.phone,
  name = EXCLUDED.name,
  postcode = EXCLUDED.postcode,
  is_vendor = EXCLUDED.is_vendor;

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
-- MEALS (uses dynamic dates so they always show as today/tomorrow)
-- =============================================================================

DO $$
DECLARE
  today DATE := CURRENT_DATE;
  tomorrow DATE := CURRENT_DATE + INTERVAL '1 day';
  day_after DATE := CURRENT_DATE + INTERVAL '2 days';
BEGIN

-- Clear existing seed meals to avoid duplicates
DELETE FROM order_items WHERE meal_id IN (SELECT id FROM meals WHERE vendor_id IN (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000103',
  '00000000-0000-0000-0000-000000000104',
  '00000000-0000-0000-0000-000000000105'
));
DELETE FROM meals WHERE vendor_id IN (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000103',
  '00000000-0000-0000-0000-000000000104',
  '00000000-0000-0000-0000-000000000105'
);

-- ===================== Ammi's Kitchen =====================
INSERT INTO meals (vendor_id, name, description, emoji, price, dietary, spice_level, stock, max_stock, fulfilment_type, prep_time, available_date, available_from, available_to, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'Chicken Biryani',
   'Fragrant basmati rice with tender chicken, aromatic spices, and crispy onions. Served with raita.',
   '🍚', 899, ARRAY['halal']::dietary_badge[], '2', 12, 20, 'both', 30, today, '11:00', '21:00', true),

  ('00000000-0000-0000-0000-000000000101', 'Lamb Karahi',
   'Tender lamb cooked in a wok with tomatoes, green chilies, and fresh ginger. Served with naan.',
   '🍖', 1099, ARRAY['halal']::dietary_badge[], '3', 8, 15, 'collection', 45, today, '12:00', '20:00', true),

  ('00000000-0000-0000-0000-000000000101', 'Daal Chawal',
   'Creamy yellow lentils slow-cooked with cumin and garlic. Served with basmati rice.',
   '🥣', 599, ARRAY['halal', 'vegetarian']::dietary_badge[], '1', 15, 25, 'both', 20, today, '11:00', '21:00', true),

  ('00000000-0000-0000-0000-000000000101', 'Nihari Special',
   'Slow-cooked beef shank in rich spiced gravy. Traditional Sunday special.',
   '🥩', 1299, ARRAY['halal']::dietary_badge[], '2', 10, 15, 'collection', 35, tomorrow, '11:00', '20:00', true),

  ('00000000-0000-0000-0000-000000000101', 'Haleem',
   'Rich slow-cooked wheat and meat stew, garnished with ginger, lemon, and green chillies.',
   '🫕', 899, ARRAY['halal']::dietary_badge[], '2', 10, 20, 'both', 25, tomorrow, '12:00', '21:00', true);

-- ===================== Dhaka Delights =====================
INSERT INTO meals (vendor_id, name, description, emoji, price, dietary, spice_level, stock, max_stock, fulfilment_type, prep_time, available_date, available_from, available_to, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000102', 'Kacchi Biryani',
   'Traditional Dhaka-style dum biryani with marinated mutton and potatoes.',
   '🥘', 1199, ARRAY['halal']::dietary_badge[], '2', 6, 10, 'both', 40, today, '12:00', '21:00', true),

  ('00000000-0000-0000-0000-000000000102', 'Beef Tehari',
   'Aromatic rice dish cooked with tender beef pieces and whole spices. A Dhaka classic.',
   '🍛', 999, ARRAY['halal']::dietary_badge[], '2', 10, 15, 'both', 35, today, '12:00', '21:00', true),

  ('00000000-0000-0000-0000-000000000102', 'Panta Ilish',
   'Fermented rice with smoked hilsa fish, mustard paste, and green chillies.',
   '🐟', 1399, ARRAY['halal']::dietary_badge[], '1', 5, 8, 'collection', 30, today, '11:00', '15:00', true),

  ('00000000-0000-0000-0000-000000000102', 'Fish Curry',
   'Fresh rohu fish in Bengali mustard curry with steamed rice.',
   '🐟', 999, ARRAY['halal']::dietary_badge[], '2', 8, 12, 'both', 30, tomorrow, '12:00', '20:00', true);

-- ===================== Grill Master =====================
INSERT INTO meals (vendor_id, name, description, emoji, price, dietary, spice_level, stock, max_stock, fulfilment_type, prep_time, available_date, available_from, available_to, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000103', 'Smash Burger Meal',
   'Double smashed beef patties, American cheese, special sauce. With loaded fries.',
   '🍔', 999, ARRAY['halal']::dietary_badge[], '0', 15, 25, 'both', 20, today, '12:00', '22:00', true),

  ('00000000-0000-0000-0000-000000000103', 'Chicken Wings (10)',
   'Crispy fried wings with your choice of sauce: Buffalo, BBQ, or Peri Peri.',
   '🍗', 849, ARRAY['halal']::dietary_badge[], '2', 18, 20, 'both', 25, today, '12:00', '22:00', true),

  ('00000000-0000-0000-0000-000000000103', 'Lamb Seekh Kebab Wrap',
   'Charcoal grilled lamb seekh kebabs in a warm naan with salad and chilli sauce.',
   '🌯', 899, ARRAY['halal']::dietary_badge[], '2', 12, 20, 'both', 20, today, '12:00', '22:00', true),

  ('00000000-0000-0000-0000-000000000103', 'Loaded Fries',
   'Crispy fries loaded with cheese, jalapenos, and your choice of chicken or lamb.',
   '🍟', 699, ARRAY['halal']::dietary_badge[], '1', 20, 30, 'both', 15, today, '12:00', '22:00', true),

  ('00000000-0000-0000-0000-000000000103', 'Ribeye Steak Meal',
   'Premium halal ribeye steak cooked to your liking. Served with fries and coleslaw.',
   '🥩', 1699, ARRAY['halal']::dietary_badge[], '0', 6, 10, 'collection', 30, tomorrow, '17:00', '22:00', true);

-- ===================== Falafel House =====================
INSERT INTO meals (vendor_id, name, description, emoji, price, dietary, spice_level, stock, max_stock, fulfilment_type, prep_time, available_date, available_from, available_to, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000104', 'Falafel Wrap',
   'Crispy falafel, fresh salad, pickles, and tahini in warm pita bread.',
   '🌯', 749, ARRAY['halal', 'vegetarian', 'vegan']::dietary_badge[], '1', 20, 30, 'both', 15, today, '11:00', '21:00', true),

  ('00000000-0000-0000-0000-000000000104', 'Chicken Shawarma',
   'Marinated chicken carved from the spit, with garlic sauce and pickled turnips.',
   '🥙', 899, ARRAY['halal']::dietary_badge[], '1', 15, 20, 'both', 15, today, '11:00', '21:00', true),

  ('00000000-0000-0000-0000-000000000104', 'Hummus & Falafel Plate',
   'Creamy hummus topped with warm falafel, olive oil, and paprika. Served with pita.',
   '🫓', 799, ARRAY['halal', 'vegetarian', 'vegan']::dietary_badge[], '0', 15, 20, 'both', 10, today, '11:00', '21:00', true),

  ('00000000-0000-0000-0000-000000000104', 'Mezze Platter',
   'Hummus, baba ganoush, muhammara, with warm pita and olives. Serves 2.',
   '🫒', 1299, ARRAY['halal', 'vegetarian', 'vegan']::dietary_badge[], '0', 10, 15, 'both', 20, tomorrow, '11:00', '21:00', true),

  ('00000000-0000-0000-0000-000000000104', 'Lamb Kofta Plate',
   'Spiced lamb kofta with rice, salad, and tahini dressing.',
   '🍖', 1099, ARRAY['halal']::dietary_badge[], '2', 10, 15, 'both', 25, tomorrow, '11:00', '21:00', true);

-- ===================== Naan Stop Bakery =====================
INSERT INTO meals (vendor_id, name, description, emoji, price, dietary, spice_level, stock, max_stock, fulfilment_type, prep_time, available_date, available_from, available_to, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000105', 'Samosa Pack (6)',
   'Crispy vegetable samosas with mint chutney and tamarind sauce.',
   '🥟', 499, ARRAY['halal', 'vegetarian']::dietary_badge[], '1', 25, 40, 'collection', 10, today, '10:00', '20:00', true),

  ('00000000-0000-0000-0000-000000000105', 'Garlic Naan (4)',
   'Freshly baked garlic naans, brushed with butter and coriander.',
   '🫓', 399, ARRAY['halal', 'vegetarian']::dietary_badge[], '0', 30, 50, 'collection', 15, today, '10:00', '20:00', true),

  ('00000000-0000-0000-0000-000000000105', 'Chicken Paratha Roll',
   'Flaky paratha stuffed with spiced chicken tikka, onions, and chutney.',
   '🌯', 649, ARRAY['halal']::dietary_badge[], '2', 15, 25, 'collection', 15, today, '10:00', '20:00', true),

  ('00000000-0000-0000-0000-000000000105', 'Pakora Box',
   'Mixed vegetable pakoras with yoghurt dip. Onion bhaji, potato, and spinach.',
   '🧆', 449, ARRAY['halal', 'vegetarian']::dietary_badge[], '1', 20, 30, 'collection', 10, today, '10:00', '20:00', true),

  ('00000000-0000-0000-0000-000000000105', 'Keema Naan (2)',
   'Naan stuffed with spiced lamb mince, fresh from the tandoor.',
   '🫓', 549, ARRAY['halal']::dietary_badge[], '2', 15, 20, 'collection', 20, tomorrow, '10:00', '20:00', true);

END $$;

-- =============================================================================
-- SAVED ADDRESSES (for test customer)
-- =============================================================================

INSERT INTO saved_addresses (user_id, label, line1, line2, city, postcode, is_default)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Home', '123 Test Street', 'Flat 4B', 'Blackburn', 'BB1 1AA', true),
  ('00000000-0000-0000-0000-000000000001', 'Work', '456 Office Road', NULL, 'Blackburn', 'BB1 2BB', false)
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

SELECT 'Profiles:' AS info, COUNT(*) AS count FROM profiles;
SELECT 'Vendors:' AS info, COUNT(*) AS count FROM vendors;
SELECT 'Meals (today):' AS info, COUNT(*) AS count FROM meals WHERE available_date = CURRENT_DATE;
SELECT 'Meals (tomorrow):' AS info, COUNT(*) AS count FROM meals WHERE available_date = CURRENT_DATE + 1;

SELECT
  m.name AS meal,
  m.price / 100.0 AS price_gbp,
  m.dietary,
  v.business_name AS vendor,
  m.available_date
FROM meals m
JOIN vendors v ON v.id = m.vendor_id
ORDER BY m.available_date, v.business_name, m.name;
