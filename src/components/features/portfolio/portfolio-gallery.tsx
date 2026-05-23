"use client"

import * as React from "react"
import { Camera, Instagram, Globe, ExternalLink } from "lucide-react"
import { Lightbox } from "@/components/features/portfolio/lightbox"
import { cn } from "@/lib/utils"

interface PortfolioGalleryProps {
  urls: string[]
}

export function PortfolioGallery({ urls }: PortfolioGalleryProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [startIndex, setStartIndex] = React.useState(0)

  // Separate image URLs from external links
  const imageUrls = urls.filter(url => url.includes("cloudinary") || url.includes("res.cloudinary.com") || /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(url))
  const externalUrls = urls.filter(url => !imageUrls.includes(url))

  const openLightbox = (index: number) => {
    setStartIndex(index)
    setIsOpen(true)
  }

  return (
    <div className="space-y-8">
      {/* Render external portfolio links if present */}
      {externalUrls.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {externalUrls.map((url, i) => {
            const isInstagram = url.includes("instagram.com")
            const displayLabel = isInstagram 
              ? "Instagram Portfolio" 
              : url.replace(/https?:\/\/(www\.)?/, "").split("/")[0] || "Website Portfolio"

            return (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-muted/40 hover:bg-accent border border-border text-foreground hover:text-white font-bold text-xs sm:text-sm transition-all duration-300 shadow-xs group hover:-translate-y-0.5 cursor-pointer"
              >
                {isInstagram ? (
                  <Instagram className="w-4 h-4 text-pink-500 group-hover:text-white transition-colors shrink-0" />
                ) : (
                  <Globe className="w-4 h-4 text-accent group-hover:text-white transition-colors shrink-0" />
                )}
                <span className="truncate max-w-[180px] sm:max-w-none">{displayLabel}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
              </a>
            )
          })}
        </div>
      )}

      {/* Grid of Images */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {imageUrls.length > 0 ? (
          imageUrls.map((url, i) => (
            <button
              key={i}
              onClick={() => openLightbox(i)}
              className="aspect-square rounded-2xl overflow-hidden shadow-xs border border-muted bg-card group transition-all duration-500 hover:shadow-xl hover:border-accent/40 hover:-translate-y-1 hover:ring-4 hover:ring-accent/10 relative cursor-pointer"
            >
              <img
                src={url}
                alt="Portfolio"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-all duration-300">
                  <Camera className="w-5 h-5" />
                </div>
              </div>
            </button>
          ))
        ) : (
          externalUrls.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-muted rounded-3xl text-muted-foreground bg-muted/10">
              <Camera className="w-10 h-10 opacity-30 text-muted-foreground" />
              <p className="text-sm font-medium">Belum ada foto portfolio yang diunggah.</p>
            </div>
          )
        )}
      </div>

      <Lightbox
        images={imageUrls}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialIndex={startIndex}
      />
    </div>
  )
}
