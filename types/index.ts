// User types
export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  avatar?: string;
  postcode?: string;
  isVendor: boolean;
  createdAt: string;
  updatedAt: string;
}

// Vendor types
export type BusinessType = 'home_kitchen' | 'shop' | 'popup';
export type FoodTag =
  | 'halal'
  | 'vegetarian'
  | 'pakistani'
  | 'bangladeshi'
  | 'indian'
  | 'middle_eastern'
  | 'grill'
  | 'street_food'
  | 'bakery';

export interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  handle: string;
  description: string;
  businessType: BusinessType;
  avatar: string;
  coverImage?: string;
  tags: FoodTag[];
  phone: string;
  postcode: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isActive: boolean;
  // Stripe Connect fields
  stripeAccountId?: string;
  stripeChargesEnabled?: boolean;
  stripePayoutsEnabled?: boolean;
  stripeOnboardingComplete?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Meal types
export type DietaryBadge = 'halal' | 'vegetarian' | 'vegan' | 'gluten_free';
export type SpiceLevel = 0 | 1 | 2 | 3;
export type FulfilmentType = 'collection' | 'delivery' | 'both';

export interface Meal {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  emoji: string;
  price: number;
  originalPrice?: number;
  dietary: DietaryBadge[];
  spiceLevel: SpiceLevel;
  stock: number;
  maxStock: number;
  fulfilmentType: FulfilmentType;
  prepTime: number;
  availableDate: string;
  availableFrom?: string;
  availableTo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  vendor?: Vendor;
}

// Order types
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'collected'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id: string;
  orderId: string;
  mealId: string;
  mealName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  meal?: Meal;
}

export interface Order {
  id: string;
  userId: string;
  vendorId: string;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  stripePaymentIntentId?: string;
  fulfilmentType: FulfilmentType;
  items: OrderItem[];
  subtotal: number;
  serviceFee: number;
  deliveryFee?: number;
  total: number;
  collectionTime?: string;
  deliveryAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  vendor?: Vendor;
  user?: User;
}

// Commission model
export interface CommissionBreakdown {
  grossAmount: number;
  platformFee: number; // 12%
  serviceFee: number; // 5% from customer
  stripeFee: number; // 1.4% + 20p
  netPayout: number;
}

// Schedule types
export interface ScheduleDay {
  date: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  hasMeals: boolean;
  mealCount: number;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'order' | 'promo' | 'system';
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

// Address types
export interface Address {
  id: string;
  userId: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  isDefault: boolean;
  createdAt: string;
}

// Payment types
export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'card' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: string;
}

// App state types
export interface AppState {
  isVendor: boolean;
  hasOnboarded: boolean;
  postcode: string | null;
  favourites: string[];
  dietaryFilters: DietaryBadge[];
}

// Auth types
export interface AuthState {
  user: User | null;
  session: unknown;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Onboarding screen data
export interface OnboardingScreen {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

// Vendor signup form
export interface VendorSignupForm {
  businessName: string;
  handle: string;
  description: string;
  businessType: BusinessType;
  tags: FoodTag[];
  phone: string;
  postcode: string;
  acceptedTerms: boolean;
}

// Stripe Connect status
export interface StripeConnectStatus {
  stripeAccountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onboardingComplete: boolean;
}

// Stripe Payment Sheet parameters
export interface PaymentSheetParams {
  paymentIntent: string;
  ephemeralKey: string;
  customer: string;
}
