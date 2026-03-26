import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { stripe } from '../_shared/stripe.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';
import { getAuthUser, isVendorOwner } from '../_shared/auth.ts';

interface RequestBody {
  vendorId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' };

  try {
    // --- Auth check: verify JWT and vendor ownership ---
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorised: missing or invalid token' }),
        { status: 401, headers }
      );
    }

    const { vendorId }: RequestBody = await req.json();

    if (!vendorId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: vendorId' }),
        { status: 400, headers }
      );
    }

    // Verify the authenticated user owns this vendor
    const ownsVendor = await isVendorOwner(authUser.id, vendorId);
    if (!ownsVendor) {
      return new Response(
        JSON.stringify({ error: 'Unauthorised: you do not own this vendor' }),
        { status: 401, headers }
      );
    }

    // Get vendor's Stripe account ID
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from('vendors')
      .select('stripe_account_id')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      return new Response(
        JSON.stringify({ error: 'Vendor not found' }),
        { status: 404, headers }
      );
    }

    if (!vendor.stripe_account_id) {
      return new Response(
        JSON.stringify({ error: 'Vendor does not have a Stripe account. Create one first.' }),
        { status: 400, headers }
      );
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: vendor.stripe_account_id,
      refresh_url: 'freshlocal://vendor/onboarding-refresh',
      return_url: 'freshlocal://vendor/onboarding-complete',
      type: 'account_onboarding',
    });

    return new Response(
      JSON.stringify({
        url: accountLink.url,
        expiresAt: accountLink.expires_at,
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Error creating account link:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
