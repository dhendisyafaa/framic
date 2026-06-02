"use client"

import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { BackButton } from "@/components/ui/back-button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  TentIcon,
  ArrowLeftIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  UploadCloudIcon,
  PlusCircleIcon,
  UsersIcon,
  ChevronDownIcon,
  InfoIcon,
  ChevronRightIcon,
  TrashIcon,
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


// Types
interface EventEntry {
  id: string
  mitraId: string
  namaEvent: string
  deskripsi: string | null
  tanggalMulai: string
  tanggalSelesai: string
  lokasi: string
  coverImageUrl: string | null
  isOpenRecruitment: boolean
  isPublished: boolean
  kuotaPgTetap: number
  kuotaPgPerEvent: number
  deadlineRequest: string | null
  feePgTetap: number | null
  feePgPerEvent: number | null
  createdAt: string
  pgConfirmed: number
}

interface EventsClientProps {
  mitraId: string
}

export function MitraEventsClient({ mitraId }: EventsClientProps) {
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"active" | "past">("active")
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setIsDialogOpen(true)
      // Clean query parameter after opening to prevent reopen on reload
      const newUrl = window.location.pathname
      window.history.replaceState(null, "", newUrl)
    }
  }, [searchParams])

  // -- Queries --
  const { data: response, isLoading } = useQuery({
    queryKey: ["mitra-events-list", mitraId],
    queryFn: async () => {
      const res = await fetch(`/api/events?mitraId=${mitraId}&limit=50`)
      if (!res.ok) throw new Error("Gagal memuat data event")
      return res.json() as Promise<{ success: boolean; data: EventEntry[] }>
    },
  })

  // -- Mutations --
  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal menghapus event")
      return json
    },
    onSuccess: () => {
      toast.success("Event berhasil dihapus!")
      queryClient.invalidateQueries({ queryKey: ["mitra-events-list"] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-5xl animate-pulse">
        <Skeleton className="h-4 w-32 mb-6" />
        <Skeleton className="h-16 w-3/4 mb-10" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
      </div>
    )
  }

  const events = response?.data || []

  const activeEvents = events.filter(e => new Date(e.tanggalSelesai) >= new Date())
  const pastEvents = events.filter(e => new Date(e.tanggalSelesai) < new Date())
  const filteredEvents = activeTab === "active" ? activeEvents : pastEvents

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl animate-in fade-in duration-700">
      <BackButton href="/dashboard" label="Kembali ke Dashboard" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
            <TentIcon className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Daftar Event</h1>
            <p className="text-muted-foreground font-medium">Kelola event, tugaskan fotografer, dan buka recruitment.</p>
          </div>
        </div>
        <Button
          className="rounded-full px-6 bg-accent hover:bg-accent/90 text-white font-bold cursor-pointer"
          onClick={() => setIsDialogOpen(true)}
        >
          <PlusCircleIcon className="w-4 h-4 mr-2" /> Buat Event Baru
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("active")}
          className={`pb-2 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "active"
              ? "border-accent text-accent font-black"
              : "border-transparent text-muted-foreground hover:text-foreground font-medium"
          }`}
        >
          Event Aktif ({activeEvents.length})
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`pb-2 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "past"
              ? "border-accent text-accent font-black"
              : "border-transparent text-muted-foreground hover:text-foreground font-medium"
          }`}
        >
          Riwayat Event ({pastEvents.length})
        </button>
      </div>

      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="bg-muted/10 border-2 border-dashed border-border rounded-3xl p-16 text-center">
            <TentIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-black text-foreground mb-2">Belum Ada Event</h3>
            <p className="text-muted-foreground font-medium max-w-sm mx-auto mb-6">
              {activeTab === "active"
                ? "Mulai buat event pertama Anda untuk menugaskan tim fotografer atau mencari talenta baru."
                : "Tidak ada riwayat event yang sudah selesai."}
            </p>
            {activeTab === "active" && (
              <Button onClick={() => setIsDialogOpen(true)} className="rounded-full font-bold px-8 cursor-pointer bg-accent text-white hover:bg-accent/90">
                Buat Event Sekarang
              </Button>
            )}
          </div>
        ) : (
          filteredEvents.map((event) => {
            const totalKuota = event.kuotaPgTetap + event.kuotaPgPerEvent
            const isPast = new Date(event.tanggalSelesai) < new Date()

            return (
              <Card key={event.id} className={`border-border bg-card shadow-md shadow-black/5 rounded-3xl overflow-hidden hover:shadow-lg transition-all group ${isPast ? 'opacity-80' : ''}`}>
                <CardContent className="p-0 sm:flex items-stretch">
                  <div className="sm:w-48 h-48 sm:h-auto bg-muted relative shrink-0">
                    {event.coverImageUrl ? (
                      <Image
                        src={event.coverImageUrl}
                        alt={event.namaEvent}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                        <TentIcon className="w-12 h-12" />
                      </div>
                    )}
                    <Badge className={`absolute top-4 left-4 border-2 font-black ${isPast ? 'bg-slate-500/10 text-slate-500 border-slate-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                      {isPast ? 'EXPIRED' : 'ACTIVE'}
                    </Badge>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-black text-foreground mb-2">{event.namaEvent}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground font-medium">
                        <span className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4" /> {format(new Date(event.tanggalMulai), "dd MMM yyyy", { locale: localeId })}</span>
                        <span className="flex items-center gap-1.5"><MapPinIcon className="w-4 h-4" /> {event.lokasi}</span>
                        <span className="flex items-center gap-1.5"><UsersIcon className="w-4 h-4" /> Fotografer Confirmed: {event.pgConfirmed} / {totalKuota}</span>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
                      <Button
                        variant="ghost"
                        onClick={() => setDeleteEventId(event.id)}
                        className="rounded-xl font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 gap-2 cursor-pointer"
                      >
                        <TrashIcon className="w-4 h-4" /> Hapus
                      </Button>
                      <Link href={`/dashboard/mitra/events/${event.id}`}>
                        <Button className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer">
                          Kelola <ChevronRightIcon className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <Dialog open={!!deleteEventId} onOpenChange={(v) => { if (!v) setDeleteEventId(null) }}>
        <DialogContent className="sm:max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground">Hapus Event</DialogTitle>
            <DialogDescription className="font-medium text-slate-500">
              Apakah Anda yakin ingin menghapus event ini? Tindakan ini permanen dan tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="ghost"
              onClick={() => setDeleteEventId(null)}
              className="rounded-xl font-bold cursor-pointer"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteEventId) {
                  deleteMutation.mutate(deleteEventId, {
                    onSuccess: () => setDeleteEventId(null)
                  })
                }
              }}
              disabled={deleteMutation.isPending}
              className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
            >
              {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateEventDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => {
          setIsDialogOpen(false)
          queryClient.invalidateQueries({ queryKey: ["mitra-events-list"] })
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Create Event Dialog (Form)
// ---------------------------------------------------------------------------
function CreateEventDialog({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    namaEvent: "",
    deskripsi: "",
    tanggalMulai: "",
    tanggalSelesai: "",
    lokasi: "",
    feePgTetap: "",
    feePgPerEvent: "",
    kuotaPgTetap: 0,
    kuotaPgPerEvent: 0,
    isOpenRecruitment: false,
    deadlineRequest: "",
  })

  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverImage(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  // Validasi Client
  const validate = () => {
    setErrorMsg("")
    if (formData.tanggalMulai && formData.tanggalSelesai) {
      if (new Date(formData.tanggalSelesai) <= new Date(formData.tanggalMulai)) {
        setErrorMsg("Tanggal selesai harus setelah tanggal mulai.")
        return false
      }
    }
    if (formData.isOpenRecruitment) {
      if (!formData.deadlineRequest) {
        setErrorMsg("Deadline Pendaftaran wajib diisi secara lengkap (tanggal & jam) jika merekrut PG independen.")
        return false
      }
      if (formData.tanggalMulai && new Date(formData.deadlineRequest) >= new Date(formData.tanggalMulai)) {
        setErrorMsg("Deadline Pendaftaran harus sebelum tanggal dan jam mulai event.")
        return false
      }
    }
    return true
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const data = new FormData()
      data.append("namaEvent", formData.namaEvent)
      if (formData.deskripsi) data.append("deskripsi", formData.deskripsi)
      data.append("tanggalMulai", new Date(formData.tanggalMulai).toISOString())
      data.append("tanggalSelesai", new Date(formData.tanggalSelesai).toISOString())
      data.append("lokasi", formData.lokasi)

      if (formData.feePgTetap) data.append("feePgTetap", formData.feePgTetap)
      if (formData.feePgPerEvent) data.append("feePgPerEvent", formData.feePgPerEvent)

      data.append("kuotaPgTetap", formData.kuotaPgTetap.toString())
      data.append("kuotaPgPerEvent", formData.kuotaPgPerEvent.toString())

      data.append("isOpenRecruitment", formData.isOpenRecruitment ? "true" : "false")
      if (formData.isOpenRecruitment && formData.deadlineRequest) {
        data.append("deadlineRequest", new Date(formData.deadlineRequest).toISOString())
      }

      if (coverImage) {
        data.append("coverImage", coverImage)
      }

      const res = await fetch("/api/events", {
        method: "POST",
        body: data,
      })

      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal membuat event")
      return json
    },
    onSuccess: () => {
      toast.success("Event berhasil dibuat!")
      // Reset form
      setFormData({
        namaEvent: "", deskripsi: "", tanggalMulai: "", tanggalSelesai: "", lokasi: "",
        feePgTetap: "", feePgPerEvent: "", kuotaPgTetap: 0, kuotaPgPerEvent: 0,
        isOpenRecruitment: false, deadlineRequest: "",
      })
      setCoverImage(null)
      setPreviewUrl(null)
      onSuccess()
    },
    onError: (err: any) => {
      setErrorMsg(err.message)
    }
  })

  // Pastikan URL object di-revoke untuk cegah memory leak
  const handleOpenChange = (v: boolean) => {
    if (!v && previewUrl) URL.revokeObjectURL(previewUrl)
    onOpenChange(v)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    createMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem]">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-black">Buat Event Baru</DialogTitle>
          <DialogDescription className="font-medium">
            Detail event akan digunakan sebagai acuan kerja bagi fotografer.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-xl text-sm font-bold flex items-center gap-2 mb-4">
            <XCircleIcon className="w-5 h-5 flex-shrink-0" /> {errorMsg}
          </div>
        )}

        <form id="create-event-form" onSubmit={handleSubmit} className="space-y-4">
          <Accordion type="single" collapsible defaultValue="item-1" className="w-full space-y-4">
            {/* SECTION 1: INFO DASAR */}
            <AccordionItem value="item-1" className="border border-border rounded-3xl px-6 bg-muted/10 overflow-hidden">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <InfoIcon className="w-4 h-4" />
                  </div>
                  <span className="text-base font-black">Informasi Dasar Event</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6 space-y-6 pt-2">
                {/* Cover Image */}
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Cover Event (Opsional)</Label>
                  <div
                    className="border-2 border-dashed border-border rounded-2xl h-36 flex flex-col items-center justify-center bg-card cursor-pointer overflow-hidden relative hover:bg-muted/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {previewUrl ? (
                      <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                    ) : (
                      <div className="text-center">
                        <UploadCloudIcon className="w-8 h-8 text-accent mx-auto mb-2" />
                        <span className="text-sm font-bold text-muted-foreground">Pilih gambar cover...</span>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="font-bold">Nama Event <span className="text-rose-500">*</span></Label>
                    <Input required placeholder="Misal: Wedding Rina & Doni" className="rounded-xl" value={formData.namaEvent} onChange={e => setFormData(s => ({ ...s, namaEvent: e.target.value }))} />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="font-bold">Lokasi <span className="text-rose-500">*</span></Label>
                    <Input required placeholder="Gedung / Alamat Lengkap" className="rounded-xl" value={formData.lokasi} onChange={e => setFormData(s => ({ ...s, lokasi: e.target.value }))} />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">Waktu Mulai <span className="text-rose-500">*</span></Label>
                    <Input type="datetime-local" required className="rounded-xl" value={formData.tanggalMulai} onChange={e => setFormData(s => ({ ...s, tanggalMulai: e.target.value }))} />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">Waktu Selesai <span className="text-rose-500">*</span></Label>
                    <Input type="datetime-local" required className="rounded-xl" value={formData.tanggalSelesai} onChange={e => setFormData(s => ({ ...s, tanggalSelesai: e.target.value }))} />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="font-bold">Deskripsi Tambahan</Label>
                    <Textarea rows={3} placeholder="Instruksi khusus, dresscode, dll..." className="rounded-xl" value={formData.deskripsi} onChange={e => setFormData(s => ({ ...s, deskripsi: e.target.value }))} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* SECTION 2: PG TETAP */}
            <AccordionItem value="item-2" className="border border-border rounded-3xl px-6 bg-muted/5 overflow-hidden">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 text-foreground">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <UsersIcon className="w-4 h-4" />
                  </div>
                  <span className="text-base font-black">Fotografer Anggota Tetap</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6 space-y-4 pt-2">
                <p className="text-xs text-muted-foreground font-medium">Buka bagian ini jika Anda ingin menugaskan fotografer yang sudah terikat kontrak tetap dengan Anda.</p>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs text-muted-foreground">Fee per Fotografer (Rp)</Label>
                    <Input type="number" min={0} className="rounded-xl" value={formData.feePgTetap} onChange={e => setFormData(s => ({ ...s, feePgTetap: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs text-muted-foreground">Kuota</Label>
                    <Input type="number" min={0} className="rounded-xl" value={formData.kuotaPgTetap} onChange={e => setFormData(s => ({ ...s, kuotaPgTetap: Number(e.target.value) }))} />
                  </div>
                </div>
                {/* Note: In future we can add multi-select assigned PG here */}
                <div className="mt-2 text-[10px] text-muted-foreground/60 font-bold">
                  * Anda bisa langsung menugaskan nama Fotografer spesifik setelah event berhasil dibuat.
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* SECTION 3: OPEN REC */}
            <AccordionItem value="item-3" className="border border-border rounded-3xl px-6 bg-muted/5 overflow-hidden">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 text-foreground">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <span className="text-base font-black">Open Recruitment</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6 space-y-4 pt-2 overflow-auto">
                <p className="text-xs text-muted-foreground font-medium">Aktifkan bagian ini jika Anda butuh tenaga tambahan dari fotografer luar independen.</p>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs text-muted-foreground">Fee per Fotografer (Rp)</Label>
                    <Input type="number" min={0} className="rounded-xl" value={formData.feePgPerEvent} onChange={e => setFormData(s => ({ ...s, feePgPerEvent: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs text-muted-foreground">Kuota Fotografer Open</Label>
                    <Input type="number" min={0} placeholder="3" className="rounded-xl" value={formData.kuotaPgPerEvent} onChange={e => {
                      const val = Number(e.target.value);
                      setFormData(s => ({
                        ...s,
                        kuotaPgPerEvent: val,
                        isOpenRecruitment: val > 0
                      }))
                    }} />
                  </div>
                </div>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${formData.kuotaPgPerEvent > 0
                    ? "grid-rows-[1fr] opacity-100 pt-4 border-t border-border/50"
                    : "grid-rows-[0fr] opacity-0 pt-0 border-transparent"
                    }`}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-2">
                      <Label className="font-bold text-foreground flex items-center gap-2">
                        Deadline Pendaftaran <span className="text-rose-500 font-bold">*</span>
                      </Label>
                      <Input type="datetime-local" className="rounded-xl" value={formData.deadlineRequest} onChange={e => setFormData(s => ({ ...s, deadlineRequest: e.target.value }))} />
                      <p className="text-[10px] text-muted-foreground font-medium">Halaman rekrutmen akan ditutup otomatis setelah melewati waktu ini.</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </form>

        <DialogFooter className="mt-6 border-t border-border pt-6">
          <Button variant="ghost" onClick={() => handleOpenChange(false)} className="rounded-xl font-bold cursor-pointer">Batal</Button>
          <Button type="submit" form="create-event-form" disabled={createMutation.isPending} className="rounded-xl font-bold bg-accent hover:bg-accent/90 text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
            {createMutation.isPending ? "Menyimpan..." : "Simpan Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function XCircleIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
  )
}
