// src/db/schema/user.ts
// Tabel users — bridge Clerk ↔ database internal
// sesuai DATABASE.md §3.1
//
// ⚠️ PK adalah clerk_id (text), BUKAN uuid
// Data auth (email, nama, avatar) dikelola Clerk — tidak disimpan di sini

import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  // PK = Clerk user ID (format: "user_abc123")
  clerkId: text("clerk_id").primaryKey(),

  // Roles — default ['customer'], disync dengan Clerk publicMetadata
  // Tidak perlu enum karena roles bisa kombinasi
  roles: text("roles").array().notNull().default(["customer"]),

  isActive: boolean("is_active").default(true).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
