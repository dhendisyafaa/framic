// src/db/schema/mitra-photographer.ts
// Tabel mitra_photographers — kontrak anggota tetap PG ↔ mitra
// sesuai DATABASE.md §3.6
//
// Business rules:
// - PG hanya boleh punya 1 kontrak dengan contract_status = 'active' atau 'pending_expiry'
// - mitra_percent + photographer_percent harus = 100
// - Kontrak tidak bisa expired jika PG masih punya order aktif

import {
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import {
  contractStatusEnum,
  initiatedByEnum,
  invitationStatusEnum,
} from "./enums"
import { mitraProfiles } from "./mitra"
import { photographerProfiles } from "./photographer"

export const mitraPhotographers = pgTable("mitra_photographers", {
  id: uuid("id").defaultRandom().primaryKey(),

  mitraId: uuid("mitra_id")
    .notNull()
    .references(() => mitraProfiles.id),

  photographerId: uuid("photographer_id")
    .notNull()
    .references(() => photographerProfiles.id),

  // ---------------------------------------------------------------------------
  // Invitation flow
  // ---------------------------------------------------------------------------

  // Siapa yang memulai hubungan ini
  initiatedBy: initiatedByEnum("initiated_by").notNull(),

  invitationStatus: invitationStatusEnum("invitation_status")
    .default("pending")
    .notNull(),

  invitationMessage: text("invitation_message"),

  // ---------------------------------------------------------------------------
  // Terms kontrak — diisi setelah invitation accepted, sebelum e-sign
  // ---------------------------------------------------------------------------

  // mitraPercent + photographerPercent harus = 100
  mitraPercent: real("mitra_percent"), // nullable sampai invitation accepted
  photographerPercent: real("photographer_percent"),

  // Minimum fee per event — proteksi PG, dalam Rupiah
  minimumFeePerEvent: integer("minimum_fee_per_event"),

  tanggalMulai: timestamp("tanggal_mulai"),
  tanggalSelesai: timestamp("tanggal_selesai"),

  // ---------------------------------------------------------------------------
  // E-sign MoU (MVP: simpan metadata di DB, tanpa PDF generation)
  // ---------------------------------------------------------------------------

  mouGeneratedUrl: text("mou_generated_url"), // nullable di MVP
  photographerSignedAt: timestamp("photographer_signed_at"),
  mitraSignedAt: timestamp("mitra_signed_at"),
  photographerIp: text("photographer_ip"),
  mitraIp: text("mitra_ip"),

  // ---------------------------------------------------------------------------
  // Status kontrak — aktif setelah kedua pihak e-sign
  // ---------------------------------------------------------------------------

  contractStatus: contractStatusEnum("contract_status"),
  terminatedAt: timestamp("terminated_at"),
  terminationReason: text("termination_reason"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
