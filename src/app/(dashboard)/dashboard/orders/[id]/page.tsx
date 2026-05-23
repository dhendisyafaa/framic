"use client"

import { ReviewDialog } from "@/components/features/reviews/review-dialog"
import { ChatWindow } from "@/components/features/chat/chat-window"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { OrderDetail } from "@/types"
import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import {
  ArrowLeftIcon,
  CalendarIcon,
  CameraIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  GalleryVerticalEndIcon,
  MapPinIcon,
  StarIcon,
  UploadIcon
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use, useState } from "react"

/**
 * Halaman Detail Order
 * Menampilkan rincian order, status pembayaran, dan tombol aksi dinamis.
 */
export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = use(params)
  const { user } = useUser()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [isChatOpen, setIsChatOpen] = useState(false)

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
  if (error || !response?.success) return <div className="p-10 text-center text-rose-500 font-bold">Error: {error?.message || "Data tidak ditemukan"}</div>

  const order = response.data
  const isCustomer = user?.id === order.customerClerkId
  const isPG = user?.id === order.photographer?.clerkId
  const status = order.status

  return (
    <>
      <div className="container mx-auto p-4 md:p-8 animate-in fade-in duration-700">
        {/* Back Button */}
        <Link href="/orders" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-xs mb-6 group bg-card px-4 py-2 rounded-full border border-muted shadow-sm transition-all">
          <ArrowLeftIcon className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Daftar Order
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Kolom Kiri: Detil Order */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-muted bg-card shadow-sm rounded-[32px] overflow-hidden">
              <CardHeader className="bg-[#141413] text-[#FCFBFA] border-b border-muted p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={`rounded-full px-4 border-none font-bold text-[9px] tracking-wider ${getStatusColor(status)}`}>
                        {status.toUpperCase()}
                      </Badge>
                      <span className="text-xs font-bold text-[#D1CDC7] uppercase tracking-widest">Order ID: #{order.id.slice(0, 8)}</span>
                    </div>
                    <CardTitle className="text-2xl font-medium tracking-[-0.02em] text-[#FCFBFA]">
                      {order.package?.namaPaket || "Sesi Fotografi Personal"}
                    </CardTitle>
                  </div>
                  <div className="text-left md:text-right">
                    <div className="text-[9px] font-bold text-[#D1CDC7] uppercase tracking-widest mb-1">Total Biaya</div>
                    <div className="text-2xl font-medium text-white tracking-tighter">Rp {order.totalHarga.toLocaleString("id-ID")}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Rincian Sesi */}
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 border-b border-muted/50 pb-2">
                      <CameraIcon className="w-3.5 h-3.5 text-accent" /> Rincian Sesi
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4 p-4 rounded-[24px] bg-background border border-muted">
                        <CalendarIcon className="w-4 h-4 text-accent mt-0.5" />
                        <div>
                          <div className="text-[9px] font-bold text-muted-foreground uppercase">Tanggal Pemotretan</div>
                          <div className="font-bold text-foreground text-sm">{order.tanggalPotret ? format(new Date(order.tanggalPotret), "eeee, d MMMM yyyy", { locale: localeId }) : "-"}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 rounded-[24px] bg-background border border-muted">
                        <MapPinIcon className="w-4 h-4 text-accent mt-0.5" />
                        <div>
                          <div className="text-[9px] font-bold text-muted-foreground uppercase">Lokasi</div>
                          <div className="font-bold text-foreground text-sm">{order.lokasi}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info Fotografer / Customer */}
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 border-b border-muted/50 pb-2">
                      <GalleryVerticalEndIcon className="w-3.5 h-3.5 text-accent" /> Partner Terlibat
                    </h3>
                    <div className="flex items-center gap-4 p-4 rounded-[24px] border border-muted bg-background">
                      <Avatar className="w-12 h-12 bg-muted rounded-full text-foreground border border-muted/50 font-bold text-base uppercase">
                        <AvatarImage src={isCustomer ? order.photographer?.avatarUrl : order.customerAvatarUrl} />
                        <AvatarFallback>
                          {isCustomer ? order.photographer?.nama?.slice(0, 1) || "P" : "C"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-[9px] font-bold text-muted-foreground uppercase">{isCustomer ? "Fotografer" : "Kustomer"}</div>
                        <div className="font-bold text-foreground text-sm uppercase leading-tight mt-0.5">
                          {isCustomer ? order.photographer?.nama : order.customerName}
                        </div>
                        <button onClick={() => setIsChatOpen(true)} className="text-[9px] font-bold uppercase text-accent tracking-wider hover:underline mt-1 block">Chat Sekarang</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Catatan Khusus */}
                {order.catatan && (
                  <div className="mt-8 pt-8 border-t border-muted">
                    <h3 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Catatan Khusus</h3>
                    <p className="p-4 bg-[#FF5F00]/5 border border-[#FF5F00]/15 rounded-[24px] text-xs text-muted-foreground leading-relaxed">"{order.catatan}"</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Galeri Foto (Jika Ada) */}
            {(status === "delivered" || status === "completed" || status === "ongoing") && (
              <Card className="border-muted bg-card shadow-sm rounded-[32px] overflow-hidden">
                <CardHeader className="p-8 pb-0">
                  <CardTitle className="text-xl font-medium tracking-tight">Hasil Pemotretan</CardTitle>
                  <CardDescription className="text-xs font-medium text-muted-foreground">Fotografer telah mengunggah {order.photos?.length || 0} foto hasil sesi Anda.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  {order.photos && order.photos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {order.photos.map((photo) => (
                        <div key={photo.id} className="aspect-square rounded-[16px] overflow-hidden border border-muted relative group">
                          <img src={photo.fotoUrl} alt="Hasil Foto" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="secondary" size="sm" className="rounded-full text-[9px] font-bold h-7 bg-primary text-primary-foreground hover:bg-primary/90 border-none px-4 cursor-pointer">DOWNLOAD</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 bg-background border border-dashed border-muted rounded-[24px] text-center">
                      <UploadIcon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground font-bold uppercase tracking-widest text-[9px]">Belum ada foto yang diunggah</p>
                    </div>
                  )}
                  {isPG && status === "ongoing" && (
                    <Button className="w-full mt-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 group cursor-pointer">
                      <UploadIcon className="mr-2 group-hover:animate-bounce w-4 h-4" /> Upload Hasil Akhir
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Ulasan (Jika Sudah Ada) */}
            {order.review && (
              <Card className="border-muted bg-card shadow-sm rounded-[32px] p-8">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-1 text-accent">
                      {[1, 2, 3, 4, 5].map(i => (
                        <StarIcon key={i} className={`w-5 h-5 ${i <= (order.review?.rating || 0) ? "fill-accent text-accent" : "text-muted"}`} />
                      ))}
                    </div>
                    <span className="font-bold text-foreground ml-2 text-sm">Review Kustomer</span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">"{order.review.komentar}"</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Kolom Kanan: Actions & Summary */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card className="border-muted bg-card shadow-sm rounded-[32px] overflow-hidden sticky top-24">
              <CardHeader className="p-8 bg-[#141413] text-[#FCFBFA]">
                <h3 className="text-sm font-medium tracking-tight flex items-center gap-2 uppercase">
                  <CreditCardIcon className="w-4 h-4 text-accent" /> Ringkasan Pembayaran
                </h3>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">DP (50%)</span>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-foreground">Rp {order.payment?.jumlahDp.toLocaleString("id-ID")}</span>
                      <Badge variant="outline" className={`text-[9px] font-bold tracking-wider rounded-full py-0 px-2 mt-1 ${order.payment?.statusDp === "paid" ? "bg-accent/20 text-accent border border-accent/30" : "bg-accent/10 text-accent border border-accent/20"}`}>
                        {order.payment?.statusDp.toUpperCase() || "UNPAID"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-muted/50">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Pelunasan (50%)</span>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-foreground">Rp {order.payment?.jumlahPelunasan.toLocaleString("id-ID")}</span>
                      <Badge variant="outline" className={`text-[9px] font-bold tracking-wider rounded-full py-0 px-2 mt-1 ${order.payment?.statusPelunasan === "paid" ? "bg-accent/20 text-accent border border-accent/30" : "bg-muted text-muted-foreground border-muted"}`}>
                        {order.payment?.statusPelunasan?.toUpperCase() || "UNPAID"}
                      </Badge>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-muted flex justify-between items-center">
                    <span className="font-bold text-foreground text-xs uppercase tracking-wider">Grand Total</span>
                    <span className="text-xl font-medium text-foreground tracking-tight">Rp {order.totalHarga.toLocaleString("id-ID")}</span>
                  </div>
                </div>

                {/* DYNAMIC ACTION BUTTONS */}
                <div className="pt-4 space-y-3">
                  {/* CUSTOMER ACTIONS */}
                  {isCustomer && (
                    <>
                      {status === "confirmed" && (
                        <Button
                          className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-base shadow-sm cursor-pointer"
                          onClick={() => actionMutation.mutate({ path: `payments/${orderId}/dp`, method: "POST" })}
                          disabled={actionMutation.isPending}
                        >
                          <CreditCardIcon className="mr-3 w-5 h-5" /> Bayar Uang Muka
                        </Button>
                      )}
                      {status === "delivered" && order.payment?.statusPelunasan !== "paid" && (
                        <Button
                          className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-base shadow-sm cursor-pointer"
                          onClick={() => actionMutation.mutate({ path: `payments/${orderId}/settle`, method: "POST" })}
                          disabled={actionMutation.isPending}
                        >
                          Pelunasan Order
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
                            className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-base shadow-sm cursor-pointer"
                            onClick={() => actionMutation.mutate({ path: `orders/${orderId}/confirm` })}
                            disabled={actionMutation.isPending}
                          >
                            Konfirmasi Order
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full rounded-full text-destructive border-muted hover:bg-destructive/5 hover:border-destructive/10 font-bold py-6 text-xs cursor-pointer"
                            onClick={() => actionMutation.mutate({ path: `orders/${orderId}/reject` })}
                            disabled={actionMutation.isPending}
                          >
                            Tolak Order
                          </Button>
                        </div>
                      )}
                      {status === "dp_paid" && (
                        <Button
                          className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-base shadow-sm cursor-pointer"
                          onClick={() => actionMutation.mutate({ path: `orders/${orderId}/ongoing` })}
                          disabled={actionMutation.isPending}
                        >
                          Mulai Sesi Pemotretan
                        </Button>
                      )}
                      {status === "ongoing" && (
                        <Button
                          className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-base shadow-sm cursor-pointer"
                          onClick={() => actionMutation.mutate({ path: `orders/${orderId}/deliver` })}
                          disabled={actionMutation.isPending}
                        >
                          Mark as Delivered 📥
                        </Button>
                      )}
                    </>
                  )}

                  <div className="flex items-center gap-3 mt-4 p-4 rounded-[24px] bg-background border border-muted text-[9px] text-muted-foreground font-medium leading-normal">
                    <CheckCircle2Icon className="w-4 h-4 text-accent shrink-0" />
                    <span>Semua transaksi di Framic terlindungi secara otomatis oleh sistem klaim & dispute.</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Chat Side Sheet */}
      <ChatWindow
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        orderId={orderId}
        currentUserClerkId={user?.id}
        partnerName={isCustomer ? (order.photographer?.nama ?? "Fotografer") : (order.customerName ?? "Kustomer")}
        partnerAvatarUrl={isCustomer ? order.photographer?.avatarUrl : order.customerAvatarUrl}
      />
    </>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending": return "bg-accent/10 text-accent border border-accent/20"
    case "confirmed": return "bg-blue-500/10 text-blue-500 border border-blue-500/20"
    case "dp_paid": return "bg-accent/10 text-accent border border-accent/20"
    case "ongoing": return "bg-amber-500/10 text-amber-500 border border-amber-500/20"
    case "delivered": return "bg-purple-500/10 text-purple-500 border border-purple-500/20"
    case "completed": return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
    case "cancelled": return "bg-destructive/10 text-destructive border border-destructive/20 shadow-sm"
    case "disputed": return "bg-accent/15 text-accent border border-accent/25 shadow-sm"
    default: return "bg-muted text-muted-foreground"
  }
}

function OrderDetailsSkeleton() {
  return (
    <div className="container mx-auto p-8 space-y-8 animate-pulse">
      <Skeleton className="h-6 w-48 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Skeleton className="h-[400px] w-full rounded-[32px]" />
        </div>
        <div>
          <Skeleton className="h-[500px] w-full rounded-[32px]" />
        </div>
      </div>
    </div>
  )
}
