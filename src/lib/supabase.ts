// src/lib/supabase.ts
// Supabase client — HANYA untuk Realtime chat (bukan database client)
// Database diakses via Drizzle ORM + PostgreSQL langsung
// Docs: https://supabase.com/docs/reference/javascript

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env variables: NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY harus diisi di .env.local",
  )
}

/**
 * Supabase client — dipakai untuk subscribe ke Realtime events pada tabel messages.
 * Gunakan di client components via hook `use-chat.ts`.
 *
 * ⚠️ Jangan gunakan client ini untuk query database — pakai Drizzle ORM.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
