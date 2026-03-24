/**
 * Seed script for FreshLocal test data.
 *
 * Creates test auth users, profiles, vendors, and sample meals.
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.
 *
 * Usage:
 *   SUPABASE_URL=https://sylmtrlrhrguslokzmfn.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key> \
 *   npx tsx scripts/seed-test-data.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_PASSWORD = 'Test1234!';

interface TestUser {
  email: string;
  name: string;
  role: 'customer' | 'vendor' | 'admin';
  isVendor: boolean;
}

const TEST_USERS: TestUser[] = [
  { email: 'admin@freshlocal.test', name: 'Admin User', role: 'admin', isVendor: false },
  { email: 'customer@freshlocal.test', name: 'Ali Khan', role: 'customer', isVendor: false },
  { email: 'sarah@freshlocal.test', name: 'Sarah Ahmed', role: 'customer', isVendor: false },
  { email: 'vendor1@freshlocal.test', name: 'Fatima Begum', role: 'vendor', isVendor: true },
  { email: 'vendor2@freshlocal.test', name: 'Tariq Hassan', role: 'vendor', isVendor: true },
];

async function createUser(user: TestUser): Promise<string> {
  // Check if user already exists
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email === user.email);
  if (found) {
    console.log(`  User ${user.email} already exists (${found.id})`);
    return found.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { name: user.name },
  });

  if (error) throw new Error(`Failed to create ${user.email}: ${error.message}`);
  console.log(`  Created user ${user.email} (${data.user.id})`);
  return data.user.id;
}

async function upsertProfile(userId: string, user: TestUser) {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    email: user.email,
    name: user.name,
    role: user.role,
    is_vendor: user.isVendor,
  });
  if (error) throw new Error(`Failed to upsert profile for ${user.email}: ${error.message}`);
}

async function main() {
  console.log('Seeding FreshLocal test data...\n');

  // 1. Create auth users + profiles
  console.log('Creating users...');
  const userIds: Record<string, string> = {};

  for (const user of TEST_USERS) {
    const id = await createUser(user);
    userIds[user.email] = id;
    await upsertProfile(id, user);
  }
  console.log('');

  // 2. Create vendors
  console.log('Creating vendors...');

  const vendor1Id = userIds['vendor1@freshlocal.test'];
  const vendor2Id = userIds['vendor2@freshlocal.test'];

  // Vendor 1 — approved
  const { data: v1, error: v1Err } = await supabase
    .from('vendors')
    .upsert(
      {
        user_id: vendor1Id,
        business_name: "Mama Fatima's Kitchen",
        handle: 'mamafatima',
        description:
          'Authentic Pakistani home cooking made with love. Family recipes passed down through generations.',
        business_type: 'home_kitchen',
        tags: ['halal', 'pakistani'],
        phone: '+447700900001',
        postcode: 'BB1 1AA',
        is_active: true,
        is_verified: false,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (v1Err) throw new Error(`Vendor 1 insert failed: ${v1Err.message}`);
  console.log(`  Vendor 1: ${v1.business_name} (${v1.id}) — active`);

  // Vendor 2 — pending
  const { data: v2, error: v2Err } = await supabase
    .from('vendors')
    .upsert(
      {
        user_id: vendor2Id,
        business_name: 'Spice Route Grill',
        handle: 'spiceroute',
        description:
          'Flame-grilled Middle Eastern street food. Shawarma, kebabs, and more from our pop-up kitchen.',
        business_type: 'popup',
        tags: ['halal', 'middle_eastern', 'grill', 'street_food'],
        phone: '+447700900002',
        postcode: 'E1 6AN',
        is_active: false,
        is_verified: false,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (v2Err) throw new Error(`Vendor 2 insert failed: ${v2Err.message}`);
  console.log(`  Vendor 2: ${v2.business_name} (${v2.id}) — pending`);
  console.log('');

  // 3. Create sample meals for Vendor 1
  console.log('Creating meals for Vendor 1...');

  const today = new Date().toISOString().split('T')[0];

  const meals = [
    {
      vendor_id: v1.id,
      name: 'Lamb Biryani',
      description:
        'Fragrant basmati rice layered with tender slow-cooked lamb, caramelised onions, and aromatic spices. Served with raita.',
      emoji: '🍛',
      price: 899, // pence
      dietary: ['halal'],
      allergens: ['dairy'],
      spice_level: '1',
      stock: 15,
      max_stock: 20,
      fulfilment_type: 'both',
      prep_time: 25,
      available_date: today,
      available_from: '11:00',
      available_to: '21:00',
      is_active: true,
    },
    {
      vendor_id: v1.id,
      name: 'Chicken Shawarma Wrap',
      description:
        'Marinated chicken thigh wrapped in fresh naan with pickled turnips, garlic sauce, and salad.',
      emoji: '🌯',
      price: 650,
      dietary: ['halal'],
      allergens: ['gluten', 'dairy'],
      spice_level: '2',
      stock: 20,
      max_stock: 25,
      fulfilment_type: 'both',
      prep_time: 15,
      available_date: today,
      available_from: '11:00',
      available_to: '22:00',
      is_active: true,
    },
    {
      vendor_id: v1.id,
      name: 'Falafel Platter',
      description:
        'Crispy hand-formed falafel with hummus, tabbouleh, pickles, and warm pitta bread.',
      emoji: '🧆',
      price: 750,
      dietary: ['halal', 'vegan'],
      allergens: ['gluten', 'sesame'],
      spice_level: '0',
      stock: 12,
      max_stock: 15,
      fulfilment_type: 'collection',
      prep_time: 20,
      available_date: today,
      available_from: '11:00',
      available_to: '20:00',
      is_active: true,
    },
    {
      vendor_id: v1.id,
      name: 'Kunafa',
      description:
        'Golden crispy shredded pastry filled with sweet cheese and soaked in orange blossom syrup. A classic Middle Eastern dessert.',
      emoji: '🍮',
      price: 499,
      dietary: ['halal', 'vegetarian'],
      allergens: ['dairy', 'gluten', 'nuts'],
      spice_level: '0',
      stock: 10,
      max_stock: 10,
      fulfilment_type: 'both',
      prep_time: 10,
      available_date: today,
      available_from: '12:00',
      available_to: '21:00',
      is_active: true,
    },
  ];

  for (const meal of meals) {
    const { error } = await supabase.from('meals').upsert(meal, {
      onConflict: 'vendor_id,name',
      ignoreDuplicates: true,
    });
    if (error) {
      // If upsert fails (no unique constraint on vendor_id+name), try insert
      const { error: insertErr } = await supabase.from('meals').insert(meal);
      if (insertErr && !insertErr.message.includes('duplicate')) {
        console.error(`  Failed to insert ${meal.name}: ${insertErr.message}`);
        continue;
      }
    }
    console.log(`  ${meal.emoji} ${meal.name} — £${(meal.price / 100).toFixed(2)}`);
  }

  // 4. Notify admin about the pending vendor
  console.log('\nCreating admin notification for pending vendor...');
  const adminId = userIds['admin@freshlocal.test'];
  await supabase.from('notifications').insert({
    user_id: adminId,
    title: 'New Vendor Application',
    body: `${v2.business_name} has applied to join as a vendor.`,
    type: 'system',
    data: { screen: '/admin/vendors', vendorId: v2.id },
  });
  console.log('  Notification created for admin');

  console.log('\n--- Seed complete ---');
  console.log('\nTest accounts:');
  console.log('  Admin:     admin@freshlocal.test / Test1234!');
  console.log('  Customer:  customer@freshlocal.test / Test1234!');
  console.log('  Customer:  sarah@freshlocal.test / Test1234!');
  console.log('  Vendor 1:  vendor1@freshlocal.test / Test1234! (approved)');
  console.log('  Vendor 2:  vendor2@freshlocal.test / Test1234! (pending)');
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
