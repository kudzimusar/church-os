/**
 * Supabase Admin Client — Service Role
 * Bypasses RLS for admin dashboard queries.
 * NEVER expose this client on the member-facing frontend.
 * Only used inside /shepherd/* routes.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Service role key — available in .env.local only, not exposed to browser
const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    // Fallback for client-side builds (static export limitation)
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhcHhyb3JrY3ZwenprZ2dvcHNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjUxODYwOSwiZXhwIjoyMDg4MDk0NjA5fQ.J4bSYdw1370BpGFddbEvhkTP5BBlPKTQAe03JuIJxHg';

export const supabaseAdmin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});
