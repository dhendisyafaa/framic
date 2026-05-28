/**
 * Konstanta untuk kategori spesialisasi fotografer.
 * Digunakan di Filter, Onboarding, dan Edit Profil.
 */
export const KATEGORI_OPTIONS = [
  "Wedding",
  "Graduation",
  "Portrait",
  "Event",
  "Product",
  "Landscape"
] as const

export type KategoriType = (typeof KATEGORI_OPTIONS)[number]
