// src/types/api.ts
// Format standar JSON Response untuk Hono API — Sesuai API.md §1

import type { PhotographerProfile } from "./index"

export type ApiResponse<T = unknown> =
  | {
      success: true
      data: T
      meta?: {
        total: number
        page: number
        limit: number
        totalPages: number
      }
    }
  | {
      success: false
      error: string
    }

// Tipe helper utilitas umum interaksi frontend-backend
export interface PaginationQuery {
  page?: number
  limit?: number
}

// ---------------------------------------------------------------------------
// Tipe Kalkulasi & Listing Halaman Publik
// ---------------------------------------------------------------------------

/**
 * Tipe ringkas dari fotografer untuk kebutuhan Katalog Profil (Listing)
 * Mengabaikan beberapa field sensitif dan menambah data agregrasi (contoh: harga termurah).
 */
export type PhotographerListingItem = Pick<
  PhotographerProfile,
  | "id"
  | "bio"
  | "kotaDomisili"
  | "kategori"
  | "ratingAverage"
  | "ratingCount"
  | "isAvailable"
  | "portfolioUrls"
> & {
  nama: string
  avatarUrl: string
  /**
   * Harga paket termurah (didapat dari LEFT JOIN ke tabel packages)
   * Berisi null jika PG belum pernah mengatur paket harga apa pun.
   */
  packageStartingFrom: number | null
}
