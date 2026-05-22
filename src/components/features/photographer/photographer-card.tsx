import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, MapPin, Camera } from "lucide-react"

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
  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-border/50 h-full flex flex-col">
      <CardHeader className="p-0 aspect-[4/5] relative overflow-hidden bg-slate-100">
        {pg.avatarUrl ? (
          <img
            src={pg.avatarUrl}
            alt={pg.nama || "Photographer"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
            <Camera className="w-12 h-12" />
          </div>
        )}

        {/* Closed Order Badge Overlay */}
        {pg.isAcceptingOrders === false && (
          <div className="absolute top-3 right-3 bg-rose-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-lg z-10 border border-white/20 animate-in zoom-in-75 duration-300">
            Closed
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg flex justify-between items-center transition-all duration-300 opacity-100 translate-y-0 md:opacity-0 md:translate-y-2 md:group-hover:translate-y-0 md:group-hover:opacity-100">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mulai dari</span>
            <span className="text-sm font-bold text-slate-900">
              {pg.packageStartingFrom ? `Rp ${pg.packageStartingFrom.toLocaleString('id-ID')}` : '-'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-lg">
            <Star className="w-3.5 h-3.5 fill-primary text-primary" />
            <span className="text-sm font-bold text-primary">{pg.ratingAverage || '0.0'}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 flex-1 flex flex-col gap-3">
        <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">
          {pg.nama || "Anonymous PG"}
        </h3>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          <span>{pg.kotaDomisili || "Lokasi tidak diset"}</span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {pg.bio || "Tidak ada bio."}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
          {pg.kategori?.slice(0, 3).map((cat: string) => (
            <span key={cat} className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {cat}
            </span>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-5 pt-0">
        <Link href={`/photographers/${pg.username}`} className="w-full">
          <Button variant="outline" className="w-full transition-all bg-primary text-white border-primary md:bg-transparent md:text-slate-900 md:border-slate-200 md:group-hover:bg-primary md:group-hover:text-white md:group-hover:border-primary">
            Lihat Profil
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
