// src/db/index.ts
// Drizzle ORM client — koneksi ke PostgreSQL
// Gunakan untuk semua query DB (bukan Supabase client)

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    "Missing DATABASE_URL env variable — pastikan sudah diisi di .env.local",
  )
}

const client = postgres(connectionString, {
  // Matikan prepare statements — diperlukan untuk Supabase connection pooler (pgBouncer)
  prepare: false,
})

export const db = drizzle(client, {
  schema,
  // Log query di development untuk debugging
  logger: process.env.NODE_ENV === "development",
})

// Re-export schema agar bisa diimport dari "@/db" jika diperlukan
export * from "./schema"

