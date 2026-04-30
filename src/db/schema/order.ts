// src/db/schema/order.ts
// Tabel orders — transaksi pemesanan, sesuai DATABASE.md §3.9
//
// Business rules:
// - Satu order hanya melibatkan satu PG
// - PG tidak bisa punya dua order 'ongoing' di tanggal yang sama
// - Status flow: pending → confirmed → dp_paid → ongoing → delivered → completed
//                                                          ↘ cancelled | disputed

import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { orderStatusEnum, orderTypeEnum } from "./enums"
import { events } from "./event"
import { packages } from "./package"
import { photographerProfiles } from "./photographer"

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Customer diidentifikasi via Clerk ID (tidak ada FK ke customer_profiles
  // karena referensi pakai clerk_id, bukan uuid)
  customerClerkId: text("customer_clerk_id").notNull(),

  photographerId: uuid("photographer_id")
    .notNull()
    .references(() => photographerProfiles.id),

  // Nullable jika order via event (event punya fee sendiri)
  paketId: uuid("paket_id").references(() => packages.id),

  orderType: orderTypeEnum("order_type").notNull(),

  // Nullable jika direct order ke PG independen
  eventId: uuid("event_id").references(() => events.id),

  lokasi: text("lokasi").notNull(),
  tanggalPotret: timestamp("tanggal_potret").notNull(),
  catatan: text("catatan"),

  // Untuk order direct: dari packages.harga
  // Untuk order via event: dari events.fee_pg_tetap atau fee_pg_per_event
  totalHarga: integer("total_harga").notNull(),

  status: orderStatusEnum("status").default("pending").notNull(),

  // ---------------------------------------------------------------------------
  // Timestamps status — untuk audit trail dan kalender ketersediaan
  // ---------------------------------------------------------------------------

  confirmedAt: timestamp("confirmed_at"),
  dpPaidAt: timestamp("dp_paid_at"),
  deliveredAt: timestamp("delivered_at"),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancelledBy: text("cancelled_by"), // clerk_id siapa yang cancel

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
