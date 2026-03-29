import { db } from "@/db"
import { mitraProfiles, events } from "@/db/schema"
import { eq, sql, inArray } from "drizzle-orm"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2Icon, GlobeIcon, ChevronRightIcon } from "lucide-react"

async function getVerifiedMitra() {
  const verifiedMitra = await db
    .select({
      id: mitraProfiles.id,
      namaOrganisasi: mitraProfiles.namaOrganisasi,
      tipeMitra: mitraProfiles.tipeMitra,
      coverImageUrl: mitraProfiles.coverImageUrl,
      websiteUrl: mitraProfiles.websiteUrl,
    })
    .from(mitraProfiles)
    .where(eq(mitraProfiles.verificationStatus, "verified"))

  const mitraIds = verifiedMitra.map((m) => m.id)
  let eventCounts: Record<string, number> = {}

  if (mitraIds.length > 0) {
    const counts = await db
      .select({
        mitraId: events.mitraId,
        count: sql<number>`cast(count(${events.id}) as int)`,
      })
      .from(events)
      .where(inArray(events.mitraId, mitraIds))
      .groupBy(events.mitraId)

    counts.forEach((row) => {
      eventCounts[row.mitraId] = row.count
    })
  }

  return verifiedMitra.map((m) => ({
    ...m,
    totalEvent: eventCounts[m.id] || 0,
  }))
}

export default async function MitraListPage() {
  const mitraList = await getVerifiedMitra()

  return (
    <div className="container mx-auto px-4 md:px-8 py-12 md:py-20">
      <div className="max-w-3xl mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 italic">
          Partner Strategis Cerita Anda 🤝
        </h1>
        <p className="text-lg text-slate-500 font-medium">
          Daftar Wedding Organizer, Event Planner, dan Agensi kreatif yang telah terverifikasi dan berkolaborasi resmi dengan Framic.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mitraList.map((mitra) => (
          <Link key={mitra.id} href={`/mitra/${mitra.id}`}>
            <Card className="group border-slate-200 shadow-lg shadow-slate-200/40 rounded-[2.5rem] overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
              <CardContent className="p-0">
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  {mitra.coverImageUrl ? (
                    <Image
                      src={mitra.coverImageUrl}
                      alt={mitra.namaOrganisasi}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                      <Building2Icon className="w-16 h-16" />
                    </div>
                  )}
                  <Badge className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm text-slate-900 border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-sm">
                    {mitra.tipeMitra?.replace("_", " ")}
                  </Badge>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-black text-slate-900 mb-2 truncate">
                    {mitra.namaOrganisasi}
                  </h3>
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                      <span className="text-indigo-600">{mitra.totalEvent}</span> Event Aktif
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                      <ChevronRightIcon className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {mitraList.length === 0 && (
        <div className="py-32 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <Building2Icon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium italic">Belum ada mitra terverifikasi yang ditampilkan.</p>
        </div>
      )}
    </div>
  )
}
