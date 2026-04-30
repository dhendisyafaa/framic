"use client"

import * as React from "react"
import { Camera } from "lucide-react"
import { Lightbox } from "@/components/features/portfolio/lightbox"

interface PortfolioGalleryProps {
  urls: string[]
}

export function PortfolioGallery({ urls }: PortfolioGalleryProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [startIndex, setStartIndex] = React.useState(0)

  const openLightbox = (index: number) => {
    setStartIndex(index)
    setIsOpen(true)
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {urls.length > 0 ? (
          urls.map((url, i) => (
            <button
              key={i}
              onClick={() => openLightbox(i)}
              className="aspect-square rounded-2xl overflow-hidden shadow-sm border bg-slate-50 border-slate-100 group transition-all hover:ring-4 hover:ring-primary/20"
            >
              <img
                src={url}
                alt="Portfolio"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </button>
          ))
        ) : (
          <div className="col-span-full py-12 flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-3xl text-slate-400">
            <Camera className="w-10 h-10 opacity-30" />
            <p className="text-sm">Belum ada foto portfolio yang diunggah.</p>
          </div>
        )}
      </div>

      <Lightbox
        images={urls}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialIndex={startIndex}
      />
    </>
  )
}
