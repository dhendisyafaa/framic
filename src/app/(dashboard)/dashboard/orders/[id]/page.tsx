"use client"

import { use } from "react"
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
  ClockIcon,
  PackageIcon,
  ArrowLeftIcon,
  CreditCardIcon,
  UploadIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  GalleryVerticalEndIcon,
  StarIcon,
} from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ReviewDialog } from "@/components/features/reviews/review-dialog"

/**
 * Halaman Detail Order
 * Menampilkan rincian order, status pembayaran, dan tombol aksi dinamis.
 */
export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = use(params)
  const { user } = useUser()
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}`)
      if (!res.ok) throw new Error("Gagal mengambil detail order")
      return res.json() as Promise<{ success: boolean; data: OrderDetail }>
    },
  })

  // Mutations for actions
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
    },
  })

  if (isLoading) return <OrderDetailsSkeleton />
  if (error || !response?.success) return <div className="p-10 text-center text-rose-500 font-bold italic">Error: {error?.message || "Data tidak ditemukan"}</div>

  const order = response.data
  const isCustomer = user?.id === order.customerClerkId
  const isPG = user?.id === order.photographer?.clerkId
  const status = order.status

  return (
    <div className="container mx-auto p-4 md:p-8 animate-in fade-in duration-700">
      {/* Back Button */}
      <Link href="/orders" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary font-bold text-sm mb-6 group">
        <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Kembali ke Daftar Order
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: Detil Order */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={`rounded-full px-4 border-2 font-black ${getStatusColor(status)}`}>
                      {status.toUpperCase()}
                    </Badge>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Order ID: #{order.id.slice(0, 8)}</span>
                  </div>
                  <CardTitle className="text-3xl font-black tracking-tight text-slate-900 italic">
                    {order.package?.namaPaket || "Sesi Fotografi Personal"}
                  </CardTitle>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Biaya</div>
                  <div className="text-3xl font-black text-indigo-600 leading-none tracking-tighter">Rp {order.totalHarga.toLocaleString("id-ID")}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Rincian Sesi */}
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <CameraIcon className="w-4 h-4" /> Rincian Sesi
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                      <CalendarIcon className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase">Tanggal Pemotretan</div>
                        <div className="font-bold text-slate-900">{format(new Date(order.tanggalPotret), "eeee, d MMMM yyyy", { locale: localeId })}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                      <MapPinIcon className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase">Lokasi</div>
                        <div className="font-bold text-slate-900">{order.lokasi}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Fotografer / Customer */}
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <GalleryVerticalEndIcon className="w-4 h-4" /> Partner Terlibat
                  </h3>
                  <div className="flex items-center gap-5 p-4 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 font-black text-xl italic uppercase">
                      {isCustomer ? order.photographer?.kotaDomisili?.slice(0, 1) || "P" : "C"}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase">{isCustomer ? "Fotografer" : "Kustomer"}</div>
                      <div className="font-black text-slate-900 text-lg uppercase leading-tight">
                        {isCustomer ? order.photographer?.nama : order.customerName}
                      </div>
                      <Link href="#" className="text-xs font-bold text-primary hover:underline">Chat Sekarang</Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Catatan Khusus */}
              {order.catatan && (
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Catatan Khusus</h3>
                  <p className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl text-slate-600 italic font-medium leading-relaxed">"{order.catatan}"</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Galeri Foto (Jika Ada) */}
          {(status === "delivered" || status === "completed") && (
            <Card className="border-slate-200/60 shadow-xl shadow-slate-200/20 rounded-[2rem] overflow-hidden">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-2xl font-black italic tracking-tight">Hasil Pemotretan</CardTitle>
                <CardDescription className="font-medium text-slate-500">Fotografer telah mengunggah {order.photos?.length || 0} foto hasil sesi Anda.</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                {/* FIX: ntar adain fitur button download all foto to zip, add lightbox for preview photo before download, and add watermark to all photo when customer doesn't full payment. */}
                {order.photos && order.photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {order.photos.map((photo) => (
                      <div key={photo.id} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 relative group">
                        <img src={photo.fotoUrl} alt="Hasil Foto" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button variant="secondary" size="sm" className="rounded-full text-[10px] font-black h-7">DOWNLOAD</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                    <UploadIcon className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm italic">Belum ada foto yang diunggah</p>
                  </div>
                )}
                {isPG && status === "ongoing" && (
                  <Button className="w-full mt-6 rounded-2xl bg-indigo-600 font-bold py-6 group">
                    <UploadIcon className="mr-2 group-hover:animate-bounce" /> Upload Hasil Akhir
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Ulasan (Jika Sudah Ada) */}
          {order.review && (
            <Card className="border-slate-200/60 shadow-xl shadow-emerald-500/5 rounded-[2rem] bg-emerald-50/20">
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-1 text-primary">
                    {[1, 2, 3, 4, 5].map(i => (
                      <StarIcon key={i} className={`w-5 h-5 ${i <= (order.review?.rating || 0) ? "fill-primary" : "text-slate-200"}`} />
                    ))}
                  </div>
                  <span className="font-black text-slate-900 ml-2">Review Kustomer</span>
                </div>
                <p className="text-slate-700 italic font-medium leading-relaxed">"{order.review.komentar}"</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Kolom Kanan: Actions & Summary */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card className="border-slate-200/60 shadow-xl shadow-slate-200/20 rounded-[2.5rem] overflow-hidden sticky top-24">
            <CardHeader className="p-8 bg-slate-900 text-white">
              <h3 className="text-lg font-black tracking-tighter flex items-center gap-2 uppercase">
                <CreditCardIcon className="w-5 h-5 text-indigo-400" /> Ringkasan Pembayaran
              </h3>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-bold text-slate-400 uppercase">DP (50%)</span>
                  <div className="flex flex-col items-end">
                    <span className="font-black text-slate-900">Rp {order.payment?.jumlahDp.toLocaleString("id-ID")}</span>
                    <Badge variant="outline" className={`text-[9px] font-black tracking-widest rounded-full py-0 px-2 mt-1 ${order.payment?.statusDp === "paid" ? "text-emerald-500 border-emerald-500" : "text-amber-500 border-amber-500"}`}>
                      {order.payment?.statusDp.toUpperCase() || "UNPAID"}
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-bold text-slate-400 uppercase">Pelunasan (50%)</span>
                  <div className="flex flex-col items-end">
                    <span className="font-black text-slate-900">Rp {order.payment?.jumlahPelunasan.toLocaleString("id-ID")}</span>
                    <Badge variant="outline" className={`text-[9px] font-black tracking-widest rounded-full py-0 px-2 mt-1 ${order.payment?.statusPelunasan === "paid" ? "text-emerald-500 border-emerald-500" : "text-slate-300 border-slate-300"}`}>
                      {order.payment?.statusPelunasan?.toUpperCase() || "UNPAID"}
                    </Badge>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="font-black text-slate-900 uppercase italic">Grand Total</span>
                  <span className="text-xl font-black text-primary tracking-tighter">Rp {order.totalHarga.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* DYNAMIC ACTION BUTTONS */}
              <div className="pt-4 space-y-3">
                {/* CUSTOMER ACTIONS */}
                {isCustomer && (
                  <>
                    {status === "confirmed" && (
                      <Button
                        className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold py-6 text-lg tracking-tight"
                        onClick={() => actionMutation.mutate({ path: `payments/${orderId}/dp`, method: "POST" })}
                        disabled={actionMutation.isPending}
                      >
                        <CreditCardIcon className="mr-3 w-5 h-5" /> Bayar DP Sekarang
                      </Button>
                    )}
                    {status === "delivered" && order.payment?.statusPelunasan !== "paid" && (
                      <Button
                        className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold py-6 text-lg"
                        onClick={() => actionMutation.mutate({ path: `payments/${orderId}/settle`, method: "POST" })}
                        disabled={actionMutation.isPending}
                      >
                        Pelunasan Order 💳
                      </Button>
                    )}
                    {status === "completed" && !order.review && (
                      <ReviewDialog orderId={order.id} />
                    )}
                  </>
                )}

                {/* PHOTOGRAPHER ACTIONS */}
                {isPG && (
                  <>
                    {status === "pending" && (
                      <div className="flex flex-col gap-3">
                        <Button
                          className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold py-6 shadow-lg shadow-emerald-200"
                          onClick={() => actionMutation.mutate({ path: `orders/${orderId}/confirm` })}
                          disabled={actionMutation.isPending}
                        >
                          Konfirmasi Order
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full rounded-2xl text-rose-600 border-rose-100 hover:bg-rose-50 font-bold py-6"
                          onClick={() => actionMutation.mutate({ path: `orders/${orderId}/reject` })}
                          disabled={actionMutation.isPending}
                        >
                          Tolak Order
                        </Button>
                      </div>
                    )}
                    {status === "dp_paid" && (
                      <Button
                        className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold py-6 shadow-xl shadow-indigo-200"
                        onClick={() => actionMutation.mutate({ path: `orders/${orderId}/ongoing` })}
                        disabled={actionMutation.isPending}
                      >
                        Mulai Sesi Pemotretan 🚀
                      </Button>
                    )}
                    {status === "ongoing" && (
                      <Button
                        className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold py-6"
                        onClick={() => actionMutation.mutate({ path: `orders/${orderId}/deliver` })}
                        disabled={actionMutation.isPending}
                      >
                        Mark as Delivered 📥
                      </Button>
                    )}
                  </>
                )}

                <div className="flex items-center gap-2 mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 italic text-[10px] text-slate-400 font-medium">
                  <CheckCircle2Icon className="w-3 h-3 text-emerald-500" />
                  Semua transaksi di Framic terlindungi secara otomatis oleh sistem klaim & dispute.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending": return "text-slate-500 border-slate-200 bg-slate-50"
    case "confirmed": return "text-blue-600 border-blue-200 bg-blue-50"
    case "dp_paid": return "text-indigo-600 border-indigo-200 bg-indigo-50"
    case "ongoing": return "text-amber-600 border-amber-200 bg-amber-50"
    case "delivered": return "text-purple-600 border-purple-200 bg-purple-50"
    case "completed": return "text-emerald-600 border-emerald-200 bg-emerald-50"
    case "cancelled": return "text-rose-600 border-rose-200 bg-rose-50"
    case "disputed": return "text-orange-600 border-orange-200 bg-orange-50"
    default: return "text-slate-600 border-slate-200"
  }
}

function OrderDetailsSkeleton() {
  return (
    <div className="container mx-auto p-8 space-y-8 animate-pulse">
      <Skeleton className="h-6 w-48 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Skeleton className="h-[400px] w-full rounded-[2rem]" />
        </div>
        <div>
          <Skeleton className="h-[500px] w-full rounded-[2rem]" />
        </div>
      </div>
    </div>
  )
}
