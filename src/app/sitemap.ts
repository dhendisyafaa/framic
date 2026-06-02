// src/app/sitemap.ts
// Referensi: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
//
// Catatan penting dari dokumentasi resmi Next.js & Google:
// - `changeFrequency` dan `priority` diabaikan oleh Googlebot, tidak perlu dicantumkan
// - `lastModified` adalah satu-satunya field metadata yang benar-benar dipakai Google
// - `revalidate` memastikan sitemap di-regenerate berkala (ISR) tanpa perlu deploy ulang

import type { MetadataRoute } from 'next'
import { db } from '@/db'
import { photographerProfiles, events } from '@/db/schema'
import { eq } from 'drizzle-orm'

// ISR: regenerate sitemap setiap 24 jam tanpa perlu deploy ulang
// Googlebot biasanya crawl setiap beberapa hari, jadi 24 jam sudah cukup
export const revalidate = 86400 // 24 jam dalam detik

const baseUrl = (
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.framic.my.id'
).replace(/\/$/, '') // hapus trailing slash jika ada

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  // ---------------------------------------------------------------------------
  // 1. Rute statis — halaman publik yang selalu ada
  // ---------------------------------------------------------------------------
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/photographers`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/mitra`,
      lastModified: new Date(),
    },
  ]

  // ---------------------------------------------------------------------------
  // 2. Rute dinamis — profil fotografer yang sudah terverifikasi
  // ---------------------------------------------------------------------------
  let pgRoutes: MetadataRoute.Sitemap = []
  try {
    const verifiedPgs = await db
      .select({
        username: photographerProfiles.username,
        updatedAt: photographerProfiles.updatedAt,
      })
      .from(photographerProfiles)
      .where(eq(photographerProfiles.verificationStatus, 'verified'))

    pgRoutes = verifiedPgs
      .filter((pg) => pg.username !== null)
      .map((pg) => ({
        url: `${baseUrl}/photographers/${pg.username}`,
        lastModified: pg.updatedAt ? new Date(pg.updatedAt) : new Date(),
      }))
  } catch (err) {
    console.error('[sitemap] Gagal mengambil data fotografer:', err)
  }

  // ---------------------------------------------------------------------------
  // 3. Rute dinamis — event yang sudah dipublish
  // ---------------------------------------------------------------------------
  let eventRoutes: MetadataRoute.Sitemap = []
  try {
    const publishedEvents = await db
      .select({
        id: events.id,
        updatedAt: events.updatedAt,
      })
      .from(events)
      .where(eq(events.isPublished, true))

    eventRoutes = publishedEvents.map((evt) => ({
      url: `${baseUrl}/events/${evt.id}`,
      lastModified: evt.updatedAt ? new Date(evt.updatedAt) : new Date(),
    }))
  } catch (err) {
    console.error('[sitemap] Gagal mengambil data event:', err)
  }

  return [...staticRoutes, ...pgRoutes, ...eventRoutes]
}
