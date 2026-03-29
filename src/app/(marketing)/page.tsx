import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Star, MapPin, Camera, CheckCircle, ShieldCheck, Instagram, ArrowRight } from "lucide-react"

async function getTopPhotographers() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/photographers?limit=8&sortBy=rating`, {
    next: { revalidate: 0 } // Cache disabled for testing
  })
  if (!res.ok) return []
  const json = await res.json()
  return json.success ? json.data : []
}

export default async function LandingPage() {
  const photographers = await getTopPhotographers()

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* New Professional Hero Section (Inspired by Jepreto) */}
      <section className="relative w-full pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden bg-white">
        {/* Subtle Decorative Elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute top-[20%] left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -translate-x-1/2" />

        <div className="container mx-auto px-4 md:px-8 relative z-10 flex flex-col gap-20">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-16 items-center">

            {/* Sisi Kiri: Heading & CTA */}
            <div className="flex flex-col items-start gap-8 animate-in fade-in slide-in-from-left-8 duration-700">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-widest border border-primary/20">
                <Camera className="w-3.5 h-3.5" />
                #1 Platform Fotografi di Indonesia
              </div>

              <div className="flex flex-col gap-4">
                <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 leading-[1.05]">
                  Abadikan Momen <br />
                  <span className="text-primary italic">Terbaik</span> Bersama <br />
                  <span className="relative inline-block">
                    Framic!
                    <div className="absolute bottom-2 left-0 w-full h-3 bg-primary/20 -z-10 rounded-full" />
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-slate-500 max-w-xl leading-relaxed mt-2 font-medium">
                  Temukan fotografer profesional dalam hitungan menit. Dari pernikahan, wisuda, hingga event bisnis, kami siap membingkai kebahagiaan Anda.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <Link href="/photographers">
                  <Button size="lg" className="w-full sm:w-auto text-lg h-16 px-10 rounded-2xl font-black shadow-xl shadow-primary/25 gap-2">
                    <Star className="w-5 h-5 fill-white" />
                    Mulai Sekarang
                  </Button>
                </Link>
                <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Free 100+ Master File
                </div>
              </div>

              {/* Stats Row di bawah Sisi Kiri */}
              <div className="flex flex-wrap items-center gap-10 mt-6 pt-10 border-t border-slate-100 w-full">
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-slate-900">100+</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fotografer Aktif</span>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-slate-900">10K++</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Momen Terabadikan</span>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-slate-900 flex items-center gap-1">
                    4.9 <Star className="w-6 h-6 fill-primary text-primary" />
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">User Rating</span>
                </div>
              </div>
            </div>

            {/* Sisi Kanan: Features Promo Card */}
            <div className="animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
              <div className="relative p-1 bg-gradient-to-br from-primary/30 to-blue-500/20 rounded-[3rem] shadow-2xl">
                <div className="bg-white/90 backdrop-blur-xl border border-white/50 p-10 rounded-[2.8rem] flex flex-col gap-8">
                  <div className="flex items-center justify-between">
                    <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3" />
                      Launching Tahap 3
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <h3 className="text-3xl font-black text-slate-900 leading-tight">
                      Pesan Fotografer <br />
                      <span className="text-primary">Sesuai Budget Anda!</span>
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed italic">
                      Dapatkan akses ke ratusan talent terbaik dengan proses booking yang praktis, aman, dan transparan.
                    </p>
                  </div>

                  <div className="flex flex-col gap-5 border-y border-slate-100 py-8">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="font-bold text-slate-900">Kualitas Terjamin</span>
                        <span className="text-xs text-slate-500">Fotografer melalui proses kurasi berkala.</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="font-bold text-slate-900">Pembayaran Aman</span>
                        <span className="text-xs text-slate-500">Sistem Escrow, dana aman hingga foto diterima.</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 flex-shrink-0">
                        <Instagram className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="font-bold text-slate-900">Portfolio Asli</span>
                        <span className="text-xs text-slate-500">Hasil karya terverifikasi & ulasan jujur kustomer.</span>
                      </div>
                    </div>
                  </div>

                  <Link href="/onboarding">
                    <Button className="w-full h-16 rounded-2xl text-lg font-black group gap-2">
                      Gabung Sekarang
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-4">
                    Tunggu apalagi? Wujudkan visual impian Anda!
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Featured Photographers Grid */}
      <section className="container mx-auto px-4 md:px-8 flex flex-col gap-10">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight">Fotografer Unggulan</h2>
            <p className="text-muted-foreground">Eksplorasi fotografer dengan rating tertinggi di platform kami.</p>
          </div>
          <Link href="/photographers">
            <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/5">
              Lihat Semua &rarr;
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {photographers.length > 0 ? (
            photographers.map((pg: any) => (
              <Card key={pg.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-border/50">
                <CardHeader className="p-0 aspect-[4/5] relative overflow-hidden bg-slate-100">
                  {pg.avatarUrl ? (
                    <img
                      src={pg.avatarUrl}
                      alt={pg.nama}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                      <Camera className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg flex justify-between items-center translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mulai dari</span>
                      <span className="text-sm font-bold text-slate-900">
                        {pg.packageStartingFrom ? `Rp ${pg.packageStartingFrom.toLocaleString('id-ID')}` : 'Hubungi Photographer'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-lg">
                      <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                      <span className="text-sm font-bold text-primary">{pg.ratingAverage || '0.0'}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">{pg.nama}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{pg.kotaDomisili}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {pg.kategori?.slice(0, 2).map((cat: string) => (
                      <span key={cat} className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {cat}
                      </span>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="p-5 pt-0">
                  <Link href={`/photographers/${pg.id}`} className="w-full">
                    <Button variant="outline" className="w-full border-slate-200 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                      Lihat Profil
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-20 text-center flex flex-col items-center gap-4 border-2 border-dashed rounded-3xl bg-slate-50/50">
              <Camera className="w-12 h-12 text-slate-300" />
              <p className="text-slate-500 font-medium">Belum ada fotografer unggulan yang tersedia.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 md:px-8">
        <div className="bg-primary rounded-[2.5rem] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10 text-white overflow-hidden relative shadow-2xl shadow-primary/20">
          <div className="flex flex-col gap-4 relative z-10 max-w-xl text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">Miliki Bakat Fotografi atau Organisasi?</h2>
            <p className="text-white/80 text-lg">
              Bergabunglah sebagai Fotografer atau Mitra kami dan kembangkan potensi bisnis Anda bersama platform Framic.
            </p>
            <div className="flex flex-wrap gap-4 mt-2 justify-center md:justify-start">
              <Link href="/onboarding">
                <Button size="lg" variant="secondary" className="font-bold">
                  Daftar Sekarang
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative z-10 hidden lg:block opacity-20">
            <Camera className="w-64 h-64 -rotate-12" />
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-[60px]" />
        </div>
      </section>
    </div>
  )
}
