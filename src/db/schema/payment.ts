// src/db/schema/payment.ts
// Tabel payments — pembayaran DP + pelunasan, sesuai DATABASE.md §3.10
//
// Relasi 1:1 dengan orders (unique constraint pada order_id)
// DP selalu 50%, pelunasan selalu 50% — enforce di application layer
// Breakdown komisi di-snapshot saat transaksi (immutable setelah dibuat)

import {
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { dpStatusEnum, settlementStatusEnum } from "./enums"
import { orders } from "./order"

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),

  // unique() → relasi 1:1 dengan orders
  orderId: uuid("order_id")
    .notNull()
    .unique()
    .references(() => orders.id),

  // ---------------------------------------------------------------------------
  // DP — Down Payment (50% dari total_harga)
  // ---------------------------------------------------------------------------

  jumlahDp: integer("jumlah_dp").notNull(), // 50% dari total_harga
  statusDp: dpStatusEnum("status_dp").default("unpaid").notNull(),
  xenditInvoiceIdDp: text("xendit_invoice_id_dp"),
  tanggalDp: timestamp("tanggal_dp"),

  // ---------------------------------------------------------------------------
  // Pelunasan — Settlement (50% dari total_harga)
  // ---------------------------------------------------------------------------

  jumlahPelunasan: integer("jumlah_pelunasan").notNull(), // 50% dari total_harga
  statusPelunasan: settlementStatusEnum("status_pelunasan")
    .default("unpaid")
    .notNull(),
  xenditInvoiceIdSettle: text("xendit_invoice_id_settle"),
  tanggalPelunasan: timestamp("tanggal_pelunasan"),

  // ---------------------------------------------------------------------------
  // Breakdown komisi — snapshot saat transaksi (immutable)
  // ---------------------------------------------------------------------------

  jumlahPlatform: integer("jumlah_platform"),
  jumlahMitra: integer("jumlah_mitra"), // nullable jika PG independen
  jumlahFotografer: integer("jumlah_fotografer"),

  // Persentase di-snapshot agar tidak terpengaruh perubahan config di kemudian hari
  platformFeePercent: real("platform_fee_percent").notNull(),
  mitraPercent: real("mitra_percent"), // nullable jika PG independen
  photographerPercent: real("photographer_percent").notNull(),

  metodePembayaran: text("metode_pembayaran"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
