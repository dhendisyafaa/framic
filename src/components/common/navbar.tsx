"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Show, UserButton, SignInButton } from "@clerk/nextjs"
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
              <span className="text-white font-black text-xl italic">F</span>
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
            href="/about" 
            className="px-6 py-2 text-sm font-bold text-slate-600 hover:text-primary transition-colors"
          >
            Tentang
          </Link>
        </div>
        
        {/* Kanan: Auth State */}
        <div className="flex items-center gap-4 min-w-[100px] justify-end">
          {mounted ? (
            <>
              <Show when="signed-out">
                <SignInButton mode="modal" fallbackRedirectUrl="/onboarding" signUpFallbackRedirectUrl="/onboarding">
                  <Button variant="default" size="sm" className="rounded-full px-6 font-bold">
                    Masuk / Daftar
                  </Button>
                </SignInButton>
              </Show>
              
              <Show when="signed-in">
                <Link href="/dashboard" className="text-sm font-black text-slate-600 hover:text-primary transition-colors mr-3 uppercase tracking-tight italic">
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
