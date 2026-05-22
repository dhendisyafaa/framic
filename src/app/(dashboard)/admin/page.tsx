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
   AlertCircle,
   Globe,
   Phone,
   ExternalLink,
   FileText,
   Tag,
   Link as LinkIcon
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface VerificationData {
   photographers: Array<{
      clerkId: string
      name: string
      email: string
      bio: string
      kota: string
      username: string
      kategori: string[]
      portfolioUrls: string[]
      createdAt: string
   }>
   mitra: Array<{
      clerkId: string
      name: string
      email: string
      namaOrg: string
      tipeMitra: string
      alamat: string
      nomorTelepon: string
      websiteUrl: string | null
      dokumenLegalitasUrl: string | null
      createdAt: string
   }>
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
         toast.success("Berhasil menyetujui pengajuan!")
         queryClient.invalidateQueries({ queryKey: ["admin-verifications"] })
      },
      onError: (err: any) => {
         toast.error(err.message)
      }
   })

   const rejectMutation = useMutation({
      mutationFn: async ({ clerkId, type }: { clerkId: string; type: "photographer" | "mitra" }) => {
         const res = await fetch(`/api/admin/verifications/${clerkId}/reject-${type}`, {
            method: "POST",
         })
         const json = await res.json()
         if (!json.success) throw new Error(json.error)
         return json
      },
      onSuccess: () => {
         toast.success("Berhasil menolak pengajuan!")
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
            <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
               <ShieldCheck className="w-10 h-10 text-primary" /> Admin Central
            </h1>
            <p className="text-slate-500 font-medium">Panel verifikasi dan moderasi platform Framic.</p>
         </div>

         <div className="grid grid-cols-1 gap-12">
            {/* Photographer Verifications */}
            <section className="space-y-6">
               <div className="flex items-center gap-3">
                  <Camera className="w-6 h-6 text-indigo-500" />
                  <h2 className="text-2xl font-black text-slate-900 uppercase">Pengajuan Fotografer</h2>
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
                           <CardContent className="p-6 space-y-6">
                              <div className="space-y-4">
                                 <div className="flex flex-wrap gap-2">
                                    {pg.kategori.map((kat: string) => (
                                       <Badge key={kat} variant="secondary" className="bg-indigo-50 text-indigo-700 border-none px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                          <Tag className="w-3 h-3 mr-1" /> {kat}
                                       </Badge>
                                    ))}
                                 </div>

                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Username</div>
                                       <div className="text-sm font-bold text-slate-900">@{pg.username || "-"}</div>
                                    </div>
                                    <div className="space-y-1">
                                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lokasi</div>
                                       <div className="text-sm font-bold text-slate-900 flex items-center gap-1">
                                          <MapPin className="w-3.5 h-3.5 text-rose-500" /> {pg.kota}
                                       </div>
                                    </div>
                                 </div>

                                 <div className="space-y-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bio / Deskripsi</div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed italic">
                                       "{pg.bio}"
                                    </div>
                                 </div>

                                 {pg.portfolioUrls.length > 0 && (
                                    <div className="space-y-3">
                                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Portofolio</div>
                                       <div className="grid grid-cols-1 gap-2">
                                          {pg.portfolioUrls.map((url: string, idx: number) => {
                                             const isImage = url.includes("cloudinary") || url.includes("res.cloudinary.com") || /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(url);
                                             if (isImage) {
                                                return (
                                                   <a
                                                      key={idx}
                                                      href={url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="group/porto relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-100 bg-slate-100 shadow-sm"
                                                   >
                                                      <img
                                                         src={url}
                                                         alt={`Portofolio ${idx + 1}`}
                                                         className="w-full h-full object-cover transition-transform duration-500 group-hover/porto:scale-110"
                                                      />
                                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/porto:opacity-100 transition-opacity flex items-center justify-center">
                                                         <ExternalLink className="w-5 h-5 text-white" />
                                                      </div>
                                                   </a>
                                                )
                                             }

                                             return (
                                                <a
                                                   key={idx}
                                                   href={url}
                                                   target="_blank"
                                                   rel="noopener noreferrer"
                                                   className="flex items-center justify-between p-3.5 rounded-2xl border border-indigo-100 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-50 font-bold text-xs transition-all gap-2"
                                                >
                                                   <span className="truncate flex-1 text-left">{url}</span>
                                                   <ExternalLink className="w-4 h-4 shrink-0 text-indigo-500" />
                                                </a>
                                             )
                                          })}
                                       </div>
                                    </div>
                                 )}

                                 <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                                    <Calendar className="w-3.5 h-3.5" /> Diajukan: <span className="text-slate-900">{format(new Date(pg.createdAt), "d MMM yyyy, HH:mm")}</span>
                                 </div>
                              </div>

                              <div className="pt-6 flex items-center gap-3 border-t border-slate-100">
                                 <Button
                                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl py-3 transition-all"
                                    onClick={() => rejectMutation.mutate({ clerkId: pg.clerkId, type: "photographer" })}
                                    disabled={approveMutation.isPending || rejectMutation.isPending}
                                 >
                                    Tolak
                                 </Button>
                                 <Button
                                    className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl py-3 transition-all"
                                    onClick={() => approveMutation.mutate({ clerkId: pg.clerkId, type: "photographer" })}
                                    disabled={approveMutation.isPending || rejectMutation.isPending}
                                 >
                                    Setujui
                                 </Button>
                              </div>
                           </CardContent>
                        </Card>
                     ))}
                  </div>
               ) : (
                  <div className="p-10 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                     <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Tidak ada antrian fotografer</p>
                  </div>
               )}
            </section>

            {/* Mitra Verifications */}
            <section className="space-y-6">
               <div className="flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-blue-500" />
                  <h2 className="text-2xl font-black text-slate-900 uppercase">Pengajuan Mitra</h2>
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
                           <CardContent className="p-6 space-y-6">
                              <div className="space-y-5">
                                 <div className="grid grid-cols-1 gap-4">
                                    <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                          <Building2 size={18} />
                                       </div>
                                       <div className="space-y-0.5">
                                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipe Mitra</div>
                                          <div className="text-sm font-bold text-slate-900 capitalize">{m.tipeMitra.replace(/_/g, ' ')}</div>
                                       </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                                          <Phone size={18} />
                                       </div>
                                       <div className="space-y-0.5">
                                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kontak</div>
                                          <div className="text-sm font-bold text-slate-900">{m.nomorTelepon}</div>
                                       </div>
                                    </div>
                                 </div>

                                 <div className="space-y-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alamat</div>
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-600 leading-relaxed">
                                       <MapPin className="w-3.5 h-3.5 inline mr-1 text-rose-500" /> {m.alamat}
                                    </div>
                                 </div>

                                 <div className="flex flex-col gap-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dokumen & Link</div>
                                    {m.websiteUrl && (
                                       <a
                                          href={m.websiteUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-blue-50 hover:border-blue-200 transition-all"
                                       >
                                          <Globe className="w-4 h-4 text-blue-500" /> Website Perusahaan
                                          <ExternalLink className="w-3 h-3 ml-auto text-slate-300" />
                                       </a>
                                    )}
                                    {m.dokumenLegalitasUrl && (
                                       <div className="space-y-2">
                                          <a
                                             href={m.dokumenLegalitasUrl}
                                             target="_blank"
                                             rel="noopener noreferrer"
                                             className="block relative aspect-video rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 group/preview"
                                          >
                                             <img
                                                src={m.dokumenLegalitasUrl.endsWith('.pdf') ? m.dokumenLegalitasUrl.replace('.pdf', '.jpg') : m.dokumenLegalitasUrl}
                                                alt="Dokumen Legalitas"
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover/preview:scale-105"
                                             />
                                             <div className="absolute inset-0 bg-slate-900/10 group-hover/preview:bg-transparent transition-colors" />
                                          </a>
                                       </div>
                                    )}
                                 </div>

                                 <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                                    <Calendar className="w-3.5 h-3.5" /> Diajukan: <span className="text-slate-900">{format(new Date(m.createdAt), "d MMM yyyy, HH:mm")}</span>
                                 </div>
                              </div>

                              <div className="pt-6 flex items-center gap-3 border-t border-slate-100">
                                 <Button
                                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl py-3 transition-all"
                                    onClick={() => rejectMutation.mutate({ clerkId: m.clerkId, type: "mitra" })}
                                    disabled={approveMutation.isPending || rejectMutation.isPending}
                                 >
                                    Tolak
                                 </Button>
                                 <Button
                                    className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl py-3 transition-all"
                                    onClick={() => approveMutation.mutate({ clerkId: m.clerkId, type: "mitra" })}
                                    disabled={approveMutation.isPending || rejectMutation.isPending}
                                 >
                                    Setujui
                                 </Button>
                              </div>
                           </CardContent>
                        </Card>
                     ))}
                  </div>
               ) : (
                  <div className="p-10 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                     <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Tidak ada antrian mitra</p>
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
