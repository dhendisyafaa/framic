import { and, eq, or, inArray, lte, gte, sql } from "drizzle-orm"
import { db } from "@/db"
import { events, eventPhotographers, orders } from "@/db/schema"
import { format, eachDayOfInterval, startOfDay, endOfDay } from "date-fns"

/**
 * Mengambil array tanggal yang diblokir untuk seorang fotografer dalam rentang waktu tertentu.
 * Tanggal yang diblokir meliputi:
 * 1. Event yang mana PG tersebut berstatus "mitra_permanent" atau "event_only" dengan invitation "accepted".
 * 2. Order mandiri/event dengan status pemesanan "confirmed", "dp_paid", atau "ongoing".
 *
 * @param photographerId ID unik fotografer
 * @param startDate Rentang awal pencarian
 * @param endDate Rentang akhir pencarian
 * @returns Array of string dalam format YYYY-MM-DD
 */
export async function getPhotographerBlockedDates(
  photographerId: string,
  startDate: Date,
  endDate: Date,
  tx?: any 
): Promise<string[]> {
  const client = tx || db
  const blockedDates = new Set<string>()

  // ---------------------------------------------------------------------------
  // 1. Blokir jadwal dari Event assignments
  // ---------------------------------------------------------------------------
  
  // Gunakan raw SQL untuk menghindari issue "anonymous composite types" yang membandel di Drizzle builder v0.45
  const pgEventsResult = await client.execute(sql`
    SELECT 
      e.tanggal_mulai as "tanggalMulai", 
      e.tanggal_selesai as "tanggalSelesai"
    FROM event_photographers ep
    INNER JOIN events e ON ep.event_id = e.id
    WHERE ep.photographer_id = ${photographerId}::uuid
      AND (
        ep.photographer_type::text = 'mitra_permanent' 
        OR (ep.photographer_type::text = 'event_only' AND ep.invitation_status::text = 'accepted')
      )
      AND e.tanggal_mulai <= ${endOfDay(endDate).toISOString()}::timestamp
      AND e.tanggal_selesai >= ${startOfDay(startDate).toISOString()}::timestamp
  `)

  // Drizzle execute returns rows in different formats depending on driver, handle safely
  const pgEvents = (pgEventsResult.rows || pgEventsResult) as any[]

  for (const ev of pgEvents) {
    const tMulai = new Date(ev.tanggalMulai)
    const tSelesai = new Date(ev.tanggalSelesai)

    const startObj = tMulai < startDate ? startDate : tMulai
    const endObj = tSelesai > endDate ? endDate : tSelesai

    const days = eachDayOfInterval({
      start: startObj,
      end: endObj,
    })

    days.forEach((day: Date) => {
      blockedDates.add(format(day, "yyyy-MM-dd"))
    })
  }

  // ---------------------------------------------------------------------------
  // 2. Blokir jadwal dari valid Orders
  // ---------------------------------------------------------------------------
  
  const pgOrdersResult = await client.execute(sql`
    SELECT tanggal_potret as "tanggalPotret"
    FROM orders
    WHERE photographer_id = ${photographerId}::uuid
      AND status::text IN ('confirmed', 'dp_paid', 'ongoing')
      AND tanggal_potret >= ${startOfDay(startDate).toISOString()}::timestamp
      AND tanggal_potret <= ${endOfDay(endDate).toISOString()}::timestamp
  `)

  const pgOrders = (pgOrdersResult.rows || pgOrdersResult) as any[]

  for (const order of pgOrders) {
    const tPotret = new Date(order.tanggalPotret)
    blockedDates.add(format(tPotret, "yyyy-MM-dd"))
  }

  // Return array hasil sorting secara Ascending YYYY-MM-DD
  return Array.from(blockedDates).sort()
}
