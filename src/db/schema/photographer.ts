// src/db/schema/photographer.ts
// Tabel photographer_profiles — sesuai DATABASE.md §3.3
//
// ⚠️ Tidak ada kolom active_mitra_id
//    Status PG tetap mitra di-derive dari:
//    mitra_photographers WHERE contract_status IN ('active', 'pending_expiry')

import {
  boolean,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { verificationStatusEnum } from "./enums"
import { users } from "./user"

export const photographerProfiles = pgTable("photographer_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),

  clerkId: text("clerk_id")
    .notNull()
    .unique()
    .references(() => users.clerkId, { onDelete: "cascade" }),

  bio: text("bio"),
  kotaDomisili: text("kota_domisili").notNull(),

  // Username unik seperti Instagram — bisa diupdate max 1x per 14 hari
  username: text("username").unique(),
  usernameUpdatedAt: timestamp("username_updated_at"),

  // ['wedding', 'wisuda', 'portrait', 'event', 'product']
  kategori: text("kategori").array().notNull().default([]),

  portfolioUrls: text("portfolio_urls").array().notNull().default([]),

  // Agregat rating — di-update setiap kali ada review baru
  ratingAverage: real("rating_average").default(0).notNull(),
  ratingCount: integer("rating_count").default(0).notNull(),

  verificationStatus: verificationStatusEnum("verification_status")
    .default("pending")
    .notNull(),
  verifiedAt: timestamp("verified_at"),

  // Toggle manual oleh PG — terlepas dari kalender derived
  isAvailable: boolean("is_available").default(true).notNull(),

  // Minimum fee basis untuk perlindungan PG saat di-invite Mitra
  baseMinimumFee: integer("base_minimum_fee").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
