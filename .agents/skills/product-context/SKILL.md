---
name: product-context
description: Loads Framic product requirements, business rules, user roles, and feature specifications. Use when working on new features, discussing requirements, or checking business logic.
---

# Framic Product Context

Baca `docs/PRD.md` untuk detail lengkap. Ringkasan di bawah ini untuk orientasi cepat.

## Apa itu Framic?
Platform booking jasa fotografer yang menghubungkan customer, photographer (PG), dan mitra (WO, kampus, EO, dll.)

## Tiga Tipe PG
- **Independen** — set harga sendiri via paket, bebas terima order siapapun
- **Anggota Tetap Mitra** — kontrak MoU dengan 1 mitra, eksklusif, fee flat per event, bisa order independen saat jadwal kosong
- **Kontrak Per-Event** — terikat 1 event saja, bebas setelah event selesai

## Model Mitra
Semua mitra setara (tidak ada tipe). Punya dua fitur:
1. Rekrut anggota tetap → MoU mitra (durasi + persentase + minimum fee)
2. Buat event → invite langsung atau open recruitment

## Fee Structure per Event
- `fee_pg_tetap` → untuk PG anggota tetap yang di-assign (≥ minimum fee MoU)
- `fee_pg_per_event` → untuk PG kontrak per-event (biasanya lebih tinggi)
- Semua PG dalam kategori yang sama dapat fee sama rata

## Business Rules Penting
- DP selalu **50%**, pelunasan selalu **50%**
- Komisi platform **dikunci** — tidak bisa diubah user
- PG hanya boleh 1 kontrak anggota tetap aktif dalam satu waktu
- PG anggota tetap tidak bisa ikut event mitra lain
- Open recruitment: hanya PG independen atau expired contract yang bisa apply

## Status Order
```
pending → confirmed → dp_paid → ongoing → delivered → completed
                                                    ↘ cancelled
                                                    ↘ disputed
```

## Untuk Detail Lengkap
Baca `docs/PRD.md` — terutama Section 12 (Business Rules) sebelum implementasi logika apapun.
