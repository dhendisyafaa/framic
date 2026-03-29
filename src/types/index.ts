// src/types/index.ts
// Re-export type turunan dari schema Drizzle ORM
// Agar interface TypeScript selaras 100% dengan definisi database tanpa duplikasi

import type { InferSelectModel, InferInsertModel } from "drizzle-orm"
import {
  users,
  photographerProfiles,
  mitraProfiles,
  customerProfiles,
  packages,
  mitraPhotographers,
  events,
  eventPhotographers,
  orders,
  payments,
  photos,
  reviews,
  disputes,
  messages,
} from "@/db/schema"

// ---------------------------------------------------------------------------
// Core Entities
// ---------------------------------------------------------------------------
export type User = InferSelectModel<typeof users>
export type UserInsert = InferInsertModel<typeof users>

export type PhotographerProfile = InferSelectModel<typeof photographerProfiles>
export type MitraProfile = InferSelectModel<typeof mitraProfiles>
export type CustomerProfile = InferSelectModel<typeof customerProfiles>

// ---------------------------------------------------------------------------
// Products & Contracts
// ---------------------------------------------------------------------------
export type Package = InferSelectModel<typeof packages>
export type PackageInsert = InferInsertModel<typeof packages>

export type MitraPhotographer = InferSelectModel<typeof mitraPhotographers>
export type MitraPhotographerInsert = InferInsertModel<typeof mitraPhotographers>

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
export type Event = InferSelectModel<typeof events>
export type EventInsert = InferInsertModel<typeof events>

export type EventPhotographer = InferSelectModel<typeof eventPhotographers>
export type EventPhotographerInsert = InferInsertModel<typeof eventPhotographers>

// ---------------------------------------------------------------------------
// Transactions & Booking
// ---------------------------------------------------------------------------
export type Order = InferSelectModel<typeof orders>
export type OrderInsert = InferInsertModel<typeof orders>

export type Payment = InferSelectModel<typeof payments>
export type PaymentInsert = InferInsertModel<typeof payments>

export type Photo = InferSelectModel<typeof photos>
export type PhotoInsert = InferInsertModel<typeof photos>

export type Review = InferSelectModel<typeof reviews>
export type ReviewInsert = InferInsertModel<typeof reviews>

export type Dispute = InferSelectModel<typeof disputes>
export type DisputeInsert = InferInsertModel<typeof disputes>

// ---------------------------------------------------------------------------
// Combined / Virtual Types (UI Helpers)
// ---------------------------------------------------------------------------
export type OrderWithPackage = Order & {
  package?: Package | null
  photographer?: PhotographerProfile | null
}

export type OrderDetail = Order & {
  package?: Package | null
  payment?: Payment | null
  photographer?: PhotographerProfile | null
  photos?: Photo[]
  review?: Review | null
}

// ---------------------------------------------------------------------------
// Support
// ---------------------------------------------------------------------------
export type Message = InferSelectModel<typeof messages>
export type MessageInsert = InferInsertModel<typeof messages>
