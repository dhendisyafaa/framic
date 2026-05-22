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

  // Separate image URLs from external links
  const imageUrls = urls.filter(url => url.includes("cloudinary") || url.includes("res.cloudinary.com") || /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(url))
  const externalUrls = urls.filter(url => !imageUrls.includes(url))

  const openLightbox = (index: number) => {
    setStartIndex(index)
    setIsOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Render external portfolio links if present */}
      {externalUrls.length > 0 && (
        <div className="flex flex-col gap-2">
          {externalUrls.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100/80 font-bold text-sm transition-all w-fit shadow-sm shadow-indigo-100/30"
            >
              Kunjungi Portofolio Eksternal (Instagram / Web)
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11M15 3H21M21 3V9M21 3L10 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          ))}
        </div>
      )}

      {/* Grid of Images */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {imageUrls.length > 0 ? (
          imageUrls.map((url, i) => (
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
          externalUrls.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-3xl text-slate-400">
              <Camera className="w-10 h-10 opacity-30" />
              <p className="text-sm">Belum ada foto portfolio yang diunggah.</p>
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
