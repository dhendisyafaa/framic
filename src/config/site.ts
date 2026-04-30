// src/config/site.ts
// Metadata dan konfigurasi umum site Framic
// Dipakai untuk <Metadata> Next.js, OG tags, dan SEO

import { getBaseUrl } from "@/lib/api-url"

export const siteConfig = {
  name: "Framic",
  tagline: "Book the moment, own the memory.",
  description:
    "Platform booking jasa fotografer profesional. Temukan fotografer terbaik untuk wisuda, wedding, event, dan kebutuhan foto lainnya.",
  url: getBaseUrl(),

  // Open Graph
  ogImage: "/og-image.png",

  // Navigasi publik
  navLinks: [
    { label: "Fotografer", href: "/photographers" },
    { label: "Event", href: "/events" },
    { label: "Open Recruitment", href: "/events/open" },
  ],

  // Kontak & sosial (isi saat go-live)
  links: {
    instagram: "https://instagram.com/framic.id",
    email: "halo@framic.id",
  },
} as const

export type SiteConfig = typeof siteConfig
