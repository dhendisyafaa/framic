# Framic

> **Book the moment, own the memory.**

Framic adalah platform marketplace dan manajemen _booking_ jasa fotografer profesional terkurasi. Kami hadir untuk mempertemukan **Kustomer** yang membutuhkan jasa dokumentasi premium dengan **Fotografer Independen** berkualitas, serta **Mitra Studio** untuk penanganan acara berskala besar.

---

## Fitur Utama Platform

- **Autentikasi Multi-Peran**: Sistem autentikasi tangguh dengan Clerk yang mengelola _role_ Kustomer, Fotografer, Mitra, dan Admin secara terpusat.
- **Live Chat Realtime**: Fitur komunikasi _realtime_ di dalam platform (didukung oleh Supabase Realtime) tanpa perlu membagikan kontak pribadi demi keamanan pengguna.
- **Sistem Escrow & Transaksi Aman**: Alur pemesanan yang aman dengan skema Uang Muka (DP) 50% di awal untuk mengamankan jadwal, dan 50% pelunasan setelah proyek rampung.
- **Portofolio Terverifikasi**: Etalase digital bagi fotografer untuk memamerkan hasil jepretan, lengkap dengan ulasan jujur dan _rating_ dari klien asli.
- **Ekosistem Mitra & Open Recruitment**: Fitur _Open Recruitment_ (lowongan) yang memungkinkan Mitra Studio mencari fotografer kontrak lepas/freelancer untuk bergabung dalam proyek besar secara mudah.
- **Tema Adaptif**: Antarmuka _pixel-perfect_ yang mendukung penuh mode Terang (Light Mode) dan Gelap (Dark Mode).

---

## Stack Teknologi Utama

Proyek ini dibangun di atas arsitektur _modern web ecosystem_:

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router & React Server Components)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Database**: PostgreSQL (dihosting di [Supabase](https://supabase.com/))
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Autentikasi**: [Clerk](https://clerk.com/)
- **Storage**: [Cloudinary](https://cloudinary.com/) & Supabase Storage
- **Pemantauan (Monitoring)**: [Sentry](https://sentry.io/) (Error Tracking) & [PostHog](https://posthog.com/) (Product Analytics)

---

## Memulai di Environtment Lokal (Development)

### 1. Prasyarat

Pastikan Anda telah menginstal [Node.js](https://nodejs.org/en) (disarankan versi 18 ke atas) dan `npm`.

### 2. Instalasi Dependensi

Jalankan perintah berikut di terminal:

```bash
npm install
```

### 3. Konfigurasi Environment Variables

Salin file `env.example` ke file baru bernama `.env.local` atau `.env`, dan isi variabelnya sesuai dengan kredensial API keys milik Anda:

```bash
cp env.example .env.local
```

### 4. Persiapan Database

Pastikan koneksi string Supabase PostgreSQL Anda valid, lalu jalankan sinkronisasi skema menggunakan Drizzle:

```bash
npm run db:push
```

Untuk mengintip atau memanipulasi data melalui Drizzle Studio, jalankan:

```bash
npm run db:studio
```

### 5. Jalankan Server Development

```bash
npm run dev
```

Buka browser ke alamat [http://localhost:3000](http://localhost:3000) untuk melihat hasilnya.

---

## Struktur Utama Direktori

```text
framic/
├── src/
│   ├── app/           # Konfigurasi routing Next.js (App Router), halaman, & layout
│   ├── components/    # Kumpulan komponen UI (Common, Features, UI-Library)
│   ├── config/        # File konfigurasi global (site config, analytic config)
│   ├── lib/           # Fungsi utilitas, wrapper library pihak ketiga (Zod, Supabase)
│   └── server/        # Skema database Drizzle (schema.ts), API routes, dan services
└── public/            # File aset statis (gambar, font lokal, icon)
```

---

**Hak Cipta © Framic. All rights reserved.**
