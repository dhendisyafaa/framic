# Workflow: Implement API Endpoint

Gunakan workflow ini untuk mengimplementasikan endpoint Hono baru.

## Langkah-langkah

1. **Baca API.md** — cari endpoint yang diminta, pahami method, auth, request body, validasi, dan response format
2. **Baca PRD.md** — cari business rules yang relevan dengan endpoint ini
3. **Baca DATABASE.md** — pahami schema tabel yang terlibat
4. **Buat atau update route handler** di `src/server/routes/{domain}.ts`:
   ```typescript
   // Pattern wajib
   router.post('/', zValidator('json', Schema), async (c) => {
     const { userId } = auth()
     if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401)
     
     try {
       const data = await db.query...
       return c.json({ success: true, data })
     } catch (error) {
       return c.json({ success: false, error: 'Internal server error' }, 500)
     }
   })
   ```
5. **Register router** di `src/app/api/[[...route]]/route.ts` jika domain baru
6. **Test endpoint** dengan Scalar di `/scalar` atau via curl

## Checklist Sebelum Selesai
- [ ] Auth guard sudah benar sesuai role di API.md
- [ ] Validasi input dengan Zod
- [ ] Response format `{ success, data }` atau `{ success, error }`
- [ ] Error handling dengan try/catch
- [ ] Multi-table update menggunakan transaction
- [ ] Untuk chat: filter kontak sebelum INSERT
- [ ] Untuk orders: cek kalender sebelum create
- [ ] Untuk payments webhook: validasi x-callback-token
