// src/db/schema/review.ts
// Tabel reviews — ulasan customer setelah order completed, sesuai DATABASE.md §3.12
//
// Relasi 1:1 dengan orders (unique constraint pada order_id)
// Hanya created_at — review tidak bisa diedit setelah dibuat

import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { orders } from "./order"
import { photographerProfiles } from "./photographer"

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),

  // 1:1 dengan orders — hanya boleh 1 review per order
  orderId: uuid("order_id")
    .notNull()
    .unique()
    .references(() => orders.id),

  photographerId: uuid("photographer_id")
    .notNull()
    .references(() => photographerProfiles.id),

  // Customer diidentifikasi via Clerk ID
  customerClerkId: text("customer_clerk_id").notNull(),

  // Rating 1–5 — enforce di application layer (check constraint)
  rating: integer("rating").notNull(),

  komentar: text("komentar"),

  // Review immutable — tidak ada updated_at
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
