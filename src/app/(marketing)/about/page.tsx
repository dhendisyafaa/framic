import { Camera, Heart, Users, Target } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-20 pb-20">
      <section className="relative pt-20 pb-16 bg-slate-50 overflow-hidden">
        <div className="container mx-auto px-4 md:px-8 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6">
            Tentang <span className="text-primary italic">Framic</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
            Kami adalah platform yang menghubungkan momen berharga Anda dengan mata-mata kreatif terbaik di Indonesia.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-8 grid md:grid-cols-3 gap-12">
        <div className="flex flex-col gap-4 text-center items-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Target className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold">Misi Kami</h3>
          <p className="text-slate-500">Mempermudah akses layanan fotografi profesional bagi siapa saja, di mana saja.</p>
        </div>
        <div className="flex flex-col gap-4 text-center items-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold">Nilai Kami</h3>
          <p className="text-slate-500">Mengutamakan kualitas, transparansi, dan keamanan dalam setiap transaksi.</p>
        </div>
        <div className="flex flex-col gap-4 text-center items-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold">Komunitas</h3>
          <p className="text-slate-500">Membangun ekosistem yang sehat bagi para fotografer untuk terus bertumbuh.</p>
        </div>
      </section>
    </div>
  )
}
