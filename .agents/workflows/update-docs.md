# Workflow: Update Documentation

Gunakan workflow ini SETIAP KALI ada keputusan baru sebelum mulai coding.

## Kapan Digunakan
- Ada keputusan product atau teknis baru hasil diskusi dengan developer
- Ada perubahan schema database
- Ada endpoint baru atau perubahan endpoint
- Ada perubahan business rules

## Langkah-langkah

1. **Identifikasi dokumen yang perlu diupdate:**
   - Keputusan product/fitur/business rules → `docs/PRD.md`
   - Perubahan arsitektur/stack/conventions → `docs/TECHNICAL.md`
   - Perubahan schema/entitas/enum → `docs/DATABASE.md`
   - Perubahan endpoint/request/response → `docs/API.md`
   - Perubahan yang mempengaruhi cara AI bekerja → `docs/AI_CONTEXT.md`

2. **Update dokumen yang relevan** dengan keputusan baru

3. **Verifikasi konsistensi** — pastikan tidak ada kontradiksi antar dokumen

4. **Baru mulai coding** setelah docs diupdate

## Aturan Penting
- JANGAN coding sebelum docs diupdate
- JANGAN ubah docs tanpa konfirmasi dari developer
- Jika ada konflik antar dokumen → tanya developer mana yang benar
