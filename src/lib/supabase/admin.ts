import { createClient } from '@supabase/supabase-js'

// Note: This client uses the service_role key and bypasses RLS.
// ONLY use this in Server Actions or API routes after verifying the caller is an Admin.
export function createAdminClient() {
  // Accept both the NEXT_-prefixed var (what .env / .env.example define) and the
  // bare name for backwards compatibility. Previously this only read the bare
  // SUPABASE_SERVICE_ROLE_KEY, which is undefined in .env -> silent admin-client failure.
  const serviceRoleKey =
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
