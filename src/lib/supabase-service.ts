import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client — bypasses RLS entirely. Only for server-side code that must
 * read/write cs_marketplace_credentials (OAuth tokens) or otherwise needs to act outside the
 * logged-in admin's session (e.g. the publish-job worker). The `server-only` import makes any
 * accidental client-component import a build error instead of a leaked secret.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local (Project Settings → API → service_role in the Supabase dashboard) — never commit it.'
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
