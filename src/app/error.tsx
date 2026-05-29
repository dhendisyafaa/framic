"use client"

// src/app/error.tsx
// Halaman penanganan error (Error Boundary) root terpusat untuk aplikasi Framic
// Terintegrasi dengan Sentry untuk pelaporan error otomatis di production.

import { useEffect } from "react"
import Link from "next/link"
import * as Sentry from "@sentry/nextjs"
import { AlertCircle, RotateCcw, Home } from "lucide-react"

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Kirim laporan error ke Sentry
    Sentry.captureException(error)
    console.error("Root Error Boundary caught:", error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F3F0EE] dark:bg-[#141413] text-[#141413] dark:text-[#F3F0EE] transition-colors duration-200">
      <div className="max-w-md w-full text-center space-y-8 bg-[#FCFBFA] dark:bg-[#1A1A19] border border-[#D1CDC7] dark:border-[#2D2B29] rounded-[24px] p-8 shadow-sm">
        
        {/* Icon & Brand Indicator */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center text-[#F37338] animate-pulse">
            <AlertCircle size={36} />
          </div>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-[#F37338]">f</span>ramic
          </span>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Ups, Terjadi Kesalahan!</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Aplikasi mengalami masalah saat memproses permintaan Anda. Error ini telah otomatis dilaporkan untuk segera kami perbaiki.
          </p>
          {error.digest && (
            <div className="mt-2 text-xs font-mono bg-neutral-100 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-500 py-1.5 px-3 rounded-lg inline-block">
              ID: {error.digest}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#F37338] hover:bg-[#F37338]/90 text-white font-semibold text-sm transition-all shadow-sm active:scale-95"
          >
            <RotateCcw size={16} />
            Coba Lagi
          </button>
          
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#141413] hover:bg-[#141413]/90 dark:bg-[#F3F0EE] dark:hover:bg-[#F3F0EE]/90 text-white dark:text-[#141413] font-semibold text-sm transition-all active:scale-95"
          >
            <Home size={16} />
            Ke Beranda
          </Link>
        </div>

      </div>
    </div>
  )
}
