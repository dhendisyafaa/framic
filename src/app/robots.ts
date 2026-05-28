import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/onboarding/', '/pending/', '/api/'],
    },
    sitemap: 'https://www.framic.my.id/sitemap.xml',
  }
}
