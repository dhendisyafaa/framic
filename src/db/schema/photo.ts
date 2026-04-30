// src/db/schema/photo.ts
// Tabel photos — file hasil foto order, sesuai DATABASE.md §3.11
//
// Hanya ada uploaded_at (bukan created_at/updated_at — file foto immutable)
// Maksimum 100 foto per order — enforce di application layer

import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { orders } from "./order"

export const photos = pgTable("photos", {
  id: uuid("id").defaultRandom().primaryKey(),

  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),

  fotoUrl: text("foto_url").notNull(),
  cloudinaryPublicId: text("cloudinary_public_id").notNull(),

  ukuranBytes: integer("ukuran_bytes").notNull(),
  resolusiWidth: integer("resolusi_width"),
  resolusiHeight: integer("resolusi_height"),
  format: text("format"), // 'jpg', 'png', 'webp'

  // File foto immutable setelah upload — hanya perlu uploaded_at
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
})
