// src/db/schema/event-photographer.ts
// Tabel event_photographers — sesuai DATABASE.md §3.8
//
// Menggabungkan DUA fungsi dalam satu tabel:
// 1. Assignment PG tetap ke event (photographer_type = 'mitra_permanent')
//    → Langsung di-assign mitra, tanpa invitation flow, tanpa MoU baru
// 2. Kontrak per-event PG (photographer_type = 'event_only')
//    → Harus melalui invitation/request flow + MoU per-event
//
// Dipakai juga sebagai sumber data kalender ketersediaan PG (derive):
//   blockedByEvents = event_photographers JOIN events
//
// Timestamps: assigned_at + updated_at (TANPA created_at — sesuai keputusan)

import {
  boolean,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import {
  initiatedByEnum,
  invitationStatusEnum,
  photographerTypeEnum,
} from "./enums"
import { events } from "./event"
import { photographerProfiles } from "./photographer"

export const eventPhotographers = pgTable("event_photographers", {
  id: uuid("id").defaultRandom().primaryKey(),

  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),

  photographerId: uuid("photographer_id")
    .notNull()
    .references(() => photographerProfiles.id),

  // ---------------------------------------------------------------------------
  // Tipe PG di event ini
  // ---------------------------------------------------------------------------

  photographerType: photographerTypeEnum("photographer_type").notNull(),
  // 'mitra_permanent' → PG tetap yang di-assign mitra (field invitation nullable)
  // 'event_only'      → PG kontrak per-event (via invite atau open recruitment)

  // ---------------------------------------------------------------------------
  // Invitation / request flow — hanya untuk PG per-event (nullable untuk PG tetap)
  // ---------------------------------------------------------------------------

  initiatedBy: initiatedByEnum("initiated_by"),
  invitationStatus: invitationStatusEnum("invitation_status"),
  invitationMessage: text("invitation_message"),

  // ---------------------------------------------------------------------------
  // Terms per-event — hanya untuk PG per-event
  // mitraPercent + photographerPercent = 100 (yang sisanya ke platform)
  // ---------------------------------------------------------------------------

  mitraPercent: real("mitra_percent"),
  photographerPercent: real("photographer_percent"),

  // ---------------------------------------------------------------------------
  // E-sign MoU per-event — hanya untuk PG per-event (MVP: metadata saja)
  // ---------------------------------------------------------------------------

  mouGeneratedUrl: text("mou_generated_url"),
  photographerSignedAt: timestamp("photographer_signed_at"),
  mitraSignedAt: timestamp("mitra_signed_at"),
  photographerIp: text("photographer_ip"),
  mitraIp: text("mitra_ip"),

  // ---------------------------------------------------------------------------
  // Ketersediaan — false jika PG sudah fully booked di event ini
  // ---------------------------------------------------------------------------

  isAvailable: boolean("is_available").default(true).notNull(),

  // Tidak ada created_at — hanya assigned_at + updated_at
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
