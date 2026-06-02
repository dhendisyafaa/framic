import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { withdrawalStatusEnum } from "./enums"
import { photographerProfiles } from "./photographer"

export const withdrawals = pgTable("withdrawals", {
  id: uuid("id").defaultRandom().primaryKey(),

  photographerId: uuid("photographer_id")
    .notNull()
    .references(() => photographerProfiles.id, { onDelete: "cascade" }),

  jumlah: integer("jumlah").notNull(),
  bankName: text("bank_name").notNull(),
  rekeningNumber: text("rekening_number").notNull(),
  rekeningName: text("rekening_name").notNull(),

  status: withdrawalStatusEnum("status").default("pending").notNull(),
  rejectedReason: text("rejected_reason"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
