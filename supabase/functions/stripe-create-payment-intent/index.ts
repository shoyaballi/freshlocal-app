import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { stripe } from '../_shared/stripe.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';

interface RequestBody {
  orderId: string;
  userId: string;
}

// Fee structure (same as in the app)
const PLATFORM_FEE_PERCENT = 0.12; // 12%
const SERVICE_FEE_PERCENT = 0.05; // 5%

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { orderId, userId }: RequestBody = await req.json();

    if (!orderId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: orderId, userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get order with vendor info
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        vendor:vendors(
          id,
          stripe_account_id,
          stripe_charges_enabled
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!order.vendor?.stripe_account_id) {
      return new Response(
        JSON.stringify({ error: 'Vendor has not completed Stripe setup' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!order.vendor?.stripe_charges_enabled) {
      return new Response(
        JSON.stringify({ error: 'Vendor cannot accept payments yet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile for Stripe customer
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, full_name, email')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or create Stripe customer
    let customerId = profile.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.full_name,
        metadata: {
          user_id: userId,
        },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Create ephemeral key for Payment Sheet
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2024-12-18.acacia' }
    );

    // Calculate fees (amounts are in pence from database)
    const subtotal = order.subtotal; // Already in pence
    const serviceFee = order.service_fee; // Already in pence
    const deliveryFee = order.delivery_fee || 0;
    const total = order.total; // Already in pence

    // Application fee = service fee + platform fee
    // Service fee goes to platform, platform fee is additional
    const platformFee = Math.round(subtotal * PLATFORM_FEE_PERCENT);
    const applicationFee = serviceFee + platformFee;

    // Create PaymentIntent with split
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'gbp',
      customer: customerId,
      application_fee_amount: applicationFee,
      transfer_data: {
        destination: order.vendor.stripe_account_id,
      },
      metadata: {
        order_id: orderId,
        vendor_id: order.vendor_id,
        user_id: userId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update order with payment intent ID
    await supabaseAdmin
      .from('orders')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', orderId);

    return new Response(
      JSON.stringify({
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customerId,
        publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY'),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
