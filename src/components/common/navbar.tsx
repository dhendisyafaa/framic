"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Show, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const [mounted, setMounted] = useState(false)

  // Pastikan komponen hanya merender bagian auth setelah sinkronisasi client-server (mencegah Hydration Error)
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">

        {/* Kiri: Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white font-black text-xl">F</span>
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 hidden sm:block">Framic</span>
          </Link>
        </div>

        {/* Tengah: Navigasi Utama (Pill Style) */}
        <div className="hidden md:flex items-center bg-slate-100/80 backdrop-blur-md p-1.5 rounded-full border border-slate-200/60 shadow-inner">
          <Link
            href="/"
            className="px-6 py-2 text-sm font-bold text-slate-900 bg-white rounded-full shadow-sm"
          >
            Home
          </Link>
          <Link
            href="/photographers"
            className="px-6 py-2 text-sm font-bold text-slate-600 hover:text-primary transition-colors"
          >
            Fotografer
          </Link>
          <Link
            href="/events"
            className="px-6 py-2 text-sm font-bold text-slate-600 hover:text-primary transition-colors"
          >
            Event
          </Link>
          <Link
            href="/mitra"
            className="px-6 py-2 text-sm font-bold text-slate-600 hover:text-primary transition-colors"
          >
            Mitra
          </Link>
        </div>

        {/* Kanan: Auth State */}
        <div className="flex items-center gap-4 min-w-[100px] justify-end">
          {mounted ? (
            <>
              <Show when="signed-out">
                <div className="flex items-center gap-3">
                  <SignInButton mode="modal" fallbackRedirectUrl="/onboarding" signUpFallbackRedirectUrl="/onboarding">
                    <Button variant="ghost" className="rounded-full px-5 h-10 font-bold text-slate-600 hover:text-emerald-600 hover:bg-emerald-50">
                      Masuk
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal" fallbackRedirectUrl="/onboarding" signInFallbackRedirectUrl="/onboarding">
                    <Button 
                      className="rounded-full px-7 h-10 font-black tracking-tight text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0"
                    >
                      Daftar
                    </Button>
                  </SignUpButton>
                </div>
              </Show>

              <Show when="signed-in">
                <Link href="/dashboard" className="text-sm font-black text-slate-600 hover:text-primary transition-colors mr-3 uppercase tracking-tight">
                  Dashboard
                </Link>
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-9 h-9 border-2 border-primary/20 hover:border-primary/50 transition-all shadow-sm"
                    }
                  }}
                />
              </Show>
            </>
          ) : (
            // Skeleton sederhana saat loading agar layout tidak lompat
            <div className="w-24 h-8 bg-slate-100 animate-pulse rounded-full" />
          )}
        </div>

      </div>
    </nav>
  )
}
