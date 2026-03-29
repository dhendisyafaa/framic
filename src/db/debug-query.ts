import { db } from "./index"
import { eventPhotographers, events } from "./schema"
import { and, eq, lte, gte, sql } from "drizzle-orm"
import { startOfDay, endOfDay } from "date-fns"

async function debug() {
  const photographerId = "cc70364b-7575-4f4e-a7cb-7d27fdaaafe3" 
  const tanggalPotretDate = new Date("2026-03-31")
  const startDate = startOfDay(tanggalPotretDate)
  const endDate = endOfDay(tanggalPotretDate)

  console.log("Starting debug query with SQL fragment...")
  try {
    const pgEvents = await db
      .select({
        tanggalMulai: events.tanggalMulai,
        tanggalSelesai: events.tanggalSelesai,
      })
      .from(eventPhotographers)
      .innerJoin(events, eq(eventPhotographers.eventId, events.id))
      .where(
        and(
          eq(eventPhotographers.photographerId, photographerId),
          sql`(${eventPhotographers.photographerType} = 'mitra_permanent'::photographer_type OR (${eventPhotographers.photographerType} = 'event_only'::photographer_type AND ${eventPhotographers.invitationStatus} = 'accepted'::invitation_status))`,
          lte(events.tanggalMulai, endOfDay(endDate)),
          gte(events.tanggalSelesai, startOfDay(startDate))
        )
      )
    console.log("Success! Results:", pgEvents)
  } catch (err: any) {
    console.error("Query failed!")
    console.error("Error Name:", err.name)
    console.error("Error Message:", err.message)
    console.error("Full Error:", err)
  }
}

debug()
