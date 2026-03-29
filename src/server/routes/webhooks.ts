import { Hono } from "hono"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { orders, payments } from "@/db/schema"
import {
  validateXenditWebhookToken,
  parseExternalId
} from "@/lib/xendit"
import { captureError } from "@/lib/sentry"

const webhooksRouter = new Hono()

/**
 * POST /api/webhooks/xendit
 * Handler webhook Xendit untuk sukses payment (DP & Settle)
 * Selalu return 200 ke Xendit.
 */
webhooksRouter.post("/xendit", async (c) => {
  const token = c.req.header("x-callback-token")
  if (!token || !validateXenditWebhookToken(token)) {
    return c.json({ success: false, error: "Invalid webhook token" }, 401)
  }

  const body = await c.req.json()
  const { external_id, status } = body

  // Xendit mengirim banyak event, kita hanya tertarik pada PAID
  if (status !== "PAID") {
    return c.json({ success: true })
  }

  const parsed = parseExternalId(external_id)
  if (!parsed) {
    console.error(`[Xendit Webhook] Invalid external_id: ${external_id}`)
    return c.json({ success: true })
  }

  const { orderId, type } = parsed

  try {
    await db.transaction(async (tx) => {
      // 1. Fetch data yang dibutuhkan
      const [paymentData] = await tx
        .select()
        .from(payments)
        .where(eq(payments.orderId, orderId))
        .limit(1)

      if (!paymentData) throw new Error("Payment data not found")

      const now = new Date()

      if (type === "dp") {
        // --- LOGIC DP PAID ---
        await tx
          .update(payments)
          .set({
            statusDp: "paid",
            tanggalDp: now,
            updatedAt: now,
          })
          .where(eq(payments.id, paymentData.id))

        await tx
          .update(orders)
          .set({
            status: "dp_paid",
            dpPaidAt: now,
            updatedAt: now,
          })
          .where(eq(orders.id, orderId))

      } else {
        // --- LOGIC SETTLEMENT PAID ---
        // 1. Hitung pembagian komisi berdasarkan snapshot persentase
        const totalHarga = paymentData.jumlahDp + paymentData.jumlahPelunasan
        const platformAmount = Math.floor(totalHarga * (paymentData.platformFeePercent / 100))

        // Guna "null" jika tidak ada mitra (PG independen)
        const mitraAmount = paymentData.mitraPercent
          ? Math.floor(totalHarga * (paymentData.mitraPercent / 100))
          : null

        const photographerAmount = totalHarga - platformAmount - (mitraAmount ?? 0)

        // 2. Update Payment record (breakdown komisi)
        await tx
          .update(payments)
          .set({
            statusPelunasan: "paid",
            tanggalPelunasan: now,
            jumlahPlatform: platformAmount,
            jumlahMitra: mitraAmount,
            jumlahFotografer: photographerAmount,
            updatedAt: now,
          })
          .where(eq(payments.id, paymentData.id))

        // 3. Update Order status -> COMPLETED
        await tx
          .update(orders)
          .set({
            status: "completed",
            completedAt: now,
            updatedAt: now,
          })
          .where(eq(orders.id, orderId))
      }
    })
  } catch (err) {
    captureError(err, { context: "xendit-webhook", external_id })
    console.error(`[Xendit Webhook] Internal Error:`, err)
  }

  return c.json({ success: true }, 200)
})

export { webhooksRouter }
