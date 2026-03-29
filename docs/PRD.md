# Framic — Product Requirements Document (PRD)

> **Version:** 2.0  
> **Last Updated:** March 2026  
> **Status:** Active  
> This document is the single source of truth for product decisions. Update this before writing any code.

---

## 1. Product Overview

### 1.1 Vision

Framic adalah platform digital booking jasa fotografer yang menghubungkan customer dengan fotografer profesional — baik secara langsung maupun melalui event yang dibuat mitra (Wedding Organizer, kampus, Event Organizer, dll.) — dengan sistem pembayaran bertahap, manajemen kontrak MoU digital, kalender ketersediaan, dan pembagian pendapatan otomatis.

### 1.2 Tagline

> _"Book the moment, own the memory."_

### 1.3 Problem Statement

- Customer kesulitan menemukan fotografer terpercaya sesuai kebutuhan
- Tidak ada platform terpusat yang mengelola booking fotografer dari awal sampai selesai
- Organisasi (WO, kampus, EO) tidak punya tools untuk mengelola pool fotografer secara efisien
- Tidak ada sistem bagi hasil yang transparan antara fotografer dan mitra

### 1.4 Solution

- Discovery dan booking fotografer dengan kalender ketersediaan
- Tiga tipe PG (Photografer): independen, anggota tetap mitra, dan per-event
- Dua jalur booking: langsung ke PG dan via event mitra
- Open recruitment: mitra buka lowongan PG untuk event mereka
- Pembayaran bertahap: DP 50% + pelunasan 50%
- Revenue sharing otomatis: platform → mitra → PG
- MoU digital di-generate platform dengan e-sign sederhana
- Chat terintegrasi dengan dua mode (pre-order dan post-order)

---

## 2. Target Users

### Primary (MVP)

- Mahasiswa yang butuh fotografer untuk wisuda, event kampus, atau kebutuhan personal
- Fotografer freelance yang ingin mendapat order tanpa promosi manual
- Panitia / EO kampus yang butuh fotografer untuk acara rutin

### Secondary (Post-MVP)

- Pasangan yang butuh fotografer prewedding atau wedding
- Wedding Organizer yang ingin mengelola tim fotografer secara digital
- Komunitas atau organisasi yang rutin mengadakan acara berbayar

---

## 3. Business Model

| Stream               | Mekanisme                             | Keterangan                              |
| -------------------- | ------------------------------------- | --------------------------------------- |
| **Komisi Transaksi** | % dari total order                    | Dikunci, tidak bisa diubah selain admin |
| **Revenue Sharing**  | Split 3 arah: platform / mitra / PG   | Persentase ditentukan saat MoU          |
| **Featured Listing** | PG / mitra bayar untuk posisi teratas | Model iklan berbasis slot               |
| **Biaya Admin**      | Flat fee per transaksi                | Di luar komisi persentase               |

---

## 4. User Roles & Permissions

### 4.1 Role System

Satu akun dapat memiliki lebih dari satu role. Role `customer` aktif secara default. Role `photographer` dan `mitra` perlu diajukan dan diverifikasi admin.

| Role           | Cara Mendapatkan                           | Keterangan                                     |
| -------------- | ------------------------------------------ | ---------------------------------------------- |
| `customer`     | Otomatis saat registrasi                   | Default semua akun                             |
| `photographer` | Apply + verifikasi admin                   | Bisa independen, anggota tetap, atau per-event |
| `mitra`        | Apply + approval admin + dokumen legalitas | Bisa rekrut PG tetap DAN buat event            |
| `admin`        | Internal                                   | Tidak bisa didaftarkan dari platform           |

---

## 5. Tiga Tipe Photographer (PG)

### 5.1 PG Independen

- Set harga sendiri dalam bentuk paket (bukan per jam)
- Bebas terima order dari siapapun
- Tidak terikat siapapun
- Bisa request masuk ke event mitra via open recruitment
- Kalender di-block hanya saat ada order aktif

### 5.2 PG Anggota Tetap Mitra

- Terikat kontrak MoU dengan **1 mitra** untuk durasi tertentu
- **Eksklusif** — tidak bisa jadi anggota tetap mitra lain
- Tidak bisa ikut event dari mitra lain
- Bisa terima order independen **saat jadwal kosong** dari event mitra
- Fee flat per event, ditentukan mitra saat buat event
- Ada **minimum fee per event** di MoU sebagai proteksi PG
- Perlu di-assign eksplisit ke setiap event (tidak otomatis)
- Persentase split fix selama durasi kontrak
- Profil tetap muncul di pencarian publik
- Kalender ter-block saat di-assign ke event mitra

### 5.3 PG Kontrak Per-Event

- Terikat hanya untuk 1 event spesifik
- Setelah event selesai, bebas lagi
- Tidak bisa ikut event lain di tanggal yang bentrok
- Fee ditentukan mitra saat buat event (biasanya lebih tinggi dari PG tetap)
- Persentase dinegosiasikan per-event via MoU
- Bisa terima order independen di tanggal lain
- Profil tetap muncul di pencarian publik
- Kalender ter-block selama durasi event

---

## 6. Model Mitra

Semua mitra setara — tidak ada tipe permanen atau adhoc. Yang membedakan hanya perilaku mereka. Setiap mitra punya dua fitur:

### Fitur 1 — Rekrut Anggota Tetap

- Invite PG bergabung sebagai anggota tetap via MoU mitra
- MoU mitra berisi: eksklusivitas, durasi, persentase split, minimum fee per event
- Fee spesifik tidak dibahas di MoU — ditentukan per event

### Fitur 2 — Buat Event

- Buat event dan rekrut PG untuk bertugas
- Dua jalur PG masuk ke event:
  - **Invite langsung** — mitra pilih PG yang sudah dikenal
  - **Open recruitment** — mitra buka lowongan, PG yang request
- Set fee berbeda untuk PG tetap dan PG per-event
- Fee PG tetap tidak boleh di bawah minimum fee MoU

### Fee Structure per Event

```
Event:
├── fee_pg_tetap      → untuk semua PG anggota tetap yang di-assign
│                       tidak boleh < minimum_fee_per_event di MoU
└── fee_pg_per_event  → untuk semua PG kontrak per-event
                        biasanya lebih tinggi (kompensasi tidak ada jaminan job)
```

Semua PG dalam kategori yang sama mendapat fee yang **sama rata**.

---

## 7. Open Recruitment

Mitra bisa membuka lowongan PG untuk event mereka. Tampil di halaman publik "Event Butuh Fotografer".

**Informasi yang ditampilkan:**

- Nama event dan mitra
- Tanggal dan lokasi
- Jumlah PG dibutuhkan dan slot tersisa
- Fee PG per-event
- Deadline pengiriman request

**Yang bisa request:**

- PG independen ✅
- PG yang kontrak anggota tetapnya sudah expired ✅
- PG anggota tetap mitra lain ❌ (eksklusif untuk mitranya)

**Flow:**

```
Mitra set event → "Open Recruitment"
        ↓
PG browse halaman open recruitment → tertarik → kirim request
        ↓
Mitra review semua request → acc/deny per PG
        ↓
PG yang di-acc → negosiasi MoU per-event → e-sign → confirmed
```

---

## 8. Kalender Ketersediaan PG

Setiap PG memiliki kalender publik. Di-derive secara realtime dari dua sumber (tidak ada tabel terpisah):

```
Ter-block (merah):
├── Di-assign ke event mitra → dari event_photographers JOIN events
└── Ada order aktif → dari orders WHERE status IN (confirmed/dp_paid/ongoing)

Tersedia (hijau):
└── Tidak ada entry di kedua sumber
```

Customer tidak bisa booking di tanggal yang ter-block.

---

## 9. MoU System

### MoU Mitra (anggota tetap)

Berisi: identitas kedua pihak, durasi kontrak, persentase split, minimum fee per event, klausul eksklusivitas.

### MoU Per-Event

Berisi: identitas kedua pihak, detail event, fee yang disepakati, persentase split, scope pekerjaan.

### Proses

```
Negosiasi terms di platform → kedua pihak setuju
→ E-sign sederhana (checkbox + timestamp + IP)
→ Kontrak aktif di platform
```

> **PDF Generation (post-MVP):** Kompleksitas implementasi tidak sebanding nilainya untuk target user MVP (mahasiswa, EO kampus). PDF generation via `mou-generator.ts` + Cloudinary upload digeser ke Fase post-MVP.

**Post-MVP:** Integrasi Privy untuk e-sign yang lebih kuat secara legal. PDF MoU di-generate dan bisa didownload.

---

## 10. Core Features MVP (v1.0)

### Auth & Onboarding

- [x] Register / login via Clerk
- [x] Role selection dan form profil per role
- [x] Verifikasi PG dan mitra oleh admin

### Discovery

- [x] Daftar PG dengan filter (lokasi, kategori, rating, ketersediaan)
- [x] Kalender ketersediaan di profil PG
- [x] Daftar event mitra (published)
- [x] Halaman open recruitment

### Booking & Order

- [x] Buat order langsung ke PG (pilih tanggal dari kalender)
- [x] Buat order via event mitra
- [x] Konfirmasi / tolak order oleh PG
- [x] Status order lengkap

### Pembayaran

- [x] DP 50% via Xendit
- [x] Pelunasan 50% via Xendit
- [x] Split payment otomatis via xenPlatform
- [x] Refund saat cancelled

### Hasil Foto

- [x] PG upload hasil foto (Cloudinary)
- [x] Customer preview, konfirmasi, dan download

### Chat (Supabase Realtime)

- [x] Pre-order: mode CS, durasi 24 jam
- [x] Post-order: mode bebas setelah DP dibayar
- [x] Filter nomor telepon otomatis

### Ulasan

- [x] Rating 1-5 + komentar setelah order completed
- [x] Agregat rating tampil di profil PG

### Mitra & Event

- [x] Mitra invite PG tetap / PG request ke mitra
- [x] Mitra buat event
- [x] Mitra assign PG tetap ke event
- [x] Open recruitment — mitra buka lowongan
- [x] PG request ke event open
- [x] Mitra acc/deny request PG

### MoU

- [x] Negosiasi terms di platform (Fase 6)
- [x] E-sign sederhana (checkbox + timestamp + IP)
- [ ] Generate MoU otomatis dari template _(post-MVP: PDF generation)_
- [ ] MoU tersimpan dan bisa didownload _(post-MVP: PDF generation)_

### Dispute

- [x] Customer atau PG raise dispute + upload bukti
- [x] Auto-resolve 3x24 jam
- [x] Eskalasi ke admin via tiket async

---

## 11. Post-MVP Features (v2.0+)

- [ ] E-sign via Privy
- [ ] Pre-accept invite kontrak berikutnya
- [ ] Eksklusivitas sebagai poin negosiasi MoU
- [ ] Featured listing / iklan
- [ ] Notifikasi push
- [ ] Invoice otomatis
- [ ] Dashboard analytics mitra
- [ ] Sistem referral
- [ ] Verifikasi KTP via OCR
- [ ] Mobile app

---

## 12. Business Rules

### Pembayaran

- DP selalu 50% dari total_harga
- Pelunasan selalu 50% sisanya
- Komisi platform dikunci
- Uang ditahan platform selama `disputed`
- Refund hanya bisa sebelum status `dp_paid`

### Kontrak Mitra

- PG hanya boleh punya 1 kontrak anggota tetap aktif
- PG tidak bisa terima invite mitra baru selama kontrak aktif
- Kontrak tidak bisa expired jika masih ada order aktif → `pending_expiry`
- Fee PG tetap per event tidak boleh di bawah minimum_fee_per_event di MoU

### Event

- PG tetap wajib di-assign eksplisit ke event (tidak otomatis)
- Fee PG tetap di event tidak boleh di bawah minimum fee MoU
- Fee PG per-event biasanya lebih tinggi dari PG tetap
- Open recruitment hanya untuk PG independen atau PG expired contract

### Kalender

- Di-derive dari event_photographers dan orders aktif
- Customer tidak bisa booking di tanggal ter-block

### Order

- Satu order hanya melibatkan satu PG
- PG tidak bisa punya dua order `ongoing` di tanggal yang sama
- Ulasan hanya bisa dibuat setelah order `completed`

### Chat

- Pre-order aktif maksimal 24 jam
- Nomor telepon difilter otomatis
- Post-order aktif sejak `dp_paid` hingga `completed`

### Dispute

- Bisa diajukan setelah status `dp_paid`
- Tidak ada response 3x24 jam → auto refund ke customer
- Satu order hanya bisa punya satu dispute aktif

---

## 13. Non-Functional Requirements

| Aspek            | Requirement                                         |
| ---------------- | --------------------------------------------------- |
| **Performance**  | Halaman utama load < 2 detik                        |
| **Availability** | Uptime 99.5%                                        |
| **Security**     | RLS Supabase aktif, semua endpoint terproteksi auth |
| **Scalability**  | Serverless, auto-scale via Vercel                   |
| **Privacy**      | Nomor telepon tidak pernah terekspos di chat        |
| **Compliance**   | Payment via Xendit terdaftar Bank Indonesia         |

---

## 14. Out of Scope (v1.0)

- Mobile app native
- Fitur AI recommendation
- Multi-language (hanya Bahasa Indonesia)
- Integrasi kalender eksternal
- Video call / video preview
- Langganan bulanan PG
- E-sign via Privy
- Pre-accept kontrak berikutnya

---

_Update dokumen ini setiap kali ada keputusan product baru sebelum implementasi._
