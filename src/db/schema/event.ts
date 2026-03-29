// src/db/schema/event.ts
// Tabel events — event yang dibuat mitra, sesuai DATABASE.md §3.7

import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { mitraProfiles } from "./mitra"

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),

  mitraId: uuid("mitra_id")
    .notNull()
    .references(() => mitraProfiles.id),

  namaEvent: text("nama_event").notNull(),
  deskripsi: text("deskripsi"),
  tanggalMulai: timestamp("tanggal_mulai").notNull(),
  tanggalSelesai: timestamp("tanggal_selesai").notNull(),
  lokasi: text("lokasi").notNull(),
  coverImageUrl: text("cover_image_url"),

  // ---------------------------------------------------------------------------
  // Fee per kategori PG — sama rata dalam kategorinya
  // fee_pg_tetap tidak boleh < minimum_fee_per_event di MoU masing-masing PG
  // ---------------------------------------------------------------------------

  feePgTetap: integer("fee_pg_tetap"), // nullable jika tidak ada PG tetap
  feePgPerEvent: integer("fee_pg_per_event"), // nullable jika tidak ada open recruitment

  // ---------------------------------------------------------------------------
  // Kuota slot PG
  // ---------------------------------------------------------------------------

  kuotaPgTetap: integer("kuota_pg_tetap").default(0).notNull(),
  kuotaPgPerEvent: integer("kuota_pg_per_event").default(0).notNull(),

  // ---------------------------------------------------------------------------
  // Open recruitment
  // ---------------------------------------------------------------------------

  isOpenRecruitment: boolean("is_open_recruitment").default(false).notNull(),

  // Batas waktu PG bisa kirim request — nullable jika bukan open recruitment
  deadlineRequest: timestamp("deadline_request"),

  // ---------------------------------------------------------------------------
  // Publikasi
  // ---------------------------------------------------------------------------

  isPublished: boolean("is_published").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
