/**
 * Supabase Admin Client — Service Role
 * Bypasses RLS for admin dashboard queries.
 * NEVER expose this client on the member-facing frontend.
 * Only used inside /shepherd/* routes.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!serviceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});
