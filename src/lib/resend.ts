// src/lib/resend.ts
// Resend email client untuk notifikasi transaksional
// Dipakai untuk: konfirmasi order, DP berhasil, pelunasan, verifikasi, dispute
// Docs: https://resend.com/docs

import { Resend } from "resend"

const resendApiKey = process.env.RESEND_API_KEY

if (!resendApiKey) {
  throw new Error(
    "Missing Resend env variable: RESEND_API_KEY harus diisi di .env.local",
  )
}

export const resend = new Resend(resendApiKey)

// ---------------------------------------------------------------------------
// Email config
// ---------------------------------------------------------------------------

/** Alamat pengirim default untuk semua email Framic */
export const EMAIL_FROM = "Framic <noreply@framic.id>"

/** Subject prefix untuk konsistensi */
export const EMAIL_SUBJECT_PREFIX = "[Framic]"

// ---------------------------------------------------------------------------
// Helper: kirim email
// ---------------------------------------------------------------------------

export interface SendEmailParams {
  to: string | string[]
  subject: string
  /** React Email component atau HTML string */
  react?: React.ReactElement
  html?: string
  text?: string
}

/**
 * Kirim email via Resend.
 * Gunakan React Email components untuk template yang sudah dibuat.
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: `${EMAIL_SUBJECT_PREFIX} ${params.subject}`,
    react: params.react,
    html: params.html,
    text: params.text,
  })
}

// ---------------------------------------------------------------------------
// Type import untuk React Email
// ---------------------------------------------------------------------------
import type React from "react"
