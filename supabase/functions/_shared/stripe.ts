import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});
