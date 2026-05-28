import { NextResponse } from "next/server"
import { db } from "@/db"
import { orders, payments } from "@/db/schema"
import { and, eq, lte, inArray } from "drizzle-orm"

// Vercel Cron Jobs requires GET endpoints
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    // 24 jam yang lalu
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Cari order yang:
    // 1. status = 'confirmed' (sudah dikonfirmasi fotografer)
    // 2. confirmedAt sudah lewat 24 jam
    // 3. payment.statusDp masih 'unpaid' (belum bayar DP sama sekali)
    const expiredUnpaidPayments = await db
      .select({ orderId: payments.orderId })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .where(
        and(
          eq(orders.status, "confirmed"),
          eq(payments.statusDp, "unpaid"),
          lte(orders.confirmedAt, yesterday)
        )
      )

    if (expiredUnpaidPayments.length === 0) {
      console.log("[CRON] No expired unpaid orders found.")
      return NextResponse.json({ success: true, cancelledCount: 0, cancelledOrderIds: [] })
    }

    const expiredOrderIds = expiredUnpaidPayments.map(p => p.orderId)

    // Batalkan semua order tersebut dalam satu query
    const result = await db
      .update(orders)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        cancelledBy: "system_cron",
        updatedAt: new Date()
      })
      .where(inArray(orders.id, expiredOrderIds))
      .returning({ id: orders.id })

    console.log(`[CRON] Auto-cancelled ${result.length} expired unpaid DP orders.`, result.map(r => r.id))

    return NextResponse.json({
      success: true,
      cancelledCount: result.length,
      cancelledOrderIds: result.map(r => r.id)
    })
  } catch (error) {
    console.error("[CRON] Error auto-cancelling orders:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}
