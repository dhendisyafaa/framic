import { EventCard } from "@/components/features/event/event-card"
import { Users, Briefcase, Info } from "lucide-react"
import { currentUser } from "@clerk/nextjs/server"

async function getOpenRecruitments() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/events/open`, {
    cache: 'no-store'
  })
  if (!res.ok) return []
  const json = await res.json()
  return json.success ? json.data : []
}

export default async function OpenRecruitmentPage() {
  const recruitments = await getOpenRecruitments()
  const clerkUser = await currentUser()
  const isPhotographer = clerkUser?.publicMetadata?.role === "photographer"

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 md:py-16 flex flex-col gap-12">
      {/* Search Header Area */}
      <div className="flex flex-col gap-5 text-center items-center max-w-3xl mx-auto">
        <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
          <Briefcase className="w-3.5 h-3.5" />
          Peluang Kerjasama
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Open Recruitment</h1>
        <p className="text-lg text-muted-foreground">
          Temukan berbagai proyek event dari mitra kami yang sedang mencari fotografer profesional. Ambil kesempatan ini untuk mendongkrak portfolio Anda.
        </p>
      </div>

      <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-2xl flex items-start gap-4 max-w-4xl mx-auto">
         <Info className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
         <div className="flex flex-col gap-1">
            <h4 className="font-bold text-blue-900">Cara Melamar?</h4>
            <p className="text-sm text-blue-800/80 leading-relaxed">
               Untuk saat ini, silakan hubungi mitra atau admin melalui kontak yang tersedia untuk pengajuan diri. Fitur <strong>"Lamar Langsung"</strong> dari dashboard sedang dalam proses pengembangan Phase 6.
            </p>
         </div>
      </div>

      {/* Grid Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {recruitments.length > 0 ? (
          recruitments.map((ev: any) => (
            <EventCard key={ev.id} event={ev} showRecruitmentInfo={true} isPhotographer={isPhotographer} />
          ))
        ) : (
          <div className="col-span-full py-24 flex flex-col items-center justify-center gap-4 bg-slate-50 border-2 border-dashed rounded-[2.5rem]">
             <Users className="w-12 h-12 text-slate-300" />
             <div className="text-center">
               <p className="text-slate-500 font-bold text-lg">Belum ada lowongan aktif.</p>
               <p className="text-muted-foreground text-sm">Cek kembali nanti untuk melihat update dari mitra kami.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  )
}
