import { db } from "@/db"
import { mitraProfiles, events } from "@/db/schema"
import { eq, sql, inArray } from "drizzle-orm"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2Icon, GlobeIcon, ChevronRightIcon } from "lucide-react"

async function getVerifiedMitra() {
  try {
    // 1. Fetch raw mitra profiles
    const rawMitra = await db
      .select()
      .from(mitraProfiles)
      .where(eq(mitraProfiles.verificationStatus, "verified"))
      .execute()

    if (!rawMitra || rawMitra.length === 0) return []

    // 2. Fetch all events to count manually (bypass Drizzle grouping bug if any)
    const allEvents = await db
      .select({ mitraId: events.mitraId })
      .from(events)
      .execute()

    const eventCounts: Record<string, number> = {}
    allEvents.forEach((ev) => {
      if (ev.mitraId) {
        eventCounts[ev.mitraId] = (eventCounts[ev.mitraId] || 0) + 1
      }
    })

    // 3. Map to final structure
    return rawMitra.map((m) => ({
      id: m.id,
      namaOrganisasi: m.namaOrganisasi,
      tipeMitra: m.tipeMitra,
      websiteUrl: m.websiteUrl,
      totalEvent: eventCounts[m.id] || 0,
    }))
  } catch (err) {
    console.error("Error in getVerifiedMitra manual flow:", err)
    return []
  }
}

export default async function MitraListPage() {
  const mitraList = await getVerifiedMitra()

  return (
    <div className="container mx-auto px-4 md:px-8 py-12 md:py-20 text-foreground">
      <div className="max-w-3xl mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Partner Strategis Cerita Anda
        </h1>
        <p className="text-lg text-muted-foreground font-medium">
          Daftar Wedding Organizer, Event Planner, dan Agensi kreatif yang telah terverifikasi dan berkolaborasi resmi dengan Framic.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mitraList.map((mitra) => (
          <Link key={mitra.id} href={`/mitra/${mitra.id}`}>
            <Card className="group border-muted shadow-sm hover:shadow-xl hover:border-muted/80 transition-all hover:-translate-y-1 bg-card text-foreground rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-0">
                <div className="h-48 bg-muted relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                      <Building2Icon className="w-16 h-16" />
                    </div>
                  <Badge className="absolute top-6 left-6 bg-card/90 backdrop-blur-sm text-foreground border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-sm">
                    {mitra.tipeMitra?.replace("_", " ")}
                  </Badge>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-black text-foreground mb-2 truncate">
                    {mitra.namaOrganisasi}
                  </h3>
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-muted">
                    <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm">
                      <span className="text-accent font-black">{mitra.totalEvent}</span> Event Aktif
                    </div>
                    <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors cursor-pointer">
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
        <div className="py-32 text-center bg-muted/5 rounded-[3rem] border-2 border-dashed border-muted">
          <Building2Icon className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Belum ada mitra terverifikasi yang ditampilkan.</p>
        </div>
      )}
    </div>
  )
}
