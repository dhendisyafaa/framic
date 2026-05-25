import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Camera,
  Target,
  ShieldCheck,
  Layers,
  ArrowRight,
  Coins,
  Users,
  Award,
  Sparkles,
  Building2,
} from "lucide-react"

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-24 pb-28 text-foreground bg-background">

      {/* 1. Hero Section — Visi & Pengantar */}
      <section className="relative w-full pt-12 md:pt-4 pb-6 md:pb-14 overflow-hidden bg-background">
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-16 items-center">

            {/* Sisi Kiri: Editorial Text */}
            <div className="flex flex-col items-start gap-6 animate-in fade-in slide-in-from-left-8 duration-700">
              <div className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  VISI & HARAPAN
                </span>
              </div>

              <div className="flex flex-col gap-4">
                <h1 className="text-4xl md:text-6xl font-medium tracking-[-0.02em] text-foreground leading-[1.1]">
                  Framic: Menghubungkan <br />
                  <span className="text-accent">Dedikasi</span> dengan <br />
                  Eksekusi Sempurna.
                </h1>
                <p className="text-base text-muted-foreground max-w-xl leading-relaxed mt-2 font-medium">
                  Framic menghubungkan klien yang cermat dengan penutur cerita visual kelas dunia, menumbuhkan ekosistem yang selaras di mana setiap frame diabadikan dengan penuh dedikasi.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 mt-2">
                <Link href="/photographers">
                  <Button size="lg" className="rounded-full px-8 h-12 font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-md">
                    Cari Fotografer
                  </Button>
                </Link>
                <Link href="/onboarding">
                  <Button size="lg" variant="outline" className="rounded-full px-8 h-12 font-bold border-border/60 hover:bg-muted/40">
                    Gabung Fotografer atau Mitra
                  </Button>
                </Link>
              </div>
            </div>

            {/* Sisi Kanan: Premium Image Frame */}
            <div className="relative animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
              <div className="relative aspect-[4/3] w-full bg-[#141413] rounded-[40px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.08)] group">
                <img
                  src="https://images.unsplash.com/photo-1603574670812-d24560880210?q=80&w=580"
                  alt="Aesthetic camera lens capture"
                  className="w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-8">
                  <h3 className="text-white text-lg font-medium tracking-tight mb-2">
                    "Setiap bidikan adalah perpaduan rasa, teknik, dan dedikasi."
                  </h3>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">
                    Tim Kurator Framic
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Filosofi Kami */}
      <section className="container mx-auto px-6 md:px-12 py-10 relative overflow-hidden">
        <div className="grid lg:grid-cols-12 gap-12 items-start relative z-10">
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">FILOSOFI KAMI</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-medium tracking-[-0.02em] text-foreground leading-[1.15]">
              Kolaborasi Tiga Pilar Utama.
            </h2>
          </div>
          <div className="lg:col-span-7 space-y-6 text-base text-muted-foreground font-medium leading-relaxed">
            <p>
              Di Framic, kami percaya bahwa fotografi bukan sekadar layanan biasa, ini adalah kolaborasi harmonis antara tiga pilar penting: pelanggan, fotografer, dan mitra pendukung industri kreatif.
            </p>
            <p>
              Platform kami menciptakan ruang aman di mana para seniman dapat fokus pada karya mereka sementara pelanggan menikmati pengalaman premium yang mudah. Kami meminimalkan hambatan logistik, membiarkan karya seni menjadi pusat perhatian utama.
            </p>
          </div>
        </div>

        {/* Visual Decorative Background Lines */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] pointer-events-none opacity-20 dark:opacity-10 z-0">
          <svg className="w-full h-full" viewBox="0 0 1000 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="500" cy="300" r="280" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" />
            <circle cx="500" cy="300" r="180" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" />
          </svg>
        </div>
      </section>

      {/* 3. Desain Transparan  */}
      <section className="container mx-auto px-6 md:px-12 flex flex-col gap-16 py-10">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">TRANSPARANSI SEJAK AWAL</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-medium tracking-[-0.02em] text-foreground">
            Mendefinisikan Ulang Ekonomi Fotografi.
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg">
            Kami menghadirkan integritas finansial bagi para seniman sekaligus memberikan kepastian kualitas bagi pelanggan.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full">
          {/* Card 1: Bagi Hasil yang Adil */}
          <div className="bg-card border border-border/60 rounded-[32px] p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group min-h-[220px]">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <Coins className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Bagi Hasil Adil & Transparan</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Kami memprioritaskan para kreator dengan model bagi hasil yang transparan dan menghargai nilai visi artistik mereka.
              </p>
            </div>
          </div>

          {/* Card 2: Pembayaran Bertahap */}
          <div className="bg-card border border-border/60 rounded-[32px] p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group min-h-[220px]">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Sistem Uang Muka 50%</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Ketenangan pikiran dengan sistem uang muka 50%. Amankan jadwal fotografer Anda tanpa beban pembayaran penuh di awal.
              </p>
            </div>
          </div>

          {/* Card 3: Ekosistem Kemitraan */}
          <div className="bg-card border border-border/60 rounded-[32px] p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group min-h-[220px]">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary text-secondary-foreground border border-border flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Ekosistem Studio Terkoneksi</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Jaringan terkoneksi yang memastikan setiap acara memiliki peralatan dan dukungan terbaik untuk berjalan lancar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Ekosistem Peran */}
      <section className="container mx-auto px-6 md:px-12 flex flex-col gap-12 py-10 bg-muted/20 rounded-[48px] border border-border/40 p-8 md:p-12 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">EKOSISTEM PLATFORM</span>
            </div>
            <h2 className="text-3xl font-medium tracking-[-0.02em] text-foreground">Peran Pengguna Framic</h2>
            <p className="text-sm text-muted-foreground">Tiga pilar utama yang saling terhubung dalam menciptakan kolaborasi tanpa batas.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative z-10 w-full">
          {/* Role 1: Kustomer */}
          <div className="flex flex-col gap-4 p-6 bg-card border border-border/60 rounded-[28px] shadow-sm hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                <Users className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-foreground">Kustomer</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Penikmat momen yang mencari fotografer independen atau studio profesional dengan proses pemesanan yang terjamin, aman, dan transparan.
            </p>
          </div>

          {/* Role 2: Fotografer */}
          <div className="flex flex-col gap-4 p-6 bg-card border border-border/60 rounded-[28px] shadow-sm hover:border-accent/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-accent/10 text-accent rounded-lg">
                <Camera className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-foreground">Fotografer Independen</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Talenta kreatif yang menawarkan jasa fotografi secara personal, sekaligus bisa menerima tawaran eksklusif untuk bergabung dengan Mitra Studio.
            </p>
          </div>

          {/* Role 3: Mitra Studio */}
          <div className="flex flex-col gap-4 p-6 bg-card border border-border/60 rounded-[28px] shadow-sm hover:border-secondary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-secondary text-secondary-foreground border border-border rounded-lg">
                <Building2 className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-foreground">Mitra Studio (Vendor)</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Organisasi / Vendor yang merekrut dan mengelola tim fotografer secara kolektif, serta menangani berbagai proyek dokumentasi berskala besar.
            </p>
          </div>
        </div>

        {/* Backdrop overlay decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
      </section>

      {/* 5. CTA Banner Section */}
      <section className="container mx-auto px-6 md:px-12">
        <div className="bg-[#141413] text-[#F3F0EE] rounded-[40px] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10 overflow-hidden relative shadow-[0_24px_48px_rgba(0,0,0,0.12)]">
          <div className="flex flex-col gap-4 relative z-10 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 justify-center md:justify-start">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D1CDC7]/80">MARI BERGABUNG</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-normal tracking-tight text-white leading-tight">
              Mari Berkolaborasi Bersama Framic.
            </h2>
            <p className="text-[#D1CDC7] text-base font-medium">
              Hubungkan dedikasi Anda dengan eksekusi sempurna melalui seni fotografi profesional terverifikasi.
            </p>
            <div className="flex flex-wrap gap-4 mt-2 justify-center md:justify-start">
              <Link href="/onboarding">
                <Button size="lg" className="rounded-full px-8 h-11 font-bold bg-white text-black hover:bg-white/90 shadow-md">
                  Gabung Sekarang
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative z-10 hidden lg:block opacity-20">
            <Camera className="w-56 h-56 -rotate-12 text-white" />
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-[60px] pointer-events-none" />
        </div>
      </section>

    </div>
  )
}
