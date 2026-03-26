import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';
import { sendEmail } from '../_shared/email.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EmailType = 'confirmation' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

interface RequestBody {
  orderId: string;
  emailType: EmailType;
}

interface OrderRow {
  id: string;
  status: string;
  fulfilment_type: string;
  subtotal: number;
  service_fee: number;
  delivery_fee: number | null;
  total: number;
  collection_time: string | null;
  notes: string | null;
  payment_status: string;
  refund_reason: string | null;
  created_at: string;
  user_id: string;
  vendor: {
    business_name: string;
    postcode: string;
  };
  order_items: Array<{
    meal_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

interface ProfileRow {
  email: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Last 8 chars of UUID, uppercased — matches the app's shortId display. */
function shortId(id: string): string {
  return id.slice(-8).toUpperCase();
}

/** Format pence as £X.XX */
function formatPrice(pence: number): string {
  return `\u00a3${(pence / 100).toFixed(2)}`;
}

/** Format ISO date to a readable string */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Brand colours & shared styles
// ---------------------------------------------------------------------------

const OLIVE = '#3d4a2a';
const SAFFRON = '#d4940a';
const CREAM = '#faf7f2';

function emailWrapper(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${CREAM};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#333;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CREAM};">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e2dc;">
          <!-- Header -->
          <tr>
            <td style="background-color:${OLIVE};padding:24px 32px;text-align:center;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">FreshLocal</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:#f5f2ec;text-align:center;font-size:12px;color:#888;">
              <p style="margin:0;">&copy; ${new Date().getFullYear()} FreshLocal. All rights reserved.</p>
              <p style="margin:6px 0 0;">Hyperlocal halal food, delivered with care.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Order items table snippet
// ---------------------------------------------------------------------------

function orderItemsTable(items: OrderRow['order_items']): string {
  const rows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">${item.meal_name}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${formatPrice(item.total_price)}</td>
        </tr>`
    )
    .join('');

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
    <thead>
      <tr style="border-bottom:2px solid ${OLIVE};">
        <th style="padding:8px 0;text-align:left;font-size:13px;color:#666;">Item</th>
        <th style="padding:8px 0;text-align:center;font-size:13px;color:#666;">Qty</th>
        <th style="padding:8px 0;text-align:right;font-size:13px;color:#666;">Price</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// ---------------------------------------------------------------------------
// Totals snippet
// ---------------------------------------------------------------------------

function totalsBlock(order: OrderRow): string {
  let html = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      <tr>
        <td style="padding:4px 0;font-size:14px;color:#666;">Subtotal</td>
        <td style="padding:4px 0;text-align:right;font-size:14px;">${formatPrice(order.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;font-size:14px;color:#666;">Service fee</td>
        <td style="padding:4px 0;text-align:right;font-size:14px;">${formatPrice(order.service_fee)}</td>
      </tr>`;

  if (order.delivery_fee !== null && order.delivery_fee > 0) {
    html += `
      <tr>
        <td style="padding:4px 0;font-size:14px;color:#666;">Delivery fee</td>
        <td style="padding:4px 0;text-align:right;font-size:14px;">${formatPrice(order.delivery_fee)}</td>
      </tr>`;
  }

  html += `
      <tr>
        <td style="padding:8px 0;font-size:16px;font-weight:700;border-top:2px solid ${OLIVE};">Total</td>
        <td style="padding:8px 0;text-align:right;font-size:16px;font-weight:700;border-top:2px solid ${OLIVE};">${formatPrice(order.total)}</td>
      </tr>
    </table>`;

  return html;
}

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

function confirmationEmail(order: OrderRow, profile: ProfileRow): { subject: string; html: string } {
  const orderCode = shortId(order.id);
  const isCollection = order.fulfilment_type === 'collection';

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;color:${OLIVE};">Order confirmed!</h2>
    <p style="margin:0 0 20px;color:#555;">
      Thanks ${profile.name || 'there'}, your order with <strong>${order.vendor.business_name}</strong> has been confirmed.
    </p>

    <div style="background-color:${CREAM};border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="margin:0;font-size:14px;color:#666;">Order code</p>
      <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:${SAFFRON};letter-spacing:2px;">#${orderCode}</p>
    </div>

    <p style="margin:0 0 4px;font-size:14px;color:#666;">
      ${isCollection ? 'Collection from' : 'Delivery from'} <strong>${order.vendor.business_name}</strong>
    </p>
    ${order.collection_time ? `<p style="margin:0 0 16px;font-size:14px;color:#666;">Collection time: <strong>${formatDate(order.collection_time)}</strong></p>` : ''}

    ${orderItemsTable(order.order_items)}
    ${totalsBlock(order)}

    <p style="margin:20px 0 0;font-size:13px;color:#888;">
      We'll send you updates as your order progresses. You can also track your order in the FreshLocal app.
    </p>`;

  return {
    subject: `Order confirmed — #${orderCode}`,
    html: emailWrapper('Order Confirmed', content),
  };
}

function preparingEmail(order: OrderRow, profile: ProfileRow): { subject: string; html: string } {
  const orderCode = shortId(order.id);

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;color:${OLIVE};">Your food is being prepared</h2>
    <p style="margin:0 0 20px;color:#555;">
      Great news, ${profile.name || 'there'}! <strong>${order.vendor.business_name}</strong> has started preparing your order.
    </p>

    <div style="background-color:${CREAM};border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="margin:0;font-size:14px;color:#666;">Order code</p>
      <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:${SAFFRON};letter-spacing:2px;">#${orderCode}</p>
    </div>

    ${orderItemsTable(order.order_items)}

    <p style="margin:20px 0 0;font-size:13px;color:#888;">
      We'll let you know when it's ready. Sit tight!
    </p>`;

  return {
    subject: `Your order is being prepared — #${orderCode}`,
    html: emailWrapper('Order Being Prepared', content),
  };
}

function readyEmail(order: OrderRow, profile: ProfileRow): { subject: string; html: string } {
  const orderCode = shortId(order.id);
  const isCollection = order.fulfilment_type === 'collection';

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;color:${OLIVE};">Your order is ready!</h2>
    <p style="margin:0 0 20px;color:#555;">
      ${profile.name || 'Hey'}, your order from <strong>${order.vendor.business_name}</strong> is ready${isCollection ? ' for collection' : ' and on its way'}.
    </p>

    <div style="background-color:${CREAM};border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="margin:0;font-size:14px;color:#666;">Order code</p>
      <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:${SAFFRON};letter-spacing:2px;">#${orderCode}</p>
    </div>

    ${
      isCollection
        ? `<div style="background-color:#fff8e7;border-left:4px solid ${SAFFRON};padding:12px 16px;margin-bottom:20px;border-radius:0 8px 8px 0;">
            <p style="margin:0;font-size:14px;font-weight:600;color:${OLIVE};">Remember to show your order code</p>
            <p style="margin:4px 0 0;font-size:13px;color:#666;">
              Show <strong>#${orderCode}</strong> to the vendor when you collect your order.
            </p>
          </div>`
        : ''
    }

    ${orderItemsTable(order.order_items)}
    ${totalsBlock(order)}

    <p style="margin:20px 0 0;font-size:13px;color:#888;">
      ${isCollection ? 'Head over to collect your food. Enjoy!' : 'Your order is on the way. Enjoy!'}
    </p>`;

  return {
    subject: `Your order is ready — #${orderCode}`,
    html: emailWrapper('Order Ready', content),
  };
}

function deliveredEmail(order: OrderRow, profile: ProfileRow): { subject: string; html: string } {
  const orderCode = shortId(order.id);

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;color:${OLIVE};">Order complete</h2>
    <p style="margin:0 0 20px;color:#555;">
      ${profile.name || 'Hey'}, your order from <strong>${order.vendor.business_name}</strong> is complete. We hope you enjoyed it!
    </p>

    <div style="background-color:${CREAM};border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="margin:0;font-size:14px;color:#666;">Order code</p>
      <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:${SAFFRON};letter-spacing:2px;">#${orderCode}</p>
    </div>

    ${orderItemsTable(order.order_items)}
    ${totalsBlock(order)}

    <p style="margin:20px 0 0;font-size:14px;color:#555;">
      Loved your meal? Leave a review in the FreshLocal app to help support your local vendor.
    </p>`;

  return {
    subject: `Order complete — #${orderCode}`,
    html: emailWrapper('Order Complete', content),
  };
}

function cancelledEmail(order: OrderRow, profile: ProfileRow): { subject: string; html: string } {
  const orderCode = shortId(order.id);
  const wasRefunded = order.payment_status === 'refunded';

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;color:${OLIVE};">Order cancelled</h2>
    <p style="margin:0 0 20px;color:#555;">
      ${profile.name || 'Hey'}, your order <strong>#${orderCode}</strong> from <strong>${order.vendor.business_name}</strong> has been cancelled.
    </p>

    ${
      wasRefunded
        ? `<div style="background-color:#e8f5e9;border-left:4px solid #4caf50;padding:12px 16px;margin-bottom:20px;border-radius:0 8px 8px 0;">
            <p style="margin:0;font-size:14px;font-weight:600;color:#2e7d32;">Refund issued</p>
            <p style="margin:4px 0 0;font-size:13px;color:#555;">
              A refund of <strong>${formatPrice(order.total)}</strong> has been issued to your original payment method.
              It may take 5&ndash;10 business days to appear on your statement.
            </p>
            ${order.refund_reason ? `<p style="margin:8px 0 0;font-size:13px;color:#666;">Reason: ${order.refund_reason}</p>` : ''}
          </div>`
        : `<div style="background-color:#fff8e7;border-left:4px solid ${SAFFRON};padding:12px 16px;margin-bottom:20px;border-radius:0 8px 8px 0;">
            <p style="margin:0;font-size:14px;font-weight:600;color:${OLIVE};">Refund information</p>
            <p style="margin:4px 0 0;font-size:13px;color:#666;">
              If you were charged for this order, a refund will be processed shortly. Please allow 5&ndash;10 business days for it to appear on your statement.
            </p>
          </div>`
    }

    ${orderItemsTable(order.order_items)}
    ${totalsBlock(order)}

    <p style="margin:20px 0 0;font-size:13px;color:#888;">
      If you have any questions, please contact us through the FreshLocal app.
    </p>`;

  return {
    subject: `Order cancelled — #${orderCode}`,
    html: emailWrapper('Order Cancelled', content),
  };
}

// ---------------------------------------------------------------------------
// Template dispatcher
// ---------------------------------------------------------------------------

function generateEmail(
  emailType: EmailType,
  order: OrderRow,
  profile: ProfileRow
): { subject: string; html: string } {
  switch (emailType) {
    case 'confirmation':
      return confirmationEmail(order, profile);
    case 'preparing':
      return preparingEmail(order, profile);
    case 'ready':
      return readyEmail(order, profile);
    case 'delivered':
      return deliveredEmail(order, profile);
    case 'cancelled':
      return cancelledEmail(order, profile);
    default:
      throw new Error(`Unknown email type: ${emailType}`);
  }
}

// Friendly title for the notification record
function notificationTitle(emailType: EmailType): string {
  switch (emailType) {
    case 'confirmation':
      return 'Order confirmed';
    case 'preparing':
      return 'Your food is being prepared';
    case 'ready':
      return 'Your order is ready';
    case 'delivered':
      return 'Order complete';
    case 'cancelled':
      return 'Order cancelled';
  }
}

function notificationBody(emailType: EmailType, vendorName: string, orderCode: string): string {
  switch (emailType) {
    case 'confirmation':
      return `Your order #${orderCode} with ${vendorName} has been confirmed.`;
    case 'preparing':
      return `${vendorName} has started preparing your order #${orderCode}.`;
    case 'ready':
      return `Your order #${orderCode} from ${vendorName} is ready!`;
    case 'delivered':
      return `Your order #${orderCode} from ${vendorName} is complete. Enjoy!`;
    case 'cancelled':
      return `Your order #${orderCode} from ${vendorName} has been cancelled.`;
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { orderId, emailType }: RequestBody = await req.json();

    // Validate input
    if (!orderId || !emailType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: orderId, emailType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validTypes: EmailType[] = ['confirmation', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validTypes.includes(emailType)) {
      return new Response(
        JSON.stringify({ error: `Invalid emailType. Must be one of: ${validTypes.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch order with vendor + items
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        id, status, fulfilment_type, subtotal, service_fee, delivery_fee,
        total, collection_time, notes, payment_status, refund_reason, created_at, user_id,
        vendor:vendors(business_name, postcode),
        order_items(meal_name, quantity, unit_price, total_price)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Error fetching order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, name')
      .eq('id', order.user_id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile.email) {
      return new Response(
        JSON.stringify({ error: 'User has no email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate email content
    const { subject, html } = generateEmail(emailType, order as unknown as OrderRow, profile);

    // Send email
    const emailResult = await sendEmail({ to: profile.email, subject, html });

    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error);
      // Don't fail the whole request — still create the notification
    }

    // Create notification record
    const orderCode = shortId(order.id);
    const vendorName = (order.vendor as unknown as { business_name: string })?.business_name || 'vendor';

    const { error: notifError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: order.user_id,
        title: notificationTitle(emailType),
        body: notificationBody(emailType, vendorName, orderCode),
        type: 'order',
        data: {
          order_id: order.id,
          email_type: emailType,
          email_sent: emailResult.success,
          email_id: emailResult.id || null,
        },
      });

    if (notifError) {
      console.error('Error creating notification:', notifError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailSent: emailResult.success,
        emailId: emailResult.id || null,
        notificationCreated: !notifError,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-order-email:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
