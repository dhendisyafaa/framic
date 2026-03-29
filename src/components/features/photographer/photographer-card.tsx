import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, MapPin, Camera } from "lucide-react"

interface PhotographerCardProps {
  pg: {
    id: string
    nama?: string
    avatarUrl?: string | null
    bio?: string | null
    kotaDomisili?: string | null
    kategori?: string[] | null
    ratingAverage?: number | null
    packageStartingFrom?: number | null
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
      <CardContent className="p-5 flex-1 flex flex-col gap-3">
        <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">
          {pg.nama || "Anonymous PG"}
        </h3>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          <span>{pg.kotaDomisili || "Lokasi tidak diset"}</span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 italic">
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
        <Link href={`/photographers/${pg.id}`} className="w-full">
          <Button variant="outline" className="w-full border-slate-200 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
            Lihat Profil
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
