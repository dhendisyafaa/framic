"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Camera, Compass, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground relative overflow-hidden px-6 py-12">
      {/* Background Decorative Constellations & Orbits */}
      <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10 z-0 flex items-center justify-center">
        <svg className="w-[80%] max-w-4xl aspect-square" viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="500" cy="500" r="400" stroke="currentColor" strokeWidth="1" strokeDasharray="6 12" className="animate-[spin_120s_linear_infinite]" />
          <circle cx="500" cy="500" r="280" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 8" className="animate-[spin_80s_linear_infinite_reverse]" />
          <circle cx="500" cy="500" r="160" stroke="currentColor" strokeWidth="1" strokeDasharray="3 6" />
        </svg>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Animated Focus Lens (Visual 404 Concept) */}
        <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full flex items-center justify-center border-4 border-dashed border-accent/40 bg-card/40 backdrop-blur-md p-6 group">
          {/* Outer Rotating Rim */}
          <div className="absolute inset-0 rounded-full border-2 border-border/40 scale-105" />
          
          {/* Interactive Aperture Blades Simulation */}
          <div className="absolute inset-4 rounded-full border border-accent/20 bg-background/60 flex items-center justify-center overflow-hidden transition-all duration-700 group-hover:scale-95">
            {/* The Lens / Camera Icon */}
            <Camera className="w-12 h-12 text-accent/80 transition-all duration-1000 group-hover:rotate-45" />
            
            {/* Blurry autofocus pulse effect */}
            <div className="absolute inset-0 bg-accent/5 animate-[pulse_3s_infinite_ease-in-out]" />
          </div>

          {/* Large Glow 404 Indicator */}
          <span className="absolute -top-4 -right-4 bg-primary text-primary-foreground font-black text-sm px-3.5 py-1.5 rounded-full shadow-md select-none tracking-wider">
            404
          </span>
        </div>

        {/* Text Copy */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-accent">
              OUT OF FOCUS
            </span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-foreground leading-tight">
            Frame Ini Tidak Fokus.
          </h1>
          
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-medium max-w-md mx-auto">
            Halaman yang Anda cari telah dipindahkan, dihapus, atau tidak pernah ada. Mari temukan perspektif yang lebih baik.
          </p>
        </div>

        {/* Buttons / CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full pt-4">
          <Link href="/" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto h-12 px-8 rounded-full font-bold shadow-md bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Beranda
            </Button>
          </Link>
          <Link href="/photographers" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 rounded-full font-bold border-border/60 hover:bg-muted/40 flex items-center gap-2">
              <Compass className="w-4 h-4" />
              Eksplorasi Galeri
            </Button>
          </Link>
        </div>
      </div>

      {/* Decorative footer details */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.15em] pointer-events-none">
        Framic &copy; {new Date().getFullYear()} — Captured with Intention
      </div>
    </div>
  )
}
