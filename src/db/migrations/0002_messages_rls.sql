-- Migrasi untuk mengaktifkan RLS dan membuat policy pada tabel messages
-- Jalankan query ini di SQL Editor Supabase Anda jika RLS diaktifkan di production.

-- 1. Aktifkan RLS untuk tabel messages
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;

-- 2. Hapus policy lama jika ada
DROP POLICY IF EXISTS "Allow select for anon and authenticated" ON "messages";

-- 3. Buat policy SELECT agar client-side Realtime subscription bisa membaca pesan
CREATE POLICY "Allow select for anon and authenticated" 
ON "messages" 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- Catatan Keamanan:
-- - Policy hanya diizinkan untuk SELECT (membaca) agar realtime chat client bisa menerima pesan baru.
-- - Proses penulisan (INSERT/UPDATE/DELETE) TIDAK diizinkan dari client-side anon.
-- - Semua penulisan dilakukan secara aman oleh server-side API (Hono) menggunakan koneksi database Drizzle yang mem-bypass RLS (menggunakan service role / direct connection).
