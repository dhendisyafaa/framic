// src/db/schema/dispute.ts
// Tabel disputes — sengketa order, sesuai DATABASE.md §3.13
//
// Flow: open → waiting_response → under_review → resolved_* | escalated
// Auto-resolve setelah DISPUTE_AUTO_RESOLVE_DAYS (3 hari) jika tidak ada respons

import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { disputeRaisedByEnum, disputeStatusEnum } from "./enums"
import { orders } from "./order"

export const disputes = pgTable("disputes", {
  id: uuid("id").defaultRandom().primaryKey(),

  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),

  raisedBy: disputeRaisedByEnum("raised_by").notNull(),
  raisedByClerkId: text("raised_by_clerk_id").notNull(),
  alasan: text("alasan").notNull(),

  // Bukti yang diupload saat raise dispute (Cloudinary URLs)
  buktiUrls: text("bukti_urls").array().notNull().default([]),

  status: disputeStatusEnum("status").default("open").notNull(),

  // Respons dari pihak yang di-dispute
  responseText: text("response_text"),
  responseAt: timestamp("response_at"),
  responseBuktiUrls: text("response_bukti_urls").array().notNull().default([]),

  // Resolusi oleh admin
  resolvedByClerkId: text("resolved_by_clerk_id"),
  catatanResolusi: text("catatan_resolusi"),
  resolvedAt: timestamp("resolved_at"),

  // Auto-resolve = created_at + DISPUTE_AUTO_RESOLVE_DAYS
  autoResolveAt: timestamp("auto_resolve_at").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
