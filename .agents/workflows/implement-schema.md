# Workflow: Implement Database Schema

Gunakan workflow ini untuk mengimplementasikan schema Drizzle untuk entitas baru atau mengupdate yang sudah ada.

## Langkah-langkah

1. **Baca DATABASE.md** — cari section entitas yang diminta, pahami semua kolom, tipe data, dan relasi
2. **Baca schema yang sudah ada** di `src/db/schema/` untuk memahami pattern yang dipakai
3. **Buat atau update file schema** sesuai pattern yang sudah ada:
   - Gunakan `uuid` untuk primary key
   - Gunakan `snake_case` untuk nama kolom
   - Tambahkan `created_at` dan `updated_at`
   - Import enum dari `src/db/schema/enums.ts`
4. **Update** `src/db/schema/index.ts` untuk re-export schema baru
5. **Jalankan** `npm run db:generate` untuk generate migration
6. **Verifikasi** migration yang dihasilkan sudah benar
7. **Jalankan** `npm run db:push` (dev) atau `npm run db:migrate` (prod)

## Checklist Sebelum Selesai
- [ ] Semua kolom sudah sesuai DATABASE.md
- [ ] FK references sudah benar
- [ ] Enum sudah didefinisikan di enums.ts
- [ ] Index sudah ditambahkan sesuai rekomendasi di DATABASE.md Section 6
- [ ] Schema di-export dari index.ts
- [ ] Migration berhasil dijalankan
