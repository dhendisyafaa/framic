import { db } from "./index"
import { orders, payments, photographerProfiles, packages } from "./schema"
import { eq, and } from "drizzle-orm"

async function verify() {
  console.log("🔍 Verifying Order Engine...")

  // 1. Get a photographer and package
  const [pg] = await db.select().from(photographerProfiles).limit(1)
  const [pkg] = await db.select().from(packages).where(eq(packages.photographerId, pg.id)).limit(1)

  if (!pg || !pkg) {
    console.log("❌ No photographer or package found. Run seed first.")
    return
  }

  console.log(`📸 Found PG: ${pg.id}, Package: ${pkg.namaPaket} (Price: ${pkg.harga})`)

  // We are testing the API logic via script simulation
  // because we can't easily mock Clerk auth in curl without a token.
  
  // Simulation: POST /api/orders (Direct)
  const totalHarga = pkg.harga
  const jumlahDp = Math.floor(totalHarga * 0.5)
  const jumlahPelunasan = totalHarga - jumlahDp

  try {
    const result = await db.transaction(async (tx) => {
      // Create Order
      const [newOrder] = await tx.insert(orders).values({
        customerClerkId: "user_customer_1",
        photographerId: pg.id,
        paketId: pkg.id,
        orderType: "direct",
        lokasi: "Verification Test Lab",
        tanggalPotret: new Date(Date.now() + 86400000 * 10), // 10 days from now
        totalHarga: totalHarga,
        status: "pending",
      }).returning()

      // Create Payment
      await tx.insert(payments).values({
        orderId: newOrder.id,
        jumlahDp,
        jumlahPelunasan,
        platformFeePercent: 10,
        photographerPercent: 90,
        statusDp: "unpaid",
        statusPelunasan: "unpaid",
      })

      return newOrder
    })

    console.log("✅ Order & Payment record created successfully!")
    console.log(`📝 Order ID: ${result.id}, Status: ${result.status}`)

    // Cleanup for next test
    // await db.delete(payments).where(eq(payments.orderId, result.id))
    // await db.delete(orders).where(eq(orders.id, result.id))
    
  } catch (err) {
    console.error("❌ Transaction failed:", err)
  }

  process.exit(0)
}

verify()
