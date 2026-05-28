import { db } from "./index"
import { orders, payments, photographerProfiles, packages } from "./schema"
import { eq, and } from "drizzle-orm"

async function verify() {
  const [pg] = await db.select().from(photographerProfiles).limit(1)
  const [pkg] = await db.select().from(packages).where(eq(packages.photographerId, pg.id)).limit(1)

  if (!pg || !pkg) {
    return
  }

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
        statusDp: "unpaid",
        statusPelunasan: "unpaid",
      })

      return newOrder
    })
  } catch (err) {
    console.error("Transaction failed:", err)
  }

  process.exit(0)
}

verify()
