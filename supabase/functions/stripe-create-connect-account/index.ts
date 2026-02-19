import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { stripe } from '../_shared/stripe.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';

interface RequestBody {
  vendorId: string;
  businessName: string;
  email: string;
}

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { vendorId, businessName, email }: RequestBody = await req.json();

    if (!vendorId || !businessName || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: vendorId, businessName, email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if vendor already has a Stripe account
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from('vendors')
      .select('stripe_account_id')
      .eq('id', vendorId)
      .single();

    if (vendorError) {
      return new Response(
        JSON.stringify({ error: 'Vendor not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (vendor.stripe_account_id) {
      return new Response(
        JSON.stringify({
          accountId: vendor.stripe_account_id,
          message: 'Vendor already has a Stripe account'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'GB',
      email: email,
      business_type: 'individual',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: businessName,
        mcc: '5812', // Eating places, restaurants
        url: `https://freshlocal.app/vendors/${vendorId}`,
      },
      settings: {
        payouts: {
          schedule: {
            delay_days: 'minimum',
            interval: 'weekly',
            weekly_anchor: 'tuesday',
          },
        },
      },
      metadata: {
        vendor_id: vendorId,
      },
    });

    // Update vendor with Stripe account ID
    const { error: updateError } = await supabaseAdmin
      .from('vendors')
      .update({ stripe_account_id: account.id })
      .eq('id', vendorId);

    if (updateError) {
      // Rollback: delete the Stripe account
      await stripe.accounts.del(account.id);
      return new Response(
        JSON.stringify({ error: 'Failed to update vendor record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        accountId: account.id,
        message: 'Stripe account created successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating Stripe account:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
