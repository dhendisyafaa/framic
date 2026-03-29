// src/db/schema/enums.ts
// PostgreSQL native enums — sesuai DATABASE.md §2
// ⚠️ Tidak ada chat_mode — satu mode chat, tanpa perbedaan pre/post order

import { pgEnum } from "drizzle-orm/pg-core"

// ---------------------------------------------------------------------------
// Verifikasi
// ---------------------------------------------------------------------------

export const verificationStatusEnum = pgEnum("verification_status", [
  "pending", // menunggu review admin
  "verified", // sudah diverifikasi
  "rejected", // ditolak admin
  "suspended", // disuspend admin
])

// ---------------------------------------------------------------------------
// Kontrak Mitra-PG
// ---------------------------------------------------------------------------

export const contractStatusEnum = pgEnum("contract_status", [
  "active", // kontrak aktif
  "pending_expiry", // tanggal habis tapi masih ada order aktif
  "expired", // kontrak habis dan semua order selesai
  "terminated", // diputus manual sebelum waktunya
])

export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending", // menunggu response
  "accepted", // diterima
  "rejected", // ditolak
])

export const initiatedByEnum = pgEnum("initiated_by", [
  "photographer", // PG yang request duluan
  "mitra", // mitra yang invite duluan
])

// ---------------------------------------------------------------------------
// Order
// ---------------------------------------------------------------------------

export const orderStatusEnum = pgEnum("order_status", [
  "pending", // order dibuat, menunggu konfirmasi PG
  "confirmed", // PG setuju, menunggu DP
  "dp_paid", // DP 50% sudah dibayar, sesi terjadwal
  "ongoing", // sesi foto sedang berlangsung
  "delivered", // PG sudah upload semua file
  "completed", // customer konfirmasi terima file, pelunasan lunas
  "cancelled", // dibatalkan salah satu pihak
  "disputed", // ada masalah, uang ditahan platform
])

export const orderTypeEnum = pgEnum("order_type", [
  "direct", // langsung ke PG independen
  "event", // melalui event mitra
])

// ---------------------------------------------------------------------------
// Pembayaran
// ---------------------------------------------------------------------------

export const dpStatusEnum = pgEnum("dp_status", [
  "unpaid",
  "pending", // invoice dibuat, menunggu bayar
  "paid",
  "refunded",
])

export const settlementStatusEnum = pgEnum("settlement_status", [
  "unpaid",
  "pending", // menunggu konfirmasi customer
  "paid",
  "refunded",
])

// ---------------------------------------------------------------------------
// Dispute
// ---------------------------------------------------------------------------

export const disputeStatusEnum = pgEnum("dispute_status", [
  "open",
  "waiting_response",
  "under_review",
  "resolved_customer",
  "resolved_photographer",
  "escalated",
])

export const disputeRaisedByEnum = pgEnum("dispute_raised_by", [
  "customer",
  "photographer",
])

// ---------------------------------------------------------------------------
// Mitra
// ---------------------------------------------------------------------------

export const mitraTypeEnum = pgEnum("mitra_type", [
  "wedding_organizer",
  "kampus",
  "event_organizer",
  "komunitas",
  "perusahaan",
  "lainnya",
])

// ---------------------------------------------------------------------------
// Photographer
// ---------------------------------------------------------------------------

export const photographerTypeEnum = pgEnum("photographer_type", [
  "independent", // PG independen
  "mitra_permanent", // PG anggota tetap mitra (ada di mitra_photographers aktif)
  "event_only", // PG kontrak per-event saja
])
