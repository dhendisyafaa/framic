import Link from "next/link"
import { Globe, Instagram, Facebook, Linkedin, Youtube } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-[#141413] text-[#F3F0EE] border-t border-muted/10 pt-16 pb-20 px-6 md:px-12">
      <div className="container mx-auto max-w-6xl flex flex-col gap-12">

        {/* Top: Brand & Conversational H2 */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 pb-12 border-b border-muted/10">
          <div className="flex flex-col gap-4 max-w-md">
            <div className="flex items-center space-x-2.5">
              <div className="relative w-8 h-5 flex items-center">
                <div className="w-4 h-4 rounded-full bg-white" />
                <div className="w-4 h-4 rounded-full bg-[#FF5F00] -ml-2.5 mix-blend-screen opacity-90" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">Framic</span>
            </div>
            <p className="text-sm text-[#D1CDC7] leading-relaxed">
              Platform booking jasa fotografer profesional terpercaya. Rekam dan abadikan setiap momen berharga Anda dengan mudah.
            </p>
          </div>
          <div className="flex-1 md:text-right">
            <h2 className="text-xl md:text-2xl font-normal leading-tight tracking-tight text-white max-w-md md:ml-auto">
              Framic selalu ada saat Anda membutuhkan visual terbaik.
            </h2>
          </div>
        </div>

        {/* Middle: Tautan Navigasi (Sitemap) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-4">
            <h3 className="text-[11px] font-bold text-[#A39F99] uppercase tracking-[0.15em]">Layanan</h3>
            <div className="flex flex-col gap-2.5">
              <Link href="/photographers" className="text-sm text-[#D1CDC7] hover:text-white transition-colors">
                Direktori Fotografer
              </Link>
              <Link href="/events" className="text-sm text-[#D1CDC7] hover:text-white transition-colors">
                Galeri Kolaborasi
              </Link>
              <Link href="/events/open" className="text-sm text-[#D1CDC7] hover:text-white transition-colors">
                Open Recruitment
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-[11px] font-bold text-[#A39F99] uppercase tracking-[0.15em]">Kemitraan</h3>
            <div className="flex flex-col gap-2.5">
              <Link href="/onboarding" className="text-sm text-[#D1CDC7] hover:text-white transition-colors">
                Gabung sebagai Fotografer
              </Link>
              <Link href="/onboarding" className="text-sm text-[#D1CDC7] hover:text-white transition-colors">
                Daftar sebagai Mitra
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-[11px] font-bold text-[#A39F99] uppercase tracking-[0.15em]">Perusahaan</h3>
            <div className="flex flex-col gap-2.5">
              <Link href="/about" className="text-sm text-[#D1CDC7] hover:text-white transition-colors">
                Tentang Kami
              </Link>
              <Link href="#" className="text-sm text-[#D1CDC7] hover:text-white transition-colors">
                Hubungi Kami
              </Link>
              <Link href="#" className="text-sm text-[#D1CDC7] hover:text-white transition-colors">
                FAQ
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-[11px] font-bold text-[#A39F99] uppercase tracking-[0.15em]">Lokasi / Bahasa</h3>
            <div className="flex">
              <button className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-full text-xs font-bold text-white bg-[#141413] hover:bg-[#20201F] transition-all">
                <Globe className="w-3.5 h-3.5" />
                Indonesia (ID)
              </button>
            </div>
          </div>
        </div>

        {/* Bottom: Divider & Copyright & Socials */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-[#A39F99]">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6">
            <span>&copy; {new Date().getFullYear()} Framic Platform. All rights reserved.</span>
            <span className="hidden md:inline text-white/10">|</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="https://www.instagram.com/framic.id" className="text-[#D1CDC7] hover:text-white transition-colors" aria-label="Instagram">
              <Instagram className="w-4 h-4" />
            </Link>
            <Link href="#" className="text-[#D1CDC7] hover:text-white transition-colors" aria-label="Facebook">
              <Facebook className="w-4 h-4" />
            </Link>
            <Link href="#" className="text-[#D1CDC7] hover:text-white transition-colors" aria-label="LinkedIn">
              <Linkedin className="w-4 h-4" />
            </Link>
            <Link href="#" className="text-[#D1CDC7] hover:text-white transition-colors" aria-label="YouTube">
              <Youtube className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>
    </footer>
  )
}

