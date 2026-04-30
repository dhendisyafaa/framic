import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Dari shadcn/ui — merge Tailwind classes dengan benar
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ---------------------------------------------------------------------------
// Currency
// ---------------------------------------------------------------------------

/**
 * Format angka (Rupiah) menjadi string currency Indonesia.
 * @example formatRupiah(1500000) → "Rp 1.500.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format Rupiah versi singkat untuk tampilan card/list.
 * @example formatRupiahCompact(1500000) → "Rp 1,5 jt"
 */
export function formatRupiahCompact(amount: number): string {
  if (amount >= 1_000_000) {
    const value = amount / 1_000_000
    const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1)
    return `Rp ${formatted} jt`
  }
  if (amount >= 1_000) {
    const value = amount / 1_000
    const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1)
    return `Rp ${formatted} rb`
  }
  return formatRupiah(amount)
}

// ---------------------------------------------------------------------------
// Date
// ---------------------------------------------------------------------------

/**
 * Format tanggal ke string Indonesia.
 * @example formatDate(new Date()) → "Rabu, 18 Maret 2026"
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date))
}

/**
 * Format tanggal singkat.
 * @example formatDateShort(new Date()) → "18 Mar 2026"
 */
export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date))
}

