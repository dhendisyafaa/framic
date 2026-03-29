import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 md:px-8 py-10 md:py-16 flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
        
        {/* Brand & Tagline */}
        <div className="flex flex-col gap-3 max-w-sm text-center md:text-left">
          <span className="text-2xl font-bold tracking-tight">Framic</span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Platform booking jasa fotografer profesional terpercaya. Rekam dan abadikan setiap momen berharga Anda dengan mudah.
          </p>
        </div>
        
        {/* Tautan Navigasi (Sitemap) MVP */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-16 text-center md:text-left">
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-foreground">Layanan</h4>
            <Link href="/photographers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Direktori Fotografer
            </Link>
            <Link href="/events" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Galeri Kolaborasi
            </Link>
            <Link href="/events/open" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Open Recruitment
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-foreground">Kemitraan</h4>
            <Link href="/onboarding" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Gabung sebagai Fotografer
            </Link>
            <Link href="/onboarding" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Daftar sebagai Mitra
            </Link>
          </div>
        </div>
      </div>
      
      {/* Copyright */}
      <div className="border-t">
        <div className="container mx-auto px-4 md:px-8 py-6 flex justify-between items-center text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} Framic Platform. All rights reserved.</span>
          <span className="hidden md:inline">Phase 3 MVP Version</span>
        </div>
      </div>
    </footer>
  )
}
