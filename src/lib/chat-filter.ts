// src/lib/chat-filter.ts
// Utilitas filter pesan chat — menyaring nomor telepon & email
// sesuai dengan dokumen teknis dan aturan proyek Framic.

const TELEPHONE_PATTERN = /(?:\+?62|0)[\s.-]*8(?:(?:[\.-]|\s+(?!\+?62|08))*[0-9]){7,12}/gi
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const REPLACEMENT_TEXT = "[informasi kontak disembunyikan]"

/**
 * Menyaring nomor telepon dan email dari teks pesan chat,
 * lalu menggantinya dengan "[informasi kontak disembunyikan]".
 * 
 * @param pesan Teks pesan chat yang akan disaring
 * @returns Teks pesan chat yang sudah disensor
 */
export function filterContactInfo(pesan: string): string {
  if (!pesan) return ""
  
  return pesan
    .replace(TELEPHONE_PATTERN, REPLACEMENT_TEXT)
    .replace(EMAIL_PATTERN, REPLACEMENT_TEXT)
}
