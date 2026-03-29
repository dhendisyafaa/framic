// src/db/schema/mitra.ts
// Tabel mitra_profiles — sesuai DATABASE.md §3.4

import { pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { mitraTypeEnum, verificationStatusEnum } from "./enums"
import { users } from "./user"

export const mitraProfiles = pgTable("mitra_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),

  clerkId: text("clerk_id")
    .notNull()
    .unique()
    .references(() => users.clerkId, { onDelete: "cascade" }),

  namaOrganisasi: text("nama_organisasi").notNull(),
  tipeMitra: mitraTypeEnum("tipe_mitra").notNull(),
  alamat: text("alamat").notNull(),
  nomorTelepon: text("nomor_telepon").notNull(),
  websiteUrl: text("website_url"),
  dokumenLegalitasUrl: text("dokumen_legalitas_url"),

  verificationStatus: verificationStatusEnum("verification_status")
    .default("pending")
    .notNull(),
  verifiedAt: timestamp("verified_at"),

  // Komisi platform — default 10%, dikunci tidak bisa diubah user
  platformFeePercent: real("platform_fee_percent").default(10).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
