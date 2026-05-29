"use client"

// src/app/(dashboard)/dashboard/error.tsx
// Halaman penanganan error (Error Boundary) khusus untuk dashboard Framic
// Menjaga agar error di bagian konten dashboard tidak merusak navigasi luar/sidebar.

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Kirim laporan ke Sentry
    Sentry.captureException(error)
    console.error("Dashboard Error Boundary caught:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="max-w-md space-y-6 bg-card border border-border rounded-3xl p-8 shadow-sm">
        
        {/* Icon */}
        <div className="mx-auto w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/20 flex items-center justify-center text-primary">
          <AlertTriangle size={24} />
        </div>

        {/* Info */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Gagal Memuat Konten</h2>
          <p className="text-sm text-muted-foreground">
            Terjadi masalah saat memuat halaman dashboard ini. Harap coba beberapa saat lagi atau klik tombol di bawah untuk memuat ulang segmen ini.
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-muted-foreground/60">
              Error Digest: {error.digest}
            </p>
          )}
        </div>

        {/* Action */}
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:bg-primary/95 active:scale-95 shadow-sm cursor-pointer"
        >
          <RefreshCw size={14} className="animate-spin-hover" />
          Muat Ulang
        </button>

      </div>
    </div>
  )
}
