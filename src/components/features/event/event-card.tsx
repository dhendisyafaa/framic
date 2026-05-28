import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Users, LucideIcon, Clock } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { RequestEventButton } from "./request-event-button"

interface EventCardProps {
  event: {
    id: string
    namaEvent: string
    tanggalMulai: string | Date
    tanggalSelesai?: string | Date | null
    lokasi?: string | null
    coverImageUrl?: string | null
    isOpenRecruitment?: boolean
    feePgPerEvent?: number | null
    kuotaPgPerEvent?: number | null
    slotTerisi?: number | null
    deadlineRequest?: string | Date | null
  }
  showRecruitmentInfo?: boolean
  isPhotographer?: boolean
}

export function EventCard({ event, showRecruitmentInfo = false, isPhotographer = false }: EventCardProps) {
  const startDate = new Date(event.tanggalMulai)
  const isExpired = event.deadlineRequest ? new Date(event.deadlineRequest) < new Date() : false
  const slotsLeft = (event.kuotaPgPerEvent || 0) - (event.slotTerisi || 0)

  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-border/50 flex flex-col h-full bg-card text-foreground">
      <CardHeader className="p-0 aspect-video relative overflow-hidden bg-muted">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.namaEvent}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
            <Calendar className="w-12 h-12" />
          </div>
        )}

        {event.isOpenRecruitment && (
          <div className="absolute top-4 left-4 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
            Open Recruitment
          </div>
        )}
      </CardHeader>

      <CardContent className="p-5 flex-1 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">
            {event.namaEvent}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            <span>{format(startDate, "d MMMM yyyy", { locale: idLocale })}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-y border-muted py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="line-clamp-1">{event.lokasi || "Lokasi menyusul"}</span>
          </div>

          {showRecruitmentInfo && (
            <>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Sisa Slot</span>
                </div>
                <span className="font-bold text-primary">{slotsLeft} Posisi</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Deadline Daftar</span>
                </div>
                <span className={`font-medium ${isExpired ? 'text-destructive' : 'text-foreground'}`}>
                  {event.deadlineRequest ? format(new Date(event.deadlineRequest), "d MMM", { locale: idLocale }) : "-"}
                </span>
              </div>
            </>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 mt-auto">
        {showRecruitmentInfo && isPhotographer ? (
          <RequestEventButton eventId={event.id} isPhotographer={isPhotographer} />
        ) : (
          <Link href={`/events/${event.id}`} className="w-full">
            <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all cursor-pointer">
              {showRecruitmentInfo ? "Gabung Event" : "Lihat Detail"}
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  )
}
