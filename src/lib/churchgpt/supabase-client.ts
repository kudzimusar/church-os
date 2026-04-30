'use client'

/**
 * Singleton browser Supabase client for the ChurchGPT public area.
 * Importing this file from multiple components will always return
 * the same GoTrueClient instance, eliminating the "Multiple GoTrueClient
 * instances detected" warning and the auth race conditions it causes.
 */

import { createBrowserClient } from '@supabase/ssr'

let _client: ReturnType<typeof createBrowserClient> | null = null

export function getChurchGPTSupabaseClient() {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _client
}
