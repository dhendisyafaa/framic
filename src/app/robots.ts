import type { MetadataRoute } from 'next'

const baseUrl = (
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.framic.my.id'
).replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/onboarding/', '/pending/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
