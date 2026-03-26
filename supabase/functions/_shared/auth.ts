import { supabaseAdmin } from './supabase.ts';

/**
 * Extract and verify the authenticated user from the request's Authorization header.
 * Returns the user's id and email, or null if the token is missing/invalid.
 */
export async function getAuthUser(req: Request): Promise<{ id: string; email: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  return { id: user.id, email: user.email || '' };
}

/**
 * Check whether a user has the 'admin' role in the profiles table.
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return data?.role === 'admin';
}

/**
 * Check whether the request is authenticated with the Supabase service role key.
 * Used for internal calls from pg_net triggers and pg_cron.
 */
export function isServiceRole(req: Request): boolean {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return false;

  const token = authHeader.replace('Bearer ', '');
  return token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * Verify that the authenticated user owns a specific vendor.
 * Returns true if the vendor exists and its user_id matches the given userId.
 */
export async function isVendorOwner(userId: string, vendorId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('vendors')
    .select('id')
    .eq('id', vendorId)
    .eq('user_id', userId)
    .single();

  return !!data;
}
