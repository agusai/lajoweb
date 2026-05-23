import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client untuk API routes yang menggunakan Bearer token (dari mobile app).
 * Tidak menggunakan cookies — berbeza dengan createClient() di server.ts.
 */
export function createApiClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}