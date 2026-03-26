/**
 * Allowed origins for production and development.
 * In production (ENVIRONMENT=production), only these origins are permitted.
 * In dev/test, all origins are allowed.
 */
const ALLOWED_ORIGINS = [
  'https://freshlocal.app',
  'http://localhost:8081',
  'http://localhost:19006',
  'exp://localhost:8081',
];

/**
 * Determine the correct Access-Control-Allow-Origin value for the given request.
 * - In production: only allow explicitly listed origins.
 * - In dev/test (default): allow all origins.
 */
function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get('Origin') || '';
  const env = Deno.env.get('ENVIRONMENT') || 'development';

  // In development / test, allow all origins
  if (env !== 'production') {
    return origin || '*';
  }

  // In production, check against the allow-list
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }

  // No match — return the first allowed origin (browser will block the request)
  return ALLOWED_ORIGINS[0];
}

/**
 * Build CORS headers for a given request.
 * The origin is dynamically resolved based on environment.
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

/**
 * Legacy static headers — kept for backwards compatibility in responses
 * where we don't have the request object handy. Prefer getCorsHeaders(req) instead.
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Handle CORS preflight (OPTIONS) requests.
 * Returns a Response for OPTIONS, or null for other methods.
 */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }
  return null;
}
