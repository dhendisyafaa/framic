"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeftIcon,
  TentIcon,
  MapPinIcon,
  CalendarIcon,
  UsersIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  UserPlusIcon,
  SettingsIcon,
  SaveIcon,
} from "lucide-react"

// Types
interface AssignedPG {
  id: string
  photographerType: "mitra_permanent" | "event_only"
  photographerId: string
  clerkId: string
  nama: string
  invitationStatus: string | null
  initiatedBy: string | null
  isAvailable: boolean
}

interface EventDetail {
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
  feePgTetap: number | null
  feePgPerEvent: number | null
  deadlineRequest: string | null
  mitra: { id: string; namaOrganisasi: string }
  photographers: AssignedPG[]
}

interface MitraPhotographerEntry {
  contractId: string
  photographerId: string
  nama: string
  minimumFeePerEvent: number | null
}

export function EventDetailClient({ eventId, mitraId }: { eventId: string; mitraId: string }) {
  const [activeTab, setActiveTab] = useState<"pg-tetap" | "pg-perevent" | "open-recruitment" | "edit-event">("pg-tetap")

  const { data: response, isLoading } = useQuery({
    queryKey: ["event-detail", eventId],
    queryFn: async () => {
      const res = await fetch(`/api/events/${eventId}?dashboard=true`)
      if (!res.ok) throw new Error("Gagal mengambil detail event")
      return res.json() as Promise<{ success: boolean; data: EventDetail }>
    },
  })

  if (isLoading) return <EventDetailSkeleton />

  const event = response?.data
  if (!event) return <div className="p-8 text-center font-medium">Event tidak ditemukan.</div>

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl animate-in fade-in duration-700">
      <Link href="/mitra/events" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary font-bold text-sm mb-6 group">
        <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Kembali ke Daftar Event
      </Link>

      <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden mb-8">
        <CardContent className="p-0 sm:flex items-stretch">
          <div className="sm:w-64 h-48 sm:h-auto bg-slate-100 relative shrink-0">
            {event.coverImageUrl ? (
              <Image src={event.coverImageUrl} alt={event.namaEvent} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                <TentIcon className="w-12 h-12" />
              </div>
            )}
            <Badge className={`absolute top-4 left-4 border-2 font-black ${event.isPublished ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
              }`}>
              {event.isPublished ? "PUBLISHED" : "DRAFT"}
            </Badge>
          </div>
          <div className="p-6 md:p-8 flex-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-4">{event.namaEvent}</h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-600 font-medium mb-6">
              <span className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-slate-400" /> {format(new Date(event.tanggalMulai), "iiii, dd MMM yyyy HH:mm", { locale: localeId })}</span>
              <span className="flex items-center gap-2"><MapPinIcon className="w-4 h-4 text-slate-400" /> {event.lokasi}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PG Tetap</p>
                <div className="font-bold text-slate-800 text-sm">
                  Fee: <span className="font-black text-indigo-600">Rp {(event.feePgTetap ?? 0).toLocaleString("id-ID")}</span>
                  <span className="text-xs text-slate-400 ml-2">(Kuota {event.kuotaPgTetap})</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PG Per-event</p>
                <div className="font-bold text-slate-800 text-sm">
                  Fee: <span className="font-black text-emerald-600">Rp {(event.feePgPerEvent ?? 0).toLocaleString("id-ID")}</span>
                  <span className="text-xs text-slate-400 ml-2">(Kuota {event.kuotaPgPerEvent})</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap bg-slate-100/50 p-1.5 rounded-2xl w-fit mb-8 border border-slate-200/50">
        <button
          onClick={() => setActiveTab("pg-tetap")}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === "pg-tetap" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
        >
          Tugaskan Photographer Tetap
        </button>
        <button
          onClick={() => setActiveTab("pg-perevent")}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === "pg-perevent" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
        >
          Photographer Per-Event (Invite/Req)
        </button>
        <button
          onClick={() => setActiveTab("open-recruitment")}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === "open-recruitment" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
        >
          Pengaturan Open Recruitment
        </button>
        <button
          onClick={() => setActiveTab("edit-event")}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === "edit-event" ? "bg-white text-rose-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
        >
          <SettingsIcon className="w-4 h-4" />
          Edit Detail Event
        </button>
      </div>

      <div className="min-h-[400px]">
        {activeTab === "pg-tetap" && <PgTetapTab event={event} />}
        {activeTab === "pg-perevent" && <PgPerEventTab event={event} />}
        {activeTab === "open-recruitment" && <OpenRecruitmentTab event={event} />}
        {activeTab === "edit-event" && <EditEventTab event={event} />}
      </div>
    </div>
  )
}

function PgTetapTab({ event }: { event: EventDetail }) {
  const queryClient = useQueryClient()
  const { data: response, isLoading } = useQuery({
    queryKey: ["mitra-photographers-list"],
    queryFn: async () => {
      const res = await fetch("/api/mitra/me/photographers")
      return res.json() as Promise<{ success: boolean; data: MitraPhotographerEntry[] }>
    },
  })

  const [selectedPgId, setSelectedPgId] = useState<string>("")
  const [assignError, setAssignError] = useState<string | null>(null)

  const assignMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/events/${event.id}/assign-photographer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photographerId: selectedPgId }),
      })
      const json = await res.json()
      if (!res.ok) {
        // Explise error mapping if related to min fee
        if (json.error?.includes("fee_pg_tetap")) {
          throw new Error("Pengecekan Minimum Fee Gagal") // the generic, but we replace with explicit inline checking logic before fetching if possible or parse from json. 
        }
        throw new Error(json.error || "Gagal menugaskan PG")
      }
      return json
    },
    onSuccess: () => {
      toast.success("Berhasil menugaskan PG")
      queryClient.invalidateQueries({ queryKey: ["event-detail", event.id] })
      setSelectedPgId("")
      setAssignError(null)
    },
    onError: (err: any) => {
      // Don't toast if we show inline, though showing inline is handled in submit
      setAssignError(err.message)
    }
  })

  // List filter
  const allMems = response?.data || []
  const assignedPgIds = event.photographers.filter(p => p.photographerType === "mitra_permanent").map(p => p.photographerId)

  const availableToAssign = allMems.filter(p => !assignedPgIds.includes(p.photographerId))
  const assignedList = event.photographers.filter(p => p.photographerType === "mitra_permanent")

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault()
    setAssignError(null)
    const selectedPg = availableToAssign.find(p => p.photographerId === selectedPgId)
    if (!selectedPg) return

    if ((event.feePgTetap ?? 0) < (selectedPg.minimumFeePerEvent ?? 0)) {
      setAssignError(`Fee event (Rp ${(event.feePgTetap ?? 0).toLocaleString("id-ID")}) di bawah minimum fee kontrak fotografer ini (Rp ${(selectedPg.minimumFeePerEvent ?? 0).toLocaleString("id-ID")})`)
      return
    }

    assignMutation.mutate()
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* List */}
      <Card className="border-slate-200/60 shadow-md rounded-[2rem]">
        <CardHeader>
          <CardTitle className="text-lg font-black italic">PG Tetap Ditugaskan</CardTitle>
          <CardDescription>
            {assignedList.length} / {event.kuotaPgTetap} Kuota Terisi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {assignedList.length === 0 ? (
              <div className="text-center py-6 text-slate-400 font-medium text-sm">Belum ada PG yang ditugaskan.</div>
            ) : (
              assignedList.map(pg => (
                <div key={pg.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="font-bold text-slate-900 text-sm">{pg.nama}</div>
                  <Badge variant="outline" className={`font-black uppercase text-[10px] px-2 py-0 border-2 ${pg.isAvailable ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-rose-600 border-rose-200 bg-rose-50'}`}>
                    {pg.isAvailable ? "Available" : "Not Available"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card className="border-indigo-100 shadow-md shadow-indigo-100/50 rounded-[2rem] bg-indigo-50/30">
        <CardHeader>
          <CardTitle className="text-lg font-black italic text-indigo-700">Tugaskan Fotografer</CardTitle>
          <CardDescription>Pilih dari anggota tetap Anda yang aktif.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-10 w-full rounded-xl" /> : (
            <form onSubmit={handleAssign} className="space-y-4">
              <div className="space-y-2">
                <Label className="font-bold">Fotografer</Label>
                <Select value={selectedPgId} onValueChange={setSelectedPgId}>
                  <SelectTrigger className="bg-white rounded-xl">
                    <SelectValue placeholder="Pilih fotografer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableToAssign.length === 0 && <SelectItem value="none" disabled>Semua PG sudah ditugaskan</SelectItem>}
                    {availableToAssign.map(pg => (
                      <SelectItem key={pg.photographerId} value={pg.photographerId}>
                        {pg.nama} (Min: Rp{(pg.minimumFeePerEvent ?? 0).toLocaleString("id-ID")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {assignError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-xl text-xs font-bold leading-relaxed flex gap-2 items-start">
                  <XCircleIcon className="w-4 h-4 shrink-0 mt-0.5" /> {assignError}
                </div>
              )}

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl" disabled={!selectedPgId || selectedPgId === 'none' || assignMutation.isPending}>
                {assignMutation.isPending ? "Proses..." : "Tugaskan ke Event"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PgPerEventTab({ event }: { event: EventDetail }) {
  const queryClient = useQueryClient()
  const listEventOnly = event.photographers.filter(p => p.photographerType === "event_only")

  const [inviteUsername, setInviteUsername] = useState("")
  const [inviteMessage, setInviteMessage] = useState("")

  const respondMutation = useMutation({
    mutationFn: async ({ entryId, status }: { entryId: string; status: "accepted" | "rejected" }) => {
      const res = await fetch(`/api/events/${event.id}/photographers/${entryId}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-detail", event.id] })
      toast.success("Respons berhasil disimpan")
    },
    onError: (err: any) => toast.error(err.message)
  })

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/events/${event.id}/invite-photographer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: inviteUsername, invitationMessage: inviteMessage }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-detail", event.id] })
      toast.success("Undangan terkirim!")
      setInviteUsername("")
      setInviteMessage("")
    },
    onError: (err: any) => toast.error(err.message)
  })

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* List Request & Invite */}
      <Card className="border-slate-200/60 shadow-md rounded-[2rem]">
        <CardHeader>
          <CardTitle className="text-lg font-black italic">Request & Undangan Per-Event</CardTitle>
          <CardDescription>Status negosiasi dan MoU PG eksternal.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {listEventOnly.length === 0 ? (
              <div className="text-center py-6 text-slate-400 font-medium text-sm">Tidak ada data.</div>
            ) : (
              listEventOnly.map(pg => (
                <div key={pg.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="font-bold text-slate-900 text-sm mb-1">{pg.nama}</div>
                      <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0 border-2 ${pg.initiatedBy === 'mitra' ? 'text-indigo-600 bg-indigo-50 border-indigo-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200'}`}>
                        {pg.initiatedBy === 'mitra' ? "Diundang Mitra" : "Request Masuk"}
                      </Badge>
                    </div>
                    <Badge variant="outline" className={`font-black uppercase text-[10px] px-2 py-0 border-2 ${pg.invitationStatus === 'accepted' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' :
                        pg.invitationStatus === 'rejected' ? 'text-rose-600 border-rose-200 bg-rose-50' :
                          'text-amber-600 border-amber-200 bg-amber-50'
                      }`}>
                      {pg.invitationStatus}
                    </Badge>
                  </div>

                  {/* Actions */}
                  {pg.invitationStatus === "pending" && pg.initiatedBy === "photographer" && (
                    <div className="flex gap-2 pt-2 border-t border-slate-200">
                      <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={() => respondMutation.mutate({ entryId: pg.id, status: "accepted" })}>Terima</Button>
                      <Button size="sm" variant="outline" className="flex-1 text-rose-600 hover:bg-rose-50 border-rose-200 font-bold" onClick={() => respondMutation.mutate({ entryId: pg.id, status: "rejected" })}>Tolak</Button>
                    </div>
                  )}

                  {pg.invitationStatus === "accepted" && (
                    <div className="pt-2 border-t border-slate-200">
                      <Link href={`/contracts/${pg.id}?type=event`}>
                        <Button size="sm" variant="outline" className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-bold">Lihat Kontrak</Button>
                      </Link>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Invite */}
      <Card className="border-indigo-100 shadow-md shadow-indigo-100/50 rounded-[2rem] bg-indigo-50/30 self-start">
        <CardHeader>
          <CardTitle className="text-lg font-black italic text-indigo-700">Undang PG Langsung</CardTitle>
          <CardDescription>Kirim undangan kontrak per-event. Fee akan otomatis mengacu pada Event Fee.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); inviteMutation.mutate(); }}>
            <div className="space-y-2">
              <Label className="font-bold text-indigo-900">Username Fotografer</Label>
              <Input required placeholder="Misal: @johndoe" className="bg-white rounded-xl border-indigo-200" value={inviteUsername} onChange={e => setInviteUsername(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Pesan (Opsional)</Label>
              <Textarea placeholder="Pesan untuk PG..." className="bg-white rounded-xl" rows={3} value={inviteMessage} onChange={e => setInviteMessage(e.target.value)} />
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl" disabled={!inviteUsername || inviteMutation.isPending}>
              {inviteMutation.isPending ? "Proses..." : "Kirim Undangan"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function OpenRecruitmentTab({ event }: { event: EventDetail }) {
  const queryClient = useQueryClient()

  const [isOpen, setIsOpen] = useState(event.isOpenRecruitment)
  const [deadline, setDeadline] = useState(event.deadlineRequest ? format(new Date(event.deadlineRequest), "yyyy-MM-dd'T'HH:mm") : "")
  const [kuota, setKuota] = useState(event.kuotaPgPerEvent?.toString() || "")
  const [errorMsg, setErrorMsg] = useState("")

  const updateMutation = useMutation({
    mutationFn: async ({ isOp, dl, kt }: { isOp: boolean, dl: string, kt: string }) => {
      const payload = {
        isOpenRecruitment: isOp,
        deadlineRequest: isOp ? new Date(dl).toISOString() : null,
        kuotaPgPerEvent: isOp ? parseInt(kt, 10) : undefined
      }

      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
    },
    onSuccess: () => {
      toast.success("Pengaturan open recruitment diperbarui")
      queryClient.invalidateQueries({ queryKey: ["event-detail", event.id] })
    },
    onError: (err: any) => setErrorMsg(err.message)
  })

  // Derived stats
  const requests = event.photographers.filter(p => p.photographerType === "event_only" && p.initiatedBy === "photographer")
  const pendingCount = requests.filter(r => r.invitationStatus === "pending").length
  const acceptedCount = requests.filter(r => r.invitationStatus === "accepted").length
  const rejectedCount = requests.filter(r => r.invitationStatus === "rejected").length

  const handleToggle = (checked: boolean) => {
    setIsOpen(checked)
    setErrorMsg("")
    // If turning off, we can submit immediately since deadline is ignored
    if (!checked) {
      updateMutation.mutate({ isOp: false, dl: "", kt: "" })
    }
    // If turning on, we wait for user to fill deadline and hit Save.
  }

  const handleSave = () => {
    setErrorMsg("")
    if (isOpen) {
      if (!deadline) {
        setErrorMsg("Deadline wajib diisi.")
        return
      }
      if (!kuota || isNaN(parseInt(kuota, 10))) {
        setErrorMsg("Kuota fotografer wajib diisi.")
        return
      }
      if (new Date(deadline) >= new Date(event.tanggalMulai)) {
        setErrorMsg("Deadline harus sebelum tanggal mulai event.")
        return
      }
    }
    updateMutation.mutate({ isOp: isOpen, dl: deadline, kt: kuota })
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card className="border-slate-200/60 shadow-md rounded-[2rem]">
        <CardHeader>
          <CardTitle className="text-lg font-black italic">Pengaturan Lowongan Publik</CardTitle>
          <CardDescription>Izinkan PG independen mengajukan diri ke event ini.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <span className="font-bold text-slate-800">Status Open Recruitment</span>
            <Switch checked={isOpen} onCheckedChange={handleToggle} />
          </div>

          {isOpen && (
            <div className="space-y-4 p-4 border border-indigo-100 bg-indigo-50/30 rounded-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-indigo-900">Batas Waktu Request</Label>
                  <Input type="datetime-local" className="bg-white rounded-xl border-indigo-200" value={deadline} onChange={e => setDeadline(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-indigo-900">Kuota PG Per-Event</Label>
                  <Input type="number" min="0" className="bg-white rounded-xl border-indigo-200" value={kuota} onChange={e => setKuota(e.target.value)} placeholder="Misal: 3" />
                </div>
              </div>
              {errorMsg && <p className="text-xs font-bold text-rose-500">{errorMsg}</p>}
              <Button onClick={handleSave} className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Menyimpan..." : "Simpan Pengaturan"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-emerald-100 shadow-md rounded-[2rem] bg-emerald-50/30">
        <CardHeader>
          <CardTitle className="text-lg font-black italic text-emerald-800">Statistik Request Masuk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl text-center border border-emerald-100">
              <div className="text-[10px] font-black uppercase text-amber-500 mb-1">Pending</div>
              <div className="text-3xl font-black text-slate-900">{pendingCount}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl text-center border border-emerald-100">
              <div className="text-[10px] font-black uppercase text-emerald-500 mb-1">Diterima</div>
              <div className="text-3xl font-black text-slate-900">{acceptedCount}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl text-center border border-emerald-100">
              <div className="text-[10px] font-black uppercase text-rose-500 mb-1">Ditolak</div>
              <div className="text-3xl font-black text-slate-900">{rejectedCount}</div>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium text-center mt-6">
            Kelola request yang masuk melalui tab <strong>PG Per-Event</strong>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function EditEventTab({ event }: { event: EventDetail }) {
  const queryClient = useQueryClient()
  const [nama, setNama] = useState(event.namaEvent)
  const [lokasi, setLokasi] = useState(event.lokasi)
  const [deskripsi, setDeskripsi] = useState(event.deskripsi || "")
  const [tanggalMulai, setTanggalMulai] = useState(format(new Date(event.tanggalMulai), "yyyy-MM-dd'T'HH:mm"))
  const [tanggalSelesai, setTanggalSelesai] = useState(event.tanggalSelesai ? format(new Date(event.tanggalSelesai), "yyyy-MM-dd'T'HH:mm") : "")
  const [feeTetap, setFeeTetap] = useState(event.feePgTetap?.toString() || "")
  const [feeEvent, setFeeEvent] = useState(event.feePgPerEvent?.toString() || "")
  const [errorMsg, setErrorMsg] = useState("")

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
    },
    onSuccess: () => {
      toast.success("Detail event berhasil diperbarui")
      queryClient.invalidateQueries({ queryKey: ["event-detail", event.id] })
    },
    onError: (err: any) => setErrorMsg(err.message)
  })

  const handleSave = () => {
    setErrorMsg("")
    if (!nama || !lokasi || !tanggalMulai) {
      setErrorMsg("Nama, Lokasi, dan Tanggal Mulai wajib diisi.")
      return
    }

    updateMutation.mutate({
      namaEvent: nama,
      lokasi,
      deskripsi,
      tanggalMulai: new Date(tanggalMulai).toISOString(),
      tanggalSelesai: tanggalSelesai ? new Date(tanggalSelesai).toISOString() : null,
      feePgTetap: parseInt(feeTetap, 10) || 0,
      feePgPerEvent: parseInt(feeEvent, 10) || 0,
    })
  }

  return (
    <Card className="border-slate-200 shadow-xl rounded-[2.5rem] overflow-hidden">
      <CardHeader className="bg-slate-50 border-b p-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-rose-500 border border-rose-100">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Edit Informasi Dasar</CardTitle>
            <CardDescription className="font-semibold text-slate-500">Perbarui data utama event Anda.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="font-black text-slate-700 text-xs uppercase tracking-widest">Nama Event</Label>
              <Input className="rounded-xl border-slate-200 h-11 font-bold" value={nama} onChange={e => setNama(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="font-black text-slate-700 text-xs uppercase tracking-widest">Lokasi</Label>
              <Input className="rounded-xl border-slate-200 h-11 font-bold" value={lokasi} onChange={e => setLokasi(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="font-black text-slate-700 text-xs uppercase tracking-widest">Deskripsi</Label>
              <Textarea className="rounded-xl border-slate-200 min-h-[140px] font-medium leading-relaxed" value={deskripsi} onChange={e => setDeskripsi(e.target.value)} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-black text-slate-700 text-xs uppercase tracking-widest">Tanggal Mulai</Label>
                <Input type="datetime-local" className="rounded-xl border-slate-200 h-11 font-bold" value={tanggalMulai} onChange={e => setTanggalMulai(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="font-black text-slate-700 text-xs uppercase tracking-widest">Tanggal Selesai</Label>
                <Input type="datetime-local" className="rounded-xl border-slate-200 h-11 font-bold" value={tanggalSelesai} onChange={e => setTanggalSelesai(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-dashed">
              <div className="space-y-2">
                <Label className="font-black text-indigo-700 text-xs uppercase tracking-widest">Fee PG Tetap (Rp)</Label>
                <Input type="number" className="rounded-xl border-indigo-100 bg-indigo-50/10 h-11 font-black text-indigo-600" value={feeTetap} onChange={e => setFeeTetap(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="font-black text-emerald-700 text-xs uppercase tracking-widest">Fee PG Per-Event (Rp)</Label>
                <Input type="number" className="rounded-xl border-emerald-100 bg-emerald-50/10 h-11 font-black text-emerald-600" value={feeEvent} onChange={e => setFeeEvent(e.target.value)} />
              </div>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 items-start mt-4">
              <ClockIcon className="w-5 h-4 text-amber-500 mt-0.5" />
              <p className="text-xs font-bold text-amber-700 leading-relaxed">
                Menyunting tanggal event mungkin akan mempengaruhi filter ketersediaan fotografer. Pastikan Anda sudah berkoordinasi jika ada perubahan jadwal mendadak.
              </p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-black flex items-center gap-2">
            <XCircleIcon className="w-4 h-4" />
            {errorMsg}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button 
            onClick={handleSave} 
            className="rounded-2xl h-14 px-10 bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all font-black text-base flex gap-3"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Menyimpan..." : (
              <>
                <SaveIcon className="w-5 h-5" />
                Simpan Perubahan Event
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function EventDetailSkeleton() {
  return (
    <div className="container mx-auto p-4 md:p-8 animate-pulse space-y-8">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-64 rounded-3xl" />
      <Skeleton className="h-12 w-96 rounded-2xl" />
      <div className="grid md:grid-cols-2 gap-8 mt-8">
        <Skeleton className="h-72 rounded-[2rem]" />
        <Skeleton className="h-72 rounded-[2rem]" />
      </div>
    </div>
  )
}
