"use client"

import { useTheme } from "next-themes"
import { Sun, Moon, Monitor, ChevronDown } from "lucide-react"
import { useEffect, useState, useRef } from "react"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Mencegah mismatch hidrasi
  useEffect(() => {
    setMounted(true)
  }, [])

  // Menutup dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  if (!mounted) {
    return <div className="w-10 h-9 bg-muted/20 animate-pulse rounded-full border border-muted/15" />
  }

  // Mendapatkan icon aktif berdasarkan state
  const getActiveIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="w-4 h-4 text-[#FF5F00]" />
      case "dark":
        return <Moon className="w-4 h-4 text-[#FF5F00]" />
      default:
        return <Monitor className="w-4 h-4 text-[#FF5F00]" />
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-muted/60 bg-white/90 dark:bg-[#20201F]/90 hover:bg-muted/20 text-foreground transition-all cursor-pointer shadow-xs font-bold text-xs h-9"
      >
        {getActiveIcon()}
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 rounded-lg border border-muted/60 bg-white dark:bg-[#20201F] p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            onClick={() => {
              setTheme("light")
              setIsOpen(false)
            }}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${theme === "light"
              ? "bg-muted/60 text-[#FF5F00]"
              : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              }`}
          >
            <Sun className="w-3.5 h-3.5" />
            Terang
          </button>
          <button
            onClick={() => {
              setTheme("dark")
              setIsOpen(false)
            }}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${theme === "dark"
              ? "bg-muted/60 text-[#FF5F00]"
              : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              }`}
          >
            <Moon className="w-3.5 h-3.5" />
            Gelap
          </button>
          <button
            onClick={() => {
              setTheme("system")
              setIsOpen(false)
            }}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${theme === "system"
              ? "bg-muted/60 text-[#FF5F00]"
              : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Sistem
          </button>
        </div>
      )}
    </div>
  )
}
