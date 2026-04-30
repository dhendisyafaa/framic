import { Hono } from "hono"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { orders, payments } from "@/db/schema"
import { 
  createXenditInvoice, 
  buildExternalId 
} from "@/lib/xendit"
import { currentUser } from "@clerk/nextjs/server"
import { captureError } from "@/lib/sentry"
import { siteConfig } from "@/config/site"

import { requireAuth } from "@/server/middleware/auth"

const paymentsRouter = new Hono<{ Variables: { clerkId: string } }>()

// Proteksi semua rute payment
paymentsRouter.use("*", requireAuth)

/**
 * POST /api/payments/:orderId/dp
 * Buat invoice Xendit untuk DP 50%
 */
paymentsRouter.post("/:orderId/dp", async (c) => {
  const clerkId = c.get("clerkId")
  if (!clerkId) return c.json({ success: false, error: "Unauthorized" }, 401)
  
  // Ambil email dari Clerk untuk invoice
  const clerkUser = await currentUser()
  if (!clerkUser) return c.json({ success: false, error: "User data not found" }, 401)
  const email = clerkUser.emailAddresses[0]?.emailAddress

  const orderId = c.req.param("orderId")

  try {
    const [orderData] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1)

    if (!orderData) return c.json({ success: false, error: "Order tidak ditemukan" }, 404)
    if (orderData.customerClerkId !== clerkId) {
      return c.json({ success: false, error: "Forbidden: Anda bukan pemilik order ini" }, 403)
    }
    if (orderData.status !== "confirmed") {
      return c.json({ success: false, error: "Order harus berstatus 'confirmed' untuk bayar DP" }, 400)
    }

    const [paymentData] = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .limit(1)

    if (!paymentData) return c.json({ success: false, error: "Data pembayaran tidak ditemukan" }, 404)
    if (paymentData.statusDp === "paid") return c.json({ success: false, error: "DP sudah dibayar" }, 400)

    const externalId = buildExternalId(orderId, "dp")
    const invoice = await createXenditInvoice({
      externalId,
      amount: paymentData.jumlahDp,
      payerEmail: email,
      description: `DP 50% untuk Order Framic #${orderId.slice(0, 8)}`,
      successRedirectUrl: `${siteConfig.url}/dashboard/orders/${orderId}`,
    })

    await db
      .update(payments)
      .set({
        xenditInvoiceIdDp: invoice.invoiceId,
        statusDp: "pending",
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentData.id))

    return c.json({ 
      success: true, 
      data: {
        invoiceUrl: invoice.invoiceUrl,
        invoiceId: invoice.invoiceId
      } 
    })
  } catch (err) {
    captureError(err, { context: "create-dp-invoice", orderId })
    const message = err instanceof Error ? err.message : "Gagal membuat invoice DP"
    return c.json({ success: false, error: message }, 500)
  }
})

/**
 * POST /api/payments/:orderId/settle
 * Buat invoice Xendit untuk Pelunasan 50%
 */
paymentsRouter.post("/:orderId/settle", async (c) => {
  const clerkId = c.get("clerkId")
  if (!clerkId) return c.json({ success: false, error: "Unauthorized" }, 401)
  
  const clerkUser = await currentUser()
  if (!clerkUser) return c.json({ success: false, error: "User data not found" }, 401)
  const email = clerkUser.emailAddresses[0]?.emailAddress

  const orderId = c.req.param("orderId")

  try {
    const [orderData] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1)

    if (!orderData) return c.json({ success: false, error: "Order tidak ditemukan" }, 404)
    if (orderData.customerClerkId !== clerkId) {
      return c.json({ success: false, error: "Forbidden" }, 403)
    }
    if (orderData.status !== "delivered") {
      return c.json({ success: false, error: "Order harus berstatus 'delivered' untuk pelunasan" }, 400)
    }

    const [paymentData] = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .limit(1)

    if (!paymentData) return c.json({ success: false, error: "Data pembayaran tidak ditemukan" }, 404)
    if (paymentData.statusPelunasan === "paid") return c.json({ success: false, error: "Pelunasan sudah lunas" }, 400)

    const externalId = buildExternalId(orderId, "settle")
    const invoice = await createXenditInvoice({
      externalId,
      amount: paymentData.jumlahPelunasan,
      payerEmail: email,
      description: `Pelunasan 50% untuk Order Framic #${orderId.slice(0, 8)}`,
      successRedirectUrl: `${siteConfig.url}/dashboard/orders/${orderId}/success`,
    })

    await db
      .update(payments)
      .set({
        xenditInvoiceIdSettle: invoice.invoiceId,
        statusPelunasan: "pending",
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentData.id))

    return c.json({ 
      success: true, 
      data: {
        invoiceUrl: invoice.invoiceUrl,
        invoiceId: invoice.invoiceId
      } 
    })
  } catch (err) {
    captureError(err, { context: "create-settle-invoice", orderId })
    const message = err instanceof Error ? err.message : "Gagal membuat invoice pelunasan"
    return c.json({ success: false, error: message }, 500)
  }
})

export { paymentsRouter }
