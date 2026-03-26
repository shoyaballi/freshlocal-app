import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { stripe } from '../_shared/stripe.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';
import { getAuthUser, isAdmin } from '../_shared/auth.ts';

interface RequestBody {
  orderId: string;
  reason?: string;
  amount?: number; // Optional — omit for full refund. In pence.
}

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' };

  try {
    // --- Auth check: verify JWT and admin role ---
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorised: missing or invalid token' }),
        { status: 401, headers }
      );
    }

    const userIsAdmin = await isAdmin(authUser.id);
    if (!userIsAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorised: admin access required' }),
        { status: 401, headers }
      );
    }

    const { orderId, reason, amount }: RequestBody = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: orderId' }),
        { status: 400, headers }
      );
    }

    // Look up the order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, total, status, payment_status, stripe_payment_intent_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers }
      );
    }

    // Validate refund is possible
    if (!order.stripe_payment_intent_id) {
      return new Response(
        JSON.stringify({ error: 'Order has no associated payment intent' }),
        { status: 400, headers }
      );
    }

    if (order.payment_status === 'refunded') {
      return new Response(
        JSON.stringify({ error: 'Order has already been refunded' }),
        { status: 400, headers }
      );
    }

    if (order.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ error: `Cannot refund order with payment status: ${order.payment_status}` }),
        { status: 400, headers }
      );
    }

    // Validate partial refund amount if provided
    if (amount !== undefined && amount !== null) {
      if (amount <= 0) {
        return new Response(
          JSON.stringify({ error: 'Refund amount must be greater than zero' }),
          { status: 400, headers }
        );
      }
      if (amount > order.total) {
        return new Response(
          JSON.stringify({ error: 'Refund amount cannot exceed order total' }),
          { status: 400, headers }
        );
      }
    }

    // Build Stripe refund params
    const refundParams: Record<string, unknown> = {
      payment_intent: order.stripe_payment_intent_id,
      metadata: {
        order_id: orderId,
        reason: reason || 'Admin refund',
        refunded_by: authUser.id,
      },
    };

    // If amount is provided, do a partial refund; otherwise full refund
    if (amount !== undefined && amount !== null) {
      refundParams.amount = amount;
    }

    // Call Stripe refund API
    const refund = await stripe.refunds.create(refundParams);

    const isFullRefund = !amount || amount === order.total;

    // Update order in database
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'refunded',
        status: isFullRefund ? 'cancelled' : order.status,
        refund_reason: reason || null,
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order after refund:', updateError);
      // The Stripe refund succeeded but DB update failed — log but still return success
      // so the admin knows the refund went through
      return new Response(
        JSON.stringify({
          success: true,
          warning: 'Refund processed on Stripe but failed to update order record',
          refundId: refund.id,
          refundStatus: refund.status,
        }),
        { status: 200, headers }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        refundId: refund.id,
        refundStatus: refund.status,
        refundAmount: refund.amount,
        isFullRefund,
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Error processing refund:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
