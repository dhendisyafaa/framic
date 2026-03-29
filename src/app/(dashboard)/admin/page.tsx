"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Camera, 
  Building2, 
  Mail, 
  MapPin, 
  Calendar,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface VerificationData {
  photographers: any[]
  mitra: any[]
}

export default function AdminVerificationPage() {
  const queryClient = useQueryClient()

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["admin-verifications"],
    queryFn: async () => {
      const res = await fetch("/api/admin/verifications")
      if (!res.ok) {
         if (res.status === 403) throw new Error("Akses Ditolak: Anda bukan admin")
         throw new Error("Gagal mengambil data verifikasi")
      }
      return res.json() as Promise<{ success: boolean; data: VerificationData }>
    },
  })

  const approveMutation = useMutation({
    mutationFn: async ({ clerkId, type }: { clerkId: string; type: "photographer" | "mitra" }) => {
      const res = await fetch(`/api/admin/verifications/${clerkId}/approve-${type}`, {
        method: "POST",
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json
    },
    onSuccess: () => {
      toast.success("Berhasil menyetujui request! 🎉")
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })

  if (isLoading) return <AdminSkeleton />
  if (error) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4 text-center">
       <AlertCircle className="w-16 h-16 text-rose-500" />
       <h1 className="text-2xl font-black text-slate-900">{error.message}</h1>
       <p className="text-slate-500 max-w-md">Pastikan role 'admin' sudah ditambahkan ke publicMetadata user Anda di Clerk Dashboard.</p>
    </div>
  )

  const photographers = response?.data?.photographers || []
  const mitra = response?.data?.mitra || []

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2 mb-10">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 italic flex items-center gap-3">
          <ShieldCheck className="w-10 h-10 text-primary" /> Admin Central
        </h1>
        <p className="text-slate-500 font-medium">Panel verifikasi dan moderasi platform Framic.</p>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {/* Photographer Verifications */}
        <section className="space-y-6">
           <div className="flex items-center gap-3">
              <Camera className="w-6 h-6 text-indigo-500" />
              <h2 className="text-2xl font-black text-slate-900 uppercase italic">Pengajuan Fotografer</h2>
              <Badge variant="outline" className="rounded-full border-slate-200">{photographers.length}</Badge>
           </div>

           {photographers.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {photographers.map((pg) => (
                  <Card key={pg.clerkId} className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group">
                     <CardHeader className="bg-slate-900 text-white p-6 relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                           <Camera size={60} />
                        </div>
                        <div className="relative z-10">
                           <CardTitle className="text-xl font-black truncate">{pg.name}</CardTitle>
                           <CardDescription className="text-slate-400 font-medium flex items-center gap-1.5 text-xs">
                              <Mail className="w-3.5 h-3.5" /> {pg.email}
                           </CardDescription>
                        </div>
                     </CardHeader>
                     <CardContent className="p-6 space-y-4">
                        <div className="space-y-3">
                           <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                              <MapPin className="w-3.5 h-3.5" /> Domisili: <span className="text-slate-900">{pg.kota}</span>
                           </div>
                           <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 italic text-sm text-slate-600 leading-relaxed">
                              "{pg.bio}"
                           </div>
                        </div>
                        <div className="pt-4 flex items-center gap-3 border-t border-slate-100">
                           <Button 
                             className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl"
                             onClick={() => approveMutation.mutate({ clerkId: pg.clerkId, type: "photographer" })}
                             disabled={approveMutation.isPending}
                           >
                             <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                           </Button>
                           <Button variant="ghost" className="rounded-xl text-rose-500 font-bold">
                             <XCircle className="w-4 h-4" />
                           </Button>
                        </div>
                     </CardContent>
                  </Card>
                ))}
             </div>
           ) : (
             <div className="p-10 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] italic">Tidak ada antrian fotografer</p>
             </div>
           )}
        </section>

        {/* Mitra Verifications */}
        <section className="space-y-6">
           <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-black text-slate-900 uppercase italic">Pengajuan Mitra</h2>
              <Badge variant="outline" className="rounded-full border-slate-200">{mitra.length}</Badge>
           </div>

           {mitra.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mitra.map((m) => (
                  <Card key={m.clerkId} className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group">
                     <CardHeader className="bg-indigo-900 text-white p-6 relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                           <Building2 size={60} />
                        </div>
                        <div className="relative z-10">
                           <CardTitle className="text-xl font-black truncate">{m.namaOrg}</CardTitle>
                           <CardDescription className="text-indigo-300 font-medium flex items-center gap-1.5 text-xs">
                              <Mail className="w-3.5 h-3.5" /> PIC: {m.name}
                           </CardDescription>
                        </div>
                     </CardHeader>
                     <CardContent className="p-6">
                        <div className="flex flex-col gap-4">
                           <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                              <Calendar className="w-3.5 h-3.5" /> Diajukan: <span className="text-slate-900">{format(new Date(m.createdAt), "d MMM yyyy")}</span>
                           </div>
                           <Button 
                             className="w-full bg-blue-600 hover:bg-blue-700 font-bold rounded-xl py-6"
                             onClick={() => approveMutation.mutate({ clerkId: m.clerkId, type: "mitra" })}
                             disabled={approveMutation.isPending}
                           >
                              <ShieldCheck className="w-4 h-4 mr-2" /> Approve & Beri Akses Mitra
                           </Button>
                        </div>
                     </CardContent>
                  </Card>
                ))}
             </div>
           ) : (
             <div className="p-10 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] italic">Tidak ada antrian mitra</p>
             </div>
           )}
        </section>
      </div>
    </div>
  )
}

function AdminSkeleton() {
  return (
    <div className="container mx-auto px-8 py-10 space-y-12">
       <div className="space-y-4">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-xl" />
       </div>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Skeleton className="h-[300px] rounded-3xl" />
          <Skeleton className="h-[300px] rounded-3xl" />
          <Skeleton className="h-[300px] rounded-3xl" />
       </div>
    </div>
  )
}
