import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { stripe } from '../_shared/stripe.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const signature = req.headers.get('stripe-signature');

  if (!signature || !webhookSecret) {
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log(`Received event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.order_id;

        if (orderId) {
          // Update order status to confirmed
          const { error } = await supabaseAdmin
            .from('orders')
            .update({
              status: 'confirmed',
              payment_status: 'paid',
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

          if (error) {
            console.error('Error updating order:', error);
          } else {
            console.log(`Order ${orderId} confirmed`);
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.order_id;

        if (orderId) {
          // Update payment status but keep order pending
          const { error } = await supabaseAdmin
            .from('orders')
            .update({
              payment_status: 'failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

          if (error) {
            console.error('Error updating order:', error);
          } else {
            console.log(`Order ${orderId} payment failed`);
          }
        }
        break;
      }

      case 'account.updated': {
        const account = event.data.object;
        const vendorId = account.metadata?.vendor_id;

        if (vendorId) {
          // Update vendor Stripe status
          const { error } = await supabaseAdmin
            .from('vendors')
            .update({
              stripe_charges_enabled: account.charges_enabled,
              stripe_payouts_enabled: account.payouts_enabled,
              stripe_onboarding_complete: account.details_submitted,
            })
            .eq('id', vendorId);

          if (error) {
            console.error('Error updating vendor:', error);
          } else {
            console.log(`Vendor ${vendorId} Stripe status updated`);
          }
        } else {
          // Find vendor by stripe_account_id if metadata is missing
          const { data: vendor, error: findError } = await supabaseAdmin
            .from('vendors')
            .select('id')
            .eq('stripe_account_id', account.id)
            .single();

          if (vendor && !findError) {
            const { error } = await supabaseAdmin
              .from('vendors')
              .update({
                stripe_charges_enabled: account.charges_enabled,
                stripe_payouts_enabled: account.payouts_enabled,
                stripe_onboarding_complete: account.details_submitted,
              })
              .eq('id', vendor.id);

            if (error) {
              console.error('Error updating vendor:', error);
            } else {
              console.log(`Vendor ${vendor.id} Stripe status updated (found by account ID)`);
            }
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Webhook handler failed' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
