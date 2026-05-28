import type { MetadataRoute } from 'next'
import { db } from '@/db'
import { photographerProfiles, events } from '@/db/schema'
import { eq } from 'drizzle-orm'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.framic.my.id'

  // 1. Jalur statis (Marketing & Public pages)
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/photographers`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/mitra`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ]

  // 2. Jalur dinamis untuk Profil Fotografer yang sudah terverifikasi (verified)
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
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
  } catch (err) {
    console.error('Error generating sitemap for photographers:', err)
  }

  // 3. Jalur dinamis untuk Event yang sudah dipublish (isPublished)
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
      changeFrequency: 'daily' as const,
      priority: 0.6,
    }))
  } catch (err) {
    console.error('Error generating sitemap for events:', err)
  }

  return [...staticRoutes, ...pgRoutes, ...eventRoutes]
}
