// src/lib/cloudinary.ts
// Cloudinary config + upload helpers
// Dipakai untuk: foto hasil order, portofolio PG, cover image event, MoU PDF
// Docs: https://cloudinary.com/documentation/node_integration

import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

// ---------------------------------------------------------------------------
// Upload Folders — organisasi file di Cloudinary
// ---------------------------------------------------------------------------
export const CLOUDINARY_FOLDERS = {
  /** Foto hasil order per order ID */
  ORDER_PHOTOS: "framic/order-photos",
  /** Foto portofolio PG */
  PORTFOLIO: "framic/portfolio",
  /** Cover image event mitra */
  EVENT_COVERS: "framic/event-covers",
  /** PDF MoU (kontrak) */
  MOU_DOCUMENTS: "framic/mou-documents",
  /** Dokumen legalitas mitra */
  MITRA_DOCUMENTS: "framic/mitra-documents",
} as const

// ---------------------------------------------------------------------------
// Helper: Upload buffer ke Cloudinary
// ---------------------------------------------------------------------------

export interface CloudinaryUploadResult {
  publicId: string
  secureUrl: string
  format: string
  bytes: number
  width?: number
  height?: number
}

/**
 * Upload file buffer ke Cloudinary.
 * Gunakan di server-side (API routes) saja — api_secret tidak boleh ke client.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  options?: {
    resourceType?: "image" | "raw" | "video" | "auto"
    publicId?: string
    tags?: string[]
  },
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: options?.resourceType ?? "image",
        public_id: options?.publicId,
        tags: options?.tags,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"))
          return
        }
        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          format: result.format,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
        })
      },
    )
    uploadStream.end(buffer)
  })
}

/**
 * Hapus file dari Cloudinary berdasarkan publicId.
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "raw" = "image",
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
}

export { cloudinary }
