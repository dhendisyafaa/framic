import { PhotographerCard } from "@/components/features/photographer/photographer-card"
import { PhotographerFilter } from "@/components/features/photographer/photographer-filter"
import { Camera } from "lucide-react"

async function getPhotographers(searchParams: { [key: string]: string | string[] | undefined }) {
  const params = new URLSearchParams()
  if (searchParams.kota && searchParams.kota !== "all") params.set("kota", searchParams.kota as string)
  if (searchParams.kategori && searchParams.kategori !== "all") params.set("kategori", searchParams.kategori as string)
  if (searchParams.minRating) params.set("minRating", searchParams.minRating as string)
  if (searchParams.sortBy) params.set("sortBy", searchParams.sortBy as string)
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/photographers?${params.toString()}`, {
    cache: 'no-store'
  })
  
  if (!res.ok) return { data: [], meta: { total: 0 } }
  const json = await res.json()
  return json.success ? { data: json.data, meta: json.meta } : { data: [], meta: { total: 0 } }
}

export default async function PhotographersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const { data: photographers, meta } = await getPhotographers(resolvedParams)

  return (
    <div className="container mx-auto px-4 md:px-8 py-12">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Katalog Fotografer</h1>
          <p className="text-muted-foreground max-w-2xl">
            Temukan dan pesan fotografer profesional sesuai dengan kebutuhan acara dan budget Anda.
          </p>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-[280px_1fr] gap-10">
          {/* Sidebar Filter */}
          <aside className="w-full">
            <PhotographerFilter />
          </aside>

          {/* Grid Catalogue */}
          <main className="flex-1 flex flex-col gap-8">
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
              <span className="text-sm font-medium text-slate-600">
                Menampilkan <span className="font-bold text-slate-900">{photographers.length}</span> dari {meta.total} fotografer
              </span>
              <div className="hidden sm:block h-px flex-1 mx-4 bg-slate-200/60" />
            </div>

            {photographers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {photographers.map((pg: any) => (
                  <PhotographerCard key={pg.id} pg={pg} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-4 bg-slate-50/50 border-2 border-dashed rounded-[2rem]">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                  <Camera className="w-8 h-8 text-slate-300" />
                </div>
                <div className="flex flex-col gap-1 max-w-xs">
                  <h3 className="font-bold text-lg">Tidak ada hasil</h3>
                  <p className="text-sm text-muted-foreground">
                    Maaf, tidak ada fotografer yang sesuai dengan kriteria filter Anda saat ini. Coba ubah filter atau reset.
                  </p>
                </div>
              </div>
            )}

            {/* Pagination Placeholder (Simple) */}
            {meta.totalPages > 1 && (
               <div className="flex justify-center mt-4">
                  <p className="text-xs text-muted-foreground italic">Fitur paginasi lengkap segera hadir di development berikutnya.</p>
               </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
