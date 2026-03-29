// src/db/schema/package.ts
// Tabel packages — paket harga PG independen, sesuai DATABASE.md §3.5
//
// ⚠️ Hanya untuk PG independen.
//    PG tetap mitra menggunakan fee yang ditentukan di events.fee_pg_tetap.
//    PG yang sedang jadi anggota tetap mitra TETAP bisa punya paket independen,
//    tapi tidak bisa di-booking di tanggal yang ter-block event mitra
//    (di-enforce via kalender derived, bukan di tabel ini).

import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { photographerProfiles } from "./photographer"

export const packages = pgTable("packages", {
  id: uuid("id").defaultRandom().primaryKey(),

  photographerId: uuid("photographer_id")
    .notNull()
    .references(() => photographerProfiles.id, { onDelete: "cascade" }),

  namaPaket: text("nama_paket").notNull(),
  deskripsi: text("deskripsi").notNull(),

  // Dalam Rupiah — gunakan integer (tidak perlu desimal)
  harga: integer("harga").notNull(),

  durasiJam: integer("durasi_jam").notNull(),
  jumlahFotoMin: integer("jumlah_foto_min").notNull(),
  includesEditing: boolean("includes_editing").default(false).notNull(),

  // Kategori opsional: 'wedding', 'wisuda', 'portrait', dll.
  kategori: text("kategori"),

  // Soft delete — set false jika tidak aktif lagi
  isActive: boolean("is_active").default(true).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
