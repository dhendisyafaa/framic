"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Show, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/common/mode-toggle"

export function Navbar() {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  // Pastikan komponen hanya merender bagian auth setelah sinkronisasi client-server (mencegah Hydration Error)
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="sticky top-0 z-50 w-full flex justify-center px-4 py-4 md:py-6">
      <nav className="w-full max-w-6xl rounded-full border border-muted/60 bg-white/80 dark:bg-[#20201F]/80 backdrop-blur-md shadow-[rgba(0,0,0,0.04)_0px_4px_24px_0px] transition-all relative">
        <div className="flex h-14 items-center justify-between px-6 md:px-8">

          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative w-8 h-5 flex items-center transition-transform group-hover:scale-105">
                <div className="w-4 h-4 rounded-full bg-[#141413] dark:bg-[#FCFBFA]" />
                <div className="w-4 h-4 rounded-full bg-[#FF5F00] -ml-2.5 mix-blend-multiply dark:mix-blend-screen opacity-90" />
              </div>
              <span className="text-base font-bold tracking-tight text-foreground hidden sm:block">Framic</span>
            </Link>
          </div>

          {/* Tengah: Navigasi Utama (Pill Style) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center bg-muted/40 p-1 rounded-full border border-muted/20">
            <Link
              href="/"
              className={`px-5 py-1.5 text-xs font-bold rounded-full transition-all ${
                pathname === "/" 
                  ? "bg-white dark:bg-[#141413] text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Home
            </Link>
            <Link
              href="/photographers"
              className={`px-5 py-1.5 text-xs font-bold rounded-full transition-all ${
                pathname.startsWith("/photographers") 
                  ? "bg-white dark:bg-[#141413] text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Fotografer
            </Link>
            <Link
              href="/events"
              className={`px-5 py-1.5 text-xs font-bold rounded-full transition-all ${
                pathname.startsWith("/events") 
                  ? "bg-white dark:bg-[#141413] text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Event
            </Link>
            <Link
              href="/mitra"
              className={`px-5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                pathname === "/mitra" 
                  ? "bg-white dark:bg-[#141413] text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mitra
            </Link>
          </div>

          {/* Kanan: Auth State */}
          <div className="flex items-center gap-3 md:gap-4 justify-end">
            <ModeToggle />
            {mounted ? (
              <>
                <Show when="signed-out">
                  <div className="flex items-center gap-2">
                    <SignInButton mode="modal" fallbackRedirectUrl="/onboarding" signUpFallbackRedirectUrl="/onboarding">
                      <Button variant="ghost" className="rounded-full px-4 h-9 font-bold text-xs hover:bg-muted/50 text-foreground transition-all cursor-pointer">
                        Masuk
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal" fallbackRedirectUrl="/onboarding" signInFallbackRedirectUrl="/onboarding">
                      <Button 
                        className="rounded-full px-5 h-9 font-bold tracking-tight text-xs bg-primary hover:bg-primary/95 text-primary-foreground shadow-md transition-all cursor-pointer"
                      >
                        Daftar
                      </Button>
                    </SignUpButton>
                  </div>
                </Show>

                <Show when="signed-in">
                  <Link 
                    href="/dashboard" 
                    className={`text-xs font-bold transition-all mr-2 uppercase tracking-wide cursor-pointer ${
                      pathname.startsWith("/dashboard") || 
                      pathname.startsWith("/admin") || 
                      pathname.startsWith("/orders") ||
                      (pathname.startsWith("/mitra") && pathname !== "/mitra")
                        ? "text-[#FF5F00] font-black underline underline-offset-4 decoration-2 decoration-[#FF5F00]" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Dashboard
                  </Link>
                  <UserButton
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "w-8 h-8 border-2 border-primary/10 hover:border-primary/30 transition-all shadow-sm"
                      }
                    }}
                  />
                </Show>
              </>
            ) : (
              // Skeleton sederhana saat loading agar layout tidak lompat
              <div className="w-20 h-8 bg-muted animate-pulse rounded-full" />
            )}
          </div>

        </div>
      </nav>
    </div>
  )
}

