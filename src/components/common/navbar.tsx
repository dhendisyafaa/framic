"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Show, UserButton, SignInButton, SignUpButton, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/common/mode-toggle"
import { Menu, X, Home, Camera, Calendar, Building, LayoutDashboard, ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const [mounted, setMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, isLoaded } = useUser()

  // Pastikan komponen hanya merender bagian auth setelah sinkronisasi client-server (mencegah Hydration Error)
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="sticky top-0 z-50 w-full flex justify-center px-4 py-4 md:py-6">
      <nav className={cn(
        "w-full max-w-6xl border border-muted/60 bg-white/80 dark:bg-[#20201F]/80 backdrop-blur-md shadow-[rgba(0,0,0,0.04)_0px_4px_24px_0px] transition-all duration-300 relative",
        isMobileMenuOpen ? "rounded-3xl" : "rounded-full"
      )}>
        <div className="flex h-14 items-center justify-between px-6 md:px-8">

          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="relative w-8 h-5 flex items-center transition-transform group-hover:scale-105">
                <div className="w-4 h-4 rounded-full bg-[#141413] dark:bg-[#FCFBFA]" />
                <div className="w-4 h-4 rounded-full bg-[#FF5F00] -ml-2.5 mix-blend-multiply dark:mix-blend-screen opacity-90" />
              </div>
              <span className="text-base font-bold tracking-tight text-foreground hidden sm:block">Framic</span>
            </Link>
          </div>

          {/* Tengah: Navigasi Utama (Desktop) */}
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

          {/* Kanan: Auth State (Desktop) */}
          <div className="hidden md:flex items-center gap-3 md:gap-4 justify-end">
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
              <div className="w-20 h-8 bg-muted animate-pulse rounded-full" />
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-full hover:bg-muted/50 text-foreground transition-colors focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Accordion Menu */}
        <div 
          className={cn(
            "md:hidden transition-all duration-300 ease-in-out border-t border-muted/40",
            isMobileMenuOpen ? "max-h-[600px] opacity-100 py-4" : "max-h-0 opacity-0 py-0 border-transparent overflow-hidden"
          )}
        >
          <div className="px-6 flex flex-col gap-4">
            {/* Nav Links */}
            <nav className="flex flex-col gap-1.5">
              {[
                { label: "Home", icon: Home, href: "/" },
                { label: "Fotografer", icon: Camera, href: "/photographers" },
                { label: "Event", icon: Calendar, href: "/events" },
                { label: "Mitra", icon: Building, href: "/mitra" },
              ].map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                return (
                  <Link href={item.href} key={item.label} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 h-10",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <item.icon className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </nav>

            <div className="h-px bg-muted/40 w-full" />

            {/* Profile & Auth Section */}
            {mounted && (
              <div className="flex flex-col gap-3">
                <Show when="signed-in">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-muted/20">
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-1 -m-1 rounded-lg transition-colors"
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (!target.closest('.cl-userButtonTrigger')) {
                          const btn = e.currentTarget.querySelector('.cl-userButtonTrigger') as HTMLButtonElement;
                          if (btn) btn.click();
                        }
                      }}
                    >
                      <UserButton 
                        appearance={{
                          elements: {
                            userButtonAvatarBox: "w-8 h-8 border-2 border-primary/10 transition-all shadow-sm pointer-events-none"
                          }
                        }}
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground truncate max-w-[150px]">
                          {isLoaded && user ? user.fullName || user.username || "Pengguna" : "Memuat..."}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Kelola Akun</span>
                      </div>
                    </div>
                    <ModeToggle />
                  </div>
                  
                  <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full justify-start gap-3 px-4 py-2.5 rounded-xl text-xs font-bold h-10 bg-accent hover:bg-accent/90 text-accent-foreground border-none shadow-sm cursor-pointer group">
                      <LayoutDashboard className="w-4 h-4" />
                      Akses Dashboard
                      <ChevronRightIcon className="w-3.5 h-3.5 ml-auto opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </Button>
                  </Link>
                </Show>

                <Show when="signed-out">
                  <div className="flex items-center justify-between p-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Akses Akun</span>
                    <ModeToggle />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <SignInButton mode="modal" fallbackRedirectUrl="/onboarding" signUpFallbackRedirectUrl="/onboarding">
                      <Button variant="outline" className="w-full rounded-xl h-10 font-bold text-xs">
                        Masuk
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal" fallbackRedirectUrl="/onboarding" signInFallbackRedirectUrl="/onboarding">
                      <Button className="w-full rounded-xl h-10 font-bold text-xs bg-primary hover:bg-primary/95 text-primary-foreground shadow-md">
                        Daftar
                      </Button>
                    </SignUpButton>
                  </div>
                </Show>
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  )
}

