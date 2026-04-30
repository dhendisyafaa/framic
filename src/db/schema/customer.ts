// src/db/schema/customer.ts
// Tabel customer_profiles — sesuai DATABASE.md §3.2
//
// nomor_telepon disimpan encrypted, tidak pernah tampil di chat

import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { users } from "./user"

export const customerProfiles = pgTable("customer_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),

  clerkId: text("clerk_id")
    .notNull()
    .unique()
    .references(() => users.clerkId, { onDelete: "cascade" }),

  alamat: text("alamat"),

  // Disimpan encrypted — tidak pernah terekspos di chat
  nomorTelepon: text("nomor_telepon"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
