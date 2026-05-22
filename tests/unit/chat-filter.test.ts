// tests/unit/chat-filter.test.ts
import { describe, expect, it } from "vitest"
import { filterContactInfo } from "../../src/lib/chat-filter"

describe("filterContactInfo", () => {
  it("should censor simple Indonesian phone numbers starting with 08", () => {
    const text = "Hubungi saya di 081234567890"
    expect(filterContactInfo(text)).toBe("Hubungi saya di [informasi kontak disembunyikan]")
  })

  it("should censor phone numbers with +62 prefix", () => {
    const text = "Nomor saya +628234284283 ya"
    expect(filterContactInfo(text)).toBe("Nomor saya [informasi kontak disembunyikan] ya")
  })

  it("should censor phone numbers with space and hyphen formatting", () => {
    const text1 = "Kontak: +62 834-3424-3424"
    const text2 = "Kontak: 0893-3424-2423"
    expect(filterContactInfo(text1)).toBe("Kontak: [informasi kontak disembunyikan]")
    expect(filterContactInfo(text2)).toBe("Kontak: [informasi kontak disembunyikan]")
  })

  it("should censor email addresses", () => {
    const text = "Kirim detailnya ke email budi.santoso@gmail.com"
    expect(filterContactInfo(text)).toBe("Kirim detailnya ke email [informasi kontak disembunyikan]")
  })

  it("should censor multiple contacts in a single message", () => {
    const text = "Email saya budi@mail.com dan nomor hp +62 834-3424-3424"
    expect(filterContactInfo(text)).toBe("Email saya [informasi kontak disembunyikan] dan nomor hp [informasi kontak disembunyikan]")
  })

  it("should not censor short numbers that are not phone numbers", () => {
    const text = "Saya butuh 08 buah apel"
    expect(filterContactInfo(text)).toBe("Saya butuh 08 buah apel")
  })
})
