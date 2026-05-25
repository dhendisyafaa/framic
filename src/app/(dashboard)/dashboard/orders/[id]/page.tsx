"use client"

import { use, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useUser } from "@clerk/nextjs"
import { OrderDetail } from "@/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { ChatWindow } from "@/components/features/chat/chat-window"
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
  const [isChatOpen, setIsChatOpen] = useState(false)

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
  if (error || !response?.success) return <div className="p-20 text-center font-black text-rose-500">Error: {error?.message || "Oops, order hilang!"}</div>

  const order = response.data
  const isCustomer = user?.id === order.customerClerkId
  const isPG = user?.id === order.photographer?.clerkId
  const status = order.status

  // Helper: Inject watermark for unpaid customers
  const getDisplayUrl = (url: string) => {
    const isPaid = order.payment?.statusPelunasan === "paid"
    // Watermark only for customers if not paid
    if (!isPG && !isPaid) {
      // Cloudinary transformation: text overlay 'FRAMIC', opacity 30, center
      return url.replace("/upload/", "/upload/l_text:Arial_100_bold:FRAMIC,o_30,q_auto,f_auto/")
    }
    return url
  }

  return (
    <>
      <div className="container mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-6xl">
        {/* Back Button */}
        <Link href="/dashboard/orders" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-xs mb-8 group bg-card px-4 py-2 rounded-full border border-muted shadow-sm transition-all">
          <ArrowLeftIcon className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          Daftar Order
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Kolom Kiri: Detil Order */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-muted bg-card shadow-sm rounded-[32px] overflow-hidden">
              <CardHeader className="bg-[#141413] p-8 text-[#FCFBFA] relative">
                <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 translate-x-10 -translate-y-5">
                  <CameraIcon size={180} />
                </div>
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Badge className={`rounded-full px-5 border-none font-bold text-[9px] tracking-wider ${getStatusStyles(status)}`}>
                      {status.toUpperCase()}
                    </Badge>
                    <span className="text-[9px] font-bold text-[#D1CDC7] uppercase tracking-[0.2em] bg-white/5 px-3 py-1 rounded-full">ID: #{order.id.slice(0, 8)}</span>
                  </div>
                  <CardTitle className="text-3xl md:text-4xl font-medium tracking-[-0.02em]">
                    {order.package?.namaPaket || "Sesi Fotografi Privat"}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Rincian Sesi */}
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 border-b border-muted/50 pb-2">
                      <CalendarIcon className="w-3.5 h-3.5 text-accent" /> Detail Sesi
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-accent flex-shrink-0 border border-muted/50">
                          <CalendarIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[9px] font-bold text-muted-foreground uppercase mb-0.5">Tanggal</div>
                          <div className="font-bold text-foreground text-sm uppercase">{format(new Date(order.tanggalPotret), "eeee, d MMM yyyy", { locale: localeId })}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-accent flex-shrink-0 border border-muted/50">
                          <MapPinIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[9px] font-bold text-muted-foreground uppercase mb-0.5">Lokasi</div>
                          <div className="font-bold text-foreground text-sm">{order.lokasi}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Partner Terlibat */}
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 border-b border-muted/50 pb-2">
                      <MessageSquare className="w-3.5 h-3.5 text-accent" /> {isCustomer ? "Fotografer" : "Kustomer"}
                    </h3>
                    <div className="flex items-center gap-4 p-4 rounded-[24px] border border-muted bg-background">
                      <Avatar className="w-12 h-12 bg-muted border border-muted/50 rounded-full text-foreground font-bold text-base uppercase">
                        <AvatarImage src={isCustomer ? order.photographer?.avatarUrl : order.customerAvatarUrl} />
                        <AvatarFallback>
                          {isCustomer ? (order.photographer?.nama || "P").slice(0, 1) : (order.customerName || "C").slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-foreground text-sm uppercase tracking-tight truncate">
                          {isCustomer ? order.photographer?.nama : order.customerName}
                        </div>
                        <Button
                          variant="link"
                          className="p-0 h-auto text-[9px] font-bold uppercase text-accent tracking-wider hover:no-underline flex items-center gap-1 cursor-pointer mt-0.5"
                          onClick={() => setIsChatOpen(true)}
                        >
                          Chat ke {isCustomer ? "Fotografer" : "Kustomer"} <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Catatan Khusus */}
                {order.catatan && (
                  <div className="mt-8 pt-8 border-t border-muted">
                    <h3 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Instruksi Khusus</h3>
                    <div className="p-4 bg-background border border-muted rounded-[24px] text-xs text-muted-foreground leading-relaxed relative overflow-hidden">
                      <AlertCircleIcon className="absolute -bottom-2 -right-2 w-12 h-12 text-[#FF5F00]/5" />
                      "{order.catatan}"
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Galeri Foto & Ulasan (Jika Sudah Ongoing ke atas) */}
            {(status === "ongoing" || status === "delivered" || status === "completed") && (
              <div className="space-y-8">
                <Card className="border-muted bg-card shadow-sm rounded-[32px] overflow-hidden">
                  <CardHeader className="p-8 pb-0">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl font-medium tracking-tight">Hasil Pemotretan</CardTitle>
                        <CardDescription className="text-xs font-medium text-muted-foreground">Total {order.photos?.length || 0} foto telah diunggah.</CardDescription>
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
                          <Button asChild disabled={isUploading} className="rounded-full font-bold bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-10 px-6 cursor-pointer">
                            <label htmlFor="photo-upload" className="cursor-pointer flex items-center gap-2">
                              {isUploading ? "Uploading..." : <><UploadIcon className="w-4 h-4" /> Tambah Foto</>}
                            </label>
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    {order.photos && order.photos.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {order.photos.map((photo) => (
                          <div key={photo.id} className="aspect-square rounded-[16px] overflow-hidden border border-muted relative group bg-muted">
                            <img
                              src={getDisplayUrl(photo.fotoUrl)}
                              alt="Hasil Foto"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button asChild variant="secondary" size="icon" className="rounded-full w-8 h-8">
                                <a href={getDisplayUrl(photo.fotoUrl)} target="_blank" rel="noopener noreferrer">
                                  <EyeIcon className="w-4 h-4" />
                                </a>
                              </Button>
                              <Button asChild size="icon" className="rounded-full w-8 h-8 bg-card text-foreground hover:bg-muted">
                                <a href={getDisplayUrl(photo.fotoUrl)} download={`photo-${photo.id}`}>
                                  <UploadIcon className="w-4 h-4 rotate-180" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 bg-background border border-dashed border-muted rounded-[24px] text-center">
                        <CameraIcon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground font-bold uppercase tracking-widest text-[9px]">Belum ada foto yang masuk</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Status Section for Completed with Review */}
                {status === "completed" && order.review && (
                  <Card className="border-muted bg-card shadow-sm rounded-[32px] p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <StarIcon key={i} className={`w-5 h-5 ${i <= (order.review?.rating || 0) ? "fill-accent text-accent" : "text-muted"}`} />
                        ))}
                      </div>
                      <Badge className="bg-accent text-white font-bold uppercase text-[9px] tracking-wider">Customer Review</Badge>
                    </div>
                    <p className="text-foreground font-bold text-lg leading-relaxed">"{order.review.komentar}"</p>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Kolom Kanan: Actions & Payment Summary */}
          <div className="space-y-8">
            <Card className="border-muted bg-card shadow-sm rounded-[32px] overflow-hidden sticky top-24">
              <CardHeader className="p-8 bg-[#141413] text-[#FCFBFA] border-b border-muted">
                <h3 className="text-[9px] font-bold text-[#D1CDC7] uppercase tracking-[0.2em] mb-1">Rincian Pembayaran</h3>
                <div className="text-3xl font-medium tracking-tight text-white">Rp {order.totalHarga.toLocaleString("id-ID")}</div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Uang Muka (50%)</span>
                      <div className="font-bold text-foreground text-base">Rp {order.payment?.jumlahDp.toLocaleString("id-ID")}</div>
                    </div>
                    <Badge variant="outline" className={`rounded-full px-3 text-[9px] font-bold tracking-wider ${order.payment?.statusDp === "paid" ? "bg-accent/20 text-accent border border-accent/30" : "bg-accent/10 text-accent border border-accent/20"}`}>
                      {order.payment?.statusDp.toUpperCase() || "UNPAID"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-start border-t border-muted/50 pt-4">
                    <div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Pelunasan (50%)</span>
                      <div className="font-bold text-foreground text-base">Rp {order.payment?.jumlahPelunasan.toLocaleString("id-ID")}</div>
                    </div>
                    <Badge variant="outline" className={`rounded-full px-3 text-[9px] font-bold tracking-wider ${order.payment?.statusPelunasan === "paid" ? "bg-[#141413] text-[#FCFBFA] border-none" : "bg-muted text-muted-foreground border-muted"}`}>
                      {order.payment?.statusPelunasan?.toUpperCase() || "UNPAID"}
                    </Badge>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="space-y-4">
                  {/* Role: PHOTOGRAPHER */}
                  {isPG && (
                    <div className="grid gap-3">
                      {status === "pending" && (
                        <>
                          <Button
                            className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-base shadow-sm group cursor-pointer"
                            onClick={() => actionMutation.mutate({ path: `orders/${orderId}/confirm` })}
                            disabled={actionMutation.isPending}
                          >
                            {actionMutation.isPending ? "Processing..." : <><CheckCircle2Icon className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" /> Konfirmasi Order</>}
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full text-destructive border-muted hover:bg-destructive/5 hover:border-destructive/10 font-bold uppercase text-xs tracking-wider rounded-full py-2.5 h-10 cursor-pointer"
                            onClick={() => actionMutation.mutate({ path: `orders/${orderId}/reject` })}
                            disabled={actionMutation.isPending}
                          >
                            Tolak Order
                          </Button>
                        </>
                      )}
                      {status === "dp_paid" && (
                        <Button
                          className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-base group cursor-pointer"
                          onClick={() => actionMutation.mutate({ path: `orders/${orderId}/ongoing` })}
                          disabled={actionMutation.isPending}
                        >
                          Mulai Sesi Foto <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      )}
                      {status === "ongoing" && (
                        <div className="space-y-4">
                          {/* Minimum Photos Validation Info */}
                          {(() => {
                            const minPhotos = order.package?.jumlahFotoMin || 0
                            const currentPhotos = order.photos?.length || 0
                            const isComplete = currentPhotos >= minPhotos

                            return (
                              <>
                                {!isComplete && (
                                  <div className="p-4 bg-[#FF5F00]/5 border border-[#FF5F00]/15 rounded-[24px] flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                                    <AlertCircleIcon className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[9px] font-bold text-accent uppercase tracking-widest leading-none">Minimal Foto Belum Tercapai</span>
                                      <p className="text-xs text-muted-foreground font-medium leading-tight">
                                        Anda harus mengunggah minimal <span className="font-bold underline">{minPhotos} foto</span> sesuai paket.
                                        Saat ini: <span className="font-bold">{currentPhotos} foto</span>.
                                      </p>
                                    </div>
                                  </div>
                                )}
                                <Button
                                  className={cn(
                                    "w-full rounded-full font-bold py-6 text-base transition-all duration-300",
                                    isComplete
                                      ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm cursor-pointer"
                                      : "bg-muted text-muted-foreground cursor-not-allowed border border-muted"
                                  )}
                                  onClick={() => actionMutation.mutate({ path: `orders/${orderId}/deliver` })}
                                  disabled={actionMutation.isPending || isUploading || !isComplete}
                                >
                                  {actionMutation.isPending ? "Memproses..." : "Selesai Upload"}
                                </Button>
                              </>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Role: CUSTOMER */}
                  {isCustomer && (
                    <div className="grid gap-3">
                      {status === "confirmed" && (
                        <Button
                          className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-base shadow-sm cursor-pointer"
                          onClick={() => actionMutation.mutate({ path: `payments/${orderId}/dp`, method: "POST" })}
                          disabled={actionMutation.isPending}
                        >
                          <CreditCardIcon className="mr-3 w-5 h-5" /> Bayar Down Payment
                        </Button>
                      )}
                      {status === "delivered" && order.payment?.statusPelunasan !== "paid" && (
                        <Button
                          className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-base shadow-sm cursor-pointer"
                          onClick={() => actionMutation.mutate({ path: `payments/${orderId}/settle`, method: "POST" })}
                          disabled={actionMutation.isPending}
                        >
                          Bayar Pelunasan
                        </Button>
                      )}
                      {status === "completed" && !order.review && (
                        <div className="p-6 bg-background rounded-[24px] border border-muted text-center">
                          <h4 className="font-bold text-foreground text-sm mb-1 uppercase tracking-tight">Satu Hal Lagi!</h4>
                          <p className="text-xs text-muted-foreground mb-4 font-medium">Bagikan pengalamanmu dengan fotografer ini.</p>
                          <ReviewDialog orderId={orderId} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* All Roles: Status Info for Terminal states */}
                  {(status === "cancelled" || status === "disputed") && (
                    <div className="p-4 rounded-[24px] flex items-center gap-3 bg-[#FF5F00]/5 border border-[#FF5F00]/15 text-[#CF4500]">
                      <AlertCircleIcon className="w-5 h-5 flex-shrink-0" />
                      <div className="text-xs font-bold uppercase tracking-wider leading-tight">
                        Order ini berstatus {status.toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-muted flex items-center gap-3">
                  <CheckCircle2Icon className="w-4 h-4 text-accent" />
                  <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">Transaksi Aman & Terlindungi</span>
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

function getStatusStyles(status: string) {
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
    <div className="container mx-auto p-8 space-y-8 animate-pulse max-w-6xl">
      <Skeleton className="h-10 w-48 mb-6 rounded-full" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Skeleton className="h-[200px] w-full rounded-[32px]" />
          <Skeleton className="h-[400px] w-full rounded-[32px]" />
        </div>
        <div>
          <Skeleton className="h-[600px] w-full rounded-[32px]" />
        </div>
      </div>
    </div>
  )
}
