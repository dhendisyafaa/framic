"use client"

import { use, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useUser } from "@clerk/nextjs"
import { OrderDetail } from "@/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  CalendarIcon,
  MapPinIcon,
  CameraIcon,
  ArrowLeftIcon,
  CreditCardIcon,
  UploadIcon,
  CheckCircle2Icon,
  StarIcon,
  AlertCircleIcon,
  ChevronRight,
  EyeIcon,
  MessageSquare,
} from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ReviewDialog } from "@/components/features/reviews/review-dialog"
import { cn } from "@/lib/utils"

/**
 * Halaman Detail Order (Final)
 * Mengikuti matriks aksi Role + Status.
 */
export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = use(params)
  const { user } = useUser()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}`)
      if (!res.ok) throw new Error("Gagal mengambil detail order")
      return res.json() as Promise<{ success: boolean; data: OrderDetail }>
    },
  })

  // Mutasi umum untuk perubahan status
  const actionMutation = useMutation({
    mutationFn: async ({ path, method = "PATCH", body }: { path: string; method?: string; body?: any }) => {
      const res = await fetch(`/api/${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json
    },
    onSuccess: (data) => {
      if (data?.data.invoiceUrl) {
        window.location.href = data.data.invoiceUrl
        return
      }
      queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] })
      toast.success("Berhasil memperbarui order")
    },
    onError: (err) => {
      toast.error(`Gagal: ${err.message}`)
    }
  })

  // Mutasi upload foto (khusus PG)
  const uploadPhotos = async (files: FileList) => {
    setIsUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData()
        formData.append("file", files[i])
        const res = await fetch(`/api/photos/${orderId}`, {
          method: "POST",
          body: formData
        })
        if (!res.ok) throw new Error(`Gagal upload foto ke-${i + 1}`)
      }
      queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] })
      toast.success("Foto berhasil diunggah!")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) return <OrderDetailsSkeleton />
  if (error || !response?.success) return <div className="p-20 text-center font-black italic text-rose-500">Error: {error?.message || "Oops, order hilang!"}</div>

  const order = response.data
  const isCustomer = user?.id === order.customerClerkId
  const isPG = user?.id === order.photographer?.clerkId
  const status = order.status

  return (
    <div className="container mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-6xl">
      {/* Back Button */}
      <Link href="/orders" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary font-bold text-sm mb-8 group bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm transition-all">
        <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Daftar Order
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: Detil Order */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-2xl shadow-indigo-500/5 overflow-hidden rounded-[2.5rem] bg-white">
            <CardHeader className="bg-slate-900 p-10 text-white relative">
              <div className="absolute top-0 right-0 p-10 opacity-10 -rotate-12 translate-x-10 -translate-y-5">
                <CameraIcon size={180} />
              </div>
              <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Badge className={`rounded-full px-5 border-none font-black text-[10px] tracking-widest ${getStatusStyles(status)}`}>
                    {status.toUpperCase()}
                  </Badge>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white/5 px-3 py-1 rounded-full">ID: #{order.id.slice(0, 8)}</span>
                </div>
                <CardTitle className="text-4xl md:text-5xl font-black tracking-tighter italic">
                  {order.package?.namaPaket || "Sesi Fotografi Privat"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Rincian Sesi */}
                <div className="space-y-8">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-indigo-500" /> Detail Sesi
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-start gap-5">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                        <CalendarIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Tanggal</div>
                        <div className="font-black text-slate-900 text-lg leading-tight uppercase italic">{format(new Date(order.tanggalPotret), "eeee, d MMM yyyy", { locale: localeId })}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-5">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                        <MapPinIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Lokasi</div>
                        <div className="font-black text-slate-900 font-medium">{order.lokasi}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Partner Terlibat */}
                <div className="space-y-8">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" /> {isCustomer ? "Fotografer" : "Kustomer"}
                  </h3>
                  <div className="flex items-center gap-5 p-6 rounded-[2rem] border-2 border-dashed border-slate-100 bg-slate-50/50">
                    <div className="w-14 h-14 bg-white shadow-md rounded-full flex items-center justify-center text-slate-300 font-black text-xl italic uppercase overflow-hidden">
                      {isCustomer ? order.photographer?.nama.slice(0, 1) : order.customerName.slice(0, 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-slate-900 text-lg uppercase tracking-tight truncate">
                        {isCustomer ? order.photographer?.nama : order.customerName}
                      </div>
                      <Button variant="link" className="p-0 h-auto text-[10px] font-black uppercase text-primary tracking-widest hover:no-underline flex items-center gap-1">
                        Chat ke {isCustomer ? "Photographer" : "Client"} <ChevronRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Catatan Khusus */}
              {order.catatan && (
                <div className="mt-10 pt-10 border-t border-slate-100">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Instruksi Khusus</h3>
                  <div className="p-6 bg-amber-50/50 border border-amber-100 rounded-3xl text-slate-700 italic font-medium leading-relaxed relative overflow-hidden">
                    <AlertCircleIcon className="absolute -bottom-2 -right-2 w-12 h-12 text-amber-200/50" />
                    "{order.catatan}"
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Galeri Foto & Ulasan (Jika Sudah Ongoing ke atas) */}
          {(status === "ongoing" || status === "delivered" || status === "completed") && (
            <div className="space-y-8">
              <Card className="border-none shadow-xl shadow-slate-200/20 rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="p-10 pb-0">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl font-black italic tracking-tight">Hasil Pemotretan</CardTitle>
                      <CardDescription className="font-medium text-slate-400">Total {order.photos?.length || 0} foto telah diunggah.</CardDescription>
                    </div>
                    {isPG && status === "ongoing" && (
                      <div className="relative">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          id="photo-upload"
                          onChange={(e) => e.target.files && uploadPhotos(e.target.files)}
                          disabled={isUploading}
                        />
                        <Button asChild disabled={isUploading} className="rounded-2xl font-bold bg-slate-900">
                          <label htmlFor="photo-upload" className="cursor-pointer flex items-center gap-2">
                            {isUploading ? "Uploading..." : <><UploadIcon className="w-4 h-4" /> Tambah Foto</>}
                          </label>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-10">
                  {order.photos && order.photos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {order.photos.map((photo) => (
                        <div key={photo.id} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 relative group bg-slate-100">
                          <img src={photo.fotoUrl} alt="Hasil Foto" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {/* FIX: ini buat apa ya? */}
                            <Button variant="secondary" size="icon" className="rounded-full w-8 h-8"><EyeIcon className="w-4 h-4" /></Button>
                            <Button size="icon" className="rounded-full w-8 h-8 bg-white text-slate-900 hover:bg-slate-200"><UploadIcon className="w-4 h-4 rotate-180" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2rem] text-center">
                      <CameraIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] italic">Belum ada foto yang masuk</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Section for Completed with Review */}
              {status === "completed" && order.review && (
                <Card className="border-none shadow-xl shadow-emerald-500/5 rounded-[2.5rem] bg-emerald-50/20 p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <StarIcon key={i} className={`w-6 h-6 ${i <= (order.review?.rating || 0) ? "fill-primary text-primary" : "text-slate-200"}`} />
                      ))}
                    </div>
                    <Badge className="bg-emerald-600 font-bold uppercase text-[9px] tracking-widest">Customer Review</Badge>
                  </div>
                  <p className="text-slate-700 italic font-black text-xl leading-relaxed">"{order.review.komentar}"</p>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Actions & Payment Summary */}
        <div className="space-y-8">
          <Card className="border-none shadow-2xl shadow-indigo-500/5 rounded-[3rem] overflow-hidden sticky top-24 bg-white">
            <CardHeader className="p-10 bg-slate-100/50 border-b border-white">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Rincian Pembayaran</h3>
              <div className="text-4xl font-black text-indigo-600 tracking-tighter italic">Rp {order.totalHarga.toLocaleString("id-ID")}</div>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Down Payment (50%)</span>
                    <div className="font-black text-slate-800 text-lg">Rp {order.payment?.jumlahDp.toLocaleString("id-ID")}</div>
                  </div>
                  <Badge variant="outline" className={`rounded-full px-3 text-[9px] font-black ${order.payment?.statusDp === "paid" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"}`}>
                    {order.payment?.statusDp.toUpperCase() || "UNPAID"}
                  </Badge>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pelunasan (50%)</span>
                    <div className="font-black text-slate-800 text-lg">Rp {order.payment?.jumlahPelunasan.toLocaleString("id-ID")}</div>
                  </div>
                  <Badge variant="outline" className={`rounded-full px-3 text-[9px] font-black ${order.payment?.statusPelunasan === "paid" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-300 border-slate-100"}`}>
                    {order.payment?.statusPelunasan?.toUpperCase() || "UNPAID"}
                  </Badge>
                </div>
              </div>

              {/* ACTION BUTTONS (The Most Crucial Part) */}
              <div className="space-y-4">
                {/* Role: PHOTOGRAPHER */}
                {isPG && (
                  <div className="grid gap-3">
                    {status === "pending" && (
                      <>
                        <Button
                          className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold py-7 text-lg shadow-xl shadow-emerald-500/20 group"
                          onClick={() => actionMutation.mutate({ path: `orders/${orderId}/confirm` })}
                          disabled={actionMutation.isPending}
                        >
                          {actionMutation.isPending ? "Processing..." : <><CheckCircle2Icon className="mr-2 w-5 h-5 group-hover:scale-125 transition-transform" /> Konfirmasi Order</>}
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full text-rose-500 font-black uppercase text-xs tracking-widest hover:bg-rose-50"
                          onClick={() => actionMutation.mutate({ path: `orders/${orderId}/reject` })}
                          disabled={actionMutation.isPending}
                        >
                          Tolak Order
                        </Button>
                      </>
                    )}
                    {status === "dp_paid" && (
                      <Button
                        className="w-full rounded-2xl bg-indigo-600 font-bold py-7 text-lg group"
                        onClick={() => actionMutation.mutate({ path: `orders/${orderId}/ongoing` })}
                        disabled={actionMutation.isPending}
                      >
                        Mulai Sesi Foto <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    )}
                    {status === "ongoing" && (
                      <Button
                        className="w-full rounded-2xl bg-slate-900 font-bold py-7 text-lg"
                        onClick={() => actionMutation.mutate({ path: `orders/${orderId}/deliver` })}
                        disabled={actionMutation.isPending || isUploading}
                      >
                        Mark Selesai Upload ✅
                      </Button>
                    )}
                  </div>
                )}

                {/* Role: CUSTOMER */}
                {isCustomer && (
                  <div className="grid gap-3">
                    {status === "confirmed" && (
                      <Button
                        className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold py-7 text-lg shadow-2xl shadow-indigo-500/20"
                        onClick={() => actionMutation.mutate({ path: `payments/${orderId}/dp`, method: "POST" })}
                        disabled={actionMutation.isPending}
                      >
                        <CreditCardIcon className="mr-3 w-5 h-5" /> Bayar DP Sekarang
                      </Button>
                    )}
                    {status === "delivered" && order.payment?.statusPelunasan !== "paid" && (
                      <Button
                        className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold py-7 text-lg"
                        onClick={() => actionMutation.mutate({ path: `payments/${orderId}/settle`, method: "POST" })}
                        disabled={actionMutation.isPending}
                      >
                        Bayar Pelunasan 💳
                      </Button>
                    )}
                    {status === "completed" && !order.review && (
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                        <h4 className="font-black text-slate-900 mb-2 uppercase italic">Satu Hal Lagi!</h4>
                        <p className="text-xs text-slate-500 mb-4 font-medium italic">Bagikan pengalamanmu dengan fotografer ini.</p>
                        <ReviewDialog orderId={orderId} />
                      </div>
                    )}
                  </div>
                )}

                {/* All Roles: Status Info for Terminal states */}
                {(status === "cancelled" || status === "disputed") && (
                  <div className={cn("p-6 rounded-[2rem] flex items-center gap-4", status === "cancelled" ? "bg-rose-50 text-rose-700" : "bg-orange-50 text-orange-700")}>
                    <AlertCircleIcon className="w-6 h-6 flex-shrink-0" />
                    <div className="text-sm font-black uppercase tracking-tighter leading-tight italic">
                      Order ini berstatus {status.toUpperCase()}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center gap-3">
                <CheckCircle2Icon className="w-4 h-4 text-emerald-500" />
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Transaksi Aman & Terlindungi</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function getStatusStyles(status: string) {
  switch (status) {
    case "pending": return "bg-slate-200 text-slate-900"
    case "confirmed": return "bg-blue-600 text-white"
    case "dp_paid": return "bg-indigo-600 text-white"
    case "ongoing": return "bg-amber-500 text-white"
    case "delivered": return "bg-purple-600 text-white"
    case "completed": return "bg-emerald-600 text-white"
    case "cancelled": return "bg-rose-600 text-white shadow-lg shadow-rose-200"
    case "disputed": return "bg-orange-600 text-white shadow-lg shadow-orange-200"
    default: return "bg-slate-400 text-white"
  }
}

function OrderDetailsSkeleton() {
  return (
    <div className="container mx-auto p-8 space-y-8 animate-pulse max-w-6xl">
      <Skeleton className="h-10 w-48 mb-6 rounded-full" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Skeleton className="h-[200px] w-full rounded-[3rem]" />
          <Skeleton className="h-[400px] w-full rounded-[3rem]" />
        </div>
        <div>
          <Skeleton className="h-[600px] w-full rounded-[3rem]" />
        </div>
      </div>
    </div>
  )
}
