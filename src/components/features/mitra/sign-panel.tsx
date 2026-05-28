"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2Icon, ClockIcon, PenLineIcon, AlertCircleIcon } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SignPanelProps {
  contractId: string
  type: "mitra" | "event"
  currentUserId: string
  mitraClerkId: string
  photographerClerkId: string
  photographerSignedAt: string | null
  mitraSignedAt: string | null
  bothSigned: boolean
  invitationStatus: string
  photographerNama: string
  mitraName: string
}

interface SignApiResponse {
  success: boolean
  data?: {
    signedAt: string
    bothSigned: boolean
    contractStatus: string | null
    message: string
  }
  error?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function SignPanel({
  contractId,
  type,
  currentUserId,
  mitraClerkId,
  photographerClerkId,
  photographerSignedAt,
  mitraSignedAt,
  bothSigned,
  invitationStatus,
  photographerNama,
  mitraName,
}: SignPanelProps) {
  const queryClient = useQueryClient()
  const [isChecked, setIsChecked] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const isMitraUser = currentUserId === mitraClerkId
  const isPhotographerUser = currentUserId === photographerClerkId

  const alreadySigned =
    (isPhotographerUser && !!photographerSignedAt) ||
    (isMitraUser && !!mitraSignedAt)

  const signMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/contracts/${contractId}/sign?type=${type}`, {
        method: "POST",
      })
      const json: SignApiResponse = await res.json()
      if (!json.success) throw new Error(json.error ?? "Gagal menandatangani kontrak")
      return json.data!
    },
    onSuccess: (data) => {
      setSuccessMessage(data.message)
      queryClient.invalidateQueries({ queryKey: ["contract-detail", contractId, type] })
    },
  })

  const formatSignDate = (dateStr: string | null): string => {
    if (!dateStr) return ""
    return format(new Date(dateStr), "d MMMM yyyy, HH:mm", { locale: localeId })
  }

  const canSign =
    (isMitraUser || isPhotographerUser) &&
    invitationStatus === "accepted" &&
    !alreadySigned &&
    !bothSigned

  return (
    <Card className="border-border/60 bg-card rounded-3xl shadow-sm">
      <CardHeader className="p-6 pb-0">
        <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <PenLineIcon className="w-4 h-4" />
          Status Tanda Tangan
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-4 space-y-5">
        {/* Status sign kedua pihak */}
        <div className="space-y-3">
          {/* Fotografer */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted border border-border/60 bg-card">
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase">Fotografer</div>
              <div className="font-black text-foreground">{photographerNama}</div>
              {photographerSignedAt && (
                <div className="text-xs text-blue-500 font-medium mt-1">
                  ✓ {formatSignDate(photographerSignedAt)}
                </div>
              )}
            </div>
            {photographerSignedAt ? (
              <CheckCircle2Icon className="w-7 h-7 text-blue-500 shrink-0" />
            ) : (
              <ClockIcon className="w-7 h-7 text-muted-foreground/30 shrink-0" />
            )}
          </div>

          {/* Mitra */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted border border-border/60 bg-card">
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase">Mitra</div>
              <div className="font-black text-foreground">{mitraName}</div>
              {mitraSignedAt && (
                <div className="text-xs text-blue-500 font-medium mt-1">
                  ✓ {formatSignDate(mitraSignedAt)}
                </div>
              )}
            </div>
            {mitraSignedAt ? (
              <CheckCircle2Icon className="w-7 h-7 text-blue-500 shrink-0" />
            ) : (
              <ClockIcon className="w-7 h-7 text-muted-foreground/30 shrink-0" />
            )}
          </div>
        </div>

        {/* Banner: kedua pihak sudah sign */}
        {bothSigned && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-500/10 border-2 border-blue-500/20">
            <CheckCircle2Icon className="w-6 h-6 text-blue-500 shrink-0" />
            <div>
              <div className="font-black text-blue-500">Kontrak Aktif</div>
              <div className="text-sm text-blue-500 font-medium">
                Kedua pihak telah menandatangani kontrak ini.
              </div>
            </div>
          </div>
        )}

        {/* Sukses pesan setelah sign */}
        {successMessage && !bothSigned && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <CheckCircle2Icon className="w-5 h-5 text-blue-500 shrink-0" />
            <p className="text-sm font-medium text-blue-500">{successMessage}</p>
          </div>
        )}

        {/* Info: invitation harus accepted */}
        {invitationStatus !== "accepted" && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <AlertCircleIcon className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-sm font-medium text-amber-500">
              Kontrak baru bisa ditandatangani setelah kedua pihak menyetujui terms (invitation_status = accepted).
            </p>
          </div>
        )}

        {/* Tombol sign — hanya tampil jika user belum sign */}
        {canSign && (
          <div className="space-y-4 pt-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="mt-0.5 h-5 w-5 rounded border-border accent-primary shrink-0"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
              />
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                Saya telah membaca dan menyetujui semua ketentuan dalam kontrak ini
              </span>
            </label>

            <Button
              className="w-full rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-base shadow-lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!isChecked || signMutation.isPending}
              onClick={() => signMutation.mutate()}
            >
              <PenLineIcon className="mr-2 w-5 h-5" />
              {signMutation.isPending ? "Menyimpan..." : "Tandatangani Kontrak"}
            </Button>

            {signMutation.isError && (
              <p className="text-sm text-rose-500 font-bold text-center">
                {(signMutation.error as Error).message}
              </p>
            )}
          </div>
        )}

        {/* Sudah sign */}
        {alreadySigned && !bothSigned && (
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
            <CheckCircle2Icon className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-blue-500">
              Anda sudah menandatangani. Menunggu pihak lain.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
