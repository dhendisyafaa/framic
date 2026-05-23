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
            <h1 className="text-3xl font-medium tracking-[-0.02em] text-foreground flex items-center gap-3">
               <ShieldCheck className="w-8 h-8 text-accent" /> Admin Central
            </h1>
            <p className="text-sm text-muted-foreground">Panel verifikasi dan moderasi platform Framic.</p>
         </div>

         <div className="grid grid-cols-1 gap-12">
            {/* Photographer Verifications */}
            <section className="space-y-6">
               <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-accent" />
                  <h2 className="text-xl font-medium text-foreground tracking-[-0.02em]">Pengajuan Fotografer</h2>
                  <Badge variant="outline" className="rounded-full border-muted bg-card text-muted-foreground text-xs">{photographers.length}</Badge>
               </div>

               {photographers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {photographers.map((pg) => (
                        <Card key={pg.clerkId} className="border-muted bg-card shadow-sm rounded-[24px] overflow-hidden group">
                           <CardHeader className="bg-[#141413] text-[#FCFBFA] p-6 relative">
                              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
                                 <Camera size={60} />
                              </div>
                              <div className="relative z-10">
                                 <CardTitle className="text-lg font-medium tracking-[-0.01em] truncate">{pg.name}</CardTitle>
                                 <CardDescription className="text-[#D1CDC7] font-medium flex items-center gap-1.5 text-xs mt-1">
                                    <Mail className="w-3.5 h-3.5" /> {pg.email}
                                 </CardDescription>
                              </div>
                           </CardHeader>
                           <CardContent className="p-6 space-y-6">
                              <div className="space-y-4">
                                 <div className="flex flex-wrap gap-2">
                                    {pg.kategori.map((kat: string) => (
                                       <Badge key={kat} variant="outline" className="text-accent border-accent/25 bg-accent/5 px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                          <Tag className="w-3 h-3 mr-1" /> {kat}
                                       </Badge>
                                    ))}
                                 </div>

                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                       <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Username</div>
                                       <div className="text-xs font-bold text-foreground">@{pg.username || "-"}</div>
                                    </div>
                                    <div className="space-y-1">
                                       <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Lokasi</div>
                                       <div className="text-xs font-bold text-foreground flex items-center gap-1">
                                          <MapPin className="w-3.5 h-3.5 text-accent" /> {pg.kota}
                                       </div>
                                    </div>
                                 </div>

                                 <div className="space-y-2">
                                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Bio / Deskripsi</div>
                                    <div className="bg-background p-4 rounded-[16px] border border-muted text-xs text-muted-foreground leading-relaxed italic">
                                       "{pg.bio}"
                                    </div>
                                 </div>

                                 {pg.portfolioUrls.length > 0 && (
                                    <div className="space-y-3">
                                       <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Portofolio</div>
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
                                                      className="group/porto relative aspect-[4/3] rounded-[16px] overflow-hidden border border-muted bg-muted shadow-sm"
                                                   >
                                                      <img
                                                         src={url}
                                                         alt={`Portofolio ${idx + 1}`}
                                                         className="w-full h-full object-cover transition-transform duration-500 group-hover/porto:scale-110"
                                                      />
                                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/porto:opacity-100 transition-opacity flex items-center justify-center">
                                                         <ExternalLink className="w-4 h-4 text-[#FCFBFA]" />
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
                                                   className="flex items-center justify-between p-3 rounded-[16px] border border-muted bg-background text-foreground hover:bg-muted/40 font-bold text-xs transition-all gap-2"
                                                >
                                                   <span className="truncate flex-1 text-left">{url}</span>
                                                   <ExternalLink className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                                                </a>
                                             )
                                          })}
                                       </div>
                                    </div>
                                 )}

                                 <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest pt-2 border-t border-muted/50">
                                    <Calendar className="w-3.5 h-3.5" /> Diajukan: <span className="text-foreground">{format(new Date(pg.createdAt), "d MMM yyyy, HH:mm")}</span>
                                 </div>
                              </div>

                              <div className="pt-6 flex items-center gap-3 border-t border-muted">
                                 <Button
                                    variant="outline"
                                    className="flex-1 border-muted text-destructive hover:bg-destructive/5 hover:border-destructive/10 font-bold rounded-full h-10 text-xs"
                                    onClick={() => rejectMutation.mutate({ clerkId: pg.clerkId, type: "photographer" })}
                                    disabled={approveMutation.isPending || rejectMutation.isPending}
                                 >
                                    Tolak
                                 </Button>
                                 <Button
                                    className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-full h-10 text-xs shadow-sm"
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
                  <div className="p-10 border border-dashed border-muted rounded-[24px] bg-card text-center">
                     <p className="text-muted-foreground font-bold uppercase tracking-widest text-[9px]">Tidak ada antrian fotografer</p>
                  </div>
               )}
            </section>

            {/* Mitra Verifications */}
            <section className="space-y-6">
               <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-accent" />
                  <h2 className="text-xl font-medium text-foreground tracking-[-0.02em]">Pengajuan Mitra</h2>
                  <Badge variant="outline" className="rounded-full border-muted bg-card text-muted-foreground text-xs">{mitra.length}</Badge>
               </div>

               {mitra.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {mitra.map((m) => (
                        <Card key={m.clerkId} className="border-muted bg-card shadow-sm rounded-[24px] overflow-hidden group">
                           <CardHeader className="bg-[#141413] text-[#FCFBFA] p-6 relative">
                              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
                                 <Building2 size={60} />
                              </div>
                              <div className="relative z-10">
                                 <CardTitle className="text-lg font-medium tracking-[-0.01em] truncate">{m.namaOrg}</CardTitle>
                                 <CardDescription className="text-[#D1CDC7] font-medium flex items-center gap-1.5 text-xs mt-1">
                                    <Mail className="w-3.5 h-3.5" /> PIC: {m.name}
                                 </CardDescription>
                              </div>
                           </CardHeader>
                           <CardContent className="p-6 space-y-6">
                              <div className="space-y-5">
                                 <div className="grid grid-cols-1 gap-4">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground shrink-0 border border-muted/50">
                                          <Building2 size={16} />
                                       </div>
                                       <div className="space-y-0.5">
                                          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Tipe Mitra</div>
                                          <div className="text-xs font-bold text-foreground capitalize">{m.tipeMitra.replace(/_/g, ' ')}</div>
                                       </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground shrink-0 border border-muted/50">
                                          <Phone size={16} />
                                       </div>
                                       <div className="space-y-0.5">
                                          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Kontak</div>
                                          <div className="text-xs font-bold text-foreground">{m.nomorTelepon}</div>
                                       </div>
                                    </div>
                                 </div>

                                 <div className="space-y-2">
                                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Alamat</div>
                                    <div className="p-4 bg-background border border-muted rounded-[16px] text-xs text-muted-foreground leading-relaxed">
                                       <MapPin className="w-3.5 h-3.5 inline mr-1 text-accent" /> {m.alamat}
                                    </div>
                                 </div>

                                 <div className="flex flex-col gap-2">
                                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Dokumen & Link</div>
                                    {m.websiteUrl && (
                                       <a
                                          href={m.websiteUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-3 p-3 bg-background border border-muted rounded-[16px] text-xs font-bold text-foreground hover:bg-muted/40 transition-all"
                                       >
                                          <Globe className="w-4 h-4 text-accent" /> Website Perusahaan
                                          <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground/50" />
                                       </a>
                                    )}
                                    {m.dokumenLegalitasUrl && (
                                       <div className="space-y-2">
                                          <a
                                             href={m.dokumenLegalitasUrl}
                                             target="_blank"
                                             rel="noopener noreferrer"
                                             className="block relative aspect-video rounded-[16px] overflow-hidden border border-muted bg-muted group/preview"
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

                                 <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest pt-2 border-t border-muted/50">
                                    <Calendar className="w-3.5 h-3.5" /> Diajukan: <span className="text-foreground">{format(new Date(m.createdAt), "d MMM yyyy, HH:mm")}</span>
                                 </div>
                              </div>

                              <div className="pt-6 flex items-center gap-3 border-t border-muted">
                                 <Button
                                    variant="outline"
                                    className="flex-1 border-muted text-destructive hover:bg-destructive/5 hover:border-destructive/10 font-bold rounded-full h-10 text-xs"
                                    onClick={() => rejectMutation.mutate({ clerkId: m.clerkId, type: "mitra" })}
                                    disabled={approveMutation.isPending || rejectMutation.isPending}
                                 >
                                    Tolak
                                 </Button>
                                 <Button
                                    className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-full h-10 text-xs shadow-sm"
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
                  <div className="p-10 border border-dashed border-muted rounded-[24px] bg-card text-center">
                     <p className="text-muted-foreground font-bold uppercase tracking-widest text-[9px]">Tidak ada antrian mitra</p>
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
