"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LightboxProps {
  images: string[]
  isOpen: boolean
  onClose: () => void
  initialIndex?: number
}

export function Lightbox({ images, isOpen, onClose, initialIndex = 0 }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex)

  React.useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen, initialIndex])

  const handlePrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrevious()
    if (e.key === "ArrowRight") handleNext()
    if (e.key === "Escape") onClose()
  }, [onClose, images.length])

  React.useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="h-[98vh] w-auto max-w-[98vw] p-0 bg-blur border-none overflow-hidden flex flex-col items-center justify-center translate-x-[-50%] translate-y-[-50%] top-1/2 left-1/2 rounded-none"
      >
        <DialogTitle className="sr-only">Lightbox Image Viewer</DialogTitle>

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50 bg-gradient-to-b from-black/50 to-transparent">
          <div className="text-white/80 text-sm font-bold tracking-widest tabular-nums">
            {currentIndex + 1} / {images.length}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 rounded-full h-12 w-12"
            onClick={onClose}
          >
            <X className="w-8 h-8" />
          </Button>
        </div>

        {/* Previous Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-6 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 rounded-full z-50 h-16 w-16 hidden md:flex"
          onClick={handlePrevious}
        >
          <ChevronLeft className="w-12 h-12" />
        </Button>

        {/* Main Image Container */}
        <div className="relative w-full h-full flex items-center justify-center p-2">
          <img
            src={images[currentIndex]}
            alt={`Portfolio image ${currentIndex + 1}`}
            className="max-h-[96vh] w-auto max-w-full object-contain animate-in fade-in zoom-in-95 duration-500 shadow-2xl"
          />
        </div>

        {/* Next Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-6 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 rounded-full z-50 h-16 w-16 hidden md:flex"
          onClick={handleNext}
        >
          <ChevronRight className="w-12 h-12" />
        </Button>

        {/* Thumbnails list (bottom) */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 px-6 z-50">
          <div className="flex gap-3 p-3 bg-black/40 backdrop-blur-md rounded-[2rem] max-w-full overflow-x-auto scrollbar-hide border border-white/5">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0",
                  currentIndex === idx ? "border-primary scale-110 shadow-xl shadow-primary/30" : "border-transparent opacity-40 hover:opacity-100"
                )}
              >
                <img src={img} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
