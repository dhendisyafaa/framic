// src/db/schema/message.ts
// Tabel messages — pesan real-time antara customer ↔ PG, sesuai DATABASE.md §3.14
//
// ⚠️ TIDAK ADA chat_mode — satu mode chat, tidak dibedakan pre/post order
// ⚠️ TIDAK BOLEH menyimpan nomor telepon atau email di kolom pesan
//    Nomor/email harus difilter via chat-filter.ts SEBELUM INSERT
//
// Realtime push via Supabase postgres_changes subscription (bukan Socket.io)
// Hanya created_at — pesan tidak bisa diedit setelah dikirim

import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { orders } from "./order"

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),

  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),

  senderClerkId: text("sender_clerk_id").notNull(),

  // Pesan sudah difilter kontak sebelum INSERT — lihat src/lib/chat-filter.ts
  pesan: text("pesan").notNull(),

  isRead: boolean("is_read").default(false).notNull(),

  // Pesan immutable setelah dikirim — tidak ada updated_at
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
