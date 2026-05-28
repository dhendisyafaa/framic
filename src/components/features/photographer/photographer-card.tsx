import Link from "next/link"
import { Star, MapPin, Camera, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PhotographerCardProps {
  pg: {
    id: string
    username?: string | null
    nama?: string
    avatarUrl?: string | null
    bio?: string | null
    kotaDomisili?: string | null
    kategori?: string[] | null
    ratingAverage?: number | null
    packageStartingFrom?: number | null
    isAcceptingOrders?: boolean | null
  }
}

export function PhotographerCard({ pg }: PhotographerCardProps) {
  const profileUrl = `/photographers/${pg.username || pg.id}`

  return (
    <Link href={profileUrl} className="block w-full cursor-pointer">
      <div className="flex flex-col items-center group bg-card border border-muted/50 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all">
        {/* 1. Circular Portrait */}
        <div className="w-40 h-40 rounded-full overflow-hidden relative bg-muted border border-muted/70 flex items-center justify-center">
          {pg.avatarUrl ? (
            <img
              src={pg.avatarUrl}
              alt={pg.nama || "Photographer"}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
              <Camera className="w-10 h-10" />
            </div>
          )}

          {/* Closed Order Badge Overlay */}
          {pg.isAcceptingOrders === false && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white text-[10px] font-black uppercase tracking-[0.2em]">
              Closed
            </div>
          )}
        </div>

        {/* 2. Text details below circle */}
        <div className="flex flex-col items-center text-center gap-1.5 mt-5 w-full">
          <span className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-1">
            <MapPin className="w-3 h-3 text-accent" />
            {pg.kotaDomisili || "INDONESIA"}
          </span>
          <h3 className="font-medium text-lg text-foreground tracking-tight group-hover:underline line-clamp-1">
            {pg.nama || "Anonymous PG"}
          </h3>
          
          <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px] px-2 leading-relaxed">
            {pg.bio || "Abadikan kenangan berharga bersama saya."}
          </p>

          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-muted/40 w-full justify-center">
            <Star className="w-3.5 h-3.5 fill-accent text-accent" />
            <span className="text-xs font-bold text-foreground">{pg.ratingAverage || '0.0'}</span>
            <span className="text-muted-foreground/30 mx-1">|</span>
            <span className="text-xs font-bold text-muted-foreground">
              {pg.packageStartingFrom ? `Rp ${pg.packageStartingFrom.toLocaleString('id-ID')}` : '-'}
            </span>
          </div>

          <div className="w-full mt-4">
            <Button className="w-full rounded-full font-bold text-xs h-10 bg-primary hover:bg-primary/95 text-primary-foreground transition-all cursor-pointer gap-2">
              Lihat Profil
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  )
}
