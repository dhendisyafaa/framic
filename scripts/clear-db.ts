// scripts/clear-db.ts
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import dotenv from "dotenv"
import path from "path"

// Load env dari .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error("❌ DATABASE_URL tidak ditemukan di .env.local")
  process.exit(1)
}

const client = postgres(connectionString, { prepare: false })
const db = drizzle(client)

async function clearDatabase() {
  console.log("⏳ Memulai pembersihan database...")

  try {
    // List tabel sesuai dependensi (dari yang punya FK paling banyak ke yang tidak ada FK)
    const tables = [
      "messages",
      "disputes",
      "reviews",
      "photos",
      "payments",
      "orders",
      "event_photographers",
      "events",
      "mitra_photographers",
      "packages",
      "customer_profiles",
      "photographer_profiles",
      "mitra_profiles",
      "users",
    ]

    for (const table of tables) {
      console.log(`🧹 Menghapus data dari tabel: ${table}...`)
      await db.execute(`DELETE FROM ${table};`)
    }

    console.log("✅ Database berhasil dibersihkan seluruhnya!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Terjadi kesalahan saat membersihkan database:", error)
    process.exit(1)
  }
}

clearDatabase()
