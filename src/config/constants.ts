// src/config/constants.ts
// Konstanta platform Framic — SCREAMING_SNAKE sesuai naming convention
// ⚠️ Jangan hardcode nilai-nilai ini langsung di kode — selalu import dari sini

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------

/** Persentase DP dari total harga. Selalu 50% — tidak bisa diubah. */
export const DP_PERCENTAGE = 50

/** Persentase pelunasan dari total harga. Selalu 50% — tidak bisa diubah. */
export const SETTLEMENT_PERCENTAGE = 50

/** Komisi platform default (persen). Dikunci, tidak bisa diubah user. */
export const DEFAULT_PLATFORM_FEE_PERCENT = 10

// ---------------------------------------------------------------------------
// File Upload
// ---------------------------------------------------------------------------

/** Maksimum ukuran satu file foto hasil order (bytes) — 10 MB */
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024

/** Maksimum ukuran file dokumen legalitas mitra (bytes) — 5 MB */
export const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024

/** Maksimum jumlah foto hasil per order */
export const MAX_PHOTOS_PER_ORDER = 100

/** Maksimum jumlah foto portofolio per PG */
export const MAX_PORTFOLIO_PHOTOS = 20

/** Format yang diizinkan untuk foto */
export const ALLOWED_IMAGE_FORMATS = ["image/jpeg", "image/png", "image/webp"]

/** Format yang diizinkan untuk dokumen */
export const ALLOWED_DOCUMENT_FORMATS = ["application/pdf"]

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

/** Teks pengganti nomor telepon / email di chat */
export const CONTACT_FILTER_REPLACEMENT = "[informasi kontak disembunyikan]"

// ---------------------------------------------------------------------------
// Dispute
// ---------------------------------------------------------------------------

/** Durasi auto-resolve dispute dalam hari (3x24 jam) */
export const DISPUTE_AUTO_RESOLVE_DAYS = 3

/** Maksimum file bukti yang bisa diupload per dispute */
export const MAX_DISPUTE_EVIDENCE_FILES = 5

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

/** Jumlah item default per halaman */
export const DEFAULT_PAGE_SIZE = 12

/** Maksimum item per halaman */
export const MAX_PAGE_SIZE = 100

// ---------------------------------------------------------------------------
// Order
// ---------------------------------------------------------------------------

/**
 * Status order yang dianggap "aktif" (memblock kalender PG).
 * Ingat: kalender di-derive dari query, bukan tabel terpisah.
 */
export const ACTIVE_ORDER_STATUSES = [
  "confirmed",
  "dp_paid",
  "ongoing",
] as const
