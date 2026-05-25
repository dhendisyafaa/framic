"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BuildingIcon,
  CameraIcon,
  CalendarIcon,
  PercentIcon,
  WalletIcon,
  MapPinIcon,
} from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

// ---------------------------------------------------------------------------
// Types — union type yang strict, tidak ada any
// ---------------------------------------------------------------------------

export interface MitraContractData {
  contractId: string
  type: "mitra"
  invitationStatus: string
  contractStatus: string | null
  initiatedBy: string
  mitra: { id: string; namaOrganisasi: string }
  photographer: { id: string; nama: string }
  mitraPercent: number | null
  photographerPercent: number | null
  minimumFeePerEvent: number | null
  tanggalMulai: string | null
  tanggalSelesai: string | null
  photographerSignedAt: string | null
  mitraSignedAt: string | null
  bothSigned: boolean
  mitraClerkId: string
  photographerClerkId: string
}

export interface EventContractData {
  contractId: string
  type: "event"
  invitationStatus: string
  initiatedBy: string
  event: {
    id: string
    namaEvent: string
    tanggalMulai: string
    tanggalSelesai: string
    lokasi: string
  }
  mitra: { id: string; namaOrganisasi: string }
  photographer: { id: string; nama: string }
  mitraPercent: number | null
  photographerPercent: number | null
  feeAmount: number | null
  photographerSignedAt: string | null
  mitraSignedAt: string | null
  bothSigned: boolean
  mitraClerkId: string
  photographerClerkId: string
}

export type ContractData = MitraContractData | EventContractData

interface ContractReviewCardProps {
  type: "mitra" | "event"
  data: ContractData
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  return format(new Date(dateStr), "d MMMM yyyy", { locale: localeId })
}

function getInvitationBadgeStyle(status: string): string {
  switch (status) {
    case "pending": return "text-amber-600 border-amber-300 bg-amber-50"
    case "accepted": return "text-blue-600 border-blue-200 bg-blue-50"
    case "rejected": return "text-rose-600 border-rose-300 bg-rose-50"
    default: return "text-muted-foreground border-border bg-muted"
  }
}

function getContractStatusBadgeStyle(status: string | null): string {
  switch (status) {
    case "active": return "text-blue-600 border-blue-200 bg-blue-50"
    case "pending_expiry": return "text-amber-600 border-amber-300 bg-amber-50"
    case "expired": return "text-muted-foreground border-border bg-muted"
    case "terminated": return "text-rose-600 border-rose-300 bg-rose-50"
    default: return "text-muted-foreground border-border bg-muted"
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContractReviewCard({ type, data }: ContractReviewCardProps) {
  return (
    <div className="space-y-6">
      {/* Header: Status Badges */}
      <div className="flex flex-wrap gap-3">
        <Badge
          variant="outline"
          className={`rounded-full px-4 py-1 font-bold text-xs uppercase tracking-widest border-2 ${getInvitationBadgeStyle(data.invitationStatus)}`}
        >
          Invitation: {data.invitationStatus}
        </Badge>

        {type === "mitra" && (data as MitraContractData).contractStatus && (
          <Badge
            variant="outline"
            className={`rounded-full px-4 py-1 font-bold text-xs uppercase tracking-widest border-2 ${getContractStatusBadgeStyle((data as MitraContractData).contractStatus)}`}
          >
            Kontrak: {(data as MitraContractData).contractStatus ?? "—"}
          </Badge>
        )}

        <Badge
          variant="outline"
          className="rounded-full px-4 py-1 font-bold text-xs uppercase tracking-widest border-2 text-muted-foreground border-border bg-muted"
        >
          Inisiator: {data.initiatedBy}
        </Badge>
      </div>

      {/* Section: Pihak-pihak */}
      <Card className="border-border/60 bg-card rounded-3xl shadow-sm">
        <CardHeader className="p-6 pb-0">
          <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest">
            Pihak yang Terlibat
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
              <BuildingIcon className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Mitra / Organisasi</div>
                <div className="font-black text-foreground">{data.mitra.namaOrganisasi}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-violet-50/60 border border-violet-100">
              <CameraIcon className="w-5 h-5 text-violet-500 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Fotografer</div>
                <div className="font-black text-foreground">{data.photographer.nama}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section: Detail Event (hanya untuk type=event) */}
      {type === "event" && (
        <Card className="border-border/60 bg-card rounded-3xl shadow-sm">
          <CardHeader className="p-6 pb-0">
            <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest">
              Detail Event
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-4 space-y-3">
            <div className="font-black text-foreground text-xl">
              {(data as EventContractData).event.namaEvent}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-medium text-sm">
                {formatDate((data as EventContractData).event.tanggalMulai)} —{" "}
                {formatDate((data as EventContractData).event.tanggalSelesai)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPinIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-medium text-sm">{(data as EventContractData).event.lokasi}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section: Terms / Ketentuan */}
      <Card className="border-border/60 bg-card rounded-3xl shadow-sm">
        <CardHeader className="p-6 pb-0">
          <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest">
            Ketentuan Kontrak (Read-Only)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-4">
          <div className="space-y-4">
            {/* Bagi hasil */}
            {(data.mitraPercent !== null || data.photographerPercent !== null) && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted border border-border/60 bg-card">
                <PercentIcon className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="w-full">
                  <div className="text-xs font-bold text-muted-foreground uppercase mb-3">Bagi Hasil</div>
                  <div className="flex gap-4">
                    <div className="flex-1 text-center py-3 bg-white rounded-xl border border-indigo-100">
                      <div className="text-2xl font-black text-indigo-600">
                        {data.mitraPercent ?? "—"}%
                      </div>
                      <div className="text-xs font-bold text-muted-foreground uppercase mt-1">Mitra</div>
                    </div>
                    <div className="flex-1 text-center py-3 bg-white rounded-xl border border-violet-100">
                      <div className="text-2xl font-black text-violet-600">
                        {data.photographerPercent ?? "—"}%
                      </div>
                      <div className="text-xs font-bold text-muted-foreground uppercase mt-1">Fotografer</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Minimum fee (hanya mitra) */}
            {type === "mitra" && (data as MitraContractData).minimumFeePerEvent !== null && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted border border-border/60 bg-card">
                <WalletIcon className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Minimum Fee per Event</div>
                  <div className="font-black text-foreground text-lg">
                    Rp {((data as MitraContractData).minimumFeePerEvent ?? 0).toLocaleString("id-ID")}
                  </div>
                </div>
              </div>
            )}

            {/* Fee Amount (hanya event) */}
            {type === "event" && (data as EventContractData).feeAmount !== null && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted border border-border/60 bg-card">
                <WalletIcon className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Fee per Event</div>
                  <div className="font-black text-foreground text-lg">
                    Rp {((data as EventContractData).feeAmount ?? 0).toLocaleString("id-ID")}
                  </div>
                </div>
              </div>
            )}

            {/* Durasi kontrak (hanya mitra) */}
            {type === "mitra" && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted border border-border/60 bg-card">
                <CalendarIcon className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Durasi Kontrak</div>
                  <div className="font-bold text-slate-900">
                    {formatDate((data as MitraContractData).tanggalMulai)} —{" "}
                    {formatDate((data as MitraContractData).tanggalSelesai)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
