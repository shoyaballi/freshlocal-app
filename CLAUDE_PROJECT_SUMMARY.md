# FreshLocal - Project Summary

> Hyperlocal halal food marketplace connecting home cooks with their community.
> Built with Expo (React Native) + Supabase + Stripe.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo SDK 54, React Native |
| Router | Expo Router v6 (file-based) |
| Backend | Supabase (Postgres, Auth, Realtime, Storage) |
| Payments | Stripe Connect (vendor payouts) + Payment Sheet (customer payments) |
| Animations | React Native Reanimated v4 |
| State | Zustand (persisted) |
| Styling | StyleSheet + custom theme tokens |

## Project Structure

```
freshlocal/
├── app/                      # Expo Router screens
│   ├── (tabs)/               # Tab navigator
│   │   ├── index.tsx         # Home - meal discovery
│   │   ├── browse.tsx        # Browse by vendor
│   │   ├── favourites.tsx    # Saved meals
│   │   ├── profile.tsx       # User profile & settings
│   │   └── dashboard.tsx     # Vendor dashboard
│   ├── auth/                 # Auth screens
│   ├── vendor/               # Vendor signup flow
│   ├── onboarding/           # Onboarding screens
│   └── order/[id].tsx        # Order tracking (dynamic)
├── components/
│   ├── ui/                   # Reusable UI (Button, Card, Input, BottomSheet, etc.)
│   ├── meals/                # MealCard, MealGrid
│   ├── orders/               # OrderCard, AnimatedTimeline
│   ├── order-flow/           # Checkout bottom sheet & steps
│   ├── vendor/               # AddMealSheet
│   ├── layout/               # Header, TabBar
│   └── auth/                 # ProtectedRoute
├── hooks/                    # Custom hooks
│   ├── useAuth.ts            # Auth state & actions
│   ├── useMeals.ts           # Fetch meals with filters
│   ├── useOrders.ts          # Customer orders
│   ├── useVendors.ts         # Vendor listings
│   ├── useVendorOrders.ts    # Vendor order management
│   ├── useVendorOrderSubscription.ts  # Realtime for vendors
│   ├── useOrderSubscription.ts        # Realtime for customers
│   ├── useNotifications.ts   # Push notification handling
│   ├── useCreateOrder.ts     # Order creation flow
│   ├── useAddresses.ts       # Saved addresses
│   ├── useStripeConnect.ts   # Vendor Stripe onboarding
│   └── useStripePayment.ts   # Customer payment sheet
├── services/
│   ├── notificationService.ts  # Push notifications (expo-notifications)
│   └── imageService.ts         # Image picker & Supabase Storage upload
├── stores/
│   └── appStore.ts           # Zustand store (user, vendor, prefs)
├── lib/
│   └── supabase.ts           # Supabase client
├── constants/
│   └── theme.ts              # Colors, fonts, spacing, etc.
├── types/
│   └── index.ts              # TypeScript interfaces
└── supabase/
    └── migrations/           # SQL migrations
```

## Database Schema (Supabase)

### Tables
- **profiles** - User profiles (extends auth.users), includes `push_token`
- **vendors** - Vendor businesses, includes Stripe Connect fields
- **meals** - Available meals with `image_url`, dietary info, stock
- **orders** - Customer orders with status tracking
- **order_items** - Line items for orders
- **addresses** - Saved delivery addresses
- **notifications** - In-app notification storage

### Key Columns Added Recently
```sql
-- profiles
push_token TEXT
push_token_updated_at TIMESTAMPTZ

-- meals
image_url TEXT

-- vendors (Stripe Connect)
stripe_account_id TEXT
stripe_charges_enabled BOOLEAN
stripe_payouts_enabled BOOLEAN
stripe_onboarding_complete BOOLEAN

-- orders (Stripe)
payment_status TEXT
stripe_payment_intent_id TEXT
```

### Storage Buckets
- **meal-images** - Public bucket for meal photos (per-vendor folders)

## Features Implemented

### Customer Features
- [x] Meal discovery with date picker (schedule view)
- [x] Dietary filtering (halal, vegetarian, vegan, gluten-free)
- [x] Vendor profiles with meal listings
- [x] Favourites (local storage)
- [x] Order flow with bottom sheet checkout
- [x] Collection/delivery selection with time slots
- [x] Stripe payment integration
- [x] Real-time order tracking with animated timeline
- [x] Push notifications for order status updates
- [x] Order history in profile

### Vendor Features
- [x] Vendor signup & onboarding
- [x] Stripe Connect onboarding for payouts
- [x] Dashboard with Orders/Menu/Earnings tabs
- [x] Real-time new order alerts
- [x] Order status management (confirm → preparing → ready → collected)
- [x] Add meal form with image upload
- [x] Stock tracking
- [x] Earnings breakdown (gross, platform fee, Stripe fee, net)

### Technical Features
- [x] Supabase Auth (email/password)
- [x] Supabase Realtime subscriptions
- [x] Supabase Storage for images
- [x] Optimized image URLs with transformations
- [x] Animated UI with Reanimated v4
- [x] Protected routes
- [x] Persisted Zustand store

## Commission Model

```
Customer pays:    Order total + 5% service fee
Vendor receives:  Order total - 12% platform fee - Stripe fees (1.4% + 20p)
```

## Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_pk
```

## Known TypeScript Errors (Pre-existing)

5 minor type errors in hooks related to vendor/user optional fields:
- `useMeals.ts:80` - vendor might be undefined
- `useOrders.ts:80` - vendor might be undefined
- `useVendorOrders.ts:5,89` - user type mismatch
- `dashboard.tsx:123` - void expression

These don't affect runtime - just stricter type checking needed.

## Recent Commits

```
c1d5d14 Add real-time order tracking, push notifications, and meal image uploads
56bab94 Add Stripe Connect integration for vendor payouts and customer payments
b9f6263 Add complete order flow with bottom sheet and real-time vendor updates
32e7a5e Wire up Supabase auth flow and replace mock data with real queries
44e23fa Add Supabase schema and fix UI formatting
```

## Pending Migrations

Run these in Supabase SQL editor if not already applied:
1. `20240221000000_add_push_token.sql` - Push token column
2. `20240222000000_add_meal_images.sql` - Image URL column + storage bucket

## Next Steps / Ideas

- [ ] Edit meal functionality (currently just logs)
- [ ] Delete meal
- [ ] Vendor profile editing
- [ ] Customer reviews & ratings
- [ ] Search functionality
- [ ] Delivery tracking with map
- [ ] Promo codes / discounts
- [ ] Analytics dashboard for vendors
- [ ] Email notifications
- [ ] Order cancellation flow

## Running the Project

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start Expo
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

## Key Files to Know

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root layout, providers, auth & notification init |
| `components/order-flow/OrderBottomSheet.tsx` | Checkout flow coordinator |
| `hooks/useAuth.ts` | Auth state management |
| `stores/appStore.ts` | Global app state |
| `constants/theme.ts` | Design tokens |
| `types/index.ts` | All TypeScript interfaces |

---

*Last updated: February 2024*
*Built with Claude Code*
